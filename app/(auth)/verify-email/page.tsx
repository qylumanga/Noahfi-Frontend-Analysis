import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailScreen } from "@/features/auth/screens";
export const metadata: Metadata = { title: "Verify email", description: "Enter the 6-digit code from your email." };
export default function Page() {
  return <Suspense fallback={<p className="px-6 py-10 text-sm text-ink-soft">Loading…</p>}><VerifyEmailScreen /></Suspense>;
}
