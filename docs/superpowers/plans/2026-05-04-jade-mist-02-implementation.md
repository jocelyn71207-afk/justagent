# Jade Mist 02 Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fully migrate JustAgent to the Jade Mist 02 design system — replacing all `--color-*` CSS tokens with new semantic names, adding Noto Sans TC + Public Sans fonts, and implementing light + dark mode tokens across all SCSS files including AiViewer.

**Architecture:** Strategy B (full token rename). New tokens defined in `_theme.scss` (light) and `_themeDark.scss` (dark via `[data-theme="dark"]`). A shell script bulk-renames all old `--color-*` references across 26 SCSS files. Component-specific files then get targeted spec-compliant updates for sidebar, tabs, popovers, and cards.

**Tech Stack:** SCSS (Sass), CSS Custom Properties, Vue 3, Vite. Run `npm run build` to verify compilation after each major task.

---

## Token Mapping Reference

Use this table throughout implementation to verify replacements are correct.

| Old Token | New Token | Light Value |
|---|---|---|
| `--color-background` | `--page-bg` | `#FAFCFC` |
| `--color-background-1`, `--color-background-2`, `--color-bg-white`, `--color-wise-card` | `--surface` | `#FFFFFF` |
| `--color-background-1-alpha90` | `--surface-a90` | `rgba(255,255,255,0.9)` |
| `--color-background-1-alpha70` | `--surface-a70` | `rgba(255,255,255,0.7)` |
| `--color-background-1-alpha50` | `--surface-a50` | `rgba(255,255,255,0.5)` |
| `--color-background-2-alpha50` | `--sidebar-hover-a50` | `rgba(232,238,240,0.5)` |
| `--color-background-2-alpha30` | `--sidebar-hover-a30` | `rgba(232,238,240,0.3)` |
| `--color-background-2-alpha20` | `--sidebar-hover-a20` | `rgba(232,238,240,0.2)` |
| `--color-background-2-alpha10` | `rgba(232,238,240,0.1)` | inline |
| `--color-border`, `--color-border-1`, `--color-border-strong` | `--divider` | `#E8EDEE` |
| `--color-border-1-alpha50`, `--color-border-alpha50` | `--divider-a50` | `rgba(232,237,238,0.5)` |
| `--color-border-1-alpha40` | `--divider-a40` | `rgba(232,237,238,0.4)` |
| `--color-border-1-alpha30` | `--divider-a30` | `rgba(232,237,238,0.3)` |
| `--color-border-1-alpha20` | `--divider-a20` | `rgba(232,237,238,0.2)` |
| `--color-text` | `--text` | `#09151A` |
| `--color-text-alpha90` | `--text-a90` | `rgba(9,21,26,0.9)` |
| `--color-text-alpha80` | `--text-a80` | `rgba(9,21,26,0.8)` |
| `--color-text-alpha70` | `--text-a70` | `rgba(9,21,26,0.7)` |
| `--color-text-alpha60` | `--text-a60` | `rgba(9,21,26,0.6)` |
| `--color-text-alpha50`, `--color-wise-gray`, `--color-wise-warm-dark` | `--text-muted` | `#3F565E` |
| `--color-text-alpha40` | `--text-faint` | `#7F929A` |
| `--color-text-alpha30` | `--text-faint` | `#7F929A` |
| `--color-text-alpha20` | `--text-a20` | `rgba(9,21,26,0.2)` |
| `--color-text-primary`, `--color-heading`, `--color-link-text`, `--color-wise-black` | `--primary` | `#00A078` |
| `--color-link-text-active`, `--color-wise-dark-green` | `--primary-hover` | `#007F5F` |
| `--color-primary` | `--primary` | `#00A078` |
| `--color-primary-hover` | `--primary-hover` | `#007F5F` |
| `--color-primary-subtle`, `--color-primary-muted` | `--accent-soft` | `#CFEFE2` |
| `--color-primary-fg` | `--primary-fg` | `#FFFFFF` |
| `--color-accent`, `--color-main`, `--color-wise-green` | `--accent` | `#00C896` |
| `--color-accent-soft`, `--color-wise-surface`, `--color-wise-mint` | `--accent-soft` | `#CFEFE2` |
| `--color-main-alpha70` | `--accent-a70` | `rgba(0,200,150,0.7)` |
| `--color-main-alpha40` | `--accent-a40` | `rgba(0,200,150,0.4)` |
| `--color-main-alpha30` | `--accent-a30` | `rgba(0,200,150,0.3)` |
| `--color-main-alpha10` | `--accent-a10` | `rgba(0,200,150,0.1)` |
| `--color-sidebar-bg` | `--sidebar-bg` | `#F2F6F7` |
| `--color-sidebar-hover`, `--color-bg-muted` | `--sidebar-hover` | `#E8EEF0` |
| `--color-sidebar-active` | `--sidebar-active` | `#D9E2E4` |
| `--color-sidebar-fg` | `--sidebar-fg` | `#0E1A1C` |
| `--color-sidebar-muted` | `--sidebar-muted` | `#6A7C82` |
| `--color-hint` | `--hint` | `#CFEFE2` |
| `--color-hint-text` | `--hint-text` | `#004A33` |
| `--color-danger` | `--danger` | `#D14437` |
| `--color-wise-bg`, `--color-bg` | `--page-bg` | `#FAFCFC` |
| `--color-wise-badge-sat-text` | `--primary` | `#00A078` |
| `--color-scrollbar` | `--scrollbar` | `#D0D8DA` |
| `--color-scrollbar-alpha50` | `--scrollbar-a50` | `rgba(208,216,218,0.5)` |
| `--color-userSay-record` | `--surface` | `#FFFFFF` |
| `--color-shadow` (used in `rgba(from var(...) r g b / X)`) | `--shadow` | `15,23,42` (CSV for rgba) |

