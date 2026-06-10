import { z } from "zod";

const formFieldSchema = z.object({
  type: z.enum(["text", "email", "phone", "textarea", "select", "checkbox", "date", "number"]),
  label: z.string().min(1, "Field label is required"),
  name: z.string().min(1, "Field name is required"),
  required: z.boolean().default(false),
  placeholder: z.string().optional().default(""),
  options: z.array(z.string()).optional().default([]),
});

const formSettingsSchema = z.object({
  submitButtonText: z.string().optional().default("Submit"),
  successMessage: z.string().optional().default("Thank you for your submission!"),
  redirectUrl: z.string().url().optional().nullable().default(null),
  notifyEmail: z.string().email().optional().nullable().default(null),
  createConversation: z.boolean().optional().default(true),
  assignAgentId: z.string().uuid().optional().nullable().default(null),
});

export const createFormSchema = z.object({
  name: z.string().min(1, "Form name is required").max(255),
  description: z.string().optional().default(""),
  fields: z.array(formFieldSchema).min(1, "At least one field is required"),
  settings: formSettingsSchema.optional().default({
    submitButtonText: "Submit",
    successMessage: "Thank you for your submission!",
    createConversation: true,
  }),
  brandColor: z.string().optional().default("#7c3aed"),
  isActive: z.boolean().optional().default(true),
});

export const updateFormSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  fields: z.array(formFieldSchema).optional(),
  settings: formSettingsSchema.optional(),
  brandColor: z.string().optional(),
  isActive: z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided for update." }
);

export const submitFormSchema = z.object({
  answers: z.record(z.string(), z.any()),
  visitorName: z.string().max(255).optional(),
  visitorEmail: z.string().email().optional().nullable(),
  visitorPhone: z.string().max(50).optional().nullable(),
});

export const updateResponseSchema = z.object({
  status: z.enum(["new", "read", "archived", "converted"]),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided for update." }
);
