import mongoose, { Schema } from "mongoose";

const CompanySchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    logoUrl: { type: String },
    website: { type: String },
    description: { type: String, required: true },
    industry: { type: String, required: true },
    location: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    recruiters: [{ type: String }], // Array of User IDs (Better Auth references)
    subscriptionId: { type: Schema.Types.ObjectId, ref: "Subscription" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
CompanySchema.index({ slug: 1 }, { unique: true });
CompanySchema.index({ recruiters: 1 });
CompanySchema.index({ isVerified: 1 });

// Slug generator
CompanySchema.pre("save", function (this: any, next: any) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") + "-" + Math.random().toString(36).substring(2, 7);
  }
  next();
});

export const CompanyModel =
  mongoose.models.Company || mongoose.model("Company", CompanySchema);
export { CompanySchema };
