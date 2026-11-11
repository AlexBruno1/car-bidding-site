import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/modules/identity/server";

// Built per request so that importing this file never needs env or database.
export async function GET(request: Request) {
  return toNextJsHandler(getAuth()).GET(request);
}

export async function POST(request: Request) {
  return toNextJsHandler(getAuth()).POST(request);
}
