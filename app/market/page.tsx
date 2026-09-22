import { Suspense } from "react";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import PartsList from "@/components/PartsList";
import Footer from "@/components/Footer";
import { hasQueryParams } from "@/lib/seo";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  return {
    title: "PC Parts Prices in Pakistan",
    description:
      "Browse all PC parts with live prices from Pakistani retailers. Filter by category, brand, price, and specs.",
    alternates: { canonical: "/market" },
    // Sorted, paged, filtered and searched variants duplicate the clean page.
    ...(hasQueryParams(params) && { robots: { index: false, follow: true } }),
  };
}

export default async function MarketPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  return (
    <div className="flex flex-col flex-1" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="flex flex-col flex-1">
        <Suspense
          fallback={
            <div className="py-20 text-center mono" style={{ color: "var(--text-dim)" }}>
              Loading…
            </div>
          }
        >
          <PartsList searchParams={resolvedParams} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
