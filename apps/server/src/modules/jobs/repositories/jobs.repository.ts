import { JobModel } from "@job-portal/db";
import { getOrSet, invalidate } from "@job-portal/redis";
import type { CreateJobInput } from "../types.js";

export class JobsRepository {
  /**
   * Find a job by ID, leveraging Cache-Aside
   */
  async findById(id: string) {
    const cacheKey = `job:${id}`;
    return getOrSet(
      cacheKey,
      async () => {
        return JobModel.findOne({ _id: id, isDeleted: false } as any).lean();
      },
      3600 // Cache for 1 hour
    );
  }

  /**
   * Create a job in MongoDB
   */
  async create(data: CreateJobInput & { companyName: string; companyLogo?: string }) {
    const job = new JobModel({
      title: data.title,
      description: data.description,
      companyId: data.companyId,
      companyName: data.companyName,
      companyLogo: data.companyLogo,
      location: data.location,
      type: data.type,
      salaryRange: {
        min: data.salaryMin,
        max: data.salaryMax,
        currency: data.currency,
      },
      experienceLevel: data.experienceLevel,
      skillsRequired: data.skillsRequired,
      status: "draft",
    });

    await job.save();
    return job.toObject();
  }

  /**
   * Update a job in MongoDB and invalidate cache
   */
  async update(id: string, updateData: any) {
    const job = await JobModel.findOneAndUpdate(
      { _id: id, isDeleted: false } as any,
      { $set: updateData },
      { new: true } as any
    ).lean();

    if (job) {
      await invalidate(`job:${id}`);
    }
    return job;
  }

  /**
   * Soft delete a job and invalidate cache
   */
  async delete(id: string) {
    const job = await JobModel.findOneAndUpdate(
      { _id: id, isDeleted: false } as any,
      { $set: { isDeleted: true } },
      { new: true } as any
    ).lean();

    if (job) {
      await invalidate(`job:${id}`);
    }
    return job;
  }

  /**
   * Retrieve list of jobs directly from Database (useful for feed fallback or specific filters)
   */
  async findMany(filters: any, limit = 20, skip = 0) {
    return JobModel.find({ ...filters, isDeleted: false } as any)
      .sort({ createdAt: -1 } as any)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  /**
   * Count documents matching filters
   */
  async count(filters: any): Promise<number> {
    return JobModel.countDocuments({ ...filters, isDeleted: false });
  }
}
export const jobsRepository = new JobsRepository();
