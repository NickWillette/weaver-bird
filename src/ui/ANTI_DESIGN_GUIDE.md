# Minecraft Anti-Design Style Guide

## Philosophy

Our design system embraces **anti-design** principles inspired by punk aesthetics, street art, and Minecraft's blocky charm. We reject sterile perfection in favor of playful imperfection, heavy shadows, asymmetry, and raw energy.

### Core Principles

1. **Imperfect by Design** - Asymmetric borders, tilted elements, hand-drawn feel
2. **Bold & Heavy** - Thick borders, offset shadows, high contrast
3. **Playful Motion** - Spring animations, gentle rotations, interactive feedback
4. **Texture & Grit** - Halftone dots, gradients, layered patterns
5. **Punk Color Palette** - Black, white, red, gray with vibrant accents

---

## Color System

### Primary Colors

```scss
--color-ink: #0a0a0a;           // Pure black for borders, text
--color-primary: #ff3344;        // Punk red for CTAs
--color-bg: #e8e8e8;             // Light gray background
--color-block: #f5f5f5;          // Off-white for cards
```

### Usage Guidelines

- **High Contrast**: Always ensure text is readable (black on white/gray)
- **Accent Colors**: Use emerald, gold, berry sparingly for highlights
- **Borders**: Always use `--color-ink` for maximum contrast
- **Backgrounds**: Prefer gray tones over pure white

---

## Typography

### Font Stack

```scss
--font-family: "Macs Minecraft", "Pixelify Sans", "VT323", "Courier New", monospace;
```

### Type Scale

- **Headings**: ALL CAPS with generous letter-spacing (0.08em - 0.12em)
- **Body Text**: Can be uppercase or mixed case
- **Small Text**: Still readable at 0.65rem minimum

### Best Practices

```scss
// ✅ Good - Bold, uppercase, spaced
.heading {
    font-size: var(--font-size-2xl);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    @include text-shadow-bold;
}

// ❌ Avoid - Too refined, lowercase, tight spacing
.heading {
    font-size: 1.8rem;
    letter-spacing: normal;
    font-weight: 300;
}
```

---

## Layout & Spacing

### Grid Systems

Use CSS Grid for complex layouts. Flexbox for simple flows.

```scss
// Card grid example
.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--spacing-lg);
}
```

### Spacing Scale

- `--spacing-xs`: 0.25rem (4px) - Tight gaps
- `--spacing-sm`: 0.5rem (8px) - Default gap
- `--spacing-md`: 1rem (16px) - Element padding
- `--spacing-lg`: 1.5rem (24px) - Card gaps
- `--spacing-xl`: 2rem (32px) - Section spacing
- `--spacing-2xl`: 3rem (48px) - Page sections

---

## Shadows

Our shadows are **offset box-shadows**, not soft blurs.

### Shadow Scale

```scss
@include shadow-sm;   // 3px 3px 0    - Badges
@include shadow-md;   // 6px 6px 0    - Buttons
@include shadow-lg;   // 10px 10px 0  - Cards
@include shadow-xl;   // 14px 14px 0  - Hover states
```

### Interactive Shadow Pattern

```scss
.interactiveElement {
    @include shadow-lg;
    transition: box-shadow 240ms var(--spring-bezier);

    &:hover {
        @include shadow-xl;
        translate: 0 -4px;
    }

    &:active {
        @include shadow-sm;
        translate: 0 2px;
    }
}
```

---

## Border Radius

**Asymmetric** is key. No uniform border-radius.

### Quirky Radius Tokens

```scss
// ✅ Good - Asymmetric, playful
@include radius-quirky-sm;  // 0.4rem 1rem 0.4rem 0.4rem
@include radius-quirky-md;  // 1rem 0.4rem 1.2rem 0.4rem
@include radius-quirky-lg;  // 1.6rem 1.6rem 2.3rem 0.4rem

// ❌ Avoid - Uniform, boring
border-radius: 0.5rem;
border-radius: 50%;
```

### Alternating Pattern

```scss
.metaItem {
    @include radius-alternating;
    
    // First child:  0.4rem 1rem 0.4rem 0.4rem
    // Second child: 1rem 0.4rem 0.4rem 0.4rem
    // Repeats...
}
```

---

## Rotations

Subtle tilts make elements feel hand-placed.

### Rotation Scale

```scss
@include rotate-slight;    // -0.3deg  - Default state
@include rotate-mild;      // -2deg    - Active state  
@include rotate-moderate;  // 3deg     - Badges
@include rotate-strong;    // 4deg     - Decorative layers
```

### Interactive Pattern

```scss
.card {
    @include rotate-slight;
    transition: rotate 240ms var(--spring-bezier);

    &:hover {
        rotate: 0deg;  // Straightens on hover
    }
}
```

