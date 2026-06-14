import { Worker, type Job } from "bullmq";
import {
  connection,
  queueToDLQ,
  type EmailJobData,
  type NotificationJobData,
  type ResumeJobData,
  type SearchIndexJobData,
  type AnalyticsJobData,
} from "./queue.js";
import { sendEmail } from "./email.js";
import { NotificationModel, ResumeModel, AuditLogModel, User } from "@job-portal/db";
import { searchService } from "./search.js";

/**
 * Helper to handle failed jobs and route to Dead Letter Queue (DLQ)
 */
function handleWorkerFailure(queueName: string) {
  return async (job: Job | undefined, err: Error) => {
    if (!job) return;
    console.error(`[Worker] Job ${job.id} on queue ${queueName} failed:`, err.message);

    // Route to DLQ if max attempts reached
    if (job.attemptsMade >= (job.opts.attempts || 1)) {
      console.warn(`[DLQ] Job ${job.id} from queue ${queueName} reached max retries. Relaying to DLQ.`);
      try {
        await queueToDLQ({
          queueName,
          jobId: job.id || "unknown",
          jobData: job.data,
          failedReason: err.message,
          failedAt: new Date().toISOString(),
        });
      } catch (dlqErr: any) {
        console.error(`[DLQ Error] Failed to write job ${job.id} to DLQ:`, dlqErr.message);
      }
    }
  };
}

/**
 * 1. Email Worker
 */
export const emailWorker = new Worker<EmailJobData>(
  "email",
  async (job: Job<EmailJobData>) => {
    const { to, subject, body } = job.data;
    console.log(`[Email Worker] Processing email job ${job.id} to ${to}`);
    await sendEmail({
      to,
      subject,
      html: body,
    });
  },
  { connection, concurrency: 5 }
);

emailWorker.on("failed", handleWorkerFailure("email"));

/**
 * 2. Notification Worker
 */
export const notificationWorker = new Worker<NotificationJobData>(
  "notification",
  async (job: Job<NotificationJobData>) => {
    const { userId, type, title, message, data } = job.data;
    console.log(`[Notification Worker] Processing notification ${job.id} for user ${userId}`);

    if (type === "in-app" || type === "push") {
      // Save notification to database for in-app retrieval
      await NotificationModel.create({
        userId,
        title,
        message,
        type: "info",
        meta: data ? new Map(Object.entries(data)) : undefined,
      });
    }

    if (type === "email") {
      // Proxy notification to email queue
      const user = await User.findById(userId);
      if (user && user.email) {
        await sendEmail({
          to: user.email,
          subject: title,
          html: message,
        });
      }
    }
  },
  { connection, concurrency: 10 }
);

notificationWorker.on("failed", handleWorkerFailure("notification"));

/**
 * 3. Resume Processing Worker
 */
export const resumeWorker = new Worker<ResumeJobData>(
  "resume-processing",
  async (job: Job<ResumeJobData>) => {
    const { userId, resumeId, s3Key } = job.data;
    console.log(`[Resume Worker] Parsing resume file ${resumeId} for user ${userId} (Key: ${s3Key})`);

    // Simulate parsing the resume (extracting text, skills)
    // In production, this would call a parser microservice or PDF library
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const mockParsedText = "Senior Full Stack developer experienced with React, Node.js, and TypeScript.";
    const mockSkills = ["react", "node.js", "typescript", "mongodb", "redis"];

    // Update resume in database
    await ResumeModel.updateOne(
      { _id: resumeId },
      { parsedText: mockParsedText }
    );

    // Automatically enrich user's profile with matching skills
    await User.updateOne(
      { _id: userId },
      { $addToSet: { skills: { $each: mockSkills } } }
    );

    console.log(`[Resume Worker] Resume ${resumeId} processed. Profile updated.`);
  },
  { connection, concurrency: 2 }
);

resumeWorker.on("failed", handleWorkerFailure("resume-processing"));

/**
 * 4. Search Indexing Worker
 */
export const searchIndexWorker = new Worker<SearchIndexJobData>(
  "search-indexing",
  async (job: Job<SearchIndexJobData>) => {
    const { action, jobId, jobData } = job.data;
    console.log(`[Search Index Worker] Syncing search index for Job: ${jobId} (Action: ${action})`);

    if (action === "index") {
      await searchService.indexJob(jobData);
    } else if (action === "update") {
      await searchService.updateJob(jobData);
    } else if (action === "delete") {
      await searchService.deleteJob(jobId);
    }
  },
  { connection, concurrency: 5 }
);

searchIndexWorker.on("failed", handleWorkerFailure("search-indexing"));

/**
 * 5. Analytics Worker
 */
export const analyticsWorker = new Worker<AnalyticsJobData>(
  "analytics",
  async (job: Job<AnalyticsJobData>) => {
    const { event, userId, timestamp, metadata } = job.data;
    console.log(`[Analytics Worker] Logging event "${event}"`);

    // Insert into DB audit logs
    await AuditLogModel.create({
      userId,
      action: `analytics.${event}`,
      details: metadata ? new Map(Object.entries(metadata)) : undefined,
      createdAt: new Date(timestamp),
    });
  },
  { connection, concurrency: 10 }
);

analyticsWorker.on("failed", handleWorkerFailure("analytics"));

/**
 * 6. DLQ Log Monitor (Just registers consumption of dead letter queue logs)
 */
export const dlqWorker = new Worker(
  "dead-letter",
  async (job: Job) => {
    console.error(`[DLQ ALERT] Retrieved dead lettered job:`, JSON.stringify(job.data, null, 2));
    // Here we could alert page-duty or Slack webhook
  },
  { connection, concurrency: 1 }
);

export async function closeWorkers() {
  await Promise.all([
    emailWorker.close(),
    notificationWorker.close(),
    resumeWorker.close(),
    searchIndexWorker.close(),
    analyticsWorker.close(),
    dlqWorker.close(),
  ]);
}

export function startWorkers() {
  console.log("BullMQ workers started:");
  console.log("- emailWorker");
  console.log("- notificationWorker");
  console.log("- resumeWorker");
  console.log("- searchIndexWorker");
  console.log("- analyticsWorker");
  console.log("- dlqWorker");
}
