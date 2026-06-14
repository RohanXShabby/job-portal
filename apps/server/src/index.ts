import express from "express";
import cors from "cors";
import http from "http";
import { env } from "@job-portal/env/server";
import { auth } from "@job-portal/auth";
import { toNodeHandler } from "better-auth/node";
import app from "./app.js";
import { startMetricsServer } from "./lib/metrics.js";

const authApp = express();

authApp.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

authApp.all("/api/auth*", toNodeHandler(auth));

const server = http.createServer(async (req, res) => {
  if (!req.url || req.url.startsWith("/api/auth")) {
    authApp(req, res);
    return;
  }

  try {
    const request = new Request(`http://localhost${req.url}`, {
      method: req.method,
      headers: req.headers as any,
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
