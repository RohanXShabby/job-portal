import { env } from "@job-portal/env/server";
import mongoose from "mongoose";

await mongoose.connect(env.DATABASE_URL).catch((error) => {
  console.log("Error connecting to database:", error);
});

const client = mongoose.connection.getClient().db("job_portal");

export { client };
export * from "./models/auth.model.js";
export * from "./models/job.model.js";
export * from "./models/application.model.js";
export * from "./models/company.model.js";
export * from "./models/resume.model.js";
export * from "./models/subscription.model.js";
export * from "./models/payment.model.js";
export * from "./models/notification.model.js";
export * from "./models/blog.model.js";
export * from "./models/coupon.model.js";
export * from "./models/auditlog.model.js";
export * from "./models/supportticket.model.js";
