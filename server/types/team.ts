import { WorkspaceRole } from "./rbac";

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
