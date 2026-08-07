import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Server Actions receive gallery uploads as base64 payloads.
    serverActions: { bodySizeLimit: "8mb" },
  },

  // The SQLite file is generated at build time by `build:standalone` and is
  // not imported by any module, so file tracing can't discover it on its
  // own. Without this the deploy builds green and then 500s at runtime.
  outputFileTracingIncludes: {
    "/**": ["./prisma/dev.db"],
  },

  // better-sqlite3 is a native addon; bundling it breaks the .node binding.
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
};

export default nextConfig;
