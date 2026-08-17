/**
 * Guards against rendering a scraped `url`/`thumbnail_url` into an `href` or
 * `src` with an unexpected scheme (e.g. `javascript:`). React 19 already
 * blocks `javascript:` hrefs at render time, but that protection is inherited
 * from the framework, not owned by this code — a React downgrade or any
 * non-React use of the value would silently remove it. Validate explicitly.
 *
 * Only `http:`/`https:` are allowed. Anything else (including relative URLs,
 * which retailer-sourced values should never be) is rejected.
 */
export function isSafeHref(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
