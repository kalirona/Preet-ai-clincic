import { Router, Response, NextFunction } from "express";
import { notificationRateLimiter } from "../middleware/rateLimiters";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { validateRequest } from "../middleware/validateRequest";
import { AuthenticatedRequest } from "../types/auth";
import { ApiError } from "../types/errors";
import { createNotificationSchema, updateNotificationStatusSchema } from "../validators/notification.validator";
import { NotificationService } from "../services/notification.service";
import { AppointmentService } from "../services/appointment.service";
import { ClientService } from "../services/client.service";
import { NotificationStatus } from "../types/notification";
import { globalQueue } from "../queues/queue";

const router = Router();

/**
 * Extracts and confirms workspace identifier across various request headers or body properties.
 */
import { getWorkspaceId } from "../utils/workspace";

// GET /api/notifications - Retrieves all notifications inside a tenant workspace
router.get(
  "/",
  notificationRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const appointmentId = req.query.appointmentId as string | undefined;
      const status = req.query.status as NotificationStatus | undefined;

      const notifications = await NotificationService.getWorkspaceNotifications(workspaceId, {
        appointmentId,
        status,
      });

      res.json(notifications);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/notifications/:id - Retrieve detail context for a single isolated scheduled notification
router.get(
  "/:id",
  notificationRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const id = req.params.id;

      const notification = await NotificationService.getNotificationById(id, workspaceId);
      if (!notification) {
        throw new ApiError(404, "Notification schedule not found in this workspace.");
      }

      res.json(notification);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/notifications - Create / queue a new background notification
router.post(
  "/",
  notificationRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  validateRequest(createNotificationSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const { appointmentId, clientId, type, channel, scheduledFor } = req.body;

      // Affirm appointment existence and multi-tenant mapping bounds safely
      const appointment = await AppointmentService.getAppointmentById(appointmentId, workspaceId);
      if (!appointment) {
        throw new ApiError(404, "Referenced appointment does not exist in this workspace.");
      }

      // Affirm client existence and multi-tenant mapping bounds safely
      const client = await ClientService.getClientById(clientId, workspaceId);
      if (!client) {
        throw new ApiError(404, "Referenced client contact representation not found in this workspace.");
      }

      const newNotification = await NotificationService.createNotification(workspaceId, {
        appointmentId,
        clientId,
        type,
        channel,
        scheduledFor,
      });

      res.status(201).json(newNotification);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/notifications/:id - Set / update progress or result details of a queued item
router.put(
  "/:id",
  notificationRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  validateRequest(updateNotificationStatusSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const id = req.params.id;
      const { status, errorMessage, sentAt } = req.body;

      const notification = await NotificationService.getNotificationById(id, workspaceId);
      if (!notification) {
        throw new ApiError(404, "Notification schedule not found in this workspace.");
      }

      const updated = await NotificationService.updateNotificationStatus(id, workspaceId, {
        status,
        errorMessage,
        sentAt,
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/notifications/:id - Purge / abort a scheduled pending notification safely
router.delete(
  "/:id",
  notificationRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const id = req.params.id;

      const notification = await NotificationService.getNotificationById(id, workspaceId);
      if (!notification) {
        throw new ApiError(404, "Notification schedule not found in this workspace.");
      }

      await NotificationService.deleteNotification(id, workspaceId);
      res.json({ success: true, message: "Notification scheduled flow successfully revoked." });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/notifications/process-due - Dispatches any due pending notifications via the background queue
router.post(
  "/process-due",
  notificationRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Dispatch immediately to background queue which runs processDueReminders() decoupled from request handler
      const result = await globalQueue.enqueueAndWait("reminder_tick", {});
      res.json({ success: true, message: "Due reminders processing executed via queue.", result });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
