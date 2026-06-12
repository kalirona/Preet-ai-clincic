import { Router, Response, NextFunction } from "express";
import { clientRateLimiter } from "../middleware/rateLimiters";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { AuthenticatedRequest } from "../types/auth";
import { ApiError } from "../types/errors";
import { SearchService } from "../services/search.service";

const router = Router();

import { getWorkspaceId } from "../utils/workspace";

// GET /api/search - Master unified multi-tenant dashboard search query
router.get(
  "/",
  clientRateLimiter,
  requireAuth as any,
  requireRole(["Owner", "Admin", "Member"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = await getWorkspaceId(req);
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
