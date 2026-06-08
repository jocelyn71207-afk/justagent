# Notion 整合設計（通用整合框架）

**日期**：2026-06-08  
**狀態**：已確認  
**範疇**：知識內容管理 — 外部平台整合框架 + Notion Database 同步

---

## 背景

目前系統支援通用 REST API 來源（ApiSource）和 SharePoint 匯入。DataSourceTab 已有 Notion、Google Drive、Slack 的「即將推出」佔位符，需要設計一套**通用整合框架**，以 Notion 作為第一個實作，讓未來接入其他平台的成本降到最低。

---

## 設計決策

| 決策 | 選擇 | 理由 |
|------|------|------|
| 整合框架方式 | 獨立 IntegrationSource 抽象層（方案 C） | 擴展性高；Notion 結構與 ApiSource 差異大，不宜混用 |
| Notion 認證 | API Key（Integration Token） | 平台層級 service account，一次設定全公司共用；B2B 情境最常見 |
| 資料來源單位 | Notion Database（每 row = 一筆知識條目） | 結構化資料，便於欄位對應 |
| 內容取用深度 | Properties（metadata）+ Page Body（blocks → Markdown） | 同時取得結構化欄位與完整文件內容 |
| 版本策略 | 每次同步建立 MINOR draft，舊版維持 active | 與現有 ApiSource 同步行為一致 |

---

## 資料模型

### IntegrationSource（通用）

```typescript
export type IntegrationType = 'NOTION' | 'GOOGLE_DRIVE' | 'SLACK'

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
  config: NotionConfig | GoogleDriveConfig | SlackConfig  // discriminated union
}
```

### NotionConfig

```typescript
export interface NotionConfig {
  apiKey: string          // secret_xxx Integration Token
  databaseId: string      // Notion Database 的 UUID
  titleProp: string       // 對應知識標題的 Property 名稱
  categoryProp?: string   // 對應知識分類的 Property 名稱（Select 類型）
  tagsProp?: string       // 對應知識標籤的 Property 名稱（Multi-select 類型）
  includePageBody: true   // 固定為 true（Properties + Page Body 都取）
  defaultCategory?: string // 未設定 categoryProp 時的預設分類
}

// 未來擴充（目前僅定義 interface，無實作）
export interface GoogleDriveConfig { /* TBD */ }
export interface SlackConfig { /* TBD */ }
```

---

## Store 設計（knowledgeStore.ts）

### 新增狀態

```typescript
const integrationSources = ref<IntegrationSource[]>([
  // Mock：一筆預設 Notion 整合
])
```

### 通用方法

| 方法 | 簽名 | 說明 |
|------|------|------|
| `createIntegration` | `(type, config, name, schedule) → id` | 建立整合來源 |
| `updateIntegration` | `(id, patch: Partial<IntegrationSource>) → void` | 更新設定 |
| `deleteIntegration` | `(id) → void` | 刪除整合 |
| `toggleIntegrationEnabled` | `(id) → void` | 切換啟用狀態 |
| `triggerIntegrationSync` | `(id) → Promise<void>` | 觸發同步（dispatch 至各 type 實作） |
| `createKnowledgeFromIntegration` | `(integrationId, notionPageId, title, content, category, tags) → string` | 建立新 KnowledgeItem（首次同步某 page 時） |
| `createDraftFromIntegrationSync` | `(knowledgeId, title, content, category, tags) → string` | 後續同步時建立新 MINOR draft（已有知識條目） |

### triggerIntegrationSync 內部 dispatch

```typescript
async function triggerIntegrationSync(id: string) {
  const source = integrationSources.value.find(s => s.id === id)
  if (!source) return
  switch (source.type) {
    case 'NOTION': return syncNotion(source)
    case 'GOOGLE_DRIVE': throw new Error('未實作')
    case 'SLACK': throw new Error('未實作')
  }
}
```

### syncNotion 流程（mock 實作）

```
1. POST /v1/databases/{databaseId}/query
   → pages[]: { id, properties: { [key]: Property } }

2. for each page:
   GET /v1/blocks/{pageId}/children
   → blocks[]: { type, [type]: {...} }

3. blocksToMarkdown(blocks)
   heading_2 → ## text
   heading_3 → ### text
   paragraph → text
   bulleted_list_item → - text
   numbered_list_item → 1. text
   code → ```lang\ncode\n```
   (其他 block type 略過或以純文字呈現)

4. 取 Properties：
   title    = properties[titleProp].title[0].plain_text
   category = properties[categoryProp]?.select?.name ?? config.defaultCategory
   tags     = properties[tagsProp]?.multi_select?.map(t => t.name) ?? []

5. 比對 Notion page 是否已有對應知識條目：
   查找 knowledgeList 中 integrationSourceId === source.id && notionPageId === page.id 的條目
   → 找到：呼叫 createDraftFromIntegrationSync() 建立新 MINOR draft
   → 找不到：呼叫 createKnowledgeFromIntegration() 建立新 KnowledgeItem + 首版 draft
   → 兩者都觸發 startPipelineSimulation()

6. 更新 source.lastSyncAt / lastSyncStatus / lastSyncCount
```

