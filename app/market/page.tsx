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
    ...specParams,
  });

  const heading = category
    ? category.charAt(0).toUpperCase() + category.slice(1).toUpperCase() + "s"
    : "All Parts";

  return (
    <>
      <Suspense>
        <FilterBar total={total} />
      </Suspense>

      <div className="max-w-6xl mx-auto px-6 py-6 w-full">
        {/* Section header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="section-label mb-1">Browse Parts</p>
            <h1
              className="font-bold"
              style={{
                fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)",
                color: "var(--text)",
              }}
            >
              {heading}
            </h1>
          </div>
          {total > 0 && (
            <span
              className="mono hidden sm:block"
              style={{ color: "var(--text-dim)", fontSize: "0.7rem" }}
            >
              {total.toLocaleString()} results
            </span>
          )}
        </div>

        {/* Parts list card */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          {/* Purple top accent stripe */}
          <div
            className="h-px w-full"
            style={{
              background: "linear-gradient(90deg, #7c3aed, transparent 60%)",
            }}
          />

          {items.length === 0 ? (
            <div
              className="py-20 text-center"
              style={{ background: "var(--bg-card)" }}
            >
              <p
                className="mono"
                style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}
              >
                NO PARTS FOUND
              </p>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                Try adjusting your filters
              </p>
            </div>
          ) : (
            items.map((part) => <PartRow key={part.id} part={part} />)
          )}
        </div>

        {/* Pagination hint */}
        {total > 50 && (
          <p
            className="mono mt-4 text-center"
            style={{ color: "var(--text-dim)", fontSize: "0.7rem" }}
          >
            Showing 50 of {total.toLocaleString()} parts — pagination coming
            soon
          </p>
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
        className="border-t px-6 py-6 text-center text-xs"
        style={{
          background: "var(--bg)",
          borderColor: "var(--border)",
          color: "var(--text-dim)",
        }}
      >
        PakPC — prices updated regularly from Pakistani retailers
      </footer>
    </div>
  );
}
