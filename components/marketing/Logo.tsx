import Image from "next/image";
import Link from "next/link";

export function Logo({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  if (compact || light) {
    return (
      <Link href="/" className="inline-flex items-center gap-2" aria-label="NOAHFI home">
        <Image src="/brand/logo-mark.png" alt="" width={72} height={46} className="h-8 w-auto" />
        <span className={`text-lg font-semibold tracking-tight ${light ? "text-white" : "text-ink"}`}>
          NOAH<span className="text-teal">FI</span>
        </span>
      </Link>
    );
  }

  return (
    <Link href="/" className="inline-flex items-center" aria-label="NOAHFI home">
      <Image src="/brand/logo-wordmark.png" alt="NOAHFI, your global credit bridge" width={168} height={124} priority className="h-14 w-auto" />
    </Link>
  );
}
