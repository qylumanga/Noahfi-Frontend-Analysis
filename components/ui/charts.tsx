export function SvgSparkline({ values, label }: { values: number[]; label: string }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const w = 160;
  const h = 42;
  const points = values.map((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * w;
    const y = h - ((value - min) / Math.max(max - min, 1)) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-12 w-40" role="img" aria-label={label}>
      <polyline fill="none" stroke="#0E7C8B" strokeWidth="2" points={points} />
    </svg>
  );
}

export function SvgBarChart({ rows, label }: { rows: { label: string; value: number }[]; label: string }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <svg viewBox={`0 0 320 ${rows.length * 28}`} className="w-full" role="img" aria-label={label}>
      {rows.map((row, index) => (
        <g key={row.label} transform={`translate(0 ${index * 28})`}>
          <text x="0" y="16" className="fill-ink" fontSize="11">{row.label}</text>
          <rect x="92" y="6" height="12" rx="4" width={((row.value / max) * 180)} fill="#0E7C8B" />
          <text x="280" y="16" fontSize="11" className="fill-ink">{row.value}</text>
        </g>
      ))}
    </svg>
  );
}

export function SvgDonut({ value, label }: { value: number; label: string }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(100, value)) / 100);
  return (
    <svg viewBox="0 0 100 100" className="h-28 w-28" role="img" aria-label={label}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="#DCE6EE" strokeWidth="10" />
      <circle cx="50" cy="50" r={r} fill="none" stroke="#0E7C8B" strokeWidth="10" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 50 50)" />
      <text x="50" y="54" textAnchor="middle" fontSize="16" fontWeight="700" className="fill-ink">{value}%</text>
    </svg>
  );
}

const R = 88;
const ARC = Math.PI * R;

export function ScoreGauge({ score, band }: { score: number; band: string }) {
  const pct = Math.max(0, Math.min(1, (score - 300) / 600));
  return (
    <div className="relative mx-auto w-full max-w-[260px]">
      <svg viewBox="0 0 220 124" className="w-full" role="img" aria-label={`Canadian-equivalent score ${score}, ${band}`}>
        <path d={`M 22 110 A ${R} ${R} 0 0 1 198 110`} fill="none" stroke="#DCE6EE" strokeWidth="14" strokeLinecap="round" />
        <path d={`M 22 110 A ${R} ${R} 0 0 1 198 110`} fill="none" stroke="#0E7C8B" strokeWidth="14" strokeLinecap="round" strokeDasharray={ARC} strokeDashoffset={ARC * (1 - pct)} />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <div className="font-display text-5xl font-bold leading-none tracking-tightest tabular-nums">{score}</div>
        <div className="mt-1 text-sm font-semibold text-lake-dark">{band}</div>
      </div>
    </div>
  );
}
