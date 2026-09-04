# 技能管理大後台原型（skill-admin.html）視覺重新設計 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the standalone `skill-admin.html` prototype (8 pages, 8 modals, ~1070 lines, all inline-styled with hardcoded Ant-Design-blue hex) into a token-based, component-driven design system ("Modern SaaS Console" style) without changing any data, feature, or JS behavior.

**Architecture:** Strangler-fig extraction — pull the single inline `<style>` block apart selector-group by selector-group into `skill-admin/tokens.css` → `layout.css` → `components.css`, rewriting each group against design tokens as it's extracted, deleting it from the old block immediately so there's never a period of two conflicting rules for the same selector. The `<script>` block moves to `skill-admin/app.js` verbatim (mechanical, no logic change). Two page-specific tasks (Tool 管理's `server-card`, Skills Repository's derived-row grouping) restructure markup that was actively causing the density complaints; every other page inherits the new look for free once the shared component CSS lands.

**Tech Stack:** Plain HTML/CSS/JS, zero build step, zero dependencies — same as the original file. No test runner exists for this file; verification is manual browser inspection via `open skill-admin.html` (macOS) plus a concrete checklist per task.

**Spec:** `docs/superpowers/specs/2026-09-03-skill-admin-prototype-redesign-design.md`

## Global Constraints

- Do not add, remove, or rename any page, modal, field, or piece of sample data — the 8 pages and 8 modals keep their current content verbatim.
- Do not change the behavior or signatures of the existing JS functions: `showPage(pageId)`, `openModal(id)`, `closeModal(id)`, `toggleToolSource()`, `switchAdminMode(mode)`, `selectTestSkill(el)`, `switchStatsTab(panelId)`, `switchTestCaseTab(panelId)`. Only their file location changes (moving into `skill-admin/app.js`).
- Do not migrate this prototype into the Vue app (`src/`) — nothing under `src/` is touched by this plan.
- No dark mode, no responsive/mobile layout — light mode, desktop-only, matching the original.
- New files live under `skill-admin/`: `tokens.css`, `layout.css`, `components.css`, `app.js`. `skill-admin.html` stays at the repo root.
- After this plan is complete, no hardcoded hex color may remain anywhere in `skill-admin.html`, `skill-admin/layout.css`, or `skill-admin/components.css` — every color is a `var(--...)` reference into `skill-admin/tokens.css`. Hex values are only allowed to live inside `tokens.css` itself.
- Numeric data cells (usage counts, stat values, percentages) get `font-variant-numeric: tabular-nums`.
- All verification in this plan is manual: run `open skill-admin.html` (or refresh the tab if already open) and check the file against the listed expectations — there is no automated test suite for this file.

---

### Task 1: Extract inline `<script>` into `skill-admin/app.js`

Mechanical move, zero behavior change. Isolates JS risk from the CSS rewrite that follows.

**Files:**
- Create: `skill-admin/app.js`
- Modify: `skill-admin.html:1023-1067` (the `<script>...</script>` block just before `</body>`)

**Interfaces:**
- Produces: `skill-admin/app.js`, loaded via `<script src="skill-admin/app.js"></script>` — every later task that touches HTML may rely on this file existing and being loaded at the end of `<body>`.

- [ ] **Step 1: Create `skill-admin/app.js` with the exact current script contents**

```js
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + pageId).classList.add('active');
  document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
  if (event && event.currentTarget) event.currentTarget.classList.add('active');
}
document.querySelectorAll('.nav-group-title').forEach(title => {
  title.addEventListener('click', () => title.parentElement.classList.toggle('collapsed'));
});
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
document.querySelectorAll('.modal-mask').forEach(mask => {
  mask.addEventListener('click', e => { if (e.target === mask) mask.classList.remove('active'); });
});
function toggleToolSource() {
  const val = document.getElementById('tool-source-select').value;
  document.getElementById('native-tool-fields').style.display = val === 'native' ? 'block' : 'none';
  document.getElementById('mcp-tool-fields').style.display = val === 'mcp' ? 'block' : 'none';
}
function switchAdminMode(mode) {
  document.querySelectorAll('.admin-test-mode').forEach(m => { m.classList.remove('active'); m.style.display = 'none'; });
  const el = document.getElementById('admin-mode-' + mode);
  el.classList.add('active'); el.style.display = 'flex';
  document.querySelectorAll('.admin-mode-tab').forEach(t => t.classList.remove('active'));
  event.currentTarget.classList.add('active');
}
function selectTestSkill(el) {
  document.querySelectorAll('.test-skill-opt').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
}
function switchStatsTab(panelId) {
  document.querySelectorAll('.stats-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(panelId).classList.add('active');
  document.querySelectorAll('#stats-tabs .tab-item').forEach(t => t.classList.remove('active'));
  event.currentTarget.classList.add('active');
}
function switchTestCaseTab(panelId) {
  document.querySelectorAll('.tc-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(panelId).classList.add('active');
  document.querySelectorAll('#test-case-tabs .tab-item').forEach(t => t.classList.remove('active'));
  event.currentTarget.classList.add('active');
}
```

- [ ] **Step 2: Replace the inline `<script>` block in `skill-admin.html` with a reference to the new file**

Delete the entire `<script> ... </script>` block (originally lines 1023-1066) and replace with:

```html
  <script src="skill-admin/app.js"></script>
```

- [ ] **Step 3: Verify no behavior changed**

Run: `open skill-admin.html`
Expected, walking through manually:
- Sidebar nav links still switch pages (click "企業擴充追蹤", "Tool 管理", etc. — content area updates, clicked link highlights)
- Clicking a `.nav-group-title` (e.g. "Skill 開發") still collapses/expands its children
- "+ 新增 Skill" opens `modal-create-skill`; clicking the dark overlay outside the modal box closes it
- On the Skill 測試中心 page, clicking "⚡ 觸發測試" switches the admin-mode panel; clicking a different skill in the left list highlights it
- On 使用統計, clicking "Tool 使用排行" switches the stats panel
- Open the browser DevTools console — no JS errors

- [ ] **Step 4: Commit**

```bash
git add skill-admin.html skill-admin/app.js
git commit -m "refactor(skill-admin): extract inline script into skill-admin/app.js

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Create design tokens and wire up the new stylesheet files

Establishes the full token vocabulary and the three CSS files the rest of the plan fills in. No visual change yet — nothing references the new variables until Task 3+.

**Files:**
- Create: `skill-admin/tokens.css`
- Create: `skill-admin/layout.css` (header comment only for now)
- Create: `skill-admin/components.css` (header comment only for now)
- Modify: `skill-admin.html:7` (inside `<head>`, before the existing inline `<style>` block)

**Interfaces:**
- Produces: every CSS custom property listed below — every later task consumes these, never a raw hex value.

- [ ] **Step 1: Write `skill-admin/tokens.css`**

```css
/*
 * Design tokens for the skill-admin prototype.
 * Every color used anywhere else in this project (layout.css, components.css,
 * skill-admin.html) must be one of the var(--...) names below — never a raw hex.
 *
 * Mapping from the OLD hardcoded hex palette (for reference while migrating):
 *   #1890ff -> --accent-500        #40a9ff -> --accent-600 (hover)
 *   #52c41a -> --success-text      #f6ffed -> --success-bg      #b7eb8f -> success border (drop, use --success-text at low opacity if a border is truly needed)
 *   #fa8c16 -> --warning-text      #fff7e6 / #fffbe6 -> --warning-bg   #ffd591 -> warning border (same note as above)
 *   #ff4d4f -> --danger-text       #fff2f0 / #fff0f0 -> --danger-bg    #ffccc7 -> danger border (same note)
 *   #722ed1 -> --tag-purple-text   #f9f0ff -> --tag-purple-bg    #d3adf7 -> drop border, rely on bg contrast
 *   #13c2c2 -> --tag-cyan-text     #e6fffb -> --tag-cyan-bg      #87e8de -> drop border
 *   #4338ca / #eef2ff / #a5b4fc -> --tag-indigo-text / --tag-indigo-bg (drop border)
 *   #0f766e / #f0fdfa / #5eead4 -> --tag-teal-text / --tag-teal-bg (drop border)
 *   #8c8c8c -> --gray-400 (secondary text)      #666 -> --gray-600      #333 -> --gray-800
 *   #d9d9d9 -> --gray-300 (borders)  #e8e8e8 -> --gray-200  #f0f0f0/#f5f5f5 -> --gray-100  #fafafa -> --gray-50
 *   #001529 / #0d2137 / #000c17 / #8899aa / #b0bec5 -> sidebar goes light in this redesign, these have no replacement (deleted, not mapped)
 */
