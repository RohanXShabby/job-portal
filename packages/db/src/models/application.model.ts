import mongoose, { Schema } from "mongoose";

const ApplicationSchema = new Schema(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    candidateId: { type: String, required: true }, // References User._id (Better Auth string)
    resumeUrl: { type: String, required: true },
    coverLetter: { type: String },
    status: {
      type: String,
      enum: ["pending", "reviewed", "shortlisted", "accepted", "rejected"],
      default: "pending",
    },
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
  mongoose.models.Application || mongoose.model("Application", ApplicationSchema);
export { ApplicationSchema };

