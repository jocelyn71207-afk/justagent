# File Type Icon Redesign — Frosted Gradient

**Date:** 2026-04-20  
**Scope:** `src/assets/fileTypeIcon/` × 8 icons + `src/views/ResourceLibrary.vue` imports

---

## Goal

Replace the current flat-color PNG file type icons with a modern **Frosted Gradient** SVG set that matches the app's light-themed SaaS design system.

---

## Design Spec

### Style: Frosted Gradient

- **Shape:** Rounded rectangle (rx=10), 64×76px viewBox
- **Background:** Per-type ultra-light tint
- **Border:** Gradient stroke (1.5px), light-to-medium tint of the type color
- **Fold corner:** Top-right dog-ear in a deeper tint, same family as border
- **Label:** Type name centered, bold, in the type's main color
- **Decorative lines:** Two short horizontal bars below label (opacity 20–30%), hint at file content

### Color Tokens per Type

| File Type | Background | Fold Corner | Label Color |
|-----------|-----------|-------------|-------------|
| PDF       | `#fff1f2`  | `#fca5a5`   | `#ef4444`   |
| PPT       | `#fff7ed`  | `#fdba74`   | `#f97316`   |
| XLSX      | `#f0fdf4`  | `#86efac`   | `#16a34a`   |
| DOCX      | `#eff6ff`  | `#93c5fd`   | `#2563eb`   |
| MD        | `#f5f3ff`  | `#c4b5fd`   | `#7c3aed`   |
| HTML      | `#fdf2f8`  | `#f9a8d4`   | `#db2777`   |
| TXT       | `#f8fafc`  | `#cbd5e1`   | `#475569`   |
| CHART     | `#ecfdf5`  | `#6ee7b7`   | `#059669`   |

### SVG Structure (per icon)

```svg
<svg viewBox="0 0 64 76" fill="none">
  <defs>
    <linearGradient id="g{TYPE}" ...>
      <stop offset="0%" stop-color="{light tint}"/>
      <stop offset="100%" stop-color="{fold corner color}"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="64" height="76" rx="10" fill="{background}"/>
  <!-- Gradient border -->
  <rect x="0.75" y="0.75" width="62.5" height="74.5" rx="9.25" stroke="url(#g{TYPE})" stroke-width="1.5"/>
  <!-- Document body -->
  <path d="M42 4 H10 C7.8 4 6 5.8 6 8 V68 C6 70.2 7.8 72 10 72 H54 C56.2 72 58 70.2 58 68 V20 L42 4Z" fill="{background}"/>
  <!-- Fold corner -->
  <path d="M42 4 L58 20 H44 C42.9 20 42 19.1 42 18 V4Z" fill="{fold corner}"/>
  <!-- Type label (font-size: 10 for short labels, 9 for HTML, 8.5 for CHART) -->
  <text x="32" y="38" text-anchor="middle" fill="{label color}" font-size="10" font-weight="700">TYPE</text>
  <!-- Decorative lines -->
  <rect x="16" y="46" width="32" height="3" rx="1.5" fill="{label color}" fill-opacity="0.3"/>
  <rect x="16" y="52" width="24" height="3" rx="1.5" fill="{label color}" fill-opacity="0.2"/>
</svg>
```

---

## Files to Change

### New files (8 SVGs)
```
src/assets/fileTypeIcon/pdf.svg
src/assets/fileTypeIcon/ppt.svg
src/assets/fileTypeIcon/excel.svg
src/assets/fileTypeIcon/word.svg
src/assets/fileTypeIcon/md.svg
src/assets/fileTypeIcon/html.svg
src/assets/fileTypeIcon/txt.svg
src/assets/fileTypeIcon/chart.svg
```

### Modified files
- `src/views/ResourceLibrary.vue` — update 8 PNG imports to SVG

### Unchanged
- PNG files remain as-is (no deletion, safe rollback)
- `getFileTypeIcon()` function logic unchanged
- All display templates unchanged

---

## Out of Scope

- Redesigning the `OTHER` / unknown file type icon (uses Material Symbol `question_mark`, no change)
- Image preview thumbnails (uses `item.fileUrl` directly)
- Table view vs card view layout changes
