import { WorkspaceRole } from "./rbac";

export interface Workspace {
  id: string;
  name: string;
  tenantType: string;
  createdAt: string | Date;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: string | Date;
}
