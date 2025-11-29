'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AnimatedLink from '@/app/components/AnimatedLink';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadFile } from '@/lib/download';
import SmartPagination from '@/app/components/SmartPagination';
import SortDropdown, { SortOption } from '@/app/components/SortDropdown';
import { isLumiverseDLC } from '@/lib/constants';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('a-z');
  const [showCopied, setShowCopied] = useState(false);

  const toggleEntry = (uid: number) => {
    setExpandedEntries(prev => ({
      ...prev,
      [uid]: !prev[uid]
    }));
  };

  const copyImportLink = async () => {
    if (!worldBook) return;

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const importUrl = `${baseUrl}/api/raw/world-books/${encodeURIComponent(worldBook.category)}/${encodeURIComponent(worldBook.name)}.json`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(importUrl);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      } else {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = importUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          setShowCopied(true);
          setTimeout(() => setShowCopied(false), 2000);
        } catch (err) {
          console.error('Fallback: Failed to copy URL:', err);
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
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
          <AnimatedLink href="/world-books" className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center mb-8" isBackLink>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to World Books
          </AnimatedLink>
          <div className="bg-red-900/20 border border-red-500 rounded-xl p-12 text-center">
            <p className="text-xl text-red-400">{error || 'World book not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Filter and sort entries
  const entriesArray = Object.values(worldBook.bookData.entries)
    .filter(entry => {
      const query = searchQuery.toLowerCase();
      return (
        entry.comment?.toLowerCase().includes(query) ||
        entry.content?.toLowerCase().includes(query) ||
        entry.key?.some(k => k.toLowerCase().includes(query)) ||
        entry.keysecondary?.some(k => k.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'a-z':
          return (a.comment || '').localeCompare(b.comment || '');
        case 'z-a':
          return (b.comment || '').localeCompare(a.comment || '');
        default: // Default to order/displayIndex
          return a.displayIndex - b.displayIndex;
      }
    });

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
          <AnimatedLink 
            href={`/world-books?category=${encodeURIComponent(worldBook.category)}`} 
            className="group text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center mb-4"
            isBackLink
          >
            <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to {worldBook.category}
          </AnimatedLink>
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
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 sticky top-4">
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-2 break-words">{worldBook.name}</h1>
                  <p className="text-sm text-gray-400">{worldBook.category}</p>
                </div>

                <div className="pt-4 border-t border-gray-800 space-y-3">
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

                {/* Controls */}
                <div className="pt-4 border-t border-gray-800 space-y-4">
                  {/* Search */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Search Entries</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(0);
                        }}
                        placeholder="Search..."
                        className="w-full bg-gray-800 text-white text-sm border-none rounded-xl px-4 py-2.5 pl-10 focus:ring-2 focus:ring-blue-500/50 placeholder-gray-500"
                      />
                      <svg className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                  {/* Sort */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Sort By</label>
                    <SortDropdown
                      value={sortBy}
                      onChange={(option) => {
                        setSortBy(option);
                        setCurrentPage(0);
                      }}
                      className="w-full"
                      options={[
                        { value: 'recent', label: 'Original Order', icon: '🔢' },
                        { value: 'a-z', label: 'A to Z', icon: '↓' },
                        { value: 'z-a', label: 'Z to A', icon: '↑' },
                      ]}
                    />
                  </div>
                </div>

                {/* Download Button */}
                <div className="pt-4 space-y-3">
                  <motion.button
                    onClick={() => downloadFile(worldBook.jsonUrl, `${worldBook.name}.json`)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 flex items-center justify-center gap-2 group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download JSON
                  </motion.button>

                  {/* Copy Import Link - Only for Lumiverse DLCs */}
                  {isLumiverseDLC(worldBook.category) && (
                    <div className="relative">
                      <motion.button
                        onClick={copyImportLink}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 flex items-center justify-center gap-2 group"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Copy Import Link
                      </motion.button>

                      <AnimatePresence>
                        {showCopied && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg border border-gray-600"
                          >
                            Import link copied!
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Entries Section */}
          <div className="lg:col-span-3">
            {entriesArray.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-12 text-center"
              >
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-white mb-2">No entries found</h3>
                <p className="text-gray-400">Try adjusting your search terms</p>
              </motion.div>
            ) : (
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
                      className={`bg-gray-900/50 backdrop-blur-xl border rounded-2xl overflow-hidden transition-colors duration-300 ${
                        expandedEntries[entry.uid] 
                          ? 'border-blue-500/50 bg-gray-900/80' 
                          : 'border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      <div
                        onClick={() => toggleEntry(entry.uid)}
                        className="w-full p-6 flex items-start sm:items-center justify-between cursor-pointer text-left group"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleEntry(entry.uid);
                          }
                        }}
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-800 text-gray-400 text-xs font-mono border border-gray-700">
                              #{entry.order === undefined ? '?' : entry.order}
                            </span>
                            <h3 className={`text-xl font-bold transition-colors ${expandedEntries[entry.uid] ? 'text-blue-400' : 'text-white group-hover:text-blue-400'}`}>
                              {entry.comment || `Entry ${entry.uid}`}
                            </h3>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {entry.key.length > 0 && (
                              <span className="text-xs px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
                                {entry.key.length} trigger{entry.key.length !== 1 ? 's' : ''}
                              </span>
                            )}
                            {entry.depth !== undefined && (
                              <span className="text-xs px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">
                                Depth: {entry.depth}
                              </span>
                            )}
                            {entry.vectorized && (
                              <span className="text-xs px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
                                Vectorized
                              </span>
                            )}
                            {entry.constant && (
                              <span className="text-xs px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400">
                                Constant
                              </span>
                            )}
                            {entry.disable && (
                              <span className="text-xs px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                                Disabled
                              </span>
                            )}
                          </div>
                        </div>
                        <motion.div
                          className={`p-2 rounded-full transition-colors ${expandedEntries[entry.uid] ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-400 group-hover:bg-gray-700'}`}
                          animate={{ rotate: expandedEntries[entry.uid] ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </motion.div>
                      </div>
                      
                      <AnimatePresence>
                        {expandedEntries[entry.uid] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ 
                              height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                              opacity: { duration: 0.2, delay: 0.1 }
                            }}
                            className="overflow-hidden border-t border-gray-800 bg-gray-900/30"
                          >
                            <div className="p-6 space-y-6">
                              {/* Content */}
                              <div className="bg-gray-950/50 border border-gray-800 rounded-xl p-4 font-mono text-sm text-gray-300 whitespace-pre-wrap leading-relaxed selection:bg-blue-500/30">
                                {entry.content}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Trigger Words */}
                                {entry.key.length > 0 && (
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Trigger Words</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {entry.key.map((keyword, idx) => (
                                        <span
                                          key={idx}
                                          className="text-xs px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-300 font-medium"
                                        >
                                          {keyword}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Secondary Keys */}
                                {entry.keysecondary && entry.keysecondary.length > 0 && (
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Secondary Keys</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {entry.keysecondary.map((keyword, idx) => (
                                        <span
                                          key={idx}
                                          className="text-xs px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-300 font-medium"
                                        >
                                          {keyword}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Additional Properties */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-gray-800 text-sm">
                                {entry.probability !== undefined && entry.useProbability && (
                                  <div>
                                    <span className="block text-gray-500 text-xs mb-1">Probability</span>
                                    <span className="font-medium text-white">{entry.probability}%</span>
                                  </div>
                                )}
                                {entry.position !== undefined && (
                                  <div>
                                    <span className="block text-gray-500 text-xs mb-1">Position</span>
                                    <span className="font-medium text-white">{entry.position === 0 ? 'Before' : 'After'}</span>
                                  </div>
                                )}
                                {entry.group && (
                                  <div>
                                    <span className="block text-gray-500 text-xs mb-1">Group</span>
                                    <span className="font-medium text-white">{entry.group}</span>
                                  </div>
                                )}
                                {entry.selective && (
                                  <div>
                                    <span className="block text-gray-500 text-xs mb-1">Selective</span>
                                    <span className="font-medium text-white">Logic {entry.selectiveLogic}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

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
