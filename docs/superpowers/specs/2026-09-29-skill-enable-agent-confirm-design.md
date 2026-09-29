# 技能啟用：AI 快速測試 100% 引導 + 啟用時確認可用 Agent

## 背景與動機

技能的「啟用」目前有三個問題：

1. AI 快速測試全對（100%）時，SkillStudio 對話流程刻意不打擾使用者（見 `useSkillStudioConversation.ts` 的 `notifyTestResult`）；但也沒有任何地方主動引導使用者去啟用——`SkillTestAI.vue`（測試報告元件）完全沒有啟用入口，使用者測完全對之後不知道下一步要幹嘛。
2. `Skill.assignedAgents`（可調用此技能的 Agent 清單）已經有完整的資料模型跟 `AVAILABLE_AGENTS` 詞彙表，手動建立流程（`SkillEditor.vue`）也已經有選擇 UI，但**啟用當下完全沒有機制去確認/更新**這份清單——啟用一顆技能跟「誰可以用它」这兩件事目前是脫鉤的。
3. 啟用前的測試閘門邏輯（「還沒過測試，要修改內容還是視為通過直接啟用」）在 `SkillManagement.vue` 跟 `SkillEditor.vue` 各自實作一份，且 `SkillEditor.vue` 新建技能時勾選「啟用狀態」完全不檢查閘門（既有 bug）。

## 範圍

**改動**：
- 新增共用 composable，把「檢查測試閘門 → 確認可用 Agent」這段邏輯抽成一份，取代 `SkillManagement.vue`／`SkillEditor.vue` 現有的兩份重複實作。
- `SkillTestAI.vue`（測試報告元件）：AI 快速測試 100% 時顯示「啟用技能」按鈕，走同一套共用邏輯。這個元件同時被 `SkillTest.vue`（技能測試沙盒）與 `SkillStudioPreview.vue`（技能管理抽屜的測試 tab）使用，兩邊都會自動有這顆按鈕。
- `useSkillStudioConversation.ts`：AI 快速測試 100% 時，左側對話主動推一句訊息引導使用者去按「啟用技能」。
- 新增 store mutator `setAssignedAgents(skillId, agents)`（整份取代，區別於現有只能單筆新增的 `assignSkillToAgent`）。
- **順便修復**：`SkillEditor.vue` 新建技能（非編輯模式）勾選「啟用狀態」時，目前完全不檢查測試閘門就直接存成啟用——併入共用流程後，新建跟編輯都會一致地過閘。

**不改動**：
- 現有測試閘門的判斷規則本身（`canEnableSkill`／`describeAiTestGateReason`／`aiTestPassRate`／`aiTestOverridden` 的語意）不變。
- `SkillEditor.vue` 表單裡原本就有的 Agent 選擇 UI（建立/編輯當下就能選）不變、不移除——啟用時的確認是「再看一次、可調整」，不是取代原本的選擇時機。
- 停用方向（啟用→停用）永遠不檢查閘門、也不用確認 Agent，維持現狀。
- 不新增 `SkillDraft`（對話式建立流程的草稿型別）的 `assignedAgents` 欄位——啟用時的確認直接操作已存檔的 `Skill` 記錄，不經過草稿。

## 架構：共用 composable

新檔案 `src/composables/useSkillEnableFlow.ts`。

因為三個呼叫端的「啟用」動作形狀不完全一樣——`SkillManagement.vue`／`SkillTestAI.vue` 是對一顆**已經存在**的技能做 `toggleSkill`／`overrideAndEnableSkill`；`SkillEditor.vue` 的啟用是**建立/更新表單送出的一部分**（`isEnabled` 只是 payload 裡的一個欄位，实际的 create/update 呼叫由 `SkillEditor.vue` 自己決定）——這個 composable **只負責「檢查閘門＋確認 Agent 清單」，回傳確認結果，不負責實際呼叫 store 把技能存檔或切換狀態**。呼叫端拿到結果後自己決定要做什麼。

