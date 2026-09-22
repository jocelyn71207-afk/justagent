# AI 賦能對話：意圖判斷與關卡分流 — 設計文件

**狀態**：已核准設計，待寫實作計畫
**日期**：2026-09-22

---

## 1. 背景與目標

AI 賦能（`SkillStudio.vue` 的「用對話建立」路徑）目前的對話邏輯（`useSkillStudioConversation.ts` 的 `interpretStudioMessage`）是單一模式：一開口就假設使用者要定義一顆新技能或修改既有技能的某個欄位，用規則式關鍵字比對解析使用者的話。

這次要在它前面加一層**意圖判斷與關卡分流**：先搞清楚使用者到底想「記一顆新技能／改一顆既有技能」還是「只是問問題／要套用某個既有技能做事」，如果是要記技能，再往下問清楚是要沿用現有規定、改既有規定，還是真的要開一份新的——確認到有明確的內容之後，才交給既有的建立/修改邏輯接手。

這個分流不影響「用行銷積木組裝」路徑（`SkillBlockComposer`），也不影響 AI 賦能既有的建立/修改內容解析規則本身（`interpretStudioMessage` 不用重寫）。

## 2. 掛載位置與整體狀態機

只作用於 `useSkillStudioConversation()` 的 chat 方式（`draft.method === 'chat'`）。新增一個對話層級的狀態：

```ts
export type GateStage =
  | 'intent'        // 每則新訊息的預設起點：判斷意圖
  | 'gate0'         // 太模糊，先問「記技能還是單純問事情」
  | 'gate1'         // 問「照規定 / 改規定 / 記新的」
  | 'checkingRules' // 內部過渡態：查 myPersonalSkills 有沒有相近做法（不停留、不等使用者輸入，判斷完立刻轉下一關）
  | 'gate2'         // 找到相近做法，問「沿用 / 改他 / 另開一份 / 講別的」
  | 'clarify'       // 多輪問答補齊草稿內容（沿用既有 interpretStudioMessage 的抽取規則）
  | 'gate3'         // 最終確認「內容如下…這樣可以嗎？」
  | 'active'         // 分流完畢，既有的 interpretStudioMessage 接手
```

`startCreate()` 目前的行為（見 `useSkillStudioConversation.ts:215-231`）在**沒有 prefill**（一般使用者從 `SkillMethodChooser` 選「用對話建立」進來）時，`method: null`、`messages: []`，不主動推開場白。這次改動只影響**沒有 prefill** 的情況：`gateStage` 初始化為 `'intent'`，且進場時主動推一句開場白引導使用者描述需求（沿用 `DEFAULT_OPENING_MESSAGE` 的語氣，內容微調成不預設對方是要建技能）。**有 prefill**（方案三 conv4 交接、SkillStudio `?method=` 直接指定方式）的情況維持現況：`gateStage` 直接是 `'active'`，略過整套關卡，直接進既有建立流程——這些入口本來就已經知道使用者要幹嘛，不需要再問一次。

`loadSkill()`（修改既有技能，`?skillId=` 進站）同樣維持現況：`gateStage` 直接是 `'active'`。

`send(text)`（`useSkillStudioConversation.ts:264-274`）改動：呼叫前先檢查 `gateStage`，不是 `'active'` 就交給新的 `interpretGateMessage()` 處理，只有 `gateStage === 'active'` 才呼叫既有的 `interpretStudioMessage`。

## 3. 關卡呈現方式：沿用既有的 quick-reply chip 機制

`interpretStudioMessage` 已經有 `StudioAction { id: string; label: string }`、`StudioReply.actions`，畫面上（`SkillStudioChat.vue`）渲染成可點的 chip，使用者點了 chip 就等於打了 `action.label` 這句話（比對 `t === ACTION_CONFIRM.label` 那段既有邏輯）。這次所有關卡的選項都照這個機制做，**選項文字就是使用者原始描述裡給的文字，一個字不改**：

