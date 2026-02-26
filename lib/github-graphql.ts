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

// Safety limit for aliases per query to stay well under GitHub's 500k node cap.
// Each tree fetch is ~5-50 nodes; each commit history(first:1) is ~5 nodes.
// 80 aliases * ~50 nodes = ~4,000 nodes max — well within limits.
const MAX_ALIASES_PER_QUERY = 80;

/**
 * Builds a map from index-based GraphQL alias names to original paths.
 * Uses simple `item_0`, `item_1`, etc. to avoid all path-sanitization edge cases.
 */
function buildAliasMap(paths: string[]): Map<string, string> {
  const map = new Map<string, string>();
  paths.forEach((p, i) => {
    map.set(`item_${i}`, p);
  });
  return map;
}

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
 * Fetches multiple directory trees in a single batched GraphQL request using aliases.
 * Each path becomes an aliased `object(expression:)` field under a single `repository` block,
 * so N paths require only 1 HTTP request (or ceil(N/MAX_ALIASES_PER_QUERY) for very large batches).
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
    console.log(`[GraphQL Batch Trees] All ${paths.length} paths served from cache`);
    return results;
  }

  console.log(`[GraphQL Batch Trees] Fetching ${uncachedPaths.length} uncached paths via aliased query...`);

  // Chunk uncached paths into groups of MAX_ALIASES_PER_QUERY
  for (let chunkStart = 0; chunkStart < uncachedPaths.length; chunkStart += MAX_ALIASES_PER_QUERY) {
    const chunk = uncachedPaths.slice(chunkStart, chunkStart + MAX_ALIASES_PER_QUERY);
    const aliasMap = buildAliasMap(chunk);

    // Build aliased query — each path becomes an aliased object(expression:) field
    const aliasedFields = chunk.map((p, i) => {
      const alias = `item_${i}`;
      const expression = p ? `HEAD:${p}` : 'HEAD:';
      return `      ${alias}: object(expression: ${JSON.stringify(expression)}) {
        ... on Tree {
          entries { name type mode oid size }
        }
      }`;
    }).join('\n');

    const query = `
      query {
        repository(owner: ${JSON.stringify(REPO_OWNER)}, name: ${JSON.stringify(REPO_NAME)}) {
${aliasedFields}
        }
        rateLimit { limit remaining resetAt used }
      }
    `;

    try {
      const response = await executeGraphQL<{
        repository: Record<string, { entries?: TreeEntry[] } | null> | null;
        rateLimit: RateLimitInfo;
      }>(query);

      if (response.errors) {
        console.error('[GraphQL Batch Trees] Errors:', response.errors);
      }

      const rateLimit = response.data?.rateLimit;
      if (rateLimit) {
        console.log(`[GraphQL Batch Trees] Rate limit: ${rateLimit.remaining}/${rateLimit.limit} remaining, resets at ${rateLimit.resetAt}`);
      }

      // Map results back to paths and cache each individually
      if (response.data?.repository) {
        for (const [alias, path] of aliasMap) {
          const obj = response.data.repository[alias];
          const entries = obj?.entries || [];
          results.set(path, entries);

          const cacheKey = `graphql:tree:${path}:false`;
          await setPersistentCache(cacheKey, entries, GRAPHQL_CACHE_TTL);
        }
      }
    } catch (error) {
      console.error('[GraphQL Batch Trees] Query failed, falling back to individual fetches:', error);
      // Fallback: fetch individually for this chunk so one bad path doesn't block the rest
      for (const path of chunk) {
        try {
          const entries = await fetchRepositoryTree(path, false);
          results.set(path, entries);
        } catch (individualError) {
          console.error(`[GraphQL Batch Trees] Individual fallback failed for ${path}:`, individualError);
          results.set(path, []);
        }
      }
    }
  }

  return results;
}

/**
 * Fetches the latest commit for multiple file paths in a single batched GraphQL request.
 * Each path becomes an aliased `history(first:1, path:)` field under the default branch commit,
 * so N paths require only 1 HTTP request (or ceil(N/MAX_ALIASES_PER_QUERY) for very large batches).
 *
 * @param filePaths - Array of file paths to look up commits for
 * @returns Map of file path to commit result (or null if not found)
 */
