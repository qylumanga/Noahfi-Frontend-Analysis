"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/marketing/Logo";
import { useSession } from "@/lib/hooks/useSession";
import { logout } from "@/lib/services/authService";
import { usePolling } from "@/lib/hooks/usePolling";
import { listNotifications } from "@/lib/services/notificationsService";
import { cn } from "@/lib/utils/cn";

export type NavItem = { href: string; label: string; nested?: boolean };

function isCurrent(pathname: string, href: string): boolean {
  if (href === "/internal" || href === "/partner" || href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppChrome({ items, dense, children }: { items: NavItem[]; dense?: boolean; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session } = useSession();
  const [open, setOpen] = useState(false);
  const notes = usePolling(session ? "notes" : null, listNotifications, { intervalMs: 8000 });
  const mine = (notes.data ?? []).filter((item) => item.userId === session?.user.id);
  const unread = mine.filter((item) => !item.readAt).length;

  return (
    <div className={cn("min-h-screen md:grid md:grid-cols-[220px_1fr]", dense && "text-sm")}>
      <aside className="no-print hidden border-r border-ink/10 bg-white md:block">
        <div className="px-4 py-5"><Logo /></div>
        <nav className="flex flex-col gap-1 px-3" aria-label="Workspace">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className={cn("rounded-xl px-3 py-2 font-semibold", item.nested && "ml-3 text-[13px]", isCurrent(pathname, item.href) ? "bg-ink text-white" : "text-ink-soft hover:bg-glacier")}>{item.label}</Link>
          ))}
        </nav>
      </aside>
      <div>
        <header className="no-print sticky top-0 z-40 border-b border-ink/10 bg-glacier/90 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="md:hidden"><Logo /></div>
            <p className="hidden text-sm text-ink-soft md:block">Result within 48 hours</p>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <button type="button" className="relative rounded-xl p-2 hover:bg-white" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
                  <Bell size={18} />
                  {unread > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-maple" />}
                </button>
                {open && (
                  <div className="absolute right-0 z-20 mt-2 w-80 rounded-2xl border border-ink/10 bg-white p-3 shadow-panel">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">Notifications</p>
                      <Link href="/notifications" className="text-sm font-semibold text-lake-dark" onClick={() => setOpen(false)}>View all</Link>
                    </div>
                    <ul className="mt-2 max-h-72 space-y-2 overflow-auto">
                      {mine.slice(0, 5).map((item) => (
                        <li key={item.id}>
                          <Link href={item.href} className="block rounded-xl px-2 py-2 hover:bg-glacier" onClick={() => setOpen(false)}>
                            <span className="block text-sm font-semibold">{item.title}</span>
                            <span className="block text-xs text-ink-soft">{item.body}</span>
                          </Link>
                        </li>
                      ))}
                      {mine.length === 0 && <li className="px-2 py-3 text-sm text-ink-soft">You are up to date.</li>}
                    </ul>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold leading-tight">{session?.user.name}</p>
                <p className="text-xs capitalize text-ink-soft">{session?.user.role}</p>
              </div>
              <button type="button" className="rounded-xl p-2 hover:bg-white" aria-label="Log out" onClick={() => void logout().then(() => router.push("/"))}><LogOut size={18} /></button>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-3 pb-3 md:hidden" aria-label="Workspace">
            {items.map((item) => (
              <Link key={item.href} href={item.href} className={cn("whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold", isCurrent(pathname, item.href) ? "bg-ink text-white" : "bg-white")}>{item.label}</Link>
            ))}
          </nav>
        </header>
        <div className={cn("px-4 py-6 md:px-8", dense && "py-4")}>{children}</div>
      </div>
    </div>
  );
}
