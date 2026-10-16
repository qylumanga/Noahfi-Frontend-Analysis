import type { Document, DocumentType } from "@/lib/types";
import { tombstone } from "@/lib/demo-db";
import { sha256File } from "@/lib/trust/sha256";
import { api } from "./api";
import { addDocument } from "./casesService";

const files = new Map<string, File>();

export function rememberFile(documentId: string, file: File): void {
  files.set(documentId, file);
}

export function recallFile(documentId: string): File | undefined {
  return files.get(documentId);
}

export function removeDocument(documentId: string): void {
  files.delete(documentId);
  tombstone("documents", documentId);
}

export function inspectFile(file: File): { readable: boolean; pagesDetected: boolean } {
  const readable = file.size > 20_000 && (file.type.includes("pdf") || file.type.startsWith("image/") || file.name.endsWith(".pdf"));
  const pagesDetected = file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf") || file.type.startsWith("image/");
  return { readable, pagesDetected };
}

export async function uploadFile(file: File): Promise<{ url: string; pathname: string; size: number; contentType: string; sha256: string }> {
  const sha = await sha256File(file);
  return api("/api/uploads", {
    method: "POST",
    body: JSON.stringify({ fileName: file.name, size: file.size, contentType: file.type || "application/octet-stream", sha256: sha }),
  });
}

export async function uploadCaseDocument(caseId: string, file: File, type: DocumentType, uploadedById: string, source: Document["source"] = "customer", sourceLabel?: string): Promise<Document> {
  const uploaded = await uploadFile(file);
  const quality = inspectFile(file);
  const document = await addDocument(caseId, {
    type,
    fileName: file.name,
    sizeBytes: uploaded.size,
    contentType: uploaded.contentType,
    sha256: uploaded.sha256,
    readable: quality.readable,
    pagesDetected: quality.pagesDetected,
    source,
    sourceLabel: sourceLabel ?? null,
    uploadedById,
  });
  rememberFile(document.id, file);
  return document;
}
