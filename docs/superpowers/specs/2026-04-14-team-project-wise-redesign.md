# 設計文件：TeamProject — Wise 風格重設計

**日期：** 2026-04-14
**範圍：** `TeamProject` 完整頁面（header、卡片 view、列表 view、empty state）
**不動：** `AppMenuTree` 側邊導覽、所有 props / emits / 業務邏輯
**實作方式：** SCSS + 局部 template 調整（B 方案）

---

## 1. 設計原則

採用 Wise 設計語言，專案已有對應 CSS custom properties 與 SCSS 變數：

| Token | 值 | 用途 |
|---|---|---|
| `--color-wise-green` | `#9fe870` | 萊姆綠 CTA / header 背景 / 長條圖 |
| `--color-wise-dark-green` | `#163300` | CTA 按鈕文字 / 深色強調 / 建立按鈕背景 |
| `--color-wise-black` | `#0e0f0c` | 主色文字（標題、專案名稱）|
| `--color-wise-gray` | `#868685` | 次要文字（時間、label）|
| `--color-wise-warm-dark` | `#454745` | 三級文字（狀態文字）|
| `--color-wise-bg` | `#f2f4f0` | 頁面背景 |
| `--color-wise-surface` | `#e8ebe6` | hover 底色、縮圖佔位 |
| `--color-wise-mint` | `#e2f6d5` | 進行中 badge 底色 |
| `--color-wise-card` | `#ffffff` | 卡片底色 |

---

## 2. 頁面結構

```
TeamProject
└── ProjectListContent
    ├── [A] 頁面 Header Banner（萊姆綠橫幅）
    ├── [B] Toolbar（建立按鈕 + 排序 + 視圖切換）
    ├── [C] 卡片 Grid（card view）
    ├── [D] 表格列表（list view）
    └── [E] 空狀態（empty state）
```

---

## 3. 各區塊設計規格

### [A] 頁面 Header Banner

- **背景：** `--color-wise-green`（`#9fe870`）
- **Padding：** `28px 36px 22px`
- **內容：**
  - breadcrumb：`font-size: 11px`、`--color-wise-dark-green` 60% 透明度、大寫、`letter-spacing: 0.8px`；文字「團隊」
  - 團隊名稱（`teamName` prop）：`font-size: 26px`、`font-weight: 700`、`--color-wise-dark-green`
  - 副標題（專案數量）：`font-size: 13px`、`--color-wise-dark-green` 60% 透明度
- **不包含**建立按鈕（建立按鈕移到 Toolbar）

### [B] Toolbar

- **背景：** `--color-wise-bg`（`#f2f4f0`）
- **Padding：** `12px 36px`
- **底部邊框：** `1px solid` `#e2e4e0`
- **左側：**
  - `建立新專案` 按鈕：`background: --color-wise-dark-green`、`color: --color-wise-green`、`border-radius: 24px`、`padding: 8px 18px`、`font-size: 13px font-weight: 600`
  - 排序下拉（`compDropDown`）：白色底、`border-radius: 8px`
- **右側：** 卡片 / 列表切換（`compListCardSwitch`）

> `建立新專案` 按鈕從 `TeamProject.vue` slot 傳入，位置改為 Toolbar，而非原本 header 右側

### [C] 卡片 Grid

**Grid：** `repeat(4, 1fr)`，`gap: 16px`（最少一行 4 欄，不隨視窗縮減）

**卡片結構（上到下）：**

```
┌─────────────────────────────┐
│  [圖片區 / 長條圖區] 148px  │ ← hover 時切換
│  ★（收藏）       右上角    │
│  協作者頭像 + 人數  左下角  │
├─────────────────────────────┤
│  專案名稱（粗體，14px）      │
│  狀態 badge    ‧‧‧ 更多選項  │
│  最後編輯時間                │
└─────────────────────────────┘
```

**卡片樣式：**
- `background: --color-wise-card`（白色）
- `border-radius: 14px`
- `box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)`
- `overflow: hidden`

**圖片區（預設）：**
- `height: 148px`，`object-fit: cover`
- 底部漸層 overlay：`linear-gradient(to top, rgba(0,0,0,0.38) 0%, transparent 55%)`
- ★ 收藏：右上角，active 時 `--color-wise-green`，inactive 時白色半透明
- 協作者頭像 group：左下角疊排，`24px` 圓形，`2px white border`，最多顯示 3 個
- 人數文字：`11px`，白色 90% 透明度

