import type { Metadata } from "next";
import { RatingPage } from "@/features/internal/Pages";
export const metadata: Metadata = { title: "Rating", description: "Canadian-equivalent scoring." };
export default function Page() { return (<RatingPage />); }
