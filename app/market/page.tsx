import { Suspense } from "react";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import PartsList from "@/components/PartsList";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "PC Parts Market — RigPK",
  description:
    "Browse all PC parts with live prices from Pakistani retailers. Filter by category, brand, price, and specs.",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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
