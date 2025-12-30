'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface AnimatedLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  isBackLink?: boolean;
  style?: React.CSSProperties;
}

export default function AnimatedLink({ href, children, className = '', isBackLink = false, style }: AnimatedLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      style={style}
      prefetch={true}
    >
      {children}
    </Link>
  );
}