| 關卡 | Chip 標籤（逐字） |
|---|---|
| 關卡 0 | 「記技能」／「單純問事情」（原文「你是要記成 skill，還是單純問事情？」是問句本身，不是選項；選項用這兩個簡短版本） |
| 關卡 1 | 「記一份新的」／「改現有規定（走客製路線）」／「照現有規定」 |
| 關卡 2 | 「照現有規定做」／「改他」／「另外新增一份」／「我要講別的」 |
| 關卡 3 | 「這樣可以，存到個人技能」／「不對，我要改」 |

（點 chip 或直接打一模一樣的字都算數，跟 `ACTION_CONFIRM` 現有行為一致。）

## 4. 意圖判斷（`gateStage === 'intent'` 時的路由）

規則式關鍵字比對，**不是真語意理解**，跟 `interpretStudioMessage` 現有的正規表示式風格一致：

```ts
const BUILD_INTENT_VERBS = /教|建立|新增|修改|更新|記錄|記一個|記成|固定|流程|SOP/
const BUILD_INTENT_NOUNS = /技能|skill|規定|做法/i

function classifyIntent(text: string): 'build' | 'general' | 'ambiguous' {
  const hasVerb = BUILD_INTENT_VERBS.test(text)
  const hasNoun = BUILD_INTENT_NOUNS.test(text)
  if (hasVerb && hasNoun) return 'build'
  if (text.trim().length <= 20 && (hasNoun || /[？?]/.test(text))) return 'general'
  return 'ambiguous'
}
```

路由（`classifyIntent` 的結果只在 `gateStage === 'intent'` 這一步用，之後就不再呼叫）：

- `'build'` 且 `store.myPersonalSkills.length === 0` → `gateStage = 'active'`，比照現有 `startCreate()` 對「有 prefill」情境的開場方式，直接開始問（重用 `interpretStudioMessage` 裡 `mode === 'create' && !draft.name` 那段既有的第一句話抽取邏輯，不用另外寫）。
- `'build'` 且非空 → `gateStage = 'gate1'`
- `'general'` → 推一則 TODO 佔位訊息（見 §7），`gateStage` 維持 `'intent'`（每則訊息都重新判斷，因為這條路徑還沒真正接東西，没有「已進入某個功能」這件事）
- `'ambiguous'` → `gateStage = 'gate0'`

## 5. 關卡 0

```
你是要記成 skill，還是單純問事情？
[記技能] [單純問事情]
```

- 「記技能」→ 等同 `classifyIntent` 判到 `'build'`，接 §4 的「建立/修改」路由（含清單是否為空的分岔）
- 「單純問事情」→ 等同判到 `'general'`，接 §4 的一般問答處理（TODO 佔位）

## 6. 關卡一

```
你現在要照公司的規定處理眼前這件事，還是要改規定、或是記一份新的?
[記一份新的] [改現有規定（走客製路線）] [照現有規定]
```

- 「記一份新的」「改現有規定（走客製路線）」→ `gateStage = 'checkingRules'`（見 §7，內部過渡態，同一次處理立刻往下轉，不會真的停在這一格等輸入）
- 「照現有規定」→ 推 TODO 佔位訊息（見 §9），`gateStage = 'active'`（這條路徑視為「已完成分流」，不會再進意圖判斷；但因為沒有真正的執行邏輯，`active` 狀態下打字會落進既有 `interpretStudioMessage`，這是可接受的邊界情況，不特別處理）

## 7. 記規定階段（`checkingRules`，內部過渡態）

規則式比對使用者在關卡一之前那句話（或關卡一選擇當下最近一則使用者訊息）跟 `store.myPersonalSkills` 每一筆的 `name`／`triggerHint`／`instructions` 有沒有重疊。用「二字滑動窗」（character bigram）算重疊比例，而不是先切出「詞」再比對整詞相不相等——使用者一句話通常是一整串連續中文、中間沒有空格或標點斷開，先切詞的規則式寫法（例如貪婪比對連續中文字元）在這種輸入下會把整句話當成單一一個詞，永遠不會完整出現在技能名稱這種短很多的字串裡：

