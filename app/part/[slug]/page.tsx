import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import PartDetail from "@/components/PartDetail";
import { CATEGORY_NAMES } from "@/lib/constants";
import {
  checkedDate, fullImageUrl, getPartPage, modelForPart, parsePartParam, partDescription, partIsIndexable, partPath,
  type PartPage,
} from "@/lib/part-page";
import { isSafeHref } from "@/lib/safe-url";
import { SITE_URL, storeName } from "@/lib/seo";

// Built on the first request, then served from cache until a scrape refreshes
// it (lib/catalog-cache.ts; the literal is its CATALOG_REVALIDATE backstop,
// since segment config can't import a constant). Nothing is prebuilt: ~7.7k
// listings would make every deploy hammer the Render free tier. The page must
// never read searchParams or headers, or it turns dynamic and every hit
// becomes a render + backend call. See docs/product-pages.md.
export const revalidate = 2592000;

export function generateStaticParams() {
  return [];
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** One backend call per render, shared by generateMetadata and the page. */
const loadPart = cache(async (slug: string): Promise<PartPage | null> => {
  const id = parsePartParam(slug);
  if (id === null) return null;
  const p = await getPartPage(id);
  // A backend outage must not be cached as a 404 for a week: throw, so the
  // error boundary shows and ISR keeps serving the last good page.
  if (p === "error") throw new Error(`part ${id}: backend unavailable`);
  if (!p || !p.is_active) return null;
  return p;
});

const CONDITION: Record<string, string> = {
  used: "https://schema.org/UsedCondition",
  "open box": "https://schema.org/UsedCondition",
  refurbished: "https://schema.org/RefurbishedCondition",
};

function categoryName(c: string): string {
  return CATEGORY_NAMES[c as keyof typeof CATEGORY_NAMES] ?? c.toUpperCase();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const p = await loadPart((await params).slug);
  if (!p) return { title: "Part not found", robots: { index: false, follow: true } };
  // The store disambiguates the same product listed by several retailers
  // (~470 identical-name groups across stores), which would otherwise share a title.
  const title = `${p.name} Price in Pakistan at ${storeName(p.source)}`;
  const description = partDescription(p);
  const url = partPath(p);
  const image = p.thumbnail_url ? fullImageUrl(p.thumbnail_url) : null;
  return {
    title,
    description,
    alternates: { canonical: url },
    // Empty (no retailer content) and out-of-stock listings stay out of the
    // index but keep passing link equity; they become indexable on their own
    // at the next weekly regeneration once details or a price arrive.
    ...(!partIsIndexable(p) && { robots: { index: false, follow: true } }),
    openGraph: {
      title,
      description,
      url,
      type: "website",
      ...(image && { images: [{ url: image, alt: p.name }] }),
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description },
  };
}

export default async function PartPageRoute({ params }: PageProps) {
  const p = await loadPart((await params).slug);
  if (!p) notFound();

  const pageUrl = SITE_URL + partPath(p);
  const store = storeName(p.source);
  const model = modelForPart(p);
  const cat = categoryName(p.category);
  const retailerUrl = isSafeHref(p.url) ? p.url : pageUrl;
  const image = p.thumbnail_url ? fullImageUrl(p.thumbnail_url) : null;
  const condition = p.condition ? CONDITION[p.condition.toLowerCase()] : undefined;

  const crumbs: { name: string; href: string }[] = [
    { name: "Market", href: "/market" },
    { name: `${cat} prices`, href: `/market/${p.category}` },
    ...(model ? [{ name: model.label, href: `/${model.category}/${model.slug}` }] : []),
  ];

  return (
    <div className="flex flex-col flex-1 pd-page">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.name,
          url: pageUrl,
          category: cat,
          description: p.details.overview ?? partDescription(p),
          // The full-size URL is a guess (WordPress suffix stripped); the
          // thumbnail is the known-good fallback.
          ...(image && { image: [...new Set([image, p.thumbnail_url as string])] }),
          ...(p.specs?.brand && { brand: { "@type": "Brand", name: p.specs.brand } }),
          ...(p.details.specs.length > 0 && {
            additionalProperty: p.details.specs.slice(0, 40).map(([group, label, value]) => ({
              "@type": "PropertyValue",
              name: group ? `${group} ${label}` : label,
              value,
            })),
          }),
          ...(p.price_pkr != null && {
            offers: {
              "@type": "Offer",
              price: p.price_pkr,
              priceCurrency: "PKR",
              availability: "https://schema.org/InStock",
              itemCondition: condition ?? "https://schema.org/NewCondition",
              url: retailerUrl,
              seller: { "@type": "Organization", name: store },
            },
          }),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { name: "RigPK", href: "" },
            ...crumbs,
            { name: p.name, href: partPath(p) },
          ].map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: SITE_URL + c.href })),
        }}
      />
      <Navbar />
      <main className="flex flex-col flex-1 w-full pd-main">
        <nav aria-label="Breadcrumb" className="pdm-crumbs">
          {crumbs.map(c => (
            <span key={c.href} className="pdm-crumb">
              <Link href={c.href} prefetch={false}>{c.name}</Link>
              <span aria-hidden="true">›</span>
            </span>
          ))}
          <span aria-current="page" className="pdm-crumb-here">{store}</span>
        </nav>
        <article className="pdm pdm-static">
          <PartDetail part={p} details={p.details} variant="page" checked={checkedDate(p.last_seen_at)} />
        </article>
      </main>
      <Footer />
    </div>
  );
}
