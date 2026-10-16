"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { useSession } from "@/lib/hooks/useSession";
import { portalFor } from "@/lib/utils/status";

const links = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#benefits", label: "Benefits" },
  { href: "/#security", label: "Security" },
  { href: "/#for-banks", label: "For banks" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { session } = useSession();
  const home = session ? portalFor(session.user.role) : "/signup";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-200 ${
        scrolled || open ? "border-b border-ink/10 bg-glacier/85 backdrop-blur-md" : "border-b border-transparent"
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-[15px] text-ink-soft transition-colors hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {session ? (
            <Link href={home} className="btn-primary !py-2.5">Go to dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-4 py-2 text-[15px] font-semibold hover:bg-ink/5">Log in</Link>
              <Link href="/signup" className="btn-primary !py-2.5">Start your assessment</Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="container-page flex flex-col gap-1 pb-5 md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-lg hover:bg-ink/5"
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-3 flex gap-3">
            {session ? (
              <Link href={home} className="btn-primary flex-1">Go to dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="btn-secondary flex-1">Log in</Link>
                <Link href="/signup" className="btn-primary flex-1">Start your assessment</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
