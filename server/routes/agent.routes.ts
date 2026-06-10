import { Router, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { validateRequest } from "../middleware/validateRequest";
import { AuthenticatedRequest } from "../types/auth";
import { ApiError } from "../types/errors";
import { AgentService } from "../services/agent.service";
import { AuditLogService } from "../services/auditLog.service";
import { getWorkspaceId } from "../utils/workspace";
import { createAgentSchema, updateAgentSchema } from "../validators/agent.validator";

const router = Router();

// GET / - List all agents
router.get(
  "/",
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const agents = await AgentService.getAll(workspaceId);
      res.json(agents);
    } catch (err) {
      next(err);
    }
  }
);

// GET /:id - Get agent by ID
router.get(
  "/:id",
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const agent = await AgentService.getById(req.params.id, workspaceId);
      if (!agent) throw new ApiError(404, "Agent not found.");
      res.json(agent);
    } catch (err) {
      next(err);
    }
  }
);

// POST / - Create agent
router.post(
  "/",
  requireAuth as any,
  requireRole(["Owner", "Admin"]),
  validateRequest(createAgentSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const agent = await AgentService.create(workspaceId, req.body);
      await AuditLogService.createLog({
        workspaceId,
        userId: req.user?.id,
        action: `Created AI agent: ${agent.name}`,
        entityType: "AIAgent",
        entityId: agent.id,
        ipAddress: (req.headers["x-forwarded-for"] as string) || req.ip,
        userAgent: req.headers["user-agent"],
      });
      res.status(201).json(agent);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /:id - Update agent
router.put(
  "/:id",
  requireAuth as any,
  requireRole(["Owner", "Admin"]),
  validateRequest(updateAgentSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const agent = await AgentService.update(req.params.id, workspaceId, req.body);
      if (!agent) throw new ApiError(404, "Agent not found.");
      await AuditLogService.createLog({
        workspaceId,
        userId: req.user?.id,
        action: `Updated AI agent: ${agent.name}`,
        entityType: "AIAgent",
        entityId: agent.id,
        ipAddress: (req.headers["x-forwarded-for"] as string) || req.ip,
        userAgent: req.headers["user-agent"],
      });
      res.json(agent);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /:id - Delete agent
router.delete(
  "/:id",
  requireAuth as any,
  requireRole(["Owner", "Admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const agent = await AgentService.getById(req.params.id, workspaceId);
      if (!agent) throw new ApiError(404, "Agent not found.");
      await AgentService.delete(req.params.id, workspaceId);
      await AuditLogService.createLog({
        workspaceId,
        userId: req.user?.id,
        action: `Deleted AI agent: ${agent.name}`,
        entityType: "AIAgent",
        entityId: agent.id,
        ipAddress: (req.headers["x-forwarded-for"] as string) || req.ip,
        userAgent: req.headers["user-agent"],
      });
      res.json({ success: true, message: "Agent deleted successfully." });
    } catch (err) {
      next(err);
    }
  }
);

// GET /:id/knowledge - List knowledge files
router.get(
  "/:id/knowledge",
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const files = await AgentService.getKnowledgeFiles(req.params.id, workspaceId);
      res.json(files);
    } catch (err) {
      next(err);
    }
  }
);

// POST /:id/knowledge - Add knowledge file
router.post(
  "/:id/knowledge",
  requireAuth as any,
  requireRole(["Owner", "Admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const agent = await AgentService.getById(req.params.id, workspaceId);
      if (!agent) throw new ApiError(404, "Agent not found.");
      const file = await AgentService.addKnowledgeFile(req.params.id, workspaceId, req.body);
      res.status(201).json(file);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /:id/knowledge/:fileId - Remove knowledge file
router.delete(
  "/:id/knowledge/:fileId",
  requireAuth as any,
  requireRole(["Owner", "Admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      await AgentService.deleteKnowledgeFile(req.params.fileId, workspaceId);
      res.json({ success: true, message: "Knowledge file removed." });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
