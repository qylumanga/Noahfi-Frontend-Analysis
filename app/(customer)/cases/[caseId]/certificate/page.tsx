import type { Metadata } from "next";
import { CertificatePage } from "@/features/cases/CasePage";
export const metadata: Metadata = { title: "Verification certificate", description: "Trust Ledger certificate for this case." };
export default function Page() { return (<CertificatePage />); }
