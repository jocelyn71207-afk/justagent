# Design System — Teva Demo Site

> 本文件整理全站所有設計元素，供後續設計與開發延伸使用。
> 對應原始碼位於 `src/scss/`，所有顏色請使用 CSS Custom Properties，禁止寫死 hex。

---

## 目錄

1. [品牌主色](#1-品牌主色)
2. [CSS Custom Properties（主題變數）](#2-css-custom-properties主題變數)
3. [SCSS 變數](#3-scss-變數)
4. [字體排版](#4-字體排版)
5. [間距系統](#5-間距系統)
6. [Border Radius](#6-border-radius)
7. [Shadow 陰影](#7-shadow-陰影)
8. [Z-index 層級](#8-z-index-層級)
9. [動畫 Transition](#9-動畫-transition)
10. [按鈕 Button](#10-按鈕-button)
11. [Badge / Chip](#11-badge--chip)
12. [Modal](#12-modal)
13. [Drawer](#13-drawer)
14. [表單元素](#14-表單元素)
15. [滾動條](#15-滾動條)
16. [響應式斷點](#16-響應式斷點)
17. [圖示規範](#17-圖示規範)

---

## 1. 品牌主色（Jade Mist 02 系統）

> 本節先前記載的是更早期的 Emerald / Spring Green 色票，程式碼已在後續幾輪 redesign
> （`_theme.scss` / `_themeDark.scss`，代號 "Jade Mist 02"）換成下列 teal-green 系統，
> 本次一併校正文件使其符合現行程式碼，避免文件與 `:root` 實際定義的 CSS 變數不一致。

| 變數名 | Hex | 用途 |
|--------|-----|------|
| `$color_main_1` / `--primary` | `#00A078` | 主色：按鈕、連結、Active 狀態 |
| `$color_main_2` / `--primary-hover` | `#007F5F` | Hover / 深色輔助文字 |
| `$color_main_3` / `--accent` | `#00C896` | Accent：CTA、進度條、強調 |
| `$color_main_4` / `--accent-soft` | `#CFEFE2` | Pill highlight 填充、badge 背景 |
| `$color_main_5` | `#E6F7F0` | 淺色 tint |
| `$color_main_6` / `--page-bg` | `#F0FAF6` / `#FAFCFC` | 頁面底色 |

**Sidebar Active State**

| 元素 | 規格 |
|------|------|
| 背景色 | `var(--sidebar-active)`（無 pill，維持矩形 8px 圓角） |
| 文字色 | `var(--sidebar-fg)`，font-weight: 500 |
| 側欄底色 | `var(--sidebar-bg)` |
| Hover | `var(--sidebar-hover)` |

**灰色系**

| 變數名 | Hex | 用途 |
|--------|-----|------|
| `$grey-border` | `#DDE4E5` | 邊框灰 |
| `$grey-font` / `--text` | `#09151A` | 主文字灰 |
| `$grey-shadow` | `#29323c` | 陰影灰 |
| `$color_grey_1` / `--text-muted` | `#8b90a0` | 次要文字 |
| `$color_grey_2` / `--text-faint` | `#9fabba` | 更淡次要文字 |

**狀態色（Status Badge，檔案處理流程）**

| 狀態 | 背景 | 文字 |
|------|------|------|
| uploading（藍） | `rgba(30, 136, 229, 0.10)` | `#1565c0` |
| parsing（黃） | `rgba(251, 192, 0, 0.15)` | `#b07d00` |
| stored（綠） | `rgba(2, 195, 0, 0.10)` | `#02a100` |
| saved（青） | `rgba(0, 150, 136, 0.10)` | `#00695c` |
| failed（紅） | `rgba(209, 68, 55, 0.10)` | `#c62828` |

**Explore 頁面 Badge**

| 標籤 | 背景 | 文字 |
|------|------|------|
| New（綠） | `#CFEFE2` | `#00A078` |
| Hot（橙） | `#FAEEDA` | `#854F0B` |
| Sat（青） | `#CFEFE2` | `#00A078` |

**深色模式（Jade Mist 02 Dark）**：`--primary` 維持 `#00A078`，`--primary-hover` 在深色模式改為較亮的
`#00C896`；`--page-bg` / `--surface` / `--sidebar-bg` 分別為 `#0F1719` / `#152124` / `#0B1315`。
完整定義見 `src/scss/base/_themeDark.scss`。

---

## 2. CSS Custom Properties（主題變數）

定義於 `src/scss/base/_theme.scss`（淺色）和 `_themeDark.scss`（深色）。

### 背景色

| 變數 | 淺色值 | 深色值 |
|------|--------|--------|
| `--color-background` | `#ffffff` | `#313132` |
| `--color-background-1` | （稍深背景） | — |
| `--color-background-2` | （次深背景） | — |

每個背景色皆有對應透明度變體：`-alpha90` / `-alpha80` / … / `-alpha10`

### 文字色

| 變數 | 淺色值 | 深色值 |
|------|--------|--------|
| `--color-text` | `#232735` | `#ffffff` |
| `--color-heading` | `#3eb5cc` | — |
| `--color-link-text` | — | — |
| `--color-link-text-active` | — | — |

文字色亦有透明度變體：`--color-text-alpha50` 常用於次要文字。

### 邊框色

| 變數 | 說明 |
|------|------|
| `--color-border` | 主邊框（對應 `$grey-border` 淺色）|
| `--color-border-1` | 加深版邊框 |

### 其他系統變數

| 變數 | 用途 |
|------|------|
| `--color-shadow` | 陰影基礎色 |
| `--color-scrollbar` | 滾動條顏色 |
| `--color-scrollbar-alpha50` | 滾動條透明版 |
| `--color-userSay-record` | 對話記錄背景 |
| `--color-tab-active-bg` | Tab active 背景 |
| `--color-switch-active-bg` | Switch active 背景 |

---

## 3. SCSS 變數

定義於 `src/scss/base/_variables.scss`

### 佈局

```scss
$header-height: 36px;
$header-AiViewer-height: 0px;
$menuWidth: 306px;
$menuSmallWidth: 200px;
$menuHeaderHeight: 216px;
$menuFooterHeight: 50px;
$menutransition: 0.2s;
```

### 字體

```scss
$font-family: "Microsoft Jhenghei UI", Pmingliu, "Segoe UI", -apple-system,
              system-ui, Roboto, "Helvetica Neue", sans-serif;
$font-size-base: 16px;
$font-form-size: 14px;
$line-height-base: 1.5;
```

### 共用 Radius

```scss
$radius: 8px;
```

### 動畫時長

```scss
$transition-duration: 0.4s;
$color-transition-duration: 0.5s;
$menutransition: 0.2s;
```

---

## 4. 字體排版

### 字體大小規格

| 等級 | 大小 | 用途 |
|------|------|------|
| Display | `30px` | 頁面超大標題 |
| H1 | `24px` | 區塊標題 |
| H2 / Modal 標題 | `22px` / `1.375rem` | Modal title、頁面 h3 |
| H3 | `20px` | 卡片標題（大） |
| Body Large | `18px` | Modal 內容 |
| Body Base | `16px` / `1rem` | 主要內文 |
| Body Small / Form | `14px` | 表單、卡片標題、按鈕文字 |
| Caption | `13px` | 小標籤 |
| Micro | `12px` | 說明文字、Badge |
| Tiny | `10px` – `11px` | 極小提示 |

### 字重規格

| 名稱 | Weight | 用途 |
|------|--------|------|
| Bold | `700` | 頁面大標題 |
| SemiBold | `600` | Modal title、Section title |
| Medium | `500` | 卡片標題、次要標題 |
| Regular | `400` | 內文 |

### 行高

- 基礎行高：`1.5`（`$line-height-base`）
- 標題行高：通常 `1.3` – `1.4`

---

## 5. 間距系統

定義於 `src/scss/base/_utils.scss`，透過 utility class 應用。

### 間距等級

| Level | 值 | Class 前綴示例 |
|-------|----|----------------|
| 0 | `0px` | `.m-0`, `.p-0` |
| 1 | `8px` | `.m-1`, `.p-1` |
| 2 | `18px` | `.m-2`, `.p-2` |
| 3 | `30px` | `.m-3`, `.p-3` |
| 4 | `40px` | `.m-4`, `.p-4` |
| 5 | `50px` | `.m-5`, `.p-5` |

支援方向性：`mt-X`, `mb-X`, `ml-X`, `mr-X`, `pt-X`, `pb-X`, `pl-X`, `pr-X`, `gap-X`

### 組件內常用間距

| 情境 | 值 |
|------|-----|
| Modal header padding | `30px 30px 0px 30px` |
| Modal body padding | `30px` |
| Modal 按鈕間距 | `10px` |
| SweetAlert2 padding | `35px 24px 24px 24px` |
| 卡片內容 padding | `14px` |
| Table cell padding | `1.1rem 1.2rem` |
| Drawer header | `p-4`（16px） |

---

## 6. Border Radius

| 情境 | 值 |
|------|-----|
| 預設（`$radius`） | `8px` |
| Modal / 大型卡片 | `16px` |
| Drawer | `16px 0 0 16px`（右側滑入） |
| 表單輸入框 | `8px` |
| Badge / Chip | `20px`, `12px` |
| 小型 Tag | `4px`, `5px`, `6px` |
| 大圓角按鈕 | `30px`, `40px` |
| 圖示容器 | `8px`, `10px`, `12px` |
| Avatar / 圓形元素 | `50%` |
| Super large | `20px`, `24px` |

---

## 7. Shadow 陰影

### 按強度分類

```scss
/* 極輕 */
0 2px 8px rgba($color-shadow, 0.05);
0 4px 20px rgba(0, 0, 0, 0.03);

/* 輕 */
0 2px 8px rgba($color-shadow, 0.1);
0 4px 12px rgba(0, 0, 0, 0.06);

/* 中 */
0 2px 10px rgba(#000, 0.2);
0 4px 15px rgba(0, 0, 0, 0.1);

/* 強 */
0 3px 6px rgba($black, 0.22);          /* SweetAlert2 */
0 4px 10px -6px rgba(from var(--color-shadow) r g b / 0.5);

/* 主色陰影（互動按鈕） */
0 4px 16px rgba($color_main_1, 0.4);
0 4px 20px rgba($color_main_1, 0.5);

/* Drawer（左側進入） */
-4px 0 24px rgba(0, 0, 0, 0.12);

/* 底部懸浮列 */
0 -2px 16px rgba(0, 0, 0, 0.1);

/* Inset（表單 Range） */
inset 0 0 0 1px var(--color-border);
```

### Backdrop Filter

| 場景 | 值 |
|------|-----|
| Modal / Toast 遮罩 | `blur(10px)` |
| 輕微懸浮框 | `blur(2px)` |

---

## 8. Z-index 層級

| Z-index | 元素 |
|---------|------|
| `10000` | 特殊最頂層 |
| `9999` | AiViewer 特殊疊放 |
| `1062` | Drawer panel |
| `1061` | Drawer 遮罩 |
| `1060` | SweetAlert2 |
| `1001` | Modal panel |
| `1000` | Modal 遮罩 / Dropdown |
| `999` | 高層級面板 |
| `300` | 選單懸浮項目 |
| `200` | 選單子項目 |
| `100` | AiViewer 特定區域 |
| `11` | Batch Upload |
| `10` | 選單樹 / 按鈕 |
| `9` | Option box |
| `8` | AiViewer 側邊欄邊界 |
| `7` | AiViewer 框架調整器 |
| `6` | AiViewer 側邊欄 |
| `5` | AiViewer 指南針 |
| `4` | AiViewer 一般圖層 |
| `2` | 一般疊放 |
| `1` | 相對層 |
| `0` | 基礎層 |

---

## 9. 動畫 Transition

| 情境 | 值 |
|------|-----|
| 通用元素 | `0.4s`（`$transition-duration`） |
| 顏色切換（主題） | `0.5s`（`$color-transition-duration`） |
| 選單展開 | `0.2s`（`$menutransition`） |
| 邊框色 Hover | `0.15s` |
| Transform 動畫 | `0.15s` / `0.18s` / `0.25s` / `0.3s` |
| 背景色 | `0.2s` |
| AI Pulse 動畫 | `2s infinite ease-in-out` |

---

## 10. 按鈕 Button

定義於 `src/scss/base/_button.scss`

### 標準按鈕（`.custom-btn`）

```scss
padding: 0.3rem 0.7rem;          /* ~4.8px 11.2px */
border: 1.5px solid var(--color-border);
border-radius: 8px;
background: var(--color-background);
color: var(--color-text);
font-size: 0.875rem;             /* 14px */
line-height: 1.4;
transition: 0.15s;
```

- Icon（`> i`）：`font-size: 16px`
- Icon 與文字間距（`gap`）：`5px`

| 狀態 | 邊框色 | 文字色 |
|------|--------|--------|
| Default | `var(--color-border)` | `var(--color-text)` |
| Hover | `$color_main_3` (#76cbdd) | `$color_main_3` |
| Active / Focus | `$color_main_2` (#22c2d3) | `$color_main_2` |
| Disabled | opacity `0.3` | — |

### 主色按鈕（`.custom-main-btn`）

```scss
border: 1.5px solid $color_main_1;
background: $color_main_1;
color: #ffffff;
```

| 狀態 | 背景 | 邊框 |
|------|------|------|
| Default | `$color_main_1` (#3eb5cc) | `$color_main_1` |
| Hover | `$color_main_3` (#76cbdd) | `$color_main_3` |
| Active / Focus | `$color_main_2` (#22c2d3) | `$color_main_2` |

### 修飾符

| Class | 效果 |
|-------|------|
| `.no-border` | 邊框設為 transparent |
| `.no-bg` | 背景設為 transparent |

### SweetAlert2 按鈕（`.swal2-styled`）

```scss
padding: 8px 16px;
border-radius: 8px;
font-size: 18px;
min-width: 120px;
```

---

## 11. Badge / Chip

### 類型 Badge（`.badge--ai`, `.badge--raw`）

```scss
/* AI */
background: rgba(138, 63, 252, 0.10);
color: #7c3aed;

/* Raw */
background: rgba(30, 136, 229, 0.10);
color: #1565c0;
```

- `border-radius`: `12px` – `20px`
- `font-size`: `12px` – `13px`
- `padding`: `2px 8px` – `4px 10px`

---

## 12. Modal

### 標準 Modal 結構（`.compModal`）

定義於 `src/scss/components/_compModal.scss`

```
.compModal
  ├─ .compModal-mask        z-index: 1000, backdrop-filter: blur(10px)
  └─ .compModal-panel       z-index: 1001
      ├─ .compModal-header
      │   ├─ .compModal-title
      │   └─ .compModal-close-btn
      ├─ .compModal-body    可滾動，自訂滾動條
      └─ .compModal-footer  可插槽
```

### Modal 樣式規格

| 屬性 | 值 |
|------|-----|
| 遮罩背景 | `rgba(#000, 0.3)` + `backdrop-filter: blur(10px)` |
| Panel 背景 | `var(--color-background)` |
| Panel border-radius | `16px` |
| Panel max-height | `92svh` |
| Header padding | `30px 30px 0px 30px` |
| Body padding | `30px` |
| Title font-size | `22px` |
| Title font-weight | `600` |
| Z-index（mask） | `1000` |
| Z-index（panel） | `1001` |

### Wizard Modal（CreateKnowledgeWizardModal）

```
.CreateKnowledgeWizardModal
  ├─ .wizard-header-box
  │   ├─ .wizard-modal-title
  │   └─ .wizard-steps
  │       ├─ .wizard-step-item (×N)
  │       └─ .wizard-step-connector
  ├─ .wizard-modal-body
  │   ├─ .wizard-state-center   (loading)
  │   ├─ .check-result-banner   (success / warning)
  │   ├─ .template-grid         (Step 2)
  │   └─ .ai-preview-container  (Step 3)
  └─ footer
```

### SweetAlert2

| 屬性 | 值 |
|------|-----|
| Z-index | `1060` |
| 遮罩 | `rgba(#000, 0.3)` + `backdrop-filter: blur(10px)` |
| 寬度 | `30em`（480px） |
| Padding | `35px 24px 24px 24px` |
| Border-radius | `16px` |

---

## 13. Drawer

定義於 `src/scss/views/_KnowledgeBase.scss`

```
.drawer-root
  ├─ .swal2-backdrop-show    z-index: 1061（遮罩）
  └─ .drawer-panel           z-index: 1062（從右滑入）
      ├─ .drawer-header      padding: 16px
      │   ├─ h5              font-weight: 700
      │   └─ 關閉按鈕
      └─ .drawer-body
```

### Drawer 樣式規格

| 屬性 | 值 |
|------|-----|
| 背景 | `var(--color-background)` |
| Border-radius | `16px 0 0 16px` |
| Box-shadow | `-4px 0 24px rgba(0, 0, 0, 0.12)` |
| Z-index（遮罩） | `1061` |
| Z-index（panel） | `1062` |
| Header font-weight | `700` |

---

## 14. 表單元素

### Input / Select

```scss
padding: 0.532rem 0.4rem;      /* ~8.5px 6.4px */
border: 1px solid var(--color-border);
border-radius: 8px;
font-size: 14px;               /* $font-form-size */
background: var(--color-background);
color: var(--color-text);
```

| 狀態 | 邊框 |
|------|------|
| Default | `var(--color-border)` |
| Focus | `$color_main_1` |
| Hover | `$color_main_3` |
| Error | `$color_red_1` / `#c62828` |

### Range Input

```scss
inset 0 0 0 1px var(--color-border);   /* track border */
accent-color: $color_main_1;
```

---

## 15. 滾動條

透過 mixins 統一管理（`src/scss/base/_mixins.scss`）

```scss
@include no-scroll-bar();   /* 隱藏滾動條 */
@include use-scroll-bar();  /* 自訂風格滾動條 */
```

自訂滾動條使用 `var(--color-scrollbar)` 和 `var(--color-scrollbar-alpha50)`。

---

## 16. 響應式斷點

| 名稱 | 變數 | 值 |
|------|------|----|
| Desktop | `$breakpoint-desktop` | `1024px` |
| Tablet | `$breakpoint-tablet` | `900px` |
| Mobile | `$breakpoint-mobile` | `768px` |

---

## 17. 圖示規範

- 使用 Bootstrap Icons（class `bi bi-*`）
- 圖示容器通常為方形，`border-radius: 8px` – `50%`
- 主色圖示：`color: $color_main_1`
- 次要圖示：`color: var(--color-text-alpha50)`

---

## 新增元件 Checklist

設計新元件時，請確認：

- [ ] 顏色使用 CSS Custom Properties，不寫死 hex
- [ ] 字體大小對照「字體排版」規格表
- [ ] 間距使用 utility class 或參考間距等級
- [ ] Border-radius 依元件尺寸選擇對應值
- [ ] Hover / Active / Disabled 狀態完整
- [ ] 若有遮罩，確認 z-index 符合層級系統
- [ ] 若新增 SCSS 檔案，在 `_index.scss` 補 `@forward`
- [ ] 若有動畫，使用已定義的 transition 時長

---

## 18. 變更紀錄

### 2026-08-17 — 入口頁 / 側邊導覽 taste pass（品牌保留，排版與密度重做）

範圍：`ProjectDashboard` + `AppMenuTree`。保留 Jade Mist 02 品牌色與現有路由 / IA，只調整排版節奏與裝飾密度：

- **Banner 去疊框**：拿掉 `.plc-banner` 左側 3px 色條，只留底部 hairline，標題放大並加重（26px / 700），
  不再用多層邊框互相堆疊做強調。
- **移除右上角 KPI 迷你框**：原本「建立新專案」按鈕旁還擠了 Active / Review 兩個各自帶邊框的統計框，
  版面擁擠且 Review 數字在目前假資料下永遠是 0（無 `status: 'review'` 的專案），視覺上等於一塊空白。
  直接移除，專案數量已由 banner 副標「N projects」承載。
- **卡片移除疊加在照片上的 pill 標籤**：`.team-name-box`（團隊名稱）與 `.card-project-id`（假流水號
  `PRJ-001` 之類的裝飾性編號，並非真實資料）不再疊在圖片上，團隊名稱改成圖片下方的說明文字
  （`.card-team`），流水號直接移除。
- **收斂 JetBrains Mono 的使用範圍**：banner 副標題、排序下拉、狀態 badge 不再套用等寬字體；只保留在
  真正對應「表格 / 時間戳 / 數值」的地方（如卡片時間戳、hover 長條圖數字）。
- **側邊選單呼吸感**：團隊區塊之間的間距從 4px 拉開到 14px，子選單縮排線改用較淡的
  `--divider-a50` 且改為 1px，降低「檔案樹」的視覺重量。

*最後更新：2026-08-17*
