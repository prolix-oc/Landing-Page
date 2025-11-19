'use client';

import Link from 'next/link';
import { useNavigation } from '@/app/contexts/NavigationContext';
import { ReactNode } from 'react';

interface AnimatedLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  isBackLink?: boolean;
  style?: React.CSSProperties;
}

export default function AnimatedLink({ href, children, className = '', isBackLink = false, style }: AnimatedLinkProps) {
  const { setNavigationDirection, setIsNavigating } = useNavigation();

  const handleClick = () => {
    // Set navigation direction
    setNavigationDirection(isBackLink ? 'backward' : 'forward');
    // We don't need to block navigation or set isNavigating since we rely on Next.js native transitions
    // and the global template.tsx animation.
  };

  return (
    <Link 
      href={href} 
      onClick={handleClick}
      className={className}
      style={style}
      prefetch={true} // Explicitly enable prefetching
    >
      {children}
    </Link>
  );
}
