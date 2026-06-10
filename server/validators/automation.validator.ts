import { z } from "zod";

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  subject: z.string().min(1, "Subject line is required"),
  body: z.string().min(1, "Template body text is required"),
  category: z.string().min(1, "Category is required")
});

export const updateTemplateSchema = z.object({
  name: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
  category: z.string().optional()
});

export const createAutomationSchema = z.object({
  name: z.string().min(1, "Automation rule name is required"),
  triggerType: z.string().min(1, "Trigger type is required"),
  isActive: z.boolean().optional(),
  steps: z.array(z.object({
    stepNumber: z.number().int().positive().optional(),
    actionType: z.string().min(1, "Action type is required"),
    templateId: z.string().nullable().optional(),
    delayDays: z.number().int().nonnegative().optional()
  })).optional()
});

export const updateAutomationSchema = z.object({
  name: z.string().optional(),
  triggerType: z.string().optional(),
  isActive: z.boolean().optional(),
  steps: z.array(z.object({
    id: z.string().optional(),
    stepNumber: z.number().int().positive().optional(),
    actionType: z.string().optional(),
    templateId: z.string().nullable().optional(),
    delayDays: z.number().int().nonnegative().optional(),
    createdAt: z.string().optional()
  })).optional()
});
