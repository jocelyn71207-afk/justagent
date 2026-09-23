# AI 賦能建立／修改意圖拆分 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 拿掉「一般問答」分類與關卡0／關卡一的問句，頂層意圖判斷改成「建立」／「修改」二分（外加極短輸入的「太模糊」），語意明確就直接進下一步，不再多問一輪。

**Architecture:** 新增 `classifyBuildOrModify` 取代 `classifyIntent`；`routeIntent`（原 `routeAsNewIntent` 改名重寫）依分類結果直接呼叫 `routeBuildIntent`（重寫：不再先問關卡一，清單非空就直接查相近做法）或新的「修改」處理邏輯（找到就直接 `loadSkill`，找不到就進新的 `'findModifyTarget'` 關卡等使用者說出目標）。`classifyGate0`／`classifyGate1` 與整個 `'gate0'`／`'gate1'` 關卡連同其測試一併刪除。`gate2`／`clarify`／`gate3` 三關的內部邏輯不變，只改「怎麼被進入」與本關比對不到時的重定向目標。

**Tech Stack:** Vue 3 `<script setup>` Composition API、TypeScript、Vitest。

**Spec:** `docs/superpowers/specs/2026-09-23-ai-empower-build-modify-split-design.md`

## Global Constraints

- 只改 `src/composables/useSkillStudioConversation.ts`（加測試檔）＋一個既有的元件測試檔 `src/components/__tests__/skillBuilderViewBox.test.ts`。不改任何 `.vue` 檔案。
- `classifyIntent`、`classifyGate0`、`classifyGate1`、`lastBuildText` 全部刪除（含各自的測試）。
- `classifyGate2`、`classifyGate3`、`GATE2_*`、`GATE3_*`、`gate2`／`clarify`／`gate3` 分支內部邏輯、`CLARIFY_DONE_HINT`、`formatDraftSummary`、`findSimilarSkill`、`wantsToResume`、`PausedDraft`、`pausedDraft` 暫存機制、`interpretStudioMessage`、`suggestionChips` 全部維持不變。
- `classifyBuildOrModify(text)` 判斷順序：先查是否含修改訊號（`修改|調整|更新`，命中直接回 `'modify'`，不管長短），否則含建立訊號或長度 > 4 就回 `'build'`，其餘（極短且無訊號，如「嗯」）回 `'ambiguous'`。
- 修改意圀時：`store.myPersonalSkills` 為空 → 直接回覆「還沒有技能可修改」，`gateStage` 留在 `'intent'`；非空但 `findSimilarSkill` 找不到 → 進 `'findModifyTarget'`；找到 → 直接 `loadSkill`。
- 開場白（`GATE_OPENING_MESSAGE`）拿掉「還是有其他問題」。
- 以下測試字串已用實際 mock 資料（`src/stores/skillStore.ts` 的 `MOCK_PERSONAL_SKILLS`）與真實 `findSimilarSkill`／設計中的 `classifyBuildOrModify` 邏輯驗證過，逐字使用：
  - 太模糊：`'嗯'`
  - 建立、零 bigram 重疊（清單非空時查不到相近做法）：`'我要新增一份規定'`
  - 建立、直接命中某顆技能：``幫我記一個${skillName}的做法``（`skillName` 換成 `store.myPersonalSkills[0].name` 等實際技能名稱）
  - 修改、直接命中某顆技能：``幫我修改${skillName}這個技能``
  - 修改、零 bigram 重疊：`'我想修改一下技能設定'`

---

## 檔案結構

- `src/composables/useSkillStudioConversation.ts`：刪除 `classifyIntent`／`classifyGate0`／`classifyGate1`／`lastBuildText`；新增 `classifyBuildOrModify`；重寫 `routeBuildIntent`；`routeAsNewIntent` 改名重寫為 `routeIntent`；`handleGateMessage` 移除 `'gate0'`／`'gate1'` 分支、新增 `'findModifyTarget'` 分支、`'gate2'` 分支的重定向呼叫換成 `routeIntent`；`GateStage` 型別異動；`GATE_OPENING_MESSAGE` 文案異動。
- `src/composables/__tests__/useSkillStudioConversation.test.ts`：刪除 `classifyIntent`／`classifyGate0`／`classifyGate1` 三個 describe 區塊與「關卡 0／關卡一／相似做法比對」區塊；重寫「意圖判斷」區塊；新增「classifyBuildOrModify」「findModifyTarget」兩個區塊；修正「關卡二與暫存草稿」「CLARIFY 補齊與關卡三確認」「暫存草稿的接續判斷」「classifyGate2」「關卡訊息不再帶 chip」五個區塊裡假設「要先經過關卡一才能到關卡二」的進場方式。
- `src/components/__tests__/skillBuilderViewBox.test.ts`：`reachGate2` 輔助函式從兩次打字（建立描述＋「我想重新弄一份」）簡化成一次（建立描述直接命中相近技能）。

---

### Task 1：核心路由重寫（`classifyBuildOrModify`／`routeIntent`／`routeBuildIntent`／`findModifyTarget`）

**Files:**
- Modify: `src/composables/useSkillStudioConversation.ts`
- Test: `src/composables/__tests__/useSkillStudioConversation.test.ts`

**Interfaces:**
- Produces：
  - `export type GateStage = 'intent' | 'findModifyTarget' | 'gate2' | 'clarify' | 'gate3' | 'active'`
  - `export function classifyBuildOrModify(text: string): 'build' | 'modify' | 'ambiguous'`
  - 模組內部函式 `routeIntent(text: string): void`（取代 `routeAsNewIntent`）、重寫過的 `routeBuildIntent(text: string): void`
  - `handleGateMessage` 新增對 `gateStage.value === 'findModifyTarget'` 的處理；`'intent'` 分支改呼叫 `routeIntent`

- [ ] **Step 1：刪除 `classifyIntent`／`classifyGate0`／`classifyGate1` 與 `lastBuildText`**

找到 `useSkillStudioConversation.ts` 裡這一段（`BUILD_INTENT_VERBS`／`BUILD_INTENT_NOUNS`／`classifyIntent`／`classifyGate0`／`classifyGate1`）：

