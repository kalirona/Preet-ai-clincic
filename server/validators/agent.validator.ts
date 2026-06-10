import { z } from "zod";

export const createAgentSchema = z.object({
  name: z.string().min(1, "Agent name is required").max(255),
  instructions: z.string().optional().default(""),
  welcomeMessage: z.string().optional().default("Hi! How can I help you today?"),
  brandColor: z.string().optional().default("#7c3aed"),
  avatarUrl: z.string().url().optional().nullable(),
  model: z.string().optional().default("gemini"),
  isActive: z.boolean().optional().default(true),
  humanHandoffEnabled: z.boolean().optional().default(false),
  websiteUrl: z.string().url().optional().nullable(),
  widgetConfig: z.object({
    position: z.enum(["bottom-right", "bottom-left"]).optional().default("bottom-right"),
    bubbleSize: z.number().min(40).max(80).optional().default(60),
    borderRadius: z.number().min(12).max(40).optional().default(24),
  }).optional().default({ position: "bottom-right", bubbleSize: 60, borderRadius: 24 }),
});

export const updateAgentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  instructions: z.string().optional(),
  welcomeMessage: z.string().optional(),
  brandColor: z.string().optional(),
  avatarUrl: z.string().url().optional().nullable(),
  model: z.string().optional(),
  isActive: z.boolean().optional(),
  humanHandoffEnabled: z.boolean().optional(),
  websiteUrl: z.string().url().optional().nullable(),
  widgetConfig: z.object({
    position: z.enum(["bottom-right", "bottom-left"]).optional(),
    bubbleSize: z.number().min(40).max(80).optional(),
    borderRadius: z.number().min(12).max(40).optional(),
  }).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided for update." }
);

export const createConversationSchema = z.object({
  agentId: z.string().uuid().optional().nullable(),
  visitorName: z.string().max(255).optional(),
  visitorEmail: z.string().email().optional().nullable(),
  visitorPhone: z.string().max(50).optional().nullable(),
  source: z.enum(["widget", "form", "lead", "manual"]).optional().default("widget"),
  metadata: z.record(z.string(), z.any()).optional().default({}),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, "Message content is required"),
  senderType: z.enum(["visitor", "agent", "system", "ai"]).default("visitor"),
  senderId: z.string().uuid().optional().nullable(),
  messageType: z.enum(["text", "image", "file", "system"]).optional().default("text"),
  metadata: z.record(z.string(), z.any()).optional().default({}),
});

export const updateConversationSchema = z.object({
  status: z.enum(["open", "unread", "archived", "assigned"]).optional(),
  assignedTo: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided for update." }
);
