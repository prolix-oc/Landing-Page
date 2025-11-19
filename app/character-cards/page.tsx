'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import AnimatedLink from '@/app/components/AnimatedLink';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { downloadFile } from '@/lib/download';
import { slugify } from '@/lib/slugify';
import LazyImage from '@/app/components/LazyImage';
import SmartPagination from '@/app/components/SmartPagination';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import CardSkeleton from '@/app/components/CardSkeleton';
import SortDropdown, { SortOption } from '@/app/components/SortDropdown';

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

  // Animation variants consistent with landing page
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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
        stiffness: 50,
        damping: 15
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
      if (width < 768) {
        // Mobile: 1 column
        return 6;
      } else if (width < 1024) {
        // Tablet: 2 columns
        return 12;
      } else {
        // Desktop: 3 columns
        return 15;
      }
    };

    setCardsPerPage(calculateCardsPerPage());

    const handleResize = () => {
      const newCardsPerPage = calculateCardsPerPage();
      if (newCardsPerPage !== cardsPerPage) {
        setCardsPerPage(newCardsPerPage);
        setCurrentPage(0); // Reset to first page on resize
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
          setFilteredCards(data.cards || []); // Show all by default
          // Small delay to ensure all data is ready before showing content
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

    // Apply sorting
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
          const aCount = a.alternateCount || 0;
          const bCount = b.alternateCount || 0;
          return bCount - aCount;
        default:
          return 0;
      }
    });

    setFilteredCards(sorted);
    setCurrentPage(0); // Reset to first page when filtering or sorting
  }, [selectedCategory, allCards, sortBy]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleCategoryChange = (categoryName: string | null) => {
    if (categoryName !== selectedCategory) {
      setSelectedCategory(categoryName);
      // Update URL with category parameter
      if (categoryName) {
        router.push(`/character-cards?category=${encodeURIComponent(categoryName)}`, { scroll: false });
      } else {
        router.push('/character-cards', { scroll: false });
      }
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Don't scroll - let user control scroll position
  };

  // Paginate cards
  const totalPages = Math.ceil(filteredCards.length / cardsPerPage);
  const paginatedCards = filteredCards.slice(
    currentPage * cardsPerPage,
    (currentPage + 1) * cardsPerPage
  );

  return (
    <div className="min-h-screen relative">
      <div className="relative container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div 
          className="mb-12"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <AnimatedLink href="/" className="group text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center mb-6" isBackLink>
              <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </AnimatedLink>
          </motion.div>
          
          <motion.h1 
            className="text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-gradient mb-4"
            variants={itemVariants}
          >
            Character Cards
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-300 max-w-3xl"
            variants={itemVariants}
          >
            Browse and download character cards organized by category
          </motion.p>
        </motion.div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">
            <LoadingSpinner message="Loading character cards..." />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Categories Sidebar */}
              <motion.div 
                className="lg:col-span-1 h-fit"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 sticky top-24">
                  <h2 className="text-xl font-bold text-white mb-6">Categories</h2>
                  <div className="space-y-2">
                    {/* All Cards button */}
                    <button
                      onClick={() => handleCategoryChange(null)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden group ${
                        selectedCategory === null
                          ? 'bg-blue-600/20 text-white border border-blue-500/50 shadow-[0_0_15px_rgba(37,99,235,0.2)]'
                          : 'bg-gray-800/30 text-gray-400 border border-transparent hover:bg-gray-800/60 hover:text-gray-200'
                      }`}
                    >
                      {selectedCategory === null && (
                        <div className="absolute inset-0 bg-blue-500/10 blur-lg" />
                      )}
                      <span className="relative z-10 font-medium">All Cards</span>
                    </button>

                    {categories.map((category) => (
                      <button
                        key={category.name}
                        onClick={() => handleCategoryChange(category.name)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden group ${
                          selectedCategory === category.name
                            ? 'bg-blue-600/20 text-white border border-blue-500/50 shadow-[0_0_15px_rgba(37,99,235,0.2)]'
                            : 'bg-gray-800/30 text-gray-400 border border-transparent hover:bg-gray-800/60 hover:text-gray-200'
                        }`}
                      >
                        {selectedCategory === category.name && (
                          <div className="absolute inset-0 bg-blue-500/10 blur-lg" />
                        )}
                        <span className="relative z-10 font-medium flex items-center justify-between">
                          {category.displayName}
                          {selectedCategory === category.name && (
                            <motion.div layoutId="activeCategory" className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Files Grid */}
              <div className="lg:col-span-3">
                {/* Sort Dropdown */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="mb-6"
                >
                  <SortDropdown value={sortBy} onChange={setSortBy} />
                </motion.div>

                {filteredCards.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-12 text-center"
                  >
                    <p className="text-xl text-gray-400">No character cards found</p>
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
                          transition={{ duration: 0.2 }}
                          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
                          exit="hidden"
                          variants={containerVariants}
                          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                          {paginatedCards.map((card) => (
                        <motion.div
                          key={card.path}
                          variants={itemVariants}
                          className="group relative bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden transition-colors duration-300 hover:bg-gray-900/90 hover:border-gray-700 hover:shadow-2xl"
                          whileHover={{ y: -6, transition: { duration: 0.2 } }}
                        >
                          {/* Glow effect on hover */}
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
                          
                          {/* Accent bar */}
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left z-10" />

                          {/* Thumbnail */}
                          <div className="relative">
                            {card.thumbnailUrl ? (
                              <Link 
                                href={`/character-cards/${encodeURIComponent(card.category)}/${card.slug}`}
                                className="block relative aspect-square bg-gray-900/50 overflow-hidden cursor-pointer"
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
                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}

                            {/* Category Badge */}
                            <div className="absolute top-3 left-3 z-10">
                              <div className="bg-gray-900/80 backdrop-blur-md border border-gray-700 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                                {card.categoryDisplayName}
                              </div>
                            </div>

                            {/* Alternate Scenarios Badge */}
                            {(card.alternateCount ?? 0) > 0 && (
                              <div className="absolute top-3 right-3 z-10">
                                <div className="bg-purple-600/90 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg border border-purple-500/50">
                                  +{card.alternateCount} alt{(card.alternateCount || 0) > 1 ? 's' : ''}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Card Info */}
                          <div className="relative p-5">
                            <Link href={`/character-cards/${encodeURIComponent(card.category)}/${card.slug}`}>
                              <h3 className="text-lg font-bold text-white mb-2 truncate group-hover:text-blue-400 transition-colors" title={card.name}>
                                {card.name}
                              </h3>
                            </Link>
                            <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                              {card.lastModified && (
                                <span>{new Date(card.lastModified).toLocaleDateString()}</span>
                              )}
                              {card.size > 0 && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-gray-600" />
                                  <span>{formatFileSize(card.size)}</span>
                                </>
                              )}
                            </div>
                            
                            {/* Download Dropdown */}
                            {card.jsonUrl && (
                              <div className="relative">
                                <motion.button
                                  onClick={() => setOpenDropdown(openDropdown === card.path ? null : card.path)}
                                  className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-gray-200 hover:text-white px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm flex items-center justify-center gap-2 group/btn relative overflow-hidden"
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <span className="relative z-10 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download
                                    <motion.svg 
                                      className="w-3.5 h-3.5 ml-1" 
                                      fill="none" 
                                      stroke="currentColor" 
                                      viewBox="0 0 24 24"
                                      animate={{ rotate: openDropdown === card.path ? 180 : 0 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </motion.svg>
                                  </span>
                                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
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
                                          className="group/item flex items-center gap-3 px-4 py-3 hover:bg-blue-500/10 transition-colors text-gray-300 hover:text-blue-400 text-sm font-medium border-b border-gray-700/50 w-full text-left"
                                        >
                                          <svg className="w-5 h-5 text-blue-500/70 group-hover/item:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                          <span>Download PNG</span>
                                        </button>
                                      )}
                                      <button
                                        onClick={() => downloadFile(card.jsonUrl!, card.name)}
                                        className="group/item flex items-center gap-3 px-4 py-3 hover:bg-green-500/10 transition-colors text-gray-300 hover:text-green-400 text-sm font-medium w-full text-left"
                                      >
                                        <svg className="w-5 h-5 text-green-500/70 group-hover/item:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span>Download JSON</span>
                                      </button>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            )}
                          </div>
                          
                          {/* Shimmer effect */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-20">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                          </div>
                        </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Bottom padding to prevent content from being hidden behind sticky pagination */}
                    {totalPages > 1 && isContentLoaded && (
                      <div className="h-24" />
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sticky Pagination at Bottom */}
      {!loading && totalPages > 1 && isContentLoaded && (
        <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
          <div className="pt-6 pb-6">
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
          <div className="text-center text-gray-400 py-12">Loading...</div>
        </div>
      </div>
    }>
      <CharacterCardsContent />
    </Suspense>
  );
}
