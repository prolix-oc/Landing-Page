# GitHub API Caching Strategy

## Overview

This application implements a sophisticated server-side caching strategy for GitHub API requests that provides instant responses to users while keeping data fresh in the background.

## Key Features

### 1. **Cache Warm-up on First Request**
- On application startup, the first API request triggers an automatic cache warm-up job
- All required GitHub content is pre-fetched and cached immediately
- Ensures users always have fresh, not stale content from the start
- Warm-up runs asynchronously without blocking API responses
- Only runs once per application lifecycle
- Automatically starts periodic refresh after warmup completes

### 2. **Periodic Cache Refresh with Adaptive Rate Limiting**
- After initial warmup, cache is automatically refreshed at dynamic intervals (45-180 seconds)
- **Base interval**: 45 seconds under healthy rate limit conditions
- **Adaptive behavior**: Automatically adjusts refresh rate based on GitHub API quota
- Ensures data never becomes stale, even during low-traffic periods
- Proactive refresh reduces impact on GitHub API during traffic spikes
- Refresh runs in background without blocking user requests
- All cached entries (both content and commit data) are updated

### 3. **Stale-While-Revalidate Pattern**
- Users always receive cached data immediately (no loading spinners for cached content)
- Reactive background revalidation happens silently when cache becomes stale
- Fresh data is ready for the next request
- Works in conjunction with periodic refresh for maximum freshness

### 4. **Server-Side Only Caching**
- All caching happens on the server in memory
- No localStorage or client-side caching
- Consistent data across all users
- No browser storage limitations

### 5. **Short Cache Duration with Adaptive Intervals**
- **Cache Duration**: 30 seconds
- **Base Periodic Refresh Interval**: 45 seconds (healthy rate limits)
- **Adaptive Range**: 45-180 seconds (based on API quota remaining)
- **Rationale**: With GitHub token authentication and adaptive refresh, we ensure optimal freshness while respecting rate limits
- Cache is refreshed proactively based on current rate limit status
- Reactive refresh occurs if cache becomes stale between periodic updates
- Maximum staleness: 45-180 seconds depending on rate limit conditions

### 6. **Multi-Layer Caching**

#### Application Cache (`lib/github.ts`)
- In-memory Map-based cache
- Stores both GitHub directory contents and commit data
- Prevents duplicate background refresh requests
- 30-second cache duration

#### HTTP Cache Headers
All API routes return:
```
Cache-Control: public, s-maxage=30, stale-while-revalidate=60
```

- `public`: Response can be cached by any cache
- `s-maxage=30`: Shared caches (CDN/server) consider fresh for 30 seconds
- `stale-while-revalidate=60`: Serve stale content for up to 60 more seconds while revalidating

### 7. **Rate Limit-Aware Adaptive Caching**

The system monitors GitHub API rate limits from response headers and dynamically adjusts caching behavior:

#### Rate Limit Headers Tracked
- `x-ratelimit-limit`: Total rate limit quota
- `x-ratelimit-remaining`: Remaining requests in current period
- `x-ratelimit-reset`: Unix timestamp when quota resets
- `x-ratelimit-resource`: Resource type (e.g., 'core')
- `x-ratelimit-used`: Number of requests used

#### Adaptive Thresholds
The system uses a four-tier threshold system based on remaining quota percentage:

| Status | Threshold | Interval Multiplier | Effective Interval |
|--------|-----------|-------------------|-------------------|
| **HEALTHY** | >50% remaining | 1.0× | 45 seconds |
| **MEDIUM** | 25-50% remaining | 1.5× | ~68 seconds |
| **LOW** | 10-25% remaining | 2.5× | ~113 seconds |
| **CRITICAL** | <10% remaining | 4.0× | 180 seconds |

#### Key Benefits
- **Automatic throttling**: Slows down when approaching rate limits
- **No manual intervention**: System self-regulates based on quota
- **Rate limit preservation**: Prevents exhausting API quota
- **Transparent operation**: Logging shows current status and adjustments
- **Dynamic recovery**: Speeds back up as quota refreshes

## How It Works

### First Request (Cold Cache)
```
User Request → API Route → GitHub API → Cache + Return Data
                                              ↓
                                    Start Periodic Refresh Timer
```

### Subsequent Requests (Fresh Cache, < 30s)
```
User Request → API Route → Return Cached Data (instant)

Periodic Refresh (adaptive 45-180s): 
  → Check rate limit status
  → Adjust interval if needed
  → Background fetch → Update all cache entries
  → Update rate limit info from response headers
```

