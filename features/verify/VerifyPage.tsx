"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/Button";
import { FileDropzone } from "@/components/ui/files";
import { Textarea } from "@/components/ui/fields";
import { IntegrityBadge } from "@/components/trust/IntegrityBadge";
import { HashChip } from "@/components/trust/HashChip";
import { verify } from "@/lib/services/provenanceService";
import { sha256File } from "@/lib/trust/sha256";
import type { VerifyResult } from "@/lib/trust/ledger";

export function VerifyPage() {
  const params = useSearchParams();
  const [hash, setHash] = useState(params.get("hash") ?? "");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(value: string) {
    setBusy(true);
    setError("");
    try {
      const outcome = await verify(value);
      setResult(outcome.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="container-page py-16">
        <h1 className="max-w-2xl text-5xl font-bold tracking-tightest">Verify a document</h1>
        <p className="mt-4 max-w-xl text-lg text-ink-soft">Paste a fingerprint or drop the original file. NOAHFI checks it against the Trust Ledger, an append-only record of document integrity.</p>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <FileDropzone label="Drop the original file" busy={busy} onFile={(file) => void sha256File(file).then((digest) => { setHash(digest); return run(digest); })} />
          <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void run(hash); }}>
            <label htmlFor="hash" className="text-sm font-semibold">Or paste a SHA-256 fingerprint</label>
            <Textarea id="hash" value={hash} onChange={(event) => setHash(event.target.value)} />
            <Button type="submit" loading={busy}>Check the ledger</Button>
          </form>
        </div>
        {error && <p className="mt-4 text-sm font-medium text-maple" role="alert">{error}</p>}
        {result && (
          <div className="mt-8 rounded-3xl border border-ink/10 bg-white p-6">
            <IntegrityBadge state={result === "not_found" ? "not_found" : result} />
            <div className="mt-3"><HashChip hash={hash.trim().toLowerCase()} /></div>
            <p className="mt-3 text-sm text-ink-soft">
              {result === "verified" && "This fingerprint matches a block on the NOAHFI Trust Ledger. The file has not changed since it was recorded."}
              {result === "not_found" && "No ledger entry uses this fingerprint."}
              {result === "tampered" && "The fingerprint does not match the recorded block. The document was modified after upload."}
            </p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
