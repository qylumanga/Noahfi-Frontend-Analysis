import type { ComponentPropsWithoutRef, CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";

export function AnimatedShinyText({ children, className, shimmerWidth = 120, ...props }: ComponentPropsWithoutRef<"span"> & { shimmerWidth?: number }) {
  return (
    <span
      style={{ "--shiny-width": `${shimmerWidth}px` } as CSSProperties}
      className={cn(
        "inline-block bg-clip-text text-transparent",
        "bg-[linear-gradient(110deg,#475569_30%,#0A2342_50%,#475569_70%)] bg-[length:var(--shiny-width)_100%] bg-no-repeat",
        "animate-shiny-text",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
