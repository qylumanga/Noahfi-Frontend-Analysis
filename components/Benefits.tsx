"use client";

import { useState } from "react";
import { BadgeCheck, Check, Eye, FileSearch, ShieldCheck } from "lucide-react";

const stages = ["Submitted", "Verified", "In review", "Delivered"];

function FastCard() {
  const current = 2; // illustrative
  return (
    <div className="rounded-3xl border border-ink/10 bg-white p-7 md:col-span-2">
      <h3 className="text-2xl font-semibold tracking-tight">Done in 48 hours</h3>
      <p className="mt-2 max-w-md text-ink-soft">
        Your Canadian credit profile is ready within 48 hours of submission, and you can track the case in real time.
      </p>
      <ol className="mt-8 grid grid-cols-4 gap-2" aria-label="Example case progress">
        {stages.map((s, i) => (
          <li key={s}>
            <div className={`h-1.5 rounded-full ${i <= current ? "bg-lake" : "bg-glacier-deep"}`} />
            <div className={`mt-3 text-sm ${i <= current ? "font-semibold text-ink" : "text-ink-faint"}`}>{s}</div>
            {i === current && <div className="mt-0.5 text-xs text-lake-dark">Analyst assigned</div>}
          </li>
        ))}
      </ol>
    </div>
  );
}

const banks = ["Bank A", "Bank B", "Bank C"];

function ConsentCard() {
  const [shared, setShared] = useState<Record<string, boolean>>({ "Bank A": true });
  return (
    <div className="rounded-3xl border border-ink/10 bg-white p-7">
      <h3 className="text-2xl font-semibold tracking-tight">You decide who sees it</h3>
      <p className="mt-2 text-ink-soft">Nothing is shared without your explicit consent. Switch access off at any time.</p>
      <ul className="mt-6 space-y-2">
        {banks.map((b) => {
          const on = !!shared[b];
          return (
            <li key={b} className="flex items-center justify-between rounded-xl bg-glacier px-4 py-3">
              <span className="text-[15px] font-medium">{b}</span>
              <button
                role="switch"
                aria-checked={on}
                aria-label={`Share report with ${b}`}
                onClick={() => setShared((p) => ({ ...p, [b]: !p[b] }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-lake" : "bg-ink/20"}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const small = [
  {
    icon: ShieldCheck,
    title: "Secure and compliant",
    body: "Bank-grade encryption, KYC verification, and blockchain-backed document integrity.",
  },
  {
    icon: BadgeCheck,
    title: "Bank-ready",
    body: "Share your assessment directly with participating Canadian financial institutions.",
  },
  {
    icon: FileSearch,
    title: "Expert analysis",
    body: "Experienced analysts review every case, with a second check for quality.",
  },
  {
    icon: Eye,
    title: "Transparent process",
    body: "See where your case stands from submission to final report.",
  },
];

export function Benefits() {
  return (
    <section id="benefits" className="py-24">
      <div className="container-page">
        <h2 className="max-w-2xl text-4xl font-bold leading-tight tracking-tightest sm:text-5xl">
          Built so newcomers arrive with a head start
        </h2>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <FastCard />
          <ConsentCard />
          {small.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-3xl border border-ink/10 bg-white p-7 md:col-span-1 first:md:col-span-1">
              <Icon size={24} className="text-lake" aria-hidden />
              <h3 className="mt-5 text-xl font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-ink-soft">{body}</p>
            </div>
          ))}
        </div>

        <p className="mt-6 flex items-center gap-2 text-sm text-ink-faint">
          <Check size={14} aria-hidden /> Examples above are for illustration.
        </p>
      </div>
    </section>
  );
}
