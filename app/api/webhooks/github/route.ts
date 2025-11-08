import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Import cache invalidation functions
import { invalidateCachePath, invalidateCacheByPattern } from '@/lib/github';

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
 * Extracts all unique directory paths from a list of file paths
 */
function extractDirectoryPaths(filePaths: string[]): Set<string> {
  const directories = new Set<string>();
  
  filePaths.forEach(filePath => {
    const parts = filePath.split('/');
    
    // Add all parent directories
    for (let i = 1; i < parts.length; i++) {
      const dirPath = parts.slice(0, i).join('/');
      if (dirPath) {
        directories.add(dirPath);
      }
    }
  });
  
  return directories;
}

/**
 * Processes the push payload and invalidates affected cache entries
 */
function processPushPayload(payload: GitHubPushPayload): {
  invalidated: number;
  paths: string[];
} {
  const affectedFiles = new Set<string>();
  
  // Collect all affected files from all commits
  payload.commits.forEach(commit => {
    commit.added.forEach(file => affectedFiles.add(file));
    commit.modified.forEach(file => affectedFiles.add(file));
    commit.removed.forEach(file => affectedFiles.add(file));
  });
  
  // Extract unique directory paths that need invalidation
  const affectedDirectories = extractDirectoryPaths(Array.from(affectedFiles));
  
  // Also invalidate cache for individual files (commits)
  const allAffectedPaths = new Set([
    ...affectedDirectories,
    ...affectedFiles
  ]);
  
  let invalidatedCount = 0;
  const invalidatedPaths: string[] = [];
  
  // Invalidate cache for each affected path
  allAffectedPaths.forEach(path => {
    // Invalidate directory contents cache
    const dirInvalidated = invalidateCachePath(path);
    
    // Invalidate commit cache for the path
    const commitInvalidated = invalidateCachePath(path, 'commit');
    
    if (dirInvalidated || commitInvalidated) {
      invalidatedCount++;
      invalidatedPaths.push(path);
    }
  });
  
  // Special handling for top-level directories
  // If files in Character Cards/Category/Character changed, also invalidate the category
  affectedFiles.forEach(filePath => {
    if (filePath.startsWith('Character Cards/')) {
      const parts = filePath.split('/');
      if (parts.length >= 2) {
        const categoryPath = `Character Cards/${parts[1]}`;
        if (invalidateCachePath(categoryPath)) {
          invalidatedCount++;
          invalidatedPaths.push(categoryPath);
        }
      }
    } else if (filePath.startsWith('World Books/')) {
      const parts = filePath.split('/');
      if (parts.length >= 2) {
        const categoryPath = `World Books/${parts[1]}`;
        if (invalidateCachePath(categoryPath)) {
          invalidatedCount++;
          invalidatedPaths.push(categoryPath);
        }
      }
    } else if (filePath.startsWith('Chat Completion/')) {
      if (invalidateCachePath('Chat Completion')) {
        invalidatedCount++;
        invalidatedPaths.push('Chat Completion');
      }
    }
  });
  
  return {
    invalidated: invalidatedCount,
    paths: invalidatedPaths
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
      `[Webhook] Invalidated ${result.invalidated} cache entries for ${result.paths.length} paths:`,
      result.paths.slice(0, 10) // Log first 10 paths
    );
    
    return NextResponse.json({
      message: 'Webhook processed successfully',
      processed: true,
      invalidated: result.invalidated,
      paths: result.paths,
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
