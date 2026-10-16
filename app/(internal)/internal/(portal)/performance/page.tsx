import type { Metadata } from "next";
import { PerformancePanel } from "@/features/internal/AdminPanel";

export const metadata: Metadata = { title: "Performance", description: "Case volume and SLA." };
export default function Page() { return <PerformancePanel />; }
