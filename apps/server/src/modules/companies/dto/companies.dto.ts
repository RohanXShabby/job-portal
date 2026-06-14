import { z } from "zod";

export const createCompanySchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  industry: z.string().min(2, "Industry is required"),
  location: z.string().min(2, "Location is required"),
  website: z.string().url("Must be a valid URL").optional(),
  logoUrl: z.string().url().optional(),
});

export const updateCompanySchema = createCompanySchema.partial();
