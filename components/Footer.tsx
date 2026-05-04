import { monoFont } from "@/lib/tokens";

export default function Footer() {
  return (
    <footer
      className="px-6 py-5 text-center"
      style={{
        background: "var(--bg)",
        borderTop: "2px solid #111112",
        color: "var(--text-dim)",
        fontFamily: monoFont,
        fontSize: "0.65rem",
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
      }}
    >
      RigPK — prices updated regularly from Pakistani retailers
    </footer>
  );
}
