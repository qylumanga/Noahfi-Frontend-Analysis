import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginScreen } from "@/features/auth/screens";
export const metadata: Metadata = { title: "Partner sign in", description: "Sign in to the NOAHFI partner portal." };
export default function Page() {
  return <Suspense fallback={<p className="px-6 py-10 text-sm text-ink-soft">Loading…</p>}><LoginScreen portal="partner" /></Suspense>;
}
