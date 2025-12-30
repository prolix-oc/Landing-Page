import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Import cache invalidation functions
import { 
  invalidateCachePath, 
  invalidateCacheByPattern,
  invalidateJsonDataCache 
} from '@/lib/github';

interface GitHubPushPayload {
  ref: string;
  commits: Array<{
    id: string;
    message: string;
    timestamp: string;
    added: string[];
    modified: string[];
    removed: string[];
  }>;
  repository: {
    name: string;
    full_name: string;
  };
}

/**
 * Verifies the GitHub webhook signature
 */
function verifyGitHubSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) {
    return false;
  }

  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  
  // Use timingSafeEqual to prevent timing attacks
  try {
    const signatureBuffer = Buffer.from(signature);
    const digestBuffer = Buffer.from(digest);
    
    if (signatureBuffer.length !== digestBuffer.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(signatureBuffer, digestBuffer);
  } catch {
    return false;
  }
}

/**
 * Extracts immediate parent directory from a file path
 */
function getParentDirectory(filePath: string): string | null {
  const parts = filePath.split('/');
  if (parts.length <= 1) {
    return null;
  }
  // Return only the immediate parent directory
  return parts.slice(0, -1).join('/');
}

/**
 * Gets all ancestor directories that need invalidation for a file path
 * This ensures that when a new folder is created, parent listings are also updated
 */
function getAncestorDirectories(filePath: string): string[] {
  const parts = filePath.split('/');
  const ancestors: string[] = [];

  // Build up ancestor paths from root to parent
  // e.g., "Character Cards/Fantasy/NewChar/file.json" produces:
  // - "Character Cards"
  // - "Character Cards/Fantasy"
  // - "Character Cards/Fantasy/NewChar"
  for (let i = 1; i < parts.length; i++) {
    ancestors.push(parts.slice(0, i).join('/'));
  }

  return ancestors;
}

/**
 * Processes the push payload and invalidates affected cache entries
 * For added/removed files: invalidates ALL ancestor directories (new folders may have been created)
 * For modified files: invalidates only the immediate parent directory
 */
function processPushPayload(payload: GitHubPushPayload): {
  invalidated: number;
  paths: string[];
  filesAdded: number;
  filesModified: number;
  filesRemoved: number;
} {
  const addedFiles = new Set<string>();
  const modifiedFiles = new Set<string>();
  const removedFiles = new Set<string>();

  // Collect all affected files from all commits
  payload.commits.forEach(commit => {
    commit.added.forEach(file => addedFiles.add(file));
    commit.modified.forEach(file => modifiedFiles.add(file));
    commit.removed.forEach(file => removedFiles.add(file));
  });

  let invalidatedCount = 0;
  const invalidatedPaths: string[] = [];
  const directoriesToInvalidate = new Set<string>();

  // Process added files - invalidate ALL ancestor directories
  // (A new file in a new folder means parent directory listings changed)
  addedFiles.forEach(filePath => {
    // Invalidate commit cache
    if (invalidateCachePath(filePath, 'commit')) {
      invalidatedCount++;
      invalidatedPaths.push(`commit:${filePath}`);
    }

    // Invalidate JSON data cache
    if (filePath.toLowerCase().endsWith('.json')) {
      if (invalidateJsonDataCache(filePath)) {
        invalidatedCount++;
        invalidatedPaths.push(`jsonData:${filePath}`);
      }
    }

    // Track ALL ancestor directories for added files
    getAncestorDirectories(filePath).forEach(dir => directoriesToInvalidate.add(dir));
  });

  // Process removed files - invalidate ALL ancestor directories
  removedFiles.forEach(filePath => {
    // Invalidate commit cache
    if (invalidateCachePath(filePath, 'commit')) {
      invalidatedCount++;
      invalidatedPaths.push(`commit:${filePath}`);
    }

    // Invalidate JSON data cache
    if (filePath.toLowerCase().endsWith('.json')) {
      if (invalidateJsonDataCache(filePath)) {
        invalidatedCount++;
        invalidatedPaths.push(`jsonData:${filePath}`);
      }
    }

    // Track ALL ancestor directories for removed files
    getAncestorDirectories(filePath).forEach(dir => directoriesToInvalidate.add(dir));
  });

  // Process modified files - only immediate parent needs invalidation
  modifiedFiles.forEach(filePath => {
    // Skip if already processed as added/removed
    if (addedFiles.has(filePath) || removedFiles.has(filePath)) {
      return;
    }

    // Invalidate commit cache
    if (invalidateCachePath(filePath, 'commit')) {
      invalidatedCount++;
      invalidatedPaths.push(`commit:${filePath}`);
    }

    // Invalidate JSON data cache
    if (filePath.toLowerCase().endsWith('.json')) {
      if (invalidateJsonDataCache(filePath)) {
        invalidatedCount++;
        invalidatedPaths.push(`jsonData:${filePath}`);
      }
    }

    // Only immediate parent for modified files (directory structure unchanged)
    const parentDir = getParentDirectory(filePath);
    if (parentDir) {
      directoriesToInvalidate.add(parentDir);
    }
  });

  // Invalidate all collected directories
  directoriesToInvalidate.forEach(dirPath => {
    if (invalidateCachePath(dirPath)) {
      invalidatedCount++;
      invalidatedPaths.push(`github:${dirPath}`);
    }
  });

  return {
    invalidated: invalidatedCount,
    paths: invalidatedPaths,
    filesAdded: addedFiles.size,
    filesModified: modifiedFiles.size,
    filesRemoved: removedFiles.size
  };
}

/**
 * GitHub webhook endpoint
 * Receives push notifications and invalidates cache for affected paths
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret is configured
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[Webhook] GITHUB_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }
    
    // Get the raw body for signature verification
    const rawBody = await request.text();
    
    // Verify the signature
    const signature = request.headers.get('x-hub-signature-256');
    if (!verifyGitHubSignature(rawBody, signature, webhookSecret)) {
      console.error('[Webhook] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // Parse the payload
    let payload: GitHubPushPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      console.error('[Webhook] Invalid JSON payload');
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }
    
    // Get the event type
    const eventType = request.headers.get('x-github-event');
    
    console.log(`[Webhook] Received ${eventType} event for ${payload.repository?.full_name}`);
    
    // Only process push events
    if (eventType !== 'push') {
      console.log(`[Webhook] Ignoring ${eventType} event`);
      return NextResponse.json({
        message: `Event type ${eventType} ignored`,
        processed: false
      });
    }
    
    // Process the push payload
    const result = processPushPayload(payload);
    
    console.log(
      `[Webhook] Processed push: +${result.filesAdded} -${result.filesRemoved} ~${result.filesModified} files`
    );
    console.log(
      `[Webhook] Invalidated ${result.invalidated} cache entries:`,
      result.paths.slice(0, 15) // Log first 15 paths
    );
    
    return NextResponse.json({
      message: 'Webhook processed successfully',
      processed: true,
      invalidated: result.invalidated,
      paths: result.paths,
      filesAdded: result.filesAdded,
      filesModified: result.filesModified,
      filesRemoved: result.filesRemoved,
      commits: payload.commits.length,
      ref: payload.ref
    });
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  const isConfigured = !!process.env.GITHUB_WEBHOOK_SECRET;
  
  return NextResponse.json({
    status: 'ok',
    configured: isConfigured,
    message: isConfigured 
      ? 'Webhook endpoint is ready to receive events'
      : 'Webhook secret not configured'
  });
}
