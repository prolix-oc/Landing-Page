/**
 * Extension Versions Management
 *
 * Manages semantic versioning for extensions with:
 * - In-memory cache for fast reads
 * - File-based persistence for server restarts
 * - Atomic updates for data consistency
 */

import { promises as fs } from 'fs';
import path from 'path';

interface ExtensionVersion {
  version: string;
  updatedAt: string;
}

interface VersionData {
  [extensionName: string]: ExtensionVersion;
}

// In-memory cache
const versionCache = new Map<string, string>();
let cacheLoaded = false;

// Default data file path (can be overridden via env)
const DATA_FILE_PATH = process.env.EXTENSION_VERSIONS_PATH ||
  path.join(process.cwd(), 'data', 'extension-versions.json');

/**
 * Ensures the data directory exists
 */
async function ensureDataDirectory(): Promise<void> {
  const dir = path.dirname(DATA_FILE_PATH);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * Loads versions from file into memory cache
 * Called automatically on first access
 */
export async function loadVersions(): Promise<void> {
  if (cacheLoaded) return;

  try {
    await ensureDataDirectory();
    const data = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    const parsed: VersionData = JSON.parse(data);

    // Populate in-memory cache
    versionCache.clear();
    for (const [extension, info] of Object.entries(parsed)) {
      versionCache.set(extension.toLowerCase(), info.version);
    }

    console.log(`[Extension Versions] Loaded ${versionCache.size} versions from ${DATA_FILE_PATH}`);
  } catch (error) {
    // File doesn't exist yet, start with empty cache
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log('[Extension Versions] No existing data file, starting with empty cache');
    } else {
      console.error('[Extension Versions] Error loading versions:', error);
    }
  }

  cacheLoaded = true;
}

/**
 * Saves current in-memory cache to file
 */
async function saveVersions(): Promise<void> {
  await ensureDataDirectory();

  const data: VersionData = {};
  for (const [extension, version] of versionCache.entries()) {
    data[extension] = {
      version,
      updatedAt: new Date().toISOString(),
    };
  }

  // Write atomically using temp file then rename
  const tempPath = `${DATA_FILE_PATH}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  await fs.rename(tempPath, DATA_FILE_PATH);

  console.log(`[Extension Versions] Saved ${versionCache.size} versions to ${DATA_FILE_PATH}`);
}

/**
 * Gets the version for an extension
 * Returns null if not found
 */
export async function getExtensionVersion(extensionName: string): Promise<string | null> {
  await loadVersions();

  const normalizedName = extensionName.toLowerCase().trim();
  return versionCache.get(normalizedName) || null;
}

/**
 * Sets the version for an extension
 * Updates both in-memory cache and file
 */
export async function setExtensionVersion(
  extensionName: string,
  version: string
): Promise<void> {
  await loadVersions();

  const normalizedName = extensionName.toLowerCase().trim();
  const normalizedVersion = version.trim();

  // Basic semantic version validation (x.y.z or x.y.z-prerelease)
  const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*))?(?:\+([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*))?$/;

  if (!semverRegex.test(normalizedVersion)) {
    throw new Error(`Invalid semantic version: ${version}. Expected format: x.y.z (e.g., 1.2.3 or 1.2.3-beta.1)`);
  }

  // Update in-memory cache
  versionCache.set(normalizedName, normalizedVersion);

  // Persist to file
  await saveVersions();

  console.log(`[Extension Versions] Updated ${extensionName} to version ${version}`);
}

/**
 * Gets all extension versions
 */
export async function getAllVersions(): Promise<Record<string, string>> {
  await loadVersions();

  const result: Record<string, string> = {};
  for (const [extension, version] of versionCache.entries()) {
    result[extension] = version;
  }
  return result;
}

/**
 * Clears the in-memory cache (useful for testing)
 */
export function clearVersionCache(): void {
  versionCache.clear();
  cacheLoaded = false;
}
