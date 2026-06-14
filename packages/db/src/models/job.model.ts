import mongoose, { Schema } from "mongoose";

const JobSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true },
    description: { type: String, required: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    companyName: { type: String, required: true },
    companyLogo: { type: String },
    location: { type: String, required: true },
    type: {
      type: String,
      enum: ["full-time", "part-time", "contract", "remote"],
      required: true,
    },
    salaryRange: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      currency: { type: String, default: "USD" },
    },
    experienceLevel: {
      type: String,
      enum: ["entry", "mid", "senior", "lead", "executive"],
      required: true,
    },
    skillsRequired: [{ type: String }],
    status: {
      type: String,
      enum: ["open", "closed", "draft"],
      default: "draft",
    },
    isDeleted: { type: Boolean, default: false },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for high scale performance (10k+ requests/sec)
JobSchema.index({ companyId: 1, status: 1 });
JobSchema.index({ status: 1, createdAt: -1 });
JobSchema.index({ skillsRequired: 1 });
JobSchema.index({ slug: 1 }, { unique: true });

// Pre-save hook to generate unique slug if not provided
JobSchema.pre("save", function (this: any, next: any) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") + "-" + Math.random().toString(36).substring(2, 7);
  }
  next();
});

export const JobModel = mongoose.models.Job || mongoose.model("Job", JobSchema);
export { JobSchema };

