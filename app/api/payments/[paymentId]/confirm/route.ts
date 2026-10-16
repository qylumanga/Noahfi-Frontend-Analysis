import { handler } from "@/lib/mock/http";
import { confirmPayment } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const POST = handler(confirmPayment);
