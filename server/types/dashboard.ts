import { ClientActivity } from "./clientActivity";

/**
 * Represent state and unified analytics aggregates for the tenant workspace dashboard.
 */
export interface DashboardMetrics {
  totalClients: number;
  newClientsThisMonth: number;
  appointmentsToday: number;
  upcomingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  estimatedRevenueMonth: number;
  recentActivities: ClientActivity[];
}
