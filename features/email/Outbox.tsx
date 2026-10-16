"use client";

import { useState } from "react";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { usePolling } from "@/lib/hooks/usePolling";
import { listEmails } from "@/lib/services/notificationsService";
import { formatWhen } from "@/lib/utils/format";
import type { EmailMessage } from "@/lib/types";

function preview(message: EmailMessage): string {
  const name = message.props.name ?? "there";
  if (message.template === "otp") return `Hello ${name}, your verification code is waiting.`;
  if (message.template === "welcome") return `Hello ${name}, your email is verified.`;
  if (message.template === "documents_received") return `We received ${message.props.fileName ?? "your file"}.`;
  if (message.template === "payment_receipt") return `Payment for ${message.props.reference ?? "your case"} is confirmed.`;
  if (message.template === "under_review") return `${message.props.reference ?? "Your case"} is with an analyst.`;
  if (message.template === "report_ready") return `Your report for ${message.props.reference ?? "your case"} is ready.`;
  if (message.template === "info_requested") return message.props.message ?? "We need a bit more information.";
  return `Hello ${name}`;
}

function body(message: EmailMessage) {
  const name = message.props.name ?? "there";
  return (
    <div className="space-y-4 text-[15px] leading-6 text-[#242424]">
      <p>Hello {name},</p>
      {message.template === "otp" && (
        <>
          <p>Your verification code is <strong className="font-mono text-lg tracking-widest">{message.props.code}</strong>.</p>
          <p>It expires when you leave this demo.</p>
        </>
      )}
      {message.template === "welcome" && <p>Your email is verified. You can sign in and start an assessment. A result is ready within 48 hours of payment.</p>}
      {message.template === "documents_received" && <p>We received {message.props.fileName}. A fingerprint was written to the NOAHFI Trust Ledger.</p>}
      {message.template === "payment_receipt" && <p>Payment for {message.props.reference} is confirmed. USD {message.props.total} was charged, including local tax. Your result is due within 48 hours.</p>}
      {message.template === "under_review" && <p>{message.props.reference} is with an analyst.</p>}
      {message.template === "report_ready" && <p>Your Canadian-equivalent profile for {message.props.reference} is ready to download.</p>}
      {message.template === "info_requested" && <p>{message.props.message}</p>}
      {message.props.href && <p><a className="text-[#0f6cbd] underline" href={message.props.href}>Open in NOAHFI</a></p>}
    </div>
  );
}

export function Outbox() {
  const query = usePolling("emails", listEmails, { intervalMs: 8000 });
  const [picked, setPicked] = useState<string | null>(null);
  if (query.isLoading) return <div className="grid h-screen place-items-center bg-[#f5f5f5]"><Skeleton className="h-40 w-80" /></div>;
  const rows = [...(query.data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const selected = rows.find((item) => item.id === picked) ?? rows[0] ?? null;

  return (
    <div className="flex h-screen min-h-0 flex-col bg-[#f5f5f5] text-[#242424]">
      <header className="flex h-12 items-center gap-3 bg-[#0f6cbd] px-4 text-white">
        <span className="text-lg font-semibold tracking-tight">Outlook</span>
        <span className="text-sm text-white/80">NOAHFI mail</span>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[220px_340px_1fr]">
        <aside className="hidden border-r border-[#edebe9] bg-white md:block">
          <p className="px-4 pb-2 pt-4 text-xs font-semibold uppercase tracking-wide text-[#616161]">Folders</p>
          <div className="mx-2 rounded-md bg-[#cfe4fa] px-3 py-2 text-sm font-semibold">Sent Items</div>
          <p className="px-4 pt-3 text-xs text-[#616161]">{rows.length} message{rows.length === 1 ? "" : "s"}</p>
        </aside>
        <section className="min-h-0 overflow-auto border-r border-[#edebe9] bg-white">
          <div className="sticky top-0 border-b border-[#edebe9] bg-white px-4 py-3">
            <h1 className="text-base font-semibold">Sent Items</h1>
          </div>
          {rows.length === 0 && <div className="p-4"><EmptyState title="No mail yet" body="Sign up, upload, or pay and the message appears here." /></div>}
          <ul>
            {rows.map((message) => {
              const active = selected?.id === message.id;
              return (
                <li key={message.id}>
                  <button type="button" onClick={() => setPicked(message.id)} className={`w-full border-b border-[#f3f2f1] px-4 py-3 text-left ${active ? "bg-[#cfe4fa]" : "hover:bg-[#f5f5f5]"}`}>
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-sm font-semibold">To: {message.to}</span>
                      <span className="shrink-0 text-xs text-[#616161]">{formatWhen(message.createdAt)}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-sm">{message.subject}</span>
                    <span className="mt-0.5 block truncate text-xs text-[#616161]">{preview(message)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
        <article className="min-h-0 overflow-auto bg-white">
          {selected ? (
            <div className="px-8 py-6">
              <h2 className="text-2xl font-semibold">{selected.subject}</h2>
              <div className="mt-4 flex items-start gap-3 border-b border-[#edebe9] pb-4">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#0f6cbd] text-sm font-semibold text-white">N</div>
                <div className="min-w-0 text-sm">
                  <p className="font-semibold">NOAHFI</p>
                  <p className="text-[#616161]">To: {selected.to}</p>
                </div>
                <p className="ml-auto text-xs text-[#616161]">{formatWhen(selected.createdAt)}</p>
              </div>
              <div className="pt-6">{body(selected)}</div>
            </div>
          ) : (
            <div className="grid h-full place-items-center text-sm text-[#616161]">Select a message</div>
          )}
        </article>
      </div>
    </div>
  );
}
