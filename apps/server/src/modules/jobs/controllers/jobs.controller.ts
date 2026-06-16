import type { Context } from "hono";
import { jobsService } from "../services/jobs.service.js";
import { createJobSchema, updateJobSchema, searchJobQuerySchema } from "../dto/jobs.dto.js";
import { sendSuccess, sendError } from "../../../lib/response.js";
import { applicationsController } from "../../applications/controllers/applications.controller.js";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error";
}

export class JobsController {
  /**
   * Search jobs with filters
   */
  async search(c: Context) {
    try {
      const queryParams = c.req.query();
      const parsed = searchJobQuerySchema.safeParse(queryParams);

      if (!parsed.success) {
        return sendError(c, "VALIDATION_ERROR", parsed.error.message, 400);
      }

      const results = await jobsService.searchJobs(parsed.data);
      return sendSuccess(c, results.results, "Search completed successfully", {
        total: results.total,
        page: results.page,
        limit: results.limit,
      });
    } catch (err) {
      return sendError(c, "SEARCH_ERROR", getErrorMessage(err), 500);
    }
  }

  /**
   * Get single job by ID
   */
  async getById(c: Context) {
    try {
      const id = c.req.param("id");
      if (!id) return sendError(c, "VALIDATION_ERROR", "Job ID is required", 400);
      const job = await jobsService.getJobById(id);

      if (!job) {
        return sendError(c, "NOT_FOUND", "Job listing not found", 404);
      }

      return sendSuccess(c, job, "Job fetched successfully");
    } catch (err) {
      return sendError(c, "DB_ERROR", getErrorMessage(err), 500);
    }
  }

  /**
   * Create a new job listing
   */
  async create(c: Context) {
    try {
      const body = await c.req.json();
      const parsed = createJobSchema.safeParse(body);

      if (!parsed.success) {
        return sendError(c, "VALIDATION_ERROR", parsed.error.message, 400);
      }

      const user = c.get("user");
      const job = await jobsService.createJob(parsed.data, user.id);
      return sendSuccess(c, job, "Job listing created successfully", undefined, 201);
    } catch (err) {
      return sendError(c, "CREATE_ERROR", getErrorMessage(err), 500);
    }
  }

  /**
   * Update an existing job listing
   */
  async update(c: Context) {
    try {
      const id = c.req.param("id");
      if (!id) return sendError(c, "VALIDATION_ERROR", "Job ID is required", 400);
      const body = await c.req.json();
      const parsed = updateJobSchema.safeParse(body);

      if (!parsed.success) {
        return sendError(c, "VALIDATION_ERROR", parsed.error.message, 400);
      }

      // Check authorization
      const user = c.get("user");
      const existingJob = await jobsService.getJobById(id);

      if (!existingJob) {
        return sendError(c, "NOT_FOUND", "Job listing not found", 404);
      }

      if (user.role !== "super_admin" && existingJob.postedBy !== user.id) {
        return sendError(c, "FORBIDDEN", "You can only modify jobs you posted.", 403);
      }

      const updated = await jobsService.updateJob(id, parsed.data);
      return sendSuccess(c, updated, "Job listing updated successfully");
    } catch (err) {
      return sendError(c, "UPDATE_ERROR", getErrorMessage(err), 500);
    }
  }

  /**
   * Delete a job listing (soft delete)
   */
  async delete(c: Context) {
    try {
      const id = c.req.param("id");
      if (!id) return sendError(c, "VALIDATION_ERROR", "Job ID is required", 400);
      const user = c.get("user");

      const existingJob = await jobsService.getJobById(id);
      if (!existingJob) {
        return sendError(c, "NOT_FOUND", "Job listing not found", 404);
      }

      if (user.role !== "super_admin" && existingJob.postedBy !== user.id) {
        return sendError(c, "FORBIDDEN", "You can only delete jobs you posted.", 403);
      }

      await jobsService.deleteJob(id);
      return sendSuccess(c, null, "Job listing deleted successfully");
    } catch (err) {
      return sendError(c, "DELETE_ERROR", getErrorMessage(err), 500);
    }
  }

  async apply(c: Context) {
    return applicationsController.applyToJobRoute(c);
  }

  async listApplications(c: Context) {
    return applicationsController.listByNestedJob(c);
  }

  async updateApplicationStatus(c: Context) {
    return applicationsController.updateNestedStatus(c);
  }
}
export const jobsController = new JobsController();
