import sharp from 'sharp';
import { randomBytes } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export interface ImageOptimizeOptions {
  width?: number;
  height?: number;
  quality?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

const DEFAULT_QUALITY = 80;
const MAX_WIDTH = 2000;
const MAX_HEIGHT = 2000;
const UPLOADS_DIR = 'public/uploads';

// In-memory cache for optimized images
const imageCache = new Map<string, { buffer: Buffer; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour
const MAX_CACHE_SIZE = 100; // Max cached images

function getCacheKey(identifier: string, options: ImageOptimizeOptions): string {
  return `${identifier}:${options.width || 'auto'}x${options.height || 'auto'}:${options.quality || DEFAULT_QUALITY}:${options.fit || 'cover'}`;
}

function cleanCache(): void {
  const now = Date.now();
  const entries = Array.from(imageCache.entries());

  // Remove expired entries
  for (const [key, value] of entries) {
    if (now - value.timestamp > CACHE_TTL) {
      imageCache.delete(key);
    }
  }

  // If still over limit, remove oldest entries
  if (imageCache.size > MAX_CACHE_SIZE) {
    const sortedEntries = entries
      .filter(([key]) => imageCache.has(key))
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toRemove = sortedEntries.slice(0, imageCache.size - MAX_CACHE_SIZE);
    for (const [key] of toRemove) {
      imageCache.delete(key);
    }
  }
}

/**
 * Generate a unique filename for uploaded images
 */
export function generateImageFilename(originalName?: string): string {
  const id = randomBytes(8).toString('hex');
  const timestamp = Date.now().toString(36);
  return `${timestamp}-${id}.webp`;
}

/**
 * Process and save an uploaded image
 */
export async function processAndSaveImage(
  inputBuffer: Buffer,
  options: ImageOptimizeOptions = {}
): Promise<{ filename: string; path: string; url: string }> {
  const filename = generateImageFilename();
  const uploadsPath = path.join(process.cwd(), UPLOADS_DIR);

  // Ensure uploads directory exists
  await mkdir(uploadsPath, { recursive: true });

  const filePath = path.join(uploadsPath, filename);

  // Validate and clamp dimensions
  const width = options.width ? Math.min(options.width, MAX_WIDTH) : undefined;
  const height = options.height ? Math.min(options.height, MAX_HEIGHT) : undefined;
  const quality = Math.min(Math.max(options.quality || DEFAULT_QUALITY, 1), 100);
  const fit = options.fit || 'cover';

  // Process with sharp
  let pipeline = sharp(inputBuffer);

  if (width || height) {
    pipeline = pipeline.resize(width, height, {
      fit,
      position: 'top',
      withoutEnlargement: true,
    });
  }

  const outputBuffer = await pipeline.webp({ quality }).toBuffer();

  // Write to disk
  await writeFile(filePath, outputBuffer);

  return {
    filename,
    path: filePath,
    url: `/uploads/${filename}`,
  };
}

/**
 * Optimize an image from a URL (for proxying external images)
 */
export async function optimizeImageFromUrl(
  sourceUrl: string,
  options: ImageOptimizeOptions = {}
): Promise<Buffer> {
  const cacheKey = getCacheKey(sourceUrl, options);

  // Check cache first
  const cached = imageCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.buffer;
  }

  // Fetch the source image
  const response = await fetch(sourceUrl, {
    headers: {
      'User-Agent': 'LucidCards-ImageOptimizer/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType?.startsWith('image/')) {
    throw new Error('URL does not point to an image');
  }

  const arrayBuffer = await response.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  const outputBuffer = await optimizeBuffer(inputBuffer, options);

  // Cache the result
  cleanCache();
  imageCache.set(cacheKey, {
    buffer: outputBuffer,
    timestamp: Date.now(),
  });

  return outputBuffer;
}

/**
 * Optimize an image buffer directly
 */
export async function optimizeBuffer(
  inputBuffer: Buffer,
  options: ImageOptimizeOptions = {}
): Promise<Buffer> {
  // Validate and clamp dimensions
  const width = options.width ? Math.min(options.width, MAX_WIDTH) : undefined;
  const height = options.height ? Math.min(options.height, MAX_HEIGHT) : undefined;
  const quality = Math.min(Math.max(options.quality || DEFAULT_QUALITY, 1), 100);
  const fit = options.fit || 'cover';

  // Process with sharp
  let pipeline = sharp(inputBuffer);

  if (width || height) {
    pipeline = pipeline.resize(width, height, {
      fit,
      position: 'top',
      withoutEnlargement: true,
    });
  }

  return pipeline.webp({ quality }).toBuffer();
}

export function parseImageParams(searchParams: URLSearchParams): ImageOptimizeOptions {
  const width = searchParams.get('w');
  const height = searchParams.get('h');
  const quality = searchParams.get('q');
  const fit = searchParams.get('fit');

  return {
    width: width ? parseInt(width, 10) : undefined,
    height: height ? parseInt(height, 10) : undefined,
    quality: quality ? parseInt(quality, 10) : undefined,
    fit: fit as ImageOptimizeOptions['fit'] || undefined,
  };
}

// CORS headers for external access
export const imageCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
};
