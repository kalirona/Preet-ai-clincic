import { AuthenticatedRequest } from "../types/auth";
import { ApiError } from "../types/errors";

/**
 * Extracts workspace ID from request headers, body, or query params.
 * Throws 400 if not found.
 */
export function getWorkspaceId(req: AuthenticatedRequest): string {
  const wsId =
    (req.headers["x-workspace-id"] as string) ||
    (req.body?.workspaceId as string) ||
    (req.body?.workspace_id as string) ||
    (req.query?.workspaceId as string) ||
    (req.query?.workspace_id as string) ||
    (req.params?.workspaceId as string) ||
    (req.params?.workspace_id as string);

  if (!wsId) {
    throw new ApiError(400, "Workspace context boundary identifier has not been specified.");
  }
  return wsId;
}

/**
 * Extracts workspace ID from request, defaulting to "1" if not found.
 */
export function getWorkspaceIdLenient(req: AuthenticatedRequest): string {
  const wsId =
    (req.headers["x-workspace-id"] as string) ||
    (req.body?.workspaceId as string) ||
    (req.body?.workspace_id as string) ||
    (req.query?.workspaceId as string) ||
    (req.query?.workspace_id as string) ||
    (req.params?.workspaceId as string) ||
    (req.params?.workspace_id as string);

  return wsId || "1";
}
