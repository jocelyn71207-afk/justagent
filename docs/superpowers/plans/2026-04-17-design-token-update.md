# Design Token Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將 JustAgent UI 的設計 token 更新為 Linear 極簡風格，同時保留翠綠主色（#059669）與 16px 大圓角。

**Architecture:** 採用 token-first 策略：先更新 SCSS 變數與 CSS Custom Properties，讓全站元件自動繼承；再針對有硬編碼值的元件（sidebar hover 色、modal padding、button 光暈）進行手術式修正。

**Tech Stack:** Vue 3 + Vite + Sass (SCSS) + CSS Custom Properties

**Dev server:** `cd /Users/jocelyn/Desktop/demosite && npm run dev`

**Design spec:** `docs/superpowers/specs/2026-04-17-design-system.md`

---

## File Map

| 動作 | 檔案 | 修改內容 |
|------|------|---------|
| Modify | `src/scss/base/_variables.scss` | menuWidth、grey-border、grey-font、radius-lg、radius-sm |
| Modify | `src/scss/base/_theme.scss` | 新增 shadow tokens、spacing tokens、新語意色 tokens（light） |
| Modify | `src/scss/base/_themeDark.scss` | 新增對應的 dark mode tokens |
| Modify | `src/scss/base/_button.scss` | hover 由 $color_main_3 改為 $color_main_2 |
| Modify | `src/scss/components/_AppMenuTree.scss` | sidebar hover 改中性灰、active 樣式去除 pill 形 |
| Modify | `src/scss/components/_compModal.scss` | padding 30px→24px、blur 10px→8px、加 box-shadow |

---

## Task 1: 更新 SCSS 基礎變數

**Files:**
- Modify: `src/scss/base/_variables.scss`

- [ ] **Step 1: 修改 menuWidth（L6）**

將：
```scss
$menuWidth: 306px;
```
改為：
```scss
$menuWidth: 260px;
```

- [ ] **Step 2: 修改 grey-border（L22）**

將：
```scss
$grey-border: #d3d4d8; // 邊框
```
改為：
```scss
$grey-border: #e5e7eb; // 邊框
```

- [ ] **Step 3: 修改 grey-font（L23）**

將：
```scss
$grey-font: #232735; // 文字
```
改為：
```scss
$grey-font: #111827; // 文字
```

- [ ] **Step 4: 在 $radius 之後新增 radius-lg 和 radius-sm（L135 之後）**

將：
```scss
// 導角
$radius: 8px;
```
改為：
```scss
// 導角
$radius: 8px;     // 互動元件（Button、Input、Switch）
$radius-lg: 16px; // 大容器（Card、Modal、Drawer）
$radius-sm: 4px;  // 小標籤（Badge、Tag）
```

- [ ] **Step 5: 確認 SCSS 編譯無錯誤**

```bash
cd /Users/jocelyn/Desktop/demosite && npm run build 2>&1 | head -30
```

預期：無 error 輸出（warning 可忽略）

- [ ] **Step 6: Commit**

```bash
cd /Users/jocelyn/Desktop/demosite
git add src/scss/base/_variables.scss
git commit -m "design: update base tokens — narrower sidebar, lighter border, deeper text, add radius-sm/lg"
```

---

## Task 2: 在 _theme.scss 新增語意 tokens（light mode）

**Files:**
- Modify: `src/scss/base/_theme.scss`

- [ ] **Step 1: 在 :root 結尾（L118 `}` 之前）插入新 token 區塊**

在 `--color-wise-empty-border: #a7f3d0;` 後、`}` 前插入：

```scss
  // ── Linear 設計系統 新增 tokens ─────────────────────────────────────────────

  // 主色語意別名
  --color-primary:         #059669;
  --color-primary-hover:   #047857;
  --color-primary-muted:   #d1fae5;
  --color-primary-subtle:  #f0fdf4;

  // 中性背景層次
  --color-bg:              #ffffff;
  --color-bg-subtle:       #f9fafb;
  --color-bg-muted:        #f3f4f6;

  // 強化邊框
  --color-border-strong:   #d1d5db;

  // 文字層次
  --color-text-muted:      #6b7280;
  --color-text-disabled:   #9ca3af;

  // 陰影系統
  --shadow-sm:     0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md:     0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-lg:     0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
  --shadow-focus:  0 0 0 3px rgba(5, 150, 105, 0.15);

  // 間距系統（4px grid）
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
```

- [ ] **Step 2: 確認 build 無錯誤**

```bash
cd /Users/jocelyn/Desktop/demosite && npm run build 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
cd /Users/jocelyn/Desktop/demosite
git add src/scss/base/_theme.scss
git commit -m "design: add Linear design tokens to light mode — shadows, spacing, semantic color aliases"
```

---

## Task 3: 在 _themeDark.scss 新增 dark mode tokens

**Files:**
- Modify: `src/scss/base/_themeDark.scss`

- [ ] **Step 1: 找到 _themeDark.scss 最後一個 `}` 前，插入 dark mode token 覆寫**

