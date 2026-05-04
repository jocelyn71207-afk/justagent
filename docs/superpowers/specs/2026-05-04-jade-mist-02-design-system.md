# Jade Mist 02 Design System Migration

**Date:** 2026-05-04  
**Strategy:** B — Full token rename (全量替換)  
**Scope:** All views including AiViewer, Light + Dark mode, Font update

---

## 1. Overview

Apply the Jade Mist 02 design system to the entire JustAgent product. This replaces all existing `--color-*` CSS custom properties with the new semantic token names defined in `design.md`, updates typography to use Noto Sans TC + Public Sans + JetBrains Mono, and adds a complete dark mode token set using `[data-theme="dark"]`.

Primary color `#00A078` / accent `#00C896` remain unchanged.

---

## 2. Token Migration Map

### 2.1 Old → New CSS Custom Property Mapping

| Old Token | New Token | Value (light) |
|---|---|---|
| `--color-background` | `--page-bg` | `#FAFCFC` |
| `--color-background-1`, `--color-background-2` | `--surface` | `#FFFFFF` |
| `--color-border`, `--color-border-1`, `--color-border-strong` | `--divider` | `#E8EDEE` |
| `--color-text` | `--text` | `#09151A` |
| `--color-text-alpha50` (muted usage) | `--text-muted` | `#3F565E` |
| `--color-text-alpha30` (faint usage) | `--text-faint` | `#7F929A` |
| `--color-primary` | `--primary` | `#00A078` |
| `--color-primary-hover` | `--primary-hover` | `#007F5F` |
| `--color-primary-fg` | `--primary-fg` | `#FFFFFF` |
| `--color-accent`, `--color-main`, `--color-wise-green` | `--accent` | `#00C896` |
| `--color-accent-soft`, `--color-primary-muted`, `--color-wise-surface`, `--color-wise-mint` | `--accent-soft` | `#CFEFE2` |
| `--color-sidebar-bg` | `--sidebar-bg` | `#F2F6F7` |
| `--color-sidebar-hover`, `--color-bg-muted` | `--sidebar-hover` | `#E8EEF0` |
| `--color-sidebar-active` | `--sidebar-active` | `#D9E2E4` |
| `--color-sidebar-fg` | `--sidebar-fg` | `#0E1A1C` |
| `--color-sidebar-muted` | `--sidebar-muted` | `#6A7C82` |
| `--color-hint` | `--hint` | `#CFEFE2` |
| `--color-hint-text` | `--hint-text` | `#004A33` |
| `--color-link-text` | `--primary` | |
| `--color-link-text-active` | `--primary-hover` | |
| `--color-heading` | `--primary` | |

**Removed (no replacement needed):**
- `--color-wise-black`, `--color-wise-gray`, `--color-wise-warm-dark` → use `--text`, `--text-faint`, `--text-muted`
- `--color-wise-card`, `--color-wise-bg`, `--color-wise-chart-bg`, `--color-bg`, `--color-bg-subtle` → use `--surface` / `--page-bg`
- `--color-wise-badge-*`, `--color-wise-rank-*`, `--color-wise-empty-border` → keep as standalone SCSS variables
- `--color-background-alpha*` series → replace with `rgba(var(--page-bg-raw), N)` or use inline alpha where needed
- `--color-text-alpha*` series → use `--text-muted` / `--text-faint` for common cases; inline alpha for others
- `--color-shadow`, `--color-scrollbar*`, `--color-userSay-record`, `--color-tab-active-bg`, `--color-switch-active-bg` → updated inline per component

### 2.2 Full Token Set in `_theme.scss`

```css
:root {
  /* Brand */
  --primary:         #00A078;
  --primary-hover:   #007F5F;
  --primary-fg:      #FFFFFF;
  --accent:          #00C896;
  --accent-soft:     #CFEFE2;

  /* Surfaces */
  --page-bg:         #FAFCFC;
  --surface:         #FFFFFF;
  --sidebar-bg:      #F2F6F7;
  --sidebar-hover:   #E8EEF0;
  --sidebar-active:  #D9E2E4;
  --divider:         #E8EDEE;

  /* Text */
  --text:            #09151A;
  --text-muted:      #3F565E;
  --text-faint:      #7F929A;
  --sidebar-fg:      #0E1A1C;
  --sidebar-muted:   #6A7C82;

  /* Semantic */
  --success:         #00A078;
  --warning:         #CF8A1F;
  --danger:          #D14437;
  --hint:            #CFEFE2;
  --hint-text:       #004A33;

  /* Scrollbar */
  --scrollbar:       #D0D8DA;
}

[data-theme="dark"] {
  /* Surfaces */
  --page-bg:         #0F1719;
  --surface:         #152124;
  --sidebar-bg:      #0B1315;
  --sidebar-hover:   #162226;
  --sidebar-active:  #1F2E32;
  --divider:         #1F2C2F;

  /* Text */
  --text:            #EAF3F2;
  --text-muted:      #A4B6B9;
  --text-faint:      #6F8589;
  --sidebar-fg:      #EAF3F2;
  --sidebar-muted:   #8AA0A4;

  /* Brand (unchanged except hover) */
  --primary:         #00A078;
  --primary-hover:   #00C896;
  --primary-fg:      #FFFFFF;
  --accent:          #00C896;
  --accent-soft:     #0E3E32;

  /* Semantic */
  --success:         #00C896;
  --warning:         #E0A24A;
  --danger:          #EC6B5E;
  --hint:            #0E3E32;
  --hint-text:       #9CE9CB;

  /* Scrollbar */
  --scrollbar:       #2A3C40;
}
```