```ts
export interface EnableFlowResult {
  agents: string[]        // 使用者確認/調整後的可用 Agent 清單
  wasOverridden: boolean  // 這次啟用是不是靠「視為通過」跳過測試閘門
}

// existingAgents：目前已指派的 Agent（預填用）。skill 為 null 代表「還沒存檔的新技能」
// （SkillEditor 新建模式），此時只看 aiTestPassRate==null 的閘門文案，一定會顯示「還沒有做過
// AI 快速測試」。回傳 null 表示使用者中途取消，呼叫端不應該有任何後續動作。
function requestEnable(
  skill: Skill | null,
  existingAgents: string[],
): Promise<EnableFlowResult | null>
```

內部依序處理：
1. 若 `skill` 存在且 `!canEnableSkill(skill)`：顯示現有的「還不能啟用」對話框（去修改內容／視為通過直接啟用／取消）。「去修改內容」直接 resolve `null`（呼叫端各自決定要不要導頁，行為跟現在一樣）；「視為通過」記下 `wasOverridden = true` 後繼續下一步；「取消」resolve `null`。
2. 顯示「確認可用 Agent」對話框，預填 `existingAgents`，同一套 `SkillEditor.vue` 已經在用的 chip 選擇器（`AVAILABLE_AGENTS`），至少要選 1 個才能按下「確認並啟用」；「取消」resolve `null`。
3. 使用者按下「確認並啟用」：resolve `{ agents, wasOverridden }`。

三個呼叫端各自處理結果：

- **`SkillManagement.vue`／`SkillTestAI.vue`**（技能已存在）：
  ```ts
  const result = await requestEnable(skill, skill.assignedAgents ?? [])
  if (!result) return
  store.setAssignedAgents(skill.id, result.agents)
  if (result.wasOverridden) store.overrideAndEnableSkill(skill.id)
  else store.toggleSkill(skill.id)
  ```
- **`SkillEditor.vue`**（`handleSubmit`，勾了「啟用狀態」且是「從停用/新建變成啟用」的情況）：
  ```ts
  const result = await requestEnable(existingSkill ?? null, form.assignedAgents)
  if (!result) return // 使用者取消，不送出整份表單
  form.assignedAgents = result.agents
  // 繼續原本的 buildPayload() → createPersonalSkill / updateSkill，
  // payload.isEnabled 維持 true，payload.assignedAgents 已經是確認後的清單
  ```
  新建模式呼叫時 `existingSkill` 為 `null`：`requestEnable` 會直接進入「還沒有做過 AI 快速測試」文案的閘門對話框（因為 `describeAiTestGateReason` 對 `aiTestPassRate == null` 一律回傳這句），使用者只能選「視為通過」或取消——這正是本次要補上的行為（目前完全不檢查）。

  `SkillEditor.vue` 的 `isDraftMode`（送審草稿編輯，`store.updateDraft`）分支不在本次範圍內、不接共用流程：草稿的 zone 不是 `'personal'`，`canEnableSkill` 對這類技能一律回傳 `true`，本來就不會卡關，維持現狀即可。

## UI 細節

**還不能啟用對話框**：完全沿用現有 `SkillManagement.vue`／`SkillEditor.vue` 已有的三個按鈕與文案，只是改成從共用 composable 的內部狀態驅動，視覺不變。

**確認可用 Agent 對話框**（新增）：標題「啟用「{skill 名稱或表單填的名稱}」」，內容是 `AVAILABLE_AGENTS` 的 chip 網格（跟 `SkillEditor.vue:112-128` 同一份樣式/資料來源），預先勾選 `existingAgents`。「確認並啟用」按鈕在勾選數為 0 時 disabled。「取消」關閉對話框、不做任何變更。

