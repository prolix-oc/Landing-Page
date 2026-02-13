import { NextResponse } from 'next/server';
import { 
  getWarmupStatus, 
  getPeriodicRefreshStatus, 
  getRateLimitStatus,
  getCacheStats,
  getGraphQLRateLimitStatus,
  clearCache
} from '@/lib/github';

/**
 * Cache Status API Endpoint
 * 
 * GET /api/cache/status - Returns current cache statistics and rate limits
 * POST /api/cache/clear - Clears all caches (requires authorization)
 * 
 * This endpoint helps monitor cache health and GitHub API quota usage.
 */

export async function GET() {
  try {
    const [
      warmupStatus,
      refreshStatus,
      restRateLimit,
      cacheStats,
      graphqlStatus
    ] = await Promise.all([
      Promise.resolve(getWarmupStatus()),
      Promise.resolve(getPeriodicRefreshStatus()),
      Promise.resolve(getRateLimitStatus()),
      getCacheStats(),
      getGraphQLRateLimitStatus()
    ]);

    return NextResponse.json({
      success: true,
      data: {
        warmup: warmupStatus,
        periodicRefresh: refreshStatus,
        rateLimits: {
          rest: restRateLimit,
          graphql: graphqlStatus
        },
        cache: {
          memory: {
            entries: cacheStats.memoryEntries
          },
          persistent: {
            entries: cacheStats.persistentEntries,
            sizeMB: cacheStats.persistentSizeMB
          }
        },
        features: {
          lazyLoading: process.env.USE_LAZY_LOADING !== 'false',
          persistentCache: true,
          graphql: graphqlStatus.enabled
        }
      }
    }, {
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error fetching cache status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cache status' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Simple authorization check
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.GITHUB_TOKEN}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { action } = await request.json();

    if (action === 'clear') {
      clearCache();
      return NextResponse.json({
        success: true,
        message: 'All caches cleared successfully'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing cache action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
