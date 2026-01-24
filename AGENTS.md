# AGENTS.md - Agent Guide for Lucid.cards

A Next.js 16 landing page for browsing and downloading SillyTavern presets, character cards, world books, and extensions from GitHub.

## Quick Reference

### Commands

```bash
# Install dependencies (use bun)
bun install

# Development server
bun run dev          # → http://localhost:3000

# Production build
bun run build

# Production server
bun run start

# Linting
bun run lint         # Uses ESLint with Next.js config
```

### Environment Variables

Copy `.env.example` to `.env.local`:

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Recommended | GitHub PAT with `public_repo` scope - increases API rate limits from 60 to 5000/hour |
| `GITHUB_WEBHOOK_SECRET` | Optional | For real-time cache invalidation on push events |
| `IMAGE_UPLOAD_TOKEN` | Optional | Auth token for `/api/images/upload` endpoint |
| `USE_LOCAL_CACHE` | Optional | Set to `true` to use local file cache instead of GitHub API |
| `LOCAL_CACHE_PATH` | Optional | Path to local cache directory |

## Project Structure

```
├── app/
│   ├── api/                        # API routes (Next.js Route Handlers)
│   │   ├── character-cards/        # Character cards endpoints
│   │   ├── chat-presets/           # Chat presets endpoints  
│   │   ├── world-books/            # World books endpoints
│   │   ├── lumia-dlc/              # Lumia DLC pack endpoints
│   │   ├── extensions/             # Extensions endpoint
│   │   ├── images/                 # Image proxy and upload
│   │   ├── raw/                    # Raw file serving endpoints
│   │   └── webhooks/github/        # GitHub webhook for cache invalidation
│   ├── character-cards/            # Character cards pages
│   ├── chat-presets/               # Chat presets page
│   ├── world-books/                # World books pages
│   ├── lumia-dlc/                  # Lumia DLC pages
│   ├── lucid-loom/                 # Lucid Loom showcase page
│   ├── extensions/                 # Extensions page
│   ├── components/                 # React components
│   ├── contexts/                   # React contexts
│   ├── layout.tsx                  # Root layout with fonts, metadata
│   ├── template.tsx                # Page transition wrapper
│   ├── page.tsx                    # Landing page (bento grid)
│   └── globals.css                 # Global styles, animations, Tailwind
├── lib/
│   ├── github.ts                   # GitHub API integration & caching system
│   ├── slugify.ts                  # URL slug utilities
│   ├── local-cache.ts              # Local file cache implementation
│   ├── download.ts                 # Download utilities
│   ├── image-optimizer.ts          # Sharp-based image optimization
│   ├── provider-icons.ts           # AI provider icon mappings
│   └── types/                      # TypeScript type definitions
├── types/
│   └── view-transitions.d.ts       # View Transitions API types
├── public/                         # Static assets, icons, images
└── scripts/                        # Build scripts (favicon generation)
```

## Key Architecture Patterns

### Caching System (`lib/github.ts`)

The caching system is the core of the application. Key concepts:

1. **Stale-While-Revalidate**: Cached data is returned immediately; background refresh happens silently
2. **Cache Warmup**: On first request, all GitHub content is pre-fetched
3. **Adaptive Rate Limiting**: Refresh interval adjusts based on GitHub API quota (45s-180s)
4. **Multi-Layer Caching**:
   - In-memory Map-based cache (30s TTL)
   - Thumbnail cache (1 hour TTL)
   - JSON data cache (1 hour TTL)
   - HTTP Cache-Control headers for CDN/browser

```typescript
// Cache durations
const CACHE_DURATION = 30 * 1000;           // 30 seconds
const THUMBNAIL_CACHE_DURATION = 60 * 60 * 1000;  // 1 hour
const JSON_DATA_CACHE_DURATION = 60 * 60 * 1000;  // 1 hour
```

**Important**: The cache invalidation happens via:
- GitHub webhooks (immediate, selective)
- Periodic background refresh (45-180s, adaptive)
- Stale-while-revalidate pattern (on-demand)

See `CACHING_STRATEGY.md` for detailed documentation.

### API Route Pattern

All API routes follow this pattern:

```typescript
import { NextResponse } from 'next/server';
import { getDirectoryContents, ensureWarmup } from '@/lib/github';

export async function GET(request: Request) {
  // Trigger cache warmup if not already done
  ensureWarmup();
  
  try {
    const data = await getDirectoryContents('Some Path');
    
    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
        }
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch' },
      { status: 500 }
    );
  }
}
```

### Dynamic Routes

Dynamic segments use folder naming convention:
- `[category]` - Single dynamic segment
- `[...path]` - Catch-all segment

Example: `/api/character-cards/[category]/[character]/route.ts`

### Component Patterns

1. **Client Components**: Use `'use client'` directive at top of file
2. **Server Components**: Default (no directive needed)
3. **Page Components**: Export default function, can be async for data fetching

```typescript
// Client component with transitions
'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function MyComponent() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  // ...
}
```

