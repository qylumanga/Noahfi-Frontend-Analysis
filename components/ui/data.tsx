"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("rounded-3xl border border-ink/10 bg-white p-6", className)}>{children}</section>;
}

export function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold tracking-tightest tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-sm text-ink-soft">{hint}</p>}
    </Card>
  );
}

export function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  return <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white" aria-hidden>{initials}</span>;
}

export function Tabs({ tabs, value, onChange }: { tabs: { id: string; label: string }[]; value: string; onChange: (id: string) => void }) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto rounded-2xl bg-glacier p-1">
      {tabs.map((tab) => (
        <button key={tab.id} role="tab" aria-selected={value === tab.id} type="button" onClick={() => onChange(tab.id)} className={cn("whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold", value === tab.id ? "bg-white text-ink shadow-sm" : "text-ink-soft")}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function Table({ columns, rows, empty }: { columns: { key: string; label: string; sortable?: boolean }[]; rows: Record<string, ReactNode>[]; empty?: string }) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const sorted = [...rows];
  if (sort) {
    sorted.sort((a, b) => String(a[`${sort.key}Sort`] ?? a[sort.key] ?? "").localeCompare(String(b[`${sort.key}Sort`] ?? b[sort.key] ?? "")) * (sort.dir === "asc" ? 1 : -1));
  }
  return (
    <div className="overflow-auto rounded-2xl border border-ink/10 bg-white">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="sticky top-0 bg-glacier">
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className="px-3 py-2 font-semibold">
                {column.sortable ? (
                  <button type="button" className="inline-flex items-center gap-1" onClick={() => setSort({ key: column.key, dir: sort?.key === column.key && sort.dir === "asc" ? "desc" : "asc" })}>
                    {column.label}
                    <span className="text-ink-faint" aria-hidden>{sort?.key === column.key ? (sort.dir === "asc" ? "↑" : "↓") : ""}</span>
                  </button>
                ) : column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr><td colSpan={columns.length} className="px-3 py-8 text-center text-ink-soft">{empty ?? "Nothing to show yet."}</td></tr>
          )}
          {sorted.map((row, index) => (
            <tr key={String(row.id ?? index)} className="border-t border-ink/5 hover:bg-glacier/60">
              {columns.map((column) => <td key={column.key} className="px-3 py-2.5 align-middle">{row[column.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (page: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2 text-sm">
      <button type="button" className="rounded-lg border border-ink/15 px-3 py-1.5 disabled:opacity-40" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
      <span className="tabular-nums">Page {page} of {pages}</span>
      <button type="button" className="rounded-lg border border-ink/15 px-3 py-1.5 disabled:opacity-40" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
    </div>
  );
}
