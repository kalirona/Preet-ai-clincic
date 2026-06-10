import { getSupabaseServerClient } from "../middleware/requireAuth";
import { Automation, AutomationStep, EmailTemplate, TriggerType, ActionType } from "../types/automation";

// Resilient memory database storage for local fallback simulation
let mockTemplatesStore: EmailTemplate[] = [
  {
    id: "t1",
    workspaceId: "1",
    name: "Welcome Onboarding Email Template",
    subject: "Welcome to Our Family, {{client_name}}! 🎉",
    body: "Hi {{client_name}},\n\nThank you for choosing {{workspace_name}}! We are thrilled to welcome you on board. Our team is dedicated to providing you with the finest experience possible.\n\nShould you have any questions, feel free to reply directly to this email.\n\nBest regards,\nThe {{workspace_name}} Team",
    category: "welcome",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "t2",
    workspaceId: "1",
    name: "Standard Appointment Reminder Email",
    subject: "Reminder: Scheduled Appointment at {{workspace_name}}",
    body: "Hello {{client_name}},\n\nThis is a friendly reminder that you have an upcoming appointment scheduled with us on {{appointment_time}}.\n\nIf you need to reschedule or cancel, please notify us at least 24 hours in advance.\n\nWe look forward to seeing you!\n\nBest wishes,\n{{workspace_name}}",
    category: "appointment_reminder",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "t3",
    workspaceId: "1",
    name: "Appointment Cancellation Notification",
    subject: "Confirmed: Appointment Cancelled — {{workspace_name}}",
    body: "Hi {{client_name}},\n\nWe have received your request and confirmed the cancellation of your appointment scheduled for {{appointment_time}}.\n\nWe are sorry we won't see you this time! You can always schedule a new slot online through our portal.\n\nWarm regards,\n{{workspace_name}} Team",
    category: "cancellation",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "t4",
    workspaceId: "1",
    name: "Post-Appointment Follow-up",
    subject: "How was your recent appointment at {{workspace_name}}?",
    body: "Hi {{client_name}},\n\nThank you for visiting {{workspace_name}} for your appointment on {{appointment_time}}!\n\nWe always strive to exceed expectations. Could you please take 60 seconds to let us know how your experience was?\n\nLooking forward to hearing your feedback!\n\nBest,\n{{workspace_name}} Team",
    category: "follow_up",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let mockAutomationsStore: Automation[] = [
  {
    id: "a1",
    workspaceId: "1",
    name: "New Client welcome campaign",
    triggerType: "client_created",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: "step1",
        automationId: "a1",
        stepNumber: 1,
        actionType: "send_email",
        templateId: "t1",
        delayDays: 0,
        createdAt: new Date().toISOString()
      }
    ]
  },
  {
    id: "a2",
    workspaceId: "1",
    name: "Post-appointment engagement",
    triggerType: "appointment_completed",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: "step2",
        automationId: "a2",
        stepNumber: 1,
        actionType: "send_email",
        templateId: "t4",
        delayDays: 1,
        createdAt: new Date().toISOString()
      }
    ]
  },
  {
    id: "a3",
    workspaceId: "1",
    name: "Cancellation administrative alert",
    triggerType: "appointment_cancelled",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: "step3",
        automationId: "a3",
        stepNumber: 1,
        actionType: "notify_admin",
        templateId: "t3",
        delayDays: 0,
        createdAt: new Date().toISOString()
      }
    ]
  },
  {
    id: "a4",
    workspaceId: "1",
    name: "Inactive lead re-engagement trigger",
    triggerType: "lead_inactive",
    isActive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: "step4",
        automationId: "a4",
        stepNumber: 1,
        actionType: "send_email",
        templateId: "t2",
        delayDays: 7,
        createdAt: new Date().toISOString()
      }
    ]
  }
];

export class AutomationService {
  private static useMock = false;

  private static checkClient() {
    try {
      getSupabaseServerClient();
      this.useMock = false;
    } catch (e) {
      this.useMock = true;
    }
  }

  // --- EMAIL TEMPLATE OPERATIONS ---