---

## Task 1: Add Fonts to index.html

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Update Google Fonts link**

Open `index.html` and replace the existing fonts `<link>` tag (the one loading Material Symbols and JetBrains Mono) by adding `Noto+Sans+TC` and `Public+Sans` to it. Find the line that ends with `JetBrains+Mono:wght@400;500;600;700"` and replace it with:

```html
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&family=Material+Symbols+Sharp:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&family=JetBrains+Mono:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;600;700&family=Public+Sans:wght@400;600;700"
  >
```

- [ ] **Step 2: Verify the change builds**

```bash
npm run build 2>&1 | tail -5
```
Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add Noto Sans TC and Public Sans to Google Fonts"
```

---

## Task 2: Rewrite `_variables.scss` font-family

**Files:**
- Modify: `src/scss/base/_variables.scss`

- [ ] **Step 1: Update `$font-family` and add mono/heading vars**

Find the `$font-family:` block near the bottom of `_variables.scss` (around the lines with "Microsoft Jhenghei UI") and replace the entire `$font-family:` declaration with:

```scss
$font-family: 'Noto Sans TC', system-ui, sans-serif;
$font-family-heading: 'Public Sans', sans-serif;
$font-family-mono: 'JetBrains Mono', monospace;
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -5
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/scss/base/_variables.scss
git commit -m "feat: update font-family to Noto Sans TC / Public Sans / JetBrains Mono"
```

---

## Task 3: Rewrite `_theme.scss` — light mode tokens

**Files:**
- Modify: `src/scss/base/_theme.scss`

- [ ] **Step 1: Replace entire file content**

The file is large (~177 lines) with `--color-*` vars. Replace the full `:root { }` block. Keep the `@use "sass:color";` at the top. The new content:

```scss
@use "sass:color";

