import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export function sendSuccess<T>(
  c: Context,
  data: T,
  message = "Operation successful",
  meta?: Record<string, unknown>,
  status: 200 | 201 = 200
) {
  return c.json(
    {
      success: true,
      message,
      data,
      meta,
    },
    status as ContentfulStatusCode
  );
}

export function sendError(
  c: Context,
  code: string,
  message: string,
  status: ContentfulStatusCode = 400
) {
  return c.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    status
  );
}