```ts
const BUILD_INTENT_VERBS = /教|建立|新增|修改|更新|記錄|記一個|記成|固定|流程|SOP/
const BUILD_INTENT_NOUNS = /技能|skill|規定|做法/i

// 規則式關鍵字比對，不是真語意理解，跟 interpretStudioMessage 的既有風格一致
export function classifyIntent(text: string): 'build' | 'general' | 'ambiguous' {
  const hasVerb = BUILD_INTENT_VERBS.test(text)
  const hasNoun = BUILD_INTENT_NOUNS.test(text)
  if (hasVerb && hasNoun) return 'build'
  if (text.trim().length <= 20 && (hasNoun || /[？?]/.test(text))) return 'general'
  return 'ambiguous'
}

// 關卡0 專用的語意分類器：本關只有兩個選項，比對到就等同「點了這個選項」
function classifyGate0(text: string): 'build' | 'general' | null {
  if (/技能|skill|做法|規定|記(成|一個|下來)|建立|新增/i.test(text)) return 'build'
  if (/問|問題|單純|查詢|只是想知道/.test(text) || /[？?]/.test(text)) return 'general'
  return null
}

// 關卡一專用的語意分類器
function classifyGate1(text: string): 'new' | 'custom' | 'follow' | null {
  if (/照(現有|規定|做)|沿用|用他|不用改|維持現況/.test(text)) return 'follow'
  if (/改(現有|規定)|客製|調整規定|修改規定/.test(text)) return 'custom'
  if (/新的|另外|重新|開一份|記一份|重新弄一份/.test(text)) return 'new'
  return null
}
```

整段替換成（`classifyBuildOrModify` 放在同一個位置）：

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

（`classifyGate2`／`classifyGate3` 兩個函式維持在原本的位置不動，只是它們上方原本緊接著的 `classifyGate0`／`classifyGate1` 沒了。）

找到 `GateStage` 型別定義：

```ts
export type GateStage =
  | 'intent'        // 每則新訊息的預設起點：判斷意圖
  | 'gate0'         // 太模糊，先問「記技能還是單純問事情」
  | 'gate1'         // 問「照規定 / 改規定 / 記新的」
  | 'checkingRules' // 內部過渡態：查 myPersonalSkills 有沒有相近做法。
                     // 注意：實作上這一步在同一輪訊息處理裡就會算完轉下一關，
                     // gateStage.value 實際上不會被指定成這個值，純粹型別上列出來說明流程
  | 'gate2'         // 找到相近做法，問「沿用 / 改他 / 另開一份 / 講別的」
  | 'clarify'       // 多輪問答補齊草稿內容（沿用既有 interpretStudioMessage 的抽取規則）
  | 'gate3'         // 最終確認「內容如下…這樣可以嗎？」
  | 'active'        // 分流完畢，既有的 interpretStudioMessage 接手
```

改成：

```ts
export type GateStage =
  | 'intent'           // 每則新訊息的起點：判斷「建立」／「修改」／太模糊
  | 'findModifyTarget' // 已知是修改意圖，但找不到相近技能，等使用者說出要改哪一項
  | 'gate2'            // 建立意圖找到相近做法，問沿用/改他/另開一份/講別的
  | 'clarify'          // 多輪問答補齊草稿內容（沿用既有 interpretStudioMessage 的抽取規則）
  | 'gate3'            // 最終確認「內容如下…這樣可以嗎？」
  | 'active'           // 分流完畢，既有的 interpretStudioMessage 接手
```

在 `useSkillStudioConversation()` 函式內找到這一段狀態宣告：

```ts
  const gateStage = ref<GateStage>('active')
  const pendingSimilarSkillId = ref<string | null>(null)
  const pausedDraft = ref<PausedDraft | null>(null)
  const lastBuildText = ref('')
```

改成（刪除 `lastBuildText` 這一行）：

```ts
  const gateStage = ref<GateStage>('active')
  const pendingSimilarSkillId = ref<string | null>(null)
  const pausedDraft = ref<PausedDraft | null>(null)
```

找到 `startCreate()` 裡重置暫存狀態那幾行：

```ts
    pausedDraft.value = null
    pendingSimilarSkillId.value = null
    lastBuildText.value = ''
    if (prefill) push({ role: 'agent', content: openingMessage ?? DEFAULT_OPENING_MESSAGE })
```

改成（刪除 `lastBuildText.value = ''` 那一行）：

```ts
    pausedDraft.value = null
    pendingSimilarSkillId.value = null
    if (prefill) push({ role: 'agent', content: openingMessage ?? DEFAULT_OPENING_MESSAGE })
```

找到 `loadSkill()` 裡對應的重置行：

```ts
    pausedDraft.value = null
    pendingSimilarSkillId.value = null
    lastBuildText.value = ''
    if (draft.value.method === 'chat') push({ role: 'agent', content: `我們來調整「${s.name}」。告訴我想改哪裡，右側會即時反映。` })
```

改成：

```ts
    pausedDraft.value = null
    pendingSimilarSkillId.value = null
    if (draft.value.method === 'chat') push({ role: 'agent', content: `我們來調整「${s.name}」。告訴我想改哪裡，右側會即時反映。` })
```

- [ ] **Step 2：重寫 `routeBuildIntent`、`routeAsNewIntent` 改名為 `routeIntent`**

找到：

```ts
  // 建立意圖確立後的路由：清單為空就直接進既有建立邏輯（用這句話當第一句描述），
  // 清單非空就進關卡一問清楚要沿用、改、還是開新的
  function routeBuildIntent(text: string): void {
    if (store.myPersonalSkills.length === 0) {
      gateStage.value = 'active'
      const reply = interpretStudioMessage(text, draft.value, mode.value)
      if (reply.patch) draft.value = { ...draft.value, ...reply.patch }
      push({ role: 'agent', content: reply.content, actions: reply.actions })
      return
    }
    lastBuildText.value = text
    gateStage.value = 'gate1'
    push({
      role: 'agent',
      content: '你現在要照公司的規定處理眼前這件事，還是要改規定、或是記一份新的?',
    })
  }

  // 把這句話當成「全新的一輪」處理：跟 gateStage === 'intent' 時同一套路由邏輯。
  // 除了 'intent' 本身呼叫外，也是關卡 0／1／2「本關比對不到」時的新話題重定向共用邏輯
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
    lastBuildText.value = text
    gateStage.value = 'gate0'
    push({ role: 'agent', content: '你是要記成 skill，還是單純問事情？' })
  }
```

