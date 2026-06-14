import { Job } from "../queues/queue";
import { AutomationService } from "../services/automation.service";
import { AuditLogService } from "../services/auditLog.service";
import { getSupabaseServerClient } from "../middleware/requireAuth";

export interface AutomationJobPayload {
  automationId?: string;
  workspaceId: string;
  triggerType: "client_created" | "appointment_completed" | "appointment_cancelled" | "lead_inactive" | string;
  contextData: {
    clientName?: string;
    clientEmail?: string;
    clientId?: string;
    appointmentId?: string;
    appointmentTime?: string;
    [key: string]: any;
  };
}

export interface AutomationJobResult {
  success: boolean;
  executedStepsCount: number;
  logs: string[];
}

export async function handleAutomationJob(job: Job<AutomationJobPayload, AutomationJobResult>): Promise<AutomationJobResult> {
  const { workspaceId, triggerType, contextData, automationId } = job.data;
  const logs: string[] = [];
  logs.push(`[${new Date().toLocaleTimeString()}] Automation trigger action detected: '${triggerType}'`);

  await AuditLogService.createLog({
    workspaceId,
    action: `Background Automation Run: [${triggerType}] client=${contextData.clientName || 'N/A'}`,
    entityType: "Team",
    ipAddress: "127.0.0.1",
    userAgent: "PreetAI-Queue-Worker"
  }).catch(err => console.warn("[Automation Job] Audit log fail:", err));

  const allAutomations = await AutomationService.getAutomations(workspaceId).catch(() => []);
  const matchingRules = allAutomations.filter(rule =>
    rule.isActive && rule.triggerType === triggerType &&
    (!automationId || rule.id === automationId)
  );

  if (matchingRules.length === 0) {
    logs.push(`No active workflow automation rules registered for trigger: '${triggerType}'`);
    return { success: true, executedStepsCount: 0, logs };
  }

  logs.push(`Found ${matchingRules.length} matching workflow rule(s) to process.`);
  let stepsExecuted = 0;
  const supabase = getSupabaseServerClient();

  for (const rule of matchingRules) {
    logs.push(`Executing automation rule: '${rule.name}' (ID: ${rule.id})`);

    for (const step of rule.steps || []) {
      logs.push(`  Step ${step.stepNumber}: ${step.actionType}`);

      try {
        if (step.actionType === "send_email" && step.templateId) {
          // Fetch template and log email send
          const { data: template } = await supabase
            .from("email_templates")
            .select("name, subject, body")
            .eq("id", step.templateId)
            .eq("workspace_id", workspaceId)
            .maybeSingle();

          if (template) {
            logs.push(`    → Email template "${template.name}" queued for ${contextData.clientEmail || 'unknown'}`);
          }
          stepsExecuted++;
        } else if (step.actionType === "notify_admin") {
          // Create notification for workspace admin
          const notifResult = await supabase.from("notifications").insert({
            workspace_id: workspaceId,
            appointment_id: contextData.appointmentId || null,
            client_id: contextData.clientId || null,
            type: "automation_alert",
            channel: "in_app",
            status: "sent",
            scheduled_for: new Date().toISOString(),
            sent_at: new Date().toISOString()
          });
          if (notifResult.error) console.warn("[Automation Job] Notification insert error:", notifResult.error.message);
          logs.push(`    → Admin notification created`);
          stepsExecuted++;
        } else if (step.actionType === "create_task") {
          logs.push(`    → Task creation logged (not yet implemented)`);
          stepsExecuted++;
        } else {
          logs.push(`    → Unknown action type: ${step.actionType}`);
        }
      } catch (stepErr: any) {
        logs.push(`    → Step failed: ${stepErr.message}`);
      }
    }
  }

  return {
    success: true,
    executedStepsCount: stepsExecuted,
    logs
  };
}
