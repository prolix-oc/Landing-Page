'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
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

function WorldBooksContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(false);

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
      setFiles([]);
      return;
    }

    async function fetchFiles() {
      setFilesLoading(true);
      try {
        const response = await fetch(`/api/world-books/${encodeURIComponent(selectedCategory as string)}`);
        const data = await response.json();
        if (data.success) {
          setFiles(data.files);
        }
      } catch (error) {
        console.error('Error fetching files:', error);
      } finally {
        setFilesLoading(false);
      }
    }

    fetchFiles();
  }, [selectedCategory]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen relative">
      {/* Animated background elements */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }}></div>
      </div>

      <div className="relative container mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-5xl font-bold text-white mb-4">World Books</h1>
          <p className="text-xl text-gray-300">Browse and download world books organized by category</p>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading categories...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Categories Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Categories</h2>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.name}
                      onClick={() => {
                        setSelectedCategory(category.name);
                        router.push(`/world-books?category=${encodeURIComponent(category.name)}`, { scroll: false });
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                        selectedCategory === category.name
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {category.displayName}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Files Grid */}
            <div className="lg:col-span-3">
              {!selectedCategory ? (
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-12 text-center">
                  <div className="text-6xl mb-4">👈</div>
                  <p className="text-xl text-gray-400">Select a category to view world books</p>
                </div>
              ) : filesLoading ? (
                <div className="text-center text-gray-400 py-12">Loading files...</div>
              ) : files.length === 0 ? (
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-12 text-center">
                  <p className="text-xl text-gray-400">No files found in this category</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {files.map((file) => {
                    // Remove .json extension from display name
                    const displayName = file.name.endsWith('.json') 
                      ? file.name.slice(0, -5) 
                      : file.name;
                    
                    return (
                      <div
                        key={file.path}
                        className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all"
                      >
                        <h3 className="text-lg font-semibold text-white mb-2 truncate" title={displayName}>
                          {displayName}
                        </h3>
                      <p className="text-sm text-gray-400 mb-4">{formatFileSize(file.size)}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => downloadFile(file.downloadUrl, file.name)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-center"
                        >
                          Download
                        </button>
                        <a
                          href={file.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                          title="View on GitHub"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                        </a>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
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
        <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
          <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }}></div>
        </div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center text-gray-400 py-12">Loading...</div>
        </div>
      </div>
    }>
      <WorldBooksContent />
    </Suspense>
  );
}
