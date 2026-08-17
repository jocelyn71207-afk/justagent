# 個人技能區重新設計：移除版控、統一複製流程、名稱衝突偵測

## 背景

目前「技能管理」模組的個人技能區（我的技能）使用 `personalVersions: PersonalSkillVersion[]` 讓一個技能同時保有多個版本、可切換使用中版本、各自送審。這套機制與 UI（版本管理清單、切換版本 dialog、版本比較 modal）已經實作，但討論後決定：個人技能不需要版本並存，應簡化為「一個技能 = 一份目前內容」。

同時，Library 技能的「複製」目前會建立 `myDrafts` 草稿並導向舊版 `SkillEditor` 的 `createSkill` 流程——這條路線沒有個人技能概念（`zone`/`personalStatus` 等欄位），也沒有複製完成後的導頁，是尚未接軌新架構的半成品。個人技能區內部的「複製版本」（`duplicatePersonalVersion`）則是在同一技能下新增一個版本。兩者要統一成同一種行為：建立一份全新、獨立的個人技能副本。

複製之後，若這份副本的來源與使用者「我的技能」裡已有的某份技能相同，需要在編輯介面提示使用者，讓使用者可以修改顯示名稱以區分。

Library 技能的審核版本治理（`Skill.versions` / `SkillVersion` / draft-reviewing-active-history）**不受影響**，維持現狀。

## 目標

1. 個人技能移除多版本並存機制，簡化為單一狀態。
2. Library 複製與個人技能內部複製統一為同一套「建立副本」流程，複製後進入既有的「跟 Agent 對話修改 / 直接編輯」選擇彈窗。
3. 新增 `skillName`（不可變識別名）與 `name`（可編輯顯示名稱）欄位區分，複製時偵測「我的技能」中是否已有相同 `skillName`，若有則在編輯介面提示並讓使用者可修改顯示名稱。
4. 「來源技能有更新」的提示改為動態計算（比對來源目前版本 vs 複製當下記錄的版本），取代目前寫死的 mock 值；套用更新改為直接覆蓋目前內容（附確認提示）。

## 資料模型變更（`src/stores/skillStore.ts`）

### 移除

- `PersonalSkillVersion` interface 整個移除。
- `Skill.personalVersions` 欄位移除。
- Store functions：`duplicatePersonalVersion`、`setActiveVersion`、`_syncPersonalStatus`（版本同步邏輯）移除或大幅簡化為直接操作 `Skill` 本身。

### 保留並改為單一狀態來源

以下欄位已存在於 `Skill` interface（原本與 `personalVersions[].xxx` 重複），移除陣列後這些欄位直接就是唯一狀態：

```typescript
personalStatus?: 'available' | 'reviewing' | 'has_library'
derivedFrom?: string
submitNote?: string
submitMode?: 'version_update' | 'new_skill'
targetScope?: 'enterprise' | 'team'
targetTeamName?: string
submittedBy?: string
```

新增（原本只在 `PersonalSkillVersion` 上）：

```typescript
reviewFeedback?: string
aiAnalysis?: string[]
```

### 新增欄位

```typescript
skillName: string        // 不可變識別名，建立/複製當下決定，之後不再變動
derivedFromVersion?: string // 複製當下，來源技能（derivedFrom 指向的技能）的 version 快照
```

- `name` 欄位語意調整為「使用者可編輯的顯示名稱」。
- Library 型技能（`system`/`enterprise`/`team` scope）的 `skillName` 直接等於 `name`，不需要使用者編輯（Library 技能改名走既有的 `updateSkill`／審核流程，不受本次調整影響）。

### `hasLibraryUpdate` 改為 computed

移除 mock 中寫死的 `hasLibraryUpdate: true/false`。新增 computed（比照現有 `upstreamUpdateSkillIds` 的寫法）：

```typescript
const personalLibraryUpdateSkillIds = computed<Set<string>>(() => {
  const ids = new Set<string>()
  for (const s of myPersonalSkills.value) {
    if (!s.derivedFrom || !s.derivedFromVersion) continue
    const source = flatSkills.value.find(p => p.id === s.derivedFrom)
    if (source && source.version !== s.derivedFromVersion) ids.add(s.id)
  }
  return ids
})
```

