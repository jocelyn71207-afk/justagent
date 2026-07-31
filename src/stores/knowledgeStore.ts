import { defineStore } from 'pinia';
import { ref } from 'vue';

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
export type SourceType = 'FILE' | 'API' | 'MANUAL' | 'JUSTKA' | 'SHAREPOINT' | 'NOTION'

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

export function buildChunkContent(
  chunk: string,
  meta: { category: string; tags: string[]; sourceType: 'text' | 'image' },
): string {
  const tagsStr = meta.tags.length > 0 ? `[標籤:${meta.tags.join(',')}]` : ''
  return `[分類:${meta.category}]${tagsStr}[來源:${meta.sourceType}] ${chunk}`
}

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

export interface ChunkPreview {
  index: number
  content: string
  tokenCount: number
  sourceType: 'text' | 'image'
  sectionPath?: string
  gist?: string
  qaPairs?: string[]
  taxonomyTags?: string[]
  citationCount?: number
}
export interface ConversionStep {
  stage: 'chunking' | 'embedding' | 'indexing'
  status: 'success' | 'failed' | 'skipped'
  startedAt: string
  durationMs: number
  detail: Record<string, string | number>
  errorMessage?: string
}

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
  conversionLog?: ConversionStep[]
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
  integrationSourceId?: string
  notionPageId?: string
}

