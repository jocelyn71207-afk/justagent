# 技能啟用前必須通過 AI 快速測試 — 設計文件

**狀態**：已核准設計，待寫實作計畫
**日期**：2026-09-22
**背景**：延續 2026-09-22 稍早把「AI 快速測試」（`SkillTestAI.vue` / `skillStore.ts`）從自動執行改成選擇題（AI 出情境、使用者判斷「這句話該不該觸發這顆技能？」，答對/答錯計分）之後，緊接著的規則：**個人技能建立後，一定要測試過才能啟用**。

---

## 1. 問題與現況

**現況**：個人技能一建立就直接可用。

- `useSkillStudioConversation.ts` 的 `save()`（`SkillStudio.vue` 用，涵蓋「跟 Agent 對話」與「用行銷積木組裝」兩種建立方式）呼叫 `store.createPersonalSkill({ ..., isEnabled: true, ... })`，`isEnabled` 寫死 `true`。
- `SkillEditor.vue`（三步驟精靈，「手動建立」路徑）的 `isEnabled` 是使用者可勾選的核取方塊，預設 `true`（`existingSkill?.isEnabled ?? true`），建立時直接帶進 `createPersonalSkill`。
- `AITestScenario`/`AITestReport`（`aiTestScenarios`、`aiTestReport`）是**純暫時性**的 store-level ref，不屬於任何特定技能、離開頁面或切換技能就重置（`setSelectedSkill`）或被下一次 `generateAITestScenarios` 蓋掉。技能測試完全沒有寫回 `Skill` 記錄本身。
- 啟用／停用只有一個切換入口：`SkillDetailDrawer.vue` 的「啟用技能／停用」按鈕（`emit('toggle', skill)` → `SkillManagement.vue` 的 `handleToggle` → `store.toggleSkill(id)`），目前唯一的既有防呆只有「審核中不能切換」，跟測試完全無關。
- **關鍵缺口**：`SkillEditor.vue` 編輯模式（`isEditMode`）的「啟用狀態」核取方塊是**第二條、完全獨立**的寫入路徑——勾了就直接送進 `store.updateSkill(editSkillId, payload)`，繞過 `toggleSkill`。新規則必須同時擋住這兩個入口，否則使用者可以繞過抽屜的閘門，直接從編輯精靈打開啟用。
- `Skill.testPassRate` 是**另一個、完全無關**的舊欄位：所有個人技能建立時硬寫 `0`，之後從來沒有任何程式碼更新過它，唯一的讀取者是儀表板統計 `avgTestPassRate`（依 `isEnabled` 篩選後取平均）。這個欄位**不要**跟這次的測驗結果混用，避免把一個死欄位的既有語意（可能將來另作他用）跟這次全新的閘門邏輯綁死。

## 2. 規則

1. 個人技能**建立當下**一律以 `isEnabled: false` 落地，不管是哪一種建立方式，也不管使用者在精靈裡怎麼勾。建立時沒有「立即啟用」這個選項了——因為這時候還沒測過。
2. 技能要從「停用」切成「啟用」（不論從抽屜的切換按鈕，還是編輯精靈的核取方塊）之前，必須先檢查：**這顆技能的 AI 快速測試上一次是不是全對，或者使用者已經明確選擇略過**。條件成立才真的把 `isEnabled` 設成 `true`；不成立就攔下這個動作，改成彈出決策對話框。
3. 決策對話框給兩個真正的選項（加一個取消）：
   - **去修改技能內容**：導去 AI 賦能（`/view/SkillStudio?skillId=`），使用者可以自己補充說明，或請 Agent 幫忙調整觸發條件／指令，調整完可以回來再測一次。
   - **視為通過，直接啟用**：使用者明知測試沒有全過，仍選擇啟用。這個選擇會被記錄（`aiTestOverridden = true`），這次就直接把 `isEnabled` 設成 `true`。
