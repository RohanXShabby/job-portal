import mongoose, { Schema } from "mongoose";

const SubscriptionSchema = new Schema(
  {
    userId: { type: String, required: true }, // Stripe payer user ID
    companyId: { type: Schema.Types.ObjectId, ref: "Company" }, // Associated company (for Recruiter tiers)
    stripeCustomerId: { type: String, required: true },
    stripeSubscriptionId: { type: String, required: true, unique: true },
    planId: {
      type: String,
      enum: ["free", "starter", "professional", "enterprise"],
      default: "free",
    },
    status: {
      type: String,
      enum: ["active", "canceled", "past_due", "trialing", "unpaid"],
      default: "active",
    },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
    cancelAtPeriodEnd: { type: Boolean, default: false },
  },
  { timestamps: true }
);

SubscriptionSchema.index({ stripeSubscriptionId: 1 }, { unique: true });
SubscriptionSchema.index({ userId: 1 });
SubscriptionSchema.index({ companyId: 1 });

export const SubscriptionModel =
  mongoose.models.Subscription || mongoose.model("Subscription", SubscriptionSchema);
export { SubscriptionSchema };
