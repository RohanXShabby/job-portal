import type { MiddlewareHandler } from "hono";
import { Queue, Worker, type Job } from "bullmq";
import { connection } from "../lib/queue.js";
import { sendError } from "../lib/response.js";

// Request queue for handling high traffic
export const requestQueue = new Queue("http-requests", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: {
      count: 1000,
      age: 3600,
    },
    removeOnFail: {
      count: 5000,
    },
  },
});

// Request job data interface
export interface RequestJobData {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  userId?: string;
  priority: number;
}

// Response job data interface
export interface ResponseJobData {
  requestId: string;
  status: number;
  headers: Record<string, string>;
  body: any;
}

// Response queue for sending responses back
export const responseQueue = new Queue("http-responses", { connection });

// Queue configuration
interface QueueConfig {
  maxConcurrent?: number;
  maxQueueSize?: number;
  timeoutMs?: number;
  priorityThreshold?: number;
}

const defaultConfig: Required<QueueConfig> = {
  maxConcurrent: 100,
  maxQueueSize: 10000,
  timeoutMs: 30000,
  priorityThreshold: 50,
};

// Active request counter for load balancing
let activeRequests = 0;
const maxActiveRequests = 500;

/**
 * Request Queue Middleware
 * Queues incoming requests when system is under high load
 * Processes requests asynchronously to handle traffic spikes
 */
export function requestQueueMiddleware(config: QueueConfig = {}): MiddlewareHandler {
  const finalConfig: Required<QueueConfig> = { ...defaultConfig, ...config };

  return async (c, next) => {
    const startTime = Date.now();
    const userId = c.get("user")?.id;

    // Check if system is under high load
    const isHighLoad = activeRequests >= finalConfig.maxConcurrent;

    // Get queue size
    const queueSize = await requestQueue.getJobCountByTypes("waiting", "delayed");

    // If queue is full, reject with 503
    if (queueSize >= finalConfig.maxQueueSize) {
      return sendError(
        c,
        "SERVICE_UNAVAILABLE",
        "Server is overloaded. Please try again later.",
        503
      );
    }

    // If under high load, queue the request
    if (isHighLoad) {
      try {
        const requestId = crypto.randomUUID();

        // Extract request data
        const requestData: RequestJobData = {
          method: c.req.method,
          url: c.req.url,
          headers: Object.fromEntries(c.req.header() as any),
          body: c.req.method !== "GET" && c.req.method !== "HEAD"
            ? await c.req.json().catch(() => undefined)
            : undefined,
          userId,
          priority: calculatePriority(c.req.url, userId),
        };

        // Add to queue
        await requestQueue.add(
          requestId,
          requestData,
          {
            priority: requestData.priority,
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 2000,
            },
          }
        );

        // Return 202 Accepted with request ID
        return c.json(
          {
            success: true,
            message: "Request queued for processing",
            requestId,
            queuePosition: queueSize + 1,
          },
          202
        );
      } catch (error) {
        console.error("[Request Queue Error]", error);
        // If queue fails, try to process directly
        return next();
      }
    }

    // Process directly if not under high load
    activeRequests++;
    try {
      await next();
    } finally {
      activeRequests--;
      const duration = Date.now() - startTime;

      // Log slow requests
      if (duration > 1000) {
        console.log(`[Slow Request] ${c.req.method} ${c.req.url} - ${duration}ms`);
      }
    }
  };
}

/**
 * Calculate request priority based on URL and user role
 * Lower number = higher priority
 */
function calculatePriority(url: string, _userId?: string): number {
  // High priority for authentication and critical operations
  if (url.includes("/auth/") || url.includes("/login") || url.includes("/signup")) {
    return 1;
  }

  // High priority for payment operations
  if (url.includes("/payments/")) {
    return 2;
  }

  // Medium priority for job applications
  if (url.includes("/applications/")) {
    return 5;
  }

  // Lower priority for read operations
  if (url.includes("/jobs/") && !url.includes("/applications/")) {
    return 10;
  }

  // Default priority
  return 5;
}

/**
 * Start request queue worker
 * Processes queued requests and sends responses
 */
export function startRequestWorker() {
  const worker = new Worker(
    "http-requests",
    async (job: Job<RequestJobData>) => {
      const { method, url, headers, body, } = job.data;

      try {
        // Reconstruct the request
        const request = new Request(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });

        // Process the request (this would need to be integrated with your app)
        // For now, this is a placeholder
        const response = await processQueuedRequest(request);

        // Send response via response queue
        await responseQueue.add(
          job.id!,
          {
            requestId: job.id!,
            status: response.status,
            headers: Object.fromEntries(response.headers),
            body: await response.json().catch(() => null),
          }
        );

        return { success: true, requestId: job.id };
      } catch (error) {
        console.error("[Request Worker Error]", error);
        throw error;
      }
    },
    {
      connection,
      concurrency: 50,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[Request Completed] ${job.id}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Request Failed] ${job?.id}`, err);
  });

  return worker;
}

/**
 * Process a queued request
 * This is a placeholder - integrate with your actual app logic
 */
async function processQueuedRequest(_request: Request): Promise<Response> {
  // This would need to be integrated with your Hono app
  // For now, return a placeholder response
  return new Response(
    JSON.stringify({ success: true, message: "Request processed" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const waiting = await requestQueue.getJobCountByTypes("waiting");
  const active = await requestQueue.getJobCountByTypes("active");
  const completed = await requestQueue.getJobCountByTypes("completed");
  const failed = await requestQueue.getJobCountByTypes("failed");

  return {
    waiting,
    active,
    completed,
    failed,
    total: waiting + active + completed + failed,
    activeRequests,
    maxActiveRequests,
  };
}
