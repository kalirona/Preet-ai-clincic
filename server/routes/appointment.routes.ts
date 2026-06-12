import { Router, Response, NextFunction } from "express";
import { clientRateLimiter } from "../middleware/rateLimiters";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { validateRequest } from "../middleware/validateRequest";
import { AuthenticatedRequest } from "../types/auth";
import { ApiError } from "../types/errors";
import { 
  createAppointmentSchema, 
  updateAppointmentSchema,
  createServiceSchema,
  updateServiceSchema
} from "../validators/appointment.validator";
import { AppointmentService } from "../services/appointment.service";
import { AuditLogService } from "../services/auditLog.service";

// ==========================================
// APPOINTMENTS ROUTER
// ==========================================
const appointmentRouter = Router();

/**
 * Helper to extract and validate workspace boundary context from several input channels.
 */
import { getWorkspaceId } from "../utils/workspace";

// GET /api/appointments - Retrieves all appointments in a tenant workspace
appointmentRouter.get(
  "/",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const appointments = await AppointmentService.getAppointments(workspaceId);
      res.json(appointments);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/appointments/:id - Fetch details of a single appointment
appointmentRouter.get(
  "/:id",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const id = req.params.id;
      const appointment = await AppointmentService.getAppointmentById(id, workspaceId);
      
      if (!appointment) {
        throw new ApiError(404, "Appointment not found in this workspace.");
      }
      
      res.json(appointment);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/appointments - Book a new client session appointment
appointmentRouter.post(
  "/",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  validateRequest(createAppointmentSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const newAppointment = await AppointmentService.createAppointment(workspaceId, req.body);

      // Track audit event
      await AuditLogService.createLog({
        workspaceId,
        userId: req.user?.id,
        action: `Appointment created with ${newAppointment.staffName}`.trim(),
        entityType: "Appointment",
        entityId: newAppointment.id,
        ipAddress: (req.headers["x-forwarded-for"] as string) || req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.status(201).json(newAppointment);
    } catch (err: any) {
      next(err);
    }
  }
);

// PUT /api/appointments/:id - Revise details of an appointment booking
appointmentRouter.put(
  "/:id",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  validateRequest(updateAppointmentSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const id = req.params.id;
      const updatedAppointment = await AppointmentService.updateAppointment(id, workspaceId, req.body);

      if (updatedAppointment) {
        // Track audit event
        await AuditLogService.createLog({
          workspaceId,
          userId: req.user?.id,
          action: `Appointment updated for ${updatedAppointment.staffName}`.trim(),
          entityType: "Appointment",
          entityId: updatedAppointment.id,
          ipAddress: (req.headers["x-forwarded-for"] as string) || req.ip,
          userAgent: req.headers["user-agent"],
        });
      }

      res.json(updatedAppointment);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/appointments/:id - Cancel or delete a client appointment booking
appointmentRouter.delete(
  "/:id",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const id = req.params.id;

      const appointment = await AppointmentService.getAppointmentById(id, workspaceId);
      await AppointmentService.deleteAppointment(id, workspaceId);

      // Track audit event
      if (appointment) {
        await AuditLogService.createLog({
          workspaceId,
          userId: req.user?.id,
          action: `Appointment deleted for ${appointment.staffName}`.trim(),
          entityType: "Appointment",
          entityId: id,
          ipAddress: (req.headers["x-forwarded-for"] as string) || req.ip,
          userAgent: req.headers["user-agent"],
        });
      }

      res.status(204).end();
    } catch (err) {
      next(err);
    }
  }
);

// ==========================================
// SERVICES ROUTER
// ==========================================
const servicesRouter = Router();

// GET /api/services - Retrieves all services in a tenant workspace
servicesRouter.get(
  "/",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const services = await AppointmentService.getServices(workspaceId);
      res.json(services);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/services/:id - Fetch details of a single service
servicesRouter.get(
  "/:id",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const id = req.params.id;
      const service = await AppointmentService.getServiceById(id, workspaceId);
      
      if (!service) {
        throw new ApiError(404, "Service not found in this workspace.");
      }
      
      res.json(service);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/services - Register a new service category
servicesRouter.post(
  "/",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  validateRequest(createServiceSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const newService = await AppointmentService.createService(workspaceId, req.body);
      res.status(201).json(newService);
    } catch (err: any) {
      next(err);
    }
  }
);

// PUT /api/services/:id - Revise service specifications
servicesRouter.put(
  "/:id",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  validateRequest(updateServiceSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const id = req.params.id;
      const updatedService = await AppointmentService.updateService(id, workspaceId, req.body);
      res.json(updatedService);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/services/:id - Delete a service category
servicesRouter.delete(
  "/:id",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const id = req.params.id;
      await AppointmentService.deleteService(id, workspaceId);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  }
);

export { appointmentRouter, servicesRouter };
export default appointmentRouter;
