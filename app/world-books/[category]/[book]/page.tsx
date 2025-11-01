'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadFile } from '@/lib/download';

interface WorldBookEntry {
  uid: number;
  key: string[];
  keysecondary: string[];
  comment: string;
  content: string;
  constant: boolean;
  vectorized: boolean;
  selective: boolean;
  selectiveLogic: number;
  addMemo: boolean;
  order: number;
  position: number;
  disable: boolean;
  excludeRecursion: boolean;
  preventRecursion: boolean;
  probability: number;
  useProbability: boolean;
  depth: number;
  group: string;
  displayIndex: number;
  [key: string]: any;
}

interface WorldBookData {
  entries: {
    [key: string]: WorldBookEntry;
  };
}

interface WorldBook {
  name: string;
  category: string;
  path: string;
  downloadUrl: string;
  jsonUrl: string;
  bookData: WorldBookData;
  size: number;
  lastModified: string | null;
}

const ENTRIES_PER_PAGE = 8;

export default function WorldBookDetailsPage() {
  const params = useParams();
  const [worldBook, setWorldBook] = useState<WorldBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [expandedEntries, setExpandedEntries] = useState<Record<number, boolean>>({});

  const toggleEntry = (uid: number) => {
    setExpandedEntries(prev => ({
      ...prev,
      [uid]: !prev[uid]
    }));
  };

  useEffect(() => {
    async function fetchWorldBook() {
      try {
        const category = params.category as string;
        const bookName = params.book as string;
        
        const response = await fetch(
          `/api/world-books/${encodeURIComponent(category)}/${encodeURIComponent(bookName)}`
        );
        const data = await response.json();
        
        if (data.success) {
          setWorldBook(data.worldBook);
        } else {
          setError(data.error || 'Failed to load world book');
        }
      } catch (err) {
        console.error('Error fetching world book:', err);
        setError('Failed to load world book');
      } finally {
        setLoading(false);
      }
    }

    fetchWorldBook();
  }, [params.category, params.book]);

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center text-gray-400 py-12">
            <motion.div
              className="inline-block w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="mt-4 text-lg">Loading world book...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !worldBook) {
    return (
      <div className="min-h-screen relative">
        <div className="relative container mx-auto px-4 py-16">
          <Link href="/world-books" className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center mb-8">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to World Books
          </Link>
          <div className="bg-red-900/20 border border-red-500 rounded-xl p-12 text-center">
            <p className="text-xl text-red-400">{error || 'World book not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Convert entries object to array and sort by displayIndex
  const entriesArray = Object.values(worldBook.bookData.entries).sort(
    (a, b) => a.displayIndex - b.displayIndex
  );

  const totalPages = Math.ceil(entriesArray.length / ENTRIES_PER_PAGE);
  const startIndex = currentPage * ENTRIES_PER_PAGE;
  const endIndex = startIndex + ENTRIES_PER_PAGE;
  const currentEntries = entriesArray.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Generate smart pagination array with ellipsis that shifts based on current page
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 9; // Maximum number of page buttons to show
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Smart pagination: "1 2 ... middle numbers ... 41 42" format
      const edgePages = 2; // Always show first 2 and last 2 pages
      const middlePages = 5; // Always show 5 pages in the middle range
      const startRange = 6; // Pages 0-5 are the "beginning range"
      const endRangeStart = totalPages - 7; // Last 7 pages are "end range"
      
      // Determine which range we're in
      if (currentPage < startRange) {
        // Beginning range: show 1 2 3 4 5 6 7 ... 41 42
        for (let i = 0; i < 7; i++) {
          pages.push(i);
        }
        pages.push('ellipsis-end');
        // Last 2 pages
        for (let i = totalPages - 2; i < totalPages; i++) {
          pages.push(i);
        }
      } else if (currentPage >= endRangeStart) {
        // End range: show 1 2 ... 36 37 38 39 40 41 42
        // First 2 pages
        for (let i = 0; i < 2; i++) {
          pages.push(i);
        }
        pages.push('ellipsis-start');
        // Last 7 pages
        for (let i = totalPages - 7; i < totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle range: show 1 2 ... middle 5 pages ... 41 42
        // First 2 pages
        for (let i = 0; i < 2; i++) {
          pages.push(i);
        }
        pages.push('ellipsis-start');
        
        // Middle 5 pages centered on current page
        const middleStart = currentPage - 2;
        const middleEnd = currentPage + 2;
        for (let i = middleStart; i <= middleEnd; i++) {
          pages.push(i);
        }
        
        pages.push('ellipsis-end');
        // Last 2 pages
        for (let i = totalPages - 2; i < totalPages; i++) {
          pages.push(i);
        }
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();
  
  // Determine which range we're in for highlight positioning
  const startRange = 6;
  const endRangeStart = totalPages - 7;
  const isInBeginningRange = currentPage < startRange;
  const isInEndRange = currentPage >= endRangeStart;
  const isInMiddleRange = !isInBeginningRange && !isInEndRange;

  return (
    <div className="min-h-screen relative">
      <div className="relative container mx-auto px-4 py-16">
        {/* Header with Back Button */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link 
            href={`/world-books?category=${encodeURIComponent(worldBook.category)}`} 
            className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to {worldBook.category}
          </Link>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* World Book Info Sidebar */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden sticky top-4">
              <div className="p-6 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{worldBook.name}</h1>
                  <p className="text-sm text-gray-400">{worldBook.category}</p>
                </div>

                <div className="pt-4 border-t border-gray-700 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Total Entries:</span>
                    <span className="text-white font-semibold">{entriesArray.length}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Size:</span>
                    <span className="text-white font-semibold">
                      {(worldBook.size / 1024).toFixed(1)} KB
                    </span>
                  </div>

                  {worldBook.lastModified && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Updated:</span>
                      <span className="text-white font-semibold">
                        {new Date(worldBook.lastModified).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Download Button */}
                <div className="pt-4">
                  <motion.button
                    onClick={() => downloadFile(worldBook.jsonUrl, `${worldBook.name}.json`)}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-4 py-3 rounded-lg transition-all duration-200 font-medium shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download JSON
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Entries Section */}
          <div className="lg:col-span-3">
            {/* Entries List */}
            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {currentEntries.map((entry, index) => (
                  <motion.div
                    key={`${currentPage}-${entry.uid}`}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ 
                      duration: 0.3,
                      delay: index * 0.05,
                      layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
                    }}
                    className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => toggleEntry(entry.uid)}
                      className="w-full p-6 flex items-center justify-between hover:bg-gray-700/30 transition-colors text-left"
                    >
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">
                          {entry.comment || `Entry ${entry.uid}`}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {entry.key.length > 0 && (
                            <span className="text-xs px-2 py-1 bg-blue-600/20 border border-blue-500/30 rounded-md text-blue-300">
                              {entry.key.length} trigger{entry.key.length !== 1 ? 's' : ''}
                            </span>
                          )}
                          {entry.depth !== undefined && (
                            <span className="text-xs px-2 py-1 bg-purple-600/20 border border-purple-500/30 rounded-md text-purple-300">
                              Depth: {entry.depth}
                            </span>
                          )}
                          {entry.vectorized && (
                            <span className="text-xs px-2 py-1 bg-green-600/20 border border-green-500/30 rounded-md text-green-300">
                              Vectorized
                            </span>
                          )}
                          {entry.constant && (
                            <span className="text-xs px-2 py-1 bg-yellow-600/20 border border-yellow-500/30 rounded-md text-yellow-300">
                              Constant
                            </span>
                          )}
                          {entry.disable && (
                            <span className="text-xs px-2 py-1 bg-red-600/20 border border-red-500/30 rounded-md text-red-300">
                              Disabled
                            </span>
                          )}
                        </div>
                      </div>
                      <motion.svg
                        className="w-6 h-6 text-gray-400 flex-shrink-0 ml-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        animate={{ rotate: expandedEntries[entry.uid] ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </motion.svg>
                    </button>
                    
                    <AnimatePresence>
                      {expandedEntries[entry.uid] && (
                        <motion.div
                          layout
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ 
                            height: { duration: 0.2 },
                            opacity: { duration: 0.2 },
                            layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
                          }}
                          className="overflow-hidden"
                        >
                          <motion.div layout className="px-6 pb-6 pt-2 space-y-4">
                            {/* Content */}
                            <div>
                              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {entry.content}
                              </p>
                            </div>

                            {/* Trigger Words */}
                            {entry.key.length > 0 && (
                              <div className="pt-4 border-t border-gray-700">
                                <h4 className="text-sm font-semibold text-gray-400 mb-2">Trigger Words</h4>
                                <div className="flex flex-wrap gap-2">
                                  {entry.key.map((keyword, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs px-3 py-1.5 bg-blue-600/30 border border-blue-500/50 rounded-md text-blue-200"
                                    >
                                      {keyword}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Secondary Keys */}
                            {entry.keysecondary && entry.keysecondary.length > 0 && (
                              <div className="pt-4 border-t border-gray-700">
                                <h4 className="text-sm font-semibold text-gray-400 mb-2">Secondary Keys</h4>
                                <div className="flex flex-wrap gap-2">
                                  {entry.keysecondary.map((keyword, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs px-3 py-1.5 bg-cyan-600/30 border border-cyan-500/50 rounded-md text-cyan-200"
                                    >
                                      {keyword}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Additional Properties */}
                            <div className="pt-4 border-t border-gray-700 grid grid-cols-2 gap-3 text-sm">
                              {entry.probability !== undefined && entry.useProbability && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Probability:</span>
                                  <span className="text-white font-medium">{entry.probability}%</span>
                                </div>
                              )}
                              {entry.order !== undefined && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Order:</span>
                                  <span className="text-white font-medium">{entry.order}</span>
                                </div>
                              )}
                              {entry.group && (
                                <div className="flex justify-between col-span-2">
                                  <span className="text-gray-400">Group:</span>
                                  <span className="text-white font-medium">{entry.group}</span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <motion.div
                className="mt-8 flex items-center justify-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {/* Previous Button */}
                <motion.button
                  onClick={goToPrevPage}
                  disabled={currentPage === 0}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    currentPage === 0
                      ? 'bg-gray-800/30 text-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50'
                  }`}
                  whileHover={currentPage > 0 ? { scale: 1.1 } : {}}
                  whileTap={currentPage > 0 ? { scale: 0.9 } : {}}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>

                {/* Page Tabs */}
                <div 
                  className="relative flex bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-full p-1 gap-1 overflow-hidden transition-all duration-300" 
                  style={{ 
                    width: `${Math.min(pageNumbers.length * 52 + 8, 480)}px` // Dynamic width: 52px per item + 8px padding, max 480px
                  }}
                >
                  {/* Highlight Circle - Position changes based on range */}
                  {(() => {
                    // Find the current page's position in the pageNumbers array
                    const currentPageIndex = pageNumbers.findIndex(p => p === currentPage);
                    
                    // Calculate position based on range
                    let highlightPosition = currentPageIndex;
                    
                    // For middle range, keep highlight at position 4 (centered in the 9-item array: 1 2 ... X X X X X ... 41 42)
                    if (isInMiddleRange && pageNumbers.length >= 9) {
                      highlightPosition = 4; // 0-indexed: [0, 1, 2, 3, 4, 5, 6, 7, 8] -> position 4 is center
                    }
                    // For end range, calculate position in the layout
                    else if (isInEndRange) {
                      // In end range: 1 2 ... 36 37 38 39 40 41 42
                      // Items are at positions: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
                      highlightPosition = currentPageIndex;
                    }
                    // For beginning range, position is simply the page index
                    
                    return (
                      <motion.div
                        className="absolute top-1 bottom-1 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full shadow-lg shadow-blue-500/50 pointer-events-none z-10"
                        style={{ width: '48px' }}
                        animate={{ 
                          left: `calc(${highlightPosition * 52}px + 0.25rem)`
                        }}
                        transition={{ 
                          type: "spring", 
                          bounce: 0.15, 
                          duration: 0.5
                        }}
                      />
                    );
                  })()}
                  
                  {/* Page Number Buttons */}
                  <div className="relative flex gap-1">
                    {pageNumbers.map((pageNum, idx) => {
                      if (typeof pageNum === 'string' && pageNum.startsWith('ellipsis')) {
                        return (
                          <div
                            key={pageNum}
                            className="px-4 py-2 text-gray-400 flex items-center justify-center flex-shrink-0"
                            style={{ width: '48px' }}
                          >
                            <span className="text-sm">...</span>
                          </div>
                        );
                      }
                    
                      const page = pageNum as number;
                      return (
                        <motion.button
                          key={`page-${page}`}
                          layout
                          onClick={() => {
                            setCurrentPage(page);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`relative px-4 py-2 rounded-full font-medium transition-colors flex items-center justify-center flex-shrink-0 ${
                            currentPage === page
                              ? 'text-white'
                              : 'text-gray-400 hover:text-gray-200'
                          }`}
                          style={{ width: '48px' }}
                          whileHover={{ scale: currentPage === page ? 1 : 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }}
                        >
                          <span className="relative z-10 text-sm">{page + 1}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Next Button */}
                <motion.button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages - 1}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    currentPage === totalPages - 1
                      ? 'bg-gray-800/30 text-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50'
                  }`}
                  whileHover={currentPage < totalPages - 1 ? { scale: 1.1 } : {}}
                  whileTap={currentPage < totalPages - 1 ? { scale: 0.9 } : {}}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
