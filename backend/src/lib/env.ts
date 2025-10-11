import { z } from "zod";

const Env = z.object({
	APP_ORIGIN: z.url(),
	API_ORIGIN: z.url(),

	COOKIE_NAME: z.string().default("bsc_session"),
	COOKIE_DOMAIN: z.string(),
	COOKIE_SECURE: z.enum(["true", "false"]).default("false"),
	COOKIE_SAMESITE: z.enum(["Lax", "Strict", "None"]).default("Lax"),
	SESSION_TTL_SECONDS: z.string().transform(Number).default(2592000),

	DATABASE_URL: z.url(),
	REDIS_URL: z.url(),

	OAUTH_GOOGLE_CLIENT_ID: z.string(),
	OAUTH_GOOGLE_CLIENT_SECRET: z.string(),
	OAUTH_DISCORD_CLIENT_ID: z.string(),
	OAUTH_DISCORD_CLIENT_SECRET: z.string(),
});

export const env = Env.parse(process.env);
