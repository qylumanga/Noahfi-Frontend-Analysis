import { handler } from "@/lib/mock/http";
import { listIntegrations } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const GET = handler(listIntegrations);
