import { Hono } from "hono";
import { z } from "zod";
import { User } from "@job-portal/db";
import { requireAuth, requirePermission, type AuthContext } from "../../../middleware/auth.middleware.js";
import { sendSuccess, sendError } from "../../../lib/response.js";
import type { UserRole } from "@job-portal/auth";

const roleRouter = new Hono<AuthContext>();

// Apply authentication to all routes
roleRouter.use("*", requireAuth);

/**
 * GET /api/users/roles
 * Get all available roles and their permissions
 * Requires: manage_roles permission
 */
roleRouter.get("/roles", requirePermission("manage_roles"), async (c) => {
  try {
    const { rolePermissions } = await import("@job-portal/auth");

    const roles = Object.entries(rolePermissions).map(([role, permissions]) => ({
      role,
      permissions,
    }));

    return sendSuccess(c, { roles }, "Roles retrieved successfully");
  } catch (error) {
    console.error("[Get Roles Error]", error);
    return sendError(c, "INTERNAL_ERROR", "Failed to retrieve roles", 500);
  }
});

/**
 * GET /api/users/:userId/role
 * Get user's current role
 * Requires: manage_users permission
 */
roleRouter.get("/:userId/role", requirePermission("manage_users"), async (c) => {
  try {
    const userId = c.req.param("userId");

    const user = await User.findById(userId).select("role name email");

    if (!user) {
      return sendError(c, "NOT_FOUND", "User not found", 404);
    }

    return sendSuccess(c, {
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }, "User role retrieved successfully");
  } catch (error) {
    console.error("[Get User Role Error]", error);
    return sendError(c, "INTERNAL_ERROR", "Failed to retrieve user role", 500);
  }
});

/**
 * PUT /api/users/:userId/role
 * Update user's role
 * Requires: manage_roles permission
 */
roleRouter.put("/:userId/role", requirePermission("manage_roles"), async (c) => {
  try {
    const userId = c.req.param("userId");
    const body = await c.req.json();

    // Validate request body
    const schema = z.object({
      role: z.enum(["super_admin", "recruiter", "candidate"]),
    });

    const validation = schema.safeParse(body);
    if (!validation.success) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const errorMessage = validation.error?.issues?.[0]?.message ?? "Invalid request data";
      return sendError(c, "VALIDATION_ERROR", errorMessage, 400);
    }

    const { role } = validation.data;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return sendError(c, "NOT_FOUND", "User not found", 404);
    }

    // Prevent users from changing their own role
    const currentUser = c.get("user");
    if (currentUser.id === userId) {
      return sendError(c, "FORBIDDEN", "You cannot change your own role", 403);
    }

    // Update user role
    user.role = role;
    await user.save();

    return sendSuccess(c, {
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }, "User role updated successfully");
  } catch (error) {
    console.error("[Update User Role Error]", error);
    return sendError(c, "INTERNAL_ERROR", "Failed to update user role", 500);
  }
});

/**
 * GET /api/users
 * Get all users with their roles (paginated)
 * Requires: manage_users permission
 */
roleRouter.get("/", requirePermission("manage_users"), async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const role = c.req.query("role");
    const search = c.req.query("search");

    const skip = (page - 1) * limit;

    // Build query
    const query: {
      isDeleted: boolean;
      role?: UserRole;
      $or?: Array<Record<string, { $regex: string; $options: string }>>;
    } = { isDeleted: false };

    if (role === "super_admin" || role === "recruiter" || role === "candidate") {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("name email role emailVerified createdAt")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    return sendSuccess(c, {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, "Users retrieved successfully");
  } catch (error) {
    console.error("[Get Users Error]", error);
    return sendError(c, "INTERNAL_ERROR", "Failed to retrieve users", 500);
  }
});

/**
 * DELETE /api/users/:userId
 * Soft delete a user
 * Requires: manage_users permission
 */
roleRouter.delete("/:userId", requirePermission("manage_users"), async (c) => {
  try {
    const userId = c.req.param("userId");

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return sendError(c, "NOT_FOUND", "User not found", 404);
    }

    // Prevent users from deleting themselves
    const currentUser = c.get("user");
    if (currentUser.id === userId) {
      return sendError(c, "FORBIDDEN", "You cannot delete your own account", 403);
    }

    // Prevent deleting super admins (unless current user is also super admin)
    if (user.role === "super_admin" && currentUser.role !== "super_admin") {
      return sendError(c, "FORBIDDEN", "Cannot delete super admin accounts", 403);
    }

    // Soft delete
    user.isDeleted = true;
    await user.save();

    return sendSuccess(c, { userId }, "User deleted successfully");
  } catch (error) {
    console.error("[Delete User Error]", error);
    return sendError(c, "INTERNAL_ERROR", "Failed to delete user", 500);
  }
});

/**
 * GET /api/users/me
 * Get current user's profile and permissions
 */
roleRouter.get("/me", async (c) => {
  try {
    const user = c.get("user");
    const { rolePermissions } = await import("@job-portal/auth");

    const permissions = rolePermissions[user.role] || [];

    return sendSuccess(c, {
      user,
      permissions,
    }, "User profile retrieved successfully");
  } catch (error) {
    console.error("[Get Current User Error]", error);
    return sendError(c, "INTERNAL_ERROR", "Failed to retrieve user profile", 500);
  }
});

export default roleRouter;
