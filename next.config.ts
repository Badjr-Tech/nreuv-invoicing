import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["@neondatabase/serverless", "uuid"],
  experimental: {
    serverActions: {
      // Allow payroll screenshot uploads (default is 1 MB, which rejects most images)
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
