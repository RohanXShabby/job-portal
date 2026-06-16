import { applicationsRepository } from "../repositories/applications.repository.js";
import { queueEmailNotification, queueResumeProcessing } from "../../../lib/queue.js";
import { JobModel } from "@job-portal/db";

type ApplicationStatus = "pending" | "reviewed" | "accepted" | "rejected";

export class ApplicationsService {
  async apply(candidateId: string, data: { jobId: string; resumeUrl: string; coverLetter?: string }) {
    // Check if job exists and is open
    const job = await JobModel.findOne({ _id: data.jobId, status: "active", isDeleted: false })
      .select("title postedBy")
      .lean<{ _id: { toString(): string }; title: string; postedBy: string }>();
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

    await queueEmailNotification({
      event: "candidate_applied",
      candidateId,
      jobId: data.jobId,
      applicationId: application._id.toString(),
    });
    await queueEmailNotification({
      event: "recruiter_new_application",
      recruiterId: job.postedBy,
      candidateId,
      jobId: data.jobId,
      applicationId: application._id.toString(),
    });
    await queueResumeProcessing({
      userId: candidateId,
      resumeId: application._id.toString(),
      resumeUrl: data.resumeUrl,
    });

    return application;
  }

  async updateStatus(
    applicationId: string,
    status: ApplicationStatus,
    changedBy: string,
    note?: string
  ) {
    const application = await applicationsRepository.updateStatus(applicationId, status, changedBy, note);
    if (!application) {
      throw new Error("Application not found");
    }

    // Notify candidate about status change
    await queueEmailNotification({
      event: "application_status_changed",
      candidateId: application.candidateId,
      jobId: application.jobId.toString(),
      applicationId: application._id.toString(),
      status,
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

  async getAllApplications(status?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [applications, total] = await Promise.all([
      applicationsRepository.findAll(status, limit, skip),
      applicationsRepository.countAll(status),
    ]);
    return { applications, total, page, limit };
  }

  async getApplicationById(id: string) {
    return applicationsRepository.findById(id);
  }
}

export const applicationsService = new ApplicationsService();
