# Skill 管理單元 v2 設計規格

**日期：** 2026-06-30
**範圍：** skillStore 資料模型擴充、UX 三項修復、六大功能缺口補全
**前置文件：** `2026-06-22-skill-management-design.md`（v1，已實作 S1–S7）

---

## 背景

v1 完成了技能清單、詳情 Drawer、上游更新 Drawer、SkillTest 沙盒。
本版補完以下面向：
1. **資料模型** — 補齊 v1 用到但未宣告的型別，並支撐所有新功能
2. **UX 三項修復** — 永久分離確認、Agent 可見性、版本狀態
3. **功能缺口** — 搜尋篩選、批量更新、衝突解決、Draft/Review 流程接線、操作稽核、測試歷史

不含：真實 API 串接、SkillEditor 的 AI 生成描述功能（維持 mock）

---

## Task Group 1：skillStore 資料模型擴充

### 1.1 Skill 介面新增欄位

```ts
export interface Skill {
  // ...既有欄位不變...
  instructions?: string           // 技能指令（SkillEditor 寫入）
  triggerHint?: string            // 觸發時機說明
  assignedAgents: string[]        // 被指派的 Agent 名稱列表
  versions?: SkillVersion[]       // 版本歷史（含 draft/reviewing/active/history/rejected）
  auditLog?: OperationRecord[]    // 操作稽核記錄
  upstreamConflicts?: ConflictItem[] // 與上游的衝突段落（有衝突的 extension skill 才有）
}
```

### 1.2 新增型別

```ts
export type SkillVersionStatus = 'draft' | 'reviewing' | 'active' | 'history' | 'rejected'

export interface SkillVersion {
  id: string
  versionTag: string
  status: SkillVersionStatus
  name: string
  description: string
  instructions: string
  triggerHint?: string
  capabilities?: { name: string }[]
  reviewNote?: string     // 送審說明
  updateNote?: string     // 版本更新說明（顯示在版本摘要）
  reviewHistory?: SkillReviewRecord[]
  createdAt: string       // ISO 8601
}

export interface SkillReviewRecord {
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN'
  by: string
  time: string
  note?: string
}

export interface DraftSkill {
  id: string
  name: string
  instructions: string
  triggerHint?: string
  assignedAgents: string[]
  description?: string    // AI 生成（mock 留空）
  updatedAt: string       // ISO 8601
}

export interface OperationRecord {
  action: 'ENABLED' | 'DISABLED' | 'UPSTREAM_MERGED' | 'UPSTREAM_IGNORED' | 'UPSTREAM_DETACHED'
  by: string
  time: string
}

export interface TestRun {
  id: string
  skillId: string
  date: string            // ISO 8601
  total: number
  passed: number
  passRate: number        // 0–1
}
```

### 1.3 Mock 資料補充

**Skill mock 補充欄位：**（以「通用客服機器人」為例）
- `assignedAgents: ['通用助理', '客服中心助理']`
- `auditLog`: 3 筆歷史記錄（ENABLED、DISABLED、ENABLED，模擬開關操作）
- `versions`: 2 筆（`active` v2.4.0、`history` v2.3.1）

**DraftSkill mock：** 1 筆草稿（name: '訂單追蹤助理'，instructions 填寫中）

### 1.4 新增 Store State & Computed

```ts
drafts: ref<DraftSkill[]>(MOCK_DRAFTS)
testRunHistory: ref<TestRun[]>(MOCK_TEST_RUNS)

// 新增 computed
pendingUpdateCount: computed(() =>
  flatSkills.value.filter(s => s.upstreamUpdateStatus === 'update_available').length
)
pendingUpdateSkills: computed(() =>
  flatSkills.value.filter(s => s.upstreamUpdateStatus === 'update_available')
)
```

### 1.5 新增 Store Actions

