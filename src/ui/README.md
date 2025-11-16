# Design Tokens

**Minecraft Anti-Design System** - Reusable SCSS mixins, patterns, and design guidelines for building punk-aesthetic UI components.

---

## 📁 Structure

```
ui/tokens/
├── _shadows.scss          # Offset shadow mixins
├── _animations.scss       # Spring animations & keyframes
├── _patterns.scss         # Halftone, gradients, textures
├── _rotations.scss        # Playful tilt mixins
├── _borders.scss          # Asymmetric radius & border styles
├── index.scss             # Main export (imports all tokens)
├── Tokens.stories.tsx     # Storybook: Shadow, rotation, border demos
├── TokenShowcase.module.scss
├── Patterns.stories.tsx   # Storybook: Pattern & gradient demos
├── PatternShowcase.module.scss
```

---

## 🚀 Quick Start

### Import Tokens in Your Component

```scss
// MyComponent.module.scss
@use "@/ui/tokens" as tokens;

.card {
    @include tokens.shadow-lg;
    @include tokens.rotate-interactive;
    @include tokens.radius-quirky-md;
    @include tokens.border-standard;
}
```

### Available Token Categories

| Category | File | Mixins |
|----------|------|--------|
| **Shadows** | `_shadows.scss` | `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-inset`, `text-shadow-bold` |
| **Rotations** | `_rotations.scss` | `rotate-slight`, `rotate-mild`, `rotate-moderate`, `rotate-strong`, `rotate-interactive` |
| **Borders** | `_borders.scss` | `border-standard`, `border-dashed`, `radius-quirky-sm/md/lg`, `border-left-accent` |
| **Patterns** | `_patterns.scss` | `pattern-halftone-sm/md/lg`, `pattern-stripes-diagonal`, `gradient-glossy`, `gradient-punk-red` |
| **Animations** | `_animations.scss` | `float`, `wiggle`, `pulse`, `shake`, `bounce-in`, `fade-in-up`, `interactive-hover` |

---

## 📖 Documentation

### 1. **ANTI_DESIGN_GUIDE.md**
Complete style guide covering:
- Philosophy & core principles
- Color system & typography
- Layout & spacing
- Component anatomy patterns
- Modern CSS features we use
- Accessibility considerations
- Common patterns & anti-patterns

**Start here** if you're building new components.

### 2. **SHADCN_INTEGRATION_GUIDE.md**
How to adapt shadcn/ui components:
- Why we use shadcn as reference (accessibility, structure)
- Step-by-step adaptation process
- Component checklist
- Example: Button, Dialog/Modal
- What to keep vs. what to change

**Use this** when adding new component types from shadcn.

### 3. **Storybook**
Visual documentation of all tokens in action:
- **Design System > Tokens** - Shadows, rotations, borders, animations
- **Design System > Patterns** - Halftone, stripes, gradients, complex layers

Run Storybook: `npm run storybook`

---

## 🎨 Design Principles

### Anti-Design Aesthetic

1. **Asymmetric** - No uniform border-radius, playful tilts
2. **Heavy** - 3px borders, offset shadows (not soft blur)
3. **Playful** - Spring animations, rotations, high contrast
4. **Textured** - Halftone dots, gradients, layered patterns
5. **Punk** - Black/white/red/gray palette, uppercase text

### Example: Interactive Card

```scss
@use "@/ui/tokens" as tokens;

.card {
    // Shape
    @include tokens.border-standard;
    @include tokens.radius-quirky-lg;

    // Depth
    @include tokens.shadow-lg;
    @include tokens.rotate-slight;

    // Style
    padding: var(--spacing-lg);
    background: var(--color-block);

    // Motion
    transition:
        rotate 240ms var(--spring-bezier),
        translate 240ms var(--spring-bezier),
        box-shadow 240ms var(--spring-bezier);

    &:hover {
        @include tokens.shadow-xl;
        rotate: 0deg;
        translate: 0 -4px;
    }
}
```

---

## 🧩 Token Reference

### Shadows

```scss
@include tokens.shadow-sm;   // 3px 3px 0 - Badges, small elements
@include tokens.shadow-md;   // 6px 6px 0 - Buttons, inputs
@include tokens.shadow-lg;   // 10px 10px 0 - Cards, panels
@include tokens.shadow-xl;   // 14px 14px 0 - Hover states
```

### Rotations

```scss
@include tokens.rotate-slight;    // -0.3deg - Default state
@include tokens.rotate-mild;      // -2deg - Active state
@include tokens.rotate-moderate;  // 3deg - Badges
@include tokens.rotate-interactive; // Straightens on hover
```

### Border Radius

```scss
@include tokens.radius-quirky-sm;  // 0.4rem 1rem 0.4rem 0.4rem - Buttons
@include tokens.radius-quirky-md;  // 1rem 0.4rem 1.2rem 0.4rem - Inputs
@include tokens.radius-quirky-lg;  // 1.6rem 1.6rem 2.3rem 0.4rem - Cards
```

### Patterns

```scss
@include tokens.pattern-halftone-sm;      // Subtle dots - Card overlays
@include tokens.pattern-halftone-lg;      // Body background
@include tokens.pattern-stripes-diagonal; // Icon frames
@include tokens.gradient-glossy;          // Card shine
@include tokens.gradient-punk-red;        // CTA buttons
```

