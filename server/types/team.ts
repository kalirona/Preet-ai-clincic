import { WorkspaceRole } from "./rbac";

/**
 * Representation of a workspace member.
 */
export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: string | Date;
  email?: string;
}

/**
 * Structure of a request to invite a new member to a workspace.
 */
export interface InviteMemberRequest {
  email: string;
  role: WorkspaceRole;
}

/**
 * Structure of a request to update a workspace member's role.
 */
export interface UpdateMemberRoleRequest {
  role: WorkspaceRole;
}
