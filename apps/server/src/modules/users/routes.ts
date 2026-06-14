import { Hono } from "hono";
import { usersController } from "./controllers/users.controller.js";
import roleManagementRouter from "./controllers/role-management.controller.js";
import { requireAuth, requireRole } from "../../middleware/auth.middleware.js";

const usersRouter = new Hono();

// Authenticated user profile
usersRouter.get("/me", requireAuth, (c) => usersController.getProfile(c));
usersRouter.put("/me", requireAuth, (c) => usersController.updateProfile(c));

// Saved jobs
usersRouter.post("/me/saved-jobs", requireAuth, (c) => usersController.saveJob(c));
usersRouter.delete("/me/saved-jobs/:jobId", requireAuth, (c) => usersController.unsaveJob(c));

// Role management routes
usersRouter.route("/", roleManagementRouter);

// Admin routes (legacy - can be migrated to role management)
usersRouter.get(
  "/list",
  requireAuth,
  requireRole(["admin", "super_admin"]),
  (c) => usersController.listUsers(c)
);

usersRouter.delete(
  "/:id",
  requireAuth,
  requireRole(["admin", "super_admin"]),
  (c) => usersController.deleteUser(c)
);

export default usersRouter;
