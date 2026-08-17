# 知識庫管理模組重設計規格

**日期：** 2026-05-12
**範圍：** 全模組重寫（Store、Views、Components、SCSS）
**依據：** PRD_銀行RAG_KMS系統設計方案

---

## 1. 背景與目標

現有「知識庫管理」模組功能完整但狀態機簡單（DRAFT/REVIEWING/PUBLISHED），缺乏 RAG Pipeline 處理狀態的可視化，以及來源過期偵測的 UI 表示。本次重設計以銀行 RAG KMS PRD 的概念為基礎，全面對齊新的狀態機、加入 pipeline 進度追蹤、重設計詳情頁為 4-Tab 結構，並改為 upload-first 的知識建立流程。

---

## 2. 狀態機設計

### KnowledgeItem.status（7 個狀態）

| 狀態 | 中文 | 說明 |
|------|------|------|
| `pending` | 待處理 | 已建立，等待 pipeline 排程 |
| `processing` | 處理中 | Pipeline 執行中（chunking / embedding / indexing） |
| `reviewing` | 審核中 | 送審，等待審核人員確認 |
| `active` | 已發布 | 對外可查詢，當前正式版 |
| `needs_update` | 需更新 | 來源檔案有異動，需重新處理 |
| `failed` | 處理失敗 | Pipeline 執行失敗 |
| `archived` | 已封存 | 手動封存，不再對外查詢 |

**狀態流轉：**
```
上傳/建立 → pending → processing → draft（pipeline 完成）
draft → reviewing → active
active → needs_update（來源更新偵測）
needs_update → processing（重新觸發 pipeline）
processing → failed（pipeline 失敗）
active / failed → archived（手動封存）
```

### KnowledgeVersion.status（5 個狀態）

| 狀態 | 中文 | 說明 |
|------|------|------|
| `draft` | 草稿 | 尚未送審，可繼續編輯 |
| `reviewing` | 送審中 | 已送審，等待審核 |
| `active` | 當前版 | 目前發布版本（對應舊 PUBLISHED） |
| `history` | 歷史版本 | 已被新版取代的封存版本 |
| `rejected` | 已退回 | 審核未通過，退回修改 |

---

## 3. 資料模型（TypeScript 型別）

```typescript
type ItemStatus = 'pending' | 'processing' | 'reviewing' | 'active' | 'needs_update' | 'failed' | 'archived'
type VersionStatus = 'draft' | 'reviewing' | 'active' | 'history' | 'rejected'
type VersionType = 'MAJOR' | 'MINOR'
type PipelineStage = 'chunking' | 'embedding' | 'indexing'
type SourceType = 'FILE' | 'API' | 'MANUAL'

interface KnowledgeItem {
  id: string
  category: string
  sourceType: SourceType
  status: ItemStatus
  pipelineProgress: number          // 0–100，processing 時使用
  pipelineStage: PipelineStage | null
  pipelineError: string | null      // failed 時的錯誤訊息
  sourceStale: boolean              // 來源是否有新版本
  lastSyncAt: string | null         // API 來源最後同步時間
  apiSourceId: string | null
  apiSourceName: string | null
  versions: KnowledgeVersion[]
  createdAt: string
}

interface KnowledgeVersion {
  id: string
  versionNumber: string             // e.g. "2.1"
  versionType: VersionType | null
  status: VersionStatus
  title: string
  summary: string
  content: string                   // Markdown 內容
  tags: string[]                    // 包含系統自動標記
  systemTags: string[]              // 系統自動標記子集
  updateNote: string
  sourceFiles: SourceFileRef[]
  chunks: ChunkPreview[]            // pipeline 切出的分段
  embeddingModel: string | null
  embeddingDimension: number | null
  embeddingCount: number            // 已向量化 chunk 數
  lastUpdateTime: string
  lastUpdateBy: string
  reviewRecords: ReviewRecord[]
}

interface ChunkPreview {
  index: number
  content: string
  tokenCount: number
}

interface SourceFileRef {
  fileId: string
  fileName: string
  fileSize: number
  uploadedAt: string
}

interface ReviewRecord {
  id: string
  reviewerId: string
  reviewerName: string
  action: 'APPROVE' | 'REJECT'
  comment: string
  reviewedAt: string
}
```

---

## 4. Store 設計（knowledgeStore.ts）

