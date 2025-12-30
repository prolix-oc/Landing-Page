'use client';

import { motion } from 'framer-motion';

export default function CardSkeleton() {
  return (
    <div className="group bg-gray-900/70 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Thumbnail Skeleton */}
      <div className="relative aspect-square bg-gray-900/50 overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900"
          animate={{
            x: ['-100%', '100%']
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
        {/* Badge Skeletons */}
        <div className="absolute top-3 left-3 w-16 h-6 bg-gray-800/70 rounded-full animate-pulse" />
        <div className="absolute top-3 right-3 w-12 h-6 bg-gray-800/70 rounded-full animate-pulse" />
      </div>
      
      {/* Card Info Skeleton */}
      <div className="p-5 space-y-4">
        {/* Title */}
        <div className="h-7 bg-gray-800 rounded-lg animate-pulse w-3/4" />
        
        {/* Metadata */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-20 bg-gray-800 rounded animate-pulse" />
          <div className="w-1 h-1 rounded-full bg-gray-800 animate-pulse" />
          <div className="h-4 w-14 bg-gray-800 rounded animate-pulse" />
        </div>
        
        {/* Button */}
        <div className="h-10 bg-gray-800 rounded-xl animate-pulse w-full mt-2" />
      </div>
    </div>
  );
}
