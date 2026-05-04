import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
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
