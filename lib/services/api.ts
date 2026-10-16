import type { ApiErrorBody } from "@/lib/types";
import { readFlags, readSession, writeFlags } from "@/lib/demo-db";

export class ApiError extends Error {
  status: number;
  code: string;
  fieldErrors?: Record<string, string>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.status = status;
    this.code = body.code;
    this.fieldErrors = body.fieldErrors;
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const session = readSession();
  if (session) headers.set("x-demo-session", encodeURIComponent(JSON.stringify(session)));
  const flags = readFlags();
  if (flags.forceError) {
    headers.set("x-demo-fail", "1");
    writeFlags({ forceError: false });
  }
  const response = await fetch(path, { ...init, headers });
  const payload = (await response.json()) as { data?: T; error?: ApiErrorBody };
  if (!response.ok || payload.error) {
    throw new ApiError(response.status, payload.error ?? { code: "http", message: "Request failed." });
  }
  return payload.data as T;
}
