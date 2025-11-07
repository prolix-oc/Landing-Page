'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useNavigation } from '@/app/contexts/NavigationContext';
import { ReactNode } from 'react';

interface AnimatedLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  isBackLink?: boolean;
}

export default function AnimatedLink({ href, children, className = '', isBackLink = false }: AnimatedLinkProps) {
  const router = useRouter();
  const { setIsNavigating, setNavigationDirection } = useNavigation();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Only handle internal navigation
    if (href.startsWith('/') && !href.startsWith('//')) {
      e.preventDefault();
      
      // Set navigation direction based on whether this is a back link
      setNavigationDirection(isBackLink ? 'backward' : 'forward');
      setIsNavigating(true);
      
      // Small delay to allow animation to start
      setTimeout(() => {
        router.push(href);
      }, 100);
    }
  };

  return (
    <Link 
      href={href} 
      onClick={handleClick}
      className={className}
    >
      {children}
    </Link>
  );
}
