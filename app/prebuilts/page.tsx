import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PrebuiltCard from "@/components/PrebuiltCard";
import PrebuiltFilterBar from "@/components/PrebuiltFilterBar";
import { getPrebuilts } from "@/lib/prebuilts-api";
import { str } from "@/lib/utils";
import { monoFont } from "@/lib/tokens";
import { buildPageUrl, DEFAULT_SORT } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Pre-Built PCs — RigPK",
  description: "Browse pre-built gaming PCs from Pakistani retailers. Filter by CPU, GPU, price and more.",
};

const LIMIT = 24;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function PrebuiltGrid({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const source    = str(searchParams.source);
  const cpuBrand  = str(searchParams.cpu_brand);
  const gpuBrand  = str(searchParams.gpu_brand);
  const sort      = (str(searchParams.sort) as "price_asc" | "price_desc") ?? DEFAULT_SORT;
  const minPrice  = str(searchParams.min_price);
  const maxPrice  = str(searchParams.max_price);
  const q         = str(searchParams.q);
  const offset    = Number(str(searchParams.offset) ?? "0");

  const result = await getPrebuilts({
    source,
    cpu_brand: cpuBrand,
    gpu_brand: gpuBrand,
    sort,
    min_price: minPrice ? Number(minPrice) : undefined,
    max_price: maxPrice ? Number(maxPrice) : undefined,
    q,
    limit: LIMIT,
    offset,
  });
  const failed = !result.ok;
  const items  = result.ok ? result.items : [];
  const total  = result.ok ? result.total : 0;

  const pageUrl = (newOffset: number) =>
    buildPageUrl({
      basePath: "/prebuilts",
      source,
      cpu_brand: cpuBrand,
      gpu_brand: gpuBrand,
      sort,
      min_price: minPrice,
      max_price: maxPrice,
      q,
      offset: newOffset,
    });

  const hasPrev = offset > 0;
  const hasNext = offset + LIMIT < total;
  const page    = Math.floor(offset / LIMIT) + 1;
  const pages   = Math.ceil(total / LIMIT);

  return (
    <>
      {failed ? (
        <div style={{ padding: "80px 0", textAlign: "center" }}>
          <p style={{ fontFamily: monoFont, fontSize: "13px", fontWeight: 900, color: "var(--purple)", letterSpacing: "1.5px" }}>
            {"// SEARCH FAILED"}
          </p>
          <p style={{ fontFamily: monoFont, fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.5px", marginTop: "8px" }}>
            Couldn&apos;t reach the server. Reload to try again.
          </p>
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: "80px 0", textAlign: "center", fontFamily: monoFont, fontSize: "13px", color: "#a1a1aa", letterSpacing: "1.5px" }}>
          {"// NO PREBUILTS FOUND"}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "28px" }} className="pb-browser-grid">
          {items.map(p => <PrebuiltCard key={p.id} prebuilt={p} />)}
        </div>
      )}

      {!failed && (hasPrev || hasNext) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "32px" }}>
          <Link
            href={hasPrev ? pageUrl(offset - LIMIT) : "#"}
            style={{
              padding: "8px 18px",
              border: "2px solid #111112",
              boxShadow: "3px 3px 0 #111112",
              background: hasPrev ? "white" : "#f4f4f5",
              color: hasPrev ? "#111112" : "#a1a1aa",
              fontFamily: monoFont,
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "1px",
              textTransform: "uppercase",
              textDecoration: "none",
              transform: "skewX(-8deg)",
              pointerEvents: hasPrev ? "auto" : "none",
            }}
          >
            <span style={{ display: "inline-block", transform: "skewX(8deg)" }}>← PREV</span>
          </Link>

          <span
            style={{
              fontFamily: monoFont,
              fontSize: "10px",
              fontWeight: 700,
              color: "#71717a",
              border: "1.5px solid #d4d4d8",
              padding: "5px 12px",
              transform: "skewX(-6deg)",
              display: "inline-block",
            }}
          >
            <span style={{ display: "inline-block", transform: "skewX(6deg)" }}>
              {page} / {pages}
            </span>
          </span>

          <Link
            href={hasNext ? pageUrl(offset + LIMIT) : "#"}
            style={{
              padding: "8px 18px",
              border: "2px solid #111112",
              boxShadow: "3px 3px 0 #111112",
              background: hasNext ? "var(--purple)" : "#f4f4f5",
              color: hasNext ? "white" : "#a1a1aa",
              fontFamily: monoFont,
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "1px",
              textTransform: "uppercase",
              textDecoration: "none",
              transform: "skewX(-8deg)",
              pointerEvents: hasNext ? "auto" : "none",
            }}
          >
            <span style={{ display: "inline-block", transform: "skewX(8deg)" }}>NEXT →</span>
          </Link>
        </div>
      )}
    </>
  );
}

export default async function PrebuiltsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  return (
    <>
      <Navbar />
      <Suspense>
        <PrebuiltFilterBar />
      </Suspense>

      <main className="pb-browser-wrapper" style={{ maxWidth: "80rem", margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: "28px" }}>
          <div style={{ fontFamily: monoFont, fontSize: "10px", fontWeight: 800, color: "#a1a1aa", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "6px" }}>
            RIGPK
          </div>
          <h1 style={{ fontFamily: monoFont, fontWeight: 900, fontSize: "1.75rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "#111112", margin: 0 }}>
            Pre-Built PCs
          </h1>
        </div>

        <Suspense fallback={
          <div style={{ padding: "80px 0", textAlign: "center", fontFamily: monoFont, fontSize: "12px", color: "#a1a1aa", letterSpacing: "1.5px" }}>
            {"// LOADING..."}
          </div>
        }>
          <PrebuiltGrid searchParams={resolvedParams} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