`PersonalSkillGroup` / `SkillDetailDrawer` 原本讀 `skill.hasLibraryUpdate` 的地方，改為讀這個 computed set（`store.personalLibraryUpdateSkillIds.has(skill.id)`）。

### `applyLibraryUpdate` 行為調整

不再 append 新版本。改為：直接用來源技能目前的 `instructions` / `triggerHint` / `capabilities` 等內容覆蓋這份個人技能本身，並更新 `derivedFromVersion` 為來源目前版本。呼叫前需經過 UI 層的確認 dialog（見下方 UI 章節）。

## 複製流程統一

### 觸發點

- Library 技能詳情（`SkillDetailDrawer.vue` 非個人技能時的「複製」按鈕，line ~33-35）
- `LibraryBrowseModal` / `LibrarySkillRow` 內的複製動作（經 `duplicate` emit 一路傳到 `SkillManagement.vue` 的 `handleDuplicate`）
- 個人技能詳情內部的「複製」按鈕（`SkillDetailDrawer.vue` line ~317-320，原本呼叫 `duplicatePersonalVersion`）

三者統一呼叫 store 新函式（取代 `duplicateSkill` 與 `duplicatePersonalVersion`）：

```typescript
function duplicateAsPersonalSkill(sourceId: string): Skill  // 傳回新建立的個人技能
```

行為：

- 找到來源技能（可能是 Library 技能，也可能是既有個人技能）。
- 建立新的 `Skill`，`zone: 'personal'`、`personalStatus: 'available'`、`id` 新產生。
- `skillName` = 來源技能的 `skillName`（若來源是 Library 技能且尚無 `skillName`，視為等於其 `name`）。
- `name` = 來源技能的 `name`（複製一份，可編輯）。
- `derivedFrom` = 來源技能 id（不論來源是 Library 技能還是個人技能都設定，用於名稱衝突與來源更新比對）。
- `derivedFromVersion` = 來源技能目前 `version`。
- 複製 `instructions`、`triggerHint`、`capabilities` 等內容欄位。
- push 進 `myPersonalSkillsRef`。

### 複製後導頁

沿用現有「已建立複本」選擇彈窗（`SkillDetailDrawer.vue` line ~401-420：跟 Agent 對話修改 / 直接編輯），三個觸發點複製完成後都顯示這個彈窗，而不是像現在 Library 複製那樣直接靜默建立草稿、關閉 drawer。

- 選「直接編輯」→ 導向 `SkillEditor.vue`（見下方調整）。
- 選「跟 Agent 對話修改」→ 開啟 `SkillEditChatModal.vue`。

`SkillManagement.vue` 的 `handleDuplicate` 需要改為呼叫新的 `duplicateAsPersonalSkill`，並比照個人區內部複製一樣顯示選擇彈窗（目前 Library 複製走的是 `store.duplicateSkill` + 直接 `detailSkill.value = null`，這段要整個換掉）。

### `SkillEditor.vue` 調整

目前 `SkillEditor.vue` 完全不知道「個人技能」概念（只有 `createSkill`／`updateSkill`／`updateDraft`，存回 Library 技能陣列或 `myDrafts`）。需要新增一個模式：當帶入的是剛複製出來的個人技能 id 時，讀寫 `myPersonalSkillsRef` 而非 Library `skills`。原本的 `draftId` / `myDrafts` 路線本次不擴充、也不刪除（超出範圍，見 Out of Scope）。

## 名稱衝突偵測

進入編輯介面（`SkillEditor.vue` 表單頁或 `SkillEditChatModal.vue`）、且該技能是剛複製建立的個人技能時：

```typescript
const hasNameConflict = computed(() => {
  if (!skill.derivedFrom) return false // 自建的技能沒有來源，不做這個檢查
  return store.myPersonalSkills.some(
    s => s.id !== skill.id && s.skillName === skill.skillName
  )
})
```

若為 `true`，在編輯介面頂部顯示提示 banner（例如：「你已經有一份來自『{{來源名稱}}』的技能了，建議修改顯示名稱以便區分」），並將名稱輸入欄位 focus／highlight。這是軟性提醒，不阻擋儲存、不強制修改。

