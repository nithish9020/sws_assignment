import express from "express";
import cors from "cors";
import { env } from "./env.js";
import { uploadRouter } from "./routes/upload.js";

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

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

app.listen(env.PORT, () => {
  console.log(`🚀 Service is running on http://localhost:${env.PORT}`);
});
