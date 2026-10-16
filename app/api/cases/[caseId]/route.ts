import { handler } from "@/lib/mock/http";
import { getCase, patchCase } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const GET = handler(getCase);
export const PATCH = handler(patchCase);