**Notion page ↔ KnowledgeItem 對應**：在 KnowledgeItem 新增以下欄位：
- `integrationSourceId?: string`：所屬整合來源 ID
- `notionPageId?: string`：對應的 Notion page ID

兩者合併作為唯一鍵，確保多個 Notion 整合連接同一 Database 時不會互相干擾。

**mock 說明**：`syncNotion` 在 demo 階段不實際呼叫 Notion API，改以隨機產生的假資料模擬同步結果。Step 2「測試連線」亦為 mock（固定回傳成功）。後端對接時替換 mock 即可，store 介面不變。

---

## UI 元件架構

### 新增元件

| 元件 | 路徑 | 說明 |
|------|------|------|
| `IntegrationConnectWizard.vue` | `src/components/Knowledge/` | 通用 wizard shell，step 1 選平台，step 2+ 注入各平台專屬步驟 |
| `NotionConnectSteps.vue` | `src/components/Knowledge/` | Notion 專屬步驟（Step 2–4），由 IntegrationConnectWizard 載入 |

### 修改元件

| 元件 | 變更說明 |
|------|---------|
| `DataSourceTab.vue` | 新增「整合平台」分頁；顯示 `integrationSources` 卡片；「即將推出」升級為可點選（Notion） |
| `knowledgeStore.ts` | 新增 `integrationSources` ref 及上述所有方法 |
| `KnowledgeItem` type | 新增 `notionPageId?: string` 欄位 |

### IntegrationConnectWizard 步驟流程

```
Step 1（通用）：選擇整合類型
  → Notion（可用）、Google Drive / Slack（即將推出，disabled）

Step 2（NotionConnectSteps）：連線驗證
  → 輸入 Integration Token + Database ID
  → 「測試連線」按鈕：驗證 token 有效、database 可存取
  → 顯示 Database 名稱與資料筆數

Step 3（NotionConnectSteps）：欄位對應
  → 從 API 取回的 Properties 列表中選擇對應欄位
  → 標題：必填，對應 Title 類型 Property
  → 分類：選填，對應 Select 類型 Property
  → 標籤：選填，對應 Multi-select 類型 Property
  → 內容：固定使用 Page Body（blocks），不可更改，顯示說明文字

Step 4（NotionConnectSteps）：同步設定
  → 整合名稱（預填 Database 名稱）
  → 預設知識分類（未取到 categoryProp 時的 fallback）
  → 同步頻率：手動 / 每日 / 每週
  → 完成後立即執行首次同步
```

---

## DataSourceTab UI

- 新增「整合平台」分頁，與現有「API 來源」並列
- 已連接的整合顯示卡片，包含：名稱、database ID 預覽、同步狀態、最後同步時間、筆數
- 卡片操作：啟用/停用切換、立即同步、編輯
- 可新增平台：Notion（可連接）、Google Drive / Slack（disabled，標示「即將推出」）

---

## 知識列表呈現

- 來源為 Notion 整合的條目顯示 `N Notion` 來源 badge（綠底）
- 首次同步後所有條目狀態為 `draft`（待審核）
- 後續同步若 Notion page 有更新，建立新 MINOR draft，原 active 版本維持不變

---

## 邊界情況

| 情境 | 處理方式 |
|------|---------|
| Integration Token 無效 | Step 2「測試連線」顯示錯誤訊息，不允許進入 Step 3 |
| Database 未 Share 給 Integration | 測試連線失敗，提示「請確認已將此 Database 分享給 Integration」 |
| Notion page 被刪除 | 下次同步時不再回傳該 page；現有知識條目不自動刪除（僅停止更新） |
| Page Body 為空 | content 欄位設為空字串，草稿仍建立，Pipeline 以空內容執行 |
| Properties 類型不符 | categoryProp 非 Select 或 tagsProp 非 Multi-select 時，Step 3 顯示警告，允許跳過 |
| 同步中途失敗 | 已成功處理的 page 保留其 draft，失敗的 page 跳過並記錄 error detail |
| 多個 Notion 整合連接同一 Database | 允許，每個整合各自維護知識條目（透過 notionPageId + integrationId 雙重比對） |

---

## 未在此次範疇內

- Google Drive、Slack 的實際整合實作（僅定義 interface）
- Notion OAuth 2.0 流程（未來若需支援個人帳號授權）
- Notion page 刪除時自動封存對應知識條目
- Notion Database filter/sort 設定（目前同步全部 rows）
- 差異比對：僅建立新 draft，不 diff 新舊內容差異