4. 把技能從「啟用」切回「停用」不受這個規則限制，永遠允許，不彈任何對話框（跟現況一致）。
5. 這條規則**不溯及既往**：mock 資料裡本來就 `isEnabled: true` 的技能維持原樣，不會因為這次改動被自動打回停用、也不會被要求補測。閘門只擋「接下來要把某顆技能切成啟用」這個動作本身。
6. Library／系統技能不受影響——這條規則只管 `zone === 'personal'` 的個人技能；Library 技能沒有這個建立／測試流程。

## 3. 資料模型異動

在 `Skill` 介面（`skillStore.ts` 內，緊鄰既有 `testPassRate` 欄位處）新增兩個欄位：

```ts
aiTestPassRate: number | null   // null＝從沒測過；測過後是最近一次「答對數／總題數」
aiTestOverridden: boolean       // 使用者是否曾在測試沒有全對的情況下，選擇「視為通過，直接啟用」
```

寫入時機：

- **建立時**（`createPersonalSkill`、`SkillEditor.vue` 的建立路徑）：一律初始化 `aiTestPassRate: null`、`aiTestOverridden: false`，`isEnabled` 強制 `false`（見 §2.1，不理會呼叫端傳進來的 `isEnabled` 值——`CreateSkillPayload` 型別上的 `isEnabled` 予以忽略或直接拿掉，兩種建立入口都不再傳這個欄位／傳了也不採用）。
- **每次答完一整輪測驗、`_computeAITestReport()` 算出報告時**：把 `correct / total` 寫回**這顆技能**的 `aiTestPassRate`（見 §4，`answerAITestScenario` 需要多接一個 `skillId` 參數才知道要寫回哪一顆）。若這次答對率是 `1`，順手把 `aiTestOverridden` 重設回 `false`（測試自然過關，不需要靠覆蓋）。
- **每次重新生成測驗**（`generateAITestScenarios`，含「重新生成」按鈕）：把該技能的 `aiTestPassRate` 重設回 `null`、`aiTestOverridden` 重設回 `false`——新一批題目，舊結果不算數。這一步**不會**去動 `isEnabled` 本身：已經啟用中的技能不會因為使用者手癢重新生成一次測驗就被打回停用；只是下一次「有人想把它從停用切回啟用」時，會需要重新過關（呼應 §2.5 不溯及既往、只擋「切成啟用」這個動作本身的原則）。
- **使用者在決策對話框選「視為通過，直接啟用」**：把該技能的 `aiTestOverridden` 設成 `true`，並把 `isEnabled` 設成 `true`。

閘門判斷式（供 §5 的共用檢查函式使用）：

```ts
function canEnableSkill(skill: Skill): boolean {
  return skill.aiTestPassRate === 1 || skill.aiTestOverridden
}
```

## 4. `answerAITestScenario` 簽名異動

目前：`answerAITestScenario(scenarioId: string, userAnswer: boolean): void`

改成：`answerAITestScenario(skillId: string, scenarioId: string, userAnswer: boolean): void`

`_computeAITestReport()` 在算出 `{ total, correct, byTag, summary }` 之後，多一步：`const skill = findSkill(skillId); if (skill) skill.aiTestPassRate = correct / total` （並在 `correct === total` 時把 `skill.aiTestOverridden` 設回 `false`）。

`SkillTestAI.vue` 的 `answer()` 呼叫端要多帶 `props.skillId`：`store.answerAITestScenario(props.skillId, scenarioId, userAnswer)`。

`generateAITestScenarios(skillId)` 在清空 `aiTestScenarios`／`aiTestReport` 的同時，也把 `findSkill(skillId)` 的 `aiTestPassRate`／`aiTestOverridden` 重設（見 §3）。

## 5. 兩個啟用入口都要擋

新增一個共用的檢查與對話框流程，兩處呼叫同一套邏輯，避免像現在這樣各自為政、留下繞過的縫：

