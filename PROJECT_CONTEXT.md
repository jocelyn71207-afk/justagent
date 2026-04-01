# PROJECT_CONTEXT.md — 專案背景與業務情境

本文件記錄 JustAgent UI 的業務目的、功能模組、資料模型與核心流程，供 AI 工具在修改程式時理解「為什麼」而非只是「怎麼做」。

---

## 1. 專案簡介

**JustAgent** 是一款面向企業的 AI 協作平台，核心功能包含：

- 以企業 → 團隊 → 專案的層級結構管理 AI Agent 專案
- 視覺化畫布編輯器（AiViewer），可放置、調整多種 AI 內容區塊
- 跨團隊的共享資源庫（文件、圖片、試算表等）
- 企業級權限控管與成員管理

目標用戶為零售、電子商務等產業的中大型企業，讓不同角色的員工透過 AI Agent 協同完成業務工作。

---

## 2. 使用者角色（Role）

| 角色 | 說明 |
|---|---|
| 企業擁有者（Enterprise Owner） | 最高權限，綁定付款帳戶，唯一可轉移所有權 |
| 平台管理者（Platform Admin） | 完整管理權限，可管理成員，不可轉移所有權 |
| 團隊主管（Team Lead） | 管理特定團隊的資源與成員 |
| 專案人員（Project Member） | 標準成員，有專案存取權 |
| 檢視者（Viewer） | 唯讀，不可修改任何內容 |

---

## 3. 主要功能模組

### 3.1 最近使用（ProjectDashboard）
- 顯示使用者最近開啟的專案
- 支援卡片 / 清單兩種視圖模式
- 可依 Agent 類型過濾（Tab 切換）
- 可建立新專案、開啟專案設定、刪除專案
- 時間排序下拉選單

### 3.2 團隊專案（TeamProject）
- 以特定團隊為範圍列出所有專案
- 功能與 ProjectDashboard 相同，但範圍鎖定在單一團隊
- URL Query 帶入 `teamId` 與 `teamName`

### 3.3 AI 畫布編輯器（AiViewer）
- 核心功能：使用 Konva.js 的拖拉縮放畫布
- 可建立多種內容**區塊（Block）**：PDF、Excel、PPT、圖片、Markdown、HTML、TXT、Word、Chart
- 區塊操作：建立、複製/貼上（Cmd+C/V）、刪除、重新命名、拖移、縮放
- 多選模式（Multi-select）：可同時移動多個區塊
- 便條紙（Memo）：區塊層級的評論 / 標記系統
- 側邊面板：區塊列表、評論列表、檔案列表、對話紀錄

### 3.4 共享資源庫（ResourceLibrary）
- 團隊層級的檔案管理
- 篩選：上傳者類型（使用者 / AI）、檔案類型（11 種以上）
- 操作：重新命名、刪除、下載
- 卡片 / 清單視圖切換
- 分頁支援

### 3.5 權限管理（TeamAccessManagement）
- 查看 / 新增 / 編輯 / 刪除團隊成員
- 指派角色，顯示最後登入時間
- 搜尋與分頁

### 3.6 企業團隊設定（CompanyTeamSettings）
- 企業資訊：企業類型（零售等）
- 團隊類型：實體門市、電子商務等
- 方案資訊：目前方案（標準版）與到期日
- 可用 AI Agent 列表
- 平台管理者管理

### 3.7 專案垃圾桶（ProjectTrashCans）
- 軟刪除的專案暫存區，顯示剩餘天數
- 可依刪除者篩選
- 操作：還原、永久刪除
- 超過保留期限後自動清除

### 3.8 側邊導覽（AppMenuTree）
- 使用者 Profile 下拉（設定、登出）
- 企業選擇器
- 可折疊的團隊選單，每個團隊下有：
  - 最近使用
  - 團隊專案
  - 共享資源庫
  - 權限管理
  - 專案垃圾桶
- 全域搜尋入口

---

## 4. 核心資料實體

```
Enterprise（企業）
├── Teams（團隊）
│   ├── Projects（專案）
│   │   ├── AiViewerBlocks（區塊）
│   │   │   ├── Memos（便條紙 / 評論）
│   │   │   └── Data（因 blockType 而異）
│   │   └── Collaborators（共編成員）
│   ├── Resources（共享資源）
│   │   ├── Creator（User | AI）
│   │   └── FileMetadata
│   └── Members（成員 + Role）
├── Agents（AI Agent）
│   └── AgentType（業務助理、數據分析、行銷專員…）
└── Admins（平台管理者）
```

### 主要欄位

**Project**
```typescript
{
  id: string
  name: string
  teamId: string
  owner: string
  agents: Agent[]
  imgSrc: string
  lastModify: string
}
```

