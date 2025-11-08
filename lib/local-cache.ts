import fs from 'fs';
import path from 'path';
import { GitHubFile, GitHubCommit } from './github';

/**
 * Local cache configuration
 */
const LOCAL_CACHE_DIR = process.env.LOCAL_CACHE_PATH || path.join(process.cwd(), 'data');
const USE_LOCAL_CACHE = process.env.USE_LOCAL_CACHE === 'true';

export { USE_LOCAL_CACHE };

/**
 * Checks if local cache is enabled and available
 */
export function isLocalCacheAvailable(): boolean {
  if (!USE_LOCAL_CACHE) {
    return false;
  }

  try {
    return fs.existsSync(LOCAL_CACHE_DIR);
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
 */
export async function getLocalDirectoryContents(dirPath: string): Promise<GitHubFile[]> {
  const localPath = githubPathToLocalPath(dirPath);

  if (!fs.existsSync(localPath)) {
    console.warn(`[Local Cache] Path not found: ${localPath}`);
    return [];
  }

  const stats = fs.statSync(localPath);
  if (!stats.isDirectory()) {
    console.warn(`[Local Cache] Path is not a directory: ${localPath}`);
    return [];
  }

  const entries = fs.readdirSync(localPath, { withFileTypes: true });

  return entries.map((entry) => {
    const fullPath = path.join(localPath, entry.name);
    const relativePath = path.join(dirPath, entry.name).replace(/\\/g, '/');
    const stats = fs.statSync(fullPath);

    // Create a mock GitHub file object
    const githubFile: GitHubFile = {
      name: entry.name,
      path: relativePath,
      sha: '', // Not applicable for local files
      size: stats.size,
      url: '', // Not applicable
      html_url: '', // Not applicable
      git_url: '', // Not applicable
      download_url: entry.isFile() ? `file:///${fullPath.replace(/\\/g, '/')}` : '',
      type: entry.isDirectory() ? 'dir' : 'file'
    };

    return githubFile;
  });
}

/**
 * Reads a JSON file from local cache
 */
export async function getLocalFileContent(filePath: string): Promise<any> {
  const localPath = githubPathToLocalPath(filePath);

  if (!fs.existsSync(localPath)) {
    console.warn(`[Local Cache] File not found: ${localPath}`);
    return null;
  }

  const stats = fs.statSync(localPath);
  if (!stats.isFile()) {
    console.warn(`[Local Cache] Path is not a file: ${localPath}`);
    return null;
  }

  try {
    const content = fs.readFileSync(localPath, 'utf-8');
    
    // If it's a JSON file, parse it
    if (filePath.endsWith('.json')) {
      return JSON.parse(content);
    }
    
    return content;
  } catch (error) {
    console.error(`[Local Cache] Error reading file ${localPath}:`, error);
    return null;
  }
}

/**
 * Gets file modification time as a mock commit
 * This mimics GitHub's commit API response
 */
export async function getLocalFileCommit(filePath: string): Promise<GitHubCommit | null> {
  const localPath = githubPathToLocalPath(filePath);

  if (!fs.existsSync(localPath)) {
    return null;
  }

  try {
    const stats = fs.statSync(localPath);
    
    // Create a mock commit object using file modification time
    const mockCommit: GitHubCommit = {
      sha: '', // Not applicable for local files
      commit: {
        author: {
          name: 'Local Cache',
          date: stats.mtime.toISOString()
        }
      }
    };

    return mockCommit;
  } catch (error) {
    console.error(`[Local Cache] Error getting file stats for ${localPath}:`, error);
    return null;
  }
}

/**
 * Reads a binary file (like PNG) and returns a data URL
 */
export function getLocalImageDataUrl(filePath: string): string | null {
  const localPath = githubPathToLocalPath(filePath);

  if (!fs.existsSync(localPath)) {
    return null;
  }

  try {
    const buffer = fs.readFileSync(localPath);
    const ext = path.extname(filePath).toLowerCase();
    
    let mimeType = 'application/octet-stream';
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.webp') mimeType = 'image/webp';
    
    const base64 = buffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error(`[Local Cache] Error reading image ${localPath}:`, error);
    return null;
  }
}

/**
 * Gets the absolute file system path for a local cache file
 * Useful for serving files directly via Next.js API routes
 */
export function getLocalFilePath(filePath: string): string | null {
  const localPath = githubPathToLocalPath(filePath);
  
  if (!fs.existsSync(localPath)) {
    return null;
  }
  
  return localPath;
}

/**
 * Logs local cache status on startup
 */
export function logLocalCacheStatus(): void {
  if (USE_LOCAL_CACHE) {
    if (isLocalCacheAvailable()) {
      console.log(`[Local Cache] ✓ Enabled - Using local cache at: ${LOCAL_CACHE_DIR}`);
    } else {
      console.warn(`[Local Cache] ✗ Enabled but directory not found: ${LOCAL_CACHE_DIR}`);
      console.warn(`[Local Cache] Create the directory to use local caching`);
    }
  } else {
    console.log('[Local Cache] Disabled - Using GitHub API');
  }
}
