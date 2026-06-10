import { z } from "zod";

/**
 * Zod schema to validate client activity creation payloads.
 * Strictly guarantees type fits defined enum criteria, and validates title, description and metadata.
 */
export const createClientActivitySchema = z.object({
  type: z.enum([
    "client_created",
    "appointment_created",
    "appointment_completed",
    "appointment_cancelled",
    "note_added",
    "email_sent",
    "sms_sent",
    "follow_up_generated",
    "status_changed"
  ], {
    message: "Invalid activity type specified",
  }),
  title: z.string().min(1, "Activity title is required"),
  description: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

