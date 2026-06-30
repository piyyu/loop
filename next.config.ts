import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pg"],
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.scdn.co",
      },
      {
        protocol: "https",
        hostname: "*.scdn.co",
      },
      {
        protocol: "https",
        hostname: "mosaic.scdn.co",
      },
      {
        protocol: "https",
        hostname: "c.saavncdn.com",
      },
      {
        protocol: "https",
        hostname: "*.saavncdn.com",
      },
    ],
  },
};

export default nextConfig;
