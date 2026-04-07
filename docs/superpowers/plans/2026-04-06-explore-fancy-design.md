# Explore 頁面 Liquid Glass 視覺升級 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Explore page's flat white-background UI with a Liquid Glass × colorful gradient design: green/teal/cyan light-blob background → semi-transparent white panel → glassmorphism UI elements.

**Architecture:** Background color blobs (fixed layer in Explore.vue) → white frosted panel wrapper (`.explore-glass-wrapper`) → Liquid Glass `_Explore.scss` rewrite for all UI components. No logic, routing, or store changes.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, SCSS (no scoped styles), Material Symbols Outlined icons

---

## File Map

| File | Change |
|------|--------|
| `src/views/Explore.vue` | Add blob divs, hero decoration divs, search chips row, rec-card icons |
| `src/scss/views/_Explore.scss` | Full visual rewrite — background, glass materials, hover animations, text colors |

---

### Task 1: Add background blob layer to Explore.vue

**Files:**
- Modify: `src/views/Explore.vue` (template section, lines 1–4)

- [ ] **Step 1: Add blob HTML inside `.Explore.views-page` wrapper, before `.views-page-content-box`**

Replace the opening of the template:
```html
<template>
  <div class="Explore views-page" v-show="!isEnterAppSearchPage">
    <!-- 彩色光球背景層 -->
    <div class="explore-bg">
      <div class="explore-bg__blob explore-bg__blob--1"></div>
      <div class="explore-bg__blob explore-bg__blob--2"></div>
      <div class="explore-bg__blob explore-bg__blob--3"></div>
      <div class="explore-bg__blob explore-bg__blob--4"></div>
      <div class="explore-bg__blob explore-bg__blob--5"></div>
    </div>
    <div class="views-page-content-box">
```

- [ ] **Step 2: Verify the file still compiles**

Run: `npm run type-check`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add src/views/Explore.vue
git commit -m "feat(explore): add background blob layer divs"
```

---

### Task 2: Add Hero Banner decoration divs + search chips row

**Files:**
- Modify: `src/views/Explore.vue` (hero section ~lines 17–33, search bar section ~lines 5–14)

- [ ] **Step 1: Add decoration divs inside `.explore-hero` and chips row after search bar**

The hero section currently starts `<div class="explore-hero">`. Change it to:
```html
      <!-- Hero Banner -->
      <div class="explore-hero">
        <div class="hero-deco hero-deco--tl"></div>
        <div class="hero-deco hero-deco--br"></div>
        <div class="hero-left">
```

After the closing `</div>` of `.explore-search-bar`, add a chips row:
```html
      <!-- 搜尋快捷 chips -->
      <div class="search-chips">
        <span class="chip">內容創作</span>
        <span class="chip">財務分析</span>
        <span class="chip">會議記錄</span>
        <span class="chip">HR 行政</span>
        <span class="chip">設計輔助</span>
      </div>
```

- [ ] **Step 2: Add icon to each rec-card in the recommendations grid**

The rec-card template currently is:
```html
          <div
            v-for="agent in filteredRecsAgents"
            :key="agent.name"
            class="rec-card"
            @click="openModal(agent)"
          >
            <div class="rec-card-top">
```

Add an icon before `.rec-card-top`:
```html
          <div
            v-for="agent in filteredRecsAgents"
            :key="agent.name"
            class="rec-card"
            @click="openModal(agent)"
          >
            <div class="rec-icon">
              <i class="material-symbols-outlined">{{ agent.icon }}</i>
            </div>
            <div class="rec-card-top">
```

- [ ] **Step 3: Verify compiles**

Run: `npm run type-check`
Expected: No new errors

- [ ] **Step 4: Commit**

```bash
git add src/views/Explore.vue
git commit -m "feat(explore): add hero decorations, search chips, rec-card icons"
```

---

### Task 3: Rewrite _Explore.scss — background blobs + white panel

**Files:**
- Modify: `src/scss/views/_Explore.scss`

- [ ] **Step 1: Replace the entire contents of `_Explore.scss` with the new styles**

Write the full file (keep existing modal styles at the bottom untouched):

```scss
// ── Explore 頁面 Liquid Glass 設計 ───────────────────────────────────────────