在檔案的最後一個 `  }` 之前插入（注意縮排，在 `@media` block 的 `:root { ... }` 內）：

```scss
    // ── Linear 設計系統 Dark mode 覆寫 ──────────────────────────────────────────

    // 主色語意別名（dark mode 下主色不變）
    --color-primary:         #059669;
    --color-primary-hover:   #10b981;
    --color-primary-muted:   rgba(5, 150, 105, 0.15);
    --color-primary-subtle:  rgba(5, 150, 105, 0.08);

    // 中性背景層次（deep dark）
    --color-bg:              #111827;
    --color-bg-subtle:       #1f2937;
    --color-bg-muted:        #374151;

    // 強化邊框
    --color-border-strong:   #4b5563;

    // 文字層次
    --color-text-muted:      #9ca3af;
    --color-text-disabled:   #6b7280;

    // 陰影系統（dark mode 陰影更深）
    --shadow-sm:     0 1px 2px rgba(0, 0, 0, 0.2);
    --shadow-md:     0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2);
    --shadow-lg:     0 4px 12px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2);
    --shadow-focus:  0 0 0 3px rgba(5, 150, 105, 0.25);

    // 間距系統（與 light mode 相同，不需覆寫 --space-* 因為它們不依賴主題）
```

- [ ] **Step 2: 確認 build 無錯誤**

```bash
cd /Users/jocelyn/Desktop/demosite && npm run build 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
cd /Users/jocelyn/Desktop/demosite
git add src/scss/base/_themeDark.scss
git commit -m "design: add dark mode token overrides for Linear design system"
```

---

## Task 4: 更新 button hover 顏色

**Files:**
- Modify: `src/scss/base/_button.scss`

目標：預設按鈕和主要按鈕的 hover 顏色從 `$color_main_3`（#34d399，偏亮綠）改為 `$color_main_2`（#047857，深綠），避免 hover 時顏色跳躍。

- [ ] **Step 1: 修改預設按鈕 hover（L16-19）**

將：
```scss
  &:hover {
    border-color: $color_main_3;
    color: $color_main_3;
  }
```
改為：
```scss
  &:hover {
    border-color: $color_main_2;
    color: $color_main_2;
  }
```

- [ ] **Step 2: 修改主要按鈕 hover（L51-55）**

將：
```scss
  &:hover {
    border-color: $color_main_3;
    background-color: $color_main_3;
    color: $white;
  }
```
改為：
```scss
  &:hover {
    border-color: $color_main_2;
    background-color: $color_main_2;
    color: $white;
  }
```

- [ ] **Step 3: 啟動 dev server 目視確認**

```bash
cd /Users/jocelyn/Desktop/demosite && npm run dev
```

打開瀏覽器，hover 按鈕確認：
- 預設按鈕 hover → 邊框與文字變深綠 #047857（不再亮綠）
- 主要按鈕 hover → 背景變深綠 #047857（不再亮綠）

- [ ] **Step 4: Commit**

```bash
cd /Users/jocelyn/Desktop/demosite
git add src/scss/base/_button.scss
git commit -m "design: button hover now uses primary-hover (#047857) instead of bright green (#34d399)"
```

---

## Task 5: 更新 Sidebar hover 與 active 樣式

**Files:**
- Modify: `src/scss/components/_AppMenuTree.scss`

目標：移除偏綠的 hover 色（`rgba(52,211,153,0.06)`），改為中性灰；active 狀態去除 pill 圓角（999px），改為方形（$radius）。

- [ ] **Step 1: 更換 group-name-box hover 色（L120）**

將：
```scss
        &:hover {
          background-color: rgba(52,211,153,0.06);
        }
```
改為：
```scss
        &:hover {
          background-color: var(--color-bg-muted);
        }
```

- [ ] **Step 2: 更換 sub-group-header hover 色（L149-151）**

將：
```scss
          &:hover {
            background-color: rgba(52,211,153,0.06);
          }
```
改為：
```scss
          &:hover {
            background-color: var(--color-bg-muted);
          }
```

- [ ] **Step 3: 更新 sub-group-header active 樣式（L152-158）**

將：
```scss
          &.active {
            background-color: #d1fae5;
            box-shadow: none;
            border-radius: 999px;
            color: #059669;
            font-weight: 600;
          }
```
改為：
```scss
          &.active {
            background-color: var(--color-primary-subtle);
            box-shadow: none;
            border-radius: $radius;
            color: var(--color-primary);
            font-weight: 500;
          }
```

- [ ] **Step 4: 更新 sub-menu 左側 border 顏色（L173）**

將：
```scss
          border-left: 2px solid #a7f3d0;
```
改為：
```scss
          border-left: 2px solid var(--color-border);
```

- [ ] **Step 5: 目視確認 sidebar**

確認項目：
- 群組名稱 hover → 淡灰背景（不再帶綠色）
- 選單項目 active → 方形綠底（不再 pill 圓角）
- 子選單縮排線 → 灰色（不再亮綠）

- [ ] **Step 6: Commit**