:root {
  // ── Brand ────────────────────────────────────────────────────────────────
  --primary:         #00A078;
  --primary-hover:   #007F5F;
  --primary-fg:      #FFFFFF;
  --accent:          #00C896;
  --accent-soft:     #CFEFE2;

  // ── Surfaces ─────────────────────────────────────────────────────────────
  --page-bg:         #FAFCFC;
  --surface:         #FFFFFF;
  --sidebar-bg:      #F2F6F7;
  --sidebar-hover:   #E8EEF0;
  --sidebar-active:  #D9E2E4;
  --divider:         #E8EDEE;

  // ── Text ─────────────────────────────────────────────────────────────────
  --text:            #09151A;
  --text-muted:      #3F565E;
  --text-faint:      #7F929A;
  --sidebar-fg:      #0E1A1C;
  --sidebar-muted:   #6A7C82;

  // ── Semantic ─────────────────────────────────────────────────────────────
  --success:         #00A078;
  --warning:         #CF8A1F;
  --danger:          #D14437;
  --hint:            #CFEFE2;
  --hint-text:       #004A33;

  // ── Scrollbar ────────────────────────────────────────────────────────────
  --scrollbar:       #D0D8DA;

  // ── Shadow base (CSV for use in rgba()) ──────────────────────────────────
  --shadow:          15,23,42;

  // ── Derived alpha helpers ─────────────────────────────────────────────────
  // surface
  --surface-a90:            rgba(255,255,255,0.9);
  --surface-a70:            rgba(255,255,255,0.7);
  --surface-a50:            rgba(255,255,255,0.5);
  // text
  --text-a90:               rgba(9,21,26,0.9);
  --text-a80:               rgba(9,21,26,0.8);
  --text-a70:               rgba(9,21,26,0.7);
  --text-a60:               rgba(9,21,26,0.6);
  --text-a20:               rgba(9,21,26,0.2);
  // divider
  --divider-a50:            rgba(232,237,238,0.5);
  --divider-a40:            rgba(232,237,238,0.4);
  --divider-a30:            rgba(232,237,238,0.3);
  --divider-a20:            rgba(232,237,238,0.2);
  // sidebar-hover
  --sidebar-hover-a50:      rgba(232,238,240,0.5);
  --sidebar-hover-a30:      rgba(232,238,240,0.3);
  --sidebar-hover-a20:      rgba(232,238,240,0.2);
  // accent
  --accent-a70:             rgba(0,200,150,0.7);
  --accent-a40:             rgba(0,200,150,0.4);
  --accent-a30:             rgba(0,200,150,0.3);
  --accent-a10:             rgba(0,200,150,0.1);
  // scrollbar
  --scrollbar-a50:          rgba(208,216,218,0.5);

  // ── Legacy badge / rank colors (keep as CSS vars for badge components) ───
  --color-wise-badge-hot-bg:    #faeeda;
  --color-wise-badge-hot-text:  #854f0b;
  --color-wise-rank-bronze-bg:  #f5dfc0;
  --color-wise-rank-bronze-text:#854f0b;
  --color-wise-table-header-bg: #F0FAF6;
  --color-wise-empty-border:    #9FD9C4;
  --color-explore-accent-light: #EEEDFE;
  --color-explore-accent-mid:   #7F77DD;
  --color-explore-accent-hover: #CECBF6;
  --color-explore-accent-text:  #534AB7;
  --color-explore-accent-dark:  #3C3489;
  --color-grey-1:               #8b90a0;

  // ── Compat aliases (used by third-party / AiViewer internals) ─────────────
  --color-tab-active-bg:   var(--surface);
  --color-switch-active-bg:var(--text);
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -10
```
Expected: may show SCSS warnings about undefined variables from `_themeDark.scss` — that's fine until Task 4. Build should complete.

- [ ] **Step 3: Commit**

```bash
git add src/scss/base/_theme.scss
git commit -m "feat: replace _theme.scss with Jade Mist 02 light tokens"
```

---

## Task 4: Rewrite `_themeDark.scss` — dark mode tokens

**Files:**
- Modify: `src/scss/base/_themeDark.scss`

- [ ] **Step 1: Replace entire file content**

```scss
// Dark mode — Jade Mist 02
// Activated by: <html data-theme="dark"> or prefers-color-scheme

[data-theme="dark"],
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    // ── Brand ──────────────────────────────────────────────────────────────
    --primary:         #00A078;
    --primary-hover:   #00C896;  // hover becomes lighter in dark
    --primary-fg:      #FFFFFF;
    --accent:          #00C896;
    --accent-soft:     #0E3E32;

    // ── Surfaces ───────────────────────────────────────────────────────────
    --page-bg:         #0F1719;
    --surface:         #152124;
    --sidebar-bg:      #0B1315;
    --sidebar-hover:   #162226;
    --sidebar-active:  #1F2E32;
    --divider:         #1F2C2F;

    // ── Text ───────────────────────────────────────────────────────────────
    --text:            #EAF3F2;
    --text-muted:      #A4B6B9;
    --text-faint:      #6F8589;
    --sidebar-fg:      #EAF3F2;
    --sidebar-muted:   #8AA0A4;

    // ── Semantic ───────────────────────────────────────────────────────────
    --success:         #00C896;
    --warning:         #E0A24A;
    --danger:          #EC6B5E;
    --hint:            #0E3E32;
    --hint-text:       #9CE9CB;

    // ── Scrollbar ──────────────────────────────────────────────────────────
    --scrollbar:       #2A3C40;

    // ── Shadow base ────────────────────────────────────────────────────────
    --shadow:          0,0,0;

    // ── Derived alpha helpers ─────────────────────────────────────────────
    --surface-a90:            rgba(21,33,36,0.9);
    --surface-a70:            rgba(21,33,36,0.7);
    --surface-a50:            rgba(21,33,36,0.5);
    --text-a90:               rgba(234,243,242,0.9);
    --text-a80:               rgba(234,243,242,0.8);
    --text-a70:               rgba(234,243,242,0.7);
    --text-a60:               rgba(234,243,242,0.6);
    --text-a20:               rgba(234,243,242,0.2);
    --divider-a50:            rgba(31,44,47,0.5);
    --divider-a40:            rgba(31,44,47,0.4);
    --divider-a30:            rgba(31,44,47,0.3);
    --divider-a20:            rgba(31,44,47,0.2);
    --sidebar-hover-a50:      rgba(22,34,38,0.5);
    --sidebar-hover-a30:      rgba(22,34,38,0.3);
    --sidebar-hover-a20:      rgba(22,34,38,0.2);
    --accent-a70:             rgba(0,200,150,0.7);
    --accent-a40:             rgba(0,200,150,0.4);
    --accent-a30:             rgba(0,200,150,0.3);
    --accent-a10:             rgba(0,200,150,0.1);
    --scrollbar-a50:          rgba(42,60,64,0.5);

    // ── Legacy badge / rank (dark overrides) ───────────────────────────────
    --color-wise-badge-hot-bg:    #3a2a10;
    --color-wise-badge-hot-text:  #e8a94a;
    --color-wise-rank-bronze-bg:  #3a2a10;
    --color-wise-rank-bronze-text:#e8a94a;
    --color-wise-table-header-bg: #0E3E32;
    --color-wise-empty-border:    #1F4038;
    --color-explore-accent-light: #1e1c40;
    --color-explore-accent-mid:   #9B96E8;
    --color-explore-accent-hover: #2a2860;
    --color-explore-accent-text:  #A09AF0;
    --color-explore-accent-dark:  #C4C0F8;
    --color-grey-1:               #5a6070;

    // ── Compat aliases ────────────────────────────────────────────────────
    --color-tab-active-bg:    var(--text);
    --color-switch-active-bg: var(--surface);
  }
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -10
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/scss/base/_themeDark.scss
git commit -m "feat: replace _themeDark.scss with Jade Mist 02 dark tokens"
```

---

## Task 5: Global token rename via shell script

This task bulk-renames all `--color-*` old token references across every SCSS file (except `_theme.scss` and `_themeDark.scss` which are already done).

**Files:**
- Modify: all `.scss` files in `src/scss/` except `_theme.scss` and `_themeDark.scss`

- [ ] **Step 1: Create and run the rename script**

Ensure the `scripts/` directory exists:
```bash
mkdir -p scripts
```

Create a temporary script `scripts/rename-tokens.sh`:

```bash
#!/usr/bin/env bash
# Renames old --color-* tokens to Jade Mist 02 names
# Run from project root: bash scripts/rename-tokens.sh

