# AI 賦能意圖判斷與關卡分流 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AI 賦能「用對話建立」路徑在使用者開口的第一時間先判斷意圖（建立/修改技能、一般問答、太模糊），太模糊或清單非空時走一連串關卡問清楚要沿用既有做法、改既有做法、還是開一份新的，確認到有明確內容後才交給既有的建立/修改邏輯接手。

**Architecture:** 在 `useSkillStudioConversation()` 內新增一個 `gateStage` 狀態機（`intent → gate0/gate1 → gate2 → clarify → gate3 → active`），只在「用對話建立」且 `gateStage !== 'active'` 時攔截 `send()`；一旦分流完畢（`gateStage = 'active'`），後續訊息照舊交給既有、完全不改的 `interpretStudioMessage`。所有關卡選項沿用既有的 quick-reply chip 機制（`StudioAction`/`actions`），畫面端 `SkillStudioChat.vue` 不需要任何改動。

**Tech Stack:** Vue 3 `<script setup>` Composition API、TypeScript、Vitest。

**Spec:** `docs/superpowers/specs/2026-09-22-ai-empower-intent-gate-design.md`

## Global Constraints

- 只影響 chat 方式（`draft.method === 'chat'`）；積木組裝路徑完全不動。
- `interpretStudioMessage` 函式本身、`SkillStudioChat.vue`、`SkillStudio.vue` 皆不修改；只改 `useSkillStudioConversation.ts` 一個檔案（加測試檔）。
- 有 prefill 進來的 `startCreate(prefill, ...)`（方案三 conv4 交接等）與 `loadSkill(...)`（`?skillId=` 修改既有技能）一律 `gateStage = 'active'`，完全略過整套關卡。
- 「一般問答」「套用既有技能去做」「照現有規定做」三個分支這次只做到分類正確＋固定 TODO 佔位回覆，不做真正的執行或對話測試銜接。
- 所有關卡選項文字必須跟 spec 逐字一致（見下方每個 Task 給的常數）。
- 暫存草稿（「我要講別的」）只存在單次連線的記憶體內（一個 `ref`），不寫入 `skillStore.ts`、不跟現有 `myDrafts`/`DraftSkill` 共用或互動。

---

## 檔案結構

這次全部改動集中在兩個檔案：

- `src/composables/useSkillStudioConversation.ts`：新增型別（`GateStage`、`PausedDraft`）、純函式（`classifyIntent`、`findSimilarSkill`、`wantsToResume`、`formatDraftSummary`）、關卡 chip 常數，以及 `useSkillStudioConversation()` 內新增的狀態與 `handleGateMessage()` 內部函式，並修改 `startCreate`／`loadSkill`／`chooseMethod`／`send` 四個既有函式。
- `src/composables/__tests__/useSkillStudioConversation.test.ts`：新增測試（既有測試不動，除非本計畫明確指出）。

---

### Task 1：型別、純函式與關卡 chip 常數

**Files:**
- Modify: `src/composables/useSkillStudioConversation.ts`（頂層，`useSkillStudioConversation()` 函式定義之前）
- Test: `src/composables/__tests__/useSkillStudioConversation.test.ts`（新增一個獨立的 `describe` 區塊，不動既有內容）

**Interfaces:**
- Produces：
  - `export type GateStage = 'intent' | 'gate0' | 'gate1' | 'checkingRules' | 'gate2' | 'clarify' | 'gate3' | 'active'`
  - `export interface PausedDraft { gateStage: GateStage; messages: StudioMessage[]; draft: SkillDraft; pendingSimilarSkillId: string | null }`
  - `export function classifyIntent(text: string): 'build' | 'general' | 'ambiguous'`
  - `export function findSimilarSkill(text: string, skills: Skill[]): Skill | null`
  - `export function wantsToResume(text: string, paused: PausedDraft): boolean`
  - `export function formatDraftSummary(draft: SkillDraft): string`
  - 模組層級（非 export，檔案內部共用）：`GATE0_BUILD`、`GATE0_GENERAL`、`GATE1_NEW`、`GATE1_CUSTOM`、`GATE1_FOLLOW`、`GATE2_FOLLOW`、`GATE2_EDIT`、`GATE2_NEW`、`GATE2_ELSE`、`GATE3_CONFIRM`、`GATE3_RETRY`（都是 `StudioAction`）、`CLARIFY_DONE_HINT`（RegExp）、`NOT_IMPLEMENTED_REPLY`（string）

- [ ] **Step 1: 寫失敗的測試**

`src/composables/__tests__/useSkillStudioConversation.test.ts` 檔案開頭已經有這段既有 import（不要重複加、只要照下面的版本擴充成員清單）：

```ts
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useSkillStore } from '@/stores/skillStore'
import {
  DEFAULT_OPENING_MESSAGE,
  deriveFromSections,
  emptyDraft,
  extractSkillName,
  interpretStudioMessage,
  useSkillStudioConversation,
} from '@/composables/useSkillStudioConversation'
```

