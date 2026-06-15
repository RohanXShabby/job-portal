import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "@job-portal/env/server";
import usersRouter from "./modules/users/routes.js";
import companiesRouter from "./modules/companies/routes.js";
import jobsRouter from "./modules/jobs/routes.js";
import applicationsRouter from "./modules/applications/routes.js";
import paymentsRouter from "./modules/payments/routes.js";
import { getMetrics, getMetricsContentType } from "./lib/metrics.js";
import { requestQueueMiddleware } from "./middleware/request-queue.middleware.js";
import { rateLimiter } from "./middleware/rate-limit.middleware.js";

const app = new Hono();
// Support multiple comma-separated origins from env (e.g. "http://localhost:3001,http://localhost:3000")
const allowedOrigins = (env.CORS_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
const devAllowAll = env.NODE_ENV !== "production";
const corsOrigin = devAllowAll ? true : (allowedOrigins.length === 0 ? false : (allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins));

app.use(
    "*",
    cors({
        origin: corsOrigin,
        allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    }),
);

// Apply rate limiting to all routes (100 requests per minute)
app.use("*", rateLimiter(100, 60));

// Apply request queue middleware for high traffic handling
// This will queue requests when system is under load instead of rejecting them
app.use("*", requestQueueMiddleware({
    maxConcurrent: 100,
    maxQueueSize: 10000,
    timeoutMs: 30000,
}));

app.onError((err, c) => {
    console.error("[API Error]", err);
    return c.json(
        {
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Internal server error",
            },
        },
        500,
    );
});

app.get("/", () => new Response("Job Portal API", { status: 200 }));

app.get("/health", () =>
    new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    }),
);

app.get("/metrics", async () =>
    new Response(await getMetrics(), {
        status: 200,
        headers: { "Content-Type": getMetricsContentType() },
    }),
);

app.get("/queue-stats", async (c) => {
    const { getQueueStats } = await import("./middleware/request-queue.middleware.js");
    const stats = await getQueueStats();
    return c.json(stats);
});

app.route("/api/users", usersRouter);
app.route("/api/companies", companiesRouter);
app.route("/api/jobs", jobsRouter);
app.route("/api/applications", applicationsRouter);
app.route("/api/payments", paymentsRouter);

export default app;
