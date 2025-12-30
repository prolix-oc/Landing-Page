'use client';

import { usePathname } from 'next/navigation';

// Route-based color themes for the floating orbs
const routeThemes: Record<string, { orb1: string; orb2: string; orb3: string }> = {
  '/': {
    orb1: 'bg-purple-600/30',
    orb2: 'bg-cyan-600/25',
    orb3: 'bg-blue-600/25',
  },
  '/character-cards': {
    orb1: 'bg-cyan-600/25',
    orb2: 'bg-purple-600/20',
    orb3: 'bg-blue-600/20',
  },
  '/world-books': {
    orb1: 'bg-cyan-600/25',
    orb2: 'bg-purple-600/20',
    orb3: 'bg-blue-600/20',
  },
  '/chat-presets': {
    orb1: 'bg-cyan-600/20',
    orb2: 'bg-purple-600/20',
    orb3: 'bg-blue-600/15',
  },
  '/lucid-loom': {
    orb1: 'bg-purple-600/25',
    orb2: 'bg-cyan-500/20',
    orb3: 'bg-pink-500/15',
  },
  '/extensions': {
    orb1: 'bg-orange-600/25',
    orb2: 'bg-amber-600/20',
    orb3: 'bg-red-600/20',
  },
};

// Default theme for unknown routes
const defaultTheme = routeThemes['/'];

export default function GlobalBackground() {
  const pathname = usePathname();

  // Find matching theme - check for exact match first, then prefix match for dynamic routes
  const theme = routeThemes[pathname]
    || Object.entries(routeThemes).find(([route]) =>
        route !== '/' && pathname.startsWith(route)
      )?.[1]
    || defaultTheme;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 blur-[80px]">
      <div
        className={`orb-1 absolute top-[10%] left-[10%] w-[500px] h-[500px] rounded-full ${theme.orb1}`}
      />
      <div
        className={`orb-2 absolute top-[50%] right-[5%] w-[600px] h-[600px] rounded-full ${theme.orb2}`}
      />
      <div
        className={`orb-3 absolute bottom-[5%] left-[25%] w-[450px] h-[450px] rounded-full ${theme.orb3}`}
      />
    </div>
  );
}
