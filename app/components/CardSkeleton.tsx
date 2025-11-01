'use client';

import { motion } from 'framer-motion';

export default function CardSkeleton() {
  return (
    <div className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden">
      {/* Thumbnail Skeleton */}
      <div className="relative aspect-square bg-gray-900/50 overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800"
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
      
      {/* Card Info Skeleton */}
      <div className="p-6 space-y-3">
        {/* Title */}
        <div className="h-6 bg-gray-700/50 rounded animate-pulse" />
        
        {/* Metadata */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-24 bg-gray-700/50 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-700/50 rounded animate-pulse" />
        </div>
        
        {/* Button */}
        <div className="h-12 bg-gray-700/50 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
