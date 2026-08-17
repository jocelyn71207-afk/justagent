# Notion 整合（通用整合框架）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立通用整合框架（IntegrationSource），以 Notion Database 同步為第一個實作，讓使用者可從 DataSourceTab 連接 Notion 並自動將每個 Database row 同步為知識條目草稿。

**Architecture:** 新建 `integrationStore.ts` 管理整合來源 CRUD 與同步邏輯；修改 `knowledgeStore.ts` 新增兩個 fields 和兩個 actions；建立 `IntegrationConnectWizard.vue`（通用 shell）+ `NotionConnectSteps.vue`（Notion 專屬步驟）；修改 `DataSourceTab.vue` 新增「整合平台」分頁。

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Pinia, Vitest, SCSS global（不用 scoped）

---

## 檔案結構

| 操作 | 路徑 | 說明 |
|------|------|------|
| Create | `src/stores/integrationStore.ts` | IntegrationSource types、CRUD、triggerSync、syncNotion mock |
| Create | `src/stores/__tests__/integrationStore.test.ts` | integrationStore 單元測試 |
| Modify | `src/stores/knowledgeStore.ts` | 新增 SourceType `'NOTION'`、KnowledgeItem 兩個欄位、兩個 actions |
| Create | `src/components/Knowledge/NotionConnectSteps.vue` | Step 2-4：連線驗證、欄位對應、同步設定 |
| Create | `src/components/Knowledge/IntegrationConnectWizard.vue` | Wizard shell：Step 1 選平台 + 載入 NotionConnectSteps |
| Modify | `src/components/Knowledge/DataSourceTab.vue` | 新增「整合平台」tab，顯示 integrationSources 卡片 |

---

## Task 1：integrationStore — Types + Mock 資料

**Files:**
- Create: `src/stores/integrationStore.ts`

- [ ] **Step 1：建立檔案，定義所有 types 和 mock 初始資料**

```typescript
// src/stores/integrationStore.ts
import { ref } from 'vue'
import { defineStore } from 'pinia'

export type IntegrationType = 'NOTION' | 'GOOGLE_DRIVE' | 'SLACK'

export interface NotionConfig {
  apiKey: string
  databaseId: string
  titleProp: string
  categoryProp?: string
  tagsProp?: string
  includePageBody: true
  defaultCategory?: string
}

export interface GoogleDriveConfig { _placeholder: true }
export interface SlackConfig { _placeholder: true }

export interface IntegrationSource {
  id: string
  type: IntegrationType
  name: string
  enabled: boolean
  schedule: 'MANUAL' | 'DAILY' | 'WEEKLY'
  lastSyncAt: string | null
  lastSyncStatus: 'SUCCESS' | 'FAILED' | null
  lastSyncCount: number
  lastSyncError: string | null
  config: NotionConfig | GoogleDriveConfig | SlackConfig
}

export const useIntegrationStore = defineStore('integration', () => {
  const integrationSources = ref<IntegrationSource[]>([
    {
      id: 'integration-notion-1',
      type: 'NOTION',
      name: 'Notion 商品知識庫',
      enabled: true,
      schedule: 'DAILY',
      lastSyncAt: '2026-06-07 09:00',
      lastSyncStatus: 'SUCCESS',
      lastSyncCount: 24,
      lastSyncError: null,
      config: {
        apiKey: 'secret_demo_notion_token',
        databaseId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
        titleProp: 'Name',
        categoryProp: 'Category',
        tagsProp: 'Tags',
        includePageBody: true,
        defaultCategory: '商品文件',
      } satisfies NotionConfig,
    },
  ])

  function getIntegrationById(id: string) {
    return integrationSources.value.find(s => s.id === id) ?? null
  }

  return { integrationSources, getIntegrationById }
})
```

- [ ] **Step 2：確認 TypeScript 編譯無誤**

```bash
npm run type-check
```
Expected: 0 errors

- [ ] **Step 3：Commit**

```bash
git add src/stores/integrationStore.ts
git commit -m "feat(integration): add IntegrationSource types and mock data"
```

---

## Task 2：integrationStore — CRUD 方法 + 測試

**Files:**
- Modify: `src/stores/integrationStore.ts`
- Create: `src/stores/__tests__/integrationStore.test.ts`

- [ ] **Step 1：寫失敗測試**

```typescript
// src/stores/__tests__/integrationStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useIntegrationStore } from '@/stores/integrationStore'

describe('integrationStore — CRUD', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('createIntegration 建立新整合並回傳 id', () => {
    const store = useIntegrationStore()
    const before = store.integrationSources.length
    const id = store.createIntegration(
      'NOTION',
      { apiKey: 'secret_x', databaseId: 'db-1', titleProp: 'Name', includePageBody: true },
      'My Notion',
      'MANUAL',
    )
    expect(store.integrationSources.length).toBe(before + 1)
    const src = store.getIntegrationById(id)
    expect(src?.name).toBe('My Notion')
    expect(src?.type).toBe('NOTION')
    expect(src?.schedule).toBe('MANUAL')
    expect(src?.enabled).toBe(true)
  })

  it('updateIntegration 更新指定欄位', () => {
    const store = useIntegrationStore()
    const id = store.createIntegration(
      'NOTION',
      { apiKey: 'secret_x', databaseId: 'db-1', titleProp: 'Name', includePageBody: true },
      'My Notion',
      'MANUAL',
    )
    store.updateIntegration(id, { name: 'Updated Name', schedule: 'WEEKLY' })
    const src = store.getIntegrationById(id)
    expect(src?.name).toBe('Updated Name')
    expect(src?.schedule).toBe('WEEKLY')
  })

  it('deleteIntegration 從清單移除', () => {
    const store = useIntegrationStore()
    const id = store.createIntegration(
      'NOTION',
      { apiKey: 'secret_x', databaseId: 'db-1', titleProp: 'Name', includePageBody: true },
      'My Notion',
      'MANUAL',
    )
    const before = store.integrationSources.length
    store.deleteIntegration(id)
    expect(store.integrationSources.length).toBe(before - 1)
    expect(store.getIntegrationById(id)).toBeNull()
  })

  it('toggleIntegrationEnabled 切換啟用狀態', () => {
    const store = useIntegrationStore()
    const id = store.integrationSources[0].id
    const original = store.integrationSources[0].enabled
    store.toggleIntegrationEnabled(id)
    expect(store.getIntegrationById(id)?.enabled).toBe(!original)
    store.toggleIntegrationEnabled(id)
    expect(store.getIntegrationById(id)?.enabled).toBe(original)
  })
})
```