- 新建一個 composable，例如 `useSkillEnableGate()`（或就近放在 `skillStore.ts` 旁一個小檔案），提供：
  - `canEnableSkill(skill): boolean`（上面那個判斷式）
  - 一個小型決策對話框元件（例如 `SkillEnableGateDialog.vue`），props 帶 `skill`，emits `revise`（去修改）、`override`（視為通過啟用）、`cancel`。文案依 `aiTestPassRate === null`（「這顆技能還沒有測試過」）或 `aiTestPassRate` 介於 0～1 之間（「上次測試 {答對數}／{總題數} 答對，還沒有全對」）微調開場白，兩種情況給的三個按鈕一樣。
- **`SkillDetailDrawer.vue` → `SkillManagement.vue` 的 `handleToggle`**：只有「目前 `isEnabled === false`、使用者想切成 `true`」這個方向需要檢查。`canEnableSkill(skill)` 成立就照舊呼叫 `store.toggleSkill(id)`；不成立就開啟決策對話框，選「去修改」導頁 `router.push({ name: 'SkillStudio', query: { skillId: skill.id } })`，選「視為通過」呼叫一個新的 store 動作（例如 `store.overrideAndEnableSkill(id)`：設 `aiTestOverridden = true` 再 `isEnabled = true`，寫一筆 `auditLog`，動作類型可沿用 `'ENABLED'` 或新增一個更精確的類型，兩者都合理，先用既有的 `'ENABLED'` 保持 audit log 型別不變）。「停用」方向（`isEnabled === true → false`）維持現況，不檢查、不彈窗。
- **`SkillEditor.vue` 編輯模式**：`isEditMode` 下的「啟用狀態」核取方塊，`handleSubmit` 送出前，如果 `form.isEnabled === true` 而且原本 `existingSkill.isEnabled === false`，一樣先跑 `canEnableSkill`；不成立就**整個攔下這次送出**（不呼叫 `updateSkill`），改開一樣的決策對話框：
  - 選「去修改技能內容」：不送出這次表單變更，直接導去 `/view/SkillStudio?skillId=`（離開三步驟精靈；跟抽屜那邊行為一致，且 AI 賦能才是真正能「請 Agent 幫忙調整」的介面）。
  - 選「視為通過，直接啟用」：先呼叫 `overrideAndEnableSkill(editSkillId)`（設定 `aiTestOverridden = true` 且 `isEnabled = true`），**然後**才把這次表單其餘欄位送出：`updateSkill(editSkillId, { ...payload, isEnabled: true })`——`isEnabled` 明確帶 `true`（剛剛已經翻成 true 的現況），不要帶 `existingSkill.isEnabled` 這種送出當下已經過期的舊值，避免把剛設好的 `true` 蓋回 `false`。
  - 選「取消」：不做任何事，留在原頁面，表單變更不送出。
  - 若 `canEnableSkill` 本來就成立（含「原本就是啟用」「本來就沒打算啟用」的一般狀況），整段照舊直接 `updateSkill(editSkillId, payload)`，不受影響。
  - **建立模式**（`!isEditMode`）：「建立後立即啟用」這個核取方塊直接拿掉／隱藏，`handleSubmit` 建立時一律不帶 `isEnabled`（或帶但被 store 端忽略，取決於 §6 的型別決定），文案改成單純說明「建立後要先通過 AI 快速測試才能啟用」。

## 6. 型別／既有呼叫端調整

