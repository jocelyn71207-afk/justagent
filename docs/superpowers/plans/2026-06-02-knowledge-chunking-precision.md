# Knowledge Chunking Precision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓知識庫的分類和標籤真正影響 AI pipeline，透過 category-aware chunking、metadata prefix injection、search-time filter 三層提升拆解與檢索精準度。

**Architecture:** 在 `knowledgeStore.ts` 新增可獨立測試的純函式（`getChunkingConfig`、`buildChunkContent`、`getVisionPrompt`、`processImage`），並在 `CreateKnowledgeWizardModal.vue` 的 `generateStructuredContent` 和 `simulateFileAiGeneration` 中使用這些函式。Phase 3 的 vectorSearch 為 mock，待後端接入時替換。

**Tech Stack:** Vue 3 + TypeScript + Pinia（knowledgeStore）、Vitest（單元測試）

---

## File Structure

| File | Role |
|------|------|
| `src/stores/knowledgeStore.ts` | 新增 `ChunkingConfig` interface、`getChunkingConfig()`、`buildChunkContent()`、`getVisionPrompt()`、`processImage()`；擴充 `ChunkPreview` + `ChunkMetadata`；新增 `vectorSearch()` mock |
| `src/components/Knowledge/CreateKnowledgeWizardModal.vue` | 更新 `generateStructuredContent()` 接受 category/tags；更新 `simulateFileAiGeneration()` 傳入 category/tags 並處理圖片路徑 |
| `src/stores/__tests__/knowledgeStore.chunking.test.ts` | 所有新增純函式的單元測試（新建）|

---

## Phase 1：Category-Aware Chunking

### Task 1：`getChunkingConfig()` — TDD

**Files:**
- Modify: `src/stores/knowledgeStore.ts`（在 `ChunkPreview` interface 之前加入）
- Create: `src/stores/__tests__/knowledgeStore.chunking.test.ts`

- [ ] **Step 1：建立測試檔，寫 failing tests**

建立 `src/stores/__tests__/knowledgeStore.chunking.test.ts`：

```typescript
import { describe, it, expect } from 'vitest'
import { getChunkingConfig } from '@/stores/knowledgeStore'

describe('getChunkingConfig', () => {
  it('returns correct config for 商品文件', () => {
    const config = getChunkingConfig('商品文件')
    expect(config.chunkSize).toBe(200)
    expect(config.overlap).toBe(20)
    expect(config.contextPrefix).toBe('[商品]')
  })

  it('returns correct config for 客服知識', () => {
    const config = getChunkingConfig('客服知識')
    expect(config.chunkSize).toBe(300)
    expect(config.overlap).toBe(50)
    expect(config.contextPrefix).toBe('[客服]')
  })

  it('returns correct config for 規則說明', () => {
    const config = getChunkingConfig('規則說明')
    expect(config.chunkSize).toBe(500)
    expect(config.overlap).toBe(100)
    expect(config.contextPrefix).toBe('[規則]')
  })

  it('returns correct config for 系統文件', () => {
    const config = getChunkingConfig('系統文件')
    expect(config.chunkSize).toBe(400)
    expect(config.overlap).toBe(80)
    expect(config.contextPrefix).toBe('[系統]')
  })

  it('returns default config for unknown category', () => {
    const config = getChunkingConfig('未知分類')
    expect(config.chunkSize).toBe(300)
    expect(config.overlap).toBe(50)
    expect(config.contextPrefix).toBe('')
  })
})
```

- [ ] **Step 2：確認測試失敗**

```bash
npm run test:unit -- knowledgeStore.chunking
```

Expected：FAIL — "getChunkingConfig is not a function" 或 import error

- [ ] **Step 3：在 `knowledgeStore.ts` 加入 interface 和函式**

在 `ChunkPreview` interface（目前第 66 行）之前插入：

```typescript
export interface ChunkingConfig {
  chunkSize: number
  overlap: number
  contextPrefix: string
}

export function getChunkingConfig(category: string): ChunkingConfig {
  const configs: Record<string, ChunkingConfig> = {
    '商品文件': { chunkSize: 200, overlap: 20, contextPrefix: '[商品]' },
    '客服知識': { chunkSize: 300, overlap: 50, contextPrefix: '[客服]' },
    '規則說明': { chunkSize: 500, overlap: 100, contextPrefix: '[規則]' },
    '系統文件': { chunkSize: 400, overlap: 80, contextPrefix: '[系統]' },
  }
  return configs[category] ?? { chunkSize: 300, overlap: 50, contextPrefix: '' }
}
```

