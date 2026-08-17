# Skill 管理單元設計規格

**日期：** 2026-06-22
**範圍：** 企業技能管理（我的技能 + 技能測試沙盒）
**不含：** 技能商店（後續規劃）

---

## 背景

在現有 Vue 專案中新增一個功能模組，讓企業用戶（Tenant）能管理其 AI Agent 所使用的技能（Skills）。技能分兩類：

- **系統技能（System Skill）**：平台預建，覆蓋 80% 通用場景，企業可啟用/停用
- **企業擴充（Extension Skill）**：由對話演化或自訂版本產生，覆蓋企業特有場景

---

## 路由架構

| 路由 | Route name | View | meta |
|------|------|------|------|
| `/view/Skills` | `SkillManagement` | `SkillManagement.vue` | `title: '技能管理'` |
| `/view/SkillTest` | `SkillTest` | `SkillTest.vue` | `title: '技能測試沙盒'`, `parentName: 'SkillManagement'` |

`parentName` 對應 router 的 `name` 欄位，AppBreadcrumb 以此生成上層連結，與 KnowledgeDetail/KnowledgeEditor 的模式相同。

`SkillTest` 透過 `parentName` 在 breadcrumb 顯示「技能管理 > 技能測試沙盒」。

---

## 側邊欄

Skills 屬企業層級設定，掛在 `AppMenuTree.vue` 的 `company-box` 區塊，緊接在「企業/團隊設定」之後，使用與「共享資源庫」相同的展開/收合模式：

```
企業 UGG ▼
  ├ 企業/團隊設定
  └ 技能管理  ▼          ← 新增，預設展開
      ├ 我的技能          → /view/Skills
      └ 技能測試沙盒      → /view/SkillTest
```

實作：在 `company-box` 內新增 `isSkillOpen` ref，點擊 header 切換展開狀態。

---

## SkillManagement.vue

### 頁面區塊

**1. Hero 統計列**
四個數字卡片，橫向排列：
- 啟用中技能數
- 企業擴充數
- 本月自動觸發次數
- 測試通過率

**2. 上游更新 Banner**（條件顯示）
當有任一 Extension Skill 的 `upstreamUpdateStatus === 'update_available'` 時顯示，內容為最早待更新的技能名稱 + 「查看」按鈕，點擊開啟 `UpstreamUpdateDrawer`。

**3. 技能清單**
標題列右側有「+ 建立」按鈕（後續規劃，先保留佔位）。

清單以 System Skill 為群組，Extension Skill 縮排顯示於對應父項下方，以左側縮排線標示從屬關係：

```
[System Skill 卡片]
    └── [Extension Skill 卡片]   ← 縮排 28px，左側帶色縮排線
[System Skill 卡片]
[獨立 Extension（無父項）卡片]  ← 左側橙色邊框
```

### 互動行為

| 操作 | 行為 |
|------|------|
| 點擊卡片主體 | 開啟 `SkillDetailDrawer` |
| [測試] | 跳至 `/view/SkillTest?skillId={id}` |
| [停用] | inline 切換，卡片 opacity 降至 0.5，狀態文字改為「已停用」，按鈕文字改「啟用」 |
| [啟用] | 恢復正常樣式 |
| [更新]（Extension） | 開啟 `UpstreamUpdateDrawer` |

### 新增元件

**`SkillCard.vue`** (`src/components/Skill/`)

Props：
```ts
skill: Skill        // skill 資料
isExtension: boolean  // 控制縮排樣式與左側線條
```

System Skill 樣式：白色卡片、淺色 icon 背景。
Extension Skill 樣式：縮排 28px、左側 2px primary 色縱線、`::before` 橫線連接父卡片。
獨立 Extension 樣式：左側 3px 橙色邊框。
上游有更新時顯示警示 badge。

**`SkillDetailDrawer.vue`** (`src/components/Skill/`)

右側抽屜，顯示：
- 來源關係（lineage）：System → 演化方式 → Extension
- 演化上下文：觸發當時的對話摘要（若為對話演化）
- 運行統計：自動觸發次數、測試通過率、平均延遲
- 操作：[對話測試]（跳至 SkillTest）、[編輯]（後續規劃）、[停用]

**`UpstreamUpdateDrawer.vue`** (`src/components/Skill/`)

