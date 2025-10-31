# Framer Motion Animation Fixes

## Issues Identified

The site was experiencing flashing animations due to several conflicting issues:

1. **CSS Transition Conflicts**: The global CSS wildcard selector `*` was applying transitions to ALL elements, including those controlled by Framer Motion, causing competing animations.

2. **Category Button Re-animations**: Category selection buttons were using both `initial` and `animate` props on already-rendered elements, causing them to re-animate on every state change (including when selected state changed).

3. **Missing Layout Prop**: Framer Motion elements that change position needed the `layout` prop to prevent position flashing.

## Fixes Applied

### 1. Global CSS (`app/globals.css`)

**Before:**
```css
* {
  transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}
```

**After:**
```css
*:not([data-framer-motion]) {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}
```

**Changes:**
- Excluded elements with `data-framer-motion` attribute from global transitions
- Removed `opacity`, `box-shadow`, and `transform` from the transition properties to prevent conflicts with Framer Motion animations

### 2. Character Cards Page (`app/character-cards/page.tsx`)

**Category Button Changes:**
- Removed `transition-all` class from buttons (was conflicting with Framer Motion)
- Added `layout` prop to enable smooth position transitions
- Kept `initial` and `animate` for mount animations (these only run once)

**Before:**
```tsx
className={`... transition-all ...`}
```

**After:**
```tsx
className={`... (no transition-all) ...`}
layout
```

### 3. Chat Presets Page (`app/chat-presets/page.tsx`)

**Category Button Changes:**
- Same fixes as character-cards page
- Removed `transition-all` class from preset selection buttons
- Added `layout` prop for smooth transitions

### 4. Pages Without Issues

**World Books Page (`app/world-books/page.tsx`):**
- No Framer Motion animations used, so no changes needed
- Already working correctly with standard CSS transitions

**Extensions Page (`app/extensions/page.tsx`):**
- No Framer Motion animations used, so no changes needed
- Already working correctly with standard CSS transitions

## Why These Fixes Work

1. **Preventing Double Animations**: By excluding Framer Motion elements from global CSS transitions, we prevent CSS and Framer Motion from fighting over the same properties.

2. **Layout Prop**: The `layout` prop tells Framer Motion to animate layout changes smoothly using FLIP technique (First, Last, Invert, Play), preventing flashing when elements change position.

3. **Reduced Transition Properties**: Only applying CSS transitions to color/background properties reduces interference with Framer Motion's transform and opacity animations.

## Testing Recommendations

1. **Category Selection**: Click through different categories on character-cards and chat-presets pages - buttons should smoothly highlight without flashing.

2. **Content Loading**: When switching categories, the content area should fade smoothly without multiple flashes.

3. **Hover States**: All hover animations should remain smooth and responsive.

4. **Page Load**: Initial page load animations should play once without repeating.

## Future Best Practices

1. **Separate Concerns**: Use Framer Motion for complex animations (mount/unmount, layout changes, gestures) and CSS for simple state changes (hover, focus).

2. **Avoid Global Wildcards**: Be cautious with `*` selectors that apply transitions - they can interfere with JavaScript-based animations.

3. **Layout Prop**: Always add `layout` to Framer Motion elements that might change position or size.

4. **Data Attributes**: Use `data-*` attributes to exclude specific elements from global styles when needed.
