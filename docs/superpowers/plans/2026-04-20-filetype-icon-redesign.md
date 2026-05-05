# File Type Icon Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace 8 flat-color PNG file type icons with Frosted Gradient SVG icons that match the app's light-themed SaaS design system.

**Architecture:** Create 8 new SVG files in `src/assets/fileTypeIcon/`, then update the 8 PNG imports in `ResourceLibrary.vue` to point to the new SVGs. No logic changes — only asset replacement and import path updates.

**Tech Stack:** SVG (inline, no dependencies), Vue 3, Vite (handles SVG as URL import via `?url` or default asset handling)

**Spec:** `docs/superpowers/specs/2026-04-20-filetype-icon-redesign.md`

---

## File Map

| Action | Path |
|--------|------|
| Create | `src/assets/fileTypeIcon/pdf.svg` |
| Create | `src/assets/fileTypeIcon/ppt.svg` |
| Create | `src/assets/fileTypeIcon/excel.svg` |
| Create | `src/assets/fileTypeIcon/word.svg` |
| Create | `src/assets/fileTypeIcon/md.svg` |
| Create | `src/assets/fileTypeIcon/html.svg` |
| Create | `src/assets/fileTypeIcon/txt.svg` |
| Create | `src/assets/fileTypeIcon/chart.svg` |
| Modify | `src/views/ResourceLibrary.vue:226-233` |

---

## Task 1: Create PDF and PPT SVG icons

**Files:**
- Create: `src/assets/fileTypeIcon/pdf.svg`
- Create: `src/assets/fileTypeIcon/ppt.svg`

- [ ] **Step 1: Create `src/assets/fileTypeIcon/pdf.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 76" fill="none">
  <defs>
    <linearGradient id="gPDF" x1="0" y1="0" x2="64" y2="76" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#fecaca"/>
      <stop offset="100%" stop-color="#fca5a5"/>
    </linearGradient>
  </defs>
  <rect width="64" height="76" rx="10" fill="#fff1f2"/>
  <rect x="0.75" y="0.75" width="62.5" height="74.5" rx="9.25" stroke="url(#gPDF)" stroke-width="1.5"/>
  <path d="M42 4 H10 C7.8 4 6 5.8 6 8 V68 C6 70.2 7.8 72 10 72 H54 C56.2 72 58 70.2 58 68 V20 L42 4Z" fill="#fff1f2"/>
  <path d="M42 4 L58 20 H44 C42.9 20 42 19.1 42 18 V4Z" fill="#fca5a5"/>
  <text x="32" y="38" text-anchor="middle" fill="#ef4444" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="10" font-weight="700" letter-spacing="0.5">PDF</text>
  <rect x="16" y="46" width="32" height="3" rx="1.5" fill="#ef4444" fill-opacity="0.3"/>
  <rect x="16" y="52" width="24" height="3" rx="1.5" fill="#ef4444" fill-opacity="0.2"/>
</svg>
```

- [ ] **Step 2: Create `src/assets/fileTypeIcon/ppt.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 76" fill="none">
  <defs>
    <linearGradient id="gPPT" x1="0" y1="0" x2="64" y2="76" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#fed7aa"/>
      <stop offset="100%" stop-color="#fdba74"/>
    </linearGradient>
  </defs>
  <rect width="64" height="76" rx="10" fill="#fff7ed"/>
  <rect x="0.75" y="0.75" width="62.5" height="74.5" rx="9.25" stroke="url(#gPPT)" stroke-width="1.5"/>
  <path d="M42 4 H10 C7.8 4 6 5.8 6 8 V68 C6 70.2 7.8 72 10 72 H54 C56.2 72 58 70.2 58 68 V20 L42 4Z" fill="#fff7ed"/>
  <path d="M42 4 L58 20 H44 C42.9 20 42 19.1 42 18 V4Z" fill="#fdba74"/>
  <text x="32" y="38" text-anchor="middle" fill="#f97316" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="10" font-weight="700" letter-spacing="0.5">PPT</text>
  <rect x="16" y="46" width="32" height="3" rx="1.5" fill="#f97316" fill-opacity="0.3"/>
  <rect x="16" y="52" width="24" height="3" rx="1.5" fill="#f97316" fill-opacity="0.2"/>
</svg>
```

