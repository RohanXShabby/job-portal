import client, { Counter, Histogram, Gauge, Registry, collectDefaultMetrics } from "prom-client";

const rawMetricsPrefix = process.env.METRICS_PREFIX || "job-portal_";
const metricsPrefixSanitized = rawMetricsPrefix.replace(/[^a-zA-Z0-9_:]/g, "_");
const metricsPrefix = metricsPrefixSanitized.length ? metricsPrefixSanitized : "job-portal_";
const metricsPath = process.env.METRICS_PATH || "/metrics";
const metricsPort = parseInt(process.env.METRICS_PORT || "9090", 10);

const registry = new Registry();
registry.clear();

registry.setDefaultLabels({
  app: "job-portal",
  environment: process.env.NODE_ENV || "development",
});

collectDefaultMetrics({
  register: registry,
  prefix: metricsPrefix,
});

export const httpRequestsTotal = new Counter({
  name: `${metricsPrefix}http_requests_total`,
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [registry],
});

export const httpRequestDuration = new Histogram({
  name: `${metricsPrefix}http_request_duration_seconds`,
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
});

export const activeConnections = new Gauge({
  name: `${metricsPrefix}active_connections`,
  help: "Number of active connections",
  registers: [registry],
});

export const dbQueryDuration = new Histogram({
  name: `${metricsPrefix}db_query_duration_seconds`,
  help: "Database query duration in seconds",
  labelNames: ["operation", "table"],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [registry],
});

export const errorsTotal = new Counter({
  name: `${metricsPrefix}errors_total`,
  help: "Total number of errors",
  labelNames: ["type", "operation"],
  registers: [registry],
});

let metricsServer: import("http").Server | null = null;

export async function startMetricsServer(): Promise<void> {
  const http = await import("http");

  metricsServer = http.createServer(async (req, res) => {
    if (req.url === metricsPath) {
      try {
        res.setHeader("Content-Type", registry.contentType);
        res.end(await registry.metrics());
      } catch (error) {
        res.statusCode = 500;
        res.end("Error collecting metrics");
      }
    } else if (req.url === "/health") {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ status: "healthy" }));
    } else {
      res.statusCode = 404;
      res.end("Not found");
    }
  });

  metricsServer.listen(metricsPort, () => {
    console.log(`[Metrics] Server running on port ${metricsPort}`);
    console.log(`[Metrics] Prometheus scrape endpoint: http://localhost:${metricsPort}${metricsPath}`);
  });
}

export async function stopMetricsServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      if (!metricsServer) {
        resolve();
        return;
      }
      metricsServer.close((err) => {
        if (err) {
          console.error("[Metrics] Error stopping server:", err);
          reject(err);
        } else {
          console.log("[Metrics] Server stopped");
          resolve();
        }
      });
    } catch (error) {
      console.error("[Metrics] Error stopping server:", error);
      reject(error);
    }
  });
  // ✅ Closing brace is HERE — nothing nested inside above
}

// ✅ These are now at module top level, not inside stopMetricsServer
export async function getMetrics(): Promise<string> {
  return registry.metrics();
}

export function getMetricsContentType(): string {
  return registry.contentType;
}

export { client, registry, Counter, Histogram, Gauge };