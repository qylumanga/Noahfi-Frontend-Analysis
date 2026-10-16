import type { Metadata } from "next";
import { CasePage } from "@/features/cases/CasePage";
export const metadata: Metadata = { title: "Case", description: "Track or download your assessment." };
export default function Page() { return (<CasePage />); }
