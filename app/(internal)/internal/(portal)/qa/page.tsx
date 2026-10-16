import type { Metadata } from "next";
import { QaDesk } from "@/features/internal/Desks";

export const metadata: Metadata = { title: "QA", description: "Quality review for submitted ratings." };
export default function Page() { return <QaDesk />; }
