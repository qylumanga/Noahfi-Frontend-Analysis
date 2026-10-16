import type { Metadata } from "next";
import { FeedbackDesk } from "@/features/internal/Desks";

export const metadata: Metadata = { title: "Feedback", description: "Customer feedback after quality review." };
export default function Page() { return <FeedbackDesk />; }
