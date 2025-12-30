'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import AnimatedLink from '@/app/components/AnimatedLink';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion';
import { downloadFile } from '@/lib/download';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import PresetDownloadModal from '@/app/components/PresetDownloadModal';
import {
  ArrowLeft,
  Download,
  Github,
  Clock,
  FileJson,
  Sparkles,
  Star,
  History,
  ChevronRight,
  Zap,
  Settings,
  Layers,
  Package,
  Crown,
  Archive,
  ExternalLink
} from 'lucide-react';

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

// Floating atmospheric orbs
const FloatingOrbs = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
    <motion.div
      animate={{
        x: [0, 80, 40, 0],
        y: [0, -40, 80, 0],
        scale: [1, 1.15, 0.95, 1],
      }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-600/15 rounded-full blur-[100px]"
    />
    <motion.div
      animate={{
        x: [0, -60, 30, 0],
        y: [0, 60, -30, 0],
        scale: [1, 0.9, 1.1, 1],
      }}
      transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[120px]"
    />
    <motion.div
      animate={{
        x: [0, 50, -50, 0],
        y: [0, -70, 40, 0],
        scale: [1, 1.2, 0.85, 1],
      }}
      transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-1/4 left-1/3 w-[450px] h-[450px] bg-blue-600/10 rounded-full blur-[100px]"
    />
  </div>
);

