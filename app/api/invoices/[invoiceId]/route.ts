import { handler } from "@/lib/mock/http";
import { getInvoice } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const GET = handler(getInvoice);
