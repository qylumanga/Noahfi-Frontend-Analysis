import type { Metadata } from "next";
import { Suspense } from "react";
import { SignupScreen } from "@/features/auth/screens";
export const metadata: Metadata = { title: "Start your assessment", description: "Create a NOAHFI account." };
export default function Page() {
  return <Suspense fallback={<p className="px-6 py-10 text-sm text-ink-soft">Loading…</p>}><SignupScreen /></Suspense>;
}
