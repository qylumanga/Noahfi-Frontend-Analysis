import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyPage } from "@/features/verify/VerifyPage";
export const metadata: Metadata = { title: "Verify a document", description: "Check a document fingerprint against the NOAHFI Trust Ledger." };
export default function Page() {
  return <Suspense fallback={<p className="px-6 py-10 text-sm text-ink-soft">Loading…</p>}><VerifyPage /></Suspense>;
}