```ts
// 版本管理
getSkillVersions(skillId: string): SkillVersion[]
approveSkillVersion(skillId: string, versionId: string): void
// 通過後：該 version status → 'active'；舊 active → 'history'；Skill.version 更新
rejectSkillVersion(skillId: string, versionId: string, note: string): void
// 退回後：該 version status → 'rejected'

// 技能 CRUD
createSkill(payload: CreateSkillPayload): void
// 建立新 Skill（type: 'extension', origin: 'custom_version'），同時建立 reviewing SkillVersion
updateSkill(skillId: string, payload: UpdateSkillPayload): void
// 建立新的 reviewing SkillVersion，保留現有 active 版本繼續運行

// Draft CRUD
createDraft(): DraftSkill
updateDraft(id: string, patch: Partial<DraftSkill>): void
deleteDraft(id: string): void
submitDraft(id: string): void
// submitDraft：從 drafts 移除，呼叫 createSkill() 建立技能（status: reviewing）

// 操作稽核（在現有 toggle/merge/detach 中附加記錄）
// 不暴露獨立 action，由現有 toggleSkill / mergeUpstreamUpdate / detachUpstream 內部寫入 auditLog

// 測試歷史
saveTestRun(skillId: string, result: { total: number; passed: number }): void
getTestRunHistory(skillId: string): TestRun[]
// 只保留最近 10 筆
```

### 1.6 介面型別

```ts
interface CreateSkillPayload {
  name: string
  instructions: string
  triggerHint?: string
  assignedAgents: string[]
  isEnabled: boolean
}
type UpdateSkillPayload = Omit<CreateSkillPayload, 'isEnabled'>
```

---

## Task Group 2：UX 三項修復

### 2.1 ConfirmModal.vue（通用確認 Modal）

`src/components/ConfirmModal.vue`

Props：
```ts
modelValue: boolean     // v-model 控制顯示
title: string
message: string
confirmLabel?: string   // 預設「確認」
variant?: 'default' | 'danger'  // danger 時確認按鈕為紅色
```

Emits：`update:modelValue`、`confirm`

行為：背景半透明遮罩，中央對齊 dialog，Esc 鍵關閉，點遮罩不關閉（避免誤觸）。

**接線：UpstreamUpdateDrawer 永久分離**
- 點「永久分離」選項卡 → 先開 ConfirmModal（variant: danger）
- 確認後才呼叫 `emit('detach', skill)`

### 2.2 SkillDetailDrawer 新增兩個 Section

**指派 Agent 區塊：**
```
[section-label] 指派使用的 Agent
─────────────────────────────────
● 通用助理    ● 客服中心助理
（若 assignedAgents 為空：「尚未指派任何 Agent」灰色說明）
```
Agent chip 樣式：淺灰背景 + `smart_toy` icon + 名稱，無互動（此 drawer 不做編輯）。

**操作記錄區塊：**（置於 Drawer 最底部）
```
[section-label] 操作記錄
─────────────────────────────────
● 2026-06-28  管理員 啟用此技能
● 2026-06-20  管理員 停用此技能
● 2026-06-10  管理員 啟用此技能
```
使用時間軸樣式（與 SkillReviewDrawer 的 reviewHistory 相同）。顯示最近 5 筆，超過不分頁（此為 demo）。

### 2.3 版本狀態 Badge 接線

SkillCard 新增：當 `skill.versions` 中存在 status === 'reviewing' 的版本時，顯示 `tag--reviewing`（藍色「審核中」badge）。

---

## Task Group 3：搜尋與篩選（FilterBar）

**新元件：** `src/components/Skill/SkillFilterBar.vue`

UI（水平列，位於 Hero 統計卡片與上游更新 Banner 之間）：

```
[🔍 搜尋技能名稱或描述]  [類型: 全部 ▼]  [狀態: 全部 ▼]  [更新: 全部 ▼]
```

Props：`modelValue: SkillFilterState`（v-model）
Emits：`update:modelValue`

```ts
interface SkillFilterState {
  query: string
  type: 'all' | 'system' | 'extension'
  status: 'all' | 'enabled' | 'disabled'
  update: 'all' | 'has_update'
}
```

**SkillManagement.vue 接線：**
- `filterState` ref 初始為全部 'all'
- `filteredSkills` computed 依 filterState 過濾 `store.skills`（包含 extension children）
- FilterBar 加在 upstream Banner 上方

過濾邏輯：
- `query`: 同時比對 `skill.name` 和 `skill.description`（不分大小寫）
- 父 System Skill 若本身不符合但子 Extension 符合，父項仍顯示（帶子項）
- 全部篩選為 all 時，行為與 v1 相同

---

## Task Group 4：批量更新管理

### 4.1 更新 Banner

UpstreamUpdateBanner（SkillManagement.vue 內）改為：
```
↑ 3 個技能有上游更新可合併  [查看全部]
```
`pendingUpdateCount` computed 取代 `firstPendingUpdate`。

