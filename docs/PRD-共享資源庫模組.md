# PRD — 共享資源庫模組

**產品**：JustAgent  
**模組範圍**：共用檔案管理 ＋ 知識內容管理  
**文件版本**：v1.2  
**文件日期**：2026-05-21  
**文件狀態**：切版完成，API 串接待實作

---

## 版本歷程

| 版本 | 日期 | 修訂摘要 | 作者 |
|------|------|----------|------|
| v0.1 | 2026-05-10 | 初版草稿：功能清單＋狀態機 | 產品設計 |
| v1.0 | 2026-05-18 | 新增 UI 切版成果說明、Modal 清單 | 產品設計 |
| v1.1 | 2026-05-20 | 補充 CreateKnowledgeWizardModal 重構記錄 | 前端開發 |
| v1.2 | 2026-05-21 | 全面擴充至正式 PRD 深度：wireframe、設計規格、API、權限矩陣、開發計畫 | 產品設計 |

---

## 目錄

1. [產品概述](#1-產品概述)
   - 1.1 背景與動機
   - 1.2 設計哲學
   - 1.3 使用者角色
   - 1.4 KPI 目標
2. [系統架構](#2-系統架構)
   - 2.1 模組關係圖
   - 2.2 前端元件樹
   - 2.3 資料流總覽
3. [共用檔案管理功能規格](#3-共用檔案管理-resourcelibrary)
   - 3.1 頁面佈局 Wireframe
   - 3.2 篩選功能
   - 3.3 視圖模式
   - 3.4 檔案操作
   - 3.5 上傳流程
   - 3.6 狀態定義
   - 3.7 分頁與空狀態
4. [知識內容管理功能規格](#4-知識內容管理-knowledgebase)
   - 4.1 主列表頁 Wireframe
   - 4.2 統計卡區
   - 4.3 篩選與批次操作
   - 4.4 知識條目表格
   - 4.5 新增知識精靈
   - 4.6 知識條目詳情頁
   - 4.7 知識條目編輯器
   - 4.8 資料來源 Tab
   - 4.9 連接 API 精靈
5. [非功能需求](#5-非功能需求)
   - 5.1 效能
   - 5.2 安全性
   - 5.3 可用性與 SLA
   - 5.4 合規性
6. [UI / UX 設計規格](#6-ui--ux-設計規格)
   - 6.1 設計語彙（Design Tokens）
   - 6.2 版面結構
   - 6.3 元件樣式規範
   - 6.4 互動行為規範
7. [Data Pipeline 規格](#7-data-pipeline-規格)
   - 7.1 Ingestion Pipeline 流程
   - 7.2 狀態轉移圖
   - 7.3 管線參數設定
8. [API 整合規格](#8-api-整合規格)
   - 8.1 外部 REST API 來源整合
   - 8.2 S3 上傳例外
9. [開發計畫](#9-開發計畫)
   - 9.1 Phase 1 — MVP
   - 9.2 Phase 2 — 審核流程
   - 9.3 Phase 3 — 智能化
   - 9.4 里程碑時程
10. [附錄](#附錄)
    - 附錄 A：資料庫 Schema（PostgreSQL）
    - 附錄 B：API 端點清單
    - 附錄 C：角色權限矩陣
    - 附錄 D：術語表

---

## 1. 產品概述

### 1.1 背景與動機

JustAgent 是以**企業→團隊→專案**三層架構為基礎的 AI 協作平台。隨著各業務單位累積的文件、規章、作業說明愈來愈多，「如何讓 AI Agent 使用正確、最新的知識回答問題」成為企業痛點。

共享資源庫模組解決兩個核心問題：

1. **原始檔案散落**：各成員私自保存，版本不一，AI 無從查詢。
2. **知識無從追蹤**：修改歷程不透明，審核流程缺失，AI 可能引用已過時的知識。

本模組以「**先上傳原始檔案，再轉化為結構化知識**」為核心流程，讓原始資產與 AI 可用的知識內容保持清晰的對應關係，並透過版本審核機制確保知識品質。

---

### 1.2 設計哲學

| 原則 | 說明 |
|------|------|
| **原件優先** | 系統永遠保存原始檔案，知識內容是衍生物，兩者互相關聯但不相互取代 |
| **流程可見** | Pipeline 進度、審核狀態、版本歷程全部對使用者透明，不設黑盒 |
| **最小摩擦** | 上傳即觸發 Pipeline；來源端一有更新即通知；草稿隨時可存，不強迫一次完成 |
| **權責分明** | 建立者、審核者、管理者各司其職，透過 RBAC 限制敏感操作 |

---

### 1.3 使用者角色

| 角色 | 英文代稱 | 典型使用情境 |
|------|----------|--------------|
| 一般成員 | `member` | 上傳個人相關文件，查閱已發布知識 |
| 知識編輯者 | `editor` | 建立、編輯知識條目草稿，送出審核 |
| 審核者 | `reviewer` | 審查知識草稿，核准或退回 |
| 團隊管理員 | `admin` | 管理 API 來源，批次封存/刪除，設定可見範圍 |
| 企業超管 | `super_admin` | 跨團隊管理，設定合規政策 |

---

### 1.4 KPI 目標

| 指標 | 目標值 | 量測方式 |
|------|--------|----------|
| Pipeline 完成率 | ≥ 95% | 成功完成 Pipeline 的條目數 / 觸發總數 |
| 知識首次同步成功率 | ≥ 90% | API 來源首次 `triggerSync` 成功比例 |
| 頁面首次可互動時間（TTI） | ≤ 2s（P90） | 知識列表頁載入完成 |
| 審核周轉天數 | ≤ 3 個工作天（P75） | `reviewing` → `active` / `rejected` 時間差 |
| 使用者知識條目採用率 | ≥ 60% | 30 天內至少被 Agent 查詢一次的條目比例 |

---

## 2. 系統架構

### 2.1 模組關係圖

```
┌─────────────────────────────────────────────────────────────────────┐
│                         JustAgent 平台                              │
│                                                                     │
│  ┌──────────────────────┐       ┌───────────────────────────────┐  │
│  │   共用檔案管理        │       │     知識內容管理               │  │
│  │  (ResourceLibrary)   │──────►│     (KnowledgeBase)           │  │
│  │                      │建立為  │                               │  │
│  │  原始檔案上傳、儲存   │知識內容│  知識條目 CRUD + 審核 + 版本  │  │
│  └──────────────────────┘       └──────────────┬────────────────┘  │
│                                                │                    │
│                                    ┌───────────▼──────────────┐    │
│                                    │    AI Ingestion Pipeline  │    │
│                                    │  chunking → embedding     │    │
│                                    │         → indexing        │    │
│                                    └───────────┬──────────────┘    │
│                                                │                    │
│                                    ┌───────────▼──────────────┐    │
│                                    │   向量資料庫 / 索引服務    │    │
│                                    │  (供 Agent RAG 查詢使用)  │    │
│                                    └──────────────────────────┘    │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   外部 API 資料來源                           │  │
│  │   自訂 REST API / Google Drive / Notion / SharePoint / Slack │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 2.2 前端元件樹

```
src/views/
├── ResourceLibrary.vue          ← 共用檔案管理主頁
└── KnowledgeBase.vue            ← 知識內容管理主頁
    ├── [Tab] 知識條目
    └── [Tab] DataSourceTab.vue  ← 資料來源管理

src/views/
├── KnowledgeDetail.vue          ← 條目詳情（4 個子 Tab）
└── KnowledgeEditor.vue          ← 草稿編輯器

src/components/Knowledge/
├── CreateKnowledgeWizardModal.vue
├── CreateVersionModal.vue
├── ConnectApiWizard.vue
├── EditApiSourceModal.vue
├── ReviewDrawer.vue
├── SubmitReviewModal.vue
├── VersionCompareModal.vue
└── RestoreVersionModal.vue

src/components/
└── AppMenuTree.vue              ← 側欄導航（含 ResourceLibrary & KnowledgeBase 連結）

src/stores/
├── knowledgeStore.ts            ← 知識條目、版本、API 來源狀態
└── resourceStore.ts             ← 資源檔案狀態
```

---

### 2.3 資料流總覽

```
使用者上傳檔案
      │
      ▼
resourceStore.uploadFile()
      │ POST /resources/upload（multipart）
      ▼
後端儲存至 S3（直接 axios.put，不走 http.ts，避免夾帶 auth header）
      │
      ▼
資源狀態：uploading → parsing → stored / failed
      │
      ├── 使用者點「建立為知識內容」
      │         │
      │         ▼
      │   CreateKnowledgeWizardModal（prefillFile 跳過來源選擇）
      │         │
      │         ▼
      │   knowledgeStore.createKnowledge()
      │         │ POST /knowledge
      │         ▼
      │   狀態：pending（手動輸入）
      │           → processing（Pipeline 觸發後）
      │
      └── 直接上傳 FILE 來源的知識
                │
                ▼
          triggerPipeline()
                │
                ▼
         chunking → embedding → indexing
                │
                ▼
          狀態：active（Pipeline 完成）
```

---

## 3. 共用檔案管理（ResourceLibrary）

### 3.1 頁面佈局 Wireframe

```
┌─────────────────────────────────────────────────────────────────────┐
│  [breadcrumb] 共享資源庫 / 共用檔案管理                              │
│                                                                     │
│  共用檔案管理                                        共 42 個檔案   │
├─────────────────────────────────────────────────────────────────────┤
│  [全部檔案] [資料入庫型] [原檔保存型]        [檔案類型 ▼]  [⊞] [≡] [↑上傳檔案] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │ 檔名...  ⋯│ │ 檔名...  ⋯│ │ 檔名...  ⋯│ │ 檔名...  ⋯│             │
│  │          │ │          │ │          │ │          │             │
│  │  [PDF]   │ │  [IMG]   │ │  [XLSX]  │ │  [DOCX]  │             │
│  │          │ │  縮圖    │ │          │ │          │             │
│  │──────────│ │──────────│ │──────────│ │──────────│             │
│  │ ●已入庫  │ │ ●已儲存  │ │ ◌解析中  │ │ ●已入庫  │             │
│  │ 2026-05-20│ │2026-05-19│ │2026-05-21│ │2026-05-18│             │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘             │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ...                       │
│  │ ...      │ │ ...      │ │ ...      │                            │
│  └──────────┘ └──────────┘ └──────────┘                            │
│                                                                     │
│                         ◀ 1  2  3  4 ▶                             │
└─────────────────────────────────────────────────────────────────────┘
```

**清單視圖（List / Table）**

```
┌─────────────────────────────────────────────────────────────────────┐
│  [全部檔案] [資料入庫型] [原檔保存型]   [檔案類型 ▼]  [⊞] [≡] [↑上傳] │
├──────┬───────────────────────┬────────┬──────────┬──────────┬─────┤
│      │ 檔案名稱               │ 格式   │ 處理方式 │ 狀態     │ 操作│
├──────┼───────────────────────┼────────┼──────────┼──────────┼─────┤
│ [🖹] │ 產品使用手冊v3.pdf     │ PDF    │ 資料入庫 │ ●已入庫 │  ⋯  │
│ [🖼]│ 品牌識別規範.png        │ IMAGE  │ 原檔保存 │ ●已儲存 │  ⋯  │
│ [📊] │ 季度報表Q1.xlsx        │ EXCEL  │ 資料入庫 │ ◌解析中 │  ⋯  │
│ [📝] │ 客服標準話術.docx      │ WORD   │ 資料入庫 │ ●已入庫 │  ⋯  │
└──────┴───────────────────────┴────────┴──────────┴──────────┴─────┘
│                         ◀ 1  2  3  4 ▶                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 3.2 篩選功能

#### 3.2.1 處理方式 Tabs

| Tab 標籤 | Value | 篩選邏輯 |
|----------|-------|----------|
| 全部檔案 | `ALL` | 不過濾 |
| 資料入庫型 | `AI_PARSED` | `processType === 'AI_PARSED'` |
| 原檔保存型 | `RAW` | `processType === 'RAW'` |

切換 Tab 後，`currentPage` 重置為 1。

#### 3.2.2 檔案類型下拉

支援值：`PDF`、`PPT`、`EXCEL`、`IMAGE`、`HTML`、`WORD`、`MD`、`TXT`、`CHART`、`OTHER`、`全部`（預設）。

切換後 `currentPage` 重置為 1。

---

### 3.3 視圖模式

#### 3.3.1 卡片視圖（Card）

| 區域 | 內容 |
|------|------|
| Header | 檔案名稱（溢出截斷）＋ 右上角 `more_horiz` 按鈕 |
| Body | IMAGE → 圖片縮圖；OTHER → `?` 圖示＋tooltip；其他 → 對應 SVG |
| Footer | 狀態 Badge ＋ `lastModify` 時間戳 |

#### 3.3.2 清單視圖（List Table）

欄位順序：縮圖/圖示 → 檔案名稱 → 格式 → 處理方式 → 狀態 → 最後更新時間 → 操作（`⋯` 按鈕）

---

### 3.4 檔案操作（More 選單）

```
┌───────────────────┐
│  ✏ 編輯檔案名稱   │
│  ↓ 下載檔案       │
│  📖 建立為知識內容 │
│  🗑 刪除          │
└───────────────────┘
```

| 操作 | 說明 | 前置條件 |
|------|------|----------|
| 編輯檔案名稱 | Inline 輸入框；blur 時儲存；空值不允許儲存 | 無 |
| 下載檔案 | 下載原始檔案 | 待 API 串接 |
| 建立為知識內容 | 帶入 `prefillFile = { fileId, fileName }` 開啟 `CreateKnowledgeWizardModal`，跳過來源類型選擇步驟 | `status !== 'uploading' && status !== 'parsing'` |
| 刪除 | 開啟確認 Dialog（「刪除後將無法復原」），確認後呼叫 `resourceStore.deleteFile` | 無 |

More 選單在滑鼠離開父容器時（`@mouseleave`）自動收合。

---

### 3.5 上傳流程

```
使用者點擊「↑ 上傳檔案」
        │
        ▼
  原生 <input type="file"> 觸發
        │
        ▼
  resourceStore.uploadFile(file)
        │
   ┌────▼─────────────────────────┐
   │ 1. POST /resources/presign   │
   │    → 取得 S3 presigned URL   │
   │ 2. axios.put(url, file)      │  ← 直接上傳 S3，不走 http.ts
   │    （避免夾帶 Authorization  │
   │     header 導致 403）        │
   │ 3. POST /resources/confirm   │
   │    → 通知後端上傳完成        │
   └────┬─────────────────────────┘
        │
        ▼
  Resource 狀態：uploading → parsing → stored / failed
```

---

### 3.6 狀態定義

| 狀態值 | 顯示標籤 | Badge 顏色 | 說明 |
|--------|----------|-----------|------|
| `uploading` | 上傳中 | 灰色 | 正在上傳至 S3 |
| `parsing` | 解析中 | 藍色 | 後端解析檔案格式 |
| `stored` | 已入庫 | 綠色 | AI 解析完成，已建立向量索引 |
| `saved` | 已儲存 | 綠色 | 原檔保存，無 AI 解析 |
| `failed` | 失敗 | 紅色 | 上傳或解析失敗 |

---

### 3.7 分頁與空狀態

- **分頁**：`compPagination`；每頁 10 筆；篩選結果為 0 時隱藏分頁列。
- **載入中**：`AppSkeleton type="list"`
- **API 錯誤**：`AppErrorState`，含錯誤訊息與「重試」按鈕
- **無資料**：顯示「目前沒有資源」提示文字

---

## 4. 知識內容管理（KnowledgeBase）

### 4.1 主列表頁 Wireframe

```
┌─────────────────────────────────────────────────────────────────────┐
│  [breadcrumb] 共享資源庫 / 知識內容管理                             │
│  知識內容管理                                                       │
├─────────────────────────────────────────────────────────────────────┤
│  [📖 知識條目]  [🔗 資料來源]                                       │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────┐│
│  │ 📄 全部  │  │ ✓ 已發布 │  │ ↻ 需更新 │  │ 👁 審核中│  │ ⚙處理中││
│  │   42     │  │   28     │  │    5     │  │    3     │  │    6 ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────┘│
├─────────────────────────────────────────────────────────────────────┤
│  [全部] [商品文件] [系統文件] [客服知識] [規則說明]                 │
│                              [狀態 ▼]  [+ 新增知識]               │
├──────┬────────────────────────┬──────────┬──────┬──────────┬──────┤
│  ☐  │ 標題 / 分類             │ 狀態     │ 版本 │ 最後更新 │ 操作 │
├──────┼────────────────────────┼──────────┼──────┼──────────┼──────┤
│  ☐  │ 產品使用說明書          │ ✓已發布  │ 2.1  │05-20     │  ⋮  │
│     │  商品文件               │          │      │          │      │
├──────┼────────────────────────┼──────────┼──────┼──────────┼──────┤
│  ☐  │ 客服標準話術            │ ↻需更新  │ 1.3  │05-19     │  ⋮  │
│     │  客服知識  [來源已更新] │          │      │          │      │
│     │ ▓▓▓▓▓▓▓░░░ 分段中 62% │          │      │          │      │
├──────┼────────────────────────┼──────────┼──────┼──────────┼──────┤
│  ☐  │ 系統操作手冊 v3        │ 👁審核中  │ 3.0  │05-18     │  ⋮  │
│     │  系統文件               │          │      │          │      │
└──────┴────────────────────────┴──────────┴──────┴──────────┴──────┘
│                         ◀ 1  2  3  4 ▶                             │
└─────────────────────────────────────────────────────────────────────┘
```

**批次工具列（勾選後出現，取代篩選列）**

```
┌─────────────────────────────────────────────────────────────────────┐
│  已選 3 筆    [批次封存]  [批次刪除]                       ✕ 取消  │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 4.2 統計卡區

5 個統計卡橫排，各含 icon、數字、標籤：

| 統計項 | Icon | 主色調 | 計算邏輯 |
|--------|------|--------|----------|
| 全部 | `description` | 品牌主色 | `knowledgeList.length` |
| 已發布 | `verified` | 綠色 `#16a34a` | `status === 'active'` |
| 需更新 | `update` | 琥珀色 `#b45309` | `status === 'needs_update'` |
| 審核中 | `rate_review` | 藍色 `#2563eb` | `status === 'reviewing'` |
| 處理中 | `sync` | 紫色 `#7c3aed` | `status === 'processing' \| 'pending'` |

---

### 4.3 篩選與批次操作

#### 分類 Tab

從 `knowledgeList` 動態產生唯一分類值，預置「全部」，切換時重置 `currentPage = 1`。

#### 狀態下拉

| 顯示值 | filter value |
|--------|-------------|
| 全部狀態 | `''` |
| 已發布 | `'active'` |
| 處理中 | `'processing'` |
| 審核中 | `'reviewing'` |
| 需更新 | `'needs_update'` |
| 待處理 | `'pending'` |
| 失敗 | `'failed'` |
| 已封存 | `'archived'` |

#### 批次工具列

勾選 ≥ 1 筆時，隱藏篩選列，顯示批次工具列：

```
已選 N 筆 | [批次封存] [批次刪除] | ✕ 取消
```

- **批次封存**：`popDialog.confirm` → `knowledgeStore.batchArchive(selectedIds)`
- **批次刪除**：`popDialog.confirm` → `knowledgeStore.batchDelete(selectedIds)`
- **取消**：`selectedIds = []` 回到篩選列

---

### 4.4 知識條目表格

#### 欄位定義

| # | 欄位 | 寬度 | 內容 |
|---|------|------|------|
| 1 | Checkbox | 36px | 全頁全選 / 單選；`isAllSelected` computed |
| 2 | 標題 / 分類 | 彈性 | 標題（點擊跳轉詳情頁）＋ 分類小字；`needs_update` 顯示「來源已更新」badge；`processing` 顯示進度條 |
| 3 | 狀態 | 130px | `status-badge` icon ＋ 文字 |
| 4 | 版本 | 90px | `active` 版本號；無則「—」 |
| 5 | 最後更新 | 130px | `lastUpdateTime` |
| 6 | 操作 | 60px | `more_vert` 按鈕，點擊展開 ops-dropdown |

#### Pipeline 進度條（`processing` 狀態）

```
▓▓▓▓▓▓▓░░░  分段中 62%
```

- 進度條寬度 = `item.pipelineProgress + '%'`
- 階段標籤：`chunking` → 分段中；`embedding` → 向量化；`indexing` → 建立索引

#### 操作選單（依狀態動態顯示）

```
┌──────────────────────┐
│ 👁  查看              │  永遠顯示
│ ➕  建立新版本        │  active
│ 📦  封存              │  active
│ ✏   繼續編輯          │  有 draft/rejected 版本且非 reviewing/processing
│ ↩   撤回審核          │  reviewing
│ 📋  開始審核          │  reviewing
│ 🔄  重新觸發 Pipeline │  needs_update | failed
│ 🗑  刪除              │  status !== 'processing'
└──────────────────────┘
```

---

### 4.5 新增知識精靈（CreateKnowledgeWizardModal）

#### Wireframe — 步驟 1：選擇來源類型

```
┌─────────────────────────────────────────────────┐
│  ✕  新增知識條目                                │
├─────────────────────────────────────────────────┤
│                                                 │
│  選擇知識來源                                   │
│                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐│
│  │     📄      │  │     🔗      │  │    ✏    ││
│  │  上傳檔案   │  │  API 來源   │  │ 直接輸入 ││
│  │             │  │             │  │          ││
│  │  PDF / DOCX │  │  使用已連接  │  │ Markdown ││
│  │  / XLSX     │  │  的外部 API │  │  編輯器  ││
│  └──── ○ ─────┘  └──── ○ ─────┘  └──── ○ ───┘│
│                                                 │
│  分類 *  [商品文件 ▼]                           │
│  標籤    [輸入標籤，按 Enter 新增]              │
│                                                 │
│  ─────────────────────────────────────────     │
│  若選「上傳檔案」時顯示：                       │
│  ┌────────────────────────────────────┐        │
│  │  拖曳或點選檔案                    │        │
│  │  支援 PDF、DOCX、XLSX              │        │
│  │  上限 50MB                         │        │
│  └────────────────────────────────────┘        │
│                     [取消]  [建立知識]          │
└─────────────────────────────────────────────────┘
```

#### 三種來源類型比較

| 屬性 | FILE | API | MANUAL |
|------|------|-----|--------|
| 來源 | 上傳 PDF/DOCX/XLSX（≤ 50MB） | 已連接的 ApiSource | 手動輸入 |
| 觸發動作 | 執行 Pipeline（chunking → embedding → indexing） | 執行 Pipeline | 建立草稿，跳轉 KnowledgeEditor |
| 初始狀態 | `processing` | `processing` | `draft`（版本） |
| 分類必填 | ✅ | ✅ | ✅ |
| 標籤 | 選填 | 選填 | 選填 |

#### prefillFile 模式

當由 ResourceLibrary 帶入 `prefillFile: { fileId, fileName }` 時：

1. 跳過「選擇來源類型」步驟，直接顯示分類/標籤表單
2. 來源類型固定為 `FILE`
3. 提交後不觸發 Pipeline，而是直接建立草稿並跳轉 KnowledgeEditor

---

### 4.6 知識條目詳情頁（KnowledgeDetail）

#### Wireframe

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← 返回知識內容管理     產品使用說明書                 [建立新版本] │
├─────────────────────────────────────────────────────────────────────┤
│  [概覽]  [版本歷程]  [分段預覽]  [轉換結果]                         │
├──────────────────────────────────┬──────────────────────────────────┤
│                                  │  版本資訊                        │
│  ## 產品使用說明書                │  ┌────────────────────────────┐ │
│                                  │  │ 版本  v2.1  ●已發布         │ │
│  本文件說明 JustAgent 主要功能   │  │ 更新人 王小明  2026-05-20   │ │
│  及操作流程，適用版本 3.x。      │  │ 更新說明：修正第三章錯誤    │ │
│                                  │  └────────────────────────────┘ │
│  ### 1. 快速開始                 │                                  │
│  ...                             │  分類 & 標籤                     │
│                                  │  [商品文件]  #手冊  #v3          │
│  ### 2. 進階設定                 │  AI標籤：#onboarding  #guide     │
│  ...                             │                                  │
│                                  │  Pipeline                        │
│                                  │  ✓ 分段（128 chunks）           │
│                                  │  ✓ 向量化（text-embedding-3）   │
│                                  │  ✓ 建立索引                     │
│                                  │                                  │
│                                  │  來源附件                        │
│                                  │  📄 使用手冊v3.pdf               │
└──────────────────────────────────┴──────────────────────────────────┘
```

#### 頁面操作列（依狀態顯示）

| 條目狀態 | 顯示操作 |
|----------|----------|
| `active` | 有草稿時：「繼續編輯草稿」；「建立新版本」 |
| `reviewing` | 「撤回審核」「開始審核」 |
| `processing` | 唯讀文字「Pipeline 處理中」 |
| `needs_update` / `failed` | 「重新觸發 Pipeline」 |
| `pending` | 唯讀文字「待處理」 |
| 其他有 `draft`/`rejected` | 「繼續編輯草稿」 |

#### Tab 1 — 概覽

- 左側：`markdown-content` 渲染知識內容（含摘要標題）
- 右側 `detail-sidebar-card`：版本資訊、分類 & 標籤（含系統 AI 標籤）、Pipeline 狀態、來源附件

#### Tab 2 — 版本歷程

```
●─── v2.1  ●已發布  MINOR  2026-05-20  修正第三章錯誤  王小明
│
●─── v2.0  ◎歷史版 MAJOR  2026-04-15  重構第二章      李大華   [還原為草稿] [與目前版比較]
│
●─── v1.3  ◎歷史版 MINOR  2026-03-01  補充 FAQ        王小明   [還原為草稿] [與目前版比較]
```

`history` 狀態版本：可「還原為草稿」（`RestoreVersionModal`）、「與目前版比較」（`VersionCompareModal`）

#### Tab 3 — 分段預覽

```
┌──────────────────────────────────────────────────────────┐
│  #1  本文件說明 JustAgent 主要功能...          127 tokens │
├──────────────────────────────────────────────────────────┤
│  #2  1. 快速開始：進入 /entrance 頁面後...     98 tokens │
├──────────────────────────────────────────────────────────┤
│  #3  2. 進階設定：點擊右上角齒輪圖示...       112 tokens │
└──────────────────────────────────────────────────────────┘
```

#### Tab 4 — 轉換結果

```
┌────────────────────────────────────────────┐
│  向量化狀態       ✓ 完成                   │
│  Embedding 模型   text-embedding-3-small   │
│  向量維度         1536                     │
│  已向量化 Chunks  128 / 128                │
│  最後更新         2026-05-20 14:32         │
└────────────────────────────────────────────┘
```

---

### 4.7 知識條目編輯器（KnowledgeEditor）

#### Wireframe

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← 返回                [儲存草稿]  [送出審核]                        │
├─────────────────────────────────────────────────────────────────────┤
│ ⚠ 目前為草稿 v2.2 — 審核通過並發布前，使用者看到的是 v2.1 的內容  │
├────────────────────────────────────┬────────────────────────────────┤
│                                    │  分類                          │
│  知識標題 *                        │  [商品文件 ▼]                  │
│  ┌──────────────────────────────┐ │                                │
│  │ 產品使用說明書                │ │  標籤                          │
│  └──────────────────────────────┘ │  [手冊] [v3] ✕  [+ 新增]      │
│                                    │                                │
│  內容摘要                          │  關聯來源檔案                  │
│  ┌──────────────────────────────┐ │  📄 使用手冊v3.pdf  ✕          │
│  │ 本文件說明 JustAgent ...     │ │  [從共用檔案管理選取] ← 開發中 │
│  └──────────────────────────────┘ │                                │
│                                    │  可見範圍                      │
│  知識內容 *                        │  [● 全部成員]                  │
│  ┌──────────────────────────────┐ │  [ ] 僅限本團隊                │
│  │ ## 產品使用說明書             │ │  [ ] 僅限管理者                │
│  │                              │ │                                │
│  │ 本文件說明 JustAgent 主要   │ │  本次更新說明 *                │
│  │ 功能及操作流程...            │ │  ┌──────────────────────────┐ │
│  │                              │ │  │ 修正第三章排版問題        │ │
│  │ ### 1. 快速開始              │ │  └──────────────────────────┘ │
│  │ ...                          │ │                                │
│  └──────────────────────────────┘ │  版本狀態資訊                  │
│                                    │  狀態：草稿                    │
│                                    │  草稿版本：v2.2               │
│                                    │  前一正式版：v2.1             │
│                                    │  最後編輯：王小明              │
│                                    │  建立時間：2026-05-21 09:15   │
└────────────────────────────────────┴────────────────────────────────┘
```

#### 欄位規格

**左側（col-8）**

| 欄位 | 必填 | 元件 | 驗證 |
|------|------|------|------|
| 知識標題 | ✅ | `<input type="text">` | 非空 |
| 內容摘要 | — | `<textarea>` | 無 |
| 知識內容 | ✅ | `<textarea>`（Markdown） | 非空 |

**右側（col-4）**

| 欄位 | 必填 | 元件 | 備注 |
|------|------|------|------|
| 分類 | — | `compDropDown` | 預設：商品文件、系統文件、客服知識、規則說明 |
| 標籤 | — | Tag input | Enter 新增；Backspace 刪除最後一個 |
| 關聯來源檔案 | — | — | 「從共用檔案管理選取」功能開發中 |
| 可見範圍 | — | Radio | 全部成員（預設）/ 僅限本團隊 / 僅限管理者 |
| 本次更新說明 | ✅ | `<textarea>` | 儲存草稿與送出審核前均須填寫 |

#### 操作行為

| 按鈕 | 驗證 | 行為 |
|------|------|------|
| 儲存草稿 | 必填欄位（標題、內容、更新說明）非空 | `knowledgeStore.saveDraft` → 顯示 toast |
| 送出審核 | 同上 | 開啟 `SubmitReviewModal` → 填審核人與備注 → `saveDraft` → `submitForReview` → `router.push` 到列表頁 |

---

### 4.8 資料來源 Tab（DataSourceTab）

#### Wireframe

```
┌─────────────────────────────────────────────────────────────────────┐
│  連接外部資料來源，系統將自動同步資料並在知識內容管理建立對應知識條目│
├─────────────────────────────────────────────────────────────────────┤
│  已連接（2）                                                         │
│                                                                     │
│  ┌──────────────────────────┐  ┌──────────────────────────┐        │
│  │ 🔌         ●已連接  ◉ON  │  │ 🔌         ✗同步失敗 ◎OFF│        │
│  │ CRM 客戶資料             │  │ ERP 庫存資料             │        │
│  │ 自訂 REST API・每日同步  │  │ 自訂 REST API・手動同步  │        │
│  │ 上次同步：05-21 06:00    │  │ 上次同步：05-20 15:32    │        │
│  │ （1,243 筆）             │  │ 401 Unauthorized         │        │
│  │ [⟳ 立即同步] [⚙ 設定]   │  │ [⟳ 立即同步] [⚙ 設定]   │        │
│  └──────────────────────────┘  └──────────────────────────┘        │
├─────────────────────────────────────────────────────────────────────┤
│  可連接的應用程式                                                   │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────┐ │
│  │  🔌      │  │  📁      │  │  📄      │  │  🏢      │  │  💬  │ │
│  │ 自訂 API │  │ Google  │  │ Notion   │  │SharePoint│  │ Slack │ │
│  │         │  │ 雲端硬碟 │  │          │  │          │  │       │ │
│  │ [連接]  │  │[即將推出]│  │[即將推出]│  │[即將推出]│  │[即將推出]│
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────┘ │
│  ┌──────────┐                                                       │
│  │    ＋    │                                                       │
│  │ 更多整合  │                                                       │
│  │  即將推出│                                                       │
│  └──────────┘                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

#### API 來源卡片欄位

| 欄位 | 說明 |
|------|------|
| 狀態 Badge | `lastSyncStatus === 'FAILED'` → 「同步失敗」（紅）；否則「已連接」（綠） |
| Toggle | `source.enabled`；點擊呼叫 `knowledgeStore.toggleApiSourceEnabled(id)` |
| 同步資訊 | 有 `lastSyncAt` → 顯示時間與筆數（成功）或錯誤訊息（失敗）；無則「尚未同步」 |
| 立即同步 | 同步中或已停用時 disabled；呼叫 `handleSync(id)` |
| 設定 | 開啟 `EditApiSourceModal` |

---

### 4.9 連接 API 精靈（ConnectApiWizard）

#### Wireframe

```
┌─────────────────────────────────────────────────────────────────────┐
│  ✕  連接自訂 API                                                    │
├─────────────────────────────────────────────────────────────────────┤
│  來源名稱 *         [CRM 客戶資料                              ]    │
│  API URL *          [https://api.example.com/customers         ]    │
│  HTTP Method        [● GET  ○ POST]                                 │
│                                                                     │
│  請求標頭（可多筆）                                                 │
│  ┌────────────────────┬─────────────────────────────┬───┐          │
│  │ Authorization      │ Bearer xxxxxxxx             │ ✕ │          │
│  └────────────────────┴─────────────────────────────┴───┘          │
│  [+ 新增標頭]                                                        │
│                                                                     │
│  標題欄位 *         [name                                      ]    │
│  內容欄位 *         [description                               ]    │
│                                                                     │
│  同步排程           [● 手動  ○ 每日  ○ 每週]                        │
│  分類 *             [客服知識 ▼]                                     │
│                                                                     │
│                                           [取消]  [連接並同步]      │
└─────────────────────────────────────────────────────────────────────┘
```

完成後流程：`createApiSource` → `createKnowledgeFromApiSource` → `triggerSync`（立即執行首次同步）

---

## 5. 非功能需求

### 5.1 效能

| 指標 | 目標 | 備注 |
|------|------|------|
| 知識列表頁 TTI | ≤ 2s（P90） | 含統計卡計算、分頁第一頁渲染 |
| 詳情頁 Markdown 渲染 | ≤ 500ms | 以 5000 字為基準 |
| Pipeline 完成時間 | ≤ 60s（P90） | 10MB 以下 PDF，128 chunks |
| API 來源同步回應 | ≤ 10s | REST API 呼叫 + 寫入知識條目 |
| 檔案上傳吞吐量 | ≥ 5MB/s | S3 presigned URL 直傳 |
| 頁面快取策略 | SWR（stale-while-revalidate） | Pinia store 資料最長 stale 60s |

---

### 5.2 安全性

| 面向 | 要求 |
|------|------|
| 身份驗證 | 所有 API 呼叫均須攜帶 JWT（`http.ts` 自動注入 `Authorization` header） |
| S3 直傳例外 | 取得 presigned URL 後用 `axios.put(url, file)` 直傳，不攜帶 auth header（避免 403） |
| RBAC | 操作按鈕依角色顯示/隱藏；後端 API 須同步驗證角色（前端僅為 UX 保護） |
| XSS | Markdown 渲染使用 DOMPurify sanitize，禁止 `<script>` 注入 |
| CSRF | API 呼叫使用 Bearer token，非 cookie-based，不需 CSRF token |
| 傳輸層加密 | 全站 HTTPS / TLS 1.2+ |
| 檔案類型驗證 | 前端檢查副檔名 + MIME type；後端同步驗證 magic bytes |
| 檔案大小限制 | 前端限制 50MB；後端 nginx/gateway 同步限制 |

---

### 5.3 可用性與 SLA

| 指標 | 目標 |
|------|------|
| 服務可用性 | ≥ 99.5%（月均） |
| RTO（Recovery Time Objective） | ≤ 4 小時 |
| RPO（Recovery Point Objective） | ≤ 1 小時（定時備份間隔） |
| Pipeline 失敗重試 | 自動重試 3 次，指數退避（1s / 4s / 16s） |
| 前端離線提示 | 偵測到網路中斷時，顯示 `AppErrorState` 並停用寫入操作 |

---

### 5.4 合規性

| 面向 | 說明 |
|------|------|
| 資料存留 | 已刪除的資源與知識條目軟刪除（`deleted_at`），90 天後物理刪除 |
| 操作日誌 | 建立、更新、刪除、審核操作均記錄 `operator_id`、`timestamp`、`action` |
| 個資處理 | 知識內容如含個資，應由管理員設定可見範圍為「僅限管理者」 |
| 版本不可篡改 | `active` 與 `history` 狀態版本的 `content` 欄位唯讀，不可直接修改 |

---

## 6. UI / UX 設計規格

### 6.1 設計語彙（Design Tokens）

```scss
// 品牌主色
--color-primary:        #5c35d9;
--color-primary-light:  #ede9fe;

// 語意色
--color-success:        #16a34a;
--color-success-bg:     #f0fdf4;
--color-warning:        #b45309;
--color-warning-bg:     #fffbeb;
--color-danger:         #dc2626;
--color-danger-bg:      #fef2f2;
--color-info:           #2563eb;
--color-info-bg:        #eff6ff;

// 文字
--color-text-primary:   #1a1a1a;
--color-text-secondary: #6b7280;
--color-text-disabled:  #9ca3af;

// 背景 / 邊框
--color-bg-page:        #f9fafb;
--color-bg-card:        #ffffff;
--color-border:         #e5e7eb;
--color-border-light:   #f3f4f6;

// 排版
--font-family-base:     'Noto Sans TC', system-ui, sans-serif;
--font-size-base:       14px;
--font-size-sm:         12px;
--font-size-lg:         16px;
--font-size-xl:         20px;
--font-weight-normal:   400;
--font-weight-medium:   500;
--font-weight-bold:     700;

// 圓角
--border-radius-sm:     4px;
--border-radius-md:     8px;
--border-radius-lg:     12px;
--border-radius-pill:   9999px;

// 陰影
--shadow-sm:            0 1px 3px rgba(0,0,0,.08);
--shadow-md:            0 4px 12px rgba(0,0,0,.12);
--shadow-lg:            0 8px 24px rgba(0,0,0,.16);

// 過渡
--transition-fast:      150ms ease;
--transition-base:      250ms ease;
```

---

### 6.2 版面結構

```
┌────────────────────────────────────────────────────────────────┐
│  AppMenuTree（左側欄，固定寬 220px）                           │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  views-page-content-box                                  │ │
│  │  ┌────────────────────────────────────────────────────┐  │ │
│  │  │  page-banner（頁面標題區，固定高 64px）             │  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  │                                                          │ │
│  │  （各頁面主體內容區，scrollable）                        │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

- **Sidebar**：`AppMenuTree.vue`，包含「共用檔案管理」與「知識內容管理」導航項
- **Modal**：全螢幕遮罩（`z-index: 1000`），最大寬依類型設定（精靈：`560px`；比較：`900px`）
- **Drawer**：右側滑入（`ReviewDrawer`），固定寬 `480px`，`z-index: 999`

---

### 6.3 元件樣式規範

#### status-badge

```scss
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: var(--border-radius-pill);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);

  &--active      { background: var(--color-success-bg); color: var(--color-success); }
  &--processing  { background: var(--color-primary-light); color: var(--color-primary); }
  &--reviewing   { background: var(--color-info-bg); color: var(--color-info); }
  &--needs_update{ background: var(--color-warning-bg); color: var(--color-warning); }
  &--failed      { background: var(--color-danger-bg); color: var(--color-danger); }
  &--archived    { background: #f3f4f6; color: var(--color-text-secondary); }
  &--pending     { background: #f3f4f6; color: var(--color-text-secondary); }
  &--draft       { background: #f3f4f6; color: var(--color-text-primary); }
  &--rejected    { background: var(--color-danger-bg); color: var(--color-danger); }
}
```

#### source-card（DataSourceTab）

```scss
.source-card {
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  padding: 16px;
  width: 280px;

  &--disabled {
    opacity: .6;
    pointer-events: none;    // Toggle 本身透過 knowledgeStore 操作，不受此影響
  }
}
```

#### pipeline-progress-bar

```scss
.pipeline-progress-bar {
  height: 4px;
  background: var(--color-border);
  border-radius: var(--border-radius-pill);

  .pipeline-progress-fill {
    height: 100%;
    background: var(--color-primary);
    border-radius: var(--border-radius-pill);
    transition: width var(--transition-base);
  }
}
```

---

### 6.4 互動行為規範

| 情境 | 行為 |
|------|------|
| 刪除操作 | 必須透過 `popDialog.confirm` 確認，不可直接刪除 |
| 批次操作 | 操作前同上 `confirm`，完成後 `popDialog.toast` 顯示 2000ms |
| 表單送出 | 必填欄位為空時，按鈕 disabled 或送出時顯示 inline 錯誤提示 |
| 切換 Tab / 篩選 | 均重置 `currentPage = 1` |
| More 選單 | `@mouseleave` 父容器時自動收合，防止殭屍選單 |
| Pipeline 進度 | 前端目前為 `simulatePipeline()` 模擬；API 實作後改為 SSE 推播 |
| 同步中 spinner | `sync` icon 加上 `.spin` 動畫類別（`animation: spin 1s linear infinite`） |
| Modal 關閉 | 關閉時重置精靈所有欄位（`resetForm()`），防止重開帶入舊值 |

---

## 7. Data Pipeline 規格

### 7.1 Ingestion Pipeline 流程

```
觸發條件：
  - CreateKnowledgeWizardModal 完成（FILE / API 來源）
  - DataSourceTab「立即同步」
  - knowledgeStore.retriggerPipeline（needs_update / failed）

Pipeline 執行步驟：

Step 1 — 分段（Chunking）
  輸入：原始文件（PDF/DOCX/XLSX）或 API 回傳 JSON
  策略：
    - 文字文件：依段落 + 最大 token 數（預設 512 tokens）切割
    - 表格型（XLSX）：每列為一個 Chunk
    - JSON（API）：依 contentField 取值，按句子切割
  輸出：Chunk[]（含序號、內容文字、tokenCount）
  狀態更新：pipelineStage = 'chunking'，pipelineProgress 0 → 33

Step 2 — 向量化（Embedding）
  輸入：Chunk[]
  模型：text-embedding-3-small（OpenAI）/ 可替換為本地模型
  向量維度：1536
  輸出：每個 Chunk 對應一個 float32[1536] 向量
  狀態更新：pipelineStage = 'embedding'，pipelineProgress 33 → 66

Step 3 — 建立索引（Indexing）
  輸入：Chunk[] + 對應向量
  目標：寫入向量資料庫（pgvector / Qdrant）
  索引策略：HNSW（Hierarchical Navigable Small World）
  狀態更新：pipelineStage = 'indexing'，pipelineProgress 66 → 100

完成後：
  知識條目 status → active
  embeddingModel, embeddingDimension, embeddingCount 寫入 KnowledgeVersion

失敗時：
  知識條目 status → failed
  pipelineError 寫入錯誤訊息
  可由使用者觸發重新執行（retriggerPipeline）
```

---

### 7.2 狀態轉移圖

```
                           ┌─────────────────────────────────────────┐
                           │          KnowledgeItem 狀態機            │
                           └─────────────────────────────────────────┘

  ┌─────────┐   triggerPipeline   ┌────────────┐   Pipeline 完成   ┌────────┐
  │ pending │──────────────────► │ processing │─────────────────► │ active │
  └─────────┘                    └────────────┘                    └───┬────┘
                                       │                               │
                                   Pipeline 失敗                    建立新版本
                                       │                               │
                                  ┌────▼────┐                    ┌────▼───────────────┐
                                  │ failed  │◄──retrigger        │ draft version 建立  │
                                  └────┬────┘                    └────┬───────────────┘
                                       │                               │ submitForReview
                                  retrigger                            │
                                       │                         ┌─────▼──────┐
                                       └─────────────────────── ► reviewing   │
                                                                 └─────┬──────┘
                                                                       │
                                                          ┌────────────┴────────────┐
                                                     approve                     reject
                                                          │                         │
                                                    ┌─────▼──────┐           ┌─────▼────┐
                                                    │  active    │           │ rejected │
                                                    │(舊版→history│           │(可繼續編輯)
                                                    └────────────┘           └──────────┘
                                                          │
                                                        archive
                                                          │
                                                    ┌─────▼────┐
                                                    │ archived │
                                                    └──────────┘

  needs_update：API 來源有新資料可同步時，系統標記；可手動 retriggerPipeline 回到 processing
```

---

### 7.3 管線參數設定

| 參數 | 預設值 | 可配置層級 |
|------|--------|-----------|
| Chunk 最大 token 數 | 512 | 系統全域 |
| Chunk 重疊 token 數 | 64 | 系統全域 |
| Embedding 模型 | `text-embedding-3-small` | 系統全域 |
| 向量維度 | 1536 | 由模型決定 |
| 索引演算法 | HNSW | 系統全域 |
| 重試次數 | 3 | 系統全域 |
| 重試退避 | 指數（1s/4s/16s） | 系統全域 |

---

## 8. API 整合規格

### 8.1 外部 REST API 來源整合

連接 `ConnectApiWizard` 設定的外部 REST API，系統以排程（手動/每日/每週）或手動觸發方式同步：

1. 後端依 `ApiSource` 的 `url`、`method`、`headers`、`body` 呼叫外部 API
2. 回傳 JSON 中依 `titleField` 取知識標題、`contentField` 取知識內容
3. 轉換為 Chunk 並執行 Embedding、Indexing
4. 更新 `lastSyncAt`、`lastSyncStatus`、`lastSyncCount` 或 `lastSyncError`
5. 若 `lastSyncAt` 已有資料且本次回傳結果有差異，知識條目狀態設為 `needs_update`

**同步錯誤處理**

| 錯誤類型 | 處理方式 |
|----------|----------|
| HTTP 4xx | `lastSyncStatus = 'FAILED'`，`lastSyncError = 'HTTP 401 Unauthorized'` |
| HTTP 5xx | 自動重試 3 次，全部失敗後標記 FAILED |
| 逾時（> 30s） | 標記 FAILED，記錄「連線逾時」 |
| JSON 解析失敗 | 標記 FAILED，記錄「回傳格式錯誤」 |

---

### 8.2 S3 上傳例外

```
// 正確做法：直接 PUT 到 presigned URL，不夾帶 auth header
const { data: { uploadUrl } } = await http.post('/resources/presign', { fileName })
await axios.put(uploadUrl, file)  // 使用原生 axios，不走 http.ts

// 錯誤做法（會導致 S3 403）：
await http.put(uploadUrl, file)   // http.ts 會注入 Authorization header
```

---

## 9. 開發計畫

### 9.1 Phase 1 — MVP（已完成）

**目標**：完成 UI 切版，前端狀態管理可運作，以 mock store 驗證流程

| 任務 | 狀態 |
|------|------|
| ResourceLibrary 頁面（卡片/清單視圖、篩選、操作選單） | ✅ 完成 |
| KnowledgeBase 主列表（統計卡、批次操作、操作選單） | ✅ 完成 |
| KnowledgeDetail 四個子 Tab | ✅ 完成 |
| KnowledgeEditor 草稿編輯器 | ✅ 完成 |
| CreateKnowledgeWizardModal（三種來源類型） | ✅ 完成 |
| DataSourceTab + ConnectApiWizard + EditApiSourceModal | ✅ 完成 |
| Pinia stores（knowledgeStore + resourceStore） | ✅ 完成 |
| 狀態機與 mock Pipeline 模擬 | ✅ 完成 |

---

### 9.2 Phase 2 — API 串接（進行中）

**目標**：串接後端 REST API，移除 mock 資料，實作 SSE Pipeline 進度推播

| 任務 | 優先級 | 預計完成 |
|------|--------|----------|
| 知識條目 CRUD API | P0 | Week 1 |
| 資源檔案 CRUD API（含 S3 presign） | P0 | Week 1 |
| Pipeline 觸發 API | P0 | Week 2 |
| SSE Pipeline 進度推播（取代 simulatePipeline） | P1 | Week 2 |
| API 來源同步 API（triggerSync） | P1 | Week 2 |
| 版本 CRUD API | P1 | Week 3 |
| 審核 API（submit / approve / reject / withdraw） | P1 | Week 3 |
| 下載檔案 API | P2 | Week 3 |
| 從共用檔案管理選取來源檔案 | P2 | Week 4 |
| 版本比較差異算法（VersionCompareModal） | P2 | Week 4 |

---

### 9.3 Phase 3 — 智能化（規劃中）

| 功能 | 說明 |
|------|------|
| AI 自動打標籤 | Pipeline 完成後自動產生 `systemTags` |
| 重複內容偵測 | 建立知識前比對向量相似度，提示可能重複 |
| 知識品質評分 | 依完整度、可讀性、關聯性給分，顯示於詳情頁 |
| 語意搜尋 | 列表頁搜尋列支援向量語意搜尋 |
| 第三方整合（Google Drive / Notion / SharePoint / Slack） | 即將推出佔位項實作 |
| 排程自動同步 | DAILY / WEEKLY 排程 API 來源同步（cron job） |

---

### 9.4 里程碑時程

```
2026-05        2026-06        2026-07        2026-08
├──────────────┼──────────────┼──────────────┼──────────────►
│              │              │              │
● Phase 1      ●──────────────● Phase 2      ●──── Phase 3
  UI 切版完成   API 串接啟動   API 串接完成   智能化功能
  (已完成)      (進行中)       (目標)         (規劃中)
```

---

## 附錄

### 附錄 A：資料庫 Schema（PostgreSQL）

```sql
-- 資源檔案
CREATE TABLE resources (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       UUID NOT NULL REFERENCES teams(id),
  file_name     VARCHAR(255) NOT NULL,
  file_url      TEXT NOT NULL,
  file_type     VARCHAR(20) NOT NULL,  -- PDF | PPT | EXCEL | IMAGE | HTML | WORD | MD | TXT | CHART | OTHER
  process_type  VARCHAR(20) NOT NULL,  -- AI_PARSED | RAW
  creator_type  VARCHAR(10) NOT NULL,  -- USER | AI
  owner_id      UUID NOT NULL REFERENCES users(id),
  status        VARCHAR(20) NOT NULL DEFAULT 'uploading',
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 知識條目
CREATE TABLE knowledge_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID NOT NULL REFERENCES teams(id),
  title           VARCHAR(500) NOT NULL,
  category        VARCHAR(100) NOT NULL,
  source_type     VARCHAR(20) NOT NULL,  -- FILE | API | MANUAL
  api_source_id   UUID REFERENCES api_sources(id),
  status          VARCHAR(30) NOT NULL DEFAULT 'pending',
  pipeline_progress  INT DEFAULT 0,
  pipeline_stage     VARCHAR(20),         -- chunking | embedding | indexing
  pipeline_error     TEXT,
  last_update_time   TIMESTAMPTZ,
  deleted_at         TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 知識版本
CREATE TABLE knowledge_versions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_id     UUID NOT NULL REFERENCES knowledge_items(id),
  version_number   VARCHAR(20) NOT NULL,   -- e.g. '1.0', '2.1'
  version_type     VARCHAR(10),            -- MINOR | MAJOR
  status           VARCHAR(20) NOT NULL DEFAULT 'draft',
  title            VARCHAR(500) NOT NULL,
  summary          TEXT,
  content          TEXT NOT NULL,
  category         VARCHAR(100),
  tags             TEXT[],
  system_tags      TEXT[],
  update_note      TEXT,
  visibility       VARCHAR(20) DEFAULT 'all',  -- all | team | admin
  last_update_by   UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(knowledge_id, version_number)
);

-- 知識版本關聯來源檔案
CREATE TABLE knowledge_version_sources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id      UUID NOT NULL REFERENCES knowledge_versions(id),
  resource_id     UUID NOT NULL REFERENCES resources(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chunk（分段結果）
CREATE TABLE knowledge_chunks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id      UUID NOT NULL REFERENCES knowledge_versions(id),
  chunk_index     INT NOT NULL,
  content         TEXT NOT NULL,
  token_count     INT,
  embedding       VECTOR(1536),   -- pgvector
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- API 來源
CREATE TABLE api_sources (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id          UUID NOT NULL REFERENCES teams(id),
  name             VARCHAR(255) NOT NULL,
  url              TEXT NOT NULL,
  method           VARCHAR(10) NOT NULL DEFAULT 'GET',
  headers          JSONB DEFAULT '{}',
  body             TEXT,
  title_field      VARCHAR(255) NOT NULL,
  content_field    VARCHAR(255) NOT NULL,
  schedule         VARCHAR(20) NOT NULL DEFAULT 'MANUAL',  -- MANUAL | DAILY | WEEKLY
  enabled          BOOLEAN NOT NULL DEFAULT TRUE,
  last_sync_at     TIMESTAMPTZ,
  last_sync_status VARCHAR(20),     -- SUCCESS | FAILED
  last_sync_count  INT,
  last_sync_error  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 操作日誌
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID NOT NULL,
  operator_id     UUID NOT NULL REFERENCES users(id),
  entity_type     VARCHAR(50) NOT NULL,   -- knowledge_item | resource | api_source
  entity_id       UUID NOT NULL,
  action          VARCHAR(50) NOT NULL,   -- create | update | delete | archive | submit_review | approve | reject | sync
  detail          JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_knowledge_items_team_status ON knowledge_items(team_id, status);
CREATE INDEX idx_knowledge_versions_knowledge ON knowledge_versions(knowledge_id, status);
CREATE INDEX idx_knowledge_chunks_version ON knowledge_chunks(version_id, chunk_index);
CREATE INDEX idx_resources_team_status ON resources(team_id, status);
CREATE INDEX idx_api_sources_team ON api_sources(team_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
```

---

### 附錄 B：API 端點清單

#### 資源檔案（/resources）

| 方法 | 路徑 | 說明 | 必要角色 |
|------|------|------|----------|
| GET | `/resources` | 取得資源列表（支援 processType、fileType、page 篩選） | member+ |
| POST | `/resources/presign` | 取得 S3 presigned PUT URL | member+ |
| POST | `/resources/confirm` | 確認 S3 上傳完成 | member+ |
| PATCH | `/resources/:id` | 更新資源（如更名） | member+（僅限自己） |
| DELETE | `/resources/:id` | 軟刪除資源 | member+（僅限自己） or admin |
| GET | `/resources/:id/download` | 取得下載 URL | member+ |

#### 知識條目（/knowledge）

| 方法 | 路徑 | 說明 | 必要角色 |
|------|------|------|----------|
| GET | `/knowledge` | 取得知識條目列表（category、status、page 篩選） | member+ |
| POST | `/knowledge` | 建立新知識條目 | editor+ |
| GET | `/knowledge/:id` | 取得條目詳情（含版本列表） | member+ |
| DELETE | `/knowledge/:id` | 軟刪除條目 | editor+（自己） or admin |
| POST | `/knowledge/:id/archive` | 封存條目 | editor+ |
| POST | `/knowledge/:id/retrigger` | 重新觸發 Pipeline | editor+ |
| GET | `/knowledge/:id/pipeline-events` | SSE：訂閱 Pipeline 進度推播 | editor+ |

#### 知識版本（/knowledge/:id/versions）

| 方法 | 路徑 | 說明 | 必要角色 |
|------|------|------|----------|
| POST | `/knowledge/:id/versions` | 建立新版本（MINOR/MAJOR） | editor+ |
| GET | `/knowledge/:id/versions/:versionId` | 取得版本詳情 | member+ |
| PATCH | `/knowledge/:id/versions/:versionId` | 儲存草稿 | editor+（自己） |
| POST | `/knowledge/:id/versions/:versionId/submit` | 送出審核 | editor+ |
| POST | `/knowledge/:id/versions/:versionId/withdraw` | 撤回審核 | editor+（自己） |
| POST | `/knowledge/:id/versions/:versionId/approve` | 審核通過 | reviewer+ |
| POST | `/knowledge/:id/versions/:versionId/reject` | 退回 | reviewer+ |
| POST | `/knowledge/:id/versions/:versionId/restore` | 還原為草稿 | editor+ |
| GET | `/knowledge/:id/versions/:versionId/chunks` | 取得分段列表 | member+ |

#### API 來源（/api-sources）

| 方法 | 路徑 | 說明 | 必要角色 |
|------|------|------|----------|
| GET | `/api-sources` | 取得 API 來源列表 | admin |
| POST | `/api-sources` | 建立 API 來源 | admin |
| GET | `/api-sources/:id` | 取得 API 來源詳情 | admin |
| PATCH | `/api-sources/:id` | 更新 API 來源設定 | admin |
| DELETE | `/api-sources/:id` | 刪除 API 來源 | admin |
| PATCH | `/api-sources/:id/toggle` | 啟用/停用 | admin |
| POST | `/api-sources/:id/sync` | 手動觸發同步 | admin |

---

### 附錄 C：角色權限矩陣

| 功能 | member | editor | reviewer | admin | super_admin |
|------|:------:|:------:|:--------:|:-----:|:-----------:|
| 瀏覽資源列表 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 上傳資源檔案 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 下載資源檔案 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 刪除資源（自己） | ✅ | ✅ | ✅ | ✅ | ✅ |
| 刪除資源（他人） | ❌ | ❌ | ❌ | ✅ | ✅ |
| 瀏覽知識列表（已發布） | ✅ | ✅ | ✅ | ✅ | ✅ |
| 瀏覽知識列表（全部狀態） | ❌ | ✅ | ✅ | ✅ | ✅ |
| 建立知識條目 | ❌ | ✅ | ✅ | ✅ | ✅ |
| 編輯草稿（自己） | ❌ | ✅ | ✅ | ✅ | ✅ |
| 送出審核 | ❌ | ✅ | ✅ | ✅ | ✅ |
| 審核知識（approve/reject） | ❌ | ❌ | ✅ | ✅ | ✅ |
| 撤回審核（自己） | ❌ | ✅ | ✅ | ✅ | ✅ |
| 封存知識 | ❌ | ✅（自己） | ✅（自己） | ✅ | ✅ |
| 批次封存 / 批次刪除 | ❌ | ❌ | ❌ | ✅ | ✅ |
| 管理 API 來源 | ❌ | ❌ | ❌ | ✅ | ✅ |
| 設定知識可見範圍 | ❌ | ✅ | ✅ | ✅ | ✅ |
| 跨團隊管理 | ❌ | ❌ | ❌ | ❌ | ✅ |
| 設定合規政策 | ❌ | ❌ | ❌ | ❌ | ✅ |

---

### 附錄 D：術語表

| 術語 | 英文 | 定義 |
|------|------|------|
| 共用檔案管理 | ResourceLibrary | JustAgent 中以團隊為單位管理原始上傳檔案的子系統 |
| 知識內容管理 | KnowledgeBase | 管理結構化知識條目（建立、版本、審核、發布）的子系統 |
| 知識條目 | KnowledgeItem | 知識內容管理中的一個知識單元，包含多個版本 |
| 知識版本 | KnowledgeVersion | 知識條目的一個可編輯版本，有獨立的生命週期狀態 |
| Pipeline | Ingestion Pipeline | 將原始文件或 API 回傳資料轉化為可供 RAG 查詢的向量索引的自動化流程，含 chunking / embedding / indexing 三個階段 |
| Chunking（分段） | Chunking | Pipeline 第一階段：將文件切割為固定大小的文字片段（Chunk） |
| Embedding（向量化） | Embedding | Pipeline 第二階段：將 Chunk 轉換為浮點數向量 |
| Indexing（建立索引） | Indexing | Pipeline 第三階段：將向量寫入向量資料庫（HNSW 索引） |
| API 來源 | ApiSource | 透過 ConnectApiWizard 連接的外部 REST API，定期同步回傳資料至知識庫 |
| 草稿 | draft | KnowledgeVersion 的初始狀態，可自由編輯、尚未提交審核 |
| 審核中 | reviewing | 版本已送出審核，等待審核者處理 |
| 已發布 | active | 版本通過審核，成為目前正式版本，供 Agent RAG 使用 |
| 歷史版 | history | 被新版本取代的舊版本，唯讀，可還原為草稿或與目前版比較 |
| 需更新 | needs_update | 知識條目的 API 來源有新資料，需重新執行 Pipeline |
| 已封存 | archived | 知識條目被封存，不再對 Agent 可見 |
| RAG | Retrieval-Augmented Generation | 利用向量搜尋從知識庫取出相關內容，再交由語言模型生成回答的技術架構 |
| HNSW | Hierarchical Navigable Small World | 一種高效能近似最近鄰（ANN）向量索引演算法 |
| SSE | Server-Sent Events | 伺服器推播技術，用於 Pipeline 進度即時推播至前端 |
| Presigned URL | — | S3 提供的帶有時效性授權的上傳/下載 URL，可讓前端直接與 S3 通訊，不必透過應用伺服器轉送 |
| RBAC | Role-Based Access Control | 以角色為單位分配操作權限的存取控制模型 |
| compTabs | — | JustAgent 共用 Tab 切換元件（`src/components/compTabs.vue`） |
| compDropDown | — | JustAgent 共用下拉選單元件 |
| compPagination | — | JustAgent 共用分頁元件 |
| popDialog | — | JustAgent 全域提示服務，提供 `confirm`、`alert`、`toast` 三種互動模式 |
