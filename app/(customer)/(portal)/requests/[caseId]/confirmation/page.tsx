import type { Metadata } from "next";
import { Confirmation } from "@/features/payment/PaymentFlow";
export const metadata: Metadata = { title: "Payment confirmed", description: "Your result is due within 48 hours." };
export default function Page() { return (<Confirmation />); }
