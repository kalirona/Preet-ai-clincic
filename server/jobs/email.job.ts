import nodemailer from "nodemailer";
import axios from "axios";
import { Job } from "../queues/queue";

export interface EmailJobPayload {
  driver: "resend" | "sendgrid" | "smtp" | "sandbox" | string;
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

export interface EmailJobResult {
  success: boolean;
  message: string;
  id?: string;
  response?: string;
  diagnosticLogs: string[];
}

export async function handleEmailJob(job: Job<EmailJobPayload, EmailJobResult>): Promise<EmailJobResult> {
  const payload = job.data;
  const logs: string[] = [];
  
  const logStep = (msg: string) => {
    const time = new Date().toISOString().split("T")[1].substring(0, 8);
    logs.push(`[${time}] ${msg}`);
  };

  logStep(`⚡ Background Dispatch Queue picked up execution item for driver: [${payload.driver.toUpperCase()}]`);

  if (!payload.toEmail) {
    logStep(`❌ Error: missing target recipient email address.`);
    throw new Error("Recipient email address is required.");
  }

  const subject = payload.subject || "Email Notification Update";
  const bodyText = payload.bodyText || "High-fidelity Workspace notification message.";
  const bodyHtml = payload.bodyHtml || `<div style="font-family: sans-serif; padding: 20px; color: #1e293b; background: #f8fafc; border-radius: 8px;">
    <h3>Workspace Update Notification</h3>
    <p>${bodyText}</p>
  </div>`;

  // 1. SIMULATED SANDBOX DRIVER
  if (payload.driver === "sandbox") {
    logStep(`📡 Mounting simulated SMTP sandbox interface...`);
    logStep(`📦 Generated email MIME structure layout - size: ${Buffer.byteLength(bodyHtml)} units.`);
    logStep(`🚀 Negotiating handshake with virtual server MX records.`);
    await new Promise(resolve => setTimeout(resolve, 800));
    logStep(`📥 Queue accepted by remote mailbox. Index: #JOB-Q-${Math.floor(Math.random() * 89999 + 10000)}`);
    logStep(`✅ Sandboxed dispatch operation success.`);

    return {
      success: true,
      message: "Simulated sandbox email dispatched successfully in background!",
      diagnosticLogs: logs
    };
  }

  // 2. RESEND DRIVER
  if (payload.driver === "resend") {
    const apiKey = payload.resendApiKey || process.env.RESEND_API_KEY;
    const fromEmail = payload.resendFromEmail || "onboarding@resend.dev";
    const fromName = payload.resendFromName || "Preet AI Workspace";

    logStep(`📡 Preparing Resend client REST gateway call...`);
    if (!apiKey) {
      logStep(`❌ Missing Resend API Auth Key. Terminating.`);
      throw new Error("Resend API Key is missing. Complete setup configurations.");
    }

    logStep(`From: ${fromName} <${fromEmail}> | To: ${payload.toEmail}`);
    const resendRes = await axios.post(
      "https://api.resend.com/emails",
      {
        from: `${fromName} <${fromEmail}>`,
        to: [payload.toEmail],
        subject,
        html: bodyHtml,
        text: bodyText
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        }
      }
    );

    logStep(`📬 REST HTTP call returned: ${resendRes.status}`);
    return {
      success: true,
      message: "Email dispatched successfully via Resend API in background!",
      id: resendRes.data?.id,
      diagnosticLogs: logs
    };
  }

  // 3. SENDGRID DRIVER
  if (payload.driver === "sendgrid") {
    const apiKey = payload.sendgridApiKey || process.env.SENDGRID_API_KEY;
    const fromEmail = payload.sendgridFromEmail || "alerts@preetai.com";
    const fromName = payload.sendgridFromName || "Preet AI Workspace";

    logStep(`📡 Preparing SendGrid REST API wrapper connection...`);
    if (!apiKey) {
      logStep(`❌ Error: SendGrid Authorization Key is omitted.`);
      throw new Error("SendGrid API Credential Key is omitted.");
    }

    const bodyPayload = {
      personalizations: [{ to: [{ email: payload.toEmail }] }],
      from: { email: fromEmail, name: fromName },
      subject,
      content: [
        { type: "text/plain", value: bodyText },
        { type: "text/html", value: bodyHtml }
      ]
    };

    const sgRes = await axios.post(
      "https://api.sendgrid.com/v3/mail/send",
      bodyPayload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        }
      }
    );

    logStep(`📥 SendGrid gateway responded with status: ${sgRes.status}`);
    return {
      success: true,
      message: "Email dispatched successfully via SendGrid V3 Web API in background!",
      diagnosticLogs: logs
    };
  }

  // 4. SMTP DRIVER
  if (payload.driver === "smtp") {
    const host = payload.smtpHost;
    const port = Number(payload.smtpPort) || 587;
    const user = payload.smtpUser;
    const pass = payload.smtpPass;
    const secure = payload.smtpSecure || false;
    const fromEmail = payload.smtpFromEmail || "relay@preetai.com";
    const fromName = payload.smtpFromName || "Preet AI Relays";

    logStep(`📡 Building SMTP Connection socket pool...`);
    if (!host) {
      logStep(`❌ Error: Target SMTP Server Host is undefined.`);
      throw new Error("SMTP server address / host is required.");
    }

    logStep(`🔒 Establishing TLS secure stream: ${host}:${port}`);
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
      tls: { rejectUnauthorized: false }
    });

    await transporter.verify();
    logStep(`🤝 Socket handshake successfully negotiated.`);

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: payload.toEmail,
      subject,
      text: bodyText,
      html: bodyHtml
    });

    logStep(`💾 Stream flush completed. SMTP Server reply: ${info.response}`);
    return {
      success: true,
      message: "Email successfully delivered via custom SMTP server in background!",
      id: info.messageId,
      response: info.response,
      diagnosticLogs: logs
    };
  }

  throw new Error(`Unsupported background mail driver identifier: '${payload.driver}'`);
}
