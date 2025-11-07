'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from '@/app/contexts/NavigationContext';

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const { isNavigating, navigationDirection } = useNavigation();

  const variants = {
    enter: (direction: 'forward' | 'backward') => ({
      x: direction === 'forward' ? 20 : -20,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 },
      },
    },
    exit: (direction: 'forward' | 'backward') => ({
      x: direction === 'forward' ? -20 : 20,
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    }),
  };

  return (
    <AnimatePresence mode="wait" custom={navigationDirection}>
      <motion.div
        key={typeof window !== 'undefined' ? window.location.pathname : '/'}
        custom={navigationDirection}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        style={{ position: 'relative', width: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
