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
  requireRole(["recruiter", "admin", "super_admin"]),
  (c) => jobsController.create(c)
);

jobsRouter.put(
  "/:id",
  requireAuth,
  requireRole(["recruiter", "admin", "super_admin"]),
  (c) => jobsController.update(c)
);

jobsRouter.delete(
  "/:id",
  requireAuth,
  requireRole(["recruiter", "admin", "super_admin"]),
  (c) => jobsController.delete(c)
);

export default jobsRouter;
