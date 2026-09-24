# AI 賦能對話：從零建立技能的多輪資訊蒐集流程 — 設計文件

**狀態**：待核准
**日期**：2026-09-24
**前置**：
- `docs/superpowers/specs/2026-09-22-ai-empower-intent-gate-design.md`（已實作、已合併）
- `docs/superpowers/specs/2026-09-23-ai-empower-gate-freetext-design.md`（已實作、已合併）
- `docs/superpowers/specs/2026-09-23-ai-empower-build-modify-split-design.md`（已實作、已合併）

本文件是前三份設計的後續調整，聚焦在「從零開始描述一份全新做法」這條路徑本身要怎麼問清楚，不動關卡二／關卡三／`clarify`（既有增量修改用途）／`findModifyTarget` 這幾個已經核准並實作的機制的內部邏輯。

---

## 1. 背景與目標

目前「從零開始建立」這條路徑（不論是清單為空的建立意圖、清單非空但找不到相近做法、或關卡二選「另外新增一份」）都是：使用者打第一句話，`interpretStudioMessage` 立刻就把那一句話當成全部內容，一次生成名稱／觸發條件／指令／能力四個欄位的草稿，之後每句話再個別修改單一欄位，直到使用者說出收尾語才進入最終確認。

這次要調整成更完整的資訊蒐集流程：使用者先講一段流程文字，agent 追問幾輪補充資訊，彙整成一份白話文摘要跟使用者確認理解正確，確認後才真正產出結構化的技能草稿，直接進入既有的關卡三做最終確認。

## 2. 整體流程

```
使用者描述一段流程
        ↓
   gathering（追問補充資訊，固定 2 輪）
        ↓
   confirmKnownInfo（白話摘要確認）
        ↓（確認）              ↓（不對，還要補充）
   產出結構化技能草稿      回到 gathering 追問或直接在 confirmKnownInfo 內收集補充內容
        ↓
   關卡三（既有，不動）："這樣可以嗎？"
        ↓（不對，我要改）
   clarify（既有，不動）：增量修改單一欄位，收尾語再回關卡三
```

## 3. `GateStage` 新增兩個值

```ts
export type GateStage =
  | 'intent'
  | 'findModifyTarget'
  | 'gathering'         // 新增：從零開始，固定追問幾輪補充資訊
  | 'confirmKnownInfo'  // 新增：白話摘要確認
  | 'gate2'
  | 'clarify'           // 既有，用途不變：草稿已存在時的增量修改
  | 'gate3'
  | 'active'
```

## 4. 三個「從零開始建立」的既有入口，改導向 `gathering`（不再直接進 `active` 或 `clarify`）

**`routeBuildIntent`**（`useSkillStudioConversation.ts`）目前：

```ts
function routeBuildIntent(text: string): void {
  if (store.myPersonalSkills.length === 0) {
    gateStage.value = 'active'
    const reply = interpretStudioMessage(text, draft.value, mode.value)
    if (reply.patch) draft.value = { ...draft.value, ...reply.patch }
    push({ role: 'agent', content: reply.content, actions: reply.actions })
    return
  }
  const similar = findSimilarSkill(text, store.myPersonalSkills)
  if (similar) {
    pendingSimilarSkillId.value = similar.id
    gateStage.value = 'gate2'
    push({ role: 'agent', content: `您已經有一份「${similar.name}」，這次要沿用他、改他還是記一份新的？` })
  } else {
    gateStage.value = 'clarify'
    push({ role: 'agent', content: '好，那請直接描述這份做法的內容，我會幫你整理。' })
  }
}
```

兩個「開始蒐集」的分支（清單為空、清單非空但找不到相近做法，**不管清單空不空都統一走新流程**，確認過不保留舊的空清單快速路徑）都改成進 `gathering`。`gate2` 那支（找到相近做法，問沿用/改他/另開一份/講別的）完全不動。

**關卡二「另外新增一份」分支**（`handleGateMessage` 的 `'gate2'` 區塊，`g2 === 'new'` 那一段）目前把 `gateStage` 設成 `'clarify'`，改成 `'gathering'`。

