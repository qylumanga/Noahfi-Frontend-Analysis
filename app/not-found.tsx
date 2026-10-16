import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-page py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tightest">Page not found</h1>
      <p className="mt-3 text-ink-soft">That link does not match a NOAHFI page.</p>
      <Link href="/" className="btn-primary mt-6">Back to home</Link>
    </main>
  );
}
