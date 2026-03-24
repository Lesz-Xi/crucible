/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pyodide'],
  webpack: (config, { isServer }) => {
    // Exclude pyodide from client-side bundles
    if (!isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'pyodide': 'commonjs pyodide'
      });
    }
    return config;
  },
};

export default nextConfig;
