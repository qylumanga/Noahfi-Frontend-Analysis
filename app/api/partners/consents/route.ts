import { handler } from "@/lib/mock/http";
import { listConsents, putConsents } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const GET = handler(listConsents);
export const PUT = handler(putConsents);
