export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
  slug?: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      date: string;
    };
  };
}

export interface CachedData {
  data: unknown;
  timestamp: number;
  etag?: string;
}

export interface ThumbnailCache {
  url: string;
  sha: string;
  timestamp: number;
}

export interface JsonData {
  spec: string;
  spec_version: string;
  data: {
    name: string;
    description?: string;
    personality?: string;
    scenario?: string;
    first_mes?: string;
    mes_example?: string;
    [key: string]: unknown;
  };
}

export interface JsonDataCache {
  data: JsonData;
  sha: string;
  timestamp: number;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  resource: string;
  used: number;
  timestamp: number;
}

const GITHUB_API_BASE = 'https://api.github.com';
const REPO_OWNER = 'prolix-oc';
const REPO_NAME = 'ST-Presets';
const USER_AGENT = 'Landing-Page-App/1.0';
const CACHE_DURATION = 30 * 1000; // 30 seconds in milliseconds
const THUMBNAIL_CACHE_DURATION = 60 * 60 * 1000; // 1 hour for thumbnails
const JSON_DATA_CACHE_DURATION = 60 * 60 * 1000; // 1 hour for JSON data
const PERSISTENT_CACHE_TTL = 60 * 60 * 1000; // 1 hour for persistent cache

// Import slugify function
import { slugify } from './slugify';
import { 
  USE_LOCAL_CACHE, 
  isLocalCacheAvailable, 
  getLocalDirectoryContents,
  getLocalFileCommit,
  logLocalCacheStatus 
} from './local-cache';

// Import persistent cache
import {
  getPersistentCache,
  setPersistentCache,
  getPersistentCacheStats
} from './persistent-cache';

// Import GraphQL client (optional, falls back to REST if disabled)
import {
  fetchRepositoryTree,
  batchFetchRepositoryTrees,
  treeEntriesToGitHubFiles,
  getGraphQLRateLimit
} from './github-graphql';

// In-memory cache
const cache = new Map<string, CachedData>();
const thumbnailCache = new Map<string, ThumbnailCache>();
const jsonDataCache = new Map<string, JsonDataCache>();
const slugCache = new Map<string, string>();

// Track ongoing background refreshes to prevent duplicate requests
const refreshingKeys = new Set<string>();

// Track if warm-up has been completed
let warmupCompleted = false;
let warmupInProgress = false;

// Track periodic refresh
let periodicRefreshInterval: NodeJS.Timeout | null = null;
let lastPeriodicRefresh: number = 0;
const BASE_PERIODIC_REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes base interval
let currentPeriodicRefreshInterval = BASE_PERIODIC_REFRESH_INTERVAL;

// Rate limit tracking
let rateLimitInfo: RateLimitInfo | null = null;

// Feature flags
const USE_GRAPHQL = process.env.USE_GITHUB_GRAPHQL === 'true';

// Adaptive caching thresholds
const RATE_LIMIT_THRESHOLDS = {
  CRITICAL: 0.1,
  LOW: 0.25,
  MEDIUM: 0.5,
  HEALTHY: 1.0
};

const INTERVAL_MULTIPLIERS = {
  CRITICAL: 4.0,
  LOW: 2.5,
  MEDIUM: 1.5,
  HEALTHY: 1.0
};

/**
 * Fetches data from GitHub with background revalidation strategy.
 * Returns cached data immediately if available, and silently updates in background.
 * Checks persistent cache first (survives restarts), then falls back to GitHub API.
 */
