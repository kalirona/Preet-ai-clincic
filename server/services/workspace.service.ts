import { Workspace, WorkspaceMember } from "../types/workspace";
import { getSupabaseServerClient } from "../middleware/requireAuth";

/**
 * Service to manage SaaS workspaces and database membership security.
 */
export class WorkspaceService {
  /**
   * Retrieves a workspace by its unique database ID.
   * 
   * @param workspaceId Unique UUID of the workspace
   * @returns Promise resolving to Workspace or null
   */
  static async getWorkspaceById(workspaceId: string): Promise<Workspace | null> {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from("workspaces")
        .select("*")
        .eq("id", workspaceId)
        .single();

      if (error || !data) {
        console.error(`[WorkspaceService] Error or not found in getWorkspaceById:`, error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        tenantType: data.tenant_type,
        createdAt: data.created_at,
      };
    } catch (err) {
      console.error(`[WorkspaceService] Exception in getWorkspaceById:`, err);
      return null;
    }
  }

  /**
   * Checks membership and role of a specific user within a workspace.
   * Essential logic for Preventing Cross-Tenant Data Leakage and performing RBAC.
   * 
   * @param workspaceId Workspace boundary selector
   * @param userId Authenticated user identifier (Supabase User UUID)
   * @returns Promise resolving to WorkspaceMember details or null
   */
  static async getMembership(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from("workspace_members")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId)
        .single();

      if (error || !data) {
        console.error(`[WorkspaceService] Error or not found in getMembership:`, error);
        return null;
      }

      return {
        id: data.id,
        workspaceId: data.workspace_id,
        userId: data.user_id,
        role: data.role,
        createdAt: data.created_at,
      };
    } catch (err) {
      console.error(`[WorkspaceService] Exception in getMembership:`, err);
      return null;
    }
  }

  /**
   * Retrieves all workspace affiliations for a single user context.
   * 
   * @param userId Authenticated user identifier
   * @returns Promise resolving to WorkspaceMember list
   */
  static async getUserWorkspaces(userId: string): Promise<WorkspaceMember[]> {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from("workspace_members")
        .select("*")
        .eq("user_id", userId);

      if (error || !data) {
        console.error(`[WorkspaceService] Error or not found in getUserWorkspaces:`, error);
        return [];
      }

      return data.map((item: any) => ({
        id: item.id,
        workspaceId: item.workspace_id,
        userId: item.user_id,
        role: item.role,
        createdAt: item.created_at,
      }));
    } catch (err) {
      console.error(`[WorkspaceService] Exception in getUserWorkspaces:`, err);
      return [];
    }
  }

  /**
   * Creates a new workspace with auto-generated slug.
   */
  static async createWorkspace(name: string, tenantType: string = "business"): Promise<Workspace | null> {
    try {
      const supabase = getSupabaseServerClient();
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "workspace";

      const { data, error } = await supabase
        .from("workspaces")
        .insert({ name, tenant_type: tenantType, slug, is_active: true })
        .select()
        .single();

      if (error || !data) {
        console.error(`[WorkspaceService] createWorkspace Error:`, error);
        return null;
      }

      return { id: data.id, name: data.name, tenantType: data.tenant_type, createdAt: data.created_at };
    } catch (err) {
      console.error(`[WorkspaceService] Exception in createWorkspace:`, err);
      return null;
    }
  }

  /**
   * Adds a user as a member of a workspace.
   */
  static async addMember(workspaceId: string, userId: string, role: string = "Owner"): Promise<boolean> {
    try {
      const supabase = getSupabaseServerClient();
      const { error } = await supabase
        .from("workspace_members")
        .insert({ workspace_id: workspaceId, user_id: userId, role });

      if (error) {
        console.error(`[WorkspaceService] addMember Error:`, error);
        return false;
      }
      return true;
    } catch (err) {
      console.error(`[WorkspaceService] Exception in addMember:`, err);
      return false;
    }
  }
}
