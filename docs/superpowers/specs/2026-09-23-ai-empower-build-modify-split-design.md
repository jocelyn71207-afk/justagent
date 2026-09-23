# AI 賦能對話：拆分建立／修改意圖、取消關卡0與關卡一 — 設計文件

**狀態**：待核准
**日期**：2026-09-23
**前置**：
- `docs/superpowers/specs/2026-09-22-ai-empower-intent-gate-design.md`（已實作、已合併）
- `docs/superpowers/specs/2026-09-23-ai-empower-gate-freetext-design.md`（已實作、已合併——取消 chip，改語意判斷）

本文件是前兩份設計的後續調整。

---

## 1. 背景與目標

上一輪調整把關卡 0～3 的按鈕都改成純文字語意判斷，但保留了整個關卡結構：意圖判斷（建立/一般問答/太模糊）→ 太模糊先問關卡0 →（建立意圖）關卡一再問一次「照規定/改規定/記新的」→ 找相近做法 → 關卡二 → clarify → 關卡三。

實際上線測試後的回饋：

1. 這個功能現在**只做技能的建立與修改**，「一般問答」這條分支從頭到尾都只是回一句 TODO 佔位訊息，從沒真的接東西——這條分支跟關卡0（用來判斷「要記技能還是單純問事情」）應該整個拿掉，不要再判斷、也不要在任何回覆文字裡提到「其他問題」。
2. 當使用者一開口語意就很明確（例如「幫我建立一個能查 ERP 庫存的技能」一看就是要**建立**；句子裡有「修改」兩個字就是要**修改**）時，不應該再追加一句關卡一的「你現在要照公司的規定處理…還是記一份新的?」——這個問題在意圖已經明確的情況下是多餘的，應該直接跳過，進到下一步。
3. 既有的「快速建議文字」（`suggestionChips`：建立模式顯示 `CREATE_SUGGESTIONS`、編輯模式顯示 `editSuggestions()`）本來就會依 create/edit 模式顯示不同內容——這次要確保重新設計後的流程仍然正確餵到這個既有機制，不需要另外新增東西。

## 2. 整體狀態機異動

`GateStage` 拿掉 `'gate0'`、`'gate1'`：

```ts
export type GateStage =
  | 'intent'           // 每則新訊息的起點：判斷「建立」／「修改」／太模糊
  | 'findModifyTarget'  // 已知是修改意圖，但找不到相近技能，等使用者說出要改哪一項
  | 'gate2'             // 建立意圖找到相近做法，問沿用/改他/另開一份/講別的
  | 'clarify'           // 多輪問答補齊草稿內容
  | 'gate3'             // 最終確認
  | 'active'            // 分流完畢
```

`checkingRules`（原本就是文件性質、程式從未真的賦值的內部過渡態說明）一併拿掉，因為它描述的正是被取消的關卡一→查相近做法那段過渡邏輯，現在直接內嵌在 `routeBuildIntent` 裡，不需要獨立說明。

## 3. 新的頂層意圖分類：`classifyBuildOrModify`

取代既有的 `classifyIntent`（`build`／`general`／`ambiguous` 三分類）。`classifyIntent` 這個匯出函式**整個刪除**——它只被 `routeAsNewIntent`（本次也一併刪除）呼叫，測試檔裡它自己的 `describe('classifyIntent', ...)` 區塊也要跟著刪除。

```ts
const MODIFY_SIGNAL = /修改|調整|更新/
const BUILD_VERBS = /教|建立|新增|記一個|記成|記錄|固定|流程|SOP/
const BUILD_NOUNS = /技能|skill|規定|做法/i

// 規則式關鍵字比對，不是真語意理解，跟既有風格一致。
// 「建立」是預設值：任何不是明確「修改」訊號、且不是短到看不出內容的輸入都當作建立意圖。
// 「太模糊」只保留給真的看不出任何內容的極短回覆（例如「嗯」）。
export function classifyBuildOrModify(text: string): 'build' | 'modify' | 'ambiguous' {
  const t = text.trim()
  if (MODIFY_SIGNAL.test(t)) return 'modify'
  const hasBuildSignal = BUILD_VERBS.test(t) || BUILD_NOUNS.test(t)
  if (t.length > 4 || hasBuildSignal) return 'build'
  return 'ambiguous'
}
```

（`MODIFY_SIGNAL` 檢查放在最前面：確保句子裡只要出現「修改」，不管長短都優先判成 `modify`，不會被長度規則搶先判成 `build`。）

