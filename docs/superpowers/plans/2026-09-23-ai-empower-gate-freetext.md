# AI 賦能關卡取消 chip、改用語意判斷 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 關卡 0～3 不再用 quick-reply chip 呈現選項，改成純文字對話——每一關用規則式語意分類器理解自由輸入；本關比對不到時（關卡0／1／2）一律重新走一次意圖判斷路由，把它當成使用者換了新話題，不再原地重複同一句問句。

**Architecture:** 抽出共用函式 `routeAsNewIntent(text)`（把 `gateStage === 'intent'` 現有的 `classifyIntent` 路由邏輯獨立出來），關卡 0／1／2 的「比對不到本關選項」分支改呼叫它；關卡 3 維持「本關比對不到就重述選項」、不做新話題重定向（怕誤丟掉快完成的草稿）。每一關新增一個規則式分類函式（`classifyGate0`／`classifyGate1`／`classifyGate2`／`classifyGate3`），取代原本的 `t === SOME_LABEL.label` 精確比對。所有 `push(...)` 呼叫移除 `actions` 欄位（不再顯示 chip 按鈕）。

**Tech Stack:** Vue 3 `<script setup>` Composition API、TypeScript、Vitest。

**Spec:** `docs/superpowers/specs/2026-09-23-ai-empower-gate-freetext-design.md`（前置：`docs/superpowers/specs/2026-09-22-ai-empower-intent-gate-design.md`，本次是它的後續調整）

## Global Constraints

- 只改 `src/composables/useSkillStudioConversation.ts`（加測試檔）＋一個既有的元件測試檔 `src/components/__tests__/skillBuilderViewBox.test.ts`（把裡面用 chip 點擊驅動的測試改成打字驅動，因為畫面上不再有 chip）。不改任何 `.vue` 檔案本身。
- 關卡 0～3 的問句文字**不變**，只是移除 `actions` 欄位（不再帶 chip）。
- `GATE0_BUILD`／`GATE1_NEW` 等既有 `StudioAction` 常數**保留**，不刪除——它們的 `.label` 字串仍是「這句話語意上等於選了這個選項」的正典文字，是各關分類器的設計依據（但不需要在程式碼裡直接引用這些常數的 `.label` 做字串相等比對了，改用分類器）。
- 關卡 0／1／2：本關分類器比對不到時，**一律**（不論 `classifyIntent` 的結果是 `build`／`general`／`ambiguous`）呼叫共用的 `routeAsNewIntent(text)`。關卡 2 額外要求：呼叫前先 `pendingSimilarSkillId.value = null`。
- 關卡 3：本關分類器比對不到時，**不**呼叫 `routeAsNewIntent`，改用純文字重新描述本關兩個選項，請使用者說清楚一點——不能是原本問句的逐字重複，要換句話問。
- `classifyIntent`、`findSimilarSkill`、`wantsToResume`、`formatDraftSummary`、`interpretStudioMessage` 本身**不修改**。
- `startCreate`／`loadSkill`／`send`／`save`／`toSnapshot`／`hydrate` 這幾個函式簽名與既有行為**不修改**（`handleGateMessage` 內部呼叫它們的方式不變）。

---

## 檔案結構

這次改動集中在：

- `src/composables/useSkillStudioConversation.ts`：新增內部（非匯出）函式 `routeAsNewIntent`／`classifyGate0`／`classifyGate1`／`classifyGate2`／`classifyGate3`；修改既有的 `routeBuildIntent`（移除 `actions`）與 `handleGateMessage` 內的 `'intent'`／`'gate0'`／`'gate1'`／`'gate2'`／`'gate3'` 五個分支。
- `src/composables/__tests__/useSkillStudioConversation.test.ts`：新增測試（既有測試不動，除非本計畫明確指出）。
- `src/components/__tests__/skillBuilderViewBox.test.ts`：改寫最終審查階段新增的那個迴歸測試（原本用 `.trigger('click')` 點 `.ssc-action-chip`，改成透過輸入框打字＋按 Enter）。

---

### Task 1：抽出 `routeAsNewIntent`，關卡 0～3 全面移除 chip

**Files:**
- Modify: `src/composables/useSkillStudioConversation.ts`
- Test: `src/composables/__tests__/useSkillStudioConversation.test.ts`

**Interfaces:**
- Produces：
  - `function routeAsNewIntent(text: string): void`（模組內部函式，定義在 `routeBuildIntent` 之後、`handleGateMessage` 之前）
  - `handleGateMessage` 的 `'intent'` 分支改成直接呼叫 `routeAsNewIntent(t)`
  - 所有既有 `push(...)` 呼叫中屬於關卡 0～3 的訊息，移除 `actions` 欄位

- [ ] **Step 1: 寫失敗的測試**

在 `src/composables/__tests__/useSkillStudioConversation.test.ts` 檔案**最後面**（最後一個既有 `})` 之後）加入：

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

  it('精確打「記一份新的」（原本的 chip 文字）依然能正常走關卡一路由（比對不到本關選項的行為留到 Task 3 才改，這裡先只驗證：這句話還是把 gateStage 帶去該去的地方，且訊息本身沒有 actions）', async () => {
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

- [ ] **Step 2: 執行測試確認全部失敗**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts -t "關卡訊息不再帶 chip"`
Expected: 全部 FAIL（目前每一則關卡訊息都還帶著 `actions` 欄位）。

- [ ] **Step 3: 修改 `useSkillStudioConversation.ts`**

找到目前的 `routeBuildIntent`：

```ts
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
      actions: [GATE1_NEW, GATE1_CUSTOM, GATE1_FOLLOW],
    })
  }
```

改成（**只移除關卡一那則訊息的 `actions` 一行**；`store.myPersonalSkills.length === 0` 那個分支推的是 `interpretStudioMessage` 自己的回覆，那是既有的 `active` 狀態邏輯、不屬於這次「關卡」chip 移除的範圍，`reply.actions` 保留不動）：

```ts
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
```

在 `routeBuildIntent` 函式定義**之後**、`handleGateMessage` 函式定義**之前**，加入：

```ts
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

