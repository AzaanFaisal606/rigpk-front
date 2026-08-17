"use client";

import Navbar from "@/components/Navbar";
import { monoFont } from "@/lib/tokens";

// Kept deliberately plain — no fetching. An error page that fetches can fail
// twice.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col flex-1" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="flex flex-col flex-1 items-center justify-center text-center px-6">
        <div
          style={{
            border: "2px solid #111112",
            boxShadow: "6px 6px 0 #111112",
            background: "var(--bg-card)",
            padding: "40px 32px",
            maxWidth: "440px",
          }}
        >
          <p
            style={{
              fontFamily: monoFont,
              fontSize: "0.9rem",
              fontWeight: 900,
              color: "var(--purple)",
              letterSpacing: "3px",
              textTransform: "uppercase",
            }}
          >
            {"// SEARCH FAILED"}
          </p>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "12px" }}>
            Couldn&apos;t reach the server. Try again.
          </p>
          <button
            onClick={() => reset()}
            className="mono"
            style={{
              border: "2px solid #111112",
              boxShadow: "2px 2px 0 #111112",
              background: "var(--purple)",
              color: "white",
              padding: "8px 16px",
              fontSize: "0.65rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              transform: "skewX(-8deg)",
              cursor: "pointer",
              marginTop: "24px",
            }}
          >
            Try again
          </button>
        </div>
      </main>
    </div>
  );
}
