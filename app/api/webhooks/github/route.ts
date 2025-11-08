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
 * Processes the push payload and invalidates affected cache entries
 * Only invalidates the immediate parent directory and file-specific caches
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
  
  const allAffectedFiles = new Set([
    ...addedFiles,
    ...modifiedFiles,
    ...removedFiles
  ]);
  
  let invalidatedCount = 0;
  const invalidatedPaths: string[] = [];
  const parentDirectories = new Set<string>();
  
  // For each affected file, invalidate its specific caches
  allAffectedFiles.forEach(filePath => {
    // 1. Invalidate the file's commit cache
    if (invalidateCachePath(filePath, 'commit')) {
      invalidatedCount++;
      invalidatedPaths.push(`commit:${filePath}`);
    }
    
    // 2. Invalidate JSON data cache if it's a JSON file
    if (filePath.toLowerCase().endsWith('.json')) {
      if (invalidateJsonDataCache(filePath)) {
        invalidatedCount++;
        invalidatedPaths.push(`jsonData:${filePath}`);
      }
    }
    
    // 3. Track the immediate parent directory
    const parentDir = getParentDirectory(filePath);
    if (parentDir) {
      parentDirectories.add(parentDir);
    }
  });
  
  // Only invalidate parent directories if files were added or removed
  // (Modified files don't change directory contents, just file SHAs)
  const shouldInvalidateDirectories = addedFiles.size > 0 || removedFiles.size > 0;
  
  if (shouldInvalidateDirectories) {
    parentDirectories.forEach(dirPath => {
      if (invalidateCachePath(dirPath)) {
        invalidatedCount++;
        invalidatedPaths.push(`github:${dirPath}`);
      }
    });
  } else {
    // For modified files only, we still need to invalidate parent directories
    // because the directory listing contains file SHAs that have changed
    parentDirectories.forEach(dirPath => {
      if (invalidateCachePath(dirPath)) {
        invalidatedCount++;
        invalidatedPaths.push(`github:${dirPath}`);
      }
    });
  }
  
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
