import type { Metadata } from "next";
import { PaymentFlow } from "@/features/payment/PaymentFlow";
export const metadata: Metadata = { title: "Payment", description: "Pay USD 100 plus local tax." };
export default function Page() { return (<PaymentFlow />); }
