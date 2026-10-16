import Link from "next/link";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5" aria-label="NOAHFI home">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
        <path
          d="M14 2 4 6v7.5c0 6 4.2 10.4 10 12.5 5.8-2.100 10-6.500 10-12.500V6L14 2Z"
          className={light ? "fill-white" : "fill-ink"}
        />
        <path d="M9.500 14.500 13 18l6-7" stroke="#DC3B2F" strokeWidth="2.400" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={`font-display text-xl font-bold tracking-tight ${light ? "text-white" : "text-ink"}`}>
        NOAHFI
      </span>
    </Link>
  );
}
