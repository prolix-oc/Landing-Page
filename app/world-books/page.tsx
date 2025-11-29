'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import AnimatedLink from '@/app/components/AnimatedLink';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { downloadFile } from '@/lib/download';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import WorldBookSkeleton from '@/app/components/WorldBookSkeleton';
import SortDropdown, { SortOption } from '@/app/components/SortDropdown';
import SmartPagination from '@/app/components/SmartPagination';

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
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [sortBy, setSortBy] = useState<SortOption>('a-z');
  
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
        stiffness: 50,
        damping: 15
      }
    }
  };

  // Responsive items per page
  useEffect(() => {
    const calculateItemsPerPage = () => {
      const width = window.innerWidth;
      if (width < 768) return 6;
      if (width < 1024) return 12;
      return 15;
    };

    setItemsPerPage(calculateItemsPerPage());
    const handleResize = () => setItemsPerPage(calculateItemsPerPage());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
          // No files found - check if this is a Lumiverse category that doesn't exist
          setFiles({ standard: [], prolix: [] });
          // Only mark as non-existent if it's a Lumiverse category with exists: false
          // and the API didn't return any files
          setSelectedCategoryExists(lumiverseCat ? lumiverseCat.exists : true);
        }
      } catch (error) {
        console.error('Error fetching files:', error);
        setFiles({ standard: [], prolix: [] });
        // On error, assume category doesn't exist if it's a Lumiverse category marked as non-existent
        setSelectedCategoryExists(lumiverseCat ? lumiverseCat.exists : true);
      } finally {
        setFilesLoading(false);
        setIsTransitioning(false);
      }
    }

    fetchFiles();
    setCurrentPage(0); // Reset page on category change
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

  const handleCategoryChange = (categoryName: string) => {
    if (categoryName !== selectedCategory) {
      setSelectedCategory(categoryName);
      router.push(`/world-books?category=${encodeURIComponent(categoryName)}`, { scroll: false });
    }
  };

  // Helper to process list (sort & paginate)
  const processList = (list: FileItem[]) => {
    // Sort
    const sorted = [...list].sort((a, b) => {
      const nameA = stripProlixPrefix(a.name);
      const nameB = stripProlixPrefix(b.name);
      
      switch (sortBy) {
        case 'a-z': return nameA.localeCompare(nameB);
        case 'z-a': return nameB.localeCompare(nameA);
        // Note: FileItem might not always have lastModified populated depending on API
        // but we can add basic support if available
        case 'recent': 
          if (!a.lastModified || !b.lastModified) return 0;
          return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
        default: return 0;
      }
    });
    return sorted;
  };

  // We'll combine both lists for a single unified paginated view if desired,
  // or keep them separate. The original design separated them.
  // Let's keep them separate but apply sorting to each.
  const sortedStandard = processList(files.standard);
  const sortedProlix = processList(files.prolix);

  const hasFiles = sortedStandard.length > 0 || sortedProlix.length > 0;

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
            World Books
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-300 max-w-3xl"
            variants={itemVariants}
          >
            Browse and download world books organized by category
          </motion.p>
        </motion.div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">
            <LoadingSpinner message="Loading categories..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Categories Sidebar */}
            <motion.div
              className="lg:col-span-1 h-fit"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 sticky top-24 space-y-6">
                {/* Standard World Books */}
                <div>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    World Books
                  </h2>
                  <div className="space-y-2">
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

                {/* Divider */}
                <div className="border-t border-gray-700/50" />

                {/* Lumiverse DLCs */}
                <div>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                    </svg>
                    Lumiverse DLCs
                  </h2>
                  <p className="text-xs text-gray-500 mb-3">Specialized preset-based world books</p>
                  <div className="space-y-2">
                    {lumiverseCategories.map((category) => (
                      <button
                        key={category.name}
                        onClick={() => handleCategoryChange(category.name)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden group ${
                          selectedCategory === category.name
                            ? 'bg-purple-600/20 text-white border border-purple-500/50 shadow-[0_0_15px_rgba(147,51,234,0.2)]'
                            : 'bg-gray-800/30 text-gray-400 border border-transparent hover:bg-gray-800/60 hover:text-gray-200'
                        } ${!category.exists ? 'opacity-60' : ''}`}
                      >
                        {selectedCategory === category.name && (
                          <div className="absolute inset-0 bg-purple-500/10 blur-lg" />
                        )}
                        <span className="relative z-10 font-medium flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            {category.displayName}
                            {!category.exists && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-500">Coming Soon</span>
                            )}
                          </span>
                          {selectedCategory === category.name && (
                            <motion.div layoutId="activeCategory" className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Files Grid */}
            <div className="lg:col-span-3">
              {/* Sort Dropdown */}
              {selectedCategory && hasFiles && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="mb-6"
                >
                  <SortDropdown 
                    value={sortBy} 
                    onChange={setSortBy} 
                    options={[
                      { value: 'a-z', label: 'A to Z' },
                      { value: 'z-a', label: 'Z to A' }
                    ]}
                  />
                </motion.div>
              )}

              <AnimatePresence mode="wait">
                {!selectedCategory ? (
                  <motion.div
                    key="empty-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-12 text-center"
                  >
                    <motion.div 
                      className="text-6xl mb-4"
                      animate={{ x: [0, 10, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      👈
                    </motion.div>
                    <p className="text-xl text-gray-400">Select a category to view world books</p>
                  </motion.div>
                ) : isTransitioning || filesLoading ? (
                  <motion.div
                    key="loading-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {Array.from({ length: 6 }).map((_, index) => (
                      <WorldBookSkeleton key={`skeleton-${index}`} />
                    ))}
                  </motion.div>
                ) : !hasFiles ? (
                  <motion.div
                    key="no-files"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-12 text-center"
                  >
                    {!selectedCategoryExists ? (
                      <>
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
                          <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Coming Soon</h3>
                        <p className="text-gray-400">This Lumiverse DLC category is being prepared.<br />Check back later for new content!</p>
                      </>
                    ) : (
                      <p className="text-xl text-gray-400">No world books found in this category</p>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key={`files-${selectedCategory}`}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={containerVariants}
                    className="space-y-12"
                  >
                    {/* Standard Files */}
                    {sortedStandard.length > 0 && (
                      <motion.div variants={itemVariants}>
                        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
                          </svg>
                          Standard Edition
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {sortedStandard.map((file) => {
                            const displayName = stripProlixPrefix(file.name);
                            return (
                              <motion.div
                                key={file.path}
                                variants={itemVariants}
                                className="group relative bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden transition-all duration-300 hover:bg-gray-900/90 hover:border-gray-700 hover:shadow-2xl hover:-translate-y-1"
                              >
                                {/* Glow effect on hover */}
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
                                
                                <div className="relative p-6 flex flex-col h-full">
                                  <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform duration-300">
                                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                      </svg>
                                    </div>
                                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                                      {formatFileSize(file.size)}
                                    </span>
                                  </div>

                                  <Link href={`/world-books/${encodeURIComponent(selectedCategory as string)}/${encodeURIComponent(file.name)}`}>
                                    <h4 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-green-400 transition-colors cursor-pointer" title={displayName}>
                                      {displayName}
                                    </h4>
                                  </Link>

                                  <div className="mt-auto pt-4 flex gap-3">
                                    <Link 
                                      href={`/world-books/${encodeURIComponent(selectedCategory as string)}/${encodeURIComponent(file.name)}`}
                                      className="flex-1"
                                    >
                                      <motion.div
                                        className="w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-xl transition-colors text-center text-sm font-medium border border-gray-700 hover:border-gray-600"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                      >
                                        View Details
                                      </motion.div>
                                    </Link>
                                    <motion.button
                                      onClick={() => downloadFile(file.downloadUrl, file.name)}
                                      className="bg-green-600/20 hover:bg-green-600/30 text-green-400 hover:text-green-300 px-3 py-2.5 rounded-xl transition-colors border border-green-500/30 hover:border-green-500/50"
                                      title="Download"
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                      </svg>
                                    </motion.button>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {/* Prolix Preferred Files */}
                    {sortedProlix.length > 0 && (
                      <motion.div variants={itemVariants}>
                        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          Prolix Preferred
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {sortedProlix.map((file) => {
                            const displayName = stripProlixPrefix(file.name);
                            return (
                              <motion.div
                                key={file.path}
                                variants={itemVariants}
                                className="group relative bg-gray-900/50 backdrop-blur-xl border border-purple-900/30 rounded-2xl overflow-hidden transition-all duration-300 hover:bg-gray-900/90 hover:border-purple-700/50 hover:shadow-2xl hover:-translate-y-1"
                              >
                                {/* Glow effect on hover */}
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
                                
                                <div className="relative p-6 flex flex-col h-full">
                                  <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform duration-300">
                                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                    </div>
                                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-900/30 text-purple-300 border border-purple-700/30">
                                      {formatFileSize(file.size)}
                                    </span>
                                  </div>

                                  <Link href={`/world-books/${encodeURIComponent(selectedCategory as string)}/${encodeURIComponent(file.name)}`}>
                                    <h4 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors cursor-pointer" title={displayName}>
                                      {displayName}
                                    </h4>
                                  </Link>

                                  <div className="mt-auto pt-4 flex gap-3">
                                    <Link 
                                      href={`/world-books/${encodeURIComponent(selectedCategory as string)}/${encodeURIComponent(file.name)}`}
                                      className="flex-1"
                                    >
                                      <motion.div
                                        className="w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-xl transition-colors text-center text-sm font-medium border border-gray-700 hover:border-gray-600"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                      >
                                        View Details
                                      </motion.div>
                                    </Link>
                                    <motion.button
                                      onClick={() => downloadFile(file.downloadUrl, file.name)}
                                      className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 hover:text-purple-300 px-3 py-2.5 rounded-xl transition-colors border border-purple-500/30 hover:border-purple-500/50"
                                      title="Download"
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                      </svg>
                                    </motion.button>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
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

export default function WorldBooksPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen relative">
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center text-gray-400 py-12">Loading...</div>
        </div>
      </div>
    }>
      <WorldBooksContent />
    </Suspense>
  );
}
