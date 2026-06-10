import { getSupabaseServerClient } from "../middleware/requireAuth";
import { Document } from "../types/document";

// Fallback in-memory database store
let localDocumentsStore: Document[] = [];

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
    } catch (err) {
      console.warn("[DocumentService] Supabase getDocuments fallback to in-memory store:", err);
      let results = localDocumentsStore.filter((d) => d.workspaceId === workspaceId);
      if (filters.clientId) {
        results = results.filter((d) => d.clientId === filters.clientId);
      }
      if (filters.appointmentId) {
        results = results.filter((d) => d.appointmentId === filters.appointmentId);
      }
      if (filters.category) {
        results = results.filter((d) => d.category === filters.category);
      }
      return results;
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
    } catch (err) {
      console.warn("[DocumentService] Supabase getDocumentById fallback to in-memory store:", err);
      const doc = localDocumentsStore.find((d) => d.id === id && d.workspaceId === workspaceId);
      return doc || null;
    }
  }

  static async createDocument(workspaceId: string, payload: Partial<Document>): Promise<Document> {
    const newDoc: Document = {
      id: payload.id || `doc_${Math.random().toString(36).substring(2, 11)}`,
      workspaceId,
      clientId: payload.clientId,
      appointmentId: payload.appointmentId,
      name: payload.name || "Untitled File",
      fileUrl: payload.fileUrl || "",
      fileSize: payload.fileSize,
      mimeType: payload.mimeType,
      category: payload.category || "document",
      uploadedBy: payload.uploadedBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from("documents")
        .insert({
          id: newDoc.id,
          workspace_id: workspaceId,
          client_id: newDoc.clientId,
          appointment_id: newDoc.appointmentId,
          name: newDoc.name,
          file_url: newDoc.fileUrl,
          file_size: newDoc.fileSize,
          mime_type: newDoc.mimeType,
          category: newDoc.category,
          uploaded_by: newDoc.uploadedBy,
        })
        .select("*")
        .single();

      if (error) throw error;
      return this.mapToCamel(data);
    } catch (err) {
      console.warn("[DocumentService] Supabase createDocument fallback to in-memory storage:", err);
      localDocumentsStore.push(newDoc);
      return newDoc;
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
    } catch (err) {
      console.warn("[DocumentService] Supabase deleteDocument fallback to in-memory deletion:", err);
      const index = localDocumentsStore.findIndex((d) => d.id === id && d.workspaceId === workspaceId);
      if (index !== -1) {
        localDocumentsStore.splice(index, 1);
        return true;
      }
      return false;
    }
  }
}
