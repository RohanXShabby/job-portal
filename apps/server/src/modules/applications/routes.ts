import { Hono } from "hono";
import { applicationsController } from "./controllers/applications.controller.js";
import { requireAuth, requireRole } from "../../middleware/auth.middleware.js";

const applicationsRouter = new Hono();

// Candidate applies for a job
applicationsRouter.post(
  "/",
  requireAuth,
  requireRole("candidate"),
  (c) => applicationsController.apply(c)
);

// Candidate views their own applications
applicationsRouter.get(
  "/me",
  requireAuth,
  requireRole("candidate"),
  (c) => applicationsController.myApplications(c)
);

applicationsRouter.get(
  "/all",
  requireAuth,
  requireRole("super_admin"),
  (c) => applicationsController.listAll(c)
);

// Recruiter/Admin lists applications for a job
applicationsRouter.get(
  "/",
  requireAuth,
  requireRole("recruiter", "super_admin"),
  (c) => applicationsController.listByJob(c)
);

// Get single application
applicationsRouter.get(
  "/:id",
  requireAuth,
  (c) => applicationsController.getById(c)
);

// Recruiter/Admin updates application status
applicationsRouter.patch(
  "/:id/status",
  requireAuth,
  requireRole("recruiter", "super_admin"),
  (c) => applicationsController.updateStatus(c)
);

export default applicationsRouter;
