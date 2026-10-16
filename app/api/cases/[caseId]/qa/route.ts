import { handler } from "@/lib/mock/http";
import { qaCase } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const POST = handler(qaCase);
