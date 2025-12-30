'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode, useCallback, useTransition } from 'react';

interface TransitionLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function TransitionLink({ href, children, className = '', style }: TransitionLinkProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    // Don't handle if modifier keys are pressed
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;

    e.preventDefault();

    // Remove back-transition class (forward navigation)
    document.documentElement.classList.remove('back-transition');

    // Use View Transitions API if available
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        return new Promise<void>((resolve) => {
          startTransition(() => {
            router.push(href);
            setTimeout(resolve, 50);
          });
        });
      });
    } else {
      // Fallback for browsers without View Transitions
      document.body.classList.add('page-transitioning');
      startTransition(() => {
        router.push(href);
      });
    }
  }, [href, router]);

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={`${className} ${isPending ? 'opacity-70' : ''}`}
      style={style}
      prefetch={true}
    >
      {children}
    </Link>
  );
}
