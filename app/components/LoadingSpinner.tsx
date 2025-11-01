'use client';

import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export default function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  const sizes = {
    sm: { outer: 'w-8 h-8', inner: 'w-2 h-2', border: 'border-2' },
    md: { outer: 'w-16 h-16', inner: 'w-3 h-3', border: 'border-4' },
    lg: { outer: 'w-24 h-24', inner: 'w-4 h-4', border: 'border-[6px]' }
  };

  const { outer, inner, border } = sizes[size];

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        {/* Outer rotating ring */}
        <motion.div
          className={`${outer} ${border} border-blue-500/30 border-t-blue-500 rounded-full`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Inner pulsing dot */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className={`${inner} bg-blue-400 rounded-full shadow-lg shadow-blue-400/50`} />
        </motion.div>
      </div>
      
      {message && (
        <motion.p
          className="mt-4 text-lg text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}
