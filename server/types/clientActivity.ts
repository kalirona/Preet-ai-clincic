export type ClientActivityType =
  | "client_created"
  | "appointment_created"
  | "appointment_completed"
  | "appointment_cancelled"
  | "note_added"
  | "email_sent"
  | "sms_sent"
  | "follow_up_generated"
  | "status_changed";

export interface ClientActivity {
  id: string;
  workspaceId: string;
  clientId: string;
  type: ClientActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  createdBy?: string;
  createdAt: string | Date;
}

