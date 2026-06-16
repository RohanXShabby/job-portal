import mongoose, { Schema } from "mongoose";

export type ApplicationStatus = "pending" | "reviewed" | "accepted" | "rejected";

export interface ApplicationRecord {
  jobId: mongoose.Types.ObjectId | string;
  candidateId: string;
  resumeUrl: string;
  coverLetter?: string;
  status: ApplicationStatus;
  appliedAt: Date;
  timeline: Array<{
    status: string;
    changedAt: Date;
    changedBy: string;
    note?: string;
  }>;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const ApplicationSchema = new Schema(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    candidateId: { type: String, required: true }, // References User._id (Better Auth string)
    resumeUrl: { type: String, required: true },
    coverLetter: { type: String },
    status: {
      type: String,
      enum: ["pending", "reviewed", "accepted", "rejected"],
      default: "pending",
    },
    appliedAt: { type: Date, default: Date.now },
    timeline: [
      {
        status: { type: String, required: true },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: String, required: true }, // User ID of changer
        note: { type: String },
      },
    ],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
ApplicationSchema.index({ jobId: 1, status: 1 });
ApplicationSchema.index({ candidateId: 1, createdAt: -1 });
ApplicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true }); // Prevent duplicate applications

export const ApplicationModel =
  (mongoose.models.Application as mongoose.Model<ApplicationRecord> | undefined) ||
  mongoose.model<ApplicationRecord>("Application", ApplicationSchema);
export { ApplicationSchema };
