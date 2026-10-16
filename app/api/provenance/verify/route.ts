import { handler } from "@/lib/mock/http";
import { provenanceVerify } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const POST = handler(provenanceVerify);
