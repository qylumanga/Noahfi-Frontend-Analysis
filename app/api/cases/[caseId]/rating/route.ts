import { handler } from "@/lib/mock/http";
import { getRating, putRating } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const GET = handler(getRating);
export const PUT = handler(putRating);
