import { Router, Response, NextFunction } from "express";
import { teamRateLimiter } from "../middleware/rateLimiters";
import { getSupabaseServerClient, requireAuth } from "../middleware/requireAuth";
import { requireRole, invalidateMembershipCache } from "../middleware/requireRole";
import { validateRequest } from "../middleware/validateRequest";
import { AuthenticatedRequest } from "../types/auth";
import { ApiError } from "../types/errors";
import { updateMemberRoleSchema, inviteMemberSchema } from "../validators/team.validator";
import { TeamService } from "../services/team.service";
import { AuditLogService } from "../services/auditLog.service";
import crypto from "crypto";

const router = Router();

/**
 * Helper to pull and validate cross-tenant workspace identity headers.
 */
import { getWorkspaceId } from "../utils/workspace";

// GET /api/team - Retrieve list of all members of the active workspace context
router.get(
  "/",
  teamRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const members = await TeamService.getWorkspaceMembers(workspaceId);
      res.json(members);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/team/:userId - Fetch details of a single workspace member
router.get(
  "/:userId",
  teamRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const { userId } = req.params;
      const member = await TeamService.getMember(workspaceId, userId);
      if (!member) {
        throw new ApiError(404, "Workspace member not found.");
      }
      res.json(member);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/team/:userId - Update member role (Owner/Admin only)
router.put(
  "/:userId",
  teamRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin"]),
  validateRequest(updateMemberRoleSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const { userId } = req.params;
      const { role } = req.body;

      const member = await TeamService.getMember(workspaceId, userId);
      if (!member) {
        throw new ApiError(404, "Workspace member not found.");
      }

      const updated = await TeamService.updateMemberRole(workspaceId, userId, role);
      
      // Track audit event
      if (updated) {
        await AuditLogService.createLog({
          workspaceId,
          userId: req.user?.id,
          action: `Role changed: User role updated to ${role} (previously ${member.role})`.trim(),
          entityType: "Team",
          entityId: userId,
          ipAddress: (req.headers["x-forwarded-for"] as string) || req.ip,
          userAgent: req.headers["user-agent"],
        });
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/team/:userId - Remove member (Owner/Admin only)
router.delete(
  "/:userId",
  teamRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const { userId } = req.params;

      const member = await TeamService.getMember(workspaceId, userId);
      if (!member) {
        throw new ApiError(404, "Workspace member not found.");
      }

      await TeamService.removeMember(workspaceId, userId);
      res.json({ success: true, message: "Workspace member removed successfully." });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/team/invite - Create/Invite new workspace member (Owner/Admin only)
router.post(
  "/invite",
  teamRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin"]),
  validateRequest(inviteMemberSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
      const { email, role } = req.body;

      const supabase = getSupabaseServerClient();

      // Try to create the user, or look up if already exists
      let userId: string;
      const tempPassword = crypto.randomUUID().slice(0, 16) + "!Aa1";
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
      });

      if (createError && createError.message?.includes("already exists")) {
        // Look up existing user by email
        const { data: userList } = await supabase.auth.admin.listUsers();
        const users = userList?.users || [];
        const existing = users.find((u: any) => u.email === email);
        if (!existing) throw new ApiError(400, "User already exists but could not be found.");
        userId = existing.id;
      } else if (createError) {
        throw new ApiError(400, createError.message);
      } else {
        userId = newUser.user.id;
      }

      // Add to workspace members
      const newMember = await TeamService.inviteMember(workspaceId, userId, role);

      // Invalidate role cache so permissions take effect
      invalidateMembershipCache(workspaceId, userId);

      res.status(201).json({
        ...newMember,
        email,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
