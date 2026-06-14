import type { Context } from "hono";

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
    status
  );
}

export function sendError(
  c: Context,
  code: string,
  message: string,
  status: number = 400
) {
  return c.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    status as any
  );
}
