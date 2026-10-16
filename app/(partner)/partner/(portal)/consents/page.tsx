import type { Metadata } from "next";
import { ConsentControls } from "@/features/partner/screens";
export const metadata: Metadata = { title: "Consent", description: "Consent status for applicants." };
export default function Page() { return (<ConsentControls />); }