整段改成：

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

  // 唯一的頂層意圖路由：gateStage === 'intent' 時呼叫，
  // 也是關卡二「本關比對不到」時的新話題重定向共用邏輯
  function routeIntent(text: string): void {
    const kind = classifyBuildOrModify(text)

    if (kind === 'modify') {
      // 清單本來就是空的：沒有任何技能可以修改，問「要改哪一項」沒有意義。
      // 引導使用者改成描述要建立的內容，下一句話重新整個判斷一次
      if (store.myPersonalSkills.length === 0) {
        gateStage.value = 'intent'
        push({ role: 'agent', content: '目前還沒有任何個人技能可以修改，要不要先告訴我想建立什麼做法？' })
        return
      }
      const similar = findSimilarSkill(text, store.myPersonalSkills)
      if (similar) {
        loadSkill(similar.id)
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

    // kind === 'ambiguous'：明確設回 'intent'，不能假設呼叫端本來就是 'intent'——
    // 這個函式也會被其他關卡「本關比對不到」時當成重定向呼叫，那時候 gateStage
    // 還是原本那一關的值（例如 'gate2'），不明確設定的話會卡在錯的關卡
    gateStage.value = 'intent'
    push({ role: 'agent', content: '你想要記一個新做法，還是要修改現有的？直接跟我說就可以。' })
  }
```

**重要**：`routeIntent` 的三個分支——`modify`（含清單為空的子分支）、`build`（透過 `routeBuildIntent` 間接滿足）、`ambiguous`——**每一條路徑都必須明確設定 `gateStage.value`**，不能有任何一條「維持不動」。這個函式不只在 `gateStage === 'intent'` 時被呼叫，Step 3 會讓它也變成關卡二「本關比對不到」時的重定向目標，呼叫當下 `gateStage` 可能還停在 `'gate2'`；如果某條路徑忘記賦值，使用者會卡在錯的關卡上（表面上看起來像回覆了正確的話，但底層狀態是錯的，下一則訊息會被錯誤的關卡邏輯處理）。上面的程式碼已經在 `modify` 清單為空分支與 `ambiguous` 分支都明確加了 `gateStage.value = 'intent'`，請維持這樣寫，不要因為「反正呼叫時通常就是 intent」而省略。

- [ ] **Step 3：`handleGateMessage` 移除 `'gate0'`／`'gate1'` 分支、新增 `'findModifyTarget'`、`'gate2'` 重定向改呼叫 `routeIntent`**

找到 `handleGateMessage` 目前的樣子：

```ts
  // gateStage !== 'active' 時，每則訊息都先經過這裡，依目前所在的關卡分派給對應的分支處理
  function handleGateMessage(text: string): void {
    const t = text.trim()
    const stage = gateStage.value

    if (stage === 'intent') {
      routeAsNewIntent(t)
      return
    }

    if (stage === 'gate0') {
      const g0 = classifyGate0(t)
      if (g0 === 'build') {
        // t 本身若已經是夠明確的建立描述（classifyIntent 判成 build），優先用它——使用者
        // 這輪打的內容通常比進 gate0 前那句模糊的舊話更完整。只有 t 本身不構成明確建立訊號時
        // （例如使用者只打了短短的「記技能」這種等同點選項的字），才退回沿用舊的 lastBuildText
        routeBuildIntent(classifyIntent(t) === 'build' ? t : lastBuildText.value)
        return
      }
      if (g0 === 'general') {
        push({ role: 'agent', content: NOT_IMPLEMENTED_REPLY })
        gateStage.value = 'intent'
        return
      }
      routeAsNewIntent(t)
      return
    }

    if (stage === 'gate1') {
      const g1 = classifyGate1(t)
      if (g1 === 'new' || g1 === 'custom') {
        const similar = findSimilarSkill(lastBuildText.value, store.myPersonalSkills)
        if (similar) {
          pendingSimilarSkillId.value = similar.id
          gateStage.value = 'gate2'
          push({ role: 'agent', content: `您已經有一份「${similar.name}」，這次要沿用他、改他還是記一份新的？` })
        } else {
          gateStage.value = 'clarify'
          push({ role: 'agent', content: '好，那請直接描述這份做法的內容，我會幫你整理。' })
        }
        return
      }
      if (g1 === 'follow') {
        push({ role: 'agent', content: NOT_IMPLEMENTED_REPLY })
        gateStage.value = 'active'
        return
      }
      routeAsNewIntent(t)
      return
    }

    if (stage === 'gate2') {
      const g2 = classifyGate2(t)
      if (g2 === 'follow') {
        pendingSimilarSkillId.value = null
        gateStage.value = 'active'
        push({ role: 'agent', content: NOT_IMPLEMENTED_REPLY })
        return
      }
      if (g2 === 'edit') {
        const id = pendingSimilarSkillId.value
        pendingSimilarSkillId.value = null
        if (id) loadSkill(id)
        return
      }
      if (g2 === 'new') {
        pendingSimilarSkillId.value = null
        // 保留 method：draft.value = emptyDraft() 會把 method 也清成 null，
        // SkillStudio.vue／skillBuilderViewBox.vue 都用 !conv.draft.value.method 判斷要不要
        // 顯示 SkillMethodChooser 取代掉聊天面板，這裡是在聊天面板裡回話，不能把它自己的
        // 前提條件清掉
        draft.value = { ...emptyDraft(), method: draft.value.method }
        gateStage.value = 'clarify'
        push({ role: 'agent', content: '好，那我們重新開一份。請描述這份做法的內容。' })
        return
      }
      if (g2 === 'else') {
        pausedDraft.value = {
          gateStage: 'gate2',
          messages: [...messages.value],
          draft: { ...draft.value },
          pendingSimilarSkillId: pendingSimilarSkillId.value,
        }
        pendingSimilarSkillId.value = null
        // 同上：保留 method，否則這句話推出去的當下聊天面板就會被 SkillMethodChooser 取代
        draft.value = { ...emptyDraft(), method: draft.value.method }
        messages.value = []
        // 刻意不重設 seq：pausedDraft.messages 裡還留著用舊 seq 產生的訊息 id，
        // 之後 Task 6 接回來時會把這些訊息原封不動塞回 messages.value；如果這裡把
        // seq 歸零，接下來這段新話題（甚至同一輪還沒接回去前）推的新訊息就會產生
        // 跟 paused.messages 撞號的 id（例如都從 studio-1 開始），SkillStudioChat.vue
        // 用 :key="msg.id" 渲染會出問題。seq 只增不減才能保證任何時候都不撞號
        gateStage.value = 'intent'
        push({ role: 'agent', content: '好，你想問什麼或想做什麼？' })
        return
      }
      pendingSimilarSkillId.value = null
      routeAsNewIntent(t)
      return
    }

    if (stage === 'clarify') {
      if (CLARIFY_DONE_HINT.test(t)) {
        gateStage.value = 'gate3'
        push({
          role: 'agent',
          content: `我準備幫您記成這份做法，內容如下：\n${formatDraftSummary(draft.value)}\n這樣可以嗎？`,
        })
        return
      }
      const reply = interpretStudioMessage(t, draft.value, mode.value)
      if (reply.patch) draft.value = { ...draft.value, ...reply.patch }
      push({ role: 'agent', content: reply.content, actions: reply.actions })
      return
    }

    if (stage === 'gate3') {
      const g3 = classifyGate3(t)
      if (g3 === 'confirm') {
        const savedId = save()
        if (!savedId) {
          // save() 在 canSave 為 false（草稿沒有名稱或指令）時回傳 null；這裡可能發生在
          // clarify 的第一句話就剛好命中 CLARIFY_DONE_HINT，直接跳過補齊內容就進了關卡三。
          // 留在／退回 clarify 讓使用者補內容，不能悶不吭聲地轉 active（等於對話卡死）
          const missing = [
            !draft.value.name.trim() ? '名稱' : null,
            !draft.value.instructions.trim() ? '指令內容' : null,
          ].filter((x): x is string => !!x)
          gateStage.value = 'clarify'
          push({ role: 'agent', content: `這份草稿還缺${missing.join('、')}，麻煩先補齊，再跟我說一次「這樣就好」確認。` })
          return
        }
        gateStage.value = 'active'
        push({ role: 'agent', content: `已存成個人技能「${draft.value.name}」，可以到「測試」tab 驗證。` })
        return
      }
      if (g3 === 'retry') {
        gateStage.value = 'clarify'
        push({ role: 'agent', content: '好，繼續說你想怎麼調整。' })
        return
      }
      push({
        role: 'agent',
        content: `我不太確定你的意思——這份做法要存成個人技能嗎？內容如下：\n${formatDraftSummary(draft.value)}\n請直接說「可以」或「還要改」。`,
      })
      return
    }
  }
```

改成（`'gate0'`／`'gate1'` 兩個區塊整個刪除；`'intent'` 分支改呼叫 `routeIntent`；新增 `'findModifyTarget'` 分支，放在 `'intent'` 分支之後、`'gate2'` 分支之前；`'gate2'` 區塊只改最後的重定向呼叫；`'clarify'`／`'gate3'` 兩個區塊完全不動）：

```ts
  // gateStage !== 'active' 時，每則訊息都先經過這裡，依目前所在的關卡分派給對應的分支處理
  function handleGateMessage(text: string): void {
    const t = text.trim()
    const stage = gateStage.value

    if (stage === 'intent') {
      routeIntent(t)
      return
    }

    if (stage === 'findModifyTarget') {
      const similar = findSimilarSkill(t, store.myPersonalSkills)
      if (similar) {
        loadSkill(similar.id)
        return
      }
      push({ role: 'agent', content: `還是沒找到符合「${t}」的技能，可以換個說法，或直接說出正確的技能名稱嗎？` })
      return
    }

    if (stage === 'gate2') {
      const g2 = classifyGate2(t)
      if (g2 === 'follow') {
        pendingSimilarSkillId.value = null
        gateStage.value = 'active'
        push({ role: 'agent', content: NOT_IMPLEMENTED_REPLY })
        return
      }
      if (g2 === 'edit') {
        const id = pendingSimilarSkillId.value
        pendingSimilarSkillId.value = null
        if (id) loadSkill(id)
        return
      }
      if (g2 === 'new') {
        pendingSimilarSkillId.value = null
        // 保留 method：draft.value = emptyDraft() 會把 method 也清成 null，
        // SkillStudio.vue／skillBuilderViewBox.vue 都用 !conv.draft.value.method 判斷要不要
        // 顯示 SkillMethodChooser 取代掉聊天面板，這裡是在聊天面板裡回話，不能把它自己的
        // 前提條件清掉
        draft.value = { ...emptyDraft(), method: draft.value.method }
        gateStage.value = 'clarify'
        push({ role: 'agent', content: '好，那我們重新開一份。請描述這份做法的內容。' })
        return
      }
      if (g2 === 'else') {
        pausedDraft.value = {
          gateStage: 'gate2',
          messages: [...messages.value],
          draft: { ...draft.value },
          pendingSimilarSkillId: pendingSimilarSkillId.value,
        }
        pendingSimilarSkillId.value = null
        // 同上：保留 method，否則這句話推出去的當下聊天面板就會被 SkillMethodChooser 取代
        draft.value = { ...emptyDraft(), method: draft.value.method }
        messages.value = []
        // 刻意不重設 seq：pausedDraft.messages 裡還留著用舊 seq 產生的訊息 id，
        // 之後接回來時會把這些訊息原封不動塞回 messages.value；如果這裡把
        // seq 歸零，接下來這段新話題（甚至同一輪還沒接回去前）推的新訊息就會產生
        // 跟 paused.messages 撞號的 id（例如都從 studio-1 開始），SkillStudioChat.vue
        // 用 :key="msg.id" 渲染會出問題。seq 只增不減才能保證任何時候都不撞號
        gateStage.value = 'intent'
        push({ role: 'agent', content: '好，你想問什麼或想做什麼？' })
        return
      }
      pendingSimilarSkillId.value = null
      routeIntent(t)
      return
    }

    if (stage === 'clarify') {
      if (CLARIFY_DONE_HINT.test(t)) {
        gateStage.value = 'gate3'
        push({
          role: 'agent',
          content: `我準備幫您記成這份做法，內容如下：\n${formatDraftSummary(draft.value)}\n這樣可以嗎？`,
        })
        return
      }
      const reply = interpretStudioMessage(t, draft.value, mode.value)
      if (reply.patch) draft.value = { ...draft.value, ...reply.patch }
      push({ role: 'agent', content: reply.content, actions: reply.actions })
      return
    }

    if (stage === 'gate3') {
      const g3 = classifyGate3(t)
      if (g3 === 'confirm') {
        const savedId = save()
        if (!savedId) {
          // save() 在 canSave 為 false（草稿沒有名稱或指令）時回傳 null；這裡可能發生在
          // clarify 的第一句話就剛好命中 CLARIFY_DONE_HINT，直接跳過補齊內容就進了關卡三。
          // 留在／退回 clarify 讓使用者補內容，不能悶不吭聲地轉 active（等於對話卡死）
          const missing = [
            !draft.value.name.trim() ? '名稱' : null,
            !draft.value.instructions.trim() ? '指令內容' : null,
          ].filter((x): x is string => !!x)
          gateStage.value = 'clarify'
          push({ role: 'agent', content: `這份草稿還缺${missing.join('、')}，麻煩先補齊，再跟我說一次「這樣就好」確認。` })
          return
        }
        gateStage.value = 'active'
        push({ role: 'agent', content: `已存成個人技能「${draft.value.name}」，可以到「測試」tab 驗證。` })
        return
      }
      if (g3 === 'retry') {
        gateStage.value = 'clarify'
        push({ role: 'agent', content: '好，繼續說你想怎麼調整。' })
        return
      }
      push({
        role: 'agent',
        content: `我不太確定你的意思——這份做法要存成個人技能嗎？內容如下：\n${formatDraftSummary(draft.value)}\n請直接說「可以」或「還要改」。`,
      })
      return
    }
  }
```

- [ ] **Step 4：`GATE_OPENING_MESSAGE` 拿掉「還是有其他問題」**

找到：

```ts
const GATE_OPENING_MESSAGE = '你好，我是這裡的助理。想記一個新做法、調整既有的，還是有其他問題，都可以直接跟我說。'
```

改成：

```ts
const GATE_OPENING_MESSAGE = '你好，我是這裡的助理。想記一個新做法，或是要調整既有的，都可以直接跟我說。'
```

- [ ] **Step 5：刪除／重寫測試檔裡對應的描述區塊**

在 `src/composables/__tests__/useSkillStudioConversation.test.ts`：

1. **刪除**整個 `describe('classifyIntent', ...)` 區塊（現有第 387～401 行，內容如下）：

```ts
describe('classifyIntent', () => {
  it('含建立動詞＋技能名詞 → build', () => {
    expect(classifyIntent('幫我建立一個技能')).toBe('build')
    expect(classifyIntent('這個流程以後要教你，記成做法')).toBe('build')
  })

  it('簡短且像問句或提到技能／做法關鍵字 → general', () => {
    expect(classifyIntent('現在庫存多少？')).toBe('general')
    expect(classifyIntent('這個技能是做什麼的')).toBe('general')
  })

  it('訊號不足 → ambiguous', () => {
    expect(classifyIntent('嗯我想想看要怎麼講這件事情才能講得清楚一點')).toBe('ambiguous')
  })
})
```

2. **刪除**整個 `describe('關卡 0／關卡一／相似做法比對', ...)` 區塊（現有第 549～635 行，就是檔案裡緊接在 `意圖判斷（gateStage intent）` 之後的那一大段）。

3. **刪除**檔案最後面的 `describe('classifyGate0（模組內部邏輯，透過 gateStage 行為驗證）', ...)` 與 `describe('classifyGate1（模組內部邏輯，透過 gateStage 行為驗證）', ...)` 兩個區塊（現有第 904～1013 行，`classifyGate0` 區塊在前、`classifyGate1` 區塊緊接在後，兩個一起刪，中間不要留空白）。

4. **改寫**頂端 import：

現有：

```ts
import {
  DEFAULT_OPENING_MESSAGE,
  deriveFromSections,
  emptyDraft,
  extractSkillName,
  interpretStudioMessage,
  useSkillStudioConversation,
  classifyIntent,
  findSimilarSkill,
  wantsToResume,
  formatDraftSummary,
} from '@/composables/useSkillStudioConversation'
```

改成（`classifyIntent` 換成 `classifyBuildOrModify`，其餘不動）：

```ts
import {
  DEFAULT_OPENING_MESSAGE,
  deriveFromSections,
  emptyDraft,
  extractSkillName,
  interpretStudioMessage,
  useSkillStudioConversation,
  classifyBuildOrModify,
  findSimilarSkill,
  wantsToResume,
  formatDraftSummary,
} from '@/composables/useSkillStudioConversation'
```

5. **新增** `describe('classifyBuildOrModify', ...)`：放在（原本 `classifyIntent` 所在、現在已空出來的）同一個位置，也就是 `useSkillStudioConversation` 主 describe 區塊結束、`findSimilarSkill` describe 區塊開始之前：

```ts
describe('classifyBuildOrModify', () => {
  it('含「修改」訊號（不論長短）→ modify', () => {
    expect(classifyBuildOrModify('修改')).toBe('modify')
    expect(classifyBuildOrModify('我想調整一下技能的觸發條件')).toBe('modify')
    expect(classifyBuildOrModify('更新技能內容')).toBe('modify')
  })

  it('含建立訊號，或長度夠長的一般描述 → build（預設值）', () => {
    expect(classifyBuildOrModify('幫我建立一個能查 ERP 庫存的技能')).toBe('build')
    expect(classifyBuildOrModify('把每週會議逐字稿整理成週報')).toBe('build')
  })

  it('極短且無任何訊號 → ambiguous', () => {
    expect(classifyBuildOrModify('嗯')).toBe('ambiguous')
  })

  it('修改訊號優先於長度規則：一有「修改」二字就是 modify，不管多長', () => {
    expect(classifyBuildOrModify('我想要修改一下這個做法的內容跟觸發條件')).toBe('modify')
  })
})
```

6. **重寫**整個 `describe('意圖判斷（gateStage intent）', ...)` 區塊（現有第 499～547 行）。現有內容：

```ts
describe('意圖判斷（gateStage intent）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  async function sendAndWait(c: ReturnType<typeof useSkillStudioConversation>, text: string) {
    const p = c.send(text)
    await vi.advanceTimersByTimeAsync(800)
    await p
  }

  it('清單為空＋建立意圖：直接 gateStage=active，且用既有 interpretStudioMessage 邏輯把這句話當成第一句描述來擬草稿', async () => {
    const store = useSkillStore()
    store.myPersonalSkills.forEach(s => store.deletePersonalSkill(s.id))
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '幫我建立一個能查 ERP 庫存的技能')
    expect(c.gateStage.value).toBe('active')
    expect(c.draft.value.name).toBeTruthy()
  })

  it('清單非空＋建立意圖：gateStage 轉 gate1', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '幫我建立一個新技能')
    expect(c.gateStage.value).toBe('gate1')
  })

  it('一般問答意圖：推 TODO 佔位訊息，gateStage 維持 intent', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '現在庫存多少？')
    expect(c.gateStage.value).toBe('intent')
    expect(c.messages.value.at(-1)!.content).toContain('還在學怎麼幫你直接處理')
  })

  it('太模糊：gateStage 轉 gate0', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '嗯我想想看要怎麼講這件事情才能講得清楚一點')
    expect(c.gateStage.value).toBe('gate0')
  })
})
```

整段改成：

```ts
describe('意圖判斷（gateStage intent）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  async function sendAndWait(c: ReturnType<typeof useSkillStudioConversation>, text: string) {
    const p = c.send(text)
    await vi.advanceTimersByTimeAsync(800)
    await p
  }

  it('清單為空＋建立意圖：直接 gateStage=active，且用既有 interpretStudioMessage 邏輯把這句話當成第一句描述來擬草稿', async () => {
    const store = useSkillStore()
    store.myPersonalSkills.forEach(s => store.deletePersonalSkill(s.id))
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '幫我建立一個能查 ERP 庫存的技能')
    expect(c.gateStage.value).toBe('active')
    expect(c.draft.value.name).toBeTruthy()
  })

  it('清單非空＋建立意圖，找到相近做法：不再問關卡一，一句話直接轉 gate2', async () => {
    const store = useSkillStore()
    const target = store.myPersonalSkills[0]
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, `幫我記一個${target.name}的做法`)
    expect(c.gateStage.value).toBe('gate2')
    expect(c.messages.value.at(-1)!.content).toContain(target.name)
  })

  it('清單非空＋建立意圖，找不到相近做法：不再問關卡一，一句話直接轉 clarify', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '我要新增一份規定')
    expect(c.gateStage.value).toBe('clarify')
  })

  it('修改意圖，找到相近技能：直接 loadSkill 進修改模式', async () => {
    const store = useSkillStore()
    const target = store.myPersonalSkills[0]
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, `幫我修改${target.name}這個技能`)
    expect(c.gateStage.value).toBe('active')
    expect(c.mode.value).toBe('edit')
    expect(c.savedSkillId.value).toBe(target.id)
  })

  it('修改意圖，找不到相近技能：轉 findModifyTarget', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '我想修改一下技能設定')
    expect(c.gateStage.value).toBe('findModifyTarget')
  })

  it('修改意圖，但清單是空的：回覆沒有技能可改，gateStage 留在 intent', async () => {
    const store = useSkillStore()
    store.myPersonalSkills.forEach(s => store.deletePersonalSkill(s.id))
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '我想修改一下技能設定')
    expect(c.gateStage.value).toBe('intent')
    expect(c.messages.value.at(-1)!.content).toContain('還沒有任何個人技能可以修改')
  })

  it('太模糊：gateStage 留在 intent，推一句澄清問句', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '嗯')
    expect(c.gateStage.value).toBe('intent')
    expect(c.messages.value.at(-1)!.content).toContain('記一個新做法')
  })
})
```

7. **新增** `describe('findModifyTarget', ...)`，放在「意圖判斷（gateStage intent）」區塊之後：

```ts
describe('findModifyTarget', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  async function sendAndWait(c: ReturnType<typeof useSkillStudioConversation>, text: string) {
    const p = c.send(text)
    await vi.advanceTimersByTimeAsync(800)
    await p
  }

  it('第二句提到某顆技能：找到了，直接 loadSkill', async () => {
    const store = useSkillStore()
    const target = store.myPersonalSkills[0]
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '我想修改一下技能設定')
    expect(c.gateStage.value).toBe('findModifyTarget')
    await sendAndWait(c, target.name)
    expect(c.gateStage.value).toBe('active')
    expect(c.mode.value).toBe('edit')
    expect(c.savedSkillId.value).toBe(target.id)
  })

  it('還是找不到：換句話重問，不是逐字重複入口訊息', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '我想修改一下技能設定')
    const entryMessage = c.messages.value.at(-1)!.content
    await sendAndWait(c, '就是那個東西')
    expect(c.gateStage.value).toBe('findModifyTarget')
    expect(c.messages.value.at(-1)!.content).not.toBe(entryMessage)
  })
})
```

- [ ] **Step 6：執行測試確認全部通過**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts`
Expected: 這一步**不會**全部 PASS——「關卡二與暫存草稿」「CLARIFY 補齊與關卡三確認」「暫存草稿的接續判斷」「classifyGate2」「關卡訊息不再帶 chip」這五個既有區塊還在用「先進關卡一再進關卡二」的兩步進場方式，這些測試會 FAIL（找不到 `'gate1'` 這個 `GateStage` 值、或卡在錯誤的中繼狀態）。確認：① 這個 Task 新增／改寫的區塊（`classifyBuildOrModify`、`意圖判斷`、`findModifyTarget`）全部 PASS；② 其餘失敗的測試，失敗原因都跟「兩步進場方式」有關，不是別的錯誤——這是預期中的失敗，Task 2 才會修。

