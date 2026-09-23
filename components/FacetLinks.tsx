import Link from "next/link";
import { CATEGORY_NAMES } from "@/lib/constants";
import { facetPath, facetsFor } from "@/lib/facets";
import { monoFont } from "@/lib/tokens";

interface Props {
  category: string;
  /** Slug of the facet page being shown; that chip renders in the accent. */
  activeFacet?: string;
}

const chipStyle = (active: boolean) => ({
  padding: "5px 11px",
  border: "2px solid var(--ink)",
  boxShadow: active ? "var(--gloss), 2px 2px 0 var(--shadow)" : "2px 2px 0 var(--shadow)",
  background: active ? "var(--purple)" : "var(--paper)",
  color: active ? "white" : "var(--text)",
  fontFamily: monoFont,
  fontSize: "9px",
  fontWeight: 800,
  letterSpacing: "1px",
  textTransform: "uppercase" as const,
  textDecoration: "none",
  transform: "skewX(-8deg)",
  display: "inline-block",
  whiteSpace: "nowrap" as const,
});

/**
 * Popular-filter chips linking each category page to its clean facet URLs
 * (and back). Server-rendered plain links, so they're how crawlers find the
 * facet pages from the category they belong to.
 */
export default function FacetLinks({ category, activeFacet }: Props) {
  const facets = facetsFor(category);
  if (facets.length === 0) return null;
  const categoryName = CATEGORY_NAMES[category as keyof typeof CATEGORY_NAMES] ?? category.toUpperCase();

  return (
    <nav
      aria-label={`Popular ${categoryName} filters`}
      style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", margin: "-4px 0 20px" }}
    >
      <span
        style={{
          fontFamily: monoFont,
          fontSize: "9px",
          fontWeight: 800,
          color: "var(--text-dim)",
          letterSpacing: "2px",
          textTransform: "uppercase",
          marginRight: "2px",
        }}
      >
        Popular
      </span>
      <Link
        href={`/market/${category}`}
        prefetch={false}
        aria-current={activeFacet ? undefined : "page"}
        style={chipStyle(!activeFacet)}
      >
        <span style={{ display: "inline-block", transform: "skewX(8deg)" }}>All</span>
      </Link>
      {facets.map(facet => {
        const active = facet.slug === activeFacet;
        return (
          <Link
            key={facet.slug}
            href={facetPath(category, facet)}
            prefetch={false}
            aria-current={active ? "page" : undefined}
            title={`${facet.name} prices in Pakistan`}
            style={chipStyle(active)}
          >
            <span style={{ display: "inline-block", transform: "skewX(8deg)" }}>{facet.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
