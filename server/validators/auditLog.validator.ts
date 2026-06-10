import { z } from "zod";

/**
 * Validation schema for creating a new audit log record.
 */
export const createAuditLogSchema = z.object({
  action: z.string().min(1, "action is required"),
  entityType: z.string().min(1, "entityType is required"),
  entityId: z.string().optional(),
});
