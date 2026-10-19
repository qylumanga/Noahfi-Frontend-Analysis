import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Marquee } from "@/components/magicui/marquee";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { Logo } from "./Logo";
import { ScoreTranslator } from "./ScoreTranslator";

const origins = ["India · CIBIL", "Nigeria", "Philippines", "Brazil · Serasa", "Mexico · Buró", "United Kingdom · Experian", "Pakistan", "Colombia"];

export function Hero() {
  return (
    <section className="relative">
      <div className="mx-auto w-full px-3 pb-8 pt-4 sm:px-4 lg:px-5">
        <div className="grid overflow-hidden rounded-[1.75rem] bg-[#001832] text-white shadow-panel lg:grid-cols-[0.92fr_1.08fr]">
          <div className="relative z-10 flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 lg:py-16">
            <Logo light />
            <h1 className="mt-8 max-w-xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Your global credit. Ready for Canada.
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/80 sm:text-base">
              NOAHFI helps you connect with banking and credit opportunities in Canada. Home-country history becomes a profile a bank can trust, handled securely and only with your consent.
            </p>
            <div className="mt-8">
              <Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-[#5AFEFE] px-6 py-3 text-base font-semibold text-[#001832] transition-colors hover:bg-[#3ef0f0]">
                Get started
                <ArrowRight size={18} aria-hidden />
              </Link>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-white/55">Result</dt>
                <dd className="mt-1 text-3xl font-semibold text-[#5AFEFE]">
                  <NumberTicker value={48} className="text-[#5AFEFE]" />
                  <span className="text-lg">h</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-white/55">Assessment</dt>
                <dd className="mt-1 text-3xl font-semibold text-white">
                  <span className="text-lg">$</span>
                  <NumberTicker value={100} className="text-white" />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-white/55">You share</dt>
                <dd className="mt-1 text-3xl font-semibold text-white">
                  <NumberTicker value={1} className="text-white" />
                  <span className="text-lg"> profile</span>
                </dd>
              </div>
            </dl>
          </div>
          <div className="relative min-h-[280px] lg:min-h-[560px]">
            <Image
              src="/New Skyline.png"
              alt="Toronto skyline across the water, with the CN Tower"
              fill
              priority
              quality={95}
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover object-center"
            />
          </div>
        </div>

        <div className="mt-6 grid items-stretch gap-4 lg:mt-8 lg:grid-cols-2 lg:gap-5">
          <figure className="relative min-h-[360px] overflow-hidden rounded-3xl shadow-panel sm:min-h-[480px] lg:min-h-full">
            <Image
              src="/People New.png"
              alt="A group of young adults smiling together outdoors"
              fill
              quality={95}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-center"
            />
          </figure>
          <ScoreTranslator />
        </div>
      </div>

      <div className="border-y border-ink/10 bg-white/80">
        <p className="container-page pt-4 text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">Home-country reports the desk already reads</p>
        <Marquee pauseOnHover className="[--duration:36s]">
          {origins.map((origin) => (
            <span key={origin} className="mx-3 inline-flex items-center gap-3 rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink">
              <span className="h-1.5 w-1.5 rounded-full bg-teal" aria-hidden />
              {origin}
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
