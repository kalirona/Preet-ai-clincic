import { Router, Response, NextFunction } from "express";
import { clientRateLimiter } from "../middleware/rateLimiters";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { AuthenticatedRequest } from "../types/auth";
import { ApiError } from "../types/errors";
import { WebhookService } from "../services/webhook.service";
import { AuditLogService } from "../services/auditLog.service";

import { getWorkspaceIdLenient } from "../utils/workspace";

const router = Router();

// GET /api/webhooks - List active subscriptions
router.get(
  "/",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceIdLenient(req);
      const subs = await WebhookService.getSubscriptions(workspaceId);
      res.json(subs);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/webhooks - Subscribe to a webhook
router.post(
  "/",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceIdLenient(req);
      const { url, events } = req.body;

      if (!url) {
        throw new ApiError(400, "Webhook endpoint URL is required.");
      }

      const verifiedEvents = Array.isArray(events) ? events : ["client.created"];
      const sub = await WebhookService.createSubscription(workspaceId, url, verifiedEvents);

      // Record audit history
      await AuditLogService.createLog({
        workspaceId,
        userId: (req as any).user?.id || "system",
        action: `Subscribed webhook URL [${url}] to events [${verifiedEvents.join(", ")}]`,
        entityType: "System",
        entityId: sub.id
      });

      res.status(201).json({
        success: true,
        message: "Webhook successfully registered and verified.",
        subscription: sub
      });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/webhooks/:id - Cancel/Unsubscribe a webhook endpoint
router.delete(
  "/:id",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceIdLenient(req);
      const subId = req.params.id;

      await WebhookService.deleteSubscription(workspaceId, subId);

      await AuditLogService.createLog({
        workspaceId,
        userId: (req as any).user?.id || "system",
        action: `Deregistered webhook subscription ID [${subId}]`,
        entityType: "System",
        entityId: subId
      });

      res.json({
        success: true,
        message: "Webhook channel successfully removed and state scrubbed."
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/webhooks/test/:id - Send a simulated testing ping to checking webhooks connections
router.post(
  "/test/:id",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceIdLenient(req);
      const subId = req.params.id;
      const { testEvent } = req.body;

      const matchedEvent = testEvent || "client.created";
      const subs = await WebhookService.getSubscriptions(workspaceId);
      const sub = subs.find(s => s.id === subId);

      if (!sub) {
        throw new ApiError(404, "Target active subscription registry does not exist.");
      }

      // Generate realistic debug payload
      const mockPayload = {
        samplePing: true,
        testMode: true,
        registeredUrl: sub.url,
        triggeredBy: (req as any).user?.email || "owner@saas-workspace.com",
        simulatedEntity: {
          id: `sim_${Math.random().toString(36).substr(2, 6)}`,
          firstName: "Johnathan",
          lastName: "Doe (Test Hook)",
          email: "john.doe.webhook.test@example.com",
          phone: "+1 (555) 019-2831",
          notes: "Dynamically generated diagnostics verification test payload."
        }
      };

      // Asynchronous dispatch
      WebhookService.triggerEvent(workspaceId, matchedEvent, mockPayload);

      res.json({
        success: true,
        message: `Simulated ping container for event '${matchedEvent}' placed in network queue targeting [${sub.url}]`
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
