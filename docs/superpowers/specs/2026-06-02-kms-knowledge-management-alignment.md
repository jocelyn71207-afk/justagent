# KMS 知識管理 PRD 對齊設計規格

**日期**：2026-06-02  
**狀態**：已審核  
**範圍**：5 項功能對齊 PRD v1.2 § 5.2

---

## 1. 背景與目標

現有知識管理系統（KnowledgeBase / KnowledgeDetail）與 PRD 設計存在五個主要落差，本次一次對齊：

1. 狀態機：MANUAL 來源補上輕量 Pipeline（embedding 步驟）
2. Bento Grid：補充「知識轉換率」KPI 卡片
3. 操作選單：補三個缺口（下載原始檔案、忽略更新、查看錯誤紀錄）
4. 詳情頁：新增「分段預覽」與「轉換結果」兩個 Tab
5. SharePoint：將佔位卡片實作為 4 步驟 mock 精靈

---

## 2. 狀態機調整

### 2a. 現有兩層狀態（不變）

- **ItemStatus**：`pending | processing | reviewing | active | needs_update | failed | archived`
- **VersionStatus**：`draft | reviewing | active | history | rejected`

### 2b. MANUAL 路徑新增輕量 Pipeline

當 `sourceType === 'MANUAL'`，`approveVersion()` 不再直接設 `active`，改為：

```
審核通過 → item.status = 'processing'（模擬 embedding）
           → setTimeout 2s → item.status = 'active'
           + 寫入 conversionLog（skipped chunking，success embedding/indexing）
```

FILE / API / JUSTKA / SHAREPOINT 路徑邏輯不變。

### 2c. 新增 `ignoreUpdate` action

```ts
ignoreUpdate(knowledgeId: string): void
// needs_update → active，不觸發 Pipeline，不寫 conversionLog
```

### 2d. 新增 SourceType

```ts
export type SourceType = 'FILE' | 'API' | 'MANUAL' | 'JUSTKA' | 'SHAREPOINT'
```

---

## 3. 資料模型擴充（knowledgeStore.ts）

### 3a. ChunkPreview 擴充

```ts
export interface ChunkPreview {
  index: number
  sectionPath: string      // 如「第二章 > 2.1 節 申請流程」
  content: string
  tokenCount: number
  gist: string             // AI 生成摘要
  qaPairs: string[]        // 建議問答，最多 5 題
  taxonomyTags: string[]   // 分類路徑標籤
  citationCount: number    // 被引用次數
}
```

### 3b. 新增 ConversionStep

```ts
export interface ConversionStep {
  stage: 'chunking' | 'embedding' | 'indexing'
  status: 'success' | 'failed' | 'skipped'
  startedAt: string
  durationMs: number
  detail: Record<string, string | number>
  // chunking  → { strategy, chunkCount, avgTokens, imageCount, tableCount, sourceFormat }
  // embedding → { model, dimension, denseCount, sparseCount, batchSize }
  // indexing  → { collection, pointCount, indexType }
  errorMessage?: string
}
```

### 3c. KnowledgeVersion 新增欄位

```ts
conversionLog: ConversionStep[]   // 預設為 []
```

### 3d. Mock 資料要求

- 現有至少 2 筆 `active` 條目補上 `chunks`（各 3 筆展開資料）和 `conversionLog`（3 步驟成功）
- 1 筆 `failed` 條目補上含 `errorMessage` 的 `conversionLog`
- 1 筆 `MANUAL` 條目補上僅 embedding + indexing 的 `conversionLog`（chunking = skipped）

---

## 4. KnowledgeBase.vue 變更

### 4a. Bento Grid 知識轉換率

現有 5 張卡片中，第 5 張「處理中」改為「知識轉換率」KPI。

**計算公式**（computed）：

```ts
const conversionRate = computed(() => {
  const excluded = ['archived']
  const all = knowledgeList.value.filter(k => !excluded.includes(k.status))
  if (!all.length) return 0
  const active = all.filter(k => k.status === 'active').length
  return Math.round((active / all.length) * 1000) / 10  // 89.9
})
```

**卡片 UI**：
- 主數字：`89.9%`，字體同其他卡片
- 次要文字：`目標 ≥ 95%`
- 底部：細進度條（寬度 = conversionRate%，顏色 `#C8F135`）
- 標籤角落：`KPI` badge（背景 `#C8F135`）
- 不可點擊（無篩選行為）

### 4b. 操作選單缺口補齊

依狀態，各選單新增項目：

| 狀態 | 新增項目 | 行為 |
|------|----------|------|
| 所有狀態 | ⬇️ 下載原始檔案 | `window.alert('下載：' + item.title + '.pdf')`，放在選單最後一個正常項目（破壞性操作之前） |
| `needs_update` | 🚫 忽略更新 | 呼叫 `ignoreUpdate(item.id)`，Toast 提示「已忽略更新」 |
| `failed` | 🔍 查看錯誤紀錄 | 開啟 `ErrorLogModal`，顯示 `item.pipelineError` 內容 |

**新增元件：`ErrorLogModal.vue`**（輕量）

```
標題：錯誤紀錄
內容：<pre> 顯示 pipelineError 字串 </pre>
底部：[關閉]
```

---

## 5. KnowledgeDetail.vue 變更

### 5a. Tab 結構

現有 2 個 Tab → 擴充為 4 個：

```
概覽 | 版本歷程 | 分段預覽 | 轉換結果
```

「分段預覽」與「轉換結果」在 `sourceType === 'MANUAL'` 且無 chunks 時：
- 分段預覽：顯示「此條目為人工撰寫，無分段資料」
- 轉換結果：若有 conversionLog 則正常顯示（含 skipped 的 chunking 步驟）

