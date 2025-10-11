/**
 * Module d'authentification basé sur Hono, better-auth et Prisma.
 *
 * - Gère l’OAuth (Google, Discord) via better-auth.
 * - Crée des sessions applicatives et les propage via cookie HTTP.
 * - Expose la déconnexion et un endpoint `/me` pour l’utilisateur courant.
 *
 * @module auth
 */
import { betterAuth } from "better-auth";
import { Hono } from "hono";
import { clearSessionCookie, sessionCookie } from "../lib/cookies";
import { prisma } from "../lib/db";
import { env } from "../lib/env";
import { createSession, revokeSession } from "../lib/session";

/**
 * @typedef {Object} AppUser
 * @property {string} id            Identifiant utilisateur (cuid/uuid).
 * @property {string} email         Email unique de l’utilisateur.
 * @property {string|null} username Pseudonyme (peut être null).
 * @property {string|null} avatarUrl URL d’avatar (peut être null).
 * @property {string[]} roles       Liste des rôles (ex. ["COMMUNITY"]).
 */

/**
 * @typedef {Object} SessionRecord
 * @property {string} token             Jeton de session (clé primaire).
 * @property {string} userId            Référence utilisateur.
 * @property {Date}   expiresAt         Date d’expiration.
 * @property {Date=}  revokedAt         Date de révocation (si révoquée).
 * @property {string=} userAgent        User-Agent à la création.
 * @property {string=} ip               IP à la création.
 */

/**
 * Variables d’environnement attendues.
 *
 * @env {string} API_ORIGIN                    Origine HTTP de l’API (ex. https://api.example.com)
 * @env {string} APP_ORIGIN                    Origine HTTP du front (ex. https://app.example.com)
 * @env {string} OAUTH_GOOGLE_CLIENT_ID        Client ID Google OAuth
 * @env {string} OAUTH_GOOGLE_CLIENT_SECRET    Client Secret Google OAuth
 * @env {string} OAUTH_DISCORD_CLIENT_ID       Client ID Discord OAuth
 * @env {string} OAUTH_DISCORD_CLIENT_SECRET   Client Secret Discord OAuth
 * @env {string=} COOKIE_NAME                  Nom du cookie de session (défaut: "session")
 */

/**
 * Routeur Hono exposant les endpoints d’authentification.
 * @type {Hono}
 */
export const auth = new Hono();

/**
 * Instance better-auth configurée avec Prisma et les différents providers.
 *
 * @see https://www.npmjs.com/package/better-auth
 */
const ba = betterAuth({
	database: prisma,
	baseURL: env.API_ORIGIN,
	socialProviders: {
		google: {
			clientId: env.OAUTH_GOOGLE_CLIENT_ID,
			clientSecret: env.OAUTH_GOOGLE_CLIENT_SECRET,
		},
		discord: {
			clientId: env.OAUTH_DISCORD_CLIENT_ID,
			clientSecret: env.OAUTH_DISCORD_CLIENT_SECRET,
		},
	},
});

/**
 * Proxy vers les handlers better-auth.
 *
 * @route ALL /auth/*
 * @async
 * @param {import("hono").Context} c Contexte Hono.
 * @returns {Promise<Response>} Réponse du handler better-auth.
 * @throws 500 JSON `{ error: "Authentication failed" }` en cas d’erreur inattendue.
 *
 * @example
 * // Exemples d’URL gérées par better-auth :
 * //   GET /auth/signin/google
 * //   GET /auth/callback/google?code=...
 */
auth.all("/auth/*", async (c) => {
	try {
		const request = c.req.raw;

		return await ba.handler(request);
	} catch (error) {
		console.error("Auth handler error:", error);
		return c.json({ error: "Authentication failed" }, 500);
	}
});

/**
 * Callback OAuth personnalisé : finalise l’authentification,
 * effectue l’upsert utilisateur, crée la session et dépose le cookie.
 *
 * @route GET /auth/callback/:provider/custom
 * @async
 * @param {import("hono").Context} c Contexte Hono.
 * @returns {Promise<Response>} Redirection vers APP_ORIGIN (succès) ou /login?error=...
 *
 * @remarks
 * - Paramètres de requête attendus : `code` (obligatoire), `state` (optionnel).
 * - `provider` ∈ {"google","discord"}.
 * - En cas de succès, set-cookie de session puis redirection vers APP_ORIGIN.
 *
 * @errors
 * - `?error=no_code`          si `code` est manquant
 * - `?error=auth_failed`      si better-auth renvoie une réponse non-OK
 * - `?error=invalid_user`     si l’email utilisateur est absent
 * - `?error=callback_failed`  si une exception est levée
 */