- [ ] **Step 4：確認測試通過**

```bash
npm run test:unit -- knowledgeStore.chunking
```

Expected：PASS（5 tests）

- [ ] **Step 5：Commit**

```bash
git add src/stores/knowledgeStore.ts src/stores/__tests__/knowledgeStore.chunking.test.ts
git commit -m "feat: add getChunkingConfig() with per-category chunk size and prefix"
```

---

### Task 2：`buildChunkContent()` — TDD

**Files:**
- Modify: `src/stores/knowledgeStore.ts`（在 `getChunkingConfig` 之後）
- Modify: `src/stores/__tests__/knowledgeStore.chunking.test.ts`（追加測試）

- [ ] **Step 1：追加 failing tests 到測試檔**

在 `knowledgeStore.chunking.test.ts` 底部加入：

```typescript
import { buildChunkContent } from '@/stores/knowledgeStore'

describe('buildChunkContent', () => {
  it('prepends category, tags and sourceType prefix', () => {
    const result = buildChunkContent('退款需要三個工作天', {
      category: '客服知識',
      tags: ['退款', '流程'],
      sourceType: 'text',
    })
    expect(result).toBe('[分類:客服知識][標籤:退款,流程][來源:text] 退款需要三個工作天')
  })

  it('omits tags section when tags array is empty', () => {
    const result = buildChunkContent('商品說明文字', {
      category: '商品文件',
      tags: [],
      sourceType: 'text',
    })
    expect(result).toBe('[分類:商品文件][來源:text] 商品說明文字')
  })

  it('marks image-derived chunks with image sourceType', () => {
    const result = buildChunkContent('黑色無線耳機，頭戴式設計', {
      category: '商品文件',
      tags: ['3C'],
      sourceType: 'image',
    })
    expect(result).toBe('[分類:商品文件][標籤:3C][來源:image] 黑色無線耳機，頭戴式設計')
  })
})
```

- [ ] **Step 2：確認新增的測試失敗**

```bash
npm run test:unit -- knowledgeStore.chunking
```

Expected：3 new FAIL，5 existing PASS

- [ ] **Step 3：在 `knowledgeStore.ts` 加入 `buildChunkContent`**

在 `getChunkingConfig` 函式之後加入：

```typescript
export function buildChunkContent(
  chunk: string,
  meta: { category: string; tags: string[]; sourceType: 'text' | 'image' },
): string {
  const tagsStr = meta.tags.length > 0 ? `[標籤:${meta.tags.join(',')}]` : ''
  return `[分類:${meta.category}]${tagsStr}[來源:${meta.sourceType}] ${chunk}`
}
```

- [ ] **Step 4：確認全部測試通過**

```bash
npm run test:unit -- knowledgeStore.chunking
```

Expected：PASS（8 tests）

- [ ] **Step 5：Commit**

```bash
git add src/stores/knowledgeStore.ts src/stores/__tests__/knowledgeStore.chunking.test.ts
git commit -m "feat: add buildChunkContent() for metadata prefix injection"
```

---

### Task 3：`getVisionPrompt()` + `processImage()` stubs — TDD

**Files:**
- Modify: `src/stores/knowledgeStore.ts`
- Modify: `src/stores/__tests__/knowledgeStore.chunking.test.ts`

- [ ] **Step 1：追加 failing tests**

在 `knowledgeStore.chunking.test.ts` 底部加入：

```typescript
import { getVisionPrompt, processImage } from '@/stores/knowledgeStore'

describe('getVisionPrompt', () => {
  it('returns product-focused prompt for 商品文件', () => {
    const prompt = getVisionPrompt('商品文件')
    expect(prompt).toContain('外觀')
    expect(prompt).toContain('顏色')
  })

  it('returns UI-focused prompt for 系統文件', () => {
    const prompt = getVisionPrompt('系統文件')
    expect(prompt).toContain('UI')
    expect(prompt).toContain('操作步驟')
  })

  it('returns rule-focused prompt for 規則說明', () => {
    const prompt = getVisionPrompt('規則說明')
    expect(prompt).toContain('條款')
  })

  it('returns service-focused prompt for 客服知識', () => {
    const prompt = getVisionPrompt('客服知識')
    expect(prompt).toContain('流程')
  })

  it('returns fallback prompt for unknown category', () => {
    const prompt = getVisionPrompt('未知')
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(0)
  })
})

describe('processImage', () => {
  it('returns vision method with non-empty text', async () => {
    const mockFile = new File([''], 'product.jpg', { type: 'image/jpeg' })
    const result = await processImage(mockFile, '商品文件')
    expect(result.method).toBe('vision')
    expect(typeof result.text).toBe('string')
    expect(result.text.length).toBeGreaterThan(0)
  })

  it('includes category name in mock description', async () => {
    const mockFile = new File([''], 'manual.jpg', { type: 'image/jpeg' })
    const result = await processImage(mockFile, '系統文件')
    expect(result.text).toContain('系統文件')
  })
})
```

