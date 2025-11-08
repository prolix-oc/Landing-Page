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
  data: any;
  timestamp: number;
  etag?: string;
}

export interface ThumbnailCache {
  url: string;
  sha: string;
  timestamp: number;
}

export interface CharacterCardData {
  spec: string;
  spec_version: string;
  data: {
    name: string;
    description?: string;
    personality?: string;
    scenario?: string;
    first_mes?: string;
    mes_example?: string;
    [key: string]: any;
  };
}

export interface CharacterCardCache {
  data: CharacterCardData;
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
const CHARACTER_CARD_CACHE_DURATION = 60 * 60 * 1000; // 1 hour for character card JSON

// Import slugify function
import { slugify } from './slugify';
import { 
  USE_LOCAL_CACHE, 
  isLocalCacheAvailable, 
  getLocalDirectoryContents,
  getLocalFileCommit,
  logLocalCacheStatus 
} from './local-cache';

// In-memory cache
const cache = new Map<string, CachedData>();
const thumbnailCache = new Map<string, ThumbnailCache>();
const characterCardCache = new Map<string, CharacterCardCache>();
const slugCache = new Map<string, string>();

// Track ongoing background refreshes to prevent duplicate requests
const refreshingKeys = new Set<string>();

// Track if warm-up has been completed
let warmupCompleted = false;
let warmupInProgress = false;

// Track periodic refresh
let periodicRefreshInterval: NodeJS.Timeout | null = null;
let lastPeriodicRefresh: number = 0;
const BASE_PERIODIC_REFRESH_INTERVAL = 45 * 1000; // 45 seconds base interval
let currentPeriodicRefreshInterval = BASE_PERIODIC_REFRESH_INTERVAL;

// Rate limit tracking
let rateLimitInfo: RateLimitInfo | null = null;

// Adaptive caching thresholds
const RATE_LIMIT_THRESHOLDS = {
  CRITICAL: 0.1,  // 10% remaining - slow down significantly
  LOW: 0.25,      // 25% remaining - slow down moderately
  MEDIUM: 0.5,    // 50% remaining - slight slowdown
  HEALTHY: 1.0    // Above 50% - normal operation
};

const INTERVAL_MULTIPLIERS = {
  CRITICAL: 4.0,  // 180 seconds (3 minutes)
  LOW: 2.5,       // 112.5 seconds (~2 minutes)
  MEDIUM: 1.5,    // 67.5 seconds (~1 minute)
  HEALTHY: 1.0    // 45 seconds (base)
};

/**
 * Fetches data from GitHub with background revalidation strategy.
 * Returns cached data immediately if available, and silently updates in background.
 * If local cache is enabled, it will be used as the data source instead of GitHub API.
 */
export async function fetchFromGitHub(path: string): Promise<any> {
  // Check if local cache should be used
  if (USE_LOCAL_CACHE && isLocalCacheAvailable()) {
    try {
      const localData = await getLocalDirectoryContents(path);
      if (localData && localData.length > 0) {
        // Cache the local data in memory for consistency with the rest of the system
        const cacheKey = `github:${path}`;
        cache.set(cacheKey, {
          data: localData,
          timestamp: Date.now()
        });
        return localData;
      }
    } catch (error) {
      console.warn(`[Local Cache] Failed to read from local cache for ${path}, falling back to GitHub API:`, error);
    }
  }

  const cacheKey = `github:${path}`;
  const cached = cache.get(cacheKey);
  const now = Date.now();

  // If we have cached data
  if (cached) {
    const isStale = now - cached.timestamp >= CACHE_DURATION;
    
    // If cache is stale and not already refreshing, trigger background update
    if (isStale && !refreshingKeys.has(cacheKey)) {
      refreshInBackground(path, cacheKey);
    }
    
    // Always return cached data immediately (stale-while-revalidate pattern)
    return cached.data;
  }

  // No cache exists, fetch immediately
  return await fetchAndCache(path, cacheKey);
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
  
  // Log if interval changed significantly
  if (Math.abs(newInterval - currentPeriodicRefreshInterval) > 5000) {
    console.log(`[Rate Limit] Adjusting refresh interval: ${currentPeriodicRefreshInterval}ms → ${newInterval}ms (${status}: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} remaining, ${Math.floor(remainingPercentage * 100)}%)`);
  }

  return newInterval;
}

/**
 * Updates the periodic refresh interval if rate limits require adjustment
 */
function updatePeriodicRefreshInterval(): void {
  const newInterval = calculateAdaptiveInterval();
  
  if (newInterval !== currentPeriodicRefreshInterval) {
    currentPeriodicRefreshInterval = newInterval;
    
    // Restart the interval with the new timing
    if (periodicRefreshInterval) {
      stopPeriodicRefresh();
      startPeriodicRefresh();
    }
  }
}

/**
 * Fetches fresh data and updates cache
 */
async function fetchAndCache(path: string, cacheKey: string): Promise<any> {
  const url = `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': USER_AGENT,
      ...(process.env.GITHUB_TOKEN && {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`
      })
    },
    cache: 'no-store' // Disable Next.js caching, we handle it ourselves
  });

  // Extract and store rate limit info
  const newRateLimitInfo = extractRateLimitInfo(response.headers);
  if (newRateLimitInfo) {
    rateLimitInfo = newRateLimitInfo;
    updatePeriodicRefreshInterval();
  }

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  cache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });

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
    // Check if local cache should be used
    if (USE_LOCAL_CACHE && isLocalCacheAvailable()) {
      try {
        const localCommit = await getLocalFileCommit(filePath);
        if (localCommit) {
          // Cache the local commit data in memory
          const cacheKey = `commit:${filePath}`;
          cache.set(cacheKey, {
            data: localCommit,
            timestamp: Date.now()
          });
          return localCommit;
        }
      } catch (error) {
        console.warn(`[Local Cache] Failed to get commit info from local cache for ${filePath}, falling back to GitHub API:`, error);
      }
    }

    const cacheKey = `commit:${filePath}`;
    const cached = cache.get(cacheKey);
    const now = Date.now();

    // Return cached commit if available, refresh in background if stale
    if (cached) {
      const isStale = now - cached.timestamp >= CACHE_DURATION;
      if (isStale && !refreshingKeys.has(cacheKey)) {
        refreshCommitInBackground(filePath, cacheKey);
      }
      return cached.data;
    }

    // No cache, fetch immediately
    return await fetchAndCacheCommit(filePath, cacheKey);
  } catch (error) {
    console.error('Error fetching latest commit:', error);
    return null;
  }
}

