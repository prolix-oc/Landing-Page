# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lucid.cards — a Next.js 16 landing page for browsing and downloading SillyTavern presets, character cards, world books, and extensions from the `prolix-oc/ST-Presets` GitHub repository.

## Commands

```bash
bun install            # Install dependencies (always use bun, not npm/yarn)
bun run dev            # Dev server at http://localhost:3000
bun run build          # Production build
bun run start          # Start production server
bun run lint           # ESLint (flat config, Next.js core-web-vitals + TypeScript)
```

## Environment Setup

Copy `.env.example` to `.env.local`. Key variable: `GITHUB_TOKEN` (PAT with `public_repo` scope) — without it, GitHub API is limited to 60 req/hour vs 5000. Set `USE_GITHUB_GRAPHQL=true` to use GraphQL API for more efficient bulk fetching.

## Architecture

### Data Flow

All content data is fetched from the `prolix-oc/ST-Presets` GitHub repo. The data path is:

**GitHub API → `lib/github.ts` (caching layer) → API routes (`app/api/`) → Page components**

### Caching System (`lib/github.ts`)

This is the core of the application — a multi-layer stale-while-revalidate cache:

1. **In-memory Map cache** (30s TTL) — fastest, checked first
2. **Persistent file cache** (`lib/persistent-cache.ts`, 1h TTL) — survives restarts, stored in `.cache/`
3. **Thumbnail/JSON data caches** (1h TTL each) — separate Maps for binary/structured data
4. **Cache warmup** — on first request, pre-fetches all GitHub content via `ensureWarmup()`
5. **Adaptive rate limiting** — refresh interval scales from 45s to 180s based on API quota remaining
6. **GraphQL option** (`lib/github-graphql.ts`) — enabled via `USE_GITHUB_GRAPHQL=true` env var, fetches bulk data in fewer API calls

Cache invalidation: GitHub webhooks (immediate), periodic background refresh, or stale-while-revalidate on demand.

### API Routes (`app/api/`)

All route handlers follow the same pattern: call `ensureWarmup()`, fetch from `lib/github.ts`, return `NextResponse.json()` with `Cache-Control` headers. Endpoints: character-cards, chat-presets, world-books, lumia-dlc, extensions, images (proxy/upload), raw, download, webhooks, cache, extension-versions.

### View Transitions

- Enabled via `experimental.viewTransition: true` in `next.config.ts`
- `TransitionLink` component wraps navigation with `document.startViewTransition()`
- `template.tsx` adds fade-in animation to all pages
- Elements with `backdrop-blur` must use `view-transition-name: none` (`.vt-exclude` class) to prevent Safari flicker

### Styling

Tailwind CSS v4 with `@import "tailwindcss"` syntax in `globals.css`. Dark-themed with glass morphism effects (`bg-white/[0.03]`, `border-white/[0.05]`). Primary gradients: purple-pink-rose and cyan-blue. Safari-specific blur reductions via `@supports (-webkit-hyphens: none)`.

## Key Conventions

- **Package manager**: bun (see `bun.lock`, `bunfig.toml`)
- **Path alias**: `@/*` maps to project root
- **Client components**: `'use client'` directive at top when using hooks/state/browser APIs; otherwise server components by default
- **Slug generation**: `lib/slugify.ts` removes version suffixes (V2, V3), lowercases, replaces spaces with hyphens
- **TypeScript**: strict mode, target ES2017, bundler module resolution
- **React Compiler**: enabled via `babel-plugin-react-compiler`
- **Components** live in `app/components/`, contexts in `app/contexts/`

## Data Source Structure

Content from `prolix-oc/ST-Presets`:
- `Character Cards/{Category}/{Character}/` — PNG + JSON files
- `World Books/{Category}/{Book}/` — JSON files
- `Chat Completion/` — Preset JSON files
- `Lumia DLCs/` — DLC pack JSON files

## Reference Docs

- `API_REFERENCE.md` — Full REST API documentation
- `CACHING_STRATEGY.md` — Detailed caching architecture
- `WEBHOOK_SETUP.md` — GitHub webhook configuration
- `DESIGN_SPEC.md` — UI/UX design specifications