- [ ] **Step 2：執行測試，確認失敗**

```bash
npm run test:unit -- integrationStore
```
Expected: FAIL — `store.createIntegration is not a function`

- [ ] **Step 3：在 integrationStore.ts 新增 CRUD 方法**（加入 `return` 之前）

```typescript
function createIntegration(
  type: IntegrationType,
  config: NotionConfig | GoogleDriveConfig | SlackConfig,
  name: string,
  schedule: 'MANUAL' | 'DAILY' | 'WEEKLY',
): string {
  const id = `integration-${type.toLowerCase()}-${Date.now()}`
  integrationSources.value.push({
    id,
    type,
    name,
    enabled: true,
    schedule,
    lastSyncAt: null,
    lastSyncStatus: null,
    lastSyncCount: 0,
    lastSyncError: null,
    config,
  })
  return id
}

function updateIntegration(id: string, patch: Partial<Omit<IntegrationSource, 'id' | 'type'>>) {
  const src = integrationSources.value.find(s => s.id === id)
  if (!src) return
  Object.assign(src, patch)
}

function deleteIntegration(id: string) {
  const idx = integrationSources.value.findIndex(s => s.id === id)
  if (idx !== -1) integrationSources.value.splice(idx, 1)
}

function toggleIntegrationEnabled(id: string) {
  const src = integrationSources.value.find(s => s.id === id)
  if (src) src.enabled = !src.enabled
}
```

更新 `return` 加入這 4 個方法：
```typescript
return {
  integrationSources,
  getIntegrationById,
  createIntegration,
  updateIntegration,
  deleteIntegration,
  toggleIntegrationEnabled,
}
```

- [ ] **Step 4：執行測試，確認通過**

```bash
npm run test:unit -- integrationStore
```
Expected: PASS — 4 tests passed

- [ ] **Step 5：Commit**

```bash
git add src/stores/integrationStore.ts src/stores/__tests__/integrationStore.test.ts
git commit -m "feat(integration): add CRUD methods with tests"
```

---

## Task 3：blocksToMarkdown 工具函式 + 測試

**Files:**
- Modify: `src/stores/integrationStore.ts`
- Modify: `src/stores/__tests__/integrationStore.test.ts`

- [ ] **Step 1：新增失敗測試**（加入 `integrationStore.test.ts` 末尾）

```typescript
describe('blocksToMarkdown', () => {
  it('轉換常見 block 類型為 Markdown', () => {
    const { blocksToMarkdown } = useIntegrationStore()
    const blocks: NotionBlock[] = [
      { type: 'heading_2', heading_2: { rich_text: [{ plain_text: '標題' }] } },
      { type: 'paragraph', paragraph: { rich_text: [{ plain_text: '段落文字' }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ plain_text: '清單項目' }] } },
      { type: 'numbered_list_item', numbered_list_item: { rich_text: [{ plain_text: '編號項目' }] } },
    ]
    const result = blocksToMarkdown(blocks)
    expect(result).toContain('## 標題')
    expect(result).toContain('段落文字')
    expect(result).toContain('- 清單項目')
    expect(result).toContain('1. 編號項目')
  })

  it('忽略不支援的 block 類型', () => {
    const { blocksToMarkdown } = useIntegrationStore()
    const blocks: NotionBlock[] = [
      { type: 'unsupported_type' as never },
      { type: 'paragraph', paragraph: { rich_text: [{ plain_text: '保留這段' }] } },
    ]
    const result = blocksToMarkdown(blocks)
    expect(result).toBe('保留這段')
  })
})
```

在測試檔案頂部新增 import：
```typescript
import type { NotionBlock } from '@/stores/integrationStore'
```

- [ ] **Step 2：執行測試，確認失敗**

```bash
npm run test:unit -- integrationStore
```
Expected: FAIL — `blocksToMarkdown is not a function`

- [ ] **Step 3：在 integrationStore.ts 新增 NotionBlock type 和 blocksToMarkdown**（加在 `defineStore` 之前）

