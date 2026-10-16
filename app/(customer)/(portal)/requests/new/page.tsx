import type { Metadata } from "next";
import { NewRequestWizard } from "@/features/wizard/NewRequestWizard";
export const metadata: Metadata = { title: "New request", description: "Start a Canadian-equivalent credit assessment." };
export default function Page() { return (<NewRequestWizard />); }
