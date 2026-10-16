import { handler } from "@/lib/mock/http";
import { pricing } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const GET = handler(pricing);
