import { handler } from "@/lib/mock/http";
import { sendFeedback } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const POST = handler(sendFeedback);
