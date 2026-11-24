import type { BuildState, SlotKey } from "@/app/build/page";
import { SLOT_LABELS } from "@/app/build/page";
import { QTY_ELIGIBLE_SLOTS } from "@/lib/types";

const ALL_SLOTS: SlotKey[] = [
  "cpu", "gpu", "ram", "motherboard",
  "psu", "case", "ssd", "cooling",
];

const MIN_QTY = 1;
const MAX_QTY = 4;

interface Props {
  build: BuildState;
  onSlotClick: (slot: SlotKey) => void;
  onRemove: (slot: SlotKey) => void;
  onQtyChange: (slot: SlotKey, qty: number) => void;
}

function QtyStepper({
  slot,
  qty,
  onChange,
}: {
  slot: SlotKey;
  qty: number;
  onChange: (qty: number) => void;
}) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="qty-stepper"
    >
      <button
        type="button"
        className="comic-btn qty-step qty-step-btn"
        aria-label={`Decrease ${SLOT_LABELS[slot]} quantity`}
        disabled={qty <= MIN_QTY}
        onClick={() => onChange(Math.max(MIN_QTY, qty - 1))}
      >
        −
      </button>
      <span className="mono qty-value">
        {qty}
      </span>
      <button
        type="button"
        className="comic-btn qty-step qty-step-btn"
        aria-label={`Increase ${SLOT_LABELS[slot]} quantity`}
        disabled={qty >= MAX_QTY}
        onClick={() => onChange(Math.min(MAX_QTY, qty + 1))}
      >
        +
      </button>
    </div>
  );
}

export default function BuildCards({ build, onSlotClick, onRemove, onQtyChange }: Props) {
  return (
    <div className="build-cards-grid">
      {ALL_SLOTS.map((slot) => {
        const entry = build[slot];
        const part = entry?.part;
        const qty = entry?.qty ?? 1;
        const selected = entry != null;
        const isDelisted = part != null && (
          (part as { is_active?: boolean }).is_active === false || part.price_pkr == null
        );
        const priceAtShare = (part as { price_at_share?: number | null } | undefined)?.price_at_share;
        const priceChanged =
          priceAtShare != null && part?.price_pkr != null && priceAtShare !== part.price_pkr;
        const qtyEligible = QTY_ELIGIBLE_SLOTS.includes(slot);
        return (
          <div
            key={slot}
            className={`build-card${selected ? " build-card--selected" : ""}`}
          >
            <button
              onClick={() => onSlotClick(slot)}
              className="build-card-btn"
            >
              <p className="mono build-card-label">
                {SLOT_LABELS[slot]}
              </p>
              {selected && part ? (
                <>
                  <p className="font-semibold build-card-name">
                    {part.name}{qty > 1 ? ` \u00d7${qty}` : ""}
                  </p>
                  {isDelisted && (
                    <p className="mono build-card-unavailable">
                      Unavailable
                    </p>
                  )}
                  <p className="build-card-price">
                    {priceChanged
                      ? `shared at Rs\u00a0${priceAtShare!.toLocaleString("en-PK")} \u00b7 now Rs\u00a0${part.price_pkr!.toLocaleString("en-PK")}`
                      : part.price_pkr != null
                        ? "Rs\u00a0" + part.price_pkr.toLocaleString("en-PK")
                        : "Out of stock"}
                  </p>
                  <p className="build-card-source">
                    {part.source}
                  </p>
                </>
              ) : (
                <p className="build-card-empty">
                  + Select {SLOT_LABELS[slot]}
                </p>
              )}
            </button>

            {selected && qtyEligible && (
              <QtyStepper
                slot={slot}
                qty={qty}
                onChange={(next) => onQtyChange(slot, next)}
              />
            )}

            {selected && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(slot); }}
                title="Remove"
                className="build-card-remove"
              >
                ✕
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
