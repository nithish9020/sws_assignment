/**
 * Storage abstraction. The rest of the service talks to this interface only,
 * so swapping Cloudinary for S3 / Supabase / local disk is a one-file change.
 */
export interface StoredObject {
  /** Publicly accessible URL to view/download the file. */
  url: string;
  /** Provider-specific identifier used later for deletion. */
  key: string;
}

export interface StorageAdapter {
  /** Persist a file buffer and return its public URL + deletion key. */
  upload(input: {
    buffer: Buffer;
    filename: string;
    mimeType: string;
  }): Promise<StoredObject>;

  /** Remove a previously stored file by its key. Must not throw if missing. */
  remove(key: string): Promise<void>;
}
