# 知識內容題卡預覽設計文件

**日期**：2026-04-15
**功能模組**：共用檔案管理 → 建立知識內容 → Step 3 預覽

---

## 1. 背景與目標

「建立知識內容」Wizard 的 Step 3 目前以 `<pre>` 純文字呈現 AI 產出的初稿。本次改版將 Step 3 的預覽改為結構化視覺格式：

- **一般檔案（PDF、PPT、Word、Image、TXT、HTML、CHART、OTHER）** → Q&A 格狀題卡（2 欄）
- **表格型檔案（EXCEL、MD）** → HTML 表格

目的是讓使用者在進入編輯器前，能以更直觀的方式預覽 AI 生成的知識結構。

---

## 2. 範圍

| 入口 | 共用檔案管理（ResourceLibrary）→ 更多選項 → 「建立為知識內容」 |
|---|---|
| 影響檔案 | `CreateKnowledgeWizardModal.vue`（修改）、新增 2 個子元件、新增 2 個 SCSS 檔 |
| 不影響 | Step 1（相似性檢查）、Step 2（模板選擇）的邏輯與 UI |

---

## 3. 資料型別

`generatedContent` 從 `string` 改為 union type：

```ts
// 題卡格式（一般檔案）
type FlashcardItem = {
  q: string  // 問題
  a: string  // 答案
}

// 表格格式（EXCEL、MD）
type TableData = {
  headers: string[]
  rows: string[][]
}

type GeneratedContent = FlashcardItem[] | TableData | null
```

---

## 4. 元件架構

```
src/components/Knowledge/
  ├── CreateKnowledgeWizardModal.vue     ← 修改
  ├── KnowledgeFlashcardPreview.vue      ← 新增
  └── KnowledgeTablePreview.vue          ← 新增

src/scss/components/
  ├── _KnowledgeFlashcardPreview.scss    ← 新增
  ├── _KnowledgeTablePreview.scss        ← 新增
  └── _index.scss                        ← @forward 兩個新檔
```

### 4.1 `KnowledgeFlashcardPreview.vue`

**Props：**
```ts
defineProps<{ cards: FlashcardItem[] }>()
```

**UI：**
- 2 欄格狀排列（`display: grid; grid-template-columns: 1fr 1fr; gap: 10px`）
- 最大高度 320px，超出垂直捲動
- 每張題卡：
  - 圓形 Q badge（filled `#3eb5cc`）+ 問題文字（`font-weight: 600`）
  - 分隔線
  - 圓形 A badge（outlined `#3eb5cc`）+ 答案文字
  - hover 時淡色藍邊框 + 陰影

### 4.2 `KnowledgeTablePreview.vue`

**Props：**
```ts
defineProps<{ data: TableData }>()
```

**UI：**
- `<table>` 標準表格，`thead` + `tbody`
- 最大高度 320px，超出垂直捲動
- 沿用專案現有 `.custom-table` 樣式

---

## 5. `CreateKnowledgeWizardModal.vue` 修改點

### 5.1 新增 helper computed

```ts
const TABLE_TYPES = ['EXCEL', 'MD']

const isTablePreview = computed(() =>
  TABLE_TYPES.includes(props.file?.fileType?.toUpperCase() ?? '')
)
```

> CSV 在系統中對應到 `EXCEL` fileType，無需額外處理。

### 5.2 Step 3 預覽區替換

將原本的：
```html
<div class="ai-preview-body">
  <div class="preview-title">{{ previewTitle }}</div>
  <div class="preview-scroll-area">
    <pre class="preview-text">{{ generatedContent }}</pre>
  </div>
</div>
```

改為：
```html
<div class="ai-preview-body" v-if="generatedContent">
  <div class="cards-count" v-if="!isTablePreview">
    共 {{ (generatedContent as FlashcardItem[]).length }} 張題卡
  </div>
  <KnowledgeTablePreview
    v-if="isTablePreview"
    :data="generatedContent as TableData"
  />
  <KnowledgeFlashcardPreview
    v-else
    :cards="generatedContent as FlashcardItem[]"
  />
</div>
```

> `generatedContent` 為 `null`（生成中）時，整個 body 不渲染，由父層現有的 loading 動畫（`isGenerating` 判斷）接管顯示。

### 5.3 `buildContent()` 改為回傳結構化資料

```ts
function buildContent(template: string, fileName: string): GeneratedContent {
  const name = fileName.replace(/\.[^.]+$/, '')
  const fileType = props.file?.fileType?.toUpperCase() ?? ''

  if (TABLE_TYPES.includes(fileType)) {
    return buildTableContent(template, name)  // 回傳 TableData
  }
  return buildFlashcardContent(template, name)  // 回傳 FlashcardItem[]
}
```

每個模板（PRODUCT / SOP / GUIDE / RULE）對應一組 mock Q&A（4–6 題），與檔案類型無關。

### 5.4 型別更新

```ts
const generatedContent = ref<GeneratedContent>(null)
```

---

## 6. Mock 題卡內容（各模板）

| 模板 | 題卡方向 | 題數 |
|---|---|---|
| PRODUCT（商品 / 銷售資料） | 商品規格、定價、庫存政策等 Q&A | 5 |
| SOP（標準流程） | 各步驟的執行要點、異常處理 | 6 |
| GUIDE（操作說明） | 功能入口、操作步驟、常見錯誤 | 5 |
| RULE（規則說明） | 適用範圍、違規處理、例外情況 | 4 |

Mock 表格內容（EXCEL / MD）維持現有格式（headers + 2–3 列示範資料）。

---

## 7. 視覺規格

### 題卡

> 顏色須使用 CSS Custom Properties，不寫死 hex（遵循 CLAUDE.md 規範）。

| 屬性 | CSS 變數 / 值 |
|---|---|
| 背景 | `var(--color-bg-white)` |
| 邊框 | `1px solid var(--color-border-light)`，`border-radius: 8px` |
| hover 邊框 | `var(--color-main-light)` |
| hover 陰影 | `0 2px 10px rgba(var(--color-main-rgb), 0.12)` |
| Q badge | 18×18px 圓形，`background: var(--color-main)`，白字 |
| A badge | 18×18px 圓形，`border: 1.5px solid var(--color-main)`，`color: var(--color-main)` |
| Q 文字 | `font-size: 12px; font-weight: 600; color: var(--color-text-primary)` |
| A 文字 | `font-size: 11.5px; color: var(--color-text-secondary)` |
| 分隔線 | `1px solid var(--color-border-lighter)` |

### 表格

沿用 `.custom-table` 既有樣式，不另訂新規格。

---

## 8. 不在本次範圍內

- 真實 AI API 串接（目前為 mock 假資料）
- 題卡在知識編輯器（KnowledgeEditor）中的渲染
- 使用者在預覽階段直接編輯題卡內容