:root {
  /* Neutral grayscale */
  --gray-50:  #fafafa;
  --gray-100: #f4f4f5;
  --gray-200: #e4e4e7;
  --gray-300: #d4d4d8;
  --gray-400: #a1a1aa;
  --gray-500: #71717a;
  --gray-600: #52525b;
  --gray-700: #3f3f46;
  --gray-800: #27272a;
  --gray-900: #18181b;

  /* Accent (indigo) */
  --accent-50:  #eef2ff;
  --accent-100: #e0e7ff;
  --accent-500: #4f46e5;
  --accent-600: #4338ca;
  --accent-700: #3730a3;

  /* Semantic status colors: bg = pale fill, text = readable-on-white foreground */
  --success-bg:   #ecfdf5;
  --success-text: #059669;
  --warning-bg:   #fffbeb;
  --warning-text: #d97706;
  --danger-bg:    #fef2f2;
  --danger-text:  #dc2626;
  --info-bg:      #eff6ff;
  --info-text:    #2563eb;

  /* Category tag colors (Skill 層級 / Tool 來源分類) */
  --tag-blue-bg:    #eef2ff;   /* 系統 */
  --tag-blue-text:  #4f46e5;
  --tag-indigo-bg:   #eef2ff;  /* 企業 */
  --tag-indigo-text: #4338ca;
  --tag-teal-bg:    #f0fdfa;   /* 團隊 */
  --tag-teal-text:  #0f766e;
  --tag-gray-bg:    #f4f4f5;   /* 獨立能力 */
  --tag-gray-text:  #71717a;
  --tag-purple-bg:  #f5f3ff;   /* MCP */
  --tag-purple-text: #7c3aed;
  --tag-cyan-bg:    #ecfeff;   /* Native */
  --tag-cyan-text:  #0891b2;
  --tag-orange-bg:  #fff7ed;   /* 企業/團隊子標籤 */
  --tag-orange-text: #c2410c;

  /* Spacing scale (4px base) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-7: 28px;
  --space-8: 32px;

  /* Typography scale */
  --text-xs:   11px;
  --text-sm:   12px;
  --text-base: 13px;
  --text-md:   14px;
  --text-lg:   15px;
  --text-xl:   16px;
  --text-stat: 22px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;

  /* Shadow (only used on hover / floating layers, never as a default card state) */
  --shadow-sm: 0 1px 3px rgba(24, 24, 27, 0.08);
  --shadow-md: 0 8px 24px rgba(24, 24, 27, 0.14);
}
```

- [ ] **Step 2: Create the (temporarily empty) `skill-admin/layout.css`**

```css
/* skill-admin layout: reset, sidebar, topbar, page shell. Populated in Task 3. */
```

- [ ] **Step 3: Create the (temporarily empty) `skill-admin/components.css`**

```css
/* skill-admin shared components: buttons, tables, tags, stat cards, tabs, modals, chat, server-card. Populated across Tasks 4-7. */
```

- [ ] **Step 4: Link all three files from `<head>`, before the existing inline `<style>` block**

In `skill-admin.html`, right after `<title>Agent Skill 管控</title>` and before `<style>`, add:

```html
  <link rel="stylesheet" href="skill-admin/tokens.css">
  <link rel="stylesheet" href="skill-admin/layout.css">
  <link rel="stylesheet" href="skill-admin/components.css">
```

- [ ] **Step 5: Verify nothing changed visually**

Run: `open skill-admin.html`
Expected: page looks pixel-identical to before this task (the old inline `<style>` block is still present and still wins, since the new files don't define any of the same selectors yet). DevTools console shows no 404s for the three new stylesheet links and no CSS errors.

- [ ] **Step 6: Commit**

```bash
git add skill-admin.html skill-admin/tokens.css skill-admin/layout.css skill-admin/components.css
git commit -m "feat(skill-admin): add design tokens and stylesheet scaffolding

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Rebuild the shell — sidebar, topbar, page container

First visible change. Applies to all 8 pages at once since the shell is shared markup.

**Files:**
- Modify: `skill-admin/layout.css`
- Modify: `skill-admin.html` (delete the corresponding rules from the inline `<style>` block)

**Interfaces:**
- Consumes: `--gray-*`, `--accent-*`, `--space-*`, `--text-*` from `tokens.css` (Task 2)
- Produces: `.sidebar`, `.sidebar-brand`, `.nav-group`, `.nav-group-title`, `.nav-children`, `.nav-link`(`.active`), `.main`, `.page-header`, `.page-content`, `.page`(`.active`) — every later task's HTML continues to use these exact class names, only `components.css` classes are added inside them.

- [ ] **Step 1: Write the shell rules into `skill-admin/layout.css`**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Microsoft JhengHei', 'Segoe UI', sans-serif;
  background: var(--gray-50);
  color: var(--gray-800);
  display: flex;
  min-height: 100vh;
  font-size: var(--text-base);
}

.sidebar {
  width: 200px;
  background: var(--gray-50);
  border-right: 1px solid var(--gray-200);
  color: var(--gray-700);
  position: fixed;
  height: 100vh;
  overflow-y: auto;
  z-index: 20;
}
.sidebar-brand {
  padding: var(--space-4) var(--space-3);
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--gray-900);
  border-bottom: 1px solid var(--gray-200);
}
.sidebar-brand small {
  display: block;
  font-size: var(--text-xs);
  color: var(--gray-400);
  font-weight: 400;
  margin-top: 2px;
}
.nav-group { border-bottom: 1px solid var(--gray-200); padding-bottom: var(--space-1); }
.nav-group-title {
  padding: var(--space-3) var(--space-4) var(--space-2);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--gray-400);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.nav-group-title:hover { color: var(--gray-700); }
.nav-group-title::after { content: '▾'; font-size: 10px; }
.nav-group.collapsed .nav-group-title::after { content: '▸'; }
.nav-group.collapsed .nav-children { display: none; }
.nav-children { padding: 0 var(--space-2); }
.nav-link {
  display: block;
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-base);
  color: var(--gray-600);
  text-decoration: none;
  cursor: pointer;
  border-radius: var(--radius-sm);
  margin-bottom: 2px;
  transition: background 0.15s, color 0.15s;
}
.nav-link:hover { color: var(--gray-900); background: var(--gray-100); }
.nav-link.active { color: var(--accent-600); background: var(--accent-50); font-weight: 600; }

