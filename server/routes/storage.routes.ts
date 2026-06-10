import { Router, Response, NextFunction } from "express";
import multer from "multer";
import { clientRateLimiter } from "../middleware/rateLimiters";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { AuthenticatedRequest } from "../types/auth";
import { ApiError } from "../types/errors";
import { DocumentService } from "../services/document.service";
import { StorageService } from "../services/storage.service";
import { AuditLogService } from "../services/auditLog.service";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const getWorkspaceId = (req: AuthenticatedRequest): string => {
  const wsId =
    (req.headers["x-workspace-id"] as string) ||
    (req.body?.workspaceId as string) ||
    (req.body?.workspace_id as string) ||
    (req.query?.workspaceId as string) ||
    (req.query?.workspace_id as string);

  if (!wsId) {
    throw new ApiError(400, "Workspace context is required.");
  }
  return wsId;
};

// GET /api/storage/documents - List documents in the workspace
router.get(
  "/documents",
  clientRateLimiter,
  requireAuth as any,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const { clientId, appointmentId, category } = req.query;

      const docs = await DocumentService.getDocuments(workspaceId, {
        clientId: clientId as string,
        appointmentId: appointmentId as string,
        category: category as string,
      });

      res.json(docs);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/storage/upload - Upload and save document metadata
router.post(
  "/upload",
  clientRateLimiter,
  requireAuth as any,
  upload.single("file"),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const { clientId, appointmentId, category, customName } = req.body;
      const file = req.file;

      if (!file) {
        throw new ApiError(400, "No file was provided in the multipart 'file' field.");
      }

      const activeCategory = category || "document";

      // Upload file to storage using StorageService
      const fileMeta = await StorageService.uploadFile(
        file.buffer,
        customName || file.originalname,
        file.mimetype,
        workspaceId
      );

      // Save database record
      const document = await DocumentService.createDocument(workspaceId, {
        clientId: clientId || undefined,
        appointmentId: appointmentId || undefined,
        name: fileMeta.name,
        fileUrl: fileMeta.fileUrl,
        fileSize: fileMeta.fileSize,
        mimeType: fileMeta.mimeType,
        category: activeCategory,
        uploadedBy: req.user?.id,
      });

      // Create Audit Log
      await AuditLogService.createLog({
        workspaceId,
        userId: req.user?.id,
        action: `File Uploaded: ${fileMeta.name} (category: ${activeCategory})`,
        entityType: "Client",
        entityId: clientId || undefined,
        ipAddress: (req.headers["x-forwarded-for"] as string) || req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.status(201).json({
        success: true,
        message: "File successfully uploaded and cataloged.",
        document,
      });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/storage/documents/:id - Remove document and binary file
router.delete(
  "/documents/:id",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const documentId = req.params.id;

      const doc = await DocumentService.getDocumentById(documentId, workspaceId);
      if (!doc) {
        throw new ApiError(404, "Document not found in this workspace context.");
      }

      // Delete from storage
      await StorageService.deleteFile(doc.fileUrl);

      // Delete from database
      await DocumentService.deleteDocument(documentId, workspaceId);

      // Create Audit Log
      await AuditLogService.createLog({
        workspaceId,
        userId: req.user?.id,
        action: `File Deleted: ${doc.name}`,
        entityType: "Client",
        entityId: doc.clientId || undefined,
        ipAddress: (req.headers["x-forwarded-for"] as string) || req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.json({ success: true, message: "Document successfully purged." });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