auth.get("/auth/callback/:provider/custom", async (c) => {
	try {
		const provider = c.req.param("provider");

		const url = new URL(c.req.url);
		const code = url.searchParams.get("code") || "";
		const state = url.searchParams.get("state") || "";

		if (!code) {
			return c.redirect(`${env.APP_ORIGIN}/login?error=no_code`);
		}

		const baRequest = new Request(
			`${env.API_ORIGIN}/api/auth/callback/${provider}?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
			{
				method: "GET",
				headers: c.req.raw.headers,
			},
		);

		const response = await ba.handler(baRequest);

		if (!response.ok) {
			return c.redirect(`${env.APP_ORIGIN}/login?error=auth_failed`);
		}

		const data = await response.json();

		if (!data.user || !data.user.email) {
			return c.redirect(`${env.APP_ORIGIN}/login?error=invalid_user`);
		}

		const { user: oauthUser } = data;

		const user = await prisma.user.upsert({
			where: { email: oauthUser.email },
			update: {
				username: oauthUser.name || null,
				avatarUrl: oauthUser.image || null,
			},
			create: {
				email: oauthUser.email,
				username: oauthUser.name || null,
				avatarUrl: oauthUser.image || null,
				roles: { create: [{ role: "COMMUNITY" }] },
			},
			include: { roles: true },
		});

		const { token, expiresAt } = await createSession(
			user.id,
			c.req.header("user-agent") || undefined,
			c.req.header("x-forwarded-for") || undefined,
		);

		c.header("Set-Cookie", sessionCookie(token, expiresAt));
		return c.redirect(env.APP_ORIGIN);
	} catch (error) {
		console.error("Callback error:", error);
		return c.redirect(`${env.APP_ORIGIN}/login?error=callback_failed`);
	}
});

auth.post("/auth/logout", async (c) => {
	try {
		const cookie = c.req.header("cookie") || "";
		const cookieName = env.COOKIE_NAME || "session";
		const namePrefix = cookieName + "=";
		const token = cookie
			.split(";")
			.map((s) => s.trim())
			.find((s) => s.startsWith(namePrefix))
			?.slice(namePrefix.length);

		if (token) await revokeSession(token);
		c.header("Set-Cookie", clearSessionCookie());
		return c.json({ ok: true });
	} catch (error) {
		console.error("Logout error:", error);
		return c.json({ error: "Logout failed" }, 500);
	}
});

/**
 * Récupération de l’utilisateur courant à partir du cookie de session.
 *
 * @route GET /me
 * @async
 * @param {import("hono").Context} c Contexte Hono.
 * @returns {Promise<Response>} JSON `{ user: AppUser|null }`
 *
 * @remarks
 * - Retourne `user: null` si pas de cookie, session expirée/révoquée ou introuvable.
 * - En cas d’erreur interne, on journalise et on renvoie tout de même `{ user: null }`.
 *
 * @example
 * // Réponse typique :
 * // {
 * //   "user": {
 * //     "id": "clx...",
 * //     "email": "jane@ex.com",
 * //     "username": "Jane",
 * //     "avatarUrl": "https://...",
 * //     "roles": ["COMMUNITY"]
 * //   }
 * // }
 */
auth.get("/me", async (c) => {
	try {
		const cookie = c.req.header("cookie") || "";
		const cookieName = env.COOKIE_NAME || "session";
		const namePrefix = cookieName + "=";
		const token = cookie
			.split(";")
			.map((s) => s.trim())
			.find((s) => s.startsWith(namePrefix))
			?.slice(namePrefix.length);

		if (!token) return c.json({ user: null });

		const session = await prisma.session.findUnique({
			where: { token },
			include: { user: { include: { roles: true } } },
		});

		if (!session || session.revokedAt || session.expiresAt < new Date()) {
			return c.json({ user: null });
		}

		const { user } = session;
		return c.json({
			user: {
				id: user.id,
				email: user.email,
				username: user.username,
				avatarUrl: user.avatarUrl,
				roles: user.roles.map((r) => r.role),
			},
		});
	} catch (error) {
		console.error("Me endpoint error:", error);
		return c.json({ user: null });
	}
});
