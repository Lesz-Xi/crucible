import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Using --no-turbo flag in dev script instead
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
