import Link from "next/link";
import { BUDGETS } from "@/lib/budgets";
import type { BudgetBucket } from "@/lib/budget-data";
import { formatPkr } from "@/lib/seo";

interface Props {
  /** Null when the catalogue fetch failed — boxes still render as plain links. */
  buckets: BudgetBucket[] | null;
  /** Slug of the budget page currently shown, outlined in pale pink. */
  activeSlug?: string;
}

/**
 * One box per budget bucket, each a real link to /gaming-pc-under/<slug>.
 * Built for the maroon pulldown: maroon boxes, white text, pale-pink rules,
 * and a darker maroon well that backs the (transparent) thumbnails.
 */
export default function BudgetBoxes({ buckets, activeSlug }: Props) {
  return (
    <div className="budget-box-grid pulldown-grid">
      {BUDGETS.map(budget => {
        const bucket = buckets?.find(b => b.budget.slug === budget.slug);
        const active = budget.slug === activeSlug;
        return (
          <Link
            key={budget.slug}
            href={`/gaming-pc-under/${budget.slug}`}
            prefetch={false}
            className="budget-box pulldown-box"
            aria-current={active ? "page" : undefined}
            title={`Best gaming PC under ${budget.short.toLowerCase()} (${budget.lakh}) in Pakistan`}
          >
            <span className="pulldown-box-title">
              {"< "}{budget.short}
            </span>
            <span className="pulldown-box-well">
              {bucket?.thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={bucket.thumb}
                  alt={`Gaming PC under ${budget.short}`}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  className="pulldown-box-img"
                />
              ) : (
                <span className="pulldown-box-noimg">
                  {"// NO IMAGE"}
                </span>
              )}
            </span>
            <span className="pulldown-box-sub">
              {bucket ? `${bucket.count} PC${bucket.count === 1 ? "" : "S"}` : budget.lakh}
            </span>
            {/* Buckets are cumulative, so they all share the same cheapest PC —
                the top price is what tells them apart. */}
            {bucket?.maxPrice != null && (
              <span className="pulldown-box-meta">
                up to {formatPkr(bucket.maxPrice)}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
