"use client";

import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const variants = {
  primary: "bg-ink text-white hover:bg-lake-dark",
  secondary: "border border-ink/15 bg-white text-ink hover:border-ink/40",
  lake: "bg-lake text-white hover:bg-lake-dark",
  ghost: "bg-transparent text-ink hover:bg-ink/5",
  danger: "bg-maple text-white hover:bg-[#b43228]",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  loading?: boolean;
};

export function Button({ variant = "primary", loading, className, children, disabled, ...props }: Props) {
  return (
    <button className={cn("btn", variants[variant], (loading || disabled) && "cursor-not-allowed opacity-70", className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="animate-spin" size={16} aria-hidden />}
      {children}
    </button>
  );
}
