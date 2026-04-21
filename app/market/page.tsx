import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import FilterBar from "@/components/FilterBar";
import PartRow from "@/components/PartRow";
import { getParts } from "@/lib/api";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function str(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

const SPEC_KEYS = [
  "brand", "socket", "vram", "ddr_type", "speed", "chipset",
  "wattage", "rating", "form_factor", "type", "aio_size",
  "fan_size", "interface", "capacity",
] as const;

async function PartsList({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const category = str(searchParams.category);
  const source   = str(searchParams.source);
  const sort     = (str(searchParams.sort) as "price_asc" | "price_desc") ?? "price_asc";
  const minPrice = str(searchParams.min_price);
  const maxPrice = str(searchParams.max_price);
  const offset   = str(searchParams.offset);
  const q        = str(searchParams.q);

  const specParams: Record<string, string> = {};
  for (const key of SPEC_KEYS) {
    const val = str(searchParams[key]);
    if (val) specParams[key] = val;
  }

  const { items, total } = await getParts({
    category,
    source,
    min_price: minPrice ? Number(minPrice) : undefined,
    max_price: maxPrice ? Number(maxPrice) : undefined,
    sort,
    limit: 50,
    offset: offset ? Number(offset) : 0,
    q,
    ...specParams,
  });

  const heading = category
    ? category.toUpperCase() + "S"
    : "ALL PARTS";

  return (
    <>
      <Suspense>
        <FilterBar total={total} />
      </Suspense>

      <div className="max-w-6xl mx-auto px-6 py-6 w-full">
        {/* Section header */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="section-label mb-1">Browse Parts</p>
            <h1
              style={{
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--text)",
                lineHeight: 1,
              }}
            >
              {heading}
            </h1>
          </div>
        </div>

        {/* Parts list card */}
        <div
          style={{
            border: "2px solid #111112",
            boxShadow: "6px 6px 0 #111112",
            overflow: "hidden",
          }}
        >
          {/* Black header bar */}
          <div
            style={{
              background: "#111112",
              color: "white",
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              {heading} — Parts List
            </span>
            <span
              style={{
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                fontSize: "10px",
                color: "rgba(255,255,255,0.45)",
                fontWeight: 600,
              }}
            >
              {total.toLocaleString()} results
            </span>
          </div>

          {items.length === 0 ? (
            <div
              style={{
                padding: "64px 24px",
                textAlign: "center",
                background: "var(--bg-card)",
                borderTop: "1px solid #111112",
              }}
            >
              <p
                style={{
                  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                  fontSize: "0.9rem",
                  fontWeight: 900,
                  color: "var(--text-dim)",
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                }}
              >
                // NO PARTS FOUND
              </p>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "8px" }}>
                Try adjusting your filters
              </p>
            </div>
          ) : (
            items.map((part) => <PartRow key={part.id} part={part} />)
          )}
        </div>

        {/* Pagination hint */}
        {total > 50 && (
          <div style={{ marginTop: "16px", display: "flex", justifyContent: "center" }}>
            <span
              style={{
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                fontSize: "0.68rem",
                color: "var(--text-dim)",
                border: "1px solid var(--border)",
                padding: "4px 12px",
                transform: "skewX(-6deg)",
                display: "inline-block",
                letterSpacing: "0.1em",
              }}
            >
              Showing 50 of {total.toLocaleString()} — pagination coming soon
            </span>
          </div>
        )}
      </div>
    </>
  );
}

export default async function MarketPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  return (
    <div className="flex flex-col flex-1" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="flex flex-col flex-1">
        <Suspense
          fallback={
            <div
              className="py-20 text-center mono"
              style={{ color: "var(--text-dim)" }}
            >
              Loading…
            </div>
          }
        >
          <PartsList searchParams={resolvedParams} />
        </Suspense>
      </main>
      <footer
        className="px-6 py-5 text-center"
        style={{
          background: "var(--bg)",
          borderTop: "2px solid #111112",
          color: "var(--text-dim)",
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontSize: "0.65rem",
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        PakPC — prices updated regularly from Pakistani retailers
      </footer>
    </div>
  );
}
