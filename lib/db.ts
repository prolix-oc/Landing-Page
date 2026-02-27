import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const DB_PATH = path.join(process.cwd(), 'data', 'store.db');
const POSTS_DIR = path.join(process.cwd(), 'data', 'posts');

// bun:sqlite is only available at runtime under Bun — Next.js build workers
// run under Node.js and cannot resolve it. We detect Bun at runtime and
// lazily load the Database class so the module can be imported safely everywhere.
const isBun = typeof globalThis.Bun !== 'undefined';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any = null;

function getDb() {
  if (_db) return _db;

  if (!isBun) {
    throw new Error('bun:sqlite is only available at runtime under Bun');
  }

  // Dynamic string defeats static analysis by bundlers
  const modName = ['bun', 'sqlite'].join(':');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Database } = require(modName);

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  _db = new Database(DB_PATH);
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

  migrateMarkdownFiles(_db);

  return _db;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateMarkdownFiles(db: any): void {
  const count = db.query('SELECT COUNT(*) as cnt FROM posts').get() as { cnt: number };
  if (count.cnt > 0) return;

  if (!fs.existsSync(POSTS_DIR)) return;

  const files = fs.readdirSync(POSTS_DIR).filter((f: string) => f.endsWith('.md'));
  if (files.length === 0) return;

  console.log(`[db] Migrating ${files.length} markdown file(s) into database...`);

  const insert = db.prepare(`
    INSERT INTO posts (slug, raw_content, title, category, date, updated, excerpt, tags, draft)
    VALUES ($slug, $raw_content, $title, $category, $date, $updated, $excerpt, $tags, $draft)
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

        insert.run({
          $slug: slug,
          $raw_content: raw,
          $title: title,
          $category: category,
          $date: date,
          $updated: updated,
          $excerpt: excerpt,
          $tags: tags,
          $draft: draft,
        });

        console.log(`[db] Migrated: ${file}`);
      } catch (err) {
        console.error(`[db] Failed to migrate ${file}:`, err);
      }
    }
  });

  migrate();
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
  created_at: string;
  updated_at: string;
}

// --- Post CRUD ---

export function dbGetAllPosts(includeDrafts = false): PostRow[] {
  const db = getDb();
  if (includeDrafts) {
    return db.query('SELECT * FROM posts ORDER BY date DESC').all() as PostRow[];
  }
  return db.query('SELECT * FROM posts WHERE draft = 0 ORDER BY date DESC').all() as PostRow[];
}

export function dbGetPostBySlug(slug: string): PostRow | null {
  const db = getDb();
  return (db.query('SELECT * FROM posts WHERE slug = $slug').get({ $slug: slug }) as PostRow | null);
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
}): PostRow {
  const existing = dbGetPostBySlug(params.slug);
  if (existing) throw new Error('CONFLICT');

  const db = getDb();
  db.query(`
    INSERT INTO posts (slug, raw_content, title, category, date, updated, excerpt, tags, draft)
    VALUES ($slug, $raw_content, $title, $category, $date, $updated, $excerpt, $tags, $draft)
  `).run({
    $slug: params.slug,
    $raw_content: params.raw_content,
    $title: params.title,
    $category: params.category,
    $date: params.date,
    $updated: params.updated ?? null,
    $excerpt: params.excerpt,
    $tags: JSON.stringify(params.tags),
    $draft: params.draft ? 1 : 0,
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
}): PostRow {
  const db = getDb();
  const result = db.query(`
    UPDATE posts
    SET raw_content = $raw_content,
        title = $title,
        category = $category,
        date = $date,
        updated = $updated,
        excerpt = $excerpt,
        tags = $tags,
        draft = $draft,
        updated_at = datetime('now')
    WHERE slug = $slug
  `).run({
    $slug: slug,
    $raw_content: params.raw_content,
    $title: params.title,
    $category: params.category,
    $date: params.date,
    $updated: params.updated ?? null,
    $excerpt: params.excerpt,
    $tags: JSON.stringify(params.tags),
    $draft: params.draft ? 1 : 0,
  });

  if (result.changes === 0) throw new Error('NOT_FOUND');

  return dbGetPostBySlug(slug)!;
}

export function dbDeletePost(slug: string): void {
  const db = getDb();
  const result = db.query('DELETE FROM posts WHERE slug = $slug').run({ $slug: slug });
  if (result.changes === 0) throw new Error('NOT_FOUND');
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
  db.query(`
    INSERT INTO images (filename, original_name, url, width, height, size_bytes, mime_type)
    VALUES ($filename, $original_name, $url, $width, $height, $size_bytes, $mime_type)
  `).run({
    $filename: params.filename,
    $original_name: params.original_name ?? null,
    $url: params.url,
    $width: params.width ?? null,
    $height: params.height ?? null,
    $size_bytes: params.size_bytes ?? null,
    $mime_type: params.mime_type ?? null,
  });

  return dbGetImageByFilename(params.filename)!;
}

export function dbGetAllImages(): ImageRow[] {
  const db = getDb();
  return db.query('SELECT * FROM images ORDER BY uploaded_at DESC').all() as ImageRow[];
}

export function dbGetImageByFilename(filename: string): ImageRow | null {
  const db = getDb();
  return (db.query('SELECT * FROM images WHERE filename = $filename').get({ $filename: filename }) as ImageRow | null);
}

export function dbDeleteImage(filename: string): void {
  const db = getDb();
  const result = db.query('DELETE FROM images WHERE filename = $filename').run({ $filename: filename });
  if (result.changes === 0) throw new Error('NOT_FOUND');
}
