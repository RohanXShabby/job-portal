import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_API_KEY: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    // Allow comma-separated origins (e.g. "http://localhost:3001,http://localhost:3000")
    // We validate as string here and parse where it's used because multiple origins
    // are represented as a comma-separated string in env variables.
    CORS_ORIGIN: z.string().default("http://localhost:3001"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(5000),
    REDIS_HOST: z.string().default("localhost"),
    REDIS_PORT: z.coerce.number().default(6379),
    REDIS_PASSWORD: z.string().optional(),
    STRIPE_SECRET_KEY: z.string().min(1).optional(),
    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
    RESEND_API_KEY: z.string().min(1).optional(),
    RESEND_FROM_EMAIL: z.string().email().default("no-reply@example.com"),
    ELASTICSEARCH_NODE: z.string().url().optional(),
    ELASTICSEARCH_API_KEY: z.string().optional(),
    MEILISEARCH_HOST: z.string().url().default("http://localhost:7700"),
    MEILISEARCH_API_KEY: z.string().optional(),
    AWS_REGION: z.string().optional(),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    S3_BUCKET_NAME: z.string().optional(),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    METRICS_PORT: z.coerce.number().default(9090),
    METRICS_PATH: z.string().default("/metrics"),
    METRICS_PREFIX: z.string().default("job_portal_"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