找到目前的 `handleGateMessage`：

```ts
  function handleGateMessage(text: string): void {
    const t = text.trim()
    const stage = gateStage.value

    if (stage === 'intent') {
      const kind = classifyIntent(t)
      if (kind === 'build') {
        routeBuildIntent(t)
        return
      }
      if (kind === 'general') {
        push({ role: 'agent', content: NOT_IMPLEMENTED_REPLY })
        return
      }
      lastBuildText.value = t
      gateStage.value = 'gate0'
      push({ role: 'agent', content: '你是要記成 skill，還是單純問事情？', actions: [GATE0_BUILD, GATE0_GENERAL] })
      return
    }

    if (stage === 'gate0') {
      if (t === GATE0_BUILD.label) {
        routeBuildIntent(lastBuildText.value)
        return
      }
      if (t === GATE0_GENERAL.label) {
        push({ role: 'agent', content: NOT_IMPLEMENTED_REPLY })
        gateStage.value = 'intent'
        return
      }
      push({ role: 'agent', content: '你是要記成 skill，還是單純問事情？', actions: [GATE0_BUILD, GATE0_GENERAL] })
      return
    }

    if (stage === 'gate1') {
      if (t === GATE1_NEW.label || t === GATE1_CUSTOM.label) {
        const similar = findSimilarSkill(lastBuildText.value, store.myPersonalSkills)
        if (similar) {
          pendingSimilarSkillId.value = similar.id
          gateStage.value = 'gate2'
          push({
            role: 'agent',
            content: `您已經有一份「${similar.name}」，這次要沿用他、改他還是記一份新的？`,
            actions: [GATE2_FOLLOW, GATE2_EDIT, GATE2_NEW, GATE2_ELSE],
          })
        } else {
          gateStage.value = 'clarify'
          push({ role: 'agent', content: '好，那請直接描述這份做法的內容，我會幫你整理。' })
        }
        return
      }
      if (t === GATE1_FOLLOW.label) {
        push({ role: 'agent', content: NOT_IMPLEMENTED_REPLY })
        gateStage.value = 'active'
        return
      }
      push({
        role: 'agent',
        content: '你現在要照公司的規定處理眼前這件事，還是要改規定、或是記一份新的?',
        actions: [GATE1_NEW, GATE1_CUSTOM, GATE1_FOLLOW],
      })
      return
    }

    if (stage === 'gate2') {
      if (t === GATE2_FOLLOW.label) {
        pendingSimilarSkillId.value = null
        gateStage.value = 'active'
        push({ role: 'agent', content: NOT_IMPLEMENTED_REPLY })
        return
      }
      if (t === GATE2_EDIT.label) {
        const id = pendingSimilarSkillId.value
        pendingSimilarSkillId.value = null
        if (id) loadSkill(id)
        return
      }
      if (t === GATE2_NEW.label) {
        pendingSimilarSkillId.value = null
        draft.value = { ...emptyDraft(), method: draft.value.method }
        gateStage.value = 'clarify'
        push({ role: 'agent', content: '好，那我們重新開一份。請描述這份做法的內容。' })
        return
      }
      if (t === GATE2_ELSE.label) {
        pausedDraft.value = {
          gateStage: 'gate2',
          messages: [...messages.value],
          draft: { ...draft.value },
          pendingSimilarSkillId: pendingSimilarSkillId.value,
        }
        pendingSimilarSkillId.value = null
        draft.value = { ...emptyDraft(), method: draft.value.method }
        messages.value = []
        gateStage.value = 'intent'
        push({ role: 'agent', content: '好，你想問什麼或想做什麼？' })
        return
      }
      const similar = pendingSimilarSkillId.value ? store.findSkill(pendingSimilarSkillId.value) : null
      push({
        role: 'agent',
        content: `您已經有一份「${similar?.name ?? ''}」，這次要沿用他、改他還是記一份新的？`,
        actions: [GATE2_FOLLOW, GATE2_EDIT, GATE2_NEW, GATE2_ELSE],
      })
      return
    }

    if (stage === 'clarify') {
      if (CLARIFY_DONE_HINT.test(t)) {
        gateStage.value = 'gate3'
        push({
          role: 'agent',
          content: `我準備幫您記成這份做法，內容如下：\n${formatDraftSummary(draft.value)}\n這樣可以嗎？`,
          actions: [GATE3_CONFIRM, GATE3_RETRY],
        })
        return
      }
      const reply = interpretStudioMessage(t, draft.value, mode.value)
      if (reply.patch) draft.value = { ...draft.value, ...reply.patch }
      push({ role: 'agent', content: reply.content, actions: reply.actions })
      return
    }

    if (stage === 'gate3') {
      if (t === GATE3_CONFIRM.label) {
        const savedId = save()
        if (!savedId) {
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
      if (t === GATE3_RETRY.label) {
        gateStage.value = 'clarify'
        push({ role: 'agent', content: '好，繼續說你想怎麼調整。' })
        return
      }
      push({
        role: 'agent',
        content: `我準備幫您記成這份做法，內容如下：\n${formatDraftSummary(draft.value)}\n這樣可以嗎？`,
        actions: [GATE3_CONFIRM, GATE3_RETRY],
      })
      return
    }
  }
```

改成（這個 Task **只**：① `'intent'` 分支改呼叫 `routeAsNewIntent`；② 移除全部 `actions` 欄位。四個分支各自的比對邏輯——`t === GATE0_BUILD.label` 這類精確比對——這個 Task**先不動**，Task 2～5 才會逐一換成分類器＋新話題重定向）：

