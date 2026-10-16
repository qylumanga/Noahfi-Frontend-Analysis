import { handler } from "@/lib/mock/http";
import { verifyIdentity } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const POST = handler(verifyIdentity);
