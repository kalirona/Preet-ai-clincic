import { Router, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { AuthenticatedRequest } from "../types/auth";
import { WorkspaceService } from "../services/workspace.service";
import { invalidateWorkspaceMembershipCache } from "../middleware/requireRole";

const router = Router();

/**
 * GET /api/setup/status
 * Returns whether the user has a workspace and if setup is needed.
 */
router.get(
  "/status",
  requireAuth as any,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.json({ needsSetup: false, message: "Not authenticated" });
      }

      const memberships = await WorkspaceService.getUserWorkspaces(req.user.id);

      if (memberships.length > 0) {
        return res.json({
          needsSetup: false,
          workspaceId: memberships[0].workspaceId,
          role: memberships[0].role,
        });
      }

      return res.json({ needsSetup: true });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/setup/workspace
 * Creates a workspace and adds the authenticated user as Owner.
 */
router.post(
  "/workspace",
  requireAuth as any,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userId = req.user.id;
      const { name } = req.body;

      // Check if user already has workspaces
      const existing = await WorkspaceService.getUserWorkspaces(userId);
      if (existing.length > 0) {
        return res.status(400).json({
          error: "User already has a workspace",
          workspaceId: existing[0].workspaceId,
        });
      }

      // Create workspace
      const workspaceName = name || `${req.user.email?.split("@")[0] || "User"}'s Workspace`;
      const workspace = await WorkspaceService.createWorkspace(workspaceName);
      if (!workspace) {
        return res.status(500).json({ error: "Failed to create workspace" });
      }

      // Add user as Owner
      const added = await WorkspaceService.addMember(workspace.id, userId, "Owner");
      if (!added) {
        return res.status(500).json({ error: "Failed to add owner to workspace" });
      }

      // Invalidate cache so role checks work immediately
      invalidateWorkspaceMembershipCache(workspace.id);

      res.status(201).json({
        workspace,
        role: "Owner",
        message: `Workspace "${workspaceName}" created. You are the Owner.`,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