```ts
  function handleGateMessage(text: string): void {
    const t = text.trim()
    const stage = gateStage.value

    if (stage === 'intent') {
      routeAsNewIntent(t)
      return
    }

    if (stage === 'gate0') {
      if (t === GATE0_BUILD.label) {
        routeBuildIntent(lastBuildText.value)
        return
      }
      if (t === GATE0_GENERAL.label) {
        push({ role: 'agent', content: NOT_IMPLEMENTED_REPLY })
        gateStage.value = 'intent'
        return
      }
      push({ role: 'agent', content: '你是要記成 skill，還是單純問事情？' })
      return
    }

    if (stage === 'gate1') {
      if (t === GATE1_NEW.label || t === GATE1_CUSTOM.label) {
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
      if (t === GATE1_FOLLOW.label) {
        push({ role: 'agent', content: NOT_IMPLEMENTED_REPLY })
        gateStage.value = 'active'
        return
      }
      push({
        role: 'agent',
        content: '你現在要照公司的規定處理眼前這件事，還是要改規定、或是記一份新的?',
      })
      return
    }

    if (stage === 'gate2') {
      if (t === GATE2_FOLLOW.label) {
        pendingSimilarSkillId.value = null
        gateStage.value = 'active'
        push({ role: 'agent', content: NOT_IMPLEMENTED_REPLY })
        return
      }
      if (t === GATE2_EDIT.label) {
        const id = pendingSimilarSkillId.value
        pendingSimilarSkillId.value = null
        if (id) loadSkill(id)
        return
      }
      if (t === GATE2_NEW.label) {
        pendingSimilarSkillId.value = null
        draft.value = { ...emptyDraft(), method: draft.value.method }
        gateStage.value = 'clarify'
        push({ role: 'agent', content: '好，那我們重新開一份。請描述這份做法的內容。' })
        return
      }
      if (t === GATE2_ELSE.label) {
        pausedDraft.value = {
          gateStage: 'gate2',
          messages: [...messages.value],
          draft: { ...draft.value },
          pendingSimilarSkillId: pendingSimilarSkillId.value,
        }
        pendingSimilarSkillId.value = null
        draft.value = { ...emptyDraft(), method: draft.value.method }
        messages.value = []
        gateStage.value = 'intent'
        push({ role: 'agent', content: '好，你想問什麼或想做什麼？' })
        return
      }
      const similar = pendingSimilarSkillId.value ? store.findSkill(pendingSimilarSkillId.value) : null
      push({
        role: 'agent',
        content: `您已經有一份「${similar?.name ?? ''}」，這次要沿用他、改他還是記一份新的？`,
      })
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
      if (t === GATE3_CONFIRM.label) {
        const savedId = save()
        if (!savedId) {
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
      if (t === GATE3_RETRY.label) {
        gateStage.value = 'clarify'
        push({ role: 'agent', content: '好，繼續說你想怎麼調整。' })
        return
      }
      push({
        role: 'agent',
        content: `我準備幫您記成這份做法，內容如下：\n${formatDraftSummary(draft.value)}\n這樣可以嗎？`,
      })
      return
    }
  }
```

（`clarify` 分支的 `reply.actions`——來自 `interpretStudioMessage` 自己回傳的 `ACTION_CONFIRM`／`ACTION_TRIGGER`／`ACTION_STEP` 這幾個既有 chip——**保留不動**：那是既有 `interpretStudioMessage` 自己的機制，不屬於這次「關卡 0～3」chip 移除的範圍，這次只改關卡本身新增的訊息。）

**重要：上面「改成」的程式碼區塊為了排版精簡，省略了 `GATE2_NEW`／`GATE2_ELSE` 兩段既有註解的呈現——實際修改檔案時，這兩段既有註解要維持在原本的位置、不要刪除**：
- `GATE2_NEW` 那行 `draft.value = { ...emptyDraft(), method: draft.value.method }` 前面的「保留 method：`draft.value = emptyDraft()` 會把 method 也清成 null…」那四行註解。
- `GATE2_ELSE` 那行 `draft.value = { ...emptyDraft(), method: draft.value.method }` 前面的「同上：保留 method…」那行，以及 `messages.value = []` 後面「刻意不重設 seq：`pausedDraft.messages` 裡還留著…」那一整段解釋 seq 不能歸零的註解（這段是先前開發階段一個真實 bug 的修正說明，務必保留，後續 Task 也不會再重複這個說明）。

