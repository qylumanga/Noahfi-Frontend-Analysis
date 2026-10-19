import Link from "next/link";
import React, { type ComponentPropsWithoutRef, type CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";

type Shared = {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  children?: React.ReactNode;
};

type ButtonProps = Shared & ComponentPropsWithoutRef<"button"> & { href?: undefined };
type LinkProps = Shared & { href: string } & Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "className" | "children">;

export function ShimmerButton({
  shimmerColor = "#ffffff",
  shimmerSize = "0.08em",
  shimmerDuration = "3s",
  borderRadius = "14px",
  background = "#0B6B8F",
  className,
  children,
  href,
  ...props
}: ButtonProps | LinkProps) {
  const style = {
    "--spread": "90deg",
    "--shimmer-color": shimmerColor,
    "--radius": borderRadius,
    "--speed": shimmerDuration,
    "--cut": shimmerSize,
    "--bg": background,
  } as CSSProperties;
  const classes = cn(
    "group relative z-0 inline-flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap border border-white/10 px-6 py-3 font-semibold text-white [background:var(--bg)] [border-radius:var(--radius)]",
    "transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px",
    className,
  );
  const inner = (
    <>
      <div className="absolute inset-0 -z-30 overflow-visible blur-[2px] [container-type:size]">
        <div className="absolute inset-0 aspect-square h-[100cqh] animate-shimmer-slide rounded-none">
          <div className="absolute -inset-full w-auto animate-spin-around [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))]" />
        </div>
      </div>
      {children}
      <div className="absolute inset-0 size-full rounded-2xl shadow-[inset_0_-8px_10px_#ffffff1f] transition-all duration-300 group-hover:shadow-[inset_0_-6px_10px_#ffffff3f] group-active:shadow-[inset_0_-10px_10px_#ffffff3f]" />
      <div className="absolute -z-20 [background:var(--bg)] [border-radius:var(--radius)] [inset:var(--cut)]" />
    </>
  );
  if (href) {
    return (
      <Link href={href} style={style} className={classes}>
        {inner}
      </Link>
    );
  }
  return (
    <button style={style} className={classes} {...(props as ComponentPropsWithoutRef<"button">)}>
      {inner}
    </button>
  );
}
