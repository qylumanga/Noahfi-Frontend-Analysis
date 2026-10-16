import Link from "next/link";
import { Check } from "lucide-react";

const points = ["API access for newcomer onboarding", "Consent-based document sharing", "Streamlined identity verification"];

export function Banks() {
  return (
    <section id="for-banks" className="py-24">
      <div className="container-page">
        <div className="grid gap-10 rounded-[2rem] border border-ink/10 bg-white p-8 sm:p-12 lg:grid-cols-2 lg:gap-14">
          <div className="flex flex-col justify-center">
            <h2 className="text-4xl font-bold leading-tight tracking-tightest">For banking partners</h2>
            <p className="mt-4 max-w-md text-lg text-ink-soft">
              Bring NOAHFI into your newcomer onboarding and review verified profiles before the first appointment.
            </p>
            <ul className="mt-6 space-y-3">
              {points.map((p) => (
                <li key={p} className="flex items-center gap-3">
                  <Check size={18} className="text-lake" aria-hidden /> {p}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link href="/partner/login" className="btn-primary">
                Partner portal login
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl bg-ink text-sm text-white shadow-panel">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="ml-3 font-mono text-xs text-white/50">GET /v1/profiles/&#123;id&#125;</span>
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-white/85">
{`{
  "status": "delivered",
  "identity": "verified",
  "consent": { "granted": true, "scope": "report" },
  "profile": {
    "equivalent_range": "Good",
    "documents_unchanged": true
  }
}`}
            </pre>
            <p className="border-t border-white/10 px-5 py-3 text-xs text-white/50">Sample response shape. Final schema is in the partner docs.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
