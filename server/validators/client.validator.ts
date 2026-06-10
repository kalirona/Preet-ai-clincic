import { z } from "zod";

/**
 * Validation schema for creating a new client.
 * Requires at least a valid firstName.
 */
export const createClientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email address format").optional(),
  phone: z.string().min(1, "Phone number cannot be empty").optional(),
  tag: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Validation schema for updating a client.
 * Rejects completely empty request bodies (must provide at least one valid field).
 */
export const updateClientSchema = z.object({
  firstName: z.string().min(1, "First name cannot be empty if specified").optional(),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email address format").optional(),
  phone: z.string().optional(),
  tag: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => {
    const keys = Object.keys(data).filter(
      (key) => (data as any)[key] !== undefined
    );
    return keys.length > 0;
  },
  {
    message: "Payload cannot be empty. At least one field must be provided for update.",
  }
);