SCSS_FILES=$(find src/scss -name "*.scss" \
  ! -name "_theme.scss" \
  ! -name "_themeDark.scss")

for f in $SCSS_FILES; do
  # Order matters: most specific (long names) first

  # ── background alpha series ────────────────────────────────────────────
  sed -i '' 's/var(--color-background-1-alpha90)/var(--surface-a90)/g' "$f"
  sed -i '' 's/var(--color-background-1-alpha70)/var(--surface-a70)/g' "$f"
  sed -i '' 's/var(--color-background-1-alpha50)/var(--surface-a50)/g' "$f"
  sed -i '' 's/var(--color-background-1-alpha80)/var(--surface-a90)/g' "$f"
  sed -i '' 's/var(--color-background-1-alpha40)/var(--surface-a50)/g' "$f"
  sed -i '' 's/var(--color-background-2-alpha50)/var(--sidebar-hover-a50)/g' "$f"
  sed -i '' 's/var(--color-background-2-alpha30)/var(--sidebar-hover-a30)/g' "$f"
  sed -i '' 's/var(--color-background-2-alpha20)/var(--sidebar-hover-a20)/g' "$f"
  sed -i '' 's/var(--color-background-2-alpha10)/rgba(232,238,240,0.1)/g' "$f"
  sed -i '' 's/var(--color-background-1)/var(--surface)/g' "$f"
  sed -i '' 's/var(--color-background-2)/var(--sidebar-hover)/g' "$f"
  sed -i '' 's/var(--color-background)/var(--page-bg)/g' "$f"

  # ── border alpha series ────────────────────────────────────────────────
  sed -i '' 's/var(--color-border-1-alpha50)/var(--divider-a50)/g' "$f"
  sed -i '' 's/var(--color-border-1-alpha40)/var(--divider-a40)/g' "$f"
  sed -i '' 's/var(--color-border-1-alpha30)/var(--divider-a30)/g' "$f"
  sed -i '' 's/var(--color-border-1-alpha20)/var(--divider-a20)/g' "$f"
  sed -i '' 's/var(--color-border-alpha50)/var(--divider-a50)/g' "$f"
  sed -i '' 's/var(--color-border-1)/var(--divider)/g' "$f"
  sed -i '' 's/var(--color-border-strong)/var(--divider)/g' "$f"
  sed -i '' 's/var(--color-border)/var(--divider)/g' "$f"

  # ── text alpha series ──────────────────────────────────────────────────
  sed -i '' 's/var(--color-text-alpha90)/var(--text-a90)/g' "$f"
  sed -i '' 's/var(--color-text-alpha80)/var(--text-a80)/g' "$f"
  sed -i '' 's/var(--color-text-alpha70)/var(--text-a70)/g' "$f"
  sed -i '' 's/var(--color-text-alpha60)/var(--text-a60)/g' "$f"
  sed -i '' 's/var(--color-text-alpha50)/var(--text-muted)/g' "$f"
  sed -i '' 's/var(--color-text-alpha40)/var(--text-faint)/g' "$f"
  sed -i '' 's/var(--color-text-alpha30)/var(--text-faint)/g' "$f"
  sed -i '' 's/var(--color-text-alpha20)/var(--text-a20)/g' "$f"
  sed -i '' 's/var(--color-text-primary)/var(--primary)/g' "$f"
  sed -i '' 's/var(--color-text)/var(--text)/g' "$f"

  # ── main / accent alpha series ─────────────────────────────────────────
  sed -i '' 's/var(--color-main-alpha70)/var(--accent-a70)/g' "$f"
  sed -i '' 's/var(--color-main-alpha40)/var(--accent-a40)/g' "$f"
  sed -i '' 's/var(--color-main-alpha30)/var(--accent-a30)/g' "$f"
  sed -i '' 's/var(--color-main-alpha10)/var(--accent-a10)/g' "$f"
  sed -i '' 's/var(--color-main)/var(--accent)/g' "$f"

  # ── primary series ────────────────────────────────────────────────────
  sed -i '' 's/var(--color-primary-subtle)/var(--accent-soft)/g' "$f"
  sed -i '' 's/var(--color-primary-muted)/var(--accent-soft)/g' "$f"
  sed -i '' 's/var(--color-primary-hover)/var(--primary-hover)/g' "$f"
  sed -i '' 's/var(--color-primary-fg)/var(--primary-fg)/g' "$f"
  sed -i '' 's/var(--color-primary)/var(--primary)/g' "$f"

  # ── accent ────────────────────────────────────────────────────────────
  sed -i '' 's/var(--color-accent-soft)/var(--accent-soft)/g' "$f"
  sed -i '' 's/var(--color-accent)/var(--accent)/g' "$f"

  # ── sidebar ───────────────────────────────────────────────────────────
  sed -i '' 's/var(--color-sidebar-bg)/var(--sidebar-bg)/g' "$f"
  sed -i '' 's/var(--color-sidebar-hover)/var(--sidebar-hover)/g' "$f"
  sed -i '' 's/var(--color-sidebar-active)/var(--sidebar-active)/g' "$f"
  sed -i '' 's/var(--color-sidebar-fg)/var(--sidebar-fg)/g' "$f"
  sed -i '' 's/var(--color-sidebar-muted)/var(--sidebar-muted)/g' "$f"

  # ── wise tokens ───────────────────────────────────────────────────────
  sed -i '' 's/var(--color-wise-dark-green)/var(--primary-hover)/g' "$f"
  sed -i '' 's/var(--color-wise-warm-dark)/var(--text-muted)/g' "$f"
  sed -i '' 's/var(--color-wise-green)/var(--accent)/g' "$f"
  sed -i '' 's/var(--color-wise-black)/var(--text)/g' "$f"
  sed -i '' 's/var(--color-wise-gray)/var(--text-faint)/g' "$f"
  sed -i '' 's/var(--color-wise-surface)/var(--accent-soft)/g' "$f"
  sed -i '' 's/var(--color-wise-mint)/var(--hint)/g' "$f"
  sed -i '' 's/var(--color-wise-card)/var(--surface)/g' "$f"
  sed -i '' 's/var(--color-wise-bg)/var(--page-bg)/g' "$f"
  sed -i '' 's/var(--color-wise-badge-sat-text)/var(--primary)/g' "$f"

  # ── bg shorthand ─────────────────────────────────────────────────────
  sed -i '' 's/var(--color-bg-muted)/var(--sidebar-hover)/g' "$f"
  sed -i '' 's/var(--color-bg-white)/var(--surface)/g' "$f"
  sed -i '' 's/var(--color-bg-subtle)/var(--page-bg)/g' "$f"
  sed -i '' 's/var(--color-bg)/var(--page-bg)/g' "$f"

  # ── semantic ─────────────────────────────────────────────────────────
  sed -i '' 's/var(--color-heading)/var(--primary)/g' "$f"
  sed -i '' 's/var(--color-link-text-active)/var(--primary-hover)/g' "$f"
  sed -i '' 's/var(--color-link-text)/var(--primary)/g' "$f"
  sed -i '' 's/var(--color-hint-text)/var(--hint-text)/g' "$f"
  sed -i '' 's/var(--color-hint)/var(--hint)/g' "$f"
  sed -i '' 's/var(--color-danger)/var(--danger)/g' "$f"
  sed -i '' 's/var(--color-userSay-record)/var(--surface)/g' "$f"

  # ── scrollbar ────────────────────────────────────────────────────────
  sed -i '' 's/var(--color-scrollbar-alpha50)/var(--scrollbar-a50)/g' "$f"
  sed -i '' 's/var(--color-scrollbar)/var(--scrollbar)/g' "$f"

  # ── shadow (used as: rgba(from var(--color-shadow) r g b / X)) ───────
  # Replace the whole pattern with inline rgba using new --shadow token
  sed -i '' 's/rgba(from var(--color-shadow) r g b \/ 0\.5)/rgba(var(--shadow),0.5)/g' "$f"
  sed -i '' 's/rgba(from var(--color-shadow) r g b \/ 0\.3)/rgba(var(--shadow),0.3)/g' "$f"
  sed -i '' 's/rgba(from var(--color-shadow) r g b \/ 0\.2)/rgba(var(--shadow),0.2)/g' "$f"
  sed -i '' 's/rgba(from var(--color-shadow) r g b \/ 0\.15)/rgba(var(--shadow),0.15)/g' "$f"
  sed -i '' 's/rgba(from var(--color-shadow) r g b \/ 0\.08)/rgba(var(--shadow),0.08)/g' "$f"
  sed -i '' 's/var(--color-shadow)/rgba(var(--shadow),0.3)/g' "$f"

