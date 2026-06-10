import { Router, Response, NextFunction } from "express";
import { clientRateLimiter } from "../middleware/rateLimiters";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { AuthenticatedRequest } from "../types/auth";
import { ApiError } from "../types/errors";
import { ApiKeyService } from "../services/apiKey.service";
import { AuditLogService } from "../services/auditLog.service";

const router = Router();

const getWorkspaceId = (req: AuthenticatedRequest): string => {
  const wsId =
    (req.headers["x-workspace-id"] as string) ||
    (req.body?.workspaceId as string) ||
    (req.query?.workspaceId as string) ||
    "1";
  return wsId;
};

// GET /api/api-keys - List active workspace api keys
router.get(
  "/",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const keys = await ApiKeyService.getApiKeys(workspaceId);
      // Strip actual secret key strings apart from returning masks for security list display
      const listData = keys.map(k => ({
        id: k.id,
        name: k.name,
        prefix: k.prefix,
        scopes: k.scopes,
        expiresAt: k.expiresAt,
        createdAt: k.createdAt,
        lastUsedAt: k.lastUsedAt,
        mask: `${k.prefix}••••••••••••${k.secretKey.slice(-4)}`
      }));
      res.json(listData);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/api-keys - Creates a brand new API key
router.post(
  "/",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const { name, scopes, expiresDays } = req.body;

      if (!name) {
        throw new ApiError(400, "Please provide a name descriptor for this integration API token.");
      }

      const verifiedScopes = Array.isArray(scopes) ? scopes : ["clients:read"];
      const durationDays = typeof expiresDays === "number" ? expiresDays : 90;

      const createdKey = await ApiKeyService.createApiKey(workspaceId, {
        name,
        scopes: verifiedScopes,
        expiresDays: durationDays
      });

      await AuditLogService.createLog({
        workspaceId,
        userId: (req as any).user?.id,
        action: `Generated key name [${name}] with scopes [${verifiedScopes.join(", ")}].`,
        entityType: "System",
        entityId: createdKey.id
      });

      res.status(201).json({
        success: true,
        message: "API Key compiled and deployed. Store the secret token securely as it won't be shown again.",
        apiKey: createdKey
      });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/api-keys/:id - Revokes/inactivates an API key
router.delete(
  "/:id",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const keyId = req.params.id;

      await ApiKeyService.revokeApiKey(workspaceId, keyId);

      await AuditLogService.createLog({
        workspaceId,
        userId: (req as any).user?.id,
        action: `Revoked integration API Key with ID: ${keyId}`,
        entityType: "System",
        entityId: keyId
      });

      res.json({
        success: true,
        message: "API key successfully revoked from workspace boundary registers."
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
