# 技能啟用：Agent 確認 + 100% 測試引導 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 啟用一顆技能時，統一經過「檢查 AI 快速測試閘門 → 確認可調用此技能的 Agent」共用流程，並在 AI 快速測試 100% 通過時，於測試報告區塊提供啟用入口、由 SkillStudio 對話主動引導使用者去按。

**Architecture:** 新增 `SkillEnableFlow.vue`——一個不渲染可見內容外觀、只負責兩個 Teleport 對話框與內部狀態機的共用元件，透過 `defineExpose` 暴露 `requestEnable(skill, existingAgents): Promise<EnableFlowOutcome>` 給父層呼叫（沿用這個 codebase 裡 `SkillStudioWorkspace`/`SkillStudioDrawer` 已經在用的 defineExpose 暴露方法慣例）。`SkillManagement.vue`、`SkillEditor.vue`（編輯模式）、`SkillTestAI.vue` 三處各自掛載一份、呼叫同一個方法，取代目前 `SkillManagement.vue`/`SkillEditor.vue` 各自重複實作的閘門對話框。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Pinia、Vitest + @vue/test-utils。

**Spec:** [docs/superpowers/specs/2026-09-29-skill-enable-agent-confirm-design.md](../specs/2026-09-29-skill-enable-agent-confirm-design.md)

## Global Constraints

- `<script setup lang="ts">`，禁止 Options API；禁止 `<style scoped>`，樣式一律進 `src/scss/`。
- 所有 import 用 `@/` alias。
- `SkillEnableFlow.requestEnable(skill, existingAgents)` 的 `skill` 參數**不接受 `null`**——三個呼叫端都是對已存在、有 id 的技能操作；`SkillEditor.vue` 只有編輯模式才呼叫，新建模式完全不碰這個元件。
- `EnableFlowOutcome` 是三選一的 discriminated union：`{ type: 'confirmed'; agents: string[]; wasOverridden: boolean }` / `{ type: 'revise' }` / `{ type: 'cancelled' }`——`'revise'` 跟 `'cancelled'` 分開回傳，因為兩個現有呼叫端對這兩種情況的既有行為本來就不一樣。
- 停用方向（啟用→停用）永遠不檢查閘門、不確認 Agent，維持現狀不動。
- 已驗證 `createPersonalSkill()`（`src/stores/skillStore.ts:1309`）無條件寫死 `isEnabled: false`、完全不讀 payload 的 `isEnabled` 欄位——新建技能不管表單勾什麼都以未啟用落地，這是既有正確行為，本計畫**不修改** `createPersonalSkill()`，也不讓 `SkillEditor.vue` 新建模式碰 `SkillEnableFlow`。

---

## Task 1: `skillStore.ts` 新增 `setAssignedAgents` mutator

**Files:**
- Modify: `src/stores/skillStore.ts:1260-1268`（緊接在 `assignSkillToAgent` 之後加一個新函式，並加進 return 物件）
- Test: `src/stores/__tests__/skillStore.setAssignedAgents.test.ts`

**Interfaces:**
- Produces：`setAssignedAgents(skillId: string, agents: string[]): void`——整份取代 `skill.assignedAgents`（區別於 `assignSkillToAgent(skillId, agentName)` 只能單筆新增）。技能不存在時安靜地什麼都不做（跟這個檔案裡其他 mutator 一致的慣例，例如 `assignSkillToAgent` 本身）。

- [ ] **Step 1: 寫失敗測試**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSkillStore } from '@/stores/skillStore'

describe('skillStore.setAssignedAgents', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('整份取代 assignedAgents，不是新增', () => {
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '測試技能', instructions: 'x', triggerHint: 'y', assignedAgents: ['通用助理'] })
    store.setAssignedAgents(id, ['客服中心助理', '電商小幫手'])
    expect(store.findSkill(id)!.assignedAgents).toEqual(['客服中心助理', '電商小幫手'])
  })

  it('傳空陣列會清空既有指派', () => {
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '測試技能2', instructions: 'x', triggerHint: 'y', assignedAgents: ['通用助理'] })
    store.setAssignedAgents(id, [])
    expect(store.findSkill(id)!.assignedAgents).toEqual([])
  })

  it('技能不存在時安靜地什麼都不做，不拋錯', () => {
    const store = useSkillStore()
    expect(() => store.setAssignedAgents('nope-999', ['通用助理'])).not.toThrow()
  })
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run src/stores/__tests__/skillStore.setAssignedAgents.test.ts`
Expected: FAIL — `store.setAssignedAgents is not a function`

- [ ] **Step 3: 實作**

在 `src/stores/skillStore.ts` 裡，緊接在現有的 `assignSkillToAgent` 函式（:1260-1268）之後加：

```ts
  // 整份取代 assignedAgents（區別於 assignSkillToAgent 只能單筆新增）：
  // 啟用技能時的「確認可用 Agent」步驟用這個，使用者可能同時勾選、取消勾選多個
  function setAssignedAgents(skillId: string, agents: string[]): void {
    const skill = findSkill(skillId)
    if (!skill) return
    skill.assignedAgents = [...agents]
  }
```

並在檔案底部 `return { ... }` 物件裡，緊接在 `assignSkillToAgent,` 後面加上 `setAssignedAgents,`。

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run src/stores/__tests__/skillStore.setAssignedAgents.test.ts`
Expected: PASS（3 個測試）

- [ ] **Step 5: Commit**

```bash
git add src/stores/skillStore.ts src/stores/__tests__/skillStore.setAssignedAgents.test.ts
git commit -m "feat(skill-store): add setAssignedAgents mutator for whole-list replace"
```

---

## Task 2: 建立 `SkillEnableFlow.vue` 共用元件

**Files:**
- Create: `src/components/Skill/SkillEnableFlow.vue`
- Modify: `src/scss/views/_SkillEditor.scss`（把 `.se-agent-grid`/`.se-agent-chip`/`.se-chip-check` 從巢狀在 `.SkillEditor { }` 裡的規則搬成頂層選擇器）
- Test: `src/components/__tests__/SkillEnableFlow.test.ts`

**Interfaces:**
- Consumes：`canEnableSkill`、`describeAiTestGateReason`、`AVAILABLE_AGENTS`（既有，`@/stores/skillStore`）
- Produces：`defineExpose({ requestEnable })`，其中：
  ```ts
  export type EnableFlowOutcome =
    | { type: 'confirmed'; agents: string[]; wasOverridden: boolean }
    | { type: 'revise' }
    | { type: 'cancelled' }
  function requestEnable(skill: Skill, existingAgents: string[]): Promise<EnableFlowOutcome>
  ```
  Task 3/4/5 都會用 template ref 呼叫這個方法，例如 `enableFlowRef.value!.requestEnable(skill, skill.assignedAgents ?? [])`。

- [ ] **Step 1: 把 `.se-agent-grid`／`.se-agent-chip`／`.se-chip-check` 搬成頂層選擇器**

`src/scss/views/_SkillEditor.scss` 目前把這三條規則巢狀寫在 `.SkillEditor { }` 裡面（約 :362-396），只對 `SkillEditor.vue` 生效。這次 `SkillEnableFlow.vue` 會在完全不同的頁面（`SkillManagement.vue`／`SkillTestAI.vue`）裡重用同一套 chip 選擇器樣式，巢狀寫法會讓樣式在那些地方套不上——跟這個 session 稍早修過的 `.banner-title-row`／`.skill-studio-layout` 是同一種問題，一樣的修法：搬成獨立頂層選擇器。

把：

```scss
  .se-agent-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .se-agent-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 14px;
    border-radius: 20px;
    border: 1px solid var(--divider-a50);
    background: var(--surface);
    color: var(--text-muted);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;

    .material-symbols-outlined { font-size: 15px; }

    &:hover {
      border-color: var(--primary);
      color: var(--primary-hover);
    }

    &.is-selected {
      background: var(--accent-soft);
      border-color: var(--accent);
      color: var(--primary-hover);
      font-weight: 500;

      .se-chip-check { color: var(--primary); }
    }
  }
}
```

（這是 `_SkillEditor.scss` 檔案最後一段，`}` 是 `.SkillEditor` 的收尾）改成：把這兩條規則整段搬到檔案最後、`.SkillEditor { ... }` 的收尾 `}` 之後，變成同一層級的頂層選擇器：

```scss
  // ... .SkillEditor 其餘規則不動 ...
}

// .se-agent-grid／.se-agent-chip／.se-chip-check 是獨立頂層選擇器：
// SkillEnableFlow.vue（啟用時確認可用 Agent）也會重用同一套 chip 選擇器樣式，
// 不能巢狀寫在 .SkillEditor 裡面否則其他頁面套不上
.se-agent-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.se-agent-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid var(--divider-a50);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;

  .material-symbols-outlined { font-size: 15px; }

  &:hover {
    border-color: var(--primary);
    color: var(--primary-hover);
  }

  &.is-selected {
    background: var(--accent-soft);
    border-color: var(--accent);
    color: var(--primary-hover);
    font-weight: 500;

    .se-chip-check { color: var(--primary); }
  }
}
```

- [ ] **Step 2: 跑 `SkillEditor.vue` 既有測試，確認搬移 CSS 沒有破壞頁面本身**

Run: `npx vitest run src/views/__tests__/SkillEditor.enableGate.test.ts`
Expected: PASS（既有 5 個測試不動，這一步只是驗證 CSS 搬移沒有動到功能）

- [ ] **Step 3: 寫 `SkillEnableFlow.test.ts`（先寫失敗測試）**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, DOMWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SkillEnableFlow from '@/components/Skill/SkillEnableFlow.vue'
import { useSkillStore } from '@/stores/skillStore'

function mountFlow() {
  return mount(SkillEnableFlow)
}

describe('SkillEnableFlow', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('沒過測試閘門：顯示還不能啟用對話框；「取消」resolve cancelled', async () => {
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '待測技能', instructions: 'x', triggerHint: 'y', assignedAgents: [] })
    const wrapper = mountFlow()
    const promise = (wrapper.vm as any).requestEnable(store.findSkill(id), [])
    await wrapper.vm.$nextTick()

    const dialog = new DOMWrapper(document.body).find('.enable-gate-dialog')
    expect(dialog.exists()).toBe(true)
    expect(dialog.text()).toContain('還沒有做過 AI 快速測試')

    const cancelBtn = new DOMWrapper(document.body).findAll('.enable-gate-dialog button').find(b => b.text().includes('取消'))!
    await cancelBtn.trigger('click')
    expect(await promise).toEqual({ type: 'cancelled' })
    expect(new DOMWrapper(document.body).find('.enable-gate-dialog').exists()).toBe(false)
  })

  it('沒過測試閘門：選「去修改技能內容」resolve revise，不進 Agent 確認步驟', async () => {
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '待測技能2', instructions: 'x', triggerHint: 'y', assignedAgents: [] })
    const wrapper = mountFlow()
    const promise = (wrapper.vm as any).requestEnable(store.findSkill(id), [])
    await wrapper.vm.$nextTick()

    const reviseBtn = new DOMWrapper(document.body).findAll('.enable-gate-dialog button').find(b => b.text().includes('去修改'))!
    await reviseBtn.trigger('click')
    expect(await promise).toEqual({ type: 'revise' })
    expect(new DOMWrapper(document.body).find('.enable-agent-dialog').exists()).toBe(false)
  })

  it('沒過測試閘門：選「視為通過」會接著顯示 Agent 確認對話框，預填 existingAgents', async () => {
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '待測技能3', instructions: 'x', triggerHint: 'y', assignedAgents: [] })
    const wrapper = mountFlow()
    ;(wrapper.vm as any).requestEnable(store.findSkill(id), ['客服中心助理'])
    await wrapper.vm.$nextTick()

    const overrideBtn = new DOMWrapper(document.body).findAll('.enable-gate-dialog button').find(b => b.text().includes('視為通過'))!
    await overrideBtn.trigger('click')
    await wrapper.vm.$nextTick()

    expect(new DOMWrapper(document.body).find('.enable-gate-dialog').exists()).toBe(false)
    const agentDialog = new DOMWrapper(document.body).find('.enable-agent-dialog')
    expect(agentDialog.exists()).toBe(true)
    const preselected = agentDialog.findAll('.se-agent-chip.is-selected').map(c => c.text())
    expect(preselected.some(t => t.includes('客服中心助理'))).toBe(true)
  })

  it('已經 100% 通過：直接進 Agent 確認步驟，不顯示還不能啟用對話框', async () => {
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '已測技能', instructions: 'x', triggerHint: 'y', assignedAgents: [] })
    await store.generateAITestScenarios(id)
    for (const sc of [...store.aiTestScenarios]) store.answerAITestScenario(id, sc.id, sc.expectedTrigger)
    const wrapper = mountFlow()
    ;(wrapper.vm as any).requestEnable(store.findSkill(id), [])
    await wrapper.vm.$nextTick()

    expect(new DOMWrapper(document.body).find('.enable-gate-dialog').exists()).toBe(false)
    expect(new DOMWrapper(document.body).find('.enable-agent-dialog').exists()).toBe(true)
  })

  it('Agent 確認步驟：勾選數為 0 時「確認並啟用」disabled；勾 1 個以上可以送出並 resolve confirmed', async () => {
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '待測技能4', instructions: 'x', triggerHint: 'y', assignedAgents: [] })
    await store.generateAITestScenarios(id)
    for (const sc of [...store.aiTestScenarios]) store.answerAITestScenario(id, sc.id, sc.expectedTrigger)
    const wrapper = mountFlow()
    const promise = (wrapper.vm as any).requestEnable(store.findSkill(id), [])
    await wrapper.vm.$nextTick()

    const confirmBtn = new DOMWrapper(document.body).findAll('.enable-agent-dialog button').find(b => b.text().includes('確認並啟用'))!
    expect(confirmBtn.attributes('disabled')).toBeDefined()

    const chip = new DOMWrapper(document.body).findAll('.se-agent-chip').find(c => c.text().includes('通用助理'))!
    await chip.trigger('click')
    expect(confirmBtn.attributes('disabled')).toBeUndefined()

    await confirmBtn.trigger('click')
    expect(await promise).toEqual({ type: 'confirmed', agents: ['通用助理'], wasOverridden: false })
  })

  it('視為通過後確認送出：wasOverridden 為 true', async () => {
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '待測技能5', instructions: 'x', triggerHint: 'y', assignedAgents: [] })
    const wrapper = mountFlow()
    const promise = (wrapper.vm as any).requestEnable(store.findSkill(id), [])
    await wrapper.vm.$nextTick()
    await new DOMWrapper(document.body).findAll('.enable-gate-dialog button').find(b => b.text().includes('視為通過'))!.trigger('click')
    await wrapper.vm.$nextTick()
    await new DOMWrapper(document.body).findAll('.se-agent-chip').find(c => c.text().includes('通用助理'))!.trigger('click')
    await new DOMWrapper(document.body).findAll('.enable-agent-dialog button').find(b => b.text().includes('確認並啟用'))!.trigger('click')
    expect(await promise).toEqual({ type: 'confirmed', agents: ['通用助理'], wasOverridden: true })
  })

  it('Agent 確認步驟按「取消」：resolve cancelled', async () => {
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '待測技能6', instructions: 'x', triggerHint: 'y', assignedAgents: [] })
    await store.generateAITestScenarios(id)
    for (const sc of [...store.aiTestScenarios]) store.answerAITestScenario(id, sc.id, sc.expectedTrigger)
    const wrapper = mountFlow()
    const promise = (wrapper.vm as any).requestEnable(store.findSkill(id), [])
    await wrapper.vm.$nextTick()
    await new DOMWrapper(document.body).findAll('.enable-agent-dialog button').find(b => b.text().includes('取消'))!.trigger('click')
    expect(await promise).toEqual({ type: 'cancelled' })
  })
})
```

- [ ] **Step 4: 跑測試確認失敗**

Run: `npx vitest run src/components/__tests__/SkillEnableFlow.test.ts`
Expected: FAIL — 找不到 `@/components/Skill/SkillEnableFlow.vue`

- [ ] **Step 5: 建立 `SkillEnableFlow.vue`**

```vue
<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div v-if="gateSkill" class="drawer-confirm-overlay" @click.self="resolveCancelled">
        <div class="drawer-confirm-dialog enable-gate-dialog">
          <div class="confirm-icon confirm-icon--update">
            <i class="material-symbols-outlined">rule</i>
          </div>
          <h4>還不能啟用「{{ gateSkill.name }}」</h4>
          <p>{{ describeAiTestGateReason(gateSkill) }}</p>
          <div class="confirm-actions confirm-actions--column">
            <button class="custom-btn" @click="resolveRevise">
              <i class="material-symbols-outlined">forum</i>去修改技能內容
            </button>
            <button class="custom-btn custom-main-btn" @click="handleOverride">
              <i class="material-symbols-outlined">check_circle</i>視為通過，直接啟用
            </button>
            <button class="custom-btn" @click="resolveCancelled">
              取消
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <Teleport to="body">
    <Transition name="confirm-fade">
      <div v-if="agentSkill" class="drawer-confirm-overlay" @click.self="resolveCancelled">
        <div class="drawer-confirm-dialog enable-agent-dialog">
          <div class="confirm-icon confirm-icon--update">
            <i class="material-symbols-outlined">smart_toy</i>
          </div>
          <h4>啟用「{{ agentSkill.name }}」</h4>
          <p>確認哪些 Agent 可以調用這個技能，之後隨時可以再調整。</p>
          <div class="se-agent-grid lively-stagger">
            <button
              v-for="agent in AVAILABLE_AGENTS"
              :key="agent"
              type="button"
              :class="['se-agent-chip', 'lively-card', { 'is-selected': selectedAgents.includes(agent) }]"
              @click="toggleAgent(agent)"
            >
              <i class="material-symbols-outlined">smart_toy</i>
              {{ agent }}
              <i v-if="selectedAgents.includes(agent)" class="material-symbols-outlined se-chip-check">check</i>
            </button>
          </div>
          <div class="confirm-actions confirm-actions--column">
            <button
              class="custom-btn custom-main-btn"
              :disabled="selectedAgents.length === 0"
              @click="resolveConfirmed"
            >
              <i class="material-symbols-outlined">check_circle</i>確認並啟用
            </button>
            <button class="custom-btn" @click="resolveCancelled">
              取消
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
// 啟用一顆技能的共用流程：檢查 AI 快速測試閘門 → 確認可調用此技能的 Agent。
// 只負責「問使用者、回傳結果」，不負責實際呼叫 store 把技能存檔或切換狀態——
// 三個呼叫端（SkillManagement/SkillEditor/SkillTestAI）的「啟用」動作形狀不一樣
// （已存在技能直接切換 vs. 表單送出的一部分），拿到結果後各自決定要做什麼。
import { ref } from 'vue'
import { canEnableSkill, describeAiTestGateReason, AVAILABLE_AGENTS } from '@/stores/skillStore'
import type { Skill } from '@/stores/skillStore'

export type EnableFlowOutcome =
  | { type: 'confirmed'; agents: string[]; wasOverridden: boolean }
  | { type: 'revise' }
  | { type: 'cancelled' }

const gateSkill = ref<Skill | null>(null)
const agentSkill = ref<Skill | null>(null)
const selectedAgents = ref<string[]>([])

let resolver: ((outcome: EnableFlowOutcome) => void) | null = null
let pendingWasOverridden = false
let pendingExistingAgents: string[] = []

function toggleAgent(agent: string) {
  const idx = selectedAgents.value.indexOf(agent)
  if (idx === -1) selectedAgents.value.push(agent)
  else selectedAgents.value.splice(idx, 1)
}

function enterAgentStep(skill: Skill) {
  gateSkill.value = null
  agentSkill.value = skill
  selectedAgents.value = [...pendingExistingAgents]
}

function handleOverride() {
  pendingWasOverridden = true
  enterAgentStep(gateSkill.value!)
}

function resolveRevise() {
  gateSkill.value = null
  resolver?.({ type: 'revise' })
  resolver = null
}

function resolveCancelled() {
  gateSkill.value = null
  agentSkill.value = null
  resolver?.({ type: 'cancelled' })
  resolver = null
}

function resolveConfirmed() {
  if (selectedAgents.value.length === 0) return
  agentSkill.value = null
  resolver?.({ type: 'confirmed', agents: [...selectedAgents.value], wasOverridden: pendingWasOverridden })
  resolver = null
}

function requestEnable(skill: Skill, existingAgents: string[]): Promise<EnableFlowOutcome> {
  pendingWasOverridden = false
  pendingExistingAgents = existingAgents
  return new Promise(resolve => {
    resolver = resolve
    if (!canEnableSkill(skill)) {
      gateSkill.value = skill
    } else {
      enterAgentStep(skill)
    }
  })
}

defineExpose({ requestEnable })
</script>
```

- [ ] **Step 6: 跑測試確認通過**

Run: `npx vitest run src/components/__tests__/SkillEnableFlow.test.ts`
Expected: PASS（7 個測試）

- [ ] **Step 7: Commit**

```bash
git add src/components/Skill/SkillEnableFlow.vue src/components/__tests__/SkillEnableFlow.test.ts src/scss/views/_SkillEditor.scss
git commit -m "feat(skill-enable): add shared SkillEnableFlow component (not wired into any page yet)"
```

---

## Task 3: 把 `SkillManagement.vue` 的啟用閘門改接 `SkillEnableFlow`

**Files:**
- Modify: `src/views/SkillManagement.vue`
- Modify: `src/views/__tests__/SkillManagement.enableGate.test.ts`

**Interfaces:**
- Consumes：`SkillEnableFlow`（Task 2）的 `defineExpose({ requestEnable })`

- [ ] **Step 1: 移除舊的啟用閘門對話框 markup，改掛 `SkillEnableFlow`**

刪掉 `src/views/SkillManagement.vue:382-410` 整段（`<!-- 啟用前的測試閘門 -->` 註解開始，到對應的 `</Teleport>` 結束）：

```html
    <!-- 啟用前的測試閘門：個人技能沒通過 AI 快速測試（或沒明確選擇略過）時，
         點「啟用技能」不直接切換，改問清楚要怎麼處理 -->
    <Teleport to="body">
      <Transition name="confirm-fade">
        <div
          v-if="enableGateSkill"
          class="drawer-confirm-overlay"
          @click.self="enableGateSkill = null"
        >
          <div class="drawer-confirm-dialog enable-gate-dialog">
            <div class="confirm-icon confirm-icon--update">
              <i class="material-symbols-outlined">rule</i>
            </div>
            <h4>還不能啟用「{{ enableGateSkill.name }}」</h4>
            <p>{{ describeAiTestGateReason(enableGateSkill) }}</p>
            <div class="confirm-actions confirm-actions--column">
              <button class="custom-btn" @click="handleEnableGateRevise">
                <i class="material-symbols-outlined">forum</i>去修改技能內容
              </button>
              <button class="custom-btn custom-main-btn" @click="handleEnableGateOverride">
                <i class="material-symbols-outlined">check_circle</i>視為通過，直接啟用
              </button>
              <button class="custom-btn" @click="enableGateSkill = null">
                取消
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
```

換成一行（放在同一個位置）：

```html
    <SkillEnableFlow ref="enableFlowRef" />
```

- [ ] **Step 2: import 元件，改寫 `handleToggle`/移除舊 handler**

在 `src/views/SkillManagement.vue:566`（`import { useSkillStore, canEnableSkill, describeAiTestGateReason } from '@/stores/skillStore'` 那行）改成：

```ts
import { useSkillStore } from '@/stores/skillStore'
```

（`canEnableSkill`/`describeAiTestGateReason` 現在只有 `SkillEnableFlow.vue` 內部要用，這個檔案不再直接呼叫）

在同一批 import 下面加：

```ts
import SkillEnableFlow from '@/components/Skill/SkillEnableFlow.vue'
```

把 `src/views/SkillManagement.vue:634`（`const enableGateSkill = ref<Skill | null>(null)`）改成：

```ts
const enableFlowRef = ref<InstanceType<typeof SkillEnableFlow> | null>(null)
```

把 `src/views/SkillManagement.vue:876-896` 的 `handleToggle`/`handleEnableGateRevise`/`handleEnableGateOverride` 三個函式：

```ts
function handleToggle(skill: Skill) {
  // 只有「目前停用、要切成啟用」這個方向需要檢查；停用方向永遠允許
  if (!skill.isEnabled && !canEnableSkill(skill)) {
    enableGateSkill.value = skill
    return
  }
  store.toggleSkill(skill.id)
}

function handleEnableGateRevise() {
  if (!enableGateSkill.value) return
  const skillId = enableGateSkill.value.id
  enableGateSkill.value = null
  router.push({ query: { skillId } })
}

function handleEnableGateOverride() {
  if (!enableGateSkill.value) return
  store.overrideAndEnableSkill(enableGateSkill.value.id)
  enableGateSkill.value = null
}
```

換成一個函式：

```ts
async function handleToggle(skill: Skill) {
  // 停用方向永遠允許，不用檢查、不用確認 Agent
  if (skill.isEnabled) {
    store.toggleSkill(skill.id)
    return
  }
  const outcome = await enableFlowRef.value!.requestEnable(skill, skill.assignedAgents ?? [])
  if (outcome.type === 'cancelled') return
  if (outcome.type === 'revise') {
    router.push({ query: { skillId: skill.id } })
    return
  }
  store.setAssignedAgents(skill.id, outcome.agents)
  if (outcome.wasOverridden) store.overrideAndEnableSkill(skill.id)
  else store.toggleSkill(skill.id)
}
```

- [ ] **Step 3: 更新既有測試**

`src/views/__tests__/SkillManagement.enableGate.test.ts` 有 6 個測試。前 3 個（「技能從沒測過」「決策對話框選『去修改技能內容』」「決策對話框選『取消』」）跟最後 1 個（「停用方向」）行為不變，斷言不用改。中間 2 個需要重寫：

把：

```ts
  it('決策對話框選「視為通過，直接啟用」：呼叫 overrideAndEnableSkill，對話框關閉', async () => {
    setActivePinia(createPinia())
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '待測技能2', instructions: 'x', triggerHint: 'y', assignedAgents: [] })
    const { wrapper } = await mountPage()
    ;(wrapper.vm as any).detailSkillId = id
    await wrapper.vm.$nextTick()
    await new DOMWrapper(document.body).find('.dm-toggle-btn').trigger('click')

    const overrideBtn = new DOMWrapper(document.body).findAll('.enable-gate-dialog button').find(b => b.text().includes('視為通過'))!
    await overrideBtn.trigger('click')

    expect(store.findSkill(id)!.isEnabled).toBe(true)
    expect(store.findSkill(id)!.aiTestOverridden).toBe(true)
    expect(new DOMWrapper(document.body).find('.enable-gate-dialog').exists()).toBe(false)
  })
```

改成（多一步：先過閘門選「視為通過」之後，還要在 Agent 確認對話框裡勾至少一個、按「確認並啟用」，技能才真的被啟用）：

```ts
  it('決策對話框選「視為通過」，Agent 確認對話框勾選並送出：呼叫 overrideAndEnableSkill 與 setAssignedAgents', async () => {
    setActivePinia(createPinia())
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '待測技能2', instructions: 'x', triggerHint: 'y', assignedAgents: [] })
    const { wrapper } = await mountPage()
    ;(wrapper.vm as any).detailSkillId = id
    await wrapper.vm.$nextTick()
    await new DOMWrapper(document.body).find('.dm-toggle-btn').trigger('click')

    const overrideBtn = new DOMWrapper(document.body).findAll('.enable-gate-dialog button').find(b => b.text().includes('視為通過'))!
    await overrideBtn.trigger('click')
    await wrapper.vm.$nextTick()

    expect(store.findSkill(id)!.isEnabled).toBe(false) // 還沒真的啟用，還在 Agent 確認步驟
    const agentDialog = new DOMWrapper(document.body).find('.enable-agent-dialog')
    expect(agentDialog.exists()).toBe(true)

    await agentDialog.findAll('.se-agent-chip').find(c => c.text().includes('通用助理'))!.trigger('click')
    await agentDialog.findAll('button').find(b => b.text().includes('確認並啟用'))!.trigger('click')

    expect(store.findSkill(id)!.isEnabled).toBe(true)
    expect(store.findSkill(id)!.aiTestOverridden).toBe(true)
    expect(store.findSkill(id)!.assignedAgents).toEqual(['通用助理'])
    expect(new DOMWrapper(document.body).find('.enable-agent-dialog').exists()).toBe(false)
  })
```

把：

```ts
  it('已經全對過的技能：點「啟用技能」直接切換，不彈對話框', async () => {
    setActivePinia(createPinia())
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '已測技能', instructions: 'x', triggerHint: 'y', assignedAgents: [] })
    await store.generateAITestScenarios(id)
    for (const sc of [...store.aiTestScenarios]) {
      store.answerAITestScenario(id, sc.id, sc.expectedTrigger)
    }
    expect(store.findSkill(id)!.aiTestPassRate).toBe(1)

    const { wrapper } = await mountPage()
    ;(wrapper.vm as any).detailSkillId = id
    await wrapper.vm.$nextTick()
    await new DOMWrapper(document.body).find('.dm-toggle-btn').trigger('click')

    expect(store.findSkill(id)!.isEnabled).toBe(true)
    expect(new DOMWrapper(document.body).find('.enable-gate-dialog').exists()).toBe(false)
  })
```

改成（「不彈對話框」不再成立——閘門本身通過了，但 Agent 確認對話框還是會跳出來；改成驗證「不彈閘門失敗對話框，但會彈 Agent 確認對話框」）：

```ts
  it('已經全對過的技能：點「啟用技能」不彈閘門失敗對話框，但仍要過 Agent 確認才真的啟用', async () => {
    setActivePinia(createPinia())
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '已測技能', instructions: 'x', triggerHint: 'y', assignedAgents: [] })
    await store.generateAITestScenarios(id)
    for (const sc of [...store.aiTestScenarios]) {
      store.answerAITestScenario(id, sc.id, sc.expectedTrigger)
    }
    expect(store.findSkill(id)!.aiTestPassRate).toBe(1)

    const { wrapper } = await mountPage()
    ;(wrapper.vm as any).detailSkillId = id
    await wrapper.vm.$nextTick()
    await new DOMWrapper(document.body).find('.dm-toggle-btn').trigger('click')
    await wrapper.vm.$nextTick()

    expect(new DOMWrapper(document.body).find('.enable-gate-dialog').exists()).toBe(false)
    expect(store.findSkill(id)!.isEnabled).toBe(false)
    const agentDialog = new DOMWrapper(document.body).find('.enable-agent-dialog')
    expect(agentDialog.exists()).toBe(true)

    await agentDialog.findAll('.se-agent-chip').find(c => c.text().includes('通用助理'))!.trigger('click')
    await agentDialog.findAll('button').find(b => b.text().includes('確認並啟用'))!.trigger('click')
    expect(store.findSkill(id)!.isEnabled).toBe(true)
  })
```

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run src/views/__tests__/SkillManagement.enableGate.test.ts`
Expected: PASS（6 個測試）

- [ ] **Step 5: 跑型別檢查**

Run: `npx vue-tsc --build`
Expected: 沒有新增的錯誤（既有的 `window.XLSX` 等全域型別錯誤跟這次改動無關）

- [ ] **Step 6: Commit**

```bash
git add src/views/SkillManagement.vue src/views/__tests__/SkillManagement.enableGate.test.ts
git commit -m "feat(skill-management): wire enable toggle through shared SkillEnableFlow"
```

---

## Task 4: 把 `SkillEditor.vue`（編輯模式）的啟用閘門改接 `SkillEnableFlow`

**Files:**
- Modify: `src/views/SkillEditor.vue`
- Modify: `src/views/__tests__/SkillEditor.enableGate.test.ts`

**Interfaces:**
- Consumes：`SkillEnableFlow`（Task 2）的 `defineExpose({ requestEnable })`

- [ ] **Step 1: 移除舊的啟用閘門對話框 markup，改掛 `SkillEnableFlow`**

刪掉 `src/views/SkillEditor.vue:224-253` 整段（`<!-- 啟用前的測試閘門 -->` 到對應的 `</Teleport>`）：

```html
      <!-- 啟用前的測試閘門：個人技能沒通過 AI 快速測試（或沒明確選擇略過）時，
           勾了「啟用狀態」送出也不直接生效，改問清楚要怎麼處理 -->
      <Teleport to="body">
        <Transition name="confirm-fade">
          <div
            v-if="enableGateBlocked"
            class="drawer-confirm-overlay"
            @click.self="enableGateBlocked = false"
          >
            <div class="drawer-confirm-dialog enable-gate-dialog">
              <div class="confirm-icon confirm-icon--update">
                <i class="material-symbols-outlined">rule</i>
              </div>
              <h4>還不能啟用「{{ form.name }}」</h4>
              <p>{{ existingSkill ? describeAiTestGateReason(existingSkill) : '' }}</p>
              <div class="confirm-actions confirm-actions--column">
                <button class="custom-btn" @click="handleEnableGateRevise">
                  <i class="material-symbols-outlined">forum</i>去修改技能內容
                </button>
                <button class="custom-btn custom-main-btn" @click="handleEnableGateOverride">
                  <i class="material-symbols-outlined">check_circle</i>視為通過，直接啟用
                </button>
                <button class="custom-btn" @click="enableGateBlocked = false">
                  取消
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
```

換成：

```html
      <SkillEnableFlow ref="enableFlowRef" />
```

- [ ] **Step 2: import 元件，改寫 `handleSubmit`/移除舊 handler**

`src/views/SkillEditor.vue:265`（`import { useSkillStore, AVAILABLE_AGENTS, canEnableSkill, describeAiTestGateReason } from '@/stores/skillStore'`）改成：

```ts
import { useSkillStore, AVAILABLE_AGENTS } from '@/stores/skillStore'
```

（`canEnableSkill`/`describeAiTestGateReason` 現在只有 `SkillEnableFlow.vue` 內部要用；`AVAILABLE_AGENTS` 這個檔案自己的指派 Agent 選擇區塊還在用，留著）

在同一批 import 下面加：

```ts
import SkillEnableFlow from '@/components/Skill/SkillEnableFlow.vue'
```

把 `src/views/SkillEditor.vue:283`（`const enableGateBlocked = ref(false)`）改成：

```ts
const enableFlowRef = ref<InstanceType<typeof SkillEnableFlow> | null>(null)
```

把 `src/views/SkillEditor.vue:342-382` 的 `handleSubmit`/`handleEnableGateRevise`/`handleEnableGateOverride`：

```ts
function handleSubmit() {
  if (!form.name.trim()) return

  // 編輯模式下，如果是「原本停用、這次要切成啟用」而且還沒過測試關卡，攔下整次送出，
  // 不呼叫 updateSkill；canEnableSkill() 本身只管 zone === 'personal' 的技能，
  // 其他 zone 一律回傳 true，這裡不用再重複判斷一次 zone
  if (
    isEditMode && editSkillId && existingSkill &&
    form.isEnabled && !existingSkill.isEnabled && !canEnableSkill(existingSkill)
  ) {
    enableGateBlocked.value = true
    return
  }

  const payload = buildPayload()
  if (isDraftMode && draftId) {
    store.updateDraft(draftId, payload)
  } else if (isEditMode && editSkillId) {
    store.updateSkill(editSkillId, payload)
  } else {
    // 全新建立一律先進個人技能區，不需要送審就能個人使用（跟「建立副本」同一套模式）
    store.createPersonalSkill(payload)
  }
  router.push('/view/Skills')
}

function handleEnableGateRevise() {
  enableGateBlocked.value = false
  if (!editSkillId) return
  router.push({ name: 'SkillManagement', query: { skillId: editSkillId } })
}

function handleEnableGateOverride() {
  if (!editSkillId) return
  store.overrideAndEnableSkill(editSkillId)
  enableGateBlocked.value = false
  // 覆蓋只處理 isEnabled；表單其餘欄位的變更照樣送出，isEnabled 明確帶 true
  // （剛剛已經翻成 true 的現況），不要帶表單裡過期的 false 把它蓋回去
  store.updateSkill(editSkillId, { ...buildPayload(), isEnabled: true })
  router.push('/view/Skills')
}
```

換成一個 `async` 函式：

```ts
async function handleSubmit() {
  if (!form.name.trim()) return

  // 編輯模式下，如果是「原本停用、這次要切成啟用」而且還沒過測試關卡，
  // 先跑「檢查閘門 → 確認 Agent」共用流程，通過才繼續送出
  if (isEditMode && editSkillId && existingSkill && form.isEnabled && !existingSkill.isEnabled) {
    const outcome = await enableFlowRef.value!.requestEnable(existingSkill, form.assignedAgents)
    if (outcome.type === 'cancelled') return
    if (outcome.type === 'revise') {
      router.push({ name: 'SkillManagement', query: { skillId: editSkillId } })
      return
    }
    form.assignedAgents = outcome.agents
    if (outcome.wasOverridden) store.overrideAndEnableSkill(editSkillId)
    store.updateSkill(editSkillId, { ...buildPayload(), isEnabled: true })
    router.push('/view/Skills')
    return
  }

  const payload = buildPayload()
  if (isDraftMode && draftId) {
    store.updateDraft(draftId, payload)
  } else if (isEditMode && editSkillId) {
    store.updateSkill(editSkillId, payload)
  } else {
    // 全新建立一律先進個人技能區，不需要送審就能個人使用（跟「建立副本」同一套模式）；
    // 新建一律以未啟用落地——createPersonalSkill() 本來就無條件寫死 isEnabled: false，
    // 完全不讀這裡 payload.isEnabled 的值，不需要、也不應該接 SkillEnableFlow
    store.createPersonalSkill(payload)
  }
  router.push('/view/Skills')
}
```

- [ ] **Step 3: 更新既有測試**

`src/views/__tests__/SkillEditor.enableGate.test.ts` 有 5 個測試。第 1 個（「技能從沒測過...改彈出決策對話框」）跟第 4 個（「已經全對過的技能」）現在都要多等一個 tick 才看得到對話框（因為 `handleSubmit` 變成 `async`），且第 4 個「不彈窗」的斷言不再成立；第 3 個（「取消」）跟第 5 個（「建立模式看不到勾選」）不用改；第 2 個（「視為通過」）要補上 Agent 確認步驟。

把：

```ts
  it('技能從沒測過：勾「啟用狀態」並送出，不會直接寫入，改彈出決策對話框', async () => {
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '待測技能', instructions: 'x', triggerHint: 'y', assignedAgents: [] })
    const { wrapper } = await mountEditFor(id)

    // 直接把畫面切到最後一步（確認），不用真的一步一步點過去
    ;(wrapper.findComponent(SkillEditor).vm as any).currentStep = 2
    await wrapper.vm.$nextTick()

    await wrapper.find('.se-toggle input[type="checkbox"]').setValue(true)
    await wrapper.find('.se-footer button.custom-main-btn').trigger('click')
    await flushPromises()

    expect(store.findSkill(id)!.isEnabled).toBe(false)
    // .enable-gate-dialog 是透過 <Teleport to="body"> 掛到 document.body，
    // 不在 wrapper 的元素樹底下，wrapper.find() 找不到，改用 DOMWrapper 查整個 document.body
    expect(new DOMWrapper(document.body).find('.enable-gate-dialog').exists()).toBe(true)
  })
```

改成（`flushPromises()` 已經會等待 `handleSubmit` 這個 async 函式跑到第一個 `await`，斷言本身不用變，只是註解更新）：

```ts
  it('技能從沒測過：勾「啟用狀態」並送出，不會直接寫入，改彈出決策對話框', async () => {
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '待測技能', instructions: 'x', triggerHint: 'y', assignedAgents: [] })
    const { wrapper } = await mountEditFor(id)

    // 直接把畫面切到最後一步（確認），不用真的一步一步點過去
    ;(wrapper.findComponent(SkillEditor).vm as any).currentStep = 2
    await wrapper.vm.$nextTick()

    await wrapper.find('.se-toggle input[type="checkbox"]').setValue(true)
    await wrapper.find('.se-footer button.custom-main-btn').trigger('click')
    await flushPromises()

    expect(store.findSkill(id)!.isEnabled).toBe(false)
    // .enable-gate-dialog 是透過 <Teleport to="body"> 掛到 document.body（在
    // SkillEnableFlow.vue 裡），不在 wrapper 的元素樹底下，改用 DOMWrapper 查整個 document.body
    expect(new DOMWrapper(document.body).find('.enable-gate-dialog').exists()).toBe(true)
  })
```

把：

```ts
  it('決策對話框選「視為通過」：技能被啟用，接著照原本流程導回技能管理頁', async () => {
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '待測技能2', instructions: 'x', triggerHint: 'y', assignedAgents: [] })
    const { wrapper, router } = await mountEditFor(id)
    ;(wrapper.findComponent(SkillEditor).vm as any).currentStep = 2
    await wrapper.vm.$nextTick()
    await wrapper.find('.se-toggle input[type="checkbox"]').setValue(true)
    await wrapper.find('.se-footer button.custom-main-btn').trigger('click')
    await flushPromises()

    // 同上，對話框內容透過 Teleport 掛到 document.body，改用 DOMWrapper 查找
    const overrideBtn = new DOMWrapper(document.body).findAll('.enable-gate-dialog button').find(b => b.text().includes('視為通過'))!
    await overrideBtn.trigger('click')
    await flushPromises()

    expect(store.findSkill(id)!.isEnabled).toBe(true)
    expect(store.findSkill(id)!.aiTestOverridden).toBe(true)
    expect(router.currentRoute.value.path).toBe('/view/Skills')
  })
```

改成：

```ts
  it('決策對話框選「視為通過」，Agent 確認對話框勾選並送出：技能被啟用，接著照原本流程導回技能管理頁', async () => {
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '待測技能2', instructions: 'x', triggerHint: 'y', assignedAgents: [] })
    const { wrapper, router } = await mountEditFor(id)
    ;(wrapper.findComponent(SkillEditor).vm as any).currentStep = 2
    await wrapper.vm.$nextTick()
    await wrapper.find('.se-toggle input[type="checkbox"]').setValue(true)
    await wrapper.find('.se-footer button.custom-main-btn').trigger('click')
    await flushPromises()

    const overrideBtn = new DOMWrapper(document.body).findAll('.enable-gate-dialog button').find(b => b.text().includes('視為通過'))!
    await overrideBtn.trigger('click')
    await flushPromises()

    expect(store.findSkill(id)!.isEnabled).toBe(false) // 還在 Agent 確認步驟，還沒真的啟用
    const agentDialog = new DOMWrapper(document.body).find('.enable-agent-dialog')
    expect(agentDialog.exists()).toBe(true)

    await agentDialog.findAll('.se-agent-chip').find(c => c.text().includes('通用助理'))!.trigger('click')
    await agentDialog.findAll('button').find(b => b.text().includes('確認並啟用'))!.trigger('click')
    await flushPromises()

    expect(store.findSkill(id)!.isEnabled).toBe(true)
    expect(store.findSkill(id)!.aiTestOverridden).toBe(true)
    expect(store.findSkill(id)!.assignedAgents).toEqual(['通用助理'])
    expect(router.currentRoute.value.path).toBe('/view/Skills')
  })
```

把：

```ts
  it('已經全對過的技能：勾「啟用狀態」送出直接生效，不彈窗', async () => {
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '已測技能', instructions: 'x', triggerHint: 'y', assignedAgents: [] })
    await store.generateAITestScenarios(id)
    for (const sc of [...store.aiTestScenarios]) {
      store.answerAITestScenario(id, sc.id, sc.expectedTrigger)
    }
    const { wrapper } = await mountEditFor(id)
    ;(wrapper.findComponent(SkillEditor).vm as any).currentStep = 2
    await wrapper.vm.$nextTick()
    await wrapper.find('.se-toggle input[type="checkbox"]').setValue(true)
    await wrapper.find('.se-footer button.custom-main-btn').trigger('click')
    await flushPromises()

    expect(store.findSkill(id)!.isEnabled).toBe(true)
    expect(new DOMWrapper(document.body).find('.enable-gate-dialog').exists()).toBe(false)
  })
```

改成（不再是「不彈窗」，而是「不彈閘門失敗對話框，但要過 Agent 確認才真的生效」）：

```ts
  it('已經全對過的技能：勾「啟用狀態」送出不彈閘門失敗對話框，但仍要過 Agent 確認才真的生效', async () => {
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '已測技能', instructions: 'x', triggerHint: 'y', assignedAgents: [] })
    await store.generateAITestScenarios(id)
    for (const sc of [...store.aiTestScenarios]) {
      store.answerAITestScenario(id, sc.id, sc.expectedTrigger)
    }
    const { wrapper } = await mountEditFor(id)
    ;(wrapper.findComponent(SkillEditor).vm as any).currentStep = 2
    await wrapper.vm.$nextTick()
    await wrapper.find('.se-toggle input[type="checkbox"]').setValue(true)
    await wrapper.find('.se-footer button.custom-main-btn').trigger('click')
    await flushPromises()

    expect(new DOMWrapper(document.body).find('.enable-gate-dialog').exists()).toBe(false)
    expect(store.findSkill(id)!.isEnabled).toBe(false)
    const agentDialog = new DOMWrapper(document.body).find('.enable-agent-dialog')
    expect(agentDialog.exists()).toBe(true)

    await agentDialog.findAll('.se-agent-chip').find(c => c.text().includes('通用助理'))!.trigger('click')
    await agentDialog.findAll('button').find(b => b.text().includes('確認並啟用'))!.trigger('click')
    await flushPromises()
    expect(store.findSkill(id)!.isEnabled).toBe(true)
  })
```

再加一個新的迴歸測試（確認新建模式完全不受這次改動影響）：

```ts
  it('新建模式：不管表單 isEnabled 預設值是什麼，送出後一律以未啟用落地，不彈任何對話框', async () => {
    const store = useSkillStore()
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div/>' } },
        { path: '/view/SkillEditor', name: 'SkillEditor', component: SkillEditor },
        { path: '/view/Skills', name: 'SkillManagement', component: { template: '<div/>' } },
      ],
    })
    await router.push('/view/SkillEditor')
    await router.isReady()
    const wrapper = mount({ template: '<router-view />' }, { global: { plugins: [router] } })
    currentWrapper = wrapper
    await flushPromises()

    const editor = wrapper.findComponent(SkillEditor)
    ;(editor.vm as any).form.name = '全新技能'
    ;(editor.vm as any).currentStep = 2
    await wrapper.vm.$nextTick()
    await wrapper.find('.se-footer button.custom-main-btn').trigger('click')
    await flushPromises()

    expect(new DOMWrapper(document.body).find('.enable-gate-dialog').exists()).toBe(false)
    expect(new DOMWrapper(document.body).find('.enable-agent-dialog').exists()).toBe(false)
    const created = store.myPersonalSkills.find(s => s.name === '全新技能')
    expect(created).toBeDefined()
    expect(created!.isEnabled).toBe(false)
  })
```

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run src/views/__tests__/SkillEditor.enableGate.test.ts`
Expected: PASS（6 個測試——原本 5 個 + 新增的新建模式迴歸測試）

- [ ] **Step 5: 跑型別檢查**

Run: `npx vue-tsc --build`
Expected: 沒有新增的錯誤

- [ ] **Step 6: Commit**

```bash
git add src/views/SkillEditor.vue src/views/__tests__/SkillEditor.enableGate.test.ts
git commit -m "feat(skill-editor): wire edit-mode enable flow through shared SkillEnableFlow"
```

---

## Task 5: `SkillTestAI.vue` 在 100% 時顯示啟用按鈕

**Files:**
- Modify: `src/components/Skill/SkillTestAI.vue`
- Test: `src/components/__tests__/SkillTestAI.test.ts`

**Interfaces:**
- Consumes：`SkillEnableFlow`（Task 2）的 `defineExpose({ requestEnable })`；`skillStore.setAssignedAgents`／`toggleSkill`（Task 1、既有）

- [ ] **Step 1: 檢查既有測試檔案現況**

先跑一次確認 baseline：

Run: `npx vitest run src/components/__tests__/SkillTestAI.test.ts`
Expected: PASS（既有測試全線，這一步只是確認起始狀態）

- [ ] **Step 2: 寫失敗測試**

在 `src/components/__tests__/SkillTestAI.test.ts` 檔案末尾（`describe` 區塊內）加：

```ts
  it('100% 通過時顯示「啟用技能」按鈕；未 100% 或尚未測試時不顯示', async () => {
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '待測技能', instructions: 'x', triggerHint: 'y', assignedAgents: [] })
    const wrapper = mount(SkillTestAI, { props: { skillId: id } })

    expect(wrapper.find('.ai-enable-btn').exists()).toBe(false) // 還沒生成測試情境

    await store.generateAITestScenarios(id)
    await wrapper.vm.$nextTick()
    const scenarios = [...store.aiTestScenarios]
    expect(scenarios.length).toBeGreaterThan(1) // 這個測試要故意答錯至少一題，情境數要夠

    // 除了最後一題以外全部故意答錯，確定 correct !== total（不會意外全對）
    for (let i = 0; i < scenarios.length - 1; i++) {
      store.answerAITestScenario(id, scenarios[i].id, !scenarios[i].expectedTrigger)
    }
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.ai-enable-btn').exists()).toBe(false) // 還有題目 pending，aiTestReport 仍是 null

    store.answerAITestScenario(id, scenarios.at(-1)!.id, scenarios.at(-1)!.expectedTrigger)
    await wrapper.vm.$nextTick()
    expect(store.aiTestReport!.correct).not.toBe(store.aiTestReport!.total) // 確認這次真的不是 100%
    expect(wrapper.find('.ai-enable-btn').exists()).toBe(false)
  })

  it('100% 全對：顯示啟用按鈕，點擊走 SkillEnableFlow 並在確認後呼叫 setAssignedAgents + toggleSkill', async () => {
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '待測技能2', instructions: 'x', triggerHint: 'y', assignedAgents: [] })
    await store.generateAITestScenarios(id)
    for (const sc of [...store.aiTestScenarios]) {
      store.answerAITestScenario(id, sc.id, sc.expectedTrigger) // 全部答對
    }
    expect(store.aiTestReport!.correct).toBe(store.aiTestReport!.total)

    const wrapper = mount(SkillTestAI, { props: { skillId: id } })
    await wrapper.vm.$nextTick()

    const enableBtn = wrapper.find('.ai-enable-btn')
    expect(enableBtn.exists()).toBe(true)
    await enableBtn.trigger('click')
    await wrapper.vm.$nextTick()

    const agentDialog = new DOMWrapper(document.body).find('.enable-agent-dialog')
    expect(agentDialog.exists()).toBe(true) // 100% 直接進 Agent 確認，不會看到閘門失敗對話框
    await agentDialog.findAll('.se-agent-chip').find(c => c.text().includes('通用助理'))!.trigger('click')
    await agentDialog.findAll('button').find(b => b.text().includes('確認並啟用'))!.trigger('click')

    expect(store.findSkill(id)!.isEnabled).toBe(true)
    expect(store.findSkill(id)!.assignedAgents).toEqual(['通用助理'])
  })
```

`src/components/__tests__/SkillTestAI.test.ts:2` 目前是 `import { mount } from '@vue/test-utils'`，改成：

```ts
import { mount, DOMWrapper } from '@vue/test-utils'
```

- [ ] **Step 3: 跑測試確認失敗**

Run: `npx vitest run src/components/__tests__/SkillTestAI.test.ts`
Expected: FAIL — 找不到 `.ai-enable-btn`

- [ ] **Step 4: 實作**

在 `src/components/Skill/SkillTestAI.vue` 的 `<!-- ③ Report -->` 區塊（`</div>` 收尾 `.ai-report` 之前，即 `<p class="report-summary">{{ store.aiTestReport.summary }}</p>` 這行之後）加入：

```html
          <button
            v-if="isFullPass"
            type="button"
            class="custom-btn custom-main-btn ai-enable-btn"
            @click="handleEnableClick"
          >
            <i class="material-symbols-outlined">check_circle</i>啟用技能
          </button>
