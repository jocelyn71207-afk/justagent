# 更新原始檔案流程設計

**日期**：2026-06-08  
**狀態**：已確認  
**範疇**：知識內容管理 — 來源檔案版本更新與重新轉換

---

## 背景

使用者上傳檔案並將其轉換為知識內容後，當來源檔案有新版本時，需要一套明確的流程讓使用者能夠更新來源、重新觸發轉換、並產生新的知識版本草稿。

---

## 設計決策

| 決策 | 選擇 | 理由 |
|------|------|------|
| 入口數量 | 兩個（資源庫 + 知識頁） | 使用者可能從不同情境發起操作 |
| 重轉換觸發方式 | 手動（使用者決定） | 避免自動觸發造成不預期的版本 |
| 知識頁操作 UI | Modal（SourceUpdateModal） | 與現有元件風格一致，上傳區域放置更自然 |
| 版本策略 | 自動建立 MINOR 草稿 | 保持舊版 active，新版審核通過才發布 |
| 來源選擇 | 資源庫已有版本 OR 直接上傳新檔 | 兩種情境都要支援 |

---

## 流程設計

### 分工原則

- **資源庫**：負責「管理檔案版本」，上傳後背景標記受影響知識，不主動介入重轉換
- **知識頁**：負責「決定是否重新轉換」，讀取 `sourceStale` 標記後讓使用者選擇操作

---

### 入口一：資源庫

**觸發條件**：使用者在共用資源庫對已有檔案選擇「替換新版本」

**流程**：

1. 使用者點擊檔案卡片「⋯」選單 → 選「替換新版本」
2. 彈出上傳介面（重用 AppBatchUpload），顯示警告：
   > 此檔案已被 N 筆知識條目引用。更新後，相關知識條目將顯示「來源已更新」提示。
3. 使用者上傳新版本檔案
4. 上傳成功後：
   - 呼叫 `resourceStore.uploadNewVersion(fileId)` — 版本遞增
   - 呼叫 `knowledgeStore.markFileStale(fileId, newVersion)` — 標記受影響知識條目
   - 顯示 Toast：「product_catalog.pdf 已更新至 v2，N 筆知識條目來源已標記待更新」
   - Toast 含「前往知識內容管理 →」快速跳轉連結
5. 資源庫流程結束，不再介入

**資源庫不處理**：知識重轉換、草稿建立、Pipeline 觸發

---

### 入口二：知識頁

**觸發條件**：知識條目 `sourceStale === true`（由資源庫更新流程或其他途徑標記）

#### Step 1 — 知識列表 badge

- 受影響條目顯示 amber badge：「⚠ 來源已更新」
- Badge 可點擊，直接進入詳情頁

#### Step 2 — 知識詳情頁 banner

- 頁面頂部顯示 amber banner：
  - 單個 stale 檔案：`⚠ 來源檔案已更新 · product_catalog.pdf v1 → v2 · 2026-06-07`
  - 多個 stale 檔案：`⚠ 2 個來源檔案已更新 · product_catalog.pdf、faq_list.xlsx`
- 右側「處理更新」按鈕，點擊後開啟 SourceUpdateModal（Modal 內列出所有 stale 檔案）

#### Step 3 — SourceUpdateModal

Modal 提供三個選項：

**① 使用資源庫 v2 重新轉換**（推薦選項，視覺強調）
- 以資源庫中最新版本自動建立 MINOR 草稿
- 更新 `sourceFiles.linkedVersion` 至最新
- 呼叫 `knowledgeStore.createDraftFromSourceUpdate()`
- 清除 `sourceStale` 標記與 `staleSourceFileIds`

**② 上傳全新版本的檔案**
- 使用者有資源庫以外的新版本檔案
- Modal 內嵌上傳區（拖曳 or 點選，**只允許上傳 1 個替換檔案**）
- 上傳完成後（依序執行）：
  1. 呼叫 `resourceStore.addFileFromUpload()` — 新增至資源庫，取得新 `fileId`
  2. 呼叫 `knowledgeStore.createDraftFromSourceUpdate()` — 傳入新 `fileId`，內部更新 `sourceFiles` 並建立草稿
  3. 清除 stale 標記（createDraftFromSourceUpdate 內部處理）

