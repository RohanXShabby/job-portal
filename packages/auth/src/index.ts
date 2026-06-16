import { client } from "@job-portal/db";
import { env } from "@job-portal/env/server";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { dash } from "@better-auth/infra";

// Role-based permissions configuration
export const rolePermissions: Record<string, string[]> = {
  super_admin: [
    "manage_users",
    "manage_roles",
    "manage_companies",
    "manage_jobs",
    "manage_applications",
    "manage_payments",
    "view_analytics",
    "manage_settings",
  ],
  recruiter: [
    "create_jobs",
    "manage_own_jobs",
    "view_applications",
    "manage_own_applications",
    "view_candidate_profiles",
  ],
  candidate: [
    "view_jobs",
    "apply_to_jobs",
    "manage_own_profile",
    "manage_own_applications",
    "save_jobs",
  ],
};

export type UserRole = "super_admin" | "recruiter" | "candidate";
export type Permission = string;

const trustedOrigins = (env.CORS_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);

export const auth = betterAuth({
  database: mongodbAdapter(client),
  trustedOrigins: trustedOrigins.length ? trustedOrigins : undefined,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "candidate",
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
    generateId: () => {
      return crypto.randomUUID();
    },
  },
  account: {
    accountLinking: {
      enabled: true,
    },
  },
  plugins: [
    dash(),
  ],
});
