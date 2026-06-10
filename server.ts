import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import cors from "cors";
import helmet from "helmet";
import * as dotenv from "dotenv";
import { SentryOrchestrator } from "./server/services/sentry";

// Import Security & Validation Layers
import { validateRequest } from "./server/middleware/validateRequest";
import { aiCompleteSchema } from "./server/validators/ai.validator";
import { aiRateLimiter } from "./server/middleware/rateLimiters";
import { globalErrorHandler } from "./server/middleware/globalErrorHandler";
import { requireAuth } from "./server/middleware/requireAuth";
import clientRouter from "./server/routes/client.routes";
import { appointmentRouter, servicesRouter } from "./server/routes/appointment.routes";
import clientActivityRouter from "./server/routes/clientActivity.routes";
import dashboardRouter from "./server/routes/dashboard.routes";
import teamRouter from "./server/routes/team.routes";
import notificationRouter from "./server/routes/notification.routes";
import automationRouter from "./server/routes/automation.routes";
import { publicBookingRouter } from "./server/routes/publicBooking.routes";
import { emailRouter } from "./server/routes/email.routes";
import auditLogRouter from "./server/routes/auditLog.routes";
import storageRouter from "./server/routes/storage.routes";
import searchRouter from "./server/routes/search.routes";
import adminToolsRouter from "./server/routes/adminTools.routes";
import featureFlagRouter from "./server/routes/featureFlag.routes";
import apiKeyRouter from "./server/routes/apiKey.routes";
import apiV1Router from "./server/routes/apiV1.routes";
import webhookRouter from "./server/routes/webhook.routes";
import paymentRouter from "./server/routes/payment.routes";
import agentRouter from "./server/routes/agent.routes";
import inboxRouter from "./server/routes/inbox.routes";
import widgetRouter from "./server/routes/widget.routes";
import formRouter from "./server/routes/form.routes";

// Import Background Queue & Jobs
import { globalQueue } from "./server/queues/queue";
import { handleAIJob } from "./server/jobs/ai.job";
import { handleEmailJob } from "./server/jobs/email.job";
import { handleAutomationJob } from "./server/jobs/automation.job";
import { handleReminderTickJob, processDueReminders } from "./server/jobs/reminder.job";

// Register Worker Handlers on globalQueue
globalQueue.registerHandler("ai_processing", handleAIJob);
globalQueue.registerHandler("email_dispatch", handleEmailJob);
globalQueue.registerHandler("automation_execute", handleAutomationJob);
globalQueue.registerHandler("reminder_tick", handleReminderTickJob);

// Launch continuous reminder scheduler (runs every 30 seconds)
const reminderInterval = setInterval(() => {
  processDueReminders().catch(err => {
    console.error("[Scheduler] Error running background reminder polling:", err);
  });
}, 30000);

dotenv.config();

// Initialize Sentry Tracking & Telemetry Orchestration
SentryOrchestrator.init();

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

app.set("trust proxy", 1);

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const allowedOrigins = (process.env.CORS_ORIGINS || "").split(",").filter(Boolean);
app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : false,
  credentials: true,
}));

// Mount Sentry Request Handler
app.use(SentryOrchestrator.getRequestHandler());

// C7: Limit request body size to 1MB
app.use(express.json({ limit: "1mb" }));

// --- AI SERVICE LAYER ---
const getGeminiClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });
};

const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

// Unified AI completion endpoint with security middlewares
app.post(
  "/api/ai/complete",
  aiRateLimiter,
  requireAuth as any,
  validateRequest(aiCompleteSchema),
  async (req, res, next) => {
    const { provider, model, prompt, systemInstruction } = req.body;

    try {
      const result = await globalQueue.enqueueAndWait("ai_processing", {
        provider,
        model,
        prompt,
        systemInstruction
      });
      return res.json(result);
    } catch (error: any) {
      next(error);
    }
  }
);

// --- MONITORING & UPTIME DIAGNOSTICS ---
app.get("/health", async (req, res) => {
  let dbStatus = "disconnected";
  try {
    const { getSupabaseServerClient } = require("./server/middleware/requireAuth");
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("workspaces").select("id", { count: "exact", head: true });
    dbStatus = error ? "error" : "connected";
  } catch {
    dbStatus = "disconnected";
  }
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      server: "healthy",
      database: dbStatus
    },
    version: "1.0.0"
  });
});

app.get("/ready", (req, res) => {
  res.json({
    status: "ready",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    channel: "stable"
  });
});

// --- CLIENT CRM ROUTES ---
app.use("/api/clients", clientRouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api/services", servicesRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/team", teamRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/automations", automationRouter);
app.use("/api/public/booking", publicBookingRouter);
app.use("/api/email", emailRouter);
app.use("/api/audit-logs", auditLogRouter);
app.use("/api/storage", storageRouter);
app.use("/api/search", searchRouter);
app.use("/api/admin", adminToolsRouter);
app.use("/api/feature-flags", featureFlagRouter);
app.use("/api/api-keys", apiKeyRouter);
app.use("/api/v1", apiV1Router);
app.use("/api/webhooks", webhookRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/agents", agentRouter);
app.use("/api/inbox", inboxRouter);
app.use("/api/widget", widgetRouter);
app.use("/api/forms", formRouter);

// C4: Protect uploaded files with auth middleware
app.use("/uploads", requireAuth as any, express.static(path.join(process.cwd(), "uploads")));

// Serve widget.js with correct MIME type for cross-origin embedding
app.get("/widget.js", (req, res) => {
  const widgetPath = path.join(process.cwd(), process.env.NODE_ENV === "production" ? "dist" : "dist", "widget.js");
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.sendFile(widgetPath, (err) => {
    if (err) res.status(404).end();
  });
});

app.use("/", clientActivityRouter);

// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Register Sentry Error Handling Layer
  app.use(SentryOrchestrator.getErrorHandler());

  // Register Global Error Handling Layer
  app.use(globalErrorHandler);

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // M8: Graceful shutdown
  const shutdown = (signal: string) => {
    console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
    clearInterval(reminderInterval);
    server.close(() => {
      console.log("[Server] HTTP server closed.");
      process.exit(0);
    });
    // Force exit after 10s if connections hang
    setTimeout(() => {
      console.error("[Server] Forced shutdown after timeout.");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer();
