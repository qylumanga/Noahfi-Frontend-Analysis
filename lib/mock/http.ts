import { ZodError } from "zod";
import { NextResponse } from "next/server";

export class MockError extends Error {
  status: number;
  code: string;
  fieldErrors?: Record<string, string>;

  constructor(status: number, code: string, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export type MockCtx = {
  req: Request;
  params: Record<string, string>;
  body: unknown;
  search: URLSearchParams;
};

export function handler(fn: (ctx: MockCtx) => Promise<unknown> | unknown) {
  return async (req: Request, route: { params: Promise<Record<string, string | string[] | undefined>> }) => {
    // MOCK: artificial latency so loading states are visible in the demo.
    const wait = 300 + Math.floor(Math.random() * 601);
    await new Promise((resolve) => setTimeout(resolve, wait));
    const url = new URL(req.url);
    if (url.searchParams.get("fail") === "1" || req.headers.get("x-demo-fail") === "1") {
      return NextResponse.json(
        { error: { code: "demo_fail", message: "Something went wrong. Please try again." } },
        { status: 500 },
      );
    }
    try {
      const raw = await route.params;
      const params: Record<string, string> = {};
      for (const [key, value] of Object.entries(raw ?? {})) {
        if (typeof value === "string") params[key] = value;
      }
      let body: unknown = null;
      if (req.method !== "GET" && req.method !== "HEAD") {
        const text = await req.text();
        body = text ? JSON.parse(text) : null;
      }
      const data = await fn({ req, params, body, search: url.searchParams });
      return NextResponse.json({ data });
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of error.issues) fieldErrors[issue.path.join(".") || "form"] = issue.message;
        return NextResponse.json(
          { error: { code: "validation", message: "Check the highlighted fields.", fieldErrors } },
          { status: 400 },
        );
      }
      if (error instanceof MockError) {
        return NextResponse.json(
          { error: { code: error.code, message: error.message, fieldErrors: error.fieldErrors } },
          { status: error.status },
        );
      }
      if (error instanceof SyntaxError) {
        return NextResponse.json({ error: { code: "bad_json", message: "Request body was not valid JSON." } }, { status: 400 });
      }
      console.error(error);
      return NextResponse.json({ error: { code: "internal", message: "Unexpected error." } }, { status: 500 });
    }
  };
}
