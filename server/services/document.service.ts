import { getSupabaseServerClient } from "../middleware/requireAuth";
import { Document } from "../types/document";

export class DocumentService {
  private static mapToCamel(row: any): Document {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      clientId: row.client_id || undefined,
      appointmentId: row.appointment_id || undefined,
      name: row.name,
      fileUrl: row.file_url,
      fileSize: row.file_size || undefined,
      mimeType: row.mime_type || undefined,
      category: row.category,
      uploadedBy: row.uploaded_by || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async getDocuments(
    workspaceId: string,
    filters: { clientId?: string; appointmentId?: string; category?: string } = {}
  ): Promise<Document[]> {
    try {
      const supabase = getSupabaseServerClient();
      let query = supabase.from("documents").select("*").eq("workspace_id", workspaceId);

      if (filters.clientId) {
        query = query.eq("client_id", filters.clientId);
      }
      if (filters.appointmentId) {
        query = query.eq("appointment_id", filters.appointmentId);
      }
      if (filters.category) {
        query = query.eq("category", filters.category);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(this.mapToCamel);
    } catch (err: any) {
      console.error("[DocumentService] getDocuments error:", err.message);
      throw err;
    }
  }

  static async getDocumentById(id: string, workspaceId: string): Promise<Document | null> {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", id)
        .eq("workspace_id", workspaceId)
        .maybeSingle();

      if (error) throw error;
      return data ? this.mapToCamel(data) : null;
    } catch (err: any) {
      console.error("[DocumentService] getDocumentById error:", err.message);
      throw err;
    }
  }

  static async createDocument(workspaceId: string, payload: Partial<Document>): Promise<Document> {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from("documents")
        .insert({
          workspace_id: workspaceId,
          client_id: payload.clientId || null,
          appointment_id: payload.appointmentId || null,
          name: payload.name || "Untitled File",
          file_url: payload.fileUrl || "",
          file_size: payload.fileSize || null,
          mime_type: payload.mimeType || null,
          category: payload.category || "document",
          uploaded_by: payload.uploadedBy || null,
        })
        .select("*")
        .single();

      if (error) throw error;
      return this.mapToCamel(data);
    } catch (err: any) {
      console.error("[DocumentService] createDocument error:", err.message);
      throw err;
    }
  }

  static async deleteDocument(id: string, workspaceId: string): Promise<boolean> {
    try {
      const supabase = getSupabaseServerClient();
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", id)
        .eq("workspace_id", workspaceId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error("[DocumentService] deleteDocument error:", err.message);
      throw err;
    }
  }
}
