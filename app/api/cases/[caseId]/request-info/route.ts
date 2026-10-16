import { handler } from "@/lib/mock/http";
import { requestInfo } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const POST = handler(requestInfo);
