import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const flow = [
  { title: "Client app", body: "Encrypts documents on the device before upload." },
  { title: "Identity and consent", body: "OTP, KYC selfie check, and recorded consent for every share." },
  { title: "Document vault", body: "Encrypted storage with a fingerprint written to the ledger on arrival." },
  { title: "Analyst workspace", body: "Review, quality check, and report generation." },
  { title: "Partner API", body: "Consent-gated access for participating institutions." },
];

export const metadata = { title: "System architecture | NOAHFI" };

export default function ArchitecturePage() {
  return (
    <>
      <Navbar />
      <main className="container-page py-20">
        <h1 className="max-w-2xl text-5xl font-bold tracking-tightest">How NOAHFI protects your documents</h1>
        <p className="mt-4 max-w-xl text-lg text-ink-soft">A simplified view of the path a document takes from your device to a partner bank.</p>
        <ol className="mt-12 grid gap-4 md:grid-cols-5">
          {flow.map((f, i) => (
            <li key={f.title} className="relative rounded-2xl border border-ink/10 bg-white p-5">
              <h2 className="text-lg font-semibold tracking-tight">{f.title}</h2>
              <p className="mt-2 text-sm text-ink-soft">{f.body}</p>
              {i < flow.length - 1 && (
                <ArrowRight aria-hidden size={18} className="absolute -right-3.5 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-glacier text-lake md:block" />
              )}
            </li>
          ))}
        </ol>
        <Link href="/" className="btn-secondary mt-12">
          Back to home
        </Link>
      </main>
      <Footer />
    </>
  );
}
