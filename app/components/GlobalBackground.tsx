'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMeshGradient } from '@mesh-gradient/react';

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

const GRADIENT_OPTIONS = { animationSpeed: 0.3 } as const;
const CROSSFADE_MS = 1000;

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

// Individual gradient layer — imperative init via useMeshGradient
function GradientLayer({
  colors,
  isPaused,
  visible,
}: {
  colors: ColorTuple;
  isPaused: boolean;
  visible: boolean;
}) {
  const { instance } = useMeshGradient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initColors = useRef(colors);

  // Init once
  useEffect(() => {
    if (!instance || !canvasRef.current) return;
    instance.init(canvasRef.current, {
      colors: initColors.current,
      ...GRADIENT_OPTIONS,
    });
  }, [instance]);

  // Update colors without the library's fade-through-black transition
  useEffect(() => {
    if (!instance?.isInitialized) return;
    instance.update({ colors, transition: false });
  }, [instance, colors]);

  // Play/pause
  useEffect(() => {
    if (!instance?.isInitialized) return;
    if (isPaused) instance.pause();
    else instance.play();
  }, [instance, isPaused]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity ${CROSSFADE_MS}ms ease-in-out`,
      }}
    />
  );
}

export default function GlobalBackground() {
  const pathname = usePathname();
  const isPageVisible = usePageVisibility();
  const prefersReducedMotion = useReducedMotion();
  const isPaused = !isPageVisible || prefersReducedMotion;

  const colors = useMemo(() => resolveColors(pathname), [pathname]);

  // Track which layer (A or B) is currently visible
  const [activeLayer, setActiveLayer] = useState<'a' | 'b'>('a');
  const [colorsA, setColorsA] = useState<ColorTuple>(colors);
  const [colorsB, setColorsB] = useState<ColorTuple>(colors);
  const isFirstRender = useRef(true);

  // On color change: push new colors to the inactive layer, then flip visibility
  const prevColors = useRef(colors);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (prevColors.current === colors) return;
    prevColors.current = colors;

    if (activeLayer === 'a') {
      setColorsB(colors);
      // Small delay so the inactive canvas renders the new colors before we fade to it
      requestAnimationFrame(() => setActiveLayer('b'));
    } else {
      setColorsA(colors);
      requestAnimationFrame(() => setActiveLayer('a'));
    }
  }, [colors, activeLayer]);

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none -z-10"
      style={{
        isolation: 'isolate',
        contain: 'paint',
        opacity: 0.55,
        viewTransitionName: 'none',
      }}
    >
      <GradientLayer
        colors={colorsA}
        isPaused={isPaused}
        visible={activeLayer === 'a'}
      />
      <GradientLayer
        colors={colorsB}
        isPaused={isPaused}
        visible={activeLayer === 'b'}
      />
    </div>
  );
}