---

## 3. Typography

### 3.1 Font Loading (`index.html`)

Add to `<head>` after existing Google Fonts link:
```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&family=Public+Sans:wght@400;600;700&display=swap" rel="stylesheet">
```

### 3.2 Font Family Update (`_variables.scss`)

```scss
$font-family: 'Noto Sans TC', system-ui, sans-serif;  // main UI / Chinese
$font-family-heading: 'Public Sans', sans-serif;       // English numbers, Logo
$font-family-mono: 'JetBrains Mono', monospace;        // code, kicker, chip
```

### 3.3 Type Scale

| Usage | Size / Weight / Tracking |
|---|---|
| H1 page title | 22–24px / 700 / -0.01em |
| H2 section | 18–20px / 600 / -0.005em |
| Card title | 14px / 500 |
| Body / label | 14px / 400–500 |
| Helper text | 12px / 400 |
| Kicker (chip/badge) | 11px / 600 / 0.14em / uppercase / JetBrains Mono |

---

## 4. Component Specs

### 4.1 Primary Button (CTA)
```css
background: var(--primary);
color: var(--primary-fg);
padding: 9px 16px;
border-radius: 8px;
font-size: 14px;
font-weight: 500;
border: none;
box-shadow: 0 1px 2px rgba(0,160,120,0.25);
/* hover */ background: var(--primary-hover);
```

### 4.2 Secondary Button
```css
background: var(--surface);
border: 1px solid var(--divider);
color: var(--text);
padding: 9px 12px;
border-radius: 8px;
font-size: 13px;
```

### 4.3 Pill Tab
- Default: no bg, `color: var(--text-muted)`, `padding: 6px 14px`, `border-radius: 999px`
- Active: `background: var(--text)` (deep ink), `color: var(--surface)`

### 4.4 Project Card
```css
background: var(--surface);
border: 1px solid var(--divider);
border-radius: 12px;
box-shadow: 0 1px 2px rgba(0,0,0,0.03);
```
- Selected: `border-color: var(--primary)` + `box-shadow: 0 0 0 3px #00A07822`
- Thumbnail area: `background: var(--sidebar-bg)`; chip uses JetBrains Mono
- Avatar 24px: `background: var(--primary)`, `color: var(--primary-fg)`, 700, 11px
- Grid: `repeat(3, 1fr)`, `gap: 22px`

### 4.5 Sidebar (AppMenuTree)
- Container: `background: var(--sidebar-bg)`, `padding: 18px 14px`, `width: 260px`
- Item normal: `padding: 9px 12px`, `color: var(--sidebar-muted)`, `font-size: 14px`
- Item hover: `background: var(--sidebar-hover)`
- Item active: `background: var(--sidebar-active)`, `color: var(--sidebar-fg)`, `font-weight: 500`
- Icon size: 18px, gap: 12px
- Search box: `background: var(--sidebar-hover)`, `border-radius: 8px`

### 4.6 Popover / Dropdown
```css
background: var(--surface);
border: 1px solid var(--divider);
border-radius: 10px;
box-shadow: 0 8px 28px -6px rgba(15,23,42,0.22);
padding: 6px;
```
- Item: `padding: 9px 12px`, `font-size: 14px`, `border-radius: 6px`
- Hover bg: `var(--accent-soft)`
- Danger: `color: var(--danger)`

### 4.7 Badge / Chip
```css
padding: 4px 10px;
background: var(--surface);
border: 1px solid var(--divider);
color: var(--text-muted);
font-family: var(--font-mono);  /* JetBrains Mono */
letter-spacing: 0.04em;
border-radius: 999px;
font-size: 11px;
```

### 4.8 Avatar
- Sidebar: 34px; Card: 24px
- `border-radius: 999px`, `background: var(--primary)`, `color: var(--primary-fg)`, `font-weight: 700`

### 4.9 Modal
```css
background: var(--surface);
border-radius: 16px;
box-shadow: 0 24px 80px -16px rgba(15,23,42,0.28),
            0 8px 20px -8px rgba(15,23,42,0.12);
```

