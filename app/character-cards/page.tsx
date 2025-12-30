'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import AnimatedLink from '@/app/components/AnimatedLink';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadFile } from '@/lib/download';
import LazyImage from '@/app/components/LazyImage';
import SmartPagination from '@/app/components/SmartPagination';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import CardSkeleton from '@/app/components/CardSkeleton';
import SortDropdown, { SortOption } from '@/app/components/SortDropdown';
import SearchInput from '@/app/components/SearchInput';
import FilterAccordion from '@/app/components/FilterAccordion';
import FilterModal from '@/app/components/FilterModal';
import {
  ArrowLeft,
  Users,
  User,
  ChevronRight,
  Download,
  ChevronDown,
  Image as ImageIcon,
  FileJson2,
  Layers,
  Calendar,
  HardDrive,
  Sparkles,
  Tag,
  X,
  Check
} from 'lucide-react';

interface Category {
  name: string;
  path: string;
  displayName: string;
}

interface CharacterCard {
  name: string;
  path: string;
  category: string;
  categoryDisplayName: string;
  thumbnailUrl: string | null;
  jsonUrl: string | null;
  size: number;
  lastModified: string | null;
  alternateCount?: number;
  slug: string;
  tags: string[];
  creators: string[];
}

interface FilterOption {
  name: string;
  count: number;
}