```typescript
export interface NotionRichText {
  plain_text: string
}

export interface NotionBlock {
  type: string
  heading_1?: { rich_text: NotionRichText[] }
  heading_2?: { rich_text: NotionRichText[] }
  heading_3?: { rich_text: NotionRichText[] }
  paragraph?: { rich_text: NotionRichText[] }
  bulleted_list_item?: { rich_text: NotionRichText[] }
  numbered_list_item?: { rich_text: NotionRichText[] }
  code?: { rich_text: NotionRichText[]; language: string }
}

function blocksToMarkdown(blocks: NotionBlock[]): string {
  return blocks
    .map(block => {
      const text = (arr?: NotionRichText[]) => (arr ?? []).map(t => t.plain_text).join('')
      switch (block.type) {
        case 'heading_1': return `# ${text(block.heading_1?.rich_text)}`
        case 'heading_2': return `## ${text(block.heading_2?.rich_text)}`
        case 'heading_3': return `### ${text(block.heading_3?.rich_text)}`
        case 'paragraph': return text(block.paragraph?.rich_text)
        case 'bulleted_list_item': return `- ${text(block.bulleted_list_item?.rich_text)}`
        case 'numbered_list_item': return `1. ${text(block.numbered_list_item?.rich_text)}`
        case 'code':
          return `\`\`\`${block.code?.language ?? ''}\n${text(block.code?.rich_text)}\n\`\`\``
        default: return ''
      }
    })
    .filter(Boolean)
    .join('\n\n')
}
```

在 `return` 加入 `blocksToMarkdown`：
```typescript
return {
  integrationSources,
  getIntegrationById,
  createIntegration,
  updateIntegration,
  deleteIntegration,
  toggleIntegrationEnabled,
  blocksToMarkdown,
}
```

- [ ] **Step 4：執行測試，確認通過**

```bash
npm run test:unit -- integrationStore
```
Expected: PASS — 6 tests passed

- [ ] **Step 5：Commit**

```bash
git add src/stores/integrationStore.ts src/stores/__tests__/integrationStore.test.ts
git commit -m "feat(integration): add blocksToMarkdown with tests"
```

---

## Task 4：syncNotion mock + triggerIntegrationSync + 測試

**Files:**
- Modify: `src/stores/integrationStore.ts`
- Modify: `src/stores/__tests__/integrationStore.test.ts`

- [ ] **Step 1：新增失敗測試**（加入 `integrationStore.test.ts`）

```typescript
describe('triggerIntegrationSync — Notion', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('同步成功後更新 lastSyncStatus 為 SUCCESS', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9) // > 0.2 → success
    const store = useIntegrationStore()
    const id = store.integrationSources[0].id
    const syncPromise = store.triggerIntegrationSync(id)
    vi.advanceTimersByTime(2000)
    await syncPromise
    const src = store.getIntegrationById(id)
    expect(src?.lastSyncStatus).toBe('SUCCESS')
    expect(src?.lastSyncCount).toBeGreaterThan(0)
    expect(src?.lastSyncError).toBeNull()
  })

  it('同步失敗後更新 lastSyncStatus 為 FAILED', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1) // <= 0.2 → fail
    const store = useIntegrationStore()
    const id = store.integrationSources[0].id
    const syncPromise = store.triggerIntegrationSync(id)
    vi.advanceTimersByTime(2000)
    await syncPromise
    const src = store.getIntegrationById(id)
    expect(src?.lastSyncStatus).toBe('FAILED')
    expect(src?.lastSyncError).toBeTruthy()
  })

  it('id 不存在時不拋出錯誤', async () => {
    const store = useIntegrationStore()
    await expect(store.triggerIntegrationSync('non-existent')).resolves.toBeUndefined()
  })
})
```

在頂部加入：
```typescript
import { vi, afterEach } from 'vitest'
```

- [ ] **Step 2：執行測試，確認失敗**

```bash
npm run test:unit -- integrationStore
```
Expected: FAIL — `triggerIntegrationSync is not a function`

- [ ] **Step 3：在 integrationStore.ts 新增 syncNotion 和 triggerIntegrationSync**

```typescript
function syncNotion(source: IntegrationSource): Promise<void> {
  return new Promise(resolve => {
    setTimeout(() => {
      const success = Math.random() > 0.2
      const now = new Date().toISOString().replace('T', ' ').slice(0, 16)

      if (!success) {
        source.lastSyncStatus = 'FAILED'
        source.lastSyncAt = now
        source.lastSyncCount = 0
        source.lastSyncError = '連線失敗：無法存取 Notion API'
        resolve()
        return
      }

      const count = Math.floor(Math.random() * 5) + 3
      source.lastSyncStatus = 'SUCCESS'
      source.lastSyncAt = now
      source.lastSyncCount = count
      source.lastSyncError = null
      resolve()
    }, 2000)
  })
}

function triggerIntegrationSync(id: string): Promise<void> {
  const source = integrationSources.value.find(s => s.id === id)
  if (!source) return Promise.resolve()
  switch (source.type) {
    case 'NOTION': return syncNotion(source)
    default: return Promise.resolve()
  }
}
```

在 `return` 加入 `triggerIntegrationSync`。

- [ ] **Step 4：執行測試，確認通過**

```bash
npm run test:unit -- integrationStore
```
Expected: PASS — 9 tests passed

- [ ] **Step 5：Commit**

```bash
git add src/stores/integrationStore.ts src/stores/__tests__/integrationStore.test.ts
git commit -m "feat(integration): add syncNotion mock and triggerIntegrationSync"
```

---

## Task 5：修改 knowledgeStore — 新增欄位和 actions

**Files:**
- Modify: `src/stores/knowledgeStore.ts`
- Modify: `src/stores/__tests__/integrationStore.test.ts`

- [ ] **Step 1：新增失敗測試**（加入 `integrationStore.test.ts`）

在頂部 imports 加入：
```typescript
import { useKnowledgeStore } from '@/stores/knowledgeStore'
```

```typescript
describe('syncNotion — 建立知識條目', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.9)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('成功同步後在 knowledgeStore 建立新知識條目', async () => {
    const integrationStore = useIntegrationStore()
    const knowledgeStore = useKnowledgeStore()

    const before = knowledgeStore.knowledgeList.length
    const sourceId = integrationStore.integrationSources[0].id

    const syncPromise = integrationStore.triggerIntegrationSync(sourceId)
    vi.advanceTimersByTime(2000)
    await syncPromise

    expect(knowledgeStore.knowledgeList.length).toBeGreaterThan(before)
    const newItems = knowledgeStore.knowledgeList.filter(
      k => k.integrationSourceId === sourceId,
    )
    expect(newItems.length).toBeGreaterThan(0)
    expect(newItems[0].sourceType).toBe('NOTION')
    expect(newItems[0].versions[0].status).toBe('draft')
  })
})
```

- [ ] **Step 2：執行測試，確認失敗**

```bash
npm run test:unit -- integrationStore
```
Expected: FAIL — `integrationSourceId` 不存在於 KnowledgeItem

- [ ] **Step 3：修改 `knowledgeStore.ts` — 新增 SourceType 和 KnowledgeItem 欄位**

在 `src/stores/knowledgeStore.ts` line 16：
```typescript
// 修改前
export type SourceType = 'FILE' | 'API' | 'MANUAL' | 'JUSTKA' | 'SHAREPOINT'
// 修改後
export type SourceType = 'FILE' | 'API' | 'MANUAL' | 'JUSTKA' | 'SHAREPOINT' | 'NOTION'
```

在 `KnowledgeItem` interface 末尾（`lastUpdateBy` 之後）新增：
```typescript
  integrationSourceId?: string
  notionPageId?: string
```

- [ ] **Step 4：在 knowledgeStore.ts 末尾（`return` 之前）新增兩個 actions**

```typescript
function createKnowledgeFromIntegration(
  integrationSourceId: string,
  notionPageId: string,
  title: string,
  content: string,
  category: string,
  tags: string[],
): string {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16)
  const newId = `k-notion-${Date.now()}`
  const draftId = `v1.0-draft-${Date.now()}`

  const newKnowledge: KnowledgeItem = {
    id: newId,
    title,
    category,
    status: 'pending',
    sourceType: 'NOTION',
    pipelineProgress: 0,
    pipelineStage: null,
    pipelineError: null,
    sourceStale: false,
    staleSourceFileIds: [],
    lastSyncAt: null,
    apiSourceId: null,
    apiSourceName: null,
    lastUpdateTime: now,
    lastUpdateBy: 'Notion 同步',
    integrationSourceId,
    notionPageId,
    versions: [{
      id: draftId,
      knowledgeId: newId,
      versionNumber: 'v1.0',
      versionType: null,
      status: 'draft',
      title,
      summary: `由 Notion 同步建立`,
      content,
      tags,
      systemTags: [],
      lastUpdateBy: 'Notion 同步',
      lastUpdateTime: now,
      updateNote: 'Notion 首次同步',
      sourceFiles: [],
      chunks: [],
      embeddingModel: null,
      embeddingDimension: null,
      embeddingCount: 0,
      reviewNote: '',
      reviewedBy: null,
      reviewedTime: null,
      reviewFeedback: null,
      reviewHistory: [],
      conversionLog: [],
    }],
  }

  knowledgeList.value.push(newKnowledge)
  startPipelineSimulation(newId, content)
  return newId
}

