import { Router } from "express";
import multer from "multer";
import os from "os";
import fs from "fs";
import { eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { storage } from "../storage/index.js";
import { ACCEPTED_MIME_TYPES } from "@docmanager/shared";

export const uploadRouter: Router = Router();

// We use disk storage to handle large files (e.g., 1GB PDFs) without crashing the server's RAM.
const upload = multer({
  dest: os.tmpdir(),
  limits: {
    // 50 MB limit by default for safety, but can be raised to 1GB if needed
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!ACCEPTED_MIME_TYPES.includes(file.mimetype as any)) {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  },
});

uploadRouter.post("/", upload.single("file"), async (req, res, next) => {
  try {
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }

    // 1. Initial insert into uploads (processing)
    const [uploadRecord] = await db
      .insert(schema.uploads)
      .values({
        name: file.originalname,
        size: file.size,
        status: "processing",
      })
      .returning();

    // The response is sent after the upload completes for a single file since we aren't doing the bulk upload WS push yet.
    try {
      // 2. Upload to storage (Cloudinary)
      const storedObject = await storage.upload({
        filepath: file.path,
        filename: file.originalname,
        mimeType: file.mimetype,
      });

      // 3. Clean up the temporary file from disk
      await fs.promises.unlink(file.path);

      // 4. Insert into documents table
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

      // 5. Update uploads table to complete
      const [completedUpload] = await db
        .update(schema.uploads)
        .set({
          status: "complete",
          documentId: document.id,
        })
        .where(eq(schema.uploads.id, uploadRecord!.id))
        .returning();

      // For single uploads, we just return the completed upload record
      res.status(200).json({
        uploads: [completedUpload],
        background: false,
      });
    } catch (err: any) {
      // On failure, update uploads table to failed
      if (uploadRecord) {
        await db
          .update(schema.uploads)
          .set({
            status: "failed",
            error: err.message,
          })
          .where(eq(schema.uploads.id, uploadRecord.id));
      }

      // Attempt cleanup
      try {
        await fs.promises.unlink(file.path);
      } catch (e) {
        // Ignore unlink errors
      }

      res.status(500).json({ error: "File processing failed", details: err.message });
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
