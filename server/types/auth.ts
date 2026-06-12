import { Request } from "express";
import { WorkspaceRole } from "./rbac";
import { SupabaseClient } from "@supabase/supabase-js";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: WorkspaceRole;
  };
  supabase?: SupabaseClient;
}
