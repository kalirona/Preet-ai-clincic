import { AuthenticatedRequest } from "../types/auth";
import { ApiError } from "../types/errors";

/**
 * Extracts and validates workspace ID from request.
 * Throws 400 if not found, 403 if user not member of workspace.
 */
export async function getWorkspaceId(req: AuthenticatedRequest): Promise<string> {
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

  // Validate user is member of this workspace
  if (req.user && req.supabase) {
    const { data: membership, error } = await req.supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", wsId)
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (error || !membership) {
      throw new ApiError(403, "Access denied: not a member of this workspace.");
    }
    req.user.role = membership.role as any;
  }

  return wsId;
}

/**
 * Extracts workspace ID from request without membership validation.
 * Use only for public endpoints where workspace is resolved differently.
 */
export function getWorkspaceIdPublic(req: AuthenticatedRequest): string {
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
