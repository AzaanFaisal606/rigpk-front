import { Suspense } from "react";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import PartsList from "@/components/PartsList";
import JsonLd from "@/components/JsonLd";
import Footer from "@/components/Footer";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rigpk.vercel.app";

// Subset of lib/constants.ts CATEGORIES — hdd/monitor excluded as they lack CATEGORY_META entries
const CATEGORIES = ["cpu", "gpu", "ram", "motherboard", "psu", "case", "ssd", "cooling"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_META: Record<Category, { title: string; description: string }> = {
  gpu:         { title: "GPU Prices in Pakistan | RigPK",         description: "Compare graphics card prices from Pakistani retailers. RTX, RX, and more." },
  cpu:         { title: "CPU Prices in Pakistan | RigPK",         description: "Compare processor prices from CZone, Junaid Tech, Zah Computers and more." },
  ram:         { title: "RAM Prices in Pakistan | RigPK",         description: "DDR4 and DDR5 RAM prices from top Pakistani PC retailers." },
  motherboard: { title: "Motherboard Prices in Pakistan | RigPK", description: "Compare motherboard prices by socket and chipset from Pakistani stores." },
  psu:         { title: "PSU Prices in Pakistan | RigPK",         description: "Power supply unit prices from Pakistani retailers. Modular and non-modular." },
  case:        { title: "PC Case Prices in Pakistan | RigPK",     description: "PC cabinet prices from Pakistani retailers. ATX, mATX, ITX." },
  ssd:         { title: "SSD Prices in Pakistan | RigPK",         description: "NVMe and SATA SSD prices from Pakistani PC stores." },
  cooling:     { title: "CPU Cooler Prices in Pakistan | RigPK",  description: "Air and AIO liquid cooler prices from Pakistani retailers." },
};

export function generateStaticParams() {
  return CATEGORIES.map(c => ({ category: c }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const meta = CATEGORY_META[category as Category];
  if (!meta) return {};
  return {
    title: meta.title,
    description: meta.description,
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
  const resolvedParams = await searchParams;
  const meta = CATEGORY_META[category as Category];

  return (
    <div className="flex flex-col flex-1" style={{ background: "var(--bg)" }}>
      {meta && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: meta.title,
            description: meta.description,
            url: `${BASE}/market/${category}`,
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