// 背景漸層底色
.Explore.views-page {
  background: linear-gradient(145deg, #4ade80 0%, #22c55e 35%, #06b6d4 100%) !important;
  position: relative;
  overflow: hidden;
}

// 彩色光球層
.explore-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;

  .explore-bg__blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(90px);
  }

  &__blob--1 {
    width: 520px;
    height: 520px;
    background: #4ade80;
    top: -120px;
    left: -100px;
    opacity: 0.75;
    animation: blobFloat 9s ease-in-out infinite;
  }

  &__blob--2 {
    width: 440px;
    height: 440px;
    background: #0891b2;
    top: -80px;
    right: -80px;
    opacity: 0.65;
    animation: blobFloat 11s ease-in-out infinite reverse;
  }

  &__blob--3 {
    width: 380px;
    height: 380px;
    background: #65a30d;
    bottom: 60px;
    left: 30%;
    opacity: 0.55;
    animation: blobFloat 13s ease-in-out infinite;
  }

  &__blob--4 {
    width: 300px;
    height: 300px;
    background: rgba(255, 255, 255, 0.9);
    top: 35%;
    left: 42%;
    opacity: 0.5;
    animation: blobFloat 8s ease-in-out infinite reverse;
  }

  &__blob--5 {
    width: 340px;
    height: 340px;
    background: #22d3ee;
    bottom: -60px;
    right: 60px;
    opacity: 0.6;
    animation: blobFloat 10s ease-in-out infinite;
  }
}

@keyframes blobFloat {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-18px); }
}

// 白底大板（覆蓋原本的 views-page-content-box）
.Explore .views-page-content-box {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.82) !important;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px !important;
  padding: 24px !important;
  box-shadow:
    0 12px 48px rgba(0, 60, 20, 0.18),
    0 2px 0 rgba(255, 255, 255, 0.9) inset;
  border: 1px solid rgba(255, 255, 255, 0.9) !important;
}

