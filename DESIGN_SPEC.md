# Lucid.cards Design Specification

> A comprehensive guide to the visual language, animation patterns, and component architecture used across the Lucid.cards website. This document serves as the definitive reference for maintaining design consistency and extending the design system to new pages.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Atmospheric Background Elements](#atmospheric-background-elements)
5. [Hero Section Patterns](#hero-section-patterns)
6. [Animation System](#animation-system)
7. [Glassmorphism Techniques](#glassmorphism-techniques)
8. [Component Library](#component-library)
9. [Icon System](#icon-system)
10. [Layout Patterns](#layout-patterns)
11. [Framer Motion Patterns](#framer-motion-patterns)
12. [CSS Utilities](#css-utilities)
13. [Responsive Design](#responsive-design)
14. [Implementation Checklist](#implementation-checklist)

---

## Design Philosophy

### Core Principles

1. **Atmospheric Depth**: Every page should feel like it exists in a living, breathing space. Background elements move slowly and organically, creating a sense of depth without distracting from content.

2. **Glassmorphism as Foundation**: Cards and containers use translucent backgrounds with backdrop blur, creating layered visual hierarchy. Content floats above atmospheric elements.

3. **Motion with Purpose**: Animations serve to guide attention, provide feedback, and create delight. Every animation has a reason—no gratuitous movement.

4. **Progressive Disclosure**: Content reveals itself as users scroll, creating a narrative flow through the page. Users discover content rather than being overwhelmed.

5. **Premium Feel**: The aesthetic should feel refined, mystical, and premium. Avoid generic patterns. Every element should feel intentionally designed.

### What to Avoid

- Generic "AI slop" aesthetics (overused purple gradients on white, Inter font everywhere)
- Cookie-cutter layouts that feel templated
- Animations that distract rather than enhance
- Flat, lifeless backgrounds
- Inconsistent spacing or color usage

---

## Color System

### Brand Palette

```css
/* Primary Colors */
--purple-primary: #7B4DBF;      /* Main brand purple */
--purple-secondary: #8B5FC7;    /* Lighter purple variant */
--purple-accent: #A855F7;       /* Bright purple for emphasis */

/* Accent Colors */
--cyan-primary: #00bfff;        /* Cyan for highlights and CTAs */
--cyan-400: #22d3ee;            /* Tailwind cyan-400 */
--cyan-500: #06b6d4;            /* Tailwind cyan-500 */

--blue-500: #3b82f6;            /* Blue for gradients */
--blue-600: #2563eb;            /* Darker blue */

--amber-400: #fbbf24;           /* Gold/amber for premium elements */
--amber-500: #f59e0b;           /* Darker amber */
--yellow-500: #eab308;          /* Yellow accent */

--pink-500: #ec4899;            /* Pink for emotional elements */
--rose-500: #f43f5e;            /* Rose variant */

/* Neutral Colors */
--gray-900: #111827;            /* Near-black backgrounds */
--gray-800: #1f2937;            /* Card backgrounds */
--gray-700: #374151;            /* Borders, dividers */
--gray-600: #4b5563;            /* Muted elements */
--gray-500: #6b7280;            /* Secondary text */
--gray-400: #9ca3af;            /* Tertiary text */
--gray-300: #d1d5db;            /* Light text on dark */

/* Background */
--background: #0a0a0a;          /* Page background */
```

### Gradient Combinations

```css
/* Hero Title Gradients */
.gradient-hero-primary {
  background: linear-gradient(to right, #22d3ee, #3b82f6, #a855f7);
  /* cyan-400 → blue-500 → purple-500 */
}

.gradient-hero-purple {
  background: linear-gradient(to right, #8B5FC7, #A855F7, #00bfff);
  /* purple → bright purple → cyan */
}

/* Card Background Gradients */
.gradient-card-cyan {
  background: linear-gradient(to bottom right,
    rgba(6, 182, 212, 0.1),   /* cyan-500/10 */
    rgba(59, 130, 246, 0.05), /* blue-500/5 */
    rgba(168, 85, 247, 0.1)   /* purple-500/10 */
  );
}

.gradient-card-amber {
  background: linear-gradient(to bottom right,
    rgba(245, 158, 11, 0.1),  /* amber-500/10 */
    rgba(234, 179, 8, 0.05),  /* yellow-500/5 */
    rgba(249, 115, 22, 0.1)   /* orange-500/10 */
  );
}

.gradient-card-purple {
  background: linear-gradient(to bottom right,
    rgba(139, 95, 199, 0.1),  /* purple/10 */
    rgba(168, 85, 247, 0.05), /* purple-500/5 */
    rgba(0, 191, 255, 0.1)    /* cyan/10 */
  );
}

/* Button Gradients */
.gradient-button-cyan {
  background: linear-gradient(to right, #06b6d4, #3b82f6);
  /* cyan-500 → blue-500 */
}

.gradient-button-amber {
  background: linear-gradient(to right, #f59e0b, #eab308);
  /* amber-500 → yellow-500 */
}

.gradient-button-purple {
  background: linear-gradient(to right, #7B4DBF, #A855F7);
  /* purple → bright purple */
}
```

### Color Opacity Standards

```css
/* Background opacities for glassmorphism */
--bg-glass-subtle: rgba(255, 255, 255, 0.02);    /* bg-white/[0.02] */
--bg-glass-light: rgba(255, 255, 255, 0.03);     /* bg-white/[0.03] */
--bg-glass-medium: rgba(255, 255, 255, 0.05);    /* bg-white/[0.05] */
--bg-glass-strong: rgba(255, 255, 255, 0.08);    /* bg-white/[0.08] */

/* Border opacities */
--border-subtle: rgba(255, 255, 255, 0.05);      /* border-white/[0.05] */
--border-medium: rgba(255, 255, 255, 0.08);      /* border-white/[0.08] */
--border-strong: rgba(255, 255, 255, 0.1);       /* border-white/[0.1] */

/* Colored backgrounds with opacity */
--bg-purple-subtle: rgba(139, 95, 199, 0.03);    /* purple/[0.03] */
--bg-purple-light: rgba(139, 95, 199, 0.1);      /* purple/10 */
--bg-purple-medium: rgba(139, 95, 199, 0.2);     /* purple/20 */

--bg-cyan-subtle: rgba(6, 182, 212, 0.1);        /* cyan-500/10 */
--bg-cyan-medium: rgba(6, 182, 212, 0.2);        /* cyan-500/20 */

--bg-amber-subtle: rgba(245, 158, 11, 0.1);      /* amber-500/10 */
--bg-amber-medium: rgba(245, 158, 11, 0.2);      /* amber-500/20 */
```

### Semantic Color Usage

| Element Type | Primary Color | Hover State | Active State |
|--------------|---------------|-------------|--------------|
| Standard/Latest | Cyan (#06b6d4) | Lighter cyan | Cyan glow |
| Premium/Prolix | Amber (#f59e0b) | Lighter amber | Amber glow |
| Historical | Gray (#6b7280) | Lighter gray | Subtle lift |
| Brand/Default | Purple (#7B4DBF) | Lighter purple | Purple glow |
| Emotional | Pink (#ec4899) | Lighter pink | Pink glow |
| World/Environment | Cyan/Teal | Lighter teal | Teal glow |

---

## Typography

### Font Stack

```css
/* Primary font (Geist Sans) */
font-family: var(--font-geist-sans), -apple-system, BlinkMacSystemFont,
             'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

/* Monospace font (Geist Mono) */
font-family: var(--font-geist-mono), 'SF Mono', Monaco, 'Cascadia Code',
             'Roboto Mono', Consolas, monospace;
```

### Type Scale

```css
/* Hero Titles - Used for main page headings */
.text-hero-xl {
  font-size: clamp(3rem, 8vw, 8rem);  /* ~text-5xl to text-8xl */
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
}

.text-hero-lg {
  font-size: clamp(2.5rem, 6vw, 6rem); /* ~text-4xl to text-6xl */
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

/* Section Titles */
.text-section {
  font-size: clamp(1.5rem, 3vw, 2.25rem); /* ~text-2xl to text-4xl */
  font-weight: 700;
  line-height: 1.2;
}

/* Card Titles */
.text-card-title {
  font-size: 1.5rem;  /* text-2xl */
  font-weight: 700;
  line-height: 1.3;
}

.text-card-title-sm {
  font-size: 1.125rem; /* text-lg */
  font-weight: 600;
  line-height: 1.4;
}

/* Body Text */
.text-body-lg {
  font-size: 1.25rem;  /* text-xl */
  font-weight: 400;
  line-height: 1.6;
  color: var(--gray-400);
}

.text-body {
  font-size: 1rem;     /* text-base */
  font-weight: 400;
  line-height: 1.6;
  color: var(--gray-400);
}

.text-body-sm {
  font-size: 0.875rem; /* text-sm */
  font-weight: 400;
  line-height: 1.5;
  color: var(--gray-500);
}

/* Labels and Badges */
.text-label {
  font-size: 0.75rem;  /* text-xs */
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* Version Numbers */
.text-version {
  font-family: var(--font-geist-mono);
  font-size: 0.875rem; /* text-sm */
  font-weight: 400;
}
```

### Gradient Text Implementation

```tsx
// Standard gradient text
<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-gradient">
  Gradient Text
</span>

// The animate-gradient class (defined in globals.css)
// Requires: background-size: 200% 200%;
@keyframes gradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient 6s ease infinite;
}
```

### Text Color Hierarchy

```
White (#ffffff, text-white)     → Primary headings, important content
Gray-300 (#d1d5db, text-gray-300) → Secondary headings, emphasized content
Gray-400 (#9ca3af, text-gray-400) → Body text, descriptions
Gray-500 (#6b7280, text-gray-500) → Tertiary text, metadata
Cyan-400 (#22d3ee, text-cyan-400) → Links, highlighted info
Purple-400 (#c084fc, text-purple-400) → Brand accents
Amber-400 (#fbbf24, text-amber-400) → Premium indicators
```

---

## Atmospheric Background Elements

### FloatingOrbs Component

The FloatingOrbs component creates ambient, slowly-moving gradient orbs that give depth to the page background.

```tsx
const FloatingOrbs = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
    {/* Primary Orb - Usually cyan/blue */}
    <motion.div
      animate={{
        x: [0, 80, 40, 0],      // Horizontal movement range
        y: [0, -40, 80, 0],     // Vertical movement range
        scale: [1, 1.15, 0.95, 1], // Subtle scale breathing
      }}
      transition={{
        duration: 18,           // Long duration for slow movement
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-600/15 rounded-full blur-[100px]"
    />

    {/* Secondary Orb - Usually purple */}
    <motion.div
      animate={{
        x: [0, -60, 30, 0],     // Different movement pattern
        y: [0, 60, -30, 0],
        scale: [1, 0.9, 1.1, 1],
      }}
      transition={{
        duration: 22,           // Different duration prevents sync
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[120px]"
    />

    {/* Tertiary Orb - Accent color */}
    <motion.div
      animate={{
        x: [0, 50, -50, 0],
        y: [0, -70, 40, 0],
        scale: [1, 1.2, 0.85, 1],
      }}
      transition={{
        duration: 25,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="absolute bottom-1/4 left-1/3 w-[450px] h-[450px] bg-blue-600/10 rounded-full blur-[100px]"
    />
  </div>
);
```

### Orb Configuration Guidelines

| Property | Standard Range | Purpose |
|----------|---------------|---------|
| Size | 400px - 700px | Larger = more ambient, smaller = more defined |
| Blur | 80px - 150px | Higher blur = softer, more atmospheric |
| Opacity | 10% - 20% | Keep subtle to not overpower content |
| Duration | 15s - 30s | Longer = more serene, shorter = more dynamic |
| Movement | 40px - 100px | Subtle movement, not distracting |

### Orb Placement Strategy

```
┌────────────────────────────────────────┐
│  ◯ Orb 1 (top-left quadrant)          │
│     - Primary color (cyan/blue)        │
│     - Largest size                     │
│                                        │
│                    ◯ Orb 2 (center-right)
│                       - Secondary color│
│                       - Medium size    │
│                                        │
│        ◯ Orb 3 (bottom-center)        │
│           - Accent color               │
│           - Smallest size              │
└────────────────────────────────────────┘
```

### Alternative: Static Gradient Background

For simpler pages or performance-sensitive contexts:

```tsx
<div className="fixed inset-0 -z-10">
  {/* Static gradient orbs */}
  <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-600/15 rounded-full blur-[100px]" />
  <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[120px]" />
  <div className="absolute bottom-1/4 left-1/3 w-[450px] h-[450px] bg-blue-600/10 rounded-full blur-[100px]" />
</div>
```

---

## Hero Section Patterns

### Standard Hero Structure

```tsx
const HeroSection = () => {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  // Parallax transforms
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 80]);

  return (
    <motion.section
      ref={heroRef}
      style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
      className="relative min-h-[60vh] flex items-center justify-center pt-12 pb-8"
    >
      <div className="container mx-auto px-4">
        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link href="/" className="group inline-flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors">
            <ArrowLeft className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
        </motion.div>

        {/* Hero Content */}
        <div className="text-center max-w-4xl mx-auto">
          {/* Floating Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-8"
          >
            <IconComponent className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-400">Badge Text</span>
          </motion.div>

          {/* Main Title - Stacked */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-6"
          >
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tight">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-gradient pb-2">
                First Line
              </span>
              <span className="block text-white/90 mt-2">
                Second Line
              </span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            Main description text goes here.
            <span className="block mt-2 text-gray-500">Secondary tagline.</span>
          </motion.p>

          {/* Stats Row (Optional) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex items-center justify-center gap-8 mt-10"
          >
            <StatItem value="42" label="Items" />
            <div className="w-px h-8 bg-gray-700" />
            <StatItem value="12" label="Categories" color="cyan" />
            <div className="w-px h-8 bg-gray-700" />
            <StatItem icon={<Sparkles />} label="Premium" color="purple" />
          </motion.div>
        </div>
      </div>

      {/* Decorative gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
    </motion.section>
  );
};
```

### Hero Animation Timing

```
Timeline:
0.0s - Back link fades in (duration: 0.5s)
0.1s - Badge fades in (duration: 0.6s)
0.2s - Title fades in (duration: 0.8s)
0.4s - Subtitle fades in (duration: 0.6s)
0.5s - Stats row fades in (duration: 0.6s)
```

### Title Variations

```tsx
// Variation 1: Stacked with gradient first line
<h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tight">
  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
    Gradient Line
  </span>
  <span className="block text-white/90 mt-2">
    White Line
  </span>
</h1>

// Variation 2: Single line with gradient
<h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 animate-gradient">
  Single Gradient Title
</h1>

// Variation 3: Mixed inline
<h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
  <span className="text-white">What is </span>
  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
    Lucid Loom
  </span>
  <span className="text-white">?</span>
</h1>
```

### Scroll Parallax Configuration

```tsx
// Standard parallax (hero fades out as you scroll)
const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 80]);

// Aggressive parallax (faster fade)
const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.9]);
const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 150]);

// Subtle parallax (slower fade)
const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
const heroScale = useTransform(scrollYProgress, [0, 0.7], [1, 0.98]);
const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 50]);
```

---

## Animation System

### RevealSection Component

Used to animate content into view as users scroll down the page.

```tsx
const RevealSection = ({
  children,
  className = "",
  delay = 0
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,          // Only animate once
    margin: "-80px"      // Trigger 80px before element enters viewport
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{
        duration: 0.7,
        ease: [0.25, 0.1, 0.25, 1],  // Custom easing (slow start, smooth end)
        delay
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
```

### FloatingCard Component

Adds a subtle floating animation to cards and containers.

```tsx
const FloatingCard = ({
  children,
  className = "",
  delay = 0
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number
}) => (
  <motion.div
    animate={{
      y: [0, -8, 0],           // Vertical float range
      rotate: [0, 0.5, -0.5, 0], // Subtle rotation
    }}
    transition={{
      duration: 4,             // Complete cycle duration
      repeat: Infinity,
      ease: "easeInOut",
      delay,                   // Stagger multiple floating cards
    }}
    className={className}
  >
    {children}
  </motion.div>
);
```

### Staggered List Animation

```tsx
// Parent container with stagger
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,  // Delay between each child
      delayChildren: 0.1      // Initial delay before first child
    }
  }
};

// Child items
const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

// Usage
<motion.div variants={containerVariants} initial="hidden" animate="visible">
  {items.map((item, index) => (
    <motion.div key={item.id} variants={itemVariants}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

### Shimmer Effect

A horizontal shimmer that sweeps across cards on hover.

```tsx
// Inside a card with group class
<div className="group relative overflow-hidden ...">
  {/* Shimmer overlay */}
  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
    <motion.div
      animate={{ x: ['-200%', '200%'] }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatDelay: 1  // Pause between sweeps
      }}
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12"
    />
  </div>

  {/* Card content */}
  <div className="relative z-10">
    ...
  </div>
</div>
```

### Glow Effect on Hover

```tsx
<div className="group relative ...">
  {/* Glow orb that appears on hover */}
  <div className="absolute -top-20 -right-20 w-60 h-60 bg-cyan-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

  {/* Content */}
  <div className="relative z-10">...</div>
</div>
```

### Icon Animation

```tsx
// Rotating wiggle animation
<motion.div
  className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10"
  animate={{ rotate: [0, 5, -5, 0] }}
  transition={{
    duration: 4,
    repeat: Infinity,
    repeatDelay: 2  // Pause between wiggles
  }}
>
  <IconComponent className="w-5 h-5 text-cyan-400" />
</motion.div>

// Pulsing scale animation (for "Latest" badges)
<motion.span
  animate={{ scale: [1, 1.05, 1] }}
  transition={{ duration: 2, repeat: Infinity }}
  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
>
  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
  Latest
</motion.span>
```

### Hover Transforms

```tsx
// Card lift on hover
<motion.div
  whileHover={{ scale: 1.01, y: -4 }}
  transition={{ duration: 0.3 }}
  className="..."
>

// Button scale
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="..."
>

// Horizontal slide (for list items)
<motion.div
  whileHover={{ x: 4 }}
  className="..."
>

// Icon container hover
<motion.a
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  className="..."
>
```

### Animation Easing Reference

```tsx
// Standard easing curves
ease: "easeInOut"        // Smooth start and end
ease: "easeOut"          // Fast start, slow end (good for entrances)
ease: "easeIn"           // Slow start, fast end (good for exits)
ease: [0.25, 0.1, 0.25, 1]  // Custom cubic-bezier (refined easeOut)

// Spring animations (for interactive elements)
transition: {
  type: "spring",
  stiffness: 50,     // Lower = more bouncy
  damping: 15        // Lower = more oscillation
}

// Layout animations
transition: {
  type: "spring",
  bounce: 0.2,
  duration: 0.6
}
```

---

## Glassmorphism Techniques

### Base Glass Card

```tsx
<div className="relative bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6 overflow-hidden">
  {/* Optional: Corner glow */}
  <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />

  {/* Content */}
  <div className="relative z-10">
    ...
  </div>
</div>
```

### Glass Card Variants

```css
/* Subtle glass (default) */
.glass-subtle {
  background: rgba(255, 255, 255, 0.02);    /* bg-white/[0.02] */
  backdrop-filter: blur(24px);               /* backdrop-blur-xl */
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1.5rem;                     /* rounded-3xl */
}

/* Medium glass */
.glass-medium {
  background: rgba(255, 255, 255, 0.03);    /* bg-white/[0.03] */
  backdrop-filter: blur(16px);               /* backdrop-blur-md */
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;                       /* rounded-2xl */
}

/* Strong glass (for emphasized cards) */
.glass-strong {
  background: rgba(255, 255, 255, 0.05);    /* bg-white/[0.05] */
  backdrop-filter: blur(24px);               /* backdrop-blur-xl */
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.5rem;                     /* rounded-3xl */
}

/* Colored glass (for featured items) */
.glass-cyan {
  background: linear-gradient(to bottom right,
    rgba(6, 182, 212, 0.1),
    rgba(59, 130, 246, 0.05),
    rgba(168, 85, 247, 0.1)
  );
  backdrop-filter: blur(24px);
  border: 2px solid rgba(6, 182, 212, 0.3);
  border-radius: 1.5rem;
}
```

### Hover State Enhancement

```tsx
// Card with enhanced hover
<div className="
  relative
  bg-white/[0.02]
  backdrop-blur-sm
  border border-white/[0.05]
  rounded-2xl
  p-5
  hover:bg-white/[0.04]
  hover:border-white/[0.08]
  transition-all
  duration-300
">
```

### Glass Container Hierarchy

```
┌─────────────────────────────────────────────────────┐
│ Page Background (#0a0a0a)                           │
│  ┌───────────────────────────────────────────────┐  │
│  │ Floating Orbs Layer (-z-10)                   │  │
│  │  ◯ ◯ ◯                                        │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │ Glass Container (bg-white/[0.02])             │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │ Glow Orb (absolute, blur-3xl)           │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │ Content (relative z-10)                 │  │  │
│  │  │  - Text                                 │  │  │
│  │  │  - Buttons                              │  │  │
│  │  │  - Icons                                │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Backdrop Blur Levels

| Class | Blur Amount | Use Case |
|-------|-------------|----------|
| `backdrop-blur-sm` | 4px | Subtle glass, historical items |
| `backdrop-blur` | 8px | Standard cards |
| `backdrop-blur-md` | 12px | Emphasized cards |
| `backdrop-blur-lg` | 16px | Modal backgrounds |
| `backdrop-blur-xl` | 24px | Primary containers, sidebars |
| `backdrop-blur-2xl` | 40px | Hero overlays |

---

## Component Library

### Featured Card (Latest Version)

```tsx
<motion.div
  className="group relative bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10 backdrop-blur-xl border-2 border-cyan-500/30 rounded-3xl p-6 lg:p-8 overflow-hidden"
  whileHover={{ scale: 1.01, y: -4 }}
  transition={{ duration: 0.3 }}
>
  {/* Animated shimmer */}
  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
    <motion.div
      animate={{ x: ['-200%', '200%'] }}
      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12"
    />
  </div>

  {/* Glow effect */}
  <div className="absolute -top-20 -right-20 w-60 h-60 bg-cyan-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

  <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
    <div className="flex-1 min-w-0">
      {/* Title row with version badge */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h3 className="text-2xl font-bold text-white">Card Title</h3>
        <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/10 text-sm font-mono text-gray-300">
          v1.0
        </span>
        <motion.span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/25"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Latest
        </motion.span>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
        <span className="flex items-center gap-2">
          <FileJson className="w-4 h-4 text-gray-500" />
          42.5 KB
        </span>
        <span className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          Dec 30, 2025
        </span>
      </div>
    </div>

    {/* Actions */}
    <div className="flex gap-3">
      <motion.button
        className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Download className="w-5 h-5" />
        Download
      </motion.button>
      <motion.a
        href="#"
        className="inline-flex items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Github className="w-5 h-5" />
      </motion.a>
    </div>
  </div>
</motion.div>
```

### Standard Card (Historical Item)

```tsx
<motion.div
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.3, delay: index * 0.03 }}
  className="group relative bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-2xl p-5 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300"
  whileHover={{ x: 4 }}
>
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <h3 className="text-lg font-semibold text-white">Item Title</h3>
        <span className="px-2 py-0.5 rounded bg-white/5 text-xs font-mono text-gray-400">
          v0.9
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1.5">
          <FileJson className="w-4 h-4" />
          38.2 KB
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          Dec 15, 2025
        </span>
      </div>
    </div>

    <div className="flex gap-2">
      <motion.button
        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Download</span>
      </motion.button>
      <motion.a
        href="#"
        className="inline-flex items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ExternalLink className="w-4 h-4" />
      </motion.a>
    </div>
  </div>
</motion.div>
```

### Sidebar Selection Item

```tsx
<motion.button
  onClick={() => handleSelect(item.name)}
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.3, delay: index * 0.05 }}
  className={`w-full group text-left px-4 py-3.5 rounded-2xl transition-all duration-300 relative overflow-hidden ${
    selected === item.name
      ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/10 border border-purple-500/30'
      : 'bg-white/[0.02] border border-transparent hover:bg-white/[0.05] hover:border-white/[0.05]'
  }`}
>
  {/* Active glow (only shown when selected) */}
  {selected === item.name && (
    <motion.div
      layoutId="activeItemGlow"
      className="absolute inset-0 bg-purple-500/5 blur-xl"
      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
    />
  )}

  <span className="relative z-10 flex items-center justify-between">
    <span className={`font-medium transition-colors ${
      selected === item.name ? 'text-white' : 'text-gray-400 group-hover:text-white'
    }`}>
      {item.name}
    </span>
    <ChevronRight className={`w-4 h-4 transition-all ${
      selected === item.name
        ? 'text-purple-400 translate-x-0'
        : 'text-gray-600 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
    }`} />
  </span>
</motion.button>
```

### Section Header with Icon

```tsx
<div className="flex items-center gap-3 mb-5">
  <motion.div
    className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/20"
    animate={{ rotate: [0, 5, -5, 0] }}
    transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
  >
    <Zap className="w-5 h-5 text-cyan-400" />
  </motion.div>
  <h2 className="text-xl font-bold text-white">Section Title</h2>
  {/* Optional badge */}
  <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-400">
    Badge
  </span>
</div>
```

### Floating Badge

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, delay: 0.1 }}
  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-8"
>
  <Settings className="w-4 h-4 text-cyan-400" />
  <span className="text-sm font-medium text-cyan-400">Badge Text</span>
</motion.div>
```

### Stats Item

```tsx
const StatItem = ({
  value,
  label,
  icon,
  color = "white"
}: {
  value?: string | number;
  label: string;
  icon?: React.ReactNode;
  color?: "white" | "cyan" | "purple" | "amber"
}) => {
  const colorClasses = {
    white: "text-white",
    cyan: "text-cyan-400",
    purple: "text-purple-400",
    amber: "text-amber-400"
  };

  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${colorClasses[color]} flex items-center justify-center gap-1`}>
        {icon || value}
      </div>
      <div className="text-xs text-gray-500 uppercase tracking-wider">{label}</div>
    </div>
  );
};

// Usage with dividers
<div className="flex items-center justify-center gap-8 mt-10">
  <StatItem value="42" label="Items" />
  <div className="w-px h-8 bg-gray-700" />
  <StatItem value="12" label="Categories" color="cyan" />
  <div className="w-px h-8 bg-gray-700" />
  <StatItem icon={<Sparkles className="w-5 h-5" />} label="Premium" color="purple" />
</div>
```

### Primary Button

```tsx
<motion.button
  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
  <Download className="w-5 h-5" />
  Download
</motion.button>
```

### Secondary Button

```tsx
<motion.button
  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all"
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
  <Download className="w-4 h-4" />
  Download
</motion.button>
```

### Icon Button

```tsx
<motion.a
  href="#"
  className="inline-flex items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  title="View on GitHub"
>
  <Github className="w-5 h-5" />
</motion.a>
```

---

## Icon System

### Lucide React Icons

We use [Lucide React](https://lucide.dev/) for all icons. Import only the icons you need:

```tsx
import {
  ArrowLeft,
  Download,
  Github,
  Clock,
  FileJson,
  Sparkles,
  Star,
  History,
  ChevronRight,
  // ... etc
} from 'lucide-react';
```

### Icon Sizing Standards

| Context | Size Class | Pixels |
|---------|-----------|--------|
| Inline with small text | `w-3 h-3` | 12px |
| Inline with body text | `w-4 h-4` | 16px |
| Button icons | `w-5 h-5` | 20px |
| Section header icons | `w-5 h-5` | 20px |
| Large decorative | `w-8 h-8` | 32px |
| Hero/empty state | `w-12 h-12` | 48px |

### Icon Container Patterns

```tsx
// Gradient background container
<div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/20">
  <Zap className="w-5 h-5 text-cyan-400" />
</div>

// Simple background container
<div className="p-2.5 rounded-xl bg-gray-500/10 border border-gray-500/20">
  <History className="w-5 h-5 text-gray-400" />
</div>

// Colored background container
<div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
  <Crown className="w-5 h-5 text-purple-400" />
</div>
```

### Semantic Icon Usage

| Purpose | Icon | Color |
|---------|------|-------|
| Back navigation | `ArrowLeft` | gray-400 → cyan-400 |
| Download action | `Download` | white (in button) |
| External link | `ExternalLink` | gray-400 → white |
| GitHub | `Github` | gray-400 → white |
| Time/Date | `Clock` | gray-500 |
| File size | `FileJson` | gray-500 |
| Premium/Featured | `Crown` | amber-400 |
| Latest version | `Zap` | cyan-400 |
| Historical | `History` | gray-400 or purple-400 |
| Selection indicator | `ChevronRight` | purple-400 |
| Sparkle/Magic | `Sparkles` | purple-400 |
| Star rating | `Star` | amber-400 |
| Settings/Config | `Settings` | cyan-400 |
| Layers/Stack | `Layers` | purple-400 |
| Package | `Package` | purple-400 |
| Archive | `Archive` | gray-400 |

---

## Layout Patterns

### Container Widths

```tsx
// Standard container
<div className="container mx-auto px-4">

// Max-width variations
<div className="max-w-4xl mx-auto">   // ~896px - text content
<div className="max-w-5xl mx-auto">   // ~1024px - medium content
<div className="max-w-6xl mx-auto">   // ~1152px - wide content
<div className="max-w-7xl mx-auto">   // ~1280px - full-width content
```

### Grid Systems

```tsx
// Sidebar + Content (3:9 ratio)
<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
  <div className="lg:col-span-3">Sidebar</div>
  <div className="lg:col-span-9">Main Content</div>
</div>

// Sidebar + Content (4:8 ratio)
<div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
  <div className="lg:col-span-1">Sidebar</div>
  <div className="lg:col-span-3">Main Content</div>
</div>

// Bento Grid (variable sizing)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div className="md:col-span-2">Large Item</div>
  <div>Small Item</div>
  <div>Small Item</div>
  <div className="lg:col-span-2">Medium Item</div>
</div>

// Equal columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

### Spacing Scale

```
gap-2  = 8px   - Tight spacing (button groups, inline items)
gap-3  = 12px  - Compact spacing (list items)
gap-4  = 16px  - Standard spacing (card content)
gap-6  = 24px  - Comfortable spacing (sections within cards)
gap-8  = 32px  - Generous spacing (major sections)
gap-12 = 48px  - Section breaks
gap-16 = 64px  - Major section breaks

p-4 = 16px padding
p-5 = 20px padding
p-6 = 24px padding (standard card padding)
p-8 = 32px padding (large card padding)

mb-4 = 16px margin bottom
mb-5 = 20px margin bottom
mb-6 = 24px margin bottom (after section headers)
mb-8 = 32px margin bottom (after major elements)
```

### Sticky Sidebar

```tsx
<div className="lg:sticky lg:top-24">
  <FloatingCard>
    <div className="relative bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6">
      {/* Sidebar content */}
    </div>
  </FloatingCard>
</div>
```

### Section Structure

```tsx
<section className="relative py-12">
  <div className="container mx-auto px-4">
    <RevealSection>
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/20">
          <IconComponent className="w-5 h-5 text-cyan-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Section Title</h2>
      </div>

      {/* Section Content */}
      <div className="space-y-3">
        {/* Items */}
      </div>
    </RevealSection>
  </div>
</section>
```

---

## Framer Motion Patterns

### Required Imports

```tsx
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useInView
} from 'framer-motion';
```

### Scroll-Linked Animation

```tsx
const heroRef = useRef(null);
const { scrollYProgress } = useScroll({
  target: heroRef,
  offset: ["start start", "end start"]  // When element enters/exits
});

// Transform scroll position to style values
const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
const y = useTransform(scrollYProgress, [0, 0.5], [0, 80]);

// Apply to element
<motion.section ref={heroRef} style={{ opacity, scale, y }}>
```

### useInView for Scroll Reveals

```tsx
const ref = useRef(null);
const isInView = useInView(ref, {
  once: true,       // Only trigger once
  margin: "-80px"   // Trigger 80px before element enters viewport
});

<motion.div
  ref={ref}
  initial={{ opacity: 0, y: 50 }}
  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
  transition={{ duration: 0.7 }}
>
```

### AnimatePresence for Conditional Content

```tsx
<AnimatePresence mode="wait">
  {condition === 'a' && (
    <motion.div
      key="state-a"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      Content A
    </motion.div>
  )}

  {condition === 'b' && (
    <motion.div
      key="state-b"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      Content B
    </motion.div>
  )}
</AnimatePresence>
```

### Layout Animations

```tsx
// Shared layout animation (e.g., active indicator moving between items)
{selected === item.id && (
  <motion.div
    layoutId="activeIndicator"
    className="absolute inset-0 bg-purple-500/10"
    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
  />
)}
```

### Infinite Animations

```tsx
// Floating animation
<motion.div
  animate={{
    y: [0, -8, 0],
    rotate: [0, 0.5, -0.5, 0],
  }}
  transition={{
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut",
  }}
>

// Pulsing animation
<motion.span
  animate={{ scale: [1, 1.05, 1] }}
  transition={{ duration: 2, repeat: Infinity }}
>

// Shimmer sweep
<motion.div
  animate={{ x: ['-200%', '200%'] }}
  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
  className="bg-gradient-to-r from-transparent via-white/5 to-transparent"
/>

// Rotating wiggle
<motion.div
  animate={{ rotate: [0, 5, -5, 0] }}
  transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
>

// Horizontal pointing animation
<motion.div
  animate={{ x: [-5, 5, -5] }}
  transition={{ duration: 2, repeat: Infinity }}
>
```

### Staggered Children

```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

<motion.div variants={containerVariants} initial="hidden" animate="visible">
  {items.map(item => (
    <motion.div key={item.id} variants={itemVariants}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

---

## CSS Utilities

### Defined in globals.css

```css
/* Animated gradient for text */
@keyframes gradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient 6s ease infinite;
}

/* Fade in from below */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in-up {
  animation: fadeInUp 0.5s ease-out;
}

/* Card hover effect */
.card-hover {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3),
              0 10px 10px -5px rgba(0, 0, 0, 0.2);
}

/* Glass effect utility */
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Glass card enhanced with hover */
.glass-card-enhanced {
  position: relative;
  overflow: hidden;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-card-enhanced::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(135deg,
    rgba(139, 95, 199, 0.1) 0%,
    rgba(0, 191, 255, 0.05) 50%,
    rgba(139, 95, 199, 0.1) 100%
  );
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;
}

.glass-card-enhanced:hover::before {
  opacity: 1;
}

.glass-card-enhanced:hover {
  transform: translateY(-4px);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.3),
    0 0 30px rgba(139, 95, 199, 0.1);
}

/* Section divider line */
.section-divider {
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    rgba(139, 95, 199, 0.5),
    rgba(0, 191, 255, 0.5),
    transparent
  );
  margin: 4rem 0;
}
```

### Tailwind Class Combinations

```css
/* Standard glass card */
.standard-glass-card = "relative bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6 overflow-hidden"

/* Featured glass card */
.featured-glass-card = "group relative bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10 backdrop-blur-xl border-2 border-cyan-500/30 rounded-3xl p-6 lg:p-8 overflow-hidden"

/* Historical item card */
.historical-card = "group relative bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-2xl p-5 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300"

/* Primary button */
.primary-button = "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"

/* Secondary button */
.secondary-button = "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all"

/* Icon button */
.icon-button = "inline-flex items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
```

---

## Responsive Design

### Breakpoint Strategy

```
sm: 640px   - Mobile landscape
md: 768px   - Tablet
lg: 1024px  - Desktop
xl: 1280px  - Large desktop
2xl: 1536px - Extra large screens
```

### Common Responsive Patterns

```tsx
// Typography scaling
className="text-5xl sm:text-6xl lg:text-8xl"

// Padding scaling
className="p-4 sm:p-6 lg:p-8"

// Grid collapsing
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Sidebar layout
className="grid grid-cols-1 lg:grid-cols-12 gap-8"
// Sidebar: lg:col-span-3
// Content: lg:col-span-9

// Flex direction change
className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"

// Show/hide elements
className="hidden sm:inline"  // Hidden on mobile
className="sm:hidden"         // Only on mobile

// Sticky only on desktop
className="lg:sticky lg:top-24"
```

### Mobile-First Considerations

1. **Cards**: Stack vertically on mobile, use horizontal layouts on desktop
2. **Buttons**: Full-width on mobile (`flex-1`), auto-width on desktop (`lg:flex-none`)
3. **Text**: Hide verbose labels on mobile, show icons only
4. **Padding**: Smaller padding on mobile (p-4), larger on desktop (lg:p-8)
5. **Sidebars**: Stack above content on mobile, sticky sidebar on desktop
6. **Hero text**: Scale dramatically from mobile to desktop

---

## Implementation Checklist

Use this checklist when creating a new page:

### Setup

- [ ] Create page file at `app/[page-name]/page.tsx`
- [ ] Create layout file with metadata at `app/[page-name]/layout.tsx`
- [ ] Add `'use client';` directive if using hooks/motion
- [ ] Import required Framer Motion hooks
- [ ] Import required Lucide icons

### Background Layer

- [ ] Add `FloatingOrbs` component (copy from template)
- [ ] Configure 3 orbs with different colors, sizes, and animation timings
- [ ] Ensure orbs have `-z-10` and `pointer-events-none`

### Hero Section

- [ ] Set up scroll-linked parallax with `useScroll` and `useTransform`
- [ ] Add back link with `ArrowLeft` icon
- [ ] Add floating badge with relevant icon
- [ ] Create stacked title with gradient text
- [ ] Add subtitle with secondary tagline
- [ ] Add stats row if applicable
- [ ] Add bottom gradient line divider

### Content Sections

- [ ] Wrap major sections with `RevealSection`
- [ ] Add section headers with animated icon containers
- [ ] Use appropriate card variant (featured vs standard)
- [ ] Add shimmer and glow effects to featured cards
- [ ] Implement staggered animations for list items
- [ ] Use `AnimatePresence` for conditional content

### Cards and Components

- [ ] Featured cards have gradient backgrounds and border
- [ ] All cards have `overflow-hidden` for effects
- [ ] Add glow orbs positioned in corners
- [ ] Implement shimmer sweep animation
- [ ] Add hover transforms (`whileHover`, `whileTap`)

### Interactivity

- [ ] Sidebar items have active state with `layoutId` animation
- [ ] Buttons have scale animations on hover/tap
- [ ] Links have color transitions
- [ ] Loading states have spinner component

### Responsive

- [ ] Test at mobile (375px), tablet (768px), desktop (1024px+)
- [ ] Ensure grids collapse appropriately
- [ ] Check button layouts on mobile
- [ ] Verify text is readable at all sizes
- [ ] Test sticky sidebar behavior

### Polish

- [ ] All animations have appropriate durations (not too fast/slow)
- [ ] Colors match the brand palette
- [ ] Spacing is consistent with design system
- [ ] Icons are appropriately sized
- [ ] No layout shifts during animations

### Performance

- [ ] Only import needed Lucide icons
- [ ] Use `once: true` for scroll-triggered animations
- [ ] Avoid animating expensive properties (width, height)
- [ ] Test with React Developer Tools Profiler

---

## Quick Reference Templates

### Minimal Page Template

```tsx
'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { ArrowLeft, /* other icons */ } from 'lucide-react';

// FloatingOrbs component
const FloatingOrbs = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
    <motion.div
      animate={{ x: [0, 80, 40, 0], y: [0, -40, 80, 0], scale: [1, 1.15, 0.95, 1] }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-600/15 rounded-full blur-[100px]"
    />
    <motion.div
      animate={{ x: [0, -60, 30, 0], y: [0, 60, -30, 0], scale: [1, 0.9, 1.1, 1] }}
      transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[120px]"
    />
  </div>
);

// RevealSection component
const RevealSection = ({ children, className = "", delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default function PageName() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 80]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <FloatingOrbs />

      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="relative min-h-[60vh] flex items-center justify-center pt-12 pb-8"
      >
        <div className="container mx-auto px-4">
          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Link href="/" className="group inline-flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors">
              <ArrowLeft className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Home</span>
            </Link>
          </motion.div>

          {/* Title */}
          <div className="text-center max-w-4xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tight"
            >
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-gradient">
                Page Title
              </span>
            </motion.h1>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      </motion.section>

      {/* Content Sections */}
      <section className="relative py-12">
        <div className="container mx-auto px-4">
          <RevealSection>
            {/* Content here */}
          </RevealSection>
        </div>
      </section>
    </div>
  );
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Dec 30, 2025 | Initial design system documentation |

---

*This document should be updated whenever new patterns are established or existing patterns are modified.*
