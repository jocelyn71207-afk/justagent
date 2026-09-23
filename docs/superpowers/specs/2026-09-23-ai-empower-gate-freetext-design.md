# AI 賦能對話：關卡取消 chip、改用語意判斷 — 設計文件

**狀態**：已核准設計，待寫實作計畫
**日期**：2026-09-23
**前置**：`docs/superpowers/specs/2026-09-22-ai-empower-intent-gate-design.md`（已實作、已合併進 main，本文件是它的後續調整）

---

## 1. 背景與目標

`2026-09-22-ai-empower-intent-gate-design.md` 實作的關卡 0～3，目前每一關都用既有的 quick-reply chip 機制（`StudioAction`/`actions`）呈現選項，畫面上是可點的按鈕，使用者點了 chip 就等於打了 `action.label` 那句話。

實際上線測試（port 8088）後的回饋：不要用按鈕選項，關卡 0～3 的回覆應該改成純文字對話——agent 用語意判斷理解使用者打的自由文字，不強制使用者只能點按鈕。

測試過程中也發現一個關聯的既有問題：目前關卡一（及其他關卡）收到「不是已知選項文字」的輸入時，做法是原封不動重推同一句問句——使用者在關卡一打一句全新的技能描述（不是在回答「照規定/改規定/開新的」），會被直接吞掉、重複顯示同一個問題，使用者感覺像是打了字卻完全沒被理解。這次一併修正。

## 2. 取消 chip：關卡 0～3 的訊息不再帶 `actions`

`interpretGateMessage()`／`handleGateMessage()` 推給關卡 0～3 的每一則訊息，**移除 `actions` 欄位**（或傳空陣列——實作時擇一，效果一致，`SkillStudioChat.vue` 對 `msg.actions` 是 `undefined`/空陣列都不會渲染任何 chip，不需要改這個檔案）。

問句本身的文字**不變**——原本的問句已經用白話文列出選項內容（例如「你現在要照公司的規定處理眼前這件事，還是要改規定、或是記一份新的?」），只是拿掉按鈕，文字不需要重寫。

`ACTION_CONFIRM`／`GATE0_BUILD`／`GATE1_NEW` 等既有的 `StudioAction` 常數**保留**，不刪除——它們的 `.label` 字串仍然是「這句話語意上等於選了這個選項」的正典文字，關卡的語意分類器（§3）拿它們的 `.label` 當作「最明確、一定要辨認出來」的參考詞。只是它們不再被放進 `push(...)` 的 `actions` 陣列裡。

## 3. 每一關的語意分類器

規則式關鍵字比對，跟 `classifyIntent`／`findSimilarSkill` 現有風格一致——**不是真語意理解**。每一關一個分類函式，回傳該關已知選項之一，或 `null`（代表比對不到）：

```ts
function classifyGate0(text: string): 'build' | 'general' | null {
  if (/技能|skill|做法|規定|記(成|一個|下來)|建立|新增/.test(text)) return 'build'
  if (/問|問題|單純|查詢|只是想知道/.test(text) || /[？?]/.test(text)) return 'general'
  return null
}

function classifyGate1(text: string): 'new' | 'custom' | 'follow' | null {
  if (/照(現有|規定|做)|沿用|用他|不用改|維持現況/.test(text)) return 'follow'
  if (/改(現有|規定)|客製|調整規定|修改規定/.test(text)) return 'custom'
  if (/新的|另外|重新|開一份|記一份|重新弄一份/.test(text)) return 'new'
  return null
}

function classifyGate2(text: string): 'follow' | 'edit' | 'new' | 'else' | null {
  if (/照(現有|規定)做|沿用他|用現有的/.test(text)) return 'follow'
  if (/改他|修改他|調整他|改一下(他|這個|這份)/.test(text)) return 'edit'
  if (/另外|新增一份|開一份新的|重新弄一份|不要沿用/.test(text)) return 'new'
  if (/講別的|別的事|其他事|換個話題|先不管這個|等一下再/.test(text)) return 'else'
  return null
}

function classifyGate3(text: string): 'confirm' | 'retry' | null {
  if (/可以|對|沒問題|存吧|好的|確認|儲存|沒錯|就這樣/.test(text)) return 'confirm'
  if (/不對|不是|改一下|再改|不行|等等|漏了/.test(text)) return 'retry'
  return null
}
```

（以上正規表示式是設計階段的參考版本，實作時可依實際測試微調字詞，不用逐字照抄——跟原設計文件 §15 非目標裡「規則式關鍵字清單日後可能需要調整」的態度一致。）

## 4. Fallback 解析順序

每一關收到訊息，依序嘗試：