### 狀態
```typescript
interface KnowledgeState {
  items: KnowledgeItem[]
  apiSources: ApiSource[]
}
```

### 新增 Actions

| Action | 說明 |
|--------|------|
| `createFromUpload(payload)` | 建立 pending 條目，觸發 pipeline |
| `submitForPipeline(id)` | 設 status = processing，重置 progress |
| `updatePipelineProgress(id, stage, progress)` | 更新進度條資料 |
| `markPipelineDone(id, versionData)` | Pipeline 完成 → 建立 draft version |
| `markPipelineFailed(id, error)` | 設 status = failed，存錯誤訊息 |
| `retriggerPipeline(id)` | needs_update → processing |
| `archiveKnowledge(id)` | 設 status = archived |
| `batchArchive(ids)` | 批次封存 |
| `batchDelete(ids)` | 批次刪除 |

### 保留 Actions（重命名/調整）
- `createDraftFromPublished` → 保留，status 標籤由 PUBLISHED 改 active
- `submitForReview` → 保留
- `withdrawReview` → 保留
- `approveReview` → 保留
- `rejectReview` → 保留
- `restoreToDraft` → 保留

---

## 5. 列表頁設計（KnowledgeBase.vue）

### 版面結構（由上到下）
1. **Page Banner**：麵包屑 + 頁標題
2. **統計卡列**：5 張等寬卡（全部 / Active / Needs Update / Reviewing / Processing），Needs Update 卡帶黃底警示色
3. **Tab 切換**：知識條目 | 資料來源
4. **篩選列（正常狀態）**：分類 Tab + 狀態下拉 + 搜尋 + 新增按鈕
5. **批次工具列（勾選後取代篩選列）**：顯示選取數量 + 批次封存 + 批次刪除 + 取消
6. **資料表格**：欄位 = 勾選框 / 標題+分類 / 狀態 / 版本 / 最後更新 / 操作⋮
7. **分頁器**

### 表格列行為

- **processing 列**：標題下方顯示迷你進度條 + 當前 stage 文字
- **needs_update 列**：整列帶 `#fffbeb` 黃底，標題後顯示「來源已更新」badge
- **failed 列**：標題後顯示「處理失敗」紅色 badge，⋮ 選單有「重新觸發」
- **操作選單（⋮）依狀態條件顯示：**

| 狀態 | 可用操作 |
|------|---------|
| active | 查看、建立新版本、版本歷程、封存 |
| draft | 查看、繼續編輯、版本歷程、刪除 |
| reviewing | 查看、撤回審核、開始審核、版本歷程 |
| needs_update | 查看、重新觸發 pipeline、封存 |
| failed | 查看、重新觸發 pipeline、刪除 |
| processing | 查看（唯讀） |
| archived | 查看、還原為 draft |

---

## 6. 詳情頁設計（KnowledgeDetail.vue）

### 版面結構
- **Page Header**：麵包屑 + 標題 + 狀態 badge + 動作按鈕
- **動作按鈕依 item status：**
  - `active` → 建立新版本
  - `reviewing` → 撤回審核 + 開始審核
  - `draft` / `rejected` → 繼續編輯草稿
  - `needs_update` → 重新觸發 pipeline
  - `failed` → 重新觸發 pipeline
  - `processing` / `pending` → （無動作按鈕，顯示進度）

### 4-Tab 結構

**Tab 1：概覽**
- 58% / 42% 左右分割
- 左：Markdown 內容預覽（`markdown-body`）+ 來源附件列表
- 右：版本資訊卡 / 標籤卡（區分系統標記 vs 手動標籤）/ Pipeline 狀態卡（含三階段徽章：chunking / embedding / indexing）/ 分類卡

**Tab 2：版本歷程**
- 垂直時間軸格式
- active 版：綠色圓點
- history 版：灰色圓點 + 「還原為草稿」+「與目前版比較」按鈕
- 頂部「比較版本」按鈕開啟 VersionCompareModal

**Tab 3：分段預覽**
- 顯示 pipeline 切出的 Chunks 列表
- 每個 Chunk 卡片：序號、token 數、內容預覽

**Tab 4：轉換結果**
- Embedding 向量化狀態
- 模型名稱、向量維度、已向量化 chunk 數、最後更新時間

---

## 7. 新增知識流程（Upload-first）

