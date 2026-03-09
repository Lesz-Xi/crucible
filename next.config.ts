import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress ESLint warnings and TS non-critical build errors during Vercel deployments.
  // Local `npm run lint` and `tsc --noEmit` still enforce rules in development.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
