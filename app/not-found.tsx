import Link from "next/link";
import { monoFont } from "@/lib/tokens";

// Plain — no fetching. Handles notFound() calls and any unmatched URL.
export default function NotFound() {
  return (
    <div
      className="flex flex-col items-center justify-center text-center px-6"
      style={{ minHeight: "60vh", background: "var(--bg)" }}
    >
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
            color: "var(--text-dim)",
            letterSpacing: "3px",
            textTransform: "uppercase",
          }}
        >
          {"// 404 NOT FOUND"}
        </p>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "12px" }}>
          Couldn&apos;t find that page.
        </p>
        <Link
          href="/"
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
            display: "inline-block",
            marginTop: "24px",
          }}
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
