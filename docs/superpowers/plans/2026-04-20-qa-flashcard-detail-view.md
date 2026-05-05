# QA 知識條目詳情頁題卡檢視 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 當知識條目的 `contentType` 為 `'QA'` 時，詳情頁內容區改以題卡格 + Tab 切換方式呈現，預設顯示題卡，可切換至原文。

**Architecture:** 在 `KnowledgeVersion` 新增 `contentType` 欄位區分 QA 與一般文件；新增純函式 `parseQaContent` 解析 `Q1./A1.` 格式；`KnowledgeDetail.vue` 根據 `contentType` 決定顯示 Tab 切換器與 `KnowledgeFlashcardPreview` 或原有 markdown 渲染。

**Tech Stack:** Vue 3 Composition API (`<script setup lang="ts">`), Pinia, SCSS (CSS Custom Properties), Vitest

---

## File Map

| 檔案 | 動作 | 職責 |
|------|------|------|
| `src/stores/knowledgeStore.ts` | 修改 | `KnowledgeVersion` interface 加 `contentType`；`createFromFile` params 加 `contentType`；mock 資料 k3 補 QA 格式 |
| `src/utils/parseQaContent.ts` | 新增 | 純函式：將 `Q1./A1.` 字串解析為 `FlashcardItem[]` |
| `src/utils/__tests__/parseQaContent.test.ts` | 新增 | parseQaContent 單元測試 |
| `src/components/Knowledge/CreateKnowledgeWizardModal.vue` | 修改 | emit `confirm` 加上 `contentType` 欄位 |
| `src/views/ResourceLibrary.vue` | 修改 | `handleWizardConfirm` 傳遞 `contentType` 給 `createFromFile` |
| `src/views/KnowledgeDetail.vue` | 修改 | 新增 Tab 切換邏輯、條件渲染 flashcard / markdown |
| `src/scss/views/_KnowledgeBase.scss` | 修改 | 在 `.content-preview` 內加 `.content-tabs` 樣式 |

---

## Task 1: 型別定義 + Mock 資料

**Files:**
- Modify: `src/stores/knowledgeStore.ts`

- [ ] **Step 1: 在 `KnowledgeVersion` interface 新增 `contentType`**

開啟 `src/stores/knowledgeStore.ts`，在 `KnowledgeVersion` interface 的 `updateNote` 欄位後面加入：

```ts
export interface KnowledgeVersion {
  id: string;
  knowledgeId: string;
  versionNumber: string;
  status: 'DRAFT' | 'REVIEWING' | 'PUBLISHED' | 'HISTORY' | 'REJECTED';
  title: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  visibility?: 'ALL' | 'TEAM' | 'MANAGERS';
  lastUpdateBy: string;
  lastUpdateTime: string;
  updateNote: string;
  contentType?: 'QA' | 'DOCUMENT';   // ← 新增這行
  sourceFiles?: SourceFileRef[];
  reviewNote?: string
  reviewedBy?: string
  reviewedTime?: string
  reviewFeedback?: string
  reviewHistory?: ReviewRecord[]
}
```

- [ ] **Step 2: 更新 `createFromFile` params 型別**

找到 `createFromFile` 函式，params 型別加入 `contentType`，並寫入版本物件：

```ts
const createFromFile = (params: {
  fileId: string;
  fileName: string;
  template: string;
  content: string;
  category: string;
  contentType?: 'QA' | 'DOCUMENT';   // ← 新增
}) => {
  // ...（其他程式碼不動）
  versions: [{
    // ...（現有欄位）
    content: params.content,
    category: params.category,
    contentType: params.contentType ?? 'DOCUMENT',   // ← 新增這行（放在 category 後）
    tags: [],
    // ...
  }],
```

- [ ] **Step 3: 更新 mock 資料 k3 成 QA 格式**

找到 id 為 `'k3'` 的 mock 資料（客服 FAQ：退貨流程），更新其唯一 version 的 `content` 與新增 `contentType`：

