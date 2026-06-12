import { Service } from "../types/service";
import { Appointment } from "../types/appointment";
import { getSupabaseServerClient } from "../middleware/requireAuth";
import { WebhookService } from "./webhook.service";

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Service orchestrator for managing services and appointments with multi-tenant separation.
 */
export class AppointmentService {
  private static readonly DEFAULT_LIMIT = 50;
  private static readonly MAX_LIMIT = 200;
  
  // --- Service Mappers ---
  private static mapToCamelService(row: any): Service {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      name: row.name,
      durationMinutes: row.duration_minutes,
      price: typeof row.price === "string" ? parseFloat(row.price) : row.price,
      createdAt: row.created_at,
    };
  }

  private static mapToSnakeService(payload: any) {
    const row: any = {};
    if (payload.name !== undefined) row.name = payload.name;
    if (payload.durationMinutes !== undefined) row.duration_minutes = payload.durationMinutes;
    if (payload.price !== undefined) row.price = payload.price;
    return row;
  }

  // --- Appointment Mappers ---
  private static mapToCamelAppointment(row: any): Appointment {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      clientId: row.client_id,
      serviceId: row.service_id || undefined,
      staffName: row.staff_name,
      startTime: row.start_time,
      endTime: row.end_time,
      status: row.status,
      notes: row.notes || undefined,
      createdAt: row.created_at,
    };
  }

  private static mapToSnakeAppointment(payload: any) {
    const row: any = {};
    if (payload.clientId !== undefined) row.client_id = payload.clientId;
    if (payload.serviceId !== undefined) row.service_id = payload.serviceId;
    if (payload.staffName !== undefined) row.staff_name = payload.staffName;
    if (payload.startTime !== undefined) row.start_time = payload.startTime;
    if (payload.endTime !== undefined) row.end_time = payload.endTime;
    if (payload.status !== undefined) row.status = payload.status;
    if (payload.notes !== undefined) row.notes = payload.notes;
    return row;
  }

  // ==========================================
  // SERVICES ENDPOINTS LAYER
  // ==========================================

  /**
   * Retrieves all services configured for a specific workspace with pagination.
   */
  static async getServices(
    workspaceId: string, 
    params: PaginationParams = {}
  ): Promise<PaginatedResult<Service>> {
    try {
      const supabase = getSupabaseServerClient();
      const page = Math.max(1, params.page || 1);
      const limit = Math.min(params.limit || this.DEFAULT_LIMIT, this.MAX_LIMIT);
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from("services")
        .select("*", { count: "exact" })
        .eq("workspace_id", workspaceId)
        .range(from, to);

      const sortBy = params.sortBy || "created_at";
      const sortOrder = params.sortOrder || "desc";
      query = query.order(sortBy, { ascending: sortOrder === "asc" });

      const { data, error, count } = await query;

      if (error) {
        console.error(`[AppointmentService] getServices DB Error:`, error);
        throw new Error("Failed to retrieve services from database.");
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        data: (data || []).map((item: any) => this.mapToCamelService(item)),
        pagination: { page, limit, total, totalPages },
      };
    } catch (err) {
      console.error(`[AppointmentService] Exception in getServices:`, err);
      throw err;
    }
  }

  /**
   * Fetch a single service by ID under workspace constraint.
   */
  static async getServiceById(id: string, workspaceId: string): Promise<Service | null> {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("id", id)
        .eq("workspace_id", workspaceId)
        .maybeSingle();

      if (error) {
        console.error(`[AppointmentService] getServiceById DB Error:`, error);
        throw new Error("Failed to retrieve service from database.");
      }

      if (!data) return null;
      return this.mapToCamelService(data);
    } catch (err) {
      console.error(`[AppointmentService] Exception in getServiceById:`, err);
      throw err;
    }
  }

  /**
   * Create a new service under a specified workspace.
   */
  static async createService(
    workspaceId: string,
    payload: { name: string; durationMinutes: number; price: number }
  ): Promise<Service> {
    try {
      const supabase = getSupabaseServerClient();
      const dbPayload = {
        workspace_id: workspaceId,
        ...this.mapToSnakeService(payload),
      };

      const { data, error } = await supabase
        .from("services")
        .insert(dbPayload)
        .select()
        .single();

      if (error) {
        console.error(`[AppointmentService] createService DB Error:`, error);
        throw new Error("Failed to persist new service record.");
      }

      return this.mapToCamelService(data);
    } catch (err) {
      console.error(`[AppointmentService] Exception in createService:`, err);
      throw err;
    }
  }

  /**
   * Update parameters of an existing service.
   */
  static async updateService(
    id: string,
    workspaceId: string,
    payload: Partial<{ name: string; durationMinutes: number; price: number }>
  ): Promise<Service> {
    try {
      const supabase = getSupabaseServerClient();
      const dbPayload = this.mapToSnakeService(payload);

      const { data, error } = await supabase
        .from("services")
        .update(dbPayload)
        .eq("id", id)
        .eq("workspace_id", workspaceId)
        .select()
        .single();

      if (error) {
        console.error(`[AppointmentService] updateService DB Error:`, error);
        throw new Error("Failed to update service record.");
      }

      return this.mapToCamelService(data);
    } catch (err) {
      console.error(`[AppointmentService] Exception in updateService:`, err);
      throw err;
    }
  }

  /**
   * Remove a service under the workspace constraint.
   */
  static async deleteService(id: string, workspaceId: string): Promise<void> {
    try {
      const supabase = getSupabaseServerClient();
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", id)
        .eq("workspace_id", workspaceId);

      if (error) {
        console.error(`[AppointmentService] deleteService DB Error:`, error);
        throw new Error("Failed to delete service record.");
      }
    } catch (err) {
      console.error(`[AppointmentService] Exception in deleteService:`, err);
      throw err;
    }
  }

  // ==========================================
  // APPOINTMENTS ENDPOINTS LAYER
  // ==========================================

  /**
   * Retrieves all appointments in a workspace with pagination.
   */
  static async getAppointments(
    workspaceId: string, 
    params: PaginationParams = {}
  ): Promise<PaginatedResult<Appointment>> {
    try {
      const supabase = getSupabaseServerClient();
      const page = Math.max(1, params.page || 1);
      const limit = Math.min(params.limit || this.DEFAULT_LIMIT, this.MAX_LIMIT);
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from("appointments")
        .select("*", { count: "exact" })
        .eq("workspace_id", workspaceId)
        .range(from, to);

      const sortBy = params.sortBy || "start_time";
      const sortOrder = params.sortOrder || "asc";
      query = query.order(sortBy, { ascending: sortOrder === "asc" });

      const { data, error, count } = await query;

      if (error) {
        console.error(`[AppointmentService] getAppointments DB Error:`, error);
        throw new Error("Failed to retrieve appointments list from database.");
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        data: (data || []).map((item: any) => this.mapToCamelAppointment(item)),
        pagination: { page, limit, total, totalPages },
      };
    } catch (err) {
      console.error(`[AppointmentService] Exception in getAppointments:`, err);
      throw err;
    }
  }

  /**
   * Fetch a single appointment by ID.
   */
  static async getAppointmentById(id: string, workspaceId: string): Promise<Appointment | null> {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("id", id)
        .eq("workspace_id", workspaceId)
        .maybeSingle();

      if (error) {
        console.error(`[AppointmentService] getAppointmentById DB Error:`, error);
        throw new Error("Failed to retrieve appointment details.");
      }

      if (!data) return null;
      return this.mapToCamelAppointment(data);
    } catch (err) {
      console.error(`[AppointmentService] Exception in getAppointmentById:`, err);
      throw err;
    }
  }

  /**
   * Create a new appointment booking.
   */
  static async createAppointment(
    workspaceId: string,
    payload: {
      clientId: string;
      serviceId?: string | null;
      staffName: string;
      startTime: string;
      endTime: string;
      status?: string;
      notes?: string | null;
    }
  ): Promise<Appointment> {
    try {
      const supabase = getSupabaseServerClient();
      const dbPayload = {
        workspace_id: workspaceId,
        ...this.mapToSnakeAppointment(payload),
      };

      const { data, error } = await supabase
        .from("appointments")
        .insert(dbPayload)
        .select()
        .single();

      if (error) {
        console.error(`[AppointmentService] createAppointment DB Error:`, error);
        throw new Error("Failed to persist new appointment booking.");
      }

      const camelAppointment = this.mapToCamelAppointment(data);
      WebhookService.triggerEvent(workspaceId, "appointment.created", camelAppointment);

      return camelAppointment;
    } catch (err) {
      console.error(`[AppointmentService] Exception in createAppointment:`, err);
      throw err;
    }
  }

  /**
   * Update an existing appointment booking.
   */
  static async updateAppointment(
    id: string,
    workspaceId: string,
    payload: Partial<{
      clientId: string;
      serviceId: string | null;
      staffName: string;
      startTime: string;
      endTime: string;
      status: string;
      notes: string | null;
    }>
  ): Promise<Appointment> {
    try {
      const supabase = getSupabaseServerClient();
      const dbPayload = this.mapToSnakeAppointment(payload);

      const { data, error } = await supabase
        .from("appointments")
        .update(dbPayload)
        .eq("id", id)
        .eq("workspace_id", workspaceId)
        .select()
        .single();

      if (error) {
        console.error(`[AppointmentService] updateAppointment DB Error:`, error);
        throw new Error("Failed to update appointment record.");
      }

      return this.mapToCamelAppointment(data);
    } catch (err) {
      console.error(`[AppointmentService] Exception in updateAppointment:`, err);
      throw err;
    }
  }

  /**
   * Delete an appointment booking.
   */
  static async deleteAppointment(id: string, workspaceId: string): Promise<void> {
    try {
      const supabase = getSupabaseServerClient();
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id)
        .eq("workspace_id", workspaceId);

      if (error) {
        console.error(`[AppointmentService] deleteAppointment DB Error:`, error);
        throw new Error("Failed to delete appointment record.");
      }
    } catch (err) {
      console.error(`[AppointmentService] Exception in deleteAppointment:`, err);
      throw err;
    }
  }
}
