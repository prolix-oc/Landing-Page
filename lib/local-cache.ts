import { readdir, stat, readFile } from 'node:fs/promises';
import path from 'path';
import { GitHubFile, GitHubCommit } from './github';

/**
 * Local cache configuration
 * Using process.env for cross-runtime compatibility (Bun optimizes this at runtime)
 */
const LOCAL_CACHE_DIR = process.env.LOCAL_CACHE_PATH || path.join(process.cwd(), 'data');
const USE_LOCAL_CACHE = process.env.USE_LOCAL_CACHE === 'true';

export { USE_LOCAL_CACHE };

/**
 * Checks if local cache is enabled and available
 */
export async function isLocalCacheAvailable(): Promise<boolean> {
  if (!USE_LOCAL_CACHE) {
    return false;
  }

  try {
    const stats = await stat(LOCAL_CACHE_DIR);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Converts a GitHub path to a local file system path
 */
function githubPathToLocalPath(githubPath: string): string {
  return path.join(LOCAL_CACHE_DIR, githubPath);
}

/**
 * Reads directory contents and formats them like GitHub API response
 * Uses node:fs/promises which Bun optimizes for 2-3x faster I/O
 */
export async function getLocalDirectoryContents(dirPath: string): Promise<GitHubFile[]> {
  const localPath = githubPathToLocalPath(dirPath);

  try {
    const stats = await stat(localPath);
    if (!stats.isDirectory()) {
      console.warn(`[Local Cache] Path is not a directory: ${localPath}`);
      return [];
    }
  } catch {
    console.warn(`[Local Cache] Path not found: ${localPath}`);
    return [];
  }

  const entries = await readdir(localPath, { withFileTypes: true });

  // Process entries in parallel for better performance
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(localPath, entry.name);
      const relativePath = path.join(dirPath, entry.name).replace(/\\/g, '/');
      const fileStats = await stat(fullPath);

      const githubFile: GitHubFile = {
        name: entry.name,
        path: relativePath,
        sha: '',
        size: fileStats.size,
        url: '',
        html_url: '',
        git_url: '',
        download_url: entry.isFile() ? `file:///${fullPath.replace(/\\/g, '/')}` : '',
        type: entry.isDirectory() ? 'dir' : 'file'
      };

      return githubFile;
    })
  );

  return files;
}

/**
 * Reads a file from local cache
 * Uses node:fs/promises which Bun optimizes for 2-3x faster file reading
 */
export async function getLocalFileContent(filePath: string): Promise<any> {
  const localPath = githubPathToLocalPath(filePath);

  try {
    const content = await readFile(localPath, 'utf-8');

    // If it's a JSON file, parse it
    if (filePath.endsWith('.json')) {
      return JSON.parse(content);
    }

    return content;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.warn(`[Local Cache] File not found: ${localPath}`);
    } else {
      console.error(`[Local Cache] Error reading file ${localPath}:`, error);
    }
    return null;
  }
}

/**
 * Gets file modification time as a mock commit
 * Uses node:fs/promises for Bun-optimized stat operations
 */
export async function getLocalFileCommit(filePath: string): Promise<GitHubCommit | null> {
  const localPath = githubPathToLocalPath(filePath);

  try {
    const fileStats = await stat(localPath);

    const mockCommit: GitHubCommit = {
      sha: '',
      commit: {
        author: {
          name: 'Local Cache',
          date: fileStats.mtime.toISOString()
        }
      }
    };

    return mockCommit;
  } catch {
    return null;
  }
}

/**
 * Reads a binary file (like PNG) and returns a data URL
 * Uses node:fs/promises which Bun optimizes for faster binary reading
 */
export async function getLocalImageDataUrl(filePath: string): Promise<string | null> {
  const localPath = githubPathToLocalPath(filePath);

  try {
    const buffer = await readFile(localPath);
    const ext = path.extname(filePath).toLowerCase();

    let mimeType = 'application/octet-stream';
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.webp') mimeType = 'image/webp';

    const base64 = buffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error(`[Local Cache] Error reading image ${localPath}:`, error);
    }
    return null;
  }
}

/**
 * Gets the absolute file system path for a local cache file
 */
export async function getLocalFilePath(filePath: string): Promise<string | null> {
  const localPath = githubPathToLocalPath(filePath);

  try {
    await stat(localPath);
    return localPath;
  } catch {
    return null;
  }
}

/**
 * Logs local cache status on startup
 */
export async function logLocalCacheStatus(): Promise<void> {
  if (USE_LOCAL_CACHE) {
    if (await isLocalCacheAvailable()) {
      console.log(`[Local Cache] ✓ Enabled - Using local cache at: ${LOCAL_CACHE_DIR}`);
    } else {
      console.warn(`[Local Cache] ✗ Enabled but directory not found: ${LOCAL_CACHE_DIR}`);
      console.warn(`[Local Cache] Create the directory to use local caching`);
    }
  } else {
    console.log('[Local Cache] Disabled - Using GitHub API');
  }
}
