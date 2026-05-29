import { z } from "zod";

/**
 * Single source of truth for the data contracts shared between the Expo app
 * and the Bun/Express service. Both sides import these schemas so that a field
 * rename breaks the build on both ends instead of failing silently at runtime.
 */

/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

export const UploadStatus = z.enum([
  "queued",
  "uploading", // client -> server transfer in progress
  "processing", // server-side handling (store to provider, persist row)
  "complete",
  "failed",
]);
export type UploadStatus = z.infer<typeof UploadStatus>;

export const NotificationType = z.enum([
  "upload_complete",
  "upload_failed",
  "bulk_upload_complete",
]);
export type NotificationType = z.infer<typeof NotificationType>;

/* ------------------------------------------------------------------ */
/* Domain models (server -> client shapes)                             */
/* ------------------------------------------------------------------ */

export const DocumentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  size: z.number().int().nonnegative(), // bytes
  mimeType: z.string(),
  url: z.string().url(),
  createdAt: z.string().datetime(),
});
export type Document = z.infer<typeof DocumentSchema>;

export const UploadRecordSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  size: z.number().int().nonnegative(),
  status: UploadStatus,
  documentId: z.string().uuid().nullable(),
  error: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type UploadRecord = z.infer<typeof UploadRecordSchema>;

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  type: NotificationType,
  message: z.string(),
  read: z.boolean(),
  createdAt: z.string().datetime(),
});
export type Notification = z.infer<typeof NotificationSchema>;

/* ------------------------------------------------------------------ */
/* API response envelopes                                              */
/* ------------------------------------------------------------------ */

/** POST /api/upload -> one entry per file accepted into the pipeline. */
export const UploadResponseSchema = z.object({
  uploads: z.array(UploadRecordSchema),
  /** true when > 3 files were submitted -> client shows background banner. */
  background: z.boolean(),
});
export type UploadResponse = z.infer<typeof UploadResponseSchema>;

export const DocumentListSchema = z.object({
  documents: z.array(DocumentSchema),
});
export type DocumentList = z.infer<typeof DocumentListSchema>;

export const NotificationListSchema = z.object({
  notifications: z.array(NotificationSchema),
});
export type NotificationList = z.infer<typeof NotificationListSchema>;

export const UnreadCountSchema = z.object({
  count: z.number().int().nonnegative(),
});
export type UnreadCount = z.infer<typeof UnreadCountSchema>;

/* ------------------------------------------------------------------ */
/* WebSocket events (server -> client over /ws/notifications)          */
/* ------------------------------------------------------------------ */

export const WsEventSchema = z.discriminatedUnion("event", [
  z.object({
    event: z.literal("notification"),
    data: NotificationSchema,
  }),
  z.object({
    event: z.literal("upload_status"),
    data: UploadRecordSchema,
  }),
]);
export type WsEvent = z.infer<typeof WsEventSchema>;

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

/** Submitting more than this many files at once triggers background mode. */
export const BULK_UPLOAD_THRESHOLD = 3;

/** Only PDFs are accepted per the assessment brief. */
export const ACCEPTED_MIME_TYPES = ["application/pdf"] as const;