```bash
cd /Users/jocelyn/Desktop/demosite
git add src/scss/components/_AppMenuTree.scss
git commit -m "design: sidebar hover uses neutral gray, active state drops pill radius"
```

---

## Task 6: 更新 Modal padding 與 backdrop

**Files:**
- Modify: `src/scss/components/_compModal.scss`

- [ ] **Step 1: 更新 backdrop（L14-15）**

將：
```scss
  background: rgba(#000, 0.3);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
```
改為：
```scss
  background: rgba(#000, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
```

- [ ] **Step 2: 加入 box-shadow 並縮小 header padding（L26-42）**

將 `.compModal-panel` 的 `box-shadow` 那行（目前被 comment 掉）改為：
```scss
  box-shadow: var(--shadow-lg);
```

將 `.compModal-header` 的 padding（L37）：
```scss
    padding: 30px 30px 0px 30px;
```
改為：
```scss
    padding: 24px 24px 0;
```

- [ ] **Step 3: 縮小 body padding（L56）**

將：
```scss
    padding: 30px;
```
改為：
```scss
    padding: 24px;
```

- [ ] **Step 4: 目視確認 modal**

打開任一 modal 確認：
- 背景遮罩：略深、blur 稍輕
- header padding 縮減（標題距頂 24px）
- body padding 縮減（內容距邊 24px）
- modal 有細緻陰影（可見深度層次）

- [ ] **Step 5: Commit**

```bash
cd /Users/jocelyn/Desktop/demosite
git add src/scss/components/_compModal.scss
git commit -m "design: modal padding 30→24px, backdrop 0.3→0.4 blur 10→8px, add shadow-lg"
```

---

## Task 7: 移除卡片 hover 的 scale 效果

**Files:**
- Modify: `src/scss/_layout.scss:189`

目標：移除 `scale(1.02)` hover，改為純 `translateY(-2px)`，符合 Linear 克制風格。

- [ ] **Step 1: 修改 project-card hover（_layout.scss L188-192）**

將：
```scss
      &:hover {
        transform: translateY(-4px) scale(1.02);
        box-shadow: rgba(14, 15, 12, 0.10) 0px 12px 32px;
        border-color: rgba(14, 15, 12, 0.16);
      }
```
改為：
```scss
      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
        border-color: var(--color-border-strong);
      }
```

- [ ] **Step 2: 目視確認卡片 hover**

Hover 專案卡片：確認只有輕微上移，無放大效果，陰影為 Linear 的細緻版本。

- [ ] **Step 3: Commit**

```bash
cd /Users/jocelyn/Desktop/demosite
git add src/scss/_layout.scss
git commit -m "design: project card hover drops scale(1.02), uses shadow-lg token"
```

---

## Task 8: 更新 Tab active 樣式

**Files:**
- Modify: `src/scss/components/_compTabs.scss`

目標：active tab 從「白色背景填色」改為「底線」風格（Linear 風格），更輕量。

- [ ] **Step 1: 修改 .compTabs-item.is-active（L20-25）**

將：
```scss
  .compTabs-item.is-active {
    background-color: var(--color-tab-active-bg);
    .compTabs-label-btn {
      color: $grey-font;
    }
  }
```
改為：
```scss
  .compTabs-item.is-active {
    background-color: transparent;
    border-bottom: 2px solid var(--color-primary);
    border-radius: 0;
    .compTabs-label-btn {
      color: var(--color-primary);
      font-weight: 500;
    }
  }
```

- [ ] **Step 2: 讓 `.compTabs` 本身有底部 border 以對齊底線**

在 `.compTabs { ... }` 區塊內（L3）現有的 `gap: 10px;` 後加入：
```scss
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0;
```

- [ ] **Step 3: 目視確認 tab**

切換不同 tab：active tab 顯示綠色底線，非 active tab 無底色，整體更輕。

- [ ] **Step 4: Commit**

```bash
cd /Users/jocelyn/Desktop/demosite
git add src/scss/components/_compTabs.scss
git commit -m "design: tab active style changes from bg-fill to underline (Linear style)"
```

---

## 完成後驗證清單

- [ ] `npm run build` 零 error
- [ ] Sidebar 寬度從 306px 縮為 260px
- [ ] 邊框顏色整體偏淡（從 #d3d4d8 → #e5e7eb）
- [ ] 主要文字更深（#232735 → #111827）
- [ ] 按鈕 hover 為深綠（不再亮綠）
- [ ] Sidebar hover 為中性灰（不再帶綠）
- [ ] Sidebar active 為方形圓角（不再 pill）
- [ ] Modal padding 24px（比原來 30px 更緊湊）
- [ ] `--shadow-sm/md/lg/focus` 可在 DevTools 中確認存在
- [ ] `--color-primary/bg-subtle/bg-muted` 可在 DevTools 中確認存在
- [ ] Dark mode（OS 切換深色模式）下新 token 有正確覆寫值
- [ ] 卡片 hover 無 scale 效果，只有 translateY(-2px) 上移
- [ ] Tab active 為底線樣式（不再有白色背景）
