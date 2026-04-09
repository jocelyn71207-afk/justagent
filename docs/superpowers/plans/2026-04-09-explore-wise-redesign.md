# Explore 頁面 Wise 改版 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將 Explore 頁面從 Liquid Glass 毛玻璃風格改版為 Wise 設計系統（白底、萊姆綠、weight 900 標題）。

**Architecture:** 僅改 `_Explore.scss`（全部重寫）與 `Explore.vue` template（移除 blob divs、重構 hero 結構）。Script 邏輯與 Modal 完全不動。

**Tech Stack:** Vue 3 (script setup), SCSS, Vite

---

## 檔案對照

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/views/Explore.vue` | 修改 | 移除 `.explore-bg` blob，重構 hero template |
| `src/scss/views/_Explore.scss` | 完整重寫 | 所有毛玻璃樣式替換為 Wise 樣式 |

---

## Task 1: 更新 Explore.vue template

**Files:**
- Modify: `src/views/Explore.vue`

- [ ] **Step 1: 移除 `.explore-bg` 光球背景層**

將以下整段從 `src/views/Explore.vue` 刪除（第 3–10 行）：

```html
<!-- 彩色光球背景層 -->
<div class="explore-bg">
  <div class="explore-bg__blob explore-bg__blob--1"></div>
  <div class="explore-bg__blob explore-bg__blob--2"></div>
  <div class="explore-bg__blob explore-bg__blob--3"></div>
  <div class="explore-bg__blob explore-bg__blob--4"></div>
  <div class="explore-bg__blob explore-bg__blob--5"></div>
</div>
```

- [ ] **Step 2: 重構 Hero 區塊 template**

將現有 `.explore-hero` 內容（第 34–52 行）替換：

舊版（刪除）：
```html
<div class="explore-hero">
  <div class="hero-deco hero-deco--tl"></div>
  <div class="hero-deco hero-deco--br"></div>
  <div class="hero-left">
    <div class="hero-mascot">
      <div class="hero-mascot-inner"></div>
    </div>
    <div class="hero-text">
      <h2>今天想讓 Agent 助理幫你做什麼？</h2>
      <p>發掘最強大工作效率，選擇最適合的 AI 助理</p>
    </div>
  </div>
  <div class="hero-cta" @click="openModal(featuredAgent)">
    <div class="hero-cta-label">由我推薦</div>
    <div class="hero-cta-name">{{ featuredAgent.name }}</div>
    <div class="hero-cta-desc">{{ featuredAgent.desc }}</div>
    <div class="hero-cta-link">立即使用 →</div>
  </div>
</div>
```

新版（替換成）：
```html
<div class="explore-hero">
  <div class="hero-left">
    <div class="hero-eyebrow-pill">AI Agent 平台</div>
    <h2>今天想讓 Agent 助理幫你做什麼？</h2>
    <p>發掘最強大工作效率，選擇最適合的 AI 助理</p>
  </div>
  <div class="hero-cta" @click="openModal(featuredAgent)">
    <div class="hero-cta-label">由我推薦</div>
    <div class="hero-cta-name">{{ featuredAgent.name }}</div>
    <div class="hero-cta-desc">{{ featuredAgent.desc }}</div>
    <div class="hero-cta-link">立即使用 →</div>
  </div>
</div>
```

- [ ] **Step 3: 移除 `.rec-card-tag` 的 inline style binding**

在 `src/views/Explore.vue` 找到此行（約第 124 行）：

```html
<span v-if="agent.badge" class="rec-card-tag" :style="{ background: agent.bgColor, color: agent.accentColor }">
```

改為（移除 `:style` binding，讓 SCSS 統一控制顏色）：

```html
<span v-if="agent.badge" class="rec-card-tag">
```

- [ ] **Step 5: 確認 template 無編譯錯誤**

```bash
npm run type-check
```

期待：無錯誤輸出

- [ ] **Step 6: Commit**

```bash
git add src/views/Explore.vue
git commit -m "refactor(Explore): remove glass blobs, simplify hero template"
```

---

## Task 2: 重寫 _Explore.scss — 頁面底色 + 搜尋列 + Chips

**Files:**
- Modify: `src/scss/views/_Explore.scss`

- [ ] **Step 1: 以新內容完整取代 `_Explore.scss`（第一段：頁面殼 + 搜尋列 + chips）**

將檔案全部內容替換為以下（此步驟只寫到 chips 結束，後面步驟繼續補充）：

```scss
// ── Explore 頁面 Wise 設計系統 ─────────────────────────────────────────────────

