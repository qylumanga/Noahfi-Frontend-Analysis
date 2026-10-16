import { handler } from "@/lib/mock/http";
import { analysts } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const GET = handler(analysts);
