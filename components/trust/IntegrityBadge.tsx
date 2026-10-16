import { BadgeCheck, Clock, ShieldAlert, ShieldOff, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const meta = {
  verified: { label: "Verified", icon: ShieldCheck, className: "bg-emerald-50 text-emerald-800" },
  pending: { label: "Pending", icon: Clock, className: "bg-amber-50 text-amber-900" },
  not_found: { label: "Not recorded", icon: ShieldOff, className: "bg-glacier text-ink-soft" },
  tampered: { label: "Tampered", icon: ShieldAlert, className: "bg-red-50 text-maple" },
  verified_source: { label: "Verified source", icon: BadgeCheck, className: "bg-lake-light text-lake-dark" },
};

export function IntegrityBadge({ state }: { state: keyof typeof meta }) {
  const item = meta[state];
  const Icon = item.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", item.className)}>
      <Icon size={12} aria-hidden />
      {item.label}
    </span>
  );
}
