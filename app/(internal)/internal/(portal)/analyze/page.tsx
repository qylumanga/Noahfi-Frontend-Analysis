import type { Metadata } from "next";
import { AnalyzeDesk } from "@/features/internal/Desks";

export const metadata: Metadata = { title: "Analyze", description: "Ratings for cases assigned to you." };
export default function Page() { return <AnalyzeDesk />; }
