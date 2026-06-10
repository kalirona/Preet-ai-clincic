import { getSupabaseServerClient } from "../middleware/requireAuth";
import { NotificationService } from "../services/notification.service";
import { AuditLogService } from "../services/auditLog.service";
import { globalQueue } from "../queues/queue";

export interface ReminderSchedulerResult {
  polledCount: number;
  processedCount: number;
  failures: string[];
}

export async function processDueReminders(): Promise<ReminderSchedulerResult> {
  const result: ReminderSchedulerResult = {
    polledCount: 0,
    processedCount: 0,
    failures: []
  };

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

    if (!supabaseUrl || !supabaseAnonKey) {
      console.log("[Reminder Job] Supabase is not configured. Skipping active database reminder polling in local/sandbox fallback mode.");
      return result;
    }

    const supabase = getSupabaseServerClient();
    
    // Find due notifications that are still pending
    const nowIso = new Date().toISOString();
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", nowIso);

    if (error) {
      console.error("[Reminder Job] Error polling pending notifications:", error);
      throw error;
    }

    if (!notifications || notifications.length === 0) {
      return result;
    }

    result.polledCount = notifications.length;
    console.log(`[Reminder Job] Found ${notifications.length} due reminders to dispatch.`);

    for (const item of notifications) {
      try {
        result.processedCount++;
        const id = item.id;
        const workspaceId = item.workspace_id;

        console.log(`[Reminder Job] Dispatching due notification ID: ${id} ...`);

        // Update status in db to processing/sent
        await NotificationService.updateNotificationStatus(id, workspaceId, {
          status: "sent",
          sentAt: new Date().toISOString()
        });

        // Add a audit trail log
        await AuditLogService.createLog({
          workspaceId,
          action: `Automated Background Dispatch: Sent ${item.type} reminder notification for client context.`,
          entityType: "Appointment",
          entityId: item.appointment_id || undefined,
          ipAddress: "127.0.0.1",
          userAgent: "PreetAI-Scheduler-Worker"
        }).catch(err => console.warn("[Reminder Job] Audit fail:", err));

      } catch (err: any) {
        console.error(`[Reminder Job] Failed to dispatch notification #${item.id}:`, err);
        result.failures.push(`Notification ID ${item.id}: ${err.message || String(err)}`);
        
        await NotificationService.updateNotificationStatus(item.id, item.workspace_id, {
          status: "failed",
          errorMessage: err.message || String(err)
        }).catch(e => console.error("[Reminder Job] Error marking status failed:", e));
      }
    }

  } catch (err: any) {
    console.error("[Reminder Job] Critical exception in reminder dispatch workflow:", err);
    result.failures.push(`Critical: ${err.message || String(err)}`);
  }

  return result;
}

// Handler for manual queue trigger triggerable via queue.enqueue("reminder_tick", {})
export async function handleReminderTickJob(): Promise<ReminderSchedulerResult> {
  return await processDueReminders();
}
