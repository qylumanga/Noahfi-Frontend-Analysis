import Link from "next/link";
import { Clock, Lock } from "lucide-react";
import { ScoreTranslator } from "./ScoreTranslator";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full bg-lake-light/60 blur-3xl"
      />
      <div className="container-page relative grid items-center gap-14 pb-24 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pt-24">
        <div>
          <h1
            className="rise font-display text-[2.75rem] font-bold leading-[1.02] tracking-tightest sm:text-6xl lg:text-[4.25rem]"
          >
            Your credit history didn&apos;t stop at the border.
          </h1>
          <p
            className="rise mt-6 max-w-xl text-lg leading-relaxed text-ink-soft"
            style={{ animationDelay: "0.1s" }}
          >
            Upload your home-country credit reports. Our analysts turn them into a Canadian-equivalent profile in 48
            hours, ready to share with banks before you land.
          </p>
          <div className="rise mt-9 flex flex-wrap gap-3" style={{ animationDelay: "0.18s" }}>
            <Link href="/signup" className="btn-primary px-6 py-3.5 text-base">
              Start your assessment
            </Link>
            <Link href="/partner/login" className="btn-secondary px-6 py-3.5 text-base">
              Partner portal
            </Link>
          </div>
          <ul className="rise mt-9 flex flex-wrap gap-x-8 gap-y-3 text-[15px] text-ink-soft" style={{ animationDelay: "0.24s" }}>
            <li className="flex items-center gap-2">
              <Clock size={18} className="text-lake" aria-hidden /> 48-hour turnaround
            </li>
            <li className="flex items-center gap-2">
              <Lock size={18} className="text-lake" aria-hidden /> Bank-grade security
            </li>
          </ul>
        </div>

        <ScoreTranslator />
      </div>
    </section>
  );
}