// Reveal section with scroll animation
const RevealSection = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Floating card wrapper
const FloatingCard = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    animate={{
      y: [0, -8, 0],
      rotate: [0, 0.5, -0.5, 0],
    }}
    transition={{
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
      delay,
    }}
    className={className}
  >
    {children}
  </motion.div>
);

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

  // Scroll-linked hero parallax
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 80]);

  // Check URL parameters on mount and set default to "Lucid Loom"
  useEffect(() => {
    const presetParam = searchParams.get('preset');
    if (presetParam) {
      setSelectedPreset(decodeURIComponent(presetParam));
    } else {
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
      router.push(`/chat-presets?preset=${encodeURIComponent(presetName)}`, { scroll: false });
    }
  };

  const formatVersionName = (name: string) => {
    return name.replace('.json', '');
  };

  const extractVersion = (name: string) => {
    const versionMatch = name.match(/v\d+(?:\.\d+)*(?:\s+(?:(?!Prolix)[A-Z][a-z]+(?:\s+(?:[A-Z][a-z]+|\d+))?))?/);
    return versionMatch ? versionMatch[0] : null;
  };

  const getNameWithoutVersion = (name: string) => {
    let formatted = name.replace('.json', '');
    formatted = formatted.replace(/\s*Prolix.*$/i, '').trim();
    formatted = formatted.replace(/\s*v\d+(?:\.\d+)*(?:\s+(?:Hotfix|Quick\s+Fix|Repatch|[A-Z][a-z]+(?:\s+\d+)?))?\s*/g, '').trim();
    return formatted;
  };

  const standardLatest = versions.standard.filter(v => v.isLatest);
  const standardHistorical = versions.standard.filter(v => !v.isLatest);
  const prolixLatest = versions.prolix.filter(v => v.isLatest);
  const prolixHistorical = versions.prolix.filter(v => !v.isLatest);

  const hasVersions = versions.standard.length > 0 || versions.prolix.length > 0;
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
    <div className="min-h-screen relative overflow-hidden">
      <FloatingOrbs />

      {/* Hero Section with Parallax */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="relative min-h-[50vh] flex items-center justify-center pt-12 pb-8"
      >
        <div className="container mx-auto px-4">
          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <AnimatedLink
              href="/"
              className="group inline-flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors"
              isBackLink
            >
              <ArrowLeft className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Home</span>
            </AnimatedLink>
          </motion.div>

          {/* Hero Content */}
          <div className="text-center max-w-4xl mx-auto">
            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-8"
            >
              <Settings className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-400">Chat Completion Configuration</span>
            </motion.div>

            {/* Main Title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-6"
            >
              <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tight">
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-gradient pb-2">
                  Chat
                </span>
                <span className="block text-white/90 mt-2">
                  Presets
                </span>
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
            >
              Optimized completion settings for transformative AI roleplay.
              <span className="block mt-2 text-gray-500">Download. Import. Experience.</span>
            </motion.p>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex items-center justify-center gap-8 mt-10"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{allPresets.length}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Presets</div>
              </div>
              <div className="w-px h-8 bg-gray-700" />
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">{versions.standard.length + versions.prolix.length}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Versions</div>
              </div>
              <div className="w-px h-8 bg-gray-700" />
              <div className="text-center">
                <div className="flex items-center gap-1 text-2xl font-bold text-purple-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Optimized</div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Decorative gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      </motion.section>

      {/* Main Content */}
      <section className="relative py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <LoadingSpinner message="Loading presets..." />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Sidebar - Preset Selection */}
              <RevealSection className="lg:col-span-3">
                <div className="lg:sticky lg:top-24">
                  <FloatingCard delay={0.2}>
                    <div className="relative bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6 overflow-hidden">
                      {/* Sidebar glow */}
                      <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />

                      <div className="relative">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/10 border border-purple-500/20">
                            <Layers className="w-5 h-5 text-purple-400" />
                          </div>
                          <h2 className="text-lg font-bold text-white">Select Preset</h2>
                        </div>

                        <div className="space-y-2">
                          {allPresets.map((preset, index) => (
                            <motion.button
                              key={preset.name}
                              onClick={() => handlePresetChange(preset.name)}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              className={`w-full group text-left px-4 py-3.5 rounded-2xl transition-all duration-300 relative overflow-hidden ${
                                selectedPreset === preset.name
                                  ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/10 border border-purple-500/30'
                                  : 'bg-white/[0.02] border border-transparent hover:bg-white/[0.05] hover:border-white/[0.05]'
                              }`}
                            >
                              {/* Active glow */}
                              {selectedPreset === preset.name && (
                                <motion.div
                                  layoutId="activePresetGlow"
                                  className="absolute inset-0 bg-purple-500/5 blur-xl"
                                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                              )}

                              <span className="relative z-10 flex items-center justify-between">
                                <span className={`font-medium transition-colors ${
                                  selectedPreset === preset.name ? 'text-white' : 'text-gray-400 group-hover:text-white'
                                }`}>
                                  {preset.name}
                                </span>
                                <ChevronRight className={`w-4 h-4 transition-all ${
                                  selectedPreset === preset.name
                                    ? 'text-purple-400 translate-x-0'
                                    : 'text-gray-600 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                                }`} />
                              </span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </FloatingCard>
                </div>
              </RevealSection>

              {/* Main Content - Versions */}
              <div className="lg:col-span-9">
                <AnimatePresence mode="wait">
                  {!selectedPreset ? (
                    <motion.div
                      key="empty-state"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col items-center justify-center py-24 text-center"
                    >
                      <motion.div
                        animate={{ x: [-5, 5, -5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-6"
                      >
                        <Package className="w-12 h-12 text-purple-400" />
                      </motion.div>
                      <p className="text-xl text-gray-400">Select a preset to view versions</p>
                    </motion.div>
                  ) : isTransitioning || versionsLoading ? (
                    <motion.div
                      key="loading-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-center py-24"
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
                      className="flex flex-col items-center justify-center py-24 text-center"
                    >
                      <div className="p-4 rounded-2xl bg-gray-500/10 border border-gray-500/20 mb-6">
                        <Archive className="w-12 h-12 text-gray-400" />
                      </div>
                      <p className="text-xl text-gray-400">No versions found for this preset</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={`versions-${selectedPreset}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-8"
                    >
                      {/* Standard Latest */}
                      {standardLatest.length > 0 && (
                        <RevealSection>
                          <div className="flex items-center gap-3 mb-5">
                            <motion.div
                              className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/20"
                              animate={{ rotate: [0, 5, -5, 0] }}
                              transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
                            >
                              <Zap className="w-5 h-5 text-cyan-400" />
                            </motion.div>
                            <h2 className="text-xl font-bold text-white">Latest Version</h2>
                          </div>

                          {standardLatest.map((version) => {
                            const versionNum = extractVersion(version.name);
                            const displayName = getNameWithoutVersion(version.name);
                            return (
                              <motion.div
                                key={version.path}
                                className="group relative bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10 backdrop-blur-xl border-2 border-cyan-500/30 rounded-3xl p-6 lg:p-8 overflow-hidden"
                                whileHover={{ scale: 1.01, y: -4 }}
                                transition={{ duration: 0.3 }}
                              >
                                {/* Animated shimmer */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                                  <motion.div
                                    animate={{ x: ['-200%', '200%'] }}
                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12"
                                  />
                                </div>

                                {/* Glow effect */}
                                <div className="absolute -top-20 -right-20 w-60 h-60 bg-cyan-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                                      <h3 className="text-2xl font-bold text-white">
                                        {displayName}
                                      </h3>
                                      {versionNum && (
                                        <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/10 text-sm font-mono text-gray-300">
                                          {versionNum}
                                        </span>
                                      )}
                                      <motion.span
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/25"
                                        animate={{ scale: [1, 1.05, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                        Latest
                                      </motion.span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                                      <span className="flex items-center gap-2">
                                        <FileJson className="w-4 h-4 text-gray-500" />
                                        {formatFileSize(version.size)}
                                      </span>
                                      <span className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                        {formatDate(version.lastModified)}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex gap-3">
                                    <motion.button
                                      onClick={() => handleDownloadClick(version.downloadUrl, version.name)}
                                      className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                    >
                                      <Download className="w-5 h-5" />
                                      Download
                                    </motion.button>
                                    <motion.a
                                      href={version.htmlUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      title="View on GitHub"
                                    >
                                      <Github className="w-5 h-5" />
                                    </motion.a>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </RevealSection>
                      )}

                      {/* Prolix Latest */}
                      {prolixLatest.length > 0 && (
                        <RevealSection delay={0.1}>
                          <div className="flex items-center gap-3 mb-5">
                            <motion.div
                              className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/20"
                              animate={{ rotate: [0, 5, -5, 0] }}
                              transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
                            >
                              <Crown className="w-5 h-5 text-amber-400" />
                            </motion.div>
                            <h2 className="text-xl font-bold text-white">Prolix Preferred</h2>
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">Premium</span>
                          </div>

                          {prolixLatest.map((version) => {
                            const versionNum = extractVersion(version.name);
                            const displayName = getNameWithoutVersion(version.name);
                            return (
                              <motion.div
                                key={version.path}
                                className="group relative bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 backdrop-blur-xl border-2 border-amber-500/30 rounded-3xl p-6 lg:p-8 overflow-hidden"
                                whileHover={{ scale: 1.01, y: -4 }}
                                transition={{ duration: 0.3 }}
                              >
                                {/* Shimmer */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                                  <motion.div
                                    animate={{ x: ['-200%', '200%'] }}
                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12"
                                  />
                                </div>

                                {/* Glow */}
                                <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                                      <h3 className="text-2xl font-bold text-white">
                                        {displayName}
                                      </h3>
                                      {versionNum && (
                                        <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/10 text-sm font-mono text-gray-300">
                                          {versionNum}
                                        </span>
                                      )}
                                      <motion.span
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-semibold shadow-lg shadow-amber-500/25"
                                        animate={{ scale: [1, 1.05, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                      >
                                        <Star className="w-3 h-3" />
                                        Latest
                                      </motion.span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                                      <span className="flex items-center gap-2">
                                        <FileJson className="w-4 h-4 text-gray-500" />
                                        {formatFileSize(version.size)}
                                      </span>
                                      <span className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                        {formatDate(version.lastModified)}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex gap-3">
                                    <motion.button
                                      onClick={() => handleDownloadClick(version.downloadUrl, version.name)}
                                      className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all"
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                    >
                                      <Download className="w-5 h-5" />
                                      Download
                                    </motion.button>
                                    <motion.a
                                      href={version.htmlUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      title="View on GitHub"
                                    >
                                      <Github className="w-5 h-5" />
                                    </motion.a>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </RevealSection>
                      )}

                      {/* Standard Historical */}
                      {standardHistorical.length > 0 && (
                        <RevealSection delay={0.2}>
                          <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-xl bg-gray-500/10 border border-gray-500/20">
                                <History className="w-5 h-5 text-gray-400" />
                              </div>
                              <h2 className="text-xl font-bold text-white">Historical Versions</h2>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-gray-500/10 text-sm text-gray-500">
                              {standardHistorical.length} version{standardHistorical.length !== 1 ? 's' : ''}
                            </span>
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
                                  transition={{ duration: 0.3, delay: index * 0.03 }}
                                  className="group relative bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-2xl p-5 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300"
                                  whileHover={{ x: 4 }}
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <h3 className="text-lg font-semibold text-white">
                                          {displayName}
                                        </h3>
                                        {versionNum && (
                                          <span className="px-2 py-0.5 rounded bg-white/5 text-xs font-mono text-gray-400">
                                            {versionNum}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1.5">
                                          <FileJson className="w-4 h-4" />
                                          {formatFileSize(version.size)}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                          <Clock className="w-4 h-4" />
                                          {formatDate(version.lastModified)}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex gap-2">
                                      <motion.button
                                        onClick={() => downloadFile(version.downloadUrl, version.name)}
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                      >
                                        <Download className="w-4 h-4" />
                                        <span className="hidden sm:inline">Download</span>
                                      </motion.button>
                                      <motion.a
                                        href={version.htmlUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                      </motion.a>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </RevealSection>
                      )}

                      {/* Prolix Historical */}
                      {prolixHistorical.length > 0 && (
                        <RevealSection delay={0.3}>
                          <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                <History className="w-5 h-5 text-purple-400" />
                              </div>
                              <h2 className="text-xl font-bold text-white">Prolix Historical</h2>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-purple-500/10 text-sm text-purple-400">
                              {prolixHistorical.length} version{prolixHistorical.length !== 1 ? 's' : ''}
                            </span>
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
                                  transition={{ duration: 0.3, delay: index * 0.03 }}
                                  className="group relative bg-purple-500/[0.03] backdrop-blur-sm border border-purple-500/10 rounded-2xl p-5 hover:bg-purple-500/[0.06] hover:border-purple-500/20 transition-all duration-300"
                                  whileHover={{ x: 4 }}
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <h3 className="text-lg font-semibold text-white">
                                          {displayName}
                                        </h3>
                                        {versionNum && (
                                          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-xs font-mono text-purple-300">
                                            {versionNum}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1.5">
                                          <FileJson className="w-4 h-4" />
                                          {formatFileSize(version.size)}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                          <Clock className="w-4 h-4" />
                                          {formatDate(version.lastModified)}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex gap-2">
                                      <motion.button
                                        onClick={() => downloadFile(version.downloadUrl, version.name)}
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 hover:text-white transition-all"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                      >
                                        <Download className="w-4 h-4" />
                                        <span className="hidden sm:inline">Download</span>
                                      </motion.button>
                                      <motion.a
                                        href={version.htmlUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:text-white hover:bg-purple-500/20 transition-all"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                      </motion.a>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </RevealSection>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </section>

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
      <div className="min-h-screen relative flex items-center justify-center">
        <LoadingSpinner message="Loading..." />
      </div>
    }>
      <ChatPresetsContent />
    </Suspense>
  );
}
