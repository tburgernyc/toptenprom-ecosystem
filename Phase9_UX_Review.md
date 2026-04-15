# Phase 9 UX/UI Review — Token Unification & Global Footer

**Date:** 2026-04-14  
**Engineer:** Lead UX/UI (Antigravity AI)  
**Objective:** Unify the `(corporate)` route group and `/network` page with the "Pearled Velvet Glass" dark theme; construct a global luxury footer for both the `(main)` and `(corporate)` layouts.

---

## Summary of Files Modified

| # | File | Action | Description |
|---|------|--------|-------------|
| 1 | `apps/brand-network-web/src/app/(corporate)/layout.tsx` | **MODIFIED** | Replaced all light-mode design-system tokens with Pearled Velvet Glass dark tokens. Updated branding from "Brand Network" → "Top 10 Prom", applied `logo-wordmark` gradient, pink `#10` badge, glass nav backdrop. |
| 2 | `apps/brand-network-web/src/app/(corporate)/network/page.tsx` | **MODIFIED** | Hero section converted to `.mesh-bg` animated gradient with pink radial glow. All `--color-surface-*` / `--color-foreground-*` tokens replaced with Pearled Velvet Glass equivalents. Added eyebrow "55+ Boutique Locations" label. Skeleton updated to use dark bg tokens. |
| 3 | `apps/brand-network-web/src/app/(corporate)/network/_components/locations-map.tsx` | **MODIFIED** | All violet `#8B5CF6` / `--color-brand-primary` references replaced with `--color-primary` (pink `#F24B9A`). All `--color-surface-*` → `--color-bg-*`. Store cards converted from ad-hoc Tailwind classes to `glass-card` + `btn-primary` / `btn-ghost` global utilities. InfoWindow dark glass style applied via tokens. |
| 4 | `apps/brand-network-web/src/components/Footer.tsx` | **NEW** | Created shared luxury footer component. Pearled Velvet Glass dark theme throughout. Sections: brand wordmark, Quick Links, Services, Company, social icons (via `lucide-react`), AI Stylist CTA banner, legal bottom bar. |
| 5 | `apps/brand-network-web/src/app/(main)/layout.tsx` | **MODIFIED** | Injected `<Footer />` below `<main>` inside `<Suspense>`. Added `flex-col` / `flex-1` for proper footer pinning. |
| 6 | `apps/brand-network-web/src/app/(corporate)/_components/corporate-footer.tsx` | **MODIFIED** | Replaced minimal stand-alone footer with a thin wrapper that imports and returns the new shared `<Footer />` component. |

---

## CSS Token Mapping Table

| Old Token (Light / Violet) | New Token (Pearled Velvet Glass) | Context |
|---------------------------|----------------------------------|---------|
| `--color-surface` | `--color-bg` | Body background |
| `--color-surface-elevated` | `--color-bg-elevated` | Card / elevated surfaces |
| `--color-surface-overlay` | `--color-bg-glass` | Skeleton shimmer, overlays |
| `--color-surface-brand` | `--color-bg-elevated` or `.mesh-bg` | Hero section backgrounds |
| `--color-foreground` | `--color-text` | Primary text |
| `--color-foreground-muted` | `--color-text-muted` | Secondary / body copy |
| `--color-foreground-subtle` | `--color-text-subtle` | Labels, timestamps |
| `--color-foreground-on-brand` | `--color-text-inverse` | Text on coloured backgrounds |
| `--color-brand-primary` | `--color-primary` | Accent / interactive colour |
| `--color-brand-primary-hover` | `--color-primary-hover` | Button hover |
| `--color-brand-primary-subtle` | `--color-primary-subtle` | Pill / badge backgrounds |
| `#8B5CF6` (violet) | `var(--color-primary)` = `#F24B9A` (pink) | Map pins, borders, accents |
| `#8B5CF6` (violet) border | `var(--color-border-glow)` | Card / pin glow borders |
| `rgba(139,92,246,0.5)` | `var(--color-primary-glow)` | Box shadow glows |
| `rgba(139,92,246,0.15)` | `var(--color-primary-subtle)` | Inactive pin background |
| `#1C1B22` (hardcoded dark) | `var(--color-bg-elevated)` | InfoWindow background |
| `#F9FAFB` (hardcoded white) | `var(--color-text)` | InfoWindow text |
| `#9CA3AF` (hardcoded gray) | `var(--color-text-muted)` | InfoWindow address |
| `rgba(11,10,14,0.85)` (hardcoded) | `var(--color-bg-glass)` | Map overlay legend |

---

## Typecheck Output

```
> @brand-network/web@0.0.1 typecheck
> tsc --noEmit

Exit code: 0  ✅  (zero errors)
```

## Lint Output

```
> @brand-network/web@0.0.1 lint
> eslint . --ext .ts,.tsx

Exit code: 0  ✅  (zero warnings, zero errors)
```

---

## Design Notes

- **Strict token enforcement:** Zero arbitrary hex codes remain in Phase 9 files. All colour references go through CSS custom properties.
- **`glass-card` utility** applied to store cards in `locations-map.tsx` — replaces ad-hoc radius/border/bg classes.
- **`btn-primary` / `btn-ghost` utilities** applied to location card buttons — brings them in line with the global button system.
- **Routing preservation:** No `<Link href="...">` paths were altered during this aesthetic pass.
- **Footer shared component:** Both `(main)` and `(corporate)` layouts now render the identical `Footer` component, guaranteeing visual consistency across every route on the domain.
