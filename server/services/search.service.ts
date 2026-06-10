import { getSupabaseServerClient } from "../middleware/requireAuth";
import { ClientService } from "./client.service";
import { DocumentService } from "./document.service";

export interface SearchResultItem {
  id: string;
  type: "client" | "appointment" | "activity" | "document" | "note";
  title: string;
  subtitle?: string;
  description?: string;
  url?: string;
  date?: string;
  metadata?: any;
}

export class SearchService {
  /**
   * Universal high-fidelity search across multiple collections inside the workspace client partition.
   */
  static async searchAll(workspaceId: string, q: string): Promise<SearchResultItem[]> {
    const searchTerm = (q || "").trim().toLowerCase();
    if (!searchTerm) return [];

    const results: SearchResultItem[] = [];

    // 1. SEARCH CLIENT DATA & CLIENT NOTES
    try {
      const clients = await ClientService.getClients(workspaceId);
      const matchedClients = clients.filter((c) => {
        return (
          c.firstName.toLowerCase().includes(searchTerm) ||
          c.lastName?.toLowerCase().includes(searchTerm) ||
          c.email?.toLowerCase().includes(searchTerm) ||
          c.phone?.toLowerCase().includes(searchTerm) ||
          c.tag?.toLowerCase().includes(searchTerm)
        );
      });

      for (const client of matchedClients) {
        results.push({
          id: client.id,
          type: "client",
          title: `${client.firstName} ${client.lastName || ""}`.trim(),
          subtitle: client.email || client.phone || "No contact details",
          description: client.tag ? `Tag: ${client.tag}` : undefined,
          date: client.createdAt as string,
          metadata: { client },
        });
      }

      // Notes sub-tier search inside Clients
      const matchedNotes = clients.filter((c) => c.notes?.toLowerCase().includes(searchTerm));
      for (const client of matchedNotes) {
        results.push({
          id: `note_client_${client.id}`,
          type: "note",
          title: `Notes: ${client.firstName} ${client.lastName || ""}`.trim(),
          subtitle: "Client Profile Notes",
          description: client.notes,
          date: client.createdAt as string,
          metadata: { clientId: client.id, type: "client" },
        });
      }
    } catch (err) {
      console.warn("[SearchService] Client query search error:", err);
    }

    // 2. SEARCH APPOINTMENTS & APPOINTMENT NOTES
    try {
      const supabase = getSupabaseServerClient();
      const { data: appointmentsRaw, error } = await supabase
        .from("appointments")
        .select(`
          id,
          staff_name,
          start_time,
          status,
          notes,
          client_id
        `)
        .eq("workspace_id", workspaceId);

      const appointments = error ? [] : appointmentsRaw || [];
      const matchedAppointments = appointments.filter((app: any) => {
        return (
          app.staff_name.toLowerCase().includes(searchTerm) ||
          app.status.toLowerCase().includes(searchTerm)
        );
      });

      for (const app of matchedAppointments) {
        results.push({
          id: app.id,
          type: "appointment",
          title: `Appointment with ${app.staff_name}`,
          subtitle: `Status: ${app.status.toUpperCase()}`,
          description: `Scheduled for: ${new Date(app.start_time).toLocaleString()}`,
          date: app.start_time,
          metadata: { appointment: app },
        });
      }

      // Notes inside Appointments
      const matchedAppNotes = appointments.filter((app: any) => app.notes?.toLowerCase().includes(searchTerm));
      for (const app of matchedAppNotes) {
        results.push({
          id: `note_app_${app.id}`,
          type: "note",
          title: `Appointment Notes: ${app.staff_name}`,
          subtitle: "Scheduled Appointment Notes",
          description: app.notes,
          date: app.start_time,
          metadata: { appointmentId: app.id, clientId: app.client_id, type: "appointment" },
        });
      }
    } catch (err) {
      console.warn("[SearchService] Appointment query search error:", err);
    }

    // 3. SEARCH CLIENT ACTIVITIES
    try {
      const supabase = getSupabaseServerClient();
      const { data: activitiesRaw, error } = await supabase
        .from("client_activities")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      const activities = error ? [] : activitiesRaw || [];
      const matchedActivities = activities.filter((act: any) => {
        return (
          act.title.toLowerCase().includes(searchTerm) ||
          act.description?.toLowerCase().includes(searchTerm) ||
          act.type.toLowerCase().includes(searchTerm)
        );
      });

      for (const act of matchedActivities) {
        results.push({
          id: act.id,
          type: "activity",
          title: act.title,
          subtitle: `Activity Logs (${act.type})`,
          description: act.description,
          date: act.created_at,
          metadata: { activity: act },
        });
      }
    } catch (err) {
      console.warn("[SearchService] Activity search error:", err);
    }

    // 4. SEARCH UPLOADED DOCUMENTS / INVOICES / ATTACHMENTS
    try {
      const docs = await DocumentService.getDocuments(workspaceId);
      const matchedDocs = docs.filter((doc) => {
        return (
          doc.name.toLowerCase().includes(searchTerm) ||
          doc.category.toLowerCase().includes(searchTerm) ||
          doc.mimeType?.toLowerCase().includes(searchTerm)
        );
      });

      for (const doc of matchedDocs) {
        results.push({
          id: doc.id,
          type: "document",
          title: doc.name,
          subtitle: `${doc.category.toUpperCase()} | ${(doc.fileSize ? (doc.fileSize / 1024).toFixed(1) : "0")} KB`,
          description: `Document uploaded on ${new Date(doc.createdAt).toLocaleDateString()}`,
          url: doc.fileUrl,
          date: doc.createdAt as string,
          metadata: { document: doc },
        });
      }
    } catch (err) {
      console.warn("[SearchService] Documents search error:", err);
    }

    return results;
  }
}
