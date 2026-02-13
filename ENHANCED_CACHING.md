# Enhanced Caching Strategy

This document describes the enhanced caching system implemented to reduce GitHub API quota usage and improve application startup times.

## Overview

The enhanced caching system addresses the issue of burning through GitHub API quota (5000 requests/hour) during application restarts by implementing three key strategies:

1. **Lazy Loading** - Only fetch data when needed
2. **Persistent Cache** - Cache survives application restarts
3. **GitHub GraphQL API** - More efficient bulk data fetching

## Cache Hierarchy

Data is fetched in the following priority order:

```
1. In-Memory Cache (fastest, 30s TTL)
   ↓ (miss)
2. Persistent File Cache (survives restarts, 1h TTL)
   ↓ (miss)
3. Local File Cache (optional, if USE_LOCAL_CACHE=true)
   ↓ (miss)
4. GitHub API (GraphQL or REST)
```

## Features

### 1. Lazy Loading (Enabled by default)

**Problem**: The original implementation fetched ALL content on startup (Character Cards, World Books, commits, JSON files, etc.), burning through API quota.

**Solution**: Only fetch top-level directories on startup. Subdirectories are fetched on-demand when users navigate to them.

**Configuration**:
**Behavior** (always enabled):
- On startup: Fetches only 4 top-level directories (Character Cards, World Books, Chat Completion, Lumia DLCs)
- On navigation: Fetches specific categories/characters as needed
- Reduces startup API calls from 100+ to ~4

### 2. Persistent Cache

**Problem**: In-memory cache is lost on every application restart, requiring full data re-fetch.

**Solution**: Store cache data in `.cache/` directory on disk with TTL support.

**Configuration**:
```bash
# .env.local
PERSISTENT_CACHE_DIR=.cache  # Default: .cache/
```

**Features**:
- Survives application restarts
- 1 hour TTL by default
- Automatic cleanup when cache exceeds 100MB
- Stores as JSON files for easy inspection

### 3. GitHub GraphQL API (Optional)

**Problem**: REST API requires multiple requests for nested data (e.g., repo → directory → files).

**Solution**: Use GitHub's GraphQL API v4 for efficient bulk fetching.

**Configuration**:
```bash
# .env.local
USE_GITHUB_GRAPHQL=true  # Default: false
```

**Benefits**:
- Single request for nested data structures
- Precise field selection (no over-fetching)
- Better for bulk operations
- 5,000 points/hour rate limit (separate from REST API)

**Rate Limiting**:
- Simple queries: ~1-10 points
- Complex tree queries: ~50-200 points
- Max 500,000 nodes per query

## Environment Variables

```bash
# GitHub API token (required for higher rate limits)
GITHUB_TOKEN=your_token_here

# Lazy loading
USE_LAZY_LOADING=true  # Default: true

# Persistent cache
PERSISTENT_CACHE_DIR=.cache  # Default: .cache/

# GitHub GraphQL API
USE_GITHUB_GRAPHQL=false  # Default: false

# Local file cache (bypasses GitHub API entirely)
USE_LOCAL_CACHE=false
LOCAL_CACHE_PATH=/path/to/st-presets/repo
```

## API Endpoints

### Cache Status

Check current cache statistics and rate limits:

```bash
GET /api/cache/status
```

Response:
```json
{
  "success": true,
  "data": {
    "warmup": { "completed": true, "inProgress": false },
    "periodicRefresh": { "isActive": true, "lastRefresh": 1234567890, "nextRefresh": 1234577790 },
    "rateLimits": {
      "rest": { "limit": 5000, "remaining": 4800, "reset": 1234567890 },
      "graphql": { "enabled": true, "rateLimit": { "limit": 5000, "remaining": 4900, "resetAt": "2024-01-01T00:00:00Z" } }
    },
    "cache": {
      "memory": { "entries": 15 },
      "persistent": { "entries": 42, "sizeMB": 5.23 }
    },
    "features": {
      "persistentCache": true,
      "graphql": true
    }
  }
}
```

### Clear Cache

Clear all caches (requires authorization):

```bash
POST /api/cache/clear
Authorization: Bearer your_github_token
Content-Type: application/json

{ "action": "clear" }
```

## Monitoring

Watch the application logs for cache-related messages:

```
[Cache Warmup] Starting lazy warm-up (top-level directories only)...
[Cache Warmup] Lazy warmup completed in 450ms
[Cache Warmup] Subdirectories will be fetched on-demand as users navigate
[Persistent Cache] Current cache: 42 entries, 5.23MB
[GitHub] Persistent cache hit: Character Cards/Fantasy
[GraphQL] Cache hit for tree: World Books/Fiction
[Rate Limit] Adjusting refresh interval: 900000ms → 1800000ms (LOW: 250/5000 remaining, 5%)
```

## Migration Guide

### From Old Aggressive Warmup

1. **Update your `.env.local`**:
   ```bash
   # Add these new variables
   USE_LAZY_LOADING=true
   USE_GITHUB_GRAPHQL=false  # Optional
   PERSISTENT_CACHE_DIR=.cache
   ```

2. **Start the application** - It will automatically use lazy loading

3. **Monitor the logs** - Watch for `[Cache Warmup]` messages

4. **Check cache status** - Visit `/api/cache/status` to verify

### Enabling GraphQL (Optional)

1. Set `USE_GITHUB_GRAPHQL=true` in `.env.local`

2. Restart the application

3. Monitor logs for `[GraphQL]` messages

4. Check GraphQL rate limits at `/api/cache/status`

## Performance Comparison

### Startup API Calls

| Configuration | API Calls | Time | Quota Used |
|--------------|-----------|------|------------|
| Old (Aggressive) | ~150+ | 5-10s | ~3% |
| Lazy Loading | ~4 | 500ms | ~0.08% |
| With Persistent Cache | 0-4* | <100ms | ~0% |
| With GraphQL | 1-4 | 300ms | ~0.05% |

*0 if persistent cache is fresh, 4 if expired

### Memory Usage

| Cache Type | Memory | Survives Restarts | TTL |
|-----------|--------|-------------------|-----|
| In-Memory | Low | No | 30s |
| Persistent | Disk | Yes | 1h |
| Local Files | None | Yes | N/A |

## Troubleshooting

### High API Usage on Startup

**Check**: Is persistent cache working?
```bash
ls -la .cache/
```

**Solution**: Ensure `PERSISTENT_CACHE_DIR` is writable and persists between deployments.

### Cache Not Updating

**Check**: Is periodic refresh running?
```bash
curl /api/cache/status | jq '.data.periodicRefresh'
```

**Solution**: Verify `USE_LOCAL_CACHE` is not enabled (disables periodic refresh).

### GraphQL Errors

**Check**: Is `GITHUB_TOKEN` set?
```bash
echo $GITHUB_TOKEN
```

**Solution**: GraphQL requires authentication. Set a valid GitHub token.

## Best Practices

1. **Always use lazy loading** in production (default behavior)
2. **Enable persistent cache** to survive restarts
3. **Monitor rate limits** via `/api/cache/status`
4. **Set up webhooks** for real-time cache invalidation
5. **Use local cache** for development to bypass API limits entirely
6. **Consider GraphQL** if you frequently need bulk data operations

## Future Improvements

- Redis support for distributed caching
- Smart cache warming based on popular content
- Incremental cache updates via webhooks
- Cache compression for large JSON files
