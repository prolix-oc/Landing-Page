# Local Cache Setup Guide

This guide explains how to set up and use the local file system cache as a fallback for GitHub API data.

## Overview

The local cache feature allows you to serve content from your local file system instead of the GitHub API. This is useful for:

- **Development/Testing**: Work offline or without rate limits
- **Production Deployments**: Remove dependency on GitHub API availability
- **Custom Content**: Serve your own content without needing a GitHub repository
- **Performance**: Eliminate API latency for faster response times

## Directory Structure

The local cache mirrors the GitHub repository structure. By default, it uses a `data/` directory in your project root:

```
data/
├── Character Cards/
│   ├── Anime/
│   │   └── Character Name/
│   │       ├── character.json
│   │       └── character.png
│   └── Original/
│       └── Another Character/
│           ├── character.json
│           └── character.png
├── World Books/
│   └── Fantasy/
│       └── Book Name/
│           └── book.json
└── Chat Completion/
    └── preset.json
```

## Setup Instructions

### 1. Create the Data Directory

Create a `data/` directory in your project root (or specify a custom path):

```bash
mkdir data
```

### 2. Populate with Content

Copy your content into the `data/` directory, maintaining the same folder structure as your GitHub repository:

#### Character Cards Structure:
```
data/Character Cards/[Category]/[Character Name]/
├── [character-name].json
└── [character-name].png (optional)
```

#### World Books Structure:
```
data/World Books/[Category]/[Book Name]/
└── [book-name].json
```

#### Chat Presets Structure:
```
data/Chat Completion/
└── [preset-name].json
```

### 3. Configure Environment Variables

Edit your `.env.local` file:

```env
# Enable local cache
USE_LOCAL_CACHE=true

# Optional: Specify custom cache directory path
# LOCAL_CACHE_PATH=/custom/path/to/cache
```

**Environment Variables:**

- `USE_LOCAL_CACHE`: Set to `true` to enable local caching (default: `false`)
- `LOCAL_CACHE_PATH`: Optional custom path to cache directory (default: `./data`)

### 4. Restart Your Development Server

```bash
npm run dev
```

You should see log messages indicating local cache is enabled:

```
[Local Cache] ✓ Enabled - Using local cache at: C:\Projects\Landing-Page\data
[Cache Warmup] Skipping GitHub warmup - using local cache
```

## File Format Requirements

### Character Card JSON

Character cards must follow the V2 spec format:

```json
{
  "spec": "chara_card_v2",
  "spec_version": "2.0",
  "data": {
    "name": "Character Name",
    "description": "Character description",
    "personality": "Character personality",
    "scenario": "Character scenario",
    "first_mes": "First message",
    "mes_example": "Example dialogue"
  }
}
```

### World Book JSON

World books should contain an `entries` array:

```json
{
  "entries": [
    {
      "keys": ["keyword1", "keyword2"],
      "content": "Entry content",
      "enabled": true
    }
  ]
}
```

### Chat Preset JSON

Chat presets should follow your preset format structure.

## How It Works

### Startup Behavior

When `USE_LOCAL_CACHE=true`:

1. Application checks if the local cache directory exists
2. If found, all data is loaded from disk instead of GitHub API
3. GitHub API warmup is skipped
4. Periodic refresh is disabled (data is always loaded fresh from disk)

### Fallback Behavior

If local cache is enabled but:
- Directory doesn't exist
- File is missing
- Read error occurs

The system automatically falls back to the GitHub API with a warning message.

### Data Freshness

- **Local Cache**: Data is read directly from disk on each request
- **File Modification Times**: Used as mock "commit dates" for sorting
- **No Periodic Refresh**: Since data is on disk, no background refresh is needed

## Switching Between Modes

### Development Mode (GitHub API)

```env
USE_LOCAL_CACHE=false
```

- Fetches from GitHub API
- Uses in-memory caching
- Periodic background refresh active
- Rate limit adaptive behavior

### Local Mode (File System)

```env
USE_LOCAL_CACHE=true
```

- Reads from local disk
- No GitHub API calls
- No rate limits
- Instant responses

## Troubleshooting

### "Path not found" Warning

```
[Local Cache] Path not found: C:\Projects\Landing-Page\data\Character Cards
```

**Solution**: Ensure the directory structure matches exactly, including spaces and capitalization.

### "Enabled but directory not found"

```
[Local Cache] ✗ Enabled but directory not found: C:\Projects\Landing-Page\data
```

**Solution**: Create the `data/` directory or check `LOCAL_CACHE_PATH` is correct.

### Content Not Appearing

**Checklist:**
1. ✓ `USE_LOCAL_CACHE=true` in `.env.local`
2. ✓ Directory structure matches GitHub repository exactly
3. ✓ JSON files are valid and properly formatted
4. ✓ File names match expected patterns (e.g., `.json`, `.png`)
5. ✓ Server restarted after enabling local cache

### Mixed Content (Some from GitHub, Some Local)

This is not currently supported. When `USE_LOCAL_CACHE=true`, **all** content is loaded from local cache. If a file is missing locally, it will not fall back to GitHub for that specific file.

## Custom Cache Path

To use a different directory location:

```env
USE_LOCAL_CACHE=true
LOCAL_CACHE_PATH=C:\MyContent\PresetCache
```

**Note**: Use absolute paths for clarity, especially on Windows.

## Performance Considerations

### Advantages of Local Cache

- ✅ Zero network latency
- ✅ No API rate limits
- ✅ Works offline
- ✅ Instant startup (no warmup needed)
- ✅ Predictable performance

### Considerations

- ❗ No automatic updates from GitHub
- ❗ Manual content management required
- ❗ Disk I/O instead of network I/O
- ❗ File system permissions must allow read access

## Migration Guide

### From GitHub API to Local Cache

1. **Export Current Content**: Clone your GitHub repository locally
2. **Copy to Data Directory**: Copy content to `data/` maintaining structure
3. **Update Environment**: Set `USE_LOCAL_CACHE=true`
4. **Test**: Verify all content loads correctly
5. **Deploy**: Update production environment variables if deploying

### From Local Cache to GitHub API

1. **Update Environment**: Set `USE_LOCAL_CACHE=false`
2. **Restart Server**: Application will begin using GitHub API
3. **Monitor**: Check logs for GitHub API connection and rate limits

## Production Deployment

For production deployments using local cache:

1. **Bundle Content**: Include `data/` directory in your deployment
2. **Set Environment Variables**: Configure `USE_LOCAL_CACHE=true` in production
3. **Verify Permissions**: Ensure the application can read from `data/`
4. **Monitor Logs**: Check for cache status messages on startup

### Docker Example

```dockerfile
# Copy local cache data
COPY data/ /app/data/

# Set environment variable
ENV USE_LOCAL_CACHE=true
```

## Security Considerations

- Local cache files are served directly - ensure content is safe
- Do not commit sensitive data to `data/` directory (it's in `.gitignore`)
- If using `LOCAL_CACHE_PATH`, ensure path is secure and not world-readable

## Summary

The local cache system provides a flexible fallback that:

- Works seamlessly with existing code
- Requires minimal configuration
- Provides excellent performance
- Enables offline development
- Reduces dependency on external APIs

For questions or issues, check the application logs for detailed error messages.
