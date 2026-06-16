import type { Context } from "hono";
import { applicationsService } from "../services/applications.service.js";
import {
  applyJobSchema,
  updateApplicationStatusSchema,
  listApplicationsSchema,
} from "../dto/applications.dto.js";
import { sendSuccess, sendError } from "../../../lib/response.js";
import { uploadResumeToCloudinary } from "../../../lib/cloudinary.js";
import { jobsService } from "../../jobs/services/jobs.service.js";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error";
}

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
      if (!parsed.data.resumeUrl) {
        return sendError(c, "VALIDATION_ERROR", "Resume URL is required", 400);
      }

      const application = await applicationsService.apply(user.id, {
        ...parsed.data,
        resumeUrl: parsed.data.resumeUrl,
      });
      return sendSuccess(c, application, "Application submitted successfully", undefined, 201);
    } catch (err) {
      const message = getErrorMessage(err);
      if (message.includes("already applied") || message.includes("no longer accepting")) {
        return sendError(c, "CONFLICT", message, 409);
      }
      return sendError(c, "APPLY_ERROR", message, 500);
    }
  }

  async applyToJobRoute(c: Context) {
    try {
      const user = c.get("user");
      const jobId = c.req.param("id");
      if (!jobId) return sendError(c, "VALIDATION_ERROR", "Job ID is required", 400);
      const contentType = c.req.header("content-type") ?? "";

      let resumeUrl: string | undefined;
      let coverLetter: string | undefined;

      if (contentType.includes("multipart/form-data")) {
        const form = await c.req.parseBody();
        const resume = form.resume;
        coverLetter = typeof form.coverLetter === "string" ? form.coverLetter : undefined;
        if (!(resume instanceof File)) {
          return sendError(c, "VALIDATION_ERROR", "Resume file is required", 400);
        }
        const uploaded = await uploadResumeToCloudinary(resume, user.id);
        resumeUrl = uploaded.secureUrl;
      } else {
        const body = await c.req.json();
        const parsed = applyJobSchema.safeParse({ ...body, jobId });
        if (!parsed.success) {
          return sendError(c, "VALIDATION_ERROR", parsed.error.message, 400);
        }
        resumeUrl = parsed.data.resumeUrl;
        coverLetter = parsed.data.coverLetter;
      }

      if (!resumeUrl) {
        return sendError(c, "VALIDATION_ERROR", "Resume URL or resume file is required", 400);
      }

      const application = await applicationsService.apply(user.id, { jobId, resumeUrl, coverLetter });
      return sendSuccess(c, application, "Application submitted successfully", undefined, 201);
    } catch (err) {
      const message = getErrorMessage(err);
      if (message.includes("already applied") || message.includes("no longer accepting")) {
        return sendError(c, "CONFLICT", message, 409);
      }
      return sendError(c, "APPLY_ERROR", message, 500);
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
    } catch (err) {
      return sendError(c, "UPDATE_ERROR", getErrorMessage(err), 500);
    }
  }

  async updateNestedStatus(c: Context) {
    try {
      const jobId = c.req.param("id");
      const appId = c.req.param("appId");
      if (!jobId || !appId) return sendError(c, "VALIDATION_ERROR", "Job and application IDs are required", 400);
      const user = c.get("user");
      const job = await jobsService.getJobById(jobId);
      if (!job) return sendError(c, "NOT_FOUND", "Job listing not found", 404);
      if (user.role !== "super_admin" && job.postedBy !== user.id) {
        return sendError(c, "FORBIDDEN", "You can only manage applications for jobs you posted.", 403);
      }

      const body = await c.req.json();
      const parsed = updateApplicationStatusSchema.safeParse(body);
      if (!parsed.success) return sendError(c, "VALIDATION_ERROR", parsed.error.message, 400);

      const application = await applicationsService.updateStatus(appId, parsed.data.status, user.id, parsed.data.note);
      return sendSuccess(c, application, "Application status updated");
    } catch (err) {
      return sendError(c, "UPDATE_ERROR", getErrorMessage(err), 500);
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
    } catch (err) {
      return sendError(c, "LIST_ERROR", getErrorMessage(err), 500);
    }
  }

  async listByNestedJob(c: Context) {
    try {
      const jobId = c.req.param("id");
      if (!jobId) return sendError(c, "VALIDATION_ERROR", "Job ID is required", 400);
      const user = c.get("user");
      const job = await jobsService.getJobById(jobId);
      if (!job) return sendError(c, "NOT_FOUND", "Job listing not found", 404);
      if (user.role !== "super_admin" && job.postedBy !== user.id) {
        return sendError(c, "FORBIDDEN", "You can only view applications for jobs you posted.", 403);
      }
      const parsed = listApplicationsSchema.safeParse({ ...c.req.query(), jobId });
      if (!parsed.success) return sendError(c, "VALIDATION_ERROR", parsed.error.message, 400);

      const result = await applicationsService.getApplicationsByJob(
        jobId,
        parsed.data.status,
        parsed.data.page,
        parsed.data.limit,
      );
      return sendSuccess(c, result.applications, "Applications fetched", {
        total: result.total,
        page: result.page,
        limit: result.limit,
      });
    } catch (err) {
      return sendError(c, "LIST_ERROR", getErrorMessage(err), 500);
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
    } catch (err) {
      return sendError(c, "LIST_ERROR", getErrorMessage(err), 500);
    }
  }

  async listAll(c: Context) {
    try {
      const parsed = listApplicationsSchema.safeParse(c.req.query());
      if (!parsed.success) {
        return sendError(c, "VALIDATION_ERROR", parsed.error.message, 400);
      }

      const result = await applicationsService.getAllApplications(
        parsed.data.status,
        parsed.data.page,
        parsed.data.limit,
      );
      return sendSuccess(c, result.applications, "Applications fetched", {
        total: result.total,
        page: result.page,
        limit: result.limit,
      });
    } catch (err) {
      return sendError(c, "LIST_ERROR", getErrorMessage(err), 500);
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
    } catch (err) {
      return sendError(c, "DB_ERROR", getErrorMessage(err), 500);
    }
  }
}

export const applicationsController = new ApplicationsController();
