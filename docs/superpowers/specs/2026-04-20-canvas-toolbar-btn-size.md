# Canvas Toolbar Button Size Fix

**Date:** 2026-04-20  
**Scope:** `src/scss/views/_AiViewer.scss`

## Problem

The bottom main toolbar (`project-fn-box`) has a sizing mismatch: icon `font-size: 30px` is placed inside a `width/height: 24px` hover circle, so the icon visually overflows its hit area. The `margin: 12px 10px` also makes the toolbar feel unnecessarily tall. The zoom control (`size-ctrl-box`) inherits the base `24×24px` container with no explicit font-size, making it inconsistent with the toolbar.

## Changes

### 1. `project-fn-box .ctrl-btn`

**File:** `src/scss/views/_AiViewer.scss`  
**Selector:** `.AiViewr-ctrl-box.project-fn-box .ctrl-btn` (or `&.project-fn-box .ctrl-btn` within the `.AiViewr-ctrl-box` block)

| Property | Before | After |
|---|---|---|
| `font-size` | `30px` | `22px` |
| `margin` | `12px 10px` | `5px 3px` |
| `width` | (inherited 24px) | `36px` |
| `height` | (inherited 24px) | `36px` |

### 2. `size-ctrl-box .ctrl-btn`

**File:** `src/scss/views/_AiViewer.scss`  
**Selector:** `&.size-ctrl-box .ctrl-btn` within the `.AiViewr-ctrl-box` block  
**Action:** Add new rule (currently no override exists)

```scss
.ctrl-btn {
  font-size: 22px;
  width: 36px;
  height: 36px;
  margin: 0 2px;
}
```

## Out of Scope

- Per-block `ctrl-box .ctrl-btn` (already explicitly `40×40px / 20px`) — unchanged
- `chat-header-box .ctrl-btn` (already explicitly `40×40px`) — unchanged
- `right-ctrl-box` / `left-ctrl-box` — unchanged
- No HTML, no Vue component changes required
