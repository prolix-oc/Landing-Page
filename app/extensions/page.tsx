'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import AnimatedLink from '@/app/components/AnimatedLink';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import {
  ArrowLeft,
  Puzzle,
  ChevronRight,
  Github,
  Wrench,
  Sparkles,
  ExternalLink,
  Package
} from 'lucide-react';

interface Extension {
  id: string;
  name: string;
  description: string;
  repoUrl: string;
  thumbnail: string;
  category: string;
}

const CATEGORIES = [
  { id: 'prolix', name: "My Extensions", icon: Sparkles },
  { id: 'recommended', name: 'Recommended Extensions', icon: Package }
];

function ExtensionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('prolix');
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Track if initial page load is complete (to skip animations during View Transition)
  const hasMounted = useRef(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(false);

  useEffect(() => {
    // Enable animations after initial render completes
    const timer = setTimeout(() => {
      hasMounted.current = true;
      setAnimationsEnabled(true);
    }, 300); // Wait for View Transition to complete
    return () => clearTimeout(timer);
  }, []);

  // Check URL parameters on mount
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchExtensions() {
      try {
        const response = await fetch('/api/extensions');
        const data = await response.json();
        if (data.success) {
          setExtensions(data.extensions);
        }
      } catch (error) {
        console.error('Error fetching extensions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchExtensions();
  }, []);

  const handleCategoryChange = async (categoryId: string) => {
    if (categoryId !== selectedCategory) {
      setIsTransitioning(true);
      await new Promise(resolve => setTimeout(resolve, 150));
      setSelectedCategory(categoryId);
      router.push(`/extensions?category=${encodeURIComponent(categoryId)}`, { scroll: false });
      setIsTransitioning(false);
    }
  };

  const filteredExtensions = extensions.filter(ext => ext.category === selectedCategory);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Back Link - Fixed Pill Button */}
      <div
        className="fixed top-6 left-6 z-50"
      >
        <AnimatedLink
          href="/"
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/80 border border-white/10 text-gray-400 hover:text-orange-400 hover:bg-gray-800/90 hover:border-orange-500/30 transition-all"
          isBackLink
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Home</span>
        </AnimatedLink>
      </div>

      <div className="relative container mx-auto px-4 pt-20 sm:pt-24 pb-8 sm:pb-12">
        {/* Compact Hero Section */}
        <header className="text-center mb-8 sm:mb-10">
          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-3">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-500 to-red-500 animate-gradient bg-[length:200%_auto]">
              Extensions
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-5">
            Extend SillyTavern with powerful custom extensions
          </p>

          {/* Stats Row */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <Puzzle className="w-4 h-4 text-orange-400" />
              <span><strong className="text-white">{extensions.length}</strong> extensions</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-600" />
            <div className="flex items-center gap-2 text-gray-400">
              <Github className="w-4 h-4 text-amber-400" />
              <span><strong className="text-white">{CATEGORIES.length}</strong> categories</span>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="text-center text-gray-400 py-12">
            <LoadingSpinner message="Loading extensions..." />
          </div>
        ) : (
          /* Single Glass Container */
          <div className="relative">
            {/* Single backdrop-blur layer (md = 12px, optimized for Safari) */}
            <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/[0.05]" />

            {/* Content grid inside */}
            <div className="relative p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Categories Sidebar */}
                <div className="lg:col-span-1">
                  <div className="lg:sticky lg:top-24 space-y-3">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4 px-1">
                      <Wrench className="w-5 h-5 text-orange-400" />
                      Categories
                    </h2>

                    {CATEGORIES.map((category) => {
                      const IconComponent = category.icon;
                      return (
                        <button
                          key={category.id}
                          onClick={() => handleCategoryChange(category.id)}
                          className={`group w-full text-left px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden flex items-center justify-between hover:translate-x-1 active:scale-[0.98] ${
                            selectedCategory === category.id
                              ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/10 text-white border border-orange-500/30'
                              : 'bg-white/[0.03] text-gray-400 border border-white/[0.05] hover:bg-white/[0.06] hover:text-gray-200 hover:border-white/[0.1]'
                          }`}
                        >
                          <span className="flex items-center gap-3 font-medium">
                            <IconComponent className={`w-4 h-4 ${selectedCategory === category.id ? 'text-orange-400' : 'text-gray-500'}`} />
                            {category.name}
                          </span>
                          <ChevronRight className={`w-4 h-4 transition-all ${
                            selectedCategory === category.id ? 'text-orange-400 opacity-100' : 'opacity-0 group-hover:opacity-50'
                          }`} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Extensions Grid */}
                <div className="lg:col-span-3">
                  <AnimatePresence mode="wait">
                    {isTransitioning ? (
                      <motion.div
                        key="loading-state"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center text-gray-400 py-12"
                      >
                        <LoadingSpinner message="Loading extensions..." />
                      </motion.div>
                    ) : filteredExtensions.length === 0 ? (
                      <motion.div
                        key="empty-state"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-12 text-center"
                      >
                        <motion.div
                          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-4"
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                        >
                          <Wrench className="w-8 h-8 text-orange-400" />
                        </motion.div>
                        <p className="text-xl text-gray-400 mb-2">No extensions available yet</p>
                        <p className="text-gray-500">Check back later for {selectedCategory === 'prolix' ? 'new' : 'recommended'} extensions</p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={`extensions-${selectedCategory}`}
                        initial={animationsEnabled ? { opacity: 0 } : false}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
                      >
                        {filteredExtensions.map((extension, index) => (
                          <motion.div
                            key={extension.id}
                            initial={animationsEnabled ? { opacity: 0, y: 15 } : false}
                            animate={{ opacity: 1, y: 0 }}
                            transition={animationsEnabled ? {
                              duration: 0.3,
                              delay: index * 0.05,
                              ease: [0.25, 0.1, 0.25, 1]
                            } : { duration: 0 }}
                            className="group relative bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.08] rounded-2xl overflow-hidden transition-all duration-300 hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/10 hover:-translate-y-1"
                          >
                            {/* Gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                            {/* Accent bar */}
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left z-10" />

                            {/* Thumbnail */}
                            <div className="relative h-44 overflow-hidden">
                              <div className="w-full h-full transition-transform duration-400 group-hover:scale-105">
                                <Image
                                  src={extension.thumbnail}
                                  alt={extension.name}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                              </div>

                              {/* Overlay gradient */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            </div>

                            {/* Content */}
                            <div className="relative p-5">
                              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-orange-400 transition-colors">
                                {extension.name}
                              </h3>
                              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                                {extension.description}
                              </p>

                              <a
                                href={extension.repoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white transition-all duration-200 border hover:scale-[1.03] active:scale-[0.98]"
                                style={{
                                  background: 'linear-gradient(135deg, #ea580c, #d97706)',
                                  boxShadow: '0 8px 20px rgba(234, 88, 12, 0.25)',
                                  borderColor: 'rgba(234, 88, 12, 0.5)'
                                }}
                              >
                                <Github className="w-4 h-4" />
                                View Repository
                                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                              </a>
                            </div>

                            {/* Shimmer effect */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-20 overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExtensionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen relative">
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center text-gray-400 py-12">
            <LoadingSpinner message="Loading..." />
          </div>
        </div>
      </div>
    }>
      <ExtensionsContent />
    </Suspense>
  );
}
