import { Router, Response, NextFunction, Request } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { validateRequest } from "../middleware/validateRequest";
import { publicRateLimiter } from "../middleware/rateLimiters";
import { AuthenticatedRequest } from "../types/auth";
import { ApiError } from "../types/errors";
import { FormService } from "../services/form.service";
import { AuditLogService } from "../services/auditLog.service";
import { getWorkspaceId } from "../utils/workspace";
import { createFormSchema, updateFormSchema, submitFormSchema, updateResponseSchema } from "../validators/form.validator";

const router = Router();

// ============================================
// FORM BUILDER ROUTES (authenticated)
// ============================================

// GET / - List all form builders
router.get(
  "/",
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const forms = await FormService.getAll(workspaceId);
      res.json(forms);
    } catch (err) {
      next(err);
    }
  }
);

// GET /stats - Response statistics
router.get(
  "/stats",
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const stats = await FormService.getResponseStats(workspaceId);
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }
);

// GET /responses - List all responses (across all forms)
router.get(
  "/responses",
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const { formId, status, search } = req.query;
      const responses = await FormService.getResponses(workspaceId, {
        formId: formId as string,
        status: status as string,
        search: search as string,
      });
      res.json(responses);
    } catch (err) {
      next(err);
    }
  }
);

// GET /responses/:id - Get single response
router.get(
  "/responses/:id",
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const response = await FormService.getResponseById(req.params.id, workspaceId);
      if (!response) throw new ApiError(404, "Response not found.");
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /responses/:id - Update response status
router.put(
  "/responses/:id",
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  validateRequest(updateResponseSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const response = await FormService.updateResponse(req.params.id, workspaceId, req.body);
      if (!response) throw new ApiError(404, "Response not found.");
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /responses/:id - Delete response
router.delete(
  "/responses/:id",
  requireAuth as any,
  requireRole(["Owner", "Admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      await FormService.deleteResponse(req.params.id, workspaceId);
      res.json({ success: true, message: "Response deleted." });
    } catch (err) {
      next(err);
    }
  }
);

// GET /:id - Get form builder by ID
router.get(
  "/:id",
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const form = await FormService.getById(req.params.id, workspaceId);
      if (!form) throw new ApiError(404, "Form not found.");
      res.json(form);
    } catch (err) {
      next(err);
    }
  }
);

// GET /:id/embed - Get embed code for a form
router.get(
  "/:id/embed",
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const form = await FormService.getById(req.params.id, workspaceId);
      if (!form) throw new ApiError(404, "Form not found.");
      const origin = req.headers.origin || `${req.protocol}://${req.get("host")}`;
      res.json({
        inline: `<!-- Preet AI Form -->\n<div id="preet-form-${form.id}"></div>\n<script src="${origin}/widget.js"></script>\n<script>\n  window.PreetAI.renderForm({\n    formId: "${form.id}",\n    target: "#preet-form-${form.id}"\n  });\n</script>`,
        popup: `<!-- Preet AI Form (Popup) -->\n<script src="${origin}/widget.js"></script>\n<script>\n  window.PreetAI.openForm({ formId: "${form.id}" });\n</script>`,
        directLink: `${origin}/api/widget/form/${form.id}`,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST / - Create form builder
router.post(
  "/",
  requireAuth as any,
  requireRole(["Owner", "Admin"]),
  validateRequest(createFormSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const form = await FormService.create(workspaceId, req.body);
      await AuditLogService.createLog({
        workspaceId,
        userId: req.user?.id,
        action: `Created form: ${form.name}`,
        entityType: "FormBuilder",
        entityId: form.id,
        ipAddress: (req.headers["x-forwarded-for"] as string) || req.ip,
        userAgent: req.headers["user-agent"],
      });
      res.status(201).json(form);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /:id - Update form builder
router.put(
  "/:id",
  requireAuth as any,
  requireRole(["Owner", "Admin"]),
  validateRequest(updateFormSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const form = await FormService.update(req.params.id, workspaceId, req.body);
      if (!form) throw new ApiError(404, "Form not found.");
      await AuditLogService.createLog({
        workspaceId,
        userId: req.user?.id,
        action: `Updated form: ${form.name}`,
        entityType: "FormBuilder",
        entityId: form.id,
        ipAddress: (req.headers["x-forwarded-for"] as string) || req.ip,
        userAgent: req.headers["user-agent"],
      });
      res.json(form);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /:id - Delete form builder
router.delete(
  "/:id",
  requireAuth as any,
  requireRole(["Owner", "Admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const form = await FormService.getById(req.params.id, workspaceId);
      if (!form) throw new ApiError(404, "Form not found.");
      await FormService.delete(req.params.id, workspaceId);
      await AuditLogService.createLog({
        workspaceId,
        userId: req.user?.id,
        action: `Deleted form: ${form.name}`,
        entityType: "FormBuilder",
        entityId: form.id,
        ipAddress: (req.headers["x-forwarded-for"] as string) || req.ip,
        userAgent: req.headers["user-agent"],
      });
      res.json({ success: true, message: "Form deleted." });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================
// PUBLIC FORM ROUTES (no auth)
// ============================================

// GET /public/:formId - Get public form definition
router.get(
  "/public/:formId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const form = await FormService.getPublicForm(req.params.formId);
      if (!form) throw new ApiError(404, "Form not found or inactive.");
      res.json(form);
    } catch (err) {
      next(err);
    }
  }
);

// POST /public/:formId/submit - Submit form response
router.post(
  "/public/:formId/submit",
  publicRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answers, visitorName, visitorEmail, visitorPhone } = req.body;
      if (!answers || typeof answers !== "object") {
        throw new ApiError(400, "Answers are required.");
      }

      const result = await FormService.submitForm(req.params.formId, answers, {
        name: visitorName,
        email: visitorEmail,
        phone: visitorPhone,
        ip: (req.headers["x-forwarded-for"] as string) || req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.status(201).json({
        success: true,
        message: "Form submitted successfully.",
        conversationId: result.conversationId,
      });
    } catch (err: any) {
      if (err.message?.includes("not found")) {
        next(new ApiError(404, err.message));
      } else {
        next(err);
      }
    }
  }
);

export default router;
