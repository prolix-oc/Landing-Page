'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadFile } from '@/lib/download';
import SmartPagination from '@/app/components/SmartPagination';

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
                    data-framer-motion
                  >
                    <div
                      onClick={() => toggleEntry(entry.uid)}
                      className="w-full p-6 flex items-center justify-between hover:bg-gray-700/30 cursor-pointer text-left"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleEntry(entry.uid);
                        }
                      }}
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
                    </div>
                    
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
                          data-framer-motion
                        >
                          <motion.div layout className="px-6 pb-6 pt-2 space-y-4" data-framer-motion>
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

            {/* Bottom padding to prevent content from being hidden behind sticky pagination */}
            {totalPages > 1 && (
              <div className="h-24" />
            )}
          </div>
        </div>
      </div>

      {/* Sticky Pagination at Bottom */}
      {!loading && !error && totalPages > 1 && (
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
