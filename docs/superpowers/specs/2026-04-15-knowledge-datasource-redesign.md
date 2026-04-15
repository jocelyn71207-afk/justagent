# 設計文件：知識庫資料來源重設計

**日期：** 2026-04-15
**功能：** 重設計知識庫資料來源 — App 授權介面 + 自訂 API Wizard，修正同步邏輯（1 來源 = 1 知識條目）

---

## 1. 背景與問題

現有 `KnowledgeApiSources.vue` 的同步邏輯有根本設計問題：

- 觸發一次 `triggerSync()` → 依 API 回傳筆數，建立 **多個獨立的知識條目**（`k-api-xxx-0`、`k-api-xxx-1`…）
- 缺乏「來源 ↔ 條目」的明確關聯，知識庫列表裡看不出哪些條目來自同一個 API
- 入口藏在「新增知識條目」下拉選單，不直覺

**目標：**

1. 改為「一個資料來源 = 一個知識條目」，每次同步更新該條目的版本
2. 介面改採競品風格的 **App 授權卡片**，同時支援自訂 REST API（供無第三方 App 的企業內部系統使用）
3. 入口整合進知識庫頁面的 **第二個 Tab**

---

## 2. 設計決策

| 維度 | 決定 |
|---|---|
| 入口位置 | `KnowledgeBase.vue` 新增「資料來源」Tab（與「知識條目」Tab 並列） |
| 介面風格 | App 授權卡片 Grid（參考競品「應用授權」頁） |
| 第三方 App | 本版全數為「即將推出」佔位；只有「自訂 API」真的可用 |
| 連接流程 | 三步驟 Wizard Modal |
| 資料模型 | 1 API 來源 → 1 KnowledgeItem；sync 建立新版本 |
| 條目建立時機 | Wizard 第三步完成後立即建立條目 + 觸發首次同步 |

---

## 3. 頁面結構

### 3.1 知識庫頁面 Tab 切換

```
KnowledgeBase.vue
├── Tab: 知識條目（現有功能，不動）
└── Tab: 資料來源（新增）
    └── DataSourceTab.vue
```

Tab 切換列整合在現有頁面 header 下方，使用與既有元件一致的樣式。

### 3.2 DataSourceTab 佈局

```
DataSourceTab
├── 已連接 區塊（已有 apiSourceId 的來源卡片）
│   └── 卡片：來源名稱、同步狀態、上次同步時間、[設定] [立即同步] 按鈕
└── 可連接的應用程式 區塊（App 卡片 Grid）
    ├── 自訂 API（可點，紫色 CTA）
    ├── Google 雲端硬碟（即將推出，灰底不可點）
    ├── Notion（即將推出）
    ├── SharePoint（即將推出）
    ├── Slack（即將推出）
    └── 更多整合即將推出（虛線卡片）
```

---

## 4. 三步驟 Wizard（ConnectApiWizard）

點「自訂 API」的「連接」按鈕後，開啟 Modal Wizard。

### Step 1 — API 設定

| 欄位 | 型別 | 說明 |
|---|---|---|
| API URL | text | 必填，https:// 開頭 |
| HTTP Method | toggle | GET / POST |
| Authorization | text | 選填，直接填 Bearer token 等 |
| Headers | dynamic key-value | 選填，可動態新增 / 刪除列 |
| Body | JSON textarea | 僅 POST 時顯示 |

### Step 2 — 欄位對應

| 欄位 | 型別 | 說明 |
|---|---|---|
| 測試 API 按鈕 | action | 模擬呼叫 API（現階段為 mock），顯示假的回傳 JSON 樣本供使用者確認欄位 key；待後端代理 API 實作後再改為真實呼叫（避免 CORS 問題） |
| 標題欄位名稱 | text | 必填，對應回傳 JSON 的 key（例如 `productName`） |
| 內容欄位名稱 | text | 必填，對應回傳 JSON 的 key（例如 `description`） |

測試 API 結果以 code block 顯示在欄位上方，輔助使用者確認 key 名稱。

