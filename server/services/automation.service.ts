import { getSupabaseServerClient } from "../middleware/requireAuth";
import { Automation, AutomationStep, EmailTemplate, TriggerType, ActionType } from "../types/automation";

export class AutomationService {

  // --- EMAIL TEMPLATE OPERATIONS ---

  static async getTemplates(workspaceId: string): Promise<EmailTemplate[]> {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .eq("workspace_id", workspaceId);

      if (error) throw error;
      return (data || []).map(this.mapTemplateToCamel);
    } catch (err: any) {
      console.error("[AutomationService] getTemplates error:", err.message);
      throw err;
    }
  }

  static async createTemplate(workspaceId: string, payload: Partial<EmailTemplate>): Promise<EmailTemplate> {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from("email_templates")
        .insert({
          workspace_id: workspaceId,
          name: payload.name || "Untitled Template",
          subject: payload.subject || "No Subject",
          body: payload.body || "",
          category: payload.category || "welcome"
        })
        .select()
        .single();

      if (error) throw error;
      return this.mapTemplateToCamel(data);
    } catch (err: any) {
      console.error("[AutomationService] createTemplate error:", err.message);
      throw err;
    }
  }

  static async updateTemplate(id: string, workspaceId: string, payload: Partial<EmailTemplate>): Promise<EmailTemplate> {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from("email_templates")
        .update({
          name: payload.name,
          subject: payload.subject,
          body: payload.body,
          category: payload.category,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .eq("workspace_id", workspaceId)
        .select()
        .single();

      if (error) throw error;
      return this.mapTemplateToCamel(data);
    } catch (err: any) {
      console.error("[AutomationService] updateTemplate error:", err.message);
      throw err;
    }
  }

  static async deleteTemplate(id: string, workspaceId: string): Promise<boolean> {
    try {
      const supabase = getSupabaseServerClient();
      const { error } = await supabase
        .from("email_templates")
        .delete()
        .eq("id", id)
        .eq("workspace_id", workspaceId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error("[AutomationService] deleteTemplate error:", err.message);
      throw err;
    }
  }

  // --- AUTOMATIONS OPERATIONS ---

  static async getAutomations(workspaceId: string): Promise<Automation[]> {
    try {
      const supabase = getSupabaseServerClient();
      const { data: automations, error } = await supabase
        .from("automations")
        .select("*")
        .eq("workspace_id", workspaceId);

      if (error) throw error;
      if (!automations || automations.length === 0) return [];

      // Fetch steps for these automations in one query
      const automationIds = automations.map(a => a.id);
      const { data: allSteps, error: stepsError } = await supabase
        .from("automation_steps")
        .select("*")
        .in("automation_id", automationIds)
        .order("step_number", { ascending: true });

      const mappedStepsByAutomationId: Record<string, AutomationStep[]> = {};
      if (!stepsError && allSteps) {
        for (const s of allSteps) {
          if (!mappedStepsByAutomationId[s.automation_id]) {
            mappedStepsByAutomationId[s.automation_id] = [];
          }
          mappedStepsByAutomationId[s.automation_id].push({
            id: s.id,
            automationId: s.automation_id,
            stepNumber: s.step_number,
            actionType: s.action_type as ActionType,
            templateId: s.template_id,
            delayDays: s.delay_days,
            createdAt: s.created_at
          });
        }
      }

      return automations.map(raw => ({
        id: raw.id,
        workspaceId: raw.workspace_id,
        name: raw.name,
        triggerType: raw.trigger_type,
        isActive: raw.is_active,
        createdAt: raw.created_at,
        updatedAt: raw.updated_at,
        steps: mappedStepsByAutomationId[raw.id] || []
      }));
    } catch (err: any) {
      console.error("[AutomationService] getAutomations error:", err.message);
      throw err;
    }
  }

  static async createAutomation(workspaceId: string, payload: any): Promise<Automation> {
    try {
      const supabase = getSupabaseServerClient();

      const { data: rule, error } = await supabase
        .from("automations")
        .insert({
          workspace_id: workspaceId,
          name: payload.name || "Untitled Automation Rule",
          trigger_type: payload.triggerType || "client_created",
          is_active: payload.isActive !== undefined ? payload.isActive : true
        })
        .select()
        .single();

      if (error) throw error;

      const insertedSteps: AutomationStep[] = [];
      if (payload.steps && payload.steps.length > 0) {
        const stepInserts = payload.steps.map((s: any, idx: number) => ({
          automation_id: rule.id,
          step_number: s.stepNumber || (idx + 1),
          action_type: s.actionType || "send_email",
          template_id: s.templateId || null,
          delay_days: Number(s.delayDays) || 0
        }));

        const { data: dbSteps, error: dbStepsError } = await supabase
          .from("automation_steps")
          .insert(stepInserts)
          .select();

        if (!dbStepsError && dbSteps) {
          dbSteps.forEach((s: any) => {
            insertedSteps.push({
              id: s.id,
              automationId: s.automation_id,
              stepNumber: s.step_number,
              actionType: s.action_type,
              templateId: s.template_id,
              delayDays: s.delay_days,
              createdAt: s.created_at
            });
          });
        }
      }

      return {
        id: rule.id,
        workspaceId: rule.workspace_id,
        name: rule.name,
        triggerType: rule.trigger_type,
        isActive: rule.is_active,
        createdAt: rule.created_at,
        updatedAt: rule.updated_at,
        steps: insertedSteps
      };
    } catch (err: any) {
      console.error("[AutomationService] createAutomation error:", err.message);
      throw err;
    }
  }

  static async updateAutomation(id: string, workspaceId: string, payload: any): Promise<Automation> {
    try {
      const supabase = getSupabaseServerClient();

      const { data: rule, error } = await supabase
        .from("automations")
        .update({
          name: payload.name,
          trigger_type: payload.triggerType,
          is_active: payload.isActive,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .eq("workspace_id", workspaceId)
        .select()
        .single();

      if (error) throw error;

      if (payload.steps) {
        await supabase
          .from("automation_steps")
          .delete()
          .eq("automation_id", id);

        if (payload.steps.length > 0) {
          const stepInserts = payload.steps.map((s: any, idx: number) => ({
            automation_id: id,
            step_number: idx + 1,
            action_type: s.actionType || "send_email",
            template_id: s.templateId || null,
            delay_days: Number(s.delayDays) || 0
          }));
          await supabase.from("automation_steps").insert(stepInserts);
        }
      }

      const finalAutomations = await this.getAutomations(workspaceId);
      const updated = finalAutomations.find(a => a.id === id);
      if (!updated) throw new Error("Verification failed: rule not found after reload");
      return updated;
    } catch (err: any) {
      console.error("[AutomationService] updateAutomation error:", err.message);
      throw err;
    }
  }

  static async deleteAutomation(id: string, workspaceId: string): Promise<boolean> {
    try {
      const supabase = getSupabaseServerClient();
      const { error } = await supabase
        .from("automations")
        .delete()
        .eq("id", id)
        .eq("workspace_id", workspaceId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error("[AutomationService] deleteAutomation error:", err.message);
      throw err;
    }
  }

  // --- HELPER WRAPPERS ---

  private static mapTemplateToCamel(row: any): EmailTemplate {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      name: row.name,
      subject: row.subject,
      body: row.body,
      category: row.category,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