### 4.10 Dark Mode Component Differences
| Component | Dark difference |
|---|---|
| Primary button | hover becomes `#00C896`; shadow uses `rgba(0,200,150,0.20)` |
| Card | `background: var(--surface)` = #152124; selected ring `#00C89630` |
| Pill tab active | `background: var(--text)` = #EAF3F2, `color: var(--page-bg)` = #0F1719 |
| Popover | shadow `0 12px 36px -8px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.02)` |
| Card shadow | `inset 0 1px 0 rgba(255,255,255,0.03)` |

---

## 5. Spacing & Shadows

### Spacing
- Page padding: `36px 40px`
- Container padding: `24 / 36 / 40px`
- Component gap: `6 / 8 / 12 / 14 / 18 / 22px`
- Sidebar padding: `14px`; item gap: `2px`

### Border Radius
- Card / popover / frame: `12–16px`
- Button / input / sidebar item: `8px`
- Small chip / badge: `6px`
- Pill / tab / avatar: `999px`

### Shadows
```css
/* Card resting */        0 1px 2px rgba(0,0,0,0.03)
/* Popover */             0 8px 28px -6px rgba(15,23,42,0.22)
/* Modal / large frame */ 0 24px 80px -16px rgba(15,23,42,0.28), 0 8px 20px -8px rgba(15,23,42,0.12)
/* Primary button */      0 1px 2px rgba(0,160,120,0.25)
/* Card selected ring */  0 0 0 3px #00A07822
```

---

## 6. Icon Spec

- Library: Material Symbols Rounded (already loaded)
- Default size: 18px (sidebar/content), 16px (inline/chevron), 20px (header actions)
- Sidebar icons: `color: var(--sidebar-muted)`
- Content icons: `color: var(--text-muted)`
- Active/selected icons: `color: var(--text)` or `var(--primary)`
- `font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24`

---

## 7. Files to Change

| File | Change Type | Description |
|---|---|---|
| `index.html` | Font | Add Noto Sans TC + Public Sans |
| `src/scss/base/_variables.scss` | Token | Update `$font-family`, SCSS color variable values |
| `src/scss/base/_theme.scss` | Token | Full replacement — new light + dark CSS vars |
| `src/scss/base/_themeDark.scss` | Token | Replace `@media (prefers-color-scheme: dark) :root` block with `[data-theme="dark"]` selector; keep `@media` wrapper as fallback pointing to same vars |
| `src/scss/base/_html.scss` | Font + Token | `body` font-family; `custom-input` border/focus tokens |
| `src/scss/_layout.scss` | Layout + Token | `.views-page` bg, padding; `.Full` bg; `.AppMenuTree` token refs |
| `src/scss/components/_AppMenuTree.scss` | Component | sidebar bg, item states, avatar, search box |
| `src/scss/components/_compDropDown.scss` | Component | popover shadow, item hover, danger |
| `src/scss/components/_compTabs.scss` | Component | pill tab active state |
| `src/scss/components/_compModal.scss` | Component | modal shadow + border-radius |
| `src/scss/components/_compSwitch.scss` | Component | token refs |
| `src/scss/components/_compPagination.scss` | Component | token refs |
| `src/scss/components/_AppSkeleton.scss` | Component | token refs |
| `src/scss/components/_ProjectListContent.scss` | Component | card, chip, avatar specs |
| `src/scss/_custom.scss` | Token | SweetAlert2 token refs |
| `src/scss/views/_ProjectDashboard.scss` | View | card grid, token refs |
| `src/scss/views/_TeamProject.scss` | View | same as ProjectDashboard |
| `src/scss/views/_Knowledge*.scss` | View | token refs |
| `src/scss/views/_ResourceLibrary.scss` | View | token refs |
| `src/scss/views/_TeamAccessManagement.scss` | View | token refs |
| `src/scss/views/_CompanyTeamSettings.scss` | View | token refs |
| `src/scss/views/_AppEntrance.scss` | View | token refs (login) |
| `src/scss/views/_AiViewer.scss` | View | token refs (toolbar, panel) |
| `src/scss/views/_Explore.scss` | View | token refs |
| `src/scss/views/_ProjectTrashCans.scss` | View | token refs |
| `src/scss/views/_GUI.scss` | View | token refs |

---

## 8. Constraints & Don'ts (from design.md)

- No large-area use of `#00C896` as background
- No warm/beige/pure-black backgrounds
- No sidebar colors darker than `--sidebar-active`
- No stacked shadows (drop-shadow + inset + glow together)
- No undefined green variants — derive only from `#00A078 / #00C896 / #CFEFE2 / #004A33`
- No emoji as icons — use Material Symbols Rounded only

---

## 9. Out of Scope

- Vue component logic changes (no `.vue` file edits)
- New features or layout restructuring
- Third-party library overrides beyond what already exists in `_custom.scss`
