"use client";

import type { ReactNode } from "react";
import type { Role } from "@/lib/types";
import { useSession } from "@/lib/hooks/useSession";
import { can } from "@/lib/utils/status";
import { AppChrome } from "./AppChrome";
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

export function InternalShell({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const role = session?.user.role;
  const items = [{ href: "/internal", label: "Queue" }];
  if (role && can(role, "admin")) items.push({ href: "/internal/admin", label: "Admin" });
  if (role === "compliance") items.push({ href: "/internal/admin", label: "Audit logs" });
  const allow: Role[] = ["analyst", "reviewer", "admin", "compliance"];
  return (
    <AuthGuard allow={allow} loginPath="/internal/login">
      <AppChrome dense items={items}>{children}</AppChrome>
    </AuthGuard>
  );
}
