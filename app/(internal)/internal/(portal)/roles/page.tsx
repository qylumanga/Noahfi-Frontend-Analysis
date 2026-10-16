import type { Metadata } from "next";
import { RolesPanel } from "@/features/internal/AdminPanel";

export const metadata: Metadata = { title: "Roles", description: "Internal staff roles." };
export default function Page() { return <RolesPanel />; }
