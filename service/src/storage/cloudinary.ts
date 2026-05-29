import { v2 as cloudinary } from "cloudinary";
import { env } from "../env.js";
import type { StorageAdapter, StoredObject } from "./types.js";

/**
 * Cloudinary adapter. PDFs are uploaded as `resource_type: "raw"` so they are
 * stored and served verbatim (Cloudinary's "image"/"auto" pipeline would try
 * to transform them).
 *
 * Sets CLOUDINARY_URL env var as the most reliable way for the SDK to pick up
 * credentials across all runtimes (Node, Bun). Falls back to explicit config.
 */
export function createCloudinaryAdapter(): StorageAdapter {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error(
      "STORAGE_PROVIDER=cloudinary but CLOUDINARY_* env vars are missing. See service/.env.example",
    );
  }

  // Set the CLOUDINARY_URL env var — the SDK reads this natively and it's the
  // most reliable way to ensure credentials are picked up (avoids the
  // "upload preset must be specified" error under Bun).
  process.env.CLOUDINARY_URL = `cloudinary://${env.CLOUDINARY_API_KEY}:${env.CLOUDINARY_API_SECRET}@${env.CLOUDINARY_CLOUD_NAME}`;

  // Also call config() explicitly as a belt-and-suspenders approach
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  // Verify credentials are loaded
  const cfg = cloudinary.config();
  console.log(`☁️  Cloudinary configured: cloud=${cfg.cloud_name}, key=${cfg.api_key ? "✓" : "✗"}, secret=${cfg.api_secret ? "✓" : "✗"}`);

  return {
    async upload({ filepath, filename }): Promise<StoredObject> {
      const result = await cloudinary.uploader.upload(filepath, {
        resource_type: "raw",
        type: "upload",
        folder: env.CLOUDINARY_FOLDER,
        use_filename: true,
        unique_filename: true,
        filename_override: filename,
      });

      return { url: result.secure_url, key: result.public_id };
    },

    async remove(key) {
      await cloudinary.uploader.destroy(key, { resource_type: "raw" });
    },
  };
}
