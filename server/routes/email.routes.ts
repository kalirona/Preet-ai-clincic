import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { globalQueue } from "../queues/queue";

export const emailRouter = Router();

interface EmailTestPayload {
  driver: "resend" | "sendgrid" | "smtp" | "sandbox";
  toEmail: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  
  // Resend Config
  resendApiKey?: string;
  resendFromEmail?: string;
  resendFromName?: string;

  // SendGrid Config
  sendgridApiKey?: string;
  sendgridFromEmail?: string;
  sendgridFromName?: string;

  // SMTP Config
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSecure?: boolean;
  smtpFromEmail?: string;
  smtpFromName?: string;
}

/**
 * Test or send emails dynamically using Resend, SMTP, or SendGrid configurations
 * executes safely inside the Background Queue to keep request-response cycles ultra fast.
 */
emailRouter.post("/test", requireAuth as any, async (req: Request, res: Response) => {
  const payload = req.body as EmailTestPayload;

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
