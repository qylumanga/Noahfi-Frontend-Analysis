"use client";

import { useState } from "react";
import type { Document, LedgerEntry } from "@/lib/types";
import type { VerifyResult } from "@/lib/trust/ledger";
import { Drawer } from "@/components/ui/overlay";
import { Button } from "@/components/ui/Button";
import { HashChip } from "./HashChip";
import { IntegrityBadge } from "./IntegrityBadge";
import { ChainOfCustody } from "./ChainOfCustody";
import { getDocumentProvenance } from "@/lib/services/provenanceService";
import { recallFile } from "@/lib/services/documentsService";
import { sha256File } from "@/lib/trust/sha256";

export function ProvenanceViewer({ document, entries, result, open, onClose }: { document: Document; entries: LedgerEntry[]; result: VerifyResult; open: boolean; onClose: () => void }) {
  const [live, setLive] = useState(result);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const upload = entries.find((entry) => entry.action === "upload") ?? entries[0];

  async function reverify() {
    setBusy(true);
    try {
      const file = recallFile(document.id);
      if (file) {
        const hash = await sha256File(file);
        setNote(hash === document.ledgerHash ? "The file bytes match the fingerprint recorded at upload." : "The file bytes do not match the recorded fingerprint.");
      } else {
        setNote("Compared the fingerprint stored for this document with the Trust Ledger.");
      }
      const fresh = await getDocumentProvenance(document.id);
      setLive(fresh.result);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Drawer open={open} title="Document provenance" onClose={onClose}>
      <div className="space-y-4">
        <IntegrityBadge state={document.source === "partner" && live === "verified" ? "verified_source" : live} />
        <p className="text-sm text-ink-soft">{document.fileName}</p>
        <HashChip hash={document.sha256} />
        {upload && (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-ink-soft">Block</dt><dd className="font-semibold tabular-nums">{upload.index}</dd></div>
            <div><dt className="text-ink-soft">Previous block</dt><dd className="font-mono text-xs">{upload.previousHash.slice(0, 10)}…</dd></div>
          </dl>
        )}
        {live === "tampered" && <p className="rounded-2xl bg-red-50 p-3 text-sm text-maple">This document was modified after it was recorded on the NOAHFI Trust Ledger. The fingerprint on file no longer matches the original block.</p>}
        {note && <p className="text-sm text-ink-soft">{note}</p>}
        <ChainOfCustody entries={entries} />
        <Button type="button" variant="secondary" loading={busy} onClick={() => void reverify()}>Re-verify now</Button>
      </div>
    </Drawer>
  );
}
