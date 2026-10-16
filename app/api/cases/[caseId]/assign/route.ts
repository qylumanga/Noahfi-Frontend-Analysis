import { handler } from "@/lib/mock/http";
import { assignCase } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const POST = handler(assignCase);