### Animations

```scss
@include tokens.float;        // Gentle up/down motion
@include tokens.pulse;        // Scale breathing
@include tokens.wiggle;       // Rotation wiggle (triggered)
@include tokens.shake;        // Error shake (triggered)
@include tokens.bounce-in;    // Enter animation
```

---

## 🛠️ Usage Examples

### Button Component

```scss
@use "@/ui/tokens" as tokens;

.button {
    @include tokens.border-standard;
    @include tokens.radius-quirky-sm;
    @include tokens.shadow-md;
    @include tokens.rotate-slight;

    font-family: var(--font-family);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-primary);
    color: white;

    transition:
        rotate 180ms var(--spring-bezier),
        box-shadow 180ms var(--spring-bezier);

    &:hover {
        @include tokens.shadow-xl;
        rotate: 0deg;
    }
}
```

### Badge Component

```scss
@use "@/ui/tokens" as tokens;

.badge {
    @include tokens.rotate-badge;       // Alternating rotations
    @include tokens.shadow-badge;       // Semi-transparent shadow

    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    background: var(--color-ink);
    color: var(--color-bg);
    padding: 0.2rem 0.5rem;
    border-radius: var(--radius-sm);
}
```

### Icon Frame

```scss
@use "@/ui/tokens" as tokens;

.iconFrame {
    @include tokens.border-dashed;
    @include tokens.radius-icon-frame;
    @include tokens.rotate-moderate;
    @include tokens.pattern-stripes-diagonal;

    padding: 0.4rem;
    background-color: rgb(255 255 255 / 85%);
    display: grid;
    place-items: center;

    img {
        border-radius: 0.7rem;
        image-rendering: pixelated;
    }
}
```

### Complex Layered Card

```scss
@use "@/ui/tokens" as tokens;

.complexCard {
    @include tokens.border-standard;
    @include tokens.radius-quirky-lg;
    @include tokens.shadow-lg;
    @include tokens.rotate-slight;

    position: relative;
    padding: var(--spacing-xl);
    background:
        linear-gradient(/* glossy overlay */),
        var(--color-block);
    overflow: clip;
    isolation: isolate;

    // Accent band decoration
    &::before {
        content: "";
        position: absolute;
        inset: -25%;
        @include tokens.gradient-accent-band(var(--color-primary));
        rotate: 4deg;
        z-index: -2;
        mask: radial-gradient(circle at 75% 10%, #000 55%, transparent 60%);
    }

    // Halftone texture
    &::after {
        content: "";
        position: absolute;
        inset: 0;
        @include tokens.pattern-halftone-sm;
        z-index: -1;
    }

    &:hover {
        @include tokens.shadow-xl;
        rotate: 0deg;
        translate: 0 -4px;
    }
}
```

---

## 🎯 Best Practices

### ✅ Do

- Import tokens: `@use "@/ui/tokens" as tokens;`
- Use SCSS modules (`.module.scss`)
- Combine multiple tokens for rich effects
- Add spring animations (`var(--spring-bezier)`)
- Use uppercase text with letter-spacing
- Test hover/active/disabled states

### ❌ Don't

- Use soft blur shadows (`box-shadow: 0 4px 12px rgba(...)`)
- Use uniform border-radius (`border-radius: 0.5rem`)
- Use thin borders (`border: 1px solid`)
- Skip accessibility (focus states, ARIA)
- Over-center everything (embrace asymmetry)

---

## 📦 Component Development Workflow

### 1. Research (Optional)
If adapting from shadcn:
```bash
npx shadcn@latest add button
```

### 2. Create Component Files
```bash
mkdir -p src/ui/components/MyComponent
touch src/ui/components/MyComponent/MyComponent.tsx
touch src/ui/components/MyComponent/MyComponent.module.scss
touch src/ui/components/MyComponent/MyComponent.stories.tsx
```

### 3. Build Component
- Import design tokens
- Apply anti-design styling
- Maintain accessibility
- Create variants as needed

### 4. Document in Storybook
- Show all variants
- Interactive controls
- Accessibility notes

### 5. Cleanup
```bash
rm src/components/ui/button.tsx  # Delete shadcn reference
```

---

## 🔗 Related Files

- **Global CSS Variables**: `/src/app.css` (color palette, spacing, typography)
- **Example Component**: `/src/ui/components/cards/ResourcePackCard/` (demonstrates all principles)
- **Storybook Config**: `/.storybook/`

---

## 🤝 Contributing

When adding new tokens:

1. Add mixin to appropriate `_*.scss` file
2. Update Storybook stories to showcase it
3. Document in `ANTI_DESIGN_GUIDE.md`
4. Add usage example in this README
5. Test in real component

---

## 💡 Tips

- **Visual Reference**: Check Storybook for live examples
- **Copy Patterns**: ResourcePackCard is the gold standard
- **Start Simple**: Button → Badge → Card → Complex components
- **Test Dark Mode**: Check `[data-theme="dark"]` styles
- **Accessibility**: Run basic keyboard/screen reader tests

---

**Questions?** Check the guides:
- Style questions → `ANTI_DESIGN_GUIDE.md`
- Component adaptation → `SHADCN_INTEGRATION_GUIDE.md`
- Visual examples → Storybook (`npm run storybook`)

**Make it punk. Make it playful. 🎸**
