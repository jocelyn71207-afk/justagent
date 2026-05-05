# Spec: QA 知識條目詳情頁題卡檢視

**日期：** 2026-04-20
**狀態：** 已審核

---

## 背景與目標

知識條目目前支援兩種內容格式：
- **QA 格式**：由 Wizard 生成的問答題卡，以 `Q1. ... / A1. ...` 多行文字儲存於 `content` 欄位
- **DOCUMENT 格式**：一般 markdown 文件、或 table 型內容

詳情頁（KnowledgeDetail.vue）目前一律以 `markdown-it` 渲染 `content` 為 HTML。對 QA 格式而言，這會顯示成條列式的 `Q1.` 文字，缺乏題卡的視覺結構。

**目標：** 當知識條目為 QA 類型時，詳情頁改以題卡方式呈現內容，並提供「原文」Tab 作為 fallback。

---

## 資料模型變更

### KnowledgeVersion — 新增 `contentType`

```ts
export interface KnowledgeVersion {
  // ... 現有欄位 ...
  contentType?: 'QA' | 'DOCUMENT'  // 新增；未設定時視為 'DOCUMENT'
}
```

- `'QA'`：內容由 Wizard 以非 table 模板生成，格式為 Q/A 多行文字
- `'DOCUMENT'`：一般 markdown 文件或 table 型內容（預設值）
- 舊有資料（無此欄位）退化為 `'DOCUMENT'` 行為，不影響現有條目

---

## QA 內容格式

Wizard `contentToString` 目前輸出格式：

```
Q1. 問題文字
A1. 答案文字

Q2. 問題文字
A2. 答案文字
```

每個 QA 對由空行分隔，Q/A 各佔一行，行首為 `Q{n}.` 或 `A{n}.`。

---

## 解析函式

新增純函式（可放在 `src/utils/parseQaContent.ts`）：

```ts
interface FlashcardItem { q: string; a: string }

export function parseQaContent(content: string): FlashcardItem[] {
  const blocks = content.split(/\n{2,}/)
  const cards: FlashcardItem[] = []

  for (const block of blocks) {
    const lines = block.trim().split('\n')
    const qLine = lines.find(l => /^Q\d+\.\s/.test(l))
    const aLine = lines.find(l => /^A\d+\.\s/.test(l))
    if (qLine && aLine) {
      cards.push({
        q: qLine.replace(/^Q\d+\.\s*/, '').trim(),
        a: aLine.replace(/^A\d+\.\s*/, '').trim(),
      })
    }
  }

  return cards
}
```

- 容錯：跳過無法解析的 block，不拋錯
- 輸入為空或無法解析時回傳空陣列

---

## KnowledgeDetail.vue 改動

### Tab 切換 UI

當 `versionToShow.contentType === 'QA'` 時，在 `.article-body` 上方插入 Tab 列：

```html
<div class="content-tabs" v-if="isQaType">
  <button class="content-tab" :class="{ active: activeTab === 'flashcard' }" @click="activeTab = 'flashcard'">
    🃏 題卡檢視
  </button>
  <button class="content-tab" :class="{ active: activeTab === 'raw' }" @click="activeTab = 'raw'">
    📄 原文
  </button>
</div>
```

- `activeTab` 預設為 `'flashcard'`
- 非 QA 類型：不顯示 Tab，直接渲染 markdown（現有行為不變）

### 內容區切換

```html
<!-- QA 題卡視圖 -->
<KnowledgeFlashcardPreview
  v-if="isQaType && activeTab === 'flashcard'"
  :cards="parsedCards"
/>

<!-- markdown 原文（QA 原文 Tab 或非 QA 類型） -->
<div
  v-else
  class="markdown-body"
  v-html="renderedContent"
/>
```

### Script 新增邏輯

```ts
import { parseQaContent } from '@/utils/parseQaContent'
import KnowledgeFlashcardPreview from '@/components/Knowledge/KnowledgeFlashcardPreview.vue'

const activeTab = ref<'flashcard' | 'raw'>('flashcard')

const isQaType = computed(() =>
  versionToShow.value?.contentType === 'QA'
)

const parsedCards = computed(() =>
  isQaType.value ? parseQaContent(versionToShow.value?.content ?? '') : []
)
```

- `activeTab` 隨 `versionToShow` 變動時重置為 `'flashcard'`（watch versionToShow）

---

## Wizard 更新（CreateKnowledgeWizardModal.vue）

`handleConfirm` emit 的資料加上 `contentType`：

```ts
emit('confirm', {
  template: selectedTemplate.value,
  content: contentToString(generatedContent.value),
  category: selectedCategory.value,
  contentType: isTablePreview.value ? 'DOCUMENT' : 'QA',  // 新增
})
```

`ResourceLibrary.vue` 的 `handleWizardConfirm` 呼叫 `knowledgeStore.createFromFile()`，需將 `contentType` 一起傳入。`createFromFile` 的 params 型別同步新增 `contentType`，並寫入版本物件。

---

## SCSS

新增 `.content-tabs` 樣式，放入 `src/scss/views/_Knowledge.scss`：

```scss
.content-tabs {
  display: flex;
  border-bottom: 2px solid var(--border-color);
  margin-bottom: 20px;

  .content-tab {
    padding: 8px 18px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
    border: none;
    background: none;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition: color .15s, border-color .15s;

    &.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
      font-weight: 600;
    }

    &:hover:not(.active) {
      color: var(--text-primary);
    }
  }
}
```

---

## 影響範圍

| 檔案 | 異動類型 |
|------|----------|
| `src/stores/knowledgeStore.ts` | 介面新增 `contentType` 欄位 |
| `src/utils/parseQaContent.ts` | 新增檔案（解析函式） |
| `src/views/KnowledgeDetail.vue` | 新增 Tab UI + 條件渲染邏輯 |
| `src/components/Knowledge/CreateKnowledgeWizardModal.vue` | emit 時帶上 `contentType` |
| `src/views/ResourceLibrary.vue` | `handleWizardConfirm` 傳遞 `contentType` |
| `src/stores/knowledgeStore.ts` (createFromFile) | params 新增 `contentType`，寫入版本 |
| `src/scss/views/_Knowledge.scss` | 新增 `.content-tabs` 樣式 |

## 不在範圍內

- KnowledgeEditor.vue 編輯方式不變（維持 markdown textarea）
- 不新增翻牌互動動畫（保持簡單的 grid 卡片）
- 不對現有 mock 資料補 `contentType`（舊資料 fallback 為 DOCUMENT）
