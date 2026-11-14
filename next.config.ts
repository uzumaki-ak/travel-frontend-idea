import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // The WordPress site uses trailing slashes everywhere (/tours/x/); keep URLs identical for SEO.
  trailingSlash: true,
  poweredByHeader: false,
  partialPrefetching: true,
  images: {
    // AVIF first (smallest), WebP fallback. Source photos are max 975px wide,
    // so there is no point generating anything above 1920.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [400, 640, 828, 1080, 1280, 1920],
    imageSizes: [96, 160, 256, 384],
    qualities: [70],
  },
  turbopack: {
    // A stray package-lock.json higher up the disk must not be mistaken for the workspace root.
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
