import type { CSSProperties } from "react";

/**
 * Brand Network Design System — TypeScript theme tokens
 *
 * These constants mirror the CSS tokens defined in tokens.css and provide
 * type-safe access for dynamic styling (e.g., chart colours, canvas drawing,
 * tenant theme validation, and server-side OG image generation).
 *
 * CSS custom properties remain the source of truth for all rendered UI.
 * This file is for code paths that cannot consume CSS variables directly.
 */

// ---------------------------------------------------------------------------
// Brand colours (light-mode defaults; sync with tokens.css)
// ---------------------------------------------------------------------------

export const brandColors = {
  primary: "oklch(0.55 0.22 264)",
  primaryHover: "oklch(0.48 0.22 264)",
  primaryActive: "oklch(0.42 0.22 264)",
  primarySubtle: "oklch(0.93 0.06 264)",
  secondary: "oklch(0.62 0.20 290)",
  secondaryHover: "oklch(0.55 0.20 290)",
} as const;

export type BrandColorKey = keyof typeof brandColors;

// ---------------------------------------------------------------------------
// Semantic colours
// ---------------------------------------------------------------------------

export const semanticColors = {
  success: "oklch(0.55 0.18 143)",
  successSubtle: "oklch(0.93 0.05 143)",
  warning: "oklch(0.72 0.18 72)",
  warningSubtle: "oklch(0.96 0.05 72)",
  danger: "oklch(0.55 0.22 27)",
  dangerSubtle: "oklch(0.95 0.06 27)",
  info: "oklch(0.60 0.18 230)",
  infoSubtle: "oklch(0.94 0.05 230)",
} as const;

// ---------------------------------------------------------------------------
// Tenant theme — the shape of per-tenant colour overrides stored in the DB
// ---------------------------------------------------------------------------

export interface TenantThemeOverrides {
  /** Primary CTA colour as a 6-digit hex or CSS colour string */
  primaryColor?: string | undefined;
  /** Secondary / accent colour */
  secondaryColor?: string | undefined;
}

/**
 * Generates inline CSS custom property overrides for a tenant wrapper element.
 * Pass the result to the element's `style` prop.
 *
 * Only valid colour strings are emitted; undefined values fall back to the
 * brand defaults defined in tokens.css.
 *
 * @example
 * <div style={buildTenantCssVars({ primaryColor: "#e34d4d", secondaryColor: "#4d9ae3" })}>
 *   {children}
 * </div>
 */
export function buildTenantCssVars(
  overrides: TenantThemeOverrides
): CSSProperties {
  const vars: Record<string, string> = {};

  if (overrides.primaryColor) {
    vars["--color-tenant-primary"] = overrides.primaryColor;
    // Approximate hover by leaving the CSS fallback chain handle it unless
    // a more sophisticated colour derivation is added in Phase 3.
    vars["--color-tenant-primary-hover"] = overrides.primaryColor;
    vars["--color-tenant-primary-active"] = overrides.primaryColor;
  }

  if (overrides.secondaryColor) {
    vars["--color-tenant-secondary"] = overrides.secondaryColor;
    vars["--color-tenant-secondary-hover"] = overrides.secondaryColor;
  }

  return vars as CSSProperties;
}

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const fontFamilies = {
  sans: "var(--font-family-sans)",
  mono: "var(--font-family-mono)",
} as const;

// ---------------------------------------------------------------------------
// Border radius scale
// ---------------------------------------------------------------------------

export const radius = {
  xs: "0.125rem",
  sm: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  "2xl": "1rem",
  "3xl": "1.5rem",
  full: "9999px",
} as const;

export type RadiusKey = keyof typeof radius;

// ---------------------------------------------------------------------------
// Z-index scale
// ---------------------------------------------------------------------------

export const zIndex = {
  base: 0,
  raised: 10,
  overlay: 100,
  modal: 200,
  toast: 300,
  tooltip: 400,
} as const;

export type ZIndexKey = keyof typeof zIndex;

// ---------------------------------------------------------------------------
// Motion / transitions
// ---------------------------------------------------------------------------

export const transitions = {
  fast: "100ms ease",
  base: "200ms ease",
  slow: "300ms ease",
  bounce: "400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;
