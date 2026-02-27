import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['bun:sqlite'],
  experimental: {
    // Enable View Transitions API for hardware-accelerated page transitions
    // Provides smooth, GPU-composited transitions between pages
    // Gracefully degrades on Safari/Firefox (instant navigation)
    viewTransition: true,
  },
};

export default nextConfig;