function createDraftFromIntegrationSync(
  knowledgeId: string,
  title: string,
  content: string,
  category: string,
  tags: string[],
): string {
  const k = knowledgeList.value.find(item => item.id === knowledgeId)
  if (!k) return ''

  const base = k.versions.find(v => v.status === 'active') ?? k.versions[k.versions.length - 1]
  const [major, minor] = base.versionNumber.replace('v', '').split('.').map(Number)
  const newNum = `v${major}.${minor + 1}`
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16)

  const newVersion: KnowledgeVersion = {
    ...JSON.parse(JSON.stringify(base)),
    id: `${newNum}-notion-sync-${Date.now()}`,
    versionNumber: newNum,
    versionType: 'MINOR',
    status: 'draft',
    title,
    content,
    tags,
    lastUpdateBy: 'Notion 同步',
    lastUpdateTime: now,
    updateNote: 'Notion 自動同步更新',
    chunks: [],
    conversionLog: [],
  }

  k.versions.push(newVersion)
  k.status = 'pending'
  k.lastUpdateTime = now
  k.lastUpdateBy = 'Notion 同步'
  startPipelineSimulation(k.id, content)
  return newVersion.id
}
```

在 `return` 中加入：
```typescript
createKnowledgeFromIntegration,
createDraftFromIntegrationSync,
```

- [ ] **Step 5：更新 integrationStore.ts — syncNotion 呼叫 knowledgeStore**

修改 `syncNotion` 函式（整個替換）：

```typescript
function syncNotion(source: IntegrationSource): Promise<void> {
  return new Promise(resolve => {
    setTimeout(async () => {
      const success = Math.random() > 0.2
      const now = new Date().toISOString().replace('T', ' ').slice(0, 16)

      if (!success) {
        source.lastSyncStatus = 'FAILED'
        source.lastSyncAt = now
        source.lastSyncCount = 0
        source.lastSyncError = '連線失敗：無法存取 Notion API'
        resolve()
        return
      }

      const { useKnowledgeStore } = await import('@/stores/knowledgeStore')
      const knowledgeStore = useKnowledgeStore()
      const config = source.config as NotionConfig
      const count = Math.floor(Math.random() * 5) + 3

      const mockPages = Array.from({ length: count }, (_, i) => ({
        notionPageId: `notion-page-${source.id}-${i}`,
        title: `${source.name} 條目 ${i + 1}`,
        content: `## 說明\n\n這是來自 Notion Database「${source.name}」的第 ${i + 1} 筆知識內容。\n\n## 詳細資訊\n\n由 Notion Integration 自動同步生成的示範段落文字。`,
        category: config.defaultCategory ?? '商品文件',
        tags: ['Notion', 'AI 同步'],
      }))

      for (const page of mockPages) {
        const existing = knowledgeStore.knowledgeList.find(
          k => k.integrationSourceId === source.id && k.notionPageId === page.notionPageId,
        )
        if (existing) {
          knowledgeStore.createDraftFromIntegrationSync(
            existing.id, page.title, page.content, page.category, page.tags,
          )
        } else {
          knowledgeStore.createKnowledgeFromIntegration(
            source.id, page.notionPageId, page.title, page.content, page.category, page.tags,
          )
        }
      }

      source.lastSyncStatus = 'SUCCESS'
      source.lastSyncAt = now
      source.lastSyncCount = count
      source.lastSyncError = null
      resolve()
    }, 2000)
  })
}
```

- [ ] **Step 6：執行全部測試，確認通過**

```bash
npm run test:unit -- integrationStore
```
Expected: PASS — 10 tests passed

- [ ] **Step 7：Commit**

```bash
git add src/stores/knowledgeStore.ts src/stores/integrationStore.ts src/stores/__tests__/integrationStore.test.ts
git commit -m "feat(integration): wire syncNotion to knowledgeStore, add NOTION source type"
```

---

## Task 6：NotionConnectSteps.vue

**Files:**
- Create: `src/components/Knowledge/NotionConnectSteps.vue`

- [ ] **Step 1：建立元件**

```vue
<!-- src/components/Knowledge/NotionConnectSteps.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import type { NotionConfig } from '@/stores/integrationStore'

const props = defineProps<{
  step: 2 | 3 | 4
}>()

const emit = defineEmits<{
  'update:config': [config: Partial<NotionConfig> & { name?: string; schedule?: 'MANUAL' | 'DAILY' | 'WEEKLY' }]
  validated: [valid: boolean]
}>()

// Step 2 state
const apiKey = ref('')
const databaseId = ref('')
const testStatus = ref<'idle' | 'testing' | 'success' | 'failed'>('idle')
const testMessage = ref('')

// Step 3 state
const titleProp = ref('Name')
const categoryProp = ref('')
const tagsProp = ref('')

// Step 4 state
const integrationName = ref('Notion 知識庫')
const defaultCategory = ref('商品文件')
const schedule = ref<'MANUAL' | 'DAILY' | 'WEEKLY'>('DAILY')

const mockProperties = ['Name', 'Title', 'Category', 'Tags', 'Status', 'Description']

function testConnection() {
  if (!apiKey.value || !databaseId.value) return
  testStatus.value = 'testing'
  setTimeout(() => {
    testStatus.value = 'success'
    testMessage.value = '連線成功 — 已找到 Database「' + integrationName.value + '」（共 24 筆資料）'
    emit('validated', true)
    emit('update:config', { apiKey: apiKey.value, databaseId: databaseId.value, includePageBody: true })
  }, 1000)
}

