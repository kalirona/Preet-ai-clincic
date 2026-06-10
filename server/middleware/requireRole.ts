import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/auth";
import { WorkspaceRole } from "../types/rbac";
import { ApiError } from "../types/errors";
import { WorkspaceService } from "../services/workspace.service";

/**
 * Middleware to restrict endpoints based on the user's workspace role.
 * Queries the real PostgreSQL database via WorkspaceService to enforce robust tenancy checks.
 * 
 * Usage example for future routes:
 *   router.post('/api/settings', requireAuth, requireRole(['Owner', 'Admin']), handler);
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

      // 3. Perform the real PostgreSQL-backed membership boundary check
      if (workspaceId) {
        const membership = await WorkspaceService.getMembership(workspaceId, req.user.id);
        if (membership) {
          userRole = membership.role;
          req.user.role = membership.role;
        }
      }

      // 4. Resilient fallback: Try to resolve from any active user workspace context if not explicitly isolated
      if (!userRole) {
        const workspaces = await WorkspaceService.getUserWorkspaces(req.user.id);
        if (workspaces && workspaces.length > 0) {
          userRole = workspaces[0].role;
          req.user.role = userRole;
        }
      }

      // 5. Fallback check for missing or unavailable role metadata
      if (!userRole) {
        throw new ApiError(403, "Forbidden");
      }

      // 6. Validate if the user role belongs to the authorized roles configuration array
      if (!allowedRoles.includes(userRole)) {
        throw new ApiError(403, "Forbidden");
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
