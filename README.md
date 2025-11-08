# Lucid.cards - Landing Page

A Next.js landing page for browsing and downloading SillyTavern presets from the [prolix-oc/ST-Presets](https://github.com/prolix-oc/ST-Presets) GitHub repository.

## Features

- 🎭 **Character Cards** - Browse character cards organized by categories (ZZZ, Umamusume, Original Content)
- 💬 **Chat Completion Presets** - Download the latest chat completion presets with version tracking
- 📚 **World Books** - Access world books for enhanced storytelling
- 🔧 **Extensions** - Discover community-created extensions
- 🚀 **GitHub API Integration** - Automatically fetches the latest content from GitHub
- ⚡ **Server-Side Caching** - Reduces API calls with 5-minute cache duration
- 🎨 **Modern UI** - Built with Tailwind CSS for a beautiful, responsive design

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **API**: GitHub REST API v3
- **Deployment**: Optimized for Vercel/any Node.js hosting

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Landing-Page
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Add a GitHub token for higher API rate limits:
```bash
# Create a .env.local file
echo "GITHUB_TOKEN=your_github_personal_access_token" > .env.local
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── api/                        # API routes
│   │   ├── character-cards/       # Character cards endpoints
│   │   ├── chat-presets/          # Chat presets endpoints
│   │   ├── world-books/           # World books endpoints
│   │   └── extensions/            # Extensions endpoint
│   ├── character-cards/           # Character cards page
│   ├── chat-presets/              # Chat presets page
│   ├── world-books/               # World books page
│   ├── extensions/                # Extensions page
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Landing page
├── lib/
│   └── github.ts                  # GitHub API integration utilities
└── public/                        # Static assets
```

## API Routes

### Character Cards
- `GET /api/character-cards` - List all categories
- `GET /api/character-cards/[category]` - Get files for a specific category

### Chat Presets
- `GET /api/chat-presets` - List all presets
- `GET /api/chat-presets/[preset]` - Get versions for a specific preset (sorted by date)

### World Books
- `GET /api/world-books` - List all categories
- `GET /api/world-books/[category]` - Get files for a specific category

### Extensions
- `GET /api/extensions` - List all extensions (manually curated)

## Configuration

### GitHub Token (Optional but Recommended)

To avoid GitHub API rate limits, create a personal access token:

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token (classic) with `public_repo` scope
3. Add to `.env.local`:
```
GITHUB_TOKEN=ghp_your_token_here
```

### Cache Duration

The cache duration is set to 5 minutes by default. To modify, edit `lib/github.ts`:

```typescript
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
```

## Adding Extensions

To add extensions to the Extensions page, edit `app/api/extensions/route.ts`:

```typescript
const extensions = [
  {
    id: 'unique-id',
    name: 'Extension Name',
    description: 'Extension description',
    repoUrl: 'https://github.com/user/repo',
    thumbnail: '/path/to/thumbnail.png'
  },
  // Add more extensions...
];
```

Alternatively, you can create a JSON file and read from it for easier management.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project to Vercel
3. Add your `GITHUB_TOKEN` environment variable in Vercel settings
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:

```bash
npm run build
npm start
```

## Development

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## License

This project is open source and available under the MIT License.

## Credits

- Data sourced from [prolix-oc/ST-Presets](https://github.com/prolix-oc/ST-Presets)
- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
