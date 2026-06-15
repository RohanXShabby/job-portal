import { env } from "@job-portal/env/web";
import { createAuthClient } from "better-auth/react";

// Initialize Better Auth client with base URL from environment
export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_SERVER_URL,
});

// Export commonly used auth utilities for convenience
export const { signIn, signUp, signOut, useSession } = authClient;