### Step 3 — 條目設定

| 欄位 | 型別 | 說明 |
|---|---|---|
| 知識條目名稱 | text | 必填，預設空白（使用者自訂） |
| 分類 | select | 選填，與既有分類一致 |
| 同步頻率 | radio | 手動 / 每天 / 每週 |

完成前顯示確認提示：「完成後將建立「{名稱}」知識條目，並自動執行首次同步」  
按「完成並同步」後：
1. 建立 `ApiSource` 記錄
2. 建立 `KnowledgeItem`（`sourceType: 'API'`，`apiSourceId` 綁定）
3. 觸發首次 `triggerSync()`

---

## 5. 資料模型

### 5.1 KnowledgeItem 新增欄位

```typescript
export interface KnowledgeItem {
  // ... 現有欄位不變 ...
  sourceType?: 'API' | 'FILE'       // 來源類型
  apiSourceId?: string               // 關聯的 ApiSource.id
  apiSourceName?: string             // 快取顯示用（避免每次查 store）
}
```

### 5.2 triggerSync 邏輯改變

**舊行為（移除）：**
```
triggerSync(id)
  → 隨機建立 N 個 KnowledgeItem（k-api-xxx-0 … k-api-xxx-N）
```

**新行為：**
```
triggerSync(id)
  → 找到 apiSourceId === id 的 KnowledgeItem
  → 計算新版本號（目前版本 + minor +1）
  → 建立新 KnowledgeVersion（status: 'DRAFT'）
  → content = 所有回傳資料整合為 Markdown 列表（每筆資料為一個 `##` 區塊，標題欄位為標題，內容欄位為內文）
  → 更新 KnowledgeItem.status = 'DRAFT'、lastUpdateTime、lastUpdateBy = 'API 同步'
  → 更新 ApiSource.lastSyncAt、lastSyncStatus、lastSyncCount
```

### 5.3 新增 knowledgeStore action

```typescript
function createKnowledgeFromApiSource(params: {
  apiSourceId: string
  apiSourceName: string
  name: string
  category: string
}): string  // 回傳新建的 KnowledgeItem.id
```

---

## 6. 知識條目 Tab 呈現（API 來源條目）

在「知識條目」Tab 的列表中，`sourceType === 'API'` 的條目：

- **圖示：** 🔌（取代一般的 📄）
- **標題旁：** 紫色「API 同步」badge
- **副標（entry-id 位置）：** `來源：{apiSourceName} ・ 上次同步：{lastSyncAt} ・ 建立 {lastSyncCount} 筆紀錄`

---

## 7. 異動檔案清單

| 檔案 | 類型 | 說明 |
|---|---|---|
| `src/components/Knowledge/DataSourceTab.vue` | 新增 | 資料來源 Tab 主體 |
| `src/components/Knowledge/ConnectApiWizard.vue` | 新增 | 三步驟 Wizard Modal |
| `src/scss/components/_DataSourceTab.scss` | 新增 | Tab 與 Wizard 樣式 |
| `src/scss/components/_index.scss` | 修改 | `@forward` 新 SCSS 檔 |
| `src/views/KnowledgeBase.vue` | 修改 | 加入 Tab 切換、引入 DataSourceTab、知識條目列表顯示 API badge |
| `src/stores/knowledgeStore.ts` | 修改 | KnowledgeItem 新增 3 欄位；triggerSync 改邏輯；新增 createKnowledgeFromApiSource |
| `src/views/KnowledgeApiSources.vue` | 移除 | 由 DataSourceTab 取代 |
| `src/components/Knowledge/ApiSourceModal.vue` | 移除 | 由 ConnectApiWizard 取代 |
| `src/router/index.ts` | 修改 | 移除 `/knowledge/api-sources` 路由 |

---

## 8. 不在此次範圍

- 第三方 OAuth 真實串接（Gmail、Google Drive、Notion 等）
- 自訂 API 的 Webhook / push 模式
- 資料來源的版本歷史
- 同步失敗的重試機制
- 深色模式適配