export async function fetchFromGitHub(path: string): Promise<unknown> {
  const cacheKey = `github:${path}`;
  
  // Check in-memory cache first (fastest)
  const memoryCached = cache.get(cacheKey);
  const now = Date.now();
  
  if (memoryCached) {
    const isStale = now - memoryCached.timestamp >= CACHE_DURATION;
    if (isStale && !refreshingKeys.has(cacheKey)) {
      refreshInBackground(path, cacheKey);
    }
    return memoryCached.data;
  }
  
  // Check persistent cache second (survives restarts)
  const persistentCached = await getPersistentCache<unknown>(cacheKey, PERSISTENT_CACHE_TTL);
  if (persistentCached) {
    // Populate in-memory cache
    cache.set(cacheKey, {
      data: persistentCached,
      timestamp: now
    });
    console.log(`[GitHub] Persistent cache hit: ${path}`);
    
    // Trigger background refresh to get fresh data
    refreshInBackground(path, cacheKey);
    return persistentCached;
  }
  
  // Check local cache third (if enabled)
  if (USE_LOCAL_CACHE && await isLocalCacheAvailable()) {
    try {
      const localData = await getLocalDirectoryContents(path);
      if (localData && localData.length > 0) {
        cache.set(cacheKey, {
          data: localData,
          timestamp: now
        });
        await setPersistentCache(cacheKey, localData, PERSISTENT_CACHE_TTL);
        return localData;
      }
    } catch (error) {
      console.warn(`[Local Cache] Failed to read from local cache for ${path}:`, error);
    }
  }
  
  // No cache exists, fetch from GitHub
  return await fetchAndCache(path, cacheKey);
}

/**
 * Uses GraphQL to fetch repository tree if enabled, otherwise falls back to REST
 */
async function fetchDirectoryContents(path: string): Promise<GitHubFile[]> {
  if (USE_GRAPHQL) {
    try {
      const entries = await fetchRepositoryTree(path, false);
      return treeEntriesToGitHubFiles(entries, path) as GitHubFile[];
    } catch (error) {
      console.warn(`[GraphQL] Failed to fetch ${path}, falling back to REST:`, error);
      // Fall through to REST API
    }
  }
  
  // Fallback to REST API
  const contents = await fetchFromGitHub(path);
  const files = Array.isArray(contents) ? contents : [];
  return processDirectoryContentsWithSlugs(files);
}

/**
 * Extracts rate limit information from GitHub API response headers
 */
function extractRateLimitInfo(headers: Headers): RateLimitInfo | null {
  const limit = headers.get('x-ratelimit-limit');
  const remaining = headers.get('x-ratelimit-remaining');
  const reset = headers.get('x-ratelimit-reset');
  const resource = headers.get('x-ratelimit-resource');
  const used = headers.get('x-ratelimit-used');

  if (!limit || !remaining || !reset) {
    return null;
  }

  return {
    limit: parseInt(limit, 10),
    remaining: parseInt(remaining, 10),
    reset: parseInt(reset, 10),
    resource: resource || 'core',
    used: used ? parseInt(used, 10) : 0,
    timestamp: Date.now()
  };
}

/**
 * Calculates adaptive refresh interval based on current rate limit status
 */
function calculateAdaptiveInterval(): number {
  if (!rateLimitInfo) {
    return BASE_PERIODIC_REFRESH_INTERVAL;
  }

  const remainingPercentage = rateLimitInfo.remaining / rateLimitInfo.limit;
  
  let multiplier = INTERVAL_MULTIPLIERS.HEALTHY;
  let status = 'HEALTHY';

  if (remainingPercentage <= RATE_LIMIT_THRESHOLDS.CRITICAL) {
    multiplier = INTERVAL_MULTIPLIERS.CRITICAL;
    status = 'CRITICAL';
  } else if (remainingPercentage <= RATE_LIMIT_THRESHOLDS.LOW) {
    multiplier = INTERVAL_MULTIPLIERS.LOW;
    status = 'LOW';
  } else if (remainingPercentage <= RATE_LIMIT_THRESHOLDS.MEDIUM) {
    multiplier = INTERVAL_MULTIPLIERS.MEDIUM;
    status = 'MEDIUM';
  }

  const newInterval = Math.floor(BASE_PERIODIC_REFRESH_INTERVAL * multiplier);
  
  if (Math.abs(newInterval - currentPeriodicRefreshInterval) > 5000) {
    console.log(`[Rate Limit] Adjusting refresh interval: ${currentPeriodicRefreshInterval}ms → ${newInterval}ms (${status}: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} remaining, ${Math.floor(remainingPercentage * 100)}%)`);
  }

  return newInterval;
}

