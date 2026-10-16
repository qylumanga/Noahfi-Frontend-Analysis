"use client";

import { Check, Copy, Upload } from "lucide-react";
import { useState, type DragEvent } from "react";
import { cn } from "@/lib/utils/cn";
import { formatBytes, truncateHash } from "@/lib/utils/format";
import type { Document } from "@/lib/types";
import { IntegrityBadge } from "@/components/trust/IntegrityBadge";

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 rounded-lg border border-ink/15 px-2 py-1 text-xs font-semibold"
      onClick={() => {
        void navigator.clipboard.writeText(value);
        setDone(true);
        window.setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? <Check size={12} aria-hidden /> : <Copy size={12} aria-hidden />}
      {done ? "Copied" : label}
    </button>
  );
}

export function FileDropzone({ label, onFile, busy }: { label: string; onFile: (file: File) => void; busy?: boolean }) {
  function drop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) onFile(file);
  }
  return (
    <label onDragOver={(event) => event.preventDefault()} onDrop={drop} className={cn("flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-ink/20 bg-glacier/50 px-4 py-8 text-center", busy && "opacity-60")}>
      <Upload size={20} className="text-lake" aria-hidden />
      <span className="mt-2 text-sm font-semibold">{label}</span>
      <span className="mt-1 text-xs text-ink-soft">Drag a file here, or browse. PDF or image.</span>
      <input type="file" className="sr-only" accept="application/pdf,image/*" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) onFile(file); event.target.value = ""; }} />
    </label>
  );
}

export function DocumentCard({ document, onRemove, integrity }: { document: Pick<Document, "fileName" | "sizeBytes" | "sha256" | "readable" | "pagesDetected" | "sourceLabel" | "type">; onRemove?: () => void; integrity?: "verified" | "pending" | "not_found" | "tampered" | "verified_source" }) {
  return (
    <article className="rounded-2xl border border-ink/10 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{document.fileName}</h3>
          <p className="text-sm text-ink-soft">{document.type.replaceAll("_", " ")} · {formatBytes(document.sizeBytes)}</p>
        </div>
        {integrity && <IntegrityBadge state={integrity} />}
      </div>
      <p className="mt-2 font-mono text-xs text-ink-soft">sha256 {truncateHash(document.sha256, 8)}</p>
      <ul className="mt-3 flex flex-wrap gap-2 text-xs">
        <li className="rounded-full bg-glacier px-2 py-1">{document.readable ? "Readable" : "Hard to read"}</li>
        <li className="rounded-full bg-glacier px-2 py-1">{document.pagesDetected ? "All pages detected" : "Pages unclear"}</li>
        {document.sourceLabel && <li className="rounded-full bg-lake-light px-2 py-1 text-lake-dark">Verified source: {document.sourceLabel}</li>}
      </ul>
      {onRemove && <button type="button" className="mt-3 text-sm font-semibold text-maple" onClick={onRemove}>Remove</button>}
    </article>
  );
}
