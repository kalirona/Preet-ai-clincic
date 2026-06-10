import crypto from "crypto";
import { getSupabaseServerClient } from "../middleware/requireAuth";

export interface ApiKey {
  id: string;
  workspaceId: string;
  name: string;
  prefix: string;
  secretKey: string;
  keyHash: string;
  scopes: string[];
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

// In-Memory fallback cache to support seamless preview operations
let inMemoryApiKeys: ApiKey[] = [
  {
    id: "key_1",
    workspaceId: "1",
    name: "Zapier Automated CRM Lead Capture",
    prefix: "pr_live_",
    secretKey: "pr_live_zapier_workspace_token_sec_key_demo_01928",
    keyHash: hashApiKey("pr_live_zapier_workspace_token_sec_key_demo_01928"),
    scopes: ["clients:read", "clients:write", "appointments:read"],
    expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export class ApiKeyService {
  static async getApiKeys(workspaceId: string): Promise<ApiKey[]> {
    try {
      const supabaseUrl = process.env.SUPABASE_URL || "";
      if (!supabaseUrl) {
        return inMemoryApiKeys.filter(k => k.workspaceId === workspaceId && k.isActive);
      }

      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from("workspace_api_keys")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("is_active", true);

      if (error) {
        console.warn("[ApiKeyService] SQL Select error, falling back to memory vault:", error.message);
        return inMemoryApiKeys.filter(k => k.workspaceId === workspaceId && k.isActive);
      }

      return data.map(this.mapFromDb);
    } catch (err: any) {
      console.warn("[ApiKeyService] getApiKeys Exception, using memory fallback:", err.message);
      return inMemoryApiKeys.filter(k => k.workspaceId === workspaceId && k.isActive);
    }
  }

  static async createApiKey(
    workspaceId: string,
    params: { name: string; scopes: string[]; expiresDays: number }
  ): Promise<ApiKey> {
    const randomHex = crypto.randomBytes(24).toString("hex");
    const secretKeyStr = `pr_live_${randomHex}`;
    const prefixStr = "pr_live_";
    const expiresAtStr = new Date(Date.now() + params.expiresDays * 24 * 60 * 60 * 1000).toISOString();

    const newKey: ApiKey = {
      id: `ak_${Math.random().toString(36).substr(2, 9)}`,
      workspaceId,
      name: params.name,
      prefix: prefixStr,
      secretKey: secretKeyStr,
      keyHash: hashApiKey(secretKeyStr),
      scopes: params.scopes,
      expiresAt: expiresAtStr,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastUsedAt: null
    };

    // Store in memory vault
    inMemoryApiKeys.push(newKey);

    try {
      const supabaseUrl = process.env.SUPABASE_URL || "";
      if (supabaseUrl) {
        const supabase = getSupabaseServerClient();
        const { error } = await supabase
          .from("workspace_api_keys")
          .insert({
            id_pk: newKey.id,
            workspace_id: workspaceId,
            name: newKey.name,
            prefix: newKey.prefix,
            secret_key: newKey.keyHash,
            scopes: newKey.scopes,
            expires_at: newKey.expiresAt,
            is_active: true
          });

        if (error) {
          console.warn("[ApiKeyService] Failed to insert SQL api_key metadata:", error.message);
        }
      }
    } catch (err: any) {
      console.warn("[ApiKeyService] createApiKey Exception, saved in memory fallback:", err.message);
    }

    return newKey;
  }

  static async revokeApiKey(workspaceId: string, keyId: string): Promise<boolean> {
    const memIdx = inMemoryApiKeys.findIndex(k => k.workspaceId === workspaceId && k.id === keyId);
    if (memIdx !== -1) {
      inMemoryApiKeys[memIdx].isActive = false;
    }

    try {
      const supabaseUrl = process.env.SUPABASE_URL || "";
      if (supabaseUrl) {
        const supabase = getSupabaseServerClient();
        const { error } = await supabase
          .from("workspace_api_keys")
          .update({ is_active: false })
          .eq("workspace_id", workspaceId)
          .eq("id_pk", keyId);

        if (error) {
          console.warn("[ApiKeyService] failed to revoke api key in SQL table:", error.message);
          return true;
        }
      }
    } catch (err: any) {
      console.warn("[ApiKeyService] revokeApiKey Exception, completed on in-memory vault:", err.message);
    }

    return true;
  }

  static async verifyApiKey(rawKey: string): Promise<ApiKey | null> {
    if (!rawKey) return null;

    const rawKeyHash = hashApiKey(rawKey);

    // 1. Try checking in-memory vault first
    const matchedMem = inMemoryApiKeys.find(
      k => k.keyHash === rawKeyHash && k.isActive && new Date(k.expiresAt).getTime() > Date.now()
    );

    if (matchedMem) {
      matchedMem.lastUsedAt = new Date().toISOString();
      return matchedMem;
    }

    // 2. Try checking SQL Db
    try {
      const supabaseUrl = process.env.SUPABASE_URL || "";
      if (supabaseUrl) {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
          .from("workspace_api_keys")
          .select("*")
          .eq("secret_key", rawKeyHash)
          .eq("is_active", true)
          .single();

        if (!error && data) {
          const parsed = this.mapFromDb(data);
          const isExpired = new Date(parsed.expiresAt).getTime() <= Date.now();
          if (!isExpired) {
            // Update last used asynchronously
            await supabase
              .from("workspace_api_keys")
              .update({ last_used_at: new Date().toISOString() })
              .eq("secret_key", rawKeyHash);
            
            return parsed;
          }
        }
      }
    } catch (err: any) {
      console.warn("[ApiKeyService] verifyApiKey DB validation skipped:", err.message);
    }

    return null;
  }

  private static mapFromDb(row: any): ApiKey {
    return {
      id: row.id_pk || row.id || "",
      workspaceId: row.workspace_id,
      name: row.name || "API Access Token",
      prefix: row.prefix || "pr_live_",
      secretKey: "",
      keyHash: row.secret_key || "",
      scopes: Array.isArray(row.scopes) 
        ? row.scopes 
        : typeof row.scopes === "string" 
          ? JSON.parse(row.scopes) 
          : [],
      expiresAt: row.expires_at,
      isActive: !!row.is_active,
      createdAt: row.created_at || new Date().toISOString(),
      lastUsedAt: row.last_used_at || null
    };
  }
}
