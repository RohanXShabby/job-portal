import type { Context } from "hono";
import { usersService } from "../services/users.service.js";
import { updateProfileSchema, saveJobSchema } from "../dto/users.dto.js";
import { sendSuccess, sendError } from "../../../lib/response.js";

export class UsersController {
  async getProfile(c: Context) {
    try {
      const user = c.get("user");
      const profile = await usersService.getProfile(user.id);
      return sendSuccess(c, profile, "Profile fetched");
    } catch (err: any) {
      return sendError(c, "DB_ERROR", err.message, 500);
    }
  }

  async updateProfile(c: Context) {
    try {
      const user = c.get("user");
      const body = await c.req.json();
      const parsed = updateProfileSchema.safeParse(body);
      if (!parsed.success) return sendError(c, "VALIDATION_ERROR", parsed.error.message, 400);

      const updated = await usersService.updateProfile(user.id, parsed.data);
      return sendSuccess(c, updated, "Profile updated");
    } catch (err: any) {
      return sendError(c, "UPDATE_ERROR", err.message, 500);
    }
  }

  async saveJob(c: Context) {
    try {
      const user = c.get("user");
      const body = await c.req.json();
      const parsed = saveJobSchema.safeParse(body);
      if (!parsed.success) return sendError(c, "VALIDATION_ERROR", parsed.error.message, 400);

      await usersService.saveJob(user.id, parsed.data.jobId);
      return sendSuccess(c, null, "Job saved");
    } catch (err: any) {
      return sendError(c, "SAVE_ERROR", err.message, 500);
    }
  }

  async unsaveJob(c: Context) {
    try {
      const user = c.get("user");
      const jobId = c.req.param("jobId");
      await usersService.unsaveJob(user.id, jobId as string);
      return sendSuccess(c, null, "Job unsaved");
    } catch (err: any) {
      return sendError(c, "UNSAVE_ERROR", err.message, 500);
    }
  }

  /** Admin: list users */
  async listUsers(c: Context) {
    try {
      const role = c.req.query("role");
      const page = Number(c.req.query("page")) || 1;
      const limit = Number(c.req.query("limit")) || 20;

      const result = await usersService.listUsers(role, page, limit);
      return sendSuccess(c, result.users, "Users fetched", {
        total: result.total,
        page: result.page,
        limit: result.limit,
      });
    } catch (err: any) {
      return sendError(c, "LIST_ERROR", err.message, 500);
    }
  }

  /** Admin: delete user */
  async deleteUser(c: Context) {
    try {
      const id = c.req.param("id");
      await usersService.deleteUser(id as string);
      return sendSuccess(c, null, "User deleted");
    } catch (err: any) {
      return sendError(c, "DELETE_ERROR", err.message, 500);
    }
  }
}

export const usersController = new UsersController();
