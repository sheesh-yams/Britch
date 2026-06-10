import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for @opennextjs/cloudflare
  // Do NOT use output: "export" — we need SSR on Workers

};

export default nextConfig;
