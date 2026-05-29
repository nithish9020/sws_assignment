import { pgTable, uuid, text, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";

/**
 * Drizzle schema. Mirrors the Zod contracts in @docmanager/shared.
 * Run `bun run db:push` (dev) or `db:generate` + `db:migrate` (prod) to apply.
 */

export const uploadStatusEnum = pgEnum("upload_status", [
  "queued",
  "uploading",
  "processing",
  "complete",
  "failed",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "upload_complete",
  "upload_failed",
  "bulk_upload_complete",
]);

/** Successfully stored documents (have a provider URL). */
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  size: integer("size").notNull(),
  mimeType: text("mime_type").notNull(),
  url: text("url").notNull(),
  /** Provider-specific handle used for deletion (e.g. Cloudinary public_id). */
  storageKey: text("storage_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Per-file pipeline state. One row per file submitted to /api/upload. */
export const uploads = pgTable("uploads", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  size: integer("size").notNull(),
  status: uploadStatusEnum("status").notNull().default("queued"),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "set null" }),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Persisted notifications shown in the app's notification center. */
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: notificationTypeEnum("type").notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