- [ ] **Step 3: Commit**

```bash
git add src/assets/fileTypeIcon/pdf.svg src/assets/fileTypeIcon/ppt.svg
git commit -m "feat: add frosted gradient SVG icons for PDF and PPT"
```

---

## Task 2: Create XLSX and DOCX SVG icons

**Files:**
- Create: `src/assets/fileTypeIcon/excel.svg`
- Create: `src/assets/fileTypeIcon/word.svg`

- [ ] **Step 1: Create `src/assets/fileTypeIcon/excel.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 76" fill="none">
  <defs>
    <linearGradient id="gXLSX" x1="0" y1="0" x2="64" y2="76" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#bbf7d0"/>
      <stop offset="100%" stop-color="#86efac"/>
    </linearGradient>
  </defs>
  <rect width="64" height="76" rx="10" fill="#f0fdf4"/>
  <rect x="0.75" y="0.75" width="62.5" height="74.5" rx="9.25" stroke="url(#gXLSX)" stroke-width="1.5"/>
  <path d="M42 4 H10 C7.8 4 6 5.8 6 8 V68 C6 70.2 7.8 72 10 72 H54 C56.2 72 58 70.2 58 68 V20 L42 4Z" fill="#f0fdf4"/>
  <path d="M42 4 L58 20 H44 C42.9 20 42 19.1 42 18 V4Z" fill="#86efac"/>
  <text x="32" y="38" text-anchor="middle" fill="#16a34a" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="10" font-weight="700" letter-spacing="0.5">XLSX</text>
  <rect x="16" y="46" width="32" height="3" rx="1.5" fill="#22c55e" fill-opacity="0.3"/>
  <rect x="16" y="52" width="24" height="3" rx="1.5" fill="#22c55e" fill-opacity="0.2"/>
</svg>
```

- [ ] **Step 2: Create `src/assets/fileTypeIcon/word.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 76" fill="none">
  <defs>
    <linearGradient id="gDOCX" x1="0" y1="0" x2="64" y2="76" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#bfdbfe"/>
      <stop offset="100%" stop-color="#93c5fd"/>
    </linearGradient>
  </defs>
  <rect width="64" height="76" rx="10" fill="#eff6ff"/>
  <rect x="0.75" y="0.75" width="62.5" height="74.5" rx="9.25" stroke="url(#gDOCX)" stroke-width="1.5"/>
  <path d="M42 4 H10 C7.8 4 6 5.8 6 8 V68 C6 70.2 7.8 72 10 72 H54 C56.2 72 58 70.2 58 68 V20 L42 4Z" fill="#eff6ff"/>
  <path d="M42 4 L58 20 H44 C42.9 20 42 19.1 42 18 V4Z" fill="#93c5fd"/>
  <text x="32" y="38" text-anchor="middle" fill="#2563eb" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="10" font-weight="700" letter-spacing="0.5">DOCX</text>
  <rect x="16" y="46" width="32" height="3" rx="1.5" fill="#3b82f6" fill-opacity="0.3"/>
  <rect x="16" y="52" width="24" height="3" rx="1.5" fill="#3b82f6" fill-opacity="0.2"/>
</svg>
```

- [ ] **Step 3: Commit**

```bash
git add src/assets/fileTypeIcon/excel.svg src/assets/fileTypeIcon/word.svg
git commit -m "feat: add frosted gradient SVG icons for XLSX and DOCX"
```

---

## Task 3: Create MD, HTML, TXT, CHART SVG icons

**Files:**
- Create: `src/assets/fileTypeIcon/md.svg`
- Create: `src/assets/fileTypeIcon/html.svg`
- Create: `src/assets/fileTypeIcon/txt.svg`
- Create: `src/assets/fileTypeIcon/chart.svg`