.Explore.views-page {
  background: #f2f4f0;
  position: relative;
}

.Explore .views-page-content-box {
  position: relative;
  background: #f2f4f0 !important;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  box-shadow: none;
  border: none;
  border-radius: 0;
}

.Explore {
  // ── 搜尋列 ──────────────────────────────────────
  .explore-search-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #ffffff;
    border: 1px solid rgba(14, 15, 12, 0.12);
    border-radius: 9999px;
    padding: 11px 20px;
    margin-bottom: 12px;
    box-shadow: rgba(14, 15, 12, 0.06) 0px 2px 8px;
    cursor: text;
    transition: box-shadow 0.18s;

    &:focus-within {
      box-shadow: rgba(14, 15, 12, 0.12) 0px 0px 0px 2px;
    }

    i {
      font-size: 18px;
      color: #868685;
      flex-shrink: 0;
    }

    input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 15px;
      font-weight: 600;
      color: #0e0f0c;
      background: transparent;
      font-feature-settings: "calt";

      &::placeholder {
        color: #868685;
        font-weight: 400;
      }
    }
  }

  // 搜尋快捷 chips
  .search-chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 28px;

    .chip {
      padding: 5px 16px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      background: rgba(22, 51, 0, 0.07);
      color: #0e0f0c;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.16s;
      white-space: nowrap;
      font-feature-settings: "calt";

      &:hover {
        background: rgba(22, 51, 0, 0.12);
        transform: scale(1.04);
      }
    }
  }
```

- [ ] **Step 2: 確認 SCSS 可編譯（dev server 啟動無錯誤）**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

期待：無 error 輸出（可能有 warnings，不影響）

---

## Task 3: SCSS — Hero 區塊

**Files:**
- Modify: `src/scss/views/_Explore.scss`（在 Task 2 的結尾繼續補充）

- [ ] **Step 1: 在 `.search-chips` 關閉的 `}` 後面加入 Hero 樣式**

在 `.search-chips { ... }` 區塊結尾後，`// 搜尋快捷 chips` 下方，加入：

```scss
  // ── Hero Banner ──────────────────────────────────
  .explore-hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    background: #ffffff;
    border-top: 4px solid #9fe870;
    border-left: 1px solid rgba(14, 15, 12, 0.10);
    border-right: 1px solid rgba(14, 15, 12, 0.10);
    border-bottom: 1px solid rgba(14, 15, 12, 0.10);
    border-radius: 20px;
    padding: 26px 28px;
    margin-bottom: 36px;

    .hero-left {
      flex: 1;
      min-width: 0;
    }

    .hero-eyebrow-pill {
      display: inline-flex;
      background: #0e0f0c;
      color: #9fe870;
      font-size: 10px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 9999px;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    h2 {
      font-size: 22px;
      font-weight: 900;
      color: #0e0f0c;
      line-height: 1.15;
      letter-spacing: -0.4px;
      margin-bottom: 8px;
      font-feature-settings: "calt";
    }

    p {
      font-size: 13px;
      font-weight: 600;
      color: #868685;
    }

    .hero-cta {
      flex-shrink: 0;
      background: #9fe870;
      border-radius: 16px;
      padding: 16px 18px;
      width: 185px;
      cursor: pointer;
      transition: transform 0.22s cubic-bezier(0.34, 1.4, 0.64, 1);

      &:hover {
        transform: scale(1.05);
      }

      .hero-cta-label {
        font-size: 10px;
        font-weight: 600;
        color: rgba(22, 51, 0, 0.6);
        text-transform: uppercase;
        letter-spacing: 0.8px;
        margin-bottom: 5px;
      }

      .hero-cta-name {
        font-size: 14px;
        font-weight: 900;
        color: #163300;
        margin-bottom: 5px;
        line-height: 1.1;
      }

      .hero-cta-desc {
        font-size: 11px;
        color: rgba(22, 51, 0, 0.65);
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        margin-bottom: 12px;
      }

      .hero-cta-link {
        display: inline-flex;
        background: #163300;
        color: #9fe870;
        font-size: 12px;
        font-weight: 600;
        padding: 5px 14px;
        border-radius: 9999px;
        transition: transform 0.18s cubic-bezier(0.34, 1.4, 0.64, 1);

        &:hover {
          transform: scale(1.06);
        }
      }
    }
  }
```

