"use client";

import { useSyncExternalStore } from "react";
import { getStoreVersion, readFlags, subscribe, writeFlags, resetDemoData, exportDemoData, type DemoFlags } from "@/lib/demo-db";

export function useDemoFlags(): DemoFlags & { now: number } {
  const version = useSyncExternalStore(subscribe, getStoreVersion, () => 0);
  const flags = typeof window === "undefined" ? { forceError: false, tamper: false, slaOffsetHours: 0 } : readFlags();
  void version;
  return { ...flags, now: Date.now() + flags.slaOffsetHours * 3600_000 };
}

export function setDemoFlags(patch: Partial<DemoFlags>): void {
  writeFlags(patch);
}

export { resetDemoData, exportDemoData };
