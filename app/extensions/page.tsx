'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '@/app/components/LoadingSpinner';

interface Extension {
  id: string;
  name: string;
  description: string;
  repoUrl: string;
  thumbnail: string;
  category: string;
}

const CATEGORIES = [
  { id: 'prolix', name: "My Extensions" },
  { id: 'recommended', name: 'Recommended Extensions' }
];

function ExtensionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('prolix');
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Check URL parameters on mount
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchExtensions() {
      try {
        const response = await fetch('/api/extensions');
        const data = await response.json();
        if (data.success) {
          setExtensions(data.extensions);
        }
      } catch (error) {
        console.error('Error fetching extensions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchExtensions();
  }, []);

  const handleCategoryChange = async (categoryId: string) => {
    if (categoryId !== selectedCategory) {
      setIsTransitioning(true);
      
      // Small delay to ensure fade out completes
      await new Promise(resolve => setTimeout(resolve, 150));
      
      setSelectedCategory(categoryId);
      // Update URL with category parameter
      router.push(`/extensions?category=${encodeURIComponent(categoryId)}`, { scroll: false });
      
      setIsTransitioning(false);
    }
  };

  const filteredExtensions = extensions.filter(ext => ext.category === selectedCategory);

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
          <h1 className="text-5xl font-bold text-white mb-4">Extensions</h1>
          <p className="text-xl text-gray-300">Extend functionality with custom extensions</p>
        </motion.div>

        {loading ? (
          <motion.div 
            className="text-center text-gray-400 py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <LoadingSpinner message="Loading extensions..." />
          </motion.div>
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
                  {CATEGORIES.map((category, index) => (
                    <motion.button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg ${
                        selectedCategory === category.id
                          ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      layout
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {category.name}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Extensions Grid */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                {isTransitioning ? (
                  <motion.div
                    key="loading-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-center text-gray-400 py-12"
                  >
                    <LoadingSpinner message="Loading extensions..." />
                  </motion.div>
                ) : filteredExtensions.length === 0 ? (
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
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    >
                      🔧
                    </motion.div>
                    <p className="text-xl text-gray-400 mb-4">No extensions available yet</p>
                    <p className="text-gray-500">Check back later for {selectedCategory === 'prolix' ? 'new' : 'recommended'} extensions</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`extensions-${selectedCategory}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {filteredExtensions.map((extension, index) => (
                      <motion.div
                        key={extension.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden hover:border-orange-600 hover:shadow-2xl hover:shadow-orange-500/20 transition-all group"
                        whileHover={{ scale: 1.03, y: -5 }}
                      >
                        {/* Thumbnail */}
                        <div className="h-48 bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center overflow-hidden relative">
                          <motion.div
                            className="w-full h-full relative"
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Image
                              src={extension.thumbnail}
                              alt={extension.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          </motion.div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-white mb-2">{extension.name}</h3>
                          <p className="text-gray-400 mb-4 line-clamp-3">{extension.description}</p>
                          
                          <motion.a
                            href={extension.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-6 py-2 rounded-lg transition-colors shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            View Repository
                          </motion.a>
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

export default function ExtensionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen relative">
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center text-gray-400 py-12">Loading...</div>
        </div>
      </div>
    }>
      <ExtensionsContent />
    </Suspense>
  );
}