**AiViewerBlock**
```typescript
{
  id: string
  x: number
  y: number
  width: number
  height: number
  z: number           // z-index
  blockName: string
  blockType: 'PDF' | 'EXCEL' | 'PPT' | 'IMAGE' | 'CHART' | 'TXT' | 'HTML' | 'MD' | 'WORD' | 'OTHER'
  data: object        // 依 blockType 不同
}
```

**Resource**
```typescript
{
  id: string
  fileName: string
  fileUrl: string
  fileType: FileType
  creatorType: 'USER' | 'AI'
  ownerId: string
  ownerName: string
  lastModify: string
}
```

**TeamMember**
```typescript
{
  id: string
  name: string
  email: string
  role: Role
  lastLogin: string
}
```

---

## 5. 核心使用者流程

```
1. 登入 / 入口
   AppEntrance → 解析使用者資料 → ProjectDashboard

2. 開啟最近使用專案
   ProjectDashboard → 點擊專案卡片 → AiViewer

3. 瀏覽團隊專案
   側邊欄：點擊「團隊一」→ TeamProject → 點擊專案 → AiViewer

4. 建立新專案
   ProjectDashboard / TeamProject → 「建立新專案」→ ProjectSettingModal → 確認

5. 管理資源
   側邊欄 → 共享資源庫 → 上傳 / 編輯 / 刪除 / 篩選

6. 管理團隊成員
   側邊欄 → 權限管理 → 搜尋 / 新增 / 編輯 / 刪除 / 指派角色

7. AI 畫布操作
   AiViewer → 輸入文字或上傳檔案 → 建立區塊 → 排列 / 縮放 / 評論

8. 複製貼上區塊
   選取區塊 → Cmd+C → Cmd+V → 碰撞偵測自動定位

9. 還原已刪除專案
   專案垃圾桶 → 選擇 → 「還原」→ 回到團隊專案

10. 企業設定
    CompanyTeamSettings → 切換 Tab → 編輯企業資訊 / 管理員 / Agent 列表
```

---

## 6. 術語表

| 中文 | 英文 | 說明 |
|---|---|---|
| 專案 | Project | 核心工作單位 |
| 團隊 | Team | 協作群組 |
| 企業 | Enterprise | 最上層組織 |
| 區塊 | Block | AiViewer 畫布上的內容單元 |
| 資源庫 | Resource Library | 共享檔案倉庫 |
| 便條紙 | Memo / Sticky Note | 區塊層級的評論系統 |
| 共編 | Co-editing | 多人協作 |
| 最近使用 | Recently Used | 最近開啟的專案 |
| 垃圾桶 | Trash | 軟刪除暫存區 |
| 權限管理 | Access Management | 成員角色管理 |
| 業務助理 | Business Assistant | AI Agent 類型 |
| 數據分析 | Data Analysis | AI Agent 類型 |
| 行銷專員 | Marketing Specialist | AI Agent 類型 |
| 切版 | Layout / UI Slicing | 前端切版開發階段 |

---

## 7. 支援的檔案類型

| 類型 | 副檔名 |
|---|---|
| PDF | .pdf |
| Word | .doc, .docx |
| Excel | .xls, .xlsx |
| PowerPoint | .ppt, .pptx |
| 圖片 | .png, .jpg, .jpeg, .webp |
| Markdown | .md |
| HTML | .html |
| 純文字 | .txt |
| Chart | 自定義格式 |

---

## 8. 路由結構

```
/ → AppEntrance（登入 / 入口頁）
/view/ → Full.vue（主框架）
  ├── /view/ProjectDashboard
  ├── /view/TeamProject?teamId=&teamName=
  ├── /view/ResourceLibrary?teamId=&teamName=
  ├── /view/TeamAccessManagement?teamId=&teamName=
  ├── /view/AiViewer（meta: hideMenuTree）
  ├── /view/CompanyTeamSettings
  ├── /view/GUI（開發測試用）
  └── /view/ProjectTrashCans?teamId=&teamName=
```

---

## 9. 全域狀態（Pinia rootStore）

| 狀態 | 說明 |
|---|---|
| `isShowBatchUpload` | 批次上傳元件是否顯示 |
| `isBatchUploading` | 是否正在上傳中（防止重複） |
| `isBatchUploadSuccess` | 上傳成功狀態 |
| `isEnterAppSearchPage` | 是否開啟全域搜尋頁 |
| `appSearchKeyword` | 全域搜尋關鍵字 |
| `projectListMode` | 專案列表視圖（`'card'` \| `'list'`） |
| `nowMenuTreeCompanyId` | 當前選取的企業 ID |
| `testGroups` | 測試用硬編碼團隊資料（待 API 替換） |

---

## 10. 開發現況

- 目前分支：`forBuildpacks`
- 開發階段：切版（UI Slicing）為主，API 尚未全部串接，部分使用假資料
- 已完成 Playwright E2E 測試：AppEntrance、AppMenuTree 導覽、ProjectDashboard
- 待完成：登入驗證、真實 API 串接、圖片上傳預覽、聊天紀錄整合
