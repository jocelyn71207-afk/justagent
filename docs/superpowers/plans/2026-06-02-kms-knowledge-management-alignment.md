# KMS 知識管理 PRD 對齊 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 對齊 PRD v1.2 § 5.2，補齊 5 項落差：MANUAL 輕量 Pipeline、知識轉換率 KPI、操作選單缺口、詳情頁分段預覽/轉換結果 Tab、SharePoint 4 步驟精靈。

**Architecture:** 採用 Store 先行策略——Task 1 擴充 `knowledgeStore.ts` 的型別與 Mock 資料後，後續 Tasks 各自修改 view 和新建元件，依賴方向單向向下。所有新元件以 props/emit 介面清楚隔離，不直接讀 store。

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Pinia, Vitest, Material Symbols Outlined icons, SCSS（`@import` 加入 `_index.scss`）

---

## 檔案異動總表

| 檔案 | 操作 |
|------|------|
| `src/stores/knowledgeStore.ts` | 修改 |
| `src/stores/__tests__/knowledgeStore.pipeline.test.ts` | 修改（新增測試） |
| `src/views/KnowledgeBase.vue` | 修改 |
| `src/views/KnowledgeDetail.vue` | 修改 |
| `src/components/Knowledge/DataSourceTab.vue` | 修改 |
| `src/components/Knowledge/ErrorLogModal.vue` | 新增 |
| `src/components/Knowledge/ChunkCard.vue` | 新增 |
| `src/components/Knowledge/ChunkPreviewTab.vue` | 新增 |
| `src/components/Knowledge/ConversionLogTab.vue` | 新增 |
| `src/components/Knowledge/SharePointWizardModal.vue` | 新增 |
| `src/scss/components/_ChunkCard.scss` | 新增 |
| `src/scss/components/_SharePointWizardModal.scss` | 新增 |
| `src/scss/components/_index.scss` | 修改（@import 兩個新檔） |
| `src/scss/views/_KnowledgeBase.scss` | 修改（新增 KPI 卡片樣式） |

---

## Task 1：Store 型別擴充、Mock 資料、新 Actions

**Files:**
- Modify: `src/stores/knowledgeStore.ts`
- Modify: `src/stores/__tests__/knowledgeStore.pipeline.test.ts`

---

- [ ] **Step 1.1：擴充 `ChunkPreview` 介面（新欄位全部 optional，保持向下相容）**

在 `knowledgeStore.ts`，找到現有 `ChunkPreview` 介面，替換為：

```ts
export interface ChunkPreview {
  index: number
  sectionPath?: string       // 如「第二章 > 2.1 節 申請流程」
  content: string
  tokenCount: number
  gist?: string              // AI 生成摘要
  qaPairs?: string[]         // 建議問答，最多 5 題
  taxonomyTags?: string[]    // 分類路徑標籤
  citationCount?: number     // 被引用次數
}
```

- [ ] **Step 1.2：新增 `ConversionStep` 介面（緊接 `ChunkPreview` 後方）**

```ts
export interface ConversionStep {
  stage: 'chunking' | 'embedding' | 'indexing'
  status: 'success' | 'failed' | 'skipped'
  startedAt: string
  durationMs: number
  detail: Record<string, string | number>
  errorMessage?: string
}
```

- [ ] **Step 1.3：在 `KnowledgeVersion` 介面新增 `conversionLog` 欄位**

找到 `KnowledgeVersion` 介面，在 `reviewHistory?: ReviewRecord[]` 之後加入：

```ts
conversionLog: ConversionStep[]
```

- [ ] **Step 1.4：新增 `SHAREPOINT` 至 `SourceType`**

```ts
export type SourceType = 'FILE' | 'API' | 'MANUAL' | 'JUSTKA' | 'SHAREPOINT'
```

- [ ] **Step 1.5：更新 mock 資料——補 `conversionLog: []` 至所有現有版本**

在所有版本物件中加入 `conversionLog: []`（5 個版本：k1-v1.0、k2-v2.0、k3-v1.0、k4-v1.3、k5-v3.0）。

以 k1-v1.0 為例，在 `embeddingCount: 5,` 後方加入：
```ts
conversionLog: [],
```

對以下 5 個版本 id 全部加上相同的 `conversionLog: []`：
- `k1-v1.0`（history 版）
- `k2-v2.0`（reviewing）
- `k3-v1.0`（draft）

- [ ] **Step 1.6：擴充 k1-v1.2 的 chunks（補齊新欄位）並新增 conversionLog**

找到 `id: 'k1-v1.2'` 的版本，將 `chunks` 替換為：

```ts
chunks: [
  {
    index: 1,
    sectionPath: '商品資料 > UGG 鞋款庫存',
    content: 'UGG 鞋款庫存資料整理，包含 2025 年秋冬新款型號、配色與庫存數量說明，TV 系列為主力推廣款式。',
    tokenCount: 312,
    gist: '本段整理 2025 年 UGG 秋冬款鞋類庫存資料，含型號、配色及庫存數量。',
    qaPairs: [
      'UGG 2025 秋冬款有哪些型號？',
      '各型號庫存數量如何查詢？',
      'TV 系列與一般系列的差異為何？',
      '庫存不足時如何補貨？',
      '哪些配色是本季主打？',
    ],
    taxonomyTags: ['商品文件/庫存管理/鞋類'],
    citationCount: 12,
  },
  {
    index: 2,
    sectionPath: '商品資料 > 冬季款明細',
    content: 'TV4038BKBR 冬季款詳細規格，含尺寸範圍 US5–11、建議售價 NT$6,800 與安全庫存量設定標準。',
    tokenCount: 287,
    gist: 'TV4038BKBR 冬季款規格說明，含尺寸、售價與庫存設定標準。',
    qaPairs: [
      'TV4038BKBR 的尺寸範圍是多少？',
      '建議售價如何設定？',
      '安全庫存量標準為何？',
      '此款與其他冬季款的差異？',
      '如何申請補貨？',
    ],
    taxonomyTags: ['商品文件/庫存管理/冬季款'],
    citationCount: 7,
  },
  {
    index: 3,
    sectionPath: '商品資料 > Q3 選品說明',
    content: 'Q3 選品策略以秋冬轉換期熱銷品項為主，重點布局 UGG 經典款與新色系，建議備貨量較 Q2 增加 30%。',
    tokenCount: 345,
    gist: 'Q3 選品以秋冬轉換期熱銷品項為主，說明選品策略與重點商品備貨建議。',
    qaPairs: [
      'Q3 主推商品有哪些？',
      '選品策略如何制定？',
      '秋冬轉換期間如何備貨？',
      '哪些品項預計促銷？',
      'Q4 選品預覽有哪些資訊？',
    ],
    taxonomyTags: ['商品文件/選品策略/季節商品'],
    citationCount: 4,
  },
],
conversionLog: [
  {
    stage: 'chunking',
    status: 'success',
    startedAt: '2026-08-13 10:20',
    durationMs: 3200,
    detail: { strategy: 'Section-aware', chunkCount: 3, avgTokens: 315, imageCount: 0, tableCount: 1, sourceFormat: 'XLSX' },
  },
  {
    stage: 'embedding',
    status: 'success',
    startedAt: '2026-08-13 10:20',
    durationMs: 8700,
    detail: { model: 'BAAI/bge-m3', dimension: 1024, denseCount: 3, sparseCount: 3, batchSize: 32 },
  },
  {
    stage: 'indexing',
    status: 'success',
    startedAt: '2026-08-13 10:21',
    durationMs: 400,
    detail: { collection: 'knowledge_chunks', pointCount: 3, indexType: 'HNSW' },
  },
],
```

