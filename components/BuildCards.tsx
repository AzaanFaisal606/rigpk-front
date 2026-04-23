import type { BuildState, SlotKey } from "@/app/build/page";
import { SLOT_LABELS } from "@/app/build/page";

const ALL_SLOTS: SlotKey[] = [
  "cpu", "gpu", "ram", "motherboard",
  "psu", "case", "ssd", "cooling",
];

interface Props {
  build: BuildState;
  onSlotClick: (slot: SlotKey) => void;
  onRemove: (slot: SlotKey) => void;
  isMobile?: boolean;
}

export default function BuildCards({ build, onSlotClick, onRemove, isMobile }: Props) {
  return (
    <div
      style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: "14px",
      }}
    >
      {ALL_SLOTS.map((slot) => {
        const part = build[slot];
        const selected = part !== null;
        return (
          <div
            key={slot}
            style={{
              border: selected ? "2px solid #7c3aed" : "2px dashed #d4d4d8",
              boxShadow: selected ? "3px 3px 0 #7c3aed" : "3px 3px 0 #d4d4d8",
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
                (e.currentTarget as HTMLButtonElement).style.background = "#ede9fe";
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
                  color: selected ? "#7c3aed" : "var(--text-dim)",
                  marginBottom: "7px",
                }}
              >
                {SLOT_LABELS[slot]}
              </p>
              {selected ? (
                <>
                  <p
                    className="font-semibold"
                    style={{ fontSize: "13px", color: "var(--text)", marginBottom: "4px", lineHeight: 1.3, paddingRight: "28px" }}
                  >
                    {part!.name}
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--text-2)", fontWeight: 600 }}>
                    {part!.price_pkr != null
                      ? "Rs\u00a0" + part!.price_pkr.toLocaleString("en-PK")
                      : "Out of stock"}
                  </p>
                  <p style={{ fontSize: "9px", color: "var(--text-dim)", marginTop: "3px" }}>
                    {part!.source}
                  </p>
                </>
              ) : (
                <p style={{ fontSize: "13px", color: "var(--text-dim)", fontStyle: "italic" }}>
                  + Select {SLOT_LABELS[slot]}
                </p>
              )}
            </button>

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
