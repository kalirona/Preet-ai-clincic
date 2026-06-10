export type TriggerType = 'client_created' | 'appointment_completed' | 'appointment_cancelled' | 'lead_inactive';
export type ActionType = 'send_email' | 'notify_admin' | 'send_sms';

export interface EmailTemplate {
  id: string;
  workspaceId: string;
  name: string;
  subject: string;
  body: string;
  category: 'welcome' | 'appointment_reminder' | 'cancellation' | 'follow_up' | string;
  createdAt: string;
  updatedAt: string;
}

export interface Automation {
  id: string;
  workspaceId: string;
  name: string;
  triggerType: TriggerType | string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  steps?: AutomationStep[];
}

export interface AutomationStep {
  id: string;
  automationId: string;
  stepNumber: number;
  actionType: ActionType | string;
  templateId?: string | null;
  delayDays: number;
  createdAt: string;
}
