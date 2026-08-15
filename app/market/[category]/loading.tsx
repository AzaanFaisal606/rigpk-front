import Navbar from "@/components/Navbar";
import { monoFont } from "@/lib/tokens";

// Plain — no fetching.
export default function Loading() {
  return (
    <div className="flex flex-col flex-1" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="flex flex-col flex-1 items-center justify-center">
        <p
          style={{
            fontFamily: monoFont,
            fontSize: "0.75rem",
            fontWeight: 800,
            color: "var(--text-dim)",
            letterSpacing: "3px",
            textTransform: "uppercase",
          }}
        >
          {"// LOADING"}
        </p>
      </main>
    </div>
  );
}
