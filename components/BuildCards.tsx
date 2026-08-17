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
      style={{ display: "flex", alignItems: "center", gap: "6px", padding: "0 24px 16px" }}
    >
      <button
        type="button"
        className="comic-btn qty-step"
        aria-label={`Decrease ${SLOT_LABELS[slot]} quantity`}
        disabled={qty <= MIN_QTY}
        onClick={() => onChange(Math.max(MIN_QTY, qty - 1))}
        style={{
          width: "22px",
          height: "22px",
          border: "2px solid #111112",
          boxShadow: "2px 2px 0 #111112",
          background: "white",
          fontFamily: "var(--mono)",
          fontWeight: 800,
          fontSize: "12px",
          lineHeight: 1,
          cursor: qty <= MIN_QTY ? "not-allowed" : "pointer",
          opacity: qty <= MIN_QTY ? 0.4 : 1,
        }}
      >
        −
      </button>
      <span
        className="mono"
        style={{ minWidth: "16px", textAlign: "center", fontSize: "11px", fontWeight: 800 }}
      >
        {qty}
      </span>
      <button
        type="button"
        className="comic-btn qty-step"
        aria-label={`Increase ${SLOT_LABELS[slot]} quantity`}
        disabled={qty >= MAX_QTY}
        onClick={() => onChange(Math.min(MAX_QTY, qty + 1))}
        style={{
          width: "22px",
          height: "22px",
          border: "2px solid #111112",
          boxShadow: "2px 2px 0 #111112",
          background: "white",
          fontFamily: "var(--mono)",
          fontWeight: 800,
          fontSize: "12px",
          lineHeight: 1,
          cursor: qty >= MAX_QTY ? "not-allowed" : "pointer",
          opacity: qty >= MAX_QTY ? 0.4 : 1,
        }}
      >
        +
      </button>
    </div>
  );
}

export default function BuildCards({ build, onSlotClick, onRemove, onQtyChange }: Props) {
  return (
    <div
      className="build-cards-grid"
      style={{
        flex: 1,
        display: "grid",
        gap: "14px",
      }}
    >
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
            style={{
              border: selected ? "2px solid var(--purple)" : "2px dashed #d4d4d8",
              boxShadow: selected ? "3px 3px 0 var(--purple)" : "3px 3px 0 #d4d4d8",
              background: selected ? "var(--bg-card)" : "#fafafa",
              position: "relative",
            }}
          >
            <button
              onClick={() => onSlotClick(slot)}
              style={{
                width: "100%",
                padding: "20px 24px",
                textAlign: "left",
                cursor: "pointer",
                background: "transparent",
                border: "none",
                transition: "background 0.12s",
                display: "block",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--purple-pale)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              <p
                className="mono"
                style={{
                  fontSize: "9px",
                  fontWeight: 800,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: selected ? "var(--purple)" : "var(--text-dim)",
                  marginBottom: "7px",
                }}
              >
                {SLOT_LABELS[slot]}
              </p>
              {selected && part ? (
                <>
                  <p
                    className="font-semibold"
                    style={{ fontSize: "13px", color: "var(--text)", marginBottom: "4px", lineHeight: 1.3, paddingRight: "28px" }}
                  >
                    {part.name}{qty > 1 ? ` \u00d7${qty}` : ""}
                  </p>
                  {isDelisted && (
                    <p
                      className="mono"
                      style={{ fontSize: "9px", fontWeight: 800, color: "#dc2626", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "2px" }}
                    >
                      Unavailable
                    </p>
                  )}
                  <p style={{ fontSize: "12px", color: "var(--text-2)", fontWeight: 600 }}>
                    {priceChanged
                      ? `shared at Rs\u00a0${priceAtShare!.toLocaleString("en-PK")} \u00b7 now Rs\u00a0${part.price_pkr!.toLocaleString("en-PK")}`
                      : part.price_pkr != null
                        ? "Rs\u00a0" + part.price_pkr.toLocaleString("en-PK")
                        : "Out of stock"}
                  </p>
                  <p style={{ fontSize: "9px", color: "var(--text-dim)", marginTop: "3px" }}>
                    {part.source}
                  </p>
                </>
              ) : (
                <p style={{ fontSize: "13px", color: "var(--text-dim)", fontStyle: "italic" }}>
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
                style={{
                  position: "absolute", top: "10px", right: "10px",
                  background: "none", border: "none",
                  color: "var(--text-dim)", fontSize: "13px",
                  cursor: "pointer", lineHeight: 1, padding: "2px 4px",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-dim)"; }}
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
