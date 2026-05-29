import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { env } from "../env.js";
import * as schema from "./schema.js";

/**
 * Neon serverless Pool over WebSockets. In a Node/Bun (non-edge) runtime the
 * Neon driver needs a WebSocket implementation supplied explicitly.
 *
 * Pooling tuned per the project stack: small ceiling, fail fast on connect,
 * recycle idle connections so we don't hold Neon compute open.
 */
neonConfig.webSocketConstructor = ws;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

export const db = drizzle(pool, { schema });

export { schema };
