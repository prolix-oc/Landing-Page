'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [filesByCategory, setFilesByCategory] = useState<Record<string, FileCategories>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllData() {
      try {
        const response = await fetch('/api/world-books');
        const data = await response.json();
        if (data.success) {
          setCategories(data.categories);
          
          // Fetch files for all categories
          const filesData: Record<string, FileCategories> = {};
          for (const category of data.categories) {
            const filesResponse = await fetch(`/api/world-books/${encodeURIComponent(category.name)}`);
            const filesResult = await filesResponse.json();
            if (filesResult.success) {
              // Separate files into standard and prolix
              const standard: FileItem[] = [];
              const prolix: FileItem[] = [];
              
              filesResult.files.forEach((file: FileItem) => {
                if (file.name.match(/Prolix\s+(?:Preferred|Edition)/i)) {
                  prolix.push(file);
                } else {
                  standard.push(file);
                }
              });
              
              filesData[category.name] = { standard, prolix };
            }
          }
          setFilesByCategory(filesData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAllData();
  }, []);

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

  return (
    <div className="min-h-screen relative">
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
          <div className="text-center text-gray-400 py-12">Loading...</div>
        ) : (
          <div className="space-y-12">
            {categories.map((category) => {
              const files = filesByCategory[category.name];
              if (!files || (files.standard.length === 0 && files.prolix.length === 0)) {
                return null;
              }

              return (
                <div key={category.name} className="space-y-6">
                  {/* Category Header */}
                  <div className="border-b border-gray-700 pb-4">
                    <h2 className="text-3xl font-bold text-white">{category.displayName}</h2>
                  </div>

                  {/* Standard Files */}
                  {files.standard.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
                        </svg>
                        Latest
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {files.standard.map((file) => {
                          const displayName = stripProlixPrefix(file.name);
                          return (
                            <div
                              key={file.path}
                              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all"
                            >
                              <h4 className="text-lg font-semibold text-white mb-2 truncate" title={displayName}>
                                {displayName}
                              </h4>
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
                    </div>
                  )}

                  {/* Prolix Preferred Files */}
                  {files.prolix.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Prolix Preferred - Latest
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {files.prolix.map((file) => {
                          const displayName = stripProlixPrefix(file.name);
                          return (
                            <div
                              key={file.path}
                              className="bg-gray-800/50 backdrop-blur-sm border border-purple-700/50 rounded-xl p-6 hover:border-purple-600 transition-all"
                            >
                              <h4 className="text-lg font-semibold text-white mb-2 truncate" title={displayName}>
                                {displayName}
                              </h4>
                              <p className="text-sm text-gray-400 mb-4">{formatFileSize(file.size)}</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => downloadFile(file.downloadUrl, file.name)}
                                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-center"
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
                    </div>
                  )}
                </div>
              );
            })}
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