### Alternating Lists

```scss
.badge {
    @include rotate-badge;
    
    // Alternates: -4deg, 3deg, -4deg, 3deg...
}
```

---

## Patterns & Textures

### Halftone Dots

Street art/punk aesthetic with dot patterns.

```scss
// Subtle overlay on cards
&::after {
    @include pattern-halftone-sm;
    opacity: 0.25;
    mix-blend-mode: soft-light;
}

// Body background
body {
    @include pattern-halftone-lg;
}
```

### Diagonal Stripes

```scss
.iconFrame {
    @include pattern-stripes-diagonal;
    background-color: rgb(255 255 255 / 85%);
}
```

### Glossy Gradients

```scss
.card {
    background:
        linear-gradient(/* @include gradient-glossy pattern */),
        var(--color-block);
}
```

---

## Animation Easing

### Spring Bezier (Default)

```scss
--spring-bezier: cubic-bezier(0.2, 0.85, 0.35, 1.3);
```

Overshoots slightly for playful, bouncy feel.

### When to Use

- ✅ Hover states (rotate, translate, scale)
- ✅ Shadow transitions
- ✅ Interactive feedback
- ❌ Long animations (use smooth-bezier)
- ❌ Fade ins/outs (too bouncy)

### Animation Durations

```scss
$duration-fast: 120ms;    // Quick feedback
$duration-normal: 180ms;  // Default interactions
$duration-slow: 240ms;    // Hover states, cards
```

---

## Component Anatomy

### Standard Card Structure

```scss
.card {
    // Layout
    display: grid;
    padding: var(--spacing-lg);
    gap: var(--spacing-md);
    
    // Shape
    @include border-standard;
    @include radius-quirky-lg;
    
    // Shadow & Motion
    @include shadow-lg;
    @include rotate-slight;
    
    // Background (layered)
    background:
        linear-gradient(/* glossy overlay */),
        var(--color-block);
    
    // Decorative accent layer
    &::before {
        content: "";
        position: absolute;
        inset: -25%;
        @include gradient-accent-band;
        opacity: 0.7;
        mix-blend-mode: multiply;
        z-index: -2;
    }
    
    // Texture overlay
    &::after {
        content: "";
        position: absolute;
        inset: 0;
        @include pattern-halftone-sm;
        z-index: -1;
    }
    
    // Interaction
    &:hover {
        @include shadow-xl;
        rotate: 0deg;
        translate: 0 -4px;
    }
}
```

### Button Structure

```scss
.button {
    // Typography
    font-family: var(--font-family);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    
    // Shape
    @include border-standard;
    @include radius-quirky-sm;
    
    // Style
    background: var(--color-primary);
    color: white;
    padding: var(--spacing-sm) var(--spacing-md);
    
    // Shadow & Motion
    @include shadow-md;
    @include rotate-slight;
    
    &:hover {
        @include shadow-xl;
        rotate: 0deg;
        translate: 0 -2px;
    }
    
    &:active {
        @include shadow-sm;
        rotate: var(--rotate-mild);
        translate: 0 2px;
    }
}
```

---

## Layering & Z-Index

### Layer Stack (from back to front)

1. **Background patterns** (`z-index: -2`) - Accent bands, decorative layers
2. **Texture overlays** (`z-index: -1`) - Halftone dots, noise
3. **Base content** (`z-index: auto`) - Main card content
4. **Interactive elements** (`z-index: 1`) - Buttons, links
5. **Overlays** (`z-index: 10`) - Tooltips, dropdowns
6. **Modals** (`z-index: 100`) - Dialogs, alerts

### Isolation

Always use `isolation: isolate` on containers with pseudo-element backgrounds:

```scss
.card {
    position: relative;
    isolation: isolate;  // Creates stacking context
    
    &::before {
        z-index: -2;  // Now relative to .card, not page
    }
}
```

---

## Mix Blend Modes

### Multiply (Most Common)

```scss
&::before {
    background: linear-gradient(/* accent color */);
    mix-blend-mode: multiply;
    opacity: 0.7;
}
```

Creates darker, saturated overlays.

### Soft Light

```scss
&::after {
    @include pattern-halftone-sm;
    mix-blend-mode: soft-light;
    opacity: 0.25;
}
```

Subtle texture that respects underlying colors.

---

## Modern CSS Features We Use

### CSS Grid

```scss
.cardGrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--spacing-lg);
}
```

### `rotate`, `translate`, `scale` Properties

```scss
// ✅ Modern - Better performance
.element {
    rotate: -2deg;
    translate: 0 -4px;
    scale: 1.05;
}

// ❌ Old way
.element {
    transform: rotate(-2deg) translateY(-4px) scale(1.05);
}
```

