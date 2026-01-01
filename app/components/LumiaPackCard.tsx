'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import LazyImage from './LazyImage';
import { Users, ScrollText, Sparkles, Package } from 'lucide-react';
import type { LumiaPackSummary } from '@/lib/types/lumia-pack';

interface LumiaPackCardProps {
  pack: LumiaPackSummary;
  index?: number;
  animationsEnabled?: boolean;
}

const packTypeConfig = {
  lumia: {
    label: 'Lumia Pack',
    gradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
    bgGradient: 'from-rose-500/20 via-pink-500/15 to-fuchsia-500/10',
    icon: Users,
    iconColor: 'text-rose-400'
  },
  loom: {
    label: 'Loom Collection',
    gradient: 'from-violet-500 via-purple-500 to-indigo-500',
    bgGradient: 'from-violet-500/20 via-purple-500/15 to-indigo-500/10',
    icon: ScrollText,
    iconColor: 'text-violet-400'
  },
  mixed: {
    label: 'Mixed Pack',
    gradient: 'from-rose-500 via-purple-500 to-indigo-500',
    bgGradient: 'from-rose-500/20 via-purple-500/15 to-indigo-500/10',
    icon: Package,
    iconColor: 'text-purple-400'
  }
};

export default function LumiaPackCard({ pack, index = 0, animationsEnabled = true }: LumiaPackCardProps) {
  const config = packTypeConfig[pack.packType];
  const Icon = config.icon;
  const hasCover = !!pack.coverUrl;

  return (
    <motion.div
      initial={animationsEnabled ? { opacity: 0, y: 15 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={animationsEnabled ? {
        duration: 0.3,
        delay: index * 0.04,
        ease: [0.25, 0.1, 0.25, 1]
      } : { duration: 0 }}
    >
      <Link
        href={`/lumia-dlc/${pack.slug}`}
        className="group block relative bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.08] rounded-2xl overflow-hidden transition-all duration-300 hover:border-rose-500/40 hover:shadow-lg hover:shadow-rose-500/10 hover:-translate-y-1"
      >
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* Accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${config.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left z-10`} />

        {/* Cover Image or Gradient Placeholder */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {hasCover ? (
            <div className="w-full h-full transition-transform duration-400 group-hover:scale-105">
              <LazyImage
                src={pack.coverUrl!}
                alt={pack.packName}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            /* Gradient placeholder for Loom-only packs */
            <div className={`w-full h-full bg-gradient-to-br ${config.bgGradient} flex flex-col items-center justify-center gap-3 transition-transform duration-400 group-hover:scale-105`}>
              <div className={`p-4 rounded-2xl bg-white/5 border border-white/10`}>
                <Icon className={`w-10 h-10 ${config.iconColor}`} />
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                {config.label}
              </span>
            </div>
          )}

          {/* Pack Type Badge */}
          <div className="absolute top-3 left-3 z-10">
            <div className={`flex items-center gap-1.5 bg-gray-900/90 border border-gray-700/50 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-lg`}>
              <Icon className={`w-3 h-3 ${config.iconColor}`} />
              <span>{config.label}</span>
            </div>
          </div>

          {/* Item Count Badges */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
            {pack.lumiaCount > 0 && (
              <div className="flex items-center gap-1.5 bg-rose-600/90 text-white text-xs font-medium px-2 py-1 rounded-full shadow-lg border border-rose-500/50">
                <Users className="w-3 h-3" />
                <span>{pack.lumiaCount}</span>
              </div>
            )}
            {pack.loomCount > 0 && (
              <div className="flex items-center gap-1.5 bg-violet-600/90 text-white text-xs font-medium px-2 py-1 rounded-full shadow-lg border border-violet-500/50">
                <ScrollText className="w-3 h-3" />
                <span>{pack.loomCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card Info */}
        <div className="relative p-4">
          <h3
            className="text-base font-semibold text-white mb-1 truncate group-hover:text-rose-300 transition-colors"
            title={pack.packName}
          >
            {pack.packName}
          </h3>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="truncate">by {pack.packAuthor}</span>
            {pack.extrasCount > 0 && (
              <>
                <span className="text-gray-600">•</span>
                <span className="flex items-center gap-1 text-amber-500/80">
                  <Sparkles className="w-3 h-3" />
                  {pack.extrasCount} extra{pack.extrasCount !== 1 ? 's' : ''}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Shimmer effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
        </div>
      </Link>
    </motion.div>
  );
}
