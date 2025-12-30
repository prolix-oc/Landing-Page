'use client';

import { useState, useEffect, useRef } from 'react';
import AnimatedLink from '@/app/components/AnimatedLink';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { downloadFile } from '@/lib/download';
import SmartPagination from '@/app/components/SmartPagination';
import SortDropdown, { SortOption } from '@/app/components/SortDropdown';
import { isLumiverseDLC } from '@/lib/constants';
import {
  ArrowLeft,
  BookOpen,
  Download,
  Link as LinkIcon,
  Search,
  ChevronDown,
  Layers,
  HardDrive,
  Calendar,
  Hash,
  Key,
  Sparkles,
  ToggleLeft,
  Database,
  Tag,
  Clock
} from 'lucide-react';

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

// RevealSection component for scroll-triggered animations
function RevealSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function WorldBookDetailsPage() {
  const params = useParams();
  const [worldBook, setWorldBook] = useState<WorldBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [expandedEntries, setExpandedEntries] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showCopied, setShowCopied] = useState(false);
  const entriesContainerRef = useRef<HTMLDivElement>(null);

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
      <div className="min-h-screen relative overflow-hidden">
        {/* CSS Animated Orbs - GPU Optimized (reduced blur for Safari perf) */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-20">
          <div className="orb-1 absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-cyan-600/25 rounded-full blur-[80px]" />
          <div className="orb-2 absolute top-[50%] right-[0%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[80px]" />
        </div>


        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center text-gray-400 py-12">
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <BookOpen className="w-8 h-8 text-cyan-400" />
            </motion.div>
            <p className="mt-4 text-lg">Loading world book...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !worldBook) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* CSS Animated Orbs (reduced blur for Safari perf) */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-20">
          <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-red-600/25 rounded-full blur-[80px]" />
        </div>

        <div className="relative container mx-auto px-4 py-16">
          <AnimatedLink href="/world-books" className="group inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-8" isBackLink>
            <ArrowLeft className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to World Books</span>
          </AnimatedLink>
          <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-12 text-center">
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

  const isProlix = worldBook.name.match(/Prolix\s+(?:Preferred|Edition)/i);
  const accentColor = isProlix ? 'purple' : 'cyan';

  return (
    <div className="h-screen flex flex-col relative overflow-hidden vt-exclude">
      {/* CSS Animated Orbs - GPU Optimized (reduced blur for Safari perf) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-20">
        <div className="orb-1 absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-cyan-600/25 rounded-full blur-[80px]" />
        <div className="orb-2 absolute top-[50%] right-[0%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[80px]" />
        <div className="orb-3 absolute bottom-[10%] left-[30%] w-[450px] h-[450px] bg-blue-600/20 rounded-full blur-[70px]" />
      </div>

      {/* Back Link - Fixed Pill Button */}
      <div className="fixed top-6 left-6 z-50">
        <AnimatedLink
          href={`/world-books?category=${encodeURIComponent(worldBook.category)}`}
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/80 border border-white/10 text-gray-400 hover:text-cyan-400 hover:bg-gray-800/90 hover:border-cyan-500/30 transition-all"
          isBackLink
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to {worldBook.category}</span>
        </AnimatedLink>
      </div>

      <div className="flex-1 flex flex-col container mx-auto px-4 py-8 sm:py-12 min-h-0 vt-exclude">
        {/* Single Glass Container */}
        <div className="relative flex-1 min-h-0 flex flex-col vt-exclude">
          {/* Single backdrop-blur layer (md = 12px, optimized for Safari) */}
          <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/[0.05]" />

          {/* Content grid inside */}
          <div className="relative flex-1 min-h-0 p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
              {/* World Book Info Sidebar */}
              <div className="lg:col-span-1 lg:overflow-y-auto">
                <div className="space-y-6">
                  {/* Title Section */}
                  <div>
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 ${
                        isProlix
                          ? 'bg-purple-500/10 border border-purple-500/20'
                          : 'bg-cyan-500/10 border border-cyan-500/20'
                      }`}
                    >
                      {isProlix ? (
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      ) : (
                        <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                      <span className={`text-xs font-medium ${isProlix ? 'text-purple-300' : 'text-cyan-300'}`}>
                        {isProlix ? 'Prolix Preferred' : 'Standard Edition'}
                      </span>
                    </div>
                    <h1 className={`text-2xl font-bold text-white mb-2 break-words`}>
                      {worldBook.name.replace('.json', '').replace(/\s*Prolix\s+\w+/gi, '').trim()}
                    </h1>
                    <p className="text-sm text-gray-400 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      {worldBook.category}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="space-y-3 py-4 border-t border-white/[0.05]">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-cyan-400" />
                        Total Entries
                      </span>
                      <span className="text-white font-semibold">{entriesArray.length}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-blue-400" />
                        Size
                      </span>
                      <span className="text-white font-semibold">
                        {(worldBook.size / 1024).toFixed(1)} KB
                      </span>
                    </div>

                    {worldBook.lastModified && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-purple-400" />
                          Updated
                        </span>
                        <span className="text-white font-semibold">
                          {new Date(worldBook.lastModified).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="space-y-4 py-4 border-t border-white/[0.05]">
                    {/* Search */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-2 px-1">Search Entries</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(0);
                          }}
                          placeholder="Search..."
                          className="w-full bg-white/[0.05] text-white text-sm border border-white/[0.08] rounded-xl px-4 py-2.5 pl-10 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/30 placeholder-gray-500 transition-all"
                        />
                        <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                      </div>
                    </div>

                    {/* Sort */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-2 px-1">Sort By</label>
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

                  {/* Download Buttons */}
                  <div className="space-y-3 py-4 border-t border-white/[0.05]">
                    <button
                      onClick={() => downloadFile(worldBook.jsonUrl, `${worldBook.name}.json`)}
                      className={`w-full px-4 py-3 rounded-xl transition-all duration-200 font-medium flex items-center justify-center gap-2 group hover:scale-[1.02] active:scale-[0.98] ${
                        isProlix
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40'
                          : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40'
                      }`}
                    >
                      <Download className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
                      Download JSON
                    </button>

                    {/* Copy Import Link - Only for Lumiverse DLCs */}
                    {isLumiverseDLC(worldBook.category) && (
                      <div className="relative">
                        <button
                          onClick={copyImportLink}
                          className="w-full bg-white/[0.05] hover:bg-white/[0.08] text-white px-4 py-3 rounded-xl transition-all duration-200 font-medium border border-white/[0.08] hover:border-white/[0.15] flex items-center justify-center gap-2 group hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <LinkIcon className="w-5 h-5" />
                          Copy Import Link
                        </button>

                        <AnimatePresence>
                          {showCopied && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.9 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.9 }}
                              transition={{ duration: 0.2 }}
                              className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-green-500/20 border border-green-500/30 text-green-400 px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg"
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

              {/* Entries Section - Scrollable on desktop */}
              <div className="lg:col-span-3 flex flex-col min-h-0">
                {entriesArray.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-12 text-center"
                  >
                    <motion.div
                      className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-500/10 border border-gray-500/20 mb-4"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    >
                      <Search className="w-8 h-8 text-gray-400" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-white mb-2">No entries found</h3>
                    <p className="text-gray-400">Try adjusting your search terms</p>
                  </motion.div>
                ) : (
                  <div
                    ref={entriesContainerRef}
                    className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-4 pb-20 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                  >
                    <AnimatePresence mode="wait">
                      {currentEntries.map((entry, index) => (
                        <RevealSection key={`${currentPage}-${entry.uid}`} delay={index * 0.05}>
                          <motion.div
                            layout
                            className={`group relative bg-gradient-to-br from-white/[0.04] to-transparent border rounded-2xl overflow-hidden transition-all duration-300 ${
                              expandedEntries[entry.uid]
                                ? `border-${accentColor}-500/40 shadow-lg shadow-${accentColor}-500/10`
                                : 'border-white/[0.08] hover:border-white/[0.15]'
                            }`}
                          >
                            {/* Accent bar when expanded */}
                            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${
                              isProlix ? 'from-purple-500 to-pink-500' : 'from-cyan-500 to-blue-500'
                            } transform transition-transform duration-500 origin-left ${
                              expandedEntries[entry.uid] ? 'scale-x-100' : 'scale-x-0'
                            }`} />

                            <div
                              onClick={() => toggleEntry(entry.uid)}
                              className="w-full p-5 flex items-start sm:items-center justify-between cursor-pointer text-left"
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
                                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.05] text-gray-400 text-xs font-mono border border-white/[0.08]">
                                    <Hash className="w-3 h-3 mr-0.5" />
                                    {entry.order === undefined ? '?' : entry.order}
                                  </span>
                                  <h3 className={`text-lg font-bold transition-colors ${
                                    expandedEntries[entry.uid]
                                      ? isProlix ? 'text-purple-400' : 'text-cyan-400'
                                      : 'text-white group-hover:text-cyan-400'
                                  }`}>
                                    {entry.comment || `Entry ${entry.uid}`}
                                  </h3>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  {entry.key.length > 0 && (
                                    <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
                                      <Key className="w-3 h-3" />
                                      {entry.key.length} trigger{entry.key.length !== 1 ? 's' : ''}
                                    </span>
                                  )}
                                  {entry.depth !== undefined && (
                                    <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">
                                      <Layers className="w-3 h-3" />
                                      Depth: {entry.depth}
                                    </span>
                                  )}
                                  {entry.vectorized && (
                                    <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
                                      <Database className="w-3 h-3" />
                                      Vectorized
                                    </span>
                                  )}
                                  {entry.constant && (
                                    <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
                                      <ToggleLeft className="w-3 h-3" />
                                      Constant
                                    </span>
                                  )}
                                  {entry.disable && (
                                    <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                                      Disabled
                                    </span>
                                  )}
                                </div>
                              </div>
                              <motion.div
                                className={`p-2 rounded-xl transition-colors ${
                                  expandedEntries[entry.uid]
                                    ? isProlix ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'
                                    : 'bg-white/[0.05] text-gray-400 group-hover:bg-white/[0.08]'
                                }`}
                                animate={{ rotate: expandedEntries[entry.uid] ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronDown className="w-5 h-5" />
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
                                  className="overflow-hidden border-t border-white/[0.05]"
                                >
                                  <div className="p-5 space-y-5">
                                    {/* Content */}
                                    <div className="bg-black/20 border border-white/[0.05] rounded-xl p-4 font-mono text-sm text-gray-300 whitespace-pre-wrap leading-relaxed selection:bg-cyan-500/30 max-h-96 overflow-y-auto">
                                      {entry.content}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                      {/* Trigger Words */}
                                      {entry.key.length > 0 && (
                                        <div>
                                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <Key className="w-3 h-3 text-blue-400" />
                                            Trigger Words
                                          </h4>
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
                                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <Key className="w-3 h-3 text-cyan-400" />
                                            Secondary Keys
                                          </h4>
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
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-white/[0.05] text-sm">
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
                        </RevealSection>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Pagination at Bottom - Floating above content */}
      {!loading && !error && totalPages > 1 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
          <div className="container mx-auto px-4 pb-6 pt-4">
            <div className="pointer-events-auto">
              <SmartPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  entriesContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
