const steps = [
  {
    title: "Create your account",
    body: "Sign up with your email and verify it. It takes about a minute.",
    meta: "You",
  },
  {
    title: "Upload your documents",
    body: "Add your passport and your home-country credit reports. Files are encrypted as they upload.",
    meta: "You",
  },
  {
    title: "Verify your identity",
    body: "Complete a secure KYC check with a quick selfie so we know the reports are yours.",
    meta: "You",
  },
  {
    title: "Analyst review",
    body: "An analyst reads your financial history and maps it to Canadian credit factors.",
    meta: "NOAHFI",
  },
  {
    title: "Get your report",
    body: "Receive your Canadian-equivalent credit profile within 48 hours. Share it with a bank when you choose to.",
    meta: "You",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-24">
      <div className="container-page grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="text-4xl font-bold leading-tight tracking-tightest sm:text-5xl">
            Five steps from documents to a bank-ready profile
          </h2>
          <p className="mt-5 max-w-md text-lg text-ink-soft">
            You do three of them. We handle the review, and you can follow your case the whole way.
          </p>
        </div>

        <ol className="relative">
          <span aria-hidden className="absolute bottom-3 left-[19px] top-3 w-px bg-ink/15" />
          {steps.map((s, i) => (
            <li key={s.title} className="relative flex gap-6 pb-10 last:pb-0">
              <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/15 bg-white font-display text-base font-bold tabular-nums">
                {i + 1}
              </span>
              <div className="flex-1 rounded-2xl border border-ink/10 bg-glacier/60 p-6 transition-colors hover:border-lake/40">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-xl font-semibold tracking-tight">{s.title}</h3>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-ink-soft">{s.meta}</span>
                </div>
                <p className="mt-2 max-w-lg text-ink-soft">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
