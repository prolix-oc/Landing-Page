'use client';

import { motion } from 'framer-motion';

export default function WorldBookSkeleton() {
  return (
    <div className="group bg-gray-900/70 border border-gray-800 rounded-2xl overflow-hidden p-6">
      <div className="space-y-4">
        {/* Icon and Title Row */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-800 animate-pulse flex-shrink-0" />
          <div className="h-7 bg-gray-800 rounded-lg animate-pulse w-3/4" />
        </div>
        
        {/* Metadata */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-20 bg-gray-800 rounded animate-pulse" />
          <div className="w-1 h-1 rounded-full bg-gray-800 animate-pulse" />
          <div className="h-4 w-14 bg-gray-800 rounded animate-pulse" />
        </div>
        
        {/* Buttons Row */}
        <div className="flex gap-2 pt-2">
          <div className="h-10 bg-gray-800 rounded-xl animate-pulse flex-1" />
          <div className="h-10 bg-gray-800 rounded-xl animate-pulse w-12" />
        </div>
      </div>
      
      {/* Shimmer Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
        animate={{
          x: ['-100%', '100%']
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
    </div>
  );
}
