'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode, useCallback, useTransition } from 'react';

interface ViewTransitionLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Optional: explicitly name this element for view transitions */
  viewTransitionName?: string;
  /** Set true if this is a "back" navigation (affects animation direction) */
  isBackLink?: boolean;
}

export default function ViewTransitionLink({
  href,
  children,
  className = '',
  style,
  viewTransitionName,
  isBackLink = false
}: ViewTransitionLinkProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    // Don't handle if modifier keys are pressed (open in new tab, etc.)
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;

    e.preventDefault();

    // Add direction class for CSS to know which way we're going
    if (isBackLink) {
      document.documentElement.classList.add('back-transition');
    } else {
      document.documentElement.classList.remove('back-transition');
    }

    // Check if View Transitions API is supported
    if (document.startViewTransition) {
      const transition = document.startViewTransition(() => {
        return new Promise<void>((resolve) => {
          startTransition(() => {
            router.push(href);
            // Give React time to update, then resolve
            setTimeout(resolve, 50);
          });
        });
      });

      // Clean up direction class after transition
      transition.finished.then(() => {
        document.documentElement.classList.remove('back-transition');
      });
    } else {
      // Fallback for browsers without View Transitions API
      document.body.classList.add('page-transitioning');
      startTransition(() => {
        router.push(href);
      });
    }
  }, [href, router, isBackLink]);

  const combinedStyle: React.CSSProperties = {
    ...style,
    ...(viewTransitionName ? { viewTransitionName } as React.CSSProperties : {})
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={`${className} ${isPending ? 'pointer-events-none' : ''}`}
      style={combinedStyle}
      prefetch={true}
    >
      {children}
    </Link>
  );
}
