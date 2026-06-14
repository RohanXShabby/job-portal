import mongoose, { Schema } from "mongoose";

const PaymentSchema = new Schema(
  {
    subscriptionId: { type: Schema.Types.ObjectId, ref: "Subscription" },
    userId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "usd" },
    stripePaymentIntentId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["succeeded", "failed", "pending", "refunded"],
      required: true,
    },
    invoiceUrl: { type: String },
  },
  { timestamps: true }
);

PaymentSchema.index({ stripePaymentIntentId: 1 }, { unique: true });
PaymentSchema.index({ userId: 1 });

export const PaymentModel =
  mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
export { PaymentSchema };
