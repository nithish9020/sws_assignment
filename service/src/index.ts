import express from "express";
import cors from "cors";
import { createServer } from "http";
import { env } from "./env.js";
import { uploadRouter } from "./routes/upload.js";
import { documentsRouter } from "./routes/documents.js";
import { notificationsRouter } from "./routes/notifications.js";
import { initWebSocketServer } from "./ws/hub.js";

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

// API Routes
app.use("/api/upload", uploadRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/notifications", notificationsRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

const server = createServer(app);
initWebSocketServer(server);

server.listen(env.PORT, () => {
  console.log(`🚀 Service is running on http://localhost:${env.PORT}`);
  console.log(`🔌 WebSocket Hub listening on ws://localhost:${env.PORT}/ws/notifications`);
});
