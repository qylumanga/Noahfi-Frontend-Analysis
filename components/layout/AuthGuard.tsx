"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Role } from "@/lib/types";
import { useSession } from "@/lib/hooks/useSession";
import { Skeleton } from "@/components/ui/feedback";
import { portalFor } from "@/lib/utils/status";
import Link from "next/link";

export function AuthGuard({ allow, loginPath, children }: { allow: Role[]; loginPath: string; children: React.ReactNode }) {
  const { session, ready } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (ready && !session) router.replace(loginPath);
  }, [ready, session, router, loginPath]);
  if (!ready) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-6 py-10" aria-busy="true" aria-live="polite">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (!session) return null;
  if (!allow.includes(session.user.role)) {
    return (
      <main className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="text-3xl font-bold tracking-tightest">You don&apos;t have access</h1>
        <p className="mt-3 text-ink-soft">This area is for a different role. You can go to your own workspace.</p>
        <Link href={portalFor(session.user.role)} className="btn-primary mt-6">Go to your workspace</Link>
      </main>
    );
  }
  return <>{children}</>;
}
