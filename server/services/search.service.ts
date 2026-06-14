import { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "../middleware/requireAuth";

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

interface SearchParams {
  workspaceId: string;
  q: string;
  supabase?: SupabaseClient;
}

export class SearchService {
  // Sanitize user input for ilike patterns - escape %, _, and backslash
  private static sanitizeLikeInput(input: string): string {
    return input.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
  }

  static async searchAll(params: SearchParams): Promise<SearchResultItem[]> {
    const { workspaceId, q, supabase: optionalClient } = params;
    const searchTerm = (q || "").trim();
    if (!searchTerm) return [];

    const client = optionalClient || getSupabaseServerClient();
    const results: SearchResultItem[] = [];
    const safeSearch = this.sanitizeLikeInput(searchTerm);

    // 1. SEARCH CLIENTS (first_name, last_name, email, phone, tag)
    try {
      const { data: clients, error } = await client
        .from("clients")
        .select("*")
        .eq("workspace_id", workspaceId)
        .is("deleted_at", null)
        .or(
          `first_name.ilike.%${safeSearch}%,last_name.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%,tag.ilike.%${safeSearch}%`
        )
        .limit(20)
        .order("created_at", { ascending: false });

      if (error) throw error;

      for (const c of clients || []) {
        results.push({
          id: c.id,
          type: "client",
          title: `${c.first_name} ${c.last_name || ""}`.trim(),
          subtitle: c.email || c.phone || "No contact details",
          description: c.tag ? `Tag: ${c.tag}` : undefined,
          date: c.created_at,
          metadata: { client: c },
        });
      }
    } catch (err) {
      console.warn("[SearchService] Client search error:", err);
    }

    // 2. SEARCH CLIENT NOTES
    try {
      const { data: notes, error } = await client
        .from("clients")
        .select("id, first_name, last_name, notes, created_at")
        .eq("workspace_id", workspaceId)
        .is("deleted_at", null)
        .not("notes", "is", null)
        .ilike("notes", `%${safeSearch}%`)
        .limit(10)
        .order("created_at", { ascending: false });

      if (error) throw error;

      for (const c of notes || []) {
        results.push({
          id: `note_client_${c.id}`,
          type: "note",
          title: `Notes: ${c.first_name} ${c.last_name || ""}`.trim(),
          subtitle: "Client Profile Notes",
          description: c.notes,
          date: c.created_at,
          metadata: { clientId: c.id, type: "client" },
        });
      }
    } catch (err) {
      console.warn("[SearchService] Client notes search error:", err);
    }

    // 3. SEARCH APPOINTMENTS (staff_name, status)
    try {
      const { data: appointments, error } = await client
        .from("appointments")
        .select("id, staff_name, start_time, status, notes, client_id")
        .eq("workspace_id", workspaceId)
        .or(
          `staff_name.ilike.%${safeSearch}%,status.ilike.%${safeSearch}%`
        )
        .limit(20)
        .order("start_time", { ascending: false });

      if (error) throw error;

      for (const app of appointments || []) {
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
    } catch (err) {
      console.warn("[SearchService] Appointment search error:", err);
    }

    // 4. SEARCH APPOINTMENT NOTES
    try {
      const { data: appNotes, error } = await client
        .from("appointments")
        .select("id, staff_name, start_time, notes, client_id")
        .eq("workspace_id", workspaceId)
        .not("notes", "is", null)
        .ilike("notes", `%${safeSearch}%`)
        .limit(10)
        .order("start_time", { ascending: false });

      if (error) throw error;

      for (const app of appNotes || []) {
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
      console.warn("[SearchService] Appointment notes search error:", err);
    }

    // 5. SEARCH CLIENT ACTIVITIES
    try {
      const { data: activities, error } = await client
        .from("client_activities")
        .select("*")
        .eq("workspace_id", workspaceId)
        .or(
          `title.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%,type.ilike.%${safeSearch}%`
        )
        .limit(20)
        .order("created_at", { ascending: false });

      if (error) throw error;

      for (const act of activities || []) {
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

    // 6. SEARCH DOCUMENTS
    try {
      const { data: docs, error } = await client
        .from("documents")
        .select("*")
        .eq("workspace_id", workspaceId)
        .or(
          `name.ilike.%${safeSearch}%,category.ilike.%${safeSearch}%,mime_type.ilike.%${safeSearch}%`
        )
        .limit(20)
        .order("created_at", { ascending: false });

      if (error) throw error;

      for (const doc of docs || []) {
        results.push({
          id: doc.id,
          type: "document",
          title: doc.name,
          subtitle: `${doc.category.toUpperCase()} | ${(doc.file_size ? (doc.file_size / 1024).toFixed(1) : "0")} KB`,
          description: `Document uploaded on ${new Date(doc.created_at).toLocaleDateString()}`,
          url: doc.file_url,
          date: doc.created_at,
          metadata: { document: doc },
        });
      }
    } catch (err) {
      console.warn("[SearchService] Documents search error:", err);
    }

    return results;
  }
}