（同時移除舊的 `embeddingModel`、`embeddingDimension`、`embeddingCount` 欄位如有需要保留原值則保留）

- [ ] **Step 1.7：擴充 k4-v1.3 的 chunks 並新增 conversionLog**

找到 `id: 'k4-v1.3'` 的版本，將 `chunks` 替換為：

```ts
chunks: [
  {
    index: 1,
    sectionPath: '申辦資格 > 基本條件',
    content: '申辦資格：年滿 20 歲，年收入 30 萬以上，需提供薪資證明或最近一年報稅資料，外籍人士另需居留證。',
    tokenCount: 198,
    gist: '說明信用卡申辦基本資格，包含年齡、收入門檻及所需文件。',
    qaPairs: [
      '信用卡申辦的年齡限制為何？',
      '申辦所需的最低年收入是多少？',
      '需要提供哪些證明文件？',
      '外籍人士可以申辦嗎？',
      '學生可以申辦哪種信用卡？',
    ],
    taxonomyTags: ['產品資訊/信用卡/申辦資格'],
    citationCount: 18,
  },
],
conversionLog: [
  {
    stage: 'chunking',
    status: 'success',
    startedAt: '2026-04-12 08:50',
    durationMs: 1800,
    detail: { strategy: 'Section-aware', chunkCount: 1, avgTokens: 198, imageCount: 0, tableCount: 0, sourceFormat: 'PDF' },
  },
  {
    stage: 'embedding',
    status: 'success',
    startedAt: '2026-04-12 08:50',
    durationMs: 2100,
    detail: { model: 'BAAI/bge-m3', dimension: 1024, denseCount: 1, sparseCount: 1, batchSize: 32 },
  },
  {
    stage: 'indexing',
    status: 'success',
    startedAt: '2026-04-12 08:50',
    durationMs: 200,
    detail: { collection: 'knowledge_chunks', pointCount: 1, indexType: 'HNSW' },
  },
],
```

- [ ] **Step 1.8：擴充 k5-v3.0（add chunks + conversionLog）**

找到 `id: 'k5-v3.0'` 的版本，將 `chunks: []` 替換為：

```ts
chunks: [
  {
    index: 1,
    sectionPath: '商品目錄 > 春夏選品',
    content: '2026 年春夏主打商品清單，共 11 款（8 款新品、3 款延續熱銷），附建議陳列方式與促銷時程。',
    tokenCount: 428,
    gist: '整理 2026 春夏主打商品 11 款，含新品、延續款及陳列建議。',
    qaPairs: [
      '2026 春夏新品有哪幾款？',
      '哪些是延續熱銷商品？',
      '建議陳列方式為何？',
      '春夏商品何時開始上架？',
      '售完是否會補貨？',
    ],
    taxonomyTags: ['商品文件/季節商品/春夏選品'],
    citationCount: 5,
  },
  {
    index: 2,
    sectionPath: '商品目錄 > 庫存狀態',
    content: '各品項庫存即時狀態，正常庫存（≥ 50 件）標示綠色，低庫存（< 20 件）標示黃色，售完標示紅色。',
    tokenCount: 356,
    gist: '說明庫存狀態標示規則與各品項目前庫存水位，協助客服即時回應詢問。',
    qaPairs: [
      '庫存狀態如何判讀？',
      '低庫存的定義是什麼？',
      '售完商品何時補貨？',
      '如何查詢特定商品庫存？',
      '庫存資料多久更新一次？',
    ],
    taxonomyTags: ['商品文件/庫存管理/即時狀態'],
    citationCount: 22,
  },
  {
    index: 3,
    sectionPath: '商品目錄 > 價格資訊',
    content: '各品項建議售價與進行中優惠活動彙整，特價商品標示活動期間及折扣幅度，會員另享 95 折優惠。',
    tokenCount: 389,
    gist: '彙整各品項建議售價及進行中優惠活動，含活動期間與折扣資訊。',
    qaPairs: [
      '目前有哪些優惠活動？',
      '特價商品如何辨識？',
      '折扣可以疊加嗎？',
      '建議售價是否含稅？',
      '會員與一般客戶的售價差異？',
    ],
    taxonomyTags: ['商品文件/價格管理/優惠活動'],
    citationCount: 9,
  },
],
conversionLog: [
  {
    stage: 'chunking',
    status: 'success',
    startedAt: '2026-04-12 08:55',
    durationMs: 4100,
    detail: { strategy: 'Section-aware', chunkCount: 3, avgTokens: 391, imageCount: 0, tableCount: 2, sourceFormat: 'API' },
  },
  {
    stage: 'embedding',
    status: 'success',
    startedAt: '2026-04-12 08:55',
    durationMs: 9300,
    detail: { model: 'BAAI/bge-m3', dimension: 1024, denseCount: 3, sparseCount: 3, batchSize: 32 },
  },
  {
    stage: 'indexing',
    status: 'success',
    startedAt: '2026-04-12 08:56',
    durationMs: 380,
    detail: { collection: 'knowledge_chunks', pointCount: 3, indexType: 'HNSW' },
  },
],
```

- [ ] **Step 1.9：新增 k6（failed 狀態的測試條目）**

在 `knowledgeList.value` 陣列最後，k5 之後，新增：

```ts
{
  id: 'k6',
  title: '外幣業務操作手冊 v2.0',
  category: '規則說明',
  status: 'failed',
  sourceType: 'FILE',
  pipelineProgress: 45,
  pipelineStage: 'embedding',
  pipelineError: 'EmbeddingError: CUDA out of memory. Tried to allocate 2.5 GiB\n(GPU 0; 24.0 GiB total capacity)\nat /opt/bge-m3/model.py:line 234\nRuntimeError: CUBLAS_STATUS_ALLOC_FAILED when calling cublasCreate(handle)',
  sourceStale: false,
  staleSourceFileIds: [],
  lastSyncAt: null,
  apiSourceId: null,
  apiSourceName: null,
  lastUpdateTime: '2026-05-30 03:15',
  lastUpdateBy: 'Pipeline',
  versions: [
    {
      id: 'k6-v2.0',
      knowledgeId: 'k6',
      versionNumber: 'v2.0',
      versionType: 'MAJOR' as VersionType,
      status: 'draft' as VersionStatus,
      title: '外幣業務操作手冊 v2.0',
      summary: '新版外幣業務操作手冊，涵蓋即期、遠期及換匯交易流程',
      content: '## 第一章 外幣業務概述\n\n本手冊適用於本行所有外幣業務人員...',
      tags: ['外幣', '業務手冊'],
      systemTags: ['規則說明'],
      lastUpdateBy: 'Pipeline',
      lastUpdateTime: '2026-05-30 03:15',
      updateNote: '大版本更新，重構章節結構',
      sourceFiles: [{ fileId: 'res-forex-1', fileName: '外幣業務操作手冊_2026v2.pdf', linkedVersion: 1 }],
      chunks: [],
      embeddingModel: null,
      embeddingDimension: null,
      embeddingCount: 0,
      conversionLog: [
        {
          stage: 'chunking',
          status: 'success',
          startedAt: '2026-05-30 03:10',
          durationMs: 5200,
          detail: { strategy: 'Section-aware', chunkCount: 18, avgTokens: 487, imageCount: 2, tableCount: 4, sourceFormat: 'PDF' },
        },
        {
          stage: 'embedding',
          status: 'failed',
          startedAt: '2026-05-30 03:11',
          durationMs: 0,
          detail: { model: 'BAAI/bge-m3', dimension: 1024 },
          errorMessage: 'EmbeddingError: CUDA out of memory. Tried to allocate 2.5 GiB\n(GPU 0; 24.0 GiB total capacity)\nat /opt/bge-m3/model.py:line 234\nRuntimeError: CUBLAS_STATUS_ALLOC_FAILED when calling cublasCreate(handle)',
        },
        {
          stage: 'indexing',
          status: 'skipped',
          startedAt: '2026-05-30 03:11',
          durationMs: 0,
          detail: {},
        },
      ],
    },
  ],
},
```