```ts
{
  id: 'v1.0-draft',
  knowledgeId: 'k3',
  versionNumber: 'v1.0',
  status: 'DRAFT',
  title: '客服 FAQ：退貨流程',
  summary: '草擬退貨 SOP',
  content: 'Q1. 顧客申請退貨的時效限制為何？\nA1. 商品簽收後 7 天內可申請退貨，逾期需附說明並由主管審核。\n\nQ2. 退換貨的標準流程為何？\nA2. 確認購買憑證 → 商品狀態檢查 → 填寫退換貨單 → 退款（原路返還）或換貨。\n\nQ3. 哪些情況商品不接受退換？\nA3. 個人衛生用品、已拆封食品、客製化商品及商品標籤已剪除者不受理退換。\n\nQ4. 退款作業通常需要多久時間？\nA4. 確認收到退回商品後，信用卡退款約 5~7 個工作天；銀行轉帳約 3 個工作天。',
  contentType: 'QA',   // ← 新增
  category: '客服知識',
  tags: ['客服', '退貨'],
  lastUpdateBy: 'Jocelyn',
  lastUpdateTime: '2026-04-01 15:00',
  updateNote: '初始草稿',
},
```

- [ ] **Step 4: Commit**

```bash
git add src/stores/knowledgeStore.ts
git commit -m "feat: add contentType field to KnowledgeVersion and createFromFile"
```

---

## Task 2: parseQaContent 純函式 + 測試

**Files:**
- Create: `src/utils/parseQaContent.ts`
- Create: `src/utils/__tests__/parseQaContent.test.ts`

- [ ] **Step 1: 先寫測試**

建立 `src/utils/__tests__/parseQaContent.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { parseQaContent } from '@/utils/parseQaContent';

describe('parseQaContent', () => {
  it('正常解析兩個 QA 對', () => {
    const content = 'Q1. 問題一\nA1. 答案一\n\nQ2. 問題二\nA2. 答案二';
    expect(parseQaContent(content)).toEqual([
      { q: '問題一', a: '答案一' },
      { q: '問題二', a: '答案二' },
    ]);
  });

  it('空字串回傳空陣列', () => {
    expect(parseQaContent('')).toEqual([]);
  });

  it('格式不符的 block 被跳過', () => {
    const content = '這不是QA格式\n\nQ1. 問題\nA1. 答案';
    expect(parseQaContent(content)).toEqual([{ q: '問題', a: '答案' }]);
  });

  it('去除 Q/A 前綴後的多餘空白', () => {
    const content = 'Q1.   有空白的問題   \nA1.   有空白的答案   ';
    expect(parseQaContent(content)).toEqual([
      { q: '有空白的問題', a: '有空白的答案' },
    ]);
  });

  it('單一 QA 對也能正確解析', () => {
    const content = 'Q1. 唯一的問題\nA1. 唯一的答案';
    expect(parseQaContent(content)).toEqual([
      { q: '唯一的問題', a: '唯一的答案' },
    ]);
  });
});
```

- [ ] **Step 2: 執行測試，確認全部 FAIL**

```bash
npm run test:unit -- src/utils/__tests__/parseQaContent.test.ts
```

預期：5 個測試全部 FAIL，錯誤為 `Cannot find module '@/utils/parseQaContent'`

- [ ] **Step 3: 實作 parseQaContent**

建立 `src/utils/parseQaContent.ts`：

