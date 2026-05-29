import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { storage } from "../storage/index.js";

export const documentsRouter: Router = Router();

// GET /api/documents
// List all successfully uploaded documents with metadata (name, size, date, URL).
documentsRouter.get("/", async (req, res, next) => {
  try {
    const allDocuments = await db.query.documents.findMany({
      orderBy: [desc(schema.documents.createdAt)],
    });

    res.status(200).json({
      documents: allDocuments,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/documents/:id
// Delete a document from storage and database.
documentsRouter.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the document to get the storageKey
    const document = await db.query.documents.findFirst({
      where: eq(schema.documents.id, id),
    });

    if (!document) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    // 1. Delete from storage (Cloudinary)
    try {
      await storage.remove(document.storageKey);
    } catch (storageError) {
      console.error(`Failed to remove document ${id} from storage:`, storageError);
      // We log the error but proceed to delete the DB record so it's not orphaned in the UI
    }

    // 2. Delete from database
    await db.delete(schema.documents).where(eq(schema.documents.id, id));

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});
