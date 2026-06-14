import { ApplicationModel } from "@job-portal/db";

export class ApplicationsRepository {
  async findById(id: string) {
    return ApplicationModel.findOne({ _id: id, isDeleted: false } as any).lean();
  }

  async findByJobAndCandidate(jobId: string, candidateId: string) {
    return ApplicationModel.findOne({ jobId, candidateId, isDeleted: false } as any).lean();
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
    status: string,
    changedBy: string,
    note?: string
  ) {
    return ApplicationModel.findOneAndUpdate(
      { _id: id, isDeleted: false } as any,
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
      { new: true } as any
    ).lean();
  }

  async findByJob(jobId: string, status?: string, limit = 20, skip = 0) {
    const filter: any = { jobId, isDeleted: false };
    if (status) filter.status = status;

    return ApplicationModel.find(filter as any)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async findByCandidate(candidateId: string, limit = 20, skip = 0) {
    return ApplicationModel.find({ candidateId, isDeleted: false } as any)
      .sort({ createdAt: -1 } as any)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async countByJob(jobId: string, status?: string): Promise<number> {
    const filter: any = { jobId, isDeleted: false };
    if (status) filter.status = status;
    return ApplicationModel.countDocuments(filter);
  }

  async countByCandidate(candidateId: string): Promise<number> {
    return ApplicationModel.countDocuments({ candidateId, isDeleted: false });
  }
}

export const applicationsRepository = new ApplicationsRepository();