  static async getTemplates(workspaceId: string): Promise<EmailTemplate[]> {
    this.checkClient();
    if (this.useMock) {
      return mockTemplatesStore.filter(t => t.workspaceId === workspaceId || t.workspaceId === "1");
    }

    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .eq("workspace_id", workspaceId);

      if (error) throw error;
      if (!data || data.length === 0) {
        // Bootstrap template presets for new live databases to ensure instant usability
        const presets = mockTemplatesStore.map(p => ({
          ...p,
          id: undefined,
          workspace_id: workspaceId
        }));
        const { data: inserted, error: insertError } = await supabase
          .from("email_templates")
          .insert(presets)
          .select();
        
        if (!insertError && inserted) {
          return inserted.map(this.mapTemplateToCamel);
        }
        return mockTemplatesStore.map(p => ({ ...p, workspaceId }));
      }

      return data.map(this.mapTemplateToCamel);
    } catch (err: any) {
      console.warn("[AutomationService] getTemplates falling back to mock database:", err.message);
      return mockTemplatesStore.map(t => ({ ...t, workspaceId }));
    }
  }

  static async createTemplate(workspaceId: string, payload: Partial<EmailTemplate>): Promise<EmailTemplate> {
    this.checkClient();
    const newTemplate: EmailTemplate = {
      id: Math.random().toString(36).substring(2, 11),
      workspaceId,
      name: payload.name || "Untitled Template",
      subject: payload.subject || "No Subject",
      body: payload.body || "",
      category: payload.category || "welcome",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (this.useMock) {
      mockTemplatesStore.push(newTemplate);
      return newTemplate;
    }

    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from("email_templates")
        .insert({
          workspace_id: workspaceId,
          name: newTemplate.name,
          subject: newTemplate.subject,
          body: newTemplate.body,
          category: newTemplate.category
        })
        .select()
        .single();

      if (error) throw error;
      return this.mapTemplateToCamel(data);
    } catch (err: any) {
      console.warn("[AutomationService] createTemplate falling back to mock database:", err.message);
      mockTemplatesStore.push(newTemplate);
      return newTemplate;
    }
  }

  static async updateTemplate(id: string, workspaceId: string, payload: Partial<EmailTemplate>): Promise<EmailTemplate> {
    this.checkClient();
    if (this.useMock || id.startsWith("t") || id.length < 15) {
      const index = mockTemplatesStore.findIndex(t => t.id === id);
      if (index !== -1) {
        mockTemplatesStore[index] = {
          ...mockTemplatesStore[index],
          name: payload.name ?? mockTemplatesStore[index].name,
          subject: payload.subject ?? mockTemplatesStore[index].subject,
          body: payload.body ?? mockTemplatesStore[index].body,
          category: payload.category ?? mockTemplatesStore[index].category,
          updatedAt: new Date().toISOString()
        };
        return mockTemplatesStore[index];
      }
      throw new Error("Template not found in mock workspace");
    }

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
      console.warn("[AutomationService] updateTemplate falling back to mock database:", err.message);
      const index = mockTemplatesStore.findIndex(t => t.id === id);
      if (index !== -1) {
        mockTemplatesStore[index] = {
          ...mockTemplatesStore[index],
          ...payload,
          updatedAt: new Date().toISOString()
        } as EmailTemplate;
        return mockTemplatesStore[index];
      }
      throw err;
    }
  }

  static async deleteTemplate(id: string, workspaceId: string): Promise<boolean> {
    this.checkClient();
    if (this.useMock || id.startsWith("t") || id.length < 15) {
      const lengthBefore = mockTemplatesStore.length;
      mockTemplatesStore = mockTemplatesStore.filter(t => t.id !== id);
      return mockTemplatesStore.length < lengthBefore;
    }

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
      console.warn("[AutomationService] deleteTemplate falling back to mock database:", err.message);
      mockTemplatesStore = mockTemplatesStore.filter(t => t.id !== id);
      return true;
    }
  }

  // --- AUTOMATIONS OPERATIONS ---

  static async getAutomations(workspaceId: string): Promise<Automation[]> {
    this.checkClient();
    if (this.useMock) {
      return mockAutomationsStore.map(a => ({
        ...a,
        workspaceId,
        steps: a.steps?.map(s => ({ ...s }))
      }));
    }

    try {
      const supabase = getSupabaseServerClient();
      const { data: automations, error } = await supabase
        .from("automations")
        .select("*")
        .eq("workspace_id", workspaceId);

      if (error) throw error;
      if (!automations || automations.length === 0) {
        // Return simulated seeds if real table exists but is empty
        return mockAutomationsStore.map(p => ({ ...p, workspaceId }));
      }

      // Fetch steps for these automations in one query (mitigates N+1 query problem)
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

      const result: Automation[] = automations.map(raw => ({
        id: raw.id,
        workspaceId: raw.workspace_id,
        name: raw.name,
        triggerType: raw.trigger_type,
        isActive: raw.is_active,
        createdAt: raw.created_at,
        updatedAt: raw.updated_at,
        steps: mappedStepsByAutomationId[raw.id] || []
      }));

      return result;
    } catch (err: any) {
      console.warn("[AutomationService] getAutomations falling back to mock database:", err.message);
      return mockAutomationsStore.map(p => ({ ...p, workspaceId }));
    }
  }

  static async createAutomation(workspaceId: string, payload: any): Promise<Automation> {
    this.checkClient();
    const newId = Math.random().toString(36).substring(2, 11);
    const newSteps: AutomationStep[] = (payload.steps || []).map((step: any, idx: number) => ({
      id: Math.random().toString(36).substring(2, 11),
      automationId: newId,
      stepNumber: step.stepNumber || (idx + 1),
      actionType: step.actionType || "send_email",
      templateId: step.templateId || null,
      delayDays: Number(step.delayDays) || 0,
      createdAt: new Date().toISOString()
    }));

    const newAutomation: Automation = {
      id: newId,
      workspaceId,
      name: payload.name || "Untitled Automation Rule",
      triggerType: payload.triggerType || "client_created",
      isActive: payload.isActive !== undefined ? payload.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      steps: newSteps
    };

    if (this.useMock) {
      mockAutomationsStore.push(newAutomation);
      return newAutomation;
    }

    try {
      const supabase = getSupabaseServerClient();
      
      const { data: rule, error } = await supabase
        .from("automations")
        .insert({
          workspace_id: workspaceId,
          name: newAutomation.name,
          trigger_type: newAutomation.triggerType,
          is_active: newAutomation.isActive
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
      console.warn("[AutomationService] createAutomation falling back to mock database:", err.message);
      mockAutomationsStore.push(newAutomation);
      return newAutomation;
    }
  }

  static async updateAutomation(id: string, workspaceId: string, payload: any): Promise<Automation> {
    this.checkClient();
    if (this.useMock || id.startsWith("a") || id.length < 15) {
      const index = mockAutomationsStore.findIndex(a => a.id === id);
      if (index !== -1) {
        const existing = mockAutomationsStore[index];
        mockAutomationsStore[index] = {
          ...existing,
          name: payload.name ?? existing.name,
          triggerType: payload.triggerType ?? existing.triggerType,
          isActive: payload.isActive ?? existing.isActive,
          steps: payload.steps ? payload.steps.map((st: any, index: number) => ({
            id: st.id || Math.random().toString(36).substring(2, 11),
            automationId: id,
            stepNumber: index + 1,
            actionType: st.actionType || "send_email",
            templateId: st.templateId || null,
            delayDays: Number(st.delayDays) || 0,
            createdAt: st.createdAt || new Date().toISOString()
          })) : existing.steps,
          updatedAt: new Date().toISOString()
        };
        return mockAutomationsStore[index];
      }
      throw new Error("Automation rule not found");
    }

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
        // Re-align steps by deleting old steps and inserting new ones for this automation config
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

      // Re-fetch complete automation structure
      const finalAutomations = await this.getAutomations(workspaceId);
      const updated = finalAutomations.find(a => a.id === id);
      if (!updated) throw new Error("Verification failed: rule not found after reload");
      return updated;
    } catch (err: any) {
      console.warn("[AutomationService] updateAutomation falling back to mock database:", err.message);
      const index = mockAutomationsStore.findIndex(a => a.id === id);
      if (index !== -1) {
        mockAutomationsStore[index] = {
          ...mockAutomationsStore[index],
          ...payload,
          updatedAt: new Date().toISOString()
        } as Automation;
        return mockAutomationsStore[index];
      }
      throw err;
    }
  }

  static async deleteAutomation(id: string, workspaceId: string): Promise<boolean> {
    this.checkClient();
    if (this.useMock || id.startsWith("a") || id.length < 15) {
      const lengthBefore = mockAutomationsStore.length;
      mockAutomationsStore = mockAutomationsStore.filter(a => a.id !== id);
      return mockAutomationsStore.length < lengthBefore;
    }

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
      console.warn("[AutomationService] deleteAutomation falling back to mock database:", err.message);
      mockAutomationsStore = mockAutomationsStore.filter(a => a.id !== id);
      return true;
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
