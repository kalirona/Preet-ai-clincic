import { getSupabaseServerClient } from "../middleware/requireAuth";
import { DashboardMetrics } from "../types/dashboard";
import { ClientActivity, ClientActivityType } from "../types/clientActivity";

/**
 * Service to aggregate business, leads, scheduling, and workspace activity statistics.
 */
export class DashboardService {
  /**
   * Computes clean enterprise aggregates for a specific tenant workspace boundary.
   */
  static async getMetrics(workspaceId: string): Promise<DashboardMetrics> {
    try {
      const supabase = getSupabaseServerClient();
      const now = new Date();

      // UTC calendar benchmarks
      const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
      const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
      const endOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

      // Fetch CRM clients, appointment registers, service directories, and timeline flows concurrently
      const [
        clientsRes,
        appointmentsRes,
        servicesRes,
        activitiesRes
      ] = await Promise.all([
        supabase.from("clients").select("id, created_at").eq("workspace_id", workspaceId),
        supabase.from("appointments").select("id, start_time, status, service_id").eq("workspace_id", workspaceId),
        supabase.from("services").select("id, price").eq("workspace_id", workspaceId),
        supabase
          .from("client_activities")
          .select("*")
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: false })
          .limit(10)
      ]);

      if (clientsRes.error) {
        console.error("[DashboardService] Clients query breakdown:", clientsRes.error);
        throw new Error("Failed to extract active client count boundary.");
      }
      if (appointmentsRes.error) {
        console.error("[DashboardService] Appointments query breakdown:", appointmentsRes.error);
        throw new Error("Failed to extract active bookings directory.");
      }
      if (servicesRes.error) {
        console.error("[DashboardService] Services pricing breakdown:", servicesRes.error);
        throw new Error("Failed to extract services catalogs.");
      }
      if (activitiesRes.error) {
        console.error("[DashboardService] Client activities logging breakdown:", activitiesRes.error);
        throw new Error("Failed to extract latest activity logging feeds.");
      }

      const clients = clientsRes.data || [];
      const appointments = appointmentsRes.data || [];
      const services = servicesRes.data || [];
      const rawActivities = activitiesRes.data || [];

      // Optimize pricing operations using key-value Map
      const servicesMap = new Map<string, number>();
      for (const service of services) {
        const price = typeof service.price === "string" ? parseFloat(service.price) : (service.price || 0);
        servicesMap.set(service.id, price);
      }

      // 1. Total Clients registered
      const totalClients = clients.length;

      // 2. Client registries added during current calendar month
      const newClientsThisMonth = clients.filter((client: any) => {
        if (!client.created_at) return false;
        const clientDate = new Date(client.created_at);
        return clientDate >= startOfMonth;
      }).length;

      // 3. Number of appointments active today
      const appointmentsToday = appointments.filter((appt: any) => {
        if (!appt.start_time) return false;
        const apptDate = new Date(appt.start_time);
        return apptDate >= startOfToday && apptDate <= endOfToday;
      }).length;

      // 4. Upcoming future appointments
      const upcomingAppointments = appointments.filter((appt: any) => {
        if (!appt.start_time) return false;
        const apptDate = new Date(appt.start_time);
        const statusLower = (appt.status || "").toLowerCase();
        return apptDate > now && statusLower !== "cancelled" && statusLower !== "no_show";
      }).length;

      // 5. Lifetime completed appointments
      const completedAppointments = appointments.filter((appt: any) => {
        const statusLower = (appt.status || "").toLowerCase();
        return statusLower === "completed";
      }).length;

      // 6. Lifetime cancelled appointments
      const cancelledAppointments = appointments.filter((appt: any) => {
        const statusLower = (appt.status || "").toLowerCase();
        return statusLower === "cancelled";
      }).length;

      // 7. Estimated workspace revenue for current calendar month
      const startOfThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
      const endOfThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
      
      let estimatedRevenueMonth = 0;
      for (const appt of appointments) {
        if (!appt.start_time) continue;
        const apptDate = new Date(appt.start_time);
        if (apptDate >= startOfThisMonth && apptDate <= endOfThisMonth) {
          const statusLower = (appt.status || "").toLowerCase();
          if (statusLower !== "cancelled") {
            const servicePrice = appt.service_id ? (servicesMap.get(appt.service_id) || 0) : 0;
            estimatedRevenueMonth += servicePrice;
          }
        }
      }

      // Convert Database structures to CamelCase
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
