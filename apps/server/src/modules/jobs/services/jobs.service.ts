import { jobsRepository } from "../repositories/jobs.repository.js";
import { queueSearchIndex } from "../../../lib/queue.js";
import { searchService } from "../../../lib/search.js";
import type { CreateJobInput, SearchJobQuery } from "../types.js";
import { CompanyModel } from "@job-portal/db";

export class JobsService {
  async getJobById(id: string) {
    return jobsRepository.findById(id);
  }

  async createJob(data: CreateJobInput) {
    // Fetch company name & logo to denormalize into Job document
    const company = await CompanyModel.findOne({ _id: data.companyId } as any).lean();
    if (!company) {
      throw new Error(`Company with ID ${data.companyId} not found`);
    }

    const job = await jobsRepository.create({
      ...data,
      companyName: company.name,
      companyLogo: company.logoUrl,
    });

    // Enqueue search index task
    await queueSearchIndex({
      action: "index",
      jobId: job._id.toString(),
      jobData: job,
    });

    return job;
  }

  async updateJob(id: string, updateData: any) {
    const updatedJob = await jobsRepository.update(id, updateData);
    if (!updatedJob) {
      throw new Error("Job not found or already deleted");
    }

    // Enqueue search index task to sync updates
    await queueSearchIndex({
      action: "update",
      jobId: id,
      jobData: updatedJob,
    });

    return updatedJob;
  }

  async deleteJob(id: string) {
    const deletedJob = await jobsRepository.delete(id);
    if (!deletedJob) {
      throw new Error("Job not found or already deleted");
    }

    // Enqueue search index task to delete from search index
    await queueSearchIndex({
      action: "delete",
      jobId: id,
    });

    return deletedJob;
  }

  async searchJobs(query: SearchJobQuery) {
    const {
      query: q = "",
      location,
      type,
      experienceLevel,
      companyId,
      skills,
      minSalary,
      maxSalary,
      page = 1,
      limit = 20,
    } = query;

    // Call search engine for high-scale lightning-fast results (< 100ms)
    return searchService.searchJobs({
      query: q,
      filters: {
        location,
        type,
        experienceLevel,
        companyId,
        skills,
        minSalary,
        maxSalary,
      },
      page,
      limit,
    });
  }
}
export const jobsService = new JobsService();
