import type { Metadata } from "next";
import { ReviewDesk } from "@/features/internal/Desks";

export const metadata: Metadata = { title: "Review", description: "Assign unassigned cases, or approve and reject." };
export default function Page() { return <ReviewDesk />; }
