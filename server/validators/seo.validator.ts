import { z } from "zod";

export const seoScanSchema = z.object({
  url: z.string()
    .min(1, "URL is required")
    .url("URL must be a valid URL")
    .refine((val) => val.startsWith("http://") || val.startsWith("https://"), {
      message: "URL must start with http:// or https://",
    }),
});
