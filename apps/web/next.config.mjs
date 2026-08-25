/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@shoppage/contracts',
    '@shoppage/kernel',
    '@shoppage/adapters',
    '@shoppage/eval',
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        sqlite: false,
        'node:sqlite': false,
      };
    }
    return config;
  },
};

export default nextConfig;