- [ ] **Step 2：確認新增的測試失敗**

```bash
npm run test:unit -- knowledgeStore.chunking
```

Expected：7 new FAIL，8 existing PASS

- [ ] **Step 3：在 `knowledgeStore.ts` 加入兩個函式**

在 `buildChunkContent` 之後加入：

```typescript
export function getVisionPrompt(category: string): string {
  const prompts: Record<string, string> = {
    '商品文件': '請詳細描述圖片中商品的外觀、顏色、材質、尺寸和特徵。',
    '系統文件': '請描述圖片中的 UI 元件、操作步驟和按鈕文字。',
    '規則說明': '請識別並列出圖片中的條款文字和章節標題。',
    '客服知識': '請說明圖片中圖示的意義、流程說明和狀態標記。',
  }
  return prompts[category] ?? '請描述這張圖片的主要內容。'
}

// Mock implementation — replace with real OCR/Vision API when backend is ready.
// OCR threshold: if extracted text ≥ 100 chars, use text path instead of vision path.
export async function processImage(
  _file: File,
  category: string,
): Promise<{ method: 'ocr' | 'vision'; text: string }> {
  return {
    method: 'vision',
    text: `[AI 視覺描述 - ${category}] ${getVisionPrompt(category).slice(0, 20)}... (mock)`,
  }
}
```

- [ ] **Step 4：確認全部測試通過**

```bash
npm run test:unit -- knowledgeStore.chunking
```

Expected：PASS（15 tests）

- [ ] **Step 5：Commit**

```bash
git add src/stores/knowledgeStore.ts src/stores/__tests__/knowledgeStore.chunking.test.ts
git commit -m "feat: add getVisionPrompt() and processImage() stubs for image chunking"
```

---

### Task 4：擴充 `ChunkPreview`，加入 `sourceType`

**Files:**
- Modify: `src/stores/knowledgeStore.ts`

- [ ] **Step 1：更新 `ChunkPreview` interface**

找到第 66-70 行的 `ChunkPreview` interface，改為：

```typescript
export interface ChunkPreview {
  index: number
  content: string
  tokenCount: number
  sourceType: 'text' | 'image'
}
```

- [ ] **Step 2：更新 `knowledgeStore.ts` 中所有 mock 資料的 chunks**

在 `knowledgeStore.ts` 的 mock 初始資料中，所有 `chunks` 陣列裡的每個物件都需要加上 `sourceType: 'text'`。

用全域搜尋找到所有 `{ index:`, `{ index: ` 的 chunk 物件（在 mock data 區域），逐一加入 `sourceType: 'text'`。

例如：
```typescript
// 改前
{ index: 0, content: '...', tokenCount: 120 }
// 改後
{ index: 0, content: '...', tokenCount: 120, sourceType: 'text' }
```

- [ ] **Step 3：執行 type-check 確認沒有 TypeScript 錯誤**

```bash
npm run type-check
```

Expected：無錯誤

- [ ] **Step 4：執行全部測試確認沒有破壞現有功能**

```bash
npm run test:unit
```

Expected：全部 PASS

- [ ] **Step 5：Commit**

```bash
git add src/stores/knowledgeStore.ts
git commit -m "feat: add sourceType field to ChunkPreview interface"
```

---

### Task 5：更新 `generateStructuredContent()` 使用 category/tags

**Files:**
- Modify: `src/components/Knowledge/CreateKnowledgeWizardModal.vue`

- [ ] **Step 1：在 wizard modal 頂部加入 import**

在 `CreateKnowledgeWizardModal.vue` 的 `<script setup>` 區塊，找到現有的 knowledgeStore import 並加入新函式和型別：

```typescript
import { useKnowledgeStore, getChunkingConfig, buildChunkContent, type ChunkPreview } from '@/stores/knowledgeStore'
```

