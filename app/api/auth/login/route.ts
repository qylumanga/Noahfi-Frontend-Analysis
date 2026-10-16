import { handler } from "@/lib/mock/http";
import { login } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const POST = handler(login);
