import { handler } from "@/lib/mock/http";
import { readNotification } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const PATCH = handler(readNotification);
