import {
  ApplicationModel,
  type ApplicationRecord,
  type ApplicationStatus,
} from "@job-portal/db";
import type mongoose from "mongoose";

type ApplicationDocument = ApplicationRecord & { _id: mongoose.Types.ObjectId };

export class ApplicationsRepository {
  async findById(id: string) {
    return ApplicationModel.findOne({ _id: id, isDeleted: false }).lean<ApplicationDocument>();
  }

  async findByJobAndCandidate(jobId: string, candidateId: string) {
    return ApplicationModel.findOne({ jobId, candidateId, isDeleted: false }).lean<ApplicationDocument>();
  }

  async create(data: {
    jobId: string;
    candidateId: string;
    resumeUrl: string;
    coverLetter?: string;
  }) {
    const app = new ApplicationModel({
      ...data,
      status: "pending",
      timeline: [
        {
          status: "pending",
          changedAt: new Date(),
          changedBy: data.candidateId,
          note: "Application submitted",
        },
      ],
    });
    await app.save();
    return app.toObject();
  }

  async updateStatus(
    id: string,
    status: ApplicationStatus,
    changedBy: string,
    note?: string
  ) {
    return ApplicationModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      {
        $set: { status },
        $push: {
          timeline: {
            status,
            changedAt: new Date(),
            changedBy,
            note,
          },
        },
      },
      { new: true }
    ).lean<ApplicationDocument>();
  }

  async findByJob(jobId: string, status?: string, limit = 20, skip = 0) {
    const filter: Record<string, unknown> = { jobId, isDeleted: false };
    if (status) filter.status = status;

    return ApplicationModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<ApplicationDocument[]>();
  }

  async findByCandidate(candidateId: string, limit = 20, skip = 0) {
    return ApplicationModel.find({ candidateId, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<ApplicationDocument[]>();
  }

  async findAll(status?: string, limit = 20, skip = 0) {
    const filter: Record<string, unknown> = { isDeleted: false };
    if (status) filter.status = status;

    return ApplicationModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<ApplicationDocument[]>();
  }

  async countAll(status?: string): Promise<number> {
    const filter: Record<string, unknown> = { isDeleted: false };
    if (status) filter.status = status;
    return ApplicationModel.countDocuments(filter);
  }

  async countByJob(jobId: string, status?: string): Promise<number> {
    const filter: Record<string, unknown> = { jobId, isDeleted: false };
    if (status) filter.status = status;
    return ApplicationModel.countDocuments(filter);
  }

  async countByCandidate(candidateId: string): Promise<number> {
    return ApplicationModel.countDocuments({ candidateId, isDeleted: false });
  }
}

export const applicationsRepository = new ApplicationsRepository();
