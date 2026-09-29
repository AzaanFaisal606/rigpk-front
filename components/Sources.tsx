import { ExternalLink } from "lucide-react";
import AmbientLoops from "./AmbientLoops";
import { type Stats } from "@/lib/api";

const STORES = [
  { key: "czone.com.pk",       name: "CZone",           domain: "czone.com.pk",       tag: "FLAGSHIP" },
  { key: "zahcomputers.pk",    name: "Zah Computers",   domain: "zahcomputers.pk",    tag: "VERIFIED" },
  { key: "amdhouse.pk",        name: "AMD House",       domain: "amdhouse.pk",        tag: "VERIFIED" },
  { key: "rbtechngames.com",   name: "RB Tech & Games", domain: "rbtechngames.com",   tag: "ACTIVE" },
  { key: "junaidtech.pk",      name: "Junaid Tech",     domain: "junaidtech.pk",      tag: "ACTIVE" },
  { key: "techarc.pk",         name: "Tech Arc",        domain: "techarc.pk",         tag: "ACTIVE" },
  { key: "pakbyte.pk",         name: "PakByte",         domain: "www.pakbyte.pk",     tag: "ACTIVE" },
  { key: "redtech.pk",         name: "Red Tech",        domain: "redtech.pk",         tag: "NEW" },
  { key: "techmatched.pk",     name: "TechMatched",     domain: "techmatched.pk",     tag: "NEW" },
];

// The marquee track holds three copies of the row and slides left by one
// copy per loop, so the row never runs out on screens up to two copies
// wide. Only the first copy is exposed to assistive tech and the keyboard.
const COPIES = 3;

interface SourcesProps {
  stats: Stats | null;
}

export default function Sources({ stats }: SourcesProps) {
  const total = stats?.total_parts ?? 0;

  return (
    <section className="sources-band">
      <div className="sources-head">
        <h2 className="sources-title">Sourced from {STORES.length} retailers.</h2>
        {total > 0 && (
          <p className="sources-total">{total.toLocaleString()} parts in total</p>
        )}
      </div>

      <AmbientLoops className="sources-marquee" decorative={false}>
        <div className="sources-rail" aria-hidden />
        <div className="sources-track ambient-loop">
          {Array.from({ length: COPIES }, (_, copy) =>
            STORES.map((store, i) => (
              <StoreCard
                key={`${copy}-${store.key}`}
                store={store}
                index={i}
                count={stats?.by_source[store.key]}
                // Staleness comes from the backend's last recorded scrape outcome,
                // so a retailer flags itself when a scrape fails and clears itself
                // when one succeeds — nothing to update here by hand.
                stale={stats?.sources?.[store.key]?.stale ?? false}
                copy={copy > 0}
              />
            )),
          )}
        </div>
      </AmbientLoops>
    </section>
  );
}

function StoreCard({
  store,
  index,
  count,
  stale,
  copy,
}: {
  store: { key: string; name: string; domain: string; tag: string };
  index: number;
  count: number | undefined;
  stale: boolean;
  copy: boolean;
}) {
  return (
    <a
      href={`https://${store.domain}`}
      target="_blank"
      rel="noopener noreferrer"
      className={copy ? "src-card src-card--copy" : "src-card"}
      aria-hidden={copy || undefined}
      tabIndex={copy ? -1 : undefined}
    >
      {stale && (
        <span className="src-card-stale mono" aria-label="data is stale">
          Stale
        </span>
      )}

      <span className="src-card-bar mono">
        <span className="src-card-tag">{store.tag}</span>
        <span>{String(index + 1).padStart(2, "0")}/{String(STORES.length).padStart(2, "0")}</span>
      </span>

      <span className="src-card-body">
        <span className="src-card-name">{store.name}</span>
        <span className="src-card-domain mono">
          {store.domain}
          <ExternalLink size={11} aria-hidden />
        </span>

        <span className="src-card-count mono">
          {count !== undefined ? (
            <>
              {count.toLocaleString()}
              <span className="src-card-unit">parts</span>
            </>
          ) : (
            <span className="src-card-unit">— syncing</span>
          )}
        </span>
      </span>
    </a>
  );
}
