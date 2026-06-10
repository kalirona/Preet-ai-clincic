import { Request } from "express";
import { WorkspaceRole } from "./rbac";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: WorkspaceRole;
  };
}
