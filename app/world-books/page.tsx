'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import AnimatedLink from '@/app/components/AnimatedLink';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadFile } from '@/lib/download';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import WorldBookSkeleton from '@/app/components/WorldBookSkeleton';
import SortDropdown, { SortOption } from '@/app/components/SortDropdown';
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Download,
  Zap,
  Star,
  Scale,
  HardDrive,
  Sparkles,
  Clock
} from 'lucide-react';

interface Category {
  name: string;
  path: string;
  displayName: string;
}

interface LumiverseCategory extends Category {
  exists: boolean;
}

interface FileItem {
  name: string;
  path: string;
  downloadUrl: string;
  size: number;
  htmlUrl: string;
  lastModified?: string;
}

interface FileCategories {
  standard: FileItem[];
  prolix: FileItem[];
}

function WorldBooksContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [lumiverseCategories, setLumiverseCategories] = useState<LumiverseCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryExists, setSelectedCategoryExists] = useState(true);
  const [files, setFiles] = useState<FileCategories>({ standard: [], prolix: [] });
  const [loading, setLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Pagination & Sorting
  const [sortBy, setSortBy] = useState<SortOption>('a-z');

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
      setSelectedCategory(decodeURIComponent(categoryParam));
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/world-books');
        const data = await response.json();
        if (data.success) {
          setCategories(data.categories);
          setLumiverseCategories(data.lumiverseCategories || []);
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
      setFiles({ standard: [], prolix: [] });
      setSelectedCategoryExists(true);
      return;
    }

    // Check if this is a Lumiverse category
    const lumiverseCat = lumiverseCategories.find(cat => cat.name === selectedCategory);

    async function fetchFiles() {
      setIsTransitioning(true);
      setFilesLoading(true);

      // Small delay for smoother transitions
      await new Promise(resolve => setTimeout(resolve, 150));

      try {
        const response = await fetch(`/api/world-books/${encodeURIComponent(selectedCategory as string)}`);
        const data = await response.json();
        if (data.success && data.files && data.files.length > 0) {
          const standard: FileItem[] = [];
          const prolix: FileItem[] = [];

          data.files.forEach((file: FileItem) => {
            if (file.name.match(/Prolix\s+(?:Preferred|Edition)/i)) {
              prolix.push(file);
            } else {
              standard.push(file);
            }
          });

          setFiles({ standard, prolix });
          setSelectedCategoryExists(true);
        } else {
          setFiles({ standard: [], prolix: [] });
          setSelectedCategoryExists(lumiverseCat ? lumiverseCat.exists : true);
        }
      } catch (error) {
        console.error('Error fetching files:', error);
        setFiles({ standard: [], prolix: [] });
        setSelectedCategoryExists(lumiverseCat ? lumiverseCat.exists : true);
      } finally {
        setFilesLoading(false);
        setIsTransitioning(false);
      }
    }

    fetchFiles();
  }, [selectedCategory, lumiverseCategories]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const stripProlixPrefix = (name: string) => {
    let formatted = name.replace('.json', '');
    formatted = formatted.replace(/\s*Prolix\s+\w+/gi, '').trim();
    return formatted;
  };

  const handleCategoryChange = async (categoryName: string) => {
    if (categoryName !== selectedCategory) {
      setIsTransitioning(true);
      await new Promise(resolve => setTimeout(resolve, 150));
      setSelectedCategory(categoryName);
      router.push(`/world-books?category=${encodeURIComponent(categoryName)}`, { scroll: false });
      setIsTransitioning(false);
    }
  };

  // Helper to process list (sort)
  const processList = (list: FileItem[]) => {
    const sorted = [...list].sort((a, b) => {
      const nameA = stripProlixPrefix(a.name);
      const nameB = stripProlixPrefix(b.name);

      switch (sortBy) {
        case 'a-z': return nameA.localeCompare(nameB);
        case 'z-a': return nameB.localeCompare(nameA);
        case 'recent':
          if (!a.lastModified || !b.lastModified) return 0;
          return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
        default: return 0;
      }
    });
    return sorted;
  };

  const sortedStandard = processList(files.standard);
  const sortedProlix = processList(files.prolix);
  const hasFiles = sortedStandard.length > 0 || sortedProlix.length > 0;
  const totalBooks = files.standard.length + files.prolix.length;
  const totalCategories = categories.length + lumiverseCategories.length;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Back Link - Fixed Pill Button */}
      <div className="fixed top-6 left-6 z-50">
        <AnimatedLink
          href="/"
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/80 border border-white/10 text-gray-400 hover:text-cyan-400 hover:bg-gray-800/90 hover:border-cyan-500/30 transition-all"
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
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-gradient bg-[length:200%_auto]">
              World Books
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-5">
            Browse and download world books to enhance your roleplay experience
          </p>

          {/* Stats Row */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span><strong className="text-white">{totalCategories}</strong> categories</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-600" />
            <div className="flex items-center gap-2 text-gray-400">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span><strong className="text-white">{lumiverseCategories.length}</strong> DLCs</span>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="text-center text-gray-400 py-12">
            <LoadingSpinner message="Loading categories..." />
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
                  <div className="lg:sticky lg:top-24 space-y-6">
                    {/* Standard World Books */}
                    <div>
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4 px-1">
                        <BookOpen className="w-5 h-5 text-cyan-400" />
                        World Books
                      </h2>
                      <div className="space-y-2">
                        {categories.map((category, index) => (
                          <motion.button
                            key={category.name}
                            onClick={() => handleCategoryChange(category.name)}
                            className={`group w-full text-left px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden flex items-center justify-between hover:translate-x-1 active:scale-[0.98] ${
                              selectedCategory === category.name
                                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-white border border-cyan-500/30'
                                : 'bg-white/[0.03] text-gray-400 border border-white/[0.05] hover:bg-white/[0.06] hover:text-gray-200 hover:border-white/[0.1]'
                            }`}
                            initial={animationsEnabled ? { opacity: 0, x: -20 } : false}
                            animate={{ opacity: 1, x: 0 }}
                            transition={animationsEnabled ? { delay: index * 0.05 } : { duration: 0 }}
                          >
                            <span className="font-medium">{category.displayName}</span>
                            <ChevronRight className={`w-4 h-4 transition-all ${
                              selectedCategory === category.name ? 'text-cyan-400 opacity-100' : 'opacity-0 group-hover:opacity-50'
                            }`} />
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-white/[0.05]" />

                    {/* Lumiverse DLCs */}
                    <div>
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-2 px-1">
                        <Zap className="w-5 h-5 text-purple-400" />
                        Lumiverse DLCs
                      </h2>
                      <p className="text-xs text-gray-500 mb-4 px-1">Specialized preset-based world books</p>
                      <div className="space-y-2">
                        {lumiverseCategories.map((category, index) => (
                          <motion.button
                            key={category.name}
                            onClick={() => handleCategoryChange(category.name)}
                            className={`group w-full text-left px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden flex items-center justify-between hover:translate-x-1 active:scale-[0.98] ${
                              selectedCategory === category.name
                                ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/10 text-white border border-purple-500/30'
                                : 'bg-white/[0.03] text-gray-400 border border-white/[0.05] hover:bg-white/[0.06] hover:text-gray-200 hover:border-white/[0.1]'
                            } ${!category.exists ? 'opacity-60' : ''}`}
                            initial={animationsEnabled ? { opacity: 0, x: -20 } : false}
                            animate={{ opacity: 1, x: 0 }}
                            transition={animationsEnabled ? { delay: (categories.length + index) * 0.05 } : { duration: 0 }}
                          >
                            <span className="font-medium flex items-center gap-2">
                              {category.displayName}
                              {!category.exists && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-500">Coming Soon</span>
                              )}
                            </span>
                            <ChevronRight className={`w-4 h-4 transition-all ${
                              selectedCategory === category.name ? 'text-purple-400 opacity-100' : 'opacity-0 group-hover:opacity-50'
                            }`} />
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Files Grid */}
                <div className="lg:col-span-3">
                  {/* Sort Dropdown */}
                  {selectedCategory && hasFiles && (
                    <div className="mb-6">
                      <SortDropdown
                        value={sortBy}
                        onChange={setSortBy}
                        options={[
                          { value: 'a-z', label: 'A to Z' },
                          { value: 'z-a', label: 'Z to A' }
                        ]}
                      />
                    </div>
                  )}

                  <AnimatePresence mode="wait">
                    {!selectedCategory ? (
                      <motion.div
                        key="empty-state"
                        initial={animationsEnabled ? { opacity: 0 } : false}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={animationsEnabled ? { duration: 0.3 } : { duration: 0 }}
                        className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-12 text-center"
                      >
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mb-4">
                          <ArrowLeft className="w-8 h-8 text-cyan-400" />
                        </div>
                        <p className="text-xl text-gray-400 mb-2">Select a category</p>
                        <p className="text-gray-500">Choose from the sidebar to view world books</p>
                      </motion.div>
                    ) : isTransitioning || filesLoading ? (
                      <motion.div
                        key="loading-state"
                        initial={animationsEnabled ? { opacity: 0 } : false}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={animationsEnabled ? { duration: 0.3 } : { duration: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
                      >
                        {Array.from({ length: 6 }).map((_, index) => (
                          <WorldBookSkeleton key={`skeleton-${index}`} />
                        ))}
                      </motion.div>
                    ) : !hasFiles ? (
                      <motion.div
                        key="no-files"
                        initial={animationsEnabled ? { opacity: 0 } : false}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={animationsEnabled ? { duration: 0.3 } : { duration: 0 }}
                        className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-12 text-center"
                      >
                        {!selectedCategoryExists ? (
                          <>
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-4">
                              <Clock className="w-8 h-8 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Coming Soon</h3>
                            <p className="text-gray-400">This Lumiverse DLC category is being prepared.<br />Check back later for new content!</p>
                          </>
                        ) : (
                          <>
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-500/10 border border-gray-500/20 mb-4">
                              <BookOpen className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-xl text-gray-400">No world books found in this category</p>
                          </>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key={`files-${selectedCategory}`}
                        initial={animationsEnabled ? { opacity: 0 } : false}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={animationsEnabled ? { duration: 0.3 } : { duration: 0 }}
                        className="space-y-10"
                      >
                        {/* Standard Files */}
                        {sortedStandard.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 px-1">
                              <Scale className="w-5 h-5 text-green-400" />
                              Standard Edition
                              <span className="text-sm font-normal text-gray-500">({sortedStandard.length})</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                              {sortedStandard.map((file, index) => {
                                const displayName = stripProlixPrefix(file.name);
                                return (
                                  <motion.div
                                    key={file.path}
                                    initial={animationsEnabled ? { opacity: 0, y: 15 } : false}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={animationsEnabled ? { duration: 0.3, delay: index * 0.03 } : { duration: 0 }}
                                    className="group relative bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.08] rounded-2xl overflow-hidden transition-all duration-300 hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/10 hover:-translate-y-1"
                                  >
                                    {/* Gradient overlay on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                    {/* Accent bar */}
                                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

                                    <div className="relative p-5">
                                      <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform duration-300">
                                          <BookOpen className="w-6 h-6" />
                                        </div>
                                        <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-white/[0.05] text-gray-400 border border-white/[0.08]">
                                          <HardDrive className="w-3 h-3" />
                                          {formatFileSize(file.size)}
                                        </span>
                                      </div>

                                      <Link href={`/world-books/${encodeURIComponent(selectedCategory as string)}/${encodeURIComponent(file.name)}`}>
                                        <h4 className="text-lg font-bold text-white mb-4 line-clamp-2 group-hover:text-green-400 transition-colors cursor-pointer" title={displayName}>
                                          {displayName}
                                        </h4>
                                      </Link>

                                      <div className="flex gap-3">
                                        <Link
                                          href={`/world-books/${encodeURIComponent(selectedCategory as string)}/${encodeURIComponent(file.name)}`}
                                          className="flex-1"
                                        >
                                          <div className="w-full bg-white/[0.05] hover:bg-white/[0.08] text-white px-4 py-2.5 rounded-xl transition-all text-center text-sm font-medium border border-white/[0.08] hover:border-white/[0.15] hover:scale-[1.02] active:scale-[0.98]">
                                            View Details
                                          </div>
                                        </Link>
                                        <button
                                          onClick={() => downloadFile(file.downloadUrl, file.name)}
                                          className="bg-green-500/10 hover:bg-green-500/20 text-green-400 px-3 py-2.5 rounded-xl transition-all border border-green-500/20 hover:border-green-500/40 hover:scale-105 active:scale-95"
                                          title="Download"
                                        >
                                          <Download className="w-5 h-5" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Shimmer effect */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden">
                                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Prolix Preferred Files */}
                        {sortedProlix.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 px-1">
                              <Star className="w-5 h-5 text-purple-400" />
                              Prolix Preferred
                              <span className="text-sm font-normal text-gray-500">({sortedProlix.length})</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                              {sortedProlix.map((file, index) => {
                                const displayName = stripProlixPrefix(file.name);
                                return (
                                  <motion.div
                                    key={file.path}
                                    initial={animationsEnabled ? { opacity: 0, y: 15 } : false}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={animationsEnabled ? { duration: 0.3, delay: index * 0.03 } : { duration: 0 }}
                                    className="group relative bg-gradient-to-br from-white/[0.04] to-transparent border border-purple-900/30 rounded-2xl overflow-hidden transition-all duration-300 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1"
                                  >
                                    {/* Gradient overlay on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                    {/* Accent bar */}
                                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

                                    <div className="relative p-5">
                                      <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform duration-300">
                                          <Star className="w-6 h-6" />
                                        </div>
                                        <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-purple-900/30 text-purple-300 border border-purple-700/30">
                                          <HardDrive className="w-3 h-3" />
                                          {formatFileSize(file.size)}
                                        </span>
                                      </div>

                                      <Link href={`/world-books/${encodeURIComponent(selectedCategory as string)}/${encodeURIComponent(file.name)}`}>
                                        <h4 className="text-lg font-bold text-white mb-4 line-clamp-2 group-hover:text-purple-400 transition-colors cursor-pointer" title={displayName}>
                                          {displayName}
                                        </h4>
                                      </Link>

                                      <div className="flex gap-3">
                                        <Link
                                          href={`/world-books/${encodeURIComponent(selectedCategory as string)}/${encodeURIComponent(file.name)}`}
                                          className="flex-1"
                                        >
                                          <div className="w-full bg-white/[0.05] hover:bg-white/[0.08] text-white px-4 py-2.5 rounded-xl transition-all text-center text-sm font-medium border border-white/[0.08] hover:border-white/[0.15] hover:scale-[1.02] active:scale-[0.98]">
                                            View Details
                                          </div>
                                        </Link>
                                        <button
                                          onClick={() => downloadFile(file.downloadUrl, file.name)}
                                          className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 px-3 py-2.5 rounded-xl transition-all border border-purple-500/20 hover:border-purple-500/40 hover:scale-105 active:scale-95"
                                          title="Download"
                                        >
                                          <Download className="w-5 h-5" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Shimmer effect */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden">
                                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        )}
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

export default function WorldBooksPage() {
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
      <WorldBooksContent />
    </Suspense>
  );
}
