# BunnyWorks Setup Guide 🐰

Welcome to BunnyWorks! This guide will help you get your visual character card editor up and running.

## Prerequisites

- Node.js 18+ installed
- A GitHub account
- Git installed

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up GitHub OAuth (Required for Admin Access)

To access the admin panel (`/admin`), you need to set up GitHub OAuth:

### 2.1 Create a GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in the form:
   - **Application name**: `BunnyWorks Admin` (or whatever you want)
   - **Homepage URL**: `http://localhost:3000` (for local development)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click **"Register application"**

### 2.2 Get Your Credentials

After creating the app, you'll see:
- **Client ID** - Copy this
- **Client Secret** - Click "Generate a new client secret" and copy it

### 2.3 Create Environment File

Create a file called `.env.local` in the root of your project:

```bash
# GitHub OAuth
GITHUB_ID=your_github_client_id_here
GITHUB_SECRET=your_github_client_secret_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_here
```

**To generate `NEXTAUTH_SECRET`**, run this in your terminal:
```bash
openssl rand -base64 32
```

Or just use any random string like: `my-super-secret-key-12345`

### 2.4 Update Allowed Users

The admin panel is locked to your GitHub username. Check `lib/auth.ts`:

```typescript
const allowedUsers = ["Coneja-Chibi"]; // Your GitHub username here
```

If your GitHub username is different, update it!

## Step 3: Run the Development Server

```bash
npm run dev
```

Visit http://localhost:3000 - you should see your BunnyWorks landing page! 🎉

## Step 4: Access the Admin Panel

1. Go to http://localhost:3000/admin
2. You'll be redirected to sign in
3. Click **"Sign in with GitHub"**
4. Authorize the app
5. You're in! 🚀

## Using the Visual Editor

### Creating Your First Character Page

1. Click **"Create New Character"** in the admin dashboard
2. Enter a character name and URL slug (e.g., "bunny-girl")
3. Click the **Theme** button to customize colors and font
4. **Add components** from the left panel:
   - Click any component to add it to your page
   - Use the drag handle (appears on hover) to reorder components
   - Click a component to select it
   - Edit properties in the right panel
5. **Save** your character page
6. Click **Preview** to see it live!

### Component Library

You have **93 different component types** to choose from:

#### Headers (8 types)
- Classic Hero - Large title with gradient
- Split Hero - Image + text side by side
- Fullscreen Hero - Dramatic full-screen header
- Minimal Hero - Clean simple header
- Glitch Hero - Cyberpunk glitch effect
- Neon Hero - Glowing neon sign
- Floating Portrait - Animated floating image
- Typewriter Hero - Text that types out

#### Content (5 types)
- Text Block - Basic paragraphs
- Glass Text Card - Glassmorphic container
- Gradient Text - Rainbow/gradient text
- Multi-Column Text - Newspaper style
- Scroll Reveal Text - Animates on scroll

#### Media (8 types)
- Image - Basic image with captions
- Polaroid - Vintage photo style
- Floating Image - Animated floating
- Tilt on Hover - 3D tilt effect
- Before/After Slider - Image comparison
- Zoom on Hover - Magnify effect
- Parallax Image - Scroll effect
- Slideshow - Auto-playing carousel

#### Galleries (5 types)
- Grid Gallery - Simple grid layout
- Masonry Gallery - Pinterest style
- Carousel Gallery - Swipeable carousel
- Lightbox Gallery - Click to enlarge
- Scattered Polaroids - Random layout

#### Interactive (9 types)
- Stat Bars - Progress bar stats
- Stat Cards - Glass cards with icons
- Circular Stats - Ring progress
- Pentagon Chart - Spider/radar chart
- Info Cards - Key information display
- Trait Tags - Personality tags
- Timeline - Story timeline
- Accordion - Collapsible sections
- Tabs - Tabbed content

#### Buttons (5 types)
- Primary Button - Gradient CTA
- Glass Button - Glassmorphic
- Neon Button - Glowing neon
- Download Card - Card with preview
- Social Links - Social media icons

#### Quotes (4 types)
- Simple Quote - Clean quote block
- Quote Card - Glass card with avatar
- Speech Bubble - Comic style
- Typewriter Quote - Types out

#### Layout (4 types)
- Line Divider - Simple separator
- Gradient Divider - Colorful line
- Ornamental Divider - Decorative
- Spacer - Empty vertical space

#### Containers (4 types)
- Glass Container - Glassmorphic box
- Gradient Container - Gradient border
- Full Width Section - Full width area
- Two Columns - Split layout

#### Backgrounds (4 types)
- Gradient Background - Animated gradient
- Floating Particles - Stars, hearts, sparkles
- Floating Orbs - Large gradient orbs
- Grid Pattern - Subtle grid

#### Effects (4+ types)
- Glitch Effect - Cyberpunk glitch
- Scanlines - Retro CRT effect
- Vignette - Darkened edges
- Glow Effect - Glowing aura
- Music Player - Audio player

### Tips

- **Mix and match** components to create unique pages
- Use **theme colors** for consistency
- **Drag to reorder** components in the canvas
- **Delete** components with the trash icon in properties panel
- **Preview** before publishing
- Character data is saved in `/data/characters/[slug].json`

## Folder Structure

```
BunnyWorks/
├── app/
│   ├── admin/                    # Admin dashboard
│   │   └── character/[slug]/     # Visual editor
│   ├── characters/[slug]/        # Public character pages
│   ├── api/
│   │   ├── admin/characters/     # Character CRUD API
│   │   └── auth/                 # NextAuth routes
│   └── auth/                     # Sign in/error pages
├── lib/
│   ├── auth.ts                   # Auth configuration
│   └── editor/
│       ├── types.ts              # TypeScript types
│       └── component-library.ts  # All 93 component definitions
├── data/
│   └── characters/               # Your character JSON files
├── public/                       # Images and static files
└── .env.local                    # Your secrets (don't commit!)
```

## Deploying to Production

When you're ready to deploy:

1. Update your GitHub OAuth app with production URLs
2. Set environment variables on your hosting platform (Vercel, Netlify, etc.)
3. Update `NEXTAUTH_URL` to your production URL
4. Deploy!

## Troubleshooting

### "Access Denied" when signing in
- Make sure your GitHub username is in the `allowedUsers` array in `lib/auth.ts`
- Check that your `.env.local` has the correct `GITHUB_ID` and `GITHUB_SECRET`

### Components not rendering
- Make sure you clicked Save after adding components
- Check browser console for errors
- Verify character data exists in `/data/characters/`

### Images not loading
- Use full URLs (e.g., `https://example.com/image.png`) or paths relative to `/public/` (e.g., `/bunnymo.png`)
- Images in `/public/` are accessible directly

## Need Help?

- Check the component library definitions in `lib/editor/component-library.ts`
- Look at component renderers in `app/components/character/ComponentRenderer.tsx`
- All character data is stored as JSON - you can edit it directly if needed!

## Have Fun! 🎨✨

Now go create some amazing character pages! Remember:
- There are 93 component types to choose from
- Mix styles: cute, elegant, cyberpunk, minimal - whatever fits your character!
- The possibilities are endless! 🐰💜
