# 技能啟用：AI 快速測試 100% 引導 + 啟用時確認可用 Agent

## 背景與動機

技能的「啟用」目前有三個問題：

1. AI 快速測試全對（100%）時，SkillStudio 對話流程刻意不打擾使用者（見 `useSkillStudioConversation.ts` 的 `notifyTestResult`）；但也沒有任何地方主動引導使用者去啟用——`SkillTestAI.vue`（測試報告元件）完全沒有啟用入口，使用者測完全對之後不知道下一步要幹嘛。
2. `Skill.assignedAgents`（可調用此技能的 Agent 清單）已經有完整的資料模型跟 `AVAILABLE_AGENTS` 詞彙表，手動建立流程（`SkillEditor.vue`）也已經有選擇 UI，但**啟用當下完全沒有機制去確認/更新**這份清單——啟用一顆技能跟「誰可以用它」这兩件事目前是脫鉤的。
3. 啟用前的測試閘門邏輯（「還沒過測試，要修改內容還是視為通過直接啟用」）在 `SkillManagement.vue` 跟 `SkillEditor.vue` 各自實作一份。

（釐清：曾經懷疑「`SkillEditor.vue` 新建技能時勾選啟用狀態會跳過閘門直接啟用」是個 bug，但實際讀 `createPersonalSkill()` 的實作後確認它從頭到尾都硬寫 `isEnabled: false`、根本不讀 payload 的 `isEnabled` 欄位——新建技能不管表單勾什麼，一律以未啟用落地，這件事本來就是對的，不需要修。新建模式因此完全不需要接共用流程，見下方「架構」一節。）

## 範圍

**改動**：
- 新增共用 composable，把「檢查測試閘門 → 確認可用 Agent」這段邏輯抽成一份，取代 `SkillManagement.vue`／`SkillEditor.vue` 現有的兩份重複實作。
- `SkillTestAI.vue`（測試報告元件）：AI 快速測試 100% 時顯示「啟用技能」按鈕，走同一套共用邏輯。這個元件同時被 `SkillTest.vue`（技能測試沙盒）與 `SkillStudioPreview.vue`（技能管理抽屜的測試 tab）使用，兩邊都會自動有這顆按鈕。
- `useSkillStudioConversation.ts`：AI 快速測試 100% 時，左側對話主動推一句訊息引導使用者去按「啟用技能」。
- 新增 store mutator `setAssignedAgents(skillId, agents)`（整份取代，區別於現有只能單筆新增的 `assignSkillToAgent`）。

**不改動**：
- 現有測試閘門的判斷規則本身（`canEnableSkill`／`describeAiTestGateReason`／`aiTestPassRate`／`aiTestOverridden` 的語意）不變。
- `SkillEditor.vue` 表單裡原本就有的 Agent 選擇 UI（建立/編輯當下就能選）不變、不移除——啟用時的確認是「再看一次、可調整」，不是取代原本的選擇時機。
- 停用方向（啟用→停用）永遠不檢查閘門、也不用確認 Agent，維持現狀。
- 不新增 `SkillDraft`（對話式建立流程的草稿型別）的 `assignedAgents` 欄位——啟用時的確認直接操作已存檔的 `Skill` 記錄，不經過草稿。

## 架構：共用元件

新檔案 `src/components/Skill/SkillEnableFlow.vue`。做成一個掛在呼叫端頁面裡的無渲染 UI 元件（本身只負責兩個 Teleport 對話框＋內部狀態機），透過 `defineExpose` 暴露一個方法，呼叫端用 template ref 呼叫——跟這個 codebase 裡 `SkillStudioWorkspace`／`SkillStudioDrawer` 已經在用的「用 `defineExpose` 暴露方法給父層」是同一個慣例，不是新發明一套機制。

（原本 spec 草稿寫的是「新增共用 composable」，這裡改成一個 `.vue` 元件——因為它要渲染兩個 Teleport 對話框，用純 `.ts` composable 硬做這件事不符合這個 codebase 的慣例，元件才是正確的載體。對呼叫端來說功能上還是「呼叫一個共用函式、等結果」，介面設計不變。）