async function fetchAndCacheCommit(filePath: string, cacheKey: string): Promise<GitHubCommit | null> {
  const url = `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${filePath}&per_page=1`;
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': USER_AGENT,
      ...(process.env.GITHUB_TOKEN && {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`
      })
    },
    cache: 'no-store'
  });

  // Extract and store rate limit info
  const newRateLimitInfo = extractRateLimitInfo(response.headers);
  if (newRateLimitInfo) {
    rateLimitInfo = newRateLimitInfo;
    updatePeriodicRefreshInterval();
  }

  if (!response.ok) {
    return null;
  }

  const commits = await response.json();
  const commit = commits.length > 0 ? commits[0] : null;
  
  cache.set(cacheKey, {
    data: commit,
    timestamp: Date.now()
  });

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
  const contents = await fetchFromGitHub(dirPath);
  const files = Array.isArray(contents) ? contents : [];
  return processDirectoryContentsWithSlugs(files);
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

  // Sort by commit date (newest first)
  return versions.sort((a, b) => {
    if (!a.commit || !b.commit) return 0;
    return new Date(b.commit.commit.author.date).getTime() - 
           new Date(a.commit.commit.author.date).getTime();
  });
}

export function clearCache(): void {
  cache.clear();
  thumbnailCache.clear();
  characterCardCache.clear();
  slugCache.clear();
}

/**
 * Generates and caches a slug for a given name
 */
function generateAndCacheSlug(name: string, path: string): string {
  const baseName = name.replace(/\s+V\d+$/i, '');
  const slug = slugify(baseName);
  slugCache.set(path, slug);
  return slug;
}

/**
 * Gets cached slug for a path, or generates one if not cached
 */
export function getCachedSlug(name: string, path: string): string {
  const cachedSlug = slugCache.get(path);
  if (cachedSlug) {
    return cachedSlug;
  }
  return generateAndCacheSlug(name, path);
}

/**
 * Processes directory contents to add slugs to each item
 */
function processDirectoryContentsWithSlugs(contents: GitHubFile[]): GitHubFile[] {
  return contents.map(item => ({
    ...item,
    slug: getCachedSlug(item.name, item.path)
  }));
}

export function getThumbnailFromCache(path: string, sha: string): string | null {
  const cached = thumbnailCache.get(path);
  
  // If cached and SHA matches and not expired, return cached URL
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
  
  // Check if thumbnail is in cache with matching SHA
  const cachedUrl = getThumbnailFromCache(pngFile.path, pngFile.sha);
  if (cachedUrl) {
    return cachedUrl;
  }
  
  // Cache the new thumbnail URL
  cacheThumbnail(pngFile.path, pngFile.download_url, pngFile.sha);
  
  return pngFile.download_url;
}

/**
 * Fetches and caches character card JSON data
 */
export async function getCharacterCardData(
  jsonFile: GitHubFile
): Promise<CharacterCardData | null> {
  if (!jsonFile) return null;
  
  const cached = characterCardCache.get(jsonFile.path);
  const now = Date.now();
  
  // If cached, SHA matches, and not expired, return cached data
  if (cached && cached.sha === jsonFile.sha && now - cached.timestamp < CHARACTER_CARD_CACHE_DURATION) {
    return cached.data;
  }
  
  // Fetch fresh data
  try {
    const response = await fetch(jsonFile.download_url, {
      headers: {
        'User-Agent': USER_AGENT
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch character card JSON: ${response.status}`);
      return null;
    }
    
    const data: CharacterCardData = await response.json();
    
    // Cache the data
    characterCardCache.set(jsonFile.path, {
      data,
      sha: jsonFile.sha,
      timestamp: now
    });
    
    return data;
  } catch (error) {
    console.error('Error fetching character card data:', error);
    return null;
  }
}

