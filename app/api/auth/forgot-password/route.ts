import { handler } from "@/lib/mock/http";
import { forgotPassword } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const POST = handler(forgotPassword);
