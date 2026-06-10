import { Router, Response, NextFunction } from "express";
import { clientRateLimiter } from "../middleware/rateLimiters";
import { requireAuth } from "../middleware/requireAuth";
import { AuthenticatedRequest } from "../types/auth";
import { ApiError } from "../types/errors";
import { WebhookService } from "../services/webhook.service";
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

// POST /api/payments/complete - Internal UI checkout triggers webhook
router.post(
  "/complete",
  clientRateLimiter,
  requireAuth as any,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const { transactionId, planName, amount, gateway, email } = req.body;

      if (!transactionId || !planName) {
        throw new ApiError(400, "transactionId and planName are required.");
      }

      const txRecord = {
        transactionId,
        amount: amount || "$0.00",
        status: "Paid",
        method: gateway === "paypal" ? `PayPal (${email || "user@example.com"})` : "Visa ending 4242",
        planName,
        timestamp: new Date().toISOString()
      };

      // Dispatch Webhook Event
      WebhookService.triggerEvent(workspaceId, "payment.completed", txRecord);

      // Audit Log
      await AuditLogService.createLog({
        workspaceId,
        userId: (req as any).user?.id || "system",
        action: `Billing updated: Subscribed to "${planName}" tier (${amount}/mo) via ${gateway || "Stripe"}`,
        entityType: "Billing",
        entityId: transactionId
      });

      res.status(201).json({
        success: true,
        message: "Payment completion registered, event dispatched to Webhooks.",
        transaction: txRecord
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