- [ ] **Step 4: 執行測試確認全部通過**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts`
Expected: 全部 PASS（含這個 Task 新加的測試，以及檔案裡原本就有的所有既有測試——既有測試都是用 `send(GATE1_NEW.label)` 這種方式模擬「點 chip」，這個 Task 沒有改動任何 `t === X.label` 的比對邏輯，只是移除 `actions` 欄位，既有測試不檢查 `actions`，不會被這個改動弄壞）。

- [ ] **Step 5: 執行整個套件確認沒有連帶弄壞**

Run: `npx vitest run`
Expected: 全部 PASS（`src/components/__tests__/skillBuilderViewBox.test.ts` 裡走 gate1/gate2 的那個迴歸測試，目前還是點 `.ssc-action-chip`——`SkillStudioChat.vue` 對沒有 `actions` 的訊息本來就不會渲染任何 chip，所以這個測試在這個 Task 之後預期會直接 FAIL，找不到可以點的 chip 元素。這是預期中的失敗，Task 6 才會改寫這個測試；如果這步驟看到這個測試失敗，先確認失敗原因就是「找不到 `.ssc-action-chip`」，不是別的錯誤，然後繼續往下做 Task 2～6，不要在這裡停下來修）。

- [ ] **Step 6: Commit**

```bash
git add src/composables/useSkillStudioConversation.ts src/composables/__tests__/useSkillStudioConversation.test.ts
git commit -m "refactor(skill-studio): extract routeAsNewIntent, remove chip actions from all gates"
```

---

### Task 2：關卡0 語意分類器

**Files:**
- Modify: `src/composables/useSkillStudioConversation.ts`

**Interfaces:**
- Consumes：Task 1 的 `routeAsNewIntent`。
- Produces：`function classifyGate0(text: string): 'build' | 'general' | null`（模組內部函式，定義在 `classifyIntent` 之後）；`handleGateMessage` 的 `'gate0'` 分支改用它。

- [ ] **Step 1: 寫失敗的測試**

接續 Task 1 的測試檔案，加入：

```ts
describe('classifyGate0（模組內部邏輯，透過 gateStage 行為驗證）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  async function toGate0(c: ReturnType<typeof useSkillStudioConversation>) {
    c.startCreate()
    c.chooseMethod('chat')
    const p = c.send('嗯我想想看要怎麼講這件事情才能講得清楚一點')
    await vi.advanceTimersByTimeAsync(800)
    await p
    expect(c.gateStage.value).toBe('gate0')
  }

  async function sendAndWait(c: ReturnType<typeof useSkillStudioConversation>, text: string) {
    const p = c.send(text)
    await vi.advanceTimersByTimeAsync(800)
    await p
  }

  it('本關比對到 build 語意（不是精確 chip 文字）：等同點了「記技能」', async () => {
    const c = useSkillStudioConversation()
    await toGate0(c)
    await sendAndWait(c, '我要記成技能')
    expect(c.gateStage.value).toBe('gate1')
  })

  it('本關比對到 general 語意（不是精確 chip 文字）：等同點了「單純問事情」', async () => {
    const c = useSkillStudioConversation()
    await toGate0(c)
    await sendAndWait(c, '我只是想問問題而已')
    expect(c.gateStage.value).toBe('intent')
    expect(c.messages.value.at(-1)!.content).toContain('還在學怎麼幫你直接處理')
  })

  it('本關比對不到、classifyIntent 判成 build：重定向到關卡一（新話題判斷）', async () => {
    const c = useSkillStudioConversation()
    await toGate0(c)
    await sendAndWait(c, '幫我建立一個新技能')
    expect(c.gateStage.value).toBe('gate1')
  })

  it('本關比對不到、classifyIntent 也判成 ambiguous：重新推一次關卡0的問句（效果上等同重問自己）', async () => {
    const c = useSkillStudioConversation()
    await toGate0(c)
    await sendAndWait(c, '今天天氣不錯')
    expect(c.gateStage.value).toBe('gate0')
    expect(c.messages.value.at(-1)!.content).toContain('記成 skill')
  })
})
```

- [ ] **Step 2: 執行測試確認新增的測試全部失敗**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts -t "classifyGate0"`
Expected: 全部 FAIL（目前 `'gate0'` 分支還是用 `t === GATE0_BUILD.label` 精確比對，這幾句話都比對不到、只會重推同一句問句，不會走到預期的 `gate1`／`intent`）。

- [ ] **Step 3: 加入 `classifyGate0`，修改 `'gate0'` 分支**

在 `classifyIntent` 函式定義之後（`findSimilarSkill` 之前）加入：

```ts
// 關卡0 專用的語意分類器：本關只有兩個選項，比對到就等同「點了這個選項」
function classifyGate0(text: string): 'build' | 'general' | null {
  if (/技能|skill|做法|規定|記(成|一個|下來)|建立|新增/i.test(text)) return 'build'
  if (/問|問題|單純|查詢|只是想知道/.test(text) || /[？?]/.test(text)) return 'general'
  return null
}
```

找到 `handleGateMessage` 裡的 `'gate0'` 分支：

```ts
    if (stage === 'gate0') {
      if (t === GATE0_BUILD.label) {
        routeBuildIntent(lastBuildText.value)
        return
      }
      if (t === GATE0_GENERAL.label) {
        push({ role: 'agent', content: NOT_IMPLEMENTED_REPLY })
        gateStage.value = 'intent'
        return
      }
      push({ role: 'agent', content: '你是要記成 skill，還是單純問事情？' })
      return
    }
```

改成：

```ts
    if (stage === 'gate0') {
      const g0 = classifyGate0(t)
      if (g0 === 'build') {
        routeBuildIntent(lastBuildText.value)
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
```

- [ ] **Step 4: 執行測試確認全部通過**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts`
Expected: 全部 PASS。

- [ ] **Step 5: Commit**

```bash
git add src/composables/useSkillStudioConversation.ts src/composables/__tests__/useSkillStudioConversation.test.ts
git commit -m "feat(skill-studio): gate0 semantic classifier with new-topic redirect"
```

---

### Task 3：關卡一語意分類器

**Files:**
- Modify: `src/composables/useSkillStudioConversation.ts`

**Interfaces:**
- Consumes：Task 1 的 `routeAsNewIntent`；Task 2 之後的 `classifyGate0`（不直接用，但同樣模式）。
- Produces：`function classifyGate1(text: string): 'new' | 'custom' | 'follow' | null`（定義在 `classifyGate0` 之後）；`handleGateMessage` 的 `'gate1'` 分支改用它。

- [ ] **Step 1: 寫失敗的測試**

接續 Task 2 的測試檔案，加入：

```ts
describe('classifyGate1（模組內部邏輯，透過 gateStage 行為驗證）', () => {
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

  async function toGate1(c: ReturnType<typeof useSkillStudioConversation>, buildText: string) {
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, buildText)
    expect(c.gateStage.value).toBe('gate1')
  }

  it('本關比對到「新的」語意（不是精確 chip 文字）：找不到相近做法 → clarify', async () => {
    const c = useSkillStudioConversation()
    await toGate1(c, '幫我建立一個新技能')
    await sendAndWait(c, '我想重新弄一份')
    expect(c.gateStage.value).toBe('clarify')
  })

  it('本關比對到「照規定」語意：推 TODO 佔位，gateStage 轉 active', async () => {
    const c = useSkillStudioConversation()
    await toGate1(c, '幫我建立一個新技能')
    await sendAndWait(c, '就沿用現有的規定就好')
    expect(c.gateStage.value).toBe('active')
    expect(c.messages.value.at(-1)!.content).toContain('還在學怎麼幫你直接處理')
  })

  it('本關比對不到，原始 bug 回報的兩句話之一：重定向到新話題判斷（classifyIntent 判成 ambiguous → 關卡0）', async () => {
    const c = useSkillStudioConversation()
    await toGate1(c, '幫我建立一個新技能')
    await sendAndWait(c, '把每週會議逐字稿整理成週報')
    expect(c.gateStage.value).toBe('gate0')
  })

  it('本關比對不到，但新話題判斷判成 build（清單仍非空）：直接重定向到關卡一，帶新的 lastBuildText', async () => {
    const store = useSkillStore()
    const c = useSkillStudioConversation()
    await toGate1(c, '幫我建立一個新技能')
    await sendAndWait(c, `幫我記一個${store.myPersonalSkills[0].name}的做法`)
    expect(c.gateStage.value).toBe('gate1')
    // 驗證真的是用新的這句話重新判斷（不是原地不動）：接著選「記一份新的」應該要能查到相近做法
    await sendAndWait(c, '我想重新弄一份')
    expect(c.gateStage.value).toBe('gate2')
  })
})
```

- [ ] **Step 2: 執行測試確認全部失敗**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts -t "classifyGate1"`
Expected: 全部 FAIL（`'gate1'` 分支目前還是精確比對 `GATE1_NEW.label` 等，比對不到就原地重推同一句問句，不會走到預期的 `clarify`／`active`／`gate0`）。

