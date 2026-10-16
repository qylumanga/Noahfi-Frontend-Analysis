"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ALL_DEMOS } from "@/features/auth/demoAccounts";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/overlay";
import { login } from "@/lib/services/authService";
import { advanceCase, listCases, listDocuments } from "@/lib/services/casesService";
import { tamperDocument } from "@/lib/services/provenanceService";
import { listEmails } from "@/lib/services/notificationsService";
import { exportDemoData, resetDemoData, setDemoFlags, useDemoFlags } from "@/lib/hooks/useDemoControls";
import { pushToast } from "@/lib/hooks/toast-bus";
import { portalFor } from "@/lib/utils/status";
import { EmailPreview } from "@/lib/email/templates";
import type { EmailMessage, Role } from "@/lib/types";

function caseIdFromPath(path: string): string | null {
  const match = path.match(/\/(?:cases|requests)\/(cl_[^/]+|NF-[^/]+)/);
  return match?.[1] ?? null;
}

export function DemoControlPanel() {
  const pathname = usePathname();
  const router = useRouter();
  const flags = useDemoFlags();
  const [open, setOpen] = useState(false);
  const [emailsOpen, setEmailsOpen] = useState(false);
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [busy, setBusy] = useState(false);
  if (pathname.startsWith("/design-system")) return null;

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
      <button type="button" className="no-print fixed bottom-4 left-4 z-[60] rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-panel" onClick={() => setOpen(true)}>
        Demo controls
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
          <Button type="button" variant="secondary" onClick={() => { resetDemoData(); pushToast({ title: "Demo data reset" }); router.push("/"); setOpen(false); }}>Reset demo data</Button>
          <Button type="button" variant="secondary" onClick={() => void (async () => {
            const id = caseIdFromPath(pathname);
            const cases = await listCases();
            const target = cases.find((item) => item.id === id || item.reference === id) ?? cases[0];
            if (!target) return;
            const next = await advanceCase(target.id);
            pushToast({ title: `Case is now ${next.status.replaceAll("_", " ")}` });
          })()}>Advance this case to next stage</Button>
          <Button type="button" variant="secondary" onClick={() => { setDemoFlags({ forceError: true }); pushToast({ title: "The next request will fail", tone: "warning" }); }}>Force an API error</Button>
          <Button type="button" variant={flags.tamper ? "danger" : "secondary"} onClick={() => void (async () => {
            const id = caseIdFromPath(pathname);
            if (!id) { pushToast({ title: "Open a case, then tamper a document", tone: "warning" }); return; }
            const docs = await listDocuments(id);
            if (!docs[0]) { pushToast({ title: "This case has no documents yet" }); return; }
            await tamperDocument(docs[0].id);
            setDemoFlags({ tamper: true });
            pushToast({ title: "Document marked as modified after upload", tone: "warning" });
          })()}>Tamper a document</Button>
          <Button type="button" variant="secondary" onClick={() => setDemoFlags({ slaOffsetHours: flags.slaOffsetHours + 12 })}>Fast-forward the SLA clock ({flags.slaOffsetHours}h)</Button>
          <Button type="button" variant="ghost" onClick={() => void listEmails().then((rows) => { setEmails(rows); setEmailsOpen(true); })}>Open email outbox</Button>
          <Button type="button" variant="ghost" onClick={() => {
            const blob = new Blob([exportDemoData()], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "noahfi-demo-data.json";
            a.click();
            URL.revokeObjectURL(url);
          }}>Export demo data</Button>
        </div>
      </Drawer>
      <Drawer open={emailsOpen} title="Email outbox" onClose={() => setEmailsOpen(false)}>
        <div className="space-y-4">
          {emails.length === 0 && <p className="text-sm text-ink-soft">No emails yet.</p>}
          {emails.map((message) => <EmailPreview key={message.id} message={message} />)}
        </div>
      </Drawer>
    </>
  );
}
