import { handler } from "@/lib/mock/http";
import { queue } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const GET = handler(queue);