.Explore {
  // ── 搜尋列 ──────────────────────────────────────
  .explore-search-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(255, 255, 255, 0.45);
    backdrop-filter: blur(32px) saturate(1.6);
    -webkit-backdrop-filter: blur(32px) saturate(1.6);
    border: 1px solid rgba(255, 255, 255, 0.35);
    border-top-color: rgba(255, 255, 255, 0.95);
    border-left-color: rgba(255, 255, 255, 0.70);
    border-radius: 18px;
    padding: 10px 16px;
    margin-bottom: 10px;
    cursor: text;
    box-shadow:
      0 4px 20px rgba(0, 60, 20, 0.08),
      0 1px 0 rgba(255, 255, 255, 0.9) inset;
    transition: all 0.22s cubic-bezier(0.34, 1.4, 0.64, 1);

    &:focus-within {
      background: rgba(255, 255, 255, 0.60);
      border-top-color: rgba(255, 255, 255, 1);
    }

    i {
      font-size: 18px;
      color: rgba(0, 50, 30, 0.62);
      flex-shrink: 0;
    }

    input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 14px;
      color: #0a2e18;
      background: transparent;

      &::placeholder {
        color: rgba(0, 50, 30, 0.45);
      }
    }
  }

  // 搜尋快捷 chips
  .search-chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 20px;

    .chip {
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 12px;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.52);
      border: 1px solid rgba(255, 255, 255, 0.38);
      border-top-color: rgba(255, 255, 255, 0.9);
      color: rgba(0, 50, 30, 0.62);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.68) inset;
      transition: all 0.16s;
      white-space: nowrap;

      &:hover {
        background: rgba(255, 255, 255, 0.72);
        color: #0a2e18;
        transform: translateY(-1px);
      }
    }
  }

  // ── Hero Banner ──────────────────────────────────
  .explore-hero {
    position: relative;
    display: flex;
    align-items: center;
    gap: 16px;
    background: rgba(255, 255, 255, 0.45);
    backdrop-filter: blur(32px) saturate(1.6);
    -webkit-backdrop-filter: blur(32px) saturate(1.6);
    border: 1px solid rgba(255, 255, 255, 0.35);
    border-top-color: rgba(255, 255, 255, 0.95);
    border-left-color: rgba(255, 255, 255, 0.70);
    border-radius: 18px;
    padding: 20px 24px;
    margin-bottom: 28px;
    min-width: 0;
    overflow: hidden;
    box-shadow:
      0 4px 20px rgba(0, 60, 20, 0.08),
      0 1px 0 rgba(255, 255, 255, 0.9) inset;

    // 裝飾光暈偽元素
    .hero-deco {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;

      &--tl {
        width: 160px;
        height: 160px;
        background: radial-gradient(circle, rgba(74,222,128,0.35) 0%, transparent 70%);
        top: -50px;
        left: -30px;
      }

      &--br {
        width: 130px;
        height: 130px;
        background: radial-gradient(circle, rgba(6,182,212,0.30) 0%, transparent 70%);
        bottom: -40px;
        right: 180px;
      }
    }

    .hero-left {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
      position: relative;
      z-index: 1;
    }

    .hero-mascot {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.52);
      border: 1px solid rgba(255, 255, 255, 0.38);
      border-top-color: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.65) inset;

      .hero-mascot-inner {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: linear-gradient(135deg, #22c55e, #06b6d4);
      }
    }

    .hero-text {
      min-width: 0;
      position: relative;
      z-index: 1;

      h2 {
        font-size: 15px;
        font-weight: 600;
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: #0a2e18;
      }

      p {
        font-size: 12px;
        color: rgba(10, 46, 24, 0.52);
      }
    }

    .hero-cta {
      flex-shrink: 0;
      background: rgba(255, 255, 255, 0.52);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.38);
      border-top-color: rgba(255, 255, 255, 0.95);
      border-left-color: rgba(255, 255, 255, 0.72);
      border-radius: 14px;
      padding: 12px 16px;
      width: 188px;
      cursor: pointer;
      box-shadow:
        0 3px 14px rgba(0, 60, 20, 0.07),
        0 1px 0 rgba(255, 255, 255, 0.85) inset;
      transition: all 0.22s cubic-bezier(0.34, 1.4, 0.64, 1);
      position: relative;
      z-index: 1;

      &:hover {
        background: rgba(255, 255, 255, 0.70);
        border-top-color: rgba(255, 255, 255, 1);
        transform: translateY(-3px) scale(1.01);
        box-shadow: 0 10px 28px rgba(0, 60, 20, 0.10), 0 1px 0 rgba(255, 255, 255, 1) inset;
      }

      .hero-cta-label {
        font-size: 10px;
        font-weight: 600;
        background: linear-gradient(90deg, #16a34a, #0891b2);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }

      .hero-cta-name {
        font-size: 13px;
        font-weight: 600;
        color: #0a2e18;
        margin-bottom: 3px;
      }

      .hero-cta-desc {
        font-size: 11px;
        color: rgba(10, 46, 24, 0.52);
        line-height: 1.45;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .hero-cta-link {
        font-size: 11px;
        font-weight: 600;
        background: linear-gradient(90deg, #16a34a, #0891b2);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-top: 8px;
      }
    }
  }

  // ── Section Header ────────────────────────────────
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    h3 {
      font-size: 14px;
      font-weight: 600;
      color: #0a2e18;
    }

    .see-all {
      font-size: 12px;
      color: #16a34a;
      cursor: pointer;
      transition: color 0.15s;

      &:hover {
        color: #0a2e18;
      }
    }
  }

  // ── Agent 卡片網格 ────────────────────────────────
  .agent-grid {
    display: grid;
    gap: 10px;

    &--4 {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  .agent-card {
    position: relative;
    background: rgba(255, 255, 255, 0.50);
    backdrop-filter: blur(24px) saturate(1.5);
    -webkit-backdrop-filter: blur(24px) saturate(1.5);
    border: 1px solid rgba(255, 255, 255, 0.35);
    border-top-color: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    padding: 16px;
    cursor: pointer;
    box-shadow:
      0 3px 14px rgba(0, 60, 20, 0.07),
      0 1px 0 rgba(255, 255, 255, 0.85) inset;
    transition: all 0.22s cubic-bezier(0.34, 1.4, 0.64, 1);

    &:hover {
      background: rgba(255, 255, 255, 0.68);
      border-top-color: rgba(255, 255, 255, 1);
      transform: translateY(-4px) scale(1.015);
      box-shadow:
        0 12px 32px rgba(0, 60, 20, 0.12),
        0 1px 0 rgba(255, 255, 255, 1) inset;
    }

    // 排名 badge — 金/銀/銅
    .rank-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      font-size: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;

      &:nth-child(1) { // 第1名（金）
        background: linear-gradient(135deg, #f59e0b, #fcd34d);
        color: #78350f;
        box-shadow: 0 2px 8px rgba(245, 158, 11, 0.40);
      }
    }

    // 排名 badge 依父卡片位置區分
    &:nth-child(1) .rank-badge {
      background: linear-gradient(135deg, #f59e0b, #fcd34d);
      color: #78350f;
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.40);
    }

    &:nth-child(2) .rank-badge {
      background: linear-gradient(135deg, #94a3b8, #e2e8f0);
      color: #374151;
      box-shadow: 0 2px 6px rgba(148, 163, 184, 0.35);
    }

    &:nth-child(3) .rank-badge {
      background: linear-gradient(135deg, #b87333, #d4956c);
      color: #fff8f0;
      box-shadow: 0 2px 6px rgba(184, 115, 51, 0.35);
    }

    &:nth-child(n+4) .rank-badge {
      background: rgba(255, 255, 255, 0.55);
      border: 1px solid rgba(255, 255, 255, 0.40);
      border-top-color: rgba(255, 255, 255, 0.88);
      color: rgba(0, 50, 30, 0.62);
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.65) inset;
    }

    .agent-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      font-size: 10px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.55);
      border: 1px solid rgba(255, 255, 255, 0.40);
      border-top-color: rgba(255, 255, 255, 0.90);
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.65) inset;

      &--new { color: #3B6D11; }
      &--hot { color: #854F0B; }
      &--sat { color: #0F6E56; }
    }

    .agent-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 10px;
      background: rgba(255, 255, 255, 0.55);
      border: 1px solid rgba(255, 255, 255, 0.40);
      border-top-color: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.68) inset;

      i {
        font-size: 22px;
        color: rgba(0, 50, 30, 0.62);
      }
    }

    h4 {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 5px;
      color: #0a2e18;
    }

    p {
      font-size: 11px;
      color: rgba(10, 46, 24, 0.52);
      line-height: 1.55;
    }
  }

  // ── 個人化推薦 ────────────────────────────────────
  .recs-box {
    background: rgba(255, 255, 255, 0.45);
    backdrop-filter: blur(32px) saturate(1.6);
    -webkit-backdrop-filter: blur(32px) saturate(1.6);
    border: 1px solid rgba(255, 255, 255, 0.35);
    border-top-color: rgba(255, 255, 255, 0.95);
    border-left-color: rgba(255, 255, 255, 0.70);
    border-radius: 18px;
    padding: 22px 26px;
    box-shadow:
      0 4px 20px rgba(0, 60, 20, 0.08),
      0 1px 0 rgba(255, 255, 255, 0.9) inset;

    .recs-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;

      .recs-avatar {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: linear-gradient(135deg, #22c55e, #06b6d4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 600;
        color: #fff;
        flex-shrink: 0;
        box-shadow: 0 2px 8px rgba(34, 197, 94, 0.35);
      }

      .recs-title {
        font-size: 13px;
        font-weight: 600;
        color: #0a2e18;
      }
    }

    .recs-chips {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 14px;

      .recs-chip {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        cursor: pointer;
        background: rgba(255, 255, 255, 0.50);
        border: 1px solid rgba(255, 255, 255, 0.38);
        border-top-color: rgba(255, 255, 255, 0.88);
        color: rgba(0, 50, 30, 0.62);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        box-shadow: 0 1px 0 rgba(255, 255, 255, 0.65) inset;
        transition: all 0.16s;
        white-space: nowrap;

        &:hover {
          background: rgba(255, 255, 255, 0.68);
          color: #0a2e18;
        }

        &.active {
          background: rgba(255, 255, 255, 0.75);
          border-top-color: rgba(255, 255, 255, 1);
          color: #0a2e18;
          font-weight: 600;
          box-shadow:
            0 2px 8px rgba(0, 60, 20, 0.08),
            0 1px 0 rgba(255, 255, 255, 0.9) inset;
        }
      }
    }

    .recs-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }

    .rec-card {
      background: rgba(255, 255, 255, 0.50);
      backdrop-filter: blur(24px) saturate(1.5);
      -webkit-backdrop-filter: blur(24px) saturate(1.5);
      border: 1px solid rgba(255, 255, 255, 0.35);
      border-top-color: rgba(255, 255, 255, 0.95);
      border-radius: 14px;
      padding: 14px;
      cursor: pointer;
      box-shadow:
        0 3px 14px rgba(0, 60, 20, 0.07),
        0 1px 0 rgba(255, 255, 255, 0.85) inset;
      transition: all 0.22s cubic-bezier(0.34, 1.4, 0.64, 1);

      &:hover {
        background: rgba(255, 255, 255, 0.68);
        border-top-color: rgba(255, 255, 255, 1);
        transform: translateY(-4px) scale(1.015);
        box-shadow:
          0 12px 32px rgba(0, 60, 20, 0.12),
          0 1px 0 rgba(255, 255, 255, 1) inset;
      }

      .rec-icon {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 8px;
        background: rgba(255, 255, 255, 0.52);
        border: 1px solid rgba(255, 255, 255, 0.38);
        border-top-color: rgba(255, 255, 255, 0.90);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        box-shadow: 0 1px 0 rgba(255, 255, 255, 0.65) inset;

        i {
          font-size: 16px;
          color: rgba(0, 50, 30, 0.62);
        }
      }

      .rec-card-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 7px;

        .rec-card-name {
          font-size: 13px;
          font-weight: 600;
          color: #0a2e18;
        }

        .rec-card-tag {
          font-size: 10px;
          padding: 2px 7px;
          border-radius: 20px;
          font-weight: 600;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.52);
          border: 1px solid rgba(255, 255, 255, 0.40);
          border-top-color: rgba(255, 255, 255, 0.90);
          color: rgba(0, 50, 30, 0.62);
        }
      }

      .rec-card-desc {
        font-size: 11px;
        color: rgba(10, 46, 24, 0.52);
        line-height: 1.55;
      }
    }
  }

  // ── Modal 內容 ────────────────────────────────────
  .explore-modal-content {
    .explore-modal-icon {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 14px;

      i {
        font-size: 28px;
      }
    }

    .explore-modal-desc {
      font-size: 14px;
      color: var(--color-text-alpha70);
      line-height: 1.65;
      margin-bottom: 20px;
    }

    .explore-modal-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 24px;

      .explore-modal-tag {
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 500;
        background: var(--color-background-1);
        color: var(--color-text-alpha70);
        border: 1px solid var(--color-border);
      }
    }
  }

  .explore-modal-footer {
    display: flex;
    gap: 8px;

    .custom-btn {
      flex: 1;
    }
  }
}
```

- [ ] **Step 2: Verify the SCSS compiles**

Run: `npm run build 2>&1 | head -30`
Expected: No SCSS errors

- [ ] **Step 3: Commit**

```bash
git add src/scss/views/_Explore.scss
git commit -m "feat(explore): full Liquid Glass visual rewrite"
```

---

### Task 4: Visual verification + smoke test

**Files:**
- No code changes

- [ ] **Step 1: Start dev server and visually verify**

Run: `npm run dev`

Open browser to the Explore page and verify:
- Green/teal/cyan gradient background visible
- White frosted panel wraps all content
- Background blobs visible and slowly floating
- Search bar is glass-style with white top-border highlight
- Search chips row visible below search bar
- Hero banner is glass with decorative glow in corners
- "由我推薦" and "立即使用 →" text shows green→blue gradient
- Agent cards have glass style with gold/silver/bronze rank badges
- Agent icon background is white glass (no color tint)
- Agent badge (新上架/高滿意度) is white glass with colored text
- Cards lift with springy bounce on hover
- Recommendations box is larger glass panel
- Avatar has green→teal gradient
- rec-card items show an icon above the name
- All text is dark (#0a2e18 / dark green) not light

- [ ] **Step 2: Commit if all looks good**

```bash
git add -p
git commit -m "feat(explore): Liquid Glass design complete"
```

---

## Self-Review vs Spec

Checking `docs/superpowers/specs/2026-04-06-explore-fancy-design.md`:

| Spec Requirement | Task |
|---|---|
| 5 color blobs (b1–b5) with correct colors | Task 1, Task 3 |
| Base gradient `#4ade80 → #22c55e → #06b6d4` | Task 3 |
| White panel `rgba(255,255,255,0.82)` + `blur(20px)` | Task 3 |
| Large blocks Liquid Glass (hero, recs-box, search-bar) | Task 3 |
| Agent cards Liquid Glass | Task 3 |
| Small widgets (icons, badges, chips) glass | Task 3 |
| Hero `::before`/`::after` decorations → `.hero-deco` divs | Task 2, Task 3 |
| mascot inner `linear-gradient(135deg, #22c55e, #06b6d4)` | Task 3 |
| CTA label/link green→blue gradient text | Task 3 |
| rank badge gold/silver/bronze | Task 3 |
| agent-badge white glass + colored text | Task 3 |
| recs-avatar green→teal gradient | Task 3 |
| chip active: brighter white glass + darker text | Task 3 |
| rec-card adds icon (32×32) | Task 2, Task 3 |
| search bar quick-tag chips | Task 2, Task 3 |
| hover: `translateY(-4px) scale(1.015)` cubic-bezier spring | Task 3 |
| blob float animation `8s ease-in-out infinite` | Task 3 |
| Text: titles `#0a2e18`, body `rgba(10,46,24,0.52)`, see-all `#16a34a` | Task 3 |