/**
 * Updates the periodic refresh interval if rate limits require adjustment
 */
async function updatePeriodicRefreshInterval(): Promise<void> {
  const newInterval = calculateAdaptiveInterval();

  if (newInterval !== currentPeriodicRefreshInterval) {
    currentPeriodicRefreshInterval = newInterval;

    if (periodicRefreshInterval) {
      stopPeriodicRefresh();
      await startPeriodicRefresh();
    }
  }
}

/**
 * Waits for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Checks if a response indicates rate limit exhaustion
 */
function isRateLimitError(response: Response): { isRateLimited: boolean; resetTime?: Date } {
  const remaining = response.headers.get('x-ratelimit-remaining');
  const resetTimestamp = response.headers.get('x-ratelimit-reset');
  
  if (response.status === 403 && remaining === '0' && resetTimestamp) {
    const resetTime = new Date(parseInt(resetTimestamp, 10) * 1000);
    return { isRateLimited: true, resetTime };
  }
  
  return { isRateLimited: false };
}

/**
 * Fetches fresh data and updates cache
 */
async function fetchAndCache(path: string, cacheKey: string, retryCount = 0): Promise<unknown> {
  const url = `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': USER_AGENT,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(process.env.GITHUB_TOKEN && {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`
      })
    },
    cache: 'no-store'
  });

  const newRateLimitInfo = extractRateLimitInfo(response.headers);
  if (newRateLimitInfo) {
    rateLimitInfo = newRateLimitInfo;
    await updatePeriodicRefreshInterval();
  }

  const rateLimitCheck = isRateLimitError(response);
  if (rateLimitCheck.isRateLimited && rateLimitCheck.resetTime) {
    const now = new Date();
    const waitMs = rateLimitCheck.resetTime.getTime() - now.getTime() + 1000;
    
    if (waitMs > 0 && retryCount < 3) {
      const waitSeconds = Math.ceil(waitMs / 1000);
      console.log(`[GitHub API] Rate limit hit for ${path}. Waiting ${waitSeconds}s until reset...`);
      await sleep(waitMs);
      return fetchAndCache(path, cacheKey, retryCount + 1);
    }
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unable to read error body');
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}. Body: ${errorBody}`);
  }

  const data = await response.json();
  const timestamp = Date.now();
  
  // Update both in-memory and persistent cache
  cache.set(cacheKey, { data, timestamp });
  await setPersistentCache(cacheKey, data, PERSISTENT_CACHE_TTL);

  return data;
}

/**
 * Refreshes cache in the background without blocking the response
 */
function refreshInBackground(path: string, cacheKey: string): void {
  if (refreshingKeys.has(cacheKey)) return;
  
  refreshingKeys.add(cacheKey);
  
  fetchAndCache(path, cacheKey)
    .catch(error => {
      console.error(`Background refresh failed for ${path}:`, error);
    })
    .finally(() => {
      refreshingKeys.delete(cacheKey);
    });
}

export async function getLatestCommit(filePath: string): Promise<GitHubCommit | null> {
  try {
    // Check in-memory cache first
    const cacheKey = `commit:${filePath}`;
    const cached = cache.get(cacheKey);
    const now = Date.now();
    
    if (cached) {
      const isStale = now - cached.timestamp >= CACHE_DURATION;
      if (isStale && !refreshingKeys.has(cacheKey)) {
        refreshCommitInBackground(filePath, cacheKey);
      }
      return cached.data as GitHubCommit;
    }
    
    // Check persistent cache
    const persistentCached = await getPersistentCache<GitHubCommit>(cacheKey, PERSISTENT_CACHE_TTL);
    if (persistentCached) {
      cache.set(cacheKey, { data: persistentCached, timestamp: now });
      refreshCommitInBackground(filePath, cacheKey);
      return persistentCached;
    }
    
    // Check local cache
    if (USE_LOCAL_CACHE && await isLocalCacheAvailable()) {
      const localCommit = await getLocalFileCommit(filePath);
      if (localCommit) {
        cache.set(cacheKey, { data: localCommit, timestamp: now });
        await setPersistentCache(cacheKey, localCommit, PERSISTENT_CACHE_TTL);
        return localCommit;
      }
    }
    
    // Fetch from GitHub
    return await fetchAndCacheCommit(filePath, cacheKey);
  } catch (error) {
    console.error('Error fetching latest commit:', error);
    return null;
  }
}

async function fetchAndCacheCommit(filePath: string, cacheKey: string, retryCount = 0): Promise<GitHubCommit | null> {
  const url = `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${filePath}&per_page=1`;
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': USER_AGENT,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(process.env.GITHUB_TOKEN && {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`
      })
    },
    cache: 'no-store'
  });

  const newRateLimitInfo = extractRateLimitInfo(response.headers);
  if (newRateLimitInfo) {
    rateLimitInfo = newRateLimitInfo;
    await updatePeriodicRefreshInterval();
  }

  const rateLimitCheck = isRateLimitError(response);
  if (rateLimitCheck.isRateLimited && rateLimitCheck.resetTime) {
    const now = new Date();
    const waitMs = rateLimitCheck.resetTime.getTime() - now.getTime() + 1000;
    
    if (waitMs > 0 && retryCount < 3) {
      await sleep(waitMs);
      return fetchAndCacheCommit(filePath, cacheKey, retryCount + 1);
    }
  }

  if (!response.ok) {
    return null;
  }

  const commits = await response.json();
  const commit = commits.length > 0 ? commits[0] : null;
  const timestamp = Date.now();
  
  cache.set(cacheKey, { data: commit, timestamp });
  await setPersistentCache(cacheKey, commit, PERSISTENT_CACHE_TTL);

  return commit;
}

