import { Client } from "../types/client";
import { getSupabaseServerClient } from "../middleware/requireAuth";
import { WebhookService } from "./webhook.service";

/**
 * Service orchestrator for managing clients with strict multi-tenant workspace separation.
 * Inherits security from workspace context checks, filtering every query by workspaceId.
 */
export class ClientService {
  /**
   * Helper function to convert DB snake_case record to camelCase TS structure.
   */
  private static mapToCamel(row: any): Client {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      firstName: row.first_name,
      lastName: row.last_name || undefined,
      email: row.email || undefined,
      phone: row.phone || undefined,
      tag: row.tag || undefined,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at || undefined,
    };
  }

  /**
   * Helper function to convert camelCase payload to DB snake_case structure.
   */
  private static mapToSnake(payload: any) {
    const row: any = {};
    if (payload.firstName !== undefined) row.first_name = payload.firstName;
    if (payload.lastName !== undefined) row.last_name = payload.lastName;
    if (payload.email !== undefined) row.email = payload.email;
    if (payload.phone !== undefined) row.phone = payload.phone;
    if (payload.tag !== undefined) row.tag = payload.tag;
    if (payload.notes !== undefined) row.notes = payload.notes;
    return row;
  }

  /**
   * Retrieves all clients mapped to a specific workspace.
   * Scoped and filtered by workspaceId to secure organizational data bounds.
   */
  static async getClients(workspaceId: string, includeDeleted = false): Promise<Client[]> {
    try {
      const supabase = getSupabaseServerClient();
      let query = supabase
        .from("clients")
        .select("*")
        .eq("workspace_id", workspaceId);

      if (!includeDeleted) {
        query = query.is("deleted_at", null);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        console.error(`[ClientService] getClients DB Error:`, error);
        throw new Error("Failed to retrieve client list from database.");
      }

      if (!data) return [];
      return data.map((item: any) => this.mapToCamel(item));
    } catch (err) {
      console.error(`[ClientService] Exception in getClients:`, err);
      throw err;
    }
  }

  /**
   * Retrieves a single client after validating that the record belongs to the requested workspace.
   */
  static async getClientById(clientId: string, workspaceId: string, includeDeleted = false): Promise<Client | null> {
    try {
      const supabase = getSupabaseServerClient();
      let query = supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .eq("workspace_id", workspaceId);

      if (!includeDeleted) {
        query = query.is("deleted_at", null);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error(`[ClientService] getClientById DB Error:`, error);
        throw new Error("Failed to retrieve client details from database.");
      }

      if (!data) return null;
      return this.mapToCamel(data);
    } catch (err) {
      console.error(`[ClientService] Exception in getClientById:`, err);
      throw err;
    }
  }

  /**
   * Inserts a new client bound to the tenant workspace.
   */
  static async createClient(
    workspaceId: string,
    payload: {
      firstName: string;
      lastName?: string;
      email?: string;
      phone?: string;
      tag?: string;
      notes?: string;
    }
  ): Promise<Client> {
    try {
      const supabase = getSupabaseServerClient();

      // Ensure duplicates on email within the same workspace are prevented
      if (payload.email) {
        const { data: existing } = await supabase
          .from("clients")
          .select("id")
          .eq("workspace_id", workspaceId)
          .eq("email", payload.email)
          .is("deleted_at", null)
          .maybeSingle();

        if (existing) {
          throw new Error("A client with this email address already exists within this workspace.");
        }
      }

      const dbRow = {
        workspace_id: workspaceId,
        first_name: payload.firstName,
        last_name: payload.lastName || null,
        email: payload.email || null,
        phone: payload.phone || null,
        tag: payload.tag || null,
        notes: payload.notes || null,
      };

      const { data, error } = await supabase
        .from("clients")
        .insert(dbRow)
        .select()
        .single();

      if (error) {
        console.error(`[ClientService] createClient DB Error:`, error);
        throw new Error("Failed to write new client record to database.");
      }

      const camelClient = this.mapToCamel(data);
      WebhookService.triggerEvent(workspaceId, "client.created", camelClient);

      return camelClient;
    } catch (err) {
      console.error(`[ClientService] Exception in createClient:`, err);
      throw err;
    }
  }

  /**
   * Updates an existing client record if it lies within the workspace tenant.
   */
  static async updateClient(
    clientId: string,
    workspaceId: string,
    payload: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      tag?: string;
      notes?: string;
    }
  ): Promise<Client | null> {
    try {
      const supabase = getSupabaseServerClient();

      // Check if client exists first
      const current = await this.getClientById(clientId, workspaceId);
      if (!current) return null;

      // Ensure no email collisions within the same workspace boundary
      if (payload.email && payload.email !== current.email) {
        const { data: existing } = await supabase
          .from("clients")
          .select("id")
          .eq("workspace_id", workspaceId)
          .eq("email", payload.email)
          .is("deleted_at", null)
          .maybeSingle();

        if (existing) {
          throw new Error("An active client with this email already exists in this workspace.");
        }
      }

      const postBody = this.mapToSnake(payload);
      postBody.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("clients")
        .update(postBody)
        .eq("id", clientId)
        .eq("workspace_id", workspaceId)
        .select()
        .single();

      if (error) {
        console.error(`[ClientService] updateClient DB Error:`, error);
        throw new Error("Failed to commit client modifications to database.");
      }

      return this.mapToCamel(data);
    } catch (err) {
      console.error(`[ClientService] Exception in updateClient:`, err);
      throw err;
    }
  }

  /**
   * Safe-deletes a client record from the database (soft-delete).
   */
  static async deleteClient(clientId: string, workspaceId: string): Promise<boolean> {
    try {
      const supabase = getSupabaseServerClient();

      const { error } = await supabase
        .from("clients")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", clientId)
        .eq("workspace_id", workspaceId);

      if (error) {
        console.error(`[ClientService] deleteClient DB Error:`, error);
        throw new Error("Failed to soft-delete client from database.");
      }

      return true;
    } catch (err) {
      console.error(`[ClientService] Exception in deleteClient:`, err);
      throw err;
    }
  }

  /**
   * Restores a soft-deleted client record.
   */
  static async restoreClient(clientId: string, workspaceId: string): Promise<boolean> {
    try {
      const supabase = getSupabaseServerClient();

      const { error } = await supabase
        .from("clients")
        .update({ deleted_at: null })
        .eq("id", clientId)
        .eq("workspace_id", workspaceId);

      if (error) {
        console.error(`[ClientService] restoreClient DB Error:`, error);
        throw new Error("Failed to restore soft-deleted client.");
      }

      return true;
    } catch (err) {
      console.error(`[ClientService] Exception in restoreClient:`, err);
      throw err;
    }
  }
}
