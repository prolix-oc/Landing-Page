import matter from 'gray-matter';
import type { BlogPost, BlogPostSummary, BlogPostFrontmatter, BlogFilterOption } from '@/lib/types/blog-post';
import {
  dbGetAllPosts,
  dbGetPostBySlug,
  dbCreatePost,
  dbUpdatePost,
  dbDeletePost,
  type PostRow,
} from '@/lib/db';

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

  return { title, tags, category, date, updated, excerpt, draft };
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
  };
}

function rowToBlogPost(row: PostRow): BlogPost {
  const { data, content } = matter(row.raw_content);
  const frontmatter = validateFrontmatter(data);
  return { slug: row.slug, frontmatter, content };
}

export async function getAllPosts(): Promise<BlogPostSummary[]> {
  if (indexCache.entry && !isExpired(indexCache.entry.timestamp, INDEX_TTL)) {
    return indexCache.entry.data;
  }

  try {
    const includeDrafts = process.env.NODE_ENV !== 'production';
    const rows = dbGetAllPosts(includeDrafts);
    const posts = rows.map(rowToSummary);

    indexCache.entry = { data: posts, timestamp: Date.now() };
    return posts;
  } catch {
    // DB unavailable (e.g. during Next.js build under Node.js)
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const cached = postCache.get(slug);
  if (cached && !isExpired(cached.timestamp, POST_TTL)) {
    return cached.data;
  }

  try {
    const row = dbGetPostBySlug(slug);
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
  } catch {
    // DB unavailable (e.g. during Next.js build under Node.js)
    return null;
  }
}

export async function createPost(slug: string, content: string): Promise<BlogPost> {
  const { data, content: body } = matter(content);
  const frontmatter = validateFrontmatter(data);

  dbCreatePost({
    slug,
    raw_content: content,
    title: frontmatter.title,
    category: frontmatter.category,
    date: frontmatter.date,
    updated: frontmatter.updated,
    excerpt: frontmatter.excerpt,
    tags: frontmatter.tags,
    draft: frontmatter.draft ?? false,
  });

  const post: BlogPost = { slug, frontmatter, content: body };
  invalidateBlogCache();
  return post;
}

export async function updatePost(slug: string, content: string): Promise<BlogPost> {
  const { data, content: body } = matter(content);
  const frontmatter = validateFrontmatter(data);

  dbUpdatePost(slug, {
    raw_content: content,
    title: frontmatter.title,
    category: frontmatter.category,
    date: frontmatter.date,
    updated: frontmatter.updated,
    excerpt: frontmatter.excerpt,
    tags: frontmatter.tags,
    draft: frontmatter.draft ?? false,
  });

  const post: BlogPost = { slug, frontmatter, content: body };
  invalidateBlogCache();
  return post;
}

export async function deletePost(slug: string): Promise<void> {
  dbDeletePost(slug);
  invalidateBlogCache();
}

export function invalidateBlogCache(): void {
  indexCache.entry = null;
  postCache.clear();
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
