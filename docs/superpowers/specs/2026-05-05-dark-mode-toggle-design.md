# Dark Mode Toggle — Design Spec

**Date:** 2026-05-05
**Status:** Approved

## Overview

Add a persistent dark mode toggle control to the application shell so users can switch between light and dark themes without reloading or navigating away.

## Placement

Fixed position, top-right corner of the viewport, rendered inside `src/container/Full.vue`. This ensures it is visible on every page without being tied to any specific route or layout region.

## Visual Design

Style A: pill-shaped container with a sun icon, a toggle switch, and a moon icon flanking the switch.

- Container: `position: fixed; top: 16px; right: 20px; z-index: 200`
- Container appearance: `background: var(--surface)`, `border: 1px solid var(--divider)`, `border-radius: 999px`, `padding: 5px 10px`, `box-shadow: 0 2px 8px rgba(var(--shadow), 0.08)`
- Icons: Material Symbols Rounded — `light_mode` (left) and `dark_mode` (right)
- Switch track: `width: 32px; height: 18px; border-radius: 999px`
  - Off (light mode): background `var(--sidebar-hover)`
  - On (dark mode): background `var(--primary)`
- Switch thumb: `width: 12px; height: 12px`, white, slides right when dark mode is active
- Inactive icon: `opacity: 0.4`

## Behavior

- Click the toggle (anywhere on the pill) → toggles `document.documentElement.dataset.theme` between `"dark"` and `"light"`
- Initial state: light (reads no localStorage, no system preference check)
- No persistence across page reloads

## Files

**New:**
- `src/components/AppThemeToggle.vue` — the toggle component
- `src/scss/components/_AppThemeToggle.scss` — styles

**Modified:**
- `src/container/Full.vue` — add `<AppThemeToggle />` and its import
- `src/scss/components/_index.scss` — add `@forward '_AppThemeToggle'`

## Implementation Notes

The component manages a local `isDark` ref. On click it flips the ref and sets `document.documentElement.dataset.theme`. No store interaction required. The existing `[data-theme="dark"]:root` selectors in `_themeDark.scss` will respond automatically.
