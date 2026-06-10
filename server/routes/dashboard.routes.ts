import { Router, Response, NextFunction } from "express";
import { dashboardRateLimiter } from "../middleware/rateLimiters";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { AuthenticatedRequest } from "../types/auth";
import { ApiError } from "../types/errors";
import { DashboardService } from "../services/dashboard.service";

const router = Router();

/**
 * Extracts and validates workspace identifier from multiple input channels.
 */
const getWorkspaceId = (req: AuthenticatedRequest): string => {
  const wsId =
    (req.headers["x-workspace-id"] as string) ||
    (req.body?.workspaceId as string) ||
    (req.body?.workspace_id as string) ||
    (req.query?.workspaceId as string) ||
    (req.query?.workspace_id as string);

  if (!wsId) {
    throw new ApiError(400, "Workspace context is required. Execute with a valid 'x-workspace-id' header or query parameter.");
  }
  return wsId;
};

/**
 * GET /api/dashboard
 * Retrieves comprehensive analytics aggregates for the current tenant workspace boundary.
 */
router.get(
  "/",
  dashboardRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const metrics = await DashboardService.getMetrics(workspaceId);
      res.json(metrics);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