### 5b. Tab 3：分段預覽

**元件：`ChunkPreviewTab.vue`**

```
Header：「共 N 個知識單元」 + [全部展開] [全部收合]

每個 Chunk = ChunkCard（可展開/收合）：
  收合狀態：#index · sectionPath · tokenCount · ▼
  展開狀態：
    左欄（原文摘錄）：content 的前 200 字
    右欄：
      AI 摘要：gist
      建議問答（索引用）：qaPairs 逐行 Q1~Q5
    底部：taxonomyTags chips + 引用次數（citationCount）
```

**展開/收合邏輯**：
- 預設第一個展開，其餘收合
- `expandedChunks` 為 `Set<number>`，toggle 個別，全展/全收按鈕操作整個 Set
- 選中狀態邊框改為 `2px solid #C8F135`，背景 `#E8FAA0`

### 5c. Tab 4：轉換結果

**元件：`ConversionLogTab.vue`**

```
Header 列：
  成功 → badge「✓ 轉換成功」（綠）+ 總耗時 + 完成時間
  失敗 → badge「✕ 轉換失敗」（紅）+ 失敗時間
  無資料 → 「尚無轉換紀錄」

每個 ConversionStep = 可展開卡片：
  Header：✓/✕/— · 步驟名稱 · 耗時
  Body（grid 3 欄）：detail 的 key-value 對
  若 status === 'failed'：errorMessage 以紅色顯示在 body 底部
  若 status === 'skipped'：body 顯示「此步驟已跳過（MANUAL 來源）」
```

---

## 6. DataSourceTab.vue 變更

### 6a. App Grid 卡片修改

SharePoint 佔位卡片：
- 移除 `opacity: 0.5` 和「即將推出」文字
- 改為可點擊，點擊後開啟 `SharePointWizardModal`

### 6b. 新增 SharePointWizardModal.vue

**Modal 尺寸**：560px 寬，固定高度 480px

**步驟進度條**：4 個節點，當前步驟 Cyber Lime 填色，已完成打勾，未到達空心

**步驟 1 — 連線中**（自動，1500ms 後跳步驟 2）
```
居中：旋轉 spinner + 「正在連接 SharePoint...」
副文字：「驗證服務帳號憑證」
```

**步驟 2 — 掃描中**（自動，setInterval 每 100ms +3%，到 100% 跳步驟 3）
```
標題：「正在掃描檔案變更...」
進度條 + 「已掃描 N / 247 個檔案 XX%」
```

**步驟 3 — 確認變更**（等使用者操作）
```
說明文字：「掃描完成，偵測到以下變更：」
變更列表（mock 固定）：
  新增  外幣業務作業規範_v3.3.pdf       → 綠底
  更新  貸款審核SOP_v2.1.docx          → 黃底
  刪除  2024年結存利率說明.xlsx         → 紅底
按鈕：[取消] [開始匯入 ▶]
```

**步驟 4 — 匯入中**（逐檔 setTimeout 模擬）
```
每個檔案一列：✓ / spinner / ○ + 檔名 + 進度%
時序：
  外幣業務規範：800ms 後完成
  貸款審核SOP：1500ms 後完成
  結存利率說明（刪除）：500ms 後完成
完成後 2s 自動關閉 Modal
```

**完成後行為**：
- 「新增」和「更新」的檔案以 `status: 'pending'、sourceType: 'SHAREPOINT'` 加入 `knowledgeList`
- 「刪除」的檔案若在 knowledgeList 中，將其 status 設為 `archived`
- Toast 通知：「SharePoint 同步完成，已匯入 2 筆文件」

---

## 7. 新增元件清單

| 元件 | 位置 | 用途 |
|------|------|------|
| `ChunkPreviewTab.vue` | `src/components/Knowledge/` | 分段預覽 Tab 內容 |
| `ChunkCard.vue` | `src/components/Knowledge/` | 單個 Chunk 可展開卡片 |
| `ConversionLogTab.vue` | `src/components/Knowledge/` | 轉換結果 Tab 內容 |
| `ErrorLogModal.vue` | `src/components/Knowledge/` | 查看錯誤紀錄 Modal |
| `SharePointWizardModal.vue` | `src/components/Knowledge/` | SharePoint 4 步驟精靈 |

---

## 8. 不在本次範圍

- 分段預覽的編輯功能（chunk 摘要或 Q&A 的修改）
- SharePoint OAuth 真實認證流程
- 轉換排程設定 UI（§ 5.2.2，獨立功能）
- 版本比較的 diff 視圖優化

---

## 9. 檔案異動摘要

| 檔案 | 異動類型 |
|------|----------|
| `src/stores/knowledgeStore.ts` | 修改：型別擴充、新 action、mock 資料補充 |
| `src/views/KnowledgeBase.vue` | 修改：Bento Grid、操作選單 |
| `src/views/KnowledgeDetail.vue` | 修改：新增 Tab 3 & 4 |
| `src/components/Knowledge/DataSourceTab.vue` | 修改：SharePoint 卡片狀態 |
| `src/components/Knowledge/ChunkPreviewTab.vue` | 新增 |
| `src/components/Knowledge/ChunkCard.vue` | 新增 |
| `src/components/Knowledge/ConversionLogTab.vue` | 新增 |
| `src/components/Knowledge/ErrorLogModal.vue` | 新增 |
| `src/components/Knowledge/SharePointWizardModal.vue` | 新增 |
| `src/scss/views/_KnowledgeBase.scss` | 修改：新元件樣式附加於此檔（若單一元件樣式超過 80 行，獨立為 `src/scss/components/_ChunkCard.scss` 等並在 `_index.scss` @forward）|