export const useKnowledgeStore = defineStore('knowledge', () => {
  // --- 假資料 ---
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
            {
              index: 1,
              content: 'UGG 鞋款庫存資料整理，包含 2025 年秋冬新款型號、配色與庫存數量說明，TV 系列為主力推廣款式。',
              tokenCount: 312,
              sourceType: 'text',
            },
            {
              index: 2,
              content: 'TV4038BKBR 冬季款詳細規格，含尺寸範圍 US5–11、建議售價 NT$6,800 與安全庫存量設定標準。',
              tokenCount: 287,
              sourceType: 'text',
            },
            {
              index: 3,
              content: 'Q3 選品策略以秋冬轉換期熱銷品項為主，重點布局 UGG 經典款與新色系，建議備貨量較 Q2 增加 30%。',
              tokenCount: 345,
              sourceType: 'text',
            },
          ],
          embeddingModel: 'text-embedding-3-large',
          embeddingDimension: 3072,
          embeddingCount: 3,
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
            {
              index: 1,
              content: '申辦資格：年滿 20 歲，年收入 30 萬以上，需提供薪資證明或最近一年報稅資料，外籍人士另需居留證。',
              tokenCount: 198,
              sourceType: 'text',
            },
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
          summary: '由商品目錄 API 同步更新，涵蓋 2026 春夏主打選品、即時庫存狀態與最新定價活動，共 3 個知識單元。',
          content: `# 商品目錄即時資料（2026-04-12 最新同步）

> **資料來源**：商品目錄 API｜**同步時間**：2026-04-12 09:00｜**版本**：v3.0

---

## 一、2026 春夏主打選品

本季主打商品共 **11 款**，含 8 款新品與 3 款延續熱銷品項。

| 商品編號 | 品名 | 類型 | 建議陳列 |
|---------|------|------|---------|
| P2026-S01 | 輕量透氣上衣 | 新品 | 主視覺區 |
| P2026-S02 | 彈性機能褲 | 新品 | 搭配區 |
| P2026-S03 | UPF50 防曬外套 | 新品 | 主視覺區 |
| P2026-S04 | 涼感短袖T恤 | 新品 | 平台陳列 |
| P2026-C01 | 經典素色Polo衫 | 延續 | 側牆掛架 |
| P2026-C02 | 百搭直筒牛仔褲 | 延續 | 搭配區 |

促銷時程：4/15–5/31 春夏新品 85 折，滿 2,000 加購配件 7 折。

---

## 二、即時庫存狀態

庫存狀態每日 08:00 同步更新，客服查詢時請以本資料為準。

| 狀態 | 代表意義 | 庫存量 |
|------|---------|--------|
| 🟢 正常 | 可正常供貨 | ≥ 50 件 |
| 🟡 低庫存 | 建議詢問到貨日 | 1–19 件 |
| 🔴 售完 | 無法出貨，引導至預購 | 0 件 |

**目前低庫存警示品項**（截至 2026-04-12）：
- P2026-S03 UPF50 防曬外套：剩 12 件，預計 4/20 補貨
- P2026-C01 經典素色Polo衫：剩 8 件，不補貨

---

## 三、定價與優惠活動

| 活動名稱 | 折扣 | 適用品項 | 期間 |
|---------|------|---------|------|
| 春夏新品優惠 | 85 折 | P2026-S01~S04 | 4/15–5/31 |
| 延續款清倉 | 7 折 | P2026-C01~C02 | 5/1–5/31 |
| 會員專屬加碼 | 額外 95 折 | 全品項 | 長期 |

> ⚠️ **客服注意事項**：促銷折扣不得與員工優惠併用；延續款清倉活動不接受退換貨。`,
          tags: ['商品', 'API'],
          systemTags: ['商品文件'],
          lastUpdateBy: 'API 同步',
          lastUpdateTime: '2026-04-12 09:00',
          updateNote: 'API 自動同步，新增春夏選品 11 款，更新庫存與定價活動資料',
          sourceFiles: [],
          chunks: [
            {
              index: 1,
              sectionPath: '一、2026 春夏主打選品',
              content: '本季主打商品共 11 款，含 8 款新品與 3 款延續熱銷品項，附建議陳列方式。促銷時程：4/15–5/31 春夏新品 85 折，滿 2,000 加購配件 7 折。',
              tokenCount: 428,
              sourceType: 'text',
              gist: '2026 春夏主打共 11 款（8 款新品、3 款延續款），說明各品項建議陳列位置與促銷時程。',
              qaPairs: [
                '2026 春夏有哪些新品？',
                '延續熱銷品項有哪些？',
                '春夏促銷期間是什麼時候？',
                '滿額加購優惠的條件？',
                '陳列位置如何安排？',
              ],
              taxonomyTags: ['商品文件/季節商品/春夏選品'],
              citationCount: 5,
            },
            {
              index: 2,
              sectionPath: '二、即時庫存狀態',
              content: '庫存狀態每日 08:00 同步更新。綠色（≥50件）正常、黃色（1–19件）低庫存、紅色（0件）售完。目前低庫存：P2026-S03 剩 12 件預計 4/20 補貨；P2026-C01 剩 8 件不補貨。',
              tokenCount: 356,
              sourceType: 'text',
              gist: '說明庫存狀態色碼規則，並列出目前低庫存品項與預計補貨資訊，供客服即時查詢使用。',
              qaPairs: [
                '庫存狀態如何判讀？',
                '低庫存的定義是什麼？',
                '售完商品何時補貨？',
                'P2026-S03 何時補貨？',
                'P2026-C01 還會補貨嗎？',
              ],
              taxonomyTags: ['商品文件/庫存管理/即時狀態'],
              citationCount: 22,
            },
            {
              index: 3,
              sectionPath: '三、定價與優惠活動',
              content: '春夏新品 85 折（4/15–5/31）；延續款清倉 7 折（5/1–5/31）；會員額外 95 折長期有效。折扣不與員工優惠併用，清倉活動不接受退換貨。',
              tokenCount: 389,
              sourceType: 'text',
              gist: '彙整目前進行中的促銷活動，包含折扣幅度、適用品項、期間及注意事項。',
              qaPairs: [
                '目前有哪些優惠活動？',
                '折扣可以疊加嗎？',
                '會員優惠如何計算？',
                '清倉商品可以退換貨嗎？',
                '春夏新品優惠什麼時候結束？',
              ],
              taxonomyTags: ['商品文件/價格管理/優惠活動'],
              citationCount: 9,
            },
          ],
          embeddingModel: 'BAAI/bge-m3',
          embeddingDimension: 1024,
          embeddingCount: 3,
          conversionLog: [
            {
              stage: 'chunking',
              status: 'success',
              startedAt: '2026-04-12 08:55',
              durationMs: 4100,
              detail: {
                strategy: 'Section-aware',
                chunkCount: 3,
                avgTokens: 391,
                imageCount: 0,
                tableCount: 2,
                sourceFormat: 'API',
              },
            },
            {
              stage: 'embedding',
              status: 'success',
              startedAt: '2026-04-12 08:55',
              durationMs: 9300,
              detail: {
                model: 'BAAI/bge-m3',
                dimension: 1024,
                denseCount: 3,
                sparseCount: 3,
                batchSize: 32,
              },
            },
            {
              stage: 'indexing',
              status: 'success',
              startedAt: '2026-04-12 08:56',
              durationMs: 380,
              detail: {
                collection: 'knowledge_chunks',
                pointCount: 3,
                indexType: 'HNSW',
              },
            },
          ],
        },
      ],
    },
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
        },
      ],
    },
    {
      id: 'k7',
      title: '2026Q1產品銷售數據彙總',
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
      lastUpdateTime: '2026-07-01 09:00',
      lastUpdateBy: 'Lucas',
      versions: [
        {
          id: 'k7-v1.0',
          knowledgeId: 'k7',
          versionNumber: 'v1.0',
          versionType: 'MAJOR',
          status: 'active',
          title: '2026Q1產品銷售數據彙總',
          summary: '2026年6月（上月）產品銷售數據彙總，含總營業額、品類佔比與熱銷品項明細。',
          content: '# 2026年6月產品銷售數據彙總\n\n總營業額 NT$19,650,000，較上月成長 6.1%，熱銷品項 10 項，訂單數約 3,420 筆。品類佔比：涼鞋 30%、機能健走鞋 26%、靴類 25%、生活配件 12%、拖鞋 7%。',
          tags: ['銷售', '產品部'],
          systemTags: ['商品文件'],
          lastUpdateBy: 'Lucas',
          lastUpdateTime: '2026-07-01 09:00',
          updateNote: '建立 2026年6月銷售數據彙總',
          sourceFiles: [{ fileId: 'res-sales-2026-06', fileName: '2026年6月銷售明細.xlsx', linkedVersion: 1 }],
          chunks: [
            {
              index: 1,
              sectionPath: '一、銷售總覽',
              content: '2026年6月總營業額 NT$19,650,000，較上月成長 6.1%。訂單數約 3,420 筆，熱銷品項共 10 項。品類佔比：涼鞋 30%、機能健走鞋 26%、靴類 25%、生活配件 12%、拖鞋 7%。',
              tokenCount: 268,
              sourceType: 'text',
              gist: '2026年6月銷售總覽：總營業額 NT$19,650,000、較上月成長 6.1%、熱銷品項 10 項、品類佔比明細。',
              qaPairs: [
                '2026年6月總營業額是多少？',
                '較上月成長多少？',
                '這個月熱銷品項有幾項？',
                '各品類佔比如何分配？',
              ],
              taxonomyTags: ['商品文件/銷售報表/月度彙總'],
              citationCount: 3,
            },
            {
              index: 2,
              sectionPath: '二、熱銷品項明細',
              content: '熱銷前五名：UGG Classic Mini II 雪靴（NT$3,720,000）、Hurricane Trailsetter 健走鞋（NT$3,348,000）、TEVA Hurricane XLT2 涼鞋（NT$2,795,000）、TEVA Original Universal（NT$1,988,000）、Hurricane Verge 水陸機能鞋（NT$1,672,000）。',
              tokenCount: 245,
              sourceType: 'text',
              gist: '列出 2026年6月銷售金額前五名的品項與對應營業額。',
              qaPairs: [
                '這個月賣最好的商品是什麼？',
                'UGG Classic Mini II 賣了多少錢？',
                '熱銷前五名有哪些？',
              ],
              taxonomyTags: ['商品文件/銷售報表/熱銷品項'],
              citationCount: 2,
            },
          ],
          embeddingModel: 'text-embedding-3-large',
          embeddingDimension: 3072,
          embeddingCount: 2,
        },
      ],
    },
    {
      id: 'k8',
      title: '三諾產品部輸出報告規範 v1.0',
      category: '規則說明',
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
      lastUpdateTime: '2026-03-02 14:20',
      lastUpdateBy: 'Admin',
      versions: [
        {
          id: 'k8-v1.0',
          knowledgeId: 'k8',
          versionNumber: 'v1.0',
          versionType: 'MAJOR',
          status: 'active',
          title: '三諾產品部輸出報告規範 v1.0',
          summary: '三諾產品部對外輸出報告的必要章節、視覺風格與命名規則。',
          content: '# 三諾產品部輸出報告規範\n\n所有對外輸出報告須包含摘要卡、品類佔比、明細表格三個區塊，並沿用部門既定的視覺配色與檔名規則。',
          tags: ['報告規範', '產品部'],
          systemTags: ['規則說明'],
          lastUpdateBy: 'Admin',
          lastUpdateTime: '2026-03-02 14:20',
          updateNote: '初版發布',
          sourceFiles: [{ fileId: 'res-report-spec-1', fileName: '三諾產品部輸出報告規範.pdf', linkedVersion: 1 }],
          chunks: [
            {
              index: 1,
              sectionPath: '一、必要章節',
              content: '報告須包含三個區塊：（1）摘要卡：總營業額、較上月成長、熱銷品項數、訂單數；（2）品類佔比：以 chip 形式呈現各品類銷售佔比；（3）明細表格：至少含品名、品牌、類別、銷售數量、銷售金額、較上月成長六個欄位。',
              tokenCount: 312,
              sourceType: 'text',
              gist: '報告必須包含摘要卡、品類佔比、明細表格三個區塊，並列出各區塊的必要欄位。',
              qaPairs: [
                '報告一定要有哪些區塊？',
                '摘要卡要放哪些數字？',
                '明細表格至少要有哪些欄位？',
              ],
              taxonomyTags: ['規則說明/報告規範/必要章節'],
              citationCount: 4,
            },
            {
              index: 2,
              sectionPath: '二、視覺與命名規則',
              content: '視覺風格沿用部門既有報告色票（CSS 變數命名慣例：--bg、--surface、--border、--blue）；輸出檔名格式為 sanuo_西元年_兩位數月份_sales_report.html。',
              tokenCount: 198,
              sourceType: 'text',
              gist: '說明報告的配色 CSS 變數慣例與輸出檔名的命名規則。',
              qaPairs: [
                '報告的配色規則是什麼？',
                '報告檔名要怎麼命名？',
              ],
              taxonomyTags: ['規則說明/報告規範/視覺與命名'],
              citationCount: 1,
            },
          ],
          embeddingModel: 'text-embedding-3-large',
          embeddingDimension: 3072,
          embeddingCount: 2,
        },
      ],
    },
    {
      id: 'k9',
      title: 'Teva 商品庫存即時資料',
      category: '商品文件',
      status: 'active',
      sourceType: 'API',
      pipelineProgress: 100,
      pipelineStage: null,
      pipelineError: null,
      sourceStale: false,
      staleSourceFileIds: [],
      lastSyncAt: '2026-07-30 08:00',
      apiSourceId: 'api-3',
      apiSourceName: 'Teva 商品庫存 API',
      lastUpdateTime: '2026-07-30 08:00',
      lastUpdateBy: 'API 同步',
      versions: [
        {
          id: 'k9-v1.0',
          knowledgeId: 'k9',
          versionNumber: 'v1.0',
          versionType: 'MAJOR',
          status: 'active',
          title: 'Teva 商品庫存即時資料',
          summary: '由 Teva 商品庫存 API 同步更新，涵蓋主力品項現有庫存量與低庫存警示，共 2 個知識單元。',
          content: `# Teva 商品庫存即時資料（2026-07-30 最新同步）

> **資料來源**：Teva 商品庫存 API｜**同步時間**：2026-07-30 08:00｜**版本**：v1.0

---

## 一、Teva 商品線總覽

| 商品編號 | 品名 | 現有庫存 | 狀態 |
|---------|------|---------|------|
| TEVA-XLT2-2026 | TEVA Hurricane XLT2 涼鞋 | 320 件 | 🟢 正常 |
| TEVA-VERGE-2026 | TEVA Hurricane Verge 水陸機能鞋 | 210 件 | 🟢 正常 |
| TEVA-RIDGE-2026 | TEVA Ridgeview 秋冬機能涼鞋（新品） | 260 件 | 🟢 正常，新品剛到貨 |
| TEVA-OU-2026 | TEVA Original Universal | 18 件 | 🟡 低庫存 |

---

## 二、低庫存警示

**TEVA Original Universal**（現有庫存 18 件）：因 6 月銷售暢旺（單月銷售額 NT$1,988,000，為當月熱銷第 4 名），現貨去化速度快，目前僅剩 18 件，預計 8/20 補貨到位。⚠️ **不建議作為大規模曝光的主打商品**，適合改以限量／稀缺角度操作。`,
          tags: ['商品', 'Teva', 'API'],
          systemTags: ['商品文件'],
          lastUpdateBy: 'API 同步',
          lastUpdateTime: '2026-07-30 08:00',
          updateNote: 'API 自動同步，更新 Teva 商品線庫存與低庫存警示',
          sourceFiles: [],
          chunks: [
            {
              index: 1,
              sectionPath: '一、Teva 商品線總覽',
              content: 'Teva 商品線現有庫存：Hurricane XLT2 320 件（正常）、Hurricane Verge 210 件（正常）、新品 Ridgeview 260 件（正常，剛到貨）、Original Universal 18 件（低庫存）。',
              tokenCount: 312,
              sourceType: 'text',
              gist: '列出 Teva 四款主力品項的現有庫存量與狀態燈號。',
              qaPairs: [
                'Teva 目前有哪些主力品項？',
                'Hurricane XLT2 現在庫存多少？',
                '新品 Ridgeview 庫存狀況如何？',
                '哪一款 Teva 商品庫存偏低？',
              ],
              taxonomyTags: ['商品文件/庫存管理/Teva商品線'],
              citationCount: 3,
            },
            {
              index: 2,
              sectionPath: '二、低庫存警示',
              content: 'Original Universal 因 6 月銷售暢旺（NT$1,988,000，當月熱銷第4名）去化快，現貨僅剩 18 件，預計 8/20 補貨。不建議作為大規模曝光主打，適合改以限量／稀缺角度操作。',
              tokenCount: 268,
              sourceType: 'text',
              gist: 'Original Universal 因熱賣導致庫存偏低，說明原因、補貨時程與行銷操作建議。',
              qaPairs: [
                'Original Universal 為什麼庫存只剩18件？',
                'Original Universal 何時補貨？',
                '庫存這麼低適合當促銷主打嗎？',
                '低庫存商品可以怎麼操作行銷？',
              ],
              taxonomyTags: ['商品文件/庫存管理/低庫存警示'],
              citationCount: 6,
            },
          ],
          embeddingModel: 'BAAI/bge-m3',
          embeddingDimension: 1024,
          embeddingCount: 2,
        },
      ],
    },
    {
      id: 'k10',
      title: '2026換季社群輿情彙整',
      category: '市場情報',
      status: 'active',
      sourceType: 'API',
      pipelineProgress: 100,
      pipelineStage: null,
      pipelineError: null,
      sourceStale: false,
      staleSourceFileIds: [],
      lastSyncAt: '2026-07-29 07:00',
      apiSourceId: 'api-4',
      apiSourceName: '社群輿情監測 API',
      lastUpdateTime: '2026-07-29 07:00',
      lastUpdateBy: 'API 同步',
      versions: [
        {
          id: 'k10-v1.0',
          knowledgeId: 'k10',
          versionNumber: 'v1.0',
          versionType: 'MAJOR',
          status: 'active',
          title: '2026換季社群輿情彙整',
          summary: '社群輿情監測 API 彙整近期機能戶外穿搭聲量與熱門標籤、色彩偏好，共 1 個知識單元。',
          content: `# 2026換季社群輿情彙整（2026-07-29 最新同步）

> **資料來源**：社群輿情監測 API｜**同步時間**：2026-07-29 07:00｜**版本**：v1.0

---

## 一、社群聲量與熱門標籤

近 30 天「機能涼鞋」「戶外機能穿搭」相關貼文聲量較上季成長 42%。熱門標籤：#機能涼鞋 #水陸兩用 #Gorpcore #秋冬過渡穿搭。使用者偏好色彩以大地色系（卡其、軍綠、棕）為主，搭配螢光點綴色（螢光黃、螢光橘）作為視覺焦點。`,
          tags: ['市場情報', '社群', 'Teva'],
          systemTags: ['市場情報'],
          lastUpdateBy: 'API 同步',
          lastUpdateTime: '2026-07-29 07:00',
          updateNote: 'API 自動同步，更新換季社群聲量與色彩偏好',
          sourceFiles: [],
          chunks: [
            {
              index: 1,
              sectionPath: '一、社群聲量與熱門標籤',
              content: '近30天機能涼鞋／戶外機能穿搭聲量較上季成長42%。熱門標籤：#機能涼鞋 #水陸兩用 #Gorpcore #秋冬過渡穿搭。色彩偏好：大地色系為主，螢光點綴色為視覺焦點。',
              tokenCount: 245,
              sourceType: 'text',
              gist: '說明近期社群上機能戶外穿搭的聲量成長幅度、熱門標籤與色彩偏好。',
              qaPairs: [
                '機能涼鞋在社群上的聲量如何？',
                '目前有哪些熱門標籤？',
                '消費者偏好什麼顏色？',
              ],
              taxonomyTags: ['市場情報/社群輿情/換季趨勢'],
              citationCount: 4,
            },
          ],
          embeddingModel: 'BAAI/bge-m3',
          embeddingDimension: 1024,
          embeddingCount: 1,
        },
      ],
    },
    {
      id: 'k11',
      title: '時尚雜誌趨勢報導彙整',
      category: '市場情報',
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
      lastUpdateTime: '2026-07-25 10:00',
      lastUpdateBy: 'Ivy',
      versions: [
        {
          id: 'k11-v1.0',
          knowledgeId: 'k11',
          versionNumber: 'v1.0',
          versionType: 'MAJOR',
          status: 'active',
          title: '時尚雜誌趨勢報導彙整',
          summary: '彙整近期時尚雜誌對機能穿搭與永續材質趨勢的報導重點，共 1 個知識單元。',
          content: '# 時尚雜誌趨勢報導彙整\n\n彙整國內外時尚雜誌 7 月報導重點：Gorpcore（機能露營風）持續發燒，機能涼鞋搭配機能襪成為秋冬過渡穿搭示範重點；多篇報導點名永續回收材質是各品牌本季行銷主打話題。',
          tags: ['市場情報', '雜誌', 'Teva'],
          systemTags: ['市場情報'],
          lastUpdateBy: 'Ivy',
          lastUpdateTime: '2026-07-25 10:00',
          updateNote: '彙整7月時尚雜誌報導重點',
          sourceFiles: [{ fileId: 'res-magazine-trend-2026-07', fileName: '2026年7月時尚雜誌趨勢彙整.pdf', linkedVersion: 1 }],
          chunks: [
            {
              index: 1,
              sectionPath: '一、機能穿搭與永續材質趨勢',
              content: 'Gorpcore機能露營風持續發燒，機能涼鞋+機能襪成秋冬過渡穿搭示範重點；永續回收材質是各品牌本季行銷主打話題。',
              tokenCount: 210,
              sourceType: 'text',
              gist: '說明時尚雜誌報導的機能穿搭風格與永續材質行銷話題。',
              qaPairs: [
                '時尚雜誌現在都在報導什麼穿搭風格？',
                '機能涼鞋要怎麼搭配？',
                '永續材質是熱門話題嗎？',
              ],
              taxonomyTags: ['市場情報/雜誌報導/機能穿搭'],
              citationCount: 2,
            },
          ],
          embeddingModel: 'text-embedding-3-large',
          embeddingDimension: 3072,
          embeddingCount: 1,
        },
      ],
    },
    {
      id: 'k12',
      title: '戶外機能鞋產業趨勢報告',
      category: '市場情報',
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
      lastUpdateTime: '2026-07-20 09:30',
      lastUpdateBy: 'Ivy',
      versions: [
        {
          id: 'k12-v1.0',
          knowledgeId: 'k12',
          versionNumber: 'v1.0',
          versionType: 'MAJOR',
          status: 'active',
          title: '戶外機能鞋產業趨勢報告',
          summary: '產業分析報告彙整戶外機能鞋市場成長率、材質偏好與競品促銷風險，共 1 個知識單元。',
          content: '# 戶外機能鞋產業趨勢報告\n\n2026年戶外機能鞋市場年增率預估達 11%；消費者對永續回收材質的偏好持續上升。需留意競品品牌陸續祭出換季促銷折扣，價格戰風險升高，建議促銷方案應同步規劃差異化話題操作，而非單純比價。',
          tags: ['市場情報', '產業報告', 'Teva'],
          systemTags: ['市場情報'],
          lastUpdateBy: 'Ivy',
          lastUpdateTime: '2026-07-20 09:30',
          updateNote: '新增2026戶外機能鞋產業趨勢報告',
          sourceFiles: [{ fileId: 'res-industry-trend-2026', fileName: '2026戶外機能鞋產業趨勢報告.pdf', linkedVersion: 1 }],
          chunks: [
            {
              index: 1,
              sectionPath: '一、市場成長與競品風險',
              content: '2026年戶外機能鞋市場年增率預估11%；消費者對永續回收材質偏好上升；競品陸續祭出換季促銷，價格戰風險升高，建議搭配差異化話題操作。',
              tokenCount: 232,
              sourceType: 'text',
              gist: '說明戶外機能鞋市場成長率、材質偏好趨勢，以及競品促銷帶來的價格戰風險。',
              qaPairs: [
                '戶外機能鞋市場成長率多少？',
                '消費者材質偏好趨勢是什麼？',
                '競品促銷會帶來什麼風險？',
              ],
              taxonomyTags: ['市場情報/產業報告/市場趨勢'],
              citationCount: 3,
            },
          ],
          embeddingModel: 'text-embedding-3-large',
          embeddingDimension: 3072,
          embeddingCount: 1,
        },
      ],
    },
  ]);

  const apiSources = ref<ApiSource[]>([
    {
      id: 'api-1',
      name: '商品目錄 API',
      url: 'https://api.example.com/products',
      method: 'GET',
      headers: [{ key: 'Authorization', value: 'Bearer demo-token' }],
      body: '',
      titleField: 'productName',
      contentField: 'description',
      schedule: 'DAILY',
      enabled: true,
      lastSyncAt: '2026-04-12 09:00',
      lastSyncStatus: 'SUCCESS',
      lastSyncCount: 5,
      lastSyncError: null,
    },
    {
      id: 'api-2',
      name: '庫存狀態 API',
      url: 'https://erp.internal/inventory',
      method: 'POST',
      headers: [{ key: 'X-API-Key', value: 'erp-key-456' }],
      body: '{"storeId": "TW001"}',
      titleField: 'itemName',
      contentField: 'stockInfo',
      schedule: 'MANUAL',
      enabled: false,
      lastSyncAt: '2026-04-10 14:30',
      lastSyncStatus: 'FAILED',
      lastSyncCount: 0,
      lastSyncError: '連線逾時：無法連接至 erp.internal',
    },
    {
      id: 'api-3',
      name: 'Teva 商品庫存 API',
      url: 'https://erp.internal/teva/inventory',
      method: 'GET',
      headers: [{ key: 'X-API-Key', value: 'erp-key-teva-01' }],
      body: '',
      titleField: 'skuName',
      contentField: 'stockQty',
      schedule: 'DAILY',
      enabled: true,
      lastSyncAt: '2026-07-30 08:00',
      lastSyncStatus: 'SUCCESS',
      lastSyncCount: 4,
      lastSyncError: null,
    },
    {
      id: 'api-4',
      name: '社群輿情監測 API',
      url: 'https://social-listening.example.com/reports',
      method: 'GET',
      headers: [{ key: 'Authorization', value: 'Bearer social-demo-token' }],
      body: '',
      titleField: 'topic',
      contentField: 'summary',
      schedule: 'DAILY',
      enabled: true,
      lastSyncAt: '2026-07-29 07:00',
      lastSyncStatus: 'SUCCESS',
      lastSyncCount: 1,
      lastSyncError: null,
    },
  ]);

  // --- Actions ---

  // 取得單一項目及其所有版本
  const getKnowledgeById = (id: string) => knowledgeList.value.find(k => k.id === id);

  // 取得特定版本
  const getVersionById = (knowledgeId: string, versionId: string) => {
    const k = getKnowledgeById(knowledgeId);
    return k?.versions.find(v => v.id === versionId);
  };

  // 建立新草稿 (基於已發布版本)
  const createDraftFromPublished = (knowledgeId: string, type: 'MINOR' | 'MAJOR', updateNote: string) => {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;

    const published = k.versions.find(v => v.status === 'active');
    if (!published) return;

    // 計算新版本號
    const currentNum = published.versionNumber; // e.g. "v1.2"
    const [major, minor] = currentNum.replace('v', '').split('.').map(Number);
    const newNum = type === 'MAJOR' ? `v${major + 1}.0` : `v${major}.${minor + 1}`;

    const newVersion: KnowledgeVersion = {
      ...JSON.parse(JSON.stringify(published)),
      id: `${newNum}-draft-${Date.now()}`,
      versionNumber: newNum,
      status: 'draft' as VersionStatus,
      lastUpdateBy: 'Current User', // 正常應從 userStore 拿
      lastUpdateTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
      updateNote: updateNote,
    };

    k.versions.push(newVersion);
    // item status stays unchanged — only changes when draft is submitted for review
    return newVersion.id;
  };

  // 儲存草稿
  const saveDraft = (knowledgeId: string, versionId: string, data: Partial<KnowledgeVersion>) => {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;
    const v = k.versions.find(ver => ver.id === versionId);
    if (v && v.status === 'draft') {
      Object.assign(v, data);
      v.lastUpdateTime = new Date().toISOString().replace('T', ' ').slice(0, 16);
      k.lastUpdateTime = v.lastUpdateTime;
    }
  };

  // 送審
  const submitForReview = (knowledgeId: string, versionId: string, reviewerId: string, note: string) => {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;
    const v = k.versions.find(ver => ver.id === versionId);
    if (v && (v.status === 'draft' || v.status === 'rejected')) {
      v.status = 'reviewing';
      v.reviewNote = note;
      v.reviewHistory = [
        ...(v.reviewHistory ?? []),
        {
          action: 'SUBMITTED',
          by: reviewerId,
          time: new Date().toISOString().replace('T', ' ').slice(0, 16),
          note,
        },
      ];
      k.status = 'reviewing';
    }
  };

  // 還原舊版本 (建立為新草稿)
  const restoreToDraft = (knowledgeId: string, versionId: string, note: string) => {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;
    const oldVersion = k.versions.find(ver => ver.id === versionId);
    if (!oldVersion) return;

    // 基於當前發布版本號遞增
    const published = k.versions.find(v => v.status === 'active');
    const baseNum = published ? published.versionNumber : oldVersion.versionNumber;
    const [major, minor] = baseNum.replace('v', '').split('.').map(Number);
    const newNum = `v${major}.${minor + 1}`;

    const newVersion: KnowledgeVersion = {
      ...JSON.parse(JSON.stringify(oldVersion)),
      id: `${newNum}-restore-${Date.now()}`,
      versionNumber: newNum,
      status: 'draft' as VersionStatus,
      updateNote: `還原自 ${oldVersion.versionNumber}：${note}`,
      lastUpdateTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    k.versions.push(newVersion);
    k.status = 'pending';
    return newVersion.id;
  };

  const approveVersion = (knowledgeId: string, versionId: string) => {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;
    const v = k.versions.find(ver => ver.id === versionId);
    if (!v || v.status !== 'reviewing') return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    // Previous active version becomes history
    for (const ver of k.versions) {
      if (ver.status === 'active') ver.status = 'history';
    }

    v.status = 'active';
    v.reviewedBy = 'Current User';
    v.reviewedTime = now;
    v.reviewHistory = [
      ...(v.reviewHistory ?? []),
      { action: 'APPROVED', by: 'Current User', time: now },
    ];

    if (k.sourceType === 'MANUAL') {
      k.status = 'processing'
      setTimeout(() => {
        k.status = 'active'
        k.lastUpdateTime = new Date().toISOString().replace('T', ' ').slice(0, 16)
      }, 2000)
    } else {
      k.status = 'active'
      k.lastUpdateTime = now
    }
  };

  const rejectVersion = (knowledgeId: string, versionId: string, feedback?: string) => {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;
    const v = k.versions.find(ver => ver.id === versionId);
    if (!v || v.status !== 'reviewing') return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    v.status = 'rejected';
    v.reviewFeedback = feedback;
    v.reviewHistory = [
      ...(v.reviewHistory ?? []),
      { action: 'REJECTED', by: 'Current User', time: now, note: feedback },
    ];

    k.status = 'pending';
  };

  const withdrawReview = (knowledgeId: string, versionId: string) => {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;
    const v = k.versions.find(ver => ver.id === versionId);
    if (!v || v.status !== 'reviewing') return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    v.status = 'draft';
    v.reviewHistory = [
      ...(v.reviewHistory ?? []),
      { action: 'WITHDRAWN', by: 'Current User', time: now },
    ];

    k.status = 'pending';
  };

  // 從共用檔案建立新的知識條目草稿
  const createFromFile = (params: {
    fileId: string;
    fileName: string;
    template: string;
    content: string;
    category: string;
  }) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newId = `k-${Date.now()}`;
    const draftId = `v1.0-draft-${Date.now()}`;
    const baseName = params.fileName.replace(/\.[^.]+$/, '');

    const newKnowledge: KnowledgeItem = {
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
      lastUpdateBy: 'AI 生成',
      versions: [{
        id: draftId,
        knowledgeId: newId,
        versionNumber: 'v1.0',
        versionType: null,
        status: 'draft',
        title: baseName,
        summary: `由「${params.fileName}」生成的知識條目草稿`,
        content: params.content,
        tags: [],
        systemTags: [],
        lastUpdateBy: 'AI 生成',
        lastUpdateTime: now,
        updateNote: `從共用檔案「${params.fileName}」建立，使用模板：${params.template}`,
        sourceFiles: [{ fileId: params.fileId, fileName: params.fileName, linkedVersion: 1 }],
        chunks: [],
        embeddingModel: null,
        embeddingDimension: null,
        embeddingCount: 0,
      }],
    };

    knowledgeList.value.unshift(newKnowledge);
    return { knowledgeId: newId, versionId: draftId };
  };

  const createFromJustka = (params: {
    botId: string;
    botName: string;
    cardCount: number;
    category: string;
  }): { knowledgeId: string; versionId: string } => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newId = `k-${Date.now()}`;
    const draftId = `v1.0-draft-${Date.now()}`;
    const title = `${params.botName} 題庫`;

    const newKnowledge: KnowledgeItem = {
      id: newId,
      title,
      category: params.category,
      status: 'pending',
      sourceType: 'JUSTKA',
      pipelineProgress: 0,
      pipelineStage: null,
      pipelineError: null,
      sourceStale: false,
      staleSourceFileIds: [],
      lastSyncAt: null,
      apiSourceId: params.botId,
      apiSourceName: params.botName,
      lastUpdateTime: now,
      lastUpdateBy: 'AI 生成',
      versions: [{
        id: draftId,
        knowledgeId: newId,
        versionNumber: 'v1.0',
        versionType: null,
        status: 'draft',
        title,
        summary: `從 JustKa「${params.botName}」整理 ${params.cardCount} 張題卡生成的知識條目草稿`,
        content: '',
        tags: [],
        systemTags: [],
        lastUpdateBy: 'AI 生成',
        lastUpdateTime: now,
        updateNote: `從 JustKa 機器人「${params.botName}」匯入，共 ${params.cardCount} 題卡`,
        sourceFiles: [],
        chunks: [],
        embeddingModel: null,
        embeddingDimension: null,
        embeddingCount: 0,
      }],
    };

    knowledgeList.value.unshift(newKnowledge);
    return { knowledgeId: newId, versionId: draftId };
  };

  // 來源檔案更新後，將關聯此檔案的所有知識條目標記為 stale
  function markFileStale(fileId: string, newVersion: number) {
    for (const k of knowledgeList.value) {
      const activeVersion = k.versions.find(v => v.status === 'active' || v.status === 'reviewing' || v.status === 'draft');
      if (!activeVersion?.sourceFiles) continue;
      const isLinked = activeVersion.sourceFiles.some(
        ref => ref.fileId === fileId && ref.linkedVersion < newVersion
      );
      if (isLinked) {
        k.sourceStale = true;
        k.staleSourceFileIds = [...k.staleSourceFileIds.filter(id => id !== fileId), fileId];
      }
    }
  }

  // 建立來源更新草稿（AI 根據新版檔案產生）
  function createDraftFromSourceUpdate(
    knowledgeId: string,
    getFile: (id: string) => { version: number; fileName: string } | null
  ): string | undefined {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;

    const base = k.versions.find(v => v.status === 'active') ?? k.versions[k.versions.length - 1];
    const [major, minor] = base.versionNumber.replace('v', '').split('.').map(Number);
    const newNum = `v${major}.${minor + 1}`;

    // 更新 sourceFiles 的 linkedVersion 到最新
    const updatedSourceFiles = base.sourceFiles.map(ref => {
      const file = getFile(ref.fileId);
      return file ? { ...ref, linkedVersion: file.version } : ref;
    });

    const staleFileNames = k.staleSourceFileIds
      .map(id => getFile(id)?.fileName ?? id)
      .join('、');

    const newVersion: KnowledgeVersion = {
      ...JSON.parse(JSON.stringify(base)),
      id: `${newNum}-source-update-${Date.now()}`,
      versionNumber: newNum,
      status: 'draft' as VersionStatus,
      updateNote: `根據來源檔案更新（${staleFileNames}）由 AI 自動建立草稿`,
      lastUpdateBy: 'AI 生成',
      lastUpdateTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
      sourceFiles: updatedSourceFiles,
    };

    k.versions.push(newVersion);
    k.status = 'pending';
    k.sourceStale = false;
    k.staleSourceFileIds = [];
    return newVersion.id;
  }

  // 稍後處理：清除 stale 標記（不建立草稿）
  function dismissSourceStale(knowledgeId: string) {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;
    k.sourceStale = false;
    k.staleSourceFileIds = [];
  }

  // ── API 來源 CRUD ──
  function createApiSource(payload: Omit<ApiSource, 'id' | 'lastSyncAt' | 'lastSyncStatus' | 'lastSyncCount' | 'lastSyncError'>) {
    const newSource: ApiSource = {
      ...payload,
      id: `api-${Date.now()}`,
      lastSyncAt: null,
      lastSyncStatus: null,
      lastSyncCount: 0,
      lastSyncError: null,
    };
    apiSources.value.unshift(newSource);
    return newSource.id;
  }

  function createKnowledgeFromApiSource(params: {
    apiSourceId: string
    apiSourceName: string
    name: string
    category: string
  }): string {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16)
    const newId = `k-api-${Date.now()}`
    const draftId = `v1.0-draft-${Date.now()}`

    const newKnowledge: KnowledgeItem = {
      id: newId,
      title: params.name,
      category: params.category,
      status: 'pending',
      sourceType: 'API',
      pipelineProgress: 0,
      pipelineStage: null,
      pipelineError: null,
      sourceStale: false,
      staleSourceFileIds: [],
      lastSyncAt: null,
      apiSourceId: params.apiSourceId,
      apiSourceName: params.apiSourceName,
      lastUpdateTime: now,
      lastUpdateBy: 'API 同步',
      versions: [{
        id: draftId,
        knowledgeId: newId,
        versionNumber: 'v1.0',
        versionType: null,
        status: 'draft',
        title: params.name,
        summary: `由 API 來源「${params.apiSourceName}」同步建立`,
        content: '',
        tags: [],
        systemTags: [],
        lastUpdateBy: 'API 同步',
        lastUpdateTime: now,
        updateNote: `由 API 來源「${params.apiSourceName}」自動建立`,
        sourceFiles: [],
        chunks: [],
        embeddingModel: null,
        embeddingDimension: null,
        embeddingCount: 0,
      }],
    }

    knowledgeList.value.unshift(newKnowledge)
    return newId
  }

  function updateApiSource(id: string, payload: Partial<Omit<ApiSource, 'id' | 'lastSyncAt' | 'lastSyncStatus' | 'lastSyncCount' | 'lastSyncError'>>) {
    const source = apiSources.value.find(s => s.id === id);
    if (source) Object.assign(source, payload);
  }

  function deleteApiSource(id: string) {
    apiSources.value = apiSources.value.filter(s => s.id !== id);
  }

  function toggleApiSourceEnabled(id: string) {
    const source = apiSources.value.find(s => s.id === id);
    if (source) source.enabled = !source.enabled;
  }

  // 模擬同步
  function triggerSync(id: string): Promise<void> {
    const source = apiSources.value.find(s => s.id === id)
    if (!source) return Promise.resolve()

    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.2
        const now = new Date().toISOString().replace('T', ' ').slice(0, 16)

        if (success) {
          const count = Math.floor(Math.random() * 8) + 1
          source.lastSyncStatus = 'SUCCESS'
          source.lastSyncAt = now
          source.lastSyncCount = count
          source.lastSyncError = null

          // 找到關聯的 KnowledgeItem（1 來源 = 1 條目）
          const linked = knowledgeList.value.find(k => k.apiSourceId === id)
          if (linked) {
            const base =
              linked.versions.find(v => v.status === 'active') ??
              linked.versions[linked.versions.length - 1]
            const [major, minor] = base.versionNumber.replace('v', '').split('.').map(Number)
            const newNum = `v${major}.${minor + 1}`

            // 組合 Markdown 內容（mock：每筆資料為一個 ## 區塊）
            const content = Array.from({ length: count }, (_, i) =>
              `## ${source.titleField} 條目 ${i + 1}\n\n${source.contentField} 的示範內容（由 API 來源「${source.name}」同步）。`
            ).join('\n\n')

            const newVersion: KnowledgeVersion = {
              id: `${newNum}-api-${Date.now()}`,
              knowledgeId: linked.id,
              versionNumber: newNum,
              versionType: 'MINOR',
              status: 'draft',
              title: linked.title,
              summary: `由 API 來源「${source.name}」同步更新（${count} 筆資料）`,
              content,
              tags: [],
              systemTags: [],
              lastUpdateBy: 'API 同步',
              lastUpdateTime: now,
              updateNote: `API 同步（${source.name}），共 ${count} 筆`,
              sourceFiles: [],
              chunks: [],
              embeddingModel: null,
              embeddingDimension: null,
              embeddingCount: 0,
            }

            linked.versions.push(newVersion)
            linked.status = 'pending'
            linked.lastUpdateTime = now
            linked.lastUpdateBy = 'API 同步'
            startPipelineSimulation(linked.id, content)
          }
        } else {
          source.lastSyncStatus = 'FAILED'
          source.lastSyncAt = now
          source.lastSyncCount = 0
          source.lastSyncError = '連線失敗：API 回應狀態 503'
        }

        resolve()
      }, 2000)
    })
  }

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
      status: 'pending',
      sourceType: 'MANUAL',
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

  // 在 store 內部執行 pipeline 模擬，供 triggerSync 與 createFromSharePoint 呼叫
  function startPipelineSimulation(id: string, aiContent?: string) {
    const stages: Array<{ stage: PipelineStage; pct: number; delay: number }> = [
      { stage: 'chunking',  pct: 0,  delay: 0    },
      { stage: 'embedding', pct: 33, delay: 1500 },
      { stage: 'indexing',  pct: 67, delay: 3500 },
    ]
    stages.forEach(({ stage, pct, delay }) => {
      setTimeout(() => updatePipelineProgress(id, stage, pct), delay)
    })
    setTimeout(() => {
      markPipelineDone(id, [
        { index: 1, content: '（Pipeline 完成，實際分段由後端提供）', tokenCount: 0, sourceType: 'text' },
      ], aiContent)
    }, 4500)
  }

  function updatePipelineProgress(id: string, stage: PipelineStage, progress: number) {
    const item = knowledgeList.value.find(k => k.id === id)
    if (!item) return
    item.status = 'processing'
    item.pipelineStage = stage
    item.pipelineProgress = progress
  }

  function markPipelineDone(id: string, chunks: ChunkPreview[], aiContent?: string) {
    const item = knowledgeList.value.find(k => k.id === id)
    if (!item) return
    item.status = 'reviewing'
    item.pipelineProgress = 100
    item.pipelineStage = null
    item.pipelineError = null

    // 找最新的 draft（可能是 API sync 推入末端的新版本）
    const draft =
      item.versions.find(v => v.status === 'draft') ??
      item.versions[item.versions.length - 1]

    if (draft) {
      draft.status = 'reviewing'
      draft.chunks = chunks
      draft.embeddingModel = 'BAAI/bge-m3'
      draft.embeddingDimension = 1024
      draft.embeddingCount = chunks.length
      if (aiContent) draft.content = aiContent

      const now = new Date().toISOString().replace('T', ' ').slice(0, 16)
      const avgTokens = chunks.length
        ? Math.round(chunks.reduce((s, c) => s + c.tokenCount, 0) / chunks.length)
        : 320
      const sourceFormatMap: Record<string, string> = {
        FILE: 'PDF', API: 'API', SHAREPOINT: 'PDF', JUSTKA: 'JSON', MANUAL: 'TEXT',
      }
      draft.conversionLog = [
        {
          stage: 'chunking',
          status: 'success',
          startedAt: now,
          durationMs: 3200,
          detail: {
            strategy: 'Section-aware',
            chunkCount: chunks.length,
            avgTokens,
            imageCount: 0,
            tableCount: 0,
            sourceFormat: sourceFormatMap[item.sourceType] ?? 'PDF',
          },
        },
        {
          stage: 'embedding',
          status: 'success',
          startedAt: now,
          durationMs: 8700,
          detail: {
            model: 'BAAI/bge-m3',
            dimension: 1024,
            denseCount: chunks.length,
            sparseCount: chunks.length,
            batchSize: 32,
          },
        },
        {
          stage: 'indexing',
          status: 'success',
          startedAt: now,
          durationMs: 400,
          detail: {
            collection: 'knowledge_chunks',
            pointCount: chunks.length,
            indexType: 'HNSW',
          },
        },
      ]
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

  function ignoreUpdate(knowledgeId: string) {
    const k = getKnowledgeById(knowledgeId)
    if (!k || k.status !== 'needs_update') return
    k.status = 'active'
    k.sourceStale = false
    k.staleSourceFileIds = []
  }

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
        lastUpdateBy: 'SharePoint \u540c\u6b65',
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
          lastUpdateBy: 'SharePoint \u540c\u6b65',
          lastUpdateTime: now,
          updateNote: 'SharePoint 自動匯入',
          sourceFiles: [],
          chunks: [],
          embeddingModel: null,
          embeddingDimension: null,
          embeddingCount: 0,
        }],
      })
      startPipelineSimulation(id)
    }
  }

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
      }],
    }

    knowledgeList.value.unshift(newKnowledge)
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
    }

    k.versions.push(newVersion)
    k.status = 'pending'
    k.lastUpdateTime = now
    k.lastUpdateBy = 'Notion 同步'
    startPipelineSimulation(k.id, content)
    return newVersion.id
  }

  return {
    knowledgeList,
    getKnowledgeById,
    getVersionById,
    createDraftFromPublished,
    createFromFile,
    createFromJustka,
    saveDraft,
    submitForReview,
    restoreToDraft,
    approveVersion,
    rejectVersion,
    withdrawReview,
    markFileStale,
    createDraftFromSourceUpdate,
    dismissSourceStale,
    apiSources,
    createApiSource,
    createKnowledgeFromApiSource,
    updateApiSource,
    deleteApiSource,
    toggleApiSourceEnabled,
    triggerSync,
    createFromUpload,
    createManualDraft,
    startPipelineSimulation,
    updatePipelineProgress,
    markPipelineDone,
    markPipelineFailed,
    retriggerPipeline,
    ignoreUpdate,
    createFromSharePoint,
    archiveKnowledge,
    batchArchive,
    batchDelete,
    createKnowledgeFromIntegration,
    createDraftFromIntegrationSync,
  };
});
