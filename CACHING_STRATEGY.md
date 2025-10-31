# GitHub API Caching Strategy

## Overview

This application implements a sophisticated server-side caching strategy for GitHub API requests that provides instant responses to users while keeping data fresh in the background.

## Key Features

### 1. **Stale-While-Revalidate Pattern**
- Users always receive cached data immediately (no loading spinners for cached content)
- Background revalidation happens silently when cache becomes stale
- Fresh data is ready for the next request

### 2. **Server-Side Only Caching**
- All caching happens on the server in memory
- No localStorage or client-side caching
- Consistent data across all users
- No browser storage limitations

### 3. **Short Cache Duration**
- **Cache Duration**: 30 seconds (reduced from 5 minutes)
- **Rationale**: With GitHub token authentication, we can afford more frequent updates
- Users see fresher data without performance impact

### 4. **Multi-Layer Caching**

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

## How It Works

### First Request (Cold Cache)
```
User Request → API Route → GitHub API → Cache + Return Data
```

### Subsequent Requests (Fresh Cache, < 30s)
```
User Request → API Route → Return Cached Data (instant)
```

### Stale Cache (30s - 90s)
```
User Request → API Route → Return Cached Data (instant)
                         ↓
                    Background: Fetch from GitHub → Update Cache
```

### After Stale Period (> 90s)
```
User Request → API Route → GitHub API → Cache + Return Data
```

## Implementation Details

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
- ✅ Fresh data (30-second updates)
- ✅ Smooth, uninterrupted browsing experience

### For GitHub API
- ✅ Reduced API calls (background refresh only when needed)
- ✅ Efficient use of rate limits
- ✅ Token authentication allows shorter cache times

### For Developers
- ✅ Simple, maintainable caching logic
- ✅ Server-side control over cache behavior
- ✅ Easy to adjust cache durations
- ✅ No client-side cache management complexity

## Configuration

### Adjusting Cache Duration

In `lib/github.ts`:
```typescript
const CACHE_DURATION = 30 * 1000; // 30 seconds
```

In API routes:
```typescript
headers: {
  'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
}
```

### Recommendations
- Keep `CACHE_DURATION` and `s-maxage` in sync
- Set `stale-while-revalidate` to 1-2x the cache duration
- With GitHub token: 30-60 seconds is optimal
- Without Consider 2-5 minutes to conserve rate limits

## Monitoring

### Cache Performance
Monitor these in production:
- Background refresh success rate
- Cache hit ratio
- GitHub API rate limit usage
- Response times

### Debug Logging
Background refresh failures are logged:
```
Background refresh failed for {path}: {error}
Background commit refresh failed for {filePath}: {error}
```

## Future Enhancements

### Potential Improvements
1. **ETag Support**: Use GitHub's ETags for conditional requests
2. **Cache Warming**: Pre-populate cache on server startup
3. **Cache Metrics**: Track hit/miss rates and performance
4. **Selective Revalidation**: Prioritize frequently accessed content
5. **Redis/External Cache**: Scale across multiple server instances

### Not Recommended
- ❌ Client-side localStorage caching (inconsistent, limited storage)
- ❌ Very long cache durations (data staleness)
- ❌ Aggressive polling (wastes API rate limits)

## Comparison to Previous Strategy

| Aspect | Old Strategy | New Strategy |
|--------|-------------|--------------|
| Cache Duration | 5 minutes | 30 seconds |
| User Experience | Loading spinner on stale | Instant, no spinner |
| Data Freshness | Up to 5 min old | Up to 30 sec old |
| Cache Location | Server only | Server only ✓ |
| Background Updates | No | Yes ✓ |
| API Efficiency | Good | Better ✓ |

## Testing the Implementation

### Verify Caching Works
1. Load a page (e.g., character cards)
2. Check Network tab - initial request to API
3. Reload page within 30 seconds - should be instant (cached)
4. Wait 30-90 seconds, reload - still instant but refreshing in background
5. Check server logs for background refresh messages

### Verify Fresh Data
1. Make a change in GitHub repository
2. Wait up to 30 seconds
3. Reload page - should see updated data
4. Maximum delay: 90 seconds (30s cache + 60s stale-while-revalidate)

## Conclusion

This caching strategy provides the best of both worlds:
- **User Experience**: Instant loads with no visible loading states
- **Data Freshness**: Content updates every 30 seconds
- **Efficiency**: Minimal GitHub API usage with smart background revalidation

The implementation is production-ready and scalable for the current use case.
