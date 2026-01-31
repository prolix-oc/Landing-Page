'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Reset on route change completion
  useEffect(() => {
    // Only reset if we were navigating
    if (isNavigating) {
      // Use setTimeout to avoid synchronous setState during render cycle warning
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams, isNavigating]);

  // Listen for navigation start via click events on links
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');

      if (link && link.href && !link.target && !link.download) {
        const url = new URL(link.href, window.location.origin);

        // Only trigger for internal navigation
        if (url.origin === window.location.origin && url.pathname !== pathname) {
          setIsNavigating(true);
          setProgress(0);

          // Animate progress
          let currentProgress = 0;
          const interval = setInterval(() => {
            currentProgress += Math.random() * 15;
            if (currentProgress > 90) {
              currentProgress = 90;
              clearInterval(interval);
            }
            setProgress(currentProgress);
          }, 100);

          // Store interval ID for cleanup
          (window as Window & { __navInterval?: NodeJS.Timeout }).__navInterval = interval;
        }
      }
    };

    // Clean up interval on route change
    const cleanup = () => {
      const interval = (window as Window & { __navInterval?: NodeJS.Timeout }).__navInterval;
      if (interval) clearInterval(interval);
    };

    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
      cleanup();
    };
  }, [pathname]);

  // Complete the progress bar when navigation finishes
  useEffect(() => {
    if (!isNavigating && progress > 0) {
      // Use a timeout to avoid synchronous setState inside effect if it causes issues
      // But here it's likely fine as it's a response to state change, not render loop.
      // However, to be safe and clear:
      const completeTimer = setTimeout(() => {
        setProgress(100);
      }, 0);
      
      const resetTimer = setTimeout(() => setProgress(0), 200);
      return () => {
        clearTimeout(completeTimer);
        clearTimeout(resetTimer);
      };
    }
  }, [isNavigating, progress]);

  if (!isNavigating && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      {/* Background track */}
      <div className="h-0.5 bg-white/5">
        {/* Progress bar */}
        <div
          className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 transition-all duration-200 ease-out"
          style={{
            width: `${progress}%`,
            opacity: progress === 100 ? 0 : 1,
            transition: progress === 100 ? 'opacity 0.2s, width 0.2s' : 'width 0.2s',
          }}
        />
      </div>

      {/* Glow effect */}
      <div
        className="h-1 bg-gradient-to-r from-cyan-500/50 via-purple-500/50 to-pink-500/50 blur-sm transition-all duration-200"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 0.8,
        }}
      />
    </div>
  );
}
