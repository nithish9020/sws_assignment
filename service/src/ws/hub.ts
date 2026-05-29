import { WebSocketServer, WebSocket } from "ws";
import { Server as HttpServer } from "http";
import { WsEvent } from "@docmanager/shared";

let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();

export function initWebSocketServer(server: HttpServer) {
  wss = new WebSocketServer({ server, path: "/ws/notifications" });

  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
    clients.add(ws);

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
      clients.delete(ws);
    });

    ws.on("error", (error) => {
      console.error("WebSocket client error:", error);
      clients.delete(ws);
    });
  });
}

/**
 * Broadcast an event to all connected WebSocket clients.
 */
export function broadcastEvent(event: WsEvent) {
  const message = JSON.stringify(event);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
