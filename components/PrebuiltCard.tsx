"use client";

import Link from "next/link";
import PCThumb from "./PCThumb";
import type { Prebuilt } from "@/lib/prebuilts-api";

function truncate(s: string | undefined, n: number): string {
  if (!s) return "—";
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function Chip({ label }: { label: string }) {
  return (
    <span className="pb-card-chip">
      {label}
    </span>
  );
}

interface Props {
  prebuilt: Prebuilt;
}

export default function PrebuiltCard({ prebuilt }: Props) {
  const c = prebuilt.components;

  return (
    <Link prefetch={false}
      href={`/prebuilts/${prebuilt.id}`}
      className="pb-card"
    >
      {/* Thumbnail */}
      <div className="pb-card-thumb">
        {/* Halftone bg */}
        <div aria-hidden className="pb-card-dots" />
        {prebuilt.thumbnail_url ? (
          <img
            src={prebuilt.thumbnail_url}
            referrerPolicy="no-referrer"
            alt={prebuilt.name}
            width={320}
            height={240}
            loading="lazy"
            decoding="async"
            className="pb-card-img"
          />
        ) : (
          <div className="pb-card-pc">
            <PCThumb scale={0.85} />
          </div>
        )}
        {/* Source label */}
        <div className="corner-tag">
          {prebuilt.source}
        </div>
      </div>

      {/* Content */}
      <div className="pb-card-body">
        {/* Name */}
        <div className="pb-card-name">
          {prebuilt.name}
        </div>

        {/* Component chips */}
        {c && (
          <div className="pb-card-chips">
            {c.cpu      && <Chip label={truncate(c.cpu, 30)} />}
            {c.gpu      && <Chip label={truncate(c.gpu, 30)} />}
            {c.ram      && <Chip label={truncate(c.ram, 30)} />}
            {c.storage  && <Chip label={truncate(c.storage, 30)} />}
          </div>
        )}

        {/* Spacer */}
        <div className="pb-card-spacer" />

        {/* Price */}
        <div className="pb-card-price">
          {prebuilt.price_pkr
            ? `Rs ${prebuilt.price_pkr.toLocaleString("en-PK")}`
            : "—"}
        </div>

        {/* CTA — the whole card is the link (L46); this is now decorative */}
        <span className="pb-card-cta">
          <span className="skew-label">
            View specs →
          </span>
        </span>
      </div>
    </Link>
  );
}
