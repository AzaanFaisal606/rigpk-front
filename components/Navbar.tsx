"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { monoFont } from "@/lib/tokens";

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
      <div className="navbar-inner max-w-6xl mx-auto px-6 flex items-center justify-between" style={{ height: "52px" }}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div
            className="flex items-center justify-center w-7 h-7"
            style={{
              background: "var(--purple)",
              border: "2px solid #111112",
              boxShadow: "2px 2px 0 #111112",
              overflow: "hidden",
            }}
          >
            <img
              src="/logo.png"
              alt="RigPK"
              width={28}
              height={28}
              style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <span
            className="font-bold"
            style={{ color: "#111112", fontSize: "0.95rem", letterSpacing: "-0.01em" }}
          >
            Rig<span style={{ color: "var(--purple)" }}>PK</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-2">
          <NavButton href="/market" active={pathname === "/market"}>Market</NavButton>
          <NavButton href="/build" active={pathname === "/build"}>Build PC</NavButton>
          <NavButton href="/trends" active={pathname.startsWith("/trends")}>Trends</NavButton>
          <NavButton href="/prebuilts" active={pathname.startsWith("/prebuilts")}>Pre-Builts</NavButton>
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
    ? hovered ? "var(--purple-hover)" : "var(--purple)"
    : hovered ? "color-mix(in srgb, var(--purple) 6%, transparent)" : "white";

  const color = active ? "white" : "#111112";
  const border = "2px solid #111112";
  const shadow = "2px 2px 0 #111112";

  return (
    <Link
      href={href}
      className="navbar-nav-btn"
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
        fontFamily: monoFont,
        fontSize: "0.72rem",
        fontWeight: 800,
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        textDecoration: "none",
        transition: "background 0.1s",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Link>
  );
}
