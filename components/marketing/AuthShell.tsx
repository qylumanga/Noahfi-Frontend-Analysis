import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "./Logo";

export function AuthShell({ title, subtitle, children, altHref, altText, aside }: { title: string; subtitle: string; children: ReactNode; altHref: string; altText: string; aside?: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-5 py-12">
      <div className="grid w-full gap-8 lg:grid-cols-[1fr_0.9fr]">
        <div className="w-full">
          <Logo />
          <div className="mt-8 rounded-3xl border border-ink/10 bg-white p-8 shadow-panel">
            <h1 className="text-3xl font-bold tracking-tightest">{title}</h1>
            <p className="mt-2 text-ink-soft">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </div>
          <p className="mt-6 text-sm text-ink-soft">
            <Link href={altHref} className="font-semibold text-ink underline underline-offset-4">{altText}</Link>
          </p>
        </div>
        {aside && <aside className="rounded-3xl border border-ink/10 bg-white p-8">{aside}</aside>}
      </div>
    </main>
  );
}
