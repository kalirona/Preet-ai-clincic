import { getSupabaseServerClient } from "../middleware/requireAuth";
import { FormBuilder, FormResponse, FormField, FormSettings } from "../types/form";

export class FormService {
  // Use lazy getter instead of module-level singleton
  private static getClient() {
    return getSupabaseServerClient();
  }
  // ============================================
  // FORM BUILDERS
  // ============================================

  static async getAll(workspaceId: string): Promise<FormBuilder[]> {
    const { data, error } = await this.getClient()
      .from("form_builders")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapForm);
  }

  static async getById(id: string, workspaceId: string): Promise<FormBuilder | null> {
    const { data, error } = await this.getClient()
      .from("form_builders")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .single();

    if (error || !data) return null;
    return this.mapForm(data);
  }

  static async create(workspaceId: string, payload: Partial<FormBuilder>): Promise<FormBuilder> {
    const { data, error } = await this.getClient()
      .from("form_builders")
      .insert({
        workspace_id: workspaceId,
        name: payload.name,
        description: payload.description || "",
        fields: JSON.stringify(payload.fields || []),
        settings: JSON.stringify(payload.settings || {
          submitButtonText: "Submit",
          successMessage: "Thank you for your submission!",
          createConversation: true,
        }),
        brand_color: payload.brandColor || "#7c3aed",
        is_active: payload.isActive !== false,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapForm(data);
  }

  static async update(id: string, workspaceId: string, payload: Partial<FormBuilder>): Promise<FormBuilder | null> {
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (payload.name !== undefined) updates.name = payload.name;
    if (payload.description !== undefined) updates.description = payload.description;
    if (payload.fields !== undefined) updates.fields = JSON.stringify(payload.fields);
    if (payload.settings !== undefined) updates.settings = JSON.stringify(payload.settings);
    if (payload.brandColor !== undefined) updates.brand_color = payload.brandColor;
    if (payload.isActive !== undefined) updates.is_active = payload.isActive;

    const { data, error } = await this.getClient()
      .from("form_builders")
      .update(updates)
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .select()
      .single();

    if (error || !data) return null;
    return this.mapForm(data);
  }

  static async delete(id: string, workspaceId: string): Promise<void> {
    const { error } = await this.getClient()
      .from("form_builders")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspaceId);

    if (error) throw error;
  }

  // ============================================
  // FORM RESPONSES
  // ============================================

  static async getResponses(
    workspaceId: string,
    filters?: { formId?: string; status?: string; search?: string }
  ): Promise<FormResponse[]> {
    let query = this.getClient()
      .from("form_responses")
      .select("*")
      .eq("workspace_id", workspaceId);

    if (filters?.formId) query = query.eq("form_id", filters.formId);
    if (filters?.status) query = query.eq("status", filters.status);

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(this.mapResponse);
  }

  static async getResponseById(id: string, workspaceId: string): Promise<FormResponse | null> {
    const { data, error } = await this.getClient()
      .from("form_responses")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .single();

    if (error || !data) return null;
    return this.mapResponse(data);
  }

  static async updateResponse(id: string, workspaceId: string, payload: { status?: string }): Promise<FormResponse | null> {
    const { data, error } = await this.getClient()
      .from("form_responses")
      .update({ status: payload.status })
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .select()
      .single();

    if (error || !data) return null;
    return this.mapResponse(data);
  }

  static async deleteResponse(id: string, workspaceId: string): Promise<void> {
    const { error } = await this.getClient()
      .from("form_responses")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspaceId);

    if (error) throw error;
  }

  static async getResponseStats(workspaceId: string): Promise<{
    total: number;
    new: number;
    read: number;
    converted: number;
    archived: number;
  }> {
    const { data, error } = await this.getClient()
      .from("form_responses")
      .select("status")
      .eq("workspace_id", workspaceId);

    if (error) throw error;

    const stats = { total: 0, new: 0, read: 0, converted: 0, archived: 0 };
    for (const row of data || []) {
      stats.total++;
      if (row.status === "new") stats.new++;
      else if (row.status === "read") stats.read++;
      else if (row.status === "converted") stats.converted++;
      else if (row.status === "archived") stats.archived++;
    }
    return stats;
  }

  // ============================================
  // PUBLIC FORM SUBMISSION (no workspace auth)
  // ============================================

  static async getPublicForm(formId: string): Promise<{
    id: string;
    name: string;
    description: string;
    fields: FormField[];
    settings: FormSettings;
    brandColor: string;
  } | null> {
    const { data, error } = await this.getClient()
      .from("form_builders")
      .select("id, name, description, fields, settings, brand_color, is_active")
      .eq("id", formId)
      .eq("is_active", true)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      fields: data.fields || [],
      settings: data.settings || {},
      brandColor: data.brand_color,
    };
  }

  static async submitForm(
    formId: string,
    answers: Record<string, any>,
    visitorInfo?: { name?: string; email?: string; phone?: string; ip?: string; userAgent?: string }
  ): Promise<{ response: FormResponse; conversationId?: string; clientId?: string }> {
    // Get form config
    const form = await this.getPublicForm(formId);
    if (!form) throw new Error("Form not found or inactive");

    // Get workspace from form
    const { data: formRow } = await this.getClient()
      .from("form_builders")
      .select("workspace_id")
      .eq("id", formId)
      .single();

    if (!formRow) throw new Error("Form not found");
    const workspaceId = formRow.workspace_id;

    // Create the form response
    const { data: responseRow, error: responseError } = await this.getClient()
      .from("form_responses")
      .insert({
        workspace_id: workspaceId,
        form_id: formId,
        answers: JSON.stringify(answers),
        visitor_ip: visitorInfo?.ip || null,
        visitor_user_agent: visitorInfo?.userAgent || null,
        status: "new",
      })
      .select()
      .single();

    if (responseError) throw responseError;

    let conversationId: string | undefined;
    let clientId: string | undefined;

    // Auto-create conversation if enabled
    if (form.settings.createConversation) {
      const { data: conv } = await this.getClient()
        .from("conversations")
        .insert({
          workspace_id: workspaceId,
          agent_id: form.settings.assignAgentId || null,
          visitor_name: visitorInfo?.name || answers.name || null,
          visitor_email: visitorInfo?.email || answers.email || null,
          visitor_phone: visitorInfo?.phone || answers.phone || null,
          visitor_ip: visitorInfo?.ip || null,
          visitor_user_agent: visitorInfo?.userAgent || null,
          source: "form",
          status: "unread",
          metadata: JSON.stringify({ formId, formName: form.name }),
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (conv) {
        conversationId = conv.id;

        // Link response to conversation
        await this.getClient()
          .from("form_responses")
          .update({ conversation_id: conv.id })
          .eq("id", responseRow.id);

        // Add system message about form submission
        await this.getClient()
          .from("messages")
          .insert({
            conversation_id: conv.id,
            workspace_id: workspaceId,
            sender_type: "system",
            content: `Form "${form.name}" submitted by ${visitorInfo?.name || visitorInfo?.email || "visitor"}`,
            message_type: "system",
          });
      }
    }

    // Auto-create client lead if email or name provided
    const email = visitorInfo?.email || answers.email;
    const name = visitorInfo?.name || answers.name;
    if (email || name) {
      const firstName = name ? name.split(" ")[0] : "Lead";
      const lastName = name ? name.split(" ").slice(1).join(" ") : "";

      // Check if client already exists
      let existingClient: any = null;
      if (email) {
        const { data } = await this.getClient()
          .from("clients")
          .select("id")
          .eq("workspace_id", workspaceId)
          .eq("email", email)
          .single();
        existingClient = data;
      }

      if (existingClient) {
        clientId = existingClient.id;
        // Link response to existing client
        await this.getClient()
          .from("form_responses")
          .update({ client_id: clientId })
          .eq("id", responseRow.id);

        // Link conversation to client if exists
        if (conversationId) {
          // client_activities will track this
        }
      } else {
        // Create new client lead
        const { data: newClient } = await this.getClient()
          .from("clients")
          .insert({
            workspace_id: workspaceId,
            first_name: firstName,
            last_name: lastName,
            email: email || null,
            phone: visitorInfo?.phone || answers.phone || null,
            tag: "lead",
            notes: `Auto-created from form "${form.name}" submission`,
          })
          .select()
          .single();

        if (newClient) {
          clientId = newClient.id;

          // Link response to client
          await this.getClient()
            .from("form_responses")
            .update({ client_id: clientId })
            .eq("id", responseRow.id);

          // Add client activity
          await this.getClient()
            .from("client_activities")
            .insert({
              workspace_id: workspaceId,
              client_id: clientId,
              type: "form_submission",
              title: `Form submitted: ${form.name}`,
              description: `Lead captured via form submission. Answers: ${JSON.stringify(answers)}`,
              metadata: JSON.stringify({ formId, responseId: responseRow.id }),
            });
        }
      }
    }

    return {
      response: this.mapResponse(responseRow),
      conversationId,
      clientId,
    };
  }

  private static mapForm(row: any): FormBuilder {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      name: row.name,
      description: row.description || "",
      fields: row.fields || [],
      settings: row.settings || {},
      brandColor: row.brand_color || "#7c3aed",
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private static mapResponse(row: any): FormResponse {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      formId: row.form_id,
      conversationId: row.conversation_id,
      clientId: row.client_id,
      answers: row.answers || {},
      visitorIp: row.visitor_ip,
      visitorUserAgent: row.visitor_user_agent,
      status: row.status,
      createdAt: row.created_at,
    };
  }
}
