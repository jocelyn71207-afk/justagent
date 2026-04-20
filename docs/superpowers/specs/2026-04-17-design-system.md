# JustAgent UI — Design System Specification
*Version 1.0 · 2026-04-17*

> **風格定位**：Linear 極簡功能主義 × 翠綠品牌色。去除視覺裝飾雜訊，以精準的間距、克制的陰影、強對比字體層次傳達專業感。圓角保持柔和（16px 大元件），維持親切感與品牌識別。

---

## 1. 設計原則

| 原則 | 說明 |
|------|------|
| **功能優先** | 每個視覺元素必須有功能理由，無用的裝飾一律移除 |
| **克制陰影** | 陰影只用於建立層次，不用於裝飾；最多兩層陰影 |
| **邊框代替陰影** | 同層元素間以細邊框分隔，不用陰影 |
| **對比驅動層次** | 靠字重、字色、字型大小的對比建立視覺層次，不靠顏色 |
| **綠色克制使用** | 主色 #059669 只用於：主要操作按鈕、active 狀態、連結、focus 框線 |
| **留白優先** | 寧可元素少，也要間距充足；密集排版是錯誤訊號 |

---

## 2. 色彩 Token

### 主色（Primary）
```
--color-primary:        #059669   /* 主要 CTA、active 狀態、連結 */
--color-primary-hover:  #047857   /* Hover 狀態（更深） */
--color-primary-muted:  #d1fae5   /* Badge 背景、淡強調背景 */
--color-primary-subtle: #f0fdf4   /* Hover 底色、active 列背景 */
```

> **移除**：原有的 `$color_main_3`（#34d399）不再作為 hover 顏色。hover 一律使用 `--color-primary-hover`（#047857），避免顏色跳躍感。

### 中性色（Neutrals）
```
--color-text:           #111827   /* 主要文字（比原有 #232735 更深，提升對比） */
--color-text-muted:     #6b7280   /* 次要文字、時間戳、說明 */
--color-text-disabled:  #9ca3af   /* 停用狀態文字 */

--color-bg:             #ffffff   /* 頁面背景 */
--color-bg-subtle:      #f9fafb   /* 側邊欄、表格底色 */
--color-bg-muted:       #f3f4f6   /* Input 停用背景、hover 交替底色 */

--color-border:         #e5e7eb   /* 主要邊框（比原有 #d3d4d8 更淡、更細） */
--color-border-strong:  #d1d5db   /* 強調邊框（分隔線、active input） */
```

### 語意色（Semantic）
```
/* 維持原有語意色，不變動 */
--color-success:   #059669
--color-warning:   #f59e0b
--color-danger:    #e53935
--color-info:      #1e88e5

/* Status badge 維持原有定義 */
```

### Dark Mode
Dark mode 維持原有結構（`prefers-color-scheme: dark`），需更新以下 token 對應新中性色：
```
--color-text:          #f9fafb   /* 白色文字 */
--color-text-muted:    #9ca3af
--color-bg:            #111827
--color-bg-subtle:     #1f2937
--color-bg-muted:      #374151
--color-border:        #374151
--color-border-strong: #4b5563
/* --color-primary 系列不變，綠色在深色底上對比足夠 */
```

---

## 3. 字體（Typography）

### 字體家族
```scss
$font-family: "Microsoft Jhenghei UI", "Segoe UI", -apple-system,
              system-ui, Roboto, "Helvetica Neue", sans-serif;
/* 不變，維持原有中文字體支援 */
```

### 字體層次
| Token | 大小 | 字重 | Letter-Spacing | 用途 |
|-------|------|------|----------------|------|
| `--text-xl` | 20px | 700 | -0.02em | 頁面主標題 |
| `--text-lg` | 18px | 600 | -0.015em | 區塊標題、Modal 標題 |
| `--text-md` | 15px | 500 | -0.01em | 卡片標題、Tab 文字 |
| `--text-base` | 14px | 400 | 0 | 主要內文、按鈕、表單 |
| `--text-sm` | 13px | 400 | 0 | 次要說明、標籤 |
| `--text-xs` | 12px | 500 | 0.01em | Badge、狀態標籤 |
| `--text-2xs` | 11px | 500 | 0.02em | 時間戳、Micro hint |

> **調整重點**：標題加入負值 letter-spacing（-0.02em），呈現 Linear 字體緊湊感。Body 維持 0，確保中文可讀性。

### Line Height
```
標題：1.3
內文：1.6（比原有 1.5 略寬，提升中文閱讀舒適度）
表單：1.4
```

