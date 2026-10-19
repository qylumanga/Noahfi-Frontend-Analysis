"use client";

import { useMemo, useState } from "react";

type Source = {
  id: string;
  country: string;
  bureau: string;
  min: number;
  max: number;
  start: number;
};

const sources: Source[] = [
  { id: "in", country: "India", bureau: "CIBIL", min: 300, max: 900, start: 760 },
  { id: "uk", country: "United Kingdom", bureau: "Experian", min: 0, max: 999, start: 880 },
  { id: "br", country: "Brazil", bureau: "Serasa", min: 0, max: 1000, start: 720 },
  { id: "mx", country: "Mexico", bureau: "Buró de Crédito", min: 400, max: 850, start: 700 },
  { id: "us", country: "United States", bureau: "FICO", min: 300, max: 850, start: 740 },
];

const CA_MIN = 300;
const CA_MAX = 900;

const bands = [
  { upTo: 559, label: "Poor", note: "Expect limited approvals at first." },
  { upTo: 659, label: "Fair", note: "Some products open, with higher rates." },
  { upTo: 724, label: "Good", note: "Most mainstream cards and loans are in reach." },
  { upTo: 759, label: "Very good", note: "Competitive rates on most products." },
  { upTo: 900, label: "Excellent", note: "Best available rates on most products." },
];

function bandFor(score: number) {
  return bands.find((b) => score <= b.upTo) ?? bands[bands.length - 1];
}

// Half-circle gauge geometry
const R = 88;
const ARC = Math.PI * R;

export function ScoreTranslator() {
  const [sourceId, setSourceId] = useState(sources[0].id);
  const source = sources.find((s) => s.id === sourceId)!;
  const [value, setValue] = useState(source.start);

  const { estimate, pct, band } = useMemo(() => {
    const p = (value - source.min) / (source.max - source.min);
    const est = Math.round(CA_MIN + p * (CA_MAX - CA_MIN));
    return { estimate: est, pct: (est - CA_MIN) / (CA_MAX - CA_MIN), band: bandFor(est) };
  }, [value, source]);

  function pick(id: string) {
    const next = sources.find((s) => s.id === id)!;
    setSourceId(id);
    setValue(next.start);
  }

  return (
    <section
      aria-labelledby="translator-title"
      className="rounded-3xl border border-ink/10 bg-white p-6 shadow-panel sm:p-8"
      style={{ animationDelay: "0.25s" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="translator-title" className="text-lg font-semibold tracking-tight">
            See how a score can translate
          </h2>
          <p className="mt-1 text-sm text-ink-soft">Pick a country and drag to your score.</p>
        </div>
        <span className="shrink-0 rounded-full bg-glacier px-3 py-1 text-xs font-medium text-ink-soft">
          Illustrative
        </span>
      </div>

      <div role="radiogroup" aria-label="Home country" className="mt-5 flex flex-wrap gap-2">
        {sources.map((s) => (
          <button
            key={s.id}
            role="radio"
            aria-checked={s.id === sourceId}
            onClick={() => pick(s.id)}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
              s.id === sourceId
                ? "border-ink bg-ink text-white"
                : "border-ink/15 bg-white text-ink-soft hover:border-ink/40 hover:text-ink"
            }`}
          >
            {s.country}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <label htmlFor="home-score" className="text-sm text-ink-soft">
            Your {source.bureau} score
          </label>
          <output htmlFor="home-score" className="font-display text-2xl font-bold tabular-nums">
            {value}
          </output>
        </div>
        <input
          id="home-score"
          type="range"
          min={source.min}
          max={source.max}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-glacier-deep accent-lake"
        />
        <div className="mt-1 flex justify-between text-xs text-ink-faint tabular-nums">
          <span>{source.min}</span>
          <span>{source.max}</span>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-glacier p-5">
        <div className="relative mx-auto w-full max-w-[260px]">
          <svg viewBox="0 0 220 124" className="w-full" role="img" aria-label={`Estimated Canadian equivalent ${estimate}, ${band.label}`}>
            <path
              d={`M 22 110 A ${R} ${R} 0 0 1 198 110`}
              fill="none"
              stroke="#DCE6EE"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <path
              d={`M 22 110 A ${R} ${R} 0 0 1 198 110`}
              fill="none"
              stroke="#0E7C8B"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={ARC}
              strokeDashoffset={ARC * (1 - pct)}
              style={{ transition: "stroke-dashoffset 500ms cubic-bezier(.2,.7,.2,1)" }}
            />
          </svg>
          <div className="absolute inset-x-0 bottom-0 text-center">
            <div className="font-display text-5xl font-bold leading-none tracking-tightest tabular-nums">{estimate}</div>
            <div className="mt-1 text-sm font-semibold text-lake-dark">{band.label}</div>
          </div>
        </div>
        <p className="mt-4 text-center text-sm text-ink-soft">{band.note}</p>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-ink-faint">
        A straight-line illustration on a 300 to 900 scale, not a real score. Your report is built by analysts from
        your actual documents.
      </p>
    </section>
  );
}