- [ ] **Step 3: 加入 `classifyGate1`，修改 `'gate1'` 分支**

在 `classifyGate0` 函式定義之後（`findSimilarSkill` 之前）加入：

```ts
// 關卡一專用的語意分類器
function classifyGate1(text: string): 'new' | 'custom' | 'follow' | null {
  if (/照(現有|規定|做)|沿用|用他|不用改|維持現況/.test(text)) return 'follow'
  if (/改(現有|規定)|客製|調整規定|修改規定/.test(text)) return 'custom'
  if (/新的|另外|重新|開一份|記一份|重新弄一份/.test(text)) return 'new'
  return null
}
```

找到 `handleGateMessage` 裡的 `'gate1'` 分支：

```ts
    if (stage === 'gate1') {
      if (t === GATE1_NEW.label || t === GATE1_CUSTOM.label) {
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
      if (t === GATE1_FOLLOW.label) {
        push({ role: 'agent', content: NOT_IMPLEMENTED_REPLY })
        gateStage.value = 'active'
        return
      }
      push({
        role: 'agent',
        content: '你現在要照公司的規定處理眼前這件事，還是要改規定、或是記一份新的?',
      })
      return
    }
```

改成：

```ts
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
```

- [ ] **Step 4: 執行測試確認全部通過**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts`
Expected: 全部 PASS。

- [ ] **Step 5: Commit**

```bash
git add src/composables/useSkillStudioConversation.ts src/composables/__tests__/useSkillStudioConversation.test.ts
git commit -m "feat(skill-studio): gate1 semantic classifier with new-topic redirect"
```

---

### Task 4：關卡二語意分類器

**Files:**
- Modify: `src/composables/useSkillStudioConversation.ts`

**Interfaces:**
- Consumes：Task 1 的 `routeAsNewIntent`。
- Produces：`function classifyGate2(text: string): 'follow' | 'edit' | 'new' | 'else' | null`（定義在 `classifyGate1` 之後）；`handleGateMessage` 的 `'gate2'` 分支改用它。

- [ ] **Step 1: 寫失敗的測試**

接續 Task 3 的測試檔案，加入：

```ts
describe('classifyGate2（模組內部邏輯，透過 gateStage 行為驗證）', () => {
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

  async function toGate2(c: ReturnType<typeof useSkillStudioConversation>, skillName: string) {
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, `幫我記一個${skillName}的做法`)
    await sendAndWait(c, '我想重新弄一份')
    expect(c.gateStage.value).toBe('gate2')
  }

  it('本關比對到「改他」語意：帶入該技能內容進入修改模式', async () => {
    const store = useSkillStore()
    const target = store.myPersonalSkills[0]
    const c = useSkillStudioConversation()
    await toGate2(c, target.name)
    await sendAndWait(c, '幫我修改他就好')
    expect(c.gateStage.value).toBe('active')
    expect(c.mode.value).toBe('edit')
    expect(c.savedSkillId.value).toBe(target.id)
  })

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
})
```

- [ ] **Step 2: 執行測試確認全部失敗**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts -t "classifyGate2"`
Expected: 全部 FAIL。

- [ ] **Step 3: 加入 `classifyGate2`，修改 `'gate2'` 分支**

在 `classifyGate1` 函式定義之後（`findSimilarSkill` 之前）加入：

```ts
// 關卡二專用的語意分類器
function classifyGate2(text: string): 'follow' | 'edit' | 'new' | 'else' | null {
  if (/照.{0,4}做|沿用他|用現有的/.test(text)) return 'follow'
  if (/改他|修改他|調整他|改一下(他|這個|這份)/.test(text)) return 'edit'
  if (/另外|新增一份|開一份新的|重新弄一份|不要沿用/.test(text)) return 'new'
  if (/講別的|別的事|其他事|換個話題|先不管這個|等一下再/.test(text)) return 'else'
  return null
}
```

找到 `handleGateMessage` 裡的 `'gate2'` 分支：

```ts
    if (stage === 'gate2') {
      if (t === GATE2_FOLLOW.label) {
        pendingSimilarSkillId.value = null
        gateStage.value = 'active'
        push({ role: 'agent', content: NOT_IMPLEMENTED_REPLY })
        return
      }
      if (t === GATE2_EDIT.label) {
        const id = pendingSimilarSkillId.value
        pendingSimilarSkillId.value = null
        if (id) loadSkill(id)
        return
      }
      if (t === GATE2_NEW.label) {
        pendingSimilarSkillId.value = null
        draft.value = { ...emptyDraft(), method: draft.value.method }
        gateStage.value = 'clarify'
        push({ role: 'agent', content: '好，那我們重新開一份。請描述這份做法的內容。' })
        return
      }
      if (t === GATE2_ELSE.label) {
        pausedDraft.value = {
          gateStage: 'gate2',
          messages: [...messages.value],
          draft: { ...draft.value },
          pendingSimilarSkillId: pendingSimilarSkillId.value,
        }
        pendingSimilarSkillId.value = null
        draft.value = { ...emptyDraft(), method: draft.value.method }
        messages.value = []
        gateStage.value = 'intent'
        push({ role: 'agent', content: '好，你想問什麼或想做什麼？' })
        return
      }
      const similar = pendingSimilarSkillId.value ? store.findSkill(pendingSimilarSkillId.value) : null
      push({
        role: 'agent',
        content: `您已經有一份「${similar?.name ?? ''}」，這次要沿用他、改他還是記一份新的？`,
      })
      return
    }
```

