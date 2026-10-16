import type { Metadata } from "next";
import { EvidenceUpload } from "@/features/partner/screens";
export const metadata: Metadata = { title: "Upload evidence", description: "Upload evidence on behalf of an applicant." };
export default function Page() { return (<EvidenceUpload />); }
