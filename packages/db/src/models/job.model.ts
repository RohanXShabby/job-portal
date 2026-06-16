import mongoose, { Schema } from "mongoose";

export interface JobRecord {
  title: string;
  slug?: string;
  description: string;
  company: string;
  companyId?: mongoose.Types.ObjectId;
  companyName?: string;
  companyLogo?: string;
  location: string;
  salary: number;
  type: "full-time" | "part-time" | "remote";
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  experienceLevel?: "entry" | "mid" | "senior" | "lead" | "executive";
  skills: string[];
  skillsRequired: string[];
  status: "active" | "closed";
  postedBy: string;
  isDeleted: boolean;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const JobSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true },
    description: { type: String, required: true },
    company: { type: String, required: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    companyName: { type: String },
    companyLogo: { type: String },
    location: { type: String, required: true },
    salary: { type: Number, required: true },
    type: {
      type: String,
      enum: ["full-time", "part-time", "remote"],
      required: true,
    },
    salaryRange: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: "USD" },
    },
    experienceLevel: {
      type: String,
      enum: ["entry", "mid", "senior", "lead", "executive"],
    },
    skills: [{ type: String }],
    skillsRequired: [{ type: String }],
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
    },
    postedBy: { type: String, ref: "User", required: true },
    isDeleted: { type: Boolean, default: false },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for high scale performance (10k+ requests/sec)
JobSchema.index({ postedBy: 1, status: 1 });
JobSchema.index({ companyId: 1, status: 1 });
JobSchema.index({ status: 1, createdAt: -1 });
JobSchema.index({ skills: 1 });
JobSchema.index({ skillsRequired: 1 });
JobSchema.index({ slug: 1 }, { unique: true });

// Pre-save hook to generate unique slug if not provided
JobSchema.pre("save", function (this: mongoose.HydratedDocument<JobRecord>) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") + "-" + Math.random().toString(36).substring(2, 7);
  }
  this.companyName ??= this.company;
  this.skillsRequired = this.skillsRequired?.length ? this.skillsRequired : this.skills;
  this.salaryRange = {
    min: this.salaryRange?.min ?? this.salary,
    max: this.salaryRange?.max ?? this.salary,
    currency: this.salaryRange?.currency ?? "USD",
  };
});

export const JobModel =
  (mongoose.models.Job as mongoose.Model<JobRecord> | undefined) ||
  mongoose.model<JobRecord>("Job", JobSchema);
export { JobSchema };
