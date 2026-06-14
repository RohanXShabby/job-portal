import { applicationsRepository } from "../repositories/applications.repository.js";
import { queueNotification } from "../../../lib/queue.js";
import { JobModel, CompanyModel } from "@job-portal/db";

export class ApplicationsService {
  async apply(candidateId: string, data: { jobId: string; resumeUrl: string; coverLetter?: string }) {
    // Check if job exists and is open
    const job = await JobModel.findOne({ _id: data.jobId, status: "open", isDeleted: false } as any).lean();
    if (!job) {
      throw new Error("Job listing not found or is no longer accepting applications");
    }

    // Check for duplicate application
    const existing = await applicationsRepository.findByJobAndCandidate(data.jobId, candidateId);
    if (existing) {
      throw new Error("You have already applied for this job");
    }

    const application = await applicationsRepository.create({
      jobId: data.jobId,
      candidateId,
      resumeUrl: data.resumeUrl,
      coverLetter: data.coverLetter,
    });

    // Notify recruiters via background queue
    if (job.companyId) {
      const company = await CompanyModel.findOne({ _id: job.companyId } as any).lean();
      if (company && company.recruiters && company.recruiters.length > 0) {
        for (const recruiterId of company.recruiters) {
          await queueNotification({
            userId: recruiterId,
            type: "in-app",
            title: "New Application Received",
            message: `A candidate has applied for "${job.title}"`,
            data: { jobId: data.jobId, applicationId: application._id.toString() },
          });
        }
      }
    }

    return application;
  }

  async updateStatus(
    applicationId: string,
    status: string,
    changedBy: string,
    note?: string
  ) {
    const application = await applicationsRepository.updateStatus(applicationId, status, changedBy, note);
    if (!application) {
      throw new Error("Application not found");
    }

    // Notify candidate about status change
    await queueNotification({
      userId: application.candidateId,
      type: "in-app",
      title: `Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your application status has been updated to "${status}"`,
      data: { applicationId: application._id.toString(), status },
    });

    return application;
  }

  async getApplicationsByJob(jobId: string, status?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [applications, total] = await Promise.all([
      applicationsRepository.findByJob(jobId, status, limit, skip),
      applicationsRepository.countByJob(jobId, status),
    ]);
    return { applications, total, page, limit };
  }

  async getApplicationsByCandidate(candidateId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [applications, total] = await Promise.all([
      applicationsRepository.findByCandidate(candidateId, limit, skip),
      applicationsRepository.countByCandidate(candidateId),
    ]);
    return { applications, total, page, limit };
  }

  async getApplicationById(id: string) {
    return applicationsRepository.findById(id);
  }
}

export const applicationsService = new ApplicationsService();