由於「進入 `gathering`」這件事有三個呼叫點（`routeBuildIntent` 的兩支、關卡二「另外新增一份」），共用邏輯抽成一個內部函式，避免三處重複：

```ts
// 開始一輪全新的資訊蒐集：重置累積文字與追問輪數，把這句話存進去，推第一個追問問句
function startGathering(text: string): void {
  gatheringRawText.value = text
  gatheringRound.value = 1
  gateStage.value = 'gathering'
  push({ role: 'agent', content: GATHERING_QUESTIONS[0] })
}
```

`routeBuildIntent` 改成：

```ts
function routeBuildIntent(text: string): void {
  const similar = findSimilarSkill(text, store.myPersonalSkills)
  if (similar) {
    pendingSimilarSkillId.value = similar.id
    gateStage.value = 'gate2'
    push({ role: 'agent', content: `您已經有一份「${similar.name}」，這次要沿用他、改他還是記一份新的？` })
    return
  }
  startGathering(text)
}
```

（原本的「清單為空」分支整個拿掉，`findSimilarSkill` 對空清單自然回傳 `null`，直接落到 `startGathering(text)`，行為等同「清單非空但找不到相近做法」那支，不用再寫兩次。）

關卡二「另外新增一份」分支（`g2 === 'new'`）原本是：

```ts
if (g2 === 'new') {
  pendingSimilarSkillId.value = null
  draft.value = { ...emptyDraft(), method: draft.value.method }
  gateStage.value = 'clarify'
  push({ role: 'agent', content: '好，那我們重新開一份。請描述這份做法的內容。' })
  return
}
```

只改最後兩行，把「清空草稿後直接问清楚內容」的單句提示換成呼叫 `startGathering`（`startGathering` 自己會推 `GATHERING_QUESTIONS[0]`，不需要另外再推一句「請描述這份做法的內容」）：

```ts
if (g2 === 'new') {
  pendingSimilarSkillId.value = null
  draft.value = { ...emptyDraft(), method: draft.value.method }
  startGathering('')
  return
}
```

（這裡傳空字串給 `startGathering`，因為使用者還沒描述新內容——`gatheringRawText` 一開始是空的，等第一個追問問句的回答進來才真正開始累積文字。`gathering` 分支本身的累加邏輯〔見下〕對空字串開頭沒有特殊處理，累加起來的文字開頭會多一個換行，不影響後續 `interpretStudioMessage` 的抽取邏輯。）

## 5. `gathering`：固定追問 2 輪

新增內部狀態：

```ts
const gatheringRawText = ref('')       // 累積的原始文字（使用者第一句描述＋後續追問答案）
const gatheringRound = ref(0)          // 已經問過幾輪追問（0～2）
```

固定的兩個追問問句：

```ts
const GATHERING_QUESTIONS = [
  '還有沒有需要特別注意的情況或例外？',
  '大概的執行步驟是什麼？麻煩條列一下。',
]
```

`handleGateMessage` 新增分支：

```ts
if (stage === 'gathering') {
  gatheringRawText.value += `\n${t}`
  if (gatheringRound.value < GATHERING_QUESTIONS.length) {
    push({ role: 'agent', content: GATHERING_QUESTIONS[gatheringRound.value] })
    gatheringRound.value += 1
    return
  }
  gateStage.value = 'confirmKnownInfo'
  push({ role: 'agent', content: buildKnownInfoSummary(gatheringRawText.value) })
  return
}
```

三個入口都改呼叫 §4 的 `startGathering`（不再各自重複設定 `gatheringRawText`／`gatheringRound`／`gateStage`／推問句這四件事）。`GATHERING_QUESTIONS.length` 是 2，所以總共會問 2 個追問問句，使用者總共會打 3 句話（第一句流程描述＋兩句追問答案）才會進到 `confirmKnownInfo`——`startGathering` 存第一句、推第一個問句，`gathering` 分支再處理接下來兩句追問答案。

## 6. `buildKnownInfoSummary`：白話摘要文字

