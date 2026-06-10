import { Router, Response, NextFunction } from "express";
import { clientRateLimiter } from "../middleware/rateLimiters";
import { requireAuth } from "../middleware/requireAuth";
import { AuthenticatedRequest } from "../types/auth";
import { ApiError } from "../types/errors";
import { SearchService } from "../services/search.service";

const router = Router();

const getWorkspaceId = (req: AuthenticatedRequest): string => {
  const wsId =
    (req.headers["x-workspace-id"] as string) ||
    (req.query?.workspaceId as string) ||
    (req.query?.workspace_id as string);

  if (!wsId) {
    throw new ApiError(400, "Workspace context is required.");
  }
  return wsId;
};

// GET /api/search - Master unified multi-tenant dashboard search query
router.get(
  "/",
  clientRateLimiter,
  requireAuth as any,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const q = req.query.q as string;

      if (!q || !q.trim()) {
        return res.json([]);
      }

      const results = await SearchService.searchAll(workspaceId, q);
      res.json(results);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
