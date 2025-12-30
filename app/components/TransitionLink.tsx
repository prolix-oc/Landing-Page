'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode, useCallback } from 'react';

interface TransitionLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function TransitionLink({ href, children, className = '', style }: TransitionLinkProps) {
  const router = useRouter();

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    // Immediate visual feedback
    document.body.classList.add('page-transitioning');

    // Navigate immediately (no setTimeout, no startTransition)
    router.push(href);
  }, [href, router]);

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={className}
      style={style}
      prefetch={true}
    >
      {children}
    </Link>
  );
}