改成（前四個 `if` 只把判斷條件從 `t === X.label` 換成 `classifyGate2(t) === 'y'`，內容不變；最後的 fallback 從「重述本關訊息」換成「先清 `pendingSimilarSkillId`、再重定向」）：

```ts
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
        draft.value = { ...emptyDraft(), method: draft.value.method }
        messages.value = []
        gateStage.value = 'intent'
        push({ role: 'agent', content: '好，你想問什麼或想做什麼？' })
        return
      }
      pendingSimilarSkillId.value = null
      routeAsNewIntent(t)
      return
    }
```

**同 Task 1 的提醒**：上面的程式碼區塊一樣省略了 `GATE2_NEW`（保留 method）與 `GATE2_ELSE`（保留 method、刻意不重設 seq）這兩段既有註解——Task 1 應該已經把它們保留在檔案裡了，這個 Task 只是在同一段程式碼裡把 `t === GATE2_XXX.label` 換成 `g2 === 'xxx'`，**不要**連帶把這兩段註解也刪掉。

- [ ] **Step 4: 執行測試確認全部通過**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts`
Expected: 全部 PASS。

- [ ] **Step 5: Commit**

```bash
git add src/composables/useSkillStudioConversation.ts src/composables/__tests__/useSkillStudioConversation.test.ts
git commit -m "feat(skill-studio): gate2 semantic classifier with new-topic redirect"
```

---

### Task 5：關卡三語意分類器（不做新話題重定向）

**Files:**
- Modify: `src/composables/useSkillStudioConversation.ts`

**Interfaces:**
- Produces：`function classifyGate3(text: string): 'confirm' | 'retry' | null`（定義在 `classifyGate2` 之後）；`handleGateMessage` 的 `'gate3'` 分支改用它。**注意判斷順序**：`retry` 的關鍵字（`不對`）必須排在 `confirm`（`對`）**之前**檢查，否則「不對，我要改」會先被 `對` 誤判成 `confirm`。

- [ ] **Step 1: 寫失敗的測試**

接續 Task 4 的測試檔案，加入：

```ts
describe('classifyGate3（模組內部邏輯，透過 gateStage 行為驗證，不做新話題重定向）', () => {
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

  async function toGate3(c: ReturnType<typeof useSkillStudioConversation>) {
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '幫我建立一個新技能')
    await sendAndWait(c, '就改現有規定吧')
    await sendAndWait(c, '幫我建立一個能查 ERP 庫存的技能')
    await sendAndWait(c, '沒有漏了，請幫我寫成做法')
    expect(c.gateStage.value).toBe('gate3')
  }

  it('本關比對到「確認」語意（不是精確 chip 文字）：實際存檔', async () => {
    const store = useSkillStore()
    const before = store.myPersonalSkills.length
    const c = useSkillStudioConversation()
    await toGate3(c)
    await sendAndWait(c, '好的，沒問題')
    expect(c.gateStage.value).toBe('active')
    expect(store.myPersonalSkills.length).toBe(before + 1)
  })

  it('本關比對到「不對」語意：不會被「對」字誤判成確認，退回 clarify', async () => {
    const store = useSkillStore()
    const before = store.myPersonalSkills.length
    const c = useSkillStudioConversation()
    await toGate3(c)
    await sendAndWait(c, '不對，我打錯了')
    expect(c.gateStage.value).toBe('clarify')
    expect(store.myPersonalSkills.length).toBe(before)
  })

  it('本關比對不到：純文字重新描述選項，不呼叫 classifyIntent 重定向（草稿內容不因此被清空或跳關）', async () => {
    const c = useSkillStudioConversation()
    await toGate3(c)
    const nameBefore = c.draft.value.name
    await sendAndWait(c, '嗯')
    expect(c.gateStage.value).toBe('gate3')
    expect(c.draft.value.name).toBe(nameBefore)
    expect(c.messages.value.at(-1)!.content).not.toBe('') // 有換句話重述，不是空白
  })
})
```

- [ ] **Step 2: 執行測試確認全部失敗**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts -t "classifyGate3"`
Expected: 全部 FAIL（`'gate3'` 分支目前是精確比對 `GATE3_CONFIRM.label`／`GATE3_RETRY.label`，這幾句自由文字都比對不到，會落進目前的 fallback，但目前 fallback 推的訊息跟關卡三入口是同一句話，可能剛好符合某些斷言、但「不對」那句在**目前**程式碼下也還沒有機會被判成 confirm——先照做，這一步只需確認每個新測試案例真的因為預期原因失敗，不用逐一比對錯誤訊息）。

- [ ] **Step 3: 加入 `classifyGate3`，修改 `'gate3'` 分支**

在 `classifyGate2` 函式定義之後（`findSimilarSkill` 之前）加入：

```ts
// 關卡三專用的語意分類器。順序很重要：retry 的「不對」要先檢查，
// 否則「不對，我要改」會先被 confirm 規則裡的「對」字誤判
function classifyGate3(text: string): 'confirm' | 'retry' | null {
  if (/不對|不是|改一下|再改|不行|等等|漏了/.test(text)) return 'retry'
  if (/可以|對|沒問題|存吧|好的|確認|儲存|沒錯|就這樣/.test(text)) return 'confirm'
  return null
}
```