- [ ] **Step 1.10：新增 `ignoreUpdate` action**

在 `retriggerPipeline` function 之後，新增：

```ts
function ignoreUpdate(knowledgeId: string) {
  const k = getKnowledgeById(knowledgeId)
  if (!k || k.status !== 'needs_update') return
  k.status = 'active'
  k.sourceStale = false
}
```

- [ ] **Step 1.11：修改 `approveVersion`——MANUAL 路徑加輕量 Pipeline**

找到 `const approveVersion = (knowledgeId: string, versionId: string) => {` 這個函式，將結尾的：

```ts
    k.status = 'active';
    k.lastUpdateTime = now;
  };
```

替換為：

```ts
    if (k.sourceType === 'MANUAL') {
      k.status = 'processing'
      const processingStart = now
      setTimeout(() => {
        k.status = 'active'
        k.lastUpdateTime = new Date().toISOString().replace('T', ' ').slice(0, 16)
        v.conversionLog = [
          {
            stage: 'chunking',
            status: 'skipped',
            startedAt: processingStart,
            durationMs: 0,
            detail: {},
          },
          {
            stage: 'embedding',
            status: 'success',
            startedAt: processingStart,
            durationMs: 1200,
            detail: { model: 'BAAI/bge-m3', dimension: 1024, denseCount: 1, sparseCount: 1, batchSize: 32 },
          },
          {
            stage: 'indexing',
            status: 'success',
            startedAt: processingStart,
            durationMs: 200,
            detail: { collection: 'knowledge_chunks', pointCount: 1, indexType: 'HNSW' },
          },
        ]
      }, 2000)
    } else {
      k.status = 'active'
      k.lastUpdateTime = now
    }
  };
```

- [ ] **Step 1.12：新增 `createFromSharePoint` action**

在 `ignoreUpdate` 之後新增：

```ts
function createFromSharePoint(items: Array<{ title: string; category: string }>) {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16)
  for (const item of items) {
    const id = `sp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const versionId = `${id}-v1.0`
    knowledgeList.value.unshift({
      id,
      title: item.title,
      category: item.category,
      status: 'pending',
      sourceType: 'SHAREPOINT',
      pipelineProgress: 0,
      pipelineStage: null,
      pipelineError: null,
      sourceStale: false,
      staleSourceFileIds: [],
      lastSyncAt: now,
      apiSourceId: null,
      apiSourceName: 'SharePoint',
      lastUpdateTime: now,
      lastUpdateBy: 'SharePoint 同步',
      versions: [{
        id: versionId,
        knowledgeId: id,
        versionNumber: 'v1.0',
        versionType: null,
        status: 'draft',
        title: item.title,
        summary: '',
        content: '',
        tags: [],
        systemTags: [],
        lastUpdateBy: 'SharePoint 同步',
        lastUpdateTime: now,
        updateNote: 'SharePoint 自動匯入',
        sourceFiles: [],
        chunks: [],
        embeddingModel: null,
        embeddingDimension: null,
        embeddingCount: 0,
        conversionLog: [],
      }],
    })
  }
}
```

- [ ] **Step 1.13：更新 store `return` 區塊，暴露兩個新 action**

找到 `return {` 區塊，在 `retriggerPipeline,` 之後加入：

```ts
    ignoreUpdate,
    createFromSharePoint,
```

- [ ] **Step 1.14：執行型別檢查確認沒有編譯錯誤**

```bash
npm run type-check
```

預期：零錯誤。若有 `Argument of type '{ index: number; content: string; tokenCount: number; }' is not assignable` 錯誤，表示 `CreateKnowledgeWizardModal.vue` 的 `markPipelineDone` 呼叫不符。因為新欄位為 optional，這類錯誤應不會出現；若仍有錯誤，確認是否有其他地方用了舊格式的 chunk object，補上 optional 欄位。

- [ ] **Step 1.15：在 `knowledgeStore.pipeline.test.ts` 新增兩個測試**

在現有測試檔案底部新增：

```ts
describe('ignoreUpdate', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('needs_update 狀態轉為 active，並清除 sourceStale', () => {
    const store = useKnowledgeStore()
    const item = store.knowledgeList.find(k => k.status === 'needs_update')
    expect(item).toBeDefined()
    store.ignoreUpdate(item!.id)
    expect(item!.status).toBe('active')
    expect(item!.sourceStale).toBe(false)
  })

  it('非 needs_update 狀態不做任何變更', () => {
    const store = useKnowledgeStore()
    const item = store.knowledgeList.find(k => k.status === 'active')
    expect(item).toBeDefined()
    store.ignoreUpdate(item!.id)
    expect(item!.status).toBe('active')
  })
})

describe('approveVersion MANUAL 路徑', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('審核通過後先進入 processing，2 秒後變為 active', () => {
    const store = useKnowledgeStore()
    store.approveVersion('k2', 'k2-v2.0')
    const item = store.knowledgeList.find(k => k.id === 'k2')!
    expect(item.status).toBe('processing')
    vi.advanceTimersByTime(2000)
    expect(item.status).toBe('active')
  })

  it('2 秒後版本有 conversionLog（chunking=skipped, embedding=success, indexing=success）', () => {
    const store = useKnowledgeStore()
    store.approveVersion('k2', 'k2-v2.0')
    vi.advanceTimersByTime(2000)
    const ver = store.knowledgeList.find(k => k.id === 'k2')!.versions.find(v => v.id === 'k2-v2.0')!
    expect(ver.conversionLog).toHaveLength(3)
    expect(ver.conversionLog[0].stage).toBe('chunking')
    expect(ver.conversionLog[0].status).toBe('skipped')
    expect(ver.conversionLog[1].stage).toBe('embedding')
    expect(ver.conversionLog[1].status).toBe('success')
  })
})
```

- [ ] **Step 1.16：執行 pipeline 測試，確認全部通過**

```bash
npm run test:unit -- knowledgeStore.pipeline
```

預期：全部 PASS，無 FAIL。

- [ ] **Step 1.17：Commit**

```bash
git add src/stores/knowledgeStore.ts src/stores/__tests__/knowledgeStore.pipeline.test.ts
git commit -m "feat(store): add ConversionStep, expand ChunkPreview, add ignoreUpdate/createFromSharePoint, MANUAL pipeline path"
```

---

## Task 2：ErrorLogModal.vue（輕量 Modal）

**Files:**
- Create: `src/components/Knowledge/ErrorLogModal.vue`

---

- [ ] **Step 2.1：建立 `ErrorLogModal.vue`**

```vue
<!-- src/components/Knowledge/ErrorLogModal.vue -->
<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-backdrop" @click.self="emit('update:modelValue', false)">
      <div class="modal-box error-log-modal">
        <div class="modal-header">
          <span class="modal-title">錯誤紀錄</span>
          <button class="modal-close-btn" @click="emit('update:modelValue', false)">
            <i class="material-symbols-outlined">close</i>
          </button>
        </div>
        <div class="modal-body error-log-body">
          <pre v-if="errorMessage" class="error-log-pre">{{ errorMessage }}</pre>
          <p v-else class="fc-grey-1 fs-13">無錯誤資訊</p>
        </div>
        <div class="modal-footer">
          <button class="custom-btn" @click="emit('update:modelValue', false)">關閉</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
  errorMessage: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()