done

echo "Done. Verify with: grep -r 'var(--color-' src/scss --include='*.scss' | grep -v '_theme\|_themeDark' | wc -l"
```

- [ ] **Step 2: Run the script**

```bash
chmod +x scripts/rename-tokens.sh && bash scripts/rename-tokens.sh
```

Expected output: `Done. Verify with: ...` then a number.

- [ ] **Step 3: Check for remaining old tokens**

```bash
grep -r "var(--color-" src/scss --include="*.scss" \
  | grep -v "_theme.scss\|_themeDark.scss\|_variables.scss" \
  | grep -v "color-wise-badge\|color-wise-rank\|color-wise-table\|color-wise-empty\|color-explore\|color-grey-1\|color-tab-active\|color-switch-active"
```

Expected: empty output (or only the legacy badge/rank/explore vars that are intentionally kept).

If any old `--color-*` vars still appear, fix them manually referencing the Token Mapping table at the top of this plan.

- [ ] **Step 4: Build**

```bash
npm run build 2>&1 | grep -E "error|Error|✓" | head -20
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/scss/
git commit -m "feat: bulk rename all --color-* tokens to Jade Mist 02 names"
```

---

## Task 6: Update `_html.scss` — font-family and base styles

**Files:**
- Modify: `src/scss/base/_html.scss`

- [ ] **Step 1: Update body font-family**

Find `font-family: $font-family;` inside the `html, body { }` block and verify it will now use `'Noto Sans TC'` (set in Task 2). No change needed there.

Find the `body { }` block's `color` and `background` lines and verify they now use `--text` and `--page-bg` (done by Task 5 sed). If not, update manually:

```scss
body {
  color: var(--text);
  background: var(--page-bg);
  // ... rest unchanged
}
```

- [ ] **Step 2: Update `custom-input` focus state**

Find `.custom-input` and update:

```scss
.custom-input {
  border-radius: $radius;
  border: 1px solid var(--divider);
  background-color: var(--surface);
  padding: 0.532rem 0.4rem;
  font-size: $font-form-size;
  line-height: $line-height-base;
  font-family: $font-family;
  color: var(--text);
  vertical-align: bottom;
  &:hover {
    border-color: var(--accent);
  }
  &:focus {
    border-color: var(--primary-hover);
    outline: none;
    box-shadow: 0 0 0 2px rgba(0,160,120,0.15);
  }
  // ... keep disabled and error states
}
```

- [ ] **Step 3: Build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add src/scss/base/_html.scss
git commit -m "feat: update _html.scss base styles to Jade Mist 02 tokens"
```

