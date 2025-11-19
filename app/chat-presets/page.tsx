'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import AnimatedLink from '@/app/components/AnimatedLink';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { downloadFile } from '@/lib/download';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import PresetDownloadModal from '@/app/components/PresetDownloadModal';

interface Preset {
  name: string;
  path: string;
  category: string;
}

interface PresetCategories {
  standard: Preset[];
  prolix: Preset[];
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

interface VersionCategories {
  standard: Version[];
  prolix: Version[];
}

function ChatPresetsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [presetCategories, setPresetCategories] = useState<PresetCategories>({ standard: [], prolix: [] });
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [versions, setVersions] = useState<VersionCategories>({ standard: [], prolix: [] });
  const [loading, setLoading] = useState(true);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPreset, setModalPreset] = useState<{ url: string; name: string } | null>(null);

  // Animation variants consistent with other pages
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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

  // Check URL parameters on mount and set default to "Lucid Loom"
  useEffect(() => {
    const presetParam = searchParams.get('preset');
    if (presetParam) {
      setSelectedPreset(decodeURIComponent(presetParam));
    } else {
      // Default to "Lucid Loom" if no preset parameter is present
      setSelectedPreset('Lucid Loom');
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchPresets() {
      try {
        const response = await fetch('/api/chat-presets');
        const data = await response.json();
        if (data.success) {
          setPresetCategories(data.presets);
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
      setVersions({ standard: [], prolix: [] });
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

  // Helper function to format version name (remove .json and extract version)
  const formatVersionName = (name: string) => {
    // Remove .json extension
    let formatted = name.replace('.json', '');
    return formatted;
  };

  // Helper function to extract version number and descriptors (e.g., v1.0, v1.0 Hotfix, v2.9.2)
  const extractVersion = (name: string) => {
    // Match version pattern with optional descriptors (but not "Prolix Preferred" or "Prolix Edition")
    // Matches: v2.8, v2.8.1, v2.9.2, v2.8 Hotfix, v2.8.1 Quick Fix, etc.
    // Does NOT match Prolix as a descriptor: v2.8 Prolix Preferred should extract as just "v2.8"
    // Captures from 'v' character through all numeric segments (e.g., v2.9.2)
    const versionMatch = name.match(/v\d+(?:\.\d+)*(?:\s+(?:(?!Prolix)[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?))?/);
    return versionMatch ? versionMatch[0] : null;
  };

  // Helper function to get name without version
  const getNameWithoutVersion = (name: string) => {
    // Remove .json extension first
    let formatted = name.replace('.json', '');
    // Then remove everything from "Prolix" onwards (Prolix Preferred, Prolix Edition, etc.)
    formatted = formatted.replace(/\s*Prolix.*$/i, '').trim();
    // Finally, remove the version number and any descriptors (Hotfix, Quick Fix, etc.)
    // Updated regex to handle semantic versioning like v2.9.2
    formatted = formatted.replace(/\s*v\d+(?:\.\d+)*(?:\s+(?:Hotfix|Quick\s+Fix|Repatch|[A-Z][a-z]+))?\s*/g, '').trim();
    return formatted;
  };

  // Separate standard and prolix latest/historical versions
  const standardLatest = versions.standard.filter(v => v.isLatest);
  const standardHistorical = versions.standard.filter(v => !v.isLatest);
  const prolixLatest = versions.prolix.filter(v => v.isLatest);
  const prolixHistorical = versions.prolix.filter(v => !v.isLatest);
  
  // Check if there are any versions at all
  const hasVersions = versions.standard.length > 0 || versions.prolix.length > 0;

  // Combine all presets for rendering
  const allPresets = [...presetCategories.standard, ...presetCategories.prolix];

  const handleDownloadClick = (url: string, name: string) => {
    setModalPreset({ url, name });
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setModalPreset(null);
  };

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
            Chat Completion Presets
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-300 max-w-3xl"
            variants={itemVariants}
          >
            Download the latest versions of chat completion presets
          </motion.p>
        </motion.div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">
            <LoadingSpinner message="Loading presets..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Presets Sidebar */}
            <motion.div 
              className="lg:col-span-1 h-fit"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 sticky top-24">
                <h2 className="text-xl font-bold text-white mb-6">Presets</h2>
                <div className="space-y-2">
                  {allPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handlePresetChange(preset.name)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden group ${
                        selectedPreset === preset.name
                          ? 'bg-purple-600/20 text-white border border-purple-500/50 shadow-[0_0_15px_rgba(147,51,234,0.2)]'
                          : 'bg-gray-800/30 text-gray-400 border border-transparent hover:bg-gray-800/60 hover:text-gray-200'
                      }`}
                    >
                      {selectedPreset === preset.name && (
                        <div className="absolute inset-0 bg-purple-500/10 blur-lg" />
                      )}
                      <span className="relative z-10 font-medium flex items-center justify-between">
                        {preset.name}
                        {selectedPreset === preset.name && (
                          <motion.div layoutId="activePreset" className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        )}
                      </span>
                    </button>
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
                    className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-12 text-center"
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
                    <LoadingSpinner message="Loading versions..." />
                  </motion.div>
                ) : !hasVersions ? (
                  <motion.div
                    key="no-versions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-12 text-center"
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
                    {/* Standard Versions - Latest */}
                    {standardLatest.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <motion.div 
                            className="p-2 bg-purple-500/20 rounded-lg"
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                          >
                            <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
                            </svg>
                          </motion.div>
                          <h2 className="text-xl font-bold text-white">Latest Version</h2>
                        </div>
                        {standardLatest.map((version) => {
                          const versionNum = extractVersion(version.name);
                          const displayName = getNameWithoutVersion(version.name);
                          return (
                          <motion.div
                            key={version.path}
                            className="bg-gradient-to-br from-purple-900/30 to-gray-900/50 backdrop-blur-xl border-2 border-purple-500/50 rounded-2xl p-6 hover:border-purple-400 transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 relative overflow-hidden group"
                            whileHover={{ scale: 1.01, y: -2 }}
                          >
                            {/* Shimmer effect */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                            </div>

                            <div className="relative z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 sm:gap-3 mb-3 flex-wrap">
                                  <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 wrap-break-word" title={formatVersionName(version.name)}>
                                    {displayName}
                                  </h3>
                                  {versionNum && (
                                    <span className="bg-gray-800 text-gray-300 text-xs font-mono px-2.5 py-1 rounded-md border border-gray-700">
                                      {versionNum}
                                    </span>
                                  )}
                                  <motion.span 
                                    className="bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg whitespace-nowrap flex items-center gap-1"
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    Latest
                                  </motion.span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:gap-6 gap-2 text-sm text-gray-400">
                                  <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    {formatFileSize(version.size)}
                                  </span>
                                  <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {formatDate(version.lastModified)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-3 w-full sm:w-auto pt-2 sm:pt-0">
                                <motion.button
                                  onClick={() => handleDownloadClick(version.downloadUrl, version.name)}
                                  className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-6 py-2.5 rounded-xl transition-all whitespace-nowrap shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 flex items-center justify-center gap-2 flex-1 sm:flex-initial font-medium"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                  <span className="hidden sm:inline">Download</span>
                                  <span className="sm:hidden">Download</span>
                                </motion.button>
                                <motion.a
                                  href={version.htmlUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center border border-gray-700 hover:border-gray-600"
                                  title="View on GitHub"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                  </svg>
                                </motion.a>
                              </div>
                            </div>
                          </motion.div>
                          );
                        })}
                      </motion.div>
                    )}

                    {/* Prolix Preferred - Latest */}
                    {prolixLatest.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.15 }}
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <motion.div 
                            className="p-2 bg-yellow-500/20 rounded-lg"
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                          >
                            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </motion.div>
                          <h2 className="text-xl font-bold text-white">Prolix Preferred - Latest</h2>
                        </div>
                        {prolixLatest.map((version) => {
                          const versionNum = extractVersion(version.name);
                          const displayName = getNameWithoutVersion(version.name);
                          return (
                          <motion.div
                            key={version.path}
                            className="bg-gradient-to-br from-yellow-900/30 to-gray-900/50 backdrop-blur-xl border-2 border-yellow-500/50 rounded-2xl p-6 hover:border-yellow-400 transition-all shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 relative overflow-hidden group"
                            whileHover={{ scale: 1.01, y: -2 }}
                          >
                            {/* Shimmer effect */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                            </div>

                            <div className="relative z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 sm:gap-3 mb-3 flex-wrap">
                                  <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 wrap-break-word" title={formatVersionName(version.name)}>
                                    {displayName}
                                  </h3>
                                  {versionNum && (
                                    <span className="bg-gray-800 text-gray-300 text-xs font-mono px-2.5 py-1 rounded-md border border-gray-700">
                                      {versionNum}
                                    </span>
                                  )}
                                  <motion.span 
                                    className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg whitespace-nowrap flex items-center gap-1"
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    Latest
                                  </motion.span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:gap-6 gap-2 text-sm text-gray-400">
                                  <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    {formatFileSize(version.size)}
                                  </span>
                                  <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {formatDate(version.lastModified)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-3 w-full sm:w-auto pt-2 sm:pt-0">
                                <motion.button
                                  onClick={() => handleDownloadClick(version.downloadUrl, version.name)}
                                  className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-white px-6 py-2.5 rounded-xl transition-all whitespace-nowrap shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 flex items-center justify-center gap-2 flex-1 sm:flex-initial font-medium"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                  <span className="hidden sm:inline">Download</span>
                                  <span className="sm:hidden">Download</span>
                                </motion.button>
                                <motion.a
                                  href={version.htmlUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center border border-gray-700 hover:border-gray-600"
                                  title="View on GitHub"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                  </svg>
                                </motion.a>
                              </div>
                            </div>
                          </motion.div>
                          );
                        })}
                      </motion.div>
                    )}

                    {/* Standard Versions - Historical */}
                    {standardHistorical.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h2 className="text-xl font-bold text-white">Historical Versions</h2>
                          <span className="text-sm text-gray-500 ml-auto">({standardHistorical.length})</span>
                        </div>
                        <div className="space-y-3">
                          {standardHistorical.map((version, index) => {
                            const versionNum = extractVersion(version.name);
                            const displayName = getNameWithoutVersion(version.name);
                            return (
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
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <h3 className="text-base sm:text-lg font-semibold text-white wrap-break-word" title={formatVersionName(version.name)}>
                                      {displayName}
                                    </h3>
                                    {versionNum && (
                                      <span className="bg-gray-700/70 text-gray-300 text-xs px-2 py-1 rounded font-mono">
                                        {versionNum}
                                      </span>
                                    )}
                                  </div>
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
                                  <motion.button
                                    onClick={() => downloadFile(version.downloadUrl, version.name)}
                                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 sm:px-6 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center justify-center gap-2 flex-1 sm:flex-initial"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    <span className="hidden sm:inline">Download</span>
                                  </motion.button>
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
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {/* Prolix Preferred - Historical */}
                    {prolixHistorical.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.25 }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h2 className="text-xl font-bold text-white">Prolix Preferred - Historical</h2>
                          <span className="text-sm text-gray-500 ml-auto">({prolixHistorical.length})</span>
                        </div>
                        <div className="space-y-3">
                          {prolixHistorical.map((version, index) => {
                            const versionNum = extractVersion(version.name);
                            const displayName = getNameWithoutVersion(version.name);
                            return (
                            <motion.div
                              key={version.path}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              className="bg-gray-800/50 backdrop-blur-sm border border-purple-700/50 rounded-xl p-6 hover:border-purple-600 transition-all hover:shadow-lg hover:shadow-purple-700/30"
                              whileHover={{ scale: 1.005, x: 4 }}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <h3 className="text-base sm:text-lg font-semibold text-white wrap-break-word" title={formatVersionName(version.name)}>
                                      {displayName}
                                    </h3>
                                    {versionNum && (
                                      <span className="bg-purple-700/70 text-gray-300 text-xs px-2 py-1 rounded font-mono">
                                        {versionNum}
                                      </span>
                                    )}
                                  </div>
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
                                  <motion.button
                                    onClick={() => downloadFile(version.downloadUrl, version.name)}
                                    className="bg-purple-700 hover:bg-purple-600 text-white px-4 sm:px-6 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center justify-center gap-2 flex-1 sm:flex-initial"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    <span className="hidden sm:inline">Download</span>
                                  </motion.button>
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

      {/* Download Modal */}
      <PresetDownloadModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        presetUrl={modalPreset?.url || ''}
        presetName={modalPreset?.name || ''}
      />
    </div>
  );
}

export default function ChatPresetsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen relative">
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center text-gray-400 py-12">Loading...</div>
        </div>
      </div>
    }>
      <ChatPresetsContent />
    </Suspense>
  );
}
