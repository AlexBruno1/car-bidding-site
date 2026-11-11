import { NextResponse, type NextRequest } from "next/server";
import { LOCALES, matchLocale } from "@/platform/i18n/config";

/** Sends requests without a locale prefix to the visitor's preferred locale. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocale = LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocale) return;

  const locale = matchLocale(request.headers.get("accept-language"));
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip API routes, Next.js internals and anything that looks like a file.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
