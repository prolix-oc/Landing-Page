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

const GITHUB_API_BASE = 'https://api.github.com';
const REPO_OWNER = 'prolix-oc';
const REPO_NAME = 'ST-Presets';
const CACHE_DURATION = 30 * 1000; // 30 seconds in milliseconds
const THUMBNAIL_CACHE_DURATION = 60 * 60 * 1000; // 1 hour for thumbnails
const CHARACTER_CARD_CACHE_DURATION = 60 * 60 * 1000; // 1 hour for character card JSON

// In-memory cache
const cache = new Map<string, CachedData>();
const thumbnailCache = new Map<string, ThumbnailCache>();
const characterCardCache = new Map<string, CharacterCardCache>();

// Track ongoing background refreshes to prevent duplicate requests
const refreshingKeys = new Set<string>();

/**
 * Fetches data from GitHub with background revalidation strategy.
 * Returns cached data immediately if available, and silently updates in background.
 */
export async function fetchFromGitHub(path: string): Promise<any> {
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
 * Fetches fresh data and updates cache
 */
async function fetchAndCache(path: string, cacheKey: string): Promise<any> {
  const url = `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      ...(process.env.GITHUB_TOKEN && {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`
      })
    },
    cache: 'no-store' // Disable Next.js caching, we handle it ourselves
  });

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
      ...(process.env.GITHUB_TOKEN && {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`
      })
    },
    cache: 'no-store'
  });

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
  return Array.isArray(contents) ? contents : [];
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
