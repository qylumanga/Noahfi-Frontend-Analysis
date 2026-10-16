import { handler } from "@/lib/mock/http";
import { listNotifications } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const GET = handler(listNotifications);
