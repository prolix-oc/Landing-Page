'use client';

import { useState, useEffect, Suspense } from 'react';
import AnimatedLink from '@/app/components/AnimatedLink';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
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

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 80,
        damping: 20
      }
    }
  };

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
      {/* CSS Animated Orbs - GPU Optimized */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-20">
        <div className="orb-1 absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-orange-600/20 rounded-full blur-[120px]" />
        <div className="orb-2 absolute top-[50%] right-[0%] w-[550px] h-[550px] bg-amber-600/15 rounded-full blur-[130px]" />
        <div className="orb-3 absolute bottom-[5%] left-[40%] w-[400px] h-[400px] bg-red-600/15 rounded-full blur-[100px]" />
      </div>

      <style jsx>{`
        .orb-1 {
          animation: float-1 28s ease-in-out infinite;
          will-change: transform;
        }
        .orb-2 {
          animation: float-2 32s ease-in-out infinite;
          will-change: transform;
        }
        .orb-3 {
          animation: float-3 26s ease-in-out infinite;
          will-change: transform;
        }
        @keyframes float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(50px, -30px) scale(1.05); }
          50% { transform: translate(20px, 40px) scale(0.95); }
          75% { transform: translate(-30px, 15px) scale(1.02); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, 30px) scale(1.03); }
          66% { transform: translate(30px, -20px) scale(0.97); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, -40px) scale(1.04); }
        }
      `}</style>

      <div className="relative container mx-auto px-4 py-8 sm:py-12">
        {/* Compact Hero Section */}
        <motion.header
          className="text-center mb-8 sm:mb-10"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Back Link */}
          <motion.div variants={itemVariants} className="mb-6">
            <AnimatedLink
              href="/"
              className="group inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors"
              isBackLink
            >
              <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Home</span>
            </AnimatedLink>
          </motion.div>

          {/* Floating Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-4"
          >
            <Puzzle className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium text-orange-300">SillyTavern Extensions</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-3"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-500 to-red-500 animate-gradient bg-[length:200%_auto]">
              Extensions
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-gray-400 text-lg max-w-2xl mx-auto mb-5"
          >
            Extend SillyTavern with powerful custom extensions
          </motion.p>

          {/* Stats Row */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-6 text-sm"
          >
            <div className="flex items-center gap-2 text-gray-400">
              <Puzzle className="w-4 h-4 text-orange-400" />
              <span><strong className="text-white">{extensions.length}</strong> extensions</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-600" />
            <div className="flex items-center gap-2 text-gray-400">
              <Github className="w-4 h-4 text-amber-400" />
              <span><strong className="text-white">{CATEGORIES.length}</strong> categories</span>
            </div>
          </motion.div>
        </motion.header>

        {loading ? (
          <div className="text-center text-gray-400 py-12">
            <LoadingSpinner message="Loading extensions..." />
          </div>
        ) : (
          /* Single Glass Container */
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* Single backdrop-blur layer */}
            <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/[0.05]" />

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

                    {CATEGORIES.map((category, index) => {
                      const IconComponent = category.icon;
                      return (
                        <motion.button
                          key={category.id}
                          onClick={() => handleCategoryChange(category.id)}
                          className={`group w-full text-left px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden flex items-center justify-between ${
                            selectedCategory === category.id
                              ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/10 text-white border border-orange-500/30'
                              : 'bg-white/[0.03] text-gray-400 border border-white/[0.05] hover:bg-white/[0.06] hover:text-gray-200 hover:border-white/[0.1]'
                          }`}
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <span className="flex items-center gap-3 font-medium">
                            <IconComponent className={`w-4 h-4 ${selectedCategory === category.id ? 'text-orange-400' : 'text-gray-500'}`} />
                            {category.name}
                          </span>
                          <ChevronRight className={`w-4 h-4 transition-all ${
                            selectedCategory === category.id ? 'text-orange-400 opacity-100' : 'opacity-0 group-hover:opacity-50'
                          }`} />
                        </motion.button>
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
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={containerVariants}
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
                      >
                        {filteredExtensions.map((extension) => (
                          <motion.div
                            key={extension.id}
                            variants={itemVariants}
                            className="group relative bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.08] rounded-2xl overflow-hidden transition-all duration-300 hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/10"
                            whileHover={{ y: -4, transition: { duration: 0.2 } }}
                          >
                            {/* Gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                            {/* Accent bar */}
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left z-10" />

                            {/* Thumbnail */}
                            <div className="relative h-44 overflow-hidden">
                              <motion.div
                                className="w-full h-full"
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.4 }}
                              >
                                <Image
                                  src={extension.thumbnail}
                                  alt={extension.name}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                              </motion.div>

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

                              <motion.a
                                href={extension.repoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white transition-all duration-200 border"
                                style={{
                                  background: 'linear-gradient(135deg, #ea580c, #d97706)',
                                  boxShadow: '0 8px 20px rgba(234, 88, 12, 0.25)',
                                  borderColor: 'rgba(234, 88, 12, 0.5)'
                                }}
                                whileHover={{ scale: 1.03, boxShadow: '0 12px 25px rgba(234, 88, 12, 0.35)' }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <Github className="w-4 h-4" />
                                View Repository
                                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                              </motion.a>
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
          </motion.div>
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
