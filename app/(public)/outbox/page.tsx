import type { Metadata } from "next";
import { Suspense } from "react";
import { Outbox } from "@/features/email/Outbox";

export const metadata: Metadata = { title: "Outbox", description: "Mail sent by the NOAHFI demo." };

export default function Page() {
  return (
    <Suspense fallback={<p className="px-6 py-10 text-sm text-neutral-500">Loading mail…</p>}>
      <Outbox />
    </Suspense>
  );
}
