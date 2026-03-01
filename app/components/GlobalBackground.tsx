'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMeshGradient } from '@mesh-gradient/react';

type ColorTuple = [string, string, string, string];

// Route-based color themes — 4 deep-toned hex colors per route.
// Intentionally dark/muted; the wrapper opacity controls overall intensity.
const routeThemes: Record<string, ColorTuple> = {
  '/': ['#581c87', '#164e63', '#1e3a5f', '#3b0764'],
  '/character-cards': ['#164e63', '#581c87', '#1e3a5f', '#0e4a5c'],
  '/world-books': ['#164e63', '#581c87', '#1e3a5f', '#0e4a5c'],
  '/chat-presets': ['#164e63', '#581c87', '#1e3a5f', '#172554'],
  '/lucid-loom': ['#581c87', '#164e63', '#831843', '#4c1d95'],
  '/lumia-dlc': ['#581c87', '#164e63', '#831843', '#4c1d95'],
  '/extensions': ['#7c2d12', '#78350f', '#7f1d1d', '#6c2710'],
  '/posts': ['#581c87', '#1e3a5f', '#164e63', '#172554'],
};

const defaultColors = routeThemes['/'];

function resolveColors(pathname: string): ColorTuple {
  return (
    routeThemes[pathname]
    || Object.entries(routeThemes).find(
      ([route]) => route !== '/' && pathname.startsWith(route),
    )?.[1]
    || defaultColors
  );
}

function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handler = () => setIsVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
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
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

export default function GlobalBackground() {
  const pathname = usePathname();
  const isPageVisible = usePageVisibility();
  const prefersReducedMotion = useReducedMotion();
  const isPaused = !isPageVisible || prefersReducedMotion;

  const colors = useMemo(() => resolveColors(pathname), [pathname]);

  const { instance } = useMeshGradient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  // Init once — fade in wrapper after first paint to prevent white flash
  useEffect(() => {
    if (!instance || !canvasRef.current) return;
    instance.init(canvasRef.current, {
      colors,
      animationSpeed: 0.3,
    });
    // Let one frame paint before revealing
    requestAnimationFrame(() => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance]);

  // Update colors instantly on route change (no library transition = no fade-through-black)
  const prevColors = useRef(colors);
  useEffect(() => {
    if (!instance?.isInitialized) return;
    if (prevColors.current === colors) return;
    prevColors.current = colors;
    instance.update({ colors, transition: false });
  }, [instance, colors]);

  // Play / pause
  useEffect(() => {
    if (!instance?.isInitialized) return;
    if (isPaused) instance.pause();
    else instance.play();
  }, [instance, isPaused]);

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none -z-10"
      style={{
        isolation: 'isolate',
        contain: 'paint',
        opacity: ready ? 0.55 : 0,
        transition: 'opacity 0.6s ease-in-out',
        viewTransitionName: 'global-background',
      }}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
