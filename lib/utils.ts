/** Coerce a Next.js searchParam value (string | string[] | undefined) to string | undefined. */
export function str(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}