const step2Valid = computed(() => testStatus.value === 'success')
const step3Valid = computed(() => titleProp.value.length > 0)
const step4Valid = computed(() => integrationName.value.length > 0)

function emitStep3() {
  emit('update:config', {
    titleProp: titleProp.value,
    categoryProp: categoryProp.value || undefined,
    tagsProp: tagsProp.value || undefined,
  })
  emit('validated', step3Valid.value)
}

function emitStep4() {
  emit('update:config', {
    defaultCategory: defaultCategory.value,
    name: integrationName.value,
    schedule: schedule.value,
  })
  emit('validated', step4Valid.value)
}
</script>

<template>
  <!-- Step 2: 連線驗證 -->
  <div v-if="step === 2" class="notion-steps">
    <div class="notion-steps__tip">
      ℹ 在 Notion 設定 → 整合功能 建立 Internal Integration，複製 Token 後貼入下方
    </div>
    <div class="notion-steps__field">
      <label class="notion-steps__label">Integration Token <span class="notion-steps__required">*</span></label>
      <input
        v-model="apiKey"
        class="notion-steps__input"
        placeholder="secret_xxxxxxxxxxxxxxxxxxxx"
        type="password"
        @input="testStatus = 'idle'"
      />
    </div>
    <div class="notion-steps__field">
      <label class="notion-steps__label">Database ID <span class="notion-steps__required">*</span></label>
      <input
        v-model="databaseId"
        class="notion-steps__input"
        placeholder="1a2b3c4d-5e6f-7890-abcd-ef1234567890"
        @input="testStatus = 'idle'"
      />
      <p class="notion-steps__hint">從 Notion Database 頁面 URL 複製</p>
    </div>
    <button
      class="notion-steps__test-btn"
      :disabled="!apiKey || !databaseId || testStatus === 'testing'"
      @click="testConnection"
    >
      {{ testStatus === 'testing' ? '測試中...' : '測試連線' }}
    </button>
    <div v-if="testStatus === 'success'" class="notion-steps__success">✅ {{ testMessage }}</div>
    <div v-if="testStatus === 'failed'" class="notion-steps__error">❌ 連線失敗，請確認 Token 和 Database ID 是否正確</div>
  </div>

  <!-- Step 3: 欄位對應 -->
  <div v-else-if="step === 3" class="notion-steps">
    <p class="notion-steps__desc">將 Notion Database 欄位對應至知識條目欄位：</p>
    <div class="notion-steps__mapping">
      <div class="notion-steps__mapping-row">
        <span class="notion-steps__mapping-label">標題 <span class="notion-steps__required">*</span></span>
        <span class="notion-steps__arrow">→</span>
        <select v-model="titleProp" class="notion-steps__select" @change="emitStep3">
          <option v-for="prop in mockProperties" :key="prop" :value="prop">{{ prop }}</option>
        </select>
      </div>
      <div class="notion-steps__mapping-row">
        <span class="notion-steps__mapping-label">內容</span>
        <span class="notion-steps__arrow">→</span>
        <span class="notion-steps__fixed">📄 頁面內文（自動）</span>
      </div>
      <div class="notion-steps__mapping-row">
        <span class="notion-steps__mapping-label">分類</span>
        <span class="notion-steps__arrow">→</span>
        <select v-model="categoryProp" class="notion-steps__select" @change="emitStep3">
          <option value="">（不對應）</option>
          <option v-for="prop in mockProperties" :key="prop" :value="prop">{{ prop }}</option>
        </select>
      </div>
      <div class="notion-steps__mapping-row">
        <span class="notion-steps__mapping-label">標籤</span>
        <span class="notion-steps__arrow">→</span>
        <select v-model="tagsProp" class="notion-steps__select" @change="emitStep3">
          <option value="">（不對應）</option>
          <option v-for="prop in mockProperties" :key="prop" :value="prop">{{ prop }}</option>
        </select>
      </div>
    </div>
    <div class="notion-steps__info">ℹ 內容欄位固定使用 Page Body（blocks 轉 Markdown）</div>
  </div>

  <!-- Step 4: 同步設定 -->
  <div v-else-if="step === 4" class="notion-steps">
    <div class="notion-steps__field">
      <label class="notion-steps__label">整合名稱 <span class="notion-steps__required">*</span></label>
      <input v-model="integrationName" class="notion-steps__input" @input="emitStep4" />
    </div>
    <div class="notion-steps__field">
      <label class="notion-steps__label">預設知識分類</label>
      <select v-model="defaultCategory" class="notion-steps__select" @change="emitStep4">
        <option>商品文件</option>
        <option>客服知識</option>
        <option>規則說明</option>
        <option>系統文件</option>
      </select>
    </div>
    <div class="notion-steps__field">
      <label class="notion-steps__label">自動同步頻率</label>
      <div class="notion-steps__schedule">
        <button
          v-for="opt in [{ val: 'MANUAL', label: '手動' }, { val: 'DAILY', label: '每日' }, { val: 'WEEKLY', label: '每週' }]"
          :key="opt.val"
          class="notion-steps__schedule-btn"
          :class="{ 'notion-steps__schedule-btn--active': schedule === opt.val }"
          @click="schedule = opt.val as 'MANUAL' | 'DAILY' | 'WEEKLY'; emitStep4()"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>
    <div class="notion-steps__info">完成後將立即執行首次同步</div>
  </div>
