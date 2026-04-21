"use client";

import Link from "next/link";
import { Cpu } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
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
            Pak<span style={{ color: "#7c3aed" }}>PC</span>
          </span>
          <span
            className="hidden sm:inline"
            style={{
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              fontSize: "0.68rem",
              color: "#a1a1aa",
              letterSpacing: "0.04em",
            }}
          >
            / price tracker
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-2">
          <Link
            href="/market"
            style={{
              color: "#71717a",
              fontSize: "0.82rem",
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              letterSpacing: "0.04em",
              padding: "6px 12px",
              textDecoration: "none",
            }}
            className="hover:text-[#111112] transition-colors"
          >
            Market
          </Link>
          <BuildPCButton />
        </nav>
      </div>
    </header>
  );
}

function BuildPCButton() {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href="/build"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-block",
        padding: "6px 14px",
        background: hovered ? "#6d28d9" : "#7c3aed",
        color: "white",
        border: "2px solid #111112",
        boxShadow: "2px 2px 0 #111112",
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
      Build PC
    </Link>
  );
}
