import { handler } from "@/lib/mock/http";
import { listEmails } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const GET = handler(listEmails);
