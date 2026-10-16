"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="container-page py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tightest">Something went wrong</h1>
      <p className="mt-3 text-ink-soft">{error.message}</p>
      <button type="button" className="btn-primary mt-6" onClick={reset}>Try again</button>
    </main>
  );
}
