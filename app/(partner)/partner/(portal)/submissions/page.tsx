import type { Metadata } from "next";
import { Submissions } from "@/features/partner/screens";
export const metadata: Metadata = { title: "Submissions", description: "Track partner submissions." };
export default function Page() { return (<Submissions />); }
