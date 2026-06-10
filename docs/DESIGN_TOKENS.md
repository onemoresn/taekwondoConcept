# Design Tokens

Source of truth: `src/styles/tokens.css`

## Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#080808` | Page background |
| `--color-surface` | `#121212` | Cards, panels |
| `--color-surface-2` | `#1a1a1a` | Nested surfaces |
| `--color-text` | `#f2f2f2` | Primary text |
| `--color-text-muted` | `#888888` | Secondary text |
| `--color-red` | `#e8222a` | Primary action, active nav |
| `--color-gold` | `#c9a227` | Accents, belt highlights |
| `--color-green` | `#22a852` | Approved status |

## Belt palette

| Belt | Color | Text |
|------|-------|------|
| White | `#f5f5f5` | `#1a1a1a` |
| Yellow | `#f5c518` | `#1a1a1a` |
| Green | `#22a852` | `#ffffff` |
| Blue | `#2563eb` | `#ffffff` |
| Red | `#dc2626` | `#ffffff` |
| Black | `#1a1a1a` | `#d4af37` |

## Progress pipeline colors

| Status | Color |
|--------|-------|
| Attempted | `#f59e0b` |
| Parent verified | `#3b82f6` |
| Approved | `#22a852` |
| Denied | `#ef4444` |

## Typography

- **Display:** Bebas Neue — headings, logo
- **Body:** Inter — UI text
- Scale uses `clamp()` for fluid sizing on mobile → desktop

## Spacing

- Base unit: 4px (`--space-1` through `--space-8`)
- Page padding: `clamp(16px, 4vw, 40px)` horizontal

## Breakpoints

| Name | Min width | Layout behavior |
|------|-----------|-----------------|
| (default) | 0 | Single column, bottom nav |
| sm | 480px | 3-col landing roles |
| md | 640px | 2-col lists |
| lg | 768px | Wider dashboards |
| xl | 1024px | Sidebar nav, full width content |
| 2xl | 1280px | 3-col requirement grids |

## Touch targets

Minimum 44px (48px on `pointer: coarse`) for interactive elements.