- [ ] **Step 7：Commit**

```bash
git add src/composables/useSkillStudioConversation.ts src/composables/__tests__/useSkillStudioConversation.test.ts
git commit -m "feat(skill-studio): split build/modify intent, remove gate0/gate1 questions"
```

---

### Task 2：修正下游測試的進場方式（不再需要先過關卡一）

**Files:**
- Modify: `src/composables/__tests__/useSkillStudioConversation.test.ts`

**Interfaces:**
- Consumes：Task 1 的 `GateStage`（不再有 `'gate1'`）、`routeBuildIntent`／`routeIntent` 的新行為（建立意圖一句話直接查相近做法）。

- [ ] **Step 1：修正「關卡二與暫存草稿」的 `reachGate2` 輔助函式**

找到：

```ts
  async function reachGate2(c: ReturnType<typeof useSkillStudioConversation>, skillName: string) {
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, `幫我記一個${skillName}的做法`)
    await sendAndWait(c, '記一份新的')
  }
```

改成（少一次打字，因為現在一句話就直接到 gate2 了）：

```ts
  async function reachGate2(c: ReturnType<typeof useSkillStudioConversation>, skillName: string) {
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, `幫我記一個${skillName}的做法`)
  }
```

這個區塊底下 4 個 `it(...)` 測試本身**不用改**（`reachGate2` 呼叫方式不變，只是它內部少打一次字）。

