import { Notification, NotificationStatus, NotificationType, NotificationChannel } from "../types/notification";
import { getSupabaseServerClient } from "../middleware/requireAuth";

/**
 * Service to orchestrate background appointment reminders and follow-up message scheduling.
 * Follows strict workspace_id filtering to guarantee absolute multi-tenant security isolation.
 */
export class NotificationService {
  /**
   * Transforms raw snake_case database rows into camelCase.
   */
  private static mapToCamel(row: any): Notification {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      appointmentId: row.appointment_id,
      clientId: row.client_id,
      type: row.type as NotificationType,
      channel: row.channel as NotificationChannel,
      status: row.status as NotificationStatus,
      scheduledFor: row.scheduled_for,
      sentAt: row.sent_at || undefined,
      errorMessage: row.error_message || undefined,
      createdAt: row.created_at,
    };
  }

  /**
   * Persists a generic future notification (reminder or follow-up) inside a tenant workspace.
   */
  static async createNotification(
    workspaceId: string,
    payload: {
      appointmentId: string;
      clientId: string;
      type: NotificationType;
      channel: NotificationChannel;
      scheduledFor: string;
    }
  ): Promise<Notification> {
    try {
      const supabase = getSupabaseServerClient();
      
      const dbRow = {
        workspace_id: workspaceId,
        appointment_id: payload.appointmentId,
        client_id: payload.clientId,
        type: payload.type,
        channel: payload.channel,
        scheduled_for: new Date(payload.scheduledFor).toISOString(),
        status: "pending" as NotificationStatus,
      };

      const { data, error } = await supabase
        .from("notifications")
        .insert(dbRow)
        .select()
        .single();

      if (error) {
        console.error(`[NotificationService] createNotification DB Error:`, error);
        throw new Error("Failed to write/persist notification blueprint.");
      }

      return this.mapToCamel(data);
    } catch (err) {
      console.error(`[NotificationService] Exception in createNotification:`, err);
      throw err;
    }
  }

  /**
   * Queries general notifications list under the scoped active workspace boundary and optional filters.
   */
  static async getWorkspaceNotifications(
    workspaceId: string,
    filters?: { appointmentId?: string; status?: NotificationStatus }
  ): Promise<Notification[]> {
    return this.getNotificationsByWorkspace(workspaceId, filters);
  }

  /**
   * Queries general notifications list under the scoped active workspace boundary and optional filters.
   */
  static async getNotificationsByWorkspace(
    workspaceId: string,
    filters?: { appointmentId?: string; status?: NotificationStatus }
  ): Promise<Notification[]> {
    try {
      const supabase = getSupabaseServerClient();
      let query = supabase
        .from("notifications")
        .select("*")
        .eq("workspace_id", workspaceId);

      if (filters?.appointmentId) {
        query = query.eq("appointment_id", filters.appointmentId);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query.order("scheduled_for", { ascending: true });

      if (error) {
        console.error(`[NotificationService] getNotificationsByWorkspace DB Error:`, error);
        throw new Error("Failed to query notifications.");
      }

      if (!data) return [];
      return data.map((item: any) => this.mapToCamel(item));
    } catch (err) {
      console.error(`[NotificationService] Exception in getNotificationsByWorkspace:`, err);
      throw err;
    }
  }

  /**
   * Fetch specific notifications bound under a exact active appointment id.
   */
  static async getAppointmentNotifications(
    workspaceId: string,
    appointmentId: string
  ): Promise<Notification[]> {
    return this.getNotificationsByWorkspace(workspaceId, { appointmentId });
  }

  /**
   * Retrieves single notification by Id under tenant ownership check.
   */
  static async getNotificationById(id: string, workspaceId: string): Promise<Notification | null> {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("id", id)
        .eq("workspace_id", workspaceId)
        .maybeSingle();

      if (error) {
        console.error(`[NotificationService] getNotificationById DB Error:`, error);
        throw new Error("Failed to load notification context.");
      }

      if (!data) return null;
      return this.mapToCamel(data);
    } catch (err) {
      console.error(`[NotificationService] Exception in getNotificationById:`, err);
      throw err;
    }
  }

  /**
   * Marks a notification as sent with the optional sent timestamp.
   */
  static async markAsSent(
    id: string,
    workspaceId: string,
    sentAt: string = new Date().toISOString()
  ): Promise<Notification | null> {
    return this.updateNotificationStatus(id, workspaceId, {
      status: "sent",
      sentAt,
    });
  }

  /**
   * Marks a notification as failed with the error message.
   */
  static async markAsFailed(
    id: string,
    workspaceId: string,
    errorMessage: string
  ): Promise<Notification | null> {
    return this.updateNotificationStatus(id, workspaceId, {
      status: "failed",
      errorMessage,
    });
  }

  /**
   * Saves progression or failure updates of a notification workflow.
   */
  static async updateNotificationStatus(
    id: string,
    workspaceId: string,
    payload: {
      status: NotificationStatus;
      errorMessage?: string;
      sentAt?: string;
    }
  ): Promise<Notification | null> {
    try {
      const supabase = getSupabaseServerClient();
      const updates: any = { status: payload.status };

      if (payload.errorMessage !== undefined) {
        updates.error_message = payload.errorMessage;
      }
      if (payload.sentAt !== undefined) {
        updates.sent_at = payload.sentAt ? new Date(payload.sentAt).toISOString() : null;
      }

      const { data, error } = await supabase
        .from("notifications")
        .update(updates)
        .eq("id", id)
        .eq("workspace_id", workspaceId)
        .select()
        .single();

      if (error) {
        console.error(`[NotificationService] updateNotificationStatus DB Error:`, error);
        throw new Error("Failed to transition/set notification state.");
      }

      if (!data) return null;
      return this.mapToCamel(data);
    } catch (err) {
      console.error(`[NotificationService] Exception in updateNotificationStatus:`, err);
      throw err;
    }
  }

  /**
   * Discards a scheduled notification securely.
   */
  static async deleteNotification(id: string, workspaceId: string): Promise<boolean> {
    try {
      const supabase = getSupabaseServerClient();
      
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id)
        .eq("workspace_id", workspaceId);

      if (error) {
        console.error(`[NotificationService] deleteNotification DB Error:`, error);
        throw new Error("Failed to purge notification blueprint.");
      }

      return true;
    } catch (err) {
      console.error(`[NotificationService] Exception in deleteNotification:`, err);
      throw err;
    }
  }
}