```ts
export interface FlashcardItem {
  q: string
  a: string
}

export function parseQaContent(content: string): FlashcardItem[] {
  if (!content.trim()) return []

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

- [ ] **Step 4: 執行測試，確認全部 PASS**

```bash
npm run test:unit -- src/utils/__tests__/parseQaContent.test.ts
```

預期輸出：
```
✓ 正常解析兩個 QA 對
✓ 空字串回傳空陣列
✓ 格式不符的 block 被跳過
✓ 去除 Q/A 前綴後的多餘空白
✓ 單一 QA 對也能正確解析
```

- [ ] **Step 5: Commit**

```bash
git add src/utils/parseQaContent.ts src/utils/__tests__/parseQaContent.test.ts
git commit -m "feat: add parseQaContent utility with tests"
```

---

## Task 3: Wizard → ResourceLibrary → Store 串接 contentType

**Files:**
- Modify: `src/components/Knowledge/CreateKnowledgeWizardModal.vue`
- Modify: `src/views/ResourceLibrary.vue`

- [ ] **Step 1: 更新 Wizard 的 emit 型別與呼叫**

開啟 `src/components/Knowledge/CreateKnowledgeWizardModal.vue`。

找到 emit 定義（約第 226 行），加入 `contentType`：

```ts
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm', data: { template: string; content: string; category: string; contentType: 'QA' | 'DOCUMENT' }): void;
}>()
```

找到 `handleConfirm` 函式（約第 484 行），更新 emit 呼叫，加入 `contentType`：

```ts
function handleConfirm() {
  emit('confirm', {
    template: selectedTemplateLabel.value,
    content: contentToString(generatedContent.value),
    category: selectedCategory.value,
    contentType: isTablePreview.value ? 'DOCUMENT' : 'QA',  // ← 新增
  });
  emit('update:modelValue', false);
}
```

- [ ] **Step 2: 更新 ResourceLibrary.vue 的 handleWizardConfirm**

開啟 `src/views/ResourceLibrary.vue`，找到 `handleWizardConfirm` 函式（約第 344 行），更新參數型別與 `createFromFile` 呼叫：

```ts
function handleWizardConfirm(data: { template: string; content: string; category: string; contentType: 'QA' | 'DOCUMENT' }) {
  if (!wizardFile.value) return;
  const { knowledgeId, versionId } = knowledgeStore.createFromFile({
    fileId: wizardFile.value.id,
    fileName: wizardFile.value.fileName,
    template: data.template,
    content: data.content,
    category: data.category,
    contentType: data.contentType,   // ← 新增
  });
  router.push({ name: 'KnowledgeEditor', params: { knowledgeId, versionId } });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Knowledge/CreateKnowledgeWizardModal.vue src/views/ResourceLibrary.vue
git commit -m "feat: wire contentType through wizard emit and createFromFile"
```

---

## Task 4: KnowledgeDetail.vue — Tab UI + 條件渲染

**Files:**
- Modify: `src/views/KnowledgeDetail.vue`

- [ ] **Step 1: 更新 script — import + 新增 computed/ref**

在 `<script setup lang="ts">` 區塊加入：

```ts
import { parseQaContent, type FlashcardItem } from '@/utils/parseQaContent'
import KnowledgeFlashcardPreview from '@/components/Knowledge/KnowledgeFlashcardPreview.vue'
```

在現有 `ref` 宣告區（`isHistoryOpen` 等附近）加入：

```ts
const activeTab = ref<'flashcard' | 'raw'>('flashcard')
```

在現有 `computed` 區（`renderedContent` 下方）加入：

```ts
const isQaType = computed(() => versionToShow.value?.contentType === 'QA')

const parsedCards = computed<FlashcardItem[]>(() =>
  isQaType.value ? parseQaContent(versionToShow.value?.content ?? '') : []
)
```

在現有 `watch(versionToShow, ...)` 內加入 `activeTab` 重置，讓切換版本時回到題卡模式：

```ts
watch(versionToShow, (val) => {
  if (val?.title) setDynamic(val.title)
  activeTab.value = 'flashcard'   // ← 新增這行
}, { immediate: true })
```

- [ ] **Step 2: 更新 template — 內容預覽區**

找到 `<!-- 內容預覽區域 -->` 的 `<div class="content-preview">` 區塊（約第 97-148 行）。

將 `<div class="article-body">...</div>` 這段（原本是單純 markdown 渲染）替換為以下完整結構：

```html
<!-- Tab 切換器：僅 QA 類型顯示 -->
<div class="content-tabs" v-if="isQaType">
  <button
    class="content-tab"
    :class="{ active: activeTab === 'flashcard' }"
    @click="activeTab = 'flashcard'"
  >
    <i class="material-symbols-outlined">style</i>
    題卡檢視
  </button>
  <button
    class="content-tab"
    :class="{ active: activeTab === 'raw' }"
    @click="activeTab = 'raw'"
  >
    <i class="material-symbols-outlined">article</i>
    原文
  </button>
</div>

<!-- 題卡視圖 -->
<KnowledgeFlashcardPreview
  v-if="isQaType && activeTab === 'flashcard'"
  :cards="parsedCards"
/>

<!-- Markdown 原文視圖（QA 切換到原文，或非 QA 類型） -->
<div class="article-body" v-else>
  <div class="markdown-body" v-html="renderedContent"></div>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/views/KnowledgeDetail.vue
git commit -m "feat: add QA tab switcher and flashcard rendering in KnowledgeDetail"
```

---

## Task 5: SCSS — content-tabs 樣式

**Files:**
- Modify: `src/scss/views/_KnowledgeBase.scss`

- [ ] **Step 1: 在 `.content-preview` 內加入 `.content-tabs`**

開啟 `src/scss/views/_KnowledgeBase.scss`，找到 `.content-preview` 區塊（約第 1545 行）。在 `.article-body { ... }` 的 `}` 後面、`.content-preview` 的 `}` 關閉前插入：

```scss
.content-tabs {
  display: flex;
  border-bottom: 2px solid var(--color-border-1-alpha50);
  margin-bottom: 24px;

  .content-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 18px;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-secondary);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;

    .material-symbols-outlined {
      font-size: 16px;
    }

    &.active {
      color: var(--color-main);
      border-bottom-color: var(--color-main);
      font-weight: 600;
    }

    &:hover:not(.active) {
      color: var(--color-text);
    }
  }
}
```

- [ ] **Step 2: 確認 `.KnowledgeFlashcardPreview` 樣式作用域**

`.KnowledgeFlashcardPreview` 的樣式在 `_KnowledgeBase.scss` 約第 430 行，包在 `.KnowledgeBase { }` 內。`KnowledgeDetail.vue` 根元素有 `class="KnowledgeBase KnowledgeDetail"`，因此樣式自動套用，無需額外修改。確認一下即可：

```bash
grep -n "KnowledgeFlashcardPreview" src/scss/views/_KnowledgeBase.scss
```

預期：顯示約第 430 行，說明樣式已在作用域內。

- [ ] **Step 3: Commit**

```bash
git add src/scss/views/_KnowledgeBase.scss
git commit -m "feat: add content-tabs styles for QA detail view"
```

---

## Task 6: 整合驗收

- [ ] **Step 1: 執行全部單元測試**

```bash
npm run test:unit
```

預期：所有測試 PASS（含新增的 parseQaContent 測試）

- [ ] **Step 2: 啟動 dev server 手動驗證**

```bash
npm run dev
```

1. 進入「資源庫」→ 選擇一個非 Excel/MD 檔案 → 「建立為知識內容」→ 走完 Wizard
2. 進入 KnowledgeBase，找到 k3「客服 FAQ：退貨流程」→ 點進詳情頁
3. 確認：
   - 內容區顯示「題卡檢視 / 原文」兩個 Tab
   - 預設顯示 4 張題卡（Q/A 格式）
   - 點「原文」Tab 後切換為 markdown 文字渲染
   - 點回「題卡檢視」Tab 正常切換回來
4. 進入 k1「2025產品總表-Q3」詳情頁（非 QA 類型）
5. 確認：**不顯示** Tab 切換器，直接顯示 markdown 渲染（現有行為不變）

- [ ] **Step 3: 最終 commit**

```bash
git add .
git commit -m "feat: QA knowledge detail flashcard view complete"
```
