# Knowledge Base Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 全面重寫知識庫管理模組，對齊 PRD 的 7 狀態機、4-Tab 詳情頁、Upload-first 建立流程與批次操作。

**Architecture:** 分層推進：先重寫 Store types → 更新 tests → 新增 actions → 更新 SCSS → 重寫 views。每層可獨立驗證。

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Pinia, Vitest, SCSS (no scoped), Material Symbols, MarkdownIt

---

## 檔案影響清單

| 檔案 | 動作 |
|------|------|
| `src/stores/knowledgeStore.ts` | 重寫 types + 新增 actions + 更新 mock data |
| `src/stores/__tests__/knowledgeStore.datasource.test.ts` | 更新 — 配合新 status 值 |
| `src/stores/__tests__/knowledgeStore.pipeline.test.ts` | 新建 — 測試 pipeline actions |
| `src/scss/views/_KnowledgeBase.scss` | 擴充 — 新增 pipeline/batch/tabs 樣式 |
| `src/views/KnowledgeBase.vue` | 重寫 |
| `src/views/KnowledgeDetail.vue` | 重寫 |
| `src/components/Knowledge/CreateKnowledgeWizardModal.vue` | 重寫 |
| `src/components/Knowledge/VersionHistoryDrawer.vue` | 刪除（整合進 Detail Tab 2） |

---

## Task 1: 更新 Store 型別與 Mock Data

**Files:**
- Modify: `src/stores/knowledgeStore.ts`

- [ ] **Step 1: 替換型別定義**

將 `knowledgeStore.ts` 頂部所有 interface/type 定義替換為：

```typescript
export type ItemStatus =
  | 'pending'
  | 'processing'
  | 'reviewing'
  | 'active'
  | 'needs_update'
  | 'failed'
  | 'archived'

export type VersionStatus = 'draft' | 'reviewing' | 'active' | 'history' | 'rejected'
export type VersionType = 'MAJOR' | 'MINOR'
export type PipelineStage = 'chunking' | 'embedding' | 'indexing'
export type SourceType = 'FILE' | 'API' | 'MANUAL'

export interface ApiSourceHeader {
  key: string
  value: string
}

export interface WizardPayload {
  url: string
  authorization: string
  method: 'GET' | 'POST'
  headers: ApiSourceHeader[]
  body: string
  titleField: string
  contentField: string
  name: string
  category: string
  schedule: 'MANUAL' | 'DAILY' | 'WEEKLY'
}

export interface ApiSource {
  id: string
  name: string
  url: string
  method: 'GET' | 'POST'
  headers: ApiSourceHeader[]
  body: string
  titleField: string
  contentField: string
  schedule: 'MANUAL' | 'DAILY' | 'WEEKLY'
  enabled: boolean
  lastSyncAt: string | null
  lastSyncStatus: 'SUCCESS' | 'FAILED' | null
  lastSyncCount: number
  lastSyncError: string | null
}

export interface SourceFileRef {
  fileId: string
  fileName: string
  linkedVersion: number
}

export interface ReviewRecord {
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN'
  by: string
  time: string
  note?: string
}

export interface ChunkPreview {
  index: number
  content: string
  tokenCount: number
}

export interface KnowledgeVersion {
  id: string
  knowledgeId: string
  versionNumber: string
  versionType: VersionType | null
  status: VersionStatus
  title: string
  summary: string
  content: string
  tags: string[]
  systemTags: string[]
  lastUpdateBy: string
  lastUpdateTime: string
  updateNote: string
  sourceFiles: SourceFileRef[]
  chunks: ChunkPreview[]
  embeddingModel: string | null
  embeddingDimension: number | null
  embeddingCount: number
  reviewNote?: string
  reviewedBy?: string
  reviewedTime?: string
  reviewFeedback?: string
  reviewHistory?: ReviewRecord[]
}

export interface KnowledgeItem {
  id: string
  title: string
  category: string
  status: ItemStatus
  sourceType: SourceType
  pipelineProgress: number
  pipelineStage: PipelineStage | null
  pipelineError: string | null
  sourceStale: boolean
  staleSourceFileIds: string[]
  lastSyncAt: string | null
  apiSourceId: string | null
  apiSourceName: string | null
  versions: KnowledgeVersion[]
  lastUpdateTime: string
  lastUpdateBy: string
}
```

- [ ] **Step 2: 更新 Mock Data**

將 `knowledgeList` ref 的初始值替換為以下 mock（保留 k1–k4 的 id，更新 status 值與新欄位）：

```typescript
const knowledgeList = ref<KnowledgeItem[]>([
  {
    id: 'k1',
    title: '2025產品總表-Q3',
    category: '商品文件',
    status: 'active',
    sourceType: 'FILE',
    pipelineProgress: 100,
    pipelineStage: null,
    pipelineError: null,
    sourceStale: false,
    staleSourceFileIds: [],
    lastSyncAt: null,
    apiSourceId: null,
    apiSourceName: null,
    lastUpdateTime: '2025-08-13 10:30',
    lastUpdateBy: 'Lucas',
    versions: [
      {
        id: 'k1-v1.0',
        knowledgeId: 'k1',
        versionNumber: 'v1.0',
        versionType: null,
        status: 'history',
        title: '2025產品總表-Q1',
        summary: '2025延續品',
        content: '這是 v1.0 的內容...',
        tags: ['產品'],
        systemTags: [],
        lastUpdateBy: 'Admin',
        lastUpdateTime: '2025-01-01 09:00',
        updateNote: '初始建立',
        sourceFiles: [],
        chunks: [],
        embeddingModel: 'text-embedding-3-large',
        embeddingDimension: 3072,
        embeddingCount: 5,
      },
      {
        id: 'k1-v1.2',
        knowledgeId: 'k1',
        versionNumber: 'v1.2',
        versionType: 'MINOR',
        status: 'active',
        title: '2025產品總表-Q3',
        summary: '新增Q3選品資料',
        content: '## UGG 鞋款庫存資料\n\n| Model | SC | 年份 |\n|---|---|---|\n| TV4038BKBR | TV | 2011F |',
        tags: ['產品'],
        systemTags: ['商品文件'],
        lastUpdateBy: 'Lucas',
        lastUpdateTime: '2026-08-13 10:30',
        updateNote: '更新為 UGG 鞋款庫存資料',
        sourceFiles: [{ fileId: 'res3', fileName: 'UGG2025商品總表.xlsx', linkedVersion: 1 }],
        chunks: [
          { index: 1, content: 'UGG 鞋款庫存資料...', tokenCount: 312 },
          { index: 2, content: 'TV4038BKBR 冬季款...', tokenCount: 287 },
        ],
        embeddingModel: 'text-embedding-3-large',
        embeddingDimension: 3072,
        embeddingCount: 2,
      },
    ],
  },
  {
    id: 'k2',
    title: '後台角色權限說明',
    category: '系統文件',
    status: 'reviewing',
    sourceType: 'MANUAL',
    pipelineProgress: 100,
    pipelineStage: null,
    pipelineError: null,
    sourceStale: false,
    staleSourceFileIds: [],
    lastSyncAt: null,
    apiSourceId: null,
    apiSourceName: null,
    lastUpdateTime: '2026-04-01 11:00',
    lastUpdateBy: 'Rita',
    versions: [
      {
        id: 'k2-v2.0',
        knowledgeId: 'k2',
        versionNumber: 'v2.0',
        versionType: 'MAJOR',
        status: 'reviewing',
        title: '後台角色權限說明 (新版)',
        summary: '重構權限體系後的說明文件',
        content: '這是一份關於新版權限體系的詳細說明...',
        tags: ['權限', '安全'],
        systemTags: ['系統文件'],
        lastUpdateBy: 'Rita',
        lastUpdateTime: '2026-04-01 11:00',
        updateNote: '大版本升級，移除舊有角色',
        sourceFiles: [],
        chunks: [],
        embeddingModel: null,
        embeddingDimension: null,
        embeddingCount: 0,
      },
    ],
  },
  {
    id: 'k3',
    title: '客服 FAQ：退貨流程',
    category: '客服知識',
    status: 'processing',
    sourceType: 'FILE',
    pipelineProgress: 60,
    pipelineStage: 'embedding',
    pipelineError: null,
    sourceStale: false,
    staleSourceFileIds: [],
    lastSyncAt: null,
    apiSourceId: null,
    apiSourceName: null,
    lastUpdateTime: '2026-04-01 15:00',
    lastUpdateBy: 'Jocelyn',
    versions: [
      {
        id: 'k3-v1.0',
        knowledgeId: 'k3',
        versionNumber: 'v1.0',
        versionType: null,
        status: 'draft',
        title: '客服 FAQ：退貨流程',
        summary: '草擬退貨 SOP',
        content: '1. 收到申請\n2. 審核照片\n3. 安排退貨...',
        tags: ['客服', '退貨'],
        systemTags: [],
        lastUpdateBy: 'Jocelyn',
        lastUpdateTime: '2026-04-01 15:00',
        updateNote: '初始草稿',
        sourceFiles: [],
        chunks: [],
        embeddingModel: null,
        embeddingDimension: null,
        embeddingCount: 0,
      },
    ],
  },
  {
    id: 'k4',
    title: '信用卡申辦資格說明',
    category: '產品資訊',
    status: 'needs_update',
    sourceType: 'FILE',
    pipelineProgress: 100,
    pipelineStage: null,
    pipelineError: null,
    sourceStale: true,
    staleSourceFileIds: ['res-cc-1'],
    lastSyncAt: null,
    apiSourceId: null,
    apiSourceName: null,
    lastUpdateTime: '2026-04-12 09:00',
    lastUpdateBy: 'Alice',
    versions: [
      {
        id: 'k4-v1.3',
        knowledgeId: 'k4',
        versionNumber: 'v1.3',
        versionType: 'MINOR',
        status: 'active',
        title: '信用卡申辦資格說明',
        summary: '說明各卡種申辦條件',
        content: '## 申辦資格\n\n年滿 20 歲，年收入 30 萬以上...',
        tags: ['信用卡', '申辦'],
        systemTags: ['產品資訊'],
        lastUpdateBy: 'Alice',
        lastUpdateTime: '2026-04-12 09:00',
        updateNote: '更新年收入門檻',
        sourceFiles: [{ fileId: 'res-cc-1', fileName: '信用卡申辦規則_2026Q1.pdf', linkedVersion: 1 }],
        chunks: [
          { index: 1, content: '申辦資格：年滿 20 歲...', tokenCount: 198 },
        ],
        embeddingModel: 'text-embedding-3-large',
        embeddingDimension: 3072,
        embeddingCount: 1,
      },
    ],
  },
  {
    id: 'k5',
    title: '商品目錄即時資料',
    category: '商品文件',
    status: 'active',
    sourceType: 'API',
    pipelineProgress: 100,
    pipelineStage: null,
    pipelineError: null,
    sourceStale: false,
    staleSourceFileIds: [],
    lastSyncAt: '2026-04-12 09:00',
    apiSourceId: 'api-1',
    apiSourceName: '商品目錄 API',
    lastUpdateTime: '2026-04-12 09:00',
    lastUpdateBy: 'API 同步',
    versions: [
      {
        id: 'k5-v3.0',
        knowledgeId: 'k5',
        versionNumber: 'v3.0',
        versionType: 'MAJOR',
        status: 'active',
        title: '商品目錄即時資料',
        summary: '補充夏季選品 4 筆',
        content: '# 商品目錄（2026-04-12 最新）\n\n...',
        tags: ['商品', 'API'],
        systemTags: ['商品文件'],
        lastUpdateBy: 'API 同步',
        lastUpdateTime: '2026-04-12 09:00',
        updateNote: 'API 自動同步',
        sourceFiles: [],
        chunks: [],
        embeddingModel: 'text-embedding-3-large',
        embeddingDimension: 3072,
        embeddingCount: 8,
      },
    ],
  },
])
```

