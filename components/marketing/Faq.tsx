import { Plus } from "lucide-react";

const faqs = [
  {
    q: "Is this the same as a Canadian credit score?",
    a: "No. A Canadian credit score comes from Canadian credit bureaus. NOAHFI gives you a Canadian-equivalent assessment built from your home-country history, which participating institutions can use as a reference.",
  },
  {
    q: "What do I need to upload?",
    a: "Your passport and your home-country credit reports. You also complete a short identity check with a selfie.",
  },
  {
    q: "Who can see my report?",
    a: "Only the institutions you choose. Your data is encrypted and nothing is shared without your explicit consent.",
  },
  {
    q: "How long does it take?",
    a: "Your report is delivered within 48 hours of submission, and you can follow your case status the whole way.",
  },
];

export function Faq() {
  return (
    <section className="pb-24">
      <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <h2 className="text-4xl font-bold leading-tight tracking-tightest">Questions newcomers ask</h2>
        <div className="divide-y divide-ink/10 border-y border-ink/10">
          {faqs.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-lg font-semibold">
                {f.q}
                <Plus size={20} className="shrink-0 transition-transform group-open:rotate-45" aria-hidden />
              </summary>
              <p className="mt-3 max-w-xl text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
