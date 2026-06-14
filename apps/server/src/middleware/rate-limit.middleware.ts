import type { MiddlewareHandler } from "hono";
import { rateLimit } from "@job-portal/redis";
import { sendError } from "../lib/response.js";

/**
 * Rate Limiter Middleware
 * Uses sliding window with Redis to prevent abuse
 */
export function rateLimiter(
  limit: number,
  windowSeconds: number
): MiddlewareHandler {
  return async (c, next) => {
    // Get client identifier (IP Address or logged-in user ID)
    const clientIp = c.req.header("x-forwarded-for") || "anonymous_ip";
    const authHeader = c.req.header("Authorization");
    const rateLimitKey = authHeader ? `user:${authHeader.substring(0, 16)}` : `ip:${clientIp}`;

    try {
      const { allowed, remaining, reset } = await rateLimit(rateLimitKey, limit, windowSeconds);

      // Set standard headers
      c.header("X-RateLimit-Limit", limit.toString());
      c.header("X-RateLimit-Remaining", remaining.toString());
      c.header("X-RateLimit-Reset", Math.ceil(reset / 1000).toString());

      if (!allowed) {
        c.header("Retry-After", windowSeconds.toString());
        return sendError(c, "TOO_MANY_REQUESTS", "Rate limit exceeded. Try again later.", 429);
      }

      await next();
    } catch (error) {
      // Log error but pass request so caching failure doesn't block the website
      console.error("[Rate Limit Middleware Error]", error);
      await next();
    }
  };
}
