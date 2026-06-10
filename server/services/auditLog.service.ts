import { AuditLog } from "../types/auditLog";
import { getSupabaseServerClient } from "../middleware/requireAuth";

/**
 * Service orchestrator for managing audit and event logs with strict multi-tenant workspace separation.
 */
export class AuditLogService {
  /**
   * Helper function to convert DB snake_case record to camelCase TS structure.
   */
  private static mapToCamel(row: any): AuditLog {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      userId: row.user_id || undefined,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id || undefined,
      ipAddress: row.ip_address || undefined,
      userAgent: row.user_agent || undefined,
      createdAt: row.created_at,
    };
  }

  /**
   * Inserts a new audit log record.
   * Runs in the background and catches errors of missing tables or unconfigured states to keep main actions reliable.
   */
  static async createLog(params: {
    workspaceId: string;
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditLog | null> {
    try {
      const supabase = getSupabaseServerClient();
      const dbRow = {
        workspace_id: params.workspaceId,
        user_id: params.userId || null,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId || null,
        ip_address: params.ipAddress || null,
        user_agent: params.userAgent || null,
      };

      const { data, error } = await supabase
        .from("audit_logs")
        .insert(dbRow)
        .select()
        .single();

      if (error) {
        console.error(`[AuditLogService] createLog DB Error:`, error);
        return null;
      }

      return this.mapToCamel(data);
    } catch (err) {
      console.error(`[AuditLogService] Exception in createLog:`, err);
      return null;
    }
  }

  /**
   * Retrieves audit logs for a workspace.
   */
  static async getLogs(
    workspaceId: string,
    options: {
      entityType?: string;
      search?: string;
      limit?: number;
    } = {}
  ): Promise<AuditLog[]> {
    try {
      const supabase = getSupabaseServerClient();
      let query = supabase
        .from("audit_logs")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (options.entityType && options.entityType !== "All") {
        query = query.eq("entity_type", options.entityType);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`[AuditLogService] getLogs DB Error:`, error);
        throw new Error("Failed to retrieve audit logs from database_");
      }

      if (!data) return [];

      let logs = data.map((item: any) => this.mapToCamel(item));

      if (options.search) {
        const searchLower = options.search.toLowerCase();
        logs = logs.filter(
          log =>
            log.action.toLowerCase().includes(searchLower) ||
            log.entityType.toLowerCase().includes(searchLower) ||
            (log.entityId && log.entityId.toLowerCase().includes(searchLower)) ||
            (log.userId && log.userId.toLowerCase().includes(searchLower))
        );
      }

      return logs;
    } catch (err) {
      console.error(`[AuditLogService] Exception in getLogs:`, err);
      throw err;
    }
  }
}