function refreshCommitInBackground(filePath: string, cacheKey: string): void {
  if (refreshingKeys.has(cacheKey)) return;
  
  refreshingKeys.add(cacheKey);
  
  fetchAndCacheCommit(filePath, cacheKey)
    .catch(error => {
      console.error(`Background commit refresh failed for ${filePath}:`, error);
    })
    .finally(() => {
      refreshingKeys.delete(cacheKey);
    });
}

export async function getDirectoryContents(dirPath: string): Promise<GitHubFile[]> {
  return await fetchDirectoryContents(dirPath);
}

export async function getFileVersions(dirPath: string): Promise<Array<{ file: GitHubFile; commit: GitHubCommit | null }>> {
  const files = await getDirectoryContents(dirPath);
  
  const versions = await Promise.all(
    files
      .filter(file => file.type === 'file')
      .map(async (file) => {
        const commit = await getLatestCommit(file.path);
        return { file, commit };
      })
  );

  return versions.sort((a, b) => {
    if (!a.commit || !b.commit) return 0;
    return new Date(b.commit.commit.author.date).getTime() - 
           new Date(a.commit.commit.author.date).getTime();
  });
}

export function clearCache(): void {
  cache.clear();
  thumbnailCache.clear();
  jsonDataCache.clear();
  slugCache.clear();
}

export function invalidateCachePath(path: string, cacheType: 'github' | 'commit' = 'github'): boolean {
  const cacheKey = `${cacheType}:${path}`;
  const existed = cache.has(cacheKey);
  
  if (existed) {
    cache.delete(cacheKey);
    console.log(`[Cache Invalidation] Invalidated ${cacheType} cache for: ${path}`);
  }
  
  return existed;
}

export function invalidateCacheByPattern(pattern: RegExp): number {
  let count = 0;
  
  for (const key of cache.keys()) {
    if (pattern.test(key)) {
      cache.delete(key);
      count++;
    }
  }
  
  if (count > 0) {
    console.log(`[Cache Invalidation] Invalidated ${count} cache entries matching pattern: ${pattern}`);
  }
  
  return count;
}