把最後一個 `import { ... } from '@/composables/useSkillStudioConversation'` 那個區塊改成（加入這個 Task 新增的成員，`emptyDraft`／`useSkillStudioConversation` 等既有成員不要重複列兩次）：

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
import type { Skill, PausedDraft } from '@/composables/useSkillStudioConversation'
```

（`Skill` 型別若既有 import 裡已經有就不用重複加；目前這個檔案還沒有 import `Skill`，所以這是新加的一行。）

接著在檔案**最後面**（最後一個既有 `})` 之後）加入新的 `describe` 區塊，不要動前面任何既有內容：

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

describe('findSimilarSkill', () => {
  const skills: Skill[] = [
    {
      id: 's1', name: '產品銷售報告整理', description: '', type: 'extension', origin: 'manually_created',
      version: '初始版本', isEnabled: true, usageCount: 0, testPassRate: 0, avgLatencyMs: 0,
      triggerHint: '查詢銷售資料', instructions: '整理銷售報告',
    },
  ]

  it('有關鍵字重疊時回傳分數最高的技能', () => {
    expect(findSimilarSkill('我要處理銷售報告的事情', skills)?.id).toBe('s1')
  })

  it('沒有重疊回傳 null', () => {
    expect(findSimilarSkill('今天天氣真好', skills)).toBeNull()
  })

  it('空字串回傳 null', () => {
    expect(findSimilarSkill('', skills)).toBeNull()
  })
})

describe('wantsToResume', () => {
  const paused: PausedDraft = {
    gateStage: 'gate2',
    messages: [],
    draft: { ...emptyDraft(), name: '產品銷售報告整理' },
    pendingSimilarSkillId: null,
  }

  it('含接續關鍵字 → true', () => {
    expect(wantsToResume('我們繼續剛才的', paused)).toBe(true)
    expect(wantsToResume('回到上次那個', paused)).toBe(true)
  })

  it('直接提到暫存草稿名稱 → true', () => {
    expect(wantsToResume('產品銷售報告整理那份要怎麼弄', paused)).toBe(true)
  })

  it('都沒有 → false', () => {
    expect(wantsToResume('今天天氣真好', paused)).toBe(false)
  })

  it('暫存草稿沒有名稱時，不會誤判空字串包含在任何話裡', () => {
    const noName: PausedDraft = { ...paused, draft: { ...emptyDraft() } }
    expect(wantsToResume('今天天氣真好', noName)).toBe(false)
  })
})

describe('formatDraftSummary', () => {
  it('整理草稿目前欄位成摘要文字', () => {
    const draft = {
      ...emptyDraft(),
      name: '產品銷售報告整理',
      triggerHint: '查詢銷售資料時',
      instructions: '1. 查詢資料\n2. 產出報告',
      capabilities: [{ name: '查詢資料', description: '' }],
    }
    const summary = formatDraftSummary(draft)
    expect(summary).toContain('產品銷售報告整理')
    expect(summary).toContain('查詢銷售資料時')
    expect(summary).toContain('查詢資料')
  })

  it('欄位是空的時候顯示未設定提示，不是空字串', () => {
    const summary = formatDraftSummary(emptyDraft())
    expect(summary).not.toContain('名稱：\n')
    expect(summary).toContain('未命名')
  })
})
```

- [ ] **Step 2: 執行測試確認全部失敗**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts -t "classifyIntent|findSimilarSkill|wantsToResume|formatDraftSummary"`
Expected: 全部 FAIL（`does not provide an export named 'classifyIntent'` 之類的錯誤，因為這些函式還不存在）。

- [ ] **Step 3: 在 `useSkillStudioConversation.ts` 加入型別與純函式**

在檔案裡找到這一段（現有內容，緊接在 `emptyDraft()` 函式定義之後）：

```ts
export function emptyDraft(): SkillDraft {
  return { name: '', description: '', instructions: '', triggerHint: '', capabilities: [], files: [], method: null, sectionIds: [] }
}
```

在它後面加入：

```ts
// ── 意圖判斷與關卡分流（AI 賦能「用對話建立」路徑，接在既有解析規則之前）──

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

// 「我要講別的」時的暫存快照：只存在單次連線的記憶體內（一個 ref），
// 不寫入 skillStore、離開頁面或重新整理就消失，跟 skillStore 既有的
// myDrafts／DraftSkill（Library／企業技能送審草稿）完全無關
export interface PausedDraft {
  gateStage: GateStage
  messages: StudioMessage[]
  draft: SkillDraft
  pendingSimilarSkillId: string | null
}

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

