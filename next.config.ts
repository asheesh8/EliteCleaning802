import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Server Actions receive gallery uploads as base64 payloads.
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