// Categories Accordion Component
function CategoriesAccordion({
  categories,
  allCards,
  selectedCategory,
  onCategoryChange,
  onViewAll
}: {
  categories: Category[];
  allCards: CharacterCard[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  onViewAll: () => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  const MAX_VISIBLE = 4;
  const visibleCategories = categories.slice(0, MAX_VISIBLE);
  const hasMore = categories.length > MAX_VISIBLE;

  // Measure content height
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [categories, selectedCategory]);

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-left group hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-white">Categories</span>
          {selectedCategory && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-400">
              1
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedCategory && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCategoryChange(null);
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

      {/* Content */}
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{ height: isOpen ? `${contentHeight}px` : '0px' }}
      >
        <div ref={contentRef} className="px-3 pb-3 space-y-1">
          {/* All Cards option */}
          <button
            onClick={() => onCategoryChange(null)}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-all ${
              selectedCategory === null
                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                : 'text-gray-400 hover:bg-white/[0.03] hover:text-gray-200 border border-transparent'
            }`}
          >
            <span className="truncate text-left flex-1 mr-2">All Cards</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-gray-500">{allCards.length}</span>
              {selectedCategory === null && (
                <Check className="w-3.5 h-3.5 text-purple-400" />
              )}
            </div>
          </button>

          {visibleCategories.map((category) => {
            const count = allCards.filter(c => c.category === category.name).length;
            return (
              <button
                key={category.name}
                onClick={() => onCategoryChange(category.name)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-all ${
                  selectedCategory === category.name
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                    : 'text-gray-400 hover:bg-white/[0.03] hover:text-gray-200 border border-transparent'
                }`}
              >
                <span className="truncate text-left flex-1 mr-2">{category.displayName}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-500">{count}</span>
                  {selectedCategory === category.name && (
                    <Check className="w-3.5 h-3.5 text-purple-400" />
                  )}
                </div>
              </button>
            );
          })}

          {hasMore && (
            <button
              onClick={onViewAll}
              className="w-full text-xs text-purple-400 hover:text-white transition-colors py-2 mt-1 flex items-center justify-center gap-1.5 rounded-lg hover:bg-white/[0.03]"
            >
              <span>View all {categories.length}</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CharacterCardsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [allCards, setAllCards] = useState<CharacterCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<CharacterCard[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [cardsPerPage, setCardsPerPage] = useState(12);
  const [sortBy, setSortBy] = useState<SortOption>('a-z');
  const [isContentLoaded, setIsContentLoaded] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectedCreators, setSelectedCreators] = useState<Set<string>>(new Set());
  const [allTags, setAllTags] = useState<FilterOption[]>([]);
  const [allCreators, setAllCreators] = useState<FilterOption[]>([]);

  // Modal states
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);
  const [tagsModalOpen, setTagsModalOpen] = useState(false);
  const [creatorsModalOpen, setCreatorsModalOpen] = useState(false);

  // Track if initial page load is complete (to skip animations during View Transition)
  const hasMounted = useRef(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(false);

  useEffect(() => {
    // Enable animations after View Transition completes
    const timer = setTimeout(() => {
      hasMounted.current = true;
      setAnimationsEnabled(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Debounce search input (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Calculate cards per page based on screen size
  useEffect(() => {
    const calculateCardsPerPage = () => {
      const width = window.innerWidth;
      if (width < 768) return 6;
      else if (width < 1024) return 12;
      else return 15;
    };

    setCardsPerPage(calculateCardsPerPage());

    const handleResize = () => {
      const newCardsPerPage = calculateCardsPerPage();
      if (newCardsPerPage !== cardsPerPage) {
        setCardsPerPage(newCardsPerPage);
        setCurrentPage(0);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [cardsPerPage]);

  // Check URL parameters on mount
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');
    const tagsParam = searchParams.get('tags');
    const creatorsParam = searchParams.get('creators');

    if (categoryParam) {
      setSelectedCategory(decodeURIComponent(categoryParam));
    }
    if (searchParam) {
      setSearchQuery(decodeURIComponent(searchParam));
    }
    if (tagsParam) {
      setSelectedTags(new Set(tagsParam.split(',').map(decodeURIComponent)));
    }
    if (creatorsParam) {
      setSelectedCreators(new Set(creatorsParam.split(',').map(decodeURIComponent)));
    }
  }, [searchParams]);

  // Fetch all cards on initial load
  useEffect(() => {
    async function fetchAllCards() {
      try {
        const response = await fetch('/api/character-cards?all=true');
        const data = await response.json();
        if (data.success) {
          setCategories(data.categories);
          setAllCards(data.cards || []);
          setFilteredCards(data.cards || []);
          setAllTags(data.tags || []);
          setAllCreators(data.creators || []);
          setTimeout(() => setIsContentLoaded(true), 100);
        }
      } catch (error) {
        console.error('Error fetching character cards:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAllCards();
  }, []);

  // Filter and sort cards when any filter changes
  useEffect(() => {
    let filtered = allCards;

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(card => card.category === selectedCategory);
    }

    // Search filter (case-insensitive name match)
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(card =>
        card.name.toLowerCase().includes(searchLower)
      );
    }

    // Tags filter (OR logic within tags)
    if (selectedTags.size > 0) {
      filtered = filtered.filter(card =>
        card.tags.some(tag => selectedTags.has(tag))
      );
    }

    // Creators filter (OR logic within creators)
    if (selectedCreators.size > 0) {
      filtered = filtered.filter(card =>
        card.creators.some(creator => selectedCreators.has(creator))
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'a-z':
          return a.name.localeCompare(b.name);
        case 'z-a':
          return b.name.localeCompare(a.name);
        case 'recent':
          if (!a.lastModified || !b.lastModified) return 0;
          return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
        case 'alt-count':
          return (b.alternateCount || 0) - (a.alternateCount || 0);
        default:
          return 0;
      }
    });

    setFilteredCards(sorted);
    setCurrentPage(0);
  }, [selectedCategory, allCards, sortBy, debouncedSearch, selectedTags, selectedCreators]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Build URL with current filters
  const buildFilterUrl = (overrides: {
    category?: string | null;
    search?: string;
    tags?: Set<string>;
    creators?: Set<string>;
  } = {}) => {
    const params = new URLSearchParams();
    const category = overrides.category !== undefined ? overrides.category : selectedCategory;
    const search = overrides.search !== undefined ? overrides.search : searchQuery;
    const tags = overrides.tags !== undefined ? overrides.tags : selectedTags;
    const creators = overrides.creators !== undefined ? overrides.creators : selectedCreators;

    if (category) params.set('category', category);
    if (search) params.set('search', search);
    if (tags.size > 0) params.set('tags', Array.from(tags).join(','));
    if (creators.size > 0) params.set('creators', Array.from(creators).join(','));

    const queryString = params.toString();
    return queryString ? `/character-cards?${queryString}` : '/character-cards';
  };

  const handleCategoryChange = (categoryName: string | null) => {
    if (categoryName !== selectedCategory) {
      setSelectedCategory(categoryName);
      router.push(buildFilterUrl({ category: categoryName }), { scroll: false });
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedTags(new Set());
    setSelectedCreators(new Set());
    router.push('/character-cards', { scroll: false });
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedTags.size > 0 || selectedCreators.size > 0;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = Math.ceil(filteredCards.length / cardsPerPage);
  const paginatedCards = filteredCards.slice(
    currentPage * cardsPerPage,
    (currentPage + 1) * cardsPerPage
  );

  // Calculate stats
  const totalCards = allCards.length;
  const totalCategories = categories.length;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Back Link - Fixed Pill Button */}
      <div className="fixed top-6 left-6 z-50">
        <AnimatedLink
          href="/"
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/80 border border-white/10 text-gray-400 hover:text-cyan-400 hover:bg-gray-800/90 hover:border-cyan-500/30 transition-all"
          isBackLink
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Home</span>
        </AnimatedLink>
      </div>

      <div className="relative container mx-auto px-4 pt-20 sm:pt-24 pb-8 sm:pb-12">
        {/* Compact Hero Section */}
        <header className="text-center mb-8 sm:mb-10">
          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-3">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-gradient bg-[length:200%_auto]">
              Character
            </span>
            <span className="text-white/90 ml-3">Cards</span>
          </h1>

          {/* Subtitle */}
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-5">
            Browse and download character cards organized by category
          </p>

          {/* Stats Row */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span><strong className="text-white">{totalCards}</strong> characters</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-600" />
            <div className="flex items-center gap-2 text-gray-400">
              <Layers className="w-4 h-4 text-purple-400" />
              <span><strong className="text-white">{totalCategories}</strong> categories</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-600 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2 text-gray-400">
              <User className="w-4 h-4 text-blue-400" />
              <span><strong className="text-white">{allCreators.length}</strong> creators</span>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="text-center text-gray-400 py-12">
            <LoadingSpinner message="Loading character cards..." />
          </div>
        ) : (
          /* Single Glass Container */
          <div className="relative">
            {/* Single backdrop-blur layer (md = 12px, optimized for Safari) */}
            <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/[0.05]" />

            {/* Content grid inside */}
            <div className="relative p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Filters Sidebar */}
                <div className="lg:col-span-1">
                  <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pb-20 space-y-4 sidebar-scroll">
                    {/* Search Input */}
                    <SearchInput
                      value={searchQuery}
                      onChange={setSearchQuery}
                      placeholder="Search characters..."
                    />

                    {/* Categories Section - Collapsible Accordion */}
                    <CategoriesAccordion
                      categories={categories}
                      allCards={allCards}
                      selectedCategory={selectedCategory}
                      onCategoryChange={handleCategoryChange}
                      onViewAll={() => setCategoriesModalOpen(true)}
                    />

                    {/* Tags Filter */}
                    {allTags.length > 0 && (
                      <FilterAccordion
                        title="Tags"
                        icon={Tag}
                        options={allTags}
                        selectedOptions={selectedTags}
                        onSelectionChange={setSelectedTags}
                        accentColor="purple"
                        onViewAll={() => setTagsModalOpen(true)}
                        viewAllThreshold={8}
                      />
                    )}

                    {/* Creators Filter */}
                    {allCreators.length > 0 && (
                      <FilterAccordion
                        title="Creators"
                        icon={User}
                        options={allCreators}
                        selectedOptions={selectedCreators}
                        onSelectionChange={setSelectedCreators}
                        accentColor="blue"
                        onViewAll={() => setCreatorsModalOpen(true)}
                        viewAllThreshold={8}
                      />
                    )}

                    {/* Clear All Filters */}
                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-cyan-400 transition-colors py-2.5 border border-dashed border-white/10 hover:border-cyan-500/30 rounded-xl"
                      >
                        <X className="w-4 h-4" />
                        Clear all filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Cards Grid */}
                <div className="lg:col-span-3">
                  {/* Sort Dropdown */}
                  <div className="mb-6 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Showing <span className="text-white font-medium">{filteredCards.length}</span> character{filteredCards.length !== 1 ? 's' : ''}
                    </p>
                    <SortDropdown value={sortBy} onChange={setSortBy} />
                  </div>

                  {filteredCards.length === 0 ? (
                    <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-12 text-center">
                      <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-xl text-gray-400">No character cards found</p>
                      <p className="text-sm text-gray-500 mt-2">
                        {hasActiveFilters
                          ? 'Try adjusting your filters or search terms'
                          : 'Try selecting a different category'}
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearAllFilters}
                          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors border border-cyan-500/30 hover:border-cyan-500/50 rounded-lg"
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
                            {Array.from({ length: cardsPerPage }).map((_, index) => (
                              <CardSkeleton key={`skeleton-${index}`} />
                            ))}
                          </motion.div>
                        ) : (
                          <motion.div
                            key={`cards-${selectedCategory || 'all'}-${sortBy}-${currentPage}`}
                            initial={animationsEnabled ? { opacity: 0 } : false}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
                          >
                            {paginatedCards.map((card, index) => (
                              <motion.div
                                key={card.path}
                                initial={animationsEnabled ? { opacity: 0, y: 15 } : false}
                                animate={{ opacity: 1, y: 0 }}
                                transition={animationsEnabled ? {
                                  duration: 0.3,
                                  delay: index * 0.03,
                                  ease: [0.25, 0.1, 0.25, 1]
                                } : { duration: 0 }}
                                className="group relative bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.08] rounded-2xl overflow-hidden transition-all duration-300 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/10 hover:-translate-y-1"
                              >
                                {/* Gradient overlay on hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                {/* Accent bar */}
                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left z-10" />

                                {/* Thumbnail */}
                                <div className="relative">
                                  {card.thumbnailUrl ? (
                                    <Link
                                      href={`/character-cards/${encodeURIComponent(card.category)}/${card.slug}`}
                                      className="block relative aspect-square overflow-hidden cursor-pointer"
                                    >
                                      <div className="w-full h-full transition-transform duration-400 group-hover:scale-105">
                                        <LazyImage
                                          src={card.thumbnailUrl}
                                          alt={card.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    </Link>
                                  ) : (
                                    <div className="aspect-square bg-gray-800/50 flex items-center justify-center text-gray-600">
                                      <ImageIcon className="w-12 h-12" />
                                    </div>
                                  )}

                                  {/* Category Badge */}
                                  <div className="absolute top-3 left-3 z-10">
                                    <div className="bg-gray-900/90 border border-gray-700/50 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-lg">
                                      {card.categoryDisplayName}
                                    </div>
                                  </div>

                                  {/* Alt Scenarios Badge */}
                                  {(card.alternateCount ?? 0) > 0 && (
                                    <div className="absolute top-3 right-3 z-10">
                                      <div className="flex items-center gap-1.5 bg-purple-600 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-lg border border-purple-500/50">
                                        <Layers className="w-3 h-3" />
                                        +{card.alternateCount}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Card Info */}
                                <div className="relative p-4">
                                  <Link href={`/character-cards/${encodeURIComponent(card.category)}/${card.slug}`}>
                                    <h3 className="text-base font-semibold text-white mb-2 truncate group-hover:text-cyan-400 transition-colors" title={card.name}>
                                      {card.name}
                                    </h3>
                                  </Link>
                                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                                    {card.lastModified && (
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(card.lastModified).toLocaleDateString()}
                                      </span>
                                    )}
                                    {card.size > 0 && (
                                      <span className="flex items-center gap-1">
                                        <HardDrive className="w-3 h-3" />
                                        {formatFileSize(card.size)}
                                      </span>
                                    )}
                                  </div>

                                  {/* Download Dropdown */}
                                  {card.jsonUrl && (
                                    <div className="relative">
                                      <button
                                        onClick={() => setOpenDropdown(openDropdown === card.path ? null : card.path)}
                                        className="w-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] hover:border-cyan-500/30 text-gray-300 hover:text-white px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm flex items-center justify-center gap-2 group/btn active:scale-[0.98]"
                                      >
                                        <Download className="w-4 h-4 group-hover/btn:text-cyan-400 transition-colors" />
                                        <span>Download</span>
                                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${openDropdown === card.path ? 'rotate-180' : ''}`} />
                                      </button>

                                      <AnimatePresence>
                                        {openDropdown === card.path && (
                                          <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute bottom-full mb-2 w-full bg-gray-900 border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden z-20 ring-1 ring-white/10"
                                            onMouseLeave={() => setOpenDropdown(null)}
                                          >
                                            {card.thumbnailUrl && (
                                              <button
                                                onClick={() => downloadFile(card.thumbnailUrl!, card.name.replace(/\.json$/, '.png'))}
                                                className="group/item flex items-center gap-3 px-4 py-3 hover:bg-cyan-500/10 transition-colors text-gray-300 hover:text-cyan-400 text-sm font-medium border-b border-gray-700/50 w-full text-left"
                                              >
                                                <ImageIcon className="w-5 h-5 text-cyan-500/70 group-hover/item:text-cyan-400" />
                                                <span>Download PNG</span>
                                              </button>
                                            )}
                                            <button
                                              onClick={() => downloadFile(card.jsonUrl!, card.name)}
                                              className="group/item flex items-center gap-3 px-4 py-3 hover:bg-green-500/10 transition-colors text-gray-300 hover:text-green-400 text-sm font-medium w-full text-left"
                                            >
                                              <FileJson2 className="w-5 h-5 text-green-500/70 group-hover/item:text-green-400" />
                                              <span>Download JSON</span>
                                            </button>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  )}
                                </div>

                                {/* Shimmer effect */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-20 overflow-hidden">
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                                </div>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Bottom padding for sticky pagination */}
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

      {/* Sticky Pagination at Bottom */}
      {!loading && totalPages > 1 && isContentLoaded && (
        <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
          <div className="pt-4 pb-6">
            <div className="container mx-auto px-4">
              <SmartPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>
      )}

      {/* Categories Modal */}
      <FilterModal
        isOpen={categoriesModalOpen}
        onClose={() => setCategoriesModalOpen(false)}
        title="Categories"
        icon={Layers}
        options={categories.map(cat => ({
          name: cat.name,
          count: allCards.filter(c => c.category === cat.name).length
        }))}
        selectedOptions={selectedCategory ? new Set([selectedCategory]) : new Set()}
        onSelectionChange={(newSelection) => {
          const selected = Array.from(newSelection)[0] || null;
          handleCategoryChange(selected);
        }}
        variant="cells"
        accentColor="purple"
        singleSelect
        showAllOption
        allOptionLabel="All Cards"
      />

      {/* Tags Modal */}
      <FilterModal
        isOpen={tagsModalOpen}
        onClose={() => setTagsModalOpen(false)}
        title="Tags"
        icon={Tag}
        options={allTags}
        selectedOptions={selectedTags}
        onSelectionChange={setSelectedTags}
        variant="pills"
        accentColor="purple"
      />

      {/* Creators Modal */}
      <FilterModal
        isOpen={creatorsModalOpen}
        onClose={() => setCreatorsModalOpen(false)}
        title="Creators"
        icon={User}
        options={allCreators}
        selectedOptions={selectedCreators}
        onSelectionChange={setSelectedCreators}
        variant="cells"
        accentColor="blue"
      />
    </div>
  );
}

export default function CharacterCardsPage() {
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
      <CharacterCardsContent />
    </Suspense>
  );
}
