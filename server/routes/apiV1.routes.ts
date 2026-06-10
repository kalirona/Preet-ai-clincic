import { Router, Response, NextFunction } from "express";
import { clientRateLimiter } from "../middleware/rateLimiters";
import { ApiError } from "../types/errors";
import { ApiKeyService } from "../services/apiKey.service";
import { ClientService } from "../services/client.service";
import { AppointmentService } from "../services/appointment.service";
import { AuditLogService } from "../services/auditLog.service";
import { WebhookService } from "../services/webhook.service";

const router = Router();

// Middleware to authenticate external integrations via Header keys or Bearer token
const authenticateIntegrator = async (req: any, res: Response, next: NextFunction) => {
  try {
    let rawKey = req.headers["x-api-key"] as string;
    
    if (!rawKey) {
      const authHeader = req.headers["authorization"] as string;
      if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
        rawKey = authHeader.substring(7).trim();
      }
    }

    if (!rawKey) {
      throw new ApiError(401, "No authentication credentials provided. Pass your client integration key in 'X-API-Key' or 'Authorization: Bearer <Key>' headers.");
    }

    const verifiedKey = await ApiKeyService.verifyApiKey(rawKey);
    if (!verifiedKey) {
      throw new ApiError(401, "Invalid, revoked, or expired workspace API key credentials.");
    }

    // Attach verified integration details for downstream controllers
    req.integration = {
      workspaceId: verifiedKey.workspaceId,
      keyId: verifiedKey.id,
      name: verifiedKey.name,
      scopes: verifiedKey.scopes || []
    };

    next();
  } catch (err) {
    next(err);
  }
};

// Helper inside integration routes to verify specific scope eligibility
const requireIntegrationScope = (requiredScope: string) => {
  return (req: any, res: Response, next: NextFunction) => {
    const scopes = req.integration?.scopes || [];
    if (!scopes.includes(requiredScope)) {
      return next(
        new ApiError(
          403,
          `Access Forbidden. This API key has scopes [${scopes.join(", ")}], but this operation requires the '${requiredScope}' permission.`
        )
      );
    }
    next();
  };
};

// Apply rate limiter and integration authenticator across all /v1 endpoints
router.use(clientRateLimiter);
router.use(authenticateIntegrator as any);

// ---------------- CLIENTS INTEGRATIONS ----------------

// GET /api/v1/clients - Stream client registries matching external search queries
router.get(
  "/clients",
  requireIntegrationScope("clients:read"),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const workspaceId = req.integration.workspaceId;
      const searchVal = (req.query.search as string) || "";
      
      let clients = await ClientService.getClients(workspaceId);
      if (searchVal) {
        const lowerSearch = searchVal.toLowerCase();
        clients = clients.filter(c => 
          c.firstName.toLowerCase().includes(lowerSearch) || 
          (c.lastName && c.lastName.toLowerCase().includes(lowerSearch)) || 
          (c.email && c.email.toLowerCase().includes(lowerSearch))
        );
      }
      res.json({
        success: true,
        count: clients.length,
        clients: clients.map(c => ({
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          phone: c.phone,
          tag: c.tag,
          notes: c.notes,
          createdAt: c.createdAt
        }))
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/clients - Capture a new client inbound from a Zapier / Webhook integration
router.post(
  "/clients",
  requireIntegrationScope("clients:write"),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const workspaceId = req.integration.workspaceId;
      const { firstName, lastName, email, phone, tag, notes } = req.body;

      if (!firstName) {
        throw new ApiError(400, "Inbound payload parameter 'firstName' is required.");
      }

      const client = await ClientService.createClient(workspaceId, {
        firstName,
        lastName,
        email,
        phone,
        tag: tag || "Integration",
        notes
      });

      // Audit Log key verification
      await AuditLogService.createLog({
        workspaceId,
        userId: "system",
        action: `Integrator [${req.integration.name}] posted inbound CRM lead: ${client.firstName} ${client.lastName || ""}`,
        entityType: "Client",
        entityId: client.id
      });

      res.status(201).json({
        success: true,
        message: "Client successfully ingested into CRM registry.",
        client: {
          id: client.id,
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          phone: client.phone,
          tag: client.tag,
          notes: client.notes,
          createdAt: client.createdAt
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

// ---------------- APPOINTMENTS INTEGRATIONS ----------------

// GET /api/v1/appointments - List future scheduled sessions
router.get(
  "/appointments",
  requireIntegrationScope("appointments:read"),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const workspaceId = req.integration.workspaceId;
      const appointments = await AppointmentService.getAppointments(workspaceId);
      
      res.json({
        success: true,
        count: appointments.length,
        appointments: appointments.map(a => ({
          id: a.id,
          clientId: a.clientId,
          serviceId: a.serviceId,
          staffName: a.staffName,
          startTime: a.startTime,
          endTime: a.endTime,
          status: a.status,
          notes: a.notes
        }))
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/appointments - Reserve / Book an appointment slot via External Calendar webhook
router.post(
  "/appointments",
  requireIntegrationScope("appointments:write"),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const workspaceId = req.integration.workspaceId;
      const { clientId, serviceId, staffName, startTime, endTime, notes, status } = req.body;

      if (!clientId || !staffName || !startTime || !endTime) {
        throw new ApiError(400, "Parameters 'clientId', 'staffName', 'startTime', and 'endTime' must be supplied.");
      }

      const appointment = await AppointmentService.createAppointment(workspaceId, {
        clientId,
        serviceId: serviceId || null,
        staffName,
        startTime,
        endTime,
        notes: notes || null,
        status: status || "Scheduled"
      });

      await AuditLogService.createLog({
        workspaceId,
        userId: "system",
        action: `Integrator [${req.integration.name}] posted custom booking reservation: ${staffName} slot at ${new Date(startTime).toLocaleDateString()}`,
        entityType: "Appointment",
        entityId: appointment.id
      });

      res.status(201).json({
        success: true,
        message: "Inbound scheduling record compiled successfully.",
        appointment: {
          id: appointment.id,
          clientId: appointment.clientId,
          serviceId: appointment.serviceId,
          staffName: appointment.staffName,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          status: appointment.status,
          notes: appointment.notes
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/payments/complete - External webhook ingestions for completed payments (Stripe/PayPal/Credit Cards)
router.post(
  "/payments/complete",
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const workspaceId = req.integration.workspaceId;
      const { transactionId, amount, currency, status, method, planName } = req.body;

      if (!transactionId || !amount) {
        throw new ApiError(400, "Parameters 'transactionId' and 'amount' are mandatory in post payload.");
      }

      const txRecord = {
        transactionId,
        amount,
        currency: currency || "USD",
        status: status || "Paid",
        method: method || "Webhook Integrator",
        planName: planName || "Premium SaaS Plan",
        timestamp: new Date().toISOString()
      };

      // Dispatch Webhook Event
      WebhookService.triggerEvent(workspaceId, "payment.completed", txRecord);

      // Audit Log
      await AuditLogService.createLog({
        workspaceId,
        userId: "system",
        action: `Integrator [${req.integration.name}] posted completed payment of ${txRecord.currency} ${txRecord.amount} for plan [${txRecord.planName}]`,
        entityType: "Billing",
        entityId: transactionId
      });

      res.status(201).json({
        success: true,
        message: "External payment ingestion completed, and webhook events successfully propagated.",
        transaction: txRecord
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
