import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgotScreen } from "@/features/auth/screens";
export const metadata: Metadata = { title: "Forgot password", description: "Reset a NOAHFI password." };
export default function Page() {
  return <Suspense fallback={<p className="px-6 py-10 text-sm text-ink-soft">Loading…</p>}><ForgotScreen /></Suspense>;
}
