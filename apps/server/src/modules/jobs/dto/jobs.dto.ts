import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  company: z.string().min(2, "Company is required"),
  companyId: z.string().optional(),
  location: z.string().min(2, "Location is required"),
  type: z.enum(["full-time", "part-time", "remote"]),
  salary: z.number().positive("Salary must be positive"),
  salaryMin: z.number().positive().optional(),
  salaryMax: z.number().positive().optional(),
  currency: z.string().default("USD"),
  experienceLevel: z.enum(["entry", "mid", "senior", "lead", "executive"]).optional(),
  skills: z.array(z.string()).min(1, "At least one skill is required"),
  skillsRequired: z.array(z.string()).optional(),
});

export const updateJobSchema = createJobSchema.partial().extend({
  status: z.enum(["active", "closed"]).optional(),
});

export const searchJobQuerySchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  type: z.enum(["full-time", "part-time", "remote"]).optional(),
  experienceLevel: z.string().optional(),
  companyId: z.string().optional(),
  skills: z.preprocess(
    (val) => (typeof val === "string" ? val.split(",") : val),
    z.array(z.string()).optional()
  ),
  minSalary: z.coerce.number().optional(),
  maxSalary: z.coerce.number().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
});
