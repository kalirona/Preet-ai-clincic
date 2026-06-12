import { Router, Response, NextFunction } from "express";
import { clientRateLimiter } from "../middleware/rateLimiters";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { validateRequest } from "../middleware/validateRequest";
import { AuthenticatedRequest } from "../types/auth";
import { ApiError } from "../types/errors";
import { AuditLogService } from "../services/auditLog.service";
import { createAuditLogSchema } from "../validators/auditLog.validator";

const router = Router();

/**
 * Helper to extract and validate workspace boundary context from several input channels.
 */
import { getWorkspaceId } from "../utils/workspace";

// GET /api/audit-logs - Fetch audit and event logs for the workspace
router.get(
  "/",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const entityType = req.query.entityType as string | undefined;
      const search = req.query.search as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const logs = await AuditLogService.getLogs(workspaceId, {
        entityType,
        search,
        limit,
      });

      res.json(logs);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/audit-logs - Manually write audit logs from specific front-end/workflow events (e.g. Billing updated)
router.post(
  "/",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  validateRequest(createAuditLogSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const { action, entityType, entityId } = req.body;
      const userId = req.user?.id;
      const ipAddress = (req.headers["x-forwarded-for"] as string) || req.ip;
      const userAgent = req.headers["user-agent"];

      const log = await AuditLogService.createLog({
        workspaceId,
        userId,
        action,
        entityType,
        entityId,
        ipAddress,
        userAgent,
      });

      if (!log) {
        throw new ApiError(500, "Failed to register audit log in the database database_");
      }

      res.status(201).json(log);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
