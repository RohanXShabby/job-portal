import Redis from "ioredis";

const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = Number(process.env.REDIS_PORT) || 6379;
const redisPassword = process.env.REDIS_PASSWORD || undefined;

let isRedisConnected = false;

export let redis: any;

// Try to connect to Redis, but don't fail if unavailable (for development)
try {
  redis = new Redis({
    host: redisHost,
    port: redisPort,
    password: redisPassword,
    maxRetriesPerRequest: null,
    retryStrategy: (times) => {
      if (times > 3) {
        console.warn(
          `❌ Redis connection failed after ${times} attempts. Cache operations will be disabled.`,
        );
        return null;
      }
      return Math.min(times * 50, 2000);
    },
    connectTimeout: 5000,
  });

  redis.on("connect", () => {
    isRedisConnected = true;
    console.log("✓ Redis connected");
  });

  redis.on("error", (err: any) => {
    if (err.code === "ECONNREFUSED" && !isRedisConnected) {
      console.warn(
        "⚠ Redis is not available. Running in cache-less mode. For production, ensure Redis is running on",
        `${redisHost}:${redisPort}`,
      );
    }
  });
} catch (err) {
  console.warn("⚠ Redis initialization failed:", err);
  // Create a mock Redis client for development
  redis = {
    get: async () => null,
    set: async () => "OK",
    del: async () => 0,
    scan: async () => ["0", []],
    eval: async () => 0,
  };
}

/**
 * Cache-Aside Helper
 * Fetches from cache, if missing executes fallback query, caches result, and returns.
 */
export async function getOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds = 3600
): Promise<T> {
  if (!isRedisConnected) {
    return fetchFn();
  }

  const cached = await redis.get(key);
  if (cached !== null) {
    try {
      return JSON.parse(cached) as T;
    } catch {
      // If parsing fails, fall back to executing fetchFn
    }
  }

  const result = await fetchFn();
  if (result !== undefined && result !== null) {
    await redis.set(key, JSON.stringify(result), "EX", ttlSeconds);
  }
  return result;
}

/**
 * Delete a cache key
 */
export async function invalidate(key: string): Promise<void> {
  if (!isRedisConnected) {
    return;
  }
  await redis.del(key);
}

/**
 * Invalidate all keys matching a pattern (e.g. "jobs:*")
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  if (!isRedisConnected) {
    return;
  }

  let cursor = "0";
  do {
    const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
    cursor = nextCursor;
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } while (cursor !== "0");
}

/**
 * Acquire a distributed lock using Redis (Redlock pattern)
 * Returns a lock token if successful, or null if already locked
 */
export async function acquireLock(
  lockKey: string,
  ttlMs = 5000
): Promise<string | null> {
  if (!isRedisConnected) {
    return Math.random().toString(36).substring(2, 15);
  }

  const token = Math.random().toString(36).substring(2, 15);
  // NX: Set only if key does not exist
  // PX: Expiry in milliseconds
  const acquired = await redis.set(`lock:${lockKey}`, token, "NX", "PX", ttlMs);
  return acquired === "OK" ? token : null;
}

/**
 * Release a distributed lock atomically using Lua script
 */
export async function releaseLock(lockKey: string, token: string): Promise<boolean> {
  if (!isRedisConnected) {
    return true;
  }

  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  const result = await redis.eval(script, 1, `lock:${lockKey}`, token);
  return result === 1;
}

/**
 * Sliding Window Rate Limiter
 * Tracks requests using sorted sets (ZSet)
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  if (!isRedisConnected) {
    return { allowed: true, remaining: limit, reset: Date.now() + windowSeconds * 1000 };
  }

  const now = Date.now();
  const clearBefore = now - windowSeconds * 1000;
  const rateLimitKey = `ratelimit:${key}`;

  const multi = redis.multi();
  // Remove logs older than window
  multi.zremrangebyscore(rateLimitKey, 0, clearBefore);
  // Count items inside window
  multi.zcard(rateLimitKey);
  // Add current request
  multi.zadd(rateLimitKey, now, now.toString());
  // Set TTL on set
  multi.expire(rateLimitKey, windowSeconds);

  const results = await multi.exec();
  if (!results) {
    return { allowed: true, remaining: limit, reset: now + windowSeconds * 1000 };
  }

  const count = results[1][1] as number;
  const allowed = count < limit;

  if (!allowed) {
    // If limit exceeded, remove the added member immediately to avoid inflating the window
    await redis.zrem(rateLimitKey, now.toString());
  }

  const remaining = Math.max(0, limit - count);
  const reset = now + windowSeconds * 1000;

  return { allowed, remaining, reset };
}