// 規則式比對使用者描述跟既有個人技能的 name／triggerHint／instructions 有沒有重疊，
// 回傳重疊分數最高的那一顆；沒有重疊回傳 null。
//
// 用「連續中文字元」切詞（/[一-龥]{2,}/）在這裡行不通：使用者一句話通常是一整串
// 中文、中間沒有空格或標點斷開（例如「我要處理銷售報告的事情」），regex 會把整句話
// 貪婪比對成單一一個「詞」，永遠不可能完整出現在技能名稱／說明這種短很多的字串裡，
// 等於這個函式永遠回傳 null。改用「二字滑動窗」（character bigram）算重疊比例，
// 不需要真的中文斷詞也能抓出「兩段文字有沒有提到同樣的詞彙」，是這類輕量比對常見的做法。
export function findSimilarSkill(text: string, skills: Skill[]): Skill | null {
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

const RESUME_HINTS = /繼續|剛才|接著|接續|回到|上次那個/

// 是否要接回被「我要講別的」中斷的草稿：訊息裡有接續關鍵字，或直接提到暫存草稿的名稱
export function wantsToResume(text: string, paused: PausedDraft): boolean {
  return RESUME_HINTS.test(text) || (!!paused.draft.name && text.includes(paused.draft.name))
}

// 關卡三要顯示的草稿內容摘要
export function formatDraftSummary(draft: SkillDraft): string {
  const lines = [
    `名稱：${draft.name || '（未命名）'}`,
    `觸發時機：${draft.triggerHint || '（未設定）'}`,
    `指令：${draft.instructions || '（未撰寫）'}`,
  ]
  if (draft.capabilities.length) {
    lines.push(`覆蓋能力：${draft.capabilities.map(c => c.name).join('、')}`)
  }
  return lines.join('\n')
}

const GATE0_BUILD: StudioAction = { id: 'gate0-build', label: '記技能' }
const GATE0_GENERAL: StudioAction = { id: 'gate0-general', label: '單純問事情' }

const GATE1_NEW: StudioAction = { id: 'gate1-new', label: '記一份新的' }
const GATE1_CUSTOM: StudioAction = { id: 'gate1-custom', label: '改現有規定（走客製路線）' }
const GATE1_FOLLOW: StudioAction = { id: 'gate1-follow', label: '照現有規定' }

const GATE2_FOLLOW: StudioAction = { id: 'gate2-follow', label: '照現有規定做' }
const GATE2_EDIT: StudioAction = { id: 'gate2-edit', label: '改他' }
const GATE2_NEW: StudioAction = { id: 'gate2-new', label: '另外新增一份' }
const GATE2_ELSE: StudioAction = { id: 'gate2-else', label: '我要講別的' }

const GATE3_CONFIRM: StudioAction = { id: 'gate3-confirm', label: '這樣可以，存到個人技能' }
const GATE3_RETRY: StudioAction = { id: 'gate3-retry', label: '不對，我要改' }

const CLARIFY_DONE_HINT = /沒有漏了|寫成做法|可以寫了|這樣就好/

const NOT_IMPLEMENTED_REPLY = '這部分我還在學怎麼幫你直接處理，目前只能先帶你到技能建立/修改的流程。之後會補上「直接套用技能」的功能。'
```

- [ ] **Step 4: 執行測試確認全部通過**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts -t "classifyIntent|findSimilarSkill|wantsToResume|formatDraftSummary"`
Expected: 全部 PASS。

- [ ] **Step 5: 跑一次既有測試確認沒有連帶弄壞**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts`
Expected: 全部 PASS（這步只加了新的型別／函式／常數，沒有改動任何既有函式的行為）。

- [ ] **Step 6: Commit**

```bash
git add src/composables/useSkillStudioConversation.ts src/composables/__tests__/useSkillStudioConversation.test.ts
git commit -m "feat(skill-studio): add gate-flow types, pure helpers, and chip constants"
```

---

### Task 2：狀態接線、進入點與意圖判斷（§4）

**Files:**
- Modify: `src/composables/useSkillStudioConversation.ts`

**Interfaces:**
- Consumes：Task 1 的 `GateStage`、`classifyIntent`、`GATE0_BUILD`／`GATE0_GENERAL`／`GATE1_NEW`／`GATE1_CUSTOM`／`GATE1_FOLLOW`、`NOT_IMPLEMENTED_REPLY`。
- Produces：
  - `useSkillStudioConversation()` 回傳值新增 `gateStage: Ref<GateStage>`。
  - 內部（非回傳）新增 `pendingSimilarSkillId = ref<string | null>(null)`、`pausedDraft = ref<PausedDraft | null>(null)`、`lastBuildText = ref('')`。
  - 內部函式 `routeBuildIntent(text: string): void`、`handleGateMessage(text: string): void`（這個 Task 只實作 `handleGateMessage` 對 `gateStage.value === 'intent'` 這個分支；Task 3 會繼續往裡面加 `'gate0'`／`'gate1'` 分支，同一個函式、後續 Task 直接接著加 `if` 區塊）。

- [ ] **Step 1: 寫失敗的測試**

在 `src/composables/__tests__/useSkillStudioConversation.test.ts` 的 Task 1 新增內容後面，繼續加（`useSkillStudioConversation`、`setActivePinia`／`createPinia`、`vi` 都已經在檔案開頭 import 過，不用再加）：

```ts
describe('gateStage：進入點', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('全新對話（無 prefill）選「用對話建立」：gateStage 是 intent，且推一句開場白（不是既有 DEFAULT_OPENING_MESSAGE）', () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    expect(c.gateStage.value).toBe('intent')
    expect(c.messages.value).toHaveLength(1)
    expect(c.messages.value[0].role).toBe('agent')
  })

  it('有 prefill（例如方案三 conv4 交接）：gateStage 直接是 active，略過整套關卡', () => {
    const c = useSkillStudioConversation()
    c.startCreate({ name: '產品銷售報告整理' }, '開場白')
    expect(c.gateStage.value).toBe('active')
  })

  it('loadSkill（修改既有技能）：gateStage 直接是 active', () => {
    const c = useSkillStudioConversation()
    expect(c.loadSkill('personal-001')).toBe(true)
    expect(c.gateStage.value).toBe('active')
  })
})

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

  it('清單非空＋建立意圖：gateStage 轉 gate1，推出三個選項', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '幫我建立一個新技能')
    expect(c.gateStage.value).toBe('gate1')
    const last = c.messages.value.at(-1)!
    expect(last.actions?.map(a => a.label)).toEqual(['記一份新的', '改現有規定（走客製路線）', '照現有規定'])
  })

  it('一般問答意圖：推 TODO 佔位訊息，gateStage 維持 intent', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '現在庫存多少？')
    expect(c.gateStage.value).toBe('intent')
    expect(c.messages.value.at(-1)!.content).toContain('還在學怎麼幫你直接處理')
  })

  it('太模糊：gateStage 轉 gate0，推兩個選項', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '嗯我想想看要怎麼講這件事情才能講得清楚一點')
    expect(c.gateStage.value).toBe('gate0')
    const last = c.messages.value.at(-1)!
    expect(last.actions?.map(a => a.label)).toEqual(['記技能', '單純問事情'])
  })
})
```

`useSkillStore` 需要 import：在測試檔頂端既有 import 區塊裡確認有 `import { useSkillStore } from '@/stores/skillStore'`（既有測試檔應該已經有，若沒有請加上；不要重複 import）。

- [ ] **Step 2: 執行測試確認全部失敗**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts -t "gateStage：進入點|意圖判斷"`
Expected: 全部 FAIL（`gateStage` 還不存在於回傳值裡）。