```ts
function buildKnownInfoSummary(rawText: string): string {
  return `我理解你想做的是：${rawText.trim()}\n\n這樣的理解對嗎？`
}
```

（`rawText` 本身已經是「第一句描述＋兩句追問答案」用換行接起來的完整文字，不需要再分開列點——這是規則式 mock 摘要，不是真的語意濃縮，跟這個檔案既有的其他函式風格一致。）

## 7. `confirmKnownInfo`：確認／還要補充

分類器，跟既有 `classifyGate3` 同樣的「retry 要排在 confirm 前面檢查」原則（避免「不對」裡的「對」字被 confirm 規則誤判）：

```ts
function classifyKnownInfoConfirm(text: string): 'confirm' | 'retry' | null {
  if (/不對|不是|還要補充|還有|再說|不完整|漏了/.test(text)) return 'retry'
  if (/對|沒錯|正確|可以|沒問題|就這樣/.test(text)) return 'confirm'
  return null
}
```

`handleGateMessage` 新增分支：

```ts
if (stage === 'confirmKnownInfo') {
  const k = classifyKnownInfoConfirm(t)
  if (k === 'confirm') {
    const reply = interpretStudioMessage(gatheringRawText.value, draft.value, mode.value)
    if (reply.patch) draft.value = { ...draft.value, ...reply.patch }
    gateStage.value = 'gate3'
    push({
      role: 'agent',
      content: `我準備幫您記成這份做法，內容如下：\n${formatDraftSummary(draft.value)}\n這樣可以嗎？`,
    })
    return
  }
  if (k === 'retry') {
    push({ role: 'agent', content: '好，那請告訴我還要補充什麼。' })
    return
  }
  push({ role: 'agent', content: buildKnownInfoSummary(gatheringRawText.value) })
  return
}
```

- **確認**：呼叫既有的 `interpretStudioMessage(gatheringRawText.value, draft.value, mode.value)`——因為這時候 `draft.value.name` 還是空的，會命中它既有的 `mode === 'create' && !draft.name` 那個分支，用整段累積文字（而不是原本只用第一句話）產出名稱／說明／觸發條件／指令／能力，重用既有邏輯、不重寫抽取規則。接著直接轉 `gate3`，用既有的 `formatDraftSummary` 呈現摘要——`interpretStudioMessage` 自己回傳的 `content`／`actions`（「我先幫你擬了一版設定…」＋三個 `ACTION_*` chip）**不使用**，因為關卡三本來就會呈現一次完整摘要，兩次重複沒有必要。
- **還要補充**：不會重新觸發 `gathering` 的兩輪固定追問（那是進場時才有的機制），而是留在 `confirmKnownInfo`，開放式地把下一句話直接附加進 `gatheringRawText`——但要先確保下一句使用者輸入被正確附加。見 §8 補充這個小細節的處理方式。
- **看不懂**：換句話重述摘要，不是逐字重複（`buildKnownInfoSummary` 本身内容一樣沒關係，因為呼叫時機不同、不是同一輪的重複訊息）。

## 8. 「還要補充」之後，下一句話怎麼處理？

`confirmKnownInfo` 階段收到 `retry` 之後，`gateStage` 維持在 `confirmKnownInfo`（不切換），下一句使用者輸入會再次進到 `confirmKnownInfo` 分支，這時候 `classifyKnownInfoConfirm` 對這句「補充內容」本身多半判不出 confirm/retry（回傳 `null`），會被導去「看不懂，重述摘要」——這不是我們要的行為。

修正：`confirmKnownInfo` 分支最前面，先檢查上一輪是不是剛回過 `retry`（用一個內部旗標 `awaitingSupplement`），如果是，就把這句話當成補充內容附加進 `gatheringRawText`、清掉旗標、重新呼叫 `buildKnownInfoSummary` 產生新的摘要再問一次；不是的話才照 §7 的邏輯跑分類。

這是 §7 那個分支加上旗標檢查後的完整版本（取代 §7 的版本，§7 只是先不含旗標邏輯、方便循序說明）：

