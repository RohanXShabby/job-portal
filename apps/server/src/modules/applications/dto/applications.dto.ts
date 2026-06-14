import { z } from "zod";

export const applyJobSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  resumeUrl: z.string().url("Valid resume URL is required"),
  coverLetter: z.string().optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(["pending", "reviewed", "shortlisted", "accepted", "rejected"]),
  note: z.string().optional(),
});

export const listApplicationsSchema = z.object({
  jobId: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
});
