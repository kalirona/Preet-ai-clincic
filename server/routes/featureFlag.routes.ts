import { Router, Response, NextFunction } from "express";
import { clientRateLimiter } from "../middleware/rateLimiters";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { AuthenticatedRequest } from "../types/auth";
import { ApiError } from "../types/errors";
import { FeatureFlagService } from "../services/featureFlag.service";
import { AuditLogService } from "../services/auditLog.service";

import { getWorkspaceId } from "../utils/workspace";

const router = Router();

// GET /api/feature-flags - List feature flags for the requested workspaceId
router.get(
  "/",
  clientRateLimiter,
  requireAuth as any,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const flags = await FeatureFlagService.getFeatureFlags(workspaceId);
      res.json(flags);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/feature-flags/toggle - Update/toggle a specific flag state
router.post(
  "/toggle",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const { flagKey, isEnabled } = req.body;

      if (!flagKey) {
        throw new ApiError(400, "flagKey parameter identifier is required.");
      }

      const updated = await FeatureFlagService.updateFeatureFlag(workspaceId, flagKey, !!isEnabled);

      // Log in AuditLog
      await AuditLogService.createLog({
        workspaceId,
        userId: (req as any).user?.id,
        action: `Toggled feature flag [${flagKey}] to [${!!isEnabled ? "ENABLED" : "DISABLED"}].`,
        entityType: "System",
        entityId: flagKey
      });

      res.json({
        success: true,
        message: `Successfully configured state for feature: ${flagKey}`,
        flag: updated
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