### View Transitions

The app uses the View Transitions API for smooth page navigation:

1. `next.config.ts` enables `experimental.viewTransition: true`
2. `TransitionLink` component wraps navigation with `document.startViewTransition()`
3. CSS animations in `globals.css` handle directional slides
4. `template.tsx` wraps pages with fade-in animation

**Important**: Elements with `backdrop-blur` should have `view-transition-name: none` to prevent Safari flicker (handled via `.vt-exclude` class).

## Styling Conventions

### Tailwind CSS v4

Uses `@import "tailwindcss"` syntax in `globals.css`. Key patterns:

```css
/* Theme variables */
@theme inline {
  --color-background: var(--background);
  --font-sans: var(--font-geist-sans);
}

/* Custom animations */
.animate-fade-in { animation: simpleFadeIn 0.15s ease-out; }
.glass { backdrop-filter: blur(10px); }
.card-hover { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
```

### Color Palette

- Primary gradients: `from-purple-500 via-pink-500 to-rose-500`
- Cyan accent: `from-cyan-500 via-blue-500 to-cyan-600`
- Glass effects: `bg-white/[0.03]`, `border-white/[0.05]`
- Text: `text-gray-400` (muted), `text-white` (primary)

### Performance Optimizations

1. **Safari-specific blur reductions** via `@supports (-webkit-hyphens: none)`
2. **GPU compositing** with `will-change`, `transform: translateZ(0)`
3. **Reduced motion** support with `@media (prefers-reduced-motion: reduce)`
4. **Single backdrop-blur container** instead of per-card blur

## Important Gotchas

### 1. GitHub API Rate Limits

Without `GITHUB_TOKEN`: 60 requests/hour
With `GITHUB_TOKEN`: 5000 requests/hour

Always recommend users set up a token for development.

### 2. Bun vs npm

Project uses **bun** as package manager (see `bun.lock`, `bunfig.toml`). Use bun commands.

### 3. Path Aliases

Uses `@/*` path alias mapping to project root:
```typescript
import { slugify } from '@/lib/slugify';
import TransitionLink from '@/app/components/TransitionLink';
```

### 4. Data Source

All content data comes from `prolix-oc/ST-Presets` GitHub repository. The structure is:
- `Character Cards/{Category}/{Character}/` - PNG + JSON files
- `World Books/{Category}/{Book}/` - JSON files
- `Chat Completion/` - Preset JSON files
- `Lumia DLCs/` - DLC pack JSON files

### 5. Cache Invalidation

When debugging stale data:
1. Check if webhook is configured (`GET /api/webhooks/github`)
2. Check server logs for `[Webhook]`, `[Cache Warmup]`, `[Periodic Refresh]` messages
3. Cache clears on server restart

### 6. Image Optimization

Uses Sharp for image processing. The `/api/images/[...path]` route serves optimized images with:
- WebP conversion
- Quality adjustment
- Size limits

### 7. Slug Generation

Character names are slugified for URLs. The `lib/slugify.ts` handles this:
- Removes version suffixes (`V2`, `V3`)
- Lowercases and replaces spaces with hyphens
- Removes special characters

## TypeScript Configuration

- Strict mode enabled
- Module resolution: `bundler`
- Target: ES2017
- Uses React JSX transform
- Incremental compilation enabled

## ESLint Configuration

Uses flat config format (`eslint.config.mjs`):
- Next.js core-web-vitals preset
- Next.js TypeScript preset
- Ignores `.next/`, `out/`, `build/`

## Testing

No test framework is currently configured. When adding tests:
- Consider Vitest for speed with Bun
- Use React Testing Library for component tests
- Mock the GitHub API for API route tests

## Documentation Files

- `README.md` - General project overview and setup
- `CACHING_STRATEGY.md` - Detailed caching documentation
- `WEBHOOK_SETUP.md` - GitHub webhook configuration guide
- `LOCAL_CACHE_SETUP.md` - Local file cache setup
- `DESIGN_SPEC.md` - UI/UX design specifications
- `new_dlc_format.md` - DLC pack JSON format specification

## Common Tasks

### Adding a New Page

1. Create folder under `app/` (e.g., `app/my-page/`)
2. Add `page.tsx` with default export
3. Optionally add `layout.tsx` for page-specific layout
4. Add navigation link using `TransitionLink` component

### Adding a New API Route

1. Create folder under `app/api/` (e.g., `app/api/my-route/`)
2. Add `route.ts` with exported HTTP method handlers
3. Call `ensureWarmup()` at start if using GitHub data
4. Return `NextResponse.json()` with Cache-Control headers

### Adding a New Component

1. Create file in `app/components/`
2. Add `'use client'` if using hooks, state, or browser APIs
3. Use Tailwind classes for styling
4. Follow existing naming conventions (PascalCase)

### Modifying the Cache System

1. Edit `lib/github.ts`
2. Adjust cache durations via constants at top of file
3. Use `invalidateCachePath()` for manual cache clearing
4. Test with various rate limit scenarios
