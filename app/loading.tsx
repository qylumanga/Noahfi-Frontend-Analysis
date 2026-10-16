export default function Loading() {
  return (
    <main className="container-page py-16" aria-busy="true" aria-live="polite">
      <div className="h-8 w-48 animate-pulse rounded-xl bg-glacier-deep" />
      <div className="mt-4 h-32 animate-pulse rounded-3xl bg-glacier-deep" />
    </main>
  );
}
