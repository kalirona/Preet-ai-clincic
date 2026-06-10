import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import axios from "axios";
import * as dotenv from "dotenv";
import { SentryOrchestrator } from "./server/services/sentry";

// Import Security & Validation Layers
import { validateRequest } from "./server/middleware/validateRequest";
import { aiCompleteSchema } from "./server/validators/ai.validator";
import { seoScanSchema } from "./server/validators/seo.validator";
import { wordpressVerifySchema, wordpressPublishSchema } from "./server/validators/wordpress.validator";
import { aiRateLimiter, seoRateLimiter, wordpressRateLimiter } from "./server/middleware/rateLimiters";
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
setInterval(() => {
  processDueReminders().catch(err => {
    console.error("[Scheduler] Error running background reminder polling:", err);
  });
}, 30000);

dotenv.config();

// Initialize Sentry Tracking & Telemetry Orchestration
SentryOrchestrator.init();

const app = express();
const PORT = 3000;

app.set("trust proxy", 1);

// Mount Sentry Request Handler
app.use(SentryOrchestrator.getRequestHandler());

app.use(express.json());

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

// --- SEO SCANNER ---
app.post(
  "/api/seo/scan",
  seoRateLimiter,
  requireAuth as any,
  validateRequest(seoScanSchema),
  async (req, res, next) => {
    const { url } = req.body;

    try {
      // Simple scraper logic for preview
      const response = await axios.get(url, { timeout: 5000 });
      const html = response.data;
      
      const titleMatch = html.match(/<title>(.*?)<\/title>/);
      const metaDescMatch = html.match(/<meta name="description" content="(.*?)"/);
      const h1Count = (html.match(/<h1/g) || []).length;
      
      res.json({
        url,
        title: titleMatch ? titleMatch[1] : "Not found",
        description: metaDescMatch ? metaDescMatch[1] : "Not found",
        h1Count,
        issues: [
          !titleMatch && "Missing title tag",
          !metaDescMatch && "Missing meta description",
          h1Count === 0 && "No H1 tags found",
          h1Count > 1 && "Multiple H1 tags found"
        ].filter(Boolean)
      });
    } catch (error: any) {
      next(error);
    }
  }
);

// --- WORDPRESS PROXY ---
app.post(
  "/api/wordpress/verify",
  wordpressRateLimiter,
  requireAuth as any,
  validateRequest(wordpressVerifySchema),
  async (req, res, next) => {
    let { siteUrl, username, appPassword } = req.body;

    // Sanitize URL
    if (!siteUrl.startsWith("http://") && !siteUrl.startsWith("https://")) {
      siteUrl = `https://${siteUrl}`;
    }
    // Trim trailing slash
    siteUrl = siteUrl.replace(/\/+$/, "");

    try {
      // 1. Fetch main site info
      const siteInfoRes = await axios.get(`${siteUrl}/wp-json/`, { timeout: 8000 });
      const siteName = siteInfoRes.data?.name || "WordPress Site";
      const siteDescription = siteInfoRes.data?.description || "";

      // 2. Validate auth with /wp-json/wp/v2/users/me
      let userDetails = null;
      let authHeader = "";
      if (username && appPassword) {
        authHeader = "Basic " + Buffer.from(`${username}:${appPassword}`).toString("base64");
        try {
          const authRes = await axios.get(`${siteUrl}/wp-json/wp/v2/users/me`, {
            headers: { Authorization: authHeader },
            timeout: 8000
          });
          userDetails = authRes.data;
        } catch (authErr: any) {
          console.warn("WP Auth failed:", authErr.message);
          return res.status(401).json({ 
            error: "Authentication failed. Please verify your WordPress Username and Application Password.",
            details: authErr.response?.data || authErr.message
          });
        }
      }

      // 3. Get posts counter
      let postsCount = 0;
      try {
        const postsRes = await axios.get(`${siteUrl}/wp-json/wp/v2/posts?per_page=1`, {
          headers: username && appPassword ? { Authorization: authHeader } : {},
          timeout: 8000
        });
        postsCount = parseInt(postsRes.headers["x-wp-total"] || "0", 10) || 0;
      } catch (postsErr: any) {
        console.warn("Failed to fetch posts count:", postsErr.message);
      }

      // 4. Get pages counter
      let pagesCount = 0;
      try {
        const pagesRes = await axios.get(`${siteUrl}/wp-json/wp/v2/pages?per_page=1`, {
          headers: username && appPassword ? { Authorization: authHeader } : {},
          timeout: 8000
        });
        pagesCount = parseInt(pagesRes.headers["x-wp-total"] || "0", 10) || 0;
      } catch (pagesErr: any) {
        console.warn("Failed to fetch pages count:", pagesErr.message);
      }

      return res.json({
        success: true,
        name: siteName,
        description: siteDescription,
        url: siteUrl,
        posts: postsCount,
        pages: pagesCount,
        user: userDetails ? { id: userDetails.id, name: userDetails.name } : null
      });
    } catch (err: any) {
      next(err);
    }
  }
);

app.post(
  "/api/wordpress/publish",
  wordpressRateLimiter,
  requireAuth as any,
  validateRequest(wordpressPublishSchema),
  async (req, res, next) => {
    const { siteUrl, username, appPassword, title, content, status } = req.body;
    
    try {
      const wpRes = await axios.post(`${siteUrl}/wp-json/wp/v2/posts`, {
        title,
        content,
        status: status || 'draft'
      }, {
        auth: { username, password: appPassword }
      });
      res.json(wpRes.data);
    } catch (error: any) {
      next(error);
    }
  }
);

// --- MONITORING & UPTIME DIAGNOSTICS ---
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      server: "healthy",
      database: "connected"
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
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
