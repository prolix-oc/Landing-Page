/**
 * GitHub GraphQL API v4 Integration
 * 
 * Provides efficient bulk data fetching using GraphQL instead of REST API.
 * GraphQL allows fetching multiple resources in a single request, reducing API quota usage.
 * 
 * Rate Limits:
 * - 5,000 points per hour for authenticated requests
 * - Each query costs points based on complexity (node count)
 * - Simple queries: ~1-10 points
 * - Complex tree queries: ~50-200 points
 * 
 * Benefits over REST:
 * - Single request for nested data (e.g., repo -> directory -> files)
 * - Precise field selection (no over-fetching)
 * - Better for bulk operations
 */

import { 
  getPersistentCache, 
  setPersistentCache 
} from './persistent-cache';

const GITHUB_GRAPHQL_ENDPOINT = 'https://api.github.com/graphql';
const REPO_OWNER = 'prolix-oc';
const REPO_NAME = 'ST-Presets';
const USER_AGENT = 'Landing-Page-App/1.0';

// Cache TTL for GraphQL responses
const GRAPHQL_CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    type: string;
    path?: string[];
  }>;
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: string;
  used: number;
}

interface TreeEntry {
  name: string;
  type: string; // 'blob' (file) or 'tree' (directory)
  mode: number;
  oid: string;
  size?: number;
  object?: {
    text?: string;
  };
}

interface RepositoryTree {
  repository: {
    object: {
      entries: TreeEntry[];
    } | null;
  } | null;
  rateLimit: RateLimitInfo;
}

/**
 * Executes a GraphQL query against GitHub's API
 */
async function executeGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<GraphQLResponse<T>> {
  const response = await fetch(GITHUB_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
      'Accept': 'application/vnd.github.v4+json',
      ...(process.env.GITHUB_TOKEN && {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`
      })
    },
    body: JSON.stringify({
      query,
      variables
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GraphQL API error: ${response.status} ${response.statusText}. Body: ${errorText}`);
  }

  return await response.json();
}

/**
 * Fetches repository tree (directory contents) using GraphQL
 * Much more efficient than REST API for nested structures
 * 
 * @param path - Directory path within the repository
 * @param recursive - Whether to fetch recursively (default: false for efficiency)
 * @returns Array of tree entries (files and directories)
 */
export async function fetchRepositoryTree(
  path: string = '',
  recursive: boolean = false
): Promise<TreeEntry[]> {
  const cacheKey = `graphql:tree:${path}:${recursive}`;
  
  // Check persistent cache first
  const cached = await getPersistentCache<TreeEntry[]>(cacheKey, GRAPHQL_CACHE_TTL);
  if (cached) {
    console.log(`[GraphQL] Cache hit for tree: ${path}`);
    return cached;
  }
  
  const query = `
    query($owner: String!, $repo: String!, $expression: String!) {
      repository(owner: $owner, name: $repo) {
        object(expression: $expression) {
          ... on Tree {
            entries {
              name
              type
              mode
              oid
              size
            }
          }
        }
      }
      rateLimit {
        limit
        remaining
        resetAt
        used
      }
    }
  `;
  
  const expression = path ? `HEAD:${path}` : 'HEAD:';
  
  try {
    console.log(`[GraphQL] Fetching tree: ${path || 'root'}...`);
    const response = await executeGraphQL<RepositoryTree>(query, {
      owner: REPO_OWNER,
      repo: REPO_NAME,
      expression
    });
    
    if (response.errors) {
      console.error('[GraphQL] Errors:', response.errors);
      throw new Error(`GraphQL errors: ${response.errors.map(e => e.message).join(', ')}`);
    }
    
    const entries = response.data?.repository?.object?.entries || [];
    
    // Log rate limit status
    const rateLimit = response.data?.rateLimit;
    if (rateLimit) {
      console.log(`[GraphQL] Rate limit: ${rateLimit.remaining}/${rateLimit.limit} remaining, resets at ${rateLimit.resetAt}`);
    }
    
    // Cache the result
    await setPersistentCache(cacheKey, entries, GRAPHQL_CACHE_TTL);
    
    return entries;
  } catch (error) {
    console.error(`[GraphQL] Failed to fetch tree ${path}:`, error);
    throw error;
  }
}

/**
 * Fetches multiple directory trees in a single batch request
 * More efficient than individual requests for warming up cache
 * 
 * @param paths - Array of directory paths to fetch
 * @returns Map of path to tree entries
 */
export async function batchFetchRepositoryTrees(
  paths: string[]
): Promise<Map<string, TreeEntry[]>> {
  if (paths.length === 0) return new Map();
  
  // Check cache first for all paths
  const results = new Map<string, TreeEntry[]>();
  const uncachedPaths: string[] = [];
  
  for (const path of paths) {
    const cacheKey = `graphql:tree:${path}:false`;
    const cached = await getPersistentCache<TreeEntry[]>(cacheKey, GRAPHQL_CACHE_TTL);
    if (cached) {
      results.set(path, cached);
    } else {
      uncachedPaths.push(path);
    }
  }
  
  if (uncachedPaths.length === 0) {
    console.log(`[GraphQL Batch] All ${paths.length} paths served from cache`);
    return results;
  }
  
  // GraphQL doesn't support true batching in one request for different expressions
  // So we fetch in parallel with concurrency limit
  console.log(`[GraphQL Batch] Fetching ${uncachedPaths.length} uncached paths...`);
  
  const CONCURRENCY = 5; // Limit concurrent requests to avoid rate limits
  for (let i = 0; i < uncachedPaths.length; i += CONCURRENCY) {
    const batch = uncachedPaths.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (path) => {
        try {
          const entries = await fetchRepositoryTree(path, false);
          return { path, entries, success: true };
        } catch (error) {
          console.error(`[GraphQL Batch] Failed to fetch ${path}:`, error);
          return { path, entries: [], success: false };
        }
      })
    );
    
    for (const result of batchResults) {
      if (result.success) {
        results.set(result.path, result.entries);
      }
    }
  }
  
  return results;
}

/**
 * Converts GraphQL tree entries to GitHubFile format for compatibility
 */
export function treeEntriesToGitHubFiles(
  entries: TreeEntry[],
  basePath: string
): Array<{
  name: string;
  path: string;
  type: 'file' | 'dir';
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
}> {
  return entries.map(entry => {
    const path = `${basePath}/${entry.name}`.replace(/^\//, '');
    const isDir = entry.type === 'tree';
    
    return {
      name: entry.name,
      path: path,
      type: isDir ? 'dir' : 'file',
      sha: entry.oid,
      size: entry.size || 0,
      url: `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
      html_url: `https://github.com/${REPO_OWNER}/${REPO_NAME}/tree/HEAD/${path}`,
      git_url: `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${entry.oid}`,
      download_url: isDir 
        ? ''
        : `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/HEAD/${path}`
    };
  });
}

/**
 * Gets the current GraphQL rate limit status
 */
export async function getGraphQLRateLimit(): Promise<RateLimitInfo | null> {
  const query = `
    query {
      rateLimit {
        limit
        remaining
        resetAt
        used
      }
    }
  `;
  
  try {
    const response = await executeGraphQL<{ rateLimit: RateLimitInfo }>(query);
    return response.data?.rateLimit || null;
  } catch (error) {
    console.error('[GraphQL] Failed to get rate limit:', error);
    return null;
  }
}
