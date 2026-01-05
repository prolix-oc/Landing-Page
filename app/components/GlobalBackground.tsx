'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

// Theme configuration with RGB values for gradient manipulation
interface OrbTheme {
  color: string; // RGB format: "r, g, b"
  opacity: number;
}

interface ThemeConfig {
  orb1: OrbTheme;
  orb2: OrbTheme;
  orb3: OrbTheme;
}

// Route-based color themes using RGB values
const routeThemes: Record<string, ThemeConfig> = {
  '/': {
    orb1: { color: '147, 51, 234', opacity: 0.30 },  // purple-600
    orb2: { color: '6, 182, 212', opacity: 0.25 },   // cyan-600
    orb3: { color: '59, 130, 246', opacity: 0.25 },  // blue-600
  },
  '/character-cards': {
    orb1: { color: '6, 182, 212', opacity: 0.25 },   // cyan-600
    orb2: { color: '147, 51, 234', opacity: 0.20 },  // purple-600
    orb3: { color: '59, 130, 246', opacity: 0.20 },  // blue-600
  },
  '/world-books': {
    orb1: { color: '6, 182, 212', opacity: 0.25 },   // cyan-600
    orb2: { color: '147, 51, 234', opacity: 0.20 },  // purple-600
    orb3: { color: '59, 130, 246', opacity: 0.20 },  // blue-600
  },
  '/chat-presets': {
    orb1: { color: '6, 182, 212', opacity: 0.20 },   // cyan-600
    orb2: { color: '147, 51, 234', opacity: 0.20 },  // purple-600
    orb3: { color: '59, 130, 246', opacity: 0.15 },  // blue-600
  },
  '/lucid-loom': {
    orb1: { color: '147, 51, 234', opacity: 0.25 },  // purple-600
    orb2: { color: '6, 182, 212', opacity: 0.20 },   // cyan-500
    orb3: { color: '236, 72, 153', opacity: 0.15 },  // pink-500
  },
  '/extensions': {
    orb1: { color: '234, 88, 12', opacity: 0.25 },   // orange-600
    orb2: { color: '217, 119, 6', opacity: 0.20 },   // amber-600
    orb3: { color: '220, 38, 38', opacity: 0.20 },   // red-600
  },
};

const defaultTheme = routeThemes['/'];

// Hook to detect page visibility for animation pausing
function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return isVisible;
}

// Hook to detect reduced motion preference
function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

interface OrbProps {
  theme: OrbTheme;
  size: number;
  position: string;
  animationClass: string;
  isPaused: boolean;
}

// Creates a radial gradient that simulates ~80px blur without runtime cost
function createBlurGradient(color: string, opacity: number): string {
  return `radial-gradient(
    circle,
    rgba(${color}, ${opacity}) 0%,
    rgba(${color}, ${opacity * 0.7}) 20%,
    rgba(${color}, ${opacity * 0.4}) 40%,
    rgba(${color}, ${opacity * 0.15}) 60%,
    rgba(${color}, ${opacity * 0.05}) 80%,
    rgba(${color}, 0) 100%
  )`;
}

function Orb({ theme, size, position, animationClass, isPaused }: OrbProps) {
  return (
    <div
      className={`absolute rounded-full ${position} ${animationClass}`}
      style={{
        width: size,
        height: size,
        background: createBlurGradient(theme.color, theme.opacity),
        // GPU compositing hints
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        willChange: 'transform',
        // Pause animation when tab not visible or user prefers reduced motion
        animationPlayState: isPaused ? 'paused' : 'running',
        // Smooth color transitions for route changes
        transition: 'background 1s ease-in-out',
      }}
    />
  );
}

export default function GlobalBackground() {
  const pathname = usePathname();
  const isPageVisible = usePageVisibility();
  const prefersReducedMotion = useReducedMotion();

  // Pause animations when tab is hidden OR user prefers reduced motion
  const isPaused = !isPageVisible || prefersReducedMotion;

  // Find matching theme - check for exact match first, then prefix match for dynamic routes
  const theme = routeThemes[pathname]
    || Object.entries(routeThemes).find(([route]) =>
        route !== '/' && pathname.startsWith(route)
      )?.[1]
    || defaultTheme;

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none -z-10"
      style={{
        isolation: 'isolate',
        contain: 'paint',
      }}
    >
      <Orb
        theme={theme.orb1}
        size={500}
        position="top-[10%] left-[10%]"
        animationClass="orb-1"
        isPaused={isPaused}
      />
      <Orb
        theme={theme.orb2}
        size={600}
        position="top-[50%] right-[5%]"
        animationClass="orb-2"
        isPaused={isPaused}
      />
      <Orb
        theme={theme.orb3}
        size={450}
        position="bottom-[5%] left-[25%]"
        animationClass="orb-3"
        isPaused={isPaused}
      />
    </div>
  );
}