- [ ] **Step 2：更新 `generateStructuredContent` 函式簽名**

找到第 391 行附近的函式定義，改為接受 `category` 和 `tags` 參數：

```typescript
function generateStructuredContent(
  baseName: string,
  ext: string,
  category: string,
  tags: string[],
): { content: string; chunks: ChunkPreview[] } {
```

同時在函式開頭取得 chunking config：

```typescript
  const config = getChunkingConfig(category)
```

- [ ] **Step 3：更新各分支的 chunk 生成，套用 `config.chunkSize` 和 `buildChunkContent`**

在 `generateStructuredContent` 函式內，所有最終建立 chunk 物件的地方（xlsx/csv 分支、md 分支、txt 分支），改為：

**xlsx/xls/csv 分支**（每列一個 chunk）：
```typescript
chunks.push({
  index: i,
  content: buildChunkContent(rowContent, { category, tags, sourceType: 'text' }),
  tokenCount: config.chunkSize,
  sourceType: 'text',
})
```

**md 和 txt 等文字分支**（段落分割）：
```typescript
// 用 config.chunkSize 作為模擬的 token count
chunks.push({
  index: i,
  content: buildChunkContent(paragraphContent, { category, tags, sourceType: 'text' }),
  tokenCount: config.chunkSize,
  sourceType: 'text',
})
```

- [ ] **Step 4：執行 type-check**

```bash
npm run type-check
```

Expected：無錯誤

- [ ] **Step 5：Commit**

```bash
git add src/components/Knowledge/CreateKnowledgeWizardModal.vue
git commit -m "feat: apply category chunk config and metadata prefix in generateStructuredContent"
```

---

### Task 6：更新 `simulateFileAiGeneration()` 傳入 category/tags + 處理圖片

**Files:**
- Modify: `src/components/Knowledge/CreateKnowledgeWizardModal.vue`

- [ ] **Step 1：在 wizard modal import 加入 `processImage`**

```typescript
import { useKnowledgeStore, getChunkingConfig, buildChunkContent, processImage, type ChunkPreview } from '@/stores/knowledgeStore'
```

- [ ] **Step 2：更新 `simulateFileAiGeneration` 函式**

找到第 465 行的 `simulateFileAiGeneration(id, fileName)` 函式，改為：

```typescript
async function simulateFileAiGeneration(id: string, fileName: string) {
  const store = useKnowledgeStore()
  const item = store.knowledgeList.find(k => k.id === id)
  if (!item) return

  const category = item.category
  const tags = item.versions[0]?.tags ?? []
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  const baseName = fileName.replace(/\.[^/.]+$/, '')

  const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp'])

  store.updatePipelineProgress(id, 'chunking', 0)

  let chunks: ChunkPreview[]
  let content: string

  if (IMAGE_EXTS.has(ext)) {
    // 圖片路徑：processImage stub（未來接 OCR/Vision API）
    await new Promise(r => setTimeout(r, 800))
    store.updatePipelineProgress(id, 'chunking', 33)
    const imageResult = await processImage(new File([], fileName), category)
    const imageChunk: ChunkPreview = {
      index: 0,
      content: buildChunkContent(imageResult.text, { category, tags, sourceType: 'image' }),
      tokenCount: 150,
      sourceType: 'image',
    }
    chunks = [imageChunk]
    content = imageResult.text
  } else {
    // 文字路徑：依副檔名和 category 拆解
    await new Promise(r => setTimeout(r, 800))
    store.updatePipelineProgress(id, 'chunking', 33)
    const result = generateStructuredContent(baseName, ext, category, tags)
    chunks = result.chunks
    content = result.content
  }

  await new Promise(r => setTimeout(r, 1500))
  store.updatePipelineProgress(id, 'embedding', 67)

  await new Promise(r => setTimeout(r, 1000))
  store.updatePipelineProgress(id, 'indexing', 90)

  await new Promise(r => setTimeout(r, 500))
  store.markPipelineDone(id, chunks, content)
}
```

- [ ] **Step 3：執行 type-check**

```bash
npm run type-check
```

Expected：無錯誤

- [ ] **Step 4：執行全部測試**

```bash
npm run test:unit
```

Expected：全部 PASS

- [ ] **Step 5：Commit**

```bash
git add src/components/Knowledge/CreateKnowledgeWizardModal.vue
git commit -m "feat: route image files through processImage in simulateFileAiGeneration"
```

---

