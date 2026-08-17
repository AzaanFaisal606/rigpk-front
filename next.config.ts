import type { NextConfig } from "next";

// The API origin the browser is allowed to talk to — same value `lib/api.ts`
// uses for every fetch. Falls back to local dev like that module does.
const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// M-5: no security headers existed at all. `script-src`/`style-src` need
// 'unsafe-inline' because Next injects an inline bootstrap script and this
// app uses inline `style` props throughout — tighten to a nonce once Next 16
// nonce support is confirmed. `img-src https:` covers the ~11 retailer
// thumbnail hosts (see next.config.ts remotePatterns / CLAUDE.md `SOURCES`)
// without hardcoding each one twice.
const CSP = [
  "default-src 'self'",
  "img-src 'self' data: https:",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `connect-src 'self' ${API_ORIGIN}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
].join("; ");

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "zahcomputers.pk" },
      { protocol: "https", hostname: "www.zahcomputers.pk" },
      { protocol: "https", hostname: "czone.com.pk" },
      { protocol: "https", hostname: "www.czone.com.pk" },
      { protocol: "https", hostname: "junaidtech.pk" },
      { protocol: "https", hostname: "www.junaidtech.pk" },
      { protocol: "https", hostname: "amdhouse.pk" },
      { protocol: "https", hostname: "www.amdhouse.pk" },
      { protocol: "https", hostname: "rbtechngames.com" },
      { protocol: "https", hostname: "www.rbtechngames.com" },
      { protocol: "https", hostname: "techarc.pk" },
      { protocol: "https", hostname: "www.techarc.pk" },
      { protocol: "https", hostname: "pakbyte.pk" },
      { protocol: "https", hostname: "www.pakbyte.pk" },
      { protocol: "https", hostname: "zestrogaming.com" },
      { protocol: "https", hostname: "www.zestrogaming.com" },
      { protocol: "https", hostname: "redtech.pk" },
      { protocol: "https", hostname: "www.redtech.pk" },
      { protocol: "https", hostname: "techmatched.pk" },
      { protocol: "https", hostname: "www.techmatched.pk" },
    ],
  },
};

export default nextConfig;
