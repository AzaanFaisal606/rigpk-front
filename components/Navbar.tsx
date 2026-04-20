"use client";

import Link from "next/link";
import { Cpu } from "lucide-react";

export default function Navbar() {
  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        background: "rgba(244,244,245,0.88)",
        borderColor: "#d4d4d8",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-13 flex items-center justify-between" style={{ height: "52px" }}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="flex items-center justify-center w-7 h-7 rounded"
            style={{ background: "#7c3aed" }}
          >
            <Cpu size={14} color="#fff" />
          </div>
          <span
            className="font-bold tracking-tight"
            style={{ color: "#111112", fontSize: "0.95rem", letterSpacing: "-0.01em" }}
          >
            Pak<span style={{ color: "#7c3aed" }}>PC</span>
          </span>
          <span className="mono hidden sm:inline" style={{ color: "#a1a1aa" }}>
            / price tracker
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          <NavLink href="/market">Market</NavLink>
          <NavLink href="/build">Build PC</NavLink>
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
  disabled,
}: {
  href: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const base: React.CSSProperties = {
    color: "#71717a",
    fontSize: "0.82rem",
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    letterSpacing: "0.04em",
  };

  if (disabled) {
    return (
      <span
        className="relative px-3 py-1.5 rounded cursor-default group"
        style={base}
      >
        {children}
        <span
          className="absolute -top-0.5 -right-0.5 text-[9px] px-1 py-px rounded opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: "rgba(124,58,237,0.1)",
            color: "#7c3aed",
            border: "1px solid rgba(124,58,237,0.22)",
            fontFamily: "monospace",
            letterSpacing: "0.06em",
          }}
        >
          SOON
        </span>
      </span>
    );
  }
  return (
    <Link href={href} className="px-3 py-1.5 rounded transition-colors hover:text-[#111112]" style={base}>
      {children}
    </Link>
  );
}