### 來源類型
1. **上傳檔案**（FILE）：拖曳或點擊選取，支援 PDF/DOCX/XLSX，上限 50MB
2. **API 來源**（API）：選擇已設定的外部 API 來源
3. **直接編輯**（MANUAL）：跳過 pipeline，直接建立空白草稿進 Editor

### 流程

**FILE / API 路徑：**
```
點「+ 新增知識」
→ CreateKnowledgeModal（選來源類型 + 上傳 + 填分類 + 填標籤）
→ 送出後 Modal 關閉，列表新增 processing 列（帶進度條）
→ Toast 提示「上傳成功，處理中」
→ Pipeline 完成 → Toast 提示「處理完成，可開始編輯」+ 前往編輯按鈕
→ 進入 KnowledgeEditor（draft v1.0）
```

**MANUAL 路徑：**
```
點「+ 新增知識」
→ CreateKnowledgeModal（選「直接編輯」+ 填分類 + 填標題）
→ 送出後直接進入 KnowledgeEditor（draft v1.0）
```

---

## 8. SCSS 策略

**檔案：** `src/scss/views/_KnowledgeBase.scss`（擴充，不新增檔案）

### 新增樣式 class

```scss
// 狀態 badge（新增 3 個，修改 2 個）
.status-badge--active       { background: var(--color-success-light); color: var(--color-success); }
.status-badge--processing   { background: #ede9fe; color: #7c3aed; }
.status-badge--needs_update { background: #fef3c7; color: #b45309; }
.status-badge--pending      { background: #f1f5f9; color: #64748b; }
.status-badge--failed       { background: var(--color-danger-light); color: var(--color-danger); }
.status-badge--archived     { background: #f8fafc; color: #94a3b8; }

// Pipeline 進度條（列表列用）
.pipeline-progress-bar { ... }
.pipeline-progress-fill { ... }    // 動畫 pulse

// 批次工具列
.batch-toolbar { ... }

// Needs-update 列高亮
.table-row--needs-update { background: #fffbeb; }

// 分段預覽卡（Tab 3）
.chunk-card { ... }

// 4-Tab 詳情頁
.detail-tabs { ... }
.detail-tab-panel { ... }

// 版本時間軸（Tab 2）
.version-timeline { ... }
.version-timeline-node { ... }
```

### 廢棄清理
- `.status-badge--PUBLISHED` → 改為 `.status-badge--active`
- `.status-badge--DRAFT` → 改為 `.status-badge--draft`（小寫）
- `.status-badge--REVIEWING` → 改為 `.status-badge--reviewing`
- `.status-badge--REJECTED` → 保留，已對齊小寫
- `.status-badge--HISTORY` → 改為 `.status-badge--history`

---

## 9. 元件影響清單

| 檔案 | 動作 | 說明 |
|------|------|------|
| `stores/knowledgeStore.ts` | 重寫 | 新型別、新狀態機、新 actions |
| `views/KnowledgeBase.vue` | 重寫 | 5 卡統計、批次工具列、新 table |
| `views/KnowledgeDetail.vue` | 重寫 | 4-Tab 結構 |
| `components/Knowledge/CreateKnowledgeModal.vue` | 重寫 | Upload-first，3 種來源類型 |
| `components/Knowledge/VersionHistoryDrawer.vue` | 移除 | 整合進 Detail Tab 2 |
| `components/Knowledge/VersionCompareModal.vue` | 保留 | 從 Tab 2 觸發 |
| `components/Knowledge/RestoreVersionModal.vue` | 保留 | 從 Tab 2 觸發 |
| `components/Knowledge/ReviewDrawer.vue` | 保留 | 從 Detail Header 觸發 |
| `components/Knowledge/CreateVersionModal.vue` | 保留 | 從 Detail Header 觸發 |
| `scss/views/_KnowledgeBase.scss` | 擴充 | 新增 pipeline/batch/chunk/tab 樣式 |

---

## 10. 實作順序（分層推進）

1. **Store & 型別**：更新 `knowledgeStore.ts`，新型別、新狀態機、新 mock data
2. **列表頁**：重寫 `KnowledgeBase.vue`，更新 SCSS 統計卡 + 批次工具列 + 表格
3. **詳情頁**：重寫 `KnowledgeDetail.vue`，實作 4-Tab，整合版本歷程 Tab
4. **新增知識 Modal**：重寫 `CreateKnowledgeModal.vue`，Upload-first 流程
5. **樣式收尾**：清理廢棄 class，補齊新 pipeline/chunk 樣式
