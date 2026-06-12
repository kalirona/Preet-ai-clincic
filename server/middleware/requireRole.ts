import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/auth";
import { WorkspaceRole } from "../types/rbac";
import { ApiError } from "../types/errors";
import { WorkspaceService } from "../services/workspace.service";

// M6: In-memory TTL cache for membership lookups (60 second TTL)
const membershipCache = new Map<string, { role: WorkspaceRole; expiresAt: number }>();
const CACHE_TTL_MS = 60_000;

function getCachedMembership(workspaceId: string, userId: string): WorkspaceRole | undefined {
  const key = `${workspaceId}:${userId}`;
  const entry = membershipCache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    membershipCache.delete(key);
    return undefined;
  }
  return entry.role;
}

function setCachedMembership(workspaceId: string, userId: string, role: WorkspaceRole): void {
  const key = `${workspaceId}:${userId}`;
  membershipCache.set(key, { role, expiresAt: Date.now() + CACHE_TTL_MS });
}

/**
 * Invalidate cached membership for a user in a workspace.
 * Call after role changes to prevent stale permissions.
 */
export function invalidateMembershipCache(workspaceId: string, userId: string): void {
  const key = `${workspaceId}:${userId}`;
  membershipCache.delete(key);
}

/**
 * Invalidate all cached memberships for a workspace.
 * Call after bulk role changes.
 */
export function invalidateWorkspaceMembershipCache(workspaceId: string): void {
  for (const key of membershipCache.keys()) {
    if (key.startsWith(`${workspaceId}:`)) {
      membershipCache.delete(key);
    }
  }
}

/**
 * Middleware to restrict endpoints based on the user's workspace role.
 * Queries the real PostgreSQL database via WorkspaceService to enforce robust tenancy checks.
 */
export const requireRole = (allowedRoles: WorkspaceRole[]) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // 1. Ensure user authentication details are populated in this request context
      if (!req.user) {
        throw new ApiError(401, "Unauthorized");
      }

      // 2. Extract workspace boundary identifier from all viable transport channels
      const workspaceId =
        (req.headers["x-workspace-id"] as string) ||
        (req.body?.workspaceId as string) ||
        (req.body?.workspace_id as string) ||
        (req.query?.workspaceId as string) ||
        (req.query?.workspace_id as string) ||
        (req.params?.workspaceId as string) ||
        (req.params?.workspace_id as string);

      let userRole = req.user.role;

      // 3. Perform the real PostgreSQL-backed membership boundary check (with cache)
      if (workspaceId) {
        const cachedRole = getCachedMembership(workspaceId, req.user.id);
        if (cachedRole) {
          userRole = cachedRole;
          req.user.role = cachedRole;
        } else {
          const membership = await WorkspaceService.getMembership(workspaceId, req.user.id);
          if (membership) {
            userRole = membership.role;
            req.user.role = membership.role;
            setCachedMembership(workspaceId, req.user.id, membership.role);
          }
        }
      }

      // 4. NO FALLBACK: Require explicit workspace context
      if (!userRole || !workspaceId) {
        throw new ApiError(403, "Forbidden: workspace context required.");
      }

      // 5. Validate if the user role belongs to the authorized roles configuration array
      if (!allowedRoles.includes(userRole)) {
        throw new ApiError(403, "Forbidden");
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
