'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadFile } from '@/lib/download';
import LazyImage from '@/app/components/LazyImage';

interface Category {
  name: string;
  path: string;
  displayName: string;
}

interface CharacterCard {
  name: string;
  path: string;
  thumbnailUrl: string | null;
  jsonUrl: string | null;
  size: number;
  lastModified: string | null;
  alternateCount?: number;
}

function CharacterCardsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cards, setCards] = useState<CharacterCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Check URL parameters on mount
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(decodeURIComponent(categoryParam));
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/character-cards');
        const data = await response.json();
        if (data.success) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  useEffect(() => {
    if (!selectedCategory) {
      setCards([]);
      return;
    }

    async function fetchCards() {
      setIsTransitioning(true);
      setFilesLoading(true);
      
      // Small delay to ensure fade out completes
      await new Promise(resolve => setTimeout(resolve, 150));
      
      try {
        const response = await fetch(`/api/character-cards/${encodeURIComponent(selectedCategory as string)}`);
        const data = await response.json();
        if (data.success) {
          setCards(data.cards || []);
        }
      } catch (error) {
        console.error('Error fetching cards:', error);
      } finally {
        setFilesLoading(false);
        setIsTransitioning(false);
      }
    }

    fetchCards();
  }, [selectedCategory]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleCategoryChange = (categoryName: string) => {
    if (categoryName !== selectedCategory) {
      setSelectedCategory(categoryName);
      // Update URL with category parameter
      router.push(`/character-cards?category=${encodeURIComponent(categoryName)}`, { scroll: false });
    }
  };

  return (
    <div className="min-h-screen relative">
      <div className="relative container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-5xl font-bold text-white mb-4">Character Cards</h1>
          <p className="text-xl text-gray-300">Browse and download character cards organized by category</p>
        </motion.div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading categories...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Categories Sidebar */}
            <motion.div 
              className="lg:col-span-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 sticky top-4">
                <h2 className="text-xl font-bold text-white mb-4">Categories</h2>
                <div className="space-y-2">
                  {categories.map((category, index) => (
                    <motion.button
                      key={category.name}
                      onClick={() => handleCategoryChange(category.name)}
                      className={`w-full text-left px-4 py-3 rounded-lg ${
                        selectedCategory === category.name
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      layout
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {category.displayName}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Files Grid */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                {!selectedCategory ? (
                  <motion.div
                    key="empty-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-12 text-center"
                  >
                    <motion.div 
                      className="text-6xl mb-4"
                      animate={{ x: [0, 10, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      👈
                    </motion.div>
                    <p className="text-xl text-gray-400">Select a category to view character cards</p>
                  </motion.div>
                ) : isTransitioning || filesLoading ? (
                  <motion.div
                    key="loading-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-center text-gray-400 py-12"
                  >
                    <motion.div
                      className="inline-block w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <p className="mt-4 text-lg">Loading character cards...</p>
                  </motion.div>
                ) : cards.length === 0 ? (
                  <motion.div
                    key="no-cards"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-12 text-center"
                  >
                    <p className="text-xl text-gray-400">No character cards found in this category</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`cards-${selectedCategory}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {cards.map((card, index) => (
                      <motion.div
                        key={card.path}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 hover:shadow-2xl hover:shadow-blue-500/20 transition-all"
                        whileHover={{ scale: 1.03, y: -5, transition: { duration: 0.2 } }}
                      >
                        {/* Thumbnail */}
                        {card.thumbnailUrl && (
                          <Link 
                            href={`/character-cards/${encodeURIComponent(selectedCategory)}/${encodeURIComponent(card.name)}`}
                            className="block relative aspect-square bg-gray-900/50 overflow-hidden cursor-pointer"
                          >
                            <motion.div
                              whileHover={{ scale: 1.03 }}
                              transition={{ duration: 0.2 }}
                              className="w-full h-full"
                            >
                              <LazyImage
                                src={card.thumbnailUrl}
                                alt={card.name}
                                className="w-full h-full object-cover"
                              />
                            </motion.div>
                            {/* Alternate Scenarios Badge */}
                            {card.alternateCount && card.alternateCount > 0 && (
                              <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                +{card.alternateCount} alt{card.alternateCount > 1 ? 's' : ''}
                              </div>
                            )}
                          </Link>
                        )}
                        
                        {/* Card Info */}
                        <div className="p-6">
                          <h3 className="text-lg font-semibold text-white mb-2 truncate" title={card.name}>
                            {card.name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                            {card.lastModified && (
                              <span>{new Date(card.lastModified).toLocaleDateString()}</span>
                            )}
                            {card.size > 0 && (
                              <>
                                <span>•</span>
                                <span>{formatFileSize(card.size)}</span>
                              </>
                            )}
                          </div>
                          
                          {/* Download Dropdown */}
                          {card.jsonUrl && (
                            <div className="relative">
                              <motion.button
                                onClick={() => setOpenDropdown(openDropdown === card.path ? null : card.path)}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-4 py-3 rounded-lg transition-all duration-200 font-medium shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center justify-center gap-2"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download
                                <motion.svg 
                                  className="w-4 h-4" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                  animate={{ rotate: openDropdown === card.path ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </motion.svg>
                              </motion.button>
                              <AnimatePresence>
                                {openDropdown === card.path && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute bottom-full mb-2 w-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600 rounded-lg shadow-2xl overflow-hidden z-10"
                                    onMouseLeave={() => setOpenDropdown(null)}
                                  >
                                    {card.thumbnailUrl && (
                                      <motion.button
                                        onClick={() => downloadFile(card.thumbnailUrl!, card.name.replace(/\.json$/, '.png'))}
                                        className="group/item flex items-center gap-3 px-4 py-3 hover:bg-blue-600/20 transition-colors text-white text-sm font-medium border-b border-gray-700 w-full text-left"
                                        whileHover={{ x: 4 }}
                                      >
                                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span>Download PNG</span>
                                      </motion.button>
                                    )}
                                    <motion.button
                                      onClick={() => downloadFile(card.jsonUrl!, card.name)}
                                      className="group/item flex items-center gap-3 px-4 py-3 hover:bg-blue-600/20 transition-colors text-white text-sm font-medium w-full text-left"
                                      whileHover={{ x: 4 }}
                                    >
                                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      <span>Download JSON</span>
                                    </motion.button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
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