### 4.2 BatchUpdateModal.vue

`src/components/Skill/BatchUpdateModal.vue`

顯示所有 `upstreamUpdateStatus === 'update_available'` 的技能，以 checkbox 清單呈現：

```
[✓] 客服機器人 (退貨版)   v1.0.0 → v2.4.0   無衝突
[✓] 會議摘要 (行銷版)     v1.1.0 → v2.1.0   無衝突
[ ] 發票助理               v0.9.0 → v1.5.0   ⚠ 需確認衝突

[全選]              [取消]  [合併已選取（2 項）]
```

有衝突的技能可以勾選，但批量合併時跳過衝突項（合併後顯示提示「1 項有衝突，請個別處理」）。

Props：`modelValue: boolean`
Emits：`update:modelValue`、`merged: string[]`（已合併的 skillId 清單）

### 4.3 Store 新增 Action

```ts
batchMergeUpstreamUpdates(skillIds: string[]): void
// 過濾掉有衝突的，其餘呼叫 mergeUpstreamUpdate
// 回傳實際合併的 ids（透過 return）
```

---

## Task Group 5：衝突解決流程

### 5.1 ConflictResolveStep.vue

`src/components/Skill/ConflictResolveStep.vue`（嵌入 UpstreamUpdateDrawer）

UpstreamUpdateDrawer 新增 `step: 'options' | 'resolve' | 'done'` 本地狀態。

點「合併更新」後：
- 無衝突 → 直接執行 emit('merge')
- 有衝突 → step 切換至 'resolve'，顯示 ConflictResolveStep

ConflictResolveStep 展示衝突段落：

```
衝突項目 1 / 1

[舊（你的）]
  你是一個客服助理

[新（上游的）]
  你是一個專業客服助理，使用親切且專業的語氣

○ 保留我的   ● 採用上游的

──────────────────────────
[← 回到選項]   [確認合併 →]（需全部選擇才可點擊）
```

### 5.2 Store 擴充

```ts
mergeUpstreamUpdate(id: string, conflictResolutions?: ConflictResolution[]): void

interface ConflictResolution {
  field: string        // 'instructions' | 'description' 等
  choice: 'mine' | 'upstream'
}
```

Mock 衝突資料：每個有衝突的技能，在 `upstreamConflicts` 欄位提供資料（已在 1.1 的 Skill 介面中宣告）。

```ts
// 需 export，UpstreamUpdateDrawer 和 ConflictResolveStep 都要 import
export interface ConflictItem {
  field: string
  label: string        // 顯示名稱，如「技能指令」
  mine: string
  upstream: string
}
```

---

## Task Group 6：Draft / Review 流程接線

### 6.1 SkillManagement 新增草稿區

草稿 Section 位於 Hero 統計列下方、FilterBar 上方：

```
草稿（1）                                     [+ 新增技能]
──────────────────────────────────────────────────────────
[DraftCard] 訂單追蹤助理   1/2 步驟   12 分鐘前   [提交審核][編輯][刪除]
```

- 無草稿時不顯示此 section（不佔空間）
- 「+ 新增技能」按鈕跳至 `/view/SkillEditor`（取代原本 disabled 的「建立」按鈕）
- DraftCard 的「編輯」→ `/view/SkillEditor?draftId={id}`
- DraftCard 的「提交審核」→ `store.submitDraft(id)` → 成功後從草稿區消失，技能清單出現帶「審核中」badge 的新技能

### 6.2 SkillManagement 技能清單審核入口

有 reviewing 版本的 SkillCard 顯示藍色「審核中」badge。
點 SkillCard 主體（開啟 SkillDetailDrawer）時：
- Drawer 底部「操作」區額外顯示「查看審核」按鈕（僅當有 reviewing 版本）
- 點「查看審核」→ 開啟 SkillReviewDrawer（v-model binding）

SkillReviewDrawer 的 approve → `store.approveSkillVersion()` → Skill 狀態更新，badge 消失。
reject → `store.rejectSkillVersion()` → reviewing version → rejected，badge 消失，版本歷史中可見。

### 6.3 Router 新增 SkillEditor 路由

```ts
{
  path: '/view/SkillEditor',
  name: 'SkillEditor',
  component: () => import('@/views/SkillEditor.vue'),
  meta: { title: '技能編輯器', parentName: 'SkillManagement' },
}
```

