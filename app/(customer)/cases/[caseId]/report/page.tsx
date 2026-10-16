import type { Metadata } from "next";
import { ReportPage } from "@/features/cases/CasePage";
export const metadata: Metadata = { title: "Report", description: "Printable Canadian-equivalent assessment." };
export default function Page() { return (<ReportPage />); }
