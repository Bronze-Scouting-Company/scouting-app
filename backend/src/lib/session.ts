import { randomUUID } from "node:crypto";
import { addSeconds } from "date-fns";
import { prisma } from "./db";
import { env } from "./env";

export async function createSession(userId: string, ua?: string, ip?: string) {
	const token = randomUUID() + "." + randomUUID();
	const expiresAt = addSeconds(new Date(), env.SESSION_TTL_SECONDS);
	const s = await prisma.session.create({
		data: { userId, token, userAgent: ua, ip, expiresAt },
	});
	return { token: s.token, expiresAt };
}

export async function revokeSession(token: string) {
	await prisma.session.update({
		where: { token },
		data: { revokedAt: new Date() },
	});
}
