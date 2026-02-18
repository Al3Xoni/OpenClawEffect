import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        os: false,
        path: false,
        crypto: false, 
        stream: false,
      };
    }
    return config;
  },
  images: {
    domains: [],
  },
};

export default nextConfig;