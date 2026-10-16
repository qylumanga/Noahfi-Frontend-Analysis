import { handler } from "@/lib/mock/http";
import { bundle } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const GET = handler(bundle);
