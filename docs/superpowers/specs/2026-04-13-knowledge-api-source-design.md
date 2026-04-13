# Knowledge API 來源 — 設計文件

**日期**：2026-04-13  
**功能**：知識庫新增 API 來源，支援手動觸發與排程自動同步

---

## 1. 背景

現有「新增知識條目」僅支援上傳文件（PDF、Word 等），透過三步驟 wizard 建立條目。本功能新增 **外部 REST API** 作為第二種來源，讓系統定期或手動向外部 API 抓取資料，直接建立草稿知識條目，不走 wizard 流程。

---

## 2. 入口設計

### KnowledgeBase 頁面（最小變更）
「新增知識條目」按鈕改為下拉選單，兩個選項：
- **上傳文件**：現有流程，不變
- **從 API 新增**：跳轉至 `/knowledge/api-sources`

---

## 3. 新頁面：KnowledgeApiSources

### 路由
```
/knowledge/api-sources   →   src/views/KnowledgeApiSources.vue
```

### 頁面結構
- 頁面標題：「API 來源管理」
- 右上角：「新增 API 來源」按鈕
- 主體：API 來源列表（table 或 card）

### 列表欄位
| 欄位 | 說明 |
|---|---|
| 來源名稱 | 使用者自訂標籤 |
| API URL | 顯示完整 URL |
| 同步頻率 | 手動 / 每天 / 每週 |
| 上次同步 | 時間 + 成功幾筆 |
| 狀態 | 啟用 / 停用 toggle |
| 操作 | 手動同步、編輯、刪除 |

### 同步狀態顯示
- 成功：綠色 · `上次同步 3 筆（2026-04-13 09:00）`
- 失敗：紅色 · `同步失敗` + hover tooltip 顯示錯誤原因
- 同步中：spinner + `同步中...`

---

## 4. ApiSourceModal（新增 / 編輯共用）

### 欄位
| 欄位 | 型別 | 說明 |
|---|---|---|
| 來源名稱 | text | 必填 |
| API URL | text | 必填，https:// 開頭 |
| HTTP Method | select | GET / POST |
| Headers | dynamic key-value | 用於 Authorization、Content-Type 等 |
| Body | JSON textarea | 僅 POST 時顯示 |
| 標題欄位名稱 | text | 對應回傳 JSON 的欄位 key（例如 `title`） |
| 內容欄位名稱 | text | 對應回傳 JSON 的欄位 key（例如 `content`） |
| 同步頻率 | select | 手動 / 每天 / 每週 |

### 互動規則
- Method 切換為 GET 時，Body 欄位隱藏且清空
- Headers 可動態新增 / 刪除列
- 儲存前驗證 URL 格式

---

## 5. 資料模型

### ApiSource 型別
```typescript
interface ApiSource {
  id: string
  name: string
  url: string
  method: 'GET' | 'POST'
  headers: { key: string; value: string }[]
  body: string                              // POST body JSON string
  titleField: string                        // 對應回傳 JSON 的標題 key
  contentField: string                      // 對應回傳 JSON 的內容 key
  schedule: 'MANUAL' | 'DAILY' | 'WEEKLY'
  enabled: boolean
  lastSyncAt: string | null
  lastSyncStatus: 'SUCCESS' | 'FAILED' | null
  lastSyncCount: number
}
```

### knowledgeStore 擴充
在現有 `knowledgeStore.ts` 新增：
- `apiSources: ApiSource[]`
- `fetchApiSources()`
- `createApiSource(payload)`
- `updateApiSource(id, payload)`
- `deleteApiSource(id)`
- `triggerSync(id)` → 呼叫同步 API，更新 lastSyncAt / lastSyncStatus

---

## 6. 同步流程

```
使用者點「手動同步」/ 排程到時
  → POST /b/knowledge/api-source/{id}/sync
  → 後端：呼叫外部 API → 欄位對應 → 建立草稿知識條目
  → 回傳 { count: number, warnings: SimilarWarning[] }
  → 前端更新 lastSyncAt、lastSyncStatus、lastSyncCount
  → 若 warnings 不為空 → 在 knowledgeList 對應條目加上 hasSimilarWarning: true
  → KnowledgeBase 列表對有警示的條目顯示 ⚠️ 標記
```

### 同步後條目行為
- 直接建立**草稿**狀態的知識條目，**略過** wizard（相似性檢查 / 模板選擇 / AI 生成）
- 相似性比對在後端背景執行，不阻擋同步完成
- 使用者可以在草稿條目的編輯器中手動選擇套用 AI 潤飾（現有功能）

---

## 7. 錯誤處理

| 情境 | 處理方式 |
|---|---|
| 外部 API 連線失敗 | `lastSyncStatus: 'FAILED'`，列表紅色狀態 + tooltip 顯示錯誤訊息 |
| 欄位對應 key 不存在 | 該筆略過，同步結果顯示「X 筆成功，Y 筆欄位對應失敗」 |
| 後端同步 API 逾時 | 前端 spinner 逾時後顯示錯誤，不更新狀態 |
| URL 格式錯誤 | modal 儲存前 client-side 驗證，阻止送出 |

---

## 8. 新增 / 修改的檔案

| 檔案 | 類型 | 說明 |
|---|---|---|
| `src/views/KnowledgeApiSources.vue` | 新增 | API 來源列表頁 |
| `src/components/Knowledge/ApiSourceModal.vue` | 新增 | 新增 / 編輯 modal |
| `src/stores/knowledgeStore.ts` | 修改 | 新增 apiSources 狀態與 actions |
| `src/views/KnowledgeBase.vue` | 修改 | 新增按鈕改為下拉選單 |
| `src/router/index.ts` | 修改 | 新增 `/knowledge/api-sources` 路由 |
| `src/scss/views/_knowledge-api-sources.scss` | 新增 | 頁面樣式 |
| `src/scss/views/_index.scss` | 修改 | @forward 新樣式檔 |

---

## 9. 不在此次範圍

- Webhook 來源（push 模式）
- 資料庫直連
- API 來源的版本歷史
- 排程的 cron 設定 UI（排程頻率由後端執行，前端只選 MANUAL / DAILY / WEEKLY）