- [ ] **Step 3: 修改 `chooseMethod`**

現有（`useSkillStudioConversation()` 內）：

```ts
  function chooseMethod(method: StudioMethod): void {
    if (draft.value.method) return
    draft.value = { ...draft.value, method }
    if (method === 'chat' && messages.value.length === 0) push({ role: 'agent', content: DEFAULT_OPENING_MESSAGE })
  }
```

改成：

```ts
  function chooseMethod(method: StudioMethod): void {
    if (draft.value.method) return
    draft.value = { ...draft.value, method }
    if (method === 'chat' && messages.value.length === 0) {
      gateStage.value = 'intent'
      push({ role: 'agent', content: GATE_OPENING_MESSAGE })
    }
  }
```

在檔案裡 `DEFAULT_OPENING_MESSAGE` 常數定義處（`export const DEFAULT_OPENING_MESSAGE = ...`）後面加一個新常數（`DEFAULT_OPENING_MESSAGE` 本身不要刪，`loadSkill`／其他既有路徑不受影響，繼續存在）：

```ts
const GATE_OPENING_MESSAGE = '你好，我是這裡的助理。想記一個新做法、調整既有的，還是有其他問題，都可以直接跟我說。'
```

- [ ] **Step 4: 修改 `startCreate` 與 `loadSkill`，加入 `gateStage` 賦值**

現有 `startCreate`：

```ts
  function startCreate(prefill?: Partial<SkillDraft>, openingMessage?: string): void {
    mode.value = 'create'
    savedSkillId.value = null
    const base = emptyDraft()
    draft.value = {
      ...base,
      ...prefill,
      capabilities: (prefill?.capabilities ?? base.capabilities).map(c => ({ ...c })),
      files: [...(prefill?.files ?? base.files)],
      sectionIds: [...(prefill?.sectionIds ?? base.sectionIds)],
      method: prefill ? 'chat' : null,
    }
    snapshot.value = serialize(emptyDraft())
    messages.value = []
    seq = 0
    if (prefill) push({ role: 'agent', content: openingMessage ?? DEFAULT_OPENING_MESSAGE })
  }
```

改成（只加 `gateStage.value = ...` 那一行，其餘不動）：

```ts
  function startCreate(prefill?: Partial<SkillDraft>, openingMessage?: string): void {
    mode.value = 'create'
    savedSkillId.value = null
    const base = emptyDraft()
    draft.value = {
      ...base,
      ...prefill,
      capabilities: (prefill?.capabilities ?? base.capabilities).map(c => ({ ...c })),
      files: [...(prefill?.files ?? base.files)],
      sectionIds: [...(prefill?.sectionIds ?? base.sectionIds)],
      method: prefill ? 'chat' : null,
    }
    snapshot.value = serialize(emptyDraft())
    messages.value = []
    seq = 0
    // 有 prefill：來源（例如方案三 conv4 交接）已經知道使用者要幹嘛，略過整套關卡
    gateStage.value = prefill ? 'active' : 'intent'
    if (prefill) push({ role: 'agent', content: openingMessage ?? DEFAULT_OPENING_MESSAGE })
  }
```

現有 `loadSkill`：

```ts
  function loadSkill(skillId: string): boolean {
    const s = store.findSkill(skillId)
    if (!s || s.zone !== 'personal') return false
    mode.value = 'edit'
    savedSkillId.value = skillId
    draft.value = draftFromSkill(s)
    snapshot.value = serialize(draft.value)
    messages.value = []
    if (draft.value.method === 'chat') push({ role: 'agent', content: `我們來調整「${s.name}」。告訴我想改哪裡，右側會即時反映。` })
    return true
  }
```

改成（只加一行）：

```ts
  function loadSkill(skillId: string): boolean {
    const s = store.findSkill(skillId)
    if (!s || s.zone !== 'personal') return false
    mode.value = 'edit'
    savedSkillId.value = skillId
    draft.value = draftFromSkill(s)
    snapshot.value = serialize(draft.value)
    messages.value = []
    gateStage.value = 'active'  // 修改既有技能：已經知道要幹嘛，不用再問一輪
    if (draft.value.method === 'chat') push({ role: 'agent', content: `我們來調整「${s.name}」。告訴我想改哪裡，右側會即時反映。` })
    return true
  }
```

- [ ] **Step 5: 新增狀態與 `routeBuildIntent`／`handleGateMessage`，接進 `send`**

在 `useSkillStudioConversation()` 函式內，找到：

```ts
  const mode = ref<StudioMode>('create')
  const savedSkillId = ref<string | null>(null)
  const draft = ref<SkillDraft>(emptyDraft())
  const snapshot = ref(serialize(draft.value))
  const messages = ref<StudioMessage[]>([])
  const isRunning = ref(false)
  let seq = 0
```

改成（新增四行狀態）：

```ts
  const mode = ref<StudioMode>('create')
  const savedSkillId = ref<string | null>(null)
  const draft = ref<SkillDraft>(emptyDraft())
  const snapshot = ref(serialize(draft.value))
  const messages = ref<StudioMessage[]>([])
  const isRunning = ref(false)
  let seq = 0

  const gateStage = ref<GateStage>('active')
  const pendingSimilarSkillId = ref<string | null>(null)
  const pausedDraft = ref<PausedDraft | null>(null)
  const lastBuildText = ref('')
```

（`gateStage` 初始值訂為 `'active'`：composable 一建立、還沒呼叫 `startCreate`／`chooseMethod` 前不應該卡在任何關卡；`startCreate`／`chooseMethod` 會依情況覆蓋這個初始值，跟現有 `mode`/`draft` 等狀態的初始化模式一致。）