## Phase 2：Metadata Prefix 已在 Task 2 + Task 5 完成

Phase 2 的 `buildChunkContent` 已在 Task 2 實作，並在 Task 5 套用於所有 chunk。無額外工作。

---

## Phase 3：Search Metadata Filter（Mock）

### Task 7：`ChunkMetadata` interface + `vectorSearch()` mock

**Files:**
- Modify: `src/stores/knowledgeStore.ts`
- Modify: `src/stores/__tests__/knowledgeStore.chunking.test.ts`

- [ ] **Step 1：追加 vectorSearch 的 failing tests**

在 `knowledgeStore.chunking.test.ts` 底部加入：

```typescript
import { setActivePinia, createPinia } from 'pinia'
import { useKnowledgeStore, vectorSearch } from '@/stores/knowledgeStore'

describe('vectorSearch', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('returns results matching the given category filter', () => {
    const store = useKnowledgeStore()
    // 取 store 中已有的 mock chunks（來自 knowledgeList 的 versions[0].chunks）
    const results = vectorSearch('退款', { category: '客服知識' }, store.knowledgeList)
    results.forEach(r => {
      expect(r.category).toBe('客服知識')
    })
  })

  it('returns all results when no category filter is provided', () => {
    const store = useKnowledgeStore()
    const allResults = vectorSearch('商品', undefined, store.knowledgeList)
    const filteredResults = vectorSearch('商品', { category: '商品文件' }, store.knowledgeList)
    expect(allResults.length).toBeGreaterThanOrEqual(filteredResults.length)
  })
})
```

- [ ] **Step 2：確認新增的測試失敗**

```bash
npm run test:unit -- knowledgeStore.chunking
```

Expected：2 new FAIL

- [ ] **Step 3：加入 `ChunkMetadata` interface 和 `vectorSearch` 函式到 `knowledgeStore.ts`**

在 `ChunkPreview` interface 之後加入：

```typescript
export interface ChunkMetadata {
  itemId: string
  versionId: string
  category: string
  tags: string[]
  sourceType: 'text' | 'image'
  chunkIndex: number
  content: string
}

// Mock implementation of vector search with client-side metadata filter.
// Replace filter logic with vector DB metadata filter API when backend is integrated.
export function vectorSearch(
  _query: string,
  options: { category?: string; tags?: string[] } | undefined,
  knowledgeList: KnowledgeItem[],
): ChunkMetadata[] {
  const results: ChunkMetadata[] = []

  for (const item of knowledgeList) {
    const latestVersion = item.versions[0]
    if (!latestVersion) continue

    for (const chunk of latestVersion.chunks) {
      const meta: ChunkMetadata = {
        itemId: item.id,
        versionId: latestVersion.id,
        category: item.category,
        tags: latestVersion.tags,
        sourceType: chunk.sourceType,
        chunkIndex: chunk.index,
        content: chunk.content,
      }

      if (options?.category && meta.category !== options.category) continue
      if (options?.tags?.length) {
        const hasTag = options.tags.some(t => meta.tags.includes(t))
        if (!hasTag) continue
      }

      results.push(meta)
    }
  }

  return results
}
```

- [ ] **Step 4：確認全部測試通過**

```bash
npm run test:unit -- knowledgeStore.chunking
```

Expected：PASS（所有 tests）

- [ ] **Step 5：執行完整測試套件**

```bash
npm run test:unit
```

Expected：全部 PASS

- [ ] **Step 6：執行 type-check**

```bash
npm run type-check
```

Expected：無錯誤

- [ ] **Step 7：Commit**

```bash
git add src/stores/knowledgeStore.ts src/stores/__tests__/knowledgeStore.chunking.test.ts
git commit -m "feat: add ChunkMetadata interface and vectorSearch() mock with category/tag filter"
```

---

## 驗收確認

實作完成後，手動驗證以下行為：

1. 在 CreateKnowledgeWizardModal 上傳一個 `.txt` 檔，選擇「規則說明」分類，加上標籤「條款」——確認 ChunkPreview 的 content 以 `[分類:規則說明][標籤:條款][來源:text]` 開頭，tokenCount 為 500。
2. 上傳一個 `.jpg` 圖片，選擇「商品文件」——確認 chunk 的 sourceType 為 `'image'`，content 包含 AI 視覺描述前綴。
3. 上傳 `.xlsx`，選擇「商品文件」——確認 tokenCount 為 200，chunk content 有前綴。
