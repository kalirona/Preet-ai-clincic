import { getSupabaseServerClient } from "../middleware/requireAuth";
import { Conversation, Message, ConversationStatus, ConversationSource } from "../types/conversation";

export class InboxService {
  // Use lazy getter instead of module-level singleton to avoid init before env vars load
  private static getClient() {
    return getSupabaseServerClient();
  }
  // ============================================
  // CONVERSATIONS
  // ============================================

  static async getConversations(
    workspaceId: string,
    filters?: {
      status?: ConversationStatus;
      source?: ConversationSource;
      search?: string;
      agentId?: string;
    }
  ): Promise<Conversation[]> {
    let query = this.getClient()
      .from("conversations")
      .select("*")
      .eq("workspace_id", workspaceId);

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.source) {
      query = query.eq("source", filters.source);
    }
    if (filters?.agentId) {
      query = query.eq("agent_id", filters.agentId);
    }
    if (filters?.search) {
      query = query.or(`visitor_name.ilike.%${filters.search}%,visitor_email.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order("last_message_at", { ascending: false, nullsFirst: false });
    if (error) throw error;
    return (data || []).map(this.mapConversation);
  }

  static async getConversationById(id: string, workspaceId: string): Promise<Conversation | null> {
    const { data, error } = await this.getClient()
      .from("conversations")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .single();

    if (error || !data) return null;
    return this.mapConversation(data);
  }

  static async createConversation(workspaceId: string, payload: {
    agentId?: string;
    visitorName?: string;
    visitorEmail?: string;
    visitorPhone?: string;
    visitorIp?: string;
    visitorUserAgent?: string;
    source?: ConversationSource;
    metadata?: Record<string, any>;
  }): Promise<Conversation> {
    const { data, error } = await this.getClient()
      .from("conversations")
      .insert({
        workspace_id: workspaceId,
        agent_id: payload.agentId || null,
        visitor_name: payload.visitorName || null,
        visitor_email: payload.visitorEmail || null,
        visitor_phone: payload.visitorPhone || null,
        visitor_ip: payload.visitorIp || null,
        visitor_user_agent: payload.visitorUserAgent || null,
        source: payload.source || "widget",
        status: "unread",
        metadata: payload.metadata || {},
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapConversation(data);
  }

  static async updateConversation(id: string, workspaceId: string, payload: {
    status?: ConversationStatus;
    assignedTo?: string | null;
    tags?: string[];
  }): Promise<Conversation | null> {
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (payload.status !== undefined) updates.status = payload.status;
    if (payload.assignedTo !== undefined) updates.assigned_to = payload.assignedTo;
    if (payload.tags !== undefined) updates.tags = JSON.stringify(payload.tags);

    const { data, error } = await this.getClient()
      .from("conversations")
      .update(updates)
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .select()
      .single();

    if (error || !data) return null;
    return this.mapConversation(data);
  }

  static async archiveConversation(id: string, workspaceId: string): Promise<Conversation | null> {
    return this.updateConversation(id, workspaceId, { status: "archived" });
  }

  static async getConversationStats(workspaceId: string): Promise<{
    total: number;
    open: number;
    unread: number;
    archived: number;
  }> {
    const { data, error } = await this.getClient()
      .from("conversations")
      .select("status")
      .eq("workspace_id", workspaceId);

    if (error) throw error;

    const stats = { total: 0, open: 0, unread: 0, archived: 0 };
    for (const row of data || []) {
      stats.total++;
      if (row.status === "open") stats.open++;
      else if (row.status === "unread") stats.unread++;
      else if (row.status === "archived") stats.archived++;
    }
    return stats;
  }

  // ============================================
  // MESSAGES
  // ============================================

  static async getMessages(conversationId: string, workspaceId: string): Promise<Message[]> {
    const { data, error } = await this.getClient()
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapMessage);
  }

  static async sendMessage(conversationId: string, workspaceId: string, payload: {
    content: string;
    senderType: 'visitor' | 'agent' | 'system' | 'ai';
    senderId?: string;
    messageType?: string;
    metadata?: Record<string, any>;
  }): Promise<Message> {
    const { data, error } = await this.getClient()
      .from("messages")
      .insert({
        conversation_id: conversationId,
        workspace_id: workspaceId,
        sender_type: payload.senderType,
        sender_id: payload.senderId || null,
        content: payload.content,
        message_type: payload.messageType || "text",
        metadata: payload.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;

    // Update conversation last_message_at and unread count
    await this.getClient()
      .from("conversations")
      .update({
        last_message_at: new Date().toISOString(),
        unread_count: payload.senderType === "visitor" ? 1 : 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId)
      .eq("workspace_id", workspaceId);

    return this.mapMessage(data);
  }

  static async markAsRead(conversationId: string, workspaceId: string): Promise<void> {
    await this.getClient()
      .from("conversations")
      .update({ unread_count: 0, status: "open", updated_at: new Date().toISOString() })
      .eq("id", conversationId)
      .eq("workspace_id", workspaceId);
  }

  // ============================================
  // WIDGET-FACING (no workspace auth)
  // ============================================

  static async widgetStartConversation(agentId: string, payload: {
    visitorName?: string;
    visitorEmail?: string;
    visitorPhone?: string;
    visitorIp?: string;
    visitorUserAgent?: string;
  }): Promise<{ conversation: Conversation; welcomeMessage: string }> {
    // Get agent info
    const { data: agent, error: agentError } = await this.getClient()
      .from("ai_agents")
      .select("id, workspace_id, welcome_message, is_active")
      .eq("id", agentId)
      .eq("is_active", true)
      .single();

    if (agentError || !agent) {
      throw new Error("Agent not found or inactive");
    }

    const conversation = await this.createConversation(agent.workspace_id, {
      agentId,
      visitorName: payload.visitorName,
      visitorEmail: payload.visitorEmail,
      visitorPhone: payload.visitorPhone,
      visitorIp: payload.visitorIp,
      visitorUserAgent: payload.visitorUserAgent,
      source: "widget",
    });

    return {
      conversation,
      welcomeMessage: agent.welcome_message || "Hi! How can I help you today?",
    };
  }

  static async widgetSendMessage(conversationId: string, content: string, senderType: 'visitor' | 'ai' = 'visitor'): Promise<Message> {
    // Get workspace from conversation
    const { data: conv } = await this.getClient()
      .from("conversations")
      .select("workspace_id")
      .eq("id", conversationId)
      .single();

    if (!conv) throw new Error("Conversation not found");

    return this.sendMessage(conversationId, conv.workspace_id, {
      content,
      senderType,
      messageType: "text",
    });
  }

  static async widgetGetMessages(conversationId: string): Promise<Message[]> {
    const { data: conv } = await this.getClient()
      .from("conversations")
      .select("workspace_id")
      .eq("id", conversationId)
      .single();

    if (!conv) throw new Error("Conversation not found");

    return this.getMessages(conversationId, conv.workspace_id);
  }

  private static mapConversation(row: any): Conversation {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      agentId: row.agent_id,
      visitorName: row.visitor_name,
      visitorEmail: row.visitor_email,
      visitorPhone: row.visitor_phone,
      visitorIp: row.visitor_ip,
      visitorUserAgent: row.visitor_user_agent,
      source: row.source,
      status: row.status,
      assignedTo: row.assigned_to,
      unreadCount: row.unread_count || 0,
      lastMessageAt: row.last_message_at,
      tags: row.tags || [],
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private static mapMessage(row: any): Message {
    return {
      id: row.id,
      conversationId: row.conversation_id,
      workspaceId: row.workspace_id,
      senderType: row.sender_type,
      senderId: row.sender_id,
      content: row.content,
      messageType: row.message_type || "text",
      metadata: row.metadata || {},
      createdAt: row.created_at,
    };
  }
}
