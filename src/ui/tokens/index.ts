/**
 * Design Token Exports
 *
 * This file is for TypeScript/React utilities related to tokens.
 * For SCSS mixins, import from './index.scss' in your SCSS files.
 *
 * Usage in TS/TSX:
 * import { tokenDocs } from '@/ui/tokens';
 */

// Export documentation links for easy reference
export const tokenDocs = {
  antiDesignGuide: '/src/ui/tokens/ANTI_DESIGN_GUIDE.md',
  shadcnGuide: '/src/ui/tokens/SHADCN_INTEGRATION_GUIDE.md',
  readme: '/src/ui/tokens/README.md',
  storybook: {
    tokens: 'Design System/Tokens',
    patterns: 'Design System/Patterns',
  },
} as const;

// CSS variable names for runtime access
export const cssVars = {
  // Colors
  colorInk: '--color-ink',
  colorPrimary: '--color-primary',
  colorBg: '--color-bg',
  colorBlock: '--color-block',
  colorText: '--color-text',
  colorEmerald: '--color-emerald',
  colorGold: '--color-gold',
  colorBerry: '--color-berry',

  // Spacing
  spacingXs: '--spacing-xs',
  spacingSm: '--spacing-sm',
  spacingMd: '--spacing-md',
  spacingLg: '--spacing-lg',
  spacingXl: '--spacing-xl',
  spacing2xl: '--spacing-2xl',

  // Typography
  fontFamily: '--font-family',
  fontSizeSm: '--font-size-sm',
  fontSizeBase: '--font-size-base',
  fontSizeLg: '--font-size-lg',
  fontSizeXl: '--font-size-xl',
  fontSize2xl: '--font-size-2xl',

  // Shadows
  shadowSm: '--shadow-sm',
  shadowMd: '--shadow-md',
  shadowLg: '--shadow-lg',
  shadowXl: '--shadow-xl',
  shadowInset: '--shadow-inset',

  // Border Radius
  radiusSm: '--radius-sm',
  radiusMd: '--radius-md',
  radiusLg: '--radius-lg',
  radiusQuirkySm: '--radius-quirky-sm',
  radiusQuirkyMd: '--radius-quirky-md',
  radiusQuirkyLg: '--radius-quirky-lg',

  // Rotations
  rotateSlight: '--rotate-slight',
  rotateMild: '--rotate-mild',
  rotateModerate: '--rotate-moderate',
  rotateStrong: '--rotate-strong',

  // Motion
  springBezier: '--spring-bezier',
} as const;

// Helper to get CSS variable value
export function getCssVar(varName: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

// Helper to set CSS variable
export function setCssVar(varName: string, value: string): void {
  if (typeof window === 'undefined') return;
  document.documentElement.style.setProperty(varName, value);
}