在 `function push(m: Omit<StudioMessage, 'id'>) { ... }` 定義後面（`startCreate` 定義之前）加入：

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
      actions: [GATE1_NEW, GATE1_CUSTOM, GATE1_FOLLOW],
    })
  }

  // gateStage !== 'active' 時，每則訊息都先經過這裡；後續 Task 會繼續往這個函式加 if 分支
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
  }
```

現有 `send`：

```ts
  async function send(text: string): Promise<void> {
    const t = text.trim()
    if (!t || isRunning.value) return
    push({ role: 'user', content: t })
    isRunning.value = true
    await new Promise(r => setTimeout(r, 800))
    const reply = interpretStudioMessage(t, draft.value, mode.value)
    if (reply.patch) draft.value = { ...draft.value, ...reply.patch }
    push({ role: 'agent', content: reply.content, actions: reply.actions })
    isRunning.value = false
  }
```

改成：

```ts
  async function send(text: string): Promise<void> {
    const t = text.trim()
    if (!t || isRunning.value) return
    push({ role: 'user', content: t })
    isRunning.value = true
    await new Promise(r => setTimeout(r, 800))
    if (gateStage.value === 'active') {
      const reply = interpretStudioMessage(t, draft.value, mode.value)
      if (reply.patch) draft.value = { ...draft.value, ...reply.patch }
      push({ role: 'agent', content: reply.content, actions: reply.actions })
    } else {
      handleGateMessage(t)
    }
    isRunning.value = false
  }
```

（Task 6 會在 `push({ role: 'user', ... })` 之後、`if (gateStage.value === 'active')` 之前，再插入暫存草稿的接續判斷；這個 Task 先不用管。）

- [ ] **Step 6: 加入 `gateStage` 到回傳值**

現有：

```ts
  return {
    mode, savedSkillId, draft, messages, isRunning, isDirty, canSave, suggestionChips,
    startCreate, chooseMethod, updateBlocks, loadSkill, send, save, updateFiles, toSnapshot, hydrate, detachSavedSkill,
  }
```

改成：

```ts
  return {
    mode, savedSkillId, draft, messages, isRunning, isDirty, canSave, suggestionChips, gateStage,
    startCreate, chooseMethod, updateBlocks, loadSkill, send, save, updateFiles, toSnapshot, hydrate, detachSavedSkill,
  }
```

- [ ] **Step 7: 執行測試確認全部通過**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts`
Expected: 全部 PASS（含 Task 1 的測試、這個 Task 新加的測試，以及檔案裡原本就有的既有測試——`loadSkill`／`startCreate` 相關的既有測試不應該因為多了 `gateStage.value = 'active'` 這行而壞掉，因為它們原本就不檢查 `gateStage`）。

- [ ] **Step 8: Commit**

```bash
git add src/composables/useSkillStudioConversation.ts src/composables/__tests__/useSkillStudioConversation.test.ts
git commit -m "feat(skill-studio): wire gateStage state, entry points, and intent routing"
```

---

### Task 3：關卡 0、關卡一、相似做法比對（§5-§7）

**Files:**
- Modify: `src/composables/useSkillStudioConversation.ts`

**Interfaces:**
- Consumes：Task 2 的 `handleGateMessage`（繼續往裡面加 `if` 分支）、`routeBuildIntent`、`lastBuildText`、`pendingSimilarSkillId`；Task 1 的 `findSimilarSkill`、`GATE0_*`／`GATE1_*`／`GATE2_*` 常數。
- Produces：`handleGateMessage` 新增對 `gateStage.value === 'gate0'` 與 `'gate1'` 的處理（`'gate2'` 的**分流訊息推播**在這個 Task 做，實際的四個選項處理留給 Task 4）。

- [ ] **Step 1: 寫失敗的測試**

接續 Task 2 的測試檔案，加入：

```ts
describe('關卡 0／關卡一／相似做法比對', () => {
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

  it('關卡0 點「記技能」：等同建立意圖，清單非空時轉關卡一', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '嗯我想想看要怎麼講這件事情才能講得清楚一點')
    expect(c.gateStage.value).toBe('gate0')
    await sendAndWait(c, '記技能')
    expect(c.gateStage.value).toBe('gate1')
  })

  it('關卡0 點「單純問事情」：推 TODO 佔位，gateStage 回 intent', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '嗯我想想看要怎麼講這件事情才能講得清楚一點')
    await sendAndWait(c, '單純問事情')
    expect(c.gateStage.value).toBe('intent')
    expect(c.messages.value.at(-1)!.content).toContain('還在學怎麼幫你直接處理')
  })

  it('關卡一選「照現有規定」：推 TODO 佔位，gateStage 轉 active', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '幫我建立一個新技能')
    expect(c.gateStage.value).toBe('gate1')
    await sendAndWait(c, '照現有規定')
    expect(c.gateStage.value).toBe('active')
    expect(c.messages.value.at(-1)!.content).toContain('還在學怎麼幫你直接處理')
  })

  it('關卡一選「記一份新的」，找到相近做法：gateStage 轉 gate2，訊息帶技能名稱', async () => {
    const store = useSkillStore()
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, `幫我記一個${store.myPersonalSkills[0].name}的做法`)
    expect(c.gateStage.value).toBe('gate1')
    await sendAndWait(c, '記一份新的')
    expect(c.gateStage.value).toBe('gate2')
    const last = c.messages.value.at(-1)!
    expect(last.content).toContain(store.myPersonalSkills[0].name)
    expect(last.actions?.map(a => a.label)).toEqual(['照現有規定做', '改他', '另外新增一份', '我要講別的'])
  })

  it('關卡一選「改現有規定（走客製路線）」，找不到相近做法：gateStage 轉 clarify', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '幫我建立一個新技能')
    await sendAndWait(c, '改現有規定（走客製路線）')
    expect(c.gateStage.value).toBe('clarify')
  })
})
```