/**
 * Gets character card data from cache only (for checking if refresh needed)
 */
export function getCharacterCardFromCache(path: string, sha: string): CharacterCardData | null {
  const cached = characterCardCache.get(path);
  
  // If cached and SHA matches and not expired, return cached data
  if (cached && cached.sha === sha && Date.now() - cached.timestamp < CHARACTER_CARD_CACHE_DURATION) {
    return cached.data;
  }
  
  return null;
}

/**
 * Warm-up cache by pre-fetching all required GitHub content
 * This ensures fresh data is always available and prevents stale cache issues
 * If local cache is enabled, warmup is skipped as data is loaded from disk on demand
 */
export async function warmupCache(): Promise<void> {
  if (warmupInProgress || warmupCompleted) {
    return;
  }

  // Log local cache status
  logLocalCacheStatus();

  // If local cache is enabled and available, skip GitHub warmup
  if (USE_LOCAL_CACHE && isLocalCacheAvailable()) {
    console.log('[Cache Warmup] Skipping GitHub warmup - using local cache');
    warmupCompleted = true;
    return;
  }

  warmupInProgress = true;
  console.log('[Cache Warmup] Starting cache warm-up...');
  const startTime = Date.now();

  try {
    // Define all paths to warm up
    const primaryPaths = [
      'Character Cards',
      'World Books',
      'Chat Completion'
    ];

    // Fetch all primary directories
    await Promise.all(
      primaryPaths.map(async (path) => {
        try {
          await fetchAndCache(path, `github:${path}`);
          console.log(`[Cache Warmup] Cached: ${path}`);
        } catch (error) {
          console.error(`[Cache Warmup] Failed to cache ${path}:`, error);
        }
      })
    );

    // Fetch Character Cards categories and their contents
    try {
      const characterCardsContents = cache.get('github:Character Cards');
      if (characterCardsContents?.data && Array.isArray(characterCardsContents.data)) {
        const categories = characterCardsContents.data.filter((item: any) => item.type === 'dir');
        
        await Promise.all(
          categories.map(async (category: any) => {
            try {
              const categoryPath = category.path;
              await fetchAndCache(categoryPath, `github:${categoryPath}`);
              console.log(`[Cache Warmup] Cached: ${categoryPath}`);
              
              // Fetch character directories within each category
              const categoryContents = cache.get(`github:${categoryPath}`);
              if (categoryContents?.data && Array.isArray(categoryContents.data)) {
                const charDirs = categoryContents.data.filter((item: any) => item.type === 'dir');
                
                await Promise.all(
                  charDirs.map(async (charDir: any) => {
                    try {
                      const charPath = charDir.path;
                      await fetchAndCache(charPath, `github:${charPath}`);
                      
                      // Also fetch commits for the character directory
                      await fetchAndCacheCommit(charPath, `commit:${charPath}`);
                      
                      // Pre-fetch character card JSON data
                      const charContents = cache.get(`github:${charPath}`);
                      if (charContents?.data && Array.isArray(charContents.data)) {
                        const jsonFiles = charContents.data.filter((file: any) => 
                          file.type === 'file' && file.name.toLowerCase().endsWith('.json')
                        );
                        
                        // Fetch all JSON files for this character
                        await Promise.all(
                          jsonFiles.map(async (jsonFile: any) => {
                            try {
                              await getCharacterCardData(jsonFile);
                            } catch (error) {
                              console.error(`[Cache Warmup] Failed to cache JSON: ${jsonFile.path}`, error);
                            }
                          })
                        );
                      }
                    } catch (error) {
                      console.error(`[Cache Warmup] Failed to cache character: ${charDir.path}`, error);
                    }
                  })
                );
              }
            } catch (error) {
              console.error(`[Cache Warmup] Failed to cache category: ${category.path}`, error);
            }
          })
        );
      }
    } catch (error) {
      console.error('[Cache Warmup] Failed to warm up Character Cards:', error);
    }

    // Fetch World Books categories and their contents
    try {
      const worldBooksContents = cache.get('github:World Books');
      if (worldBooksContents?.data && Array.isArray(worldBooksContents.data)) {
        const categories = worldBooksContents.data.filter((item: any) => item.type === 'dir');
        
        await Promise.all(
          categories.map(async (category: any) => {
            try {
              const categoryPath = category.path;
              await fetchAndCache(categoryPath, `github:${categoryPath}`);
              console.log(`[Cache Warmup] Cached: ${categoryPath}`);
              
              // Fetch book directories within each category
              const categoryContents = cache.get(`github:${categoryPath}`);
              if (categoryContents?.data && Array.isArray(categoryContents.data)) {
                const bookDirs = categoryContents.data.filter((item: any) => item.type === 'dir');
                
                await Promise.all(
                  bookDirs.map(async (bookDir: any) => {
                    try {
                      const bookPath = bookDir.path;
                      await fetchAndCache(bookPath, `github:${bookPath}`);
                      
                      // Also fetch commits for the book directory
                      await fetchAndCacheCommit(bookPath, `commit:${bookPath}`);
                      
                      // Pre-fetch world book JSON data
                      const bookContents = cache.get(`github:${bookPath}`);
                      if (bookContents?.data && Array.isArray(bookContents.data)) {
                        const jsonFiles = bookContents.data.filter((file: any) => 
                          file.type === 'file' && file.name.toLowerCase().endsWith('.json')
                        );
                        
                        // Fetch all JSON files for this world book
                        await Promise.all(
                          jsonFiles.map(async (jsonFile: any) => {
                            try {
                              await getCharacterCardData(jsonFile);
                            } catch (error) {
                              console.error(`[Cache Warmup] Failed to cache world book JSON: ${jsonFile.path}`, error);
                            }
                          })
                        );
                      }
                    } catch (error) {
                      console.error(`[Cache Warmup] Failed to cache book: ${bookDir.path}`, error);
                    }
                  })
                );
              }
            } catch (error) {
              console.error(`[Cache Warmup] Failed to cache category: ${category.path}`, error);
            }
          })
        );
      }
    } catch (error) {
      console.error('[Cache Warmup] Failed to warm up World Books:', error);
    }

    warmupCompleted = true;
    const duration = Date.now() - startTime;
    console.log(`[Cache Warmup] Completed in ${duration}ms`);
    
    // Start periodic refresh after warmup completes
    startPeriodicRefresh();
  } catch (error) {
    console.error('[Cache Warmup] Error during cache warm-up:', error);
  } finally {
    warmupInProgress = false;
  }
}

