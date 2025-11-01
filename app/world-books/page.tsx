'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadFile } from '@/lib/download';

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
  prolix: FileItem[];
}

function WorldBooksContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [files, setFiles] = useState<FileCategories>({ standard: [], prolix: [] });
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
      setFiles({ standard: [], prolix: [] });
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
          // Separate files into standard and prolix
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

  // Helper function to strip Prolix prefix from filename
  const stripProlixPrefix = (name: string) => {
    // Remove .json extension first
    let formatted = name.replace('.json', '');
    // Remove "Prolix" followed by a space and any word (Preferred, Edition, etc.)
    formatted = formatted.replace(/\s*Prolix\s+\w+/gi, '').trim();
    return formatted;
  };

  const handleCategoryChange = (categoryName: string) => {
    if (categoryName !== selectedCategory) {
      setSelectedCategory(categoryName);
      // Update URL with category parameter
      router.push(`/world-books?category=${encodeURIComponent(categoryName)}`, { scroll: false });
    }
  };

  const hasFiles = files.standard.length > 0 || files.prolix.length > 0;

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
          <h1 className="text-5xl font-bold text-white mb-4">World Books</h1>
          <p className="text-xl text-gray-300">Browse and download world books organized by category</p>
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
                          ? 'bg-green-600 text-white shadow-lg shadow-green-500/30'
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
                    <p className="text-xl text-gray-400">Select a category to view world books</p>
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
                      className="inline-block w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <p className="mt-4 text-lg">Loading world books...</p>
                  </motion.div>
                ) : !hasFiles ? (
                  <motion.div
                    key="no-files"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-12 text-center"
                  >
                    <p className="text-xl text-gray-400">No world books found in this category</p>
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
                        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
                          </svg>
                          Latest
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {files.standard.map((file, index) => {
                            const displayName = stripProlixPrefix(file.name);
                            return (
                              <motion.div
                                key={file.path}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 hover:shadow-2xl hover:shadow-green-500/20 transition-all"
                                whileHover={{ scale: 1.03, y: -5 }}
                              >
                                <Link href={`/world-books/${encodeURIComponent(selectedCategory as string)}/${encodeURIComponent(file.name)}`}>
                                  <h4 className="text-lg font-semibold text-white mb-2 truncate hover:text-green-400 transition-colors cursor-pointer" title={displayName}>
                                    {displayName}
                                  </h4>
                                </Link>
                                <p className="text-sm text-gray-400 mb-4">{formatFileSize(file.size)}</p>
                                <div className="flex gap-2">
                                  <Link 
                                    href={`/world-books/${encodeURIComponent(selectedCategory as string)}/${encodeURIComponent(file.name)}`}
                                    className="flex-1"
                                  >
                                    <motion.div
                                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-center shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      View </motion.div>
                                  </Link>
                                  <motion.button
                                    onClick={() => downloadFile(file.downloadUrl, file.name)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-green-500/30 hover:shadow-green-500/50"
                                    title="Download"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                    {/* Prolix Preferred Files */}
                    {files.prolix.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.15 }}
                      >
                        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          Prolix Preferred - Latest
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {files.prolix.map((file, index) => {
                            const displayName = stripProlixPrefix(file.name);
                            return (
                              <motion.div
                                key={file.path}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                                className="bg-gray-800/50 backdrop-blur-sm border border-purple-700/50 rounded-xl p-6 hover:border-purple-600 hover:shadow-2xl hover:shadow-purple-500/20 transition-all"
                                whileHover={{ scale: 1.03, y: -5 }}
                              >
                                <Link href={`/world-books/${encodeURIComponent(selectedCategory as string)}/${encodeURIComponent(file.name)}`}>
                                  <h4 className="text-lg font-semibold text-white mb-2 truncate hover:text-purple-400 transition-colors cursor-pointer" title={displayName}>
                                    {displayName}
                                  </h4>
                                </Link>
                                <p className="text-sm text-gray-400 mb-4">{formatFileSize(file.size)}</p>
                                <div className="flex gap-2">
                                  <Link 
                                    href={`/world-books/${encodeURIComponent(selectedCategory as string)}/${encodeURIComponent(file.name)}`}
                                    className="flex-1"
                                  >
                                    <motion.div
                                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-center shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      View
                                    </motion.div>
                                  </Link>
                                  <motion.button
                                    onClick={() => downloadFile(file.downloadUrl, file.name)}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
                                    title="Download"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