- [ ] **Step 2: 執行測試確認全部失敗**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts -t "關卡 0／關卡一"`
Expected: 全部 FAIL 或行為不符（目前 `handleGateMessage` 對 `'gate0'`／`'gate1'` 沒有任何處理，訊息會被忽略、`gateStage` 不會變動）。

- [ ] **Step 3: 擴充 `handleGateMessage`**

找到 Task 2 寫的 `handleGateMessage`：

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
  }
```

在 `if (stage === 'intent') { ... return }` 這個區塊後面（同一個函式內，`}` 之前）加入兩個新區塊：

```ts
    if (stage === 'gate0') {
      if (t === GATE0_BUILD.label) {
        routeBuildIntent(lastBuildText.value)
        return
      }
      if (t === GATE0_GENERAL.label) {
        push({ role: 'agent', content: NOT_IMPLEMENTED_REPLY })
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
```

- [ ] **Step 4: 執行測試確認全部通過**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts`
Expected: 全部 PASS。

- [ ] **Step 5: Commit**

```bash
git add src/composables/useSkillStudioConversation.ts src/composables/__tests__/useSkillStudioConversation.test.ts
git commit -m "feat(skill-studio): gate0/gate1 routing and similar-skill lookup"
```

---

### Task 4：關卡二與暫存草稿（§8、§10）

**Files:**
- Modify: `src/composables/useSkillStudioConversation.ts`

**Interfaces:**
- Consumes：Task 3 的 `handleGateMessage`（繼續加 `'gate2'` 分支）；Task 2 的 `pendingSimilarSkillId`、`pausedDraft`、`loadSkill`；Task 1 的 `GATE2_*` 常數、`PausedDraft`。

- [ ] **Step 1: 寫失敗的測試**

```ts
describe('關卡二與暫存草稿', () => {
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

  async function reachGate2(c: ReturnType<typeof useSkillStudioConversation>, skillName: string) {
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, `幫我記一個${skillName}的做法`)
    await sendAndWait(c, '記一份新的')
  }

  it('關卡二選「照現有規定做」：推 TODO 佔位，gateStage 轉 active，清掉 pendingSimilarSkillId', async () => {
    const store = useSkillStore()
    const c = useSkillStudioConversation()
    await reachGate2(c, store.myPersonalSkills[0].name)
    expect(c.gateStage.value).toBe('gate2')
    await sendAndWait(c, '照現有規定做')
    expect(c.gateStage.value).toBe('active')
    expect(c.messages.value.at(-1)!.content).toContain('還在學怎麼幫你直接處理')
  })

  it('關卡二選「改他」：帶入該技能內容進入修改模式，gateStage 轉 active', async () => {
    const store = useSkillStore()
    const target = store.myPersonalSkills[0]
    const c = useSkillStudioConversation()
    await reachGate2(c, target.name)
    await sendAndWait(c, '改他')
    expect(c.gateStage.value).toBe('active')
    expect(c.mode.value).toBe('edit')
    expect(c.savedSkillId.value).toBe(target.id)
    expect(c.draft.value.name).toBe(target.name)
  })

  it('關卡二選「另外新增一份」：空白開始，gateStage 轉 clarify，草稿沒有帶入相近技能的內容', async () => {
    const store = useSkillStore()
    const target = store.myPersonalSkills[0]
    const c = useSkillStudioConversation()
    await reachGate2(c, target.name)
    await sendAndWait(c, '另外新增一份')
    expect(c.gateStage.value).toBe('clarify')
    expect(c.draft.value.name).toBe('')
    expect(c.draft.value.instructions).toBe('')
  })

  it('關卡二選「我要講別的」：暫存目前對話與草稿，gateStage 回 intent 處理新話題', async () => {
    const store = useSkillStore()
    const target = store.myPersonalSkills[0]
    const c = useSkillStudioConversation()
    await reachGate2(c, target.name)
    const messagesBeforePause = c.messages.value.length
    await sendAndWait(c, '我要講別的')
    expect(c.gateStage.value).toBe('intent')
    expect(c.messages.value.length).toBeLessThan(messagesBeforePause)
    // 換個新話題照常走一輪意圖判斷
    await sendAndWait(c, '現在庫存多少？')
    expect(c.messages.value.at(-1)!.content).toContain('還在學怎麼幫你直接處理')
  })
})
```

- [ ] **Step 2: 執行測試確認全部失敗**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts -t "關卡二與暫存草稿"`
Expected: 全部 FAIL（`handleGateMessage` 對 `'gate2'` 還沒有處理，訊息會被忽略）。

- [ ] **Step 3: 擴充 `handleGateMessage`**

在 `handleGateMessage` 函式內，`if (stage === 'gate1') { ... return }` 區塊後面加入：

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
        draft.value = emptyDraft()
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
        draft.value = emptyDraft()
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
      const similar = pendingSimilarSkillId.value ? store.findSkill(pendingSimilarSkillId.value) : null
      push({
        role: 'agent',
        content: `您已經有一份「${similar?.name ?? ''}」，這次要沿用他、改他還是記一份新的？`,
        actions: [GATE2_FOLLOW, GATE2_EDIT, GATE2_NEW, GATE2_ELSE],
      })
      return
    }
