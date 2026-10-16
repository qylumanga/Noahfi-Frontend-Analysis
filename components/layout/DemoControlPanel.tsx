"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { ALL_DEMOS } from "@/features/auth/demoAccounts";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/overlay";
import { login } from "@/lib/services/authService";
import { listDocuments } from "@/lib/services/casesService";
import { tamperDocument } from "@/lib/services/provenanceService";
import { setDemoFlags, useDemoFlags } from "@/lib/hooks/useDemoControls";
import { pushToast } from "@/lib/hooks/toast-bus";
import { portalFor } from "@/lib/utils/status";
import type { Role } from "@/lib/types";

function caseIdFromPath(path: string): string | null {
  const match = path.match(/\/(?:cases|requests)\/(cl_[^/]+|NF-[^/]+)/);
  return match?.[1] ?? null;
}

export function DemoControlPanel() {
  const pathname = usePathname();
  const router = useRouter();
  const flags = useDemoFlags();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  if (pathname.startsWith("/design-system") || pathname === "/outbox") return null;

  async function persona(email: string, password: string) {
    setBusy(true);
    try {
      const session = await login({ email, password });
      router.push(portalFor(session.user.role as Role));
      setOpen(false);
    } catch (error) {
      pushToast({ title: error instanceof Error ? error.message : "Could not switch persona", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" aria-label="Demo controls" className="no-print fixed bottom-3 left-3 z-[60] flex h-7 w-7 items-center justify-center rounded-full bg-white text-neutral-400 shadow-sm ring-1 ring-black/10" onClick={() => setOpen(true)}>
        <Plus size={14} strokeWidth={1.75} />
      </button>
      <Drawer open={open} title="Demo controls" onClose={() => setOpen(false)}>
        <div className="space-y-5 text-sm">
          <section>
            <h3 className="font-semibold">Switch persona</h3>
            <ul className="mt-2 space-y-2">
              {ALL_DEMOS.map((account) => (
                <li key={account.email}>
                  <button type="button" disabled={busy} className="w-full rounded-xl bg-white px-3 py-2 text-left" onClick={() => void persona(account.email, account.password)}>
                    <span className="block font-semibold">{account.name}</span>
                    <span className="text-xs text-ink-soft">{account.role}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section className="space-y-2">
            <h3 className="font-semibold">Force an API error</h3>
            <p className="text-ink-soft">The next request fails once, so you can see an error message. It turns itself off after that.</p>
            <Button type="button" variant="secondary" onClick={() => { setDemoFlags({ forceError: true }); pushToast({ title: "The next request will fail", tone: "warning" }); }}>Arm the next request</Button>
          </section>
          <section className="space-y-2">
            <h3 className="font-semibold">Tamper a document</h3>
            <p className="text-ink-soft">Open a case first. This changes the stored fingerprint of its first file. The ledger keeps the original hash, so checking the real file still passes, and the case shows the file as modified after upload.</p>
            <Button type="button" variant={flags.tamper ? "danger" : "secondary"} onClick={() => void (async () => {
              const id = caseIdFromPath(pathname);
              if (!id) { pushToast({ title: "Open a case, then tamper a document", tone: "warning" }); return; }
              const docs = await listDocuments(id);
              if (!docs[0]) { pushToast({ title: "This case has no documents yet" }); return; }
              await tamperDocument(docs[0].id);
              setDemoFlags({ tamper: true });
              pushToast({ title: "Document marked as modified after upload", tone: "warning" });
            })()}>Tamper the open case</Button>
          </section>
          <section className="space-y-2">
            <h3 className="font-semibold">Fast-forward the SLA clock ({flags.slaOffsetHours}h)</h3>
            <p className="text-ink-soft">Adds 12 hours to the clock the queue uses for the 48-hour countdown. The case itself does not change. 0h means the clock matches real time.</p>
            <Button type="button" variant="secondary" onClick={() => setDemoFlags({ slaOffsetHours: flags.slaOffsetHours + 12 })}>Add 12 hours</Button>
          </section>
        </div>
      </Drawer>
    </>
  );
}
