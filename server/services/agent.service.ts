import { getSupabaseServerClient } from "../middleware/requireAuth";
import { AIAgent, AgentKnowledgeFile } from "../types/agent";

export class AgentService {
  // Use lazy getter instead of module-level singleton
  private static getClient() {
    return getSupabaseServerClient();
  }
  static async getAll(workspaceId: string): Promise<AIAgent[]> {
    const { data, error } = await this.getClient()
      .from("ai_agents")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapAgent);
  }

  static async getById(id: string, workspaceId: string): Promise<AIAgent | null> {
    const { data, error } = await this.getClient()
      .from("ai_agents")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .single();

    if (error || !data) return null;
    return this.mapAgent(data);
  }

  static async create(workspaceId: string, payload: Partial<AIAgent>): Promise<AIAgent> {
    const { data, error } = await this.getClient()
      .from("ai_agents")
      .insert({
        workspace_id: workspaceId,
        name: payload.name,
        instructions: payload.instructions || "",
        welcome_message: payload.welcomeMessage || "Hi! How can I help you today?",
        brand_color: payload.brandColor || "#7c3aed",
        avatar_url: payload.avatarUrl || null,
        model: payload.model || "gemini",
        is_active: payload.isActive !== false,
        human_handoff_enabled: payload.humanHandoffEnabled || false,
        website_url: payload.websiteUrl || null,
        widget_config: payload.widgetConfig || { position: "bottom-right", bubbleSize: 60, borderRadius: 24 },
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapAgent(data);
  }

  static async update(id: string, workspaceId: string, payload: Partial<AIAgent>): Promise<AIAgent | null> {
    const updates: Record<string, any> = {};
    if (payload.name !== undefined) updates.name = payload.name;
    if (payload.instructions !== undefined) updates.instructions = payload.instructions;
    if (payload.welcomeMessage !== undefined) updates.welcome_message = payload.welcomeMessage;
    if (payload.brandColor !== undefined) updates.brand_color = payload.brandColor;
    if (payload.avatarUrl !== undefined) updates.avatar_url = payload.avatarUrl;
    if (payload.model !== undefined) updates.model = payload.model;
    if (payload.isActive !== undefined) updates.is_active = payload.isActive;
    if (payload.humanHandoffEnabled !== undefined) updates.human_handoff_enabled = payload.humanHandoffEnabled;
    if (payload.websiteUrl !== undefined) updates.website_url = payload.websiteUrl;
    if (payload.widgetConfig !== undefined) updates.widget_config = payload.widgetConfig;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await this.getClient()
      .from("ai_agents")
      .update(updates)
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .select()
      .single();

    if (error || !data) return null;
    return this.mapAgent(data);
  }

  static async delete(id: string, workspaceId: string): Promise<void> {
    const { error } = await this.getClient()
      .from("ai_agents")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspaceId);

    if (error) throw error;
  }

  static async getAgentByWidgetId(agentId: string): Promise<(AIAgent & { workspaceId: string }) | null> {
    const { data, error } = await this.getClient()
      .from("ai_agents")
      .select("*")
      .eq("id", agentId)
      .eq("is_active", true)
      .single();

    if (error || !data) return null;
    return this.mapAgent(data);
  }

  // Knowledge Files
  static async getKnowledgeFiles(agentId: string, workspaceId: string): Promise<AgentKnowledgeFile[]> {
    const { data, error } = await this.getClient()
      .from("agent_knowledge_files")
      .select("*")
      .eq("agent_id", agentId)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapKnowledgeFile);
  }

  static async addKnowledgeFile(agentId: string, workspaceId: string, file: Omit<AgentKnowledgeFile, 'id' | 'createdAt'>): Promise<AgentKnowledgeFile> {
    const { data, error } = await this.getClient()
      .from("agent_knowledge_files")
      .insert({
        agent_id: agentId,
        workspace_id: workspaceId,
        file_name: file.fileName,
        file_url: file.fileUrl,
        file_size: file.fileSize || null,
        mime_type: file.mimeType || null,
        content_text: file.contentText || null,
        status: file.status || "ready",
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapKnowledgeFile(data);
  }

  static async deleteKnowledgeFile(id: string, workspaceId: string): Promise<void> {
    const { error } = await this.getClient()
      .from("agent_knowledge_files")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspaceId);

    if (error) throw error;
  }

  private static mapAgent(row: any): AIAgent {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      name: row.name,
      instructions: row.instructions || "",
      welcomeMessage: row.welcome_message || "Hi! How can I help you today?",
      brandColor: row.brand_color || "#7c3aed",
      avatarUrl: row.avatar_url,
      model: row.model || "gemini",
      isActive: row.is_active,
      humanHandoffEnabled: row.human_handoff_enabled,
      websiteUrl: row.website_url,
      widgetConfig: row.widget_config || { position: "bottom-right", bubbleSize: 60, borderRadius: 24 },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private static mapKnowledgeFile(row: any): AgentKnowledgeFile {
    return {
      id: row.id,
      agentId: row.agent_id,
      workspaceId: row.workspace_id,
      fileName: row.file_name,
      fileUrl: row.file_url,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      contentText: row.content_text,
      status: row.status,
      createdAt: row.created_at,
    };
  }
}
