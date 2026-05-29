import { v2 as cloudinary } from "cloudinary";
import { env } from "../env.js";
import type { StorageAdapter, StoredObject } from "./types.js";

/**
 * Cloudinary adapter. PDFs are uploaded as `resource_type: "raw"` so they are
 * stored and served verbatim (Cloudinary's "image"/"auto" pipeline would try
 * to transform them).
 */
export function createCloudinaryAdapter(): StorageAdapter {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error(
      "STORAGE_PROVIDER=cloudinary but CLOUDINARY_* env vars are missing. See service/.env.example",
    );
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  return {
    upload({ filepath, filename }) {
      return new Promise<StoredObject>((resolve, reject) => {
        cloudinary.uploader.upload(
          filepath,
          {
            resource_type: "raw",
            folder: env.CLOUDINARY_FOLDER,
            use_filename: true,
            unique_filename: true,
            filename_override: filename,
          },
          (error, result) => {
            if (error || !result) return reject(error ?? new Error("Cloudinary upload failed"));
            resolve({ url: result.secure_url, key: result.public_id });
          },
        );
      });
    },

    async remove(key) {
      await cloudinary.uploader.destroy(key, { resource_type: "raw" });
    },
  };
}