```ts
function findSimilarSkill(text: string, skills: Skill[]): Skill | null {
  const t = text.trim()
  if (t.length < 2) return null
  const textGrams = new Set<string>()
  for (let i = 0; i < t.length - 1; i++) textGrams.add(t.slice(i, i + 2))
  let best: { skill: Skill; score: number } | null = null
  for (const skill of skills) {
    const haystack = `${skill.name}${skill.triggerHint ?? ''}${skill.instructions ?? ''}`
    let score = 0
    for (let i = 0; i < haystack.length - 1; i++) {
      if (textGrams.has(haystack.slice(i, i + 2))) score++
    }
    if (score > 0 && (!best || score > best.score)) best = { skill, score }
  }
  return best?.skill ?? null
}
```

- 找到（`score > 0` 的最高分那筆）→ 記下 `pendingSimilarSkillId`，`gateStage = 'gate2'`
- 沒找到 → `gateStage = 'clarify'`

這一步不會真的推一則「正在查詢…」訊息給使用者看，直接算完轉下一關（跟關卡一選完的同一輪回覆一起處理）。

## 8. 關卡二

```
您已經有一份「{相近技能名稱}」，這次要沿用他、改他還是記一份新的？
[照現有規定做] [改他] [另外新增一份] [我要講別的]
```

- 「照現有規定做」→ 推 TODO 佔位訊息（同 §9），`gateStage = 'active'`
- 「改他」→ 呼叫既有 `conv.loadSkill(pendingSimilarSkillId)`（`useSkillStudioConversation.ts:252-262`，本來就會設定 `mode='edit'`、`savedSkillId`、`draft`、推一句「我們來調整「{name}」…」的開場），`gateStage = 'active'`，清掉 `pendingSimilarSkillId`
- 「另外新增一份」→ **不**帶入相近技能的內容（確認過：從空白開始，不預填），`gateStage = 'clarify'`，清掉 `pendingSimilarSkillId`
- 「我要講別的」→ 見 §10（暫存＋回到意圖判斷處理新話題）

## 9. TODO 佔位訊息（一般問答／套用既有技能／照現有規定執行）

這三個分支目前都還沒有真正的執行或對話測試銜接，這次範圍明確排除。共用一句佔位回覆（單一函式 `pushNotImplementedReply()`），文案：

```
這部分我還在學怎麼幫你直接處理，目前只能先帶你到技能建立/修改的流程。之後會補上「直接套用技能」的功能。
```

`gateStage` 依 §4／§6／§8 各自的規則設定（多數情況會落回 `'intent'` 或 `'active'`，各段已寫明）。

## 10. 暫存草稿（「我要講別的」）

**不是**技能管理現有的送審草稿機制（`myDrafts`/`DraftSkill`，那是給 Library／企業技能送審用的，跟這裡無關，完全不共用）。這裡的「暫存」純粹是**同一次連線、記憶體內**的狀態，離開頁面或重新整理就消失，不寫進任何 store：

```ts
export interface PausedDraft {
  gateStage: GateStage           // 暫停當下所在的關卡，恢復時要回到這一格
  messages: StudioMessage[]      // 暫停當下的完整對話紀錄
  draft: SkillDraft              // 暫停當下的草稿內容
  pendingSimilarSkillId: string | null
}
```

選「我要講別的」時：把當下的 `gateStage`／`messages`／`draft`／`pendingSimilarSkillId` 存進 `pausedDraft`（`ref<PausedDraft | null>`），然後**重置**目前的對話狀態回到全新一輪：`gateStage = 'intent'`，`messages`／`draft` 清空重來，讓使用者的新話題正常走一次 §4 的意圖判斷。`pausedDraft` 本身不影響這一輪的走向。

## 11. 接續判斷

只要 `pausedDraft.value !== null`，在**每一則**新訊息進 `interpretGateMessage()`（不管目前 `gateStage` 是什麼）之前，先做一次輕量判斷：

```ts
const RESUME_HINTS = /繼續|剛才|接著|接續|回到|上次那個/

function wantsToResume(text: string, paused: PausedDraft): boolean {
  return RESUME_HINTS.test(text) || (!!paused.draft.name && text.includes(paused.draft.name))
}
```

