"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const root = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () => [...(root?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? [])];
    focusable()[0]?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !root) return;
      const nodes = focusable();
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open, onClose]);
  return ref;
}

export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const ref = useDialog(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 p-4 sm:items-center" role="presentation" onMouseDown={onClose}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-3xl bg-white p-6 shadow-panel" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <button type="button" className="rounded-lg p-1 hover:bg-ink/5" aria-label="Close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export function Drawer({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const ref = useDialog(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-ink/40" role="presentation" onMouseDown={onClose}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className="h-full w-full max-w-md overflow-auto bg-glacier p-6 shadow-panel" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <button type="button" className="rounded-lg p-1 hover:bg-ink/5" aria-label="Close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