## 移除版控相關 UI

- `SkillDetailDrawer.vue`：「版本管理」整段（`psv-list` 及其中的版本卡片、切換使用中版本按鈕、版本比較 modal 觸發）移除，改為單一「目前狀態」卡片，直接顯示 `personalStatus` 對應的狀態、`submitNote`、`reviewFeedback`、`aiAnalysis`。原本掛在「使用中版本」下的上游更新提示（line ~274-283）改成掛在這張狀態卡片上。
- `PersonalSkillGroup.vue`：拿掉 `activeVersion` 相關的 `v{{versionTag}} 使用中` 標籤（因為沒有版本清單了，直接顯示 `skill.version` 或不顯示版本號）。
- 版本切換時的上游更新 dialog（`switchVersionId` 相關邏輯，`SkillDetailDrawer.vue` line ~363-384）整段移除（沒有版本可切換）。
- `SkillVersionCompareModal` 的 import／使用（僅限個人技能路徑）移除；Library 技能審核流程若仍使用同一元件比較 `versions`，維持不動。

## 套用來源更新的確認 Dialog

`applyLibraryUpdate` 觸發前，彈出確認 dialog：說明「套用後將以來源技能目前內容覆蓋這份技能的指令內容，且無法復原」，使用者確認後才呼叫 store 方法。取代原本「新增版本、不影響既有版本」的說法（因為沒有版本歷史了）。

此確認 dialog 由 `SkillManagement.vue` 統一處理，比照現有送審 dialog（`submitConfirmSkill` 那組 state）的做法：新增一個 `applyUpdateConfirmSkill` state，`handlePersonalUpdate` 改為先設定這個 state 開啟確認 dialog，使用者按下確認後才呼叫 `store.applyLibraryUpdate`。

## Out of Scope

- Library 技能審核版本治理（`Skill.versions`、`SkillVersion`、送審/核准/退回流程）不受影響。
- `myDrafts` / `DraftSkill` 既有的草稿機制（透過側選單或其他入口建立的草稿）不擴充、不刪除，本次調整只影響「複製」這個入口產生的個人技能。
- 不新增「忽略來源更新」的持久化機制（上次討論提過，本次先不做）。

## 影響檔案清單

| 檔案 | 異動類型 |
|---|---|
| `src/stores/skillStore.ts` | 移除 `PersonalSkillVersion`／`personalVersions`；新增 `skillName`、`derivedFromVersion`；新增 `duplicateAsPersonalSkill`、`personalLibraryUpdateSkillIds`；調整 `applyLibraryUpdate`；移除 `duplicatePersonalVersion`、`setActiveVersion`、`_syncPersonalStatus` |
| `src/components/Skill/SkillDetailDrawer.vue` | 移除版本管理段落與切換版本 dialog；新增單一狀態卡片；複製按鈕改呼叫新流程；名稱衝突提示（若編輯在此頁面內） |
| `src/components/Skill/PersonalSkillGroup.vue` | 移除版本標籤，`hasLibraryUpdate` 判斷改讀 computed set |
| `src/components/Skill/SkillEditChatModal.vue` | 新增名稱衝突提示 banner |
| `src/components/Skill/LibraryBrowseModal.vue` / `LibrarySkillRow.vue` | 複製 emit 行為不變，接收端（`SkillManagement.vue`）處理方式改變 |
| `src/views/SkillManagement.vue` | `handleDuplicate` 改呼叫 `duplicateAsPersonalSkill` 並顯示選擇彈窗 |
| `src/views/SkillEditor.vue` | 新增個人技能編輯模式（讀寫 `myPersonalSkillsRef`）；名稱衝突提示 banner |

## Mock 資料調整

`MOCK_PERSONAL_SKILLS` 中所有技能移除 `personalVersions`，欄位攤平到 `Skill` 本身；補上 `skillName`（沿用現有 `name`）與 `derivedFromVersion`（對於有 `derivedFrom` 的技能，設定為與來源技能目前 `version` 不同的值，以便展示「來源已更新」情境；沒有 `derivedFrom` 的技能不需要這個欄位）。
