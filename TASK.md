# TASK.md — 待實作項目

## 待實作

（無）

---

## 已完成

### AppBatchUpload.vue — 真實上傳邏輯
- **完成日期**：2026-04-08
- **實作內容**：
  - 新增 `attachmentId`、`uploadStatus`、`abortController` 至 `ChoicedFileItem`
  - `POST /b/attachment/create` 取得上傳 URL
  - `axios.put(uploadUrl, file)` 直接上傳 S3，帶 `onUploadProgress` 即時更新進度
  - 失敗自動重試：`GET /b/attachment/getUploadUrl?attachmentId={id}` 取新 URL 再試一次
  - 取消按鈕綁定 `AbortController.abort()`
  - 關閉確認視窗也會中止所有進行中的上傳
