import { Hono } from "hono";
import { companiesController } from "./controllers/companies.controller.js";
import { requireAuth, requireRole } from "../../middleware/auth.middleware.js";

const companiesRouter = new Hono();

// Public
companiesRouter.get("/", (c) => companiesController.list(c));
companiesRouter.get("/slug/:slug", (c) => companiesController.getBySlug(c));
companiesRouter.get("/:id", (c) => companiesController.getById(c));

// Protected
companiesRouter.post(
  "/",
  requireAuth,
  requireRole(["recruiter", "admin", "super_admin"]),
  (c) => companiesController.create(c)
);

companiesRouter.put(
  "/:id",
  requireAuth,
  requireRole(["recruiter", "admin", "super_admin"]),
  (c) => companiesController.update(c)
);

companiesRouter.delete(
  "/:id",
  requireAuth,
  requireRole(["admin", "super_admin"]),
  (c) => companiesController.delete(c)
);

export default companiesRouter;
