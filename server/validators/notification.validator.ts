import { z } from "zod";

export const createNotificationSchema = z.object({
  appointmentId: z.string().uuid("Invalid appointment ID format (UUID expected)."),
  clientId: z.string().uuid("Invalid client ID format (UUID expected)."),
  type: z.enum(["reminder", "follow_up"], {
    message: "Type must be either 'reminder' or 'follow_up'.",
  }),
  channel: z.enum(["email", "sms"], {
    message: "Channel must be either 'email' or 'sms'.",
  }),
  scheduledFor: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "scheduledFor must be a valid date string.",
  }),
});

export const updateNotificationStatusSchema = z.object({
  status: z.enum(["pending", "sent", "failed", "cancelled"], {
    message: "Status must be either 'pending', 'sent', 'failed', or 'cancelled'.",
  }),
  errorMessage: z.string().optional(),
  sentAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "sentAt must be a valid date string.",
  }).optional(),
});
