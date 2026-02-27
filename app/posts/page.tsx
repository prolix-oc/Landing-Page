'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import AnimatedLink from '@/app/components/AnimatedLink';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import SmartPagination from '@/app/components/SmartPagination';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import SortDropdown, { SortOption } from '@/app/components/SortDropdown';
import SearchInput from '@/app/components/SearchInput';
import FilterAccordion from '@/app/components/FilterAccordion';
import {
  ArrowLeft,
  FileText,
  Sparkles,
  Tag,
  Layers,
  Calendar,
  X,
  ArrowRight,
} from 'lucide-react';
import type { BlogPostSummary, BlogFilterOption } from '@/lib/types/blog-post';

function PostsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [allPosts, setAllPosts] = useState<BlogPostSummary[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [postsPerPage, setPostsPerPage] = useState(9);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [isContentLoaded, setIsContentLoaded] = useState(false);

  const [allCategories, setAllCategories] = useState<BlogFilterOption[]>([]);
  const [allTags, setAllTags] = useState<BlogFilterOption[]>([]);

  // Initialize from URL params
  const [searchQuery, setSearchQuery] = useState(() => {
    const param = searchParams.get('search');
    return param ? decodeURIComponent(param) : '';
  });
  const [debouncedSearch, setDebouncedSearch] = useState(() => {
    const param = searchParams.get('search');
    return param ? decodeURIComponent(param) : '';
  });
  const [selectedCategory, setSelectedCategory] = useState<Set<string>>(() => {
    const param = searchParams.get('category');
    return param ? new Set(param.split(',').map(decodeURIComponent)) : new Set();
  });
  const [selectedTags, setSelectedTags] = useState<Set<string>>(() => {
    const param = searchParams.get('tags');
    return param ? new Set(param.split(',').map(decodeURIComponent)) : new Set();
  });

  // Track if initial page load is complete
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

  // Responsive posts per page
  useEffect(() => {
    const calculate = () => {
      const width = window.innerWidth;
      if (width < 768) return 6;
      else if (width < 1024) return 9;
      else return 12;
    };

    setPostsPerPage(calculate());

    const handleResize = () => {
      const next = calculate();
      if (next !== postsPerPage) {
        setPostsPerPage(next);
        setCurrentPage(0);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [postsPerPage]);

  // Sync URL params on external navigation
  const prevParams = useRef(searchParams.toString());
  useEffect(() => {
    const current = searchParams.toString();
    if (current === prevParams.current) return;
    prevParams.current = current;

    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');
    const tagsParam = searchParams.get('tags');

    setSelectedCategory(categoryParam ? new Set(categoryParam.split(',').map(decodeURIComponent)) : new Set());
    setSearchQuery(searchParam ? decodeURIComponent(searchParam) : '');
    setSelectedTags(tagsParam ? new Set(tagsParam.split(',').map(decodeURIComponent)) : new Set());
  }, [searchParams]);

  // Fetch posts
  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await fetch('/api/posts');
        const data = await response.json();
        if (data.success) {
          setAllPosts(data.posts || []);
          setFilteredPosts(data.posts || []);
          setAllCategories(data.categories || []);
          setAllTags(data.tags || []);
          setTimeout(() => setIsContentLoaded(true), 100);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  // Filter and sort
  useEffect(() => {
    let filtered = allPosts;

    if (selectedCategory.size > 0) {
      filtered = filtered.filter(post => selectedCategory.has(post.category));
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q)
      );
    }

    if (selectedTags.size > 0) {
      filtered = filtered.filter(post =>
        post.tags.some(tag => selectedTags.has(tag))
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'a-z':
          return a.title.localeCompare(b.title);
        case 'z-a':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    setFilteredPosts(sorted);
    setCurrentPage(0);
  }, [selectedCategory, allPosts, sortBy, debouncedSearch, selectedTags]);

  // URL state management
  const buildFilterUrl = (overrides: {
    category?: Set<string>;
    search?: string;
    tags?: Set<string>;
  } = {}) => {
    const params = new URLSearchParams();
    const category = overrides.category !== undefined ? overrides.category : selectedCategory;
    const search = overrides.search !== undefined ? overrides.search : searchQuery;
    const tags = overrides.tags !== undefined ? overrides.tags : selectedTags;

    if (category.size > 0) params.set('category', Array.from(category).join(','));
    if (search) params.set('search', search);
    if (tags.size > 0) params.set('tags', Array.from(tags).join(','));

    const qs = params.toString();
    return qs ? `/posts?${qs}` : '/posts';
  };

  const handleCategoryChange = (newSelection: Set<string>) => {
    setSelectedCategory(newSelection);
    router.push(buildFilterUrl({ category: newSelection }), { scroll: false });
  };

  const handleTagsChange = (newSelection: Set<string>) => {
    setSelectedTags(newSelection);
    router.push(buildFilterUrl({ tags: newSelection }), { scroll: false });
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory(new Set());
    setSelectedTags(new Set());
    router.push('/posts', { scroll: false });
  };

  const hasActiveFilters = searchQuery || selectedCategory.size > 0 || selectedTags.size > 0;

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const paginatedPosts = filteredPosts.slice(
    currentPage * postsPerPage,
    (currentPage + 1) * postsPerPage
  );

  const totalPosts = allPosts.length;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Back Link */}
      <div className="fixed top-6 left-6 z-50">
        <AnimatedLink
          href="/"
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/80 border border-white/10 text-gray-400 hover:text-sky-400 hover:bg-gray-800/90 hover:border-sky-500/30 transition-all"
          isBackLink
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Home</span>
        </AnimatedLink>
      </div>

      <div className="relative container mx-auto px-4 pt-20 sm:pt-24 pb-8 sm:pb-12">
        {/* Hero */}
        <header className="text-center mb-8 sm:mb-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-3">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-600 animate-gradient bg-[length:200%_auto]">
              Posts
            </span>
          </h1>

          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-5">
            Thoughts, ideas, and documentation about Lucid Loom
          </p>

          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span><strong className="text-white">{totalPosts}</strong> post{totalPosts !== 1 ? 's' : ''}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-600" />
            <div className="flex items-center gap-2 text-gray-400">
              <Layers className="w-4 h-4 text-blue-400" />
              <span><strong className="text-white">{allCategories.length}</strong> categor{allCategories.length !== 1 ? 'ies' : 'y'}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-600 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2 text-gray-400">
              <Tag className="w-4 h-4 text-cyan-400" />
              <span><strong className="text-white">{allTags.length}</strong> tag{allTags.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="text-center text-gray-400 py-12">
            <LoadingSpinner message="Loading posts..." />
          </div>
        ) : (
          <div className="relative">
            <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/[0.05]" />

            <div className="relative p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="lg:col-span-1">
                  <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pb-20 space-y-4 sidebar-scroll">
                    <SearchInput
                      value={searchQuery}
                      onChange={setSearchQuery}
                      placeholder="Search posts..."
                    />

                    {allCategories.length > 0 && (
                      <FilterAccordion
                        title="Categories"
                        icon={Layers}
                        options={allCategories}
                        selectedOptions={selectedCategory}
                        onSelectionChange={handleCategoryChange}
                        accentColor="blue"
                        viewAllThreshold={8}
                      />
                    )}

                    {allTags.length > 0 && (
                      <FilterAccordion
                        title="Tags"
                        icon={Tag}
                        options={allTags}
                        selectedOptions={selectedTags}
                        onSelectionChange={handleTagsChange}
                        accentColor="cyan"
                        viewAllThreshold={8}
                      />
                    )}

                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-sky-400 transition-colors py-2.5 border border-dashed border-white/10 hover:border-sky-500/30 rounded-xl"
                      >
                        <X className="w-4 h-4" />
                        Clear all filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Posts Grid */}
                <div className="lg:col-span-3">
                  <div className="mb-6 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Showing <span className="text-white font-medium">{filteredPosts.length}</span> post{filteredPosts.length !== 1 ? 's' : ''}
                    </p>
                    <SortDropdown
                      value={sortBy}
                      onChange={setSortBy}
                      options={[
                        { value: 'recent', label: 'Newest' },
                        { value: 'a-z', label: 'A → Z' },
                        { value: 'z-a', label: 'Z → A' },
                      ]}
                    />
                  </div>

                  {filteredPosts.length === 0 ? (
                    <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-12 text-center">
                      <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-xl text-gray-400">No posts found</p>
                      <p className="text-sm text-gray-500 mt-2">
                        {hasActiveFilters
                          ? 'Try adjusting your filters or search terms'
                          : 'No posts have been published yet'}
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearAllFilters}
                          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm text-sky-400 hover:text-sky-300 transition-colors border border-sky-500/30 hover:border-sky-500/50 rounded-lg"
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
                            className="columns-1 md:columns-2 xl:columns-3 gap-5"
                          >
                            {Array.from({ length: postsPerPage }).map((_, index) => (
                              <div key={`skeleton-${index}`} className="break-inside-avoid mb-5 inline-block w-full isolate [transform:translateZ(0)] bg-white/[0.03] border border-white/[0.06] rounded-2xl animate-pulse overflow-hidden">
                                {index % 3 !== 2 && (
                                  <div className="bg-white/[0.04] h-[180px]" />
                                )}
                                <div className="p-5">
                                  <div className="h-4 bg-white/[0.06] rounded w-1/3 mb-3" />
                                  <div className="h-6 bg-white/[0.06] rounded w-3/4 mb-3" />
                                  <div className="space-y-2 mb-4">
                                    <div className="h-3 bg-white/[0.04] rounded w-full" />
                                    <div className="h-3 bg-white/[0.04] rounded w-2/3" />
                                  </div>
                                  <div className="flex gap-2">
                                    <div className="h-5 bg-white/[0.04] rounded-full w-12" />
                                    <div className="h-5 bg-white/[0.04] rounded-full w-16" />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        ) : (
                          <motion.div
                            key={`posts-${sortBy}-${currentPage}`}
                            initial={animationsEnabled ? { opacity: 0 } : false}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className="columns-1 md:columns-2 xl:columns-3 gap-5"
                          >
                            {paginatedPosts.map((post, index) => (
                              <motion.div
                                key={post.slug}
                                initial={animationsEnabled ? { opacity: 0, y: 15 } : false}
                                animate={{ opacity: 1, y: 0 }}
                                transition={animationsEnabled ? {
                                  duration: 0.3,
                                  delay: index * 0.03,
                                  ease: [0.25, 0.1, 0.25, 1]
                                } : { duration: 0 }}
                                className="break-inside-avoid mb-5 inline-block w-full isolate [transform:translateZ(0)]"
                              >
                                <Link
                                  href={`/posts/${post.slug}`}
                                  className="group block relative bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.08] rounded-2xl overflow-hidden transition-all duration-300 hover:border-sky-500/40 hover:shadow-lg hover:shadow-sky-500/10 hover:-translate-y-1"
                                >
                                  {/* Gradient overlay on hover */}
                                  <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                  {/* Accent bar */}
                                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-500 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left z-10" />

                                  {/* Hero image */}
                                  {post.hero_image && (
                                    <div className="relative">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={post.hero_image}
                                        alt=""
                                        loading="lazy"
                                        className="w-full object-cover min-h-[120px] max-h-[280px] rounded-t-2xl"
                                      />
                                      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/40 to-transparent" />
                                    </div>
                                  )}

                                  <div className="relative p-5">
                                    {/* Category + Date */}
                                    <div className="flex items-center justify-between mb-3">
                                      <span className="text-xs font-medium text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">
                                        {post.category}
                                      </span>
                                      <span className="flex items-center gap-1 text-xs text-gray-500">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(post.date).toLocaleDateString()}
                                      </span>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-base font-semibold text-white mb-2 group-hover:text-sky-400 transition-colors line-clamp-2">
                                      {post.title}
                                    </h3>

                                    {/* Excerpt */}
                                    <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3 group-hover:text-gray-400 transition-colors">
                                      {post.excerpt}
                                    </p>

                                    {/* Tags */}
                                    {post.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5 mb-3">
                                        {post.tags.slice(0, 3).map(tag => (
                                          <span key={tag} className="text-xs text-gray-500 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-full">
                                            {tag}
                                          </span>
                                        ))}
                                        {post.tags.length > 3 && (
                                          <span className="text-xs text-gray-600">+{post.tags.length - 3}</span>
                                        )}
                                      </div>
                                    )}

                                    {/* Read more */}
                                    <div className="flex items-center gap-1.5 text-sky-400 text-sm font-medium">
                                      <span>Read more</span>
                                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                  </div>

                                  {/* Shimmer */}
                                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-20 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                                  </div>
                                </Link>
                              </motion.div>
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
    </div>
  );
}

export default function PostsPage() {
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
      <PostsContent />
    </Suspense>
  );
}
