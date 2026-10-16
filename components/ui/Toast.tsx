"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { pushToast, subscribeToasts, type ToastInput } from "@/lib/hooks/toast-bus";

type Item = ToastInput & { id: string };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    return subscribeToasts((toast) => {
      const id = `${Date.now()}-${Math.random()}`;
      setItems((current) => [...current, { ...toast, id }]);
      window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 5000);
    });
  }, []);
  return (
    <>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(100%-2rem,22rem)] flex-col gap-2" aria-live="polite">
        {items.map((item) => (
          <div key={item.id} className="pointer-events-auto rounded-2xl border border-ink/10 bg-white p-4 shadow-panel">
            <p className="text-sm font-semibold">{item.title}</p>
            {item.body && <p className="mt-1 text-sm text-ink-soft">{item.body}</p>}
            {item.href && <Link href={item.href} className="mt-2 inline-block text-sm font-semibold text-lake-dark underline">View</Link>}
          </div>
        ))}
      </div>
    </>
  );
}

export { pushToast };
