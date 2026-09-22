import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import PartsList from "@/components/PartsList";
import JsonLd from "@/components/JsonLd";
import Footer from "@/components/Footer";
import { CATEGORY_NAMES } from "@/lib/constants";
import {
  allFacetRoutes,
  facetBySlug,
  facetDescription,
  facetPath,
  facetTitle,
} from "@/lib/facets";
import { hasQueryParams, SITE_URL as BASE } from "@/lib/seo";

// Clean, indexable spec-filter pages: /market/ram/ddr5 renders what
// /market/ram?ddr_type=DDR5 does, under its own title and H1. proxy.ts
// 404s unknown slugs (see the status-code note there) and redirects the
// exactly-equivalent query URL here.
export function generateStaticParams() {
  return allFacetRoutes().map(({ category, facet }) => ({ category, facet: facet.slug }));
}

export const dynamicParams = false;

interface PageProps {
  params: Promise<{ category: string; facet: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { category, facet: slug } = await params;
  const facet = facetBySlug(category, slug);
  if (!facet) return {};
  const title = facetTitle(facet);
  const description = facetDescription(facet);
  const path = facetPath(category, facet);
  return {
    title,
    description,
    alternates: { canonical: path },
    // Sorted, paged or further-filtered variants duplicate the clean page.
    ...(hasQueryParams(await searchParams) && { robots: { index: false, follow: true } }),
    openGraph: { title, description, url: `${BASE}${path}` },
  };
}

export default async function FacetPage({ params, searchParams }: PageProps) {
  const { category, facet: slug } = await params;
  const facet = facetBySlug(category, slug);
  if (!facet) notFound();
  const resolvedParams = await searchParams;
  const title = facetTitle(facet);
  const path = facetPath(category, facet);
  const categoryName = CATEGORY_NAMES[category as keyof typeof CATEGORY_NAMES] ?? category.toUpperCase();
  // The facet's filter is implied by the path, not the query string.
  const baseParams = { [facet.key]: facet.value };

  return (
    <div className="flex flex-col flex-1" style={{ background: "var(--bg)" }}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: title,
          description: facetDescription(facet),
          url: `${BASE}${path}`,
          breadcrumb: {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "RigPK", item: BASE },
              { "@type": "ListItem", position: 2, name: "Market", item: `${BASE}/market` },
              { "@type": "ListItem", position: 3, name: `${categoryName} Prices in Pakistan`, item: `${BASE}/market/${category}` },
              { "@type": "ListItem", position: 4, name: title, item: `${BASE}${path}` },
            ],
          },
        }}
      />
      <Navbar />
      <main className="flex flex-col flex-1">
        <Suspense
          fallback={
            <div className="py-20 text-center mono" style={{ color: "var(--text-dim)" }}>
              Loading…
            </div>
          }
        >
          <PartsList
            category={category}
            searchParams={{ ...resolvedParams, ...baseParams }}
            baseParams={baseParams}
            heading={title}
            activeFacet={facet.slug}
          />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
