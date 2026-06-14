import mongoose, { Schema } from "mongoose";

const CouponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ["percentage", "fixed"], required: true },
    discountValue: { type: Number, required: true },
    expiresAt: { type: Date },
    maxUses: { type: Number },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CouponSchema.index({ code: 1 }, { unique: true });

export const CouponModel =
  mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);
export { CouponSchema };
