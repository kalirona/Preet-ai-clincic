import { Router, Response, NextFunction } from "express";
import { clientRateLimiter } from "../middleware/rateLimiters";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { validateRequest } from "../middleware/validateRequest";
import { AuthenticatedRequest } from "../types/auth";
import { ApiError } from "../types/errors";
import { ClientService } from "../services/client.service";
import { AuditLogService } from "../services/auditLog.service";
import { getWorkspaceId } from "../utils/workspace";
import { createClientSchema, updateClientSchema } from "../validators/client.validator";

const router = Router();

// GET /api/clients - Retrieves all clients within the workspace context
router.get(
  "/",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const includeDeleted = req.query.includeDeleted === "true";
      const clients = await ClientService.getClients(workspaceId, includeDeleted);
      res.json(clients);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/clients/:id - Fetch details of a single isolated client contact
router.get(
  "/:id",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const clientId = req.params.id;
      const client = await ClientService.getClientById(clientId, workspaceId);
      
      if (!client) {
        throw new ApiError(404, "Client not found in this workspace.");
      }
      
      res.json(client);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/clients - Create a new client record
router.post(
  "/",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  validateRequest(createClientSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const newClient = await ClientService.createClient(workspaceId, req.body);
      
      // Track audit event
      await AuditLogService.createLog({
        workspaceId,
        userId: req.user?.id,
        action: `Client created: ${newClient.firstName} ${newClient.lastName || ""}`.trim(),
        entityType: "Client",
        entityId: newClient.id,
        ipAddress: (req.headers["x-forwarded-for"] as string) || req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.status(201).json(newClient);
    } catch (err: any) {
      if (err.message && err.message.includes("already exists")) {
        next(new ApiError(400, err.message));
        return;
      }
      next(err);
    }
  }
);

// PUT /api/clients/:id - Revise fields of an isolated client record
router.put(
  "/:id",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  validateRequest(updateClientSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const clientId = req.params.id;
      const updatedClient = await ClientService.updateClient(clientId, workspaceId, req.body);
      
      if (!updatedClient) {
        throw new ApiError(404, "Client not found in this workspace.");
      }
      
      // Track audit event
      await AuditLogService.createLog({
        workspaceId,
        userId: req.user?.id,
        action: `Client updated: ${updatedClient.firstName} ${updatedClient.lastName || ""}`.trim(),
        entityType: "Client",
        entityId: updatedClient.id,
        ipAddress: (req.headers["x-forwarded-for"] as string) || req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.json(updatedClient);
    } catch (err: any) {
      if (err.message && err.message.includes("already exists")) {
        next(new ApiError(400, err.message));
        return;
      }
      next(err);
    }
  }
);

// DELETE /api/clients/:id - Safely purge of a client entry if within organizational bounds
router.delete(
  "/:id",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const clientId = req.params.id;
      
      const client = await ClientService.getClientById(clientId, workspaceId);
      if (!client) {
        throw new ApiError(404, "Client not found in this workspace.");
      }
      
      await ClientService.deleteClient(clientId, workspaceId);

      // Track audit event
      await AuditLogService.createLog({
        workspaceId,
        userId: req.user?.id,
        action: `Client deleted: ${client.firstName} ${client.lastName || ""}`.trim(),
        entityType: "Client",
        entityId: clientId,
        ipAddress: (req.headers["x-forwarded-for"] as string) || req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.json({ success: true, message: "Client successfully removed." });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/clients/:id/restore - Restore a soft-deleted client
router.post(
  "/:id/restore",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const clientId = req.params.id;

      // Fetch client with includeDeleted flag set to true
      const client = await ClientService.getClientById(clientId, workspaceId, true);
      if (!client) {
        throw new ApiError(404, "Client not found in this workspace.");
      }

      await ClientService.restoreClient(clientId, workspaceId);

      // Track audit event
      await AuditLogService.createLog({
        workspaceId,
        userId: req.user?.id,
        action: `Client restored: ${client.firstName} ${client.lastName || ""}`.trim(),
        entityType: "Client",
        entityId: clientId,
        ipAddress: (req.headers["x-forwarded-for"] as string) || req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.json({ success: true, message: "Client successfully restored.", client });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
