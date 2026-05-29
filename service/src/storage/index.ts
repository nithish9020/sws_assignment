import { createCloudinaryAdapter } from "./cloudinary.js";
import { env } from "../env.js";

// We only use Cloudinary for this implementation.
export const storage = createCloudinaryAdapter();
