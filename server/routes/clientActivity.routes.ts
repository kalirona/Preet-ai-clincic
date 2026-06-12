import { Router, Response, NextFunction } from "express";
import { clientRateLimiter } from "../middleware/rateLimiters";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { validateRequest } from "../middleware/validateRequest";
import { AuthenticatedRequest } from "../types/auth";
import { ApiError } from "../types/errors";
import { createClientActivitySchema } from "../validators/clientActivity.validator";
import { ClientActivityService } from "../services/clientActivity.service";
import { ClientService } from "../services/client.service";

const router = Router();

/**
 * Helper to extract and validate workspace boundary context from several input channels.
 * Prevents execution if a valid organizational tenant boundary is not supplied.
 */
import { getWorkspaceId } from "../utils/workspace";

// GET /api/clients/:clientId/activities - Retrieves timeline of activities for an isolated client contact
router.get(
  "/api/clients/:clientId/activities",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const clientId = req.params.clientId;

      // 1. Verify client existence and strict matching inside client's active tenant boundary
      const client = await ClientService.getClientById(clientId, workspaceId);
      if (!client) {
        throw new ApiError(404, "Client not found in this workspace.");
      }

      // 2. Fetch scoped timeline activities
      const activities = await ClientActivityService.getActivities(workspaceId, clientId);
      res.json(activities);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/clients/:clientId/activities - Appends a recorded action/note context to a client timeline
router.post(
  "/api/clients/:clientId/activities",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  validateRequest(createClientActivitySchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const clientId = req.params.clientId;

      // 1. Ensure the parent client target exists and belongs strictly to this workspace
      const client = await ClientService.getClientById(clientId, workspaceId);
      if (!client) {
        throw new ApiError(404, "Client not found in this workspace.");
      }

      // 2. Format database payload associating the authenticated user's id
      const payload = {
        type: req.body.type,
        title: req.body.title,
        description: req.body.description,
        metadata: req.body.metadata,
        createdBy: req.user?.id,
      };

      const newActivity = await ClientActivityService.createActivity(workspaceId, clientId, payload);
      res.status(201).json(newActivity);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/activities/:id - Safely purges an activity record from the timeline archive
router.delete(
  "/api/activities/:id",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const activityId = req.params.id;

      // Perform cross-tenant boundary verification and safely execute deletion in single step
      await ClientActivityService.deleteActivity(activityId, workspaceId);
      res.json({ success: true, message: "Activity successfully removed." });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
