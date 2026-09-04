import path from "node:path";
import type { NextConfig } from "next";

function apiBase(): string {
  const raw = process.env.TRADENUM_API_URL?.trim() || "http://127.0.0.1:8000";
  return raw.replace(/\/+$/, "");
}

const API = apiBase();

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, ".."),
  async rewrites() {
    return [
      { source: "/api/state", destination: `${API}/api/state` },
      { source: "/api/health", destination: `${API}/api/health` },
      { source: "/api/tickets/:path*", destination: `${API}/api/tickets/:path*` },
      { source: "/api/scan", destination: `${API}/api/scan` },
      { source: "/api/supervise", destination: `${API}/api/supervise` },
      { source: "/api/chart/:path*", destination: `${API}/api/chart/:path*` },
    ];
  },
};

export default nextConfig;
