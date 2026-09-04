import type { NextConfig } from "next";

const API = "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
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