- 比對到 → 把 `pausedDraft` 的四個欄位還原回目前對話狀態（`gateStage`／`messages`／`draft`／`pendingSimilarSkillId`），`pausedDraft = null`，**這則訊息本身不再往下處理**（純粹當成「回來了」的觸發，比照關卡切換時的做法，推一句「好，回到剛才「{draft.name}」繼續」銜接語，不會把這句「繼續」誤當成填內容的答案）
- 沒比對到 → 什麼都不做，正常繼續走目前 `gateStage` 該走的路由，`pausedDraft` 原封不動留著

## 12. step: CLARIFY

`gateStage === 'clarify'` 時，**沿用現有 `interpretStudioMessage` 的多輪問答抽取規則**（名稱／觸發條件／步驟／能力那幾段既有的 regex，`useSkillStudioConversation.ts:118-182`），不重寫解析邏輯——差別只在於：這裡額外多認一句收尾語，判斷到就轉 `gate3`，其餘每一句都照樣呼叫既有解析、更新 `draft`、正常回覆：

```ts
const CLARIFY_DONE_HINT = /沒有漏了|寫成做法|可以寫了|這樣就好/
```

- 每則使用者訊息：先檢查是不是收尾語 → 是的話直接跳 §13（關卡三），**這則訊息不再送進既有解析**；不是的話正常呼叫 `interpretStudioMessage(text, draft, mode)` 更新草稿並回覆

## 13. 關卡三

```
我準備幫您記成這份做法，內容如下：
{草稿目前的 name／triggerHint／instructions／capabilities 整理成的文字摘要}
這樣可以嗎？
[這樣可以，存到個人技能] [不對，我要改]
```

- 「這樣可以，存到個人技能」→ 呼叫既有的儲存路徑：`mode === 'create'` 就是 `store.createPersonalSkill(...)`（比照 `save()` 現有邏輯，`useSkillStudioConversation.ts:276-307`），`mode === 'edit'` 就是 `store.applyStudioPatch(...)` ＋ `store.updateSkillFiles(...)`；存完 `gateStage = 'active'`（後續調整就是正常的技能編輯對話，走既有 `interpretStudioMessage`）
- 「不對，我要改」→ `gateStage = 'clarify'`，回到多輪問答繼續補充（草稿內容不清空，接著改）

## 14. 型別與既有介面異動

`useSkillStudioConversation.ts` 新增匯出：

```ts
export type GateStage = /* 見 §2 */
export interface PausedDraft { /* 見 §10 */ }
```

`useSkillStudioConversation()` 回傳值新增：`gateStage: Ref<GateStage>`（給 `SkillStudioChat.vue` 需要時讀取狀態用，例如之後想在 UI 上顯示「正在確認做法內容」之類的提示，這次不強制要求 UI 要顯示這個狀態，純粹型別上先露出）。

`SkillDraft`／`StudioMessage`／既有的 `interpretStudioMessage` 簽名都不變。

## 15. 非目標（Non-goals）

- 「一般問答」「套用既有技能去做」「照現有規定做」這三個分支的實際執行行為——這次只做到分類正確＋TODO 佔位訊息。
- 「積木組裝」路徑的任何改動。
- 暫存草稿的跨 session／跨頁面持久化——確認過是刻意只留在單次連線記憶體內。
- 意圖判斷／相似度比對／接續判斷三處的規則式關鍵字清單，日後可能需要依實際使用情況調整字詞，這次先用文件裡列出的這組，不做成可設定的清單管理介面。

## 16. 附註：本文件與程式現況的對應

- `useSkillStudioConversation.ts:215-231`（`startCreate`）、`:252-262`（`loadSkill`）、`:264-274`（`send`）、`:276-307`（`save`）、`:118-182`（`interpretStudioMessage`）是這次要接上新邏輯、但**內容不改**的既有函式。
- `StudioAction`／`ACTION_CONFIRM` 等既有 chip 機制（`useSkillStudioConversation.ts:23-24, 70-72`）是這次所有關卡選項沿用的既有機制。
- `store.myPersonalSkills`／`store.createPersonalSkill`／`store.applyStudioPatch`／`store.updateSkillFiles` 是這次會呼叫到的既有 `skillStore.ts` 介面，不需要新增或修改。
