import { env } from "@job-portal/env/web";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_SERVER_URL,
  fetchOptions: {
    headers: {
      ...(env.NEXT_PUBLIC_SERVER_URL.includes("ngrok") && {
        "ngrok-skip-browser-warning": "true",
      }),
    },
  },
});