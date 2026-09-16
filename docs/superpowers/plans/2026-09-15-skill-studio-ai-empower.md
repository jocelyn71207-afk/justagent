# AI 賦能（SkillStudio）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在「AI 技能」群組新增「AI 賦能」對話式技能工作區（建立／修改／測試），並讓 AiViewer 內由 Agent 發起的「建立成個人技能」流程真的寫入 skillStore。

**Architecture:** 新頁面 `SkillStudio.vue` 持有一個 composable（`useSkillStudioConversation`）當單一狀態來源，左側 `SkillStudioChat` 與右側 `SkillStudioPreview` 都是純 props/emits 元件；Agent 回覆是規則式純函式 `interpretStudioMessage`，可單元測試。AiViewer 側新增 `useSkillSuggestion` composable ＋ `SkillSuggestCard` 卡片元件，透過既有 `cardType` 分支與 `data-action` 事件委派接進 conv4，取代原本純視覺的四支 conv4 函式。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Pinia、vue-router、Vitest + @vue/test-utils（jsdom）、SCSS（全域 `src/scss/`）、markdown-it。

**Spec:** `docs/superpowers/specs/2026-09-15-skill-studio-ai-empower-design.md`

## Global Constraints

- 只用 `<script setup lang="ts">`；禁止 Options API；禁止 `<style scoped>`，樣式全部放 `src/scss/`。
- 所有 import 用 `@/` alias。
- 顏色只用 CSS custom properties／既有 SCSS 變數（`--surface`、`--divider-a50`、`--text-muted`、`--tag-amber-bg/-text`、`--tag-slate-bg/-text`、`$color_main_1`…），不寫死 hex。
- 新 SCSS 檔要在 `src/scss/views/_index.scss` 或 `src/scss/components/_index.scss` 手動 `@import`（此專案 index 用的是 `@import`）。
- 側邊選單標籤固定為「AI 賦能」，圖示 `auto_fix_high`；路由 `name: 'SkillStudio'`、`path: '/view/SkillStudio'`、`meta: { title: 'AI 賦能', parentLabel: 'AI 技能' }`。
- 從 AiViewer 建立的個人技能：`zone: 'personal'`、`creationMethod: 'ai_assisted'`、`isEnabled: true`、`assignedAgents: []`。
- 每個 task 結束前跑 `npm run type-check` 與相關 Vitest 檔，全綠才 commit。
- 不動 `skill-admin.html`、不動 `SkillEditor.vue`、不動 `SkillTest.vue`。
- 開發伺服器（port 8088）若正在跑，不要殺掉。

---

## File Structure

| 檔案 | 責任 |
|---|---|
| `src/stores/skillStore.ts`（修改） | `createPersonalSkill` 回傳 id、吃 `creationMethod`；新增 `applyStudioPatch`；最後移除 editChat 四項 |
| `src/composables/useSkillStudioConversation.ts`（新增） | 草稿狀態、訊息、`interpretStudioMessage` 規則、`save()`；SkillStudio 的唯一狀態來源 |
| `src/views/SkillStudio.vue`（新增） | 版面殼、route query 解析、離開守衛、把 composable 接到兩個子元件 |
| `src/components/Skill/SkillStudioChat.vue`（新增） | 左側對話：header（模式 chip／切換技能／建立新技能）、訊息、動作 chip、建議 chip、輸入列 |
| `src/components/Skill/SkillStudioPreview.vue`（新增） | 右側：預覽 tab（六區塊＋badge）、測試 tab（`SkillTestAI`／空狀態）、footer 按鈕 |
| `src/scss/views/_SkillStudio.scss`（新增） | `.SkillStudio`、`.SkillStudioChat`、`.SkillStudioPreview` 全部樣式 |
| `src/router/index.ts`、`src/components/AppMenuTree.vue`（修改） | 路由與側邊選單三處連結 |
| `src/composables/useSkillSuggestion.ts`（新增） | AiViewer 用：offer / handleAction / reset，呼叫 `createPersonalSkill` |
| `src/components/AiViewer/SkillSuggestCard.vue`（新增）＋ `src/scss/components/_SkillSuggestCard.scss`（新增） | 建議卡三階段純呈現，按鈕用 `data-action` |
| `src/components/AiViewer/AiViewerRecord.vue`（修改） | 新增 `cardType === 'skillSuggest'` 分支 |
| `src/components/AiViewer/AiViewerRightBox.vue`（修改） | conv4 改用 composable；dispatcher 加 `skill-suggest-*`／`goto-skill-studio` |
| `src/views/SkillManagement.vue`（修改） | 「跟 Agent 對話修改」導頁；移除 `SkillEditChatModal` |
| `src/components/Skill/SkillEditChatModal.vue`、`src/scss/components/_SkillEditChatModal.scss`（刪除） | 退役 |
| `PROJECT_CONTEXT.md`、`ARCHITECTURE.md`（修改） | 補選單／路由說明 |

---

### Task 1: skillStore — `createPersonalSkill` 回傳 id ＋ `creationMethod`、新增 `applyStudioPatch`

**Files:**
- Modify: `src/stores/skillStore.ts:133-143`（`CreateSkillPayload`）、`:1187-1208`（`createPersonalSkill`）、`:1775-1852`（return 區塊）
- Test: `src/stores/__tests__/skillStore.test.ts`

**Interfaces:**
- Produces:
  - `CreateSkillPayload.creationMethod?: 'ai_assisted' | 'manual'`
  - `createPersonalSkill(data: CreateSkillPayload): string`（回傳新技能 id）
  - `export type StudioPatch = Partial<Pick<Skill, 'name' | 'description' | 'instructions' | 'triggerHint' | 'capabilities'>>`
  - `applyStudioPatch(skillId: string, patch: StudioPatch): boolean`（非個人技能／找不到回 `false`）

- [ ] **Step 1: 寫失敗測試**

在 `src/stores/__tests__/skillStore.test.ts` 最外層 `describe('skillStore')` 內、`describe('覆蓋能力 capabilities')` 之前新增：

```ts
  describe('AI 賦能：createPersonalSkill 回傳 id 與 applyStudioPatch', () => {
    it('createPersonalSkill 回傳新技能 id，且可用 findSkill 找到、creationMethod 依 payload 寫入', () => {
      const store = useSkillStore()
      const id = store.createPersonalSkill({
        name: 'ERP 庫存查詢',
        description: '查詢 ERP 即時庫存',
        instructions: '1. 釐清品項\n2. 查詢庫存',
        triggerHint: '當使用者提到庫存時',
        isEnabled: true,
        assignedAgents: [],
        creationMethod: 'ai_assisted',
      })
      expect(typeof id).toBe('string')
      const skill = store.findSkill(id)
      expect(skill).toBeDefined()
      expect(skill!.zone).toBe('personal')
      expect(skill!.creationMethod).toBe('ai_assisted')
      expect(store.myPersonalSkills[0].id).toBe(id)
    })

    it('createPersonalSkill 未帶 creationMethod 時預設 manual；連續建立兩顆 id 不重複', () => {
      const store = useSkillStore()
      const base = { instructions: 'x', triggerHint: 'y', isEnabled: true, assignedAgents: [] as string[] }
      const a = store.createPersonalSkill({ name: 'A', ...base })
      const b = store.createPersonalSkill({ name: 'B', ...base })
      expect(a).not.toBe(b)
      expect(store.findSkill(a)!.creationMethod).toBe('manual')
    })

    it('applyStudioPatch 合併欄位、同步 skillName，並回傳 true', () => {
      const store = useSkillStore()
      const id = store.createPersonalSkill({ name: '舊名', instructions: '舊指令', triggerHint: '舊觸發', isEnabled: true, assignedAgents: [] })
      const ok = store.applyStudioPatch(id, {
        name: '新名',
        instructions: '新指令',
        capabilities: [{ name: '能力一', description: '說明' }],
      })
      expect(ok).toBe(true)
      const s = store.findSkill(id)!
      expect(s.name).toBe('新名')
      expect(s.skillName).toBe('新名')
      expect(s.instructions).toBe('新指令')
      expect(s.triggerHint).toBe('舊觸發') // 未帶的欄位不動
      expect(s.capabilities).toEqual([{ name: '能力一', description: '說明' }])
    })

    it('applyStudioPatch 對 draft 狀態的複本改了 instructions 後 personalStatus 轉 available', () => {
      const store = useSkillStore()
      const copy = store.duplicateAsPersonalSkill('sys-cs-001')
      expect(copy.personalStatus).toBe('draft')
      store.applyStudioPatch(copy.id, { instructions: `${copy.instructions ?? ''}\n4. 新步驟`.trim() })
      expect(store.findSkill(copy.id)!.personalStatus).toBe('available')
    })

    it('applyStudioPatch 對 Library 技能或不存在的 id 不作用並回傳 false', () => {
      const store = useSkillStore()
      const lib = store.findSkill('sys-cs-001')!
      const before = lib.name
      expect(store.applyStudioPatch('sys-cs-001', { name: '亂改' })).toBe(false)
      expect(store.findSkill('sys-cs-001')!.name).toBe(before)
      expect(store.applyStudioPatch('nope-000', { name: 'x' })).toBe(false)
    })
  })
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run src/stores/__tests__/skillStore.test.ts -t "AI 賦能"`
Expected: FAIL — `applyStudioPatch is not a function`、`expect(typeof id).toBe('string')` 收到 `undefined`。

- [ ] **Step 3: 實作**

`src/stores/skillStore.ts`，`CreateSkillPayload` 加一行：

```ts
export interface CreateSkillPayload {
  name: string
  description?: string
  instructions: string
  triggerHint: string
  isEnabled: boolean
  assignedAgents: string[]
  scope?: 'enterprise' | 'team'
  files?: SkillFile[]
  capabilities?: SkillCapability[]
  creationMethod?: 'ai_assisted' | 'manual'
}
```

在 `UpdateSkillPayload` 之後新增型別：

```ts
// AI 賦能對話修改用：只允許動這五個內容欄位，不碰狀態／版本／來源關係
export type StudioPatch = Partial<Pick<Skill, 'name' | 'description' | 'instructions' | 'triggerHint' | 'capabilities'>>
```

把 `createPersonalSkill` 改成（保留上方既有註解）：

```ts
  let personalSeq = 0
  function createPersonalSkill(data: CreateSkillPayload): string {
    const id = `personal-${Date.now()}-${++personalSeq}`
    myPersonalSkillsRef.value.unshift({
      id,
      name: data.name,
      description: data.description ?? '',
      type: 'extension',
      origin: 'manually_created',
      creationMethod: data.creationMethod ?? 'manual',
      zone: 'personal',
      personalStatus: 'available',
      skillName: data.name,
      version: '初始版本',
      isEnabled: data.isEnabled,
      usageCount: 0,
      testPassRate: 0,
      avgLatencyMs: 0,
      instructions: data.instructions,
      triggerHint: data.triggerHint,
      assignedAgents: data.assignedAgents,
      files: data.files ?? [],
      capabilities: data.capabilities ?? [],
    })
    return id
  }

  // AI 賦能（SkillStudio）修改模式的儲存：只對個人技能生效。draft 複本內容一旦跟
  // 來源不同就轉 available（規則同原 sendEditChatMessage）。skillName 只在非衍生
  // 技能同步——衍生技能的 skillName 記的是 Library 來源名稱，不能被改名蓋掉
  function applyStudioPatch(skillId: string, patch: StudioPatch): boolean {
    const skill = findSkill(skillId)
    if (!skill || skill.zone !== 'personal') return false
    if (patch.name !== undefined) {
      skill.name = patch.name
      if (!skill.derivedFrom) skill.skillName = patch.name
    }
    if (patch.description !== undefined) skill.description = patch.description
    if (patch.instructions !== undefined) skill.instructions = patch.instructions
    if (patch.triggerHint !== undefined) skill.triggerHint = patch.triggerHint
    if (patch.capabilities !== undefined) skill.capabilities = patch.capabilities.map(c => ({ ...c }))
    if (
      skill.personalStatus === 'draft' &&
      skill.instructions !== findSkill(skill.derivedFrom ?? '')?.instructions
    ) {
      skill.personalStatus = 'available'
    }
    return true
  }
```

return 區塊在 `createPersonalSkill,` 下一行加 `applyStudioPatch,`。

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run src/stores/__tests__/skillStore.test.ts && npm run type-check`
Expected: 全部 PASS；type-check 無錯（`SkillEditor.vue` 呼叫 `createPersonalSkill` 沒有用回傳值，回傳型別改變不影響）。

- [ ] **Step 5: Commit**

```bash
git add src/stores/skillStore.ts src/stores/__tests__/skillStore.test.ts
git commit -m "feat(skill): createPersonalSkill returns id + creationMethod, add applyStudioPatch"
```

---

### Task 2: `useSkillStudioConversation` composable（含 `interpretStudioMessage` 規則）

**Files:**
- Create: `src/composables/useSkillStudioConversation.ts`
- Test: `src/composables/__tests__/useSkillStudioConversation.test.ts`

**Interfaces:**
- Consumes: `useSkillStore().createPersonalSkill / applyStudioPatch / updateSkillFiles / findSkill`（Task 1）
- Produces（後續 Task 4–6 依賴這些名稱）:

```ts
export type StudioMode = 'create' | 'edit'
export interface SkillDraft { name: string; description: string; instructions: string; triggerHint: string; capabilities: SkillCapability[]; files: SkillFile[] }
export interface StudioAction { id: string; label: string }
export interface StudioMessage extends ChatMessage { actions?: StudioAction[] }
export interface StudioReply { content: string; patch?: Partial<SkillDraft>; actions?: StudioAction[] }
export interface StudioSuggestion { icon: string; label: string; prefill: string }
export function emptyDraft(): SkillDraft
export function extractSkillName(text: string): string
export function interpretStudioMessage(text: string, draft: SkillDraft, mode: StudioMode): StudioReply
export function useSkillStudioConversation(): {
  mode: Ref<StudioMode>; savedSkillId: Ref<string | null>; draft: Ref<SkillDraft>; messages: Ref<StudioMessage[]>
  isRunning: Ref<boolean>; isDirty: ComputedRef<boolean>; canSave: ComputedRef<boolean>
  suggestionChips: ComputedRef<StudioSuggestion[]>
  startCreate(): void; loadSkill(skillId: string): boolean; send(text: string): Promise<void>
  save(): string | null; updateFiles(files: SkillFile[]): void
}
```

- [ ] **Step 1: 寫失敗測試**

`src/composables/__tests__/useSkillStudioConversation.test.ts`：

```ts
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useSkillStore } from '@/stores/skillStore'
import {
  emptyDraft,
  extractSkillName,
  interpretStudioMessage,
  useSkillStudioConversation,
} from '@/composables/useSkillStudioConversation'

describe('extractSkillName', () => {
  it('取「建立／幫我做／需要」之後、「的技能／的 Skill」之前的片段，並去掉量詞與「能／可以」', () => {
    expect(extractSkillName('幫我建立一個能查 ERP 庫存的技能')).toBe('查 ERP 庫存')
    expect(extractSkillName('我需要一個可以整理會議紀錄的 Skill')).toBe('整理會議紀錄')
  })
  it('沒有關鍵字時取第一個子句前 12 字', () => {
    expect(extractSkillName('把每週會議逐字稿整理成週報，要有待辦')).toBe('把每週會議逐字稿整理成週')
  })
  it('空字串退回「新技能」', () => {
    expect(extractSkillName('   ')).toBe('新技能')
  })
})

describe('interpretStudioMessage', () => {
  it('建立模式第一句：產生名稱／說明／觸發／三步驟／兩項能力，並帶三個動作 chip', () => {
    const reply = interpretStudioMessage('幫我建立一個能查 ERP 庫存的技能', emptyDraft(), 'create')
    expect(reply.patch?.name).toBe('查 ERP 庫存')
    expect(reply.patch?.description).toBe('幫我建立一個能查 ERP 庫存的技能')
    expect(reply.patch?.triggerHint).toBe('當使用者提到「查 ERP 庫存」相關需求時')
    expect(reply.patch?.instructions?.split('\n')).toHaveLength(3)
    expect(reply.patch?.capabilities).toHaveLength(2)
    expect(reply.actions?.map(a => a.label)).toEqual(['看起來沒問題，儲存', '觸發條件要更精準', '再補一個步驟'])
  })

  it('改名：優先取引號內文字', () => {
    const draft = { ...emptyDraft(), name: '舊' }
    const reply = interpretStudioMessage('名稱改成「庫存速查」', draft, 'edit')
    expect(reply.patch?.name).toBe('庫存速查')
    expect(reply.content).toContain('庫存速查')
  })

  it('觸發：更新 triggerHint', () => {
    const draft = { ...emptyDraft(), name: 'x' }
    const reply = interpretStudioMessage('觸發條件改成當使用者問缺貨時', draft, 'edit')
    expect(reply.patch?.triggerHint).toBe('當使用者問缺貨時')
  })

  it('加步驟：依現有步驟數接續編號', () => {
    const draft = { ...emptyDraft(), name: 'x', instructions: '1. a\n2. b\n3. c' }
    const reply = interpretStudioMessage('再補一個步驟', draft, 'edit')
    expect(reply.patch?.instructions).toBe('1. a\n2. b\n3. c\n4. 檢查輸出結果，必要時補充說明')
    expect(reply.content).toBe('已追加第 4 步。')
  })

  it('加能力：push 一項 capability', () => {
    const draft = { ...emptyDraft(), name: 'x', capabilities: [{ name: 'a', description: '' }] }
    const reply = interpretStudioMessage('還能匯出成 Excel', draft, 'edit')
    expect(reply.patch?.capabilities).toHaveLength(2)
    expect(reply.patch?.capabilities?.[1].name).toBe('匯出成 Excel')
  })

  it('動作 chip「看起來沒問題，儲存」不改草稿，只回提示', () => {
    const draft = { ...emptyDraft(), name: 'x', instructions: '1. a' }
    const reply = interpretStudioMessage('看起來沒問題，儲存', draft, 'create')
    expect(reply.patch).toBeUndefined()
    expect(reply.content).toContain('儲存為個人技能')
  })

  it('其他訊息：附加到 instructions', () => {
    const draft = { ...emptyDraft(), name: 'x', instructions: '1. a' }
    const reply = interpretStudioMessage('語氣要親切一點', draft, 'edit')
    expect(reply.patch?.instructions).toBe('1. a\n\n（依對話更新）語氣要親切一點')
  })
})

describe('useSkillStudioConversation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('startCreate 是建立模式、草稿空白、只有一則 Agent 開場訊息、canSave 為 false', () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    expect(c.mode.value).toBe('create')
    expect(c.draft.value).toEqual(emptyDraft())
    expect(c.messages.value).toHaveLength(1)
    expect(c.messages.value[0].role).toBe('agent')
    expect(c.canSave.value).toBe(false)
    expect(c.isDirty.value).toBe(false)
  })

  it('send 推入使用者訊息、800ms 後套用 patch 並推入 Agent 回覆', async () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    const p = c.send('幫我建立一個能查 ERP 庫存的技能')
    expect(c.isRunning.value).toBe(true)
    expect(c.messages.value.at(-1)?.role).toBe('user')
    await vi.advanceTimersByTimeAsync(800)
    await p
    expect(c.isRunning.value).toBe(false)
    expect(c.draft.value.name).toBe('查 ERP 庫存')
    expect(c.messages.value.at(-1)?.role).toBe('agent')
    expect(c.messages.value.at(-1)?.actions).toHaveLength(3)
    expect(c.canSave.value).toBe(true)
    expect(c.isDirty.value).toBe(true)
  })

  it('save 於建立模式呼叫 createPersonalSkill（ai_assisted）、轉成 edit 模式並清除 dirty', async () => {
    const store = useSkillStore()
    const c = useSkillStudioConversation()
    c.startCreate()
    const p = c.send('幫我建立一個能查 ERP 庫存的技能')
    await vi.advanceTimersByTimeAsync(800)
    await p
    const id = c.save()
    expect(id).toBeTruthy()
    expect(c.mode.value).toBe('edit')
    expect(c.savedSkillId.value).toBe(id)
    expect(c.isDirty.value).toBe(false)
    const skill = store.findSkill(id!)!
    expect(skill.creationMethod).toBe('ai_assisted')
    expect(skill.name).toBe('查 ERP 庫存')
    expect(skill.isEnabled).toBe(true)
  })

  it('loadSkill 對個人技能回 true 並帶入草稿；對 Library 技能／不存在 id 回 false', () => {
    const c = useSkillStudioConversation()
    expect(c.loadSkill('personal-001')).toBe(true)
    expect(c.mode.value).toBe('edit')
    expect(c.draft.value.name).toBe('週報自動生成')
    expect(c.messages.value[0].content).toContain('週報自動生成')
    expect(c.loadSkill('sys-cs-001')).toBe(false)
    expect(c.loadSkill('nope')).toBe(false)
  })

  it('save 於修改模式呼叫 applyStudioPatch，內容寫回 store', async () => {
    const store = useSkillStore()
    const c = useSkillStudioConversation()
    c.loadSkill('personal-001')
    const p = c.send('名稱改成「週報小幫手」')
    await vi.advanceTimersByTimeAsync(800)
    await p
    expect(c.isDirty.value).toBe(true)
    c.save()
    expect(store.findSkill('personal-001')!.name).toBe('週報小幫手')
    expect(c.isDirty.value).toBe(false)
  })

  it('canSave 為 false 時 save 回 null 且不建立技能', () => {
    const store = useSkillStore()
    const before = store.myPersonalSkills.length
    const c = useSkillStudioConversation()
    c.startCreate()
    expect(c.save()).toBeNull()
    expect(store.myPersonalSkills.length).toBe(before)
  })

  it('suggestionChips：建立模式三則固定；修改模式依內容有無切換動詞', () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    expect(c.suggestionChips.value).toHaveLength(3)
    expect(c.suggestionChips.value[0].label).toBe('幫我建立一個能查 ERP 庫存的技能')
    c.loadSkill('personal-001')
    const labels = c.suggestionChips.value.map(s => s.label)
    expect(labels).toContain('調整技能指令')
    expect(labels).toContain('調整觸發條件')
  })
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts`
Expected: FAIL — 模組不存在。

- [ ] **Step 3: 實作**

`src/composables/useSkillStudioConversation.ts`：

```ts
import { ref, computed } from 'vue'
import { useSkillStore } from '@/stores/skillStore'
import type { ChatMessage, SkillCapability, SkillFile } from '@/stores/skillStore'

// AI 賦能（SkillStudio）的對話狀態與規則式 mock 回覆。
// 這裡是頁面唯一的狀態來源：左側對話、右側預覽都只讀這裡的 draft／messages。

export type StudioMode = 'create' | 'edit'

export interface SkillDraft {
  name: string
  description: string
  instructions: string
  triggerHint: string
  capabilities: SkillCapability[]
  files: SkillFile[]
}

export interface StudioAction { id: string; label: string }
export interface StudioMessage extends ChatMessage { actions?: StudioAction[] }
export interface StudioReply { content: string; patch?: Partial<SkillDraft>; actions?: StudioAction[] }
export interface StudioSuggestion { icon: string; label: string; prefill: string }

export function emptyDraft(): SkillDraft {
  return { name: '', description: '', instructions: '', triggerHint: '', capabilities: [], files: [] }
}

const ACTION_CONFIRM: StudioAction = { id: 'confirm', label: '看起來沒問題，儲存' }
const ACTION_TRIGGER: StudioAction = { id: 'trigger', label: '觸發條件要更精準' }
const ACTION_STEP: StudioAction = { id: 'step', label: '再補一個步驟' }

const CREATE_SUGGESTIONS: StudioSuggestion[] = [
  { icon: 'inventory_2', label: '幫我建立一個能查 ERP 庫存的技能', prefill: '幫我建立一個能查 ERP 庫存的技能' },
  { icon: 'summarize', label: '把每週會議逐字稿整理成週報', prefill: '把每週會議逐字稿整理成週報' },
  { icon: 'description', label: '依部門報告規範自動產出月報', prefill: '依部門報告規範自動產出月報' },
]

// 依技能實際有沒有內容決定動詞（已經有 vs. 還沒有），搬自原 SkillEditChatModal
function editSuggestions(draft: SkillDraft): StudioSuggestion[] {
  return [
    draft.instructions
      ? { icon: 'terminal', label: '調整技能指令', prefill: '我想調整技能指令，' }
      : { icon: 'terminal', label: '撰寫技能指令', prefill: '幫我撰寫技能指令，' },
    draft.capabilities.length
      ? { icon: 'checklist', label: '調整覆蓋能力', prefill: '我想調整覆蓋能力，' }
      : { icon: 'checklist', label: '新增覆蓋能力', prefill: '幫我新增覆蓋能力，' },
    draft.triggerHint
      ? { icon: 'bolt', label: '調整觸發條件', prefill: '觸發條件改成' }
      : { icon: 'bolt', label: '設定觸發條件', prefill: '觸發條件是' },
  ]
}

const NAME_MAX = 12

export function extractSkillName(text: string): string {
  const t = text.trim()
  if (!t) return '新技能'
  const m = t.match(/(?:建立|幫我做|需要)(.*?)(?:的技能|的 ?Skill|$)/i)
  let picked = m ? m[1] : t.split(/[，。！？、；：,.!?;:]/)[0]
  picked = picked
    .replace(/^(一個|一顆|一份|一套|一支)/, '')
    .replace(/^(能夠|能|可以|會)/, '')
    .trim()
  if (!picked) return '新技能'
  return picked.length > NAME_MAX ? picked.slice(0, NAME_MAX) : picked
}

function countSteps(instructions: string): number {
  return instructions.split('\n').filter(line => /^\d+\.\s/.test(line.trim())).length
}

function stripLead(text: string, lead: RegExp): string {
  return text.replace(lead, '').trim()
}

export function interpretStudioMessage(text: string, draft: SkillDraft, mode: StudioMode): StudioReply {
  const t = text.trim()

  if (t === ACTION_CONFIRM.label) {
    return { content: '請按右側「儲存為個人技能」，儲存後就能在「測試」tab 驗證。' }
  }
  if (t === ACTION_TRIGGER.label) {
    return { content: '好，直接告訴我在什麼情況下要觸發這個技能，例如「觸發條件改成當使用者提到缺貨或補貨時」。' }
  }
  if (t === ACTION_STEP.label) {
    const n = countSteps(draft.instructions) + 1
    return {
      patch: { instructions: `${draft.instructions}\n${n}. 檢查輸出結果，必要時補充說明`.trim() },
      content: `已追加第 ${n} 步。`,
    }
  }

  if (mode === 'create' && !draft.name) {
    const name = extractSkillName(t)
    return {
      patch: {
        name,
        description: t,
        triggerHint: `當使用者提到「${name}」相關需求時`,
        instructions: `1. 釐清使用者的輸入與需求範圍\n2. 執行「${name}」\n3. 依指定格式回覆結果`,
        capabilities: [
          { name, description: t },
          { name: '結果格式化輸出', description: '依指定格式整理並回覆結果' },
        ],
      },
      content: '我先幫你擬了一版設定，右側可以看到。名稱、觸發條件和步驟都可以再跟我說要怎麼調。',
      actions: [ACTION_CONFIRM, ACTION_TRIGGER, ACTION_STEP],
    }
  }

  if (/名稱|改名|叫/.test(t)) {
    const quoted = t.match(/[「"'『]([^」"'』]+)[」"'』]/)
    const name = quoted?.[1] ?? stripLead(t, /^.*?(叫做?|名稱(是|改成|改為)?|改名(成|為)?)/)
    if (name) return { patch: { name }, content: `已把名稱改成「${name}」。` }
  }

  if (t.includes('觸發')) {
    const hint = stripLead(t, /^.*?觸發(條件)?(是|改成|改為|為|要|：|:)?/) || t
    return { patch: { triggerHint: hint }, content: `觸發條件已更新為：${hint}` }
  }

  if (/步驟|加一步|補/.test(t)) {
    const n = countSteps(draft.instructions) + 1
    const body = stripLead(t, /^.*?(步驟|加一步|補(上|充)?)(：|:|，)?/) || t
    return { patch: { instructions: `${draft.instructions}\n${n}. ${body}`.trim() }, content: `已追加第 ${n} 步。` }
  }

  if (/能力|還能/.test(t)) {
    const body = stripLead(t, /^.*?(能力|還能)(：|:|，)?/) || t
    return {
      patch: { capabilities: [...draft.capabilities, { name: body, description: '' }] },
      content: '已新增一項覆蓋能力。',
    }
  }

  return {
    patch: { instructions: `${draft.instructions}\n\n（依對話更新）${t}`.trim() },
    content: '已根據你的描述更新技能指令，右側可以看到變更。',
  }
}

function serialize(d: SkillDraft): string {
  return JSON.stringify({ ...d, files: d.files.map(f => f.id) })
}

export function useSkillStudioConversation() {
  const store = useSkillStore()

  const mode = ref<StudioMode>('create')
  const savedSkillId = ref<string | null>(null)
  const draft = ref<SkillDraft>(emptyDraft())
  const snapshot = ref(serialize(draft.value))
  const messages = ref<StudioMessage[]>([])
  const isRunning = ref(false)
  let seq = 0

  const isDirty = computed(() => serialize(draft.value) !== snapshot.value)
  const canSave = computed(() => !!draft.value.name.trim() && !!draft.value.instructions.trim())
  const suggestionChips = computed<StudioSuggestion[]>(() =>
    mode.value === 'create' ? CREATE_SUGGESTIONS : editSuggestions(draft.value)
  )

  function push(m: Omit<StudioMessage, 'id'>) {
    messages.value.push({ id: `studio-${++seq}`, ...m })
  }

  function startCreate(): void {
    mode.value = 'create'
    savedSkillId.value = null
    draft.value = emptyDraft()
    snapshot.value = serialize(draft.value)
    messages.value = []
    push({ role: 'agent', content: '你好，我是技能建立助理。描述你想讓 Agent 幫你做什麼，我會先擬一版設定放在右側。' })
  }

  function loadSkill(skillId: string): boolean {
    const s = store.findSkill(skillId)
    if (!s || s.zone !== 'personal') return false
    mode.value = 'edit'
    savedSkillId.value = skillId
    draft.value = {
      name: s.name,
      description: s.description ?? '',
      instructions: s.instructions ?? '',
      triggerHint: s.triggerHint ?? '',
      capabilities: (s.capabilities ?? []).map(c => ({ ...c })),
      files: [...(s.files ?? [])],
    }
    snapshot.value = serialize(draft.value)
    messages.value = []
    push({ role: 'agent', content: `我們來調整「${s.name}」。告訴我想改哪裡，右側會即時反映。` })
    return true
  }

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

  function save(): string | null {
    if (!canSave.value) return null
    const d = draft.value
    if (mode.value === 'create') {
      const id = store.createPersonalSkill({
        name: d.name.trim(),
        description: d.description,
        instructions: d.instructions,
        triggerHint: d.triggerHint,
        isEnabled: true,
        assignedAgents: [],
        capabilities: d.capabilities,
        files: d.files,
        creationMethod: 'ai_assisted',
      })
      mode.value = 'edit'
      savedSkillId.value = id
    } else if (savedSkillId.value) {
      store.applyStudioPatch(savedSkillId.value, {
        name: d.name.trim(),
        description: d.description,
        instructions: d.instructions,
        triggerHint: d.triggerHint,
        capabilities: d.capabilities,
      })
      store.updateSkillFiles(savedSkillId.value, d.files)
    }
    snapshot.value = serialize(draft.value)
    return savedSkillId.value
  }

  function updateFiles(files: SkillFile[]): void {
    draft.value = { ...draft.value, files }
  }

  return {
    mode, savedSkillId, draft, messages, isRunning, isDirty, canSave, suggestionChips,
    startCreate, loadSkill, send, save, updateFiles,
  }
}
```

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts && npm run type-check`
Expected: 全部 PASS。若 `extractSkillName` 對「我需要一個可以整理會議紀錄的 Skill」沒有得到 `整理會議紀錄`，檢查 regex 的 `的 ?Skill` 與 `/i` 旗標。

- [ ] **Step 5: Commit**

```bash
git add src/composables/useSkillStudioConversation.ts src/composables/__tests__/useSkillStudioConversation.test.ts
git commit -m "feat(skill): add useSkillStudioConversation composable with rule-based mock replies"
```

---

### Task 3: 路由、側邊選單、`SkillStudio.vue` 版面殼與 SCSS 檔

**Files:**
- Modify: `src/router/index.ts:126-130`（`SkillEditor` 路由之後）
- Modify: `src/components/AppMenuTree.vue:165-194`（桌機群組＋flyout）、`:305-316`（手機）
- Create: `src/views/SkillStudio.vue`（殼，Task 6 再接邏輯）
- Create: `src/scss/views/_SkillStudio.scss`；Modify: `src/scss/views/_index.scss`
- Test: `src/components/__tests__/AppMenuTree.skillLabel.test.ts`、`src/views/__tests__/SkillStudio.test.ts`

**Interfaces:**
- Produces: route `name: 'SkillStudio'`；CSS 類別 `.SkillStudio .skill-studio-layout > .studio-chat-col / .studio-side-col`

- [ ] **Step 1: 寫失敗測試**

覆寫 `src/components/__tests__/AppMenuTree.skillLabel.test.ts`：

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import AppMenuTree from '../AppMenuTree.vue'

describe('AppMenuTree 桌機版「AI 技能」群組子項目', () => {
  it('展開後依序為 技能管理 / AI 賦能 / 技能測試沙盒，且不再出現舊名「技能清單」', async () => {
    setActivePinia(createPinia())
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: { template: '<div/>' } }],
    })
    const wrapper = mount(AppMenuTree, { global: { plugins: [router] } })

    const group = wrapper.find('.side-panel-group')
    expect(group.text()).toContain('AI 技能')

    await group.trigger('click')
    const sub = wrapper.findAll('.side-panel-sub')[0]
    const text = sub.text()

    expect(text).not.toContain('技能清單')
    expect(text).toContain('技能管理')
    expect(text).toContain('AI 賦能')
    expect(text).toContain('技能測試沙盒')
    expect(text.indexOf('技能管理')).toBeLessThan(text.indexOf('AI 賦能'))
    expect(text.indexOf('AI 賦能')).toBeLessThan(text.indexOf('技能測試沙盒'))

    const studioLink = sub.findAll('a').find(a => a.text().includes('AI 賦能'))
    expect(studioLink?.attributes('href')).toBe('/view/SkillStudio')
  })
})
```

新增 `src/views/__tests__/SkillStudio.test.ts`（此 task 只放第一個測項，Task 6 再擴充）：

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SkillStudio from '@/views/SkillStudio.vue'

vi.mock('@/services/popDialog', () => ({
  default: { toast: vi.fn(), confirm: vi.fn(), alert: vi.fn() },
}))

async function mountAt(query: Record<string, string> = {}) {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div/>' } },
      { path: '/view/SkillStudio', name: 'SkillStudio', component: SkillStudio, meta: { title: 'AI 賦能', parentLabel: 'AI 技能' } },
      { path: '/view/Skills', name: 'SkillManagement', component: { template: '<div/>' } },
      { path: '/view/SkillTest', name: 'SkillTest', component: { template: '<div/>' } },
      { path: '/view/SkillEditor', name: 'SkillEditor', component: { template: '<div/>' } },
    ],
  })
  await router.push({ path: '/view/SkillStudio', query })
  await router.isReady()
  const wrapper = mount(SkillStudio, {
    global: { plugins: [router], stubs: { AppBreadcrumb: true, SkillTestAI: true } },
  })
  await flushPromises()
  return { wrapper, router }
}

describe('SkillStudio', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('渲染 banner 標題「AI 賦能」與左右兩欄版面', async () => {
    const { wrapper } = await mountAt()
    expect(wrapper.find('.banner-title').text()).toBe('AI 賦能')
    expect(wrapper.find('.skill-studio-layout .studio-chat-col').exists()).toBe(true)
    expect(wrapper.find('.skill-studio-layout .studio-side-col').exists()).toBe(true)
  })
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run src/components/__tests__/AppMenuTree.skillLabel.test.ts src/views/__tests__/SkillStudio.test.ts`
Expected: 兩個檔案 FAIL（找不到 AI 賦能／找不到 `SkillStudio.vue`）。

- [ ] **Step 3: 路由**

`src/router/index.ts`，在 `SkillEditor` 路由物件之後（同一個 children 陣列內）加：

```ts
      {
        path: '/view/SkillStudio',
        name: 'SkillStudio',
        component: () => import('@/views/SkillStudio.vue'),
        meta: { title: 'AI 賦能', parentLabel: 'AI 技能' },
      },
```

- [ ] **Step 4: 側邊選單三處**

`src/components/AppMenuTree.vue`：

(a) 桌機群組 header 的 active 判斷（原 `:class="{ active: route.path === '/view/Skills' || route.path === '/view/SkillTest' }"`）改成：

```vue
          :class="{ active: route.path === '/view/Skills' || route.path === '/view/SkillStudio' || route.path === '/view/SkillTest' }"
```

(b) 桌機展開 `.side-panel-sub`，在「技能管理」與「技能測試沙盒」兩個 `RouterLink` 之間插入：

```vue
          <RouterLink to="/view/SkillStudio"
            class="side-panel-item" :class="{ active: route.path === '/view/SkillStudio' }">
            <i class="material-symbols-outlined">auto_fix_high</i><span class="side-panel-item-label">AI 賦能</span>
          </RouterLink>
```

(c) 收合 flyout `.rail-popover.side-panel-flyout`，同樣位置插入：

```vue
          <RouterLink to="/view/SkillStudio" class="side-panel-item" :class="{ active: route.path === '/view/SkillStudio' }">
            <i class="material-symbols-outlined">auto_fix_high</i><span class="side-panel-item-label">AI 賦能</span>
          </RouterLink>
```

(d) 手機抽屜 `.side-panel-sub`（約 L311-316），兩個連結之間插入：

```vue
        <RouterLink to="/view/SkillStudio" class="side-panel-item mobile-item mobile-sub" @click="closeMobileMenu">
          <i class="material-symbols-outlined">auto_fix_high</i>AI 賦能
        </RouterLink>
```

- [ ] **Step 5: 版面殼與 SCSS**

`src/views/SkillStudio.vue`（殼；Task 6 會把子元件接進兩欄）：

```vue
<template>
  <div class="SkillStudio views-page">
    <div class="views-page-content-box">
      <div class="page-banner">
        <div>
          <AppBreadcrumb />
          <div class="banner-title">AI 賦能</div>
        </div>
      </div>

      <div class="skill-studio-layout">
        <div class="studio-chat-col"></div>
        <div class="studio-side-col"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
</script>
```

`src/scss/views/_SkillStudio.scss`（先放版面；Task 4／5 再各自補元件樣式到同一檔）：

```scss
// ── AI 賦能（SkillStudio）頁面佈局 ──
.SkillStudio {
  height: 100%;

  .skill-studio-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 380px;
    // 同 SkillTest：扣掉 .views-page 上下 padding 與 page-banner 實際佔高
    height: calc(100vh - 172px);
    overflow: hidden;
    border: 1px solid var(--divider-a50);
    border-radius: 12px;
    background: var(--surface);
  }

  .studio-chat-col {
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .studio-side-col {
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-left: 1px solid var(--divider-a50);
    background: var(--page-bg);
  }

  @media (max-width: 1023px) {
    .skill-studio-layout {
      grid-template-columns: 1fr;
      grid-template-rows: minmax(320px, 1fr) auto;
      height: auto;
      min-height: calc(100vh - 172px);
    }

    .studio-side-col {
      border-left: none;
      border-top: 1px solid var(--divider-a50);
      max-height: 60vh;
    }
  }
}
```

`src/scss/views/_index.scss` 在 `@import "./SkillEditor";` 之後加：

```scss
@import "./SkillStudio";
```

- [ ] **Step 6: 跑測試確認通過**

Run: `npx vitest run src/components/__tests__/AppMenuTree.skillLabel.test.ts src/views/__tests__/SkillStudio.test.ts src/components/__tests__/AppMenuTree.mobileParity.test.ts && npm run type-check`
Expected: 全部 PASS（`mobileParity` 測試檢查手機／桌機選單項目一致，三處都加了才會過）。

- [ ] **Step 7: Commit**

```bash
git add src/router/index.ts src/components/AppMenuTree.vue src/views/SkillStudio.vue src/scss/views/_SkillStudio.scss src/scss/views/_index.scss src/components/__tests__/AppMenuTree.skillLabel.test.ts src/views/__tests__/SkillStudio.test.ts
git commit -m "feat(skill): add AI 賦能 route, sidebar entry and SkillStudio page shell"
```

---

### Task 4: `SkillStudioChat.vue`（左側對話）

**Files:**
- Create: `src/components/Skill/SkillStudioChat.vue`
- Modify: `src/scss/views/_SkillStudio.scss`（追加 `.SkillStudioChat` 區塊）
- Test: `src/components/__tests__/SkillStudioChat.test.ts`

**Interfaces:**
- Consumes: `StudioMode`、`StudioMessage`、`StudioSuggestion`（Task 2）、`Skill`（store）
- Produces:

```ts
props: {
  mode: StudioMode
  skillName: string           // 修改模式顯示用
  savedSkillId: string | null
  messages: StudioMessage[]
  isRunning: boolean
  suggestionChips: StudioSuggestion[]
  personalSkills: Skill[]
}
emits: { send: [text: string]; 'switch-skill': [skillId: string]; 'new-skill': [] }
```

- [ ] **Step 1: 寫失敗測試**

`src/components/__tests__/SkillStudioChat.test.ts`：

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SkillStudioChat from '@/components/Skill/SkillStudioChat.vue'
import type { StudioMessage, StudioSuggestion } from '@/composables/useSkillStudioConversation'

const chips: StudioSuggestion[] = [
  { icon: 'inventory_2', label: '查庫存', prefill: '幫我建立一個能查庫存的技能' },
]

function mountChat(over: Partial<Record<string, unknown>> = {}) {
  return mount(SkillStudioChat, {
    props: {
      mode: 'create',
      skillName: '',
      savedSkillId: null,
      messages: [{ id: 'm1', role: 'agent', content: '你好' }] as StudioMessage[],
      isRunning: false,
      suggestionChips: chips,
      personalSkills: [
        { id: 'p1', name: '週報' } as any,
        { id: 'p2', name: '會議摘要' } as any,
      ],
      ...over,
    },
  })
}

describe('SkillStudioChat', () => {
  it('建立模式顯示「建立新技能」chip；修改模式顯示「修改：{name}」', () => {
    expect(mountChat().find('.ssc-mode-chip').text()).toContain('建立新技能')
    expect(mountChat({ mode: 'edit', skillName: '週報' }).find('.ssc-mode-chip').text()).toContain('修改：週報')
  })

  it('只有 Agent 開場訊息時顯示建議 chip；點擊帶入輸入框而不送出', async () => {
    const w = mountChat()
    const chip = w.find('.ssc-chip')
    expect(chip.exists()).toBe(true)
    await chip.trigger('click')
    expect((w.find('input.custom-input').element as HTMLInputElement).value).toBe('幫我建立一個能查庫存的技能')
    expect(w.emitted('send')).toBeUndefined()
  })

  it('有使用者訊息後不再顯示建議 chip', () => {
    const w = mountChat({
      messages: [
        { id: 'm1', role: 'agent', content: '你好' },
        { id: 'm2', role: 'user', content: '嗨' },
      ] as StudioMessage[],
    })
    expect(w.find('.ssc-chip').exists()).toBe(false)
  })

  it('輸入後按 Enter 或送出鈕會 emit send 並清空輸入框', async () => {
    const w = mountChat()
    const input = w.find('input.custom-input')
    await input.setValue('  幫我做一個技能  ')
    await input.trigger('keydown.enter')
    expect(w.emitted('send')?.[0]).toEqual(['幫我做一個技能'])
    expect((input.element as HTMLInputElement).value).toBe('')
  })

  it('Agent 訊息帶 actions 時渲染動作 chip，點擊 emit send(label)', async () => {
    const w = mountChat({
      messages: [{ id: 'm1', role: 'agent', content: '擬好了', actions: [{ id: 'confirm', label: '看起來沒問題，儲存' }] }] as StudioMessage[],
    })
    const btn = w.find('.ssc-action-chip')
    expect(btn.text()).toBe('看起來沒問題，儲存')
    await btn.trigger('click')
    expect(w.emitted('send')?.[0]).toEqual(['看起來沒問題，儲存'])
  })

  it('isRunning 時顯示 typing 氣泡且輸入框 disabled', () => {
    const w = mountChat({ isRunning: true })
    expect(w.find('.bubble-typing').exists()).toBe(true)
    expect(w.find('input.custom-input').attributes('disabled')).toBeDefined()
  })

  it('切換技能下拉列出個人技能；選擇後 emit switch-skill；「建立新技能」按鈕 emit new-skill', async () => {
    const w = mountChat()
    const options = w.findAll('.ssc-skill-select option')
    expect(options.map(o => o.text())).toEqual(['切換技能', '週報', '會議摘要'])
    await w.find('.ssc-skill-select').setValue('p2')
    expect(w.emitted('switch-skill')?.[0]).toEqual(['p2'])
    await w.find('.ssc-new-btn').trigger('click')
    expect(w.emitted('new-skill')).toHaveLength(1)
  })
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run src/components/__tests__/SkillStudioChat.test.ts`
Expected: FAIL — 找不到元件。

- [ ] **Step 3: 實作元件**

`src/components/Skill/SkillStudioChat.vue`：

```vue
<template>
  <div class="SkillStudioChat">
    <div class="ssc-head">
      <span :class="['ssc-mode-chip', `ssc-mode-chip--${props.mode}`]">
        <i class="material-symbols-outlined">{{ props.mode === 'create' ? 'auto_fix_high' : 'person' }}</i>
        {{ props.mode === 'create' ? '建立新技能' : `修改：${props.skillName}` }}
      </span>
      <div class="ssc-head-actions">
        <select
          class="custom-input ssc-skill-select"
          :value="props.savedSkillId ?? ''"
          @change="onSwitch"
        >
          <option value="" disabled>切換技能</option>
          <option v-for="s in props.personalSkills" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <button type="button" class="custom-btn ssc-new-btn" @click="emit('new-skill')">
          <i class="material-symbols-outlined">add</i>建立新技能
        </button>
      </div>
    </div>

    <div ref="messagesEl" class="ssc-messages">
      <template v-for="msg in props.messages" :key="msg.id">
        <div :class="['chat-bubble', msg.role === 'user' ? 'bubble--user' : 'bubble--agent']">
          <div v-if="msg.role === 'agent'" class="bubble-label">AI Agent</div>
          <div class="bubble-content">{{ msg.content }}</div>
          <div v-if="msg.actions?.length" class="ssc-actions">
            <button
              v-for="a in msg.actions"
              :key="a.id"
              type="button"
              class="ssc-action-chip"
              :disabled="props.isRunning"
              @click="emit('send', a.label)"
            >{{ a.label }}</button>
          </div>
        </div>
      </template>

      <div v-if="props.isRunning" class="chat-bubble bubble--agent">
        <div class="bubble-label">AI Agent</div>
        <div class="bubble-typing"><span></span><span></span><span></span></div>
      </div>

      <!-- 還沒送出任何訊息前給幾個起手式；點擊只帶入輸入框、不自動送出 -->
      <div v-if="showSuggestions" class="ssc-suggestions">
        <button
          v-for="chip in props.suggestionChips"
          :key="chip.label"
          type="button"
          class="ssc-chip"
          @click="applySuggestion(chip)"
        >
          <i class="material-symbols-outlined">{{ chip.icon }}</i>{{ chip.label }}
        </button>
      </div>
    </div>

    <div class="ssc-input-row">
      <input
        ref="inputEl"
        v-model="inputText"
        class="custom-input"
        :placeholder="props.mode === 'create' ? '描述你想讓 Agent 幫你做什麼...' : '描述你想怎麼修改這份技能...'"
        :disabled="props.isRunning"
        @keydown.enter.prevent="handleSend"
      />
      <button
        type="button"
        class="custom-btn ssc-send-btn"
        :disabled="!inputText.trim() || props.isRunning"
        @click="handleSend"
      >
        <i class="material-symbols-outlined">send</i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { Skill } from '@/stores/skillStore'
import type { StudioMode, StudioMessage, StudioSuggestion } from '@/composables/useSkillStudioConversation'

const props = defineProps<{
  mode: StudioMode
  skillName: string
  savedSkillId: string | null
  messages: StudioMessage[]
  isRunning: boolean
  suggestionChips: StudioSuggestion[]
  personalSkills: Skill[]
}>()

const emit = defineEmits<{
  send: [text: string]
  'switch-skill': [skillId: string]
  'new-skill': []
}>()

const inputText = ref('')
const inputEl = ref<HTMLInputElement | null>(null)
const messagesEl = ref<HTMLElement | null>(null)

const showSuggestions = computed(() => !props.messages.some(m => m.role === 'user'))

function applySuggestion(chip: StudioSuggestion) {
  inputText.value = chip.prefill
  nextTick(() => inputEl.value?.focus())
}

function handleSend() {
  const t = inputText.value.trim()
  if (!t || props.isRunning) return
  inputText.value = ''
  emit('send', t)
}

function onSwitch(e: Event) {
  const id = (e.target as HTMLSelectElement).value
  if (id) emit('switch-skill', id)
}

watch(() => props.messages.length, async () => {
  await nextTick()
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
})
</script>
```

- [ ] **Step 4: 追加 SCSS**

在 `src/scss/views/_SkillStudio.scss` 檔尾追加（`typing-bounce` keyframes 已由 `_SkillTest.scss` 全域定義，直接沿用）：

```scss
// ── 左側：對話 ──
.SkillStudioChat {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;

  .ssc-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--divider-a50);
    flex-shrink: 0;
  }

  .ssc-mode-chip {
    @extend %badge-shape;
    font-size: 12px;
    max-width: 50%;
    overflow: hidden;
    text-overflow: ellipsis;

    .material-symbols-outlined { font-size: 15px; }

    &--create { background: var(--tag-teal-bg); color: var(--tag-teal-text); }
    &--edit   { background: var(--tag-slate-bg); color: var(--tag-slate-text); }
  }

  .ssc-head-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .ssc-skill-select {
    width: 160px;
    font-size: 12.5px;
    padding: 6px 10px;
  }

  .ssc-new-btn {
    gap: 4px;
    font-size: 12.5px;
    white-space: nowrap;
    .material-symbols-outlined { font-size: 16px; }
  }

  .ssc-messages {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    @include use-scroll-bar(var(--scrollbar-a50));
  }

  .chat-bubble {
    max-width: 78%;
    padding: 10px 14px;
    border-radius: 12px;
    font-size: 13.5px;
    line-height: 1.55;

    &.bubble--user {
      align-self: flex-end;
      background: $color_main_1;
      color: var(--text-invert, #fff);
      border-bottom-right-radius: 4px;
    }

    &.bubble--agent {
      align-self: flex-start;
      background: var(--page-bg);
      border: 1px solid var(--divider-a50);
      color: var(--text);
      border-bottom-left-radius: 4px;
    }

    .bubble-label {
      font-size: 11px;
      font-weight: 600;
      color: $color_main_2;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .bubble-content {
      word-break: break-word;
      white-space: pre-wrap;
    }
  }

  .bubble-typing {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 0;

    span {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--text-muted);
      animation: typing-bounce 1.2s infinite ease-in-out;
      &:nth-child(2) { animation-delay: 0.2s; }
      &:nth-child(3) { animation-delay: 0.4s; }
    }
  }

  .ssc-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
  }

  .ssc-action-chip,
  .ssc-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid var(--divider-a50);
    background: var(--surface);
    color: var(--text-muted);
    font-size: 12.5px;
    cursor: pointer;
    transition: background-color 0.15s, border-color 0.15s, color 0.15s;

    .material-symbols-outlined { font-size: 15px; }

    &:hover:not(:disabled) {
      background: var(--accent-soft);
      border-color: $color_main_3;
      color: $color_main_1;
    }

    &:disabled { opacity: 0.5; cursor: default; }
  }

  .ssc-suggestions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin-top: auto;
    padding-top: 12px;
  }

  .ssc-input-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-top: 1px solid var(--divider-a50);
    flex-shrink: 0;

    .custom-input { flex: 1; }
  }
}
```

- [ ] **Step 5: 跑測試確認通過**

Run: `npx vitest run src/components/__tests__/SkillStudioChat.test.ts && npm run type-check`
Expected: 全部 PASS。

- [ ] **Step 6: Commit**

```bash
git add src/components/Skill/SkillStudioChat.vue src/scss/views/_SkillStudio.scss src/components/__tests__/SkillStudioChat.test.ts
git commit -m "feat(skill): add SkillStudioChat conversation panel"
```

---

### Task 5: `SkillStudioPreview.vue`（右側預覽／測試面板）

**Files:**
- Create: `src/components/Skill/SkillStudioPreview.vue`
- Modify: `src/scss/views/_SkillStudio.scss`（追加 `.SkillStudioPreview`）
- Test: `src/components/__tests__/SkillStudioPreview.test.ts`

**Interfaces:**
- Consumes: `SkillDraft`、`StudioMode`（Task 2）、`SkillTestAI`（既有，props `skillId: string`）、`SkillFileUpload`（既有，`modelValue: SkillFile[]` / `update:modelValue`）
- Produces:

```ts
props: {
  draft: SkillDraft
  mode: StudioMode
  savedSkillId: string | null
  isDirty: boolean
  canSave: boolean
  activeTab: 'preview' | 'test'
}
emits: { 'update:activeTab': [tab: 'preview' | 'test']; save: []; 'update:files': [files: SkillFile[]] }
```

- [ ] **Step 1: 寫失敗測試**

`src/components/__tests__/SkillStudioPreview.test.ts`：

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SkillStudioPreview from '@/components/Skill/SkillStudioPreview.vue'
import { emptyDraft } from '@/composables/useSkillStudioConversation'

function mountPreview(over: Partial<Record<string, unknown>> = {}) {
  setActivePinia(createPinia())
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div/>' } },
      { path: '/view/Skills', name: 'SkillManagement', component: { template: '<div/>' } },
      { path: '/view/SkillTest', name: 'SkillTest', component: { template: '<div/>' } },
      { path: '/view/SkillEditor', name: 'SkillEditor', component: { template: '<div/>' } },
    ],
  })
  return mount(SkillStudioPreview, {
    props: {
      draft: emptyDraft(),
      mode: 'create',
      savedSkillId: null,
      isDirty: false,
      canSave: false,
      activeTab: 'preview',
      ...over,
    },
    global: { plugins: [router], stubs: { SkillTestAI: true, SkillFileUpload: true } },
  })
}

describe('SkillStudioPreview', () => {
  it('空白草稿：六個區塊標籤都在，並顯示各自的空狀態文案與「未儲存草稿」badge', () => {
    const w = mountPreview()
    const text = w.text()
    expect(text).toContain('尚未命名的技能')
    expect(text).toContain('跟 Agent 描述這個技能要做什麼')
    expect(text).toContain('尚未設定觸發條件')
    expect(text).toContain('尚未撰寫技能指令')
    expect(text).toContain('尚未拆解覆蓋能力項目')
    expect(w.find('.ssp-status-badge').text()).toBe('未儲存草稿')
    expect(w.findAll('.ssp-section-label').length).toBe(5) // 說明／觸發條件／技能指令／覆蓋能力／附加檔案
  })

  it('有內容時渲染名稱、觸發、markdown 指令與能力 chip', () => {
    const w = mountPreview({
      draft: { ...emptyDraft(), name: '查庫存', triggerHint: '提到庫存時', instructions: '1. **釐清**\n2. 查詢', capabilities: [{ name: '能力A', description: '' }] },
    })
    expect(w.find('.ssp-title').text()).toBe('查庫存')
    expect(w.text()).toContain('提到庫存時')
    expect(w.find('.markdown-body strong').text()).toBe('釐清')
    expect(w.findAll('.ssp-cap-chip').map(c => c.text())).toEqual(['能力A'])
  })

  it('建立模式主按鈕「儲存為個人技能」依 canSave 決定 disabled，點擊 emit save', async () => {
    const w = mountPreview({ canSave: false })
    const btn = w.find('.ssp-save-btn')
    expect(btn.text()).toContain('儲存為個人技能')
    expect(btn.attributes('disabled')).toBeDefined()
    await w.setProps({ canSave: true })
    await w.find('.ssp-save-btn').trigger('click')
    expect(w.emitted('save')).toHaveLength(1)
  })

  it('修改模式：主按鈕「儲存修改」依 isDirty；顯示「直接編輯」「到技能管理」；badge 依 isDirty 切換', async () => {
    const w = mountPreview({ mode: 'edit', savedSkillId: 'p1', canSave: true, isDirty: false })
    expect(w.find('.ssp-save-btn').text()).toContain('儲存修改')
    expect(w.find('.ssp-save-btn').attributes('disabled')).toBeDefined()
    expect(w.find('.ssp-status-badge').text()).toBe('個人技能 · 可使用')
    expect(w.text()).toContain('直接編輯')
    expect(w.text()).toContain('到技能管理')
    await w.setProps({ isDirty: true })
    expect(w.find('.ssp-save-btn').attributes('disabled')).toBeUndefined()
    expect(w.find('.ssp-status-badge').text()).toBe('有未儲存變更')
  })

  it('測試 tab：未儲存顯示空狀態與儲存鈕；已儲存掛載 SkillTestAI 並帶 skillId', async () => {
    const w = mountPreview({ activeTab: 'test' })
    expect(w.text()).toContain('先儲存技能')
    expect(w.findComponent({ name: 'SkillTestAI' }).exists()).toBe(false)
    await w.setProps({ savedSkillId: 'p1', mode: 'edit' })
    const ai = w.findComponent({ name: 'SkillTestAI' })
    expect(ai.exists()).toBe(true)
    expect(ai.attributes('skillid') ?? ai.props('skillId')).toBe('p1')
  })

  it('已儲存但 isDirty 時，測試 tab 頂端顯示「目前測試的是上次儲存的版本」提示', () => {
    const w = mountPreview({ activeTab: 'test', savedSkillId: 'p1', mode: 'edit', isDirty: true })
    expect(w.text()).toContain('目前測試的是上次儲存的版本')
  })

  it('點 tab 按鈕 emit update:activeTab', async () => {
    const w = mountPreview()
    await w.findAll('.ssp-tab-btn')[1].trigger('click')
    expect(w.emitted('update:activeTab')?.[0]).toEqual(['test'])
  })
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run src/components/__tests__/SkillStudioPreview.test.ts`
Expected: FAIL — 找不到元件。

- [ ] **Step 3: 實作元件**

`src/components/Skill/SkillStudioPreview.vue`：

```vue
<template>
  <div class="SkillStudioPreview">
    <div class="ssp-tabs">
      <button
        type="button"
        :class="['ssp-tab-btn', { 'is-active': props.activeTab === 'preview' }]"
        @click="emit('update:activeTab', 'preview')"
      >
        <i class="material-symbols-outlined">preview</i>技能預覽
      </button>
      <button
        type="button"
        :class="['ssp-tab-btn', { 'is-active': props.activeTab === 'test' }]"
        @click="emit('update:activeTab', 'test')"
      >
        <i class="material-symbols-outlined">science</i>測試
      </button>
    </div>

    <!-- ── 技能預覽 ── -->
    <template v-if="props.activeTab === 'preview'">
      <div class="ssp-body">
        <div class="ssp-title-row">
          <div :class="['ssp-title', { 'is-empty': !props.draft.name }]">
            {{ props.draft.name || '尚未命名的技能' }}
          </div>
          <span :class="['ssp-status-badge', `ssp-status-badge--${status.tone}`]">{{ status.label }}</span>
        </div>

        <div class="ssp-section">
          <div class="ssp-section-label">說明</div>
          <p v-if="props.draft.description" class="ssp-text">{{ props.draft.description }}</p>
          <p v-else class="ssp-empty">跟 Agent 描述這個技能要做什麼</p>
        </div>

        <div class="ssp-section">
          <div class="ssp-section-label">觸發條件</div>
          <p v-if="props.draft.triggerHint" class="ssp-text">{{ props.draft.triggerHint }}</p>
          <p v-else class="ssp-empty">尚未設定觸發條件</p>
        </div>

        <div class="ssp-section">
          <div class="ssp-section-label">技能指令</div>
          <div v-if="instructionsHtml" class="markdown-body ssp-markdown" v-html="instructionsHtml"></div>
          <p v-else class="ssp-empty">尚未撰寫技能指令</p>
        </div>

        <div class="ssp-section">
          <div class="ssp-section-label">覆蓋能力</div>
          <div v-if="props.draft.capabilities.length" class="ssp-caps">
            <span v-for="cap in props.draft.capabilities" :key="cap.name" class="ssp-cap-chip">{{ cap.name }}</span>
          </div>
          <p v-else class="ssp-empty">尚未拆解覆蓋能力項目</p>
        </div>

        <div class="ssp-section">
          <button type="button" class="ssp-section-label ssp-files-toggle" @click="filesExpanded = !filesExpanded">
            附加檔案<template v-if="props.draft.files.length">（{{ props.draft.files.length }}）</template>
            <i class="material-symbols-outlined">{{ filesExpanded ? 'expand_less' : 'expand_more' }}</i>
          </button>
          <SkillFileUpload
            v-if="filesExpanded"
            :model-value="props.draft.files"
            @update:model-value="emit('update:files', $event)"
          />
        </div>
      </div>

      <div class="ssp-footer">
        <button
          type="button"
          class="custom-btn custom-main-btn ssp-save-btn"
          :disabled="!saveEnabled"
          @click="emit('save')"
        >
          <i class="material-symbols-outlined">save</i>
          {{ props.mode === 'create' ? '儲存為個人技能' : '儲存修改' }}
        </button>
        <template v-if="props.mode === 'edit' && props.savedSkillId">
          <button type="button" class="custom-btn" @click="router.push({ path: '/view/SkillEditor', query: { skillId: props.savedSkillId } })">
            <i class="material-symbols-outlined">edit</i>直接編輯
          </button>
          <button type="button" class="custom-btn" @click="router.push({ path: '/view/Skills' })">
            <i class="material-symbols-outlined">auto_awesome</i>到技能管理
          </button>
        </template>
      </div>
    </template>

    <!-- ── 測試 ── -->
    <template v-else>
      <div v-if="!props.savedSkillId" class="ssp-test-empty">
        <i class="material-symbols-outlined">science</i>
        <p>先儲存技能，就能讓 AI 自動產生測試情境並逐條驗證</p>
        <button type="button" class="custom-btn custom-main-btn" :disabled="!props.canSave" @click="emit('save')">
          <i class="material-symbols-outlined">save</i>儲存為個人技能
        </button>
      </div>
      <div v-else class="ssp-test-body">
        <div v-if="props.isDirty" class="ssp-stale-banner">
          <i class="material-symbols-outlined">info</i>
          目前測試的是上次儲存的版本，請先儲存修改
        </div>
        <SkillTestAI :skill-id="props.savedSkillId" />
        <div class="ssp-test-foot">
          想手動對話測試？
          <a href="#" @click.prevent="router.push({ path: '/view/SkillTest', query: { skillId: props.savedSkillId } })">到技能測試沙盒</a>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import MarkdownIt from 'markdown-it'
import 'github-markdown-css/github-markdown.css'
import type { SkillFile } from '@/stores/skillStore'
import type { SkillDraft, StudioMode } from '@/composables/useSkillStudioConversation'
import SkillTestAI from '@/components/Skill/SkillTestAI.vue'
import SkillFileUpload from '@/components/Skill/SkillFileUpload.vue'

const props = defineProps<{
  draft: SkillDraft
  mode: StudioMode
  savedSkillId: string | null
  isDirty: boolean
  canSave: boolean
  activeTab: 'preview' | 'test'
}>()

const emit = defineEmits<{
  'update:activeTab': [tab: 'preview' | 'test']
  save: []
  'update:files': [files: SkillFile[]]
}>()

const router = useRouter()
const md = new MarkdownIt({ html: false, breaks: true, linkify: false })
const filesExpanded = ref(false)

const instructionsHtml = computed(() =>
  props.draft.instructions.trim() ? md.render(props.draft.instructions) : ''
)

// 建立模式：有名稱＋指令就能存；修改模式：還要真的有改動
const saveEnabled = computed(() =>
  props.mode === 'create' ? props.canSave : props.canSave && props.isDirty
)

const status = computed<{ label: string; tone: 'amber' | 'slate' }>(() => {
  if (!props.savedSkillId) return { label: '未儲存草稿', tone: 'amber' }
  if (props.isDirty) return { label: '有未儲存變更', tone: 'amber' }
  return { label: '個人技能 · 可使用', tone: 'slate' }
})
</script>
```

- [ ] **Step 4: 追加 SCSS**

`src/scss/views/_SkillStudio.scss` 檔尾追加：

```scss
// ── 右側：預覽／測試 ──
.SkillStudioPreview {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;

  .ssp-tabs {
    display: flex;
    border-bottom: 1px solid var(--divider-a50);
    background: var(--surface);
    flex-shrink: 0;
  }

  .ssp-tab-btn {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 11px 12px;
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: var(--text-muted);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;

    .material-symbols-outlined { font-size: 17px; }

    &.is-active {
      color: $color_main_1;
      border-bottom-color: $color_main_1;
    }
  }

  .ssp-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    @include use-scroll-bar(var(--scrollbar-a50));
  }

  .ssp-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .ssp-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--text);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &.is-empty { color: var(--text-faint); font-weight: 500; }
  }

  .ssp-status-badge {
    @extend %badge-shape;
    font-size: 11px;
    flex-shrink: 0;

    &--amber { background: var(--tag-amber-bg); color: var(--tag-amber-text); }
    &--slate { background: var(--tag-slate-bg); color: var(--tag-slate-text); }
  }

  .ssp-section-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-faint);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 6px;
  }

  .ssp-files-toggle {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: none;
    background: transparent;
    padding: 0;
    cursor: pointer;
    .material-symbols-outlined { font-size: 18px; }
  }

  .ssp-text {
    margin: 0;
    font-size: 13px;
    line-height: 1.6;
    color: var(--text);
  }

  .ssp-empty {
    margin: 0;
    font-size: 12.5px;
    color: var(--text-faint);
  }

  .ssp-markdown.markdown-body {
    background: transparent;
    color: var(--text);
    font-size: 13px;
    line-height: 1.7;
    font-family: inherit;
    p, ul, ol { margin: 0 0 6px; }
    ul, ol { padding-left: 18px; }
    strong { color: var(--text); }
  }

  .ssp-caps {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .ssp-cap-chip {
    @extend %badge-shape;
    font-size: 12px;
    font-weight: 500;
    background: var(--tag-teal-bg);
    color: var(--tag-teal-text);
  }

  .ssp-footer {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px 18px;
    border-top: 1px solid var(--divider-a50);
    background: var(--surface);
    flex-shrink: 0;

    .custom-btn { gap: 4px; .material-symbols-outlined { font-size: 16px; } }
  }

  .ssp-test-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 24px;
    text-align: center;
    color: var(--text-muted);
    font-size: 13px;

    .material-symbols-outlined { font-size: 40px; opacity: 0.35; }
    p { margin: 0; }
  }

  .ssp-test-body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .SkillTestAI { flex: 1; min-height: 0; }
  }

  .ssp-stale-banner {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 12px 18px 0;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12.5px;
    background: var(--tag-amber-bg);
    color: var(--tag-amber-text);
    .material-symbols-outlined { font-size: 16px; }
  }

  .ssp-test-foot {
    padding: 10px 18px;
    border-top: 1px solid var(--divider-a50);
    font-size: 12.5px;
    color: var(--text-muted);
    a { color: $color_main_1; text-decoration: underline; }
  }
}
```

- [ ] **Step 5: 跑測試確認通過**

Run: `npx vitest run src/components/__tests__/SkillStudioPreview.test.ts && npm run type-check`
Expected: 全部 PASS。若 `SkillTestAI` stub 的 `skillId` 斷言失敗，改用 `ai.props('skillId')`（stub 在 test-utils 會保留 props）。

- [ ] **Step 6: Commit**

```bash
git add src/components/Skill/SkillStudioPreview.vue src/scss/views/_SkillStudio.scss src/components/__tests__/SkillStudioPreview.test.ts
git commit -m "feat(skill): add SkillStudioPreview panel with preview and test tabs"
```

---

### Task 6: `SkillStudio.vue` 接線：query 解析、儲存流程、離開守衛

**Files:**
- Modify: `src/views/SkillStudio.vue`
- Test: `src/views/__tests__/SkillStudio.test.ts`（擴充）

**Interfaces:**
- Consumes: `useSkillStudioConversation`（Task 2）、`SkillStudioChat`（Task 4）、`SkillStudioPreview`（Task 5）、`popDialog.toast / confirm`

- [ ] **Step 1: 擴充測試**

在 `src/views/__tests__/SkillStudio.test.ts` 的 `describe('SkillStudio')` 內追加（保留 Task 3 的第一個測項；頂部 import 加 `import popDialog from '@/services/popDialog'` 與 `import { useSkillStore } from '@/stores/skillStore'`）：

```ts
  it('無 query：建立模式，左側 chip「建立新技能」，右側預覽空狀態', async () => {
    const { wrapper } = await mountAt()
    expect(wrapper.find('.ssc-mode-chip').text()).toContain('建立新技能')
    expect(wrapper.text()).toContain('尚未命名的技能')
  })

  it('?skillId= 個人技能：修改模式，預覽帶入該技能內容', async () => {
    const { wrapper } = await mountAt({ skillId: 'personal-001' })
    expect(wrapper.find('.ssc-mode-chip').text()).toContain('修改：週報自動生成')
    expect(wrapper.find('.ssp-title').text()).toBe('週報自動生成')
  })

  it('?skillId= Library 技能：toast 提示並退回建立模式', async () => {
    const { wrapper } = await mountAt({ skillId: 'sys-cs-001' })
    expect(popDialog.toast).toHaveBeenCalledWith('Library 技能請先在技能管理複製為個人技能')
    expect(wrapper.find('.ssc-mode-chip').text()).toContain('建立新技能')
  })

  it('?skillId= 不存在：toast「找不到這個技能」並退回建立模式', async () => {
    const { wrapper } = await mountAt({ skillId: 'nope-999' })
    expect(popDialog.toast).toHaveBeenCalledWith('找不到這個技能')
    expect(wrapper.find('.ssc-mode-chip').text()).toContain('建立新技能')
  })

  it('?tab=test 預設切到測試 tab', async () => {
    const { wrapper } = await mountAt({ skillId: 'personal-001', tab: 'test' })
    expect(wrapper.findAll('.ssp-tab-btn')[1].classes()).toContain('is-active')
  })

  it('送出訊息 → 草稿更新 → 儲存 → 建立個人技能、toast、自動切到測試 tab', async () => {
    vi.useFakeTimers()
    try {
      const { wrapper } = await mountAt()
      const store = useSkillStore()
      const before = store.myPersonalSkills.length
      const input = wrapper.find('.SkillStudioChat input.custom-input')
      await input.setValue('幫我建立一個能查 ERP 庫存的技能')
      await input.trigger('keydown.enter')
      await vi.advanceTimersByTimeAsync(800)
      await flushPromises()
      expect(wrapper.find('.ssp-title').text()).toBe('查 ERP 庫存')
      await wrapper.find('.ssp-save-btn').trigger('click')
      await flushPromises()
      expect(store.myPersonalSkills.length).toBe(before + 1)
      expect(popDialog.toast).toHaveBeenCalledWith('已儲存為個人技能，可到「測試」tab 驗證')
      expect(wrapper.findAll('.ssp-tab-btn')[1].classes()).toContain('is-active')
      expect(wrapper.find('.ssc-mode-chip').text()).toContain('修改：查 ERP 庫存')
    } finally {
      vi.useRealTimers()
    }
  })

  it('切換技能下拉：無未儲存變更時直接切換', async () => {
    const { wrapper } = await mountAt()
    await wrapper.find('.ssc-skill-select').setValue('personal-001')
    await flushPromises()
    expect(wrapper.find('.ssc-mode-chip').text()).toContain('修改：週報自動生成')
  })
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run src/views/__tests__/SkillStudio.test.ts`
Expected: 新增測項 FAIL（殼裡沒有 `.ssc-mode-chip` 等元素）。

- [ ] **Step 3: 實作**

覆寫 `src/views/SkillStudio.vue`：

```vue
<template>
  <div class="SkillStudio views-page">
    <div class="views-page-content-box">
      <div class="page-banner">
        <div>
          <AppBreadcrumb />
          <div class="banner-title">AI 賦能</div>
        </div>
      </div>

      <div class="skill-studio-layout">
        <div class="studio-chat-col">
          <SkillStudioChat
            :mode="conv.mode.value"
            :skill-name="conv.draft.value.name"
            :saved-skill-id="conv.savedSkillId.value"
            :messages="conv.messages.value"
            :is-running="conv.isRunning.value"
            :suggestion-chips="conv.suggestionChips.value"
            :personal-skills="store.myPersonalSkills"
            @send="conv.send"
            @switch-skill="onSwitchSkill"
            @new-skill="onNewSkill"
          />
        </div>
        <div class="studio-side-col">
          <SkillStudioPreview
            v-model:active-tab="activeTab"
            :draft="conv.draft.value"
            :mode="conv.mode.value"
            :saved-skill-id="conv.savedSkillId.value"
            :is-dirty="conv.isDirty.value"
            :can-save="conv.canSave.value"
            @save="onSave"
            @update:files="conv.updateFiles"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, onBeforeRouteLeave } from 'vue-router'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import SkillStudioChat from '@/components/Skill/SkillStudioChat.vue'
import SkillStudioPreview from '@/components/Skill/SkillStudioPreview.vue'
import { useSkillStore } from '@/stores/skillStore'
import { useSkillStudioConversation } from '@/composables/useSkillStudioConversation'
import popDialog from '@/services/popDialog'

const route = useRoute()
const store = useSkillStore()
const conv = useSkillStudioConversation()
const activeTab = ref<'preview' | 'test'>(route.query.tab === 'test' ? 'test' : 'preview')

// ?skillId= 進修改模式；找不到／不是個人技能都退回建立模式，不拋錯
onMounted(() => {
  const skillId = typeof route.query.skillId === 'string' ? route.query.skillId : ''
  if (skillId) {
    const skill = store.findSkill(skillId)
    if (!skill) {
      popDialog.toast('找不到這個技能')
    } else if (skill.zone !== 'personal') {
      popDialog.toast('Library 技能請先在技能管理複製為個人技能')
    } else if (conv.loadSkill(skillId)) {
      return
    }
  }
  conv.startCreate()
})

// 有未儲存變更時，切換／新建／離開前都要確認；沒有變更就直接做
function guardDirty(proceed: () => void) {
  if (!conv.isDirty.value) {
    proceed()
    return
  }
  popDialog.confirm('有未儲存的變更，確定要放棄嗎？', '放棄變更', '留下', proceed)
}

function onSwitchSkill(skillId: string) {
  guardDirty(() => {
    if (!conv.loadSkill(skillId)) popDialog.toast('找不到這個技能')
    activeTab.value = 'preview'
  })
}

function onNewSkill() {
  guardDirty(() => {
    conv.startCreate()
    activeTab.value = 'preview'
  })
}

function onSave() {
  const wasCreate = conv.mode.value === 'create'
  const id = conv.save()
  if (!id) return
  if (wasCreate) {
    popDialog.toast('已儲存為個人技能，可到「測試」tab 驗證')
    activeTab.value = 'test'
  } else {
    popDialog.toast('已儲存修改')
  }
}

onBeforeRouteLeave((_to, _from, next) => {
  if (!conv.isDirty.value) return next()
  popDialog.confirm('有未儲存的變更，確定離開？', '離開', '留下', () => next(), () => next(false))
})
</script>
```

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run src/views/__tests__/SkillStudio.test.ts && npm run type-check`
Expected: 全部 PASS。若 `popDialog.toast` 斷言因 mock 在多個測項間累積而誤判，在 `beforeEach` 加 `vi.clearAllMocks()`。

- [ ] **Step 5: 手動驗證（dev server 已在跑就直接開）**

開 `http://localhost:8088/justagent/view/SkillStudio`：
1. 側邊選單「AI 技能」展開看到「AI 賦能」，點入頁面、麵包屑「AI 技能 / AI 賦能」。
2. 點建議 chip「幫我建立一個能查 ERP 庫存的技能」→ 送出 → 右側名稱「查 ERP 庫存」、三步驟、兩項能力。
3. 點動作 chip「再補一個步驟」→ 指令變四步。
4. 「儲存為個人技能」→ toast、切到測試 tab、`SkillTestAI` 可「生成測試情境」。
5. 「切換技能」選另一顆 → 有變更時跳確認框。

- [ ] **Step 6: Commit**

```bash
git add src/views/SkillStudio.vue src/views/__tests__/SkillStudio.test.ts
git commit -m "feat(skill): wire SkillStudio page — query modes, save flow, leave guard"
```

---

### Task 7: 技能管理「跟 Agent 對話修改」導向 AI 賦能；退役 `SkillEditChatModal` 與 store editChat

**Files:**
- Modify: `src/views/SkillManagement.vue:281-317`（選擇框＋modal）、`:472`（import）、`:499`（state）、`:640-655`（handlers）
- Delete: `src/components/Skill/SkillEditChatModal.vue`、`src/scss/components/_SkillEditChatModal.scss`
- Modify: `src/scss/components/_index.scss:41`
- Modify: `src/stores/skillStore.ts:1724-1773`（editChat 區塊）、`:1848-1851`（return）
- Test: `src/stores/__tests__/skillStore.test.ts:565-573`、`src/views/__tests__/SkillManagement.liveliness.test.ts:14`、`src/views/__tests__/SkillManagement.teamCards.test.ts:13`、新增測項

- [ ] **Step 1: 寫失敗測試**

`src/stores/__tests__/skillStore.test.ts`：刪除 `it('sendEditChatMessage 對草稿狀態的個人技能對話修改後…')` 整個測項（Task 1 的 `applyStudioPatch … draft→available` 測項已覆蓋同一規則）。

`src/views/__tests__/SkillManagement.teamCards.test.ts`：在既有 `describe` 內追加一個測項（沿用該檔案的 `mount` 與 `router` 建立方式；若該檔的 router 沒有 `SkillStudio` 路由，在 routes 陣列補 `{ path: '/view/SkillStudio', name: 'SkillStudio', component: { template: '<div/>' } }`）：

```ts
  it('「跟 Agent 對話修改」導向 AI 賦能並帶 skillId', async () => {
    const { wrapper, router } = mountPage() // 依該檔既有 helper 名稱調整
    const store = useSkillStore()
    const push = vi.spyOn(router, 'push')
    const skill = store.myPersonalSkills[0]
    ;(wrapper.vm as any).editChoiceSkill = skill
    await wrapper.vm.$nextTick()
    const btn = wrapper.findAll('button').find(b => b.text().includes('跟 Agent 對話修改'))
    expect(btn).toBeDefined()
    await btn!.trigger('click')
    expect(push).toHaveBeenCalledWith({ name: 'SkillStudio', query: { skillId: skill.id } })
    expect((wrapper.vm as any).editChoiceSkill).toBeNull()
  })
```

兩個 view 測試檔的 `stubs` 物件移除 `SkillEditChatModal: true`。

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run src/views/__tests__/SkillManagement.teamCards.test.ts`
Expected: 新測項 FAIL（目前點擊只是把 `showEditChatForDuplicate` 設 true，沒有 `router.push`）。

- [ ] **Step 3: 改 `SkillManagement.vue`**

(a) 刪除 import 行 `import SkillEditChatModal from '@/components/Skill/SkillEditChatModal.vue'`。
(b) 刪除 `const showEditChatForDuplicate = ref(false)`。
(c) 選擇框的 `v-if="editChoiceSkill && !showEditChatForDuplicate"` 改成 `v-if="editChoiceSkill"`。
(d) 刪除整段：

```vue
    <SkillEditChatModal
      v-model="showEditChatForDuplicate"
      :skill="editChoiceSkill"
      @done="closeChatEdit"
    />
```

(e) `handleChatEdit` 與 `closeChatEdit` 換成：

```ts
// 對話修改改到「AI 賦能」頁進行：那裡有完整的預覽與測試面板，
// 不再用 modal 擠在技能管理頁裡
function handleChatEdit() {
  if (!editChoiceSkill.value) return
  const skillId = editChoiceSkill.value.id
  editChoiceSkill.value = null
  router.push({ name: 'SkillStudio', query: { skillId } })
}
```

（`closeChatEdit` 整支刪除，連同上方那段「對話修改完，直接引導去技能測試沙盒…」註解。）

- [ ] **Step 4: 刪檔與 SCSS import**

```bash
git rm src/components/Skill/SkillEditChatModal.vue src/scss/components/_SkillEditChatModal.scss
```

`src/scss/components/_index.scss` 刪除 `@import './SkillEditChatModal';`。

`.name-conflict-banner` 原本定義在被刪的 scss 裡；先 `grep -rn "name-conflict-banner" src` — 若只剩 `SkillEditChatModal.vue` 用到，隨檔刪除即可；若其他元件也用，把該段規則搬到 `src/scss/components/_SkillDetailDrawer.scss` 檔尾。

- [ ] **Step 5: 移除 store editChat**

`src/stores/skillStore.ts` 刪除 L1724-1773 之間這些：`editChatHistory`、`editChatIsRunning`、`resetEditChat`、`sendEditChatMessage`（保留中間的 `suggestVersionName`，它仍被送審流程使用）；return 區塊刪除對應四行。若 `ChatMessage` 型別仍被 `SkillTestChat`／`testConversationHistory` 使用則保留（會的）。

- [ ] **Step 6: 跑測試確認通過**

Run: `npx vitest run src/views/__tests__/SkillManagement.teamCards.test.ts src/views/__tests__/SkillManagement.liveliness.test.ts src/stores/__tests__/skillStore.test.ts && npm run type-check && grep -rn "SkillEditChatModal\|sendEditChatMessage\|editChatHistory" src ; echo "grep exit=$?"`
Expected: 測試 PASS、type-check 無錯、grep 無任何命中（exit=1）。

- [ ] **Step 7: Commit**

```bash
git add -A src/views/SkillManagement.vue src/scss/components/_index.scss src/stores/skillStore.ts src/stores/__tests__/skillStore.test.ts src/views/__tests__/SkillManagement.teamCards.test.ts src/views/__tests__/SkillManagement.liveliness.test.ts src/scss/components/_SkillDetailDrawer.scss
git commit -m "refactor(skill): route chat-edit to SkillStudio, retire SkillEditChatModal and store editChat"
```

---

### Task 8: `useSkillSuggestion` composable（AiViewer 端）

**Files:**
- Create: `src/composables/useSkillSuggestion.ts`
- Test: `src/composables/__tests__/useSkillSuggestion.test.ts`

**Interfaces:**
- Consumes: `useSkillStore().createPersonalSkill`（Task 1）
- Produces（Task 9／10 依賴）:

```ts
export interface SkillSuggestion { id: string; name: string; description: string; triggerHint: string; steps: string[]; reason: string }
export type SkillSuggestStage = 'ask' | 'preview' | 'saved' | 'skipped'
export interface SuggestionCtx { push: (msg: any) => void; scroll: () => void }
export function useSkillSuggestion(): {
  offer(ctx: SuggestionCtx, suggestion: SkillSuggestion): void
  handleAction(action: string, suggestionId: string): boolean
  reset(suggestionId: string): void
}
```

訊息物件格式（`AiViewerRecord` 讀這些欄位）：`{ agent: 'brain', cardType: 'skillSuggest', suggestion, stage, skillId?, finishResponse? }`；使用者回聲訊息 `{ forUser: true, msg }`。
data-action 名稱：`skill-suggest-build`、`skill-suggest-skip`、`skill-suggest-confirm`；`data-id` 帶 `suggestion.id`。

- [ ] **Step 1: 寫失敗測試**

`src/composables/__tests__/useSkillSuggestion.test.ts`：

```ts
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useSkillStore } from '@/stores/skillStore'
import { useSkillSuggestion } from '@/composables/useSkillSuggestion'
import type { SkillSuggestion } from '@/composables/useSkillSuggestion'

const SUGGESTION: SkillSuggestion = {
  id: 'conv4-sales-report',
  name: '產品銷售報告整理',
  description: '查詢指定月份產品銷售數據，並依三諾產品部輸出報告規範自動產出報告',
  triggerHint: '偵測到「查詢銷售資料＋套用部門報告規範」類型的整理需求',
  steps: ['查詢指定月份產品銷售數據', '套用三諾產品部輸出報告規範自動產出報告'],
  reason: '查詢銷售資料＋套用部門報告規範',
}

function makeCtx() {
  const msgs: any[] = []
  return { msgs, ctx: { push: (m: any) => msgs.push(m), scroll: vi.fn() } }
}

describe('useSkillSuggestion', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('offer 推入一則 brain 的 ask 卡片', () => {
    const { msgs, ctx } = makeCtx()
    useSkillSuggestion().offer(ctx, SUGGESTION)
    expect(msgs).toHaveLength(1)
    expect(msgs[0]).toMatchObject({ agent: 'brain', cardType: 'skillSuggest', stage: 'ask' })
    expect(msgs[0].suggestion.id).toBe('conv4-sales-report')
    expect(ctx.scroll).toHaveBeenCalled()
  })

  it('build：推使用者回聲，500ms 後推 preview 卡', () => {
    const { msgs, ctx } = makeCtx()
    const s = useSkillSuggestion()
    s.offer(ctx, SUGGESTION)
    expect(s.handleAction('skill-suggest-build', SUGGESTION.id)).toBe(true)
    expect(msgs[1]).toMatchObject({ forUser: true, msg: '是，建立成個人技能' })
    vi.advanceTimersByTime(500)
    expect(msgs[2]).toMatchObject({ cardType: 'skillSuggest', stage: 'preview' })
  })

  it('confirm：真的建立個人技能（ai_assisted、步驟編號成指令），推 saved 卡帶 skillId', () => {
    const store = useSkillStore()
    const before = store.myPersonalSkills.length
    const { msgs, ctx } = makeCtx()
    const s = useSkillSuggestion()
    s.offer(ctx, SUGGESTION)
    s.handleAction('skill-suggest-build', SUGGESTION.id)
    vi.advanceTimersByTime(500)
    expect(s.handleAction('skill-suggest-confirm', SUGGESTION.id)).toBe(true)
    vi.advanceTimersByTime(500)
    expect(store.myPersonalSkills.length).toBe(before + 1)
    const created = store.myPersonalSkills[0]
    expect(created.name).toBe('產品銷售報告整理')
    expect(created.creationMethod).toBe('ai_assisted')
    expect(created.zone).toBe('personal')
    expect(created.instructions).toBe('1. 查詢指定月份產品銷售數據\n2. 套用三諾產品部輸出報告規範自動產出報告')
    expect(created.triggerHint).toBe(SUGGESTION.triggerHint)
    expect(created.capabilities?.map(c => c.name)).toEqual(SUGGESTION.steps)
    const saved = msgs.at(-1)
    expect(saved).toMatchObject({ cardType: 'skillSuggest', stage: 'saved', finishResponse: true, skillId: created.id })
  })

  it('skip：推使用者回聲與婉拒訊息；之後 build 無效（one-shot）', () => {
    const store = useSkillStore()
    const before = store.myPersonalSkills.length
    const { msgs, ctx } = makeCtx()
    const s = useSkillSuggestion()
    s.offer(ctx, SUGGESTION)
    expect(s.handleAction('skill-suggest-skip', SUGGESTION.id)).toBe(true)
    vi.advanceTimersByTime(500)
    expect(msgs.at(-1).msg).toContain('好的')
    const len = msgs.length
    expect(s.handleAction('skill-suggest-build', SUGGESTION.id)).toBe(true) // 有攔到，但不做事
    vi.advanceTimersByTime(500)
    expect(msgs.length).toBe(len)
    expect(store.myPersonalSkills.length).toBe(before)
  })

  it('confirm 只會建立一次；reset 後可重播整個流程', () => {
    const store = useSkillStore()
    const before = store.myPersonalSkills.length
    const { ctx } = makeCtx()
    const s = useSkillSuggestion()
    s.offer(ctx, SUGGESTION)
    s.handleAction('skill-suggest-build', SUGGESTION.id)
    vi.advanceTimersByTime(500)
    s.handleAction('skill-suggest-confirm', SUGGESTION.id)
    s.handleAction('skill-suggest-confirm', SUGGESTION.id)
    vi.advanceTimersByTime(500)
    expect(store.myPersonalSkills.length).toBe(before + 1)

    s.reset(SUGGESTION.id)
    s.offer(ctx, SUGGESTION)
    s.handleAction('skill-suggest-build', SUGGESTION.id)
    vi.advanceTimersByTime(500)
    s.handleAction('skill-suggest-confirm', SUGGESTION.id)
    vi.advanceTimersByTime(500)
    expect(store.myPersonalSkills.length).toBe(before + 2)
  })

  it('非 skill-suggest- 開頭的 action 或未知 id 回 false', () => {
    const s = useSkillSuggestion()
    expect(s.handleAction('conv7-satisfied', 'x')).toBe(false)
    expect(s.handleAction('skill-suggest-build', 'never-offered')).toBe(false)
  })
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run src/composables/__tests__/useSkillSuggestion.test.ts`
Expected: FAIL — 模組不存在。

- [ ] **Step 3: 實作**

`src/composables/useSkillSuggestion.ts`：

```ts
import { useSkillStore } from '@/stores/skillStore'

// 專案內由 Agent 發起「這個流程要不要建立成個人技能？」的可重用流程。
// 任何 convN 腳本只要提供自己的 push/scroll，就能一行 offer()；按鈕點擊由
// AiViewerRightBox 的 handleChatAreaClick 事件委派轉進 handleAction()。
// 卡片本體是 SkillSuggestCard.vue（cardType: 'skillSuggest'）。

export interface SkillSuggestion {
  id: string          // 一則建議一個 id，one-shot 旗標以此為 key
  name: string
  description: string
  triggerHint: string
  steps: string[]     // 依序編號組成 instructions，同時每步轉成一項覆蓋能力
  reason: string      // 「我留意到「{reason}」這類流程…」
}

export type SkillSuggestStage = 'ask' | 'preview' | 'saved' | 'skipped'

export interface SuggestionCtx {
  push: (msg: any) => void
  scroll: () => void
}

interface SuggestionState {
  ctx: SuggestionCtx
  suggestion: SkillSuggestion
  choiceMade: boolean
  confirmed: boolean
}

export const SKILL_SUGGEST_ACTIONS = {
  build: 'skill-suggest-build',
  skip: 'skill-suggest-skip',
  confirm: 'skill-suggest-confirm',
} as const

export function useSkillSuggestion() {
  const store = useSkillStore()
  const states = new Map<string, SuggestionState>()

  function offer(ctx: SuggestionCtx, suggestion: SkillSuggestion): void {
    states.set(suggestion.id, { ctx, suggestion, choiceMade: false, confirmed: false })
    ctx.push({ agent: 'brain', cardType: 'skillSuggest', suggestion, stage: 'ask' as SkillSuggestStage })
    ctx.scroll()
  }

  function build(st: SuggestionState) {
    if (st.choiceMade) return
    st.choiceMade = true
    st.ctx.push({ forUser: true, msg: '是，建立成個人技能' })
    st.ctx.scroll()
    setTimeout(() => {
      st.ctx.push({ agent: 'brain', cardType: 'skillSuggest', suggestion: st.suggestion, stage: 'preview' as SkillSuggestStage })
      st.ctx.scroll()
    }, 500)
  }

  function skip(st: SuggestionState) {
    if (st.choiceMade) return
    st.choiceMade = true
    st.ctx.push({ forUser: true, msg: '不用了' })
    st.ctx.scroll()
    setTimeout(() => {
      st.ctx.push({ agent: 'brain', msg: '好的，這次的結果已保留在畫布中，之後有需要再跟我說一聲！' })
      st.ctx.scroll()
    }, 500)
  }

  function confirm(st: SuggestionState) {
    if (!st.choiceMade || st.confirmed) return
    st.confirmed = true
    st.ctx.push({ forUser: true, msg: '確認並建立' })
    st.ctx.scroll()
    const s = st.suggestion
    const skillId = store.createPersonalSkill({
      name: s.name,
      description: s.description,
      instructions: s.steps.map((step, i) => `${i + 1}. ${step}`).join('\n'),
      triggerHint: s.triggerHint,
      isEnabled: true,
      assignedAgents: [],
      capabilities: s.steps.map(step => ({ name: step, description: '' })),
      creationMethod: 'ai_assisted',
    })
    setTimeout(() => {
      st.ctx.push({
        agent: 'brain',
        cardType: 'skillSuggest',
        suggestion: s,
        stage: 'saved' as SkillSuggestStage,
        skillId,
        finishResponse: true,
      })
      st.ctx.scroll()
    }, 500)
  }

  function handleAction(action: string, suggestionId: string): boolean {
    if (!action.startsWith('skill-suggest-')) return false
    const st = states.get(suggestionId)
    if (!st) return false
    if (action === SKILL_SUGGEST_ACTIONS.build) build(st)
    else if (action === SKILL_SUGGEST_ACTIONS.skip) skip(st)
    else if (action === SKILL_SUGGEST_ACTIONS.confirm) confirm(st)
    return true
  }

  function reset(suggestionId: string): void {
    states.delete(suggestionId)
  }

  return { offer, handleAction, reset }
}
```

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run src/composables/__tests__/useSkillSuggestion.test.ts && npm run type-check`
Expected: 全部 PASS。

- [ ] **Step 5: Commit**

```bash
git add src/composables/useSkillSuggestion.ts src/composables/__tests__/useSkillSuggestion.test.ts
git commit -m "feat(aiviewer): add useSkillSuggestion composable that really creates a personal skill"
```

---

### Task 9: `SkillSuggestCard.vue` ＋ `AiViewerRecord` 分支 ＋ SCSS

**Files:**
- Create: `src/components/AiViewer/SkillSuggestCard.vue`
- Create: `src/scss/components/_SkillSuggestCard.scss`；Modify: `src/scss/components/_index.scss`
- Modify: `src/components/AiViewer/AiViewerRecord.vue:95-101`（`delegateStatus` 分支之後）、`:139-144`（imports）
- Test: `src/components/__tests__/SkillSuggestCard.test.ts`

**Interfaces:**
- Consumes: `SkillSuggestion`、`SkillSuggestStage`（Task 8）
- Produces: 元件 props `{ suggestion: SkillSuggestion; stage: SkillSuggestStage; skillId?: string }`；按鈕 `data-action` ＝ `skill-suggest-build / skill-suggest-skip / skill-suggest-confirm / goto-skill-studio / goto-skill-management`，`data-id` ＝ `suggestion.id`，`goto-skill-studio` 的 `data-value` ＝ `skillId`

- [ ] **Step 1: 寫失敗測試**

`src/components/__tests__/SkillSuggestCard.test.ts`：

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SkillSuggestCard from '@/components/AiViewer/SkillSuggestCard.vue'
import type { SkillSuggestion } from '@/composables/useSkillSuggestion'

const S: SkillSuggestion = {
  id: 'sg-1',
  name: '產品銷售報告整理',
  description: '查詢並產出報告',
  triggerHint: '偵測到銷售整理需求',
  steps: ['查詢數據', '套用規範產出'],
  reason: '查詢銷售資料＋套用部門報告規範',
}

describe('SkillSuggestCard', () => {
  it('ask：顯示 reason 與兩顆 data-action 按鈕（build / skip）並帶 data-id', () => {
    const w = mount(SkillSuggestCard, { props: { suggestion: S, stage: 'ask' } })
    expect(w.text()).toContain('查詢銷售資料＋套用部門報告規範')
    const btns = w.findAll('[data-action]')
    expect(btns.map(b => b.attributes('data-action'))).toEqual(['skill-suggest-build', 'skill-suggest-skip'])
    expect(btns[0].attributes('data-id')).toBe('sg-1')
    expect(btns[0].text()).toBe('是，建立成個人技能')
    expect(btns[1].text()).toBe('不用了')
  })

  it('preview：顯示名稱、觸發條件、編號步驟與「確認並建立」', () => {
    const w = mount(SkillSuggestCard, { props: { suggestion: S, stage: 'preview' } })
    expect(w.find('.ssg-name').text()).toBe('產品銷售報告整理')
    expect(w.text()).toContain('偵測到銷售整理需求')
    expect(w.findAll('.ssg-step').map(s => s.text())).toEqual(['查詢數據', '套用規範產出'])
    const btn = w.find('[data-action="skill-suggest-confirm"]')
    expect(btn.text()).toBe('確認並建立')
    expect(btn.attributes('data-id')).toBe('sg-1')
  })

  it('saved：顯示已建立文案與兩個連結（AI 賦能 帶 skillId、技能管理）', () => {
    const w = mount(SkillSuggestCard, { props: { suggestion: S, stage: 'saved', skillId: 'personal-9' } })
    expect(w.text()).toContain('已建立個人技能「產品銷售報告整理」')
    const studio = w.find('[data-action="goto-skill-studio"]')
    expect(studio.attributes('data-value')).toBe('personal-9')
    expect(w.find('[data-action="goto-skill-management"]').exists()).toBe(true)
    expect(w.find('[data-action^="skill-suggest-"]').exists()).toBe(false)
  })

  it('未知 stage：只顯示名稱，不渲染任何按鈕', () => {
    const w = mount(SkillSuggestCard, { props: { suggestion: S, stage: 'skipped' } })
    expect(w.find('[data-action]').exists()).toBe(false)
  })
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run src/components/__tests__/SkillSuggestCard.test.ts`
Expected: FAIL — 找不到元件。

- [ ] **Step 3: 實作元件**

`src/components/AiViewer/SkillSuggestCard.vue`：

```vue
<template>
  <div class="skill-suggest-card" :class="`skill-suggest-card--${props.stage}`">
    <!-- ask：只問要不要，卡片本體先不出現 -->
    <template v-if="props.stage === 'ask'">
      <p class="ssg-ask">
        我留意到「{{ props.suggestion.reason }}」這類流程你之後可能會重複用到。要不要我把它建立成你的個人技能？
      </p>
      <div class="conv1-quick-btns">
        <span class="conv1-quick-btn" data-action="skill-suggest-build" :data-id="props.suggestion.id">是，建立成個人技能</span>
        <span class="conv1-quick-btn" data-action="skill-suggest-skip" :data-id="props.suggestion.id">不用了</span>
      </div>
    </template>

    <!-- preview：讓使用者確認設定 -->
    <template v-else-if="props.stage === 'preview'">
      <p class="ssg-lead">好的，我先整理這個流程的設定，請確認以下內容：</p>
      <div class="ssg-card">
        <span class="ssg-icon material-symbols-outlined">extension</span>
        <div class="ssg-card-body">
          <div class="ssg-name">{{ props.suggestion.name }}</div>
          <div class="ssg-row"><span class="ssg-label">觸發條件</span>{{ props.suggestion.triggerHint }}</div>
          <div class="ssg-row">
            <span class="ssg-label">執行步驟</span>
            <ol class="ssg-steps">
              <li v-for="(step, i) in props.suggestion.steps" :key="i" class="ssg-step">{{ step }}</li>
            </ol>
          </div>
        </div>
      </div>
      <div class="conv1-quick-btns">
        <span class="conv1-quick-btn" data-action="skill-suggest-confirm" :data-id="props.suggestion.id">確認並建立</span>
      </div>
    </template>

    <!-- saved：已寫入 skillStore -->
    <template v-else-if="props.stage === 'saved'">
      <p class="ssg-lead">✅ 已建立個人技能「{{ props.suggestion.name }}」，目前只有你可以使用。</p>
      <div class="ssg-links">
        <span class="ssg-link" data-action="goto-skill-studio" :data-value="props.skillId">
          <i class="material-symbols-outlined">auto_fix_high</i>到 AI 賦能 調整與測試
        </span>
        <span class="ssg-link" data-action="goto-skill-management">
          <i class="material-symbols-outlined">auto_awesome</i>到技能管理
        </span>
      </div>
    </template>

    <!-- 其他 stage：只留名稱，不給任何按鈕 -->
    <template v-else>
      <div class="ssg-name">{{ props.suggestion.name }}</div>
    </template>
  </div>
</template>

<script setup lang="ts">
// 「建議建立成個人技能」卡片，純呈現：三個階段的內容都由 stage 決定，
// 按鈕不 emit、只掛 data-action／data-id，交給 AiViewerRightBox 的
// handleChatAreaClick 事件委派（跟 .conv1-quick-btn／DelegateStatusCard 同一套機制）
import type { SkillSuggestion, SkillSuggestStage } from '@/composables/useSkillSuggestion'

const props = defineProps<{
  suggestion: SkillSuggestion
  stage: SkillSuggestStage
  skillId?: string
}>()
</script>
```

- [ ] **Step 4: `AiViewerRecord.vue` 分支與 import**

在 `delegateStatus` 分支（`</template>` 結尾）之後、`isProcessing` 分支之前插入：

```vue
        <!-- 建議建立成個人技能（ask / preview / saved），見 useSkillSuggestion -->
        <template v-else-if="props.source.cardType === 'skillSuggest'">
          <SkillSuggestCard
            :suggestion="props.source.suggestion"
            :stage="props.source.stage"
            :skill-id="props.source.skillId"
          />
        </template>
```

`<script>` imports 補：

```ts
import SkillSuggestCard from '@/components/AiViewer/SkillSuggestCard.vue'
```

- [ ] **Step 5: SCSS**

`src/scss/components/_SkillSuggestCard.scss`：

```scss
// ── AiViewer 對話河道：建議建立成個人技能卡片 ──
.skill-suggest-card {
  .ssg-ask,
  .ssg-lead {
    margin: 0 0 8px;
  }

  .ssg-card {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    border: 1px solid var(--divider-a50);
    border-radius: 10px;
    padding: 10px 12px;
    margin-bottom: 8px;
    background: var(--surface);
  }

  .ssg-icon {
    font-size: 20px;
    line-height: 1;
    color: $color_main_1;
    flex-shrink: 0;
  }

  .ssg-card-body {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .ssg-name {
    font-weight: 700;
    color: var(--text);
  }

  .ssg-row {
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1.55;
  }

  .ssg-label {
    font-weight: 600;
    color: var(--text);
    margin-right: 6px;
  }

  .ssg-steps {
    margin: 4px 0 0;
    padding-left: 18px;
    li { margin-bottom: 2px; }
  }

  .ssg-links {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .ssg-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--primary);
    text-decoration: underline;
    cursor: pointer;
    font-weight: 600;
    .material-symbols-outlined { font-size: 16px; }
  }
}
```

`src/scss/components/_index.scss` 在 `@import './SkillTestAI';` 之後加 `@import './SkillSuggestCard';`。

- [ ] **Step 6: 跑測試確認通過**

Run: `npx vitest run src/components/__tests__/SkillSuggestCard.test.ts && npm run type-check`
Expected: 全部 PASS。

- [ ] **Step 7: Commit**

```bash
git add src/components/AiViewer/SkillSuggestCard.vue src/components/AiViewer/AiViewerRecord.vue src/scss/components/_SkillSuggestCard.scss src/scss/components/_index.scss src/components/__tests__/SkillSuggestCard.test.ts
git commit -m "feat(aiviewer): add SkillSuggestCard and skillSuggest cardType branch"
```

---

### Task 10: `AiViewerRightBox.vue` — conv4 改用 `useSkillSuggestion`，dispatcher 接線

**Files:**
- Modify: `src/components/AiViewer/AiViewerRightBox.vue:830`（import）、`:1050-1057` 附近（composable 初始化）、`:2410-2422`（dispatcher conv4 分支）、`:2431-2434`（`goto-skill-management` 附近）、`:2826-2827`（旗標）、`:2869`（`conv4InitFlow` 結尾）、`:3055-3120`（四支函式）、`:3558-3563`（reset 區塊）

**Interfaces:**
- Consumes: `useSkillSuggestion().offer / handleAction / reset`（Task 8）、`SkillSuggestCard`（Task 9，透過 `AiViewerRecord`）

- [ ] **Step 1: import 與初始化**

L830 附近加：

```ts
import { useSkillSuggestion } from '@/composables/useSkillSuggestion';
```

在 `} = useReportAssemblyConversation();`（約 L1057）之後加：

```ts
// 專案內由 Agent 發起「建立成個人技能」：可重用流程，conv4 先接
const skillSuggestion = useSkillSuggestion();
const CONV4_SKILL_SUGGESTION = {
  id: 'conv4-sales-report',
  name: '產品銷售報告整理',
  description: '查詢指定月份產品銷售數據，並依三諾產品部輸出報告規範自動產出報告',
  triggerHint: '偵測到「查詢銷售資料＋套用部門報告規範」類型的整理需求',
  steps: ['查詢指定月份產品銷售數據', '套用三諾產品部輸出報告規範自動產出報告'],
  reason: '查詢銷售資料＋套用部門報告規範',
};
```

- [ ] **Step 2: 移除 conv4 舊旗標與四支函式**

- 刪除 L2826-2827：`const conv4SkillChoiceMade = ref(false);`、`const conv4SkillSaveConfirmed = ref(false);`
- 刪除 `conv4AskBuildSkill`、`conv4BuildSkill`、`conv4ConfirmSaveSkill`、`conv4SkipSkill` 四支函式（L3055-3120，到 `// -------- end Conversation 4 流程 --------` 之前）。
- `conv4InitFlow` 結尾的 `setTimeout(() => conv4AskBuildSkill(), 600);` 改成：

```ts
      setTimeout(() => skillSuggestion.offer({ push: c4Push, scroll: c4Scroll }, CONV4_SKILL_SUGGESTION), 600);
```

- `resetConversation()` 的 conv4 區塊改成：

```ts
  if (currentConversationId.value === 'conv4') {
    conv4IdCounter = 2;
    conv4Title.value = '';
    conv4Msgs.value = [];
    skillSuggestion.reset(CONV4_SKILL_SUGGESTION.id);
  }
```

- [ ] **Step 3: dispatcher**

`handleChatAreaClick` 內，把原本三個 `conv4-*` 分支換成：

```ts
  // 建議建立成個人技能（任何 convN 共用）：data-id 是哪一則建議
  if (action?.startsWith('skill-suggest-') && skillSuggestion.handleAction(action, el.dataset.id ?? '')) {
    return;
  }
  if (action === 'goto-skill-studio') {
    router.push({ name: 'SkillStudio', query: { skillId: el.dataset.value ?? '', tab: 'test' } });
    return;
  }
```

（`goto-skill-management` 分支保留原樣。實作時確認該函式裡取 action 的變數名——L2383-2440 區段以 `const el = target.closest('[data-action]')`／`el.dataset.action` 命名為準，沿用同名變數。）

- [ ] **Step 4: 型別檢查與既有測試**

Run: `npm run type-check && npx vitest run src/components src/composables`
Expected: 無型別錯誤（尤其確認沒有殘留 `conv4SkillChoiceMade` 引用）、測試全綠。

- [ ] **Step 5: 手動驗證（Playwright 或瀏覽器）**

1. 從專案卡片開 AiViewer → 對話列表選「產品銷售報告整理」（conv4）→ ⚡ 快速任務「整理上月產品銷售報告」。
2. 報告完成後出現建議卡（ask）→ 點「是，建立成個人技能」→ preview 卡 → 「確認並建立」→ saved 卡。
3. 點「到 AI 賦能 調整與測試」→ 同分頁進 `/view/SkillStudio?skillId=personal-…&tab=test`，左側 chip「修改：產品銷售報告整理」、右側是測試 tab。
4. 回到 AiViewer 重播 conv4（重置對話）→ 建議流程可再走一次。
5. 走一次「不用了」→ 婉拒訊息，之後點 build 無反應。

- [ ] **Step 6: Commit**

```bash
git add src/components/AiViewer/AiViewerRightBox.vue
git commit -m "feat(aiviewer): conv4 uses useSkillSuggestion and really creates the personal skill"
```

---

### Task 11: 文件更新與全量驗證

**Files:**
- Modify: `PROJECT_CONTEXT.md`（3.8 side-panel 清單、3.10）
- Modify: `ARCHITECTURE.md`（§3 路由結構）

- [ ] **Step 1: `PROJECT_CONTEXT.md`**

3.8 節 side-panel「技能管理（可展開群組…）」那段改成：

```markdown
- AI 技能（可展開群組，見 3.10）
  - 技能管理
  - AI 賦能
  - 技能測試沙盒
```

3.10 節改成：

```markdown
### 3.10 AI 技能（SkillManagement／SkillStudio／SkillTest）
側邊選單 side-panel 裡「AI 技能」群組底下的三個子功能：
- **技能管理**（`src/views/SkillManagement.vue`）：我的技能（個人區）與團隊技能範本管理、送審／版本審核流程；詳情抽屜；「編輯」時可選「直接編輯」（SkillEditor 精靈）或「跟 Agent 對話修改」（導向 AI 賦能）
- **AI 賦能**（`src/views/SkillStudio.vue`）：對話式建立／修改／測試技能。左側跟 Agent 對話（規則式 mock，`useSkillStudioConversation`），右側「技能預覽」即時反映草稿、「測試」tab 掛 AI 快速測試。只操作個人技能（zone personal）；`?skillId=` 進修改模式、`?tab=test` 直接切到測試
- **技能測試沙盒**（`src/views/SkillTest.vue`）：對話測試與 AI 快速測試，可切換版本

專案內（AiViewer）Agent 完成任務後可主動建議「把這個流程建立成個人技能」（`useSkillSuggestion` ＋ `SkillSuggestCard`，conv4 為第一個接入的腳本）；確認後真的寫入 `skillStore`（`creationMethod: 'ai_assisted'`），並附連結直達 AI 賦能繼續調整與測試。
```

- [ ] **Step 2: `ARCHITECTURE.md` §3 路由結構**

在技能相關路由列表補一行（比照該節既有表格／清單格式）：

```markdown
| `/view/SkillStudio` | `SkillStudio` | AI 賦能：對話式建立／修改／測試技能（`meta.parentLabel: 'AI 技能'`） |
```

- [ ] **Step 3: 全量驗證**

Run:

```bash
npm run type-check && npm run test:unit && npm run lint
```

Expected: type-check 無錯；Vitest 全綠；lint 無新增錯誤（若 lint 自動修正了檔案，把修正一起 commit）。

- [ ] **Step 4: Commit**

```bash
git add PROJECT_CONTEXT.md ARCHITECTURE.md
git commit -m "docs: document AI 賦能 (SkillStudio) unit and agent-initiated personal skill flow"
```

---

## Self-Review

**Spec coverage**

| Spec 章節 | Task |
|---|---|
| §4.1 側邊選單三處、群組 active | 3 |
| §4.2 路由、`skillId`／`tab=test` | 3、6 |
| §5.1 版面、RWD 斷點 | 3 |
| §5.2 左側 header／訊息／動作 chip／建議 chip／輸入列 | 4 |
| §5.3 預覽六區塊、badge、footer、測試 tab 三態 | 5 |
| §6 composable 型別、介面、mock 規則 | 2 |
| §7 store 變更（回傳 id、`creationMethod`、`applyStudioPatch`、移除 editChat） | 1、7 |
| §8.1 `useSkillSuggestion` | 8 |
| §8.2 `SkillSuggestCard` ＋ `AiViewerRecord` 分支 ＋ token 樣式 | 9 |
| §8.3 RightBox 接線、`goto-skill-studio`、reset | 10 |
| §9 技能管理導頁、退役 modal | 7 |
| §11 錯誤處理（找不到／Library／離開守衛／未知 stage） | 6、9 |
| §12 SCSS 檔與 `@import` | 3、4、5、9 |
| §13 測試 | 各 task；AppMenuTree／SkillManagement 測試更新在 3、7 |
| §14 文件 | 11 |

**與 spec 的兩處刻意調整**（已同步回 spec）：
1. `extractSkillName` 取不到關鍵字時，先退回「第一個子句前 12 字」，再退回「新技能」——否則 spec 自己列的三則建議 chip 有兩則會得到「新技能」。
2. 修改模式第三顆建議 chip 從「使用情境」改為「觸發條件」——`usageScenarios` 不在草稿欄位裡，對話改不到它。

**Placeholder scan**：無 TBD／TODO；每個程式碼步驟都有完整程式碼；Task 7 Step 1 的 `mountPage()` 名稱標註「依該檔既有 helper 名稱調整」，執行者需打開該測試檔對齊，屬既有檔案的事實查核而非留白。

**Type consistency**：`StudioMode / SkillDraft / StudioMessage / StudioSuggestion` 在 Task 2 定義、Task 4–6 引用同名；`SkillSuggestion / SkillSuggestStage` 在 Task 8 定義、Task 9–10 引用同名；`applyStudioPatch(skillId, patch): boolean` 與 `createPersonalSkill(): string` 在 Task 1 定義、Task 2／8 依此呼叫；data-action 字串 `skill-suggest-build/skip/confirm`、`goto-skill-studio` 在 Task 8、9、10 一致。