因為三個呼叫端的「啟用」動作形狀不完全一樣——`SkillManagement.vue`／`SkillTestAI.vue` 是對一顆**已經存在**的技能做 `toggleSkill`／`overrideAndEnableSkill`；`SkillEditor.vue` 的啟用是**編輯模式表單送出的一部分**（`isEnabled` 只是 payload 裡的一個欄位，实际的 update 呼叫由 `SkillEditor.vue` 自己決定）——這個共用元件**只負責「檢查閘門＋確認 Agent 清單」，回傳確認結果，不負責實際呼叫 store 把技能存檔或切換狀態**。呼叫端拿到結果後自己決定要做什麼。

`skill` 參數**不接受 `null`**：三個呼叫端全部都是對一顆已經存在、有 id 的技能操作（`SkillEditor.vue` 只有編輯模式會呼叫，新建模式完全不碰這個元件——見上一節的釐清，新建一律以未啟用落地，不需要、也不應該跳出任何閘門或確認對話框）。

```ts
export type EnableFlowOutcome =
  | { type: 'confirmed'; agents: string[]; wasOverridden: boolean }
  | { type: 'revise' }      // 閘門沒過，使用者選「去修改技能內容」
  | { type: 'cancelled' }   // 使用者在任何一步按了「取消」

// existingAgents：目前已指派的 Agent（預填用）
function requestEnable(skill: Skill, existingAgents: string[]): Promise<EnableFlowOutcome>
```

內部依序處理：
1. 若 `!canEnableSkill(skill)`：顯示現有的「還不能啟用」對話框（去修改內容／視為通過直接啟用／取消）。「去修改內容」resolve `{ type: 'revise' }`；「視為通過」記下 `wasOverridden = true` 後繼續下一步；「取消」resolve `{ type: 'cancelled' }`。
2. 顯示「確認可用 Agent」對話框，預填 `existingAgents`，同一套 `SkillEditor.vue` 已經在用的 chip 選擇器（`AVAILABLE_AGENTS`），至少要選 1 個才能按下「確認並啟用」；「取消」resolve `{ type: 'cancelled' }`。
3. 使用者按下「確認並啟用」：resolve `{ type: 'confirmed', agents, wasOverridden }`。

`'revise'` 跟 `'cancelled'` 分開，是因為兩個現有呼叫端目前對這兩種情況的反應本來就不一樣（「去修改內容」目前會導頁去編輯，「取消」只是關掉對話框、原地不動），拆開回傳型別讓呼叫端能維持各自原本的行為，不是新增邏輯。

三個呼叫端各自處理結果：

- **`SkillManagement.vue`／`SkillTestAI.vue`**（技能已存在）：
  ```ts
  const outcome = await enableFlowRef.value!.requestEnable(skill, skill.assignedAgents ?? [])
  if (outcome.type === 'cancelled') return
  if (outcome.type === 'revise') { router.push({ query: { skillId: skill.id } }); return }
  store.setAssignedAgents(skill.id, outcome.agents)
  if (outcome.wasOverridden) store.overrideAndEnableSkill(skill.id)
  else store.toggleSkill(skill.id)
  ```
- **`SkillEditor.vue`**（`handleSubmit`，編輯模式、「從停用變成啟用」且未過閘門的情況）：
  ```ts
  const outcome = await enableFlowRef.value!.requestEnable(existingSkill!, form.assignedAgents)
  if (outcome.type === 'cancelled') return // 不送出整份表單，停留在編輯頁
  if (outcome.type === 'revise') return    // 現行行為就是關掉對話框、停留在編輯頁，不用額外導頁
  form.assignedAgents = outcome.agents
  // 繼續原本的 buildPayload() → updateSkill，
  // payload.isEnabled 維持 true，payload.assignedAgents 已經是確認後的清單
  ```

  `SkillEditor.vue` 的 `isDraftMode`（送審草稿編輯，`store.updateDraft`）分支跟新建模式一樣不在本次範圍內、不接共用元件：草稿的 zone 不是 `'personal'`，`canEnableSkill` 對這類技能一律回傳 `true`，本來就不會卡關，維持現狀即可。

