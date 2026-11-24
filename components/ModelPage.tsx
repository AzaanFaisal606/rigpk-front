import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import ModelListings from "@/components/ModelListings";
import ModelPulldown from "@/components/ModelPulldown";
import { monthYear } from "@/lib/budgets";
import { getCategoryCatalogue } from "@/lib/model-data";
import {
  CATEGORY_LABEL,
  modelBySlug,
  modelDescription,
  modelFaqs,
  modelHeading,
  modelPath,
  modelTitle,
  partsForModel,
  seriesOf,
  siblings,
  summarizeModel,
  type ModelCategory,
  type ModelEntry,
} from "@/lib/models";
import { SITE_URL } from "@/lib/seo";
import { failOrRender } from "@/lib/keep-stale";

export async function modelMetadata(category: ModelCategory, slug: string): Promise<Metadata> {
  const e = modelBySlug(category, slug);
  if (!e) return {};
  const res = await getCategoryCatalogue(category);
  const summary = summarizeModel(res.ok ? partsForModel(res.items, e) : []);
  const title = modelTitle(e, summary, new Date());
  const description = modelDescription(e, summary);
  const url = modelPath(e);
  return {
    // Absolute: the brand suffix would push the price out of Google's
    // truncation window.
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
    // An out-of-stock page is thin; keep it out of the index until stock
    // returns, but let crawlers follow its sibling links.
    ...((!res.ok || summary.count === 0) && { robots: { index: false, follow: true } }),
  };
}

function SiblingLinks({ current }: { current: ModelEntry }) {
  return (
    <nav
      aria-label={`Other ${seriesOf(current).label} models`}
      className="landing-siblings landing-siblings--labelled"
    >
      <span className="landing-series">
        {seriesOf(current).label}
      </span>
      {siblings(current).map(m => (
        <Link prefetch={false}
          key={m.slug}
          href={modelPath(m)}
          className="landing-sibling"
        >
          <span className="skew-label">{m.label}</span>
        </Link>
      ))}
    </nav>
  );
}

/** One GPU or CPU model's prices across every store. Shared by /gpu/[model] and /cpu/[model]. */
export default async function ModelPage({ category, slug }: { category: ModelCategory; slug: string }) {
  const e = modelBySlug(category, slug);
  // proxy.ts and dynamicParams already keep unknown slugs out.
  if (!e) notFound();

  const res = await getCategoryCatalogue(category);
  const failed = !res.ok && failOrRender("Model page: parts catalogue fetch failed");
  const parts = res.ok ? partsForModel(res.items, e) : [];
  const summary = summarizeModel(parts);
  const now = new Date();
  const faqs = modelFaqs(e, summary, now);
  const path = modelPath(e);
  const categoryLabel = CATEGORY_LABEL[category];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "RigPK", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: categoryLabel, item: `${SITE_URL}/market/${category}` },
            { "@type": "ListItem", position: 3, name: e.label, item: `${SITE_URL}${path}` },
          ],
        }}
      />
      {summary.count > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Product",
            name: e.label,
            category: category === "gpu" ? "Graphics Card" : "Processor",
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "PKR",
              lowPrice: summary.min,
              highPrice: summary.max,
              offerCount: summary.count,
            },
          }}
        />
      )}
      {faqs.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map(f => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }}
        />
      )}

      <Navbar />

      {/* Header strip: breadcrumb, with the model pulldown hanging off it. */}
      <div className="landing-strip">
        <nav aria-label="Breadcrumb" className="crumb-bar landing-crumbs">
          <Link href="/">RIGPK</Link>
          <span>›</span>
          <Link prefetch={false} href={`/market/${category}`}>{categoryLabel}</Link>
          <span>›</span>
          <span className="crumb-here">{e.label}</span>
        </nav>
        <Suspense fallback={null}>
          <ModelPulldown activeSlug={`${category}/${e.slug}`} initialPath={[category, e.brand, e.series]} />
        </Suspense>
      </div>

      <main className="pb-browser-wrapper landing-main landing-main--fill">
        <h1 className="page-title">
          {modelHeading(e)}
        </h1>
        <p className="landing-kicker">
          Prices for {monthYear(now)}
        </p>

        {failed ? (
          <div className="catalog-failed">
            <p className="catalog-failed-title">
              {"// SEARCH FAILED"}
            </p>
            <p className="catalog-failed-text">
              Couldn&apos;t reach the server. Reload to try again.
            </p>
          </div>
        ) : (
          <>
            <SiblingLinks current={e} />

            <ModelListings parts={parts} label={e.label} seriesLabel={seriesOf(e).label} />

            {faqs.length > 0 && (
              <section
                aria-labelledby="model-faq"
                className="landing-faq"
              >
                <h2
                  id="model-faq"
                  className="landing-faq-title"
                >
                  FAQ · {e.label} price
                </h2>
                <div className="landing-faq-list">
                  {faqs.map(f => (
                    <div key={f.q} className="landing-faq-item">
                      <h3 className="landing-faq-q">
                        {f.q}
                      </h3>
                      <p className="landing-faq-a">{f.a}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
