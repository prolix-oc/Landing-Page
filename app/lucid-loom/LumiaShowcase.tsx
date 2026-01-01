'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import AnimatedLink from '@/app/components/AnimatedLink';
import type { LumiaPack, LumiaItem } from '@/lib/types/lumia-pack';
import { GENDER_PRONOUNS } from '@/lib/types/lumia-pack';
import { Sparkles, ExternalLink, User } from 'lucide-react';

interface LumiaWithPack extends LumiaItem {
  packName: string;
  packSlug: string;
}

// Shuffle array using Fisher-Yates
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate a consistent gradient based on character name
function getCharacterGradient(name: string): string {
  const gradients = [
    'from-rose-500/30 via-pink-500/20 to-fuchsia-500/30',
    'from-violet-500/30 via-purple-500/20 to-indigo-500/30',
    'from-cyan-500/30 via-teal-500/20 to-emerald-500/30',
    'from-amber-500/30 via-orange-500/20 to-red-500/30',
    'from-blue-500/30 via-indigo-500/20 to-violet-500/30',
    'from-emerald-500/30 via-teal-500/20 to-cyan-500/30',
    'from-fuchsia-500/30 via-pink-500/20 to-rose-500/30',
    'from-indigo-500/30 via-blue-500/20 to-cyan-500/30',
  ];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
}

