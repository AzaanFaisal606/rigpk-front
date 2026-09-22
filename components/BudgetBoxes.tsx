import Link from "next/link";
import { BUDGETS } from "@/lib/budgets";
import type { BudgetBucket } from "@/lib/budget-data";
import { formatPkr } from "@/lib/seo";
import { monoFont } from "@/lib/tokens";

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
    <div className="budget-box-grid">
      {BUDGETS.map(budget => {
        const bucket = buckets?.find(b => b.budget.slug === budget.slug);
        const active = budget.slug === activeSlug;
        return (
          <Link
            key={budget.slug}
            href={`/gaming-pc-under/${budget.slug}`}
            prefetch={false}
            className="budget-box"
            aria-current={active ? "page" : undefined}
            title={`Best gaming PC under ${budget.short.toLowerCase()} (${budget.lakh}) in Pakistan`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
              gap: "8px",
              padding: "10px",
              border: active ? "2px solid var(--purple-pale)" : "2px solid #111112",
              boxShadow: "4px 4px 0 #111112",
              background: "var(--purple)",
              textDecoration: "none",
              color: "white",
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontFamily: monoFont,
                fontSize: "15px",
                fontWeight: 900,
                letterSpacing: "0.04em",
                color: "white",
              }}
            >
              {"< "}{budget.short}
            </span>
            <span
              style={{
                height: "96px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1.5px solid #111112",
                background: "var(--purple-hover)",
                overflow: "hidden",
              }}
            >
              {bucket?.thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={bucket.thumb}
                  alt={`Gaming PC under ${budget.short}`}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  style={{ maxHeight: "88px", maxWidth: "100%", objectFit: "contain" }}
                />
              ) : (
                <span style={{ fontFamily: monoFont, fontSize: "9px", color: "var(--purple-pale)", letterSpacing: "1px" }}>
                  {"// NO IMAGE"}
                </span>
              )}
            </span>
            <span style={{ fontFamily: monoFont, fontSize: "10px", fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase" }}>
              {bucket ? `${bucket.count} PC${bucket.count === 1 ? "" : "S"}` : budget.lakh}
            </span>
            {/* Buckets are cumulative, so they all share the same cheapest PC —
                the top price is what tells them apart. */}
            {bucket?.maxPrice != null && (
              <span
                style={{
                  fontFamily: monoFont,
                  fontSize: "9px",
                  fontWeight: 700,
                  color: "var(--purple-pale)",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                up to {formatPkr(bucket.maxPrice)}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