export function invalidateThumbnailCache(path: string): boolean {
  const existed = thumbnailCache.has(path);
  
  if (existed) {
    thumbnailCache.delete(path);
    console.log(`[Cache Invalidation] Invalidated thumbnail cache for: ${path}`);
  }
  
  return existed;
}

export function invalidateJsonDataCache(path: string): boolean {
  const existed = jsonDataCache.has(path);
  
  if (existed) {
    jsonDataCache.delete(path);
    console.log(`[Cache Invalidation] Invalidated JSON data cache for: ${path}`);
  }
  
  return existed;
}

function generateAndCacheSlug(name: string, path: string): string {
  const baseName = name.replace(/\s+V\d+$/i, '');
  const slug = slugify(baseName);
  slugCache.set(path, slug);
  return slug;
}

export function getCachedSlug(name: string, path: string): string {
  const cachedSlug = slugCache.get(path);
  if (cachedSlug) {
    return cachedSlug;
  }
  return generateAndCacheSlug(name, path);
}

function processDirectoryContentsWithSlugs(contents: GitHubFile[]): GitHubFile[] {
  return contents.map(item => ({
    ...item,
    slug: getCachedSlug(item.name, item.path)
  }));
}

export function getThumbnailFromCache(path: string, sha: string): string | null {
  const cached = thumbnailCache.get(path);
  
  if (cached && cached.sha === sha && Date.now() - cached.timestamp < THUMBNAIL_CACHE_DURATION) {
    return cached.url;
  }
  
  return null;
}

export function cacheThumbnail(path: string, url: string, sha: string): void {
  thumbnailCache.set(path, {
    url,
    sha,
    timestamp: Date.now()
  });
}

export async function getCharacterThumbnail(
  dirPath: string,
  pngFile: GitHubFile
): Promise<string | null> {
  if (!pngFile) return null;
  
  const cachedUrl = getThumbnailFromCache(pngFile.path, pngFile.sha);
  if (cachedUrl) {
    return cachedUrl;
  }
  
  cacheThumbnail(pngFile.path, pngFile.download_url, pngFile.sha);
  
  return pngFile.download_url;
}

