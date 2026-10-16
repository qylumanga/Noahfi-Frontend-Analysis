import type { Metadata } from "next";
import { Suspense } from "react";
import { Outbox } from "@/features/email/Outbox";
export const metadata: Metadata = { title: "Email outbox", description: "Demo email outbox." };
export default function Page() {
  return <Suspense fallback={<p className="px-6 py-10 text-sm text-ink-soft">Loading…</p>}><Outbox /></Suspense>;
}
