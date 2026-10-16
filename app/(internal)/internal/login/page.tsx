import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginScreen } from "@/features/auth/screens";
export const metadata: Metadata = { title: "Staff sign in", description: "Sign in to the NOAHFI operations workspace." };
export default function Page() {
  return <Suspense fallback={<p className="px-6 py-10 text-sm text-ink-soft">Loading…</p>}><LoginScreen portal="internal" /></Suspense>;
}
