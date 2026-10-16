import { handler } from "@/lib/mock/http";
import { checkout } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const POST = handler(checkout);