- [ ] **Step 1: Create `src/assets/fileTypeIcon/md.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 76" fill="none">
  <defs>
    <linearGradient id="gMD" x1="0" y1="0" x2="64" y2="76" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ddd6fe"/>
      <stop offset="100%" stop-color="#c4b5fd"/>
    </linearGradient>
  </defs>
  <rect width="64" height="76" rx="10" fill="#f5f3ff"/>
  <rect x="0.75" y="0.75" width="62.5" height="74.5" rx="9.25" stroke="url(#gMD)" stroke-width="1.5"/>
  <path d="M42 4 H10 C7.8 4 6 5.8 6 8 V68 C6 70.2 7.8 72 10 72 H54 C56.2 72 58 70.2 58 68 V20 L42 4Z" fill="#f5f3ff"/>
  <path d="M42 4 L58 20 H44 C42.9 20 42 19.1 42 18 V4Z" fill="#c4b5fd"/>
  <text x="32" y="38" text-anchor="middle" fill="#7c3aed" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="10" font-weight="700" letter-spacing="0.5">MD</text>
  <rect x="16" y="46" width="32" height="3" rx="1.5" fill="#7c3aed" fill-opacity="0.3"/>
  <rect x="16" y="52" width="24" height="3" rx="1.5" fill="#7c3aed" fill-opacity="0.2"/>
</svg>
```

- [ ] **Step 2: Create `src/assets/fileTypeIcon/html.svg`**

Note: font-size is 9 (smaller) to fit the 4-char "HTML" label comfortably.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 76" fill="none">
  <defs>
    <linearGradient id="gHTML" x1="0" y1="0" x2="64" y2="76" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#fbcfe8"/>
      <stop offset="100%" stop-color="#f9a8d4"/>
    </linearGradient>
  </defs>
  <rect width="64" height="76" rx="10" fill="#fdf2f8"/>
  <rect x="0.75" y="0.75" width="62.5" height="74.5" rx="9.25" stroke="url(#gHTML)" stroke-width="1.5"/>
  <path d="M42 4 H10 C7.8 4 6 5.8 6 8 V68 C6 70.2 7.8 72 10 72 H54 C56.2 72 58 70.2 58 68 V20 L42 4Z" fill="#fdf2f8"/>
  <path d="M42 4 L58 20 H44 C42.9 20 42 19.1 42 18 V4Z" fill="#f9a8d4"/>
  <text x="32" y="38" text-anchor="middle" fill="#db2777" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="9" font-weight="700" letter-spacing="0.5">HTML</text>
  <rect x="16" y="46" width="32" height="3" rx="1.5" fill="#ec4899" fill-opacity="0.3"/>
  <rect x="16" y="52" width="24" height="3" rx="1.5" fill="#ec4899" fill-opacity="0.2"/>
</svg>
```

- [ ] **Step 3: Create `src/assets/fileTypeIcon/txt.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 76" fill="none">
  <defs>
    <linearGradient id="gTXT" x1="0" y1="0" x2="64" y2="76" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#e2e8f0"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>
  </defs>
  <rect width="64" height="76" rx="10" fill="#f8fafc"/>
  <rect x="0.75" y="0.75" width="62.5" height="74.5" rx="9.25" stroke="url(#gTXT)" stroke-width="1.5"/>
  <path d="M42 4 H10 C7.8 4 6 5.8 6 8 V68 C6 70.2 7.8 72 10 72 H54 C56.2 72 58 70.2 58 68 V20 L42 4Z" fill="#f8fafc"/>
  <path d="M42 4 L58 20 H44 C42.9 20 42 19.1 42 18 V4Z" fill="#cbd5e1"/>
  <text x="32" y="38" text-anchor="middle" fill="#475569" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="10" font-weight="700" letter-spacing="0.5">TXT</text>
  <rect x="16" y="46" width="32" height="3" rx="1.5" fill="#64748b" fill-opacity="0.3"/>
  <rect x="16" y="52" width="24" height="3" rx="1.5" fill="#64748b" fill-opacity="0.2"/>