```

**注意**：`loadSkill(id)` 內部已經會設定 `mode.value = 'edit'`、`savedSkillId.value = skillId`、`draft.value = draftFromSkill(s)`、`gateStage.value = 'active'`（Task 2 已經加過這行），並推一句「我們來調整「{name}」…」的訊息——這裡呼叫它就不用再自己重複做這些事。

- [ ] **Step 4: 執行測試確認全部通過**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts`
Expected: 全部 PASS。

- [ ] **Step 5: Commit**

```bash
git add src/composables/useSkillStudioConversation.ts src/composables/__tests__/useSkillStudioConversation.test.ts
git commit -m "feat(skill-studio): gate2 branching and pause-draft-for-later"
```

---

### Task 5：多輪問答補齊草稿與關卡三確認（§12-§13）

**Files:**
- Modify: `src/composables/useSkillStudioConversation.ts`

**Interfaces:**
- Consumes：Task 4 的 `handleGateMessage`（繼續加 `'clarify'`／`'gate3'` 分支）；Task 1 的 `CLARIFY_DONE_HINT`、`formatDraftSummary`、`GATE3_*`；既有的 `interpretStudioMessage`、`save()`。

- [ ] **Step 1: 寫失敗的測試**

```ts
describe('CLARIFY 補齊與關卡三確認', () => {
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

  it('clarify 階段一般描述：照既有 interpretStudioMessage 規則更新草稿，不轉關卡', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '幫我建立一個新技能') // 清單非空 → gate1
    await sendAndWait(c, '改現有規定（走客製路線）') // 找不到相近 → clarify
    expect(c.gateStage.value).toBe('clarify')
    await sendAndWait(c, '幫我建立一個能查 ERP 庫存的技能')
    expect(c.gateStage.value).toBe('clarify')
    expect(c.draft.value.name).toBeTruthy()
    await sendAndWait(c, '觸發條件改成當使用者提到缺貨時')
    expect(c.draft.value.triggerHint).toContain('缺貨')
  })

  it('clarify 階段說收尾語：轉關卡三，訊息帶草稿摘要', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '幫我建立一個新技能')
    await sendAndWait(c, '改現有規定（走客製路線）')
    await sendAndWait(c, '幫我建立一個能查 ERP 庫存的技能')
    await sendAndWait(c, '沒有漏了，請幫我寫成做法')
    expect(c.gateStage.value).toBe('gate3')
    const last = c.messages.value.at(-1)!
    expect(last.content).toContain(c.draft.value.name)
    expect(last.actions?.map(a => a.label)).toEqual(['這樣可以，存到個人技能', '不對，我要改'])
  })

  it('關卡三選「這樣可以，存到個人技能」：實際呼叫 save()，技能出現在 myPersonalSkills，gateStage 轉 active', async () => {
    const store = useSkillStore()
    const before = store.myPersonalSkills.length
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '幫我建立一個新技能')
    await sendAndWait(c, '改現有規定（走客製路線）')
    await sendAndWait(c, '幫我建立一個能查 ERP 庫存的技能')
    await sendAndWait(c, '沒有漏了，請幫我寫成做法')
    await sendAndWait(c, '這樣可以，存到個人技能')
    expect(c.gateStage.value).toBe('active')
    expect(store.myPersonalSkills.length).toBe(before + 1)
    expect(c.savedSkillId.value).toBeTruthy()
  })

  it('關卡三選「不對，我要改」：退回 clarify，草稿內容不清空', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, '幫我建立一個新技能')
    await sendAndWait(c, '改現有規定（走客製路線）')
    await sendAndWait(c, '幫我建立一個能查 ERP 庫存的技能')
    const nameBeforeRetry = c.draft.value.name
    await sendAndWait(c, '沒有漏了，請幫我寫成做法')
    await sendAndWait(c, '不對，我要改')
    expect(c.gateStage.value).toBe('clarify')
    expect(c.draft.value.name).toBe(nameBeforeRetry)
  })
})
```

- [ ] **Step 2: 執行測試確認全部失敗**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts -t "CLARIFY 補齊與關卡三確認"`
Expected: 全部 FAIL（`handleGateMessage` 對 `'clarify'`／`'gate3'` 還沒有處理）。

- [ ] **Step 3: 擴充 `handleGateMessage`**

在 `if (stage === 'gate2') { ... return }` 區塊後面加入：

```ts
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
        save()
        gateStage.value = 'active'
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
```

- [ ] **Step 4: 執行測試確認全部通過**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts`
Expected: 全部 PASS。

- [ ] **Step 5: Commit**

```bash
git add src/composables/useSkillStudioConversation.ts src/composables/__tests__/useSkillStudioConversation.test.ts
git commit -m "feat(skill-studio): clarify loop, done-hint detection, and gate3 confirm/retry"
```

---

### Task 6：暫存草稿的接續判斷（§11）

**Files:**
- Modify: `src/composables/useSkillStudioConversation.ts`

**Interfaces:**
- Consumes：Task 4 的 `pausedDraft`；Task 1 的 `wantsToResume`。

- [ ] **Step 1: 寫失敗的測試**

```ts
describe('暫存草稿的接續判斷', () => {
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

  async function pauseWithDraft(c: ReturnType<typeof useSkillStudioConversation>, skillName: string) {
    c.startCreate()
    c.chooseMethod('chat')
    await sendAndWait(c, `幫我記一個${skillName}的做法`)
    await sendAndWait(c, '記一份新的')
    await sendAndWait(c, '我要講別的')
  }

  it('訊息含接續關鍵字：還原暫停當下的 gateStage／messages／draft，推一句銜接語', async () => {
    const store = useSkillStore()
    const target = store.myPersonalSkills[0]
    const c = useSkillStudioConversation()
    await pauseWithDraft(c, target.name)
    expect(c.gateStage.value).toBe('intent')

    await sendAndWait(c, '我們繼續剛才的')

    expect(c.gateStage.value).toBe('gate2')
    const last = c.messages.value.at(-1)!
    expect(last.content).toContain('繼續')
  })

  it('訊息沒有接續訊號：正常走當下 gateStage 的路由，暫存草稿維持不動', async () => {
    const store = useSkillStore()
    const target = store.myPersonalSkills[0]
    const c = useSkillStudioConversation()
    await pauseWithDraft(c, target.name)

    await sendAndWait(c, '今天天氣真好')

    expect(c.gateStage.value).toBe('intent')
    expect(c.messages.value.at(-1)!.content).toContain('還在學怎麼幫你直接處理')
  })

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
})
```