- [ ] **Step 3: 確認 TypeScript 無報錯**

```bash
npm run type-check
```

Expected: 通過（或只有 views/components 的錯誤，store 本身無錯）

---

## Task 2: 更新舊測試 & 新增 Pipeline 測試

**Files:**
- Modify: `src/stores/__tests__/knowledgeStore.datasource.test.ts`
- Create: `src/stores/__tests__/knowledgeStore.pipeline.test.ts`

- [ ] **Step 1: 更新 datasource 測試中的 status 值**

`knowledgeStore.datasource.test.ts` 第 35–38 行改為：

```typescript
expect(item!.sourceType).toBe('API')
expect(item!.apiSourceId).toBe('api-test-1')
expect(item!.apiSourceName).toBe('測試 API')
expect(item!.title).toBe('測試知識條目')
expect(item!.category).toBe('商品文件')
expect(item!.status).toBe('draft')          // 改：DRAFT → draft
expect(item!.versions.length).toBe(1)
expect(item!.versions[0].status).toBe('draft') // 改：DRAFT → draft
expect(item!.versions[0].versionNumber).toBe('v1.0')
```

第 78 行改為：
```typescript
expect(item.status).toBe('draft')  // 改：DRAFT → draft
```

- [ ] **Step 2: 新建 pipeline 測試檔案**

建立 `src/stores/__tests__/knowledgeStore.pipeline.test.ts`：

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useKnowledgeStore } from '@/stores/knowledgeStore'

describe('knowledgeStore — pipeline actions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('createFromUpload', () => {
    it('建立 pending 狀態條目，sourceType 為 FILE', () => {
      const store = useKnowledgeStore()
      const before = store.knowledgeList.length

      const id = store.createFromUpload({
        fileName: '房貸說明.pdf',
        category: '法規合規',
        tags: ['房貸'],
      })

      expect(store.knowledgeList.length).toBe(before + 1)
      const item = store.knowledgeList.find(k => k.id === id)!
      expect(item.status).toBe('pending')
      expect(item.sourceType).toBe('FILE')
      expect(item.pipelineProgress).toBe(0)
      expect(item.pipelineStage).toBeNull()
    })
  })

  describe('updatePipelineProgress', () => {
    it('更新進度與 stage', () => {
      const store = useKnowledgeStore()
      const id = store.createFromUpload({ fileName: 'test.pdf', category: '測試', tags: [] })

      store.updatePipelineProgress(id, 'chunking', 40)

      const item = store.knowledgeList.find(k => k.id === id)!
      expect(item.status).toBe('processing')
      expect(item.pipelineStage).toBe('chunking')
      expect(item.pipelineProgress).toBe(40)
    })
  })

  describe('markPipelineDone', () => {
    it('pipeline 完成後 item status 變 active，version status 變 draft', () => {
      const store = useKnowledgeStore()
      const id = store.createFromUpload({ fileName: 'test.pdf', category: '測試', tags: [] })
      store.updatePipelineProgress(id, 'indexing', 100)

      store.markPipelineDone(id, [
        { index: 1, content: 'chunk 1', tokenCount: 100 },
      ])

      const item = store.knowledgeList.find(k => k.id === id)!
      expect(item.status).toBe('active')
      expect(item.pipelineProgress).toBe(100)
      expect(item.pipelineStage).toBeNull()
      expect(item.versions[0].status).toBe('draft')
      expect(item.versions[0].chunks.length).toBe(1)
    })
  })

  describe('markPipelineFailed', () => {
    it('pipeline 失敗後 item status 變 failed，error 有值', () => {
      const store = useKnowledgeStore()
      const id = store.createFromUpload({ fileName: 'test.pdf', category: '測試', tags: [] })

      store.markPipelineFailed(id, '解析失敗：不支援的檔案格式')

      const item = store.knowledgeList.find(k => k.id === id)!
      expect(item.status).toBe('failed')
      expect(item.pipelineError).toBe('解析失敗：不支援的檔案格式')
    })
  })

  describe('retriggerPipeline', () => {
    it('將 needs_update 或 failed 條目重設為 processing', () => {
      const store = useKnowledgeStore()
      // k4 is needs_update in mock data
      const item = store.knowledgeList.find(k => k.id === 'k4')!

      store.retriggerPipeline('k4')

      expect(item.status).toBe('processing')
      expect(item.pipelineProgress).toBe(0)
      expect(item.pipelineStage).toBe('chunking')
      expect(item.pipelineError).toBeNull()
    })
  })

  describe('archiveKnowledge', () => {
    it('將 active 條目封存', () => {
      const store = useKnowledgeStore()

      store.archiveKnowledge('k1')

      const item = store.knowledgeList.find(k => k.id === 'k1')!
      expect(item.status).toBe('archived')
    })
  })

  describe('batchArchive', () => {
    it('批次封存多個條目', () => {
      const store = useKnowledgeStore()

      store.batchArchive(['k1', 'k5'])

      expect(store.knowledgeList.find(k => k.id === 'k1')!.status).toBe('archived')
      expect(store.knowledgeList.find(k => k.id === 'k5')!.status).toBe('archived')
    })
  })

  describe('batchDelete', () => {
    it('批次刪除多個條目', () => {
      const store = useKnowledgeStore()
      const before = store.knowledgeList.length

      store.batchDelete(['k3'])

      expect(store.knowledgeList.length).toBe(before - 1)
      expect(store.knowledgeList.find(k => k.id === 'k3')).toBeUndefined()
    })
  })
})
```

- [ ] **Step 3: 執行測試，確認全部 FAIL（尚未實作）**

```bash
npm run test:unit -- knowledgeStore
```

Expected: datasource 測試部分 pass，pipeline 測試全部 FAIL（actions 尚未存在）

---

## Task 3: 新增 Pipeline Store Actions

**Files:**
- Modify: `src/stores/knowledgeStore.ts`

- [ ] **Step 1: 在 store 現有 actions 後加入以下函式**

在 `return` 陳述之前插入：

```typescript
// ── Upload-first 建立 ──
function createFromUpload(params: {
  fileName: string
  category: string
  tags: string[]
}): string {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16)
  const newId = `k-${Date.now()}`
  const baseName = params.fileName.replace(/\.[^.]+$/, '')

  const newItem: KnowledgeItem = {
    id: newId,
    title: baseName,
    category: params.category,
    status: 'pending',
    sourceType: 'FILE',
    pipelineProgress: 0,
    pipelineStage: null,
    pipelineError: null,
    sourceStale: false,
    staleSourceFileIds: [],
    lastSyncAt: null,
    apiSourceId: null,
    apiSourceName: null,
    lastUpdateTime: now,
    lastUpdateBy: 'Current User',
    versions: [{
      id: `${newId}-v1.0`,
      knowledgeId: newId,
      versionNumber: 'v1.0',
      versionType: null,
      status: 'draft',
      title: baseName,
      summary: '',
      content: '',
      tags: params.tags,
      systemTags: [],
      lastUpdateBy: 'Current User',
      lastUpdateTime: now,
      updateNote: `從檔案「${params.fileName}」建立`,
      sourceFiles: [{ fileId: `file-${Date.now()}`, fileName: params.fileName, linkedVersion: 1 }],
      chunks: [],
      embeddingModel: null,
      embeddingDimension: null,
      embeddingCount: 0,
    }],
  }

  knowledgeList.value.unshift(newItem)
  return newId
}

