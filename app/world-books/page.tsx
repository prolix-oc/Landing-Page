'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadFile } from '@/lib/download';
import LoadingSpinner from '@/app/components/LoadingSpinner';

interface Category {
  name: string;
  path: string;
  displayName: string;
}

interface FileItem {
  name: string;
  path: string;
  downloadUrl: string;
  size: number;
  htmlUrl: string;
}

interface FileCategories {
  standard: FileItem[];
  featured: FileItem[];
}

function WorldBooksContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [files, setFiles] = useState<FileCategories>({ standard: [], featured: [] });
  const [loading, setLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(false);
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
        const response = await fetch('/api/world-books');
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
      setFiles({ standard: [], featured: [] });
      return;
    }

    async function fetchFiles() {
      setIsTransitioning(true);
      setFilesLoading(true);

      // Small delay to ensure fade out completes
      await new Promise(resolve => setTimeout(resolve, 150));

      try {
        const response = await fetch(`/api/world-books/${encodeURIComponent(selectedCategory as string)}`);
        const data = await response.json();
        if (data.success) {
          // Separate files into standard and featured
          const standard: FileItem[] = [];
          const featured: FileItem[] = [];

          data.files.forEach((file: FileItem) => {
            if (file.name.match(/(?:Featured|Premium|Special)/i)) {
              featured.push(file);
            } else {
              standard.push(file);
            }
          });

          setFiles({ standard, featured });
        }
      } catch (error) {
        console.error('Error fetching files:', error);
      } finally {
        setFilesLoading(false);
        setIsTransitioning(false);
      }
    }

    fetchFiles();
  }, [selectedCategory]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Helper function to strip special prefixes from filename
  const stripSpecialPrefix = (name: string) => {
    // Remove .json extension first
    let formatted = name.replace('.json', '');
    // Remove special prefixes like "Featured", "Premium", etc.
    formatted = formatted.replace(/\s*(?:Featured|Premium|Special)\s+/gi, '').trim();
    return formatted;
  };

  const handleCategoryChange = (categoryName: string) => {
    if (categoryName !== selectedCategory) {
      setSelectedCategory(categoryName);
      // Update URL with category parameter
      router.push(`/world-books?category=${encodeURIComponent(categoryName)}`, { scroll: false });
    }
  };

  const hasFiles = files.standard.length > 0 || files.featured.length > 0;

  return (
    <div className="min-h-screen relative retro-scanlines">
      {/* Retro floating shapes background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-15">
        <div className="absolute top-20 right-20 w-32 h-32 rounded-full bg-gradient-to-br from-[var(--y2k-pink)] to-[var(--y2k-lavender)] blur-3xl animate-float"></div>
        <div className="absolute bottom-40 left-20 w-40 h-40 rounded-full bg-gradient-to-br from-[var(--y2k-mint)] to-[var(--y2k-blue)] blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative container mx-auto px-4 py-16">
        {/* Retro Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/" className="retro-button inline-flex items-center mb-6 text-sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back Home
          </Link>
          <h1 className="text-5xl font-bold retro-glow-text mb-4 flex items-center gap-3">
            <span className="text-6xl">📚</span>
            BunnyMo Packs
          </h1>
          <p className="text-xl text-gray-300">Browse themed expansion packs for your BunnyMo system!</p>
        </motion.div>

        {/* Retro divider */}
        <div className="retro-divider mb-8"></div>

        {loading ? (
          <div className="retro-box text-center py-12">
            <LoadingSpinner message="Loading packs..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Retro Categories Sidebar */}
            <motion.div
              className="lg:col-span-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="retro-box p-6 sticky top-4">
                <div className="retro-window-controls"></div>
                <h2 className="text-xl font-bold mb-4 pt-6" style={{ color: 'var(--y2k-pink)' }}>
                  📁 Packs
                </h2>
                <div className="space-y-2">
                  {categories.map((category, index) => (
                    <motion.button
                      key={category.name}
                      onClick={() => handleCategoryChange(category.name)}
                      className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${
                        selectedCategory === category.name
                          ? 'retro-button'
                          : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border-2 border-transparent hover:border-[var(--y2k-purple)]'
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-lg">📂</span>
                        <span className="truncate">{category.displayName}</span>
                      </span>
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
                    className="retro-box p-12 text-center"
                  >
                    <motion.div
                      className="text-6xl mb-4"
                      animate={{ x: [0, -10, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      👈
                    </motion.div>
                    <p className="text-xl text-gray-300">Select a pack to browse files!</p>
                    <div className="retro-badge mt-4">✨ Choose one!</div>
                  </motion.div>
                ) : isTransitioning || filesLoading ? (
                  <motion.div
                    key="loading-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="retro-box text-center py-12"
                  >
                    <LoadingSpinner message="Loading files..." />
                  </motion.div>
                ) : !hasFiles ? (
                  <motion.div
                    key="no-files"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="retro-box p-12 text-center"
                  >
                    <p className="text-xl text-gray-300 mb-4">📂 Empty folder!</p>
                    <p className="text-gray-400">No files found in this pack</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`files-${selectedCategory}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-8"
                  >
                    {/* Standard Files */}
                    {files.standard.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--y2k-mint)' }}>
                          <span className="text-2xl">📄</span>
                          Files
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {files.standard.map((file, index) => {
                            const displayName = stripSpecialPrefix(file.name);
                            return (
                              <motion.div
                                key={file.path}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                                className="retro-card group hover:scale-105 transition-transform duration-200"
                                whileHover={{ y: -5 }}
                              >
                                <div className="flex items-start gap-3 mb-3">
                                  <span className="text-3xl group-hover:scale-110 transition-transform">📋</span>
                                  <div className="flex-1 min-w-0">
                                    <Link href={`/world-books/${encodeURIComponent(selectedCategory as string)}/${encodeURIComponent(file.name)}`}>
                                      <h4 className="text-base font-bold mb-1 truncate hover:text-[var(--y2k-blue)] transition-colors cursor-pointer"
                                          style={{ color: 'var(--y2k-mint)' }}
                                          title={displayName}>
                                        {displayName}
                                      </h4>
                                    </Link>
                                    <p className="text-sm text-gray-400">{formatFileSize(file.size)}</p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Link
                                    href={`/world-books/${encodeURIComponent(selectedCategory as string)}/${encodeURIComponent(file.name)}`}
                                    className="flex-1"
                                  >
                                    <motion.button
                                      className="w-full bg-gradient-to-r from-[var(--y2k-blue)] to-[var(--y2k-mint)] text-black px-3 py-2 rounded-lg font-semibold text-sm border-2 border-[var(--y2k-purple)] shadow-lg"
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      View
                                    </motion.button>
                                  </Link>
                                  <motion.button
                                    onClick={() => downloadFile(file.downloadUrl, file.name)}
                                    className="bg-gradient-to-r from-[var(--y2k-pink)] to-[var(--y2k-lavender)] text-black px-3 py-2 rounded-lg font-semibold text-sm border-2 border-[var(--y2k-purple)] shadow-lg"
                                    title="Download"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                  </motion.button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {/* Featured Files */}
                    {files.featured.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.15 }}
                      >
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--y2k-pink)' }}>
                          <span className="text-2xl">⭐</span>
                          Featured
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {files.featured.map((file, index) => {
                            const displayName = stripSpecialPrefix(file.name);
                            return (
                              <motion.div
                                key={file.path}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                                className="retro-card group hover:scale-105 transition-transform duration-200 border-2 border-[var(--y2k-pink)]"
                                whileHover={{ y: -5 }}
                              >
                                <div className="flex items-start gap-3 mb-3">
                                  <span className="text-3xl group-hover:scale-110 transition-transform">✨</span>
                                  <div className="flex-1 min-w-0">
                                    <Link href={`/world-books/${encodeURIComponent(selectedCategory as string)}/${encodeURIComponent(file.name)}`}>
                                      <h4 className="text-base font-bold mb-1 truncate hover:text-[var(--y2k-pink)] transition-colors cursor-pointer"
                                          style={{ color: 'var(--y2k-lavender)' }}
                                          title={displayName}>
                                        {displayName}
                                      </h4>
                                    </Link>
                                    <p className="text-sm text-gray-400">{formatFileSize(file.size)}</p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Link
                                    href={`/world-books/${encodeURIComponent(selectedCategory as string)}/${encodeURIComponent(file.name)}`}
                                    className="flex-1"
                                  >
                                    <motion.button
                                      className="w-full bg-gradient-to-r from-[var(--y2k-blue)] to-[var(--y2k-mint)] text-black px-3 py-2 rounded-lg font-semibold text-sm border-2 border-[var(--y2k-purple)] shadow-lg"
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      View
                                    </motion.button>
                                  </Link>
                                  <motion.button
                                    onClick={() => downloadFile(file.downloadUrl, file.name)}
                                    className="bg-gradient-to-r from-[var(--y2k-pink)] to-[var(--y2k-lavender)] text-black px-3 py-2 rounded-lg font-semibold text-sm border-2 border-[var(--y2k-purple)] shadow-lg"
                                    title="Download"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                  </motion.button>
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
