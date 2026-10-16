import type { Metadata } from "next";
import { PartnerDashboard } from "@/features/partner/screens";
export const metadata: Metadata = { title: "Partner dashboard", description: "Maple Harbour Bank partner workspace." };
export default function Page() { return (<PartnerDashboard />); }