---

## 4. 間距（Spacing）

採用 **4px 基礎單位**，嚴格遵循 4 的倍數。

| Token | 值 | 用途 |
|-------|----|------|
| `--space-1` | 4px | 元素內 micro gap |
| `--space-2` | 8px | Icon 與文字間距、Badge padding |
| `--space-3` | 12px | 元件內部 padding |
| `--space-4` | 16px | 卡片內距、段落間距 |
| `--space-5` | 20px | 區塊間距 |
| `--space-6` | 24px | Grid gap、大間距 |
| `--space-8` | 32px | Section 間距 |
| `--space-10` | 40px | 頁面邊距（mobile） |
| `--space-12` | 48px | 頁面邊距（desktop） |

> **調整重點**：原有間距（8/18/30/40/50）不符合 4px 倍數規律。統一為 4px grid 後，視覺節奏更一致。

---

## 5. 圓角（Border Radius）

| Token | 值 | 用途 |
|-------|----|------|
| `--radius-sm` | 4px | Badge、Tag、Chip |
| `--radius-md` | 8px | Button、Input、Switch、小卡片 |
| `--radius-lg` | 16px | 大卡片（Project Card、File Card）、Modal、Drawer |
| `--radius-full` | 9999px | 圓形頭像、Pill 形按鈕 |

> **規則**：大圓角（16px）保留，用於主要容器元件，維持品牌柔和感。互動元件（Button、Input）使用 8px，保持 Linear 紮實感。

---

## 6. 陰影（Shadows）

Linear 風格：陰影極度克制，主要依靠邊框建立層次。

```
--shadow-sm:     0 1px 2px rgba(0, 0, 0, 0.05)                          /* 微弱提升 */
--shadow-md:     0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.05) /* 卡片 */
--shadow-lg:     0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04) /* Modal、Dropdown */
--shadow-focus:  0 0 0 3px rgba(5, 150, 105, 0.15)                      /* Focus ring */
```

> **移除**：品牌色陰影（`rgba($color_main_1, 0.4)`）不再使用。按鈕 hover 不加綠色光暈，改為純色深化。

---

## 7. 元件規範

### 按鈕（Button）

**Primary Button**
```
background:    #059669
color:         #ffffff
border:        none
border-radius: --radius-md (8px)
padding:       7px 14px
font-size:     14px
font-weight:   500
shadow:        none（移除 hover 綠色光暈）

hover → background: #047857
active → background: #065f46
focus → box-shadow: --shadow-focus
```

**Default Button**
```
background:    transparent
color:         --color-text
border:        1px solid --color-border
border-radius: --radius-md (8px)
padding:       7px 14px

hover → background: --color-bg-subtle, border: --color-border-strong
focus → box-shadow: --shadow-focus
```

**規則**：按鈕高度統一 34px（padding 7px + font 14px × 1.4 line-height）。

---

### 輸入框（Input / Select / Textarea）
```
border:        1px solid --color-border
border-radius: 8px  ← --radius-md
padding:       8px 12px
font-size:     14px
background:    --color-bg

focus → border: --color-primary, box-shadow: --shadow-focus
error → border: --color-danger
disabled → background: --color-bg-muted, opacity: 0.6
```

---

### 卡片（Card）
```
background:    --color-bg
border:        1px solid --color-border
border-radius: 16px  ← --radius-lg（保留大圓角）
padding:       16px
shadow:        --shadow-md

hover → shadow: --shadow-lg, translateY(-2px)
        transition: 0.18s cubic-bezier(0.34, 1.2, 0.64, 1)
```

> **調整**：移除原有 `scale(1.02)` hover 效果，改為純 `translateY(-2px)`，更接近 Linear 的克制感。

---

### 側邊欄（Sidebar）
```
background:    --color-bg-subtle (#f9fafb)
border-right:  1px solid --color-border
width:         260px  ← 從 306px 縮減（Linear 側欄更窄）

Menu Item:
  padding:       6px 8px
  border-radius: 6px
  font-size:     14px
  font-weight:   400
  color:         --color-text-muted

  active →
    background:  --color-primary-subtle (#f0fdf4)
    color:       --color-primary (#059669)
    font-weight: 500
  hover →
    background:  --color-bg-muted (#f3f4f6)
    color:       --color-text
```

> **調整**：移除原有的 `rgba(52, 211, 153, 0.06)` hover 色（偏綠）。hover 改為中性灰，只有 active 才用綠色，減少視覺噪音。

---