## 4. `'intent'` 分支重寫

現有的 `routeAsNewIntent`（原本統一處理 `gateStage === 'intent'` 以及其他關卡「本關比對不到」時的新話題重定向）整個改寫，改名為 `routeIntent`（語意更貼近現在的職責：不只是「當成新話題」，是唯一的頂層路由入口）：

```ts
// 唯一的頂層意圖路由：gateStage === 'intent' 時呼叫，
// 也是關卡二「本關比對不到」時的新話題重定向共用邏輯（見 §6）
function routeIntent(text: string): void {
  const kind = classifyBuildOrModify(text)

  if (kind === 'modify') {
    const similar = findSimilarSkill(text, store.myPersonalSkills)
    if (similar) {
      loadSkill(similar.id)  // 已經會設定 mode='edit'、savedSkillId、draft、gateStage='active'，並推一句開場白
      return
    }
    gateStage.value = 'findModifyTarget'
    push({ role: 'agent', content: '要修改哪一項技能？請直接說出技能名稱，或描述一下內容，我幫你找。' })
    return
  }

  if (kind === 'build') {
    routeBuildIntent(text)
    return
  }

  // kind === 'ambiguous'：gateStage 保持 'intent' 不變，下一句話會重新整個判斷一次
  push({ role: 'agent', content: '你想要記一個新做法，還是要修改現有的？直接跟我說就可以。' })
}
```

## 5. `routeBuildIntent` 重寫：拿掉關卡一的問句，直接查相近做法

現有版本會在清單非空時轉 `gateStage = 'gate1'`、問「照規定/改規定/記新的」，等使用者回答了才查 `findSimilarSkill`。這次拿掉這一步，**清單非空就直接查**：

```ts
// 建立意圖確立後的路由：清單為空就直接進既有建立邏輯（用這句話當第一句描述）；
// 清單非空就直接查有沒有相近做法（不再先問「照規定/改規定/記新的」）——
// 避免建立重複的技能，但不追加一個意圖已經明確時顯得多餘的問句
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

**`lastBuildText` 整個刪除**（狀態 ref、`startCreate()`／`loadSkill()` 裡的重置行都一併刪除）：舊設計靠它記住「使用者原本那句話」等到關卡一回答完才用；現在 `routeBuildIntent` 直接用當下傳入的 `text`，不需要延後查詢，這個狀態失去存在理由。

## 6. `'findModifyTarget'` 分支（新增）

```ts
if (stage === 'findModifyTarget') {
  const similar = findSimilarSkill(t, store.myPersonalSkills)
  if (similar) {
    loadSkill(similar.id)
    return
  }
  push({ role: 'agent', content: `還是沒找到符合「${t}」的技能，可以換個說法，或直接說出正確的技能名稱嗎？` })
  return
}
```

（沒找到時換句話重問，不是逐字重複入口訊息，跟關卡三既有的「真的看不懂就換句話問」風格一致。這裡不做「新話題重定向」——使用者已經明確表達要修改，在還沒找到目標之前，把任何回覆都當成是在描述目標技能是合理假設；如果之後測試發現使用者常常在這裡想换新話題，屬於後續再調整的範圍，這次不處理。）

## 7. `'gate2'` 分支：只改「本關比對不到」的重定向目標

現有 `gate2` 分支的四個分類（`follow`／`edit`／`new`／`else`）結構完全不變，只有本關比對不到時呼叫的函式名稱從 `routeAsNewIntent` 改成 `routeIntent`（同一個位置，純粹改名跟隨 §4）：

```ts
  pendingSimilarSkillId.value = null
  routeIntent(t)   // 原本是 routeAsNewIntent(t)
  return
