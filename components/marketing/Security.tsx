"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, FileCheck2 } from "lucide-react";

const items = [
  {
    title: "Encrypted document handling",
    body: "End-to-end encryption for every uploaded document, from your device to review.",
  },
  {
    title: "Multi-factor authentication",
    body: "One-time passcodes and KYC verification protect every sign-in and every share.",
  },
  {
    title: "Blockchain document provenance",
    body: "An immutable audit trail and tamper-proof records show that a document has not changed since you uploaded it.",
  },
  {
    title: "Built for Canadian regulations",
    body: "Designed to meet Canadian financial regulations, with consent recorded for every disclosure.",
  },
];

const ledger = [
  { file: "passport.pdf", hash: "9f2c…a41e", at: "09:12" },
  { file: "credit-report-home.pdf", hash: "c07b…5d92", at: "09:13" },
  { file: "kyc-selfie.jpg", hash: "34ae…b7f0", at: "09:15" },
];

export function Security() {
  const [open, setOpen] = useState(2);

  return (
    <section id="security" className="bg-ink py-24 text-white">
      <div className="container-page grid items-center gap-14 lg:grid-cols-2">
        <div>
          <h2 className="text-4xl font-bold leading-tight tracking-tightest sm:text-5xl">
            Security you can show your bank
          </h2>

          <div className="mt-9 divide-y divide-white/10 border-y border-white/10">
            {items.map((it, i) => {
              const isOpen = open === i;
              return (
                <div key={it.title}>
                  <button
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  >
                    <span className="text-lg font-semibold">{it.title}</span>
                    <ChevronDown size={20} className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden />
                  </button>
                  {isOpen && <p className="max-w-md pb-5 text-white/70">{it.body}</p>}
                </div>
              );
            })}
          </div>

          <Link href="/verify" className="mt-9 inline-flex rounded-xl bg-white px-5 py-3 font-semibold text-ink hover:bg-glacier">
            See how documents are verified
          </Link>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Document ledger</h3>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">Example</span>
          </div>
          <ul className="mt-5 space-y-3">
            {ledger.map((row) => (
              <li key={row.file} className="flex items-center gap-4 rounded-2xl bg-white/[0.06] px-4 py-3.5">
                <FileCheck2 size={20} className="shrink-0 text-lake-light" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-medium">{row.file}</div>
                  <div className="font-mono text-xs text-white/50">sha256 {row.hash}</div>
                </div>
                <div className="text-right text-xs text-white/60">
                  <div className="font-semibold text-lake-light">Unchanged</div>
                  <div className="tabular-nums">{row.at}</div>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-white/55">
            Each file gets a fingerprint when it arrives. If one byte changes later, the fingerprint no longer matches.
          </p>
        </div>
      </div>
    </section>
  );
}
