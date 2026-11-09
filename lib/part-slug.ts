/**
 * Part page URLs. Dependency-free on purpose: proxy.ts and every PartRow
 * import it, and neither should pull in the API client or the model catalogue.
 */

const SLUG_MAX = 80;

/** "MSI RTX 4060 Ti Ventus 2X 8GB" -> "msi-rtx-4060-ti-ventus-2x-8gb". ASCII only, <= 80 chars. */
export function partSlug(name: string): string {
  let s = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (s.length > SLUG_MAX) {
    s = s.slice(0, SLUG_MAX + 1);
    const cut = s.lastIndexOf("-");
    s = (cut > 0 ? s.slice(0, cut) : s.slice(0, SLUG_MAX)).replace(/-+$/, "");
  }
  return s || "part";
}

export function partPath(p: { id: number; name: string }): string {
  return `/part/${p.id}-${partSlug(p.name)}`;
}

/** Digits (at most 10, so the id stays a sane integer), then optionally "-slug". */
export const PART_PARAM_RE = /^(\d{1,10})(?:-[a-z0-9-]*)?$/;

/** The id from a /part/[slug] segment, or null when it isn't one. Only the id is looked up. */
export function parsePartParam(param: string): number | null {
  const m = PART_PARAM_RE.exec(param);
  if (!m) return null;
  const id = Number(m[1]);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/**
 * The one internal path every slug variant of an id is rendered under
 * (proxy.ts rewrites to it). ISR caches per path, so without this /part/1-a,
 * /part/1-b and /part/01 would each cost a render and an ISR write. The
 * canonical (with the real slug) still comes from the part's data.
 */
export function partCachePath(param: string): string | null {
  const id = parsePartParam(param);
  return id === null ? null : `/part/${id}`;
}