### Stale Cache (30s - 45s, between reactive and periodic refresh)
```
User Request → API Route → Return Cached Data (instant)
                         ↓
                    Background: Fetch from GitHub → Update Cache

Periodic Refresh (continues every 45s): Background fetch → Update all cache entries
```

### Normal Operation (after warmup)
```
Every 45-180 seconds (adaptive): Automatic background refresh of all cached entries
  → Extract rate limit info from API responses
  → Calculate adaptive interval based on remaining quota
  → Restart refresh timer if interval changed significantly
User requests always receive instant cached responses
Maximum data age: 45-180 seconds (depending on rate limit status)
```

## Implementation Details

### Periodic Refresh System with Adaptive Rate Limiting
```typescript
const BASE_PERIODIC_REFRESH_INTERVAL = 45 * 1000; // 45 seconds base
let currentPeriodicRefreshInterval = BASE_PERIODIC_REFRESH_INTERVAL;

// Rate limit thresholds
const RATE_LIMIT_THRESHOLDS = {
  CRITICAL: 0.1,  // 10% remaining
  LOW: 0.25,      // 25% remaining
  MEDIUM: 0.5,    // 50% remaining
  HEALTHY: 1.0    // Above 50%
};

// Interval multipliers
const INTERVAL_MULTIPLIERS = {
  CRITICAL: 4.0,  // 180 seconds
  LOW: 2.5,       // 112.5 seconds
  MEDIUM: 1.5,    // 67.5 seconds
  HEALTHY: 1.0    // 45 seconds
};
```

The system:
1. Extracts rate limit info from every GitHub API response
2. Calculates remaining quota percentage
3. Applies appropriate multiplier based on threshold
4. Adjusts refresh interval dynamically
5. Restarts timer if interval changed significantly (>5 seconds)
6. Logs interval adjustments for monitoring

### Background Refresh Prevention
```typescript
const refreshingKeys = new Set<string>();
```
Prevents multiple simultaneous background refreshes for the same resource.

### Cache Key Structure
- GitHub contents: `github:{path}`
- Commit data: `commit:{filePath}`

### Error Handling
- Background refresh failures are logged but don't affect user experience
- Users continue to see last successful cached data
- Failed refreshes are removed from tracking to allow retry

## Benefits

### For Users
- ✅ No loading spinners for cached content
- ✅ Instant page loads
- ✅ Consistently fresh data (maximum 45 seconds old)
- ✅ Smooth, uninterrupted browsing experience
- ✅ No stale data during low-traffic periods

### For GitHub API
- ✅ Predictable API usage (periodic refresh every 45s)
- ✅ Efficient use of rate limits with proactive refresh
- ✅ No API spikes during traffic bursts
- ✅ Token authentication allows frequent updates

### For Developers
- ✅ Simple, maintainable caching logic
- ✅ Server-side control over cache behavior
- ✅ Easy to adjust refresh intervals
- ✅ No client-side cache management complexity
- ✅ Automatic background maintenance

## Configuration

### Adjusting Cache Duration and Refresh Interval

In `lib/github.ts`:
```typescript
const CACHE_DURATION = 30 * 1000; // 30 seconds
const PERIODIC_REFRESH_INTERVAL = 45 * 1000; // 45 seconds
```

In API routes:
```typescript
headers: {
  'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
}
```

### Recommendations
- Keep `CACHE_DURATION` slightly shorter than `PERIODIC_REFRESH_INTERVAL`
- Set periodic refresh between 30-60 seconds for optimal freshness
- Keep `s-maxage` in sync with `CACHE_DURATION`
- Set `stale-while-revalidate` to 1-2x the cache duration
- With GitHub token: Current settings (30s cache, 45s refresh) are optimal
- Without token: Consider 2-5 minute intervals to conserve rate limits

## Monitoring

### Cache Performance
Monitor these in production:
- Periodic refresh execution and timing
- **Rate limit status and remaining quota**
- **Adaptive interval adjustments**
- Background refresh success rate
- Cache hit ratio
- GitHub API rate limit usage
- Response times

### Debug Logging
The system logs periodic refresh operations with rate limit information:
```
[Periodic Refresh] Rate Limit Status: 4850/5000 remaining (97%), resets at 2:30:00 PM
[Periodic Refresh] Starting periodic cache refresh (interval: 45000ms)...
[Periodic Refresh] Completed in {duration}ms. Refreshed {count} entries.
```

