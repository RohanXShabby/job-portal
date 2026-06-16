// The canonical auth instance is configured in packages/auth/src/index.ts
// (includes mongodbAdapter, emailAndPassword, session, trustedOrigins, etc.)
// Re-export it here for any local server imports.
export { auth } from "@job-portal/auth";