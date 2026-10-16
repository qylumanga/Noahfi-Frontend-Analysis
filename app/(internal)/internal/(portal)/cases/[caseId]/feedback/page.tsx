import type { Metadata } from "next";
import { FeedbackPage } from "@/features/internal/Pages";
export const metadata: Metadata = { title: "Feedback", description: "Send the final report to the requester." };
export default function Page() { return (<FeedbackPage />); }
