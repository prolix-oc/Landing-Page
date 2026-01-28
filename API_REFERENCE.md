# Lucid.cards REST API Reference

Base URL: `https://lucid.cards` (or `http://localhost:3000` for development)

All endpoints return JSON and support CORS. Most GET endpoints include `Cache-Control` headers for CDN/browser caching.

---

## Table of Contents

- [Character Cards](#character-cards)
- [Chat Presets](#chat-presets)
- [World Books](#world-books)
- [Lumia DLC Packs](#lumia-dlc-packs)
- [Extensions](#extensions)
- [Raw Data Endpoints](#raw-data-endpoints)
- [Download API](#download-api)
- [Images](#images)
- [Webhooks](#webhooks)

---

## Character Cards

### List Categories

```
GET /api/character-cards
```

Returns all character card categories.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `all` | boolean | If `true`, returns all cards with tags and creators |

**Response:**
```json
{
  "success": true,
  "categories": [
    { "name": "Fantasy", "path": "Character Cards/Fantasy", "slug": "fantasy" }
  ]
}
```

**With `?all=true`:**
```json
{
  "success": true,
  "categories": [...],
  "cards": [...],
  "tags": [{ "name": "fantasy", "count": 5 }],
  "creators": [{ "name": "Prolix", "count": 10 }],
  "stats": { "totalCards": 50, "totalCategories": 5 }
}
```

---

### List Cards in Category

```
GET /api/character-cards/{category}
```

Returns all character cards in a category.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Category slug (e.g., `fantasy`) |

**Response:**
```json
{
  "success": true,
  "cards": [
    {
      "name": "Gandalf",
      "path": "Character Cards/Fantasy/Gandalf",
      "thumbnailUrl": "/api/images/...",
      "jsonUrl": "https://...",
      "size": 12345,
      "lastModified": "2024-01-15T10:30:00Z",
      "alternateCount": 2,
      "slug": "gandalf"
    }
  ]
}
```

---

### Get Character Details

```
GET /api/character-cards/{category}/{character}
```

Returns full details for a single character card.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Category slug |
| `character` | string | Character slug |

**Response:**
```json
{
  "success": true,
  "character": {
    "name": "Gandalf",
    "category": "Fantasy",
    "path": "Character Cards/Fantasy/Gandalf",
    "thumbnailUrl": "/api/images/...",
    "pngUrl": "https://raw.githubusercontent.com/...",
    "jsonUrl": "https://...",
    "cardData": { /* embedded character card JSON */ },
    "lastModified": "2024-01-15T10:30:00Z",
    "alternates": [
      { "name": "Gandalf V2", "pngUrl": "...", "jsonUrl": "..." }
    ],
    "slug": "gandalf"
  }
}
```

---

## Chat Presets

### List Presets

```
GET /api/chat-presets
```

Returns all chat preset directories.

**Response:**
```json
{
  "success": true,
  "presets": {
    "standard": [
      { "name": "Lucid", "path": "Chat Completion/Lucid", "category": "standard" }
    ],
    "prolix": []
  }
}
```

---

### Get Preset Versions

```
GET /api/chat-presets/{preset}
```

Returns all versions of a preset (standard and prolix variants).

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `preset` | string | Preset name (URL-encoded) |

**Response:**
```json
{
  "success": true,
  "versions": {
    "standard": [
      {
        "name": "Lucid v5.5",
        "path": "Chat Completion/Lucid/Lucid v5.5.json",
        "downloadUrl": "https://raw.githubusercontent.com/...",
        "size": 5432,
        "htmlUrl": "https://github.com/...",
        "lastModified": "2024-01-15T10:30:00Z",
        "isLatest": true
      }
    ],
    "prolix": [...]
  }
}
```

---

### Get Tested Samplers / Optimized Options

```
GET /api/chat-presets/{preset}/tested-samplers
```

Returns sampler configurations for a preset.

**Response:** Raw JSON from `optimized_options.json` or `tested_samplers.json` with `_meta` field indicating format.

---

### Get State File

```
GET /api/chat-presets/{preset}/state/{...stateFile}
```

Returns a state file for a preset (must end with `.state.json`).

---

### Backup Custom Prompt

```
POST /api/chat-presets/backup
```

Saves a custom prompt backup to the server.

**Request Body:**
```json
{
  "timestamp": "20240115_103000",
  "presetName": "MyPreset",
  "prompt": "Custom prompt content..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Custom prompt backup saved successfully",
  "filename": "20240115_103000_MyPreset.json"
}
```

---

## World Books

### List Categories

```
GET /api/world-books
```

Returns all world book categories (excludes DLC categories).

**Response:**
```json
{
  "success": true,
  "categories": [
    { "name": "Lore", "path": "World Books/Lore", "displayName": "Lore" }
  ]
}
```

---

### List Books in Category

```
GET /api/world-books/{category}
```

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "name": "Middle Earth.json",
      "path": "World Books/Lore/Middle Earth.json",
      "downloadUrl": "https://raw.githubusercontent.com/...",
      "size": 12345,
      "htmlUrl": "https://github.com/..."
    }
  ]
}
```

---

### Get World Book Details

```
GET /api/world-books/{category}/{book}
```

**Response:**
```json
{
  "success": true,
  "worldBook": {
    "name": "Middle Earth",
    "category": "Lore",
    "path": "World Books/Lore/Middle Earth.json",
    "downloadUrl": "https://raw.githubusercontent.com/...",
    "jsonUrl": "https://raw.githubusercontent.com/...",
    "bookData": {
      "entries": { /* world book entries */ }
    },
    "size": 12345,
    "lastModified": "2024-01-15T10:30:00Z"
  }
}
```

---

## Lumia DLC Packs

### List All Packs

```
GET /api/lumia-dlc
```

Returns all Lumia DLC packs with summary information.

**Response:**
```json
{
  "success": true,
  "packs": [
    {
      "packName": "Fantasy Pack",
      "packAuthor": "Prolix",
      "coverUrl": "https://...",
      "lumiaCount": 5,
      "loomCount": 3,
      "extrasCount": 2,
      "slug": "fantasy-pack",
      "packType": "mixed"
    }
  ],
  "authors": [
    { "name": "Prolix", "count": 10 }
  ],
  "stats": {
    "totalPacks": 15,
    "lumiaPacks": 8,
    "loomPacks": 4,
    "mixedPacks": 3
  }
}
```

---

### Get Pack Details

```
GET /api/lumia-dlc/{pack}
```

Returns full pack data including all items.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `pack` | string | Pack slug |

**Response:**
```json
{
  "success": true,
  "pack": {
    "packName": "Fantasy Pack",
    "packAuthor": "Prolix",
    "coverUrl": "https://...",
    "version": 1,
    "packExtras": [...],
    "lumiaItems": [...],
    "loomItems": [...],
    "slug": "fantasy-pack",
    "downloadUrl": "https://raw.githubusercontent.com/..."
  }
}
```

---

## Extensions

### List Extensions

```
GET /api/extensions
```

Returns all available SillyTavern extensions.

**Response:**
```json
{
  "success": true,
  "extensions": [
    {
      "id": "lucid-loom",
      "name": "Lucid Loom",
      "description": "Advanced prompt management...",
      "repoUrl": "https://github.com/...",
      "thumbnail": "/images/extensions/lucid-loom.png",
      "category": "prompts"
    }
  ]
}
```

---

## Download API

REST API for programmatic preset downloads with version selection.

### List Presets with Versions

```
GET /api/download/chat-presets
```

Returns all presets with their available versions and slugs for downloading.

**Response:**
```json
{
  "success": true,
  "presets": [
    {
      "name": "Lucid",
      "slug": "lucid",
      "versions": {
        "standard": [
          {
            "name": "Lucid v5.5",
            "path": "Chat Completion/Lucid/Lucid v5.5.json",
            "slug": "v5-5",
            "downloadUrl": "https://...",
            "size": 5432,
            "lastModified": "2024-01-15T10:30:00Z",
            "isProlix": false
          }
        ],
        "prolix": [...]
      },
      "latestVersion": { /* latest version object */ },
      "totalVersions": 4
    }
  ],
  "stats": {
    "totalPresets": 5,
    "totalVersions": 20,
    "presetsWithProlix": 3
  }
}
```

---

### Download Preset by Version

```
GET /api/download/chat-presets/{preset}/{version}
```

Downloads a specific preset version.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `preset` | string | Preset slug (e.g., `lucid`) |
| `version` | string | Version slug (e.g., `v5-5`, `v5-5-prolix`, or `latest`) |

**Response:**
```json
{
  "success": true,
  "preset": {
    "name": "Lucid",
    "slug": "lucid",
    "versions": { "standard": [...], "prolix": [...] },
    "latestVersion": {...},
    "totalVersions": 4
  },
  "data": {
    /* Full preset JSON content */
  }
}
```

**Error Response (version not found):**
```json
{
  "success": false,
  "error": "Version not found",
  "availableVersions": {
    "standard": ["v5-5", "v5-4", "v5-3"],
    "prolix": ["v5-5-prolix"]
  }
}
```

---

## Raw Data Endpoints

These endpoints return raw JSON data without wrapper objects, suitable for direct consumption.

### Raw Character Card

```
GET /api/raw/character-cards/{category}/{character}
```

Returns raw character card JSON data.

---

### Raw Chat Preset

```
GET /api/raw/chat-presets/{preset}
```

Returns raw preset JSON data (latest version).

---

### Raw World Books List

```
GET /api/raw/world-books
```

Returns categorized list of all world books.

**Response:**
```json
{
  "categories": [
    {
      "name": "lore",
      "displayName": "Lore",
      "books": [
        { "name": "middle-earth", "prettyName": "Middle Earth", "path": "..." }
      ]
    }
  ]
}
```

---

### Raw World Book

```
GET /api/raw/world-books/{category}/{book}
```

Returns raw world book JSON data.

---

## Images

### Serve Image

```
GET /api/images/{...path}
```

Serves optimized WebP images from the uploads directory.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | string | Image path (must end in `.webp`) |

**Response:** Binary image data with `image/webp` content type and 1-year cache.

---

### Upload Image

```
POST /api/images/upload
```

Uploads and optimizes an image.

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | `Bearer {IMAGE_UPLOAD_TOKEN}` |

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `width` | number | Target width (optional) |
| `height` | number | Target height (optional) |
| `quality` | number | WebP quality 1-100 (default: 80) |

**Request Body:** Multipart form data with `file` field, or raw binary image data.

**Response:**
```json
{
  "success": true,
  "filename": "abc123.webp",
  "url": "/api/images/abc123.webp"
}
```

---

## Webhooks

### GitHub Push Webhook

```
POST /api/webhooks/github
```

Receives GitHub push events to invalidate cache for changed files.

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| `x-hub-signature-256` | Yes | HMAC SHA-256 signature |
| `x-github-event` | Yes | Event type (must be `push`) |

**Response:**
```json
{
  "message": "Cache invalidated for 3 paths",
  "processed": 3,
  "invalidated": 2,
  "paths": ["Character Cards/Fantasy", "Chat Completion/Lucid"],
  "filesAdded": 1,
  "filesModified": 2,
  "filesRemoved": 0,
  "commits": 1,
  "ref": "refs/heads/main"
}
```

---

### Webhook Health Check

```
GET /api/webhooks/github
```

Returns webhook configuration status.

**Response:**
```json
{
  "status": "ok",
  "configured": true,
  "message": "GitHub webhook is configured and ready"
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

**HTTP Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad request (invalid parameters) |
| 401 | Unauthorized (missing/invalid auth) |
| 404 | Resource not found |
| 500 | Internal server error |

---

## CORS

All endpoints include CORS headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

Preflight requests (`OPTIONS`) are supported on all endpoints.

---

## Caching

Most GET endpoints include caching headers:

```
Cache-Control: public, s-maxage=60, stale-while-revalidate=120
```

This enables:
- CDN caching for 60 seconds
- Stale content served while revalidating for 120 seconds
- Browser caching where appropriate

---

## Rate Limiting

The API uses GitHub's API under the hood:
- **Without `GITHUB_TOKEN`:** 60 requests/hour
- **With `GITHUB_TOKEN`:** 5,000 requests/hour

The server implements stale-while-revalidate caching to minimize GitHub API calls.
