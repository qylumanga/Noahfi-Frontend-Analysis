import { handler } from "@/lib/mock/http";
import { saveTask } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const POST = handler(saveTask);