export async function getJsonData(
  jsonFile: GitHubFile
): Promise<JsonData | null> {
  if (!jsonFile) return null;
  
  const cached = jsonDataCache.get(jsonFile.path);
  const now = Date.now();
  
  if (cached && cached.sha === jsonFile.sha && now - cached.timestamp < JSON_DATA_CACHE_DURATION) {
    return cached.data;
  }
  
  // Check persistent cache for JSON data
  const persistentCached = await getPersistentCache<JsonData>(`json:${jsonFile.path}`, JSON_DATA_CACHE_DURATION);
  if (persistentCached) {
    jsonDataCache.set(jsonFile.path, {
      data: persistentCached,
      sha: jsonFile.sha,
      timestamp: now
    });
    return persistentCached;
  }
  
  try {
    const response = await fetch(jsonFile.download_url, {
      headers: {
        'User-Agent': USER_AGENT
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch JSON data: ${response.status}`);
      return null;
    }
    
    const data: JsonData = await response.json();
    
    jsonDataCache.set(jsonFile.path, {
      data,
      sha: jsonFile.sha,
      timestamp: now
    });
    
    await setPersistentCache(`json:${jsonFile.path}`, data, JSON_DATA_CACHE_DURATION);
    
    return data;
  } catch (error) {
    console.error('Error fetching JSON data:', error);
    return null;
  }
}

export function getJsonDataFromCache(path: string, sha: string): JsonData | null {
  const cached = jsonDataCache.get(path);
  
  if (cached && cached.sha === sha && Date.now() - cached.timestamp < JSON_DATA_CACHE_DURATION) {
    return cached.data;
  }
  
  return null;
}

/**
 * LAZY WARMUP: Only fetches top-level directories on startup
 * Actual content is fetched on-demand when users navigate to pages
 * This prevents burning API quota on unused data
 */
export async function warmupCache(): Promise<void> {
  if (warmupInProgress || warmupCompleted) {
    return;
  }

  await logLocalCacheStatus();

  // If local cache is enabled, skip GitHub warmup entirely
  if (USE_LOCAL_CACHE && await isLocalCacheAvailable()) {
    console.log('[Cache Warmup] Skipping GitHub warmup - using local cache');
    warmupCompleted = true;
    return;
  }

  warmupInProgress = true;
  console.log('[Cache Warmup] Starting lazy warm-up (top-level directories only)...');
  const startTime = Date.now();

  try {
    // Only fetch top-level directories - lazy load the rest
    const primaryPaths = [
      'Character Cards',
      'World Books',
      'Chat Completion',
      'Lumia DLCs'
    ];

    // Use batch fetch with GraphQL if enabled, otherwise parallel REST calls
    if (USE_GRAPHQL) {
      console.log('[Cache Warmup] Using GraphQL for batch fetching...');
      const results = await batchFetchRepositoryTrees(primaryPaths);
      
      for (const [path, entries] of results.entries()) {
        const files = treeEntriesToGitHubFiles(entries, path);
        const processedFiles = processDirectoryContentsWithSlugs(files as GitHubFile[]);
        cache.set(`github:${path}`, {
          data: processedFiles,
          timestamp: Date.now()
        });
        await setPersistentCache(`github:${path}`, processedFiles, PERSISTENT_CACHE_TTL);
        console.log(`[Cache Warmup] Cached via GraphQL: ${path} (${entries.length} entries)`);
      }
    } else {
      // Fallback to parallel REST API calls
      await Promise.all(
        primaryPaths.map(async (path) => {
          try {
            await fetchAndCache(path, `github:${path}`);
            console.log(`[Cache Warmup] Cached via REST: ${path}`);
          } catch (error) {
            console.error(`[Cache Warmup] Failed to cache ${path}:`, error);
          }
        })
      );
    }

    warmupCompleted = true;
    const duration = Date.now() - startTime;
    console.log(`[Cache Warmup] Lazy warmup completed in ${duration}ms`);
    console.log(`[Cache Warmup] Subdirectories will be fetched on-demand as users navigate`);

    // Log persistent cache stats
    const cacheStats = await getPersistentCacheStats();
    console.log(`[Persistent Cache] Current cache: ${cacheStats.entries} entries, ${cacheStats.totalSizeMB}MB`);

    // Start periodic refresh after warmup completes
    await startPeriodicRefresh();
  } catch (error) {
    console.error('[Cache Warmup] Error during cache warm-up:', error);
  } finally {
    warmupInProgress = false;
  }
}

/**
 * Ensures warm-up has been triggered
 * With lazy loading, this is non-blocking and minimal
 */
export function ensureWarmup(): void {
  if (!warmupCompleted && !warmupInProgress) {
    warmupCache().catch(error => {
      console.error('[Cache Warmup] Async warmup failed:', error);
    });
  }
}

export function getWarmupStatus(): { completed: boolean; inProgress: boolean } {
  return {
    completed: warmupCompleted,
    inProgress: warmupInProgress
  };
}

/**
 * Refreshes all cached entries in the background
 * Only refreshes entries that have been accessed recently
 */
async function refreshAllCachedEntries(): Promise<void> {
  if (rateLimitInfo) {
    const remainingPercentage = Math.floor((rateLimitInfo.remaining / rateLimitInfo.limit) * 100);
    const resetDate = new Date(rateLimitInfo.reset * 1000);
    console.log(`[Periodic Refresh] Rate Limit: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} remaining (${remainingPercentage}%), resets at ${resetDate.toLocaleTimeString()}`);
  }
  
  console.log(`[Periodic Refresh] Starting periodic cache refresh...`);
  const startTime = Date.now();
  
  try {
    const cacheKeys = Array.from(cache.keys());
    const githubKeys = cacheKeys.filter(key => key.startsWith('github:'));
    const commitKeys = cacheKeys.filter(key => key.startsWith('commit:'));
    
    // Only refresh if we have healthy rate limits
    if (rateLimitInfo && rateLimitInfo.remaining / rateLimitInfo.limit < 0.2) {
      console.log('[Periodic Refresh] Skipping refresh - rate limit too low');
      return;
    }
    
    // Refresh GitHub content cache entries
    const githubRefreshes = githubKeys.map(async (cacheKey) => {
      const path = cacheKey.replace('github:', '');
      if (!refreshingKeys.has(cacheKey)) {
        try {
          await fetchAndCache(path, cacheKey);
        } catch (error) {
          console.error(`[Periodic Refresh] Failed to refresh ${path}:`, error);
        }
      }
    });
    
    const commitRefreshes = commitKeys.map(async (cacheKey) => {
      const filePath = cacheKey.replace('commit:', '');
      if (!refreshingKeys.has(cacheKey)) {
        try {
          await fetchAndCacheCommit(filePath, cacheKey);
        } catch (error) {
          console.error(`[Periodic Refresh] Failed to refresh commit ${filePath}:`, error);
        }
      }
    });
    
    await Promise.all([...githubRefreshes, ...commitRefreshes]);
    
    lastPeriodicRefresh = Date.now();
    const duration = Date.now() - startTime;
    console.log(`[Periodic Refresh] Completed in ${duration}ms. Refreshed ${githubKeys.length} content and ${commitKeys.length} commit entries.`);
  } catch (error) {
    console.error('[Periodic Refresh] Error during periodic refresh:', error);
  }
}

export async function startPeriodicRefresh(): Promise<void> {
  if (periodicRefreshInterval) {
    return;
  }

  if (USE_LOCAL_CACHE && await isLocalCacheAvailable()) {
    console.log('[Periodic Refresh] Disabled - using local cache');
    return;
  }
  
  console.log(`[Periodic Refresh] Starting with ${Math.floor(currentPeriodicRefreshInterval / 60000)}min interval...`);
  
  periodicRefreshInterval = setInterval(() => {
    if (warmupCompleted && cache.size > 0) {
      refreshAllCachedEntries().catch(error => {
        console.error('[Periodic Refresh] Async refresh failed:', error);
      });
    }
  }, currentPeriodicRefreshInterval);
  
  if (periodicRefreshInterval.unref) {
    periodicRefreshInterval.unref();
  }
}

export function stopPeriodicRefresh(): void {
  if (periodicRefreshInterval) {
    clearInterval(periodicRefreshInterval);
    periodicRefreshInterval = null;
    console.log('[Periodic Refresh] Stopped periodic refresh');
  }
}

export function getPeriodicRefreshStatus(): {
  isActive: boolean;
  lastRefresh: number;
  nextRefresh: number;
} {
  return {
    isActive: periodicRefreshInterval !== null,
    lastRefresh: lastPeriodicRefresh,
    nextRefresh: lastPeriodicRefresh + currentPeriodicRefreshInterval
  };
}

export function getRateLimitStatus(): RateLimitInfo | null {
  return rateLimitInfo;
}

/**
 * Gets the persistent cache statistics
 */
export async function getCacheStats(): Promise<{
  memoryEntries: number;
  persistentEntries: number;
  persistentSizeMB: number;
  rateLimit: RateLimitInfo | null;
}> {
  const persistentStats = await getPersistentCacheStats();
  
  return {
    memoryEntries: cache.size,
    persistentEntries: persistentStats.entries,
    persistentSizeMB: persistentStats.totalSizeMB,
    rateLimit: rateLimitInfo
  };
}

/**
 * Gets the GraphQL rate limit status (if GraphQL is enabled)
 */
export async function getGraphQLRateLimitStatus(): Promise<{
  enabled: boolean;
  rateLimit: { limit: number; remaining: number; resetAt: string; used: number } | null;
}> {
  if (!USE_GRAPHQL) {
    return { enabled: false, rateLimit: null };
  }
  
  const rateLimit = await getGraphQLRateLimit();
  return { enabled: true, rateLimit };
}
