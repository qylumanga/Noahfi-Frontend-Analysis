import { handler } from "@/lib/mock/http";
import { me, patchMe } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const GET = handler(me);
export const PATCH = handler(patchMe);