/**
 * Ensures warm-up has been triggered
 * Can be called from API routes to ensure cache is warmed up
 */
export function ensureWarmup(): void {
  if (!warmupCompleted && !warmupInProgress) {
    // Run warmup asynchronously without blocking
    warmupCache().catch(error => {
      console.error('[Cache Warmup] Async warmup failed:', error);
    });
  }
}

/**
 * Gets warmup status
 */
export function getWarmupStatus(): { completed: boolean; inProgress: boolean } {
  return {
    completed: warmupCompleted,
    inProgress: warmupInProgress
  };
}

/**
 * Refreshes all cached entries in the background
 * This ensures fresh data is always available
 */
async function refreshAllCachedEntries(): Promise<void> {
  // Log rate limit status
  if (rateLimitInfo) {
    const remainingPercentage = Math.floor((rateLimitInfo.remaining / rateLimitInfo.limit) * 100);
    const resetDate = new Date(rateLimitInfo.reset * 1000);
    console.log(`[Periodic Refresh] Rate Limit Status: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} remaining (${remainingPercentage}%), resets at ${resetDate.toLocaleTimeString()}`);
  }
  
  console.log(`[Periodic Refresh] Starting periodic cache refresh (interval: ${currentPeriodicRefreshInterval}ms)...`);
  const startTime = Date.now();
  
  try {
    const cacheKeys = Array.from(cache.keys());
    const githubKeys = cacheKeys.filter(key => key.startsWith('github:'));
    const commitKeys = cacheKeys.filter(key => key.startsWith('commit:'));
    
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
    
    // Refresh commit cache entries
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
    
    // Execute all refreshes in parallel
    await Promise.all([...githubRefreshes, ...commitRefreshes]);
    
    lastPeriodicRefresh = Date.now();
    const duration = Date.now() - startTime;
    console.log(`[Periodic Refresh] Completed in ${duration}ms. Refreshed ${githubKeys.length} content entries and ${commitKeys.length} commit entries.`);
  } catch (error) {
    console.error('[Periodic Refresh] Error during periodic refresh:', error);
  }
}