- [ ] **Step 2：修正「CLARIFY 補齊與關卡三確認」裡的兩步進場**

這個區塊有 4 個測試都用同樣的開頭兩句：

```ts
    await sendAndWait(c, '幫我建立一個新技能') // 清單非空 → gate1
    await sendAndWait(c, '改現有規定（走客製路線）') // 找不到相近 → clarify
```

四處都改成一句：

```ts
    await sendAndWait(c, '我要新增一份規定') // 清單非空、零 bigram 重疊 → 直接 clarify
```

（`我要新增一份規定` 這句話已在 Global Constraints 驗證過對所有 mock 技能零重疊，直接一句話就會落在 `clarify`。）

- [ ] **Step 3：修正「暫存草稿的接續判斷」的 `pauseWithDraft` 輔助函式與最後一個測試**

找到：

```ts
  async function pauseWithDraft(c: ReturnType<typeof useSkillStudioConversation>, skillName: string): Promise<number> {
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, `幫我記一個${skillName}的做法`)
    await sendAndWait(c, '記一份新的')
    const pausedMessageCount = c.messages.value.length + 1 // +1：即將送出、會被存進快照的「我要講別的」
    await sendAndWait(c, '我要講別的')
    return pausedMessageCount
  }
```

改成（少一次打字）：

