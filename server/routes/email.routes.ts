import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { globalQueue } from "../queues/queue";
import { EmailJobPayload } from "../jobs/email.job";

export const emailRouter = Router();

/**
 * Test or send emails dynamically using Resend, SMTP, or SendGrid configurations
 * executes safely inside the Background Queue to keep request-response cycles ultra fast.
 */
emailRouter.post("/test", requireAuth as any, async (req: Request, res: Response) => {
  const payload = req.body as EmailJobPayload;

  try {
    const result = await globalQueue.enqueueAndWait("email_dispatch", payload);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: `Failed to dispatch background email job: ${error.message || error}`,
      diagnosticLogs: [error.message || String(error)]
    });
  }
});