1. **本關比對**（§3 的分類器）→ 比對到就照原設計文件對應章節的路由處理（等同「點了這個 chip」）。
2. **新話題判斷**（僅適用於關卡 0／1／2，關卡 3 不適用，見 §5）→ 本關比對不到時，**不管 `classifyIntent(text)` 的結果是 `'build'`、`'general'` 還是 `'ambiguous'`**，一律呼叫共用的 `routeAsNewIntent(text)`（見下方），把這句話當成使用者換了新話題、重新走一次跟 `gateStage === 'intent'` 時同一套路由：
   - `'build'` → `routeBuildIntent(text)`
   - `'general'` → TODO 佔位訊息，回到 `gateStage = 'intent'`
   - `'ambiguous'` → `gateStage = 'gate0'`，問「你是要記成 skill，還是單純問事情？」

   這一步就是修正「關卡一打新描述被吞掉」的問題：原本測試時實際打的「把每週會議逐字稿整理成週報」「依部門報告規範自動產出月報」兩句話，`classifyIntent` 都判成 `'ambiguous'`（不是 `'build'`/`'general'`）——若只有 `'build'`/`'general'` 才重定向，這兩句仍然會被晾在原地。改成「本關比對不到就一律重定向」後，這兩句話會被送去關卡0 問清楚，而不是被原地重問同一個問題。

   關卡2 額外要求：呼叫 `routeAsNewIntent(text)` 前先清掉 `pendingSimilarSkillId.value = null`（放棄目前這個「相近做法」的追問脈絡）。

   關卡0 呼叫 `routeAsNewIntent(text)` 時，若結果又是 `'ambiguous'`，效果等同「重新問一次關卡0自己的問題」（`routeAsNewIntent` 的 ambiguous 分支本來就是推關卡0的問句）——這是預期中的收斂，不是 bug。

因為「新話題判斷」現在無條件涵蓋 `classifyIntent` 的三種結果，**關卡 1／2 不再需要獨立的「真的看不懂，重述本關選項」這一層**——`routeAsNewIntent` 本身的三個分支已經涵蓋所有可能結果，一定會落在某個明確的下一步。關卡 0 因為 `routeAsNewIntent` 的 ambiguous 分支剛好就是重問自己，效果上也不需要另外寫一層。**只有關卡 3**（不做新話題判斷，見 §5）仍然保留「本關比對不到 → 用純文字重新描述本關選項，請使用者說清楚一點」這個獨立的 fallback。

### 實作上的共用函式

`routeAsNewIntent(text: string): void`——把原設計文件 §4（`gateStage === 'intent'` 分支）的路由邏輯抽成一個獨立函式，讓「本關比對不到、走新話題判斷」時可以直接呼叫，不重複邏輯：

```ts
function routeAsNewIntent(text: string): void {
  const kind = classifyIntent(text)
  if (kind === 'build') {
    routeBuildIntent(text)
    return
  }
  if (kind === 'general') {
    gateStage.value = 'intent'
    push({ role: 'agent', content: NOT_IMPLEMENTED_REPLY })
    return
  }
  // kind === 'ambiguous'：交給呼叫端決定要不要走關卡 0（intent 分支）或本關的「真的看不懂」重述（其他關卡）
  lastBuildText.value = text
  gateStage.value = 'gate0'
  push({ role: 'agent', content: '你是要記成 skill，還是單純問事情？' })
}
```

`gateStage === 'intent'` 的處理直接呼叫 `routeAsNewIntent(t)`（等同原本的邏輯搬進這個函式，行為不變，只是拿掉 `actions`）。

## 5. 關卡三的例外：不做新話題判斷

關卡三是「內容都問完了、準備存檔」的最終確認，這時候草稿已經累積了完整內容。若比照其他關卡也做新話題判斷，使用者在關卡三隨口打一句話（哪怕只是想追加說明、不是真的要開新話題），有可能被誤判成新的技能描述、直接重置掉整份已經快完成的草稿——風險太高，這次刻意不做。

關卡三只做：本關比對（§3 的 `classifyGate3`）→ 比對不到就重述選項問清楚，**不**呼叫 `classifyIntent`、不做新話題重定向。

## 6. 測試與既有機制的相容性

- 既有的 composable 測試目前用 `send(GATE1_NEW.label)` 這類方式模擬「點 chip」——因為 `.label` 本身就是各關分類器的正典比對詞之一（§3 的分類器都會把選項的原文列進 regex），這些測試預期不需要修改，一樣會落在「本關比對」那一層、行為不變。
- 最終審查階段新增的迴歸測試（`skillBuilderViewBox.test.ts` 裡走 gate1/gate2 的那個測試）目前用 `.trigger('click')` 點 `.ssc-action-chip`——這次要改成透過輸入框打字＋送出，因為畫面上將不再有 chip 可點。
- 新增測試涵蓋：關卡 0／1／2 各自的「本關比對成功」與「新話題重定向」（含 `routeAsNewIntent` 的 build／general／ambiguous 三種子結果各至少一個案例）；關卡 2 額外驗證重定向前有清掉 `pendingSimilarSkillId`；關卡三涵蓋「本關比對」與「看不懂→重述」兩種（無新話題重定向）。

## 7. 型別與既有介面異動

不新增任何匯出型別（`GateStage`／`PausedDraft` 不變）。`GATE0_BUILD` 等既有 `StudioAction` 常數保留原樣（供分類器參考 `.label`），但這次呼叫 `push(...)` 時，關卡 0～3 的訊息物件不再帶 `actions` 欄位。

新增內部（非匯出）函式：`classifyGate0`／`classifyGate1`／`classifyGate2`／`classifyGate3`／`routeAsNewIntent`。

## 8. 非目標（Non-goals）

- 不改變關卡 0～3 的問句文字內容（只拿掉按鈕）。
- 不改變關卡三之後（`gateStage === 'active'`）的既有 `interpretStudioMessage` 行為。
- 不改變「積木組裝」路徑。
- 各關分類器的關鍵字清單，跟原設計文件 §15 一樣，日後可能要依實際使用情況調整，這次不做成可設定介面。
