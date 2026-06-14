import type { Context } from "hono";
import { applicationsService } from "../services/applications.service.js";
import {
  applyJobSchema,
  updateApplicationStatusSchema,
  listApplicationsSchema,
} from "../dto/applications.dto.js";
import { sendSuccess, sendError } from "../../../lib/response.js";

export class ApplicationsController {
  /**
   * Candidate applies for a job
   */
  async apply(c: Context) {
    try {
      const user = c.get("user");
      const body = await c.req.json();
      const parsed = applyJobSchema.safeParse(body);

      if (!parsed.success) {
        return sendError(c, "VALIDATION_ERROR", parsed.error.message, 400);
      }

      const application = await applicationsService.apply(user.id, parsed.data);
      return sendSuccess(c, application, "Application submitted successfully", undefined, 201);
    } catch (err: any) {
      if (err.message.includes("already applied") || err.message.includes("no longer accepting")) {
        return sendError(c, "CONFLICT", err.message, 409);
      }
      return sendError(c, "APPLY_ERROR", err.message, 500);
    }
  }

  /**
   * Recruiter/Admin updates application status
   */
  async updateStatus(c: Context) {
    try {
      const id = c.req.param("id");
      if (!id) {
        return sendError(c, "VALIDATION_ERROR", "Application ID is required", 400);
      }
      const user = c.get("user");
      const body = await c.req.json();
      const parsed = updateApplicationStatusSchema.safeParse(body);

      if (!parsed.success) {
        return sendError(c, "VALIDATION_ERROR", parsed.error.message, 400);
      }

      const application = await applicationsService.updateStatus(
        id,
        parsed.data.status,
        user.id,
        parsed.data.note
      );
      return sendSuccess(c, application, "Application status updated");
    } catch (err: any) {
      return sendError(c, "UPDATE_ERROR", err.message, 500);
    }
  }

  /**
   * List applications by job ID (for recruiters)
   */
  async listByJob(c: Context) {
    try {
      const queryParams = c.req.query();
      const parsed = listApplicationsSchema.safeParse(queryParams);

      if (!parsed.success) {
        return sendError(c, "VALIDATION_ERROR", parsed.error.message, 400);
      }

      if (!parsed.data.jobId) {
        return sendError(c, "VALIDATION_ERROR", "jobId query parameter is required", 400);
      }

      const result = await applicationsService.getApplicationsByJob(
        parsed.data.jobId,
        parsed.data.status,
        parsed.data.page,
        parsed.data.limit
      );

      return sendSuccess(c, result.applications, "Applications fetched", {
        total: result.total,
        page: result.page,
        limit: result.limit,
      });
    } catch (err: any) {
      return sendError(c, "LIST_ERROR", err.message, 500);
    }
  }

  /**
   * List applications by current candidate
   */
  async myApplications(c: Context) {
    try {
      const user = c.get("user");
      const queryParams = c.req.query();
      const page = Number(queryParams.page) || 1;
      const limit = Number(queryParams.limit) || 20;

      const result = await applicationsService.getApplicationsByCandidate(user.id, page, limit);

      return sendSuccess(c, result.applications, "Your applications fetched", {
        total: result.total,
        page: result.page,
        limit: result.limit,
      });
    } catch (err: any) {
      return sendError(c, "LIST_ERROR", err.message, 500);
    }
  }

  /**
   * Get a single application by ID
   */
  async getById(c: Context) {
    try {
      const id = c.req.param("id");
      if (!id) {
        return sendError(c, "VALIDATION_ERROR", "Application ID is required", 400);
      }
      const application = await applicationsService.getApplicationById(id);

      if (!application) {
        return sendError(c, "NOT_FOUND", "Application not found", 404);
      }

      return sendSuccess(c, application, "Application fetched");
    } catch (err: any) {
      return sendError(c, "DB_ERROR", err.message, 500);
    }
  }
}

export const applicationsController = new ApplicationsController();