```

`gate2` 的四個分支本身（含 `GATE2_FOLLOW`/`'follow'` 用 `NOT_IMPLEMENTED_REPLY`、`'edit'` 呼叫 `loadSkill`、`'new'` 保留 `method` 清空草稿、`'else'` 暫存草稿的完整邏輯與既有註解）**完全不動**。

## 8. 開場白文字調整

```ts
const GATE_OPENING_MESSAGE = '你好，我是這裡的助理。想記一個新做法，或是要調整既有的，都可以直接跟我說。'
```

拿掉「還是有其他問題」。`DEFAULT_OPENING_MESSAGE`（有 prefill 時才會用到的既有開場白）不受影響，維持原樣。

## 9. `suggestionChips` 不需要改動

`suggestionChips` 現有邏輯（`mode.value === 'create' ? CREATE_SUGGESTIONS : editSuggestions(draft.value)`）已經正確依 `mode` 顯示對應內容。本次設計裡：

- `'build'` 意圖 → 若清單為空直接留在 `mode='create'`（原本就是）；若找到相近做法走 `gate2`／`clarify`，`mode` 全程維持 `'create'`，直到使用者選「改他」才透過 `loadSkill` 切到 `'edit'`。
- `'modify'` 意圖 → 找到相近技能就直接 `loadSkill`，`mode` 立刻變成 `'edit'`；沒找到就停在 `findModifyTarget`，此時 `mode` 還是 `'create'`（尚未鎖定要改哪一項，這是合理的中繼狀態，`suggestionChips` 在 `findModifyTarget` 階段顯示 create 版建議文字也無妨，不影響對話）。

不需要新增任何欄位或條件，純粹確認既有機制在新流程下依然正確運作，測試裡會補一個案例驗證。

## 10. 型別與既有介面異動

匯出異動：
- 刪除 `export function classifyIntent(...)`
- 新增 `export function classifyBuildOrModify(text: string): 'build' | 'modify' | 'ambiguous'`
- `GateStage` 拿掉 `'gate0'`、`'gate1'`、`'checkingRules'`，新增 `'findModifyTarget'`

內部（非匯出）異動：
- 刪除 `classifyGate0`、`classifyGate1`（連同它們專屬的 `GATE0_*`／`GATE1_*` 常數，這兩組常數在上一輪重構後已經是未使用的死碼，這次直接一起清掉，不用等下一輪）
- 刪除 `lastBuildText` 這個 `ref`
- `routeAsNewIntent` 改名為 `routeIntent`，內部邏輯依 §4 重寫
- `routeBuildIntent` 依 §5 重寫
- 新增 `'findModifyTarget'` 分支於 `handleGateMessage`

`classifyGate2`／`classifyGate3`／`GATE2_*`／`GATE3_*`／`gate2`／`gate3`／`clarify` 分支、`CLARIFY_DONE_HINT`、`formatDraftSummary`、`findSimilarSkill`、`wantsToResume`、`PausedDraft`、`pausedDraft` 暫存機制、`interpretStudioMessage` 全部**維持不變**。

## 11. 測試與既有機制的相容性

- 既有 `describe('classifyIntent', ...)` 整個刪除，改寫成對應的 `describe('classifyBuildOrModify', ...)`。
- 既有引用 `classifyGate0`／`classifyGate1`／`'gate0'`／`'gate1'` 的測試（意圖判斷、關卡0、關卡一、gate2 相關會經過 gate1 才到的路徑）需要跟著整段改寫或刪除——這些測試描述的是即將不存在的中繼問句，不是「這次改動意外弄壞」，是設計本身要求的行為變更。
- 新增測試涵蓋：`classifyBuildOrModify` 的建立/修改/模糊三種判斷；`routeIntent` 對三種結果的路由（含 `'modify'` 找到/找不到相近技能兩種分支）；`findModifyTarget` 分支的找到/找不到兩種情況；`routeBuildIntent` 清單非空時直接查找、不再經過中繼問句這件事本身；`suggestionChips` 在 `'modify'` 找到技能後正確顯示 edit 版建議文字。
- `src/components/__tests__/skillBuilderViewBox.test.ts` 目前走 gate1→gate2 的那個迴歸測試（`reachGate2` 輔助函式）需要更新：不再需要先打一句話進關卡一、再打「我想重新弄一份」——清單非空時第一句建立意圖的描述就會直接進 `gate2`（如果匹配到相近技能的話），少一輪對話。

## 12. 非目標（Non-goals）

- 不改變 `findModifyTarget` 的比對演算法（沿用既有 `findSimilarSkill` 的 bigram 重疊比對，不做精確或模糊比對的調整）。
- `findModifyTarget` 階段不做「新話題重定向」（見 §6 說明），也不做逾時或重試次數上限——沒找到就一直換句話問，這次不處理無限循環的邊界情況。
- `classifyBuildOrModify` 的關鍵字清單日後可能需要依實際使用情況調整，這次先用文件裡列出的這組。
- 不改變 `gate2`／`clarify`／`gate3` 內部四個既有分支的行為，只改它們「怎麼被進入」與「本關比對不到時要重定向去哪」。
