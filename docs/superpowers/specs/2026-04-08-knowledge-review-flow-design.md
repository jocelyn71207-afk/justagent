# 知識庫審核流程設計

**日期：** 2026-04-08
**狀態：** 已核准，待實作

---

## 1. 背景與目標

知識庫目前已有「送審」功能（草稿 → 審核中），但缺少審核方的操作介面。本次設計補全審核方的通過/退回流程，達成：

- 送審方與審核方由同一人扮演（未來可擴充多人）
- 每次發布留下完整稽核紀錄（審核人、時間、說明）
- 通過後自動發布，前版自動轉為歷史版本
- 退回時附上選填說明，作者可重新編輯再送審

---

## 2. 資料結構變更

### 2.1 KnowledgeVersion 新增欄位

```ts
// 現有欄位保留，新增以下：
reviewNote?: string        // 送審說明（已收集但未存，補完）
reviewedBy?: string        // 審核人名稱
reviewedTime?: string      // 審核完成時間
reviewFeedback?: string    // 審核退回說明（選填）
reviewHistory?: ReviewRecord[]  // 完整稽核紀錄
```

### 2.2 新增 ReviewRecord interface

```ts
export interface ReviewRecord {
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN'
  by: string
  time: string
  note?: string
}
```

---

## 3. Store 變更（knowledgeStore.ts）

### 3.1 修正 submitForReview

現有的 `submitForReview` 收到 `reviewerId` 和 `note` 但未持久化。補完：將送審資訊寫入 `reviewNote`，並在 `reviewHistory` 新增一筆 `SUBMITTED` 記錄。

### 3.2 新增 approveVersion

```
approveVersion(knowledgeId, versionId)
```

- 目標版本：`REVIEWING → PUBLISHED`，寫入 `reviewedBy`、`reviewedTime`
- 前一個 `PUBLISHED` 版本：自動轉為 `HISTORY`
- `KnowledgeItem.status → PUBLISHED`，`currentVersion` 更新為新版本號
- `reviewHistory` 新增 `APPROVED` 記錄

### 3.3 新增 rejectVersion

```
rejectVersion(knowledgeId, versionId, feedback?: string)
```

- 目標版本：`REVIEWING → REJECTED`，寫入 `reviewFeedback`
- `KnowledgeItem.status → REJECTED`
- `reviewHistory` 新增 `REJECTED` 記錄（含 feedback）

---

## 4. 新元件：ReviewDrawer.vue

路徑：`src/components/Knowledge/ReviewDrawer.vue`

### Props
```ts
modelValue: boolean
knowledgeId: string
versionId: string
```

### Emits
```ts
'update:modelValue': boolean
'approved'   // 通過後通知父層更新
'rejected'   // 退回後通知父層更新
```

### 版面結構

```
┌─────────────────────────────────┐
│ 審核申請                    ✕   │
├─────────────────────────────────┤
│ [條目名稱]  v1.3 草稿版本        │
│ 送審人：Lucas  2026-04-08 14:00  │
│ 送審說明：修正產品保固段落        │
├─────────────────────────────────┤
│ 版本摘要                         │
│  標題：...                       │
│  分類：...  標籤：...            │
│  摘要：...                       │
├─────────────────────────────────┤
│ [查看完整內容] [與前版比較]       │
├─────────────────────────────────┤
│ 退回說明（選填）                 │
│ ┌───────────────────────────┐   │
│ │                           │   │
│ └───────────────────────────┘   │
│                                  │
│ [退回]              [通過並發布] │
└─────────────────────────────────┘
```

### 行為規則

- **通過**：呼叫 `approveVersion`，關閉 Drawer，toast「已發布 [版本號]」
- **退回**：呼叫 `rejectVersion(feedback)`，關閉 Drawer，toast「已退回，可重新編輯後送審」
- **查看完整內容**：路由至 KnowledgeEditor（唯讀模式，未來擴充；現階段直接 push editor）
- **與前版比較**：開啟現有 VersionCompareModal，自動帶入前一版與本版 ID

---

## 5. UI 入口變更

### 5.1 KnowledgeBase.vue（列表頁）

- 更多選單：當 `item.status === 'REVIEWING'` 時，加入「審核」選項 → 開啟 ReviewDrawer
- 統計卡「版本審核中」加 `cursor-pointer`，點擊後 `filterStatus = 'REVIEWING'`

### 5.2 KnowledgeDetail.vue（詳情頁）

- 狀態為 `REVIEWING` 時：「撤回審核」按鈕旁加「開始審核」按鈕 → 開啟 ReviewDrawer
- 撤回審核實作：呼叫現有 `submitForReview` 的逆操作（新增 `withdrawReview` store method，`REVIEWING → DRAFT`，reviewHistory 新增 `WITHDRAWN`）

---

## 6. 稽核紀錄顯示

`VersionHistoryDrawer` 的每個版本項目下方，若有 `reviewHistory`，展開顯示操作紀錄時間軸（送審 → 通過/退回），讓管理者可快速追溯。

---

## 7. 不在此次範圍內

- Email / 系統通知推送
- 多審核人 / 審核層級
- 審核期限設定
- 批次審核

---

## 8. 影響檔案清單

| 檔案 | 動作 |
|------|------|
| `src/stores/knowledgeStore.ts` | 修改 `submitForReview`；新增 `approveVersion`、`rejectVersion`、`withdrawReview` |
| `src/components/Knowledge/ReviewDrawer.vue` | 新建 |
| `src/views/KnowledgeBase.vue` | 更多選單加「審核」入口；統計卡可點擊篩選 |
| `src/views/KnowledgeDetail.vue` | 加「開始審核」按鈕；實作「撤回審核」 |
| `src/components/Knowledge/VersionHistoryDrawer.vue` | 新增 reviewHistory 時間軸顯示 |
| `src/scss/views/_KnowledgeBase.scss` | ReviewDrawer 樣式 |
