import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // bun:sqlite is auto-externalized by Next.js 16+ (PR #77616)
  serverExternalPackages: ['onnxruntime-node', 'sharp'],
  experimental: {
    // Enable View Transitions API for hardware-accelerated page transitions
    // Provides smooth, GPU-composited transitions between pages
    // Gracefully degrades on Safari/Firefox (instant navigation)
    viewTransition: false,
  },
};

export default nextConfig;
