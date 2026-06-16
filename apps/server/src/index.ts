import express from "express";
import cors, { type CorsOptions } from "cors";
import http from "http";
import { env } from "@job-portal/env/server";
import { auth } from "@job-portal/auth";
import { toNodeHandler } from "better-auth/node";
import app from "./app.js";
import { startMetricsServer } from "./lib/metrics.js";

const authApp = express();
// Support multiple comma-separated origins from env (e.g. "http://localhost:3001,http://localhost:3000")
// In development allow all origins to simplify local testing.
const allowedOrigins = (env.CORS_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
const devAllowAll = env.NODE_ENV !== "production";

// Debug incoming origin for auth routes (helps diagnose preflight issues)
authApp.use((req, _res, next) => {
  if (req.url && req.url.startsWith("/api/auth")) {
    // eslint-disable-next-line no-console
    console.debug("[CORS DEBUG] Origin:", req.headers.origin, "Method:", req.method, "URL:", req.url);
  }
  next();
});

authApp.use(
  cors({
    origin: ((origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      // Allow non-browser requests (curl, server-to-server) when origin is undefined
      if (!origin) return callback(null, true);
      if (devAllowAll) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    }) satisfies CorsOptions["origin"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

authApp.all("/api/auth/{*path}", toNodeHandler(auth));

const server = http.createServer(async (req, res) => {
  if (!req.url || req.url.startsWith("/api/auth")) {
    authApp(req, res);
    return;
  }

  try {
    const request = new Request(`http://localhost${req.url}`, {
      method: req.method,
      headers: req.headers as Record<string, string>,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : req,
    });

    const response = await app.fetch(request);
    response.headers.forEach((value, name) => {
      res.setHeader(name, value);
    });
    res.statusCode = response.status;
    const body = await response.arrayBuffer();
    res.end(Buffer.from(body));
  } catch (error) {
    console.error("[Server Error]", error);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
});

server.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT}`);
});

startMetricsServer().catch((error) => {
  console.error("Failed to start metrics server:", error);
});