找到 `handleGateMessage` 裡的 `'gate3'` 分支：

```ts
    if (stage === 'gate3') {
      if (t === GATE3_CONFIRM.label) {
        const savedId = save()
        if (!savedId) {
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
      if (t === GATE3_RETRY.label) {
        gateStage.value = 'clarify'
        push({ role: 'agent', content: '好，繼續說你想怎麼調整。' })
        return
      }
      push({
        role: 'agent',
        content: `我準備幫您記成這份做法，內容如下：\n${formatDraftSummary(draft.value)}\n這樣可以嗎？`,
      })
      return
    }
```

改成（前兩個 `if` 只把判斷條件從 `t === X.label` 換成 `classifyGate3(t) === 'y'`，內容不變；fallback 換句話重述，**不**呼叫 `routeAsNewIntent`）：

```ts
    if (stage === 'gate3') {
      const g3 = classifyGate3(t)
      if (g3 === 'confirm') {
        const savedId = save()
        if (!savedId) {
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
```

- [ ] **Step 4: 執行測試確認全部通過**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts`
Expected: 全部 PASS。

- [ ] **Step 5: Commit**

```bash
git add src/composables/useSkillStudioConversation.ts src/composables/__tests__/useSkillStudioConversation.test.ts
git commit -m "feat(skill-studio): gate3 semantic classifier, no new-topic redirect"
```

---

### Task 6：改寫迴歸測試（chip 點擊 → 打字），整體驗收

**Files:**
- Modify: `src/components/__tests__/skillBuilderViewBox.test.ts`

**Interfaces:**
- Consumes：Task 1～5 完成後的整套 `handleGateMessage`（不再有 chip，全部靠語意分類與 `routeAsNewIntent`）。

- [ ] **Step 1: 找到目前需要改寫的測試**

在 `src/components/__tests__/skillBuilderViewBox.test.ts` 裡找到這個測試（Task 1 的 Step 5 已經確認它現在會 FAIL，因為畫面上不再有 `.ssc-action-chip`）：

```ts
  it('對話建立走到關卡二：聊天面板全程保持掛載，chip 選「另外新增一份」後不會被方式選擇畫面取代；另一實例 hydrate 同一份 gate2 快照後，點同一顆 chip 仍走關卡路由（不會誤判成自由輸入把 chip 文字寫進技能名稱）', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      const skillStore = useSkillStore()
      const target = skillStore.myPersonalSkills[0]

      // 訊息是累積的，舊訊息的 chip 也還留在 DOM 裡；只取「最後一則訊息」的 chip 才對得到
      // 「現在這一輪」該顯示的選項
      function lastChips(w: ReturnType<typeof mount>) {
        return w.findAll('.chat-bubble').at(-1)!.findAll('.ssc-action-chip')
      }

      async function reachGate2(w: ReturnType<typeof mount>) {
        await w.findAll('.smc-card')[0].trigger('click')
        await flushPromises()
        const input = w.find('.SkillStudioChat input.custom-input')
        await input.setValue(`幫我記一個${target.name}的做法`)
        await input.trigger('keydown.enter')
        await vi.advanceTimersByTimeAsync(800)
        await flushPromises()
        // 關卡一：聊天面板還在，chip 正確
        expect(w.find('.SkillStudioChat').exists()).toBe(true)
        const gate1Chips = lastChips(w)
        expect(gate1Chips.map(c => c.text())).toEqual(['記一份新的', '改現有規定（走客製路線）', '照現有規定'])
        await gate1Chips.find(c => c.text() === '記一份新的')!.trigger('click')
        await vi.advanceTimersByTimeAsync(800)
        await flushPromises()
        // 關卡二：找到相近做法，聊天面板還在、方式選擇畫面沒有出現，chip 帶技能名稱
        expect(w.find('.SkillMethodChooser').exists()).toBe(false)
        expect(w.find('.SkillStudioChat').exists()).toBe(true)
        const gate2Chips = lastChips(w)
        expect(gate2Chips.map(c => c.text())).toEqual(['照現有規定做', '改他', '另外新增一份', '我要講別的'])
        expect(w.find('.ssc-messages').text()).toContain(target.name)
      }

      // ── Critical #1：draft.value = emptyDraft() 會把 method 也清成 null，
      // SkillMethodChooser 就會取代掉正在推訊息進去的聊天面板 ──
      const a = mountBlock()
      await reachGate2(a.wrapper)
      await lastChips(a.wrapper).find(c => c.text() === '另外新增一份')!.trigger('click')
      await vi.advanceTimersByTimeAsync(800)
      await flushPromises()
      expect(a.wrapper.find('.SkillMethodChooser').exists()).toBe(false)
      expect(a.wrapper.find('.SkillStudioChat').exists()).toBe(true)
      expect(a.block.data.data.snapshot.draft.method).toBe('chat')
      expect(a.wrapper.find('.ssc-messages').text()).toContain('好，那我們重新開一份。請描述這份做法的內容。')

      // ── Important #2：另開一顆獨立的 block／實例，停在關卡二（不再往下點），
      // 讓第二個實例 hydrate 這份「卡在 gate2」的快照，驗證 gateStage 有沒有跟著還原 ──
      const b1 = mountBlock()
      await reachGate2(b1.wrapper)

      const b2 = mountOn(b1.id, b1.block)
      await flushPromises()
      const b2Gate2Chips = lastChips(b2)
      expect(b2Gate2Chips.map(c => c.text())).toEqual(['照現有規定做', '改他', '另外新增一份', '我要講別的'])

      // 在第二個實例點「另外新增一份」：若 hydrate 沒帶回 gateStage，第二個實例會停在預設值
      // 'active'，這句話會被當成自由輸入丟進舊版 interpretStudioMessage，直接把 chip 的文字
      // 寫進技能名稱；gateStage 正確還原成 'gate2' 的話，這裡應該正常走 GATE2_NEW：
      // 草稿清空、名稱維持空白，而不是變成「另外新增一份」
      await b2Gate2Chips.find(c => c.text() === '另外新增一份')!.trigger('click')
      await vi.advanceTimersByTimeAsync(800)
      await flushPromises()

      expect(b2.find('.SkillMethodChooser').exists()).toBe(false)
      expect(b2.find('.SkillStudioChat').exists()).toBe(true)
      expect(b1.block.data.data.snapshot.draft.name).toBe('')
      expect(b1.block.data.data.snapshot.draft.method).toBe('chat')
      expect(b2.find('.ssc-messages').text()).toContain('好，那我們重新開一份。請描述這份做法的內容。')
    } finally {
      vi.useRealTimers()
    }
  })
