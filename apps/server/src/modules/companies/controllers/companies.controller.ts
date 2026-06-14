import type { Context } from "hono";
import { companiesService } from "../services/companies.service.js";
import { createCompanySchema, updateCompanySchema } from "../dto/companies.dto.js";
import { sendSuccess, sendError } from "../../../lib/response.js";

export class CompaniesController {
  async list(c: Context) {
    try {
      const page = Number(c.req.query("page")) || 1;
      const limit = Number(c.req.query("limit")) || 20;
      const result = await companiesService.list(page, limit);
      return sendSuccess(c, result.companies, "Companies fetched", {
        total: result.total,
        page: result.page,
        limit: result.limit,
      });
    } catch (err: any) {
      return sendError(c, "LIST_ERROR", err.message, 500);
    }
  }

  async getById(c: Context) {
    try {
      const id = c.req.param("id");
      if (!id) return sendError(c, "VALIDATION_ERROR", "Company ID is required", 400);
      const company = await companiesService.getById(id);
      if (!company) return sendError(c, "NOT_FOUND", "Company not found", 404);
      return sendSuccess(c, company, "Company fetched");
    } catch (err: any) {
      return sendError(c, "DB_ERROR", err.message, 500);
    }
  }

  async getBySlug(c: Context) {
    try {
      const slug = c.req.param("slug");
      if (!slug) return sendError(c, "VALIDATION_ERROR", "Company slug is required", 400);
      const company = await companiesService.getBySlug(slug);
      if (!company) return sendError(c, "NOT_FOUND", "Company not found", 404);
      return sendSuccess(c, company, "Company fetched");
    } catch (err: any) {
      return sendError(c, "DB_ERROR", err.message, 500);
    }
  }

  async create(c: Context) {
    try {
      const user = c.get("user");
      const body = await c.req.json();
      const parsed = createCompanySchema.safeParse(body);
      if (!parsed.success) return sendError(c, "VALIDATION_ERROR", parsed.error.message, 400);

      const company = await companiesService.create(parsed.data, user.id);
      return sendSuccess(c, company, "Company registered successfully", undefined, 201);
    } catch (err: any) {
      return sendError(c, "CREATE_ERROR", err.message, 500);
    }
  }

  async update(c: Context) {
    try {
      const id = c.req.param("id");
      if (!id) return sendError(c, "VALIDATION_ERROR", "Company ID is required", 400);
      const body = await c.req.json();
      const parsed = updateCompanySchema.safeParse(body);
      if (!parsed.success) return sendError(c, "VALIDATION_ERROR", parsed.error.message, 400);

      const company = await companiesService.update(id, parsed.data);
      return sendSuccess(c, company, "Company updated");
    } catch (err: any) {
      return sendError(c, "UPDATE_ERROR", err.message, 500);
    }
  }

  async delete(c: Context) {
    try {
      const id = c.req.param("id");
      if (!id) return sendError(c, "VALIDATION_ERROR", "Company ID is required", 400);
      await companiesService.delete(id);
      return sendSuccess(c, null, "Company deleted");
    } catch (err: any) {
      return sendError(c, "DELETE_ERROR", err.message, 500);
    }
  }
}

export const companiesController = new CompaniesController();
