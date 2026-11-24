import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PrebuiltCard from "@/components/PrebuiltCard";
import PrebuiltFilterBar from "@/components/PrebuiltFilterBar";
import BudgetPulldown from "@/components/BudgetPulldown";
import { getPrebuilts } from "@/lib/prebuilts-api";
import { str } from "@/lib/utils";
import { buildPageUrl, DEFAULT_SORT } from "@/lib/constants";
import { hasQueryParams } from "@/lib/seo";

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  return {
    title: "Pre-Built Gaming PCs in Pakistan",
    description: "Browse pre-built gaming PCs from Pakistani retailers. Filter by CPU, GPU, price and more.",
    alternates: { canonical: "/prebuilts" },
    // Sorted, paged, filtered and searched variants duplicate the clean page.
    ...(hasQueryParams(params) && { robots: { index: false, follow: true } }),
  };
}

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
        <div className="catalog-failed">
          <p className="catalog-failed-title">
            {"// SEARCH FAILED"}
          </p>
          <p className="catalog-failed-text">
            Couldn&apos;t reach the server. Reload to try again.
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="pb-empty">
          {"// NO PREBUILTS FOUND"}
        </div>
      ) : (
        <div className="pb-browser-grid">
          {items.map(p => <PrebuiltCard key={p.id} prebuilt={p} />)}
        </div>
      )}

      {!failed && (hasPrev || hasNext) && (
        <div className="pb-pager">
          <Link prefetch={false}
            href={hasPrev ? pageUrl(offset - LIMIT) : "#"}
            className={hasPrev ? "pb-pager-btn" : "pb-pager-btn pb-pager-btn--off"}
          >
            <span className="skew-label">← Prev</span>
          </Link>

          <span className="pb-pager-count">
            <span className="skew-label-6">
              {page} / {pages}
            </span>
          </span>

          <Link prefetch={false}
            href={hasNext ? pageUrl(offset + LIMIT) : "#"}
            className={hasNext ? "pb-pager-btn pb-pager-btn--next" : "pb-pager-btn pb-pager-btn--off"}
          >
            <span className="skew-label">Next →</span>
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
        <PrebuiltFilterBar pulldown={<Suspense fallback={null}><BudgetPulldown /></Suspense>} />
      </Suspense>

      <main className="pb-browser-wrapper">
        <div className="pb-browser-head">
          <h1 className="page-title">
            Pre-Built PCs
          </h1>
        </div>

        <Suspense fallback={
          <div className="pb-empty pb-empty--loading">
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
