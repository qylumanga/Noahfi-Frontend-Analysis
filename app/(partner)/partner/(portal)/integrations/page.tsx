import type { Metadata } from "next";
import { IntegrationsPanel } from "@/features/partner/screens";
export const metadata: Metadata = { title: "Integration", description: "API and webhook status." };
export default function Page() { return (<IntegrationsPanel />); }
