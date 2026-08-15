import { monoFont } from "@/lib/tokens";

// Plain — no fetching. Shown by Next.js while a route segment's data is
// still loading.
export default function Loading() {
  return (
    <div
      className="flex items-center justify-center"
      style={{ minHeight: "60vh", background: "var(--bg)" }}
    >
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
    </div>
  );
}
