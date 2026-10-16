import { handler } from "@/lib/mock/http";
import { listNotes, createNote } from "@/lib/mock/actions";

export const dynamic = "force-dynamic";
export const GET = handler(listNotes);
export const POST = handler(createNote);
