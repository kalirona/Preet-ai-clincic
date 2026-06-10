import { z } from "zod";

/**
 * Validation schema for creating a new service.
 */
export const createServiceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  durationMinutes: z.number().int().positive("Duration must be a positive integer in minutes"),
  price: z.number().nonnegative("Price cannot be a negative value"),
});

/**
 * Validation schema for updating an existing service.
 */
export const updateServiceSchema = z.object({
  name: z.string().min(1, "Service name cannot be empty").optional(),
  durationMinutes: z.number().int().positive("Duration must be a positive integer in minutes").optional(),
  price: z.number().nonnegative("Price cannot be a negative value").optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one service parameter must be provided for update." }
);

/**
 * Validation schema for creating a new appointment.
 */
export const createAppointmentSchema = z.object({
  clientId: z.string().uuid("Client ID must be a valid UUID"),
  serviceId: z.string().uuid("Service ID must be a valid UUID").optional().nullable(),
  staffName: z.string().min(1, "Staff name is required"),
  startTime: z.string().datetime({ message: "Start time must be a valid ISO 8601 timestamp string" }),
  endTime: z.string().datetime({ message: "End time must be a valid ISO 8601 timestamp string" }),
  status: z.enum(["scheduled", "confirmed", "completed", "cancelled", "no_show"]).optional(),
  notes: z.string().optional().nullable(),
}).refine(
  (data) => {
    const start = new Date(data.startTime).getTime();
    const end = new Date(data.endTime).getTime();
    return end > start;
  },
  {
    message: "End time must be later than start time",
    path: ["endTime"]
  }
);

/**
 * Validation schema for updating an appointment.
 */
export const updateAppointmentSchema = z.object({
  clientId: z.string().uuid("Client ID must be a valid UUID").optional(),
  serviceId: z.string().uuid("Service ID must be a valid UUID").optional().nullable(),
  staffName: z.string().min(1, "Staff name cannot be empty").optional(),
  startTime: z.string().datetime({ message: "Start time must be a valid ISO 8601 timestamp string" }).optional(),
  endTime: z.string().datetime({ message: "End time must be a valid ISO 8601 timestamp string" }).optional(),
  status: z.enum(["scheduled", "confirmed", "completed", "cancelled", "no_show"]).optional(),
  notes: z.string().optional().nullable(),
}).refine(
  (data) => {
    // If both start and end exist, ensure end is after start
    if (data.startTime && data.endTime) {
      const start = new Date(data.startTime).getTime();
      const end = new Date(data.endTime).getTime();
      return end > start;
    }
    return true;
  },
  {
    message: "End time must be later than start time",
    path: ["endTime"]
  }
).refine(
  (data) => {
    const keys = Object.keys(data).filter((k) => (data as any)[k] !== undefined);
    return keys.length > 0;
  },
  {
    message: "At least one scheduling parameter must be provided for update.",
  }
);
