# Canvas Toolbar Button Size Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the icon/container size mismatch in the canvas floating toolbars so buttons look proportional and consistent.

**Architecture:** Pure CSS change in `_AiViewer.scss`. The `project-fn-box .ctrl-btn` currently has a 30px icon inside a 24px container with excessive 12px margins. The `size-ctrl-box .ctrl-btn` inherits the base 24px container with no font-size. Both are standardised to icon 22px / container 36×36px.

**Tech Stack:** SCSS, Material Symbols Outlined icons

---

### Task 1: Fix `project-fn-box .ctrl-btn` sizing

**Files:**
- Modify: `src/scss/views/_AiViewer.scss` (around line 1000–1004)

The current rule inside `&.project-fn-box`:

```scss
.ctrl-btn {
  color: var(--color-text-alpha80);
  font-size: 30px;
  margin: 12px 10px;
}
```

- [ ] **Step 1: Open the file and locate the rule**

In `src/scss/views/_AiViewer.scss`, find `&.project-fn-box` (around line 988). Inside it, find the `.ctrl-btn` block starting at ~line 1000.

- [ ] **Step 2: Replace the `.ctrl-btn` rule**

Replace:
```scss
.ctrl-btn {
  color: var(--color-text-alpha80);
  font-size: 30px;
  margin: 12px 10px;
}
```

With:
```scss
.ctrl-btn {
  color: var(--color-text-alpha80);
  font-size: 22px;
  width: 36px;
  height: 36px;
  margin: 5px 3px;
}
```

- [ ] **Step 3: Start dev server and visually verify**

```bash
npm run dev
```

Open the AiViewer canvas page. The bottom toolbar pill should now be noticeably more compact — icons should fit neatly inside the 36px hover circle without overflowing. The toolbar should feel tighter top-to-bottom.

- [ ] **Step 4: Commit**

```bash
git add src/scss/views/_AiViewer.scss
git commit -m "fix: reduce fn-toolbar ctrl-btn to 22px icon in 36px container"
```

---

### Task 2: Fix `size-ctrl-box .ctrl-btn` sizing

**Files:**
- Modify: `src/scss/views/_AiViewer.scss` (inside `&.size-ctrl-box`, around line 946–985)

Currently `size-ctrl-box` has no `.ctrl-btn` override — the `−` and `+` icons inherit the base 24×24px container.

- [ ] **Step 1: Locate `&.size-ctrl-box` and add `.ctrl-btn` rule**

In `src/scss/views/_AiViewer.scss`, find `&.size-ctrl-box` (around line 946). After the `@include user-select-none;` line and before `.resetPosition`, add:

```scss
.ctrl-btn {
  font-size: 22px;
  width: 36px;
  height: 36px;
  margin: 0 2px;
}
```

The block should look like:

```scss
&.size-ctrl-box {
  z-index: 4;
  padding: 6px;
  display: flex;
  align-items: center;
  @include user-select-none;

  .ctrl-btn {
    font-size: 22px;
    width: 36px;
    height: 36px;
    margin: 0 2px;
  }

  // TODO... 是情況移除
  .resetPosition {
    border: 0;
  }
  // ... rest of existing rules unchanged
```

- [ ] **Step 2: Visually verify zoom control**

With dev server still running, check the top-right zoom control (`−/100%/+`). The `−` and `+` icon buttons should now match the proportions of the bottom toolbar — 36px hit area, icon centered and not overflowing.

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/scss/views/_AiViewer.scss
git commit -m "fix: add explicit ctrl-btn sizing to size-ctrl-box for consistency"
```
