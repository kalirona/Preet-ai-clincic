import { Router, Response, NextFunction, Request } from "express";
import { AgentService } from "../services/agent.service";
import { InboxService } from "../services/inbox.service";
import { ApiError } from "../types/errors";
import { getSupabaseServerClient } from "../middleware/requireAuth";

const router = Router();

// GET /widget/:agentId - Get agent config for widget rendering
router.get(
  "/widget/:agentId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const agent = await AgentService.getAgentByWidgetId(req.params.agentId);
      if (!agent) throw new ApiError(404, "Agent not found or inactive.");

      const knowledgeFiles = await AgentService.getKnowledgeFiles(agent.id, agent.workspaceId);

      res.json({
        id: agent.id,
        name: agent.name,
        welcomeMessage: agent.welcomeMessage,
        brandColor: agent.brandColor,
        avatarUrl: agent.avatarUrl,
        humanHandoffEnabled: agent.humanHandoffEnabled,
        widgetConfig: agent.widgetConfig,
        knowledgeFiles: knowledgeFiles.map(f => ({
          id: f.id,
          fileName: f.fileName,
          contentText: f.contentText,
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /widget/:agentId/start - Start a new conversation
router.post(
  "/widget/:agentId/start",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await InboxService.widgetStartConversation(req.params.agentId, {
        visitorName: req.body.visitorName,
        visitorEmail: req.body.visitorEmail,
        visitorPhone: req.body.visitorPhone,
        visitorIp: (req.headers["x-forwarded-for"] as string) || req.ip,
        visitorUserAgent: req.headers["user-agent"],
      });

      res.status(201).json(result);
    } catch (err: any) {
      if (err.message === "Agent not found or inactive") {
        next(new ApiError(404, err.message));
      } else {
        next(err);
      }
    }
  }
);

// POST /widget/conversation/:conversationId/message - Send a message from widget
router.post(
  "/widget/conversation/:conversationId/message",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { content } = req.body;
      if (!content || typeof content !== "string" || !content.trim()) {
        throw new ApiError(400, "Message content is required.");
      }

      const message = await InboxService.widgetSendMessage(
        req.params.conversationId,
        content.trim(),
        "visitor"
      );

      res.status(201).json(message);
    } catch (err) {
      next(err);
    }
  }
);

// GET /widget/conversation/:conversationId/messages - Poll messages
router.get(
  "/widget/conversation/:conversationId/messages",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { after } = req.query;
      let messages = await InboxService.widgetGetMessages(req.params.conversationId);

      // Filter messages after a timestamp if provided (for polling)
      if (after && typeof after === "string") {
        const afterDate = new Date(after);
        messages = messages.filter(m => new Date(m.createdAt) > afterDate);
      }

      res.json(messages);
    } catch (err) {
      next(err);
    }
  }
);

// GET /widget/conversation/:conversationId - Get conversation status
router.get(
  "/widget/conversation/:conversationId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const supabase = getSupabaseServerClient();
      const { data: conv, error } = await supabase
        .from("conversations")
        .select("id, status, visitor_name, visitor_email")
        .eq("id", req.params.conversationId)
        .single();

      if (error || !conv) throw new ApiError(404, "Conversation not found.");
      res.json(conv);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