右側抽屜，顯示：
- 版本資訊：Fork 時的版本 vs 上游最新版本
- 變更內容 diff：新增功能、Prompt 修改（高亮 +/- 行）
- 衝突分析：可自動合併 / 需手動確認
- 三種操作選項（卡片式）：
  1. **合併更新**：無衝突自動套用，有衝突手動選擇
  2. **下次再說**：dismiss 此次，不影響現有技能
  3. **永久分離**：解除與上游的關聯，此操作不可逆，顯示紅色警告

---

## SkillTest.vue

### 頁面佈局

左右兩欄，高度固定（`calc(100vh - header 高度)`）：

**左側（260px）：技能選擇器**
- 標題：「測試的技能」
- 列表項目：技能名稱 + dot 顏色識別（系統技能 indigo，擴充技能 amber）
- 從 `/view/SkillManagement` 點擊 [測試] 跳入時，透過 `skillId` query param 自動選中對應項目

**右側：測試面板**

頂部：當前技能名稱 + 版本 tag + tab 切換（對話模式 / JSON 模式）

**對話模式**（`SkillTestChat.vue`）：
- 訊息泡泡區（可捲動）：user 靠右，agent 靠左
- Agent 每則回覆底部附 tool trace 摺疊區塊，顯示呼叫的 tool 名稱與延遲
- 底部輸入列：text input + 發送按鈕
- 頂部有「重置對話」按鈕

**JSON 模式**（`SkillTestJson.vue`）：
- 上半：Input JSON 編輯區（`<textarea>`，monospace 字型）+ [執行]、[載入範例]、[清除] 按鈕
- 下半：Output 顯示區 + 右上角顯示執行結果 tag（成功/失敗 + 毫秒數）
- 底部：呼叫鏈面板，顯示步驟序號、名稱、延遲

---

## skillStore.ts

`src/stores/skillStore.ts`，使用 Pinia `defineStore`：

```ts
interface Skill {
  id: string
  name: string
  description: string
  type: 'system' | 'extension'
  origin: 'platform_created' | 'conversation_evolved' | 'custom_version'
  version: string
  isEnabled: boolean
  usageCount: number
  testPassRate: number         // 0–1
  avgLatencyMs: number
  forkSourceId?: string
  forkSourceVersion?: string
  upstreamLink: 'linked' | 'unlinked'
  upstreamUpdateStatus: 'up_to_date' | 'update_available' | 'conflict' | 'ignored'
  evolutionContext?: string    // 對話演化的觸發摘要
  children?: Skill[]          // Extension skills，僅 system skill 有此欄位
}

// State
skills: Skill[]
selectedSkillId: string | null
testConversationHistory: ChatMessage[]
testJsonInput: string
testJsonOutput: string | null
testIsRunning: boolean

// Actions
toggleSkill(id: string): void
ignoreUpstreamUpdate(id: string): void
mergeUpstreamUpdate(id: string): void
detachUpstream(id: string): void
setSelectedSkill(id: string): void
runJsonTest(skillId: string, input: string): Promise<void>
sendChatMessage(skillId: string, message: string): Promise<void>
resetConversation(): void
```

---

## 新增 SCSS 檔案

| 檔案 | 說明 |
|------|------|
| `src/scss/views/_SkillManagement.scss` | 頁面佈局、Hero 卡片、清單容器 |
| `src/scss/views/_SkillTest.scss` | 左右兩欄、聊天氣泡、JSON 編輯區 |
| `src/scss/components/_SkillCard.scss` | 卡片樣式、縮排線、擴充變體 |
| `src/scss/components/_SkillDetailDrawer.scss` | 詳情抽屜、lineage 顯示 |
| `src/scss/components/_UpstreamUpdateDrawer.scss` | diff 區塊、操作選項卡片 |

每個新 SCSS 檔案建立後需在對應的 `_index.scss` 加上 `@forward`：
- views: `src/scss/views/_index.scss`
- components: `src/scss/components/_index.scss`

---

## 不在此次範圍

- 技能商店（Skill Store）
- Skill Builder（建立自訂版本）
- 真實 API 串接（此次使用 mock 資料）
- [編輯] 技能功能
- [+ 建立] 按鈕功能
