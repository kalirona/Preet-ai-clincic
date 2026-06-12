import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { createClient } from "@supabase/supabase-js";

interface WsClient {
  ws: WebSocket;
  userId: string;
  workspaceId: string;
}

const clients = new Map<WebSocket, WsClient>();

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function initializeWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", async (ws, req) => {
    const url = new URL(req.url || "", "http://localhost");
    const token = url.searchParams.get("token");
    const workspaceId = url.searchParams.get("workspaceId");

    if (!token || !workspaceId) {
      ws.close(4001, "Missing token or workspaceId");
      return;
    }

    try {
      const supabase = getSupabaseAdmin();
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        ws.close(4001, "Invalid token");
        return;
      }

      // Verify workspace membership
      const { data: membership } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!membership) {
        ws.close(4003, "Not a member of this workspace");
        return;
      }

      const client: WsClient = { ws, userId: user.id, workspaceId };
      clients.set(ws, client);

      ws.on("close", () => clients.delete(ws));
      ws.on("error", () => clients.delete(ws));

      // Send confirmation
      ws.send(JSON.stringify({ type: "connected", userId: user.id }));
    } catch {
      ws.close(4001, "Authentication failed");
    }
  });

  return wss;
}

export function broadcastToWorkspace(workspaceId: string, event: string, data: any) {
  const message = JSON.stringify({ type: event, ...data });
  for (const client of clients.values()) {
    if (client.workspaceId === workspaceId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  }
}
