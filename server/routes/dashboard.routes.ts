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
import { getWorkspaceId } from "../utils/workspace";

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
      const workspaceId = await getWorkspaceId(req);
      const metrics = await DashboardService.getMetrics(workspaceId);
      res.json(metrics);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