// ── MANUAL 直接建立草稿（跳過 pipeline）──
function createManualDraft(params: { title: string; category: string; tags: string[] }): { knowledgeId: string; versionId: string } {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16)
  const newId = `k-${Date.now()}`
  const draftId = `${newId}-v1.0`

  const newItem: KnowledgeItem = {
    id: newId,
    title: params.title,
    category: params.category,
    status: 'active',
    sourceType: 'MANUAL',
    pipelineProgress: 100,
    pipelineStage: null,
    pipelineError: null,
    sourceStale: false,
    staleSourceFileIds: [],
    lastSyncAt: null,
    apiSourceId: null,
    apiSourceName: null,
    lastUpdateTime: now,
    lastUpdateBy: 'Current User',
    versions: [{
      id: draftId,
      knowledgeId: newId,
      versionNumber: 'v1.0',
      versionType: null,
      status: 'draft',
      title: params.title,
      summary: '',
      content: '',
      tags: params.tags,
      systemTags: [],
      lastUpdateBy: 'Current User',
      lastUpdateTime: now,
      updateNote: '手動建立',
      sourceFiles: [],
      chunks: [],
      embeddingModel: null,
      embeddingDimension: null,
      embeddingCount: 0,
    }],
  }

  knowledgeList.value.unshift(newItem)
  return { knowledgeId: newId, versionId: draftId }
}

function updatePipelineProgress(id: string, stage: PipelineStage, progress: number) {
  const item = knowledgeList.value.find(k => k.id === id)
  if (!item) return
  item.status = 'processing'
  item.pipelineStage = stage
  item.pipelineProgress = progress
}

function markPipelineDone(id: string, chunks: ChunkPreview[]) {
  const item = knowledgeList.value.find(k => k.id === id)
  if (!item) return
  item.status = 'active'
  item.pipelineProgress = 100
  item.pipelineStage = null
  item.pipelineError = null
  const draft = item.versions[0]
  if (draft) {
    draft.status = 'draft'
    draft.chunks = chunks
    draft.embeddingModel = 'text-embedding-3-large'
    draft.embeddingDimension = 3072
    draft.embeddingCount = chunks.length
  }
}

function markPipelineFailed(id: string, error: string) {
  const item = knowledgeList.value.find(k => k.id === id)
  if (!item) return
  item.status = 'failed'
  item.pipelineError = error
  item.pipelineStage = null
}

function retriggerPipeline(id: string) {
  const item = knowledgeList.value.find(k => k.id === id)
  if (!item) return
  item.status = 'processing'
  item.pipelineProgress = 0
  item.pipelineStage = 'chunking'
  item.pipelineError = null
  item.sourceStale = false
  item.staleSourceFileIds = []
}

function archiveKnowledge(id: string) {
  const item = knowledgeList.value.find(k => k.id === id)
  if (item) item.status = 'archived'
}

function batchArchive(ids: string[]) {
  for (const id of ids) archiveKnowledge(id)
}

function batchDelete(ids: string[]) {
  knowledgeList.value = knowledgeList.value.filter(k => !ids.includes(k.id))
}
```

- [ ] **Step 2: 更新 createDraftFromPublished — 改用新 status 值**

找到 `createDraftFromPublished`，將所有 `'PUBLISHED'` 改為 `'active'`，`'DRAFT'` 改為 `'draft'`：

```typescript
const createDraftFromPublished = (knowledgeId: string, type: 'MINOR' | 'MAJOR', updateNote: string) => {
  const k = getKnowledgeById(knowledgeId)
  if (!k) return
  const published = k.versions.find(v => v.status === 'active')   // 改
  if (!published) return
  const [major, minor] = published.versionNumber.replace('v', '').split('.').map(Number)
  const newNum = type === 'MAJOR' ? `v${major + 1}.0` : `v${major}.${minor + 1}`

  const newVersion: KnowledgeVersion = {
    ...JSON.parse(JSON.stringify(published)),
    id: `${newNum}-draft-${Date.now()}`,
    versionNumber: newNum,
    versionType: type,
    status: 'draft',   // 改
    lastUpdateBy: 'Current User',
    lastUpdateTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
    updateNote,
    chunks: [],
    embeddingCount: 0,
  }
  k.versions.push(newVersion)
  // item status stays unchanged (active) — only changes when draft is submitted for review
  return newVersion.id
}
```

- [ ] **Step 3: 更新 approveVersion — 改用新 status 值**

```typescript
const approveVersion = (knowledgeId: string, versionId: string) => {
  const k = getKnowledgeById(knowledgeId)
  if (!k) return
  const v = k.versions.find(ver => ver.id === versionId)
  if (!v || v.status !== 'reviewing') return    // 改

  const now = new Date().toISOString().replace('T', ' ').slice(0, 16)
  for (const ver of k.versions) {
    if (ver.status === 'active') ver.status = 'history'   // 改
  }
  v.status = 'active'   // 改
  v.reviewedBy = 'Current User'
  v.reviewedTime = now
  v.reviewHistory = [...(v.reviewHistory ?? []), { action: 'APPROVED', by: 'Current User', time: now }]
  k.status = 'active'   // 改
  k.lastUpdateTime = now
}
```

- [ ] **Step 4: 更新 submitForReview、rejectVersion、withdrawReview 的 status 值**

```typescript
// submitForReview：DRAFT|REJECTED → draft|rejected，REVIEWING → reviewing
const submitForReview = (knowledgeId: string, versionId: string, reviewerId: string, note: string) => {
  const k = getKnowledgeById(knowledgeId)
  if (!k) return
  const v = k.versions.find(ver => ver.id === versionId)
  if (v && (v.status === 'draft' || v.status === 'rejected')) {
    v.status = 'reviewing'
    v.reviewNote = note
    v.reviewHistory = [...(v.reviewHistory ?? []), { action: 'SUBMITTED', by: reviewerId, time: new Date().toISOString().replace('T', ' ').slice(0, 16), note }]
    k.status = 'reviewing'
  }
}

// rejectVersion
const rejectVersion = (knowledgeId: string, versionId: string, feedback?: string) => {
  const k = getKnowledgeById(knowledgeId)
  if (!k) return
  const v = k.versions.find(ver => ver.id === versionId)
  if (!v || v.status !== 'reviewing') return
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16)
  v.status = 'rejected'
  v.reviewFeedback = feedback
  v.reviewHistory = [...(v.reviewHistory ?? []), { action: 'REJECTED', by: 'Current User', time: now, note: feedback }]
  k.status = 'active'  // item 回到 active（前一個 active 版本仍在）
}

