import mongoose, { Schema } from "mongoose";

const BlogSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    authorId: { type: String, required: true }, // References Admin/SuperAdmin User
    authorName: { type: String, required: true },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

BlogSchema.index({ slug: 1 }, { unique: true });
BlogSchema.index({ status: 1, createdAt: -1 });

BlogSchema.pre("save", function (this: any, next: any) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") + "-" + Math.random().toString(36).substring(2, 7);
  }
  next();
});

export const BlogModel =
  mongoose.models.Blog || mongoose.model("Blog", BlogSchema);
export { BlogSchema };
