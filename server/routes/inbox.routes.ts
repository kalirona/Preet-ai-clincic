import { Router, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { validateRequest } from "../middleware/validateRequest";
import { AuthenticatedRequest } from "../types/auth";
import { ApiError } from "../types/errors";
import { InboxService } from "../services/inbox.service";
import { getWorkspaceId } from "../utils/workspace";
import { sendMessageSchema, updateConversationSchema } from "../validators/agent.validator";

const router = Router();

// GET / - List conversations
router.get(
  "/",
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const { status, source, search, agentId } = req.query;
      const conversations = await InboxService.getConversations(workspaceId, {
        status: status as any,
        source: source as any,
        search: search as string,
        agentId: agentId as string,
      });
      res.json(conversations);
    } catch (err) {
      next(err);
    }
  }
);

// GET /stats - Conversation statistics
router.get(
  "/stats",
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const stats = await InboxService.getConversationStats(workspaceId);
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }
);

// GET /:id - Get conversation by ID
router.get(
  "/:id",
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const conversation = await InboxService.getConversationById(req.params.id, workspaceId);
      if (!conversation) throw new ApiError(404, "Conversation not found.");
      res.json(conversation);
    } catch (err) {
      next(err);
    }
  }
);

// GET /:id/messages - Get messages for a conversation
router.get(
  "/:id/messages",
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const messages = await InboxService.getMessages(req.params.id, workspaceId);
      res.json(messages);
    } catch (err) {
      next(err);
    }
  }
);

// POST /:id/messages - Send a message (from workspace user)
router.post(
  "/:id/messages",
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  validateRequest(sendMessageSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const conversation = await InboxService.getConversationById(req.params.id, workspaceId);
      if (!conversation) throw new ApiError(404, "Conversation not found.");

      const message = await InboxService.sendMessage(req.params.id, workspaceId, {
        ...req.body,
        senderType: "agent",
        senderId: req.user?.id,
      });

      // Mark as read when agent responds
      await InboxService.markAsRead(req.params.id, workspaceId);

      res.status(201).json(message);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /:id - Update conversation (status, assignment, tags)
router.put(
  "/:id",
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  validateRequest(updateConversationSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const conversation = await InboxService.updateConversation(req.params.id, workspaceId, req.body);
      if (!conversation) throw new ApiError(404, "Conversation not found.");
      res.json(conversation);
    } catch (err) {
      next(err);
    }
  }
);

// POST /:id/archive - Archive a conversation
router.post(
  "/:id/archive",
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const conversation = await InboxService.archiveConversation(req.params.id, workspaceId);
      if (!conversation) throw new ApiError(404, "Conversation not found.");
      res.json(conversation);
    } catch (err) {
      next(err);
    }
  }
);

// POST /:id/read - Mark conversation as read
router.post(
  "/:id/read",
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      await InboxService.markAsRead(req.params.id, workspaceId);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