- [ ] **Step 2: 在 dev server 確認 Hero 外觀正確**

```bash
npm run dev
```

在瀏覽器打開探索頁面，確認：
- Hero 背景為白色，頂部有萊姆綠色條
- 左上角有黑底萊姆綠字 pill「AI Agent 平台」
- 推薦卡為萊姆綠底

---

## Task 4: SCSS — Section Header + Agent 卡片

**Files:**
- Modify: `src/scss/views/_Explore.scss`

- [ ] **Step 1: 在 `.explore-hero` 關閉後加入 Section Header + Agent 卡片樣式**

```scss
  // ── Section Header ────────────────────────────────
  .section-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 14px;

    h3 {
      font-size: 20px;
      font-weight: 900;
      color: #0e0f0c;
      letter-spacing: -0.5px;
    }

    .see-all {
      font-size: 13px;
      font-weight: 600;
      color: #868685;
      cursor: pointer;
      transition: color 0.15s;

      &:hover {
        color: #0e0f0c;
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
    background: #ffffff;
    border: 1px solid rgba(14, 15, 12, 0.12);
    border-radius: 20px;
    padding: 18px;
    cursor: pointer;
    transition: all 0.22s cubic-bezier(0.34, 1.4, 0.64, 1);

    &:hover {
      transform: translateY(-4px) scale(1.02);
      box-shadow: rgba(14, 15, 12, 0.12) 0px 12px 32px;
      border-color: rgba(14, 15, 12, 0.20);
    }

    .rank-badge {
      position: absolute;
      top: 14px;
      right: 14px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &:nth-child(1) .rank-badge {
      background: #9fe870;
      color: #163300;
    }

    &:nth-child(2) .rank-badge {
      background: #e8ebe6;
      color: #454745;
    }

    &:nth-child(3) .rank-badge {
      background: #f5dfc0;
      color: #854f0b;
    }

    &:nth-child(n+4) .rank-badge {
      background: #e8ebe6;
      color: #454745;
    }

    .agent-badge {
      position: absolute;
      top: 14px;
      right: 14px;
      font-size: 10px;
      font-weight: 600;
      padding: 3px 9px;
      border-radius: 9999px;

      &--new {
        background: #e2f6d5;
        color: #163300;
      }

      &--hot {
        background: #faeeda;
        color: #854f0b;
      }

      &--sat {
        background: #e2f6d5;
        color: #0f6e56;
      }
    }

    .agent-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
      border: 1px solid rgba(14, 15, 12, 0.08);

      i {
        font-size: 22px;
      }
    }

    h4 {
      font-size: 14px;
      font-weight: 700;
      color: #0e0f0c;
      margin-bottom: 5px;
    }

    p {
      font-size: 12px;
      color: #868685;
      line-height: 1.55;
    }
  }
```

- [ ] **Step 2: 確認卡片外觀正確**

