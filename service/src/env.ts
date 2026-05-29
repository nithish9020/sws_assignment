import { z } from "zod";

/**
 * Validate process.env once at boot. The service refuses to start with a
 * helpful error instead of crashing deep inside a request handler later.
 */
const EnvSchema = z.object({
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default("*"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  STORAGE_PROVIDER: z.enum(["cloudinary", "local"]).default("cloudinary"),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().default("docmanager"),

  LOCAL_UPLOAD_DIR: z.string().default("./uploads"),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
