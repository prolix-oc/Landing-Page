import { readFile, writeFile, mkdir, readdir, stat, unlink } from 'node:fs/promises';
import path from 'path';

/**
 * Persistent file-based cache that survives application restarts
 * Stores cache data in .cache/ directory with TTL support
 */

const CACHE_DIR = process.env.PERSISTENT_CACHE_DIR || path.join(process.cwd(), '.cache');
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour default TTL
const MAX_CACHE_SIZE_MB = 100; // Maximum cache size in MB

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  version: string;
}

/**
 * Ensures the cache directory exists
 */
async function ensureCacheDir(): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
}

/**
 * Converts a cache key to a safe filename
 */
function keyToFilename(key: string): string {
  // Replace unsafe characters with safe alternatives
  return key.replace(/[^a-zA-Z0-9_-]/g, '_') + '.json';
}

/**
 * Gets cache entry from disk
 */
export async function getPersistentCache<T>(
  key: string,
  ttl: number = DEFAULT_TTL_MS
): Promise<T | null> {
  try {
    await ensureCacheDir();
    const filename = keyToFilename(key);
    const filePath = path.join(CACHE_DIR, filename);
    
    const content = await readFile(filePath, 'utf-8');
    const entry: CacheEntry<T> = JSON.parse(content);
    
    // Check if cache is expired
    const age = Date.now() - entry.timestamp;
    if (age > (entry.ttl || ttl)) {
      // Cache expired, delete it
      await unlink(filePath).catch(() => {});
      return null;
    }
    
    return entry.data;
  } catch {
    // File doesn't exist or is corrupted
    return null;
  }
}

/**
 * Sets cache entry to disk
 */
export async function setPersistentCache<T>(
  key: string,
  data: T,
  ttl: number = DEFAULT_TTL_MS
): Promise<void> {
  try {
    await ensureCacheDir();
    await cleanupCacheIfNeeded();
    
    const filename = keyToFilename(key);
    const filePath = path.join(CACHE_DIR, filename);
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      version: '1.0'
    };
    
    await writeFile(filePath, JSON.stringify(entry, null, 2));
  } catch (error) {
    console.error(`[Persistent Cache] Failed to write cache for key ${key}:`, error);
  }
}

/**
 * Deletes a specific cache entry
 */
export async function deletePersistentCache(key: string): Promise<boolean> {
  try {
    const filename = keyToFilename(key);
    const filePath = path.join(CACHE_DIR, filename);
    await unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clears all cache entries
 */
export async function clearPersistentCache(): Promise<number> {
  try {
    await ensureCacheDir();
    const entries = await readdir(CACHE_DIR);
    let count = 0;
    
    for (const entry of entries) {
      if (entry.endsWith('.json')) {
        await unlink(path.join(CACHE_DIR, entry));
        count++;
      }
    }
    
    return count;
  } catch (error) {
    console.error('[Persistent Cache] Failed to clear cache:', error);
    return 0;
  }
}

/**
 * Gets cache statistics
 */
export async function getPersistentCacheStats(): Promise<{
  entries: number;
  totalSizeMB: number;
  oldestEntry: number | null;
  newestEntry: number | null;
}> {
  try {
    await ensureCacheDir();
    const entries = await readdir(CACHE_DIR);
    let totalSize = 0;
    let oldest: number | null = null;
    let newest: number | null = null;
    let count = 0;
    
    for (const entry of entries) {
      if (entry.endsWith('.json')) {
        const filePath = path.join(CACHE_DIR, entry);
        const stats = await stat(filePath);
        totalSize += stats.size;
        count++;
        
        const mtime = stats.mtime.getTime();
        if (oldest === null || mtime < oldest) oldest = mtime;
        if (newest === null || mtime > newest) newest = mtime;
      }
    }
    
    return {
      entries: count,
      totalSizeMB: Math.round((totalSize / 1024 / 1024) * 100) / 100,
      oldestEntry: oldest,
      newestEntry: newest
    };
  } catch {
    return {
      entries: 0,
      totalSizeMB: 0,
      oldestEntry: null,
      newestEntry: null
    };
  }
}

/**
 * Cleans up old cache entries if cache exceeds max size
 */
async function cleanupCacheIfNeeded(): Promise<void> {
  try {
    const stats = await getPersistentCacheStats();
    
    if (stats.totalSizeMB > MAX_CACHE_SIZE_MB) {
      console.log(`[Persistent Cache] Cache size (${stats.totalSizeMB}MB) exceeds limit (${MAX_CACHE_SIZE_MB}MB), cleaning up...`);
      
      await ensureCacheDir();
      const entries = await readdir(CACHE_DIR);
      const entriesWithStats: Array<{ name: string; mtime: number }> = [];
      
      for (const entry of entries) {
        if (entry.endsWith('.json')) {
          const filePath = path.join(CACHE_DIR, entry);
          const fileStats = await stat(filePath);
          entriesWithStats.push({
            name: entry,
            mtime: fileStats.mtime.getTime()
          });
        }
      }
      
      // Sort by modification time (oldest first)
      entriesWithStats.sort((a, b) => a.mtime - b.mtime);
      
      // Delete oldest 20% of entries
      const toDelete = Math.ceil(entriesWithStats.length * 0.2);
      for (let i = 0; i < toDelete; i++) {
        await unlink(path.join(CACHE_DIR, entriesWithStats[i].name));
      }
      
      console.log(`[Persistent Cache] Deleted ${toDelete} old entries`);
    }
  } catch (error) {
    console.error('[Persistent Cache] Cleanup failed:', error);
  }
}