**`SkillTestAI.vue` 的啟用按鈕**：`store.aiTestReport` 顯示且 `report.correct === report.total` 時，在報告區塊底部顯示一顆「啟用技能」主按鈕，點擊呼叫 `requestEnable(skill, skill.assignedAgents ?? [])` 並依結果呼叫 `store.setAssignedAgents` + `store.toggleSkill`（100% 情境下 `wasOverridden` 必為 false，因為根本不會進到「還不能啟用」那一步）。

## AI 對話引導文案

`useSkillStudioConversation.ts` 的 `notifyTestResult`，目前對 `report.correct === report.total` 是直接 `return`（no-op）。改成：

```ts
function notifyTestResult(report: AITestReport): void {
  if (report.total === 0) return
  if (report.correct === report.total) {
    push({ role: 'agent', content: '太好了，這次全部答對了！到下面的測試報告點「啟用技能」，確認一下哪些 Agent 可以用之後就能上線了。' })
    return
  }
  const rate = Math.round((report.correct / report.total) * 100)
  gateStage.value = 'clarify'
  push({ role: 'agent', content: `剛剛的測試沒有全部通過（答對 ${report.correct}/${report.total}，${rate}%），要不要跟我說說看哪裡需要調整？我會幫你補齊或修正做法內容。` })
}
```

100% 分支純推訊息，不改 `gateStage`（維持 `active`，不打斷後續對話），也不引入新的 `StudioAction`——跟現有 `save()` 之後「可以到「測試」tab 驗證」的引導文案是同一種寫法。

## 測試計畫

- 新增 `src/composables/__tests__/useSkillEnableFlow.test.ts`：
  - `skill` 為 `null`（新建情境）→ 一律先進「還沒有做過 AI 快速測試」的閘門對話框
  - `skill` 存在且 `!canEnableSkill` → 顯示閘門對話框；「去修改內容」／「視為通過」／「取消」三條路徑
  - 通過閘門（含 `aiTestPassRate === 1` 直接通過、跟「視為通過」通過）後 → 顯示 Agent 確認對話框，預填 `existingAgents`
  - 勾選數為 0 時「確認並啟用」disabled；勾滿 1 個以上可以送出
  - 「確認並啟用」resolve 出正確的 `{ agents, wasOverridden }`；任何一步的「取消」resolve `null`
- `src/stores/__tests__/skillStore.*.test.ts`（或新檔案）：`setAssignedAgents` 整份取代既有清單的行為
- 更新 `SkillManagement.vue`／`SkillEditor.vue` 現有的啟用閘門測試，改為驗證呼叫共用 composable、resolve 後正確呼叫 `setAssignedAgents`／`toggleSkill`／`overrideAndEnableSkill`／`createPersonalSkill`／`updateSkill`
- 新增 `SkillEditor.vue` 新建模式（`isDraftMode`/`isEditMode` 皆為 false）勾選「啟用狀態」的測試：現在會先過閘門，不能再直接跳過
- 新增 `SkillTestAI.vue` 測試：100% 時顯示啟用按鈕、非 100% 或尚未測試時不顯示；點擊後正確驅動共用流程
- 更新 `useSkillStudioConversation.test.ts`／`SkillStudioWorkspace.test.ts`：把「100% 不打擾使用者」的既有測試改成「100% 推出引導訊息，內容包含『啟用技能』」

## 明確排除（YAGNI）

- 不做「啟用一顆技能後自動通知被指派的 Agent」之類的下游通知機制——這次只確認清單本身。
- 不處理停用方向的 Agent 確認——停用永遠不檢查閘門、不用確認。
- 不修改 `AVAILABLE_AGENTS` 詞彙表本身的內容（例如加入 `skillStore.ts:725` 那個目前不在清單裡的 `'行銷企劃助理'` mock 資料）——那是既有資料/常數對不上的小瑕疵，跟這次功能無關，不在本次範圍內一併清。
- 不整合 `agentPersona.ts`（AiViewer 的產品助理／產品經理／數據經理／行銷經理 4 個委派角色）——research 已確認這是完全不同、無關的另一套「Agent」概念，不要混用。