/**
 * Starts the periodic cache refresh mechanism
 * Ensures cache is refreshed every 45 seconds to keep data fresh
 */
export function startPeriodicRefresh(): void {
  // Don't start if already running
  if (periodicRefreshInterval) {
    return;
  }
  
  console.log('[Periodic Refresh] Starting periodic refresh with 45s interval...');
  
  // Start the interval
  periodicRefreshInterval = setInterval(() => {
    // Only refresh if warmup is complete and we have cached entries
    if (warmupCompleted && cache.size > 0) {
      refreshAllCachedEntries().catch(error => {
        console.error('[Periodic Refresh] Async refresh failed:', error);
      });
    }
  }, currentPeriodicRefreshInterval);
  
  // Prevent the interval from keeping the process alive in serverless environments
  if (periodicRefreshInterval.unref) {
    periodicRefreshInterval.unref();
  }
}

/**
 * Stops the periodic cache refresh
 */
export function stopPeriodicRefresh(): void {
  if (periodicRefreshInterval) {
    clearInterval(periodicRefreshInterval);
    periodicRefreshInterval = null;
    console.log('[Periodic Refresh] Stopped periodic refresh');
  }
}

/**
 * Gets the status of periodic refresh
 */
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

/**
 * Gets the current rate limit status
 * Returns null if no rate limit information has been received yet
 */
export function getRateLimitStatus(): RateLimitInfo | null {
  return rateLimitInfo;
}
