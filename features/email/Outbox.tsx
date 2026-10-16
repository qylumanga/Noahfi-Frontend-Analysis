"use client";

import { usePolling } from "@/lib/hooks/usePolling";
import { listEmails } from "@/lib/services/notificationsService";
import { EmailPreview } from "@/lib/email/templates";
import { EmptyState, Skeleton } from "@/components/ui/feedback";

export function Outbox() {
  const query = usePolling("emails", listEmails, { intervalMs: 8000 });
  if (query.isLoading) return <Skeleton className="m-6 h-40" />;
  const rows = query.data ?? [];
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-5 py-10">
      <h1 className="text-3xl font-bold tracking-tightest">Email outbox</h1>
      <p className="text-sm text-ink-soft">Simulated mail. The demo verification code is 123456.</p>
      {rows.length === 0 ? <EmptyState title="No emails yet" body="Sign up or pay for an assessment to see messages here." /> : rows.map((message) => <EmailPreview key={message.id} message={message} />)}
    </main>
  );
}
