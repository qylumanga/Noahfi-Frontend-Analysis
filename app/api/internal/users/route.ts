import { handler } from "@/lib/mock/http";
import { internalUsers } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const GET = handler(internalUsers);
