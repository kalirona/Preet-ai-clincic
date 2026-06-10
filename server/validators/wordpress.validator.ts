import { z } from "zod";

export const wordpressVerifySchema = z.object({
  siteUrl: z.string().min(1, "Site URL is required"),
  username: z.string().optional(),
  appPassword: z.string().optional(),
});

export const wordpressPublishSchema = z.object({
  siteUrl: z.string().min(1, "Site URL is required"),
  username: z.string().min(1, "Username is required"),
  appPassword: z.string().min(1, "Application Password is required"),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  status: z.string().optional().refine((val) => {
    if (!val) return true;
    return ["publish", "future", "draft", "pending", "private"].includes(val);
  }, {
    message: "Status must be publish, future, draft, pending, or private",
  }),
});
