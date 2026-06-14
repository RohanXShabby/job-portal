import mongoose, { Schema } from "mongoose";

const ResumeSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true }, // References User._id
    s3Key: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    parsedText: { type: String }, // Populated by background queue workers
  },
  { timestamps: true }
);

ResumeSchema.index({ userId: 1 }, { unique: true });

export const ResumeModel =
  mongoose.models.Resume || mongoose.model("Resume", ResumeSchema);
export { ResumeSchema };