</script>
```

樣式附加到 `src/scss/views/_KnowledgeBase.scss`（在步驟 3.5 中新增）。

- [ ] **Step 2.2：Commit**

```bash
git add src/components/Knowledge/ErrorLogModal.vue
git commit -m "feat(knowledge): add ErrorLogModal component"
```

---

## Task 3：KnowledgeBase.vue 更新（Bento Grid KPI + 操作選單）

**Files:**
- Modify: `src/views/KnowledgeBase.vue`
- Modify: `src/scss/views/_KnowledgeBase.scss`

---

- [ ] **Step 3.1：在 `<script setup>` 頂部 import ErrorLogModal，並新增相關 refs**

找到 `import VersionCompareModal from '@/components/Knowledge/VersionCompareModal.vue'` 之後新增：

```ts
import ErrorLogModal from '@/components/Knowledge/ErrorLogModal.vue'
```

在 `const isCompareOpen = ref(false)` 之後新增：

```ts
const isErrorLogOpen = ref(false)
const errorLogMessage = ref<string | null>(null)

function openErrorLog(item: KnowledgeItem) {
  errorLogMessage.value = item.pipelineError
  isErrorLogOpen.value = true
}
```

- [ ] **Step 3.2：在 `<script setup>` 新增 `conversionRate` computed**

在 `const stats = computed(() => ({` 區塊之後，新增：

```ts
const conversionRate = computed(() => {
  const all = knowledgeList.value.filter(k => k.status !== 'archived')
  if (!all.length) return 0
  const active = all.filter(k => k.status === 'active').length
  return Math.round((active / all.length) * 1000) / 10
})
```

- [ ] **Step 3.3：替換第 5 張 Bento 卡片（處理中 → 知識轉換率）**

找到：

```html
          <div class="stat-card">
            <div class="stat-icon" style="background:#ede9fe;color:#7c3aed;"><i class="material-symbols-outlined">sync</i></div>
            <div><div class="stat-number" style="color:#7c3aed;">{{ stats.processing }}</div><div class="stat-label">處理中</div></div>
          </div>
```

替換為：

```html
          <div class="stat-card stat-card--kpi">
            <span class="kpi-badge">KPI</span>
            <div class="stat-icon stat-icon--kpi"><i class="material-symbols-outlined">insights</i></div>
            <div>
              <div class="stat-number stat-number--kpi">{{ conversionRate }}%</div>
              <div class="stat-label">知識轉換率</div>
              <div class="kpi-target">目標 ≥ 95%</div>
            </div>
            <div class="kpi-progress-bar">
              <div class="kpi-progress-fill" :style="{ width: conversionRate + '%' }"></div>
            </div>
          </div>
```

- [ ] **Step 3.4：更新操作選單——新增「下載原始檔案」、「忽略更新」、「查看錯誤紀錄」**

找到操作選單中的 `<div v-if="openOpsId === item.id" class="next-option-box ops-dropdown">` 區塊。

在 `<template v-if="item.status !== 'processing'">` 區塊（刪除按鈕）**之前**，新增「下載原始檔案」：

```html
                      <div class="option-item" @click="window.alert('下載：' + item.title + '.pdf'); closeOps()">
                        <i class="material-symbols-outlined">download</i>下載原始檔案
                      </div>
```

在 `<template v-if="item.status === 'needs_update' || item.status === 'failed'">` 區塊的 `重新觸發 Pipeline` 之後，新增：

```html
                      <template v-if="item.status === 'needs_update'">
                        <div class="option-item" @click="knowledgeStore.ignoreUpdate(item.id); popDialog.toast('已忽略更新', 2000); closeOps()">
                          <i class="material-symbols-outlined">block</i>忽略更新
                        </div>
                      </template>
                      <template v-if="item.status === 'failed'">
                        <div class="option-item" @click="openErrorLog(item); closeOps()">
                          <i class="material-symbols-outlined">bug_report</i>查看錯誤紀錄
                        </div>
                      </template>
```

注意：`window.alert` 在 `<template>` 的 `@click` 內不需要宣告，Vue 可直接存取 window。若 lint 報錯，改為在 script 中定義 `function downloadItem(title: string) { window.alert('下載：' + title + '.pdf') }` 並呼叫之。

- [ ] **Step 3.5：在 `<template>` 底部加入 ErrorLogModal**

在 `</div>` 最後的 `VersionCompareModal` 之後新增：

```html
    <ErrorLogModal
      v-model="isErrorLogOpen"
      :error-message="errorLogMessage"
    />
```

- [ ] **Step 3.6：在 `src/scss/views/_KnowledgeBase.scss` 新增 KPI 卡片樣式**

在檔案末尾新增：

```scss
// ── KPI 轉換率卡片 ──────────────────────────────────────
.stat-card--kpi {
  position: relative;
  border-color: var(--color-primary, #C8F135);
  background: #F0FFD4;
  cursor: default;
  &:hover {
    border-color: var(--color-primary, #C8F135);
    box-shadow: 0 2px 12px rgba(200, 241, 53, 0.15);
  }
}

.kpi-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--color-primary, #C8F135);
  color: #2A3500;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.stat-icon--kpi {
  background: #E8FAA0;
  color: #5B6342;
}

.stat-number--kpi {
  color: #2A3500;
}

.kpi-target {
  font-size: 11px;
  color: #5B6342;
  margin-top: 2px;
}

.kpi-progress-bar {
  height: 3px;
  background: #D0D9C0;
  border-radius: 2px;
  margin-top: 8px;
  overflow: hidden;
}

.kpi-progress-fill {
  height: 100%;
  background: var(--color-primary, #C8F135);
  border-radius: 2px;
  transition: width 0.5s ease;
}

// ── ErrorLogModal 樣式 ─────────────────────────────────
.error-log-modal {
  width: 560px;
  max-width: 90vw;
}

.error-log-body {
  padding: 16px 20px;
  max-height: 300px;
  overflow-y: auto;
}

.error-log-pre {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12px;
  line-height: 1.7;
  color: var(--color-danger, #BA1A1A);
  background: #FFF5F5;
  border: 1px solid #FFD0D0;
  border-radius: 8px;
  padding: 12px 14px;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}
```

- [ ] **Step 3.7：Commit**

```bash
git add src/views/KnowledgeBase.vue src/scss/views/_KnowledgeBase.scss
git commit -m "feat(knowledge): add conversion rate KPI card and fill ops menu gaps"
```

---

## Task 4：ChunkCard.vue + ChunkPreviewTab.vue

**Files:**
- Create: `src/components/Knowledge/ChunkCard.vue`
- Create: `src/components/Knowledge/ChunkPreviewTab.vue`
- Create: `src/scss/components/_ChunkCard.scss`
- Modify: `src/scss/components/_index.scss`

---

- [ ] **Step 4.1：建立 `ChunkCard.vue`**

```vue
<!-- src/components/Knowledge/ChunkCard.vue -->
<template>
  <div :class="['chunk-card', { 'chunk-card--expanded': isExpanded }]">
    <!-- 收合列 -->
    <div class="chunk-card-header" @click="emit('toggle')">
      <span class="chunk-index">#{{ String(chunk.index).padStart(2, '0') }}</span>
      <span class="chunk-section">{{ chunk.sectionPath ?? '—' }}</span>
      <span class="chunk-token">{{ chunk.tokenCount }} tokens</span>
      <i class="material-symbols-outlined chunk-chevron">
        {{ isExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}
      </i>
    </div>

    <!-- 展開內容 -->
    <Transition name="chunk-expand">
      <div v-if="isExpanded" class="chunk-card-body">
        <div class="chunk-body-grid">
          <!-- 左：原文摘錄 -->
          <div class="chunk-body-col">
            <div class="chunk-col-label">原文摘錄</div>
            <p class="chunk-content-text">{{ chunk.content.slice(0, 200) }}{{ chunk.content.length > 200 ? '…' : '' }}</p>
          </div>

          <!-- 右：AI 摘要 + Q&A -->
          <div class="chunk-body-col">
            <template v-if="chunk.gist">
              <div class="chunk-col-label">AI 摘要</div>
              <p class="chunk-gist">{{ chunk.gist }}</p>
            </template>
            <template v-if="chunk.qaPairs?.length">
              <div class="chunk-col-label" style="margin-top: 10px;">建議問答（索引用）</div>
              <div class="chunk-qa-list">
                <div v-for="(qa, i) in chunk.qaPairs" :key="i" class="chunk-qa-item">
                  <span class="qa-label">Q{{ i + 1 }}</span>
                  <span>{{ qa }}</span>
                </div>
              </div>
            </template>
            <div v-if="!chunk.gist && !chunk.qaPairs?.length" class="fc-grey-1 fs-12">
              （此分段無 AI 摘要資料）
            </div>
          </div>
        </div>

        <!-- 底部：標籤 + 引用次數 -->
        <div class="chunk-card-footer">
          <div class="chunk-tags">
            <span
              v-for="tag in chunk.taxonomyTags"
              :key="tag"
              class="chunk-tag"
            >{{ tag }}</span>
          </div>
          <span v-if="chunk.citationCount !== undefined" class="chunk-citation">
            引用 {{ chunk.citationCount }} 次
          </span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { ChunkPreview } from '@/stores/knowledgeStore'

defineProps<{
  chunk: ChunkPreview
  isExpanded: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
}>()
</script>
```

- [ ] **Step 4.2：建立 `ChunkPreviewTab.vue`**

```vue
<!-- src/components/Knowledge/ChunkPreviewTab.vue -->
<template>
  <div class="chunk-preview-tab">
    <!-- MANUAL 無分段 -->
    <div v-if="sourceType === 'MANUAL' && !chunks.length" class="chunk-empty-state">
      <i class="material-symbols-outlined">edit_note</i>
      <p>此條目為人工撰寫，無 AI 分段資料</p>
    </div>

    <!-- 無 chunks 的一般情況 -->
    <div v-else-if="!chunks.length" class="chunk-empty-state">
      <i class="material-symbols-outlined">pending</i>
      <p>尚無分段資料，請等待 Pipeline 處理完成</p>
    </div>

    <!-- Chunk 列表 -->
    <template v-else>
      <div class="chunk-list-header">
        <span class="fs-13 fc-grey-1">共 <strong>{{ chunks.length }}</strong> 個知識單元</span>
        <div class="d-flex gap-2">
          <button class="custom-btn fs-12" @click="expandAll">全部展開</button>
          <button class="custom-btn fs-12" @click="collapseAll">全部收合</button>
        </div>
      </div>
      <ChunkCard
        v-for="chunk in chunks"
        :key="chunk.index"
        :chunk="chunk"
        :is-expanded="expandedSet.has(chunk.index)"
        @toggle="toggleChunk(chunk.index)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ChunkCard from './ChunkCard.vue'
import type { ChunkPreview, SourceType } from '@/stores/knowledgeStore'

const props = defineProps<{
  chunks: ChunkPreview[]
  sourceType: SourceType
}>()

// 預設展開第一個
const expandedSet = ref<Set<number>>(
  new Set(props.chunks.length ? [props.chunks[0].index] : [])
)

function toggleChunk(index: number) {
  const next = new Set(expandedSet.value)
  if (next.has(index)) {
    next.delete(index)
  } else {
    next.add(index)
  }
  expandedSet.value = next
}

function expandAll() {
  expandedSet.value = new Set(props.chunks.map(c => c.index))
}

function collapseAll() {
  expandedSet.value = new Set()
}
</script>
```

- [ ] **Step 4.3：建立 `src/scss/components/_ChunkCard.scss`**

```scss
// src/scss/components/_ChunkCard.scss

.chunk-preview-tab {
  padding: 4px 0;
}

.chunk-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.chunk-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: var(--color-on-surface-variant, #43483E);
  gap: 8px;

  .material-symbols-outlined {
    font-size: 40px;
    opacity: 0.4;
  }

  p {
    font-size: 14px;
    opacity: 0.6;
    margin: 0;
  }
}

.chunk-card {
  border: 1px solid var(--color-outline, #C3C8BB);
  border-radius: 10px;
  margin-bottom: 8px;
  overflow: hidden;
  transition: border-color 0.15s ease;

  &--expanded {
    border-color: var(--color-primary, #C8F135);
    border-width: 2px;

    .chunk-card-header {
      background: var(--color-primary-container, #E8FAA0);
    }
  }
}

.chunk-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--color-surface-container, #F3F3F0);
  cursor: pointer;
  user-select: none;
  transition: background 0.15s ease;

  &:hover {
    background: var(--color-primary-container, #E8FAA0);
  }
}

.chunk-index {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-on-surface, #1A1C18);
  flex-shrink: 0;
}

.chunk-section {
  font-size: 12px;
  color: var(--color-on-surface-variant, #43483E);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chunk-token {
  font-size: 11px;
  color: var(--color-on-surface-variant, #43483E);
  opacity: 0.6;
  flex-shrink: 0;
}

.chunk-chevron {
  font-size: 18px;
  color: var(--color-secondary, #5B6342);
  flex-shrink: 0;
}

.chunk-card-body {
  padding: 14px 16px;
  border-top: 1px solid var(--color-outline, #C3C8BB);
  background: var(--color-surface, #FAFAFA);
}

.chunk-body-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 12px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.chunk-body-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chunk-col-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--color-on-surface-variant, #43483E);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.chunk-content-text {
  font-size: 12px;
  color: var(--color-on-surface, #1A1C18);
  line-height: 1.7;
  margin: 0;
}

.chunk-gist {
  font-size: 12px;
  color: var(--color-on-surface-variant, #43483E);
  background: var(--color-surface-container, #F3F3F0);
  border-radius: 6px;
  padding: 8px 10px;
  line-height: 1.6;
  margin: 0;
}

.chunk-qa-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chunk-qa-item {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: var(--color-on-surface, #1A1C18);
  line-height: 1.6;
}

.qa-label {
  font-weight: 600;
  color: var(--color-secondary, #5B6342);
  flex-shrink: 0;
  min-width: 20px;
}

.chunk-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px solid var(--color-outline, #C3C8BB);
}

.chunk-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.chunk-tag {
  background: var(--color-primary-container, #E8FAA0);
  color: #2A3500;
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 4px;
}

.chunk-citation {
  font-size: 10px;
  color: var(--color-on-surface-variant, #43483E);
  opacity: 0.6;
}

// Transition
.chunk-expand-enter-active,
.chunk-expand-leave-active {
  transition: opacity 0.2s ease;
}

.chunk-expand-enter-from,
.chunk-expand-leave-to {
  opacity: 0;
}
```

- [ ] **Step 4.4：在 `src/scss/components/_index.scss` 新增 @import**

在檔案末尾加入：

```scss
@import "./ChunkCard";
```

- [ ] **Step 4.5：Commit**

```bash
git add src/components/Knowledge/ChunkCard.vue src/components/Knowledge/ChunkPreviewTab.vue src/scss/components/_ChunkCard.scss src/scss/components/_index.scss
git commit -m "feat(knowledge): add ChunkCard and ChunkPreviewTab components"
```

---

## Task 5：ConversionLogTab.vue + KnowledgeDetail.vue 4 tabs

**Files:**
- Create: `src/components/Knowledge/ConversionLogTab.vue`
- Modify: `src/views/KnowledgeDetail.vue`

---

- [ ] **Step 5.1：建立 `ConversionLogTab.vue`**

```vue
<!-- src/components/Knowledge/ConversionLogTab.vue -->
<template>
  <div class="conversion-log-tab">
    <!-- 無資料 -->
    <div v-if="!conversionLog.length" class="conversion-log-empty">
      <i class="material-symbols-outlined">hourglass_empty</i>
      <p>{{ status === 'processing' ? '轉換進行中，請稍後…' : '尚無轉換紀錄' }}</p>
    </div>

    <!-- 有資料 -->
    <template v-else>
      <!-- 總覽列 -->
      <div class="conversion-log-summary">
        <span :class="['conversion-status-badge', isAllSuccess ? 'badge--success' : 'badge--failed']">
          {{ isAllSuccess ? '✓ 轉換成功' : '✕ 轉換失敗' }}
        </span>
        <span class="fs-12 fc-grey-1">
          總耗時 {{ totalDurationLabel }} · {{ lastStepTime }}
        </span>
      </div>

      <!-- 步驟卡片 -->
      <div class="conversion-step-list">
        <div
          v-for="step in conversionLog"
          :key="step.stage"
          :class="['conversion-step-card', `step--${step.status}`]"
        >
          <div class="step-header">
            <span class="step-status-icon">{{ statusIcon(step.status) }}</span>
            <span class="step-title">{{ stageLabel[step.stage] }}</span>
            <span class="step-duration fs-11 fc-grey-1">
              {{ step.status === 'skipped' ? '已跳過' : durationLabel(step.durationMs) }}
            </span>
          </div>
          <div class="step-body">
            <template v-if="step.status === 'skipped'">
              <p class="step-skipped-note">此步驟已跳過（MANUAL 來源不需要分段）</p>
            </template>
            <template v-else>
              <div class="step-detail-grid">
                <template v-for="(val, key) in step.detail" :key="key">
                  <span class="step-detail-key">{{ key }}</span>
                  <span class="step-detail-val">{{ val }}</span>
                </template>
              </div>
              <p v-if="step.errorMessage" class="step-error-msg">{{ step.errorMessage }}</p>
            </template>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ConversionStep, ItemStatus } from '@/stores/knowledgeStore'

const props = defineProps<{
  conversionLog: ConversionStep[]
  status: ItemStatus
}>()

const stageLabel: Record<string, string> = {
  chunking: '1. 分段（Chunking）',
  embedding: '2. 向量化（Embedding）',
  indexing: '3. 索引建立（Indexing）',
}

function statusIcon(status: ConversionStep['status']): string {
  if (status === 'success') return '✓'
  if (status === 'failed') return '✕'
  return '—'
}

function durationLabel(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

const isAllSuccess = computed(() =>
  props.conversionLog.every(s => s.status === 'success' || s.status === 'skipped')
)

const totalDurationLabel = computed(() => {
  const total = props.conversionLog.reduce((sum, s) => sum + s.durationMs, 0)
  return durationLabel(total)
})

const lastStepTime = computed(() => {
  const last = props.conversionLog[props.conversionLog.length - 1]
  return last?.startedAt ?? ''
})
</script>
```

- [ ] **Step 5.2：在 `KnowledgeDetail.vue` `<script setup>` 頂部 import 兩個新元件**

找到 `import { ref, computed, ... } from 'vue'` 之後，在現有 import 下方新增：

```ts
import ChunkPreviewTab from '@/components/Knowledge/ChunkPreviewTab.vue'
import ConversionLogTab from '@/components/Knowledge/ConversionLogTab.vue'
```

- [ ] **Step 5.3：在 `KnowledgeDetail.vue` `<script setup>` 中，將 `tabs` 陣列擴充為 4 個**

找到現有 `tabs` 定義（應為 `[{ key: 'overview', label: '概覽' }, { key: 'history', label: '版本歷程' }]`），替換為：

```ts
const tabs = [
  { key: 'overview', label: '概覽' },
  { key: 'history', label: '版本歷程' },
  { key: 'chunks', label: '分段預覽' },
  { key: 'conversion', label: '轉換結果' },
]
```

- [ ] **Step 5.4：在 `KnowledgeDetail.vue` template 新增 Tab 3 + Tab 4 面板**

找到 `<!-- Tab 2: 版本歷程 -->` 的 `</div>` 結尾，之後新增：

```html
      <!-- Tab 3: 分段預覽 -->
      <div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'chunks' }]">
        <ChunkPreviewTab
          :chunks="activeVer?.chunks ?? []"
          :source-type="knowledge.sourceType"
        />
      </div>

      <!-- Tab 4: 轉換結果 -->
      <div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'conversion' }]">
        <ConversionLogTab
          :conversion-log="activeVer?.conversionLog ?? []"
          :status="knowledge.status"
        />
      </div>
```

- [ ] **Step 5.5：在 `src/scss/views/_KnowledgeBase.scss`（或 _Knowledge.scss，視現有定義位置）新增 ConversionLogTab 樣式**

在檔案末尾新增：

```scss
// ── ConversionLogTab ──────────────────────────────────────
.conversion-log-tab {
  padding: 4px 0;
}

.conversion-log-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  gap: 8px;
  color: var(--color-on-surface-variant, #43483E);

  .material-symbols-outlined {
    font-size: 40px;
    opacity: 0.4;
  }

  p {
    font-size: 14px;
    opacity: 0.6;
    margin: 0;
  }
}

.conversion-log-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.conversion-status-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;

  &.badge--success {
    background: #E8FAA0;
    color: #2A3500;
  }

  &.badge--failed {
    background: #FFE4E4;
    color: var(--color-error, #BA1A1A);
  }
}

.conversion-step-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.conversion-step-card {
  border: 1px solid var(--color-outline, #C3C8BB);
  border-radius: 8px;
  overflow: hidden;

  &.step--success .step-header { background: var(--color-primary-container, #E8FAA0); }
  &.step--failed .step-header { background: #FFE4E4; }
  &.step--skipped .step-header { background: var(--color-surface-container, #F3F3F0); opacity: 0.7; }
}

.step-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
}

.step-status-icon {
  font-size: 14px;
  font-weight: 700;
  width: 16px;
  text-align: center;
}

.step-title {
  font-size: 13px;
  font-weight: 600;
  flex: 1;
  color: var(--color-on-surface, #1A1C18);
}

.step-duration {
  flex-shrink: 0;
}

.step-body {
  padding: 10px 14px;
  background: var(--color-surface, #FAFAFA);
}

.step-skipped-note {
  font-size: 12px;
  color: var(--color-on-surface-variant, #43483E);
  opacity: 0.6;
  margin: 0;
}

.step-detail-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 16px;
  row-gap: 4px;
  font-size: 12px;
}

.step-detail-key {
  color: var(--color-on-surface-variant, #43483E);
  font-size: 11px;
  opacity: 0.7;
}

.step-detail-val {
  color: var(--color-on-surface, #1A1C18);
}

.step-error-msg {
  font-size: 11px;
  color: var(--color-error, #BA1A1A);
  background: #FFF5F5;
  border: 1px solid #FFD0D0;
  border-radius: 6px;
  padding: 8px 10px;
  margin: 10px 0 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: monospace;
}
```

- [ ] **Step 5.6：Commit**

```bash
git add src/components/Knowledge/ConversionLogTab.vue src/views/KnowledgeDetail.vue src/scss/views/_KnowledgeBase.scss
git commit -m "feat(knowledge): add ConversionLogTab and expand KnowledgeDetail to 4 tabs"
```

---

## Task 6：SharePointWizardModal.vue + DataSourceTab.vue

**Files:**
- Create: `src/components/Knowledge/SharePointWizardModal.vue`
- Create: `src/scss/components/_SharePointWizardModal.scss`
- Modify: `src/components/Knowledge/DataSourceTab.vue`
- Modify: `src/scss/components/_index.scss`

---

- [ ] **Step 6.1：建立 `SharePointWizardModal.vue`**

```vue
<!-- src/components/Knowledge/SharePointWizardModal.vue -->
<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-box sp-wizard-modal">
        <div class="modal-header">
          <span class="modal-title">SharePoint 整合</span>
          <button class="modal-close-btn" @click="closeModal">
            <i class="material-symbols-outlined">close</i>
          </button>
        </div>

        <!-- 步驟進度條 -->
        <div class="sp-steps">
          <div
            v-for="(label, i) in stepLabels"
            :key="i"
            :class="['sp-step', {
              'is-done': currentStep > i + 1,
              'is-active': currentStep === i + 1,
            }]"
          >
            <div class="sp-step-dot">
              <i v-if="currentStep > i + 1" class="material-symbols-outlined">check</i>
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span class="sp-step-label">{{ label }}</span>
          </div>
        </div>

        <!-- Step 1: 連線中 -->
        <div v-if="currentStep === 1" class="sp-step-body sp-step-connecting">
          <i class="material-symbols-outlined sp-spinner">sync</i>
          <p class="sp-step-title">正在連接 SharePoint...</p>
          <p class="sp-step-sub">驗證服務帳號憑證</p>
        </div>

        <!-- Step 2: 掃描中 -->
        <div v-else-if="currentStep === 2" class="sp-step-body">
          <p class="sp-step-title">正在掃描檔案變更...</p>
          <div class="sp-progress-bar">
            <div class="sp-progress-fill" :style="{ width: scanProgress + '%' }"></div>
          </div>
          <p class="sp-step-sub">已掃描 {{ Math.round(scanProgress * 2.47) }} / 247 個檔案 {{ scanProgress }}%</p>
        </div>

        <!-- Step 3: 確認變更 -->
        <div v-else-if="currentStep === 3" class="sp-step-body">
          <p class="sp-step-title">掃描完成，偵測到以下變更：</p>
          <div class="sp-diff-list">
            <div class="sp-diff-item sp-diff--add">
              <span class="sp-diff-badge">新增</span>
              <span>外幣業務作業規範_v3.3.pdf</span>
            </div>
            <div class="sp-diff-item sp-diff--update">
              <span class="sp-diff-badge">更新</span>
              <span>貸款審核SOP_v2.1.docx</span>
            </div>
            <div class="sp-diff-item sp-diff--delete">
              <span class="sp-diff-badge">刪除</span>
              <span>2024年結存利率說明.xlsx</span>
            </div>
          </div>
          <div class="sp-footer-actions">
            <button class="custom-btn" @click="closeModal">取消</button>
            <button class="custom-btn custom-main-btn" @click="startImport">開始匯入 ▶</button>
          </div>
        </div>

        <!-- Step 4: 匯入中 -->
        <div v-else-if="currentStep === 4" class="sp-step-body">
          <p class="sp-step-title">正在匯入...</p>
          <div class="sp-import-list">
            <div v-for="file in importFiles" :key="file.name" class="sp-import-item">
              <i class="material-symbols-outlined sp-file-icon" :class="{ 'sp-spinner': file.progress > 0 && file.progress < 100 }">
                {{ file.progress >= 100 ? 'check_circle' : file.progress > 0 ? 'sync' : 'radio_button_unchecked' }}
              </i>
              <span class="sp-import-name">{{ file.name }}</span>
              <span class="sp-import-pct">{{ file.progress >= 100 ? '完成' : file.progress > 0 ? file.progress + '%' : '待處理' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'complete'): void
}>()

const stepLabels = ['連線', '掃描', '確認', '匯入']
const currentStep = ref(1)
const scanProgress = ref(0)

const importFiles = ref([
  { name: '外幣業務作業規範_v3.3.pdf', progress: 0 },
  { name: '貸款審核SOP_v2.1.docx', progress: 0 },
  { name: '2024年結存利率說明.xlsx（刪除）', progress: 0 },
])

let scanInterval: ReturnType<typeof setInterval> | null = null

function resetState() {
  currentStep.value = 1
  scanProgress.value = 0
  importFiles.value.forEach(f => { f.progress = 0 })
  if (scanInterval) { clearInterval(scanInterval); scanInterval = null }
}

function closeModal() {
  if (currentStep.value < 4) {
    emit('update:modelValue', false)
    resetState()
  }
}

function startImport() {
  currentStep.value = 4
  // 外幣業務規範：800ms 完成
  setTimeout(() => { importFiles.value[0].progress = 50 }, 300)
  setTimeout(() => { importFiles.value[0].progress = 100 }, 800)
  // 貸款審核SOP：1500ms 完成
  setTimeout(() => { importFiles.value[1].progress = 30 }, 500)
  setTimeout(() => { importFiles.value[1].progress = 70 }, 1000)
  setTimeout(() => { importFiles.value[1].progress = 100 }, 1500)
  // 刪除項目：500ms 完成
  setTimeout(() => { importFiles.value[2].progress = 100 }, 500)
  // 全部完成後 2s 關閉
  setTimeout(() => {
    emit('complete')
    emit('update:modelValue', false)
    resetState()
  }, 3500)
}

// 當 modal 開啟時啟動 Step 1 → Step 2
watch(() => props.modelValue, (val) => {
  if (!val) return
  resetState()
  // Step 1: 1.5s 後進 Step 2
  setTimeout(() => {
    currentStep.value = 2
    // Step 2: setInterval 每 80ms +3%，到 100% 後進 Step 3
    scanInterval = setInterval(() => {
      scanProgress.value = Math.min(scanProgress.value + 3, 100)
      if (scanProgress.value >= 100) {
        clearInterval(scanInterval!)
        scanInterval = null
        setTimeout(() => { currentStep.value = 3 }, 300)
      }
    }, 80)
  }, 1500)
})
</script>
```

- [ ] **Step 6.2：建立 `src/scss/components/_SharePointWizardModal.scss`**

```scss
// src/scss/components/_SharePointWizardModal.scss

.sp-wizard-modal {
  width: 560px;
  max-width: 90vw;
}

.sp-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 20px 24px 8px;
  border-bottom: 1px solid var(--color-outline, #C3C8BB);
}

.sp-step {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  justify-content: center;

  &:not(:last-child)::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--color-outline, #C3C8BB);
    margin: 0 8px;
  }

  &.is-done .sp-step-dot {
    background: var(--color-primary, #C8F135);
    color: #2A3500;
    border-color: var(--color-primary, #C8F135);

    .material-symbols-outlined { font-size: 14px; }
  }

  &.is-active .sp-step-dot {
    background: var(--color-primary, #C8F135);
    color: #2A3500;
    border-color: var(--color-primary, #C8F135);
  }
}

.sp-step-dot {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid var(--color-outline, #C3C8BB);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
  color: var(--color-on-surface-variant, #43483E);
}

.sp-step-label {
  font-size: 11px;
  color: var(--color-on-surface-variant, #43483E);
}

.sp-step-body {
  padding: 32px 28px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 10px;

  &.sp-step-connecting { gap: 12px; }
}

.sp-spinner {
  animation: spin 1s linear infinite;
  font-size: 40px;
  color: var(--color-primary, #C8F135);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.sp-step-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-on-surface, #1A1C18);
  margin: 0;
}

.sp-step-sub {
  font-size: 12px;
  color: var(--color-on-surface-variant, #43483E);
  opacity: 0.7;
  margin: 0;
}

.sp-progress-bar {
  width: 100%;
  max-width: 320px;
  height: 6px;
  background: var(--color-surface-container-high, #EAEAE6);
  border-radius: 4px;
  overflow: hidden;
}

.sp-progress-fill {
  height: 100%;
  background: var(--color-primary, #C8F135);
  border-radius: 4px;
  transition: width 0.1s linear;
}

.sp-diff-list {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}

.sp-diff-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 7px;
  font-size: 13px;

  &.sp-diff--add { background: var(--color-primary-container, #E8FAA0); }
  &.sp-diff--update { background: #FFF8E6; }
  &.sp-diff--delete { background: #FFE4E4; }
}

.sp-diff-badge {
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;

  .sp-diff--add & { color: #2A5A00; }
  .sp-diff--update & { color: #7A4500; }
  .sp-diff--delete & { color: var(--color-error, #BA1A1A); }
}

.sp-footer-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  width: 100%;
  max-width: 400px;
}

.sp-import-list {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
}

.sp-import-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.sp-file-icon {
  font-size: 20px;
  color: var(--color-secondary, #5B6342);
  flex-shrink: 0;
}

.sp-import-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-on-surface, #1A1C18);
}

.sp-import-pct {
  font-size: 11px;
  color: var(--color-on-surface-variant, #43483E);
  flex-shrink: 0;
}

// SharePoint App card clickable state
.app-card--sharepoint {
  cursor: pointer;
  &:hover {
    border-color: #0078D4;
    box-shadow: 0 2px 8px rgba(0, 120, 212, 0.15);
  }
}
```

- [ ] **Step 6.3：在 `src/scss/components/_index.scss` 新增 @import**

在上一步加入的 `@import "./ChunkCard";` 之後再加：

```scss
@import "./SharePointWizardModal";
```

- [ ] **Step 6.4：修改 `DataSourceTab.vue`——SharePoint 卡片從 placeholderApps 中分離**

**Step 6.4a** - 在 `<script setup>` 頂部，import SharePointWizardModal：

在 `import EditApiSourceModal ...` 之後新增：

```ts
import SharePointWizardModal from '@/components/Knowledge/SharePointWizardModal.vue'
```

**Step 6.4b** - 新增 `showSharePointWizard` ref：

在 `const syncingIds = ref(new Set<string>())` 之後新增：

```ts
const showSharePointWizard = ref(false)
```

**Step 6.4c** - 新增 `handleSharePointComplete` 函式：

在 `function openEdit(id: string) {` 之後新增：

```ts
function handleSharePointComplete() {
  knowledgeStore.createFromSharePoint([
    { title: '外幣業務作業規範_v3.3', category: '規則說明' },
    { title: '貸款審核SOP_v2.1', category: '規則說明' },
  ])
  const toArchive = knowledgeStore.knowledgeList.find(k =>
    k.title.includes('2024年結存利率說明')
  )
  if (toArchive) knowledgeStore.archiveKnowledge(toArchive.id)
  popDialog.toast('SharePoint 同步完成，已匯入 2 筆文件', 3000)
}
```

**Step 6.4d** - 從 `placeholderApps` 移除 SharePoint，改為獨立卡片：

找到 `placeholderApps` 陣列，移除 SharePoint 那一筆：

```ts
const placeholderApps = [
  { name: 'Google 雲端硬碟', desc: '同步雲端文件至知識庫', icon: 'folder', iconBg: '#e8f0fe', iconColor: '#4285F4' },
  { name: 'Notion', desc: '從 Notion 頁面匯入知識', icon: 'article', iconBg: '#f5f5f5', iconColor: '#333' },
  { name: 'Slack', desc: '頻道訊息轉化為知識條目', icon: 'forum', iconBg: '#fce8ff', iconColor: '#4A154B' },
]
```

**Step 6.4e** - 在 template 的 App Grid 中，將 SharePoint 從佔位迴圈中分離，改為獨立可點擊卡片：

找到 `<!-- 自訂 API -->` 那張卡片之後、`<!-- 佔位卡片 -->` 之前，新增 SharePoint 卡片：

```html
        <!-- SharePoint -->
        <div class="app-card app-card--sharepoint" @click="showSharePointWizard = true">
          <div class="app-icon" style="background:#e8f4fd;">
            <i class="material-symbols-outlined" style="color:#0078D4;">corporate_fare</i>
          </div>
          <div class="app-name">SharePoint</div>
          <div class="app-desc">企業內部文件庫</div>
          <button class="app-connect-btn btn-primary" @click.stop="showSharePointWizard = true">連接</button>
        </div>
```

**Step 6.4f** - 在 `<template>` 底部，緊接 `ConnectApiWizard` 之後新增：

```html
    <SharePointWizardModal
      v-model="showSharePointWizard"
      @complete="handleSharePointComplete"
    />
```

- [ ] **Step 6.5：Commit**

```bash
git add src/components/Knowledge/SharePointWizardModal.vue src/scss/components/_SharePointWizardModal.scss src/scss/components/_index.scss src/components/Knowledge/DataSourceTab.vue
git commit -m "feat(knowledge): add SharePoint 4-step wizard modal and integrate into DataSourceTab"
```

---

## Task 7：最終驗收

- [ ] **Step 7.1：型別檢查**

```bash
npm run type-check
```

預期：零錯誤。

- [ ] **Step 7.2：執行全部 unit tests**

```bash
npm run test:unit
```

預期：全部 PASS。

- [ ] **Step 7.3：啟動 dev server 手動驗收清單**

```bash
npm run dev
```

開啟 `http://localhost:5173`（或 vite 顯示的 port），依序驗收：

| 項目 | 操作 | 預期結果 |
|------|------|----------|
| KPI 卡片 | 進入知識管理頁 | 第 5 張卡片顯示「知識轉換率 XX%」，含進度條與 KPI badge |
| 下載原始檔案 | 任意條目 ⋮ → 下載原始檔案 | `alert('下載：...')` 彈出 |
| 忽略更新 | k4（需更新）⋮ → 忽略更新 | 狀態立即變為「已發布」，Toast 顯示 |
| 查看錯誤紀錄 | k6（失敗）⋮ → 查看錯誤紀錄 | ErrorLogModal 彈出，顯示 CUDA 錯誤訊息 |
| 分段預覽 Tab | 進入 k1 詳情頁 → Tab 3 | 顯示 3 個 chunk 卡片，#01 預設展開 |
| 展開/收合 | 全部展開 / 全部收合 | 正確切換所有卡片展開狀態 |
| 轉換結果 Tab | k1 詳情頁 → Tab 4 | 顯示 3 步驟成功，含模型版本與耗時 |
| 轉換失敗顯示 | k6 詳情頁 → Tab 4 | 顯示 chunking 成功、embedding 失敗（含錯誤訊息紅字）、indexing skipped |
| MANUAL 審核 | k2（審核中）→ 開始審核 → 批准 | item 先變「處理中」，2 秒後變「已發布」 |
| MANUAL 轉換結果 | k2 審核通過 2s 後 → Tab 4 | 顯示 chunking=skipped，embedding+indexing=success |
| SharePoint 精靈 | 資料來源 Tab → SharePoint 連接 | 4 步驟完整流程，完成後新增 2 筆 pending 條目 |
