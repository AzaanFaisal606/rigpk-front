import { NextResponse, type NextRequest } from "next/server";
import { MARKET_ROUTE_CATEGORIES } from "@/lib/constants";

/**
 * /market/[category] has a loading.tsx, which makes Next.js stream the
 * response — and once streaming starts the HTTP status is locked at 200
 * (see node_modules/next/dist/docs/.../loading.md, "Status Codes"). A
 * notFound() call inside the page component therefore renders the styled
 * not-found UI but ships it with a 200 status.
 *
 * Checking the category here, before the App Router renders anything,
 * avoids that entirely. Rewriting (not redirecting) to a path with no
 * matching route hands the request to Next's static /_not-found handling —
 * same styled UI, but as an unbuffered response with a real 404 status,
 * and the URL bar still shows /market/<bad-category>.
 */
export function proxy(request: NextRequest) {
  const match = request.nextUrl.pathname.match(/^\/market\/([^/]+)\/?$/);
  if (match && !MARKET_ROUTE_CATEGORIES.includes(match[1] as never)) {
    return NextResponse.rewrite(new URL("/__not_found__", request.url));
  }
}

export const config = {
  matcher: "/market/:category",
};
