import type { Document, LedgerEntry, ProvenanceCertificate } from "@/lib/types";
import { mergeById, readBag, upsert } from "@/lib/demo-db";
import { verifyDocumentRecord, verifyHash, type VerifyResult } from "@/lib/trust/ledger";
import { sha256 } from "@/lib/trust/sha256";
import { api, ApiError } from "./api";

export async function listLedger(): Promise<LedgerEntry[]> {
  const seed = await api<LedgerEntry[]>("/api/provenance/ledger");
  return mergeById(seed, "ledger").sort((a, b) => a.index - b.index);
}

export async function getDocumentProvenance(documentId: string): Promise<{ document: Document | null; entries: LedgerEntry[]; result: VerifyResult }> {
  let seedDoc: Document | null = null;
  let seedEntries: LedgerEntry[] = [];
  try {
    const seed = await api<{ document: Document; entries: LedgerEntry[] }>(`/api/provenance/documents/${documentId}`);
    seedDoc = seed.document;
    seedEntries = seed.entries;
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) throw error;
  }
  const document = mergeById(seedDoc ? [seedDoc] : [], "documents").find((item) => item.id === documentId)
    ?? readBag<Document>("documents").upserts.find((item) => item.id === documentId)
    ?? null;
  const ledger = await listLedger();
  const entries = ledger.filter((entry) => entry.documentId === documentId || seedEntries.some((item) => item.id === entry.id));
  const result = document ? verifyDocumentRecord(document, ledger) : "not_found";
  return { document, entries, result };
}

export async function verify(hash: string): Promise<{ result: VerifyResult; entry: LedgerEntry | null }> {
  const normalized = hash.trim().toLowerCase();
  const ledger = await listLedger();
  const local = verifyHash(normalized, ledger);
  if (local === "verified") {
    return { result: "verified", entry: ledger.find((entry) => entry.documentHash === normalized) ?? null };
  }
  const remote = await api<{ result: VerifyResult; entry: LedgerEntry | null }>("/api/provenance/verify", {
    method: "POST",
    body: JSON.stringify({ hash: normalized }),
  });
  return remote;
}

export async function getCertificate(caseId: string): Promise<ProvenanceCertificate> {
  const seed = await api<ProvenanceCertificate>(`/api/provenance/certificates/${caseId}`);
  const local = mergeById([seed], "certificates").find((item) => item.caseId === caseId);
  if (local && local.documentHashes.length) return local;
  const docs = mergeById<Document>([], "documents").filter((doc) => doc.caseId === caseId);
  const ledger = (await listLedger()).filter((entry) => entry.caseId === caseId);
  if (!docs.length && seed.documentHashes.length) return seed;
  const next: ProvenanceCertificate = {
    ...seed,
    documentHashes: docs.length ? docs.map((doc) => ({ fileName: doc.fileName, sha256: doc.ledgerHash })) : seed.documentHashes,
    ledgerFrom: ledger[0]?.index ?? seed.ledgerFrom,
    ledgerTo: ledger[ledger.length - 1]?.index ?? seed.ledgerTo,
  };
  upsert("certificates", next);
  return next;
}

export async function tamperDocument(documentId: string): Promise<Document | null> {
  const current = await getDocumentProvenance(documentId);
  if (!current.document) return null;
  const sha = await sha256(`tampered:${current.document.sha256}`);
  const next = { ...current.document, sha256: sha, tampered: true, updatedAt: new Date().toISOString() };
  upsert("documents", next);
  return next;
}
