import { Context, Next } from "hono";
import { prisma } from "./db";
import { env } from "./env";

async function currentUser(c: Context) {
	const cookie = c.req.header("cookie") || "";
	const name = env.COOKIE_NAME + "=";
	const token = cookie
		.split(";")
		.map((s) => s.trim())
		.find((s) => s.startsWith(name))
		?.slice(name.length);
	if (!token) return null;
	const session = await prisma.session.findUnique({
		where: { token },
		include: { user: { include: { roles: true } } },
	});
	if (!session || session.revokedAt || session.expiresAt < new Date())
		return null;
	return session.user;
}

export function withUser(
	required?: ("COMMUNITY" | "EXPERT" | "MODERATOR" | "ADMIN")[],
) {
	return async (c: Context, next: Next) => {
		const user = await currentUser(c);
		if (!user) return c.json({ error: "unauthorized" }, 401);
		if (required?.length) {
			const roles = new Set(user.roles.map((r) => r.role));
			const ok = required.some((r) => roles.has(r));
			if (!ok) return c.json({ error: "forbidden" }, 403);
		}
		c.set("user", user);
		return next();
	};
}
