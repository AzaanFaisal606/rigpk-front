"use client";

import Link from "next/link";
import { Cpu } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "var(--bg)",
        borderBottom: "2px solid #111112",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between" style={{ height: "52px" }}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div
            className="flex items-center justify-center w-7 h-7"
            style={{
              background: "#7c3aed",
              border: "2px solid #111112",
              boxShadow: "2px 2px 0 #111112",
            }}
          >
            <Cpu size={14} color="#fff" />
          </div>
          <span
            className="font-bold"
            style={{ color: "#111112", fontSize: "0.95rem", letterSpacing: "-0.01em" }}
          >
            Rig<span style={{ color: "#7c3aed" }}>PK</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-2">
          <NavButton href="/market" active={pathname === "/market"}>Market</NavButton>
          <NavButton href="/build" active={pathname === "/build"}>Build PC</NavButton>
        </nav>
      </div>
    </header>
  );
}

function NavButton({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);

  const bg = active
    ? hovered ? "#6d28d9" : "#7c3aed"
    : hovered ? "rgba(124,58,237,0.06)" : "white";

  const color = active ? "white" : "#111112";
  const border = "2px solid #111112";
  const shadow = "2px 2px 0 #111112";

  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-block",
        padding: "6px 14px",
        background: bg,
        color,
        border,
        boxShadow: shadow,
        transform: "skewX(-8deg)",
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        fontSize: "0.72rem",
        fontWeight: 800,
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        textDecoration: "none",
        transition: "background 0.1s",
      }}
    >
      {children}
    </Link>
  );
}