// withdrawReview
const withdrawReview = (knowledgeId: string, versionId: string) => {
  const k = getKnowledgeById(knowledgeId)
  if (!k) return
  const v = k.versions.find(ver => ver.id === versionId)
  if (!v || v.status !== 'reviewing') return
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16)
  v.status = 'draft'
  v.reviewHistory = [...(v.reviewHistory ?? []), { action: 'WITHDRAWN', by: 'Current User', time: now }]
  k.status = 'active'
}
```

- [ ] **Step 5: 更新 restoreToDraft — 改用 'active' 取代 'PUBLISHED'**

```typescript
const restoreToDraft = (knowledgeId: string, versionId: string, note: string) => {
  const k = getKnowledgeById(knowledgeId)
  if (!k) return
  const oldVersion = k.versions.find(ver => ver.id === versionId)
  if (!oldVersion) return
  const published = k.versions.find(v => v.status === 'active')   // 改
  const baseNum = published ? published.versionNumber : oldVersion.versionNumber
  const [major, minor] = baseNum.replace('v', '').split('.').map(Number)
  const newNum = `v${major}.${minor + 1}`
  const newVersion: KnowledgeVersion = {
    ...JSON.parse(JSON.stringify(oldVersion)),
    id: `${newNum}-restore-${Date.now()}`,
    versionNumber: newNum,
    versionType: 'MINOR',
    status: 'draft',   // 改
    updateNote: `還原自 ${oldVersion.versionNumber}：${note}`,
    lastUpdateTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
    chunks: [],
    embeddingCount: 0,
  }
  k.versions.push(newVersion)
  k.status = 'reviewing'
  return newVersion.id
}
```

- [ ] **Step 6: 在 return 物件中加入新 actions**

在 `return { ... }` 加入：

```typescript
createFromUpload,
createManualDraft,
updatePipelineProgress,
markPipelineDone,
markPipelineFailed,
retriggerPipeline,
archiveKnowledge,
batchArchive,
batchDelete,
```

同時移除已廢棄的 `createFromFile`（已被 `createFromUpload` 取代，若有其他 view 使用再評估）。

- [ ] **Step 7: 執行測試，確認全部通過**

```bash
npm run test:unit -- knowledgeStore
```

Expected: 所有 pipeline 測試 PASS，datasource 測試 PASS

- [ ] **Step 8: Commit**

```bash
git add src/stores/knowledgeStore.ts src/stores/__tests__/
git commit -m "feat: update knowledge store types to new pipeline state machine"
```

---

## Task 4: 擴充 SCSS

**Files:**
- Modify: `src/scss/views/_KnowledgeBase.scss`

- [ ] **Step 1: 在現有 `.status-badge` 區塊後加入新狀態 class**

找到現有 `.status-badge--PUBLISHED` 等 class，在其後加入（不刪舊的，先共存）：

```scss
// ── 新狀態 badge（小寫，對齊 store ItemStatus） ──
.status-badge--active {
  background: var(--color-success-bg, #dcfce7);
  color: var(--color-success, #16a34a);
}
.status-badge--processing {
  background: #ede9fe;
  color: #7c3aed;
}
.status-badge--reviewing {
  background: #dbeafe;
  color: #1d4ed8;
}
.status-badge--needs_update {
  background: #fef3c7;
  color: #b45309;
}
.status-badge--pending {
  background: #f1f5f9;
  color: #64748b;
}
.status-badge--failed {
  background: var(--color-danger-bg, #fee2e2);
  color: var(--color-danger, #dc2626);
}
.status-badge--archived {
  background: #f8fafc;
  color: #94a3b8;
  border: 1px solid #e2e8f0;
}
// ── Version status badge（小寫） ──
.status-badge--draft {
  background: #fef9c3;
  color: #92400e;
}
.status-badge--history {
  background: #f1f5f9;
  color: #64748b;
}
.status-badge--rejected {
  background: var(--color-danger-bg, #fee2e2);
  color: var(--color-danger, #dc2626);
}
```

- [ ] **Step 2: 新增 pipeline 進度條樣式**

```scss
// ── Pipeline 進度條（列表列內用）──
.pipeline-progress-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 3px;
}

.pipeline-progress-bar {
  width: 80px;
  height: 4px;
  background: #e9d5ff;
  border-radius: 2px;
  overflow: hidden;
}

.pipeline-progress-fill {
  height: 100%;
  background: #7c3aed;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.pipeline-stage-label {
  font-size: 11px;
  color: #7c3aed;
  font-weight: 500;
  white-space: nowrap;
}
```

- [ ] **Step 3: 新增批次工具列樣式**

```scss
// ── 批次操作工具列 ──
.batch-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: #1e40af;
  color: white;
  border-radius: 8px;
  margin-bottom: 10px;
  font-size: 13px;

  .batch-count {
    font-weight: 600;
  }

  .batch-actions {
    display: flex;
    gap: 8px;
    margin-left: auto;
  }

  .batch-btn {
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 3px 10px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: background 0.15s;

    &:hover { background: rgba(255, 255, 255, 0.25); }
    &.is-danger { background: #dc2626; border-color: transparent; }
    &.is-danger:hover { background: #b91c1c; }
  }

  .batch-cancel {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    padding: 3px 8px;
    cursor: pointer;
    font-size: 12px;
  }
}
```

- [ ] **Step 4: 新增 Detail 4-Tab 樣式**

```scss
// ── KnowledgeDetail 4-Tab ──
.detail-tabs {
  display: flex;
  border-bottom: 2px solid var(--border, #e2e8f0);
  margin-bottom: 16px;
}

.detail-tab-btn {
  padding: 8px 16px;
  font-size: 13px;
  color: var(--color-grey-1, #94a3b8);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;

  &.is-active {
    color: var(--primary, #2563eb);
    border-bottom-color: var(--primary, #2563eb);
    font-weight: 600;
  }

  &:hover:not(.is-active) {
    color: var(--text, #1e293b);
  }
}

.detail-tab-panel {
  display: none;
  &.is-active { display: block; }
}

// 概覽 Tab 58/42 分割
.detail-overview-grid {
  display: grid;
  grid-template-columns: 58fr 42fr;
  gap: 16px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

// 版本時間軸
.version-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.version-timeline-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border, #f1f5f9);

  &:last-child { border-bottom: none; }
}

.version-timeline-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 12px;

  .node-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #cbd5e1;
    margin-top: 3px;
    flex-shrink: 0;

    &.is-active { background: #16a34a; }
  }

  .node-line {
    width: 1px;
    flex: 1;
    background: #e2e8f0;
    margin-top: 4px;
    min-height: 24px;
  }
}

.version-timeline-body { flex: 1; }

// Chunk 卡片（分段預覽 Tab）
.chunk-card {
  background: var(--surface, #fff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 8px;

  .chunk-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text, #1e293b);
  }

  .chunk-token {
    font-size: 11px;
    color: var(--color-grey-1, #94a3b8);
    font-weight: 400;
  }

  .chunk-content {
    font-size: 12px;
    color: var(--text-secondary, #475569);
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

// Needs-update 列高亮
.table-row--needs-update {
  background: #fffbeb;
}

// Pipeline 徽章群（Detail 頁 Pipeline 三階段）
.pipeline-stages {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.pipeline-stage-badge {
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 11px;
  background: #f1f5f9;
  color: #64748b;

  &.is-done {
    background: #dcfce7;
    color: #16a34a;
  }

  &.is-active {
    background: #ede9fe;
    color: #7c3aed;
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/scss/views/_KnowledgeBase.scss
git commit -m "style: add pipeline, batch toolbar, and 4-tab styles to KnowledgeBase"
```

---

## Task 5: 重寫 KnowledgeBase.vue

**Files:**
- Modify: `src/views/KnowledgeBase.vue`

- [ ] **Step 1: 完整替換 KnowledgeBase.vue**

```vue
<template>
  <div class="KnowledgeBase views-page">
    <div class="views-page-content-box">

      <!-- Page Banner -->
      <div class="page-banner">
        <div>
          <AppBreadcrumb />
          <div class="banner-title">知識庫管理</div>
        </div>
      </div>

      <!-- Tab 切換 -->
      <div class="kb-tab-nav">
        <button :class="['kb-tab', { 'is-active': activeTab === 'items' }]" @click="activeTab = 'items'">
          <i class="material-symbols-outlined">menu_book</i>知識條目
        </button>
        <button :class="['kb-tab', { 'is-active': activeTab === 'sources' }]" @click="activeTab = 'sources'">
          <i class="material-symbols-outlined">api</i>資料來源
        </button>
      </div>

      <DataSourceTab v-if="activeTab === 'sources'" />

      <template v-if="activeTab === 'items'">
        <!-- 統計卡 -->
        <div class="stats-row" style="grid-template-columns: repeat(5, 1fr);">
          <div class="stat-card">
            <div class="stat-icon stat-icon--main"><i class="material-symbols-outlined">description</i></div>
            <div><div class="stat-number">{{ stats.total }}</div><div class="stat-label">全部</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon--green"><i class="material-symbols-outlined">verified</i></div>
            <div><div class="stat-number">{{ stats.active }}</div><div class="stat-label">Active</div></div>
          </div>
          <div class="stat-card" style="background: #fffbeb; border-color: #fde68a;">
            <div class="stat-icon" style="background:#fef3c7;color:#b45309;"><i class="material-symbols-outlined">update</i></div>
            <div><div class="stat-number" style="color:#b45309;">{{ stats.needsUpdate }}</div><div class="stat-label">Needs Update</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon--blue"><i class="material-symbols-outlined">rate_review</i></div>
            <div><div class="stat-number">{{ stats.reviewing }}</div><div class="stat-label">Reviewing</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:#ede9fe;color:#7c3aed;"><i class="material-symbols-outlined">sync</i></div>
            <div><div class="stat-number" style="color:#7c3aed;">{{ stats.processing }}</div><div class="stat-label">Processing</div></div>
          </div>
        </div>

        <!-- 批次工具列 / 篩選列 -->
        <div v-if="selectedIds.length" class="batch-toolbar">
          <span class="batch-count">已選 {{ selectedIds.length }} 筆</span>
          <div class="batch-actions">
            <button class="batch-btn" @click="handleBatchArchive">批次封存</button>
            <button class="batch-btn is-danger" @click="handleBatchDelete">批次刪除</button>
          </div>
          <button class="batch-cancel" @click="selectedIds = []">✕ 取消</button>
        </div>
        <div v-else class="filter-row">
          <div class="category-tabs">
            <button
              v-for="cat in categoryOptions"
              :key="cat"
              :class="['category-tab-btn', { 'is-active': selectedCategory === cat }]"
              @click="selectedCategory = cat"
            >{{ cat }}</button>
          </div>
          <div class="filter-right">
            <compDropDown
              v-model="selectedStatus"
              :options="statusOptions"
              placeholder="狀態"
              style="width: 130px;"
            />
            <button class="custom-btn custom-main-btn ml-2" @click="isCreateModalOpen = true">
              <i class="material-symbols-outlined">add_box</i>新增知識
            </button>
          </div>
        </div>

        <!-- 表格 -->
        <div class="custom-table-wrap">
          <table class="custom-table">
            <thead>
              <tr>
                <th style="width:36px;">
                  <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" />
                </th>
                <th>標題 / 分類</th>
                <th style="width:130px;">狀態</th>
                <th style="width:90px;">版本</th>
                <th style="width:130px;">最後更新</th>
                <th style="width:60px;">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!displayList.length">
                <td colspan="6" class="text-center fc-grey-1 py-4">無符合條件的條目</td>
              </tr>
              <tr
                v-for="item in displayList"
                :key="item.id"
                :class="{ 'table-row--needs-update': item.status === 'needs_update' }"
              >
                <td>
                  <input
                    type="checkbox"
                    :checked="selectedIds.includes(item.id)"
                    @change="toggleSelect(item.id)"
                  />
                </td>
                <td>
                  <div class="fw-500 cursor-pointer" @click="goToDetail(item.id)">
                    {{ item.title }}
                    <span v-if="item.status === 'needs_update'" class="source-stale-badge ml-1">來源已更新</span>
                  </div>
                  <div class="fs-12 fc-grey-1">{{ item.category }}</div>
                  <!-- Pipeline 進度條 -->
                  <div v-if="item.status === 'processing'" class="pipeline-progress-wrap">
                    <div class="pipeline-progress-bar">
                      <div class="pipeline-progress-fill" :style="{ width: item.pipelineProgress + '%' }"></div>
                    </div>
                    <span class="pipeline-stage-label">{{ item.pipelineStage }} {{ item.pipelineProgress }}%</span>
                  </div>
                </td>
                <td>
                  <span :class="['status-badge', `status-badge--${item.status}`]">
                    <i class="material-symbols-outlined">{{ statusIconMap[item.status] }}</i>
                    {{ statusLabelMap[item.status] }}
                  </span>
                </td>
                <td class="fc-grey-1 fs-13">{{ activeVersion(item)?.versionNumber ?? '—' }}</td>
                <td class="fc-grey-1 fs-13">{{ item.lastUpdateTime }}</td>
                <td>
                  <div class="ops-menu-wrap" @click.stop>
                    <button class="ops-btn" @click="toggleOpsMenu(item.id)">
                      <i class="material-symbols-outlined">more_vert</i>
                    </button>
                    <div v-if="openOpsId === item.id" class="next-option-box ops-dropdown">
                      <div class="option-item" @click="goToDetail(item.id); closeOps()">
                        <i class="material-symbols-outlined">visibility</i>查看
                      </div>
                      <template v-if="item.status === 'active'">
                        <div class="option-item" @click="openCreateVersion(item.id); closeOps()">
                          <i class="material-symbols-outlined">add_box</i>建立新版本
                        </div>
                        <div class="option-item" @click="archiveItem(item.id); closeOps()">
                          <i class="material-symbols-outlined">inventory_2</i>封存
                        </div>
                      </template>
                      <template v-if="item.status === 'draft'">
                        <div class="option-item" @click="goToEditor(item); closeOps()">
                          <i class="material-symbols-outlined">edit</i>繼續編輯
                        </div>
                      </template>
                      <template v-if="item.status === 'reviewing'">
                        <div class="option-item" @click="handleWithdraw(item); closeOps()">
                          <i class="material-symbols-outlined">undo</i>撤回審核
                        </div>
                        <div class="option-item" @click="openReview(item); closeOps()">
                          <i class="material-symbols-outlined">rate_review</i>開始審核
                        </div>
                      </template>
                      <template v-if="item.status === 'needs_update' || item.status === 'failed'">
                        <div class="option-item" @click="knowledgeStore.retriggerPipeline(item.id); closeOps()">
                          <i class="material-symbols-outlined">refresh</i>重新觸發 Pipeline
                        </div>
                      </template>
                      <template v-if="item.status !== 'processing' && item.status !== 'pending'">
                        <div class="option-item option-item--danger" @click="deleteItem(item.id); closeOps()">
                          <i class="material-symbols-outlined">delete</i>刪除
                        </div>
                      </template>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分頁 -->
        <compPagination
          v-model="currentPage"
          :total="filteredList.length"
          :pageSize="pageSize"
          class="mt-3"
        />
      </template>
    </div>

    <!-- 新增知識 Modal -->
    <CreateKnowledgeWizardModal
      v-model="isCreateModalOpen"
      @created="handleCreated"
    />

    <!-- 建立新版本 Modal -->
    <CreateVersionModal
      v-model="isCreateVersionOpen"
      @confirm="handleCreateVersion"
    />

    <!-- 審核 Drawer -->
    <ReviewDrawer
      v-model="isReviewDrawerOpen"
      :knowledgeId="reviewTargetId"
      :versionId="reviewVersionId"
    />

    <!-- 版本差異比較 Modal -->
    <VersionCompareModal
      v-model="isCompareOpen"
      :knowledgeId="compareKnowledgeId"
      :v1Id="compareV1Id"
      :v2Id="compareV2Id"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import DataSourceTab from '@/components/Knowledge/DataSourceTab.vue'
import CreateKnowledgeWizardModal from '@/components/Knowledge/CreateKnowledgeWizardModal.vue'
import CreateVersionModal from '@/components/Knowledge/CreateVersionModal.vue'
import ReviewDrawer from '@/components/Knowledge/ReviewDrawer.vue'
import VersionCompareModal from '@/components/Knowledge/VersionCompareModal.vue'
import { useKnowledgeStore } from '@/stores/knowledgeStore'
import type { KnowledgeItem } from '@/stores/knowledgeStore'
import popDialog from '@/services/popDialog'

const router = useRouter()
const knowledgeStore = useKnowledgeStore()
const { knowledgeList } = storeToRefs(knowledgeStore)

// ── Tab ──
const activeTab = ref<'items' | 'sources'>('items')

// ── 篩選 ──
const selectedCategory = ref('全部')
const selectedStatus = ref('')

const categoryOptions = computed(() => {
  const cats = [...new Set(knowledgeList.value.map(k => k.category))]
  return ['全部', ...cats]
})

const statusOptions = [
  { label: '全部狀態', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Processing', value: 'processing' },
  { label: 'Reviewing', value: 'reviewing' },
  { label: 'Needs Update', value: 'needs_update' },
  { label: 'Pending', value: 'pending' },
  { label: 'Failed', value: 'failed' },
  { label: 'Archived', value: 'archived' },
]

const filteredList = computed(() => {
  return knowledgeList.value.filter(item => {
    if (selectedCategory.value !== '全部' && item.category !== selectedCategory.value) return false
    if (selectedStatus.value && item.status !== selectedStatus.value) return false
    return true
  })
})

// ── 分頁 ──
const currentPage = ref(1)
const pageSize = 10

const displayList = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredList.value.slice(start, start + pageSize)
})

// ── 統計 ──
const stats = computed(() => ({
  total: knowledgeList.value.length,
  active: knowledgeList.value.filter(k => k.status === 'active').length,
  needsUpdate: knowledgeList.value.filter(k => k.status === 'needs_update').length,
  reviewing: knowledgeList.value.filter(k => k.status === 'reviewing').length,
  processing: knowledgeList.value.filter(k => k.status === 'processing' || k.status === 'pending').length,
}))

// ── 狀態 label / icon ──
const statusLabelMap: Record<string, string> = {
  active: '已發布',
  processing: '處理中',
  reviewing: '審核中',
  needs_update: '需更新',
  pending: '待處理',
  failed: '失敗',
  archived: '已封存',
  draft: '草稿',
  history: '歷史版',
  rejected: '已退回',
}

const statusIconMap: Record<string, string> = {
  active: 'verified',
  processing: 'sync',
  reviewing: 'pending_actions',
  needs_update: 'update',
  pending: 'schedule',
  failed: 'error',
  archived: 'inventory_2',
  draft: 'edit_note',
  history: 'history',
  rejected: 'cancel',
}

// ── 勾選批次 ──
const selectedIds = ref<string[]>([])

const isAllSelected = computed(
  () => displayList.value.length > 0 && displayList.value.every(i => selectedIds.value.includes(i.id))
)

function toggleSelectAll(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  if (checked) {
    selectedIds.value = [...new Set([...selectedIds.value, ...displayList.value.map(i => i.id)])]
  } else {
    const pageIds = displayList.value.map(i => i.id)
    selectedIds.value = selectedIds.value.filter(id => !pageIds.includes(id))
  }
}

function toggleSelect(id: string) {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter(i => i !== id)
  } else {
    selectedIds.value = [...selectedIds.value, id]
  }
}

function handleBatchArchive() {
  popDialog.confirm(`確定要封存 ${selectedIds.value.length} 個條目嗎？`, () => {
    knowledgeStore.batchArchive(selectedIds.value)
    selectedIds.value = []
    popDialog.toast('已批次封存', 2000)
  })
}

function handleBatchDelete() {
  popDialog.confirm(`確定要刪除 ${selectedIds.value.length} 個條目嗎？此操作無法復原。`, () => {
    knowledgeStore.batchDelete(selectedIds.value)
    selectedIds.value = []
    popDialog.toast('已批次刪除', 2000)
  })
}

// ── 操作選單 ──
const openOpsId = ref<string | null>(null)

function toggleOpsMenu(id: string) {
  openOpsId.value = openOpsId.value === id ? null : id
}

function closeOps() {
  openOpsId.value = null
}

// ── 工具函式 ──
function activeVersion(item: KnowledgeItem) {
  return item.versions.find(v => v.status === 'active') ?? item.versions[item.versions.length - 1]
}

function goToDetail(id: string) {
  router.push({ name: 'KnowledgeDetail', params: { id } })
}

function goToEditor(item: KnowledgeItem) {
  const draft = item.versions.find(v => v.status === 'draft' || v.status === 'rejected')
  if (draft) {
    router.push({ name: 'KnowledgeEditor', params: { knowledgeId: item.id, versionId: draft.id } })
  }
}

function archiveItem(id: string) {
  popDialog.confirm('確定要封存此條目嗎？', () => {
    knowledgeStore.archiveKnowledge(id)
    popDialog.toast('已封存', 2000)
  })
}

function deleteItem(id: string) {
  popDialog.confirm('確定要刪除此條目嗎？此操作無法復原。', () => {
    knowledgeStore.batchDelete([id])
    popDialog.toast('已刪除', 2000)
  })
}

// ── 審核 ──
const isReviewDrawerOpen = ref(false)
const reviewTargetId = ref('')
const reviewVersionId = ref('')

function openReview(item: KnowledgeItem) {
  const v = item.versions.find(ver => ver.status === 'reviewing')
  if (!v) return
  reviewTargetId.value = item.id
  reviewVersionId.value = v.id
  isReviewDrawerOpen.value = true
}

function handleWithdraw(item: KnowledgeItem) {
  const v = item.versions.find(ver => ver.status === 'reviewing')
  if (!v) return
  popDialog.confirm('確定要撤回此審核申請嗎？', () => {
    knowledgeStore.withdrawReview(item.id, v.id)
    popDialog.toast('已撤回審核', 2000)
  })
}

// ── 建立新版本 ──
const isCreateVersionOpen = ref(false)
const createVersionTargetId = ref('')

function openCreateVersion(id: string) {
  createVersionTargetId.value = id
  isCreateVersionOpen.value = true
}

function handleCreateVersion(data: { type: 'MINOR' | 'MAJOR', note: string }) {
  const newId = knowledgeStore.createDraftFromPublished(createVersionTargetId.value, data.type, data.note)
  if (newId) {
    router.push({ name: 'KnowledgeEditor', params: { knowledgeId: createVersionTargetId.value, versionId: newId } })
  }
}

// ── 新增知識 ──
const isCreateModalOpen = ref(false)

function handleCreated(knowledgeId: string) {
  isCreateModalOpen.value = false
  // 若是 MANUAL 類型直接導到 editor；FILE/API 留在列表等 pipeline
}

// ── 版本比較 ──
const isCompareOpen = ref(false)
const compareKnowledgeId = ref('')
const compareV1Id = ref('')
const compareV2Id = ref('')
</script>
```

- [ ] **Step 2: 手動驗證**

執行 `npm run dev`，進入知識庫管理：
- [ ] 5 張統計卡顯示正確數值
- [ ] k3（processing）列有迷你進度條
- [ ] k4（needs_update）列有黃底
- [ ] 勾選列後出現批次工具列
- [ ] 各操作選單依狀態顯示正確選項

- [ ] **Step 3: Commit**

```bash
git add src/views/KnowledgeBase.vue
git commit -m "feat: rewrite KnowledgeBase list page with pipeline status and batch operations"
```

---

## Task 6: 重寫 KnowledgeDetail.vue

**Files:**
- Modify: `src/views/KnowledgeDetail.vue`

- [ ] **Step 1: 完整替換 KnowledgeDetail.vue**

```vue
<template>
  <div class="KnowledgeBase KnowledgeDetail views-page">
    <AppSkeleton v-if="isLoading" type="detail" class="p-4" />
    <AppErrorState v-else-if="hasError" :message="apiErrorMessage" @retry="retry" />
    <div class="views-page-content-box" v-else-if="knowledge">

      <!-- Header -->
      <div class="page-banner">
        <AppBreadcrumb />
        <div class="banner-title">{{ activeVer?.title ?? knowledge.title }}</div>
      </div>

      <div class="views-page-header">
        <span class="category-tag">{{ knowledge.category }}</span>
        <div class="header-right-box">
          <!-- 狀態別動作按鈕 -->
          <template v-if="knowledge.status === 'active'">
            <button class="custom-btn custom-main-btn" @click="isCreateVersionOpen = true">
              <i class="material-symbols-outlined">add_box</i>建立新版本
            </button>
          </template>
          <template v-else-if="knowledge.status === 'reviewing'">
            <button class="custom-btn ml-2" @click="handleWithdraw">
              <i class="material-symbols-outlined">undo</i>撤回審核
            </button>
            <button class="custom-btn custom-main-btn ml-2" @click="isReviewDrawerOpen = true">
              <i class="material-symbols-outlined">rate_review</i>開始審核
            </button>
          </template>
          <template v-else-if="knowledge.status === 'draft' || knowledge.status === 'rejected'">
            <button class="custom-btn custom-main-btn" @click="goToEditor">
              <i class="material-symbols-outlined">edit</i>繼續編輯草稿
            </button>
          </template>
          <template v-else-if="knowledge.status === 'needs_update' || knowledge.status === 'failed'">
            <button class="custom-btn custom-main-btn" @click="knowledgeStore.retriggerPipeline(props.id)">
              <i class="material-symbols-outlined">refresh</i>重新觸發 Pipeline
            </button>
          </template>
          <template v-else-if="knowledge.status === 'processing' || knowledge.status === 'pending'">
            <span class="fc-grey-1 fs-13">
              <i class="material-symbols-outlined fs-16" style="vertical-align:middle;">sync</i>
              處理中，請稍候
            </span>
          </template>
        </div>
      </div>

      <!-- 4 Tabs -->
      <div class="detail-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['detail-tab-btn', { 'is-active': activeTabKey === tab.key }]"
          @click="activeTabKey = tab.key"
        >{{ tab.label }}</button>
      </div>

      <!-- Tab 1: 概覽 -->
      <div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'overview' }]">
        <div class="detail-overview-grid">
          <!-- 左：內容預覽 -->
          <div>
            <div class="content-preview">
              <div class="article-title">{{ activeVer?.title }}</div>
              <div class="article-meta">
                <span class="fc-grey-1">摘要：{{ activeVer?.summary || '（無摘要）' }}</span>
              </div>
              <div class="article-body">
                <div class="markdown-body" v-html="renderedContent"></div>
              </div>
            </div>
            <!-- 來源附件 -->
            <div class="mt-4 pt-4 border-top">
              <h6 class="fs-14 fw-600 mb-2">
                <i class="material-symbols-outlined fs-16 mr-1" style="vertical-align:middle;">attachment</i>
                來源附件
              </h6>
              <div class="d-flex flex-wrap gap-2" v-if="activeVer?.sourceFiles?.length">
                <div
                  v-for="f in activeVer.sourceFiles"
                  :key="f.fileId"
                  class="category-tag d-flex align-items-center px-3 py-2 fs-13"
                  style="border-radius:8px;cursor:pointer;"
                >
                  <i class="material-symbols-outlined fs-15 mr-1">description</i>
                  {{ f.fileName }}
                </div>
              </div>
              <div v-else class="fc-grey-1 fs-13">尚未關聯任何來源檔案</div>
            </div>
          </div>

          <!-- 右：Meta 卡片 -->
          <div class="d-flex flex-column gap-3">
            <!-- 版本資訊 -->
            <div class="detail-header-card">
              <div class="info-label mb-2">版本資訊</div>
              <div class="d-flex gap-2 align-items-center mb-2">
                <span class="version-badge" :class="{ major: activeVer?.versionNumber?.endsWith('.0') }">
                  {{ activeVer?.versionNumber }}
                </span>
                <span :class="['status-badge', `status-badge--${activeVer?.status}`]">
                  {{ statusLabelMap[activeVer?.status ?? ''] }}
                </span>
                <span v-if="activeVer?.versionType" class="tag-chip">{{ activeVer.versionType }}</span>
              </div>
              <div class="fc-grey-1 fs-13">最後更新：{{ activeVer?.lastUpdateTime }}</div>
              <div class="fc-grey-1 fs-13">更新人：{{ activeVer?.lastUpdateBy }}</div>
              <div v-if="activeVer?.updateNote" class="fc-grey-1 fs-13 mt-1">{{ activeVer.updateNote }}</div>
            </div>
            <!-- 標籤 -->
            <div class="detail-header-card">
              <div class="info-label mb-2">標籤</div>
              <div class="d-flex flex-wrap gap-1">
                <span
                  v-for="tag in activeVer?.tags"
                  :key="tag"
                  :class="['tag-chip', { 'tag-chip--system': activeVer?.systemTags?.includes(tag) }]"
                >
                  <i v-if="activeVer?.systemTags?.includes(tag)" class="material-symbols-outlined fs-11 mr-1">smart_toy</i>
                  {{ tag }}
                </span>
                <span v-if="!activeVer?.tags?.length" class="fc-grey-1 fs-13">無標籤</span>
              </div>
              <div v-if="activeVer?.systemTags?.length" class="fc-grey-1 fs-11 mt-1">綠色為系統自動標記</div>
            </div>
            <!-- Pipeline 狀態 -->
            <div class="detail-header-card">
              <div class="info-label mb-2">Pipeline 狀態</div>
              <template v-if="knowledge.status === 'processing'">
                <div class="pipeline-progress-wrap mb-2">
                  <div class="pipeline-progress-bar" style="width:100px;">
                    <div class="pipeline-progress-fill" :style="{ width: knowledge.pipelineProgress + '%' }"></div>
                  </div>
                  <span class="pipeline-stage-label">{{ knowledge.pipelineStage }} {{ knowledge.pipelineProgress }}%</span>
                </div>
              </template>
              <template v-else>
                <div class="pipeline-stages">
                  <span :class="['pipeline-stage-badge', 'is-done']">✓ chunking</span>
                  <span :class="['pipeline-stage-badge', 'is-done']">✓ embedding</span>
                  <span :class="['pipeline-stage-badge', 'is-done']">✓ indexing</span>
                </div>
              </template>
              <div v-if="knowledge.pipelineError" class="fc-danger fs-12 mt-2">
                {{ knowledge.pipelineError }}
              </div>
            </div>
            <!-- 分類 -->
            <div class="detail-header-card">
              <div class="info-label mb-1">分類</div>
              <div>{{ knowledge.category }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 2: 版本歷程 -->
      <div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'history' }]">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="fc-grey-1 fs-13">共 {{ knowledge.versions.length }} 個版本</div>
        </div>
        <div class="version-timeline">
          <div
            v-for="(ver, idx) in [...knowledge.versions].reverse()"
            :key="ver.id"
            class="version-timeline-item"
          >
            <div class="version-timeline-node">
              <div :class="['node-dot', { 'is-active': ver.status === 'active' }]"></div>
              <div v-if="idx < knowledge.versions.length - 1" class="node-line"></div>
            </div>
            <div class="version-timeline-body">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <div class="d-flex gap-2 align-items-center">
                  <span class="fw-600 fs-14">{{ ver.versionNumber }}</span>
                  <span :class="['status-badge', `status-badge--${ver.status}`]">{{ statusLabelMap[ver.status] }}</span>
                  <span v-if="ver.versionType" class="tag-chip">{{ ver.versionType }}</span>
                </div>
                <span class="fc-grey-1 fs-13">{{ ver.lastUpdateTime }}</span>
              </div>
              <div class="fc-grey-1 fs-13">{{ ver.updateNote }} ・ {{ ver.lastUpdateBy }}</div>
              <div v-if="ver.status === 'history'" class="d-flex gap-2 mt-2">
                <button class="custom-btn fs-12 py-1 px-2" @click="openRestore(ver.id)">
                  <i class="material-symbols-outlined fs-14">restore</i>還原為草稿
                </button>
                <button class="custom-btn fs-12 py-1 px-2" @click="openCompare(ver.id)">
                  <i class="material-symbols-outlined fs-14">compare</i>與目前版比較
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 3: 分段預覽 -->
      <div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'chunks' }]">
        <template v-if="activeVer?.chunks?.length">
          <div class="fc-grey-1 fs-13 mb-3">共 {{ activeVer.chunks.length }} 個 Chunk</div>
          <div
            v-for="chunk in activeVer.chunks"
            :key="chunk.index"
            class="chunk-card"
          >
            <div class="chunk-header">
              Chunk #{{ chunk.index }}
              <span class="chunk-token">tokens: {{ chunk.tokenCount }}</span>
            </div>
            <div class="chunk-content">{{ chunk.content }}</div>
          </div>
        </template>
        <div v-else class="fc-grey-1 fs-13 text-center py-4">尚無分段資料（Pipeline 尚未完成或無內容）</div>
      </div>

      <!-- Tab 4: 轉換結果 -->
      <div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'embedding' }]">
        <template v-if="activeVer?.embeddingModel">
          <div class="detail-header-card" style="max-width:480px;">
            <div class="info-label mb-3">Embedding 向量化狀態</div>
            <div class="d-flex justify-content-between mb-2">
              <span class="fc-grey-1">向量化狀態</span>
              <span class="status-badge status-badge--active">完成</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span class="fc-grey-1">Embedding 模型</span>
              <span>{{ activeVer.embeddingModel }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span class="fc-grey-1">向量維度</span>
              <span>{{ activeVer.embeddingDimension }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span class="fc-grey-1">已向量化 Chunks</span>
              <span>{{ activeVer.embeddingCount }} / {{ activeVer.chunks.length || activeVer.embeddingCount }}</span>
            </div>
            <div class="d-flex justify-content-between">
              <span class="fc-grey-1">最後更新</span>
              <span>{{ activeVer.lastUpdateTime }}</span>
            </div>
          </div>
        </template>
        <div v-else class="fc-grey-1 fs-13 text-center py-4">尚無向量化資料</div>
      </div>

    </div>

    <!-- 查無資料 -->
    <div class="views-page-content-box text-center p-5" v-else>
      <h4>找不到該知識條目</h4>
      <button class="custom-btn mt-3" @click="router.push({ name: 'KnowledgeBase' })">返回列表</button>
    </div>

    <!-- 建立新版本 Modal -->
    <CreateVersionModal v-model="isCreateVersionOpen" @confirm="handleCreateVersion" />

    <!-- 還原舊版 Modal -->
    <RestoreVersionModal
      v-model="isRestoreOpen"
      :versionNumber="restoreTargetNum"
      @confirm="confirmRestore"
    />

    <!-- 版本差異比較 Modal -->
    <VersionCompareModal
      v-model="isCompareOpen"
      :knowledgeId="props.id"
      :v1Id="compareV1Id"
      :v2Id="compareV2Id"
    />

    <!-- 審核 Drawer -->
    <ReviewDrawer
      v-model="isReviewDrawerOpen"
      :knowledgeId="props.id"
      :versionId="reviewVersionId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import MarkdownIt from 'markdown-it'
import 'github-markdown-css/github-markdown.css'
import { useKnowledgeStore } from '@/stores/knowledgeStore'
import { useBreadcrumb } from '@/composables/useBreadcrumb'
import { useApiCall } from '@/composables/useApiCall'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'
import AppErrorState from '@/components/AppErrorState.vue'
import CreateVersionModal from '@/components/Knowledge/CreateVersionModal.vue'
import RestoreVersionModal from '@/components/Knowledge/RestoreVersionModal.vue'
import VersionCompareModal from '@/components/Knowledge/VersionCompareModal.vue'
import ReviewDrawer from '@/components/Knowledge/ReviewDrawer.vue'
import popDialog from '@/services/popDialog'

const props = defineProps<{ id: string }>()
const router = useRouter()
const knowledgeStore = useKnowledgeStore()
const md = new MarkdownIt({ html: false, breaks: true, linkify: false })

const {
  data: knowledgeData,
  isLoading,
  hasError,
  errorMessage: apiErrorMessage,
  retry,
} = useApiCall(() => knowledgeStore.getKnowledgeById(props.id))

const knowledge = computed(() => knowledgeData.value ?? null)

const activeVer = computed(() => {
  if (!knowledge.value) return null
  return knowledge.value.versions.find(v => v.status === 'active')
    ?? knowledge.value.versions[knowledge.value.versions.length - 1]
})

const renderedContent = computed(() => {
  const c = activeVer.value?.content
  if (!c) return '<span style="color:#999">（此版本無內容）</span>'
  return md.render(c)
})

// ── Tabs ──
const tabs = [
  { key: 'overview', label: '概覽' },
  { key: 'history', label: '版本歷程' },
  { key: 'chunks', label: '分段預覽' },
  { key: 'embedding', label: '轉換結果' },
]
const activeTabKey = ref('overview')

// ── Breadcrumb ──
const { setDynamic } = useBreadcrumb()
watch(activeVer, (val) => { if (val?.title) setDynamic(val.title) }, { immediate: true })

// ── Status maps ──
const statusLabelMap: Record<string, string> = {
  active: '已發布', processing: '處理中', reviewing: '審核中',
  needs_update: '需更新', pending: '待處理', failed: '失敗',
  archived: '已封存', draft: '草稿', history: '歷史版本', rejected: '已退回',
}

// ── 建立新版本 ──
const isCreateVersionOpen = ref(false)

function handleCreateVersion(data: { type: 'MINOR' | 'MAJOR', note: string }) {
  const newId = knowledgeStore.createDraftFromPublished(props.id, data.type, data.note)
  if (newId) {
    router.push({ name: 'KnowledgeEditor', params: { knowledgeId: props.id, versionId: newId } })
  }
}

// ── 繼續編輯草稿 ──
function goToEditor() {
  const draft = knowledge.value?.versions.find(v => v.status === 'draft' || v.status === 'rejected')
  if (draft) router.push({ name: 'KnowledgeEditor', params: { knowledgeId: props.id, versionId: draft.id } })
}

// ── 撤回審核 ──
function handleWithdraw() {
  const v = knowledge.value?.versions.find(ver => ver.status === 'reviewing')
  if (!v) return
  popDialog.confirm('確定要撤回此審核申請嗎？', () => {
    knowledgeStore.withdrawReview(props.id, v.id)
    popDialog.toast('已撤回審核', 2000)
  })
}

// ── 審核 ──
const isReviewDrawerOpen = ref(false)
const reviewVersionId = computed(
  () => knowledge.value?.versions.find(v => v.status === 'reviewing')?.id ?? ''
)

// ── 還原舊版 ──
const isRestoreOpen = ref(false)
const restoreTargetNum = ref('')
const restoreTargetId = ref('')

function openRestore(versionId: string) {
  const v = knowledge.value?.versions.find(ver => ver.id === versionId)
  if (!v) return
  restoreTargetNum.value = v.versionNumber
  restoreTargetId.value = versionId
  isRestoreOpen.value = true
}

function confirmRestore(note: string) {
  const newDraftId = knowledgeStore.restoreToDraft(props.id, restoreTargetId.value, note)
  if (newDraftId) {
    isRestoreOpen.value = false
    router.push({ name: 'KnowledgeEditor', params: { knowledgeId: props.id, versionId: newDraftId } })
      .then(() => popDialog.alert('已建立還原草稿，請繼續編輯。'))
  }
}

// ── 版本比較 ──
const isCompareOpen = ref(false)
const compareV1Id = ref('')
const compareV2Id = ref('')

function openCompare(versionId: string) {
  const versions = knowledge.value?.versions ?? []
  const idx = versions.findIndex(v => v.id === versionId)
  const activeIdx = versions.findIndex(v => v.status === 'active')
  if (activeIdx === -1 || idx === -1) return
  compareV1Id.value = versions[idx].id
  compareV2Id.value = versions[activeIdx].id
  isCompareOpen.value = true
}
</script>
```

- [ ] **Step 2: 手動驗證**

進入任意知識條目詳情頁：
- [ ] 4 個 Tab 可正常切換
- [ ] 概覽 Tab 左側顯示 Markdown 內容，右側顯示版本/標籤/Pipeline/分類卡
- [ ] 版本歷程 Tab 顯示時間軸，history 版本有操作按鈕
- [ ] 分段預覽 Tab 顯示 chunks（k1 有資料）
- [ ] 轉換結果 Tab 顯示 embedding 統計

- [ ] **Step 3: 刪除 VersionHistoryDrawer.vue**

```bash
rm src/components/Knowledge/VersionHistoryDrawer.vue
```

確認 `KnowledgeBase.vue` 和 `KnowledgeDetail.vue` 均已不再 import 此元件。

- [ ] **Step 4: Commit**

```bash
git add src/views/KnowledgeDetail.vue src/components/Knowledge/VersionHistoryDrawer.vue
git commit -m "feat: rewrite KnowledgeDetail with 4-tab layout, remove VersionHistoryDrawer"
```

---

## Task 7: 重寫 CreateKnowledgeWizardModal.vue（Upload-first）

**Files:**
- Modify: `src/components/Knowledge/CreateKnowledgeWizardModal.vue`

- [ ] **Step 1: 完整替換 CreateKnowledgeWizardModal.vue**

```vue
<template>
  <compModal
    class="CreateKnowledgeWizardModal"
    v-model="isOpenModal"
    :width="560"
  >
    <template #title>建立知識條目</template>

    <div class="wizard-modal-body">
      <!-- 來源類型選擇 -->
      <div class="source-type-row mb-4">
        <div
          v-for="t in sourceTypes"
          :key="t.value"
          :class="['source-type-card', { 'is-active': selectedSourceType === t.value }]"
          @click="selectedSourceType = t.value"
        >
          <i class="material-symbols-outlined fs-24 mb-1">{{ t.icon }}</i>
          <div class="fs-12 fw-600">{{ t.label }}</div>
          <div class="fs-11 fc-grey-1">{{ t.desc }}</div>
        </div>
      </div>

      <!-- FILE: 上傳區 -->
      <template v-if="selectedSourceType === 'FILE'">
        <div
          class="upload-dropzone mb-3"
          :class="{ 'has-file': uploadedFile }"
          @dragover.prevent
          @drop.prevent="handleDrop"
          @click="fileInputRef?.click()"
        >
          <template v-if="!uploadedFile">
            <i class="material-symbols-outlined fs-32 mb-2" style="color:#93c5fd;">cloud_upload</i>
            <div class="fs-13 fw-500" style="color:#2563eb;">拖曳檔案至此或點擊選取</div>
            <div class="fs-12 fc-grey-1 mt-1">支援 PDF、DOCX、XLSX，最大 50MB</div>
          </template>
          <template v-else>
            <i class="material-symbols-outlined fs-28 mb-1" style="color:#16a34a;">task_alt</i>
            <div class="fs-13 fw-600">{{ uploadedFile.name }}</div>
            <div class="fs-12 fc-grey-1 mt-1">{{ (uploadedFile.size / 1024).toFixed(0) }} KB</div>
            <button class="fs-11 fc-grey-1 mt-2" style="background:none;border:none;cursor:pointer;text-decoration:underline;" @click.stop="uploadedFile = null">更換檔案</button>
          </template>
        </div>
        <input ref="fileInputRef" type="file" accept=".pdf,.docx,.xlsx" style="display:none;" @change="handleFileSelect" />
      </template>

      <!-- API: 選來源 -->
      <template v-else-if="selectedSourceType === 'API'">
        <div class="mb-3">
          <label class="form-label">API 來源 <span style="color:#dc2626;">*</span></label>
          <select v-model="selectedApiSourceId" class="custom-input w-100">
            <option value="">選擇已設定的 API 來源...</option>
            <option v-for="s in apiSources" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
      </template>

      <!-- MANUAL: 標題輸入 -->
      <template v-else-if="selectedSourceType === 'MANUAL'">
        <div class="mb-3">
          <label class="form-label">標題 <span style="color:#dc2626;">*</span></label>
          <input v-model="manualTitle" class="custom-input w-100" placeholder="輸入知識條目標題" />
        </div>
      </template>

      <!-- 共用：分類 + 標籤 -->
      <div class="mb-3">
        <label class="form-label">分類 <span style="color:#dc2626;">*</span></label>
        <select v-model="selectedCategory" class="custom-input w-100">
          <option value="">選擇分類...</option>
          <option v-for="c in categoryOptions" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>

      <div class="mb-4">
        <label class="form-label">標籤（選填）</label>
        <div class="tags-input-wrap">
          <span
            v-for="tag in selectedTags"
            :key="tag"
            class="tag-chip"
          >
            {{ tag }}
            <i class="material-symbols-outlined fs-13 cursor-pointer ml-1" @click="removeTag(tag)">close</i>
          </span>
          <input
            v-model="tagInput"
            class="tags-input-field"
            placeholder="輸入後按 Enter 新增"
            @keydown.enter.prevent="addTag"
          />
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="d-flex justify-content-end gap-2">
        <button class="custom-btn" @click="isOpenModal = false">取消</button>
        <button
          class="custom-btn custom-main-btn"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          <i class="material-symbols-outlined">{{ selectedSourceType === 'MANUAL' ? 'edit' : 'upload' }}</i>
          {{ selectedSourceType === 'MANUAL' ? '建立草稿並編輯' : '上傳並開始處理' }}
        </button>
      </div>
    </div>
  </compModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useKnowledgeStore } from '@/stores/knowledgeStore'
import type { SourceType } from '@/stores/knowledgeStore'
import popDialog from '@/services/popDialog'

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'created', knowledgeId: string): void
}>()
const props = defineProps<{ modelValue: boolean }>()

const isOpenModal = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const router = useRouter()
const knowledgeStore = useKnowledgeStore()
const { knowledgeList, apiSources } = storeToRefs(knowledgeStore)

// ── 來源類型 ──
const sourceTypes = [
  { value: 'FILE' as SourceType, label: '上傳檔案', icon: 'upload_file', desc: 'PDF、Word、Excel' },
  { value: 'API' as SourceType,  label: 'API 來源',  icon: 'api',         desc: '連接外部系統' },
  { value: 'MANUAL' as SourceType, label: '直接編輯', icon: 'edit_note',   desc: '手動撰寫內容' },
]
const selectedSourceType = ref<SourceType>('FILE')

// ── FILE ──
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadedFile = ref<File | null>(null)

function handleDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0]
  if (file) uploadedFile.value = file
}

function handleFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) uploadedFile.value = file
}

// ── API ──
const selectedApiSourceId = ref('')

// ── MANUAL ──
const manualTitle = ref('')

// ── 共用 ──
const selectedCategory = ref('')
const categoryOptions = computed(() => [...new Set(knowledgeList.value.map(k => k.category))])

const selectedTags = ref<string[]>([])
const tagInput = ref('')

function addTag() {
  const t = tagInput.value.trim()
  if (t && !selectedTags.value.includes(t)) selectedTags.value.push(t)
  tagInput.value = ''
}

function removeTag(tag: string) {
  selectedTags.value = selectedTags.value.filter(t => t !== tag)
}

const canSubmit = computed(() => {
  if (!selectedCategory.value) return false
  if (selectedSourceType.value === 'FILE') return !!uploadedFile.value
  if (selectedSourceType.value === 'API') return !!selectedApiSourceId.value
  if (selectedSourceType.value === 'MANUAL') return !!manualTitle.value.trim()
  return false
})

// ── 送出 ──
function handleSubmit() {
  if (!canSubmit.value) return

  if (selectedSourceType.value === 'MANUAL') {
    const { knowledgeId, versionId } = knowledgeStore.createManualDraft({
      title: manualTitle.value.trim(),
      category: selectedCategory.value,
      tags: selectedTags.value,
    })
    isOpenModal.value = false
    router.push({ name: 'KnowledgeEditor', params: { knowledgeId, versionId } })
    return
  }

  if (selectedSourceType.value === 'FILE') {
    const id = knowledgeStore.createFromUpload({
      fileName: uploadedFile.value!.name,
      category: selectedCategory.value,
      tags: selectedTags.value,
    })
    isOpenModal.value = false
    emit('created', id)
    popDialog.toast('上傳成功，Pipeline 處理中…', 3000)

    // 模擬 pipeline 進度（實際應接 WebSocket / polling）
    simulatePipeline(id)
    return
  }

  if (selectedSourceType.value === 'API') {
    const source = apiSources.value.find(s => s.id === selectedApiSourceId.value)
    if (!source) return
    const id = knowledgeStore.createKnowledgeFromApiSource({
      apiSourceId: source.id,
      apiSourceName: source.name,
      name: source.name,
      category: selectedCategory.value,
    })
    isOpenModal.value = false
    emit('created', id)
    popDialog.toast('API 來源已建立，Pipeline 處理中…', 3000)
    simulatePipeline(id)
  }
}

function simulatePipeline(id: string) {
  const stages: Array<{ stage: 'chunking' | 'embedding' | 'indexing'; duration: number }> = [
    { stage: 'chunking', duration: 1500 },
    { stage: 'embedding', duration: 2000 },
    { stage: 'indexing', duration: 1000 },
  ]

  let elapsed = 0
  stages.forEach(({ stage, duration }) => {
    setTimeout(() => knowledgeStore.updatePipelineProgress(id, stage, Math.round((elapsed / 4500) * 100)), elapsed)
    elapsed += duration
  })

  setTimeout(() => {
    knowledgeStore.markPipelineDone(id, [
      { index: 1, content: '（Pipeline 完成，實際分段由後端提供）', tokenCount: 0 },
    ])
    popDialog.toast('Pipeline 處理完成！可前往編輯草稿', 3000)
  }, elapsed)
}
</script>
```

- [ ] **Step 2: 手動驗證**

- [ ] 點「+ 新增知識」→ Modal 開啟，三種來源類型可切換
- [ ] FILE 模式：拖曳/選擇檔案，填分類後點送出 → Modal 關閉，列表出現 processing 列 + 進度條
- [ ] MANUAL 模式：填標題 + 分類後送出 → 直接導到 Editor

- [ ] **Step 3: Commit**

```bash
git add src/components/Knowledge/CreateKnowledgeWizardModal.vue
git commit -m "feat: rewrite CreateKnowledgeWizardModal to upload-first flow with pipeline simulation"
```

---

## Task 8: 清理 & 全面驗證

**Files:**
- Modify: `src/scss/views/_KnowledgeBase.scss` （移除廢棄舊 class）

- [ ] **Step 1: 移除廢棄的舊 status badge class**

在 `_KnowledgeBase.scss` 搜尋並刪除以下 class（已被小寫版本取代）：
- `.status-badge--PUBLISHED`
- `.status-badge--REVIEWING`
- `.status-badge--DRAFT`
- `.status-badge--HISTORY`
- `.status-badge--REJECTED`

- [ ] **Step 2: 執行型別檢查**

```bash
npm run type-check
```

Expected: 無 TypeScript 錯誤

- [ ] **Step 3: 執行全部測試**

```bash
npm run test:unit
```

Expected: 全部 PASS

- [ ] **Step 4: 手動 E2E 驗證清單**

```bash
npm run dev
```

- [ ] 列表頁：5 張統計卡數字正確
- [ ] 列表頁：k3（processing）顯示進度條
- [ ] 列表頁：k4（needs_update）列帶黃底 + 「來源已更新」badge
- [ ] 列表頁：勾選多列後批次工具列出現
- [ ] 詳情頁：4 Tab 切換正常
- [ ] 詳情頁：Tab 2 版本歷程顯示時間軸
- [ ] 詳情頁：Tab 3 k1 顯示 chunk 卡片
- [ ] 新增知識：FILE 路徑模擬 pipeline 進度完成後 toast 出現
- [ ] 新增知識：MANUAL 路徑直接導到 Editor

- [ ] **Step 5: Final commit**

```bash
git add src/scss/views/_KnowledgeBase.scss
git commit -m "style: remove deprecated uppercase status badge classes"
```