```

在 `<template>` 最外層（`.SkillTestAI` 的 `</div>` 之前）加入共用元件：

```html
    <SkillEnableFlow ref="enableFlowRef" />
```

`<script setup>` 部分，把：

```ts
import { computed } from 'vue'
import { useSkillStore } from '@/stores/skillStore'
import type { AITestTag } from '@/stores/skillStore'

const props = defineProps<{ skillId: string }>()
const store = useSkillStore()
```

改成：

```ts
import { computed, ref } from 'vue'
import { useSkillStore } from '@/stores/skillStore'
import type { AITestTag } from '@/stores/skillStore'
import SkillEnableFlow from '@/components/Skill/SkillEnableFlow.vue'

const props = defineProps<{ skillId: string }>()
const store = useSkillStore()
const enableFlowRef = ref<InstanceType<typeof SkillEnableFlow> | null>(null)

const isFullPass = computed(() =>
  !!store.aiTestReport && store.aiTestReport.total > 0 && store.aiTestReport.correct === store.aiTestReport.total
)

async function handleEnableClick() {
  const skill = store.findSkill(props.skillId)
  if (!skill) return
  // 100% 全對時 canEnableSkill() 一定是 true，這裡不會看到「還不能啟用」對話框，
  // 但呼叫端還是要處理完整的 EnableFlowOutcome，不能假設只會 resolve confirmed
  const outcome = await enableFlowRef.value!.requestEnable(skill, skill.assignedAgents ?? [])
  if (outcome.type !== 'confirmed') return
  store.setAssignedAgents(skill.id, outcome.agents)
  store.toggleSkill(skill.id)
}
```

（其餘既有的 `TAG_LABELS`／`tagLabel`／`answeredCount`／`ratePercent`／`regenerate`／`answer` 不動）

- [ ] **Step 5: 跑測試確認通過**

Run: `npx vitest run src/components/__tests__/SkillTestAI.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/Skill/SkillTestAI.vue src/components/__tests__/SkillTestAI.test.ts
git commit -m "feat(skill-test): show enable button when AI quick test passes 100%"
```

---

## Task 6: `useSkillStudioConversation.ts` 在 100% 時主動引導使用者啟用

**Files:**
- Modify: `src/composables/useSkillStudioConversation.ts:736-746`
- Modify: `src/composables/__tests__/useSkillStudioConversation.test.ts:1211-1220`

**Interfaces:**
- 不變：`notifyTestResult(report: AITestReport): void`（既有簽名，內部行為改變）

- [ ] **Step 1: 更新既有測試（先改測試，斷言新行為）**

把 `src/composables/__tests__/useSkillStudioConversation.test.ts:1211-1220`：

```ts
  it('全對（100%）：不打擾使用者，不轉關卡也不推訊息', () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    const before = c.messages.value.length
    const stageBefore = c.gateStage.value
    c.notifyTestResult({ total: 8, correct: 8, byTag: {} as any, summary: '' })
    expect(c.gateStage.value).toBe(stageBefore)
    expect(c.messages.value.length).toBe(before)
  })
```

改成：

```ts
  it('全對（100%）：不轉關卡，但主動推一句引導啟用的訊息', () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('chat')
    const before = c.messages.value.length
    const stageBefore = c.gateStage.value
    c.notifyTestResult({ total: 8, correct: 8, byTag: {} as any, summary: '' })
    expect(c.gateStage.value).toBe(stageBefore) // 不打斷後續對話，維持原本關卡
    expect(c.messages.value.length).toBe(before + 1)
    const last = c.messages.value.at(-1)!
    expect(last.role).toBe('agent')
    expect(last.content).toContain('啟用技能')
  })
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts -t "全對"`
Expected: FAIL — `messages.value.length` 還是 `before`（沒推訊息）

- [ ] **Step 3: 實作**

把 `src/composables/useSkillStudioConversation.ts:736-746`：

```ts
  // AI 快速測試沒有全對：左側對話主動引導使用者調整內容，退回既有的 clarify 補齊流程
  // （沿用「多輪問答補齊草稿內容」的既有語意，不新增一個專門的關卡）。全對就不用打擾使用者
  function notifyTestResult(report: AITestReport): void {
    if (report.total === 0 || report.correct === report.total) return
    const rate = Math.round((report.correct / report.total) * 100)
    gateStage.value = 'clarify'
    push({
      role: 'agent',
      content: `剛剛的測試沒有全部通過（答對 ${report.correct}/${report.total}，${rate}%），要不要跟我說說看哪裡需要調整？我會幫你補齊或修正做法內容。`,
    })
  }
```

改成：

```ts
  // AI 快速測試結果出來：全對就主動引導去啟用（不轉關卡，純推一句訊息，跟現有
  // save() 之後「可以到「測試」tab 驗證」是同一種寫法）；沒全對則退回既有的 clarify
  // 補齊流程（沿用「多輪問答補齊草稿內容」的既有語意，不新增一個專門的關卡）
  function notifyTestResult(report: AITestReport): void {
    if (report.total === 0) return
    if (report.correct === report.total) {
      push({
        role: 'agent',
        content: '太好了，這次全部答對了！到下面的測試報告點「啟用技能」，確認一下哪些 Agent 可以用之後就能上線了。',
      })
      return
    }
    const rate = Math.round((report.correct / report.total) * 100)
    gateStage.value = 'clarify'
    push({
      role: 'agent',
      content: `剛剛的測試沒有全部通過（答對 ${report.correct}/${report.total}，${rate}%），要不要跟我說說看哪裡需要調整？我會幫你補齊或修正做法內容。`,
    })
  }
```

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts`
Expected: PASS（全檔案，包含這一個修改過的測試跟其餘不受影響的測試）

- [ ] **Step 5: 跑 `SkillStudioWorkspace.test.ts`，確認 watcher 接線沒有被影響**

Run: `npx vitest run src/components/__tests__/SkillStudioWorkspace.test.ts`
Expected: PASS（這個檔案裡跟 `aiTestReport` 有關的測試用的是非 100% 報告，不受這次改動影響）

- [ ] **Step 6: Commit**

```bash
git add src/composables/useSkillStudioConversation.ts src/composables/__tests__/useSkillStudioConversation.test.ts
git commit -m "feat(skill-studio): guide user to enable skill when AI quick test is 100%"
```

---

## 完成後手動驗證（非自動化）

1. `npm run dev`，開一顆個人技能，到「技能測試沙盒」跑 AI 快速測試全對：畫面應該出現「啟用技能」按鈕，點下去先跳確認可用 Agent 的對話框（不會看到「還不能啟用」），勾至少一個 Agent、按「確認並啟用」，技能狀態真的變成啟用。
2. 技能管理頁對一顆從沒測過的技能點「啟用技能」：先看到「還不能啟用」對話框，選「視為通過」後接著看到 Agent 確認對話框，兩步都過才真的啟用。
3. 手動建立技能（`/view/SkillEditor`，新建模式）：送出後直接進技能管理列表，不會跳出任何啟用相關對話框，技能狀態是停用。
4. 手動編輯一顆停用的技能，勾選「啟用狀態」送出：走跟第 2 點一樣的兩步流程。
5. 用「用對話建立」（AI 賦能抽屜）走完一輪，在測試 tab 跑 AI 快速測試全對：左側對話應該主動推一句提到「啟用技能」的引導訊息。
