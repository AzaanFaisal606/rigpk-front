import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import PartsList from "@/components/PartsList";
import JsonLd from "@/components/JsonLd";
import Footer from "@/components/Footer";
import { MARKET_ROUTE_CATEGORIES } from "@/lib/constants";
import { hasQueryParams, SITE_URL as BASE } from "@/lib/seo";

// Every category with a real page here. FilterBar's category dropdown pushes
// /market/<value> for each entry in lib/constants CATEGORIES, so this list has
// to cover all of them — anything missing becomes a 404 reachable straight
// from the UI.
const CATEGORIES = MARKET_ROUTE_CATEGORIES;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_META: Record<Category, { title: string; description: string }> = {
  gpu:         { title: "GPU Prices in Pakistan",         description: "Compare graphics card prices from Pakistani retailers. RTX, RX, and more." },
  cpu:         { title: "CPU Prices in Pakistan",         description: "Compare processor prices from CZone, Junaid Tech, Zah Computers and more." },
  ram:         { title: "RAM Prices in Pakistan",         description: "DDR4 and DDR5 RAM prices from top Pakistani PC retailers." },
  motherboard: { title: "Motherboard Prices in Pakistan", description: "Compare motherboard prices by socket and chipset from Pakistani stores." },
  psu:         { title: "PSU Prices in Pakistan",         description: "Power supply unit prices from Pakistani retailers. Modular and non-modular." },
  case:        { title: "PC Case Prices in Pakistan",     description: "PC cabinet prices from Pakistani retailers. ATX, mATX, ITX." },
  ssd:         { title: "SSD Prices in Pakistan",         description: "NVMe and SATA SSD prices from Pakistani PC stores." },
  cooling:     { title: "CPU Cooler Prices in Pakistan",  description: "Air and AIO liquid cooler prices from Pakistani retailers." },
  hdd:         { title: "Hard Drive Prices in Pakistan",  description: "Internal and external hard drive prices from Pakistani retailers." },
  monitor:     { title: "Monitor Prices in Pakistan",     description: "Gaming and office monitor prices from Pakistani PC retailers." },
};

export function generateStaticParams() {
  return CATEGORIES.map(c => ({ category: c }));
}

// Measured, not assumed: with this route dynamic (it reads searchParams) and
// wrapped by a loading.tsx, `dynamicParams = false` and the notFound() below
// both render the 404 UI but ship it with HTTP 200 — streaming locks the
// status before either can change it. Verified by removing proxy.ts and
// curling /market/banana: 200. proxy.ts is what produces the real 404; these
// two are the belt to its braces, and matter in `next dev`.
export const dynamicParams = false;

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const meta = CATEGORY_META[category as Category];
  if (!meta) return {};
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: `/market/${category}` },
    // Sorted, paged, filtered and searched variants duplicate the clean page.
    ...(hasQueryParams(await searchParams) && { robots: { index: false, follow: true } }),
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `${BASE}/market/${category}`,
    },
  };
}

interface PageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { category } = await params;
  if (!CATEGORIES.includes(category as Category)) notFound();
  const resolvedParams = await searchParams;
  const meta = CATEGORY_META[category as Category];

  return (
    <div className="flex flex-col flex-1" style={{ background: "var(--bg)" }}>
      {/* CollectionPage rather than ItemList: the listed parts link out to
          retailers, and an ItemList with no (or off-site) items is an empty claim. */}
      {meta && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: meta.title,
            description: meta.description,
            url: `${BASE}/market/${category}`,
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "RigPK", item: BASE },
                { "@type": "ListItem", position: 2, name: "Market", item: `${BASE}/market` },
                { "@type": "ListItem", position: 3, name: meta.title, item: `${BASE}/market/${category}` },
              ],
            },
          }}
        />
      )}
      <Navbar />
      <main className="flex flex-col flex-1">
        <Suspense
          fallback={
            <div className="py-20 text-center mono" style={{ color: "var(--text-dim)" }}>
              Loading…
            </div>
          }
        >
          <PartsList category={category} searchParams={resolvedParams} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
