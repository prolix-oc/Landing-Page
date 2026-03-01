'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { MeshGradient } from '@mesh-gradient/react';

type ColorTuple = [string, string, string, string];

// Route-based color themes — 4 hex colors per route for the mesh gradient
const routeThemes: Record<string, ColorTuple> = {
  '/': ['#9333ea', '#06b6d4', '#3b82f6', '#6d28d9'],
  '/character-cards': ['#06b6d4', '#9333ea', '#3b82f6', '#0891b2'],
  '/world-books': ['#06b6d4', '#9333ea', '#3b82f6', '#0891b2'],
  '/chat-presets': ['#06b6d4', '#9333ea', '#3b82f6', '#1e40af'],
  '/lucid-loom': ['#9333ea', '#06b6d4', '#ec4899', '#7c3aed'],
  '/extensions': ['#ea580c', '#d97706', '#dc2626', '#c2410c'],
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
      style={{ isolation: 'isolate', contain: 'paint' }}
    >
      <MeshGradient
        className="w-full h-full"
        options={{
          colors,
          animationSpeed: 0.4,
          pauseOnOutsideViewport: true,
        }}
        isPaused={isPaused}
      />
    </div>
  );
}
