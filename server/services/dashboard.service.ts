import { getSupabaseServerClient } from "../middleware/requireAuth";
import { DashboardMetrics } from "../types/dashboard";
import { ClientActivity, ClientActivityType } from "../types/clientActivity";

/**
 * Service to aggregate business, leads, scheduling, and workspace activity statistics.
 */
export class DashboardService {
  /**
   * Computes clean enterprise aggregates for a specific tenant workspace boundary.
   * Uses DB-level filtering where possible to avoid fetching full tables.
   */
  static async getMetrics(workspaceId: string): Promise<DashboardMetrics> {
    try {
      const supabase = getSupabaseServerClient();
      const now = new Date();

      // UTC calendar benchmarks
      const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
      const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
      const endOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
      const endOfThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

      // Use DB-level counting with filters instead of fetching all rows
      const [
        totalClientsRes,
        newClientsRes,
        appointmentsTodayRes,
        upcomingRes,
        completedRes,
        cancelledRes,
        servicesRes,
        activitiesRes
      ] = await Promise.all([
        // Total clients (count only)
        supabase.from("clients").select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .is("deleted_at", null),
        // New clients this month (count only)
        supabase.from("clients").select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .is("deleted_at", null)
          .gte("created_at", startOfMonth.toISOString()),
        // Appointments today
        supabase.from("appointments").select("id, start_time, status, service_id")
          .eq("workspace_id", workspaceId)
          .gte("start_time", startOfToday.toISOString())
          .lte("start_time", endOfToday.toISOString()),
        // Upcoming appointments
        supabase.from("appointments").select("id, start_time, status, service_id")
          .eq("workspace_id", workspaceId)
          .gt("start_time", now.toISOString())
          .not("status", "in", "(cancelled,no_show)"),
        // Completed appointments (count only)
        supabase.from("appointments").select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("status", "completed"),
        // Cancelled appointments (count only)
        supabase.from("appointments").select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("status", "cancelled"),
        // Services for revenue calculation
        supabase.from("services").select("id, price").eq("workspace_id", workspaceId),
        // Recent activities
        supabase.from("client_activities")
          .select("*")
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: false })
          .limit(10)
      ]);

      if (totalClientsRes.error) {
        console.error("[DashboardService] Clients count query error:", totalClientsRes.error);
        throw new Error("Failed to extract active client count.");
      }

      const totalClients = totalClientsRes.count || 0;
      const newClientsThisMonth = newClientsRes.count || 0;
      const completedAppointments = completedRes.count || 0;
      const cancelledAppointments = cancelledRes.count || 0;

      const appointmentsToday = (appointmentsTodayRes.data || []).length;
      const upcomingAppointments = (upcomingRes.data || []).length;

      // Revenue calculation - fetch only this month's appointments
      const services = servicesRes.data || [];
      const servicesMap = new Map<string, number>();
      for (const service of services) {
        const price = typeof service.price === "string" ? parseFloat(service.price) : (service.price || 0);
        servicesMap.set(service.id, price);
      }

      const startOfThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
      const revenueRes = await supabase.from("appointments")
        .select("start_time, status, service_id")
        .eq("workspace_id", workspaceId)
        .gte("start_time", startOfThisMonth.toISOString())
        .lte("start_time", endOfThisMonth.toISOString())
        .not("status", "eq", "cancelled");

      let estimatedRevenueMonth = 0;
      for (const appt of revenueRes.data || []) {
        if (!appt.start_time) continue;
        const servicePrice = appt.service_id ? (servicesMap.get(appt.service_id) || 0) : 0;
        estimatedRevenueMonth += servicePrice;
      }

      // Convert Database structures to CamelCase
      const rawActivities = activitiesRes.data || [];
      const recentActivities: ClientActivity[] = rawActivities.map((row: any) => ({
        id: row.id,
        workspaceId: row.workspace_id,
        clientId: row.client_id,
        type: row.type as ClientActivityType,
        title: row.title,
        description: row.description || undefined,
        metadata: row.metadata || undefined,
        createdBy: row.created_by || undefined,
        createdAt: row.created_at
      }));

      return {
        totalClients,
        newClientsThisMonth,
        appointmentsToday,
        upcomingAppointments,
        completedAppointments,
        cancelledAppointments,
        estimatedRevenueMonth,
        recentActivities
      };
    } catch (err) {
      console.error("[DashboardService] Exception compiling metrics:", err);
      throw err;
    }
  }
}