### Modal
```
border-radius: 16px  ← 保留大圓角
shadow:        --shadow-lg
backdrop:      rgba(0, 0, 0, 0.4) blur(8px)  ← blur 從 10px 降至 8px（更輕）

header:  padding: 24px 24px 0  ← 從 30px 縮減
body:    padding: 24px
footer:  padding: 16px 24px 24px
```

---

### Badge / Tag
```
border-radius: 4px  ← --radius-sm（從 20px pill 改為方形，更 Linear）
padding:       2px 6px
font-size:     12px
font-weight:   500

primary badge:  background: --color-primary-muted, color: --color-primary
neutral badge:  background: --color-bg-muted, color: --color-text-muted
```

> **例外**：狀態 Badge（上傳中、解析中等）維持原有 pill 形（border-radius: 20px），因為這類 badge 需要強烈視覺辨識。

---

### Switch / Tab
```
Switch container:
  background:    --color-bg-muted
  border:        1px solid --color-border
  border-radius: 8px
  padding:       4px

  active item:
    background:  --color-primary-muted
    color:       --color-primary
    font-weight: 500

Tab:
  active: border-bottom: 2px solid --color-primary（Linear 底線風格）
          不使用 background 填色
```

---

## 8. 動畫與過渡

Linear 動畫哲學：**快速、確定、無多餘回饋**。

| 情境 | 時間 | Easing |
|------|------|--------|
| Hover 顏色切換 | 100ms | linear |
| 按鈕 active 按壓 | 80ms | linear |
| 卡片 hover 位移 | 180ms | cubic-bezier(0.34, 1.2, 0.64, 1) |
| Modal 開關 | 200ms | ease-out |
| Sidebar 展開 | 180ms | ease-out |
| 主題切換 | 300ms | ease |

> **移除**：AI Pulse 等裝飾性動畫移至需要時才啟用，不作為預設視覺元素。

---

## 9. 圖示使用規則

- 優先使用 **Material Symbols Outlined**（已引入）
- 圖示大小統一：導覽列 18px、表單 16px、按鈕 16px、標題 20px
- 圖示顏色跟隨父層文字色（`currentColor`），不單獨設定顏色
- 僅在 active 狀態下圖示使用 `--color-primary`

---

## 10. SCSS 變數更新對照表

以下為需要在 `src/scss/base/_variables.scss` 更新的項目：

```scss
// ─── 圓角 ───────────────────────────────
$radius:    8px;       // 維持（按鈕、輸入框）
$radius-lg: 16px;      // 新增（卡片、Modal）
$radius-sm: 4px;       // 新增（Badge）

// ─── 邊框顏色 ────────────────────────────
$grey-border: #e5e7eb;  // 從 #d3d4d8 調淡

// ─── 文字顏色 ────────────────────────────
$grey-font: #111827;    // 從 #232735 調深

// ─── 側邊欄寬度 ──────────────────────────
$menuWidth: 260px;      // 從 306px 縮減

// ─── 陰影 ────────────────────────────────
// 建議新增以下 CSS Custom Properties：
// --shadow-sm / --shadow-md / --shadow-lg / --shadow-focus
```

---

## 11. 不應更動的項目

| 項目 | 理由 |
|------|------|
| 主色 #059669 | 品牌識別核心，不變動 |
| 字體家族 | 中文支援完整，維持現有 |
| Z-index 系統 | 現有層級管理正確，不調整 |
| 語意狀態色 | 功能性顏色維持一致性 |
| 響應式斷點 | 現有斷點合理，維持 |
| Dark mode 結構 | 框架保留，僅更新 token 值 |
| AiViewer Canvas 元件 | Konva.js 元件有獨立視覺系統，不在本次範圍 |

---

## 12. AI 繼續設計的指引

後續 AI 新增或修改 UI 元件時，請遵循：

1. **顏色只從 Token 取用**，不直接寫 hex，除非是全新語意色
2. **大元件（卡片、Modal）圓角固定 16px**，互動元件（Button、Input）用 8px
3. **陰影最多兩層**，卡片用 `--shadow-md`，浮層用 `--shadow-lg`
4. **主色 #059669 克制使用**：只有 active、CTA、focus 才用，hover 底色用中性灰
5. **字體層次靠字重與大小對比**，不用顏色對比（除了 muted 文字）
6. **間距嚴格使用 4px 倍數**（4/8/12/16/20/24/32/48）
7. **新元件先確認是否可以組合現有元件**，不要重複造輪子
8. **動畫保持克制**：hover 100ms、互動 200ms，禁止無功能的裝飾動畫