.main { flex: 1; margin-left: 200px; }
.page-header {
  background: #fff;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--gray-200);
}
.page-header h2 { font-size: var(--text-xl); font-weight: 700; color: var(--gray-900); }
.page-header p { font-size: var(--text-base); color: var(--gray-500); margin-top: 2px; }
.page-content { padding: var(--space-5) var(--space-6); }
.page { display: none; }
.page.active { display: block; }
```

- [ ] **Step 2: Delete the now-superseded rules from the inline `<style>` block in `skill-admin.html`**

Delete these exact rules (they now live in `layout.css`): `* { margin... }`, `body { ... }`, `.sidebar { ... }` through `.nav-link.active { ... }` (all sidebar/nav rules), `.main { ... }`, `.page-header { ... }` / `.page-header h2 { ... }`, `.page-content { ... }`, `.page { ... }` / `.page.active { ... }`.

- [ ] **Step 3: Verify**

Run: `open skill-admin.html` (or refresh)
Expected:
- Sidebar is now light gray (`--gray-50`) with a thin right border, not the old dark navy `#001529`
- "Skills Repository" nav link shows an indigo-tinted background + indigo text (active state)
- Hovering other nav links shows a light gray background
- Clicking "Skill 開發" group title still collapses/expands its children (behavior unchanged from Task 1)
- All 8 pages still switch correctly when clicking sidebar links (content still just plain, unstyled tables/boxes at this point — that's expected, Task 4+ handles those)

- [ ] **Step 4: Commit**

```bash
git add skill-admin.html skill-admin/layout.css
git commit -m "feat(skill-admin): rebuild sidebar/topbar/page shell with design tokens

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Buttons, filter bar, data table, pagination

Covers the most-reused primitives — every one of the 8 pages has at least a button or a table.

**Files:**
- Modify: `skill-admin/components.css`
- Modify: `skill-admin.html` (delete the corresponding rules from the inline `<style>` block)

**Interfaces:**
- Consumes: tokens from Task 2
- Produces: `.btn`(`.btn-primary`/`.btn-default`/`.btn-success`/`.btn-danger`/`.btn-warning`/`.btn-sm`), `.search-bar`, `.table-wrap`, `.table-toolbar`(`.left`/`.right`), global `table`/`thead`/`th`/`td` element styles, `.pagination`(`.page-btn.active`)

- [ ] **Step 1: Write button, filter-bar, table, and pagination rules into `skill-admin/components.css`**

```css
.btn {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  border: 1px solid var(--gray-300);
  cursor: pointer;
  font-size: var(--text-base);
  height: 30px;
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  background: #fff;
  color: var(--gray-700);
  transition: all 0.15s;
}
.btn-primary { background: var(--accent-500); color: #fff; border-color: var(--accent-500); }
.btn-primary:hover { background: var(--accent-600); border-color: var(--accent-600); }
.btn-default { background: #fff; color: var(--gray-700); }
.btn-default:hover { border-color: var(--accent-500); color: var(--accent-500); }
.btn-success { background: var(--success-text); color: #fff; border-color: var(--success-text); }
.btn-danger { background: var(--danger-text); color: #fff; border-color: var(--danger-text); }
.btn-warning { background: var(--warning-text); color: #fff; border-color: var(--warning-text); }
.btn-sm { padding: 3px var(--space-2); font-size: var(--text-sm); height: 26px; }

.search-bar {
  background: #fff;
  padding: var(--space-4) var(--space-5);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}
.search-bar label { font-size: var(--text-base); color: var(--gray-500); white-space: nowrap; }
.search-bar input, .search-bar select {
  padding: 5px var(--space-2);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-sm);
  font-size: var(--text-base);
  height: 30px;
  outline: none;
}
.search-bar input:focus, .search-bar select:focus { border-color: var(--accent-500); }
.search-bar input { width: 150px; }
.search-bar select { min-width: 100px; }

.table-wrap { background: #fff; border: 1px solid var(--gray-200); border-radius: var(--radius-md); overflow: hidden; }
.table-toolbar {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.table-toolbar .left { display: flex; align-items: center; gap: var(--space-3); }
.table-toolbar .right { display: flex; align-items: center; gap: var(--space-2); }
table { width: 100%; border-collapse: collapse; }
thead { background: var(--gray-50); }
th {
  padding: var(--space-3) var(--space-3);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--gray-400);
  text-align: left;
  border-bottom: 1px solid var(--gray-200);
  white-space: nowrap;
}
td {
  padding: var(--space-3) var(--space-3);
  font-size: var(--text-base);
  border-bottom: 1px solid var(--gray-100);
  vertical-align: middle;
}
td, th { font-variant-numeric: tabular-nums; }
tr:hover td { background: var(--accent-50); }
th.center, td.center { text-align: center; }

.pagination {
  padding: var(--space-3) var(--space-4);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  border-top: 1px solid var(--gray-200);
}
.pagination .page-btn {
  width: 28px; height: 28px;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  font-size: var(--text-sm);
  cursor: pointer;
  background: #fff;
}
.pagination .page-btn.active { background: var(--accent-500); color: #fff; border-color: var(--accent-500); }
.pagination select { height: 28px; border: 1px solid var(--gray-300); border-radius: var(--radius-sm); font-size: var(--text-sm); padding: 0 4px; }
```

- [ ] **Step 2: Delete the now-superseded rules from the inline `<style>` block**

Delete: `.search-bar { ... }` through `.search-bar select { ... }`, all `.btn*` rules, `.table-wrap { ... }` through `td { ... }` / `tr:hover td { ... }` / `th.center, td.center { ... }`, and all `.pagination*` rules.

- [ ] **Step 3: Verify**

Run: `open skill-admin.html` (or refresh)
Expected:
- Skills Repository, 企業擴充追蹤, Agent 配置, Tool 管理, 使用統計's ranking tables all show: rounded 10px table container, light gray uppercase table headers, hover-highlighted rows in pale indigo
- All buttons (查詢/清除/+新增/編輯/測試/etc.) show rounded corners, primary buttons in solid indigo
- Pagination controls at the bottom of tables show rounded page-number boxes with the current page in solid indigo
- Numeric columns (使用次數) are still legible and use tabular figures (should look evenly aligned, not obviously different since digits are all similar width, but verify no layout shift)
- Existing search/filter dropdowns still function as native `<select>`/`<input>` elements (they're unstyled logic-wise, only visuals changed)

- [ ] **Step 4: Commit**

```bash
git add skill-admin.html skill-admin/components.css
git commit -m "feat(skill-admin): restyle buttons, filter bar, tables, pagination

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Tags/pills, stat cards, and semantic status text

**Files:**
- Modify: `skill-admin/components.css`
- Modify: `skill-admin.html` (delete corresponding old rules; convert a handful of inline `style="color:#..."` status cells to a new utility class — see Step 3)

**Interfaces:**
- Consumes: tokens from Task 2
- Produces: `.tag`(`.tag-blue`/`.tag-indigo`/`.tag-teal`/`.tag-gray`/`.tag-purple`/`.tag-cyan`/`.tag-orange`/`.tag-green`/`.tag-red`), `.stat-row`, `.stat-card`(`.stat-card--danger`/`.stat-card--warning`)(`.label`/`.value`/`.sub`), `.status-text`(`.status-text--success`/`.status-text--warning`/`.status-text--danger`), `.row-pending`

- [ ] **Step 1: Write tag, stat-card, and status-text rules into `skill-admin/components.css`**

```css
.tag {
  display: inline-block;
  padding: 2px var(--space-2);
  border-radius: 20px;
  font-size: var(--text-sm);
  line-height: 1.6;
  font-weight: 600;
}
.tag-blue    { background: var(--tag-blue-bg);    color: var(--tag-blue-text); }
.tag-indigo  { background: var(--tag-indigo-bg);  color: var(--tag-indigo-text); }
.tag-teal    { background: var(--tag-teal-bg);    color: var(--tag-teal-text); }
.tag-gray    { background: var(--tag-gray-bg);    color: var(--tag-gray-text); }
.tag-purple  { background: var(--tag-purple-bg);  color: var(--tag-purple-text); }
.tag-cyan    { background: var(--tag-cyan-bg);    color: var(--tag-cyan-text); }
.tag-orange  { background: var(--tag-orange-bg);  color: var(--tag-orange-text); }
.tag-green   { background: var(--success-bg); color: var(--success-text); }
.tag-red     { background: var(--danger-bg);  color: var(--danger-text); }

.stat-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-3); margin-bottom: var(--space-4); }
.stat-card { background: #fff; border: 1px solid var(--gray-200); border-radius: var(--radius-md); padding: var(--space-4); }
.stat-card .label { font-size: var(--text-sm); color: var(--gray-400); margin-bottom: var(--space-1); }
.stat-card .value { font-size: var(--text-stat); font-weight: 700; color: var(--gray-900); font-variant-numeric: tabular-nums; }
.stat-card .sub { font-size: var(--text-xs); color: var(--success-text); margin-top: 4px; }
.stat-card--danger .value { color: var(--danger-text); }
.stat-card--danger .sub { color: var(--danger-text); }
.stat-card--warning .value { color: var(--warning-text); }
.stat-card--warning .sub { color: var(--warning-text); }

.status-text { font-weight: 600; }
.status-text--success { color: var(--success-text); }
.status-text--warning { color: var(--warning-text); }
.status-text--danger  { color: var(--danger-text); }

.row-pending { background: var(--warning-bg); }
```

- [ ] **Step 2: Delete the now-superseded rules from the inline `<style>` block**

Delete: `.tag { ... }` through `.tag-teal { ... }` (all 9 tag color rules), `.stat-row { ... }` through `.stat-box .sub { ... }`.

Note: the class name changes from `.stat-box` to `.stat-card` — see Step 3 for the required HTML rename.

- [ ] **Step 3: Update HTML to match the renamed/new classes**

Global rename in `skill-admin.html`: every `class="stat-box"` becomes `class="stat-card"` (used on 企業擴充追蹤, 使用統計, Skill 測試中心, Tool 管理 pages). Where a stat box currently uses inline color styling to signal danger/warning, replace the inline style with the modifier class instead:

- 使用統計 page, "Skill 執行健康度" box (originally `<div class="stat-box">` containing `style="color:#ff4d4f;"` on `.value`/`.sub`): change the outer div to `class="stat-card stat-card--danger"` and remove the inline `style="color:#ff4d4f;"` attributes on the inner `.value`/`.sub` elements.
- 使用統計 page, "閒置 Skills" box: change outer div to `class="stat-card stat-card--warning"`, remove inline `style="color:#fa8c16;"` / `style="color:#fa8c16;cursor:pointer;"` (keep `cursor:pointer` as an inline style since that's layout-neutral interactivity, not a color).
- Tool 管理 page, "異常 Servers" box: change outer div to `class="stat-card stat-card--danger"`, remove inline `style="color:#ff4d4f;"` occurrences.

Also convert the Skills Repository status column from inline color styles to `.status-text` classes:
- `<td style="color:#52c41a;">✓ 已發佈</td>` → `<td><span class="status-text status-text--success">✓ 已發佈</span></td>` (apply to every "已發佈" cell in the table)
- `<td style="color:#fa8c16;">待審核</td>` → `<td><span class="status-text status-text--warning">待審核</span></td>`
- `<td style="color:#ff4d4f;">✗ 已停用</td>` → `<td><span class="status-text status-text--danger">✗ 已停用</span></td>`

Finally, replace the pending-review row highlight: `<tr style="background:#fffbe6;">` (the 文件摘要生成 row) → `<tr class="row-pending">`.

- [ ] **Step 4: Verify**

Run: `open skill-admin.html` (or refresh)
Expected:
- All tag pills across every page are now fully rounded (pill-shaped) with the same color families as before, just via tokens
- 使用統計's "Skill 執行健康度" stat card shows its value/sub in red; "閒置 Skills" in amber; other stat cards (Tool 管理's "異常 Servers", etc.) match
- Skills Repository status column shows colored text via the new `.status-text` classes, same colors as before (green/amber/red)
- The 文件摘要生成 pending-review row still has a visible amber-tinted background
- No `style="color:#..."` remains anywhere in the Skills Repository table or the three stat boxes touched above (grep to confirm: `grep -o 'color:#[0-9a-fA-F]*' skill-admin.html` should no longer show hits inside those areas — some other pages still have leftover inline colors at this point, that's expected until Tasks 6-9)

- [ ] **Step 5: Commit**

```bash
git add skill-admin.html skill-admin/components.css
git commit -m "feat(skill-admin): restyle tags, stat cards, and status text with semantic tokens

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: Tabs, segmented controls, and modal system

Standardizes the 8 modals down to 3 widths and unifies the various tab-like selector controls.

**Files:**
- Modify: `skill-admin/components.css`
- Modify: `skill-admin.html` (delete corresponding old rules; add modal size modifier classes; convert 2 diff blocks to a shared utility)

**Interfaces:**
- Consumes: tokens from Task 2, `.status-text`(`--success`/`--danger`) from Task 5 (used on the diff `+`/`-` markers in Step 4)
- Produces: `.tabs-bar`(`.tab-item.active`), `.admin-mode-tab.active`, `.admin-test-mode.active`, `.test-skill-opt.active`, `.stats-panel.active`, `.tc-panel.active`, `.modal-mask.active`, `.modal-box`(`.is-md`/`.is-lg`), `.modal-head`(`.close-btn`), `.modal-body`, `.form-item`, `.modal-footer`, `.diff-line`(`.removed`/`.added`)

- [ ] **Step 1: Write tab/segmented-control and modal rules into `skill-admin/components.css`**

```css
.tabs-bar { display: flex; border-bottom: 1px solid var(--gray-200); padding: 0 var(--space-4); background: #fff; }
.tabs-bar .tab-item {
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-base);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  color: var(--gray-500);
}
.tabs-bar .tab-item.active { color: var(--accent-600); border-bottom-color: var(--accent-500); font-weight: 600; }
.tabs-bar .tab-item:hover { color: var(--accent-600); }

.admin-mode-tab { padding: 5px var(--space-3); font-size: var(--text-sm); font-weight: 500; border-radius: var(--radius-sm); cursor: pointer; color: var(--gray-500); }
.admin-mode-tab.active { background: #fff; color: var(--accent-600); box-shadow: var(--shadow-sm); }
.admin-test-mode { display: none; }
.admin-test-mode.active { display: flex; }

.test-skill-opt { padding: 7px var(--space-4); font-size: var(--text-sm); cursor: pointer; display: flex; align-items: center; gap: var(--space-2); color: var(--gray-500); }
.test-skill-opt:hover { background: var(--accent-50); }
.test-skill-opt.active { background: var(--accent-50); color: var(--accent-600); font-weight: 500; border-right: 2px solid var(--accent-500); }

.stats-panel { display: none; }
.stats-panel.active { display: block; }
.tc-panel { display: none; }
.tc-panel.active { display: block; }

.modal-mask { display: none; position: fixed; inset: 0; background: rgba(24, 24, 27, 0.45); z-index: 100; align-items: center; justify-content: center; }
.modal-mask.active { display: flex; }
.modal-box { background: #fff; border-radius: var(--radius-md); width: 480px; max-height: 80vh; overflow-y: auto; box-shadow: var(--shadow-md); }
.modal-box.is-md { width: 560px; }
.modal-box.is-lg { width: 680px; }
.modal-head {
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--gray-200);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--gray-900);
  display: flex; align-items: center; justify-content: space-between;
}
.modal-head .close-btn { cursor: pointer; font-size: 18px; color: var(--gray-400); }
.modal-body { padding: var(--space-5); }
.form-item { margin-bottom: var(--space-4); }
.form-item label { display: block; font-size: var(--text-base); color: var(--gray-700); margin-bottom: 5px; }
.form-item input, .form-item select, .form-item textarea {
  width: 100%; padding: 6px var(--space-3);
  border: 1px solid var(--gray-300); border-radius: var(--radius-sm);
  font-size: var(--text-base); outline: none;
}
.form-item input:focus, .form-item select:focus, .form-item textarea:focus { border-color: var(--accent-500); }
.modal-footer { padding: var(--space-3) var(--space-5); border-top: 1px solid var(--gray-200); display: flex; justify-content: flex-end; gap: var(--space-2); }

.diff-line { padding: 2px var(--space-2); border-radius: 2px; }
.diff-line.removed { background: var(--danger-bg); }
.diff-line.added { background: var(--success-bg); }
```

- [ ] **Step 2: Delete the now-superseded rules from the inline `<style>` block**

Delete: `.tabs-bar { ... }` through `.tabs-bar .tab-item:hover { ... }`, `.admin-mode-tab { ... }` through `.admin-test-mode.active { ... }`, `.test-skill-opt { ... }` through `.test-skill-opt.active { ... }`, `.stats-panel { ... }` / `.stats-panel.active { ... }`, `.tc-panel { ... }` / `.tc-panel.active { ... }`, and the entire `.modal-mask { ... }` through `.modal-footer { ... }` block.

- [ ] **Step 3: Add modal size modifier classes to the 8 `.modal-box` elements**

- `modal-create-skill`, `modal-add-mcp`, `modal-register-tool`: leave `class="modal-box"` as-is (default 480px)
- `modal-create-agent`: `class="modal-box"` (no inline width style currently) → keep as `class="modal-box is-md"`
- `modal-edit-tool`: `class="modal-box" style="width:580px;"` → `class="modal-box is-md"` (remove the inline `style`)
- `modal-upstream-update`: `class="modal-box" style="width:600px;"` → `class="modal-box is-md"` (remove the inline `style`)
- `modal-review-version`: `class="modal-box" style="width:680px;"` → `class="modal-box is-lg"` (remove the inline `style`)
- `modal-edit-skill`: `class="modal-box" style="width:640px;"` → `class="modal-box is-lg"` (remove the inline `style`)

- [ ] **Step 4: Convert the diff blocks in `modal-review-version` and `modal-upstream-update` to use `.diff-line`**

In `modal-review-version`'s "System Prompt 變更" section, replace:
```html
<div style="background:#fff2f0;padding:2px 6px;border-radius:2px;margin-bottom:2px;"><span style="color:#ff4d4f;">-</span> 你是一個文件摘要助理，請將輸入文件整理成重點摘要。</div>
<div style="background:#f6ffed;padding:2px 6px;border-radius:2px;"><span style="color:#52c41a;">+</span> 你是一個專業文件摘要助理，請將輸入文件整理成條列式重點摘要，並標示關鍵數據與結論。</div>
```
with:
```html
<div class="diff-line removed"><span class="status-text status-text--danger">-</span> 你是一個文件摘要助理，請將輸入文件整理成重點摘要。</div>
<div class="diff-line added"><span class="status-text status-text--success">+</span> 你是一個專業文件摘要助理，請將輸入文件整理成條列式重點摘要，並標示關鍵數據與結論。</div>
```
Apply the same `.diff-line.removed` / `.diff-line.added` + `.status-text` conversion to: the "Tool 綁定變更" block in the same modal, and both diff blocks in `modal-upstream-update`'s "System Prompt 變更" section.

- [ ] **Step 5: Verify**

Run: `open skill-admin.html` (or refresh)
Expected:
- 使用統計's 3 tabs (Skill/Tool/企業 usage) show indigo underline on the active tab
- Skill 測試中心's "🔍 試跑預覽 / ⚡ 觸發測試" segmented control still switches panels; active segment shows white background + subtle shadow
- Opening each of the 8 modals shows 3 distinct widths: `modal-create-skill`/`modal-add-mcp`/`modal-register-tool` narrow (480px), `modal-create-agent`/`modal-edit-tool`/`modal-upstream-update` medium (560px), `modal-review-version`/`modal-edit-skill` wide (680px)
- `modal-review-version`'s diff blocks still show removed lines with a red tint and added lines with a green tint, now via classes instead of inline styles
- Clicking outside any open modal (on the dark overlay) still closes it; the × close button still works

- [ ] **Step 6: Commit**

```bash
git add skill-admin.html skill-admin/components.css
git commit -m "feat(skill-admin): standardize modal widths and restyle tabs/segmented controls

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 7: Chat bubbles, panel utility, and the new `server-card` component (Tool 管理 rewrite)

The `.server-card` class already exists in the old CSS but was never actually used in the markup — the Tool 管理 page instead copy-pasted a full inline-styled table 4 times. This task defines `server-card` for real and rewrites those 4 blocks to use it.

**Files:**
- Modify: `skill-admin/components.css`
- Modify: `skill-admin.html` (rewrite the 4 MCP server blocks on the Tool 管理 page; restyle Skill Builder's config-preview box)

**Interfaces:**
- Consumes: tokens from Task 2, `.tag` from Task 5
- Produces: `.chat-container`, `.chat-messages`, `.chat-bubble`(`.bot`/`.user`), `.chat-input-bar`, `.panel`, `.server-card`(`.server-card--degraded`), `.server-card-head`, `.server-name`, `.server-meta`, `.server-actions`, `.tool-row`(`.tname`/`.tdesc`), `.tool-chips`, `.tool-chip`

- [ ] **Step 1: Write chat, panel, and server-card rules into `skill-admin/components.css`**

```css
.chat-container { background: #fff; border: 1px solid var(--gray-200); border-radius: var(--radius-md); display: flex; flex-direction: column; height: 500px; }
.chat-messages { flex: 1; overflow-y: auto; padding: var(--space-4); }
.chat-bubble { max-width: 75%; margin-bottom: var(--space-3); padding: var(--space-2) var(--space-3); border-radius: 12px; font-size: var(--text-base); line-height: 1.6; }
.chat-bubble.bot { background: var(--gray-100); color: var(--gray-800); border-bottom-left-radius: 3px; }
.chat-bubble.user { background: var(--accent-500); color: #fff; border-bottom-right-radius: 3px; margin-left: auto; }
.chat-input-bar { padding: var(--space-3) var(--space-4); border-top: 1px solid var(--gray-200); display: flex; gap: var(--space-2); }
.chat-input-bar input { flex: 1; padding: 6px var(--space-3); border: 1px solid var(--gray-300); border-radius: var(--radius-sm); font-size: var(--text-base); outline: none; }

.panel { background: #fff; border: 1px solid var(--gray-200); border-radius: var(--radius-md); padding: var(--space-4); }
.panel h4 { font-size: var(--text-md); margin-bottom: var(--space-3); border-bottom: 1px solid var(--gray-200); padding-bottom: var(--space-2); color: var(--gray-900); }

.tool-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.tool-chip { padding: 2px var(--space-2); background: var(--gray-100); border: 1px solid var(--gray-200); border-radius: var(--radius-sm); font-size: var(--text-sm); color: var(--gray-700); }

.server-card { background: #fff; border: 1px solid var(--gray-200); border-radius: var(--radius-md); margin-bottom: var(--space-3); overflow: hidden; }
.server-card--degraded { border-color: #fde68a; }
.server-card-head { padding: var(--space-3) var(--space-4); background: var(--gray-50); border-bottom: 1px solid var(--gray-200); display: flex; align-items: center; gap: var(--space-3); }
.server-card--degraded .server-card-head { background: var(--warning-bg); border-color: #fde68a; }
.server-name { font-size: var(--text-base); font-weight: 700; color: var(--gray-900); }
.server-meta { font-size: var(--text-sm); color: var(--gray-400); }
.server-card--degraded .server-meta { color: var(--warning-text); }
.server-actions { margin-left: auto; display: flex; gap: 6px; }
.server-card table { width: 100%; border-collapse: collapse; }
.tool-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; padding: var(--space-2) var(--space-4); font-size: var(--text-base); align-items: center; border-top: 1px solid var(--gray-100); }
.tool-row .tname { font-weight: 600; color: var(--gray-800); }
.tool-row .tdesc { font-size: var(--text-xs); color: var(--gray-400); font-weight: 400; }
```

- [ ] **Step 2: Delete the now-superseded rules from the inline `<style>` block**

Delete: `.server-card { ... }` through `.chain-step { ... }` (the old, unused `.server-card`/`.server-card-head`/`.server-card-meta`/`.tool-chips`/`.tool-chip`/`.chain-step` rules), `.chat-container { ... }` through `.chat-input-bar input { ... }`, `.action-icons { ... }` / `.action-icon { ... }` / `.action-icon:hover { ... }` (unused, safe to drop entirely — not used anywhere in the HTML). At this point the entire original `<style>` block should be empty; delete the empty `<style></style>` tags from `<head>` entirely.

- [ ] **Step 3: Rewrite the Tool 管理 page's 4 MCP server blocks to use `.server-card`**

Replace the `erp-server` block (currently a `<div style="background:#fff;border:1px solid #d9d9d9;...">` containing a fully inline-styled `<table>`) with:

```html
<div class="server-card">
  <div class="server-card-head">
    <span class="server-name">erp-server</span>
    <span class="tag tag-green">✓ Connected</span>
    <span class="server-meta">Streamable HTTP｜https://mcp.acme-internal.com/erp｜最後同步: 5 分鐘前</span>
    <div class="server-actions">
      <button class="btn btn-default btn-sm">🔄 同步</button>
      <button class="btn btn-default btn-sm" onclick="openModal('modal-add-mcp')">設定</button>
    </div>
  </div>
  <table>
    <thead><tr><th>Tool 名稱</th><th>綁定 Skills</th><th>健康狀態</th><th>Rate Limit</th><th>Timeout</th><th class="center">動作</th></tr></thead>
    <tbody>
      <tr class="tool-row"><td><span class="tname">query_inventory</span><br><span class="tdesc">查詢即時庫存</span></td><td>2</td><td><span class="tag tag-green">✓ Healthy</span></td><td>200/min</td><td>10s</td><td class="center"><button class="btn btn-default btn-sm" onclick="openModal('modal-edit-tool')">編輯</button></td></tr>
      <tr class="tool-row"><td><span class="tname">get_product_detail</span><br><span class="tdesc">查詢商品詳情</span></td><td>1</td><td><span class="tag tag-green">✓ Healthy</span></td><td>200/min</td><td>10s</td><td class="center"><button class="btn btn-default btn-sm" onclick="openModal('modal-edit-tool')">編輯</button></td></tr>
      <tr class="tool-row"><td><span class="tname">list_warehouses</span><br><span class="tdesc">列出所有倉庫</span></td><td>1</td><td><span class="tag tag-green">✓ Healthy</span></td><td>200/min</td><td>10s</td><td class="center"><button class="btn btn-default btn-sm" onclick="openModal('modal-edit-tool')">編輯</button></td></tr>
    </tbody>
  </table>
</div>
```

Note: `.tool-row` here is applied to `<tr>` as a styling hook for `border-top`/padding-via-`<td>` — since real `<table>` rows can't use CSS grid on the `<tr>` itself, instead apply the existing `td`/`th` rules from Task 4 (padding/border already come from those) and only use `.tool-row .tname` / `.tool-row .tdesc` for the two-line cell text styling; drop the `display:grid` portion of `.tool-row` from Step 1 above and rely on the plain table cell layout instead. Adjust the CSS written in Step 1 to:

```css
.tool-row .tname { font-weight: 600; color: var(--gray-800); }
.tool-row .tdesc { display: block; font-size: var(--text-xs); color: var(--gray-400); font-weight: 400; margin-top: 2px; }
```
(remove `.tool-row { display:grid; ... }` from the Step 1 block above — the row is a real `<tr>`, not a grid container)

Apply the same `.server-card` structure to the remaining 3 blocks, preserving each one's original data exactly:
- `confluence-mcp`: `class="server-card server-card--degraded"`, status tag `<span class="tag tag-orange">⚠ Degraded</span>`, meta text "SSE｜https://mcp.acme-internal.com/confluence｜P95 延遲: 4.8s", 2 tool rows (`search`, `get_page`) both showing `<span class="tag tag-orange">⚠ Degraded</span>` for health.
- `notion-mcp`: `class="server-card"`, `<span class="tag tag-green">✓ Connected</span>`, meta "stdio｜uvx notion-mcp-server｜最後同步: 30 分鐘前", 2 tool rows (`search_pages` 1 Skill, `create_page` 0 Skills), both `<span class="tag tag-green">✓ Healthy</span>`.
- `slack-mcp`: `class="server-card"`, `<span class="tag tag-green">✓ Connected</span>` + `<span class="tag tag-blue">Platform</span>`, meta "Streamable HTTP｜https://mcp.platform.io/slack｜Platform 提供", server-actions has only the 🔄 同步 button (no 設定 button, matching the original — Platform-managed tools aren't user-configurable), 2 tool rows (`send_message` 3 Skills, `post_to_channel` 2 Skills) both Healthy, and their 動作 cell shows plain text `<span style="font-size:11px;color:var(--gray-400);">Platform 管理</span>` instead of an 編輯 button (matches original behavior — leave this one inline style as a one-off, it's not a recurring pattern worth a class).

Also update the "Platform Native" section above the MCP servers (HTTP API Caller / knowledge-base-search / SQL Query Engine table) — this one already uses `.table-wrap`/`table` from Task 4, no structural change needed here, only confirm its tag/status cells already use `.tag tag-green` (they do in the original markup).

- [ ] **Step 4: Apply `.panel` to the Skill Builder config-preview box and test-center side panels**

Replace `<div style="background:#fff;border:1px solid #d9d9d9;border-radius:4px;padding:16px;">` (the "📋 Skill 配置預覽" box on the Skill Builder page) with `<div class="panel">`, and its `<h4 style="font-size:14px;margin-bottom:12px;border-bottom:1px solid #e8e8e8;padding-bottom:8px;">` with plain `<h4>` (styling now comes from `.panel h4`).

Apply the same `.panel` class to the two side boxes on the Skill 測試中心 page ("選擇 Skill" list container and the main test-runner container currently styled with `style="background:#fff;border:1px solid #d9d9d9;border-radius:4px;..."`), removing their inline `style` attributes for background/border/radius (keep any inline `flex`/`grid` layout-positioning styles that aren't about color/border).

- [ ] **Step 5: Verify**

Run: `open skill-admin.html` (or refresh)
Expected:
- Tool 管理 page shows 4 visually consistent server cards (erp-server, confluence-mcp, notion-mcp, slack-mcp), each with the same header/table layout; confluence-mcp's card and header have an amber tint (degraded state) while the other 3 are neutral
- Every tool row still shows the same names, Skill-binding counts, health tags, rate limits, and timeouts as before the rewrite — no data lost
- The "設定"/"🔄 同步" buttons still call `openModal('modal-add-mcp')` correctly (click one to confirm the modal opens)
- Skill Builder's chat bubbles: bot messages in light gray, user messages in solid indigo with white text; config-preview box on the right uses the new `.panel` style
- Skill 測試中心's left skill-list panel and right test-runner panel both show the new `.panel` border/radius, `selectTestSkill` still highlights the clicked skill

- [ ] **Step 6: Commit**

```bash
git add skill-admin.html skill-admin/components.css
git commit -m "feat(skill-admin): add server-card component, rewrite Tool 管理 MCP blocks, restyle chat/panels

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 8: Skills Repository — group derived skills instead of repeating their source text

The core information-density fix from the spec: derived (企業/團隊) skill rows currently repeat their full "衍生自" source text on every row. Group them under their system-skill parent with a short hover tooltip instead.

**Files:**
- Modify: `skill-admin/components.css`
- Modify: `skill-admin.html` (restructure the Skills Repository `<tbody>`)

**Interfaces:**
- Consumes: `.tag`, `.status-text` from Task 5
- Produces: `.skill-row-main`, `.skill-row-child`, `.derived-mark`

- [ ] **Step 1: Add the grouping/indentation rules to `skill-admin/components.css`**

```css
.skill-row-child td:first-child { padding-left: var(--space-6); }
.derived-mark { font-size: var(--text-xs); color: var(--gray-400); cursor: help; border-bottom: 1px dotted var(--gray-300); }
```

- [ ] **Step 2: Restructure the `<tbody>` of the Skills Repository table**

The current table has 12 flat `<tr>` rows. Regroup them so each system-skill row is followed immediately by its derived rows, with the "衍生自" cell on child rows replaced by a short `.derived-mark` tooltip instead of repeating the full source text. Replace the entire `<tbody>...</tbody>` with:

```html
<tbody>
  <tr class="skill-row-main">
    <td>💬 <strong>通用客服答覆</strong></td>
    <td><span class="tag tag-blue">系統</span></td>
    <td>—</td>
    <td>初始客服版</td>
    <td><span class="status-text status-text--success">✓ 已發佈</span></td>
    <td>3,842</td>
    <td><button class="btn btn-default btn-sm" onclick="openModal('modal-edit-skill')">編輯</button> <button class="btn btn-default btn-sm" onclick="showPage('skill-test')">測試</button></td>
  </tr>
  <tr class="skill-row-child">
    <td>客服答覆 (Acme 退貨版)</td>
    <td><span class="tag tag-indigo">企業</span> <span class="tag tag-orange" style="font-size:10px;">Acme</span></td>
    <td><span class="derived-mark" title="通用客服答覆「初始客服版」">↳ 衍生</span></td>
    <td>退貨話術優化</td>
    <td><span class="status-text status-text--success">✓ 已發佈</span></td>
    <td>1,284</td>
    <td><button class="btn btn-default btn-sm" onclick="showPage('skill-test')">測試</button></td>
  </tr>
  <tr class="skill-row-child">
    <td>客服答覆 (保健品版)</td>
    <td><span class="tag tag-indigo">企業</span> <span class="tag tag-orange" style="font-size:10px;">HERBALIFE</span></td>
    <td><span class="derived-mark" title="通用客服答覆「初始客服版」">↳ 衍生</span></td>
    <td>保健品法規用語版</td>
    <td><span class="status-text status-text--success">✓ 已發佈</span></td>
    <td>612</td>
    <td><button class="btn btn-default btn-sm" onclick="showPage('skill-test')">測試</button></td>
  </tr>
  <tr class="skill-row-child">
    <td>客服答覆 (輔具版)</td>
    <td><span class="tag tag-teal">團隊</span> <span class="tag tag-orange" style="font-size:10px;">HERBALIFE · 輔具</span></td>
    <td><span class="derived-mark" title="通用客服答覆「初始客服版」">↳ 衍生</span></td>
    <td>輔具客服簡化版</td>
    <td><span class="status-text status-text--success">✓ 已發佈</span></td>
    <td>203</td>
    <td><button class="btn btn-default btn-sm" onclick="showPage('skill-test')">測試</button> <button class="btn btn-default btn-sm" style="color:var(--accent-500);border-color:var(--accent-500);">公開到企業</button></td>
  </tr>
  <tr class="skill-row-main row-pending">
    <td>📄 <strong>文件摘要生成</strong></td>
    <td><span class="tag tag-blue">系統</span></td>
    <td>—</td>
    <td>Markdown支援與關鍵字提取 <span class="tag tag-orange" style="font-size:10px;">待審核「掃描文件辨識強化」</span></td>
    <td><span class="status-text status-text--warning">待審核</span></td>
    <td>2,156</td>
    <td><button class="btn btn-primary btn-sm" onclick="openModal('modal-review-version')">審核版本</button> <button class="btn btn-default btn-sm" onclick="showPage('skill-test')">測試</button></td>
  </tr>
  <tr class="skill-row-child">
    <td>法規摘要 (法律版)</td>
    <td><span class="tag tag-teal">團隊</span> <span class="tag tag-orange" style="font-size:10px;">Acme · 法務</span></td>
    <td><span class="derived-mark" title="文件摘要生成「Markdown支援與關鍵字提取」">↳ 衍生</span></td>
    <td>法務條款摘要強化</td>
    <td><span class="status-text status-text--success">✓ 已發佈</span></td>
    <td>45</td>
    <td><button class="btn btn-default btn-sm" onclick="showPage('skill-test')">測試</button></td>
  </tr>
  <tr class="skill-row-main">
    <td>📝 <strong>會議摘要</strong></td>
    <td><span class="tag tag-blue">系統</span></td>
    <td>—</td>
    <td>Action Items自動識別</td>
    <td><span class="status-text status-text--success">✓ 已發佈</span></td>
    <td>967</td>
    <td><button class="btn btn-default btn-sm" onclick="openModal('modal-edit-skill')">編輯</button> <button class="btn btn-default btn-sm" onclick="showPage('skill-test')">測試</button></td>
  </tr>
  <tr class="skill-row-child">
    <td>工程會議紀錄</td>
    <td><span class="tag tag-teal">團隊</span> <span class="tag tag-orange" style="font-size:10px;">佑昇 · 工程</span></td>
    <td><span class="derived-mark" title="會議摘要「Action Items自動識別」">↳ 衍生</span></td>
    <td>工程術語辨識版</td>
    <td><span class="status-text status-text--success">✓ 已發佈</span></td>
    <td>67</td>
    <td><button class="btn btn-default btn-sm" onclick="showPage('skill-test')">測試</button> <button class="btn btn-default btn-sm" style="color:var(--accent-500);border-color:var(--accent-500);">公開到企業</button></td>
  </tr>
  <tr class="skill-row-main">
    <td>📊 <strong>數據可視化</strong></td>
    <td><span class="tag tag-blue">系統</span></td>
    <td>—</td>
    <td>自動圖表生成</td>
    <td><span class="status-text status-text--success">✓ 已發佈</span></td>
    <td>1,893</td>
    <td><button class="btn btn-default btn-sm" onclick="openModal('modal-edit-skill')">編輯</button> <button class="btn btn-default btn-sm" onclick="showPage('skill-test')">測試</button></td>
  </tr>
  <tr class="skill-row-main">
    <td>🔍 <strong>競品分析</strong></td>
    <td><span class="tag tag-blue">系統</span></td>
    <td>—</td>
    <td>初始版</td>
    <td><span class="status-text status-text--success">✓ 已發佈</span></td>
    <td>723</td>
    <td><button class="btn btn-default btn-sm" onclick="openModal('modal-edit-skill')">編輯</button> <button class="btn btn-default btn-sm" onclick="showPage('skill-test')">測試</button></td>
  </tr>
  <tr class="skill-row-main">
    <td>🏢 <strong>客戶投訴處理</strong></td>
    <td><span class="tag tag-indigo">企業</span> <span class="tag tag-orange" style="font-size:10px;">Acme</span></td>
    <td>—</td>
    <td>退貨流程整合版</td>
    <td><span class="status-text status-text--success">✓ 已發佈</span></td>
    <td>2,341</td>
    <td><button class="btn btn-default btn-sm" onclick="openModal('modal-edit-skill')">編輯</button> <button class="btn btn-default btn-sm" onclick="showPage('skill-test')">測試</button></td>
  </tr>
  <tr class="skill-row-main">
    <td>📦 <strong>ERP 庫存查詢</strong> <span class="tag tag-gray" style="font-size:10px;">獨立能力</span></td>
    <td><span class="tag tag-indigo">企業</span> <span class="tag tag-orange" style="font-size:10px;">Acme</span></td>
    <td>—</td>
    <td>多倉庫整合</td>
    <td><span class="status-text status-text--success">✓ 已發佈</span></td>
    <td>856</td>
    <td><button class="btn btn-default btn-sm" onclick="openModal('modal-edit-skill')">編輯</button> <button class="btn btn-default btn-sm" onclick="showPage('skill-test')">測試</button></td>
  </tr>
  <tr class="skill-row-main">
    <td>🔎 <strong>內部知識庫搜尋</strong> <span class="tag tag-gray" style="font-size:10px;">獨立能力</span></td>
    <td><span class="tag tag-indigo">企業</span> <span class="tag tag-orange" style="font-size:10px;">Acme</span></td>
    <td>—</td>
    <td>初版搜尋原型</td>
    <td><span class="status-text status-text--danger">✗ 已停用</span></td>
    <td>—</td>
    <td><button class="btn btn-default btn-sm" onclick="openModal('modal-edit-skill')">編輯</button> <button class="btn btn-default btn-sm" onclick="showPage('skill-test')">測試</button></td>
  </tr>
</tbody>
```

(This replaces the `style="background:#fffbe6;"` inline attribute from Task 5's Step 3 with the `row-pending` class directly here, combined with `skill-row-main` — `class="skill-row-main row-pending"`.)

- [ ] **Step 3: Verify**

Run: `open skill-admin.html` (or refresh)
Expected:
- All 12 rows' data (names, tags, version names, status, usage counts, action buttons) match the original exactly — nothing was dropped
- The 6 derived rows (客服答覆 x3, 法規摘要, 工程會議紀錄) show a short "↳ 衍生" marker instead of the full source-skill text, indented under their parent row
- Hovering over "↳ 衍生" shows the full source text as a native tooltip (e.g. "通用客服答覆「初始客服版」")
- The 文件摘要生成 row still has its amber pending-review background
- Table sorting/filtering is unaffected (there was none to begin with — purely static markup)

- [ ] **Step 4: Commit**

```bash
git add skill-admin.html skill-admin/components.css
git commit -m "feat(skill-admin): group derived skills under their parent in Skills Repository

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 9: Final sweep — remaining one-off inline styles, full walkthrough, cleanup

Closes out the long tail: a handful of pages have small one-off inline-styled blocks that don't belong to any of the shared components built in Tasks 4-7. Find and convert all of them, then do one full pass over every page and modal.

**Files:**
- Modify: `skill-admin/components.css`
- Modify: `skill-admin.html` (草稿管理 draft cards, 使用統計's 企業使用分佈 panel, Agent 配置's disabled-skill note)

**Interfaces:**
- Consumes: tokens from Task 2, `.tag` from Task 5
- Produces: `.draft-card`, `.tenant-stat-grid`(`.tenant-stat-item`), `.disabled-chip`

- [ ] **Step 1: Add the remaining one-off component rules to `skill-admin/components.css`**

```css
.draft-card {
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-2);
  padding: var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.draft-card-info { flex: 1; }
.draft-card-title { display: flex; align-items: center; gap: var(--space-2); margin-bottom: 4px; }
.draft-card-title .name { font-size: var(--text-md); font-weight: 600; color: var(--gray-900); }
.draft-card-meta { font-size: var(--text-sm); color: var(--gray-400); }
.draft-card-actions { display: flex; gap: 6px; flex-shrink: 0; }

.tenant-stat-grid { display: flex; justify-content: space-around; font-size: var(--text-base); text-align: center; }
.tenant-stat-item .name { font-weight: 600; color: var(--gray-800); }
.tenant-stat-item .value { color: var(--accent-500); font-size: var(--text-stat); font-weight: 700; display: block; margin: 4px 0; font-variant-numeric: tabular-nums; }
.tenant-stat-item .value--muted { color: var(--gray-400); }

.disabled-chip { font-size: var(--text-xs); color: var(--gray-400); background: var(--gray-100); border: 1px solid var(--gray-200); border-radius: 10px; padding: 2px var(--space-2); text-decoration: line-through; }
.disabled-note { font-size: var(--text-xs); color: var(--danger-text); padding: 2px 4px; }
```

- [ ] **Step 2: Apply `.draft-card` to the 草稿管理 page's 2 draft blocks**

Replace both `<div style="background:#fafafa;border:1px solid #d9d9d9;border-radius:6px;margin-bottom:10px;padding:14px 16px;display:flex;align-items:center;gap:12px;">` blocks with `<div class="draft-card">`, their inner `<div style="flex:1;">` with `<div class="draft-card-info">`, the title row `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">` with `<div class="draft-card-title">` (wrap the name in `<span class="name">...</span>`), the meta line `<div style="font-size:12px;color:#8c8c8c;">` with `<div class="draft-card-meta">`, and the action button wrapper `<div style="display:flex;gap:6px;flex-shrink:0;">` with `<div class="draft-card-actions">`. Keep both drafts' text content ("訂單物流查詢"/"合約條款比對" and their metadata) exactly as-is.

- [ ] **Step 3: Apply `.tenant-stat-grid` to 使用統計's "企業使用分佈" panel**

Replace the `stats-tenant` panel's inner markup:
```html
<div style="background:#fff;border:1px solid #d9d9d9;border-radius:4px;padding:32px;">
  <div style="display:flex;justify-content:space-around;font-size:13px;text-align:center;">
    ...
  </div>
</div>
```
with:
```html
<div class="panel">
  <div class="tenant-stat-grid">
    <div class="tenant-stat-item"><span class="name">Acme Corp</span><span class="value">4,231</span>調用</div>
    <div class="tenant-stat-item"><span class="name">HERBALIFE</span><span class="value">3,156</span>調用</div>
    <div class="tenant-stat-item"><span class="name">佑昇</span><span class="value">2,890</span>調用</div>
    <div class="tenant-stat-item"><span class="name">其他 5 家</span><span class="value value--muted">2,570</span>調用</div>
  </div>
</div>
```

- [ ] **Step 4: Apply `.disabled-chip`/`.disabled-note` to Agent 配置's 客服機器人 row**

Replace `<span style="font-size:11px;color:#8c8c8c;background:#fafafa;border:1px solid #d9d9d9;border-radius:10px;padding:2px 8px;text-decoration:line-through;" title="此 Skill 已停用">情緒分析</span>` with `<span class="disabled-chip" title="此 Skill 已停用">情緒分析</span>`, and `<span style="font-size:10px;color:#ff4d4f;padding:2px 4px;">⚠ 停用</span>` with `<span class="disabled-note">⚠ 停用</span>`.

- [ ] **Step 5: Grep for any remaining hardcoded hex colors and fix them**

Run: `grep -no '#[0-9a-fA-F]\{3,6\}' skill-admin.html skill-admin/layout.css skill-admin/components.css`

Expected: zero matches in `skill-admin.html`, `layout.css`, and `components.css` (hex is only allowed inside `tokens.css`, which this grep doesn't include). If any matches remain, look up the closest token in the mapping table at the top of `skill-admin/tokens.css` (from Task 2, Step 1) and replace the raw hex with the matching `var(--...)`.

- [ ] **Step 6: Full manual walkthrough of every page and modal**

Run: `open skill-admin.html`

Walk through and confirm for each:
- **Skills Repository**: grouped derived rows display correctly (from Task 8), filters/search bar present, "+ 新增 Skill" opens `modal-create-skill`
- **企業擴充追蹤**: 2 stat cards + filter bar + table render with new tokens
- **使用統計**: 4-then-tabs layout works, all 3 tab panels (Skill/Tool/企業) render correctly including the new `.tenant-stat-grid`
- **Skill Builder**: chat + config-preview panel, "🚀 發佈" button styled as `.btn-primary`
- **Skill 測試中心**: stat row, skill-picker `.panel`, 試跑預覽/觸發測試 toggle, 執行歷史 table
- **草稿管理**: both `.draft-card` blocks render with correct metadata and action buttons
- **Tool 管理**: Platform Native table + 4 `.server-card` blocks (from Task 7), including confluence-mcp's degraded styling
- **Agent 配置**: table with skill-chip lists, disabled-chip note on 客服機器人's 情緒分析 chip
- **All 8 modals** open/close correctly via their trigger buttons and the × / overlay-click, showing the 3 standardized widths from Task 6
- DevTools console: zero JS errors across the whole walkthrough

- [ ] **Step 7: Commit**

```bash
git add skill-admin.html skill-admin/components.css
git commit -m "feat(skill-admin): final token sweep, draft cards, tenant stats, full QA pass

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```
