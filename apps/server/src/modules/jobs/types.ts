import type { z } from "zod";
import type { createJobSchema, searchJobQuerySchema } from "./dto/jobs.dto.js";

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type SearchJobQuery = z.infer<typeof searchJobQuerySchema>;

export interface JobFilter {
  location?: string;
  type?: string;
  experienceLevel?: string;
  companyId?: string;
  skillsRequired?: { $all: string[] };
  "salaryRange.min"?: { $gte: number };
  "salaryRange.max"?: { $lte: number };
  isDeleted: boolean;
  status?: string;
}
