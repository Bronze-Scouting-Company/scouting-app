import { serialize } from "cookie";
import { env } from "./env";

export function sessionCookie(token: string, expires: Date) {
	return serialize(env.COOKIE_NAME, token, {
		httpOnly: true,
		secure: env.COOKIE_SECURE,
		sameSite: env.COOKIE_SAMESITE as "lax" | "strict" | "none",
		expires,
		path: "/",
		domain: env.COOKIE_DOMAIN,
	});
}

export function clearSessionCookie() {
	return serialize(env.COOKIE_NAME, "", {
		httpOnly: true,
		secure: env.COOKIE_SECURE,
		sameSite: env.COOKIE_SAMESITE as "lax" | "strict" | "none",
		expires: new Date(0),
		path: "/",
		domain: env.COOKIE_DOMAIN,
	});
}
