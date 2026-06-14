import mongoose, { Schema } from "mongoose";

const NotificationSchema = new Schema(
  {
    userId: { type: String, required: true }, // Recipient
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      default: "info",
    },
    isRead: { type: Boolean, default: false },
    meta: { type: Schema.Types.Map, of: String }, // Flexible metadata payload
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });

export const NotificationModel =
  mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
export { NotificationSchema };
