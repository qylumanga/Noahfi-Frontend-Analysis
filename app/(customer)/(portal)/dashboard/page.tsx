import type { Metadata } from "next";
import { Dashboard } from "@/features/dashboard/Dashboard";
export const metadata: Metadata = { title: "Dashboard", description: "Your NOAHFI assessments." };
export default function Page() { return (<Dashboard />); }