</svg>
```

- [ ] **Step 4: Create `src/assets/fileTypeIcon/chart.svg`**

Note: font-size is 8.5 (smallest) to fit the 5-char "CHART" label.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 76" fill="none">
  <defs>
    <linearGradient id="gCHART" x1="0" y1="0" x2="64" y2="76" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#a7f3d0"/>
      <stop offset="100%" stop-color="#6ee7b7"/>
    </linearGradient>
  </defs>
  <rect width="64" height="76" rx="10" fill="#ecfdf5"/>
  <rect x="0.75" y="0.75" width="62.5" height="74.5" rx="9.25" stroke="url(#gCHART)" stroke-width="1.5"/>
  <path d="M42 4 H10 C7.8 4 6 5.8 6 8 V68 C6 70.2 7.8 72 10 72 H54 C56.2 72 58 70.2 58 68 V20 L42 4Z" fill="#ecfdf5"/>
  <path d="M42 4 L58 20 H44 C42.9 20 42 19.1 42 18 V4Z" fill="#6ee7b7"/>
  <text x="32" y="38" text-anchor="middle" fill="#059669" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="8.5" font-weight="700" letter-spacing="0.5">CHART</text>
  <rect x="16" y="46" width="32" height="3" rx="1.5" fill="#059669" fill-opacity="0.3"/>
  <rect x="16" y="52" width="24" height="3" rx="1.5" fill="#059669" fill-opacity="0.2"/>
</svg>
```

- [ ] **Step 5: Commit**

```bash
git add src/assets/fileTypeIcon/md.svg src/assets/fileTypeIcon/html.svg src/assets/fileTypeIcon/txt.svg src/assets/fileTypeIcon/chart.svg
git commit -m "feat: add frosted gradient SVG icons for MD, HTML, TXT, CHART"
```

---

## Task 4: Update ResourceLibrary.vue imports

**Files:**
- Modify: `src/views/ResourceLibrary.vue:226-233`

- [ ] **Step 1: Replace PNG imports with SVG imports**

In `src/views/ResourceLibrary.vue`, replace lines 226–233:

```ts
// Before
import pdfIcon from '@/assets/fileTypeIcon/pdf.png';
import pptIcon from '@/assets/fileTypeIcon/ppt.png';
import excelIcon from '@/assets/fileTypeIcon/excel.png';
import htmlIcon from '@/assets/fileTypeIcon/html.png';
import mdIcon from '@/assets/fileTypeIcon/md.png';
import wordIcon from '@/assets/fileTypeIcon/word.png';
import txtIcon from '@/assets/fileTypeIcon/txt.png';
import chartIcon from '@/assets/fileTypeIcon/chart.png';

// After
import pdfIcon from '@/assets/fileTypeIcon/pdf.svg';
import pptIcon from '@/assets/fileTypeIcon/ppt.svg';
import excelIcon from '@/assets/fileTypeIcon/excel.svg';
import htmlIcon from '@/assets/fileTypeIcon/html.svg';
import mdIcon from '@/assets/fileTypeIcon/md.svg';
import wordIcon from '@/assets/fileTypeIcon/word.svg';
import txtIcon from '@/assets/fileTypeIcon/txt.svg';
import chartIcon from '@/assets/fileTypeIcon/chart.svg';
```

- [ ] **Step 2: Run type-check to verify no import errors**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Start dev server and visually verify**

```bash
npm run dev
```

Open browser → navigate to a team's 共用檔案管理 page (`/view/ResourceLibrary?teamId=...`).

Check:
- Card view: each file type shows the new frosted SVG icon in the `card-body-box`
- List view: each file type shows the small icon in the `file-icon-box` next to the filename
- IMAGE type files still show the actual image thumbnail (unchanged)
- OTHER type files still show `question_mark` icon (unchanged)

- [ ] **Step 4: Commit**

```bash
git add src/views/ResourceLibrary.vue
git commit -m "feat: switch file type icons from PNG to frosted gradient SVG"
```

---

## Task 5: Final build verification

- [ ] **Step 1: Run production build**

```bash
npm run build
```

Expected: build completes with no errors. SVG files are bundled as static assets.

- [ ] **Step 2: Commit complete**

All changes are committed across Tasks 1–4. No further action needed.
