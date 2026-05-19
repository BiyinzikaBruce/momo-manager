import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],

  turbopack: {},

  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
