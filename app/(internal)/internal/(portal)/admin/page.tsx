import type { Metadata } from "next";
import { AdminPanel } from "@/features/internal/AdminPanel";
export const metadata: Metadata = { title: "Operations", description: "Team metrics, roles, and audit logs." };
export default function Page() { return (<AdminPanel />); }
