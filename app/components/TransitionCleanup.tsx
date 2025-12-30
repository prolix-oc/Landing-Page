'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function TransitionCleanup() {
  const pathname = usePathname();

  useEffect(() => {
    // Clean up transition class when route changes
    document.body.classList.remove('page-transitioning');
  }, [pathname]);

  return null;
}