在瀏覽器確認：
- 卡片為白底，細邊框，無毛玻璃
- 第一名 badge 為萊姆綠，第二灰，第三暖棕
- hover 時卡片上浮並有陰影

- [ ] **Step 3: Commit**

```bash
git add src/scss/views/_Explore.scss
git commit -m "feat(Explore): rewrite SCSS - page shell, search, chips, hero, cards"
```

---

## Task 5: SCSS — 個人化推薦區塊 + Modal 樣式 + 關閉外層 brace

**Files:**
- Modify: `src/scss/views/_Explore.scss`

- [ ] **Step 1: 加入個人化推薦 `.recs-box` 樣式，並關閉最外層 `.Explore { }` brace**

在 `.agent-card` 結束後繼續加入，最後以 `}` 關閉整個 `.Explore` block：

```scss
  // ── 個人化推薦 ────────────────────────────────────
  .recs-box {
    background: #ffffff;
    border: 1px solid rgba(14, 15, 12, 0.12);
    border-radius: 30px;
    padding: 28px 32px;

    .recs-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 18px;

      .recs-avatar {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: #9fe870;
        color: #163300;
        font-size: 13px;
        font-weight: 900;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .recs-title {
        font-size: 15px;
        font-weight: 700;
        color: #0e0f0c;
      }
    }

    .recs-chips {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 18px;

      .recs-chip {
        padding: 5px 16px;
        border-radius: 9999px;
        font-size: 13px;
        font-weight: 600;
        background: rgba(22, 51, 0, 0.06);
        color: #454745;
        cursor: pointer;
        border: 1px solid transparent;
        transition: all 0.16s;
        white-space: nowrap;

        &:hover {
          background: rgba(22, 51, 0, 0.10);
          color: #0e0f0c;
        }

        &.active {
          background: #9fe870;
          color: #163300;
          transform: scale(1.04);
        }
      }
    }

    .recs-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }

    .rec-card {
      background: #f2f4f0;
      border: 1px solid rgba(14, 15, 12, 0.08);
      border-radius: 16px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.22s cubic-bezier(0.34, 1.4, 0.64, 1);

      &:hover {
        background: #e8ebe6;
        transform: translateY(-3px) scale(1.015);
        box-shadow: rgba(14, 15, 12, 0.08) 0px 8px 20px;
      }

      .rec-icon {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: rgba(14, 15, 12, 0.06);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 10px;
        border: 1px solid rgba(14, 15, 12, 0.08);

        i {
          font-size: 16px;
          color: #454745;
        }
      }

      .rec-card-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6px;

        .rec-card-name {
          font-size: 13px;
          font-weight: 700;
          color: #0e0f0c;
        }

        .rec-card-tag {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 9999px;
          background: #e2f6d5;
          color: #163300;
          flex-shrink: 0;
        }
      }

      .rec-card-desc {
        font-size: 12px;
        color: #868685;
        line-height: 1.55;
      }
    }
  }

  // ── Modal 內容（保留原樣）────────────────────────────────────────────────────
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

- [ ] **Step 2: build 確認無錯誤**

```bash
npm run build 2>&1 | grep -iE "error" | head -20
```

期待：無 error

- [ ] **Step 3: 在 dev server 完整驗收**

```bash
npm run dev
```

逐項確認：
1. 頁面背景為 `#f2f4f0` 暖灰白，無動態光球
2. 搜尋列為白底圓角 pill
3. Chips 預設深綠淺底，點擊後萊姆綠
4. Hero 白底頂邊萊姆綠色條，推薦卡萊姆綠底
5. Section 標題字重明顯（weight 900）
6. 卡片 hover 時上浮 + 陰影
7. 個人化推薦 active chip 萊姆綠
8. 推薦小卡 hover 時背景加深
9. Modal 正常開關

- [ ] **Step 4: Final commit**

```bash
git add src/scss/views/_Explore.scss
git commit -m "feat(Explore): complete Wise design system - recs box and modal styles"
```