Sidebar 不新增直接入口（從「草稿區新增技能」或 SkillDetailDrawer「編輯」進入）。

---

## Task Group 7：操作稽核（Audit Trail）

已在 Task Group 2.2 涵蓋顯示面。此 Group 補充寫入面：

### 7.1 修改現有 Actions 加入稽核記錄

```ts
function toggleSkill(id: string): void {
  const skill = findSkill(id)
  if (skill) {
    skill.isEnabled = !skill.isEnabled
    skill.auditLog ??= []
    skill.auditLog.unshift({
      action: skill.isEnabled ? 'ENABLED' : 'DISABLED',
      by: '管理員',
      time: new Date().toISOString(),
    })
  }
}
// mergeUpstreamUpdate / ignoreUpstreamUpdate / detachUpstream 同理
```

`auditLog` 以 unshift 維持最新在前，只保留最近 20 筆。

---

## Task Group 8：測試歷史紀錄

### 8.1 Store 接線

AI 快速測試完成後（`computeAITestReport()` 呼叫結束），呼叫：
```ts
store.saveTestRun(selectedSkillId, {
  total: report.total,
  passed: report.passed,
})
```

`saveTestRun` 生成 TestRun 並 push，若超過 10 筆則移除最舊的。

### 8.2 SkillTestAI.vue 顯示歷史

報告卡片（整體報告 section）下方新增折疊區塊「過往記錄」：

```
過往記錄                                   [▼ 展開]

2026-06-30  通過率 71%  (5/7)
2026-06-28  通過率 57%  (4/7)
2026-06-25  通過率 86%  (6/7)
```

折疊預設關閉，點標題展開。最多顯示最近 5 筆。
若無歷史（第一次測試後的報告），不顯示此區塊。

---

## 新增 SCSS 檔案

| 檔案 | 說明 |
|------|------|
| `src/scss/components/_ConfirmModal.scss` | 通用確認 modal |
| `src/scss/components/_SkillFilterBar.scss` | 篩選列 |
| `src/scss/components/_BatchUpdateModal.scss` | 批量更新 modal |
| `src/scss/components/_SkillVersionCompare.scss` | 版本比較 modal（SkillVersionCompareModal 用） |
| `src/scss/components/_SkillReviewDrawer.scss` | 審核 drawer |
| `src/scss/components/_DraftCard.scss` | 草稿卡片 |

建立後在 `src/scss/components/_index.scss` 加上對應的 `@forward`。

`src/scss/views/_SkillEditor.scss`（已存在，確認已 forward）

---

## 元件清單總覽

| 動作 | 路徑 |
|------|------|
| Modify | `src/stores/skillStore.ts`（大量擴充） |
| Create | `src/components/ConfirmModal.vue` |
| Create | `src/components/Skill/SkillFilterBar.vue` |
| Create | `src/components/Skill/BatchUpdateModal.vue` |
| Create | `src/components/Skill/ConflictResolveStep.vue` |
| Modify | `src/components/Skill/SkillCard.vue`（加 reviewing badge） |
| Modify | `src/components/Skill/SkillDetailDrawer.vue`（加 agent chips、audit log、查看審核按鈕） |
| Modify | `src/components/Skill/UpstreamUpdateDrawer.vue`（加 confirm modal、衝突解決 step） |
| Modify | `src/views/SkillManagement.vue`（草稿區、filterbar、批量更新、審核流程） |
| Register | `src/components/Skill/SkillReviewDrawer.vue`（已建立，接線） |
| Register | `src/components/Skill/SkillVersionCompareModal.vue`（已建立，接線） |
| Register | `src/components/Skill/DraftCard.vue`（已建立，接線） |
| Register | `src/views/SkillEditor.vue`（已建立，加路由） |
| Modify | `src/router/index.ts`（加 SkillEditor 路由） |
| Modify | `src/components/Skill/SkillTestAI.vue`（加測試歷史區塊） |

---

## 不在此次範圍

- 真實 API 串接
- SkillEditor 的 AI 自動生成描述（維持空白 placeholder）
- 電子郵件通知（有更新時）
- 搜尋的模糊匹配（Fuse.js），維持簡單 includes
- Skill Builder 圖形化 Prompt 編輯器
- 測試歷史的匯出功能
