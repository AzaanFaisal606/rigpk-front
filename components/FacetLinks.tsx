import Link from "next/link";
import { CATEGORY_NAMES } from "@/lib/constants";
import { facetPath, facetsFor } from "@/lib/facets";

interface Props {
  category: string;
  /** Slug of the facet page being shown; that chip renders in the accent. */
  activeFacet?: string;
}

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
      className="facet-links"
    >
      <span className="facet-links-label">
        Popular
      </span>
      <Link
        href={`/market/${category}`}
        prefetch={false}
        aria-current={activeFacet ? undefined : "page"}
        className="facet-chip"
      >
        <span className="skew-label">All</span>
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
            className="facet-chip"
          >
            <span className="skew-label">{facet.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
