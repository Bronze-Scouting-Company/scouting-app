import { Hono } from "hono";
import { auth } from "./api/auth";
import { withUser } from "./lib/rbac";

const app = new Hono();

app.get("/health", (c) => c.text("OK"));
app.route("/api", auth);

app.get("/api/admin/ping", withUser(["ADMIN"]), (c) => c.json({ pong: true }));

export default app;
