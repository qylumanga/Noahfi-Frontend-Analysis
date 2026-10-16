import { handler } from "@/lib/mock/http";
import { shareCase } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const POST = handler(shareCase);
