import type { Metadata } from "next";
import { AuditPanel } from "@/features/internal/AdminPanel";

export const metadata: Metadata = { title: "Audit log", description: "Internal audit trail." };
export default function Page() { return <AuditPanel />; }
