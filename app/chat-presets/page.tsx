'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface Preset {
  name: string;
  path: string;
}

interface Version {
  name: string;
  path: string;
  downloadUrl: string;
  size: number;
  htmlUrl: string;
  lastModified: string | null;
  isLatest: boolean;
}

function ChatPresetsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Check URL parameters on mount
  useEffect(() => {
    const presetParam = searchParams.get('preset');
    if (presetParam) {
      setSelectedPreset(decodeURIComponent(presetParam));
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchPresets() {
      try {
        const response = await fetch('/api/chat-presets');
        const data = await response.json();
        if (data.success) {
          setPresets(data.presets);
        }
      } catch (error) {
        console.error('Error fetching presets:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPresets();
  }, []);

  useEffect(() => {
    if (!selectedPreset) {
      setVersions([]);
      return;
    }

    async function fetchVersions() {
      setIsTransitioning(true);
      setVersionsLoading(true);
      
      // Small delay to ensure fade out completes
      await new Promise(resolve => setTimeout(resolve, 150));
      
      try {
        const response = await fetch(`/api/chat-presets/${encodeURIComponent(selectedPreset as string)}`);
        const data = await response.json();
        if (data.success) {
          setVersions(data.versions);
        }
      } catch (error) {
        console.error('Error fetching versions:', error);
      } finally {
        setVersionsLoading(false);
        setIsTransitioning(false);
      }
    }

    fetchVersions();
  }, [selectedPreset]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handlePresetChange = (presetName: string) => {
    if (presetName !== selectedPreset) {
      setSelectedPreset(presetName);
      // Update URL with preset parameter
      router.push(`/chat-presets?preset=${encodeURIComponent(presetName)}`, { scroll: false });
    }
  };

  const latestVersions = versions.filter(v => v.isLatest);
  const historicalVersions = versions.filter(v => !v.isLatest);

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
          <h1 className="text-5xl font-bold text-white mb-4">Chat Completion Presets</h1>
          <p className="text-xl text-gray-300">Download the latest versions of chat completion presets</p>
        </motion.div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading presets...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Presets Sidebar */}
            <motion.div 
              className="lg:col-span-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 sticky top-4">
                <h2 className="text-xl font-bold text-white mb-4">Presets</h2>
                <div className="space-y-2">
                  {presets.map((preset, index) => (
                    <motion.button
                      key={preset.name}
                      onClick={() => handlePresetChange(preset.name)}
                      className={`w-full text-left px-4 py-3 rounded-lg ${
                        selectedPreset === preset.name
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      layout
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {preset.name}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Versions Grid */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                {!selectedPreset ? (
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
                    <p className="text-xl text-gray-400">Select a preset to view available versions</p>
                  </motion.div>
                ) : isTransitioning || versionsLoading ? (
                  <motion.div
                    key="loading-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-center text-gray-400 py-12"
                  >
                    <motion.div
                      className="inline-block w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <p className="mt-4 text-lg">Loading versions...</p>
                  </motion.div>
                ) : versions.length === 0 ? (
                  <motion.div
                    key="no-versions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-12 text-center"
                  >
                    <p className="text-xl text-gray-400">No versions found for this preset</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`versions-${selectedPreset}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Latest Version - Pinned */}
                    {latestVersions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <motion.svg 
                            className="w-5 h-5 text-purple-400" 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                          >
                            <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
                          </motion.svg>
                          <h2 className="text-xl font-bold text-white">Latest Version</h2>
                        </div>
                        {latestVersions.map((version) => (
                          <motion.div
                            key={version.path}
                            className="bg-linear-to-br from-purple-900/30 to-gray-800/50 backdrop-blur-sm border-2 border-purple-500/50 rounded-xl p-4 sm:p-6 hover:border-purple-400 transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
                            whileHover={{ scale: 1.01, y: -2 }}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 sm:gap-3 mb-3 flex-wrap">
                                  <h3 className="text-base sm:text-lg font-semibold text-white wrap-break-word" title={version.name}>
                                    {version.name}
                                  </h3>
                                  <motion.span 
                                    className="bg-linear-to-r from-purple-600 to-purple-500 text-white text-xs px-2 sm:px-3 py-1 rounded-full font-medium shadow-lg whitespace-nowrap"
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                                  >
                                    Latest
                                  </motion.span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:gap-4 gap-2 text-xs sm:text-sm text-gray-300">
                                  <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    {formatFileSize(version.size)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {formatDate(version.lastModified)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2 w-full sm:w-auto">
                                <motion.a
                                  href={version.downloadUrl}
                                  download
                                  className="bg-linear-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-4 sm:px-6 py-2 rounded-lg transition-colors whitespace-nowrap shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 flex items-center justify-center gap-2 flex-1 sm:flex-initial"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                  <span className="hidden sm:inline">Download</span>
                                </motion.a>
                                <motion.a
                                  href={version.htmlUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-gray-700 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                                  title="View on GitHub"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                  </svg>
                                </motion.a>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}

                    {/* Historical Versions */}
                    {historicalVersions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h2 className="text-xl font-bold text-white">Historical Versions</h2>
                          <span className="text-sm text-gray-500 ml-auto">({historicalVersions.length})</span>
                        </div>
                        <div className="space-y-3">
                          {historicalVersions.map((version, index) => (
                            <motion.div
                              key={version.path}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all hover:shadow-lg hover:shadow-gray-700/30"
                              whileHover={{ scale: 1.005, x: 4 }}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-base sm:text-lg font-semibold text-white mb-2 wrap-break-word" title={version.name}>
                                    {version.name}
                                  </h3>
                                  <div className="flex flex-col sm:flex-row sm:gap-4 gap-2 text-xs sm:text-sm text-gray-400">
                                    <span className="flex items-center gap-1">
                                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                      </svg>
                                      {formatFileSize(version.size)}
                                    </span>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="flex items-center gap-1">
                                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {formatDate(version.lastModified)}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                  <motion.a
                                    href={version.downloadUrl}
                                    download
                                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 sm:px-6 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center justify-center gap-2 flex-1 sm:flex-initial"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    <span className="hidden sm:inline">Download</span>
                                  </motion.a>
                                  <motion.a
                                    href={version.htmlUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                                    title="View on GitHub"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                    </svg>
                                  </motion.a>
                                </div>
                              </div>
                            </motion.div>
                          ))}
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

export default function ChatPresetsPage() {
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
      <ChatPresetsContent />
    </Suspense>
  );
}
