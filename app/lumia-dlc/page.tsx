'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedLink from '@/app/components/AnimatedLink';
import LumiaPackCard from '@/app/components/LumiaPackCard';
import SmartPagination from '@/app/components/SmartPagination';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import CardSkeleton from '@/app/components/CardSkeleton';
import SortDropdown, { SortOption } from '@/app/components/SortDropdown';
import SearchInput from '@/app/components/SearchInput';
import FilterAccordion from '@/app/components/FilterAccordion';
import FilterModal from '@/app/components/FilterModal';
import {
  ArrowLeft,
  Package,
  Users,
  ScrollText,
  User,
  X,
  Check,
  ChevronDown,
  Layers
} from 'lucide-react';
import type { LumiaPackSummary, FilterOption, PackType } from '@/lib/types/lumia-pack';

interface ApiResponse {
  success: boolean;
  packs: LumiaPackSummary[];
  authors: FilterOption[];
  stats: {
    totalPacks: number;
    lumiaPacks: number;
    loomPacks: number;
    mixedPacks: number;
  };
}

// Pack Type Accordion Component
function PackTypeAccordion({
  selectedType,
  onTypeChange,
  stats
}: {
  selectedType: PackType | null;
  onTypeChange: (type: PackType | null) => void;
  stats: { lumiaPacks: number; loomPacks: number; mixedPacks: number; totalPacks: number };
}) {
  const [isOpen, setIsOpen] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  const types: { key: PackType | null; label: string; count: number; icon: typeof Package }[] = [
    { key: null, label: 'All Packs', count: stats.totalPacks, icon: Package },
    { key: 'lumia', label: 'Lumia Packs', count: stats.lumiaPacks, icon: Users },
    { key: 'loom', label: 'Loom Collections', count: stats.loomPacks, icon: ScrollText },
    { key: 'mixed', label: 'Mixed Packs', count: stats.mixedPacks, icon: Layers }
  ];

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [stats, selectedType]);

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-left group hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-rose-400" />
          <span className="text-sm font-medium text-white">Pack Type</span>
          {selectedType && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-rose-500/20 text-rose-400">
              1
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedType && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTypeChange(null);
              }}
              className="text-xs text-gray-500 hover:text-white transition-colors px-2 py-0.5 rounded hover:bg-white/10"
            >
              Clear
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{ height: isOpen ? `${contentHeight}px` : '0px' }}
      >
        <div ref={contentRef} className="px-3 pb-3 space-y-1">
          {types.map(({ key, label, count, icon: Icon }) => (
            <button
              key={label}
              onClick={() => onTypeChange(key)}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-all ${
                selectedType === key
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  : 'text-gray-400 hover:bg-white/[0.03] hover:text-gray-200 border border-transparent'
              }`}
            >
              <span className="flex items-center gap-2 truncate text-left flex-1 mr-2">
                <Icon className="w-3.5 h-3.5" />
                {label}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-gray-500">{count}</span>
                {selectedType === key && (
                  <Check className="w-3.5 h-3.5 text-rose-400" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function LumiaDlcContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [allPacks, setAllPacks] = useState<LumiaPackSummary[]>([]);
  const [filteredPacks, setFilteredPacks] = useState<LumiaPackSummary[]>([]);
  const [authors, setAuthors] = useState<FilterOption[]>([]);
  const [stats, setStats] = useState({
    totalPacks: 0,
    lumiaPacks: 0,
    loomPacks: 0,
    mixedPacks: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [packsPerPage, setPacksPerPage] = useState(12);
  const [sortBy, setSortBy] = useState<SortOption>('a-z');
  const [isContentLoaded, setIsContentLoaded] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedType, setSelectedType] = useState<PackType | null>(null);
  const [selectedAuthors, setSelectedAuthors] = useState<Set<string>>(new Set());

  // Modal state
  const [authorsModalOpen, setAuthorsModalOpen] = useState(false);

  // Animation state
  const hasMounted = useRef(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      hasMounted.current = true;
      setAnimationsEnabled(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Calculate packs per page
  useEffect(() => {
    const calculatePacksPerPage = () => {
      const width = window.innerWidth;
      if (width < 768) return 6;
      else if (width < 1024) return 9;
      else return 12;
    };

    setPacksPerPage(calculatePacksPerPage());

    const handleResize = () => {
      const newPacksPerPage = calculatePacksPerPage();
      if (newPacksPerPage !== packsPerPage) {
        setPacksPerPage(newPacksPerPage);
        setCurrentPage(0);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [packsPerPage]);

  // Check URL parameters on mount
  useEffect(() => {
    const typeParam = searchParams.get('type') as PackType | null;
    const searchParam = searchParams.get('search');
    const authorsParam = searchParams.get('authors');

    if (typeParam && ['lumia', 'loom', 'mixed'].includes(typeParam)) {
      setSelectedType(typeParam);
    }
    if (searchParam) {
      setSearchQuery(decodeURIComponent(searchParam));
    }
    if (authorsParam) {
      setSelectedAuthors(new Set(authorsParam.split(',').map(decodeURIComponent)));
    }
  }, [searchParams]);

  // Fetch packs
  useEffect(() => {
    async function fetchPacks() {
      try {
        const response = await fetch('/api/lumia-dlc');
        const data: ApiResponse = await response.json();
        if (data.success) {
          setAllPacks(data.packs);
          setFilteredPacks(data.packs);
          setAuthors(data.authors);
          setStats(data.stats);
          setTimeout(() => setIsContentLoaded(true), 100);
        }
      } catch (error) {
        console.error('Error fetching Lumia DLC packs:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPacks();
  }, []);

  // Filter and sort packs
  useEffect(() => {
    let filtered = allPacks;

    // Type filter
    if (selectedType) {
      filtered = filtered.filter(pack => pack.packType === selectedType);
    }

    // Search filter
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(pack =>
        pack.packName.toLowerCase().includes(searchLower) ||
        pack.packAuthor.toLowerCase().includes(searchLower)
      );
    }

    // Authors filter
    if (selectedAuthors.size > 0) {
      filtered = filtered.filter(pack => selectedAuthors.has(pack.packAuthor));
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'a-z':
          return a.packName.localeCompare(b.packName);
        case 'z-a':
          return b.packName.localeCompare(a.packName);
        default:
          return 0;
      }
    });

    setFilteredPacks(sorted);
    setCurrentPage(0);
  }, [selectedType, allPacks, sortBy, debouncedSearch, selectedAuthors]);

  // Build URL with filters
  const buildFilterUrl = (overrides: {
    type?: PackType | null;
    search?: string;
    authors?: Set<string>;
  } = {}) => {
    const params = new URLSearchParams();
    const type = overrides.type !== undefined ? overrides.type : selectedType;
    const search = overrides.search !== undefined ? overrides.search : searchQuery;
    const authorsSet = overrides.authors !== undefined ? overrides.authors : selectedAuthors;

    if (type) params.set('type', type);
    if (search) params.set('search', search);
    if (authorsSet.size > 0) params.set('authors', Array.from(authorsSet).join(','));

    const queryString = params.toString();
    return queryString ? `/lumia-dlc?${queryString}` : '/lumia-dlc';
  };

  const handleTypeChange = (type: PackType | null) => {
    if (type !== selectedType) {
      setSelectedType(type);
      router.push(buildFilterUrl({ type }), { scroll: false });
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedType(null);
    setSelectedAuthors(new Set());
    router.push('/lumia-dlc', { scroll: false });
  };

  const hasActiveFilters = searchQuery || selectedType || selectedAuthors.size > 0;

  const totalPages = Math.ceil(filteredPacks.length / packsPerPage);
  const paginatedPacks = filteredPacks.slice(
    currentPage * packsPerPage,
    (currentPage + 1) * packsPerPage
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Back Link */}
      <div className="fixed top-6 left-6 z-50">
        <AnimatedLink
          href="/"
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/80 border border-white/10 text-gray-400 hover:text-rose-400 hover:bg-gray-800/90 hover:border-rose-500/30 transition-all"
          isBackLink
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Home</span>
        </AnimatedLink>
      </div>

      <div className="relative container mx-auto px-4 pt-20 sm:pt-24 pb-8 sm:pb-12">
        {/* Hero Section */}
        <header className="text-center mb-8 sm:mb-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-3">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-500 to-fuchsia-600 animate-gradient bg-[length:200%_auto]">
              Lumia
            </span>
            <span className="text-white/90 ml-3">DLC</span>
          </h1>

          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-5">
            Character packs and Loom presets for enhanced roleplay
          </p>

          {/* Stats Row */}
          <div className="flex items-center justify-center gap-6 text-sm flex-wrap">
            <div className="flex items-center gap-2 text-gray-400">
              <Package className="w-4 h-4 text-rose-400" />
              <span><strong className="text-white">{stats.totalPacks}</strong> packs</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-600" />
            <div className="flex items-center gap-2 text-gray-400">
              <Users className="w-4 h-4 text-pink-400" />
              <span><strong className="text-white">{stats.lumiaPacks}</strong> Lumia</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-600 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2 text-gray-400">
              <ScrollText className="w-4 h-4 text-violet-400" />
              <span><strong className="text-white">{stats.loomPacks}</strong> Loom</span>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="text-center text-gray-400 py-12">
            <LoadingSpinner message="Loading packs..." />
          </div>
        ) : (
          /* Glass Container */
          <div className="relative">
            <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/[0.05]" />

            <div className="relative p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Filters Sidebar */}
                <div className="lg:col-span-1">
                  <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pb-20 space-y-4 sidebar-scroll">
                    {/* Search Input */}
                    <SearchInput
                      value={searchQuery}
                      onChange={setSearchQuery}
                      placeholder="Search packs..."
                    />

                    {/* Pack Type Filter */}
                    <PackTypeAccordion
                      selectedType={selectedType}
                      onTypeChange={handleTypeChange}
                      stats={stats}
                    />

                    {/* Authors Filter */}
                    {authors.length > 0 && (
                      <FilterAccordion
                        title="Authors"
                        icon={User}
                        options={authors}
                        selectedOptions={selectedAuthors}
                        onSelectionChange={setSelectedAuthors}
                        accentColor="purple"
                        onViewAll={() => setAuthorsModalOpen(true)}
                        viewAllThreshold={8}
                      />
                    )}

                    {/* Clear All Filters */}
                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-rose-400 transition-colors py-2.5 border border-dashed border-white/10 hover:border-rose-500/30 rounded-xl"
                      >
                        <X className="w-4 h-4" />
                        Clear all filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Packs Grid */}
                <div className="lg:col-span-3">
                  {/* Sort Dropdown */}
                  <div className="mb-6 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Showing <span className="text-white font-medium">{filteredPacks.length}</span> pack{filteredPacks.length !== 1 ? 's' : ''}
                    </p>
                    <SortDropdown value={sortBy} onChange={setSortBy} />
                  </div>

                  {filteredPacks.length === 0 ? (
                    <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-12 text-center">
                      <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-xl text-gray-400">No packs found</p>
                      <p className="text-sm text-gray-500 mt-2">
                        {hasActiveFilters
                          ? 'Try adjusting your filters or search terms'
                          : 'No packs are available yet'}
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearAllFilters}
                          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm text-rose-400 hover:text-rose-300 transition-colors border border-rose-500/30 hover:border-rose-500/50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                          Clear all filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <AnimatePresence mode="wait">
                        {!isContentLoaded ? (
                          <motion.div
                            key="skeleton"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
                          >
                            {Array.from({ length: packsPerPage }).map((_, index) => (
                              <CardSkeleton key={`skeleton-${index}`} />
                            ))}
                          </motion.div>
                        ) : (
                          <motion.div
                            key={`packs-${selectedType || 'all'}-${sortBy}-${currentPage}`}
                            initial={animationsEnabled ? { opacity: 0 } : false}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
                          >
                            {paginatedPacks.map((pack, index) => (
                              <LumiaPackCard
                                key={pack.slug}
                                pack={pack}
                                index={index}
                                animationsEnabled={animationsEnabled}
                              />
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {totalPages > 1 && isContentLoaded && (
                        <div className="h-24" />
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Pagination */}
      {!loading && totalPages > 1 && isContentLoaded && (
        <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
          <div className="pt-4 pb-6">
            <div className="container mx-auto px-4">
              <SmartPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </div>
      )}

      {/* Authors Modal */}
      <FilterModal
        isOpen={authorsModalOpen}
        onClose={() => setAuthorsModalOpen(false)}
        title="Authors"
        icon={User}
        options={authors}
        selectedOptions={selectedAuthors}
        onSelectionChange={setSelectedAuthors}
        variant="cells"
        accentColor="purple"
      />
    </div>
  );
}

export default function LumiaDlcPage() {
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
      <LumiaDlcContent />
    </Suspense>
  );
}
