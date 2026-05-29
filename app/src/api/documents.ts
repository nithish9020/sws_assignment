import { apiClient } from "./client";

export interface UploadResult {
  uploads: Array<{
    id: string;
    name: string;
    size: number;
    status: string;
    documentId: string | null;
    error: string | null;
    createdAt: string;
  }>;
  background: boolean;
}

export interface DocumentItem {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  url: string;
  storageKey: string;
  createdAt: string;
}

export interface DocumentListResponse {
  documents: DocumentItem[];
}

/**
 * Upload a single PDF file to the backend.
 * Uses FormData with multipart/form-data.
 */
export async function uploadFile(
  fileUri: string,
  fileName: string,
  mimeType: string,
  onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", {
    uri: fileUri,
    name: fileName,
    type: mimeType,
  } as any);

  const response = await apiClient.post<UploadResult>("/api/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });

  return response.data;
}

/**
 * Fetch all uploaded documents from the backend.
 */
export async function fetchDocuments(): Promise<DocumentItem[]> {
  const response = await apiClient.get<DocumentListResponse>("/api/documents");
  return response.data.documents;
}

/**
 * Delete a document by ID.
 */
export async function deleteDocument(id: string): Promise<void> {
  await apiClient.delete(`/api/documents/${id}`);
}

/**
 * Get the processing status of a specific upload.
 */
export async function getUploadStatus(id: string) {
  const response = await apiClient.get(`/api/upload/${id}/status`);
  return response.data;
}
