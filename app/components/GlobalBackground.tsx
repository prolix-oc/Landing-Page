'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { MeshGradient } from '@mesh-gradient/react';

type ColorTuple = [string, string, string, string];

// Route-based color themes — 4 deep-toned hex colors per route for the mesh gradient.
// These are intentionally dark/muted; the wrapper opacity controls overall intensity.
const routeThemes: Record<string, ColorTuple> = {
  '/': ['#581c87', '#164e63', '#1e3a5f', '#3b0764'],
  '/character-cards': ['#164e63', '#581c87', '#1e3a5f', '#0e4a5c'],
  '/world-books': ['#164e63', '#581c87', '#1e3a5f', '#0e4a5c'],
  '/chat-presets': ['#164e63', '#581c87', '#1e3a5f', '#172554'],
  '/lucid-loom': ['#581c87', '#164e63', '#831843', '#4c1d95'],
  '/extensions': ['#7c2d12', '#78350f', '#7f1d1d', '#6c2710'],
};

const defaultColors = routeThemes['/'];

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

function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

export default function GlobalBackground() {
  const pathname = usePathname();
  const isPageVisible = usePageVisibility();
  const prefersReducedMotion = useReducedMotion();

  const isPaused = !isPageVisible || prefersReducedMotion;

  const colors = useMemo(() => {
    return (
      routeThemes[pathname]
      || Object.entries(routeThemes).find(
        ([route]) => route !== '/' && pathname.startsWith(route),
      )?.[1]
      || defaultColors
    );
  }, [pathname]);

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none -z-10"
      style={{
        isolation: 'isolate',
        contain: 'paint',
        opacity: 0.55,
        // Exclude from View Transitions so the gradient persists across navigations
        viewTransitionName: 'none',
      }}
    >
      <MeshGradient
        className="w-full h-full"
        options={{
          colors,
          animationSpeed: 0.3,
          pauseOnOutsideViewport: true,
          transition: true,
          transitionDuration: 800,
        }}
        isPaused={isPaused}
      />
    </div>
  );
}
