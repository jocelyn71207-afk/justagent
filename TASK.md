# TASK.md — 待實作項目

## 待實作

### AppBatchUpload.vue — 真實上傳邏輯
- **狀態**：UI 完成，上傳邏輯目前為 mock（setInterval 模擬進度）
- **目標**：串接 Attachment API，實作真實 S3 上傳、進度顯示、取消、失敗重試
- **相關 API 文件**：`docs/api/agent-workspace/`（已讀，摘要存於 memory）
- **上傳流程**：
  1. `POST /b/attachment/create` → 取得 `{ id, uploadUrl }`
  2. `axios.put(uploadUrl, file)` → 直接上傳 S3（帶 onUploadProgress）
  3. 失敗時 → `GET /b/attachment/getUploadUrl?attachmentId={id}` → 重試
- **需補充的 ChoicedFileItem 欄位**：`attachmentId`, `uploadStatus`, `abortController`
- **注意**：上傳到 S3 不走 `http.ts`，直接用 `axios.put`

---

> 完成後請將項目移至「已完成」並補充說明。