```ts
  async function pauseWithDraft(c: ReturnType<typeof useSkillStudioConversation>, skillName: string): Promise<number> {
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, `幫我記一個${skillName}的做法`)
    const pausedMessageCount = c.messages.value.length + 1 // +1：即將送出、會被存進快照的「我要講別的」
    await sendAndWait(c, '我要講別的')
    return pausedMessageCount
  }
```

找到區塊最後一個測試：

```ts
  it('沒有暫存草稿時，接續關鍵字就照正常意圖判斷處理（不會誤觸發還原、不會拋錯）', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '我們繼續剛才的')
    // 沒有 pausedDraft，接續檢查整段跳過；這句話本身沒有明確的建立動詞＋名詞、
    // 也沒有問號，classifyIntent 會判成 ambiguous，走正常的關卡0。
    // pausedDraft 本身不是 useSkillStudioConversation() 回傳值的一部分（純內部狀態，
    // 見 Task 4），測試只能斷言可觀察的行為結果，不能直接檢查它的值
    expect(c.gateStage.value).toBe('gate0')
  })
```

改成（`'我們繼續剛才的'` 這句話長度 > 4，用新的 `classifyBuildOrModify` 會判成 `'build'` 而不是 `'ambiguous'`，不能再拿來測「沒有暫存草稿時照正常意圖判斷處理」這件事本身——換一句真的模糊的話）：