### CSS Custom Properties (CSS Variables)

```scss
.card {
    --accent-color: var(--color-emerald);
    border-left: 4px solid var(--accent-color);
}
```

### `inset` Shorthand

```scss
// ✅ Modern
.overlay {
    inset: 0;  // top, right, bottom, left
}

// ❌ Old way
.overlay {
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
}
```

### Modern Color Syntax

```scss
// ✅ Modern - rgb with alpha
background: rgb(255 255 255 / 60%);
box-shadow: 3px 3px 0 rgb(0 0 0 / 45%);

// ❌ Old way
background: rgba(255, 255, 255, 0.6);
box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.45);
```

---

## Accessibility Considerations

### Contrast

- Always test text contrast (WCAG AA minimum: 4.5:1)
- Our black-on-gray palette naturally provides good contrast
- Avoid red text on gray (use black or white)

### Motion

```scss
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}
```

### Focus States

```scss
button:focus-visible {
    outline: 3px solid var(--color-primary);
    outline-offset: 4px;
}
```

---

## SCSS Module Best Practices

### Import Tokens

```scss
@use "@/ui/tokens" as tokens;

.myComponent {
    @include tokens.shadow-lg;
    @include tokens.rotate-interactive;
    @include tokens.radius-quirky-md;
}
```

### Avoid Global Styles

Use CSS Modules (`.module.scss`) to scope styles:

```tsx
import s from "./MyComponent.module.scss";

<div className={s.card}>...</div>
```

### Compose Mixins

```scss
@mixin interactive-card {
    @include tokens.border-standard;
    @include tokens.radius-quirky-lg;
    @include tokens.shadow-lg;
    @include tokens.rotate-interactive;
    
    background: var(--color-block);
    padding: var(--spacing-lg);
}

.card {
    @include interactive-card;
}
```

---

## Common Patterns

### Icon Frame

```scss
.iconFrame {
    @include border-dashed;
    @include radius-icon-frame;
    @include rotate-moderate;
    @include pattern-stripes-diagonal;
    
    padding: 0.4rem;
    background-color: rgb(255 255 255 / 85%);
    box-shadow: inset 0 0 0 2px rgb(0 0 0 / 5%);
    
    img {
        border-radius: 0.7rem;
        image-rendering: pixelated;
    }
}
```

### Badge

```scss
.badge {
    @include rotate-badge;
    @include shadow-badge;
    
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    background: var(--color-ink);
    color: var(--color-bg);
    padding: 0.2rem 0.5rem;
    border-radius: var(--radius-sm);
}
```

### Description Box

```scss
.description {
    @include border-left-accent;
    @include shadow-inset;
    
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: rgb(255 255 255 / 40%);
    padding: 0.35rem 0.5rem;
}
```

### Metadata Item

```scss
.metaItem {
    @include radius-alternating;
    @include shadow-meta;
    
    background: var(--accent-color);
    color: var(--color-bg);
    padding: 0.3rem 0.6rem;
    rotate: -2deg;
    text-transform: uppercase;
    
    &:nth-child(2n) {
        rotate: 3deg;
    }
}
```

---

## Anti-Patterns (What to Avoid)

### ❌ Don't: Soft Shadows

```scss
// Too smooth and refined
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
```

### ❌ Don't: Uniform Border Radius

```scss
// Boring and generic
border-radius: 0.5rem;
```

### ❌ Don't: Centered Everything

```scss
// Too balanced, lacks energy
text-align: center;
display: flex;
justify-content: center;
align-items: center;
```

### ❌ Don't: Thin Borders

```scss
// Too delicate for our style
border: 1px solid #ccc;
```

### ❌ Don't: Minimal Spacing

```scss
// Feels cramped
padding: 4px;
gap: 2px;
```

---

## Checklist for New Components

- [ ] Uses asymmetric border-radius (`@include radius-quirky-*`)
- [ ] Has offset box-shadow (`@include shadow-*`)
- [ ] Includes subtle rotation (`@include rotate-*`)
- [ ] Text is uppercase with letter-spacing
- [ ] Heavy 3px borders (`@include border-standard`)
- [ ] Interactive elements have spring animation
- [ ] Texture/pattern overlay (halftone, stripes, etc.)
- [ ] High contrast colors (black borders on gray/white)
- [ ] Proper z-index and isolation for layers
- [ ] Hover state increases shadow and reduces rotation

---

## Resources

- **Token Reference**: `/src/ui/tokens/`
- **Storybook**: Design System > Tokens & Patterns
- **Example Component**: `ResourcePackCard` - Demonstrates all principles
- **Color Palette**: See `/src/app.css` `:root` variables

---

**Remember**: Embrace imperfection. Make it punk. Make it playful. 🎸
