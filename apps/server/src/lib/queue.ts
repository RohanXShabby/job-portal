import { Queue, type ConnectionOptions } from "bullmq";

export const connection: ConnectionOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
};

// Queue definitions
export const emailQueue = new Queue("email", { connection });
export const notificationQueue = new Queue("notification", { connection });
export const resumeQueue = new Queue("resume-processing", { connection });
export const searchIndexQueue = new Queue("search-indexing", { connection });
export const analyticsQueue = new Queue("analytics", { connection });
export const deadLetterQueue = new Queue("dead-letter", { connection });

// Define job data types
export interface EmailJobData {
  to: string;
  subject: string;
  body: string;
  templateId?: string;
}

export interface NotificationJobData {
  userId: string;
  type: "push" | "in-app" | "email";
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface ResumeJobData {
  userId: string;
  resumeId: string;
  s3Key: string;
}

export interface SearchIndexJobData {
  action: "index" | "update" | "delete";
  jobId: string;
  jobData?: any; // The payload to index
}

export interface AnalyticsJobData {
  event: string;
  userId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface DLQJobData {
  queueName: string;
  jobId: string;
  jobData: any;
  failedReason: string;
  failedAt: string;
}

// Queue Helper Functions
const defaultRetryOptions = {
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 2000, // Wait 2s, then 4s, then 8s
  },
};

export async function queueEmail(data: EmailJobData, options?: { delay?: number; priority?: number }) {
  return emailQueue.add("send-email", data, {
    ...defaultRetryOptions,
    delay: options?.delay,
    priority: options?.priority,
  });
}

export async function queueNotification(data: NotificationJobData, options?: { delay?: number }) {
  return notificationQueue.add("send-notification", data, {
    ...defaultRetryOptions,
    delay: options?.delay,
  });
}

export async function queueResumeProcessing(data: ResumeJobData) {
  return resumeQueue.add("process-resume", data, {
    ...defaultRetryOptions,
  });
}

export async function queueSearchIndex(data: SearchIndexJobData) {
  return searchIndexQueue.add("sync-search", data, {
    ...defaultRetryOptions,
  });
}

export async function queueAnalytics(data: AnalyticsJobData) {
  return analyticsQueue.add("track-analytics", data, {
    attempts: 2, // Analytics can have lower retry threshold
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  });
}

export async function queueToDLQ(data: DLQJobData) {
  return deadLetterQueue.add("failed-job-log", data);
}

export async function closeQueues() {
  await Promise.all([
    emailQueue.close(),
    notificationQueue.close(),
    resumeQueue.close(),
    searchIndexQueue.close(),
    analyticsQueue.close(),
    deadLetterQueue.close(),
  ]);
}
