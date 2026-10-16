import type { Metadata } from "next";
import { QaPage } from "@/features/internal/Pages";
export const metadata: Metadata = { title: "Quality review", description: "Review an analyst recommendation." };
export default function Page() { return (<QaPage />); }
