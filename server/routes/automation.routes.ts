import { Router, Response, NextFunction } from "express";
import { clientRateLimiter } from "../middleware/rateLimiters";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { validateRequest } from "../middleware/validateRequest";
import { AuthenticatedRequest } from "../types/auth";
import { ApiError } from "../types/errors";
import { 
  createAutomationSchema, 
  updateAutomationSchema,
  createTemplateSchema,
  updateTemplateSchema
} from "../validators/automation.validator";
import { AutomationService } from "../services/automation.service";
import { globalQueue } from "../queues/queue";

const router = Router();

/**
 * Extract workspace context from various channels.
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

// --- AUTOMATION TRIGGERS & RULES ---

// GET /api/automations - Retrieves all automations within workspace context
router.get(
  "/",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const list = await AutomationService.getAutomations(workspaceId);
      res.json(list);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/automations - Creates a new trigger automation rule (Owner/Admin roles)
router.post(
  "/",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin"]),
  validateRequest(createAutomationSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const rule = await AutomationService.createAutomation(workspaceId, req.body);
      res.status(201).json(rule);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/automations/:id - Updates fields of a trigger automation rule (Owner/Admin roles)
router.put(
  "/:id",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin"]),
  validateRequest(updateAutomationSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const updated = await AutomationService.updateAutomation(req.params.id, workspaceId, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/automations/:id - Delete a trigger automation rule (Owner/Admin roles)
router.delete(
  "/:id",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const success = await AutomationService.deleteAutomation(req.params.id, workspaceId);
      if (!success) {
        throw new ApiError(404, "Automation rule not found or unauthorized.");
      }
      res.json({ success: true, message: "Automation rule deleted successfully." });
    } catch (err) {
      next(err);
    }
  }
);

// --- EMAIL/SMS TEMPLATES ---

// GET /api/automations/templates - Retrieves all templates in workspace context
router.get(
  "/templates",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const list = await AutomationService.getTemplates(workspaceId);
      res.json(list);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/automations/templates - Creates a new template (Owner/Admin roles)
router.post(
  "/templates",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin"]),
  validateRequest(createTemplateSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const template = await AutomationService.createTemplate(workspaceId, req.body);
      res.status(201).json(template);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/automations/templates/:id - Updates a template by ID (Owner/Admin roles)
router.put(
  "/templates/:id",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin"]),
  validateRequest(updateTemplateSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const updated = await AutomationService.updateTemplate(req.params.id, workspaceId, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/automations/templates/:id - Deletes a template by ID (Owner/Admin roles)
router.delete(
  "/templates/:id",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const success = await AutomationService.deleteTemplate(req.params.id, workspaceId);
      if (!success) {
        throw new ApiError(404, "Template not found or unauthorized.");
      }
      res.json({ success: true, message: "Template deleted successfully." });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/automations/trigger - Enqueues automation execution in background queue
router.post(
  "/trigger",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const { triggerType, contextData } = req.body;
      
      if (!triggerType) {
        throw new ApiError(400, "triggerType parameter is required.");
      }

      const jobResult = await globalQueue.enqueueAndWait("automation_execute", {
        workspaceId,
        triggerType,
        contextData: contextData || {}
      });

      res.json({ success: true, message: "Automation workflow enqueued & executed in background.", data: jobResult });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