---

## Task 7: Update `_layout.scss` — page layout tokens

**Files:**
- Modify: `src/scss/_layout.scss`

- [ ] **Step 1: Update `.views-page` background and padding**

Find the `.views-page` rule and update:

```scss
.views-page {
  flex: 1;
  padding: 36px 40px;           // was 46px
  background-color: var(--page-bg);
  width: calc(100vw - #{$menuWidth});
  overflow: hidden;
  overflow-x: auto;
  @include no-scroll-bar();
  @include use-scroll-bar(var(--scrollbar-a50));
  // ... rest unchanged
}
```

- [ ] **Step 2: Update `.Full` scrollbar token**

Find the `.Full` rule and update the scrollbar mixin call:

```scss
.Full {
  // ...
  @include use-scroll-bar(var(--scrollbar-a50));
}
```

- [ ] **Step 3: Update journey/drawer section (lines with `--color-background-1`)**

The sed script should have already handled these. Verify by running:

```bash
grep -n "color-background\|color-border\|color-text\|color-main\|color-wise\|color-primary" src/scss/_layout.scss
```

Expected: empty. Fix any remaining ones manually using the Token Mapping table.

- [ ] **Step 4: Build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add src/scss/_layout.scss
git commit -m "feat: update _layout.scss to Jade Mist 02 spacing and tokens"
```

---

## Task 8: Update `_AppMenuTree.scss` — sidebar to spec

**Files:**
- Modify: `src/scss/components/_AppMenuTree.scss`

- [ ] **Step 1: Update sidebar container background**

Find `.AppMenuTree {` and change `background-color: #f8fafc;` to:

```scss
.AppMenuTree {
  // ...
  background-color: var(--sidebar-bg);
  // ...
}
```

- [ ] **Step 2: Update header-box border**

The `border-bottom: 1px solid var(--color-border);` was handled by sed → `var(--divider)`. Verify it's correct.

- [ ] **Step 3: Update user avatar**

Find `.user-avatar` and update:

```scss
.user-avatar {
  font-weight: bold;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  margin-right: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  background-color: var(--primary);
  color: var(--primary-fg);
  font-size: 14px;
}
```

- [ ] **Step 4: Update search box (universal-search-box)**

Find `.universal-search-box input` (the search input) — it uses `.custom-input`. Ensure the search box wrapper has the correct bg:

```scss
.universal-search-box {
  position: relative;
  margin: 12px 0;
  background: var(--sidebar-hover);
  border-radius: 8px;
  // ... rest unchanged
  input {
    background: transparent;
    border: none;
    color: var(--sidebar-muted);
    font-size: 14px;
    // ...
    &::placeholder { color: var(--sidebar-muted); }
  }
}
```

- [ ] **Step 5: Update menu-list item states**

Find the menu list item styles (`.menu-list-box` children). Update to match spec:

```scss
.menu-list-box {
  padding: 16px 14px;
  // ...
  // Each nav item:
  .menu-item {
    padding: 9px 12px;
    border-radius: 8px;
    font-size: 14px;
    color: var(--sidebar-muted);
    display: flex;
    align-items: center;
    gap: 12px;
    transition: background 0.2s;
    cursor: pointer;

    .menu-icon { font-size: 18px; color: var(--sidebar-muted); }

    &:hover {
      background: var(--sidebar-hover);
    }

    &.active, &.router-link-active {
      background: var(--sidebar-active);
      color: var(--sidebar-fg);
      font-weight: 500;
      .menu-icon { color: var(--sidebar-fg); }
    }
  }
}
```

Note: adjust selector names to match actual HTML structure in `AppMenuTree.vue` — look at the `.vue` file's template to get exact class names if needed.

- [ ] **Step 6: Build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 7: Commit**

```bash
git add src/scss/components/_AppMenuTree.scss
git commit -m "feat: update sidebar to Jade Mist 02 spec"
```

---

## Task 9: Update `_compTabs.scss` — pill tabs

**Files:**
- Modify: `src/scss/components/_compTabs.scss`

- [ ] **Step 1: Replace tab active state with pill style**

The current tabs use an underline style. Replace the `.compTabs` content with pill-style tabs:

```scss
.compTabs {
  padding: 0;
  margin: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  border-bottom: none;   // remove underline bar

  .compTabs-item {
    cursor: pointer;
    user-select: none;
  }

  .compTabs-item.is-active {
    border-bottom: none;   // remove old underline
    border-radius: 999px;
    background-color: var(--text);

    .compTabs-label-btn {
      color: var(--surface);
      font-weight: 500;
    }
  }

  .compTabs-label-btn {
    border: 0;
    background: transparent !important;
    padding: 6px 14px;
    font-size: 14px;
    border-radius: 999px;
    color: var(--text-muted);
    transition: background 0.2s, color 0.2s;

    &:hover {
      background: var(--sidebar-hover);
      color: var(--text);
    }

    &:disabled {
      color: var(--text-muted);
      opacity: 0.5;
      cursor: not-allowed;
    }

    &:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
  }
}
```

- [ ] **Step 2: Build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add src/scss/components/_compTabs.scss
git commit -m "feat: update compTabs to Jade Mist 02 pill style"
```

---

## Task 10: Update `_compDropDown.scss` — popover/dropdown

**Files:**
- Modify: `src/scss/components/_compDropDown.scss`

- [ ] **Step 1: Update dropdown-menu container**

Find `.dropdown-menu` and update shadow and borders:

```scss
.dropdown-menu {
  background: var(--surface);
  border: 1px solid var(--divider);
  border-radius: 10px;
  box-shadow: 0 8px 28px -6px rgba(var(--shadow),0.22);
  padding: 6px;
  // ... keep z-index, position etc.
}
```

- [ ] **Step 2: Update dropdown-trigger hover**

```scss
.dropdown-trigger {
  border: 1px solid var(--divider);
  // ...
  &:hover {
    border-color: var(--accent);
  }
}
```

- [ ] **Step 3: Update dropdown item states**

Find the item/option styles inside `.dropdown-menu` and update:

```scss
.dropdown-item, .dropdown-option {
  padding: 9px 12px;
  font-size: 14px;
  border-radius: 6px;
  color: var(--text);
  transition: background 0.15s;
  cursor: pointer;

  &:hover {
    background: var(--accent-soft);
  }

  &.danger, &.is-danger {
    color: var(--danger);
  }
}
```

Note: adjust selectors to match actual class names in the SCSS file.

- [ ] **Step 4: Build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add src/scss/components/_compDropDown.scss
git commit -m "feat: update dropdown to Jade Mist 02 popover spec"
```

---

## Task 11: Update `_compModal.scss` — modal shadow and surface

**Files:**
- Modify: `src/scss/components/_compModal.scss`

- [ ] **Step 1: Update modal shadow**

Find the main modal container rule and update:

```scss
// Main modal panel
.modal-panel, .swal2-popup, [class*="modal-content"] {
  background: var(--surface);
  border-radius: 16px;
  box-shadow: 0 24px 80px -16px rgba(var(--shadow),0.28),
              0 8px 20px -8px rgba(var(--shadow),0.12);
}
```

Adjust selector to match the actual modal wrapper class used in the file.

- [ ] **Step 2: Verify sed already handled `--divider` borders**

```bash
grep -n "color-border\|color-background\|color-text" src/scss/components/_compModal.scss
```

Expected: empty.

- [ ] **Step 3: Build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add src/scss/components/_compModal.scss
git commit -m "feat: update modal to Jade Mist 02 shadow spec"
```

---

## Task 12: Update `_ProjectListContent.scss` — card spec

**Files:**
- Modify: `src/scss/components/_ProjectListContent.scss`

- [ ] **Step 1: Update card container**

Find the project card container rule and update:

```scss
.project-card, .ProjectCard {
  background: var(--surface);
  border: 1px solid var(--divider);
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  transition: box-shadow 0.2s, border-color 0.2s;

  &:hover {
    box-shadow: 0 4px 12px -4px rgba(var(--shadow),0.12);
  }

  &.is-selected, &.active {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(0,160,120,0.13);
  }
}
```

Adjust selectors to match actual class names.

- [ ] **Step 2: Update card thumbnail area**

```scss
.card-thumbnail, .card-thumb {
  background: var(--sidebar-bg);
  border-bottom: 1px solid var(--divider);
}
```

- [ ] **Step 3: Update card chip/badge**

```scss
.card-chip, .chip {
  padding: 4px 10px;
  background: var(--surface);
  border: 1px solid var(--divider);
  color: var(--text-muted);
  font-family: $font-family-mono;
  letter-spacing: 0.04em;
  border-radius: 999px;
  font-size: 11px;
}
```

- [ ] **Step 4: Update card avatar (24px size)**

```scss
.card-avatar, .member-avatar {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: var(--primary);
  color: var(--primary-fg);
  font-weight: 700;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

- [ ] **Step 5: Verify card grid**

Find the card grid layout and ensure it uses `gap: 22px`:

```scss
.project-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
}
```

- [ ] **Step 6: Build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 7: Commit**

```bash
git add src/scss/components/_ProjectListContent.scss
git commit -m "feat: update project card to Jade Mist 02 spec"
```

---

## Task 13: Update `_custom.scss` — SweetAlert2 and third-party

**Files:**
- Modify: `src/scss/_custom.scss`

- [ ] **Step 1: Verify sed replacements are complete**

```bash
grep -n "color-background\|color-border\|color-text\|color-wise\|color-primary\|color-main" src/scss/_custom.scss
```

Expected: empty (sed from Task 5 handled these).

- [ ] **Step 2: Update SweetAlert modal shadow**

Find the `.swal2-modal` rule and update:

```scss
.swal2-modal {
  background-color: var(--surface);
  border-radius: 16px;
  box-shadow: 0 24px 80px -16px rgba(var(--shadow),0.28),
              0 8px 20px -8px rgba(var(--shadow),0.12) !important;
  // ...
}
```

- [ ] **Step 3: Update SweetAlert button colors**

Find the `.swal2-styled.btn-primary` rule — it may still reference hardcoded colors. Update to:

```scss
.swal2-styled.btn-primary {
  background: var(--primary) !important;
  color: var(--primary-fg) !important;
  &:hover { background: var(--primary-hover) !important; }
}
```

- [ ] **Step 4: Build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add src/scss/_custom.scss
git commit -m "feat: update _custom.scss to Jade Mist 02 tokens"
```

---

## Task 14: Final verification — build, lint, visual check

- [ ] **Step 1: Full build**

```bash
npm run build 2>&1 | tail -20
```

Expected: no errors. Warnings about unused vars are acceptable.

- [ ] **Step 2: Check for any remaining old tokens**

```bash
grep -r "var(--color-" src/scss --include="*.scss" \
  | grep -v "_theme.scss\|_themeDark.scss\|_variables.scss" \
  | grep -v "color-wise-badge\|color-wise-rank\|color-wise-table\|color-wise-empty\|color-explore\|color-grey-1\|color-tab-active\|color-switch-active"
```

Expected: empty. Fix any hits manually.

- [ ] **Step 3: Check AiViewer tokens**

```bash
grep -n "color-background\|color-border\|color-text\|color-wise\|color-primary\|color-main" src/scss/views/_AiViewer.scss | head -20
```

Expected: empty (all renamed by Task 5 sed). Fix any remaining manually using the Token Mapping table.

- [ ] **Step 4: Start dev server and visually verify**

```bash
npm run dev
```

Open browser and check each key screen:
- [ ] Sidebar: bg `#F2F6F7`, items hover/active states correct
- [ ] ProjectDashboard: page bg `#FAFCFC`, cards white with border
- [ ] Pill tabs: dark ink background on active
- [ ] Dropdown: shadow correct, hover uses `--accent-soft`
- [ ] Avatar: green `#00A078` bg
- [ ] Primary button: green with correct shadow
- [ ] AiViewer: toolbar and panel backgrounds use correct tokens (no broken/white panels)
- [ ] Toggle dark mode (set `document.documentElement.dataset.theme = 'dark'` in console): page goes dark, sidebar darker than main

- [ ] **Step 5: Run type check**

```bash
npm run type-check 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "feat: complete Jade Mist 02 design system migration"
```

---

## Task 15: Clean up rename script

- [ ] **Step 1: Remove temporary script**

```bash
rm scripts/rename-tokens.sh
git add scripts/rename-tokens.sh
git commit -m "chore: remove token rename script"
```
