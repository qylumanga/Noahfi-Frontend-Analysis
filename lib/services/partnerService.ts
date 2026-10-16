import type { AuditLogEntry, Case, ConsentGrant, Document, Integration, Partner, PartnerUser, User } from "@/lib/types";
import { mergeById, upsert } from "@/lib/demo-db";
import { api } from "./api";
import { uploadCaseDocument } from "./documentsService";

export async function getPartner(): Promise<{ partner: Partner; partnerUser: PartnerUser; user: User }> {
  return api("/api/partners/me");
}

export async function listPartnerCases(): Promise<Case[]> {
  const seed = await api<Case[]>("/api/partners/cases");
  return mergeById(seed, "cases").filter((item) => item.status !== "draft");
}

export async function listConsents(): Promise<ConsentGrant[]> {
  const seed = await api<ConsentGrant[]>("/api/partners/consents");
  return mergeById(seed, "consents");
}

export async function saveConsents(grants: ConsentGrant[]): Promise<ConsentGrant[]> {
  const data = await api<{ grants: ConsentGrant[] }>("/api/partners/consents", { method: "PUT", body: JSON.stringify({ grants }) });
  data.grants.forEach((grant) => upsert("consents", grant));
  return data.grants;
}

export async function listIntegrations(): Promise<Integration[]> {
  return api("/api/partners/integrations");
}

export async function uploadEvidence(caseId: string, file: File, uploadedById: string, sourceLabel: string): Promise<Document> {
  const document = await uploadCaseDocument(caseId, file, "partner_evidence", uploadedById, "partner", sourceLabel);
  const entry: AuditLogEntry = {
    id: `cl_aud_${document.id}`,
    actorId: uploadedById,
    actorName: sourceLabel,
    actorRole: "partner",
    action: "evidence.uploaded",
    entityType: "document",
    entityId: document.id,
    detail: `Uploaded ${document.fileName} for case ${caseId}.`,
    at: document.createdAt,
    createdAt: document.createdAt,
    updatedAt: document.createdAt,
  };
  upsert("audit", entry);
  return document;
}
