import { handler } from "@/lib/mock/http";
import { logout } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const POST = handler(logout);
