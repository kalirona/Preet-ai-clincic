export type NotificationType = "reminder" | "follow_up";
export type NotificationChannel = "email" | "sms";
export type NotificationStatus = "pending" | "sent" | "failed" | "cancelled";

export interface Notification {
  id: string;
  workspaceId: string;
  appointmentId: string;
  clientId: string;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  scheduledFor: string | Date;
  sentAt?: string | Date;
  errorMessage?: string;
  createdAt: string | Date;
}

export interface CreateNotificationRequest {
  appointmentId: string;
  clientId: string;
  type: NotificationType;
  channel: NotificationChannel;
  scheduledFor: string;
}

export interface UpdateNotificationStatusRequest {
  status: NotificationStatus;
  errorMessage?: string;
  sentAt?: string;
}