// Get accent color based on gradient
function getAccentColor(name: string): string {
  const colors = [
    'text-rose-400',
    'text-violet-400',
    'text-cyan-400',
    'text-amber-400',
    'text-blue-400',
    'text-emerald-400',
    'text-fuchsia-400',
    'text-indigo-400',
  ];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

// Individual Lumia card with immersive design
function LumiaCard({
  lumia,
  index,
  isActive,
  onHover,
}: {
  lumia: LumiaWithPack;
  index: number;
  isActive: boolean;
  onHover: (index: number | null) => void;
}) {
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true, margin: '-50px' });

  // Staggered positioning for visual interest
  const positions = [
    { col: 'lg:col-span-2', row: 'lg:row-span-2', delay: 0 },
    { col: 'lg:col-span-1', row: 'lg:row-span-1', delay: 0.1 },
    { col: 'lg:col-span-1', row: 'lg:row-span-2', delay: 0.15 },
    { col: 'lg:col-span-2', row: 'lg:row-span-1', delay: 0.2 },
    { col: 'lg:col-span-1', row: 'lg:row-span-1', delay: 0.25 },
    { col: 'lg:col-span-1', row: 'lg:row-span-1', delay: 0.3 },
  ];

  const pos = positions[index % positions.length];
  const gradient = getCharacterGradient(lumia.lumiaName);
  const accentColor = getAccentColor(lumia.lumiaName);
  const isLarge = index === 0 || index === 2;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{
        duration: 0.7,
        delay: pos.delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={`relative group ${pos.col} ${pos.row}`}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
    >
      <AnimatedLink
        href={`/lumia-dlc/${lumia.packSlug}`}
        className="block relative h-full min-h-[280px] rounded-3xl overflow-hidden"
      >
        {/* Background gradient atmosphere */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-all duration-700 ${
            isActive ? 'opacity-100 scale-105' : 'opacity-60'
          }`}
        />

        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Glassmorphic card container */}
        <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-md border border-white/[0.08] rounded-3xl transition-all duration-500 group-hover:border-white/[0.15] group-hover:bg-white/[0.06]" />

        {/* Avatar area */}
        <div className="relative h-full p-5 flex flex-col">
          {/* Avatar image or placeholder */}
          <div
            className={`relative flex-1 rounded-2xl overflow-hidden mb-4 ${
              isLarge ? 'min-h-[200px]' : 'min-h-[120px]'
            }`}
          >
            {lumia.avatarUrl ? (
              <>
                <motion.img
                  src={lumia.avatarUrl}
                  alt={lumia.lumiaName}
                  className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700"
                  style={{
                    transform: isActive ? 'scale(1.05)' : 'scale(1)',
                    objectPosition: 'center 15%',
                  }}
                />
                {/* Subtle vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-white/[0.03]">
                <User className="w-16 h-16 text-white/20" />
              </div>
            )}

            {/* Pronouns badge */}
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
              <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">
                {GENDER_PRONOUNS[lumia.genderIdentity]}
              </span>
            </div>
          </div>

          {/* Character info */}
          <div className="relative">
            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-white/90 transition-colors">
              {lumia.lumiaName}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>by {lumia.authorName}</span>
            </div>

            {/* Pack attribution */}
            <div className="mt-3 pt-3 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">from</span>
                <span className={`text-xs font-medium ${accentColor} flex items-center gap-1`}>
                  {lumia.packName}
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hover glow effect */}
        <motion.div
          className={`absolute inset-0 rounded-3xl pointer-events-none transition-opacity duration-500 ${
            isActive ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            boxShadow: '0 0 60px 10px rgba(168, 85, 247, 0.15)',
          }}
        />
      </AnimatedLink>
    </motion.div>
  );
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className={`relative rounded-3xl overflow-hidden animate-pulse ${
            i === 0 ? 'lg:col-span-2 lg:row-span-2' : ''
          } ${i === 2 ? 'lg:row-span-2' : ''} ${i === 3 ? 'lg:col-span-2' : ''}`}
        >
          <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-md border border-white/[0.08]" />
          <div className="relative min-h-[280px] p-5 flex flex-col">
            <div className="flex-1 rounded-2xl bg-white/[0.05] mb-4" />
            <div className="h-6 w-2/3 rounded-lg bg-white/[0.05] mb-2" />
            <div className="h-4 w-1/2 rounded-lg bg-white/[0.03]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LumiaShowcase() {
  const [lumias, setLumias] = useState<LumiaWithPack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  useEffect(() => {
    async function fetchLumias() {
      try {
        // Fetch all packs
        const response = await fetch('/api/lumia-dlc');
        const data = await response.json();

        if (!data.success || !data.packs) {
          setIsLoading(false);
          return;
        }

        // Filter packs that have Lumia characters
        const lumiaPacks = data.packs.filter(
          (pack: { lumiaCount: number }) => pack.lumiaCount > 0
        ) as Array<{ slug: string; packName: string; lumiaCount: number }>;

        // Fetch details for each pack (limit to avoid too many requests)
        const packPromises = shuffleArray(lumiaPacks)
          .slice(0, 8)
          .map(async (pack) => {
            const packResponse = await fetch(`/api/lumia-dlc/${pack.slug}`);
            const packData = await packResponse.json();
            if (packData.success && packData.pack) {
              return {
                ...packData.pack,
                slug: pack.slug,
              } as LumiaPack & { slug: string };
            }
            return null;
          });

        const packs = (await Promise.all(packPromises)).filter(Boolean) as (LumiaPack & {
          slug: string;
        })[];

        // Extract all Lumias with pack info
        const allLumias: LumiaWithPack[] = [];
        packs.forEach((pack) => {
          pack.lumiaItems
            .filter((item) => item.avatarUrl) // Only include Lumias with avatars
            .forEach((item) => {
              allLumias.push({
                ...item,
                packName: pack.packName,
                packSlug: pack.slug,
              });
            });
        });

        // Shuffle and take 6 random Lumias
        const selectedLumias = shuffleArray(allLumias).slice(0, 6);
        setLumias(selectedLumias);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch Lumias:', error);
        setIsLoading(false);
      }
    }

    fetchLumias();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-32 px-4 vt-exclude overflow-hidden">
      {/* Atmospheric background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-purple-950/10 to-gray-950" />

      {/* Floating orbs for depth */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-cyan-600/8 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-16"
        >
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-end">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                Community Creations
              </div>
              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[0.9]">
                Meet the
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
                  Lumias
                </span>
              </h2>
            </div>
            <div className="lg:pb-2">
              <p className="text-xl text-gray-400 leading-relaxed">
                Discover characters crafted by our community. Each Lumia brings a{' '}
                <span className="text-white">unique presence</span> to your creative journey—explore
                their worlds, their stories, and the packs that bring them to life.
              </p>
              <AnimatedLink
                href="/lumia-dlc"
                className="inline-flex items-center gap-2 mt-4 text-sm text-purple-400 hover:text-purple-300 transition-colors group"
              >
                Browse all DLC packs
                <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </AnimatedLink>
            </div>
          </div>
        </motion.div>

        {/* Lumia grid */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <LoadingSkeleton />
          ) : lumias.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 auto-rows-fr">
              {lumias.map((lumia, index) => (
                <LumiaCard
                  key={`${lumia.packSlug}-${lumia.lumiaName}`}
                  lumia={lumia}
                  index={index}
                  isActive={activeCard === index}
                  onHover={setActiveCard}
                />
              ))}
            </div>
          ) : (
            /* Fallback if no Lumias found */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
                <Sparkles className="w-10 h-10 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Lumias are coming</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                Check back soon to discover community-created characters for your stories.
              </p>
              <AnimatedLink
                href="/lumia-dlc"
                className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 transition-colors"
              >
                Explore DLC Packs
                <ExternalLink className="w-4 h-4" />
              </AnimatedLink>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
