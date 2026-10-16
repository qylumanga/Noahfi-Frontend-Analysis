import type { Metadata } from "next";
import { PartnerAudit } from "@/features/partner/screens";
export const metadata: Metadata = { title: "Audit trail", description: "Evidence audit trail." };
export default function Page() { return (<PartnerAudit />); }
