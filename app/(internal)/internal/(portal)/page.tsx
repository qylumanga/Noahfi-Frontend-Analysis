import type { Metadata } from "next";
import { Queue } from "@/features/internal/Queue";
export const metadata: Metadata = { title: "Case queue", description: "Incoming NOAHFI cases." };
export default function Page() { return (<Queue />); }