```ts
  it('沒有暫存草稿時，接續關鍵字就照正常意圖判斷處理（不會誤觸發還原、不會拋錯）', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '嗯')
    // 沒有 pausedDraft，接續檢查整段跳過；'嗯' 這句話太短、沒有任何訊號，
    // classifyBuildOrModify 會判成 ambiguous，gateStage 留在 intent 並推一句澄清問句。
    // pausedDraft 本身不是 useSkillStudioConversation() 回傳值的一部分（純內部狀態），
    // 測試只能斷言可觀察的行為結果，不能直接檢查它的值
    expect(c.gateStage.value).toBe('intent')
    expect(c.messages.value.at(-1)!.content).toContain('記一個新做法')
  })
```

（這個區塊的其他測試——用到 `pauseWithDraft` 的那兩個——不用再改，因為 `pauseWithDraft` 本身已經在 Step 3 前半修好了。）

- [ ] **Step 4：修正「classifyGate2」區塊的 `toGate2` 輔助函式與重定向測試的預期結果**

找到：

```ts
  async function toGate2(c: ReturnType<typeof useSkillStudioConversation>, skillName: string) {
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, `幫我記一個${skillName}的做法`)
    await sendAndWait(c, '我想重新弄一份')
    expect(c.gateStage.value).toBe('gate2')
  }
```

改成：

```ts
  async function toGate2(c: ReturnType<typeof useSkillStudioConversation>, skillName: string) {
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, `幫我記一個${skillName}的做法`)
    expect(c.gateStage.value).toBe('gate2')
  }
```

找到「本關比對不到」那個測試：

```ts
  it('本關比對不到：先清掉 pendingSimilarSkillId，再重定向到新話題判斷', async () => {
    const store = useSkillStore()
    const c = useSkillStudioConversation()
    await toGate2(c, store.myPersonalSkills[0].name)
    await sendAndWait(c, '依部門報告規範自動產出月報')
    // classifyIntent 對這句話判成 ambiguous（跟 gate1 那組原始回報句同一批），重定向到關卡0
    expect(c.gateStage.value).toBe('gate0')
    // 驗證 pendingSimilarSkillId 真的被清掉了：接著隨便補完一份新草稿存檔，
    // 不應該去 applyStudioPatch 到原本那顆相近技能身上
    await sendAndWait(c, '我要記成技能')
    expect(c.gateStage.value).toBe('gate1')
  })
```

改成（`'依部門報告規範自動產出月報'` 這句話在新的 `classifyBuildOrModify` 下已驗證是 `'build'` 且會命中「行銷週報快篩」，不再是 `'ambiguous'`；改用一句經過驗證的模糊短句測「重定向到新話題判斷」這件事本身，並改用 `pendingSimilarSkillId` 確實被清掉這件事的另一種驗證方式——重定向後若命中別的技能，訊息裡的技能名稱應該是新找到的那顆，不是原本 gate2 那顆）：

```ts
  it('本關比對不到：先清掉 pendingSimilarSkillId，再重定向到新話題判斷（太模糊 → 留在 intent 問澄清）', async () => {
    const store = useSkillStore()
    const c = useSkillStudioConversation()
    await toGate2(c, store.myPersonalSkills[0].name)
    await sendAndWait(c, '嗯')
    expect(c.gateStage.value).toBe('intent')
    expect(c.messages.value.at(-1)!.content).toContain('記一個新做法')
    // 驗證 pendingSimilarSkillId 真的被清掉了：接著描述一個會命中「另一顆」技能的新內容，
    // 應該正確轉去 gate2 並帶那顆技能的名稱，而不是卡在舊的 pendingSimilarSkillId 對應的技能上
    const other = store.myPersonalSkills[1]
    await sendAndWait(c, `幫我記一個${other.name}的做法`)
    expect(c.gateStage.value).toBe('gate2')
    expect(c.messages.value.at(-1)!.content).toContain(other.name)
  })
```

- [ ] **Step 5：修正「關卡訊息不再帶 chip（actions）」區塊**

找到整個區塊：

```ts
describe('關卡訊息不再帶 chip（actions）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  async function sendAndWait(c: ReturnType<typeof useSkillStudioConversation>, text: string) {
    const p = c.send(text)
    await vi.advanceTimersByTimeAsync(800)
    await p
  }

  it('關卡一的訊息（清單非空、建立意圖）不帶 actions', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '幫我建立一個新技能')
    expect(c.gateStage.value).toBe('gate1')
    expect(c.messages.value.at(-1)!.actions).toBeUndefined()
  })

  it('關卡0 的訊息（太模糊）不帶 actions', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '嗯我想想看要怎麼講這件事情才能講得清楚一點')
    expect(c.gateStage.value).toBe('gate0')
    expect(c.messages.value.at(-1)!.actions).toBeUndefined()
  })

  it('精確打「記一份新的」（原本的 chip 文字）依然能正常走關卡一路由，且訊息本身沒有 actions', async () => {
    const store = useSkillStore()
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, `幫我記一個${store.myPersonalSkills[0].name}的做法`)
    expect(c.gateStage.value).toBe('gate1')
    await sendAndWait(c, '記一份新的')
    expect(c.gateStage.value).toBe('gate2')
    expect(c.messages.value.at(-1)!.actions).toBeUndefined()
  })
})
```