- [ ] **Step 2: 執行測試確認第一個案例失敗**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts -t "暫存草稿的接續判斷"`
Expected: 「訊息含接續關鍵字」那個案例 FAIL（目前 `send()` 完全沒有檢查 `pausedDraft`，訊息會被當成新一輪意圖判斷處理，`gateStage` 不會變回 `'gate2'`）；後兩個案例現在應該已經是 PASS（本來就沒有接續邏輯干擾它們）。

- [ ] **Step 3: 修改 `send`，加入接續檢查**

現有（Task 2 改完之後的樣子）：

```ts
  async function send(text: string): Promise<void> {
    const t = text.trim()
    if (!t || isRunning.value) return
    push({ role: 'user', content: t })
    isRunning.value = true
    await new Promise(r => setTimeout(r, 800))
    if (gateStage.value === 'active') {
      const reply = interpretStudioMessage(t, draft.value, mode.value)
      if (reply.patch) draft.value = { ...draft.value, ...reply.patch }
      push({ role: 'agent', content: reply.content, actions: reply.actions })
    } else {
      handleGateMessage(t)
    }
    isRunning.value = false
  }
```

改成：

```ts
  async function send(text: string): Promise<void> {
    const t = text.trim()
    if (!t || isRunning.value) return
    push({ role: 'user', content: t })
    isRunning.value = true
    await new Promise(r => setTimeout(r, 800))

    if (pausedDraft.value && wantsToResume(t, pausedDraft.value)) {
      const paused = pausedDraft.value
      gateStage.value = paused.gateStage
      messages.value = [...paused.messages]
      draft.value = paused.draft
      pendingSimilarSkillId.value = paused.pendingSimilarSkillId
      pausedDraft.value = null
      push({ role: 'agent', content: `好，回到剛才「${paused.draft.name || '那個'}」繼續。` })
      isRunning.value = false
      return
    }

    if (gateStage.value === 'active') {
      const reply = interpretStudioMessage(t, draft.value, mode.value)
      if (reply.patch) draft.value = { ...draft.value, ...reply.patch }
      push({ role: 'agent', content: reply.content, actions: reply.actions })
    } else {
      handleGateMessage(t)
    }
    isRunning.value = false
  }
```

**注意還原後的訊息陣列**：使用者這次輸入的接續觸發句（例如「我們繼續剛才的」）在還原前就已經 `push` 到「被中斷的那段對話」的 `messages.value` 裡了，但接下來整個 `messages.value` 會被 `paused.messages` 取代——也就是說這句觸發句**不會**出現在還原後的最終對話紀錄裡，只會在畫面上短暫閃過，這是刻意的行為（觸發句本身不是有意義的技能內容，等同於點了一個「恢復」的隱形按鈕）。

- [ ] **Step 4: 執行測試確認全部通過**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts`
Expected: 全部 PASS。

- [ ] **Step 5: 跑一次全套測試與型別/lint 檢查，確認沒有連帶弄壞別的地方**

Run: `npx vitest run`
Expected: 全部 PASS。

Run: `npm run lint`
Expected: `src/composables/useSkillStudioConversation.ts` 與其測試檔沒有新的 lint 錯誤（既有、跟這次無關的錯誤不算）。

Run: `npm run type-check`
Expected: 沒有新增的型別錯誤（已知有 14 個跟 `window.XLSX`／`pdfjsLib` 等全域型別缺宣告有關的既有錯誤，這些不是這次改動造成的，不用管）。

- [ ] **Step 6: Commit**

```bash
git add src/composables/useSkillStudioConversation.ts src/composables/__tests__/useSkillStudioConversation.test.ts
git commit -m "feat(skill-studio): resume a paused draft via semantic continuation hints"
```

---

## 完成後的整體驗收

```bash
npx vitest run
npm run lint
npm run type-check
```

Expected：全部通過，`lint`／`type-check` 的既有錯誤數量跟本計畫開始前一致。

手動／live 驗證（有本機 dev server 在跑的話）：

1. 進「AI 賦能」，選「用對話建立」，確認開場白是新的引導語（不是舊的「你好，我是技能建立助理…」）。
2. 打一句明確、清單非空情境下的建立意圖（例如「幫我建立一個新技能」），確認跳出關卡一的三個選項。
3. 選「記一份新的」或「改現有規定」，輸入一句包含既有某顆個人技能關鍵字的描述，確認正確帶出關卡二、技能名稱對得上。
4. 分別點過關卡二四個選項，確認「改他」正確帶入既有技能內容、「另外新增一份」是空白的、「我要講別的」之後換話題會先照常處理、之後打「繼續剛才的」能接回去。
5. 走完 clarify 補內容、打「沒有漏了，請幫我寫成做法」，確認關卡三顯示的摘要內容正確，選「這樣可以，存到個人技能」後在技能管理頁看得到新技能。
6. 用一句短問句（例如「現在幾點」）測一般問答分支，確認回覆是 TODO 佔位訊息、不會誤觸發建立流程。
