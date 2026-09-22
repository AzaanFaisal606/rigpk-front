import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_SORT, MARKET_ROUTE_CATEGORIES } from "@/lib/constants";
import { budgetBySlug } from "@/lib/budgets";
import { facetBySlug, facetForQuery, facetPath } from "@/lib/facets";

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
  const { pathname } = request.nextUrl;
  const market = pathname.match(/^\/market\/([^/]+)\/?$/);
  if (market && !MARKET_ROUTE_CATEGORIES.includes(market[1] as never)) {
    return NextResponse.rewrite(new URL("/__not_found__", request.url));
  }
  // A query string that is exactly one facet's filter (/market/ram?ddr_type=DDR5,
  // what FilterBar produces) goes to that facet's clean URL, so each listing
  // has one address. `_rsc` is the router's own cache-busting param on client
  // navigations, not part of the listing, so it doesn't count; neither does an
  // explicit default sort, which FilterBar writes once the sort is touched.
  if (market) {
    const query = new URLSearchParams(request.nextUrl.searchParams);
    query.delete("_rsc");
    if (query.get("sort") === DEFAULT_SORT) query.delete("sort");
    const facet = facetForQuery(market[1], query);
    if (facet) {
      return NextResponse.redirect(new URL(facetPath(market[1], facet), request.url), 308);
    }
  }
  // Unknown /market/<category>/<facet> slugs 404 for the same streaming reason.
  const facetRoute = pathname.match(/^\/market\/([^/]+)\/([^/]+)\/?$/);
  if (facetRoute && !facetBySlug(facetRoute[1], facetRoute[2])) {
    return NextResponse.rewrite(new URL("/__not_found__", request.url));
  }
  // Same treatment for /gaming-pc-under/<budget>: the root loading.tsx wraps
  // it too, so an unknown budget would otherwise 404 with a 200 status.
  const budget = pathname.match(/^\/gaming-pc-under\/([^/]+)\/?$/);
  if (budget && !budgetBySlug(budget[1])) {
    return NextResponse.rewrite(new URL("/__not_found__", request.url));
  }
}

export const config = {
  matcher: ["/market/:category", "/market/:category/:facet", "/gaming-pc-under/:budget"],
};
