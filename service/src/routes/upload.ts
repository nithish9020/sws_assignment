import { Router } from "express";
import multer from "multer";
import os from "os";
import fs from "fs";
import { eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { storage } from "../storage/index.js";
import { ACCEPTED_MIME_TYPES, BULK_UPLOAD_THRESHOLD, UploadRecord, NotificationType } from "@docmanager/shared";
import { broadcastEvent } from "../ws/hub.js";

export const uploadRouter: Router = Router();

function toUploadRecord(dbRecord: typeof schema.uploads.$inferSelect): UploadRecord {
  return {
    ...dbRecord,
    createdAt: dbRecord.createdAt.toISOString(),
  };
}

const upload = multer({
  dest: os.tmpdir(),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!ACCEPTED_MIME_TYPES.includes(file.mimetype as any)) {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  },
});

async function processSingleFile(file: Express.Multer.File, uploadRecord: UploadRecord) {
  try {
    const storedObject = await storage.upload({
      filepath: file.path,
      filename: file.originalname,
      mimeType: file.mimetype,
    });

    await fs.promises.unlink(file.path);

    const [document] = await db
      .insert(schema.documents)
      .values({
        name: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        url: storedObject.url,
        storageKey: storedObject.key,
      })
      .returning();

    if (!document) throw new Error("Failed to insert document record");

    const [completedUpload] = await db
      .update(schema.uploads)
      .set({
        status: "complete",
        documentId: document.id,
      })
      .where(eq(schema.uploads.id, uploadRecord.id))
      .returning();

    broadcastEvent({ event: "upload_status", data: toUploadRecord(completedUpload!) });
    return toUploadRecord(completedUpload!);
  } catch (err: any) {
    const [failedUpload] = await db
      .update(schema.uploads)
      .set({
        status: "failed",
        error: err.message,
      })
      .where(eq(schema.uploads.id, uploadRecord.id))
      .returning();

    broadcastEvent({ event: "upload_status", data: toUploadRecord(failedUpload!) });

    try {
      await fs.promises.unlink(file.path);
    } catch (e) {
      // Ignore unlink errors
    }

    return toUploadRecord(failedUpload!);
  }
}

uploadRouter.post("/", upload.array("file", 20), async (req, res, next) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({ error: "No files provided" });
      return;
    }

    const isBackground = files.length > BULK_UPLOAD_THRESHOLD;

    // 1. Initial insert into uploads (processing) for all files
    const uploadRecords = await db.transaction(async (tx) => {
      const records: UploadRecord[] = [];
      for (const file of files) {
        const [record] = await tx
          .insert(schema.uploads)
          .values({
            name: file.originalname,
            size: file.size,
            status: "processing",
          })
          .returning();
        records.push(toUploadRecord(record!));
      }
      return records;
    });

    if (isBackground) {
      // Respond immediately
      res.status(200).json({
        uploads: uploadRecords,
        background: true,
      });

      // Process in background
      (async () => {
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < files.length; i++) {
          const result = await processSingleFile(files[i]!, uploadRecords[i]!);
          if (result.status === "complete") successCount++;
          else failCount++;
        }

        // Send a bulk notification
        const [notification] = await db
          .insert(schema.notifications)
          .values({
            type: "bulk_upload_complete",
            message: `Bulk upload finished. ${successCount} successful, ${failCount} failed.`,
          })
          .returning();
          
        broadcastEvent({ 
          event: "notification", 
          data: { ...notification!, createdAt: notification!.createdAt.toISOString() } 
        });
      })();
    } else {
      // Process sequentially and respond when done
      const completedRecords: UploadRecord[] = [];
      for (let i = 0; i < files.length; i++) {
        const record = await processSingleFile(files[i]!, uploadRecords[i]!);
        completedRecords.push(record);
      }

      res.status(200).json({
        uploads: completedRecords,
        background: false,
      });
      
      // Optionally create a notification for single files if needed
      if (files.length === 1 && completedRecords[0]?.status === "complete") {
        const [notification] = await db.insert(schema.notifications).values({
          type: "upload_complete",
          message: `Successfully uploaded ${files[0]?.originalname}`,
        }).returning();
        broadcastEvent({ 
          event: "notification", 
          data: { ...notification!, createdAt: notification!.createdAt.toISOString() } 
        });
      }
    }
  } catch (error) {
    next(error);
  }
});

uploadRouter.get("/:id/status", async (req, res, next) => {
  try {
    const { id } = req.params;

    const uploadRecord = await db.query.uploads.findFirst({
      where: eq(schema.uploads.id, id),
    });

    if (!uploadRecord) {
      res.status(404).json({ error: "Upload not found" });
      return;
    }

    res.status(200).json(uploadRecord);
  } catch (error) {
    next(error);
  }
});
