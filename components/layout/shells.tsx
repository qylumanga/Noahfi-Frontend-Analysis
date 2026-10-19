"use client";

import type { ReactNode } from "react";
import type { Role } from "@/lib/types";
import { useSession } from "@/lib/hooks/useSession";
import { AppChrome, type NavItem } from "./AppChrome";
import { AuthGuard } from "./AuthGuard";

export function CustomerShell({ children }: { children: ReactNode }) {
  return (
    <AuthGuard allow={["customer"]} loginPath="/login">
      <AppChrome items={[{ href: "/dashboard", label: "Dashboard" }, { href: "/requests/new", label: "New request" }, { href: "/notifications", label: "Notifications" }]}>{children}</AppChrome>
    </AuthGuard>
  );
}

export function PartnerShell({ children }: { children: ReactNode }) {
  return (
    <AuthGuard allow={["partner"]} loginPath="/partner/login">
      <AppChrome items={[
        { href: "/partner", label: "Dashboard" },
        { href: "/partner/evidence", label: "Upload evidence" },
        { href: "/partner/submissions", label: "Submissions" },
        { href: "/partner/consents", label: "Consent" },
        { href: "/partner/integrations", label: "Integration" },
        { href: "/partner/audit", label: "Audit trail" },
      ]}>{children}</AppChrome>
    </AuthGuard>
  );
}

export function PrintShell({ children }: { children: ReactNode }) {
  const allow: Role[] = ["customer", "analyst", "reviewer", "admin", "compliance"];
  return <AuthGuard allow={allow} loginPath="/login">{children}</AuthGuard>;
}

function internalNav(role: Role | undefined): NavItem[] {
  const queue: NavItem = { href: "/internal", label: "Queue" };
  if (role === "analyst") return [queue, { href: "/internal/analyze", label: "Analyze" }];
  if (role === "reviewer") {
    return [
      queue,
      { href: "/internal/review", label: "Review" },
      { href: "/internal/qa", label: "QA" },
      { href: "/internal/feedback", label: "Feedback" },
    ];
  }
  if (role === "compliance") return [queue, { href: "/internal/audit", label: "Audit logs" }];
  if (role === "admin") {
    return [
      queue,
      { href: "/internal/roles", label: "Roles" },
      { href: "/internal/performance", label: "Performance" },
      { href: "/internal/audit", label: "Audit log" },
    ];
  }
  return [queue];
}

export function InternalShell({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const items = internalNav(session?.user.role);
  const allow: Role[] = ["analyst", "reviewer", "admin", "compliance"];
  return (
    <AuthGuard allow={allow} loginPath="/internal/login">
      <AppChrome dense items={items}>{children}</AppChrome>
    </AuthGuard>
  );
}
