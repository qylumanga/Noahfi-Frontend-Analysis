import { handler } from "@/lib/mock/http";
import { listCases, createCase } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const GET = handler(listCases);
export const POST = handler(createCase);
