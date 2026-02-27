import matter from 'gray-matter';
import { revalidatePath } from 'next/cache';
import type { BlogPost, BlogPostSummary, BlogPostFrontmatter, BlogFilterOption } from '@/lib/types/blog-post';
import type { PostRow } from '@/lib/db';

// Dynamic import of the DB module. bun:sqlite is externalized by Turbopack
// but the externalized require runs at chunk-evaluation time. Using import()
// creates a chunk boundary so the bun:sqlite chunk is only loaded when this
// function is called — not when blog.ts itself is loaded by pages during build.
type DbModule = typeof import('@/lib/db');
let _dbModule: DbModule | null = null;

async function loadDb(): Promise<DbModule | null> {
  if (_dbModule) return _dbModule;

  try {
    _dbModule = await import('@/lib/db');
    return _dbModule;
  } catch (err) {
    // Don't cache failures — the module may become available at runtime
    // even if it failed during build analysis.
    console.error('[blog] Failed to load DB module:', err);
    return null;
  }
}

// In-memory LRU cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const indexCache: { entry: CacheEntry<BlogPostSummary[]> | null } = { entry: null };
const postCache = new Map<string, CacheEntry<BlogPost>>();

const INDEX_TTL = 60 * 1000; // 60 seconds
const POST_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_POST_CACHE_SIZE = 50;

function isExpired(timestamp: number, ttl: number): boolean {
  return Date.now() - timestamp > ttl;
}

function validateFrontmatter(data: Record<string, unknown>): BlogPostFrontmatter {
  const title = typeof data.title === 'string' ? data.title : '';
  const category = typeof data.category === 'string' ? data.category : 'Uncategorized';
  const date = typeof data.date === 'string' ? data.date : new Date().toISOString().split('T')[0];
  const excerpt = typeof data.excerpt === 'string' ? data.excerpt : '';
  const updated = typeof data.updated === 'string' ? data.updated : undefined;
  const draft = typeof data.draft === 'boolean' ? data.draft : false;

  let tags: string[] = [];
  if (Array.isArray(data.tags)) {
    tags = data.tags.filter((t): t is string => typeof t === 'string');
  }

  if (!title) {
    throw new Error('Post frontmatter missing required field: title');
  }

  const hero_image = typeof data.hero_image === 'string' ? data.hero_image : undefined;

  return { title, tags, category, date, updated, excerpt, draft, hero_image };
}

function rowToSummary(row: PostRow): BlogPostSummary {
  return {
    slug: row.slug,
    title: row.title,
    tags: JSON.parse(row.tags) as string[],
    category: row.category,
    date: row.date,
    updated: row.updated ?? undefined,
    excerpt: row.excerpt,
    hero_image: row.hero_image ?? undefined,
  };
}

function rowToBlogPost(row: PostRow): BlogPost {
  const { data, content } = matter(row.raw_content);
  const frontmatter = validateFrontmatter(data);
  return { slug: row.slug, frontmatter, content };
}

export async function getAllPosts(includeDrafts = false): Promise<BlogPostSummary[]> {
  // Only use cache for the default (non-draft) listing
  if (!includeDrafts && indexCache.entry && !isExpired(indexCache.entry.timestamp, INDEX_TTL)) {
    return indexCache.entry.data;
  }

  const db = await loadDb();
  if (!db) return [];

  const rows = db.dbGetAllPosts(includeDrafts);
  const posts = rows.map(rowToSummary);

  if (!includeDrafts) {
    indexCache.entry = { data: posts, timestamp: Date.now() };
  }
  return posts;
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const cached = postCache.get(slug);
  if (cached && !isExpired(cached.timestamp, POST_TTL)) {
    return cached.data;
  }

  const db = await loadDb();
  if (!db) return null;

  const row = db.dbGetPostBySlug(slug);
  if (!row) return null;

  // Skip drafts in production
  if (row.draft && process.env.NODE_ENV === 'production') return null;

  const post = rowToBlogPost(row);

  // LRU eviction
  if (postCache.size >= MAX_POST_CACHE_SIZE) {
    const oldestKey = postCache.keys().next().value;
    if (oldestKey) postCache.delete(oldestKey);
  }
  postCache.set(slug, { data: post, timestamp: Date.now() });

  return post;
}

export async function createPost(slug: string, content: string): Promise<BlogPost> {
  const db = await loadDb();
  if (!db) throw new Error('Database unavailable');

  const { data, content: body } = matter(content);
  const frontmatter = validateFrontmatter(data);

  db.dbCreatePost({
    slug,
    raw_content: content,
    title: frontmatter.title,
    category: frontmatter.category,
    date: frontmatter.date,
    updated: frontmatter.updated,
    excerpt: frontmatter.excerpt,
    tags: frontmatter.tags,
    draft: frontmatter.draft ?? false,
    hero_image: frontmatter.hero_image,
  });

  const post: BlogPost = { slug, frontmatter, content: body };
  invalidateBlogCache(slug);
  return post;
}

export async function updatePost(slug: string, content: string): Promise<BlogPost> {
  const db = await loadDb();
  if (!db) throw new Error('Database unavailable');

  const { data, content: body } = matter(content);
  const frontmatter = validateFrontmatter(data);

  db.dbUpdatePost(slug, {
    raw_content: content,
    title: frontmatter.title,
    category: frontmatter.category,
    date: frontmatter.date,
    updated: frontmatter.updated,
    excerpt: frontmatter.excerpt,
    tags: frontmatter.tags,
    draft: frontmatter.draft ?? false,
    hero_image: frontmatter.hero_image,
  });

  const post: BlogPost = { slug, frontmatter, content: body };
  invalidateBlogCache(slug);
  return post;
}

export async function deletePost(slug: string): Promise<void> {
  const db = await loadDb();
  if (!db) throw new Error('Database unavailable');

  db.dbDeletePost(slug);
  invalidateBlogCache(slug);
}

export function invalidateBlogCache(slug?: string): void {
  indexCache.entry = null;
  postCache.clear();

  // Revalidate Next.js page cache so stale static HTML is regenerated
  try {
    revalidatePath('/posts');
    if (slug) {
      revalidatePath(`/posts/${slug}`);
    }
  } catch {
    // revalidatePath may throw during build or outside request context — safe to ignore
  }
}

export async function aggregateFilters(posts: BlogPostSummary[]): Promise<{
  categories: BlogFilterOption[];
  tags: BlogFilterOption[];
}> {
  const categoryMap = new Map<string, number>();
  const tagMap = new Map<string, number>();

  for (const post of posts) {
    categoryMap.set(post.category, (categoryMap.get(post.category) || 0) + 1);
    for (const tag of post.tags) {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    }
  }

  const categories = Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const tags = Array.from(tagMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return { categories, tags };
}