export async function batchFetchCommits(
  filePaths: string[]
): Promise<Map<string, { sha: string; commit: { author: { name: string; date: string } } } | null>> {
  if (filePaths.length === 0) return new Map();

  const results = new Map<string, { sha: string; commit: { author: { name: string; date: string } } } | null>();
  const uncachedPaths: string[] = [];

  // Check cache first for all paths
  for (const filePath of filePaths) {
    const cacheKey = `graphql:commit:${filePath}`;
    const cached = await getPersistentCache<{
      sha: string;
      commit: { author: { name: string; date: string } };
    }>(cacheKey, GRAPHQL_CACHE_TTL);
    if (cached) {
      results.set(filePath, cached);
    } else {
      uncachedPaths.push(filePath);
    }
  }

  if (uncachedPaths.length === 0) {
    console.log(`[GraphQL Batch Commits] All ${filePaths.length} paths served from cache`);
    return results;
  }

  console.log(`[GraphQL Batch Commits] Fetching ${uncachedPaths.length} commits via aliased query...`);

  // Chunk and query
  for (let chunkStart = 0; chunkStart < uncachedPaths.length; chunkStart += MAX_ALIASES_PER_QUERY) {
    const chunk = uncachedPaths.slice(chunkStart, chunkStart + MAX_ALIASES_PER_QUERY);
    const aliasMap = buildAliasMap(chunk);

    // Build aliased history fields under the Commit fragment
    const aliasedFields = chunk.map((p, i) => {
      const alias = `item_${i}`;
      return `            ${alias}: history(first: 1, path: ${JSON.stringify(p)}) {
              nodes {
                oid
                author { name date }
              }
            }`;
    }).join('\n');

    const query = `
      query {
        repository(owner: ${JSON.stringify(REPO_OWNER)}, name: ${JSON.stringify(REPO_NAME)}) {
          defaultBranchRef {
            target {
              ... on Commit {
${aliasedFields}
              }
            }
          }
        }
        rateLimit { limit remaining resetAt used }
      }
    `;

    try {
      const response = await executeGraphQL<{
        repository: {
          defaultBranchRef: {
            target: Record<string, { nodes: Array<{ oid: string; author: { name: string; date: string } }> }>;
          } | null;
        } | null;
        rateLimit: RateLimitInfo;
      }>(query);

      if (response.errors) {
        console.error('[GraphQL Batch Commits] Errors:', response.errors);
      }

      const rateLimit = response.data?.rateLimit;
      if (rateLimit) {
        console.log(`[GraphQL Batch Commits] Rate limit: ${rateLimit.remaining}/${rateLimit.limit} remaining, resets at ${rateLimit.resetAt}`);
      }

      const commitTarget = response.data?.repository?.defaultBranchRef?.target;
      if (commitTarget) {
        for (const [alias, filePath] of aliasMap) {
          const historyData = commitTarget[alias];
          const nodes = historyData?.nodes;

          if (nodes && nodes.length > 0) {
            const node = nodes[0];
            const result = {
              sha: node.oid,
              commit: {
                author: {
                  name: node.author.name,
                  date: node.author.date
                }
              }
            };
            results.set(filePath, result);
            await setPersistentCache(`graphql:commit:${filePath}`, result, GRAPHQL_CACHE_TTL);
          } else {
            results.set(filePath, null);
          }
        }
      }
    } catch (error) {
      console.error('[GraphQL Batch Commits] Query failed, falling back to individual fetches:', error);
      for (const filePath of chunk) {
        try {
          const commit = await fetchLatestCommitGraphQL(filePath);
          results.set(filePath, commit);
        } catch (individualError) {
          console.error(`[GraphQL Batch Commits] Individual fallback failed for ${filePath}:`, individualError);
          results.set(filePath, null);
        }
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

/**
 * Fetches a repository object (file or directory) using GraphQL.
 * Unified query that returns either tree entries (directory) or blob metadata (file).
 * Used by fetchFromGitHub when GraphQL mode is enabled.
 */
export async function fetchObjectGraphQL(
  path: string
): Promise<{
  type: 'tree' | 'blob';
  entries?: TreeEntry[];
  oid?: string;
  byteSize?: number;
} | null> {
  const cacheKey = `graphql:object:${path}`;

  const cached = await getPersistentCache<{
    type: 'tree' | 'blob';
    entries?: TreeEntry[];
    oid?: string;
    byteSize?: number;
  }>(cacheKey, GRAPHQL_CACHE_TTL);
  if (cached) {
    console.log(`[GraphQL] Cache hit for object: ${path}`);
    return cached;
  }

  const query = `
    query($owner: String!, $repo: String!, $expression: String!) {
      repository(owner: $owner, name: $repo) {
        object(expression: $expression) {
          __typename
          ... on Tree {
            entries {
              name
              type
              mode
              oid
              size
            }
          }
          ... on Blob {
            oid
            byteSize
            isTruncated
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

  // Decode URI-encoded paths (e.g., %20 → space) for the GraphQL expression
  const decodedPath = decodeURIComponent(path);
  const expression = `HEAD:${decodedPath}`;

  try {
    console.log(`[GraphQL] Fetching object: ${decodedPath}...`);
    const response = await executeGraphQL<{
      repository: {
        object: {
          __typename: string;
          entries?: TreeEntry[];
          oid?: string;
          byteSize?: number;
          isTruncated?: boolean;
        } | null;
      } | null;
      rateLimit: RateLimitInfo;
    }>(query, {
      owner: REPO_OWNER,
      repo: REPO_NAME,
      expression
    });

    if (response.errors) {
      console.error('[GraphQL] Errors:', response.errors);
      throw new Error(`GraphQL errors: ${response.errors.map(e => e.message).join(', ')}`);
    }

    const obj = response.data?.repository?.object;
    if (!obj) {
      return null;
    }

    const rateLimit = response.data?.rateLimit;
    if (rateLimit) {
      console.log(`[GraphQL] Rate limit: ${rateLimit.remaining}/${rateLimit.limit} remaining`);
    }

    const result = obj.__typename === 'Tree'
      ? { type: 'tree' as const, entries: obj.entries || [] }
      : { type: 'blob' as const, oid: obj.oid, byteSize: obj.byteSize };

    await setPersistentCache(cacheKey, result, GRAPHQL_CACHE_TTL);

    return result;
  } catch (error) {
    console.error(`[GraphQL] Failed to fetch object ${decodedPath}:`, error);
    throw error;
  }
}

/**
 * Fetches the latest commit for a file path using GraphQL.
 * Returns data in GitHubCommit-compatible format for drop-in replacement of REST commit endpoint.
 */
export async function fetchLatestCommitGraphQL(
  filePath: string
): Promise<{
  sha: string;
  commit: {
    author: {
      name: string;
      date: string;
    };
  };
} | null> {
  const cacheKey = `graphql:commit:${filePath}`;

  const cached = await getPersistentCache<{
    sha: string;
    commit: { author: { name: string; date: string } };
  }>(cacheKey, GRAPHQL_CACHE_TTL);
  if (cached) {
    console.log(`[GraphQL] Cache hit for commit: ${filePath}`);
    return cached;
  }

  const query = `
    query($owner: String!, $repo: String!, $path: String!) {
      repository(owner: $owner, name: $repo) {
        defaultBranchRef {
          target {
            ... on Commit {
              history(first: 1, path: $path) {
                nodes {
                  oid
                  author {
                    name
                    date
                  }
                }
              }
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

  try {
    console.log(`[GraphQL] Fetching latest commit for: ${filePath}...`);
    const response = await executeGraphQL<{
      repository: {
        defaultBranchRef: {
          target: {
            history: {
              nodes: Array<{
                oid: string;
                author: {
                  name: string;
                  date: string;
                };
              }>;
            };
          };
        } | null;
      } | null;
      rateLimit: RateLimitInfo;
    }>(query, {
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: filePath
    });

    if (response.errors) {
      console.error('[GraphQL] Errors:', response.errors);
      throw new Error(`GraphQL errors: ${response.errors.map(e => e.message).join(', ')}`);
    }

    const rateLimit = response.data?.rateLimit;
    if (rateLimit) {
      console.log(`[GraphQL] Rate limit: ${rateLimit.remaining}/${rateLimit.limit} remaining`);
    }

    const nodes = response.data?.repository?.defaultBranchRef?.target?.history?.nodes;
    if (!nodes || nodes.length === 0) {
      return null;
    }

    const node = nodes[0];
    const result = {
      sha: node.oid,
      commit: {
        author: {
          name: node.author.name,
          date: node.author.date
        }
      }
    };

    await setPersistentCache(cacheKey, result, GRAPHQL_CACHE_TTL);

    return result;
  } catch (error) {
    console.error(`[GraphQL] Failed to fetch commit for ${filePath}:`, error);
    throw error;
  }
}