</template>
```

- [ ] **Step 2：在 `src/scss/components/_index.scss` 新增 @forward**

確認 `_index.scss` 中加入（若尚未有此行）：
```scss
@forward 'notionConnectSteps';
```

然後建立 `src/scss/components/_notionConnectSteps.scss`：

```scss
.notion-steps {
  display: flex;
  flex-direction: column;
  gap: 14px;

  &__tip, &__info {
    background: var(--color-primary-light, #f0f4ff);
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 12px;
    color: var(--color-primary, #3b5bdb);
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__label {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  &__required {
    color: var(--color-danger, #fa5252);
  }

  &__input, &__select {
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 7px 10px;
    font-size: 13px;
    width: 100%;
    box-sizing: border-box;
    color: var(--color-text-primary);
    background: var(--color-bg);

    &:focus {
      outline: none;
      border-color: var(--color-primary, #3b5bdb);
    }
  }

  &__hint {
    font-size: 11px;
    color: var(--color-text-secondary);
    margin: 0;
  }

  &__desc {
    font-size: 12px;
    color: var(--color-text-secondary);
    margin: 0;
  }

  &__test-btn {
    align-self: flex-start;
    padding: 7px 16px;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    background: var(--color-bg);
    color: var(--color-text-primary);

    &:disabled {
      opacity: .5;
      cursor: not-allowed;
    }
  }

  &__success {
    font-size: 12px;
    color: var(--color-success, #28a745);
    background: var(--color-success-light, #d4edda);
    border-radius: 6px;
    padding: 8px 12px;
  }

  &__error {
    font-size: 12px;
    color: var(--color-danger, #fa5252);
    background: var(--color-danger-light, #fff0f0);
    border-radius: 6px;
    padding: 8px 12px;
  }

  &__mapping {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__mapping-row {
    display: grid;
    grid-template-columns: 80px 24px 1fr;
    align-items: center;
    gap: 8px;
  }

  &__mapping-label {
    font-size: 13px;
    font-weight: 500;
  }

  &__arrow {
    color: var(--color-text-secondary);
    text-align: center;
  }

  &__fixed {
    font-size: 12px;
    color: var(--color-success, #28a745);
    background: var(--color-success-light, #d4edda);
    border-radius: 4px;
    padding: 5px 8px;
  }

  &__schedule {
    display: flex;
    gap: 8px;
  }

  &__schedule-btn {
    flex: 1;
    padding: 7px;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    background: var(--color-bg);
    color: var(--color-text-primary);

    &--active {
      border-color: var(--color-primary, #3b5bdb);
      background: var(--color-primary-light, #f0f4ff);
      color: var(--color-primary, #3b5bdb);
      font-weight: 600;
    }
  }
}
```

- [ ] **Step 3：執行 type-check 確認無誤**

```bash
npm run type-check
```
Expected: 0 errors

- [ ] **Step 4：Commit**

```bash
git add src/components/Knowledge/NotionConnectSteps.vue src/scss/components/_notionConnectSteps.scss src/scss/components/_index.scss
git commit -m "feat(integration): add NotionConnectSteps component"
```

---

## Task 7：IntegrationConnectWizard.vue

**Files:**
- Create: `src/components/Knowledge/IntegrationConnectWizard.vue`

- [ ] **Step 1：建立元件**

```vue
<!-- src/components/Knowledge/IntegrationConnectWizard.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useIntegrationStore } from '@/stores/integrationStore'
import type { NotionConfig } from '@/stores/integrationStore'
import NotionConnectSteps from '@/components/Knowledge/NotionConnectSteps.vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  completed: [integrationId: string]
}>()

const integrationStore = useIntegrationStore()

const currentStep = ref(1)
const selectedType = ref<'NOTION' | null>(null)
const notionConfig = ref<Partial<NotionConfig>>({})
const notionName = ref('Notion 知識庫')
const notionSchedule = ref<'MANUAL' | 'DAILY' | 'WEEKLY'>('DAILY')
const stepValid = ref(false)
const isSyncing = ref(false)

const stepLabels = ['選擇平台', '連線設定', '欄位對應', '同步設定']

const canNext = computed(() => {
  if (currentStep.value === 1) return selectedType.value !== null
  return stepValid.value
})

function handleStepConfig(config: Partial<NotionConfig> & { name?: string; schedule?: 'MANUAL' | 'DAILY' | 'WEEKLY' }) {
  const { name, schedule, ...rest } = config
  if (name) notionName.value = name
  if (schedule) notionSchedule.value = schedule
  Object.assign(notionConfig.value, rest)
}

async function finish() {
  isSyncing.value = true
  const id = integrationStore.createIntegration(
    'NOTION',
    { ...notionConfig.value, includePageBody: true } as NotionConfig,
    notionName.value,
    notionSchedule.value,
  )
  await integrationStore.triggerIntegrationSync(id)
  isSyncing.value = false
  emit('completed', id)
  emit('update:modelValue', false)
  currentStep.value = 1
  selectedType.value = null
  notionConfig.value = {}
}

function close() {
  emit('update:modelValue', false)
  currentStep.value = 1
  selectedType.value = null
  notionConfig.value = {}
}
</script>

<template>
  <div v-if="modelValue" class="integration-wizard-overlay" @click.self="close">
    <div class="integration-wizard">
      <!-- Header -->
      <div class="integration-wizard__header">
        <div>
          <div class="integration-wizard__title">連接外部平台</div>
          <div class="integration-wizard__steps">
            <span
              v-for="(label, i) in stepLabels"
              :key="i"
              class="integration-wizard__step"
              :class="{
                'integration-wizard__step--active': currentStep === i + 1,
                'integration-wizard__step--done': currentStep > i + 1,
              }"
            >{{ label }}</span>
          </div>
        </div>
        <button class="integration-wizard__close" @click="close">✕</button>
      </div>

      <!-- Body -->
      <div class="integration-wizard__body">
        <!-- Step 1: Select type -->
        <div v-if="currentStep === 1" class="integration-wizard__platform-grid">
          <div
            class="integration-wizard__platform"
            :class="{ 'integration-wizard__platform--selected': selectedType === 'NOTION' }"
            @click="selectedType = 'NOTION'"
          >
            <div class="integration-wizard__platform-icon">N</div>
            <div class="integration-wizard__platform-name">Notion</div>
            <div class="integration-wizard__platform-desc">Database 同步至知識庫</div>
          </div>
          <div class="integration-wizard__platform integration-wizard__platform--disabled">
            <div class="integration-wizard__platform-badge">即將推出</div>
            <div class="integration-wizard__platform-icon">📁</div>
            <div class="integration-wizard__platform-name">Google 雲端硬碟</div>
            <div class="integration-wizard__platform-desc">雲端文件匯入知識庫</div>
          </div>
          <div class="integration-wizard__platform integration-wizard__platform--disabled">
            <div class="integration-wizard__platform-badge">即將推出</div>
            <div class="integration-wizard__platform-icon">💬</div>
            <div class="integration-wizard__platform-name">Slack</div>
            <div class="integration-wizard__platform-desc">頻道訊息轉知識條目</div>
          </div>
        </div>

        <!-- Step 2-4: Notion steps -->
        <NotionConnectSteps
          v-else-if="selectedType === 'NOTION' && (currentStep === 2 || currentStep === 3 || currentStep === 4)"
          :step="currentStep as 2 | 3 | 4"
          @update:config="handleStepConfig"
          @validated="stepValid = $event"
        />

        <!-- Syncing -->
        <div v-if="isSyncing" class="integration-wizard__syncing">
          <div class="integration-wizard__spinner"></div>
          <div>正在執行首次同步...</div>
        </div>
      </div>

      <!-- Footer -->
      <div class="integration-wizard__footer">
        <button v-if="currentStep > 1" class="integration-wizard__btn" @click="currentStep--">← 上一步</button>
        <div class="integration-wizard__spacer"></div>
        <button
          v-if="currentStep < 4"
          class="integration-wizard__btn integration-wizard__btn--primary"
          :disabled="!canNext"
          @click="currentStep++"
        >
          下一步 →
        </button>
        <button
          v-else
          class="integration-wizard__btn integration-wizard__btn--success"
          :disabled="!canNext || isSyncing"
          @click="finish"
        >
          完成並開始同步 ✓
        </button>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2：在 `src/scss/components/_index.scss` 加入 @forward**

```scss
@forward 'integrationConnectWizard';
```

建立 `src/scss/components/_integrationConnectWizard.scss`：

```scss
.integration-wizard-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.integration-wizard {
  background: var(--color-bg);
  border-radius: 12px;
  width: 560px;
  max-width: 95vw;
  box-shadow: 0 8px 32px rgba(0, 0, 0, .2);
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 20px 20px 14px;
    border-bottom: 1px solid var(--color-border);
  }

  &__title {
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: 8px;
  }

  &__steps {
    display: flex;
    gap: 6px;
  }

  &__step {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 10px;
    background: var(--color-bg-secondary);
    color: var(--color-text-secondary);

    &--active {
      background: var(--color-primary, #3b5bdb);
      color: #fff;
    }

    &--done {
      background: var(--color-success-light, #d4edda);
      color: var(--color-success, #28a745);
    }
  }

  &__close {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: var(--color-text-secondary);
    padding: 0;
    line-height: 1;
  }

  &__body {
    padding: 20px;
    min-height: 240px;
    position: relative;
  }

  &__platform-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  &__platform {
    border: 1.5px solid var(--color-border);
    border-radius: 10px;
    padding: 16px 12px;
    text-align: center;
    cursor: pointer;
    position: relative;
    transition: border-color .15s, background .15s;

    &:hover:not(&--disabled) {
      border-color: var(--color-primary, #3b5bdb);
    }

    &--selected {
      border-color: var(--color-primary, #3b5bdb);
      background: var(--color-primary-light, #f0f4ff);
    }

    &--disabled {
      opacity: .5;
      cursor: not-allowed;
    }
  }

  &__platform-icon {
    font-size: 24px;
    margin-bottom: 8px;
    font-weight: 700;
  }

  &__platform-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  &__platform-desc {
    font-size: 11px;
    color: var(--color-text-secondary);
    margin-top: 4px;
  }

  &__platform-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: var(--color-bg-secondary);
    border-radius: 3px;
    padding: 1px 5px;
    font-size: 9px;
    color: var(--color-text-secondary);
  }

  &__syncing {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, .85);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-size: 14px;
    color: var(--color-text-primary);
    border-radius: 0 0 12px 12px;
  }

  &__spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--color-primary, #3b5bdb);
    border-top-color: transparent;
    border-radius: 50%;
    animation: integration-spin .8s linear infinite;
  }

  &__footer {
    padding: 14px 20px;
    border-top: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__spacer { flex: 1; }

  &__btn {
    padding: 7px 18px;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    background: var(--color-bg);
    color: var(--color-text-primary);

    &:disabled {
      opacity: .5;
      cursor: not-allowed;
    }

    &--primary {
      background: var(--color-primary, #3b5bdb);
      color: #fff;
      border-color: var(--color-primary, #3b5bdb);
    }

    &--success {
      background: var(--color-success, #28a745);
      color: #fff;
      border-color: var(--color-success, #28a745);
    }
  }
}

@keyframes integration-spin {
  to { transform: rotate(360deg); }
}
```

- [ ] **Step 3：type-check**

```bash
npm run type-check
```
Expected: 0 errors

- [ ] **Step 4：Commit**

```bash
git add src/components/Knowledge/IntegrationConnectWizard.vue src/scss/components/_integrationConnectWizard.scss src/scss/components/_index.scss
git commit -m "feat(integration): add IntegrationConnectWizard component"
```

---

## Task 8：修改 DataSourceTab.vue — 新增整合平台 Section

DataSourceTab 是 section 式布局（無 tab），SharePoint section 在上、API 來源 section 在下，「整合平台」section 加在兩者之間。

**Files:**
- Modify: `src/components/Knowledge/DataSourceTab.vue`

- [ ] **Step 1：在 `<script setup>` 新增 imports 和 integration store**

在現有 imports 後加入：
```typescript
import { useIntegrationStore } from '@/stores/integrationStore'
import IntegrationConnectWizard from '@/components/Knowledge/IntegrationConnectWizard.vue'

const integrationStore = useIntegrationStore()
const showIntegrationWizard = ref(false)
const syncing = ref<string | null>(null)

async function handleSync(id: string) {
  syncing.value = id
  await integrationStore.triggerIntegrationSync(id)
  syncing.value = null
}
```

- [ ] **Step 2：在 template 中，找到 SharePoint section 的結束標籤（`</div>` 結尾的 connected-section）後，加入整合平台 section**

```vue
<!-- 整合平台 section -->
<div class="datasource-integration">

  <!-- 已連接 -->
  <div v-if="integrationStore.integrationSources.length > 0">
    <div class="datasource-integration__section-label">已連接</div>
    <div
      v-for="src in integrationStore.integrationSources"
      :key="src.id"
      class="datasource-integration__card"
    >
      <div class="datasource-integration__card-icon">{{ src.type === 'NOTION' ? 'N' : '?' }}</div>
      <div class="datasource-integration__card-info">
        <div class="datasource-integration__card-name">{{ src.name }}</div>
        <div class="datasource-integration__card-meta">
          {{ src.schedule === 'MANUAL' ? '手動同步' : src.schedule === 'DAILY' ? '每日同步' : '每週同步' }}
          &nbsp;·&nbsp;
          <span :class="src.lastSyncStatus === 'SUCCESS' ? 'text-success' : 'text-danger'">
            {{ src.lastSyncStatus === 'SUCCESS' ? '上次同步成功' : src.lastSyncStatus === 'FAILED' ? '上次同步失敗' : '尚未同步' }}
          </span>
          <span v-if="src.lastSyncAt">&nbsp;·&nbsp;{{ src.lastSyncAt }}</span>
          <span v-if="src.lastSyncCount > 0">&nbsp;·&nbsp;{{ src.lastSyncCount }} 筆</span>
        </div>
      </div>
      <div class="datasource-integration__card-actions">
        <label class="datasource-integration__toggle">
          <input
            type="checkbox"
            :checked="src.enabled"
            @change="integrationStore.toggleIntegrationEnabled(src.id)"
          />
          <span class="datasource-integration__toggle-track"></span>
        </label>
        <button
          class="datasource-integration__btn"
          :disabled="syncing === src.id"
          @click="handleSync(src.id)"
        >
          {{ syncing === src.id ? '同步中...' : '立即同步' }}
        </button>
      </div>
    </div>
  </div>

  <!-- 可新增 -->
  <div class="datasource-integration__section-label">可新增</div>
  <div class="datasource-integration__available">
    <div
      class="datasource-integration__available-item"
      @click="showIntegrationWizard = true"
    >
      <div class="datasource-integration__available-icon">N</div>
      <div class="datasource-integration__available-name">Notion</div>
      <div class="datasource-integration__available-action">+ 新增連接</div>
    </div>
    <div class="datasource-integration__available-item datasource-integration__available-item--disabled">
      <div class="datasource-integration__available-icon">📁</div>
      <div class="datasource-integration__available-name">Google 雲端硬碟</div>
      <div class="datasource-integration__available-action">即將推出</div>
    </div>
    <div class="datasource-integration__available-item datasource-integration__available-item--disabled">
      <div class="datasource-integration__available-icon">💬</div>
      <div class="datasource-integration__available-name">Slack</div>
      <div class="datasource-integration__available-action">即將推出</div>
    </div>
  </div>

  <!-- Wizard -->
  <IntegrationConnectWizard v-model="showIntegrationWizard" />
</div>
```

- [ ] **Step 3：在 `src/scss/components/_index.scss` 加入 @forward**

```scss
@forward 'dataSourceIntegration';
```

建立 `src/scss/components/_dataSourceIntegration.scss`：

```scss
.datasource-integration {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__section-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: .5px;
    margin-bottom: 8px;
  }

  &__card {
    border: 1.5px solid var(--color-border);
    border-radius: 10px;
    padding: 14px;
    background: var(--color-bg);
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
  }

  &__card-icon {
    width: 36px;
    height: 36px;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 700;
    flex-shrink: 0;
  }

  &__card-info {
    flex: 1;
    min-width: 0;
  }

  &__card-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  &__card-meta {
    font-size: 11px;
    color: var(--color-text-secondary);
    margin-top: 3px;
  }

  &__card-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  &__btn {
    padding: 5px 12px;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    background: var(--color-bg);
    color: var(--color-text-primary);

    &:disabled {
      opacity: .5;
      cursor: not-allowed;
    }
  }

  &__toggle {
    position: relative;
    display: inline-block;
    width: 36px;
    height: 20px;
    cursor: pointer;

    input { display: none; }

    &-track {
      position: absolute;
      inset: 0;
      background: var(--color-border);
      border-radius: 10px;
      transition: background .2s;

      &::after {
        content: '';
        position: absolute;
        width: 16px;
        height: 16px;
        background: #fff;
        border-radius: 50%;
        top: 2px;
        left: 2px;
        transition: transform .2s;
      }
    }

    input:checked + &-track {
      background: var(--color-primary, #3b5bdb);

      &::after {
        transform: translateX(16px);
      }
    }
  }

  &__available {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  &__available-item {
    border: 1px dashed var(--color-border);
    border-radius: 10px;
    padding: 16px 12px;
    text-align: center;
    cursor: pointer;
    transition: border-color .15s;

    &:hover:not(&--disabled) {
      border-color: var(--color-primary, #3b5bdb);
    }

    &--disabled {
      opacity: .5;
      cursor: not-allowed;
    }
  }

  &__available-icon {
    font-size: 22px;
    margin-bottom: 6px;
    font-weight: 700;
  }

  &__available-name {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  &__available-action {
    font-size: 11px;
    color: var(--color-primary, #3b5bdb);
    margin-top: 4px;
  }

  .datasource-integration__available-item--disabled &__available-action {
    color: var(--color-text-secondary);
  }
}

.text-success { color: var(--color-success, #28a745); }
.text-danger  { color: var(--color-danger, #fa5252); }
```

- [ ] **Step 4：執行 type-check 和 lint**

```bash
npm run type-check && npm run lint
```
Expected: 0 errors, 0 warnings（或僅 auto-fixed）

- [ ] **Step 5：啟動 dev server 確認功能**

```bash
npm run dev
```

手動確認：
1. 進入知識管理 → 資料來源管理 → 點「整合平台」tab
2. 看到 Notion 商品知識庫卡片（來自 mock 資料）
3. 點「立即同步」→ 2 秒後 lastSyncCount 更新
4. 點「+ 新增連接」→ IntegrationConnectWizard 開啟
5. 走完 4 步驟（Step 1 選 Notion、Step 2 測試連線、Step 3 欄位對應、Step 4 同步設定）
6. 完成後 wizard 關閉，新的整合來源出現在卡片列表
7. 前往知識內容管理，確認新增的知識草稿條目出現（sourceType = NOTION，含 badge）

- [ ] **Step 6：Commit**

```bash
git add src/components/Knowledge/DataSourceTab.vue src/scss/components/_dataSourceIntegration.scss src/scss/components/_index.scss
git commit -m "feat(integration): add 整合平台 section to DataSourceTab with Notion wizard"
```

---

## 完成後驗收

執行完整測試：
```bash
npm run test:unit && npm run type-check
```
Expected: All tests pass, 0 type errors

所有 tasks 完成後，以下功能應可正常運作：
- `integrationStore` CRUD + triggerSync（含 Notion mock）
- `blocksToMarkdown` 正確轉換各種 block type
- Notion 同步後在 `knowledgeStore` 建立 `sourceType: 'NOTION'` 的草稿知識條目
- DataSourceTab「整合平台」分頁顯示連接卡片
- IntegrationConnectWizard 完整 4 步驟流程
