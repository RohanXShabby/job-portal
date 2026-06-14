import mongoose, { Schema } from "mongoose";

const AuditLogSchema = new Schema(
  {
    userId: { type: String }, // Optional, can be anonymous
    action: { type: String, required: true }, // e.g. "job.create", "payment.success"
    ipAddress: { type: String },
    userAgent: { type: String },
    details: { type: Schema.Types.Map, of: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now, expires: 7776000 }, // Automatically expires in 90 days (7776000 seconds)
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });

export const AuditLogModel =
  mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
export { AuditLogSchema };
