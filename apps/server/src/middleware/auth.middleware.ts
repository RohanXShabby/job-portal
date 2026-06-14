import { auth, rolePermissions, type Permission } from "@job-portal/auth";
import type { MiddlewareHandler } from "hono";
import { sendError } from "../lib/response.js";

export interface AuthContext {
  Variables: {
    user: {
      id: string;
      name: string;
      email: string;
      emailVerified: boolean;
      image?: string;
      role: "super_admin" | "admin" | "recruiter" | "candidate";
    };
    session: {
      id: string;
      userId: string;
      expiresAt: Date;
    };
  };
}

/**
 * Authentication Middleware
 * Populates context with user and session from Better Auth
 */
export const requireAuth: MiddlewareHandler<AuthContext> = async (c, next) => {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session || !session.session || !session.user) {
      return sendError(c, "UNAUTHORIZED", "Sign in required to access this resource", 401);
    }

    c.set("session", session.session as any);
    c.set("user", session.user as any);

    await next();
  } catch (error: any) {
    console.error("Auth middleware error:", error);
    return sendError(c, "INTERNAL_ERROR", "Authentication error", 500);
  }
};

/**
 * Role-Based Access Control Middleware
 */
export function requireRole(allowedRoles: ("super_admin" | "admin" | "recruiter" | "candidate")[]): MiddlewareHandler<AuthContext> {
  return async (c, next) => {
    const user = c.get("user");

    if (!user) {
      return sendError(c, "UNAUTHORIZED", "Sign in required to access this resource", 401);
    }

    if (!allowedRoles.includes(user.role)) {
      return sendError(
        c,
        "FORBIDDEN",
        `Access denied. Role "${user.role}" does not have permission.`,
        403
      );
    }

    await next();
  };
}

/**
 * Permission-Based Authorization Middleware
 * Checks if user has specific permission based on their role
 */
export function requirePermission(requiredPermission: Permission): MiddlewareHandler<AuthContext> {
  return async (c, next) => {
    const user = c.get("user");

    if (!user) {
      return sendError(c, "UNAUTHORIZED", "Sign in required to access this resource", 401);
    }

    const userPermissions = rolePermissions[user.role] || [];

    if (!userPermissions.includes(requiredPermission)) {
      return sendError(
        c,
        "FORBIDDEN",
        `Access denied. Permission "${requiredPermission}" is required.`,
        403
      );
    }

    await next();
  };
}

/**
 * Multiple Permissions Middleware
 * Checks if user has ANY of the required permissions (OR logic)
 */
export function requireAnyPermission(requiredPermissions: Permission[]): MiddlewareHandler<AuthContext> {
  return async (c, next) => {
    const user = c.get("user");

    if (!user) {
      return sendError(c, "UNAUTHORIZED", "Sign in required to access this resource", 401);
    }

    const userPermissions = rolePermissions[user.role] || [];
    const hasPermission = requiredPermissions.some(perm => userPermissions.includes(perm));

    if (!hasPermission) {
      return sendError(
        c,
        "FORBIDDEN",
        `Access denied. One of these permissions is required: ${requiredPermissions.join(", ")}`,
        403
      );
    }

    await next();
  };
}

/**
 * All Permissions Middleware
 * Checks if user has ALL of the required permissions (AND logic)
 */
export function requireAllPermissions(requiredPermissions: Permission[]): MiddlewareHandler<AuthContext> {
  return async (c, next) => {
    const user = c.get("user");

    if (!user) {
      return sendError(c, "UNAUTHORIZED", "Sign in required to access this resource", 401);
    }

    const userPermissions = rolePermissions[user.role] || [];
    const hasAllPermissions = requiredPermissions.every(perm => userPermissions.includes(perm));

    if (!hasAllPermissions) {
      return sendError(
        c,
        "FORBIDDEN",
        `Access denied. All these permissions are required: ${requiredPermissions.join(", ")}`,
        403
      );
    }

    await next();
  };
}

/**
 * Resource Ownership Middleware
 * Checks if user owns the resource they're trying to access
 */
export function requireOwnership(getResourceId: (c: any) => string): MiddlewareHandler<AuthContext> {
  return async (c, next) => {
    const user = c.get("user");

    if (!user) {
      return sendError(c, "UNAUTHORIZED", "Sign in required to access this resource", 401);
    }

    const resourceId = getResourceId(c);

    // Super admins can access any resource
    if (user.role === "super_admin") {
      await next();
      return;
    }

    // Check if user owns the resource
    // This would need to be implemented based on your specific resource model
    // For now, we'll assume the resource has a userId field
    // const resource = await ResourceModel.findById(resourceId);
    // if (resource.userId !== user.id) {
    //   return sendError(c, "FORBIDDEN", "You do not have permission to access this resource", 403);
    // }

    // Placeholder for ownership check
    console.log(`[Ownership Check] User ${user.id} accessing resource ${resourceId}`);

    await next();
  };
}