```ts
const awaitingSupplement = ref(false)

if (stage === 'confirmKnownInfo') {
  if (awaitingSupplement.value) {
    gatheringRawText.value += `\n${t}`
    awaitingSupplement.value = false
    push({ role: 'agent', content: buildKnownInfoSummary(gatheringRawText.value) })
    return
  }
  const k = classifyKnownInfoConfirm(t)
  if (k === 'confirm') {
    const reply = interpretStudioMessage(gatheringRawText.value, draft.value, mode.value)
    if (reply.patch) draft.value = { ...draft.value, ...reply.patch }
    gateStage.value = 'gate3'
    push({
      role: 'agent',
      content: `我準備幫您記成這份做法，內容如下：\n${formatDraftSummary(draft.value)}\n這樣可以嗎？`,
    })
    return
  }
  if (k === 'retry') {
    awaitingSupplement.value = true
    push({ role: 'agent', content: '好，那請告訴我還要補充什麼。' })
    return
  }
  push({ role: 'agent', content: buildKnownInfoSummary(gatheringRawText.value) })
  return
}
```

## 9. 右側預覽面板

不需要改動。目前 `SkillStudioPreview.vue` 已經是完全即時綁定 `conv.draft.value`，每個欄位各自依「有沒有內容」決定顯示文字或空白提示，沒有任何額外的「已確認」旗標。`gathering`／`confirmKnownInfo` 這兩個新關卡全程 `draft.value` 都還是空的（因為草稿要到 §7 的「確認」分支才第一次被寫入），所以右側自然維持空白狀態，直到那個時間點才第一次出現內容——這剛好就是想要的效果，不用新增任何遮蔽邏輯。

## 10. 狀態重置

以下函式在重置對話狀態時，要一併重置這次新增的四個內部 ref（`gatheringRawText`、`gatheringRound`、`awaitingSupplement`——`confirmKnownInfo` 本身是 `gateStage` 的值不需要另外重置）：

- `startCreate()`
- `loadSkill()`
- 關卡二「我要講別的」分支（暫存草稿時，這幾個 ref 不需要存進 `PausedDraft`——暫停當下不可能正處於 `gathering`／`confirmKnownInfo`，因為「我要講別的」只從 `gate2` 觸發，不影響這幾個新狀態）

## 11. 型別與既有介面異動

新增內部（非匯出）狀態：`gatheringRawText`、`gatheringRound`、`awaitingSupplement`（三個都是 `ref`，不加進 `useSkillStudioConversation()` 的回傳值，跟既有的 `pendingSimilarSkillId` 等內部狀態同樣處理）。

新增內部（非匯出）函式：`buildKnownInfoSummary(rawText: string): string`、`classifyKnownInfoConfirm(text: string): 'confirm' | 'retry' | null`。

新增常數：`GATHERING_QUESTIONS: string[]`（長度 2）。

`GateStage` 新增 `'gathering'`、`'confirmKnownInfo'` 兩個值。

`interpretStudioMessage`、`formatDraftSummary`、`extractSkillName`、`classifyGate2`、`classifyGate3`、`findSimilarSkill`、既有的 `'gate2'`／`'clarify'`／`'gate3'` 分支內部邏輯**全部不變**，只是多了新的呼叫入口／重定向目標。

## 12. 非目標（Non-goals）

- `GATHERING_QUESTIONS` 的固定問句內容日後可能需要依實際使用情況調整，這次先用文件裡列出的這兩句，不做成可設定清單。
- 不處理「使用者在 `gathering` 階段想換話題」的情境——固定 2 輪追問期間，使用者打什麼都會被當成補充內容累積，不做語意判斷是否要中途放棄；跟 `findModifyTarget` 的既有非目標一致（那邊也沒有中途逃脫機制）。
- `confirmKnownInfo` 的「還要補充」迴圈沒有上限次數——理論上可以一直說「不對」無限循環下去，這次不處理防呆或次數上限。
- 不改變 `clarify`（既有、草稿已存在時的增量修改）與關卡三的任何行為，這兩個機制的「這是使用者確認可補充內容」的既有語意完全沿用，不重複設計。
