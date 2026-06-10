import { WorkspaceMember } from "../types/workspace";
import { getSupabaseServerClient } from "../middleware/requireAuth";
import { WorkspaceRole } from "../types/rbac";

/**
 * Service to orchestrate team membership administration inside isolated tenants.
 */
export class TeamService {
  /**
   * Translates database snake_case structure into clean typed WorkspaceMember.
   */
  private static mapToCamel(row: any): WorkspaceMember {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      userId: row.user_id,
      role: row.role as WorkspaceRole,
      createdAt: row.created_at,
    };
  }

  /**
   * Retrieves all members associated within a specific tenant workspace.
   */
  static async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from("workspace_members")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error(`[TeamService] getWorkspaceMembers DB Error:`, error);
        throw new Error("Failed to retrieve workspace members.");
      }

      if (!data) return [];
      return data.map((item: any) => this.mapToCamel(item));
    } catch (err) {
      console.error(`[TeamService] Exception inside getWorkspaceMembers:`, err);
      throw err;
    }
  }

  /**
   * Retrieves a single member's details within a workspace boundary.
   */
  static async getMember(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from("workspace_members")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error(`[TeamService] getMember DB Error:`, error);
        throw new Error("Failed to retrieve workspace member.");
      }

      if (!data) return null;
      return this.mapToCamel(data);
    } catch (err) {
      console.error(`[TeamService] Exception inside getMember:`, err);
      throw err;
    }
  }

  /**
   * Updates a member's role in a secure isolated tenant boundary.
   */
  static async updateMemberRole(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole
  ): Promise<WorkspaceMember | null> {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from("workspace_members")
        .update({ role })
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        console.error(`[TeamService] updateMemberRole DB Error:`, error);
        throw new Error("Failed to update workspace member role.");
      }

      if (!data) return null;
      return this.mapToCamel(data);
    } catch (err) {
      console.error(`[TeamService] Exception inside updateMemberRole:`, err);
      throw err;
    }
  }

  /**
   * Removes a member from a workspace safely.
   */
  static async removeMember(workspaceId: string, userId: string): Promise<boolean> {
    try {
      const supabase = getSupabaseServerClient();
      const { error } = await supabase
        .from("workspace_members")
        .delete()
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId);

      if (error) {
        console.error(`[TeamService] removeMember DB Error:`, error);
        throw new Error("Failed to remove workspace member.");
      }

      return true;
    } catch (err) {
      console.error(`[TeamService] Exception inside removeMember:`, err);
      throw err;
    }
  }

  /**
   * Inserts/invites a new workspace member manually.
   */
  static async inviteMember(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole
  ): Promise<WorkspaceMember> {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from("workspace_members")
        .insert({
          workspace_id: workspaceId,
          user_id: userId,
          role,
        })
        .select()
        .single();

      if (error) {
        console.error(`[TeamService] inviteMember DB Error:`, error);
        throw new Error("Failed to insert workspace membership record.");
      }

      return this.mapToCamel(data);
    } catch (err) {
      console.error(`[TeamService] Exception inside inviteMember:`, err);
      throw err;
    }
  }
}
