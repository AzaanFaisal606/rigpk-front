import Link from "next/link";
import { monoFont } from "@/lib/tokens";
import { BUDGETS } from "@/lib/budgets";

export default function Footer() {
  return (
    <footer
      className="px-6 py-5 text-center"
      style={{
        background: "var(--bg)",
        borderTop: "2px solid var(--ink)",
        color: "var(--text-dim)",
        fontFamily: monoFont,
        fontSize: "0.65rem",
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
      }}
    >
      <nav
        aria-label="Gaming PCs by budget"
        style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 16px", marginBottom: "10px" }}
      >
        {BUDGETS.map(b => (
          <Link
            key={b.slug}
            href={`/gaming-pc-under/${b.slug}`}
            prefetch={false}
            style={{ color: "var(--text-muted)", textDecoration: "none" }}
          >
            Gaming PC under {b.short}
          </Link>
        ))}
      </nav>
      RigPK — prices updated regularly from Pakistani retailers
    </footer>
  );
}
