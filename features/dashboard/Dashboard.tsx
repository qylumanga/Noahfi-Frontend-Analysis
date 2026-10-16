"use client";

import Link from "next/link";
import { KpiCard } from "@/components/ui/data";
import { Alert, EmptyState, Skeleton } from "@/components/ui/feedback";
import { StatusTag } from "@/components/ui/feedback";
import { StatusTracker } from "@/features/cases/StatusTracker";
import { SlaBadge } from "@/components/ui/SlaBadge";
import { usePolling } from "@/lib/hooks/usePolling";
import { useSession } from "@/lib/hooks/useSession";
import { listCases } from "@/lib/services/casesService";

export function Dashboard() {
  const { session } = useSession();
  const query = usePolling(session ? "cases" : null, listCases, { intervalMs: 8000 });
  const cases = (query.data ?? []).filter((item) => item.userId === session?.user.id);
  const active = cases.filter((item) => !["ready_to_download", "rejected", "draft"].includes(item.status));
  const pending = cases.filter((item) => ["draft", "info_requested", "account_verified", "documents_uploaded", "identity_verified"].includes(item.status));
  const done = cases.filter((item) => item.status === "ready_to_download");

  if (query.isLoading) return <div className="space-y-4" aria-busy="true"><Skeleton className="h-24" /><Skeleton className="h-40" /></div>;
  if (query.error) return <Alert tone="error" title="Could not load your cases">{query.error.message} <button className="font-semibold underline" type="button" onClick={() => void query.mutate()}>Retry</button></Alert>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tightest">Your assessments</h1>
          <p className="mt-1 text-ink-soft">Result within 48 hours of payment.</p>
        </div>
        <Link href="/requests/new" className="btn-primary">Start a new request</Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Active request" value={String(active.length)} />
        <KpiCard label="Pending action" value={String(pending.length)} hint="Steps still waiting on you" />
        <KpiCard label="Estimated turnaround" value="48h" hint="After payment" />
        <KpiCard label="Completed reports" value={String(done.length)} />
      </div>
      {cases.length === 0 ? (
        <EmptyState title="No requests yet" body="Start an assessment when your passport and home-country credit report are ready." action={<Link href="/requests/new" className="btn-primary">Start a new request</Link>} />
      ) : (
        <ul className="space-y-4">
          {cases.map((item) => (
            <li key={item.id} className="rounded-3xl border border-ink/10 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Link href={`/cases/${item.id}`} className="font-display text-xl font-semibold">{item.reference}</Link>
                  <p className="text-sm text-ink-soft">{item.countryName} → {item.destinationCity}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusTag status={item.status} />
                  <SlaBadge due={item.slaDueAt} status={item.status} />
                </div>
              </div>
              <div className="mt-4"><StatusTracker status={item.status} /></div>
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
                {item.status === "ready_to_download" && <Link href={`/cases/${item.id}`} className="text-lake-dark underline">View result</Link>}
                {["identity_verified", "documents_uploaded", "account_verified"].includes(item.status) && <Link href={`/requests/${item.id}/payment`} className="text-lake-dark underline">Continue to payment</Link>}
                {item.status === "draft" && <Link href="/requests/new" className="text-lake-dark underline">Resume draft</Link>}
                {item.status === "info_requested" && <Link href={`/cases/${item.id}`} className="text-lake-dark underline">See what we need</Link>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
