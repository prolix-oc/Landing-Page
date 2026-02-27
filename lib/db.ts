import { Database } from 'bun:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import sharp from 'sharp';

const DB_PATH = path.join(process.cwd(), 'data', 'store.db');
const POSTS_DIR = path.join(process.cwd(), 'data', 'posts');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// Lazy singleton — initialized on first access.
let _db: InstanceType<typeof Database> | null = null;

function getDb(): InstanceType<typeof Database> {
  if (_db) return _db;

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  // strict: true allows named params without prefix ($slug → { slug })
  _db = new Database(DB_PATH, { strict: true });
  _db.exec('PRAGMA journal_mode = WAL');
  _db.exec('PRAGMA foreign_keys = ON');

  _db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      raw_content TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Uncategorized',
      date TEXT NOT NULL,
      updated TEXT,
      excerpt TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      draft INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT UNIQUE NOT NULL,
      original_name TEXT,
      url TEXT NOT NULL,
      width INTEGER,
      height INTEGER,
      size_bytes INTEGER,
      mime_type TEXT,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_posts_date ON posts(date);
    CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
    CREATE INDEX IF NOT EXISTS idx_posts_draft ON posts(draft);
    CREATE INDEX IF NOT EXISTS idx_images_filename ON images(filename);
  `);

  // Add hero_image column if it doesn't exist
  try {
    _db.exec('ALTER TABLE posts ADD COLUMN hero_image TEXT');
  } catch {
    // Column already exists — ignore
  }

  migrateMarkdownFiles(_db);
  migrateExistingImages(_db);

  return _db;
}

function migrateMarkdownFiles(db: InstanceType<typeof Database>): void {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM posts').get() as { cnt: number } | null;
  if (count && count.cnt > 0) return;

  if (!fs.existsSync(POSTS_DIR)) return;

  const files = fs.readdirSync(POSTS_DIR).filter((f: string) => f.endsWith('.md'));
  if (files.length === 0) return;

  console.log(`[db] Migrating ${files.length} markdown file(s) into database...`);

  const insert = db.prepare(`
    INSERT INTO posts (slug, raw_content, title, category, date, updated, excerpt, tags, draft, hero_image)
    VALUES ($slug, $raw_content, $title, $category, $date, $updated, $excerpt, $tags, $draft, $hero_image)
  `);

  const migrate = db.transaction(() => {
    for (const file of files) {
      try {
        const slug = file.replace(/\.md$/, '');
        const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
        const { data } = matter(raw);

        const title = typeof data.title === 'string' ? data.title : slug;
        const category = typeof data.category === 'string' ? data.category : 'Uncategorized';
        const date = typeof data.date === 'string' ? data.date : new Date().toISOString().split('T')[0];
        const updated = typeof data.updated === 'string' ? data.updated : null;
        const excerpt = typeof data.excerpt === 'string' ? data.excerpt : '';
        const tags = Array.isArray(data.tags) ? JSON.stringify(data.tags.filter((t: unknown) => typeof t === 'string')) : '[]';
        const draft = data.draft === true ? 1 : 0;
        const hero_image = typeof data.hero_image === 'string' ? data.hero_image : null;

        insert.run({ slug, raw_content: raw, title, category, date, updated, excerpt, tags, draft, hero_image });
        console.log(`[db] Migrated: ${file}`);
      } catch (err) {
        console.error(`[db] Failed to migrate ${file}:`, err);
      }
    }
  });

  migrate();
}

function migrateExistingImages(db: InstanceType<typeof Database>): void {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM images').get() as { cnt: number } | null;
  if (count && count.cnt > 0) return;

  if (!fs.existsSync(UPLOADS_DIR)) return;

  const files = fs.readdirSync(UPLOADS_DIR).filter((f: string) => f.endsWith('.webp'));
  if (files.length === 0) return;

  console.log(`[db] Migrating ${files.length} existing image(s) into database...`);

  const insert = db.prepare(`
    INSERT INTO images (filename, original_name, url, width, height, size_bytes, mime_type, uploaded_at)
    VALUES ($filename, $original_name, $url, $width, $height, $size_bytes, $mime_type, $uploaded_at)
  `);

  const migrate = db.transaction(() => {
    for (const file of files) {
      try {
        const filePath = path.join(UPLOADS_DIR, file);
        const fileStat = fs.statSync(filePath);

        // Use file birthtime (creation date) as uploaded_at
        const uploaded_at = fileStat.birthtime.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');

        insert.run({
          filename: file,
          original_name: null,
          url: `/api/images/${file}`,
          width: null,
          height: null,
          size_bytes: fileStat.size,
          mime_type: 'image/webp',
          uploaded_at,
        });

        console.log(`[db] Migrated image: ${file} (created ${fileStat.birthtime.toISOString()})`);
      } catch (err) {
        console.error(`[db] Failed to migrate image ${file}:`, err);
      }
    }
  });

  migrate();

  // Back-fill dimensions asynchronously (sharp metadata is async-only)
  backfillImageDimensions(db).catch(err =>
    console.error('[db] Failed to backfill image dimensions:', err)
  );
}

async function backfillImageDimensions(db: InstanceType<typeof Database>): Promise<void> {
  const rows = db.prepare('SELECT filename FROM images WHERE width IS NULL').all() as { filename: string }[];
  if (rows.length === 0) return;

  const update = db.prepare('UPDATE images SET width = $width, height = $height WHERE filename = $filename');

  for (const row of rows) {
    try {
      const filePath = path.join(UPLOADS_DIR, row.filename);
      const metadata = await sharp(filePath).metadata();
      update.run({
        filename: row.filename,
        width: metadata.width ?? null,
        height: metadata.height ?? null,
      });
    } catch {
      // File may not exist or be unreadable — skip
    }
  }
}

// --- Post types ---

export interface PostRow {
  id: number;
  slug: string;
  raw_content: string;
  title: string;
  category: string;
  date: string;
  updated: string | null;
  excerpt: string;
  tags: string; // JSON string
  draft: number; // 0 or 1
  hero_image: string | null;
  created_at: string;
  updated_at: string;
}

// --- Post CRUD ---

export function dbGetAllPosts(includeDrafts = false): PostRow[] {
  const db = getDb();
  if (includeDrafts) {
    return db.prepare('SELECT * FROM posts ORDER BY date DESC').all() as PostRow[];
  }
  return db.prepare('SELECT * FROM posts WHERE draft = 0 ORDER BY date DESC').all() as PostRow[];
}

export function dbGetPostBySlug(slug: string): PostRow | null {
  const db = getDb();
  return (db.prepare('SELECT * FROM posts WHERE slug = $slug').get({ slug }) as PostRow | null) ?? null;
}

export function dbCreatePost(params: {
  slug: string;
  raw_content: string;
  title: string;
  category: string;
  date: string;
  updated?: string;
  excerpt: string;
  tags: string[];
  draft: boolean;
  hero_image?: string;
}): PostRow {
  const existing = dbGetPostBySlug(params.slug);
  if (existing) throw new Error('CONFLICT');

  const db = getDb();
  db.prepare(`
    INSERT INTO posts (slug, raw_content, title, category, date, updated, excerpt, tags, draft, hero_image)
    VALUES ($slug, $raw_content, $title, $category, $date, $updated, $excerpt, $tags, $draft, $hero_image)
  `).run({
    slug: params.slug,
    raw_content: params.raw_content,
    title: params.title,
    category: params.category,
    date: params.date,
    updated: params.updated ?? null,
    excerpt: params.excerpt,
    tags: JSON.stringify(params.tags),
    draft: params.draft ? 1 : 0,
    hero_image: params.hero_image ?? null,
  });

  return dbGetPostBySlug(params.slug)!;
}

export function dbUpdatePost(slug: string, params: {
  raw_content: string;
  title: string;
  category: string;
  date: string;
  updated?: string;
  excerpt: string;
  tags: string[];
  draft: boolean;
  hero_image?: string;
}): PostRow {
  const existing = dbGetPostBySlug(slug);
  if (!existing) throw new Error('NOT_FOUND');

  const db = getDb();
  db.prepare(`
    UPDATE posts
    SET raw_content = $raw_content,
        title = $title,
        category = $category,
        date = $date,
        updated = $updated,
        excerpt = $excerpt,
        tags = $tags,
        draft = $draft,
        hero_image = $hero_image,
        updated_at = datetime('now')
    WHERE slug = $slug
  `).run({
    slug,
    raw_content: params.raw_content,
    title: params.title,
    category: params.category,
    date: params.date,
    updated: params.updated ?? null,
    excerpt: params.excerpt,
    tags: JSON.stringify(params.tags),
    draft: params.draft ? 1 : 0,
    hero_image: params.hero_image ?? null,
  });

  return dbGetPostBySlug(slug)!;
}

export function dbDeletePost(slug: string): void {
  const existing = dbGetPostBySlug(slug);
  if (!existing) throw new Error('NOT_FOUND');

  const db = getDb();
  db.prepare('DELETE FROM posts WHERE slug = $slug').run({ slug });
}

export function dbPublishAllDrafts(): number {
  const db = getDb();
  db.prepare('UPDATE posts SET draft = 0 WHERE draft = 1').run();
  const result = db.prepare('SELECT COUNT(*) as cnt FROM posts WHERE draft = 0').get() as { cnt: number };
  return result.cnt;
}

// --- Image types ---

export interface ImageRow {
  id: number;
  filename: string;
  original_name: string | null;
  url: string;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  mime_type: string | null;
  uploaded_at: string;
}

// --- Image CRUD ---

export function dbInsertImage(params: {
  filename: string;
  original_name?: string;
  url: string;
  width?: number;
  height?: number;
  size_bytes?: number;
  mime_type?: string;
}): ImageRow {
  const db = getDb();
  db.prepare(`
    INSERT INTO images (filename, original_name, url, width, height, size_bytes, mime_type)
    VALUES ($filename, $original_name, $url, $width, $height, $size_bytes, $mime_type)
  `).run({
    filename: params.filename,
    original_name: params.original_name ?? null,
    url: params.url,
    width: params.width ?? null,
    height: params.height ?? null,
    size_bytes: params.size_bytes ?? null,
    mime_type: params.mime_type ?? null,
  });

  return dbGetImageByFilename(params.filename)!;
}

export function dbGetAllImages(): ImageRow[] {
  const db = getDb();
  return db.prepare('SELECT * FROM images ORDER BY uploaded_at DESC').all() as ImageRow[];
}

export function dbGetImageByFilename(filename: string): ImageRow | null {
  const db = getDb();
  return (db.prepare('SELECT * FROM images WHERE filename = $filename').get({ filename }) as ImageRow | null) ?? null;
}

export function dbDeleteImage(filename: string): void {
  const existing = dbGetImageByFilename(filename);
  if (!existing) throw new Error('NOT_FOUND');

  const db = getDb();
  db.prepare('DELETE FROM images WHERE filename = $filename').run({ filename });
}
