import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PrebuiltCard from "@/components/PrebuiltCard";
import JsonLd from "@/components/JsonLd";
import BudgetBoxes from "@/components/BudgetBoxes";
import PulldownTab from "@/components/ui/PulldownTab";
import {
  BUDGETS,
  budgetBySlug,
  budgetDescription,
  budgetFaqs,
  budgetHeading,
  budgetTitle,
  monthYear,
  prebuiltsInBudget,
  summarizeBudget,
  type Budget,
} from "@/lib/budgets";
import { getBudgetBuckets, getBudgetCatalogue } from "@/lib/budget-data";
import { cleanPrebuiltName, SITE_URL } from "@/lib/seo";
import { failOrRender } from "@/lib/keep-stale";

// Static per budget, rebuilt after each scrape (ISR, lib/catalog-cache.ts):
// prebuilts only change then, and the backend sits on a cold-starting free
// tier, so these landing pages must not wait on it per request. The title's
// month can lag into a new month until the first scrape (Friday) refreshes it.
// The literal is CATALOG_REVALIDATE's backstop; Next reads segment config
// statically.
export const revalidate = 2592000;
// Unknown budgets 404. proxy.ts does the same before rendering, which is what
// guarantees a real 404 status (the root loading.tsx would otherwise stream
// the not-found UI with a 200).
export const dynamicParams = false;

// Past this many PCs the page links to the filtered /prebuilts browser for
// the rest rather than paginating (pagination would make the page dynamic).
const MAX_LISTED = 60;

export function generateStaticParams() {
  return BUDGETS.map(b => ({ budget: b.slug }));
}

interface PageProps {
  params: Promise<{ budget: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const budget = budgetBySlug((await params).budget);
  if (!budget) return {};
  const res = await getBudgetCatalogue();
  const summary = summarizeBudget(res.ok ? prebuiltsInBudget(res.items, budget.max) : []);
  const title = budgetTitle(budget, new Date());
  const description = budgetDescription(budget, summary);
  const url = `/gaming-pc-under/${budget.slug}`;
  return {
    // Absolute: the keyword-heavy title is already long, and the brand suffix
    // would push the month out of Google's truncation window.
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
  };
}

function SiblingLinks({ current }: { current: Budget }) {
  return (
    <nav aria-label="Other budgets" className="landing-siblings">
      {BUDGETS.map(b => {
        const active = b.slug === current.slug;
        return (
          <Link prefetch={false}
            key={b.slug}
            href={`/gaming-pc-under/${b.slug}`}
            aria-current={active ? "page" : undefined}
            className="landing-sibling"
          >
            <span className="skew-label">
              Under {b.short} · {b.lakh}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export default async function BudgetPage({ params }: PageProps) {
  const budget = budgetBySlug((await params).budget);
  // proxy.ts and dynamicParams already keep unknown slugs out.
  if (!budget) notFound();

  const [res, buckets] = await Promise.all([getBudgetCatalogue(), getBudgetBuckets()]);
  const failed = !res.ok && failOrRender("Budget page: prebuilt catalogue fetch failed");
  const all = res.ok ? prebuiltsInBudget(res.items, budget.max) : [];
  const listed = all.slice(0, MAX_LISTED);
  const summary = summarizeBudget(all);
  const faqs = budgetFaqs(budget, all, summary);
  const path = `/gaming-pc-under/${budget.slug}`;
  const heading = budgetHeading(budget);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "RigPK", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Pre-Built PCs", item: `${SITE_URL}/prebuilts` },
            { "@type": "ListItem", position: 3, name: `Gaming PC under ${budget.short}`, item: `${SITE_URL}${path}` },
          ],
        }}
      />
      {listed.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: heading,
            numberOfItems: listed.length,
            itemListElement: listed.map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${SITE_URL}/prebuilts/${p.id}`,
              name: cleanPrebuiltName(p.name),
            })),
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

      {/* Header strip: breadcrumb, with the budget pulldown hanging off it. */}
      <div className="landing-strip">
        <nav aria-label="Breadcrumb" className="crumb-bar landing-crumbs">
          <Link href="/">RIGPK</Link>
          <span>›</span>
          <Link prefetch={false} href="/prebuilts">PRE-BUILTS</Link>
          <span>›</span>
          <span className="crumb-here">UNDER {budget.short}</span>
        </nav>
        <PulldownTab label="PCs by budget" title="Gaming PCs by budget">
          <BudgetBoxes buckets={buckets} activeSlug={budget.slug} />
        </PulldownTab>
      </div>

      <main className="pb-browser-wrapper landing-main">
        <h1 className="page-title">
          {heading}
        </h1>
        <p className="landing-kicker">
          {budget.lakh} · Prices for {monthYear(new Date())}
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
            <SiblingLinks current={budget} />

            {listed.length === 0 ? (
              <div className="pb-empty">
                {"// NO PREBUILTS FOUND"}
              </div>
            ) : (
              <div className="pb-browser-grid">
                {listed.map(p => <PrebuiltCard key={p.id} prebuilt={p} />)}
              </div>
            )}

            {all.length > listed.length && (
              <p className="landing-more">
                <Link prefetch={false} href={`/prebuilts?max_price=${budget.max}`}>
                  See all {all.length} PCs under {budget.short} →
                </Link>
              </p>
            )}

            {faqs.length > 0 && (
              <section
                aria-labelledby="budget-faq"
                className="landing-faq"
              >
                <h2
                  id="budget-faq"
                  className="landing-faq-title"
                >
                  FAQ · Gaming PC under {budget.lakh}
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