## UI 細節

**還不能啟用對話框**：完全沿用現有 `SkillManagement.vue`／`SkillEditor.vue` 已有的三個按鈕與文案，只是改成從共用 composable 的內部狀態驅動，視覺不變。

**確認可用 Agent 對話框**（新增）：標題「啟用「{skill 名稱或表單填的名稱}」」，內容是 `AVAILABLE_AGENTS` 的 chip 網格（跟 `SkillEditor.vue:112-128` 同一份樣式/資料來源），預先勾選 `existingAgents`。「確認並啟用」按鈕在勾選數為 0 時 disabled。「取消」關閉對話框、不做任何變更。

**`SkillTestAI.vue` 的啟用按鈕**：`store.aiTestReport` 顯示且 `report.correct === report.total` 時，在報告區塊底部顯示一顆「啟用技能」主按鈕，點擊呼叫 `requestEnable(skill, skill.assignedAgents ?? [])` 並依結果呼叫 `store.setAssignedAgents` + `store.toggleSkill`（100% 情境下 `outcome.type` 必為 `'confirmed'` 且 `wasOverridden` 為 false，因為根本不會進到「還不能啟用」那一步——`'revise'`／`'cancelled'` 在這個按鈕底下理論上不會發生，但呼叫端還是要處理完整的三種型別，不能假設）。

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

- 新增 `src/components/__tests__/SkillEnableFlow.test.ts`：
  - `!canEnableSkill(skill)` → 顯示閘門對話框；「去修改內容」／「視為通過」／「取消」三條路徑，分別 resolve `{type:'revise'}`／繼續下一步／`{type:'cancelled'}`
  - 通過閘門（含 `aiTestPassRate === 1` 直接通過、跟「視為通過」通過）後 → 顯示 Agent 確認對話框，預填 `existingAgents`
  - 勾選數為 0 時「確認並啟用」disabled；勾滿 1 個以上可以送出
  - 「確認並啟用」resolve 出正確的 `{ type: 'confirmed', agents, wasOverridden }`
- `src/stores/__tests__/skillStore.*.test.ts`（或新檔案）：`setAssignedAgents` 整份取代既有清單的行為
- 更新 `SkillManagement.enableGate.test.ts`：原本「視為通過」跟「已經全對過的技能」兩個測試斷言啟用是「點一下就立刻生效」，現在都要先經過 Agent 確認對話框才會真的呼叫 `toggleSkill`／`overrideAndEnableSkill`——這兩個測試需要重寫，不是小修
- 更新 `SkillEditor.enableGate.test.ts`：同上，「視為通過」那個測試要補上 Agent 確認步驟；新增一個「新建模式勾『啟用狀態』送出：不彈任何對話框、直接以 `isEnabled: false` 存檔」的迴歸測試，確認上面釐清的既有行為沒有被意外改掉
- 新增 `SkillTestAI.vue` 測試：100% 時顯示啟用按鈕、非 100% 或尚未測試時不顯示；點擊後正確驅動共用流程
- 更新 `useSkillStudioConversation.test.ts`／`SkillStudioWorkspace.test.ts`：把「100% 不打擾使用者」的既有測試改成「100% 推出引導訊息，內容包含『啟用技能』」

## 明確排除（YAGNI）

- 不做「啟用一顆技能後自動通知被指派的 Agent」之類的下游通知機制——這次只確認清單本身。
- 不處理停用方向的 Agent 確認——停用永遠不檢查閘門、不用確認。
- 不修改 `AVAILABLE_AGENTS` 詞彙表本身的內容（例如加入 `skillStore.ts:725` 那個目前不在清單裡的 `'行銷企劃助理'` mock 資料）——那是既有資料/常數對不上的小瑕疵，跟這次功能無關，不在本次範圍內一併清。
- 不整合 `agentPersona.ts`（AiViewer 的產品助理／產品經理／數據經理／行銷經理 4 個委派角色）——research 已確認這是完全不同、無關的另一套「Agent」概念，不要混用。
