import { handler } from "@/lib/mock/http";
import { listDocuments, createDocument } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const GET = handler(listDocuments);
export const POST = handler(createDocument);