Rate limit adjustments are logged when intervals change:
```
[Rate Limit] Adjusting refresh interval: 45000ms → 112500ms (LOW: 1200/5000 remaining, 24%)
```

Background refresh failures are also logged:
```
Background refresh failed for {path}: {error}
Background commit refresh failed for {filePath}: {error}
[Periodic Refresh] Failed to refresh {path}: {error}
```

### Accessing Rate Limit Status Programmatically
```typescript
import { getRateLimitStatus } from '@/lib/github';

const rateLimitInfo = getRateLimitStatus();
if (rateLimitInfo) {
  console.log(`Remaining: ${rateLimitInfo.remaining}/${rateLimitInfo.limit}`);
  console.log(`Resets at: ${new Date(rateLimitInfo.reset * 1000)}`);
}
```

## Future Enhancements

### Potential Improvements
1. **ETag Support**: Use GitHub's ETags for conditional requests (304 Not Modified)
2. **Cache Metrics Dashboard**: Track hit/miss rates and performance in real-time
3. **Selective Revalidation**: Prioritize frequently accessed content
4. **Redis/External Cache**: Scale across multiple server instances
5. **Content-based Intervals**: Adjust based on actual change frequency analysis
6. **Rate Limit Forecasting**: Predict quota exhaustion and preemptively throttle

### Not Recommended
- ❌ Client-side localStorage caching (inconsistent, limited storage)
- ❌ Very long cache durations (data staleness)
- ❌ Aggressive polling (wastes API rate limits)

## Comparison to Previous Strategy

| Aspect | Old Strategy | Current Strategy |
|--------|-------------|-----------------|
| Cache Duration | 5 minutes | 30 seconds |
| Refresh Method | Reactive only | Adaptive Periodic (45-180s) + Reactive ✓ |
| User Experience | Loading spinner on stale | Instant, no spinner ✓ |
| Data Freshness | Up to 5 min old | Max 45-180 seconds old ✓ |
| Cache Location | Server only | Server only ✓ |
| Background Updates | On-demand | Automatic adaptive ✓ |
| API Consistency | Variable (traffic-dependent) | Adaptive (quota-aware) ✓ |
| Low-Traffic Handling | Cache gets stale | Always fresh ✓ |
| Rate Limit Management | None | Automatic throttling ✓ |

## Testing the Implementation

### Verify Caching Works
1. Load a page (e.g., character cards)
2. Check Network tab - initial request to API
3. Reload page within 30 seconds - should be instant (cached)
4. Check server logs for periodic refresh every 45 seconds
5. Verify background refresh messages in console

### Verify Fresh Data
1. Make a change in GitHub repository
2. Wait up to 45 seconds (next periodic refresh cycle)
3. Reload page - should see updated data
4. Maximum delay: 45 seconds (periodic refresh interval)
5. During high traffic, reactive refresh may update sooner

### Verify Periodic Refresh and Adaptive Behavior
1. Start the application and trigger warmup
2. Monitor server logs for "[Periodic Refresh]" messages
3. Verify refresh occurs at base 45-second interval under healthy conditions
4. Check that all cache entries are being updated
5. Observe rate limit status logged with each refresh
6. Watch for "[Rate Limit]" adjustment messages when quota decreases

### Verify Adaptive Rate Limiting
1. Monitor logs for rate limit status during periodic refresh
2. Check that interval adjusts when remaining quota drops below thresholds
3. Verify interval increases occur (e.g., 45s → 68s → 113s → 180s)
4. Confirm interval decreases when quota refreshes
5. Validate that refresh timer restarts with new intervals

## Conclusion

This caching strategy provides optimal performance across all dimensions:
- **User Experience**: Instant loads with no visible loading states
- **Data Freshness**: Content never more than 45-180 seconds old (adaptive)
- **Reliability**: Proactive refresh prevents stale data during low-traffic periods
- **Efficiency**: Rate limit-aware adaptive refresh prevents quota exhaustion
- **Scalability**: Handles traffic spikes without API rate limit issues
- **Self-Regulation**: Automatic throttling when approaching rate limits
- **Transparency**: Comprehensive logging of rate limits and interval adjustments

The implementation is production-ready and provides the freshest possible data while intelligently managing GitHub API rate limits through adaptive interval adjustment.