整段改成（關卡一／關卡0 都不存在了，改驗證現在僅存的幾個會推訊息的關卡——`gate2`、`findModifyTarget`、澄清問句——訊息本身都不帶 `actions`）：

```ts
describe('關卡訊息不再帶 chip（actions）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  async function sendAndWait(c: ReturnType<typeof useSkillStudioConversation>, text: string) {
    const p = c.send(text)
    await vi.advanceTimersByTimeAsync(800)
    await p
  }

  it('關卡二的訊息（建立意圖找到相近做法）不帶 actions', async () => {
    const store = useSkillStore()
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, `幫我記一個${store.myPersonalSkills[0].name}的做法`)
    expect(c.gateStage.value).toBe('gate2')
    expect(c.messages.value.at(-1)!.actions).toBeUndefined()
  })

  it('findModifyTarget 的訊息（修改意圖找不到相近技能）不帶 actions', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '我想修改一下技能設定')
    expect(c.gateStage.value).toBe('findModifyTarget')
    expect(c.messages.value.at(-1)!.actions).toBeUndefined()
  })

  it('太模糊的澄清問句不帶 actions', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '嗯')
    expect(c.gateStage.value).toBe('intent')
    expect(c.messages.value.at(-1)!.actions).toBeUndefined()
  })
})
```

- [ ] **Step 6：執行測試確認全部通過**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts`
Expected: 全部 PASS。

- [ ] **Step 7：Commit**

```bash
git add src/composables/__tests__/useSkillStudioConversation.test.ts
git commit -m "test(skill-studio): update downstream tests for one-step build-intent routing"
```

---

### Task 3：更新元件迴歸測試、整體驗收

**Files:**
- Modify: `src/components/__tests__/skillBuilderViewBox.test.ts`

**Interfaces:**
- Consumes：Task 1、Task 2 完成後的整套路由邏輯。

- [ ] **Step 1：簡化 `reachGate2` 輔助函式**

找到 `src/components/__tests__/skillBuilderViewBox.test.ts` 裡的：

```ts
      async function reachGate2(w: ReturnType<typeof mount>) {
        await w.findAll('.smc-card')[0].trigger('click')
        await flushPromises()
        await type(w, `幫我記一個${target.name}的做法`)
        // 關卡一：聊天面板還在，問句正確，不帶 chip
        expect(w.find('.SkillStudioChat').exists()).toBe(true)
        expect(w.find('.ssc-messages').text()).toContain('照公司的規定')
        expect(w.findAll('.chat-bubble').at(-1)!.findAll('.ssc-action-chip')).toHaveLength(0)
        await type(w, '我想重新弄一份')
        // 關卡二：找到相近做法，聊天面板還在、方式選擇畫面沒有出現，訊息帶技能名稱，不帶 chip
        expect(w.find('.SkillMethodChooser').exists()).toBe(false)
        expect(w.find('.SkillStudioChat').exists()).toBe(true)
        expect(w.find('.ssc-messages').text()).toContain(target.name)
        expect(w.findAll('.chat-bubble').at(-1)!.findAll('.ssc-action-chip')).toHaveLength(0)
      }
```

改成（不再需要先過關卡一，一句話直接到關卡二；移除已經不存在的「照公司的規定」斷言）：

```ts
      async function reachGate2(w: ReturnType<typeof mount>) {
        await w.findAll('.smc-card')[0].trigger('click')
        await flushPromises()
        await type(w, `幫我記一個${target.name}的做法`)
        // 關卡二：找到相近做法，聊天面板還在、方式選擇畫面沒有出現，訊息帶技能名稱，不帶 chip
        expect(w.find('.SkillMethodChooser').exists()).toBe(false)
        expect(w.find('.SkillStudioChat').exists()).toBe(true)
        expect(w.find('.ssc-messages').text()).toContain(target.name)
        expect(w.findAll('.chat-bubble').at(-1)!.findAll('.ssc-action-chip')).toHaveLength(0)
      }
```

這個檔案裡呼叫 `reachGate2(...)` 的地方（測試主體其餘部分）不用改，行為不變，只是少一輪對話。

- [ ] **Step 2：執行這個檔案確認全部通過**

Run: `npx vitest run src/components/__tests__/skillBuilderViewBox.test.ts`
Expected: 全部 PASS。

- [ ] **Step 3：執行整體驗收**

Run: `npx vitest run`
Expected: 全部 PASS（既有測試數量 + Task 1／2 新增測試數量，扣掉刪除的舊測試，沒有任何失敗）。

Run: `npm run lint`
Expected：`useSkillStudioConversation.ts`／`useSkillStudioConversation.test.ts`／`skillBuilderViewBox.test.ts` 沒有新增的 lint 錯誤（含 `no-unused-vars`——`classifyIntent`／`classifyGate0`／`classifyGate1`／`lastBuildText` 這次都整個刪除了，不會留下死碼）。

Run: `npm run type-check`
Expected：沒有新增的型別錯誤（已知的既有錯誤基準不變）。

手動／live 驗證（有本機 dev server 在跑的話）：

1. 進「AI 賦能」，選「用對話建立」，開場白不再提「其他問題」。
2. 打一句明確的建立意圖描述（例如「幫我建立一個能查 ERP 庫存的技能」），不再被多問一次「照規定/改規定/記新的」，直接看到下一步反應。
3. 打一句包含「修改」的話（例如「幫我修改週報自動生成這個技能」），如果清單裡真的有相近技能，直接被帶進編輯模式；如果沒對應到，會被問「要修改哪一項技能？」。
4. 打一句真的很短很模糊的話（例如「嗯」），確認會被問「你想要記一個新做法，還是要修改現有的？」，不是原地不動或報錯。

- [ ] **Step 4：Commit**

```bash
git add src/components/__tests__/skillBuilderViewBox.test.ts
git commit -m "test(skill-studio): simplify gate2 regression test for one-step build-intent routing"
```

---

## 完成後的整體驗收

```bash
npx vitest run
npm run lint
npm run type-check
```

Expected：全部通過，`lint`／`type-check` 的既有錯誤數量跟本計畫開始前一致。
