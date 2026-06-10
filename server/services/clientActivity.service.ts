import { ClientActivity, ClientActivityType } from "../types/clientActivity";
import { getSupabaseServerClient } from "../middleware/requireAuth";

/**
 * Service orchestrator for managing client activities with strict multi-tenant workspace separation.
 * Guarantees that no activity data is accessed or mutated without validating tenant ownership scopes.
 */
export class ClientActivityService {
  /**
   * Helper function to convert DB snake_case record to camelCase TS structure.
   */
  private static mapToCamel(row: any): ClientActivity {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      clientId: row.client_id,
      type: row.type as ClientActivityType,
      title: row.title,
      description: row.description || undefined,
      metadata: row.metadata || undefined,
      createdBy: row.created_by || undefined,
      createdAt: row.created_at,
    };
  }

  /**
   * Retrieves all activities associated with a client, scoped by the tenant's workspaceId.
   */
  static async getActivities(workspaceId: string, clientId: string): Promise<ClientActivity[]> {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from("client_activities")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(`[ClientActivityService] getActivities DB Error:`, error);
        throw new Error("Failed to retrieve client timeline activities from the database.");
      }

      if (!data) return [];
      return data.map((item: any) => this.mapToCamel(item));
    } catch (err) {
      console.error(`[ClientActivityService] Exception in getActivities:`, err);
      throw err;
    }
  }

  /**
   * Records a new client activity, bound to both the client and the tenant workspace.
   */
  static async createActivity(
    workspaceId: string,
    clientId: string,
    payload: {
      type: ClientActivityType;
      title: string;
      description?: string | null;
      metadata?: Record<string, any> | null;
      createdBy?: string;
    }
  ): Promise<ClientActivity> {
    try {
      const supabase = getSupabaseServerClient();

      const dbRow = {
        workspace_id: workspaceId,
        client_id: clientId,
        type: payload.type,
        title: payload.title,
        description: payload.description || null,
        metadata: payload.metadata || null,
        created_by: payload.createdBy || null,
      };

      const { data, error } = await supabase
        .from("client_activities")
        .insert(dbRow)
        .select()
        .single();

      if (error) {
        console.error(`[ClientActivityService] createActivity DB Error:`, error);
        throw new Error("Failed to write new client activity record to the database.");
      }

      return this.mapToCamel(data);
    } catch (err) {
      console.error(`[ClientActivityService] Exception in createActivity:`, err);
      throw err;
    }
  }

  /**
   * Deletes a specific client activity, safely scoped by workspace_id context.
   * Never trusts the activity ID alone, strictly matching the workspace identifier.
   */
  static async deleteActivity(activityId: string, workspaceId: string): Promise<boolean> {
    try {
      const supabase = getSupabaseServerClient();
      const { error } = await supabase
        .from("client_activities")
        .delete()
        .eq("id", activityId)
        .eq("workspace_id", workspaceId);

      if (error) {
        console.error(`[ClientActivityService] deleteActivity DB Error:`, error);
        throw new Error("Failed to purge activity record from the database.");
      }

      return true;
    } catch (err) {
      console.error(`[ClientActivityService] Exception in deleteActivity:`, err);
      throw err;
    }
  }
}
