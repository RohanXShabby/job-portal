import { Hono } from "hono";
import { jobsController } from "./controllers/jobs.controller.js";
import { requireAuth, requireRole } from "../../middleware/auth.middleware.js";

const jobsRouter = new Hono();

// Public routes
jobsRouter.get("/", (c) => jobsController.search(c));
jobsRouter.get("/:id", (c) => jobsController.getById(c));

// Protected routes (Recruiter / Admin only)
jobsRouter.post(
  "/",
  requireAuth,
  requireRole("recruiter", "super_admin"),
  (c) => jobsController.create(c)
);

jobsRouter.put(
  "/:id",
  requireAuth,
  requireRole("recruiter", "super_admin"),
  (c) => jobsController.update(c)
);

jobsRouter.delete(
  "/:id",
  requireAuth,
  requireRole("recruiter", "super_admin"),
  (c) => jobsController.delete(c)
);

jobsRouter.post("/:id/apply", requireAuth, requireRole("candidate"), (c) =>
  jobsController.apply(c)
);

jobsRouter.get(
  "/:id/applications",
  requireAuth,
  requireRole("recruiter", "super_admin"),
  (c) => jobsController.listApplications(c)
);

jobsRouter.patch(
  "/:id/applications/:appId",
  requireAuth,
  requireRole("recruiter", "super_admin"),
  (c) => jobsController.updateApplicationStatus(c)
);

export default jobsRouter;
