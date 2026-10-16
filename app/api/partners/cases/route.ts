import { handler } from "@/lib/mock/http";
import { partnerCases } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const GET = handler(partnerCases);
