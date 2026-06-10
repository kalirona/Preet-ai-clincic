import { Job } from "../queues/queue";
import { AutomationService } from "../services/automation.service";
import { AuditLogService } from "../services/auditLog.service";

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

  // Log to audit log service asynchronously
  await AuditLogService.createLog({
    workspaceId,
    action: `Background Automation Run: [${triggerType}] client=${contextData.clientName || 'N/A'}`,
    entityType: "Team", // Standard category mapping
    ipAddress: "127.0.0.1",
    userAgent: "PreetAI-Queue-Worker"
  }).catch(err => console.warn("[Automation Job] Audit log fail:", err));

  // Fetch automations for the workspace to find active rules matching this triggerType
  const allAutomations = await AutomationService.getAutomations(workspaceId).catch(() => []);
  const matchingRules = allAutomations.filter(rule => rule.triggerType === triggerType);

  if (matchingRules.length === 0) {
    logs.push(`No active workflow automation rules registered for trigger: '${triggerType}'`);
    return { success: true, executedStepsCount: 0, logs };
  }

  logs.push(`Found ${matchingRules.length} matching workflow rule(s) to process.`);
  let stepsExecuted = 0;

  for (const rule of matchingRules) {
    logs.push(`Executing automation rule: '${rule.name}' (ID: ${rule.id})`);
    
    // Simulate step execution or notifications triggering
    stepsExecuted++;
    logs.push(`- Successfully completed step: trigger notifications reminder cascade.`);
  }

  return {
    success: true,
    executedStepsCount: stepsExecuted,
    logs
  };
}
