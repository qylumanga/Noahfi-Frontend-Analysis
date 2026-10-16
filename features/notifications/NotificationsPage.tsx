"use client";

import Link from "next/link";
import { Alert, EmptyState, Skeleton } from "@/components/ui/feedback";
import { usePolling } from "@/lib/hooks/usePolling";
import { useSession } from "@/lib/hooks/useSession";
import { listNotifications, markRead } from "@/lib/services/notificationsService";
import { formatWhen } from "@/lib/utils/format";

export function NotificationsPage() {
  const { session } = useSession();
  const query = usePolling(session ? "notifications" : null, listNotifications, { intervalMs: 8000 });
  const mine = (query.data ?? []).filter((item) => item.userId === session?.user.id);
  if (query.isLoading) return <Skeleton className="h-40" />;
  if (query.error) return <Alert tone="error" title="Could not load notifications"><button type="button" className="underline" onClick={() => void query.mutate()}>Retry</button></Alert>;
  if (!mine.length) return <EmptyState title="No messages yet" body="Payment, review, and report updates will show up here." action={<Link className="btn-primary" href="/dashboard">Back to dashboard</Link>} />;
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tightest">Notifications</h1>
      <ul className="mt-6 space-y-3">
        {mine.map((item) => (
          <li key={item.id} className={`rounded-2xl border border-ink/10 bg-white p-4 ${item.readAt ? "opacity-70" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-ink-soft">{item.body}</p>
                <p className="mt-1 text-xs text-ink-soft">{formatWhen(item.createdAt)} {item.readAt ? "· Read" : "· Unread"}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Link href={item.href} className="text-sm font-semibold text-lake-dark underline">Open</Link>
                {!item.readAt && <button type="button" className="text-sm font-semibold" onClick={() => void markRead(item.id, item).then(() => query.mutate())}>Mark as read</button>}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