- `CreateSkillPayload` 的 `isEnabled: boolean`：兩個方向都可以，選較不容易踩雷的一種——**把 `isEnabled` 從 `CreateSkillPayload` 拿掉**，`createPersonalSkill` 內部一律寫死 `isEnabled: false, aiTestPassRate: null, aiTestOverridden: false`，這樣呼叫端（`useSkillStudioConversation.ts`、`SkillEditor.vue`）的建立路徑都不用也不能再傳這個欄位，型別上直接杜絕「建立時還能指定啟用」的可能性，比留著欄位但執行期忽略更乾淨、也更不會被下一個開發者不小心改回去。
  - 影響：`useSkillStudioConversation.ts` 的 `save()` 拿掉 `isEnabled: true` 那行；`SkillEditor.vue` 的建立分支（`!isEditMode`）不再把 `form.isEnabled` 塞進 `payload`。
  - `UpdateSkillPayload`（給 `updateSkill`／編輯路徑用）的 `isEnabled` 維持不動——編輯既有技能本來就可能要改這個欄位（透過新的閘門邏輯），只是這次送出前要先過 `canEnableSkill` 檢查。
- 既有測試（研究報告列出的 7 個檔案）目前的 fixture 都寫 `createPersonalSkill({ ..., isEnabled: true, ... })`：這些呼叫要嘛拿掉 `isEnabled: true`（型別拿掉欄位後會直接編譯錯誤逼你改），需要「這顆技能一開始就是啟用」情境的測試（例如任何依賴「個人技能預設可用」的既有案例），改成先呼叫 `createPersonalSkill` 拿到 id，再用 `store.overrideAndEnableSkill(id)`（或直接在測試裡塞 `store.findSkill(id)!.isEnabled = true` 這種更輕量的做法，兩者都合理，寫實作計畫時再依各測試情境挑）把它設成啟用，維持原本測試想驗證的行為不變。

## 7. 顯示微調

- `SkillCard.vue`／`PersonalSkillGroup.vue` 目前 `isEnabled` 的顯示文字（啟用中／已停用）：當 `!isEnabled && skill.aiTestPassRate === null`（從沒測過）時，文字改成「尚未測試」，避免使用者誤以為是被人手動停用。`!isEnabled && aiTestPassRate !== null`（測過但沒全對、也沒 override）維持「已停用」不變（畢竟這是真的因為沒通過而不能用）。
- `SkillDetailDrawer.vue` 的啟用按鈕文案不變（「啟用技能」／「停用」），但點下去之後的行為照 §5 走。

## 8. 非目標（Non-goals）

- 不處理 Library／系統技能的啟用流程。
- 不追溯既有 mock 資料裡已啟用的技能（§2.5）。
- 不改變「停用」方向的任何行為。
- 不在這次一併導入更細緻的技能狀態機（例如把 `isEnabled` 拆成 `draft/testing/active` 這種多值狀態）——維持現有的 `isEnabled: boolean` + 兩個新輔助欄位，把狀態語意留在 `aiTestPassRate`／`aiTestOverridden` 本身即可，不擴大既有型別的破壞面。
- 不處理「技能內容變更後要不要自動讓已過關的測試失效、逼重測」——目前設計只在**重新生成測驗**（使用者主動觸發）時重置測試結果；單純編輯技能內容（不重新生成測驗）不會自動讓 `aiTestPassRate`/`aiTestOverridden` 失效。這是刻意簡化，若之後要收緊（例如編輯 `instructions`/`triggerHint` 就自動重置），需要另外討論範圍。

## 9. 附註：本文件與程式現況的對應

- §1 現況描述對應：`skillStore.ts:102`（`Skill.isEnabled`）、`:1257-1282`（`createPersonalSkill`）、`useSkillStudioConversation.ts:280-291`（`save()`）、`SkillEditor.vue:271,294-311`（建立／編輯兩條分支）、`SkillDetailDrawer.vue:114-122`（切換按鈕）、`SkillManagement.vue:759-761`（`handleToggle`）、`skillStore.ts:1197-1209`（`toggleSkill`）。
- 測驗選擇題本身（`expectedTrigger`／`answerAITestScenario`／`_computeAITestReport`）已在稍早的改動中完成，見同一天稍早的對話紀錄與程式碼；本文件只處理「測驗結果要不要、如何影響啟用」這一層，不重複描述選擇題機制本身。
