import axios from "axios";
import { getSupabaseServerClient } from "../middleware/requireAuth";
import { ApiError } from "../types/errors";

export function isSafeUrl(urlStr: string): { safe: boolean; reason?: string } {
  try {
    if (!urlStr) {
      return { safe: false, reason: "URL is empty" };
    }
    const parsed = new URL(urlStr);
    
    // Check protocol
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { safe: false, reason: "Only HTTP and HTTPS protocols are allowed" };
    }

    const hostname = parsed.hostname.toLowerCase();

    // 1. Reject localhost and ipv6 loopback
    if (hostname === "localhost" || hostname === "[::1]") {
      return { safe: false, reason: "Access to localhost or loopback is forbidden" };
    }

    // 2. Reject *.internal
    if (hostname === "internal" || hostname.endsWith(".internal")) {
      return { safe: false, reason: "Access to internal domain structures is forbidden" };
    }

    // 3. Reject exact local/loopback IPs
    if (hostname === "127.0.0.1" || hostname === "0.0.0.0") {
      return { safe: false, reason: "Loopback and wildcard IP addresses are forbidden" };
    }

    // 4. Reject private IP ranges
    // 10.*
    if (hostname.startsWith("10.")) {
      return { safe: false, reason: "Private network addresses (Class A) are forbidden" };
    }

    // 192.168.*
    if (hostname.startsWith("192.168.")) {
      return { safe: false, reason: "Private network addresses (Class C) are forbidden" };
    }

    // 169.254.* (Link-local)
    if (hostname.startsWith("169.254.")) {
      return { safe: false, reason: "Link-local addresses are forbidden" };
    }

    // 172.16-31.*
    const parts = hostname.split(".");
    if (parts.length === 4) {
      if (parts[0] === "172") {
        const secondPart = parseInt(parts[1], 10);
        if (!isNaN(secondPart) && secondPart >= 16 && secondPart <= 31) {
          return { safe: false, reason: "Private network addresses (Class B) are forbidden" };
        }
      }
    }

    return { safe: true };
  } catch (err) {
    return { safe: false, reason: "URL is malformed or invalid" };
  }
}

export function sanitizeUrlForLogging(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    parsed.search = "";
    parsed.hash = "";
    parsed.username = "";
    parsed.password = "";
    return parsed.toString();
  } catch {
    return "[Invalid URL]";
  }
}

export interface WebhookSubscription {
  id: string;
  workspaceId: string;
  url: string;
  events: string[]; // e.g. ["appointment.created", "client.created", "payment.completed"]
  isActive: boolean;
  createdAt: string;
}

// In-Memory vault - empty by default (no hardcoded workspace data)
let inMemorySubscriptions: WebhookSubscription[] = [];

export class WebhookService {
  static async getSubscriptions(workspaceId: string): Promise<WebhookSubscription[]> {
    try {
      const supabaseUrl = process.env.SUPABASE_URL || "";
      if (!supabaseUrl) {
        return inMemorySubscriptions.filter(s => s.workspaceId === workspaceId && s.isActive);
      }

      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from("webhook_subscriptions")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("is_active", true);

      if (error) {
        console.warn("[WebhookService] SQL select error, falling back to memory vault:", error.message);
        return inMemorySubscriptions.filter(s => s.workspaceId === workspaceId && s.isActive);
      }

      return data.map(this.mapFromDb);
    } catch (err: any) {
      console.warn("[WebhookService] Exception in getSubscriptions, using memory vault fallback:", err.message);
      return inMemorySubscriptions.filter(s => s.workspaceId === workspaceId && s.isActive);
    }
  }

  static async createSubscription(
    workspaceId: string,
    url: string,
    events: string[]
  ): Promise<WebhookSubscription> {
    const check = isSafeUrl(url);
    if (!check.safe) {
      throw new ApiError(400, `Insecure or invalid webhook URL: ${check.reason}`);
    }

    const newSub: WebhookSubscription = {
      id: `wh_${Math.random().toString(36).substr(2, 9)}`,
      workspaceId,
      url,
      events: events.length > 0 ? events : ["client.created"],
      isActive: true,
      createdAt: new Date().toISOString()
    };

    inMemorySubscriptions.push(newSub);

    try {
      const supabaseUrl = process.env.SUPABASE_URL || "";
      if (supabaseUrl) {
        const supabase = getSupabaseServerClient();
        const { error } = await supabase
          .from("webhook_subscriptions")
          .insert({
            id_pk: newSub.id,
            workspace_id: workspaceId,
            url: newSub.url,
            events: newSub.events,
            is_active: true
          });

        if (error) {
          console.warn("[WebhookService] Failed to insert SQL webhook subscription:", error.message);
        }
      }
    } catch (err: any) {
      console.warn("[WebhookService] Exception in createSubscription, saved in-memory:", err.message);
    }

    return newSub;
  }

  static async deleteSubscription(workspaceId: string, id: string): Promise<boolean> {
    const memIdx = inMemorySubscriptions.findIndex(s => s.workspaceId === workspaceId && s.id === id);
    if (memIdx !== -1) {
      inMemorySubscriptions[memIdx].isActive = false;
    }

    try {
      const supabaseUrl = process.env.SUPABASE_URL || "";
      if (supabaseUrl) {
        const supabase = getSupabaseServerClient();
        const { error } = await supabase
          .from("webhook_subscriptions")
          .update({ is_active: false })
          .eq("id_pk", id)
          .eq("workspace_id", workspaceId);

        if (error) {
          console.warn("[WebhookService] Failed SQL update for revoking subscription:", error.message);
          return true; // fall back to memory update success status
        }
      }
    } catch (err: any) {
      console.warn("[WebhookService] Error revoking webhook subscription, run in memory:", err.message);
    }

    return true;
  }

  /**
   * Dispatches asynchronous POST request to matching active listeners.
   */
  static async triggerEvent(workspaceId: string, event: string, payload: any): Promise<void> {
    try {
      const subs = await this.getSubscriptions(workspaceId);
      const matched = subs.filter(s => s.events.includes(event) || s.events.includes("*"));

      if (matched.length === 0) {
        return;
      }

      const bodyPayload = {
        event,
        timestamp: new Date().toISOString(),
        workspaceId,
        data: payload
      };

      // Dispatch asynchronously to avoid delaying system response
      matched.forEach(sub => {
        const check = isSafeUrl(sub.url);
        if (!check.safe) {
          console.warn(`[WebhookService] Skipping webhook event delivery. Insecure endpoint URL: ${check.reason}`);
          return;
        }

        const safeUrlLog = sanitizeUrlForLogging(sub.url);

        axios.post(sub.url, bodyPayload, {
          timeout: 4000,
          headers: {
            "Content-Type": "application/json",
            "X-Workspace-Event": event
          }
        }).then(() => {
          console.log(`[WebhookService] Event ${event} successfully dispatched to endpoint [${safeUrlLog}]`);
        }).catch((err) => {
          console.warn(`[WebhookService] Event ${event} failed dispatch to endpoint [${safeUrlLog}]:`, err.message);
        });
      });
    } catch (err: any) {
      console.warn("[WebhookService] triggerEvent exception inside system registers:", err.message);
    }
  }

  private static mapFromDb(row: any): WebhookSubscription {
    return {
      id: row.id_pk || row.id || "",
      workspaceId: row.workspace_id,
      url: row.url || "",
      events: Array.isArray(row.events) 
        ? row.events 
        : typeof row.events === "string" 
          ? JSON.parse(row.events) 
          : [],
      isActive: !!row.is_active,
      createdAt: row.created_at || new Date().toISOString()
    };
  }
}
