import { z } from "zod";

export const aiCompleteSchema = z.object({
  provider: z.string().refine((val) => ["gemini", "openai", "ollama"].includes(val), {
    message: "Provider must be gemini, openai, or ollama",
  }),
  prompt: z.string().min(1, "Prompt cannot be empty").max(50000, "Prompt exceeds maximum characters limit"),
  model: z.string().optional(),
  systemInstruction: z.string().optional(),
});
