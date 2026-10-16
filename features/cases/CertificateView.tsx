"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QrMark } from "@/components/trust/QrMark";
import { HashChip } from "@/components/trust/HashChip";
import { getCertificate } from "@/lib/services/provenanceService";
import type { ProvenanceCertificate } from "@/lib/types";
import { formatWhen } from "@/lib/utils/format";

export function CertificateView({ caseId }: { caseId: string }) {
  const [cert, setCert] = useState<ProvenanceCertificate | null>(null);
  useEffect(() => { void getCertificate(caseId).then(setCert).catch(() => setCert(null)); }, [caseId]);
  if (!cert) return <p className="text-sm text-ink-soft">Preparing the certificate…</p>;
  const seed = cert.documentHashes.map((item) => item.sha256).join("");
  return (
    <article className="mx-auto max-w-3xl rounded-3xl border border-ink/10 bg-white p-8">
      <p className="text-sm font-semibold text-lake-dark">NOAHFI Trust Ledger</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tightest">Verification certificate</h1>
      <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-ink-soft">Certificate ID</dt><dd className="font-semibold">{cert.id}</dd></div>
        <div><dt className="text-ink-soft">Case</dt><dd className="font-semibold">{cert.reference}</dd></div>
        <div><dt className="text-ink-soft">Ledger range</dt><dd className="font-semibold tabular-nums">Blocks {cert.ledgerFrom}–{cert.ledgerTo}</dd></div>
        <div><dt className="text-ink-soft">Issued</dt><dd className="font-semibold">{formatWhen(cert.issuedAt)}</dd></div>
      </dl>
      <div className="mt-6 flex items-start gap-6">
        <QrMark seed={seed || cert.id} />
        <ul className="space-y-2 text-sm">
          {cert.documentHashes.map((item) => <li key={item.sha256}>{item.fileName}<div className="mt-1"><HashChip hash={item.sha256} /></div></li>)}
        </ul>
      </div>
      <p className="mt-6 text-sm text-ink-soft">Anyone can confirm these fingerprints on the public verify page.</p>
      <div className="no-print mt-6 flex gap-3">
        <Link className="btn-secondary" href={`/verify?hash=${encodeURIComponent(cert.documentHashes[0]?.sha256 ?? "")}`}>Verify this certificate</Link>
        <button type="button" className="btn-primary" onClick={() => window.print()}>Print</button>
      </div>
    </article>
  );
}
