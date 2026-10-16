import { handler } from "@/lib/mock/http";
import { metrics } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const GET = handler(metrics);