```

- [ ] **Step 2: 改寫成打字驅動**

整個測試（從 `it('對話建立走到關卡二...` 到對應的 `})`）改成：

```ts
  it('對話建立走到關卡二（改用打字驅動，不再有 chip）：聊天面板全程保持掛載，選「另外新增一份」後不會被方式選擇畫面取代；另一實例 hydrate 同一份 gate2 快照後，打同樣的話仍走關卡路由（不會誤判成自由輸入把文字寫進技能名稱）', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      const skillStore = useSkillStore()
      const target = skillStore.myPersonalSkills[0]

      async function type(w: ReturnType<typeof mount>, text: string) {
        const input = w.find('.SkillStudioChat input.custom-input')
        await input.setValue(text)
        await input.trigger('keydown.enter')
        await vi.advanceTimersByTimeAsync(800)
        await flushPromises()
      }

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

      // ── Critical #1（final review）：draft.value = emptyDraft() 會把 method 也清成 null，
      // SkillMethodChooser 就會取代掉正在推訊息進去的聊天面板；這裡改用打字後仍要成立 ──
      const a = mountBlock()
      await reachGate2(a.wrapper)
      await type(a.wrapper, '我想另外新增一份')
      expect(a.wrapper.find('.SkillMethodChooser').exists()).toBe(false)
      expect(a.wrapper.find('.SkillStudioChat').exists()).toBe(true)
      expect(a.block.data.data.snapshot.draft.method).toBe('chat')
      expect(a.wrapper.find('.ssc-messages').text()).toContain('好，那我們重新開一份。請描述這份做法的內容。')

      // ── Important #2（final review）：另開一顆獨立的 block／實例，停在關卡二（不再往下打），
      // 讓第二個實例 hydrate 這份「卡在 gate2」的快照，驗證 gateStage 有沒有跟著還原 ──
      const b1 = mountBlock()
      await reachGate2(b1.wrapper)

      const b2 = mountOn(b1.id, b1.block)
      await flushPromises()
      expect(b2.find('.ssc-messages').text()).toContain(target.name)

      // 在第二個實例打同一句話：若 hydrate 沒帶回 gateStage，第二個實例會停在預設值
      // 'active'，這句話會被當成自由輸入丟進舊版 interpretStudioMessage，直接把這句話
      // 寫進技能名稱；gateStage 正確還原成 'gate2' 的話，這裡應該正常走 classifyGate2 的
      // 'new' 分支：草稿清空、名稱維持空白，而不是變成這句話本身
      await type(b2, '我想另外新增一份')

      expect(b2.find('.SkillMethodChooser').exists()).toBe(false)
      expect(b2.find('.SkillStudioChat').exists()).toBe(true)
      expect(b1.block.data.data.snapshot.draft.name).toBe('')
      expect(b1.block.data.data.snapshot.draft.method).toBe('chat')
      expect(b2.find('.ssc-messages').text()).toContain('好，那我們重新開一份。請描述這份做法的內容。')
    } finally {
      vi.useRealTimers()
    }
  })
```

- [ ] **Step 3: 執行這個檔案確認全部通過**

Run: `npx vitest run src/components/__tests__/skillBuilderViewBox.test.ts`
Expected: 全部 PASS。

- [ ] **Step 4: 執行整體驗收**

Run: `npx vitest run`
Expected: 全部 PASS（既有測試數量 + Task 1～5 新增的測試數量，沒有任何失敗）。

Run: `npm run lint`
Expected: `useSkillStudioConversation.ts`／`useSkillStudioConversation.test.ts`／`skillBuilderViewBox.test.ts` 沒有新增的 lint 錯誤（既有、跟這次無關的錯誤不算；`GATE0_BUILD`／`GATE1_NEW` 等常數這次雖然不再被 `handleGateMessage` 內的字串比對引用，但它們仍然是模組層級 `export` 之外的常數、在檔案裡有其他既有引用或單純保留供未來 UI 顯示用——如果 lint 對「宣告了但沒被讀取」報錯，先確認是不是這幾個常數，若是，屬於這次計畫刻意保留的既有常數，不需要修，只需要在 Rulings 記錄下來給最終審查參考）。

Run: `npm run type-check`
Expected: 沒有新增的型別錯誤（已知的既有錯誤基準不變）。

手動／live 驗證（有本機 dev server 在跑的話，port 8088）：

1. 進「AI 賦能」，選「用對話建立」，打一句像原始回報的內容（例如先打「幫我建立一個新技能」進關卡一，再打「把每週會議逐字稿整理成週報」），確認畫面上完全沒有可點的按鈕，且第二句話有把你帶去某個地方（關卡0 或直接往下走），不是原地不動重複問句。
2. 走完整個流程到關卡三，確認全程沒有 chip 按鈕，用文字回覆「可以」、「不對」都能正確反應。
3. 打完全看不懂的內容（例如「嗯」），確認關卡三會換句話重新描述選項，不是逐字重複前一句。

- [ ] **Step 5: Commit**

```bash
git add src/components/__tests__/skillBuilderViewBox.test.ts
git commit -m "test(skill-studio): rewrite gate2 regression test to drive via typing, not chip clicks"
```

---

## 完成後的整體驗收

```bash
npx vitest run
npm run lint
npm run type-check
```

Expected：全部通過，`lint`／`type-check` 的既有錯誤數量跟本計畫開始前一致。
