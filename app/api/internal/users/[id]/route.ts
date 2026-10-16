import { handler } from "@/lib/mock/http";
import { patchInternalUser } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const PATCH = handler(patchInternalUser);