**③ 稍後處理**
- 關閉 Modal，不執行任何 store 操作
- `sourceStale` 標記保留，banner 與 badge 持續顯示直到使用者明確處理

#### Step 4 — 建立草稿後

選擇 ① 或 ② 確認後：
- 顯示 loading 提示「正在建立 v1.x 草稿...」
- 自動跳轉至 `KnowledgeEditor`（`/view/KnowledgeEditor/:knowledgeId/:newVersionId`）
- 原 active 版本（v1.2）**維持不變**，直到新草稿通過審核後才替換

---

## 資料流

```
資源庫替換版本
  → resourceStore.uploadNewVersion(fileId)
  → knowledgeStore.markFileStale(fileId, newVersion)
      → 遍歷 knowledgeList，找出 sourceFiles 含該 fileId 且 linkedVersion < newVersion 的條目
      → 設定 k.sourceStale = true, k.staleSourceFileIds.push(fileId)

知識頁選擇「重新轉換」
  → knowledgeStore.createDraftFromSourceUpdate(knowledgeId, getFile)
      → 取得 active 版本作為 base
      → MINOR 版本號遞增（e.g. v1.2 → v1.3）
      → 更新 sourceFiles.linkedVersion 至最新
      → 新建 draft 版本，status = 'draft'
      → k.sourceStale = false, k.staleSourceFileIds = []
      → 回傳新版本 ID → router.push KnowledgeEditor
```

---

## UI 元件影響範圍

| 元件 | 變更說明 |
|------|---------|
| `ResourceFile` 卡片（資源庫）| 新增「替換新版本」選單項目；上傳前顯示知識關聯警告 |
| `AppBatchUpload` | 新增 `mode="replace"` 支援單檔替換（帶 fileId context） |
| `KnowledgeBase.vue` 列表 | 「來源已更新」badge 已有；確保 badge 使用 `--color-warning` CSS custom property |
| `KnowledgeDetail.vue` | 新增頂部 stale banner（單/複數文案）+ 「處理更新」按鈕，觸發 SourceUpdateModal |
| `SourceUpdateModal.vue` | 重構：加入選項 ②（上傳新檔）的嵌入單檔上傳區；選項 ① 使用強調邊框與背景色凸顯推薦 |
| `knowledgeStore.ts` | `createDraftFromSourceUpdate` 需擴充：支援傳入 `newFileId`（選項 ② 新上傳檔案）以覆蓋 sourceFiles |
| `resourceStore.ts` | `uploadNewVersion` 上傳完成後需回呼通知知識頁（emit event 或 callback）以觸發 stale 標記 |

---

## 邊界情況

| 情境 | 處理方式 |
|------|---------|
| 一個檔案被多筆知識條目引用 | `markFileStale` 遍歷全部，每筆條目各自顯示 banner；使用者分別處理 |
| 知識條目已有進行中的草稿 | SourceUpdateModal 提示「目前已有 draft v1.x，確認是否另建新草稿？」 |
| 選項 ② 上傳失敗 | Modal 顯示上傳錯誤，保持選項 ② 區域可重試，不關閉 Modal |
| 使用者點「稍後處理」後立即進入編輯器 | 進入舊版 active 的 KnowledgeEditor，banner 不顯示於編輯器頁面 |
| 選擇 ③ 後再次進入詳情頁 | Banner 依然顯示（stale 標記未清除）；dismissSourceStale 只有明確操作才觸發 |

---

## 未在此次範疇內

- 批次更新多筆知識條目（方案 C 的 Wizard 體驗）
- AI 自動比對新舊版本差異（VersionCompareModal 的 diff 功能，目前為 mock）
- 知識條目重轉換後的 Pipeline 進度即時顯示（現有模擬已覆蓋）
