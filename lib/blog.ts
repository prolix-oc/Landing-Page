import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import type { BlogPost, BlogPostSummary, BlogPostFrontmatter, BlogFilterOption } from '@/lib/types/blog-post';

const POSTS_DIR = path.join(process.cwd(), 'data', 'posts');

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

function postToSummary(post: BlogPost): BlogPostSummary {
  return {
    slug: post.slug,
    title: post.frontmatter.title,
    tags: post.frontmatter.tags,
    category: post.frontmatter.category,
    date: post.frontmatter.date,
    updated: post.frontmatter.updated,
    excerpt: post.frontmatter.excerpt,
  };
}

export async function getAllPosts(): Promise<BlogPostSummary[]> {
  // Check index cache
  if (indexCache.entry && !isExpired(indexCache.entry.timestamp, INDEX_TTL)) {
    return indexCache.entry.data;
  }

  try {
    await fs.mkdir(POSTS_DIR, { recursive: true });
    const files = await fs.readdir(POSTS_DIR);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    const posts: BlogPostSummary[] = [];

    for (const file of mdFiles) {
      try {
        const slug = file.replace(/\.md$/, '');
        const filePath = path.join(POSTS_DIR, file);
        const raw = await fs.readFile(filePath, 'utf-8');
        const { data } = matter(raw);
        const frontmatter = validateFrontmatter(data);

        // Skip drafts in production
        if (frontmatter.draft && process.env.NODE_ENV === 'production') continue;

        posts.push({
          slug,
          title: frontmatter.title,
          tags: frontmatter.tags,
          category: frontmatter.category,
          date: frontmatter.date,
          updated: frontmatter.updated,
          excerpt: frontmatter.excerpt,
        });
      } catch (err) {
        console.error(`Error parsing post ${file}:`, err);
      }
    }

    // Sort by date descending (newest first)
    posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    indexCache.entry = { data: posts, timestamp: Date.now() };
    return posts;
  } catch (err) {
    console.error('Error reading posts directory:', err);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  // Check post cache
  const cached = postCache.get(slug);
  if (cached && !isExpired(cached.timestamp, POST_TTL)) {
    return cached.data;
  }

  try {
    const filePath = path.join(POSTS_DIR, `${slug}.md`);
    const raw = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(raw);
    const frontmatter = validateFrontmatter(data);

    // Skip drafts in production
    if (frontmatter.draft && process.env.NODE_ENV === 'production') return null;

    const post: BlogPost = { slug, frontmatter, content };

    // LRU eviction
    if (postCache.size >= MAX_POST_CACHE_SIZE) {
      const oldestKey = postCache.keys().next().value;
      if (oldestKey) postCache.delete(oldestKey);
    }
    postCache.set(slug, { data: post, timestamp: Date.now() });

    return post;
  } catch {
    return null;
  }
}

export async function createPost(slug: string, content: string): Promise<BlogPost> {
  const filePath = path.join(POSTS_DIR, `${slug}.md`);

  // Check if already exists
  try {
    await fs.access(filePath);
    throw new Error('CONFLICT');
  } catch (err) {
    if (err instanceof Error && err.message === 'CONFLICT') throw err;
    // File doesn't exist, proceed
  }

  // Validate the content has valid frontmatter
  const { data, content: body } = matter(content);
  const frontmatter = validateFrontmatter(data);

  await fs.mkdir(POSTS_DIR, { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');

  const post: BlogPost = { slug, frontmatter, content: body };
  invalidateBlogCache();
  return post;
}

export async function updatePost(slug: string, content: string): Promise<BlogPost> {
  const filePath = path.join(POSTS_DIR, `${slug}.md`);

  // Verify it exists
  await fs.access(filePath);

  // Validate frontmatter
  const { data, content: body } = matter(content);
  const frontmatter = validateFrontmatter(data);

  await fs.writeFile(filePath, content, 'utf-8');

  const post: BlogPost = { slug, frontmatter, content: body };
  invalidateBlogCache();
  return post;
}

export async function deletePost(slug: string): Promise<void> {
  const filePath = path.join(POSTS_DIR, `${slug}.md`);
  await fs.unlink(filePath);
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
