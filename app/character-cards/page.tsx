'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import AnimatedLink from '@/app/components/AnimatedLink';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { downloadFile } from '@/lib/download';
import LazyImage from '@/app/components/LazyImage';
import SmartPagination from '@/app/components/SmartPagination';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import CardSkeleton from '@/app/components/CardSkeleton';
import SortDropdown, { SortOption } from '@/app/components/SortDropdown';
import {
  ArrowLeft,
  Users,
  ChevronRight,
  Download,
  ChevronDown,
  Image as ImageIcon,
  FileJson2,
  Layers,
  Calendar,
  HardDrive,
  Sparkles
} from 'lucide-react';

interface Category {
  name: string;
  path: string;
  displayName: string;
}

interface CharacterCard {
  name: string;
  path: string;
  category: string;
  categoryDisplayName: string;
  thumbnailUrl: string | null;
  jsonUrl: string | null;
  size: number;
  lastModified: string | null;
  alternateCount?: number;
  slug: string;
}

function CharacterCardsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
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

  const [categories, setCategories] = useState<Category[]>([]);
  const [allCards, setAllCards] = useState<CharacterCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<CharacterCard[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [cardsPerPage, setCardsPerPage] = useState(12);
  const [sortBy, setSortBy] = useState<SortOption>('a-z');
  const [isContentLoaded, setIsContentLoaded] = useState(false);

  // Calculate cards per page based on screen size
  useEffect(() => {
    const calculateCardsPerPage = () => {
      const width = window.innerWidth;
      if (width < 768) return 6;
      else if (width < 1024) return 12;
      else return 15;
    };

    setCardsPerPage(calculateCardsPerPage());

    const handleResize = () => {
      const newCardsPerPage = calculateCardsPerPage();
      if (newCardsPerPage !== cardsPerPage) {
        setCardsPerPage(newCardsPerPage);
        setCurrentPage(0);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [cardsPerPage]);

  // Check URL parameters on mount
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(decodeURIComponent(categoryParam));
    }
  }, [searchParams]);

  // Fetch all cards on initial load
  useEffect(() => {
    async function fetchAllCards() {
      try {
        const response = await fetch('/api/character-cards?all=true');
        const data = await response.json();
        if (data.success) {
          setCategories(data.categories);
          setAllCards(data.cards || []);
          setFilteredCards(data.cards || []);
          setTimeout(() => setIsContentLoaded(true), 100);
        }
      } catch (error) {
        console.error('Error fetching character cards:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAllCards();
  }, []);

  // Filter and sort cards when category or sort changes
  useEffect(() => {
    let filtered = selectedCategory
      ? allCards.filter(card => card.category === selectedCategory)
      : allCards;

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'a-z':
          return a.name.localeCompare(b.name);
        case 'z-a':
          return b.name.localeCompare(a.name);
        case 'recent':
          if (!a.lastModified || !b.lastModified) return 0;
          return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
        case 'alt-count':
          return (b.alternateCount || 0) - (a.alternateCount || 0);
        default:
          return 0;
      }
    });

    setFilteredCards(sorted);
    setCurrentPage(0);
  }, [selectedCategory, allCards, sortBy]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleCategoryChange = (categoryName: string | null) => {
    if (categoryName !== selectedCategory) {
      setSelectedCategory(categoryName);
      if (categoryName) {
        router.push(`/character-cards?category=${encodeURIComponent(categoryName)}`, { scroll: false });
      } else {
        router.push('/character-cards', { scroll: false });
      }
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = Math.ceil(filteredCards.length / cardsPerPage);
  const paginatedCards = filteredCards.slice(
    currentPage * cardsPerPage,
    (currentPage + 1) * cardsPerPage
  );

  // Calculate stats
  const totalCards = allCards.length;
  const totalCategories = categories.length;
  const totalAlts = allCards.reduce((sum, card) => sum + (card.alternateCount || 0), 0);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* CSS Animated Orbs - GPU Optimized */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-20">
        <div className="orb-1 absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[120px]" />
        <div className="orb-2 absolute top-[50%] right-[0%] w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[140px]" />
        <div className="orb-3 absolute bottom-[5%] left-[30%] w-[450px] h-[450px] bg-blue-600/15 rounded-full blur-[110px]" />
      </div>


      {/* Back Link - Fixed Pill Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-6 left-6 z-50"
      >
        <AnimatedLink
          href="/"
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-gray-400 hover:text-cyan-400 hover:bg-white/10 hover:border-cyan-500/30 transition-all"
          isBackLink
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Home</span>
        </AnimatedLink>
      </motion.div>

      <div className="relative container mx-auto px-4 py-8 sm:py-12">
        {/* Compact Hero Section */}
        <motion.header
          className="text-center mb-8 sm:mb-10"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Floating Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4"
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-300">Character Collection</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-3"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-gradient bg-[length:200%_auto]">
              Character
            </span>
            <span className="text-white/90 ml-3">Cards</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-gray-400 text-lg max-w-2xl mx-auto mb-5"
          >
            Browse and download character cards organized by category
          </motion.p>

          {/* Stats Row */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-6 text-sm"
          >
            <div className="flex items-center gap-2 text-gray-400">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span><strong className="text-white">{totalCards}</strong> characters</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-600" />
            <div className="flex items-center gap-2 text-gray-400">
              <Layers className="w-4 h-4 text-purple-400" />
              <span><strong className="text-white">{totalCategories}</strong> categories</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-600 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2 text-gray-400">
              <FileJson2 className="w-4 h-4 text-blue-400" />
              <span><strong className="text-white">{totalAlts}</strong> alt scenarios</span>
            </div>
          </motion.div>
        </motion.header>

        {loading ? (
          <div className="text-center text-gray-400 py-12">
            <LoadingSpinner message="Loading character cards..." />
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
                      <Layers className="w-5 h-5 text-purple-400" />
                      Categories
                    </h2>

                    {/* All Cards button */}
                    <motion.button
                      onClick={() => handleCategoryChange(null)}
                      className={`group w-full text-left px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden flex items-center justify-between ${
                        selectedCategory === null
                          ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/10 text-white border border-cyan-500/30'
                          : 'bg-white/[0.03] text-gray-400 border border-white/[0.05] hover:bg-white/[0.06] hover:text-gray-200 hover:border-white/[0.1]'
                      }`}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="font-medium">All Cards</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{allCards.length}</span>
                        <ChevronRight className={`w-4 h-4 transition-all ${
                          selectedCategory === null ? 'text-cyan-400 opacity-100' : 'opacity-0 group-hover:opacity-50'
                        }`} />
                      </div>
                    </motion.button>

                    {categories.map((category, index) => (
                      <motion.button
                        key={category.name}
                        onClick={() => handleCategoryChange(category.name)}
                        className={`group w-full text-left px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden flex items-center justify-between ${
                          selectedCategory === category.name
                            ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/10 text-white border border-cyan-500/30'
                            : 'bg-white/[0.03] text-gray-400 border border-white/[0.05] hover:bg-white/[0.06] hover:text-gray-200 hover:border-white/[0.1]'
                        }`}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <span className="font-medium">{category.displayName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {allCards.filter(c => c.category === category.name).length}
                          </span>
                          <ChevronRight className={`w-4 h-4 transition-all ${
                            selectedCategory === category.name ? 'text-cyan-400 opacity-100' : 'opacity-0 group-hover:opacity-50'
                          }`} />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Cards Grid */}
                <div className="lg:col-span-3">
                  {/* Sort Dropdown */}
                  <div className="mb-6 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Showing <span className="text-white font-medium">{filteredCards.length}</span> character{filteredCards.length !== 1 ? 's' : ''}
                    </p>
                    <SortDropdown value={sortBy} onChange={setSortBy} />
                  </div>

                  {filteredCards.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-12 text-center"
                    >
                      <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-xl text-gray-400">No character cards found</p>
                      <p className="text-sm text-gray-500 mt-2">Try selecting a different category</p>
                    </motion.div>
                  ) : (
                    <>
                      <AnimatePresence mode="wait">
                        {!isContentLoaded ? (
                          <motion.div
                            key="skeleton"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
                          >
                            {Array.from({ length: cardsPerPage }).map((_, index) => (
                              <CardSkeleton key={`skeleton-${index}`} />
                            ))}
                          </motion.div>
                        ) : (
                          <motion.div
                            key={`cards-${selectedCategory || 'all'}-${sortBy}-${currentPage}`}
                            initial="hidden"
                            animate="visible"
                            variants={containerVariants}
                            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
                          >
                            {paginatedCards.map((card) => (
                              <motion.div
                                key={card.path}
                                variants={itemVariants}
                                className="group relative bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.08] rounded-2xl overflow-hidden transition-all duration-300 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/10"
                                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                              >
                                {/* Gradient overlay on hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                {/* Accent bar */}
                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left z-10" />

                                {/* Thumbnail */}
                                <div className="relative">
                                  {card.thumbnailUrl ? (
                                    <Link
                                      href={`/character-cards/${encodeURIComponent(card.category)}/${card.slug}`}
                                      className="block relative aspect-square overflow-hidden cursor-pointer"
                                    >
                                      <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        transition={{ duration: 0.4 }}
                                        className="w-full h-full"
                                      >
                                        <LazyImage
                                          src={card.thumbnailUrl}
                                          alt={card.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </motion.div>
                                    </Link>
                                  ) : (
                                    <div className="aspect-square bg-gray-800/50 flex items-center justify-center text-gray-600">
                                      <ImageIcon className="w-12 h-12" />
                                    </div>
                                  )}

                                  {/* Category Badge */}
                                  <div className="absolute top-3 left-3 z-10">
                                    <div className="bg-gray-900/80 backdrop-blur-md border border-gray-700/50 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-lg">
                                      {card.categoryDisplayName}
                                    </div>
                                  </div>

                                  {/* Alt Scenarios Badge */}
                                  {(card.alternateCount ?? 0) > 0 && (
                                    <div className="absolute top-3 right-3 z-10">
                                      <div className="flex items-center gap-1.5 bg-purple-600/90 backdrop-blur-md text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-lg border border-purple-500/50">
                                        <Layers className="w-3 h-3" />
                                        +{card.alternateCount}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Card Info */}
                                <div className="relative p-4">
                                  <Link href={`/character-cards/${encodeURIComponent(card.category)}/${card.slug}`}>
                                    <h3 className="text-base font-semibold text-white mb-2 truncate group-hover:text-cyan-400 transition-colors" title={card.name}>
                                      {card.name}
                                    </h3>
                                  </Link>
                                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                                    {card.lastModified && (
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(card.lastModified).toLocaleDateString()}
                                      </span>
                                    )}
                                    {card.size > 0 && (
                                      <span className="flex items-center gap-1">
                                        <HardDrive className="w-3 h-3" />
                                        {formatFileSize(card.size)}
                                      </span>
                                    )}
                                  </div>

                                  {/* Download Dropdown */}
                                  {card.jsonUrl && (
                                    <div className="relative">
                                      <motion.button
                                        onClick={() => setOpenDropdown(openDropdown === card.path ? null : card.path)}
                                        className="w-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] hover:border-cyan-500/30 text-gray-300 hover:text-white px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm flex items-center justify-center gap-2 group/btn"
                                        whileTap={{ scale: 0.98 }}
                                      >
                                        <Download className="w-4 h-4 group-hover/btn:text-cyan-400 transition-colors" />
                                        <span>Download</span>
                                        <motion.div
                                          animate={{ rotate: openDropdown === card.path ? 180 : 0 }}
                                          transition={{ duration: 0.2 }}
                                        >
                                          <ChevronDown className="w-4 h-4 text-gray-500" />
                                        </motion.div>
                                      </motion.button>

                                      <AnimatePresence>
                                        {openDropdown === card.path && (
                                          <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute bottom-full mb-2 w-full bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden z-20 ring-1 ring-white/10"
                                            onMouseLeave={() => setOpenDropdown(null)}
                                          >
                                            {card.thumbnailUrl && (
                                              <button
                                                onClick={() => downloadFile(card.thumbnailUrl!, card.name.replace(/\.json$/, '.png'))}
                                                className="group/item flex items-center gap-3 px-4 py-3 hover:bg-cyan-500/10 transition-colors text-gray-300 hover:text-cyan-400 text-sm font-medium border-b border-gray-700/50 w-full text-left"
                                              >
                                                <ImageIcon className="w-5 h-5 text-cyan-500/70 group-hover/item:text-cyan-400" />
                                                <span>Download PNG</span>
                                              </button>
                                            )}
                                            <button
                                              onClick={() => downloadFile(card.jsonUrl!, card.name)}
                                              className="group/item flex items-center gap-3 px-4 py-3 hover:bg-green-500/10 transition-colors text-gray-300 hover:text-green-400 text-sm font-medium w-full text-left"
                                            >
                                              <FileJson2 className="w-5 h-5 text-green-500/70 group-hover/item:text-green-400" />
                                              <span>Download JSON</span>
                                            </button>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  )}
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

                      {/* Bottom padding for sticky pagination */}
                      {totalPages > 1 && isContentLoaded && (
                        <div className="h-24" />
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Sticky Pagination at Bottom */}
      {!loading && totalPages > 1 && isContentLoaded && (
        <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
          <div className="pt-4 pb-6">
            <div className="container mx-auto px-4">
              <SmartPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CharacterCardsPage() {
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
      <CharacterCardsContent />
    </Suspense>
  );
}
