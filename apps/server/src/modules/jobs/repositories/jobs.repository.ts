import { JobModel, type JobRecord } from "@job-portal/db";
import { getOrSet, invalidate } from "@job-portal/redis";
import type { CreateJobInput } from "../types.js";
import type mongoose from "mongoose";

type JobDocument = JobRecord & { _id: mongoose.Types.ObjectId };

export class JobsRepository {
  /**
   * Find a job by ID, leveraging Cache-Aside
   */
  async findById(id: string) {
    const cacheKey = `job:${id}`;
    return getOrSet(
      cacheKey,
      async () => {
        return JobModel.findOne({ _id: id, isDeleted: false }).lean<JobDocument>();
      },
      3600 // Cache for 1 hour
    );
  }

  /**
   * Create a job in MongoDB
   */
  async create(data: CreateJobInput & { postedBy: string }) {
    const job = new JobModel({
      title: data.title,
      description: data.description,
      company: data.company,
      companyId: data.companyId,
      companyName: data.company,
      location: data.location,
      type: data.type,
      salary: data.salary,
      salaryRange: {
        min: data.salaryMin ?? data.salary,
        max: data.salaryMax ?? data.salary,
        currency: data.currency,
      },
      experienceLevel: data.experienceLevel,
      skills: data.skills,
      skillsRequired: data.skillsRequired ?? data.skills,
      status: "active",
      postedBy: data.postedBy,
    });

    await job.save();
    return job.toObject();
  }

  /**
   * Update a job in MongoDB and invalidate cache
   */
  async update(id: string, updateData: Partial<CreateJobInput> & { status?: "active" | "closed" }) {
    const set: Record<string, unknown> = { ...updateData };
    if (updateData.company) {
      set.companyName = updateData.company;
    }
    if (updateData.salary) {
      set.salaryRange = {
        min: updateData.salaryMin ?? updateData.salary,
        max: updateData.salaryMax ?? updateData.salary,
        currency: updateData.currency ?? "USD",
      };
    }
    if (updateData.skills) {
      set.skillsRequired = updateData.skillsRequired ?? updateData.skills;
    }

    const job = await JobModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: set },
      { new: true }
    ).lean<JobDocument>();

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
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true }
    ).lean<JobDocument>();

    if (job) {
      await invalidate(`job:${id}`);
    }
    return job;
  }

  /**
   * Retrieve list of jobs directly from Database (useful for feed fallback or specific filters)
   */
  async findMany(filters: Record<string, unknown>, limit = 20, skip = 0) {
    return JobModel.find({ ...filters, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<JobDocument[]>();
  }

  /**
   * Count documents matching filters
   */
  async count(filters: Record<string, unknown>): Promise<number> {
    return JobModel.countDocuments({ ...filters, isDeleted: false });
  }
}
export const jobsRepository = new JobsRepository();
