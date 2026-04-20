import type { BuildState, SlotKey } from "@/app/build/page";
import { SLOT_LABELS } from "@/app/build/page";

const ALL_SLOTS: SlotKey[] = [
  "cpu", "gpu", "ram", "motherboard",
  "psu", "case", "ssd", "cooling",
];

interface Props {
  build: BuildState;
  onSlotClick: (slot: SlotKey) => void;
}

export default function BuildCards({ build, onSlotClick }: Props) {
  return (
    <div
      style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "14px",
      }}
    >
      {ALL_SLOTS.map((slot) => {
        const part = build[slot];
        const selected = part !== null;
        return (
          <button
            key={slot}
            onClick={() => onSlotClick(slot)}
            style={{
              border: selected
                ? "2px solid #7c3aed"
                : "2px dashed #d4d4d8",
              boxShadow: selected
                ? "3px 3px 0 #7c3aed"
                : "3px 3px 0 #d4d4d8",
              background: selected ? "var(--bg-card)" : "#fafafa",
              padding: "18px 20px",
              textAlign: "left",
              cursor: "pointer",
              transition: "background 0.12s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#ede9fe";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                selected ? "var(--bg-card)" : "#fafafa";
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
                  style={{ fontSize: "13px", color: "var(--text)", marginBottom: "4px", lineHeight: 1.3 }}
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
        );
      })}
    </div>
  );
}
