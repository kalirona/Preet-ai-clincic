/**
 * Sentry Telemetry & Application Monitoring Orchestrator.
 * Handles server-side error capturing, performance monitoring, and tracing reporting.
 *
 * When SENTRY_DSN is set, real Sentry SDK is initialized.
 * When unset, errors are logged to console for local debugging.
 */
export class SentryOrchestrator {
  private static isInitialized = false;
  private static sentry: any = null;

  static init() {
    const dsn = process.env.SENTRY_DSN || "";
    const env = process.env.NODE_ENV || "development";

    if (!dsn) {
      console.info("[Sentry] No SENTRY_DSN set. Errors will be logged to console only.");
      this.isInitialized = true;
      return;
    }

    try {
      // Dynamic import to prevent startup block if the package isn't installed
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.sentry = require("@sentry/node");
      this.sentry.init({
        dsn,
        environment: env,
        tracesSampleRate: env === "production" ? 0.1 : 1.0,
      });
      this.isInitialized = true;
      console.log(`[Sentry] Initialized for environment: ${env}`);
    } catch (err: any) {
      console.warn("[Sentry] SDK not available, falling back to console logging:", err.message);
      this.isInitialized = true;
    }
  }

  /**
   * Capture and report any unexpected errors or stack traces to telemetry panel
   */
  static captureException(error: Error, additionalContext?: any) {
    if (this.sentry) {
      try {
        if (additionalContext) {
          this.sentry.withScope((scope: any) => {
            Object.entries(additionalContext).forEach(([key, value]) => {
              scope.setExtra(key, value);
            });
            this.sentry.captureException(error);
          });
        } else {
          this.sentry.captureException(error);
        }
        return;
      } catch (err: any) {
        console.error("[Sentry] Failed to capture exception:", err.message);
      }
    }
    // Fallback to console
    console.error("[Error]", error.message, additionalContext || "");
  }

  /**
   * Express middleware interceptor for tracking requests
   */
  static getRequestHandler() {
    if (this.sentry?.Handlers?.requestHandler) {
      return this.sentry.Handlers.requestHandler();
    }
    return (req: any, res: any, next: any) => next();
  }

  /**
   * Express middleware interceptor for catching unhandled error stacks
   */
  static getErrorHandler() {
    if (this.sentry?.Handlers?.errorHandler) {
      return this.sentry.Handlers.errorHandler();
    }
    return (error: any, req: any, res: any, next: any) => {
      this.captureException(error, { path: req.path, method: req.method });
      next(error);
    };
  }
}
