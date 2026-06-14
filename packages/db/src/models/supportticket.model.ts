import mongoose, { Schema } from "mongoose";

const SupportTicketSchema = new Schema(
  {
    userId: { type: String, required: true }, // Submitter ID
    companyId: { type: Schema.Types.ObjectId, ref: "Company" }, // Optional associated company
    subject: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    messages: [
      {
        senderId: { type: String, required: true },
        senderName: { type: String, required: true },
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

SupportTicketSchema.index({ userId: 1 });
SupportTicketSchema.index({ status: 1 });
SupportTicketSchema.index({ priority: 1 });

export const SupportTicketModel =
  mongoose.models.SupportTicket || mongoose.model("SupportTicket", SupportTicketSchema);
export { SupportTicketSchema };
