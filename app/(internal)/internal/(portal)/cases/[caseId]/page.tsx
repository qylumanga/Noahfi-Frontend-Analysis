import type { Metadata } from "next";
import { WorkspacePage } from "@/features/internal/Pages";
export const metadata: Metadata = { title: "Case workspace", description: "Review an assessment." };
export default function Page() { return (<WorkspacePage />); }
