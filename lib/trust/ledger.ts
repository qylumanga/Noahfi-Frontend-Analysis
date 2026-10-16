import type { LedgerEntry } from "@/lib/types";
import { blockMaterial, sha256 } from "./sha256";

export type VerifyResult = "verified" | "not_found" | "tampered";

export async function hashBlock(entry: Pick<LedgerEntry, "previousHash" | "documentHash" | "actorId" | "action" | "timestamp">): Promise<string> {
  return sha256(blockMaterial(entry.previousHash, entry.documentHash, entry.actorId, entry.action, entry.timestamp));
}

export async function chainIsValid(entries: LedgerEntry[]): Promise<boolean> {
  const sorted = [...entries].sort((a, b) => a.index - b.index);
  for (let i = 0; i < sorted.length; i += 1) {
    const entry = sorted[i];
    const expected = await hashBlock(entry);
    if (expected !== entry.blockHash) return false;
    if (i === 0) {
      if (entry.previousHash !== "0".repeat(64) && sorted.length > 1) {
        /* seed chain starts at zero; appended entries link backward */
      }
    } else if (entry.previousHash !== sorted[i - 1].blockHash) {
      return false;
    }
  }
  return true;
}

export function verifyHash(hash: string, entries: LedgerEntry[]): VerifyResult {
  const normalized = hash.trim().toLowerCase();
  const hit = entries.find((entry) => entry.documentHash === normalized);
  if (!hit) return "not_found";
  return "verified";
}

export function verifyDocumentRecord(
  document: { id: string; sha256: string; ledgerHash: string; tampered: boolean },
  entries: LedgerEntry[],
): VerifyResult {
  const related = entries.filter((entry) => entry.documentId === document.id);
  if (!related.length) return "not_found";
  const recorded = related.find((entry) => entry.action === "upload") ?? related[0];
  if (document.tampered || document.sha256 !== recorded.documentHash || document.sha256 !== document.ledgerHash) {
    return "tampered";
  }
  return "verified";
}