**長條圖區（hover 顯示）：**
- `height: 148px`，`background: #f8faf6`（極淺綠）
- 標題：`近一週使用次數`，`11px`，`--color-wise-gray`
- 長條：`border-radius: 4px 4px 0 0`，底色 `--color-wise-green`
  - 最高值長條改用 `--color-wise-dark-green`（深綠）作為視覺強調
  - 最低值長條用 `#c8f5a0`（淡綠）
- 底部顯示：`近一週共 N 次`，`11px`，`--color-wise-dark-green`，`font-weight: 600`

**Hover 動畫：**
- `transform: translateY(-4px)`
- `box-shadow: 0 10px 28px rgba(0,0,0,0.11), 0 2px 8px rgba(0,0,0,0.06)`
- `transition: transform 0.18s ease, box-shadow 0.18s ease`
- hover 時：`.card-img { display: none }`、`.card-chart { display: flex }`

**卡片 footer：**
- `padding: 12px 14px 14px`
- 專案名稱：`14px`，`font-weight: 700`，`--color-wise-black`，`line-height: 1.35`
- 狀態 badge + 時間左側，`⋯` 按鈕右側

**狀態 badge 配色：**

| 狀態 | 背景 | 文字 |
|---|---|---|
| `active`（進行中） | `--color-wise-mint`（`#e2f6d5`） | `--color-wise-dark-green`（`#163300`） |
| `review`（審核中） | `--color-wise-badge-hot-bg`（`#faeeda`） | `--color-wise-badge-hot-text`（`#854f0b`） |
| `done`（已完成） | `--color-wise-surface`（`#e8ebe6`） | `--color-wise-warm-dark`（`#454745`） |
| `pending`（待開始） | `#f0f0ef` | `--color-wise-gray`（`#868685`） |

### [D] 表格列表（list view）

- **容器：** `background: white`、`border-radius: 12px`、`box-shadow: 0 1px 3px rgba(0,0,0,0.06)`、`overflow: hidden`
- **表頭：** `background: #f8f9f7`、`border-bottom: 1px solid --color-wise-surface`、`font-size: 11px`、`font-weight: 700`、大寫、`--color-wise-gray`
- **Row 分隔：** `border-bottom: 1px solid --color-wise-bg`（最後一 row 無）
- **Row hover：** `background: #f8f9f7`
- **專案名稱欄：** `36px × 36px` 縮圖（`border-radius: 8px`）+ 粗體名稱
- **owner 頭像：** `28px` 圓形，顏色複用 `avatarColor()` 函式

### [E] 空狀態

- `border: 2px dashed #d3d4d0`，`border-radius: 16px`
- `max-width: 360px`，置中，`padding: 56px 40px`
- Hover：`border-color: --color-wise-green`、`background: rgba(159,232,112,0.05)`
- 圖示：`54px` 圓形，`background: --color-wise-mint`，`+` icon
- 標題：`font-size: 15px`，`font-weight: 700`，`--color-wise-black`
- 副標：`font-size: 13px`，`--color-wise-gray`

---

## 4. 改動檔案清單

| 檔案 | 類型 | 說明 |
|---|---|---|
| `src/components/ProjectListContent/ProjectListContent.vue` | 修改 | 調整卡片 template 結構（圖片區 / 長條圖區分離、footer 重排）；header 移除建立按鈕、改放 toolbar |
| `src/scss/components/_ProjectListContent.scss` | 新增 | 全新 Wise 樣式，含 banner、toolbar、card、table、empty state |
| `src/scss/components/_index.scss` | 修改 | `@forward` 新增的 `_ProjectListContent.scss` |
| `src/views/TeamProject.vue` | 修改 | slot 傳入建立按鈕的位置調整（配合 toolbar） |

**不動：**
- `AppMenuTree.vue` 及其 SCSS
- 所有 props / emits / Pinia store
- `compListCardSwitch`、`compDropDown`、`compTabs` 等子元件
- 路由設定

---

## 5. 邊界條件

- **mode === 'recent' 下的 team-name-box**：維持原邏輯，只更新 badge 樣式
- **協作者超過 3 人**：顯示前 3 個頭像，後面跟 `N 人` 文字（現有邏輯不變）
- **專案名稱過長**：兩行後截斷（`-webkit-line-clamp: 2`）
- **長條圖最高值**：`barHeight()` 函式不動，CSS 只套 Wise 配色

---

## 6. 不在範圍內

- 深色模式（dark mode）適配
- RWD / 手機斷點調整
- AppMenuTree 樣式更動
- 任何 API 或資料結構異動
