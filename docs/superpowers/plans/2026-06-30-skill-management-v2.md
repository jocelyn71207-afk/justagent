# Skill 管理單元 v2 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 補齊技能管理的功能缺口：資料模型擴充、UX 修復（確認 Modal / Agent 可見性 / 版本狀態）、搜尋篩選、批量更新、衝突解決、Draft/Review 流程接線、操作稽核、測試歷史。

**Architecture:** 所有功能以 mock 資料實作，不串接真實 API。skillStore 擴充為核心，8 個 Task 各自可獨立實作與 browser 驗收。DraftCard / SkillReviewDrawer / SkillVersionCompareModal / SkillEditor 已在 codebase 中，本計畫的工作是補齊 store 型別並將它們接線至 SkillManagement.vue。

**Tech Stack:** Vue 3 (script setup + TypeScript)、Pinia、Vue Router、SCSS (BEM-lite)、Vitest、Material Symbols Outlined

## Global Constraints

- `<script setup lang="ts">`，禁止 Options API
- 禁止 `<style scoped>`，樣式統一在 `src/scss/` 管理
- 所有 import 使用 `@/` alias
- 顏色使用 CSS Custom Properties / SCSS 變數，禁止寫死 hex（amber/red 系列用 SCSS 變數不夠時可用 hex，因 base 無對應 token）
- 新增 SCSS 檔後必須在對應 `_index.scss` 加 `@forward`
- 圖示使用 `<i class="material-symbols-outlined">icon_name</i>`
- Pinia store 使用 setup function 風格

---

## 檔案總覽

| 動作 | 路徑 |
|------|------|
| Modify | `src/stores/skillStore.ts` |
| Modify | `src/stores/__tests__/skillStore.test.ts` |
| Create | `src/components/ConfirmModal.vue` |
| Create | `src/scss/components/_ConfirmModal.scss` |
| Modify | `src/components/Skill/SkillCard.vue` |
| Modify | `src/scss/components/_SkillCard.scss` |
| Modify | `src/components/Skill/SkillDetailDrawer.vue` |
| Modify | `src/scss/components/_SkillDetailDrawer.scss` |
| Create | `src/components/Skill/SkillFilterBar.vue` |
| Create | `src/scss/components/_SkillFilterBar.scss` |
| Create | `src/components/Skill/BatchUpdateModal.vue` |
| Create | `src/scss/components/_BatchUpdateModal.scss` |
| Create | `src/components/Skill/ConflictResolveStep.vue` |
| Modify | `src/components/Skill/UpstreamUpdateDrawer.vue` |
| Create | `src/scss/components/_DraftCard.scss` |
| Create | `src/scss/components/_SkillReviewDrawer.scss` |
| Create | `src/scss/components/_SkillVersionCompare.scss` |
| Modify | `src/scss/components/_index.scss` |
| Modify | `src/router/index.ts` |
| Modify | `src/views/SkillManagement.vue` |
| Modify | `src/scss/views/_SkillManagement.scss` |
| Modify | `src/components/Skill/SkillTestAI.vue` |

---

## Task 1: skillStore 全面擴充

**Files:**
- Modify: `src/stores/skillStore.ts`
- Modify: `src/stores/__tests__/skillStore.test.ts`

**Interfaces:**
- Produces: `SkillVersionStatus`, `SkillVersion`, `SkillReviewRecord`, `DraftSkill`, `OperationRecord`, `ConflictItem`, `ConflictResolution`, `TestRun` 型別；`pendingUpdateCount`, `pendingUpdateSkills` computed；`getSkillVersions`, `approveSkillVersion`, `rejectSkillVersion`, `createSkill`, `updateSkill`, `createDraft`, `updateDraft`, `deleteDraft`, `submitDraft`, `batchMergeUpstreamUpdates`, `saveTestRun`, `getTestRunHistory` actions；修改後的 `toggleSkill`, `mergeUpstreamUpdate`, `ignoreUpstreamUpdate`, `detachUpstream`

---

- [ ] **Step 1: 在測試檔新增失敗測試（版本管理 + Draft + 批量更新 + 稽核 + 測試歷史）**

在 `src/stores/__tests__/skillStore.test.ts` 末尾的最後一個 `it()` 之後、`})` 關閉 `describe('skillStore', ...)` 之前，加入：

```typescript
  describe('版本管理', () => {
    it('getSkillVersions 返回指定技能的版本列表', () => {
      const store = useSkillStore()
      const versions = store.getSkillVersions('sys-cs-001')
      expect(versions.length).toBeGreaterThan(0)
    })

    it('approveSkillVersion 將版本設為 active，前一 active 設為 history', () => {
      const store = useSkillStore()
      const reviewing = store.getSkillVersions('sys-cs-001').find(v => v.status === 'reviewing')
      expect(reviewing).toBeDefined()
      store.approveSkillVersion('sys-cs-001', reviewing!.id)
      const versions = store.getSkillVersions('sys-cs-001')
      expect(versions.find(v => v.id === reviewing!.id)!.status).toBe('active')
      expect(versions.filter(v => v.status === 'active').length).toBe(1)
    })

    it('rejectSkillVersion 將版本設為 rejected', () => {
      const store = useSkillStore()
      const reviewing = store.getSkillVersions('sys-cs-001').find(v => v.status === 'reviewing')
      expect(reviewing).toBeDefined()
      store.rejectSkillVersion('sys-cs-001', reviewing!.id, '需修改語氣')
      expect(store.getSkillVersions('sys-cs-001').find(v => v.id === reviewing!.id)!.status).toBe('rejected')
    })
  })

  describe('Draft CRUD', () => {
    it('createDraft 新增一筆草稿', () => {
      const store = useSkillStore()
      const before = store.drafts.length
      store.createDraft()
      expect(store.drafts.length).toBe(before + 1)
    })

    it('updateDraft 更新草稿欄位', () => {
      const store = useSkillStore()
      const draft = store.drafts[0]
      store.updateDraft(draft.id, { name: '測試草稿' })
      expect(store.drafts.find(d => d.id === draft.id)!.name).toBe('測試草稿')
    })

    it('deleteDraft 移除草稿', () => {
      const store = useSkillStore()
      const before = store.drafts.length
      const draft = store.drafts[0]
      store.deleteDraft(draft.id)
      expect(store.drafts.length).toBe(before - 1)
    })

    it('submitDraft 移除草稿並在 flatSkills 中新增技能', () => {
      const store = useSkillStore()
      store.updateDraft(store.drafts[0].id, { name: '訂單追蹤助理', instructions: '測試指令' })
      const draftName = store.drafts[0].name
      const before = store.drafts.length
      store.submitDraft(store.drafts[0].id)
      expect(store.drafts.length).toBe(before - 1)
      expect(store.flatSkills.some(s => s.name === draftName)).toBe(true)
    })
  })

  describe('批量更新', () => {
    it('pendingUpdateCount 大於 0', () => {
      const store = useSkillStore()
      expect(store.pendingUpdateCount).toBeGreaterThan(0)
    })

    it('batchMergeUpstreamUpdates 跳過有衝突的技能', () => {
      const store = useSkillStore()
      const allIds = store.pendingUpdateSkills.map(s => s.id)
      store.batchMergeUpstreamUpdates(allIds)
      const conflictIds = allIds.filter(id => store.findSkill(id)?.upstreamConflicts?.length)
      conflictIds.forEach(id => {
        expect(store.findSkill(id)!.upstreamUpdateStatus).toBe('update_available')
      })
    })
  })

  describe('稽核記錄', () => {
    it('toggleSkill 寫入 auditLog', () => {
      const store = useSkillStore()
      const skill = store.flatSkills[0]
      store.toggleSkill(skill.id)
      expect(store.findSkill(skill.id)!.auditLog!.length).toBeGreaterThan(0)
    })

    it('mergeUpstreamUpdate（無衝突技能）寫入 UPSTREAM_MERGED', () => {
      const store = useSkillStore()
      const target = store.flatSkills.find(
        s => s.upstreamUpdateStatus === 'update_available' && !s.upstreamConflicts?.length
      )
      if (!target) return
      store.mergeUpstreamUpdate(target.id)
      expect(store.findSkill(target.id)!.auditLog?.some(r => r.action === 'UPSTREAM_MERGED')).toBe(true)
    })
  })

  describe('測試歷史', () => {
    it('saveTestRun 儲存記錄', () => {
      const store = useSkillStore()
      store.saveTestRun('sys-cs-001', { total: 7, passed: 5 })
      expect(store.getTestRunHistory('sys-cs-001').length).toBeGreaterThan(0)
    })

    it('超過 10 筆時不超過上限', () => {
      const store = useSkillStore()
      for (let i = 0; i < 12; i++) {
        store.saveTestRun('sys-cs-001', { total: 7, passed: i % 7 })
      }
      expect(store.getTestRunHistory('sys-cs-001').length).toBeLessThanOrEqual(10)
    })
  })
```

- [ ] **Step 2: 執行測試確認全部失敗**

```bash
npm run test:unit -- skillStore
```

預期：`FAIL` — Cannot read properties / function not found 等。

- [ ] **Step 3: 在 skillStore.ts 最上方（import 之後、MOCK_SKILLS 之前）加入所有新型別**

```typescript
export type SkillVersionStatus = 'draft' | 'reviewing' | 'active' | 'history' | 'rejected'

export interface SkillVersion {
  id: string
  versionTag: string
  status: SkillVersionStatus
  name: string
  description: string
  instructions: string
  triggerHint?: string
  capabilities?: { name: string }[]
  reviewNote?: string
  updateNote?: string
  reviewHistory?: SkillReviewRecord[]
  createdAt: string
}

export interface SkillReviewRecord {
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN'
  by: string
  time: string
  note?: string
}

export interface DraftSkill {
  id: string
  name: string
  instructions: string
  triggerHint?: string
  assignedAgents: string[]
  description?: string
  updatedAt: string
}

export interface OperationRecord {
  action: 'ENABLED' | 'DISABLED' | 'UPSTREAM_MERGED' | 'UPSTREAM_IGNORED' | 'UPSTREAM_DETACHED'
  by: string
  time: string
}

export interface ConflictItem {
  field: string
  label: string
  mine: string
  upstream: string
}

export interface ConflictResolution {
  field: string
  choice: 'mine' | 'upstream'
}

export interface TestRun {
  id: string
  skillId: string
  date: string
  total: number
  passed: number
  passRate: number
}

interface CreateSkillPayload {
  name: string
  instructions: string
  triggerHint?: string
  assignedAgents: string[]
  isEnabled: boolean
}
type UpdateSkillPayload = Omit<CreateSkillPayload, 'isEnabled'>
```

- [ ] **Step 4: 在 Skill 介面新增欄位**

找到 `export interface Skill {`，在最後一個欄位（`children?: Skill[]`）之後、`}` 之前加入：

```typescript
  instructions?: string
  triggerHint?: string
  assignedAgents: string[]
  versions?: SkillVersion[]
  auditLog?: OperationRecord[]
  upstreamConflicts?: ConflictItem[]
```

- [ ] **Step 5: 更新 MOCK_SKILLS，對既有技能補充新欄位**

找到 `ext-cs-return-001` 物件（退貨版），在 `evolutionContext` 之後加入：

```typescript
        assignedAgents: ['客服中心助理', '電商小幫手'],
        auditLog: [
          { action: 'ENABLED' as const, by: '管理員', time: '2026-06-10T09:00:00Z' },
        ],
        upstreamConflicts: [
          {
            field: 'instructions',
            label: '技能指令',
            mine: '你是一個客服助理，專門處理退貨相關問題。',
            upstream: '你是一個專業客服助理，使用親切且專業的語氣，專門處理退貨相關問題。',
          },
        ],
```

找到 `sys-cs-001` 物件（通用客服機器人），在 `upstreamUpdateStatus: 'up_to_date',` 之後加入：

```typescript
        assignedAgents: ['通用助理', '客服中心助理'],
        auditLog: [
          { action: 'ENABLED' as const, by: '管理員', time: '2026-06-28T10:00:00Z' },
          { action: 'DISABLED' as const, by: '管理員', time: '2026-06-20T14:00:00Z' },
          { action: 'ENABLED' as const, by: '管理員', time: '2026-06-10T09:00:00Z' },
        ],
        versions: [
          {
            id: 'v-cs-001-v241',
            versionTag: '2.4.1',
            status: 'reviewing' as SkillVersionStatus,
            name: '通用客服機器人',
            description: '處理客戶諮詢與 FAQ，支援多語言與情緒分析',
            instructions: '你是一個專業客服助理，使用親切且專業的語氣，處理各類客戶諮詢。',
            reviewNote: '新增情緒分析能力，優化回覆語氣',
            updateNote: '優化 Prompt 語氣',
            reviewHistory: [
              { action: 'SUBMITTED' as const, by: '管理員', time: '2026-06-28T10:00:00Z' },
            ],
            createdAt: '2026-06-28T10:00:00Z',
          },
          {
            id: 'v-cs-001-v240',
            versionTag: '2.4.0',
            status: 'active' as SkillVersionStatus,
            name: '通用客服機器人',
            description: '處理客戶諮詢與 FAQ，支援多語言與情緒分析',
            instructions: '你是一個客服助理，處理各類客戶諮詢與 FAQ。',
            createdAt: '2026-06-01T10:00:00Z',
          },
        ],
```

對其餘技能（`sys-doc-001`, `sys-meeting-001`, `ext-meeting-eng-001`, `ext-erp-001`）補充 `assignedAgents: []`（TypeScript 要求 required 欄位）。

- [ ] **Step 6: 在 MOCK_SKILLS 之後加入 MOCK_DRAFTS 和 MOCK_TEST_RUNS**

```typescript
const MOCK_DRAFTS: DraftSkill[] = [
  {
    id: 'draft-001',
    name: '訂單追蹤助理',
    instructions: '',
    assignedAgents: [],
    updatedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
]

const MOCK_TEST_RUNS: TestRun[] = [
  { id: 'run-001', skillId: 'ext-cs-return-001', date: '2026-06-25T10:00:00Z', total: 7, passed: 6, passRate: 0.857 },
  { id: 'run-002', skillId: 'ext-cs-return-001', date: '2026-06-28T14:00:00Z', total: 7, passed: 4, passRate: 0.571 },
]
```

- [ ] **Step 7: 在 store 的 defineStore 內，新增 state 與 computed**

在 `const firstPendingUpdate = computed(...)` 之後加入：

```typescript
  const pendingUpdateCount = computed(() =>
    flatSkills.value.filter(s => s.upstreamUpdateStatus === 'update_available').length
  )
  const pendingUpdateSkills = computed(() =>
    flatSkills.value.filter(s => s.upstreamUpdateStatus === 'update_available')
  )

  const drafts = ref<DraftSkill[]>(MOCK_DRAFTS)
  const testRunHistory = ref<TestRun[]>(MOCK_TEST_RUNS)
```

- [ ] **Step 8: 替換現有四個 action（toggleSkill / mergeUpstreamUpdate / ignoreUpstreamUpdate / detachUpstream）為帶稽核記錄的版本**

完整替換這四個 function：

```typescript
  function toggleSkill(id: string): void {
    const skill = findSkill(id)
    if (skill) {
      skill.isEnabled = !skill.isEnabled
      skill.auditLog ??= []
      skill.auditLog.unshift({
        action: skill.isEnabled ? 'ENABLED' : 'DISABLED',
        by: '管理員',
        time: new Date().toISOString(),
      })
      if (skill.auditLog.length > 20) skill.auditLog.length = 20
    }
  }

  function ignoreUpstreamUpdate(id: string): void {
    const skill = findSkill(id)
    if (skill) {
      skill.upstreamUpdateStatus = 'ignored'
      skill.auditLog ??= []
      skill.auditLog.unshift({ action: 'UPSTREAM_IGNORED', by: '管理員', time: new Date().toISOString() })
    }
  }

  function mergeUpstreamUpdate(id: string, resolutions?: ConflictResolution[]): void {
    const skill = findSkill(id)
    if (skill) {
      skill.upstreamUpdateStatus = 'up_to_date'
      if (skill.forkSourceVersion) skill.forkSourceVersion = skill.version
      skill.upstreamConflicts = undefined
      skill.auditLog ??= []
      skill.auditLog.unshift({ action: 'UPSTREAM_MERGED', by: '管理員', time: new Date().toISOString() })
    }
  }

  function detachUpstream(id: string): void {
    const skill = findSkill(id)
    if (skill) {
      skill.upstreamLink = 'unlinked'
      skill.upstreamUpdateStatus = 'ignored'
      skill.auditLog ??= []
      skill.auditLog.unshift({ action: 'UPSTREAM_DETACHED', by: '管理員', time: new Date().toISOString() })
    }
  }
```

- [ ] **Step 9: 在 detachUpstream 之後加入所有新 actions**

```typescript
  function getSkillVersions(skillId: string): SkillVersion[] {
    return findSkill(skillId)?.versions ?? []
  }

  function approveSkillVersion(skillId: string, versionId: string): void {
    const skill = findSkill(skillId)
    if (!skill?.versions) return
    skill.versions.forEach(v => { if (v.status === 'active') v.status = 'history' })
    const target = skill.versions.find(v => v.id === versionId)
    if (!target) return
    target.status = 'active'
    target.reviewHistory ??= []
    target.reviewHistory.push({ action: 'APPROVED', by: '管理員', time: new Date().toISOString() })
    skill.version = target.versionTag
    skill.name = target.name
    skill.description = target.description
    if (target.instructions) skill.instructions = target.instructions
    if (target.triggerHint !== undefined) skill.triggerHint = target.triggerHint
  }

  function rejectSkillVersion(skillId: string, versionId: string, note: string): void {
    const skill = findSkill(skillId)
    const target = skill?.versions?.find(v => v.id === versionId)
    if (!target) return
    target.status = 'rejected'
    target.reviewHistory ??= []
    target.reviewHistory.push({ action: 'REJECTED', by: '管理員', time: new Date().toISOString(), note })
  }

  function createSkill(payload: CreateSkillPayload): void {
    const now = new Date().toISOString()
    const newSkill: Skill = {
      id: `ext-new-${Date.now()}`,
      name: payload.name,
      description: '',
      type: 'extension',
      origin: 'custom_version',
      version: '1.0.0',
      isEnabled: payload.isEnabled,
      usageCount: 0,
      testPassRate: 0,
      avgLatencyMs: 0,
      upstreamLink: 'unlinked',
      upstreamUpdateStatus: 'ignored',
      assignedAgents: payload.assignedAgents,
      instructions: payload.instructions,
      triggerHint: payload.triggerHint,
      auditLog: [],
      versions: [{
        id: `v-new-${Date.now()}`,
        versionTag: '1.0.0',
        status: 'reviewing',
        name: payload.name,
        description: '',
        instructions: payload.instructions,
        triggerHint: payload.triggerHint,
        reviewHistory: [{ action: 'SUBMITTED', by: '管理員', time: now }],
        createdAt: now,
      }],
    }
    skills.value.push(newSkill)
  }

  function updateSkill(skillId: string, payload: UpdateSkillPayload): void {
    const skill = findSkill(skillId)
    if (!skill) return
    const parts = skill.version.split('.').map(Number)
    parts[2] = (parts[2] ?? 0) + 1
    const newTag = parts.join('.')
    const newVersion: SkillVersion = {
      id: `v-${skillId}-${Date.now()}`,
      versionTag: newTag,
      status: 'reviewing',
      name: payload.name,
      description: skill.description,
      instructions: payload.instructions,
      triggerHint: payload.triggerHint,
      reviewHistory: [{ action: 'SUBMITTED', by: '管理員', time: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
    }
    skill.versions ??= []
    skill.versions.push(newVersion)
  }

  function createDraft(): DraftSkill {
    const draft: DraftSkill = {
      id: `draft-${Date.now()}`,
      name: '',
      instructions: '',
      assignedAgents: [],
      updatedAt: new Date().toISOString(),
    }
    drafts.value.push(draft)
    return draft
  }

  function updateDraft(id: string, patch: Partial<DraftSkill>): void {
    const draft = drafts.value.find(d => d.id === id)
    if (draft) {
      Object.assign(draft, patch)
      draft.updatedAt = new Date().toISOString()
    }
  }

  function deleteDraft(id: string): void {
    const idx = drafts.value.findIndex(d => d.id === id)
    if (idx !== -1) drafts.value.splice(idx, 1)
  }

  function submitDraft(id: string): void {
    const draft = drafts.value.find(d => d.id === id)
    if (!draft) return
    createSkill({
      name: draft.name,
      instructions: draft.instructions,
      triggerHint: draft.triggerHint,
      assignedAgents: [...draft.assignedAgents],
      isEnabled: true,
    })
    deleteDraft(id)
  }

  function batchMergeUpstreamUpdates(skillIds: string[]): string[] {
    const merged: string[] = []
    for (const id of skillIds) {
      const skill = findSkill(id)
      if (!skill || skill.upstreamConflicts?.length) continue
      mergeUpstreamUpdate(id)
      merged.push(id)
    }
    return merged
  }

  function saveTestRun(skillId: string, result: { total: number; passed: number }): void {
    testRunHistory.value.push({
      id: `run-${Date.now()}`,
      skillId,
      date: new Date().toISOString(),
      total: result.total,
      passed: result.passed,
      passRate: result.total > 0 ? result.passed / result.total : 0,
    })
    const runs = testRunHistory.value.filter(r => r.skillId === skillId)
    if (runs.length > 10) {
      const oldestIdx = testRunHistory.value.indexOf(runs[0])
      testRunHistory.value.splice(oldestIdx, 1)
    }
  }

  function getTestRunHistory(skillId: string): TestRun[] {
    return testRunHistory.value
      .filter(r => r.skillId === skillId)
      .slice(-5)
      .reverse()
  }
```

- [ ] **Step 10: 在 return 物件中加入所有新的 state / computed / actions**

在 `return {` 的物件中，找到最後一個 action（`resetConversation`），在其後加入：

```typescript
    drafts,
    testRunHistory,
    pendingUpdateCount,
    pendingUpdateSkills,
    getSkillVersions,
    approveSkillVersion,
    rejectSkillVersion,
    createSkill,
    updateSkill,
    createDraft,
    updateDraft,
    deleteDraft,
    submitDraft,
    batchMergeUpstreamUpdates,
    saveTestRun,
    getTestRunHistory,
```

- [ ] **Step 11: 執行測試確認全部通過**

```bash
npm run test:unit -- skillStore
```

預期：所有測試 PASS（含原有 8 個 + 新增的約 14 個）。

- [ ] **Step 12: Commit**

```bash
git add src/stores/skillStore.ts src/stores/__tests__/skillStore.test.ts
git commit -m "feat(skill): expand skillStore with version management, draft/review, audit log, test history"
```

---

## Task 2: ConfirmModal.vue

**Files:**
- Create: `src/components/ConfirmModal.vue`
- Create: `src/scss/components/_ConfirmModal.scss`
- Modify: `src/scss/components/_index.scss`

**Interfaces:**
- Produces:
  ```ts
  // Props
  modelValue: boolean
  title: string
  message: string
  confirmLabel?: string   // 預設「確認」
  variant?: 'default' | 'danger'
  // Emits
  'update:modelValue': [boolean]
  confirm: []
  ```

---

- [ ] **Step 1: 建立 `src/components/ConfirmModal.vue`**

```vue
<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="ConfirmModal">
        <div class="cm-overlay" />
        <div class="cm-dialog">
          <div class="cm-head">
            <i v-if="variant === 'danger'" class="material-symbols-outlined cm-icon--danger">warning</i>
            <h3>{{ title }}</h3>
          </div>
          <div class="cm-body">{{ message }}</div>
          <div class="cm-footer">
            <button class="custom-btn" @click="emit('update:modelValue', false)">取消</button>
            <button
              :class="['custom-btn', 'custom-main-btn', variant === 'danger' && 'cm-btn--danger']"
              @click="handleConfirm"
            >{{ confirmLabel ?? '確認' }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: boolean
  title: string
  message: string
  confirmLabel?: string
  variant?: 'default' | 'danger'
}>(), { variant: 'default' })

const emit = defineEmits<{
  'update:modelValue': [boolean]
  confirm: []
}>()

function handleConfirm() {
  emit('confirm')
  emit('update:modelValue', false)
}
</script>
```

- [ ] **Step 2: 建立 `src/scss/components/_ConfirmModal.scss`**

```scss
.ConfirmModal {
  position: fixed;
  inset: 0;
  z-index: 600;
  display: flex;
  align-items: center;
  justify-content: center;

  .cm-overlay {
    position: absolute;
    inset: 0;
    background: rgba(9, 21, 26, 0.45);
    backdrop-filter: blur(4px);
  }

  .cm-dialog {
    position: relative;
    z-index: 1;
    background: var(--surface);
    border-radius: 14px;
    width: 400px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    overflow: hidden;
  }

  .cm-head {
    padding: 20px 20px 0;
    display: flex;
    align-items: center;
    gap: 10px;
    h3 { font-size: 16px; font-weight: 600; }
    .cm-icon--danger { color: #dc2626; font-size: 22px; }
  }

  .cm-body {
    padding: 12px 20px 20px;
    font-size: 14px;
    color: var(--text-muted);
    line-height: 1.6;
  }

  .cm-footer {
    padding: 12px 20px;
    border-top: 1px solid var(--divider-a50);
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .cm-btn--danger {
    background: #dc2626 !important;
    border-color: #dc2626 !important;
    color: #fff !important;
    &:hover { background: #b91c1c !important; border-color: #b91c1c !important; }
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter-from,
.modal-fade-leave-to { opacity: 0; }
```

- [ ] **Step 3: 在 `src/scss/components/_index.scss` 末尾加入**

```scss
@forward 'ConfirmModal';
```

- [ ] **Step 4: 目視驗證**

在任一現有 View 暫時加入：
```vue
<ConfirmModal
  v-model="show"
  title="確認永久分離"
  message="此操作不可逆，分離後將不再收到上游更新通知。確定要永久分離嗎？"
  confirmLabel="永久分離"
  variant="danger"
  @confirm="console.log('confirmed')"
/>
```

確認：對話框居中、遮罩不關閉、取消關閉、確認按鈕紅色。驗完移除暫時程式碼。

- [ ] **Step 5: Commit**

```bash
git add src/components/ConfirmModal.vue src/scss/components/_ConfirmModal.scss src/scss/components/_index.scss
git commit -m "feat(skill): add generic ConfirmModal component"
```

---

## Task 3: SkillCard 加 reviewing badge + tag--draft style

**Files:**
- Modify: `src/components/Skill/SkillCard.vue`
- Modify: `src/scss/components/_SkillCard.scss`

**Interfaces:**
- Consumes: `Skill.versions` from Task 1

---

- [ ] **Step 1: 在 SkillCard.vue 的 `<script setup>` 中新增 computed**

在 `const originLabel = computed(...)` 之後加入：

```typescript
const hasReviewingVersion = computed(() =>
  props.skill.versions?.some(v => v.status === 'reviewing') ?? false
)
```

- [ ] **Step 2: 在 skill-card-name div 中加入 reviewing badge**

找到顯示 `tag--update` 的 `<span>`，在其之後加入：

```html
<span v-if="hasReviewingVersion" class="skill-tag tag--reviewing">審核中</span>
```

- [ ] **Step 3: 在 `_SkillCard.scss` 的 `.skill-tag` 區塊中加入兩個新 variant**

在 `&.tag--update` 樣式後加入：

```scss
  &.tag--reviewing { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
  &.tag--draft     { background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }
```

- [ ] **Step 4: 目視驗證**

訪問 `/view/Skills`，確認「通用客服機器人」（sys-cs-001）卡片上出現藍色「審核中」badge。

- [ ] **Step 5: Commit**

```bash
git add src/components/Skill/SkillCard.vue src/scss/components/_SkillCard.scss
git commit -m "feat(skill): add reviewing badge to SkillCard and draft/reviewing tag styles"
```

---

## Task 4: SkillDetailDrawer 擴充（Agent chips + 操作記錄 + 查看審核按鈕）

**Files:**
- Modify: `src/components/Skill/SkillDetailDrawer.vue`
- Modify: `src/scss/components/_SkillDetailDrawer.scss`

**Interfaces:**
- Consumes: `Skill.assignedAgents`, `Skill.auditLog`, `Skill.versions` from Task 1
- Produces: new emit `review: [skill: Skill]`

---

- [ ] **Step 1: 在 SkillDetailDrawer.vue 的 emits 中加入 review**

找到：
```typescript
const emit = defineEmits<{
  close: []
  test: [skill: Skill]
  toggle: [skill: Skill]
}>()
```

替換為：
```typescript
const emit = defineEmits<{
  close: []
  test: [skill: Skill]
  toggle: [skill: Skill]
  review: [skill: Skill]
}>()
```

- [ ] **Step 2: 在 script setup 中加入 computed 和 helper functions**

在 `const originLabel = computed(...)` 之後加入：

```typescript
const assignedAgents = computed(() => props.skill?.assignedAgents ?? [])
const auditLog = computed(() => (props.skill?.auditLog ?? []).slice(0, 5))
const hasReviewingVersion = computed(() =>
  props.skill?.versions?.some(v => v.status === 'reviewing') ?? false
)

function auditActionLabel(action: OperationRecord['action']): string {
  const map: Record<OperationRecord['action'], string> = {
    ENABLED: '啟用此技能',
    DISABLED: '停用此技能',
    UPSTREAM_MERGED: '合併上游更新',
    UPSTREAM_IGNORED: '忽略上游更新',
    UPSTREAM_DETACHED: '永久分離上游',
  }
  return map[action]
}

function formatAuditDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}
```

在 import 行加入 `OperationRecord`：
```typescript
import type { Skill, OperationRecord } from '@/stores/skillStore'
```

- [ ] **Step 3: 在 drawer-actions 中加入「查看審核」按鈕**

找到 `<div class="drawer-actions">` 內的第一個按鈕（對話測試），在其之前加入：

```html
<button v-if="hasReviewingVersion" class="custom-btn" @click="emit('review', skill!)">
  <i class="material-symbols-outlined">rate_review</i>
  查看審核
</button>
```

- [ ] **Step 4: 在 drawer-body 的 drawer-actions 之前加入兩個新 section**

找到 `<div class="drawer-actions">` 這行，在其之前加入：

```html
<!-- 指派 Agent -->
<div class="drawer-section">
  <div class="section-label">指派使用的 Agent</div>
  <div v-if="assignedAgents.length" class="agent-chips">
    <span v-for="agent in assignedAgents" :key="agent" class="agent-chip">
      <i class="material-symbols-outlined">smart_toy</i>{{ agent }}
    </span>
  </div>
  <div v-else class="no-agents-hint">尚未指派任何 Agent</div>
</div>

<!-- 操作記錄 -->
<div v-if="auditLog.length" class="drawer-section">
  <div class="section-label">操作記錄</div>
  <div class="audit-timeline">
    <div v-for="(rec, i) in auditLog" :key="i" class="audit-item">
      <div :class="['audit-dot', `audit-dot--${rec.action.toLowerCase()}`]"></div>
      <div class="audit-body">
        <span class="audit-action">{{ auditActionLabel(rec.action) }}</span>
        <span class="audit-meta">· {{ rec.by }} · {{ formatAuditDate(rec.time) }}</span>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 5: 在 `_SkillDetailDrawer.scss` 的 `.drawer-actions` 之前加入新樣式**

```scss
  .agent-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .agent-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    background: var(--page-bg);
    border: 1px solid var(--divider-a50);
    border-radius: 20px;
    font-size: 12px;
    color: var(--text-muted);
    .material-symbols-outlined { font-size: 14px; }
  }

  .no-agents-hint {
    font-size: 12px;
    color: var(--text-faint);
  }

  .audit-timeline {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .audit-item {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }

  .audit-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-top: 4px;
    flex-shrink: 0;
    &--enabled, &--upstream_merged { background: $color_main_1; }
    &--disabled { background: #dc2626; }
    &--upstream_ignored { background: #f59e0b; }
    &--upstream_detached { background: var(--text-faint); }
  }

  .audit-body {
    font-size: 12px;
    line-height: 1.5;
  }

  .audit-action { font-weight: 500; color: var(--text); }
  .audit-meta { color: var(--text-faint); margin-left: 4px; }
```

- [ ] **Step 6: 目視驗證**

訪問 `/view/Skills`，點擊「通用客服機器人」卡片，確認 Drawer 中：
1. 出現「指派使用的 Agent」section，顯示「通用助理」和「客服中心助理」chip
2. 出現「操作記錄」section，顯示 3 筆啟用/停用記錄
3. 出現藍色「查看審核」按鈕（因為有 reviewing 版本）

- [ ] **Step 7: Commit**

```bash
git add src/components/Skill/SkillDetailDrawer.vue src/scss/components/_SkillDetailDrawer.scss
git commit -m "feat(skill): add agent chips, audit log, and review button to SkillDetailDrawer"
```

---

## Task 5: SkillFilterBar.vue

**Files:**
- Create: `src/components/Skill/SkillFilterBar.vue`
- Create: `src/scss/components/_SkillFilterBar.scss`
- Modify: `src/scss/components/_index.scss`

**Interfaces:**
- Produces:
  ```ts
  export interface SkillFilterState {
    query: string
    type: 'all' | 'system' | 'extension'
    status: 'all' | 'enabled' | 'disabled'
    update: 'all' | 'has_update'
  }
  // Props: modelValue: SkillFilterState
  // Emits: 'update:modelValue': [SkillFilterState]
  ```

---

- [ ] **Step 1: 建立 `src/components/Skill/SkillFilterBar.vue`**

```vue
<template>
  <div class="SkillFilterBar">
    <div class="sfb-search">
      <i class="material-symbols-outlined">search</i>
      <input
        v-model="local.query"
        class="sfb-input"
        placeholder="搜尋技能名稱或描述"
        @input="sync"
      />
    </div>
    <select v-model="local.type" class="custom-select sfb-select" @change="sync">
      <option value="all">全部類型</option>
      <option value="system">系統技能</option>
      <option value="extension">企業擴充</option>
    </select>
    <select v-model="local.status" class="custom-select sfb-select" @change="sync">
      <option value="all">全部狀態</option>
      <option value="enabled">啟用中</option>
      <option value="disabled">已停用</option>
    </select>
    <select v-model="local.update" class="custom-select sfb-select" @change="sync">
      <option value="all">全部</option>
      <option value="has_update">有更新</option>
    </select>
    <button v-if="hasActiveFilter" class="custom-btn sfb-clear" @click="clearFilter">
      <i class="material-symbols-outlined">close</i>清除
    </button>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'

export interface SkillFilterState {
  query: string
  type: 'all' | 'system' | 'extension'
  status: 'all' | 'enabled' | 'disabled'
  update: 'all' | 'has_update'
}

const props = defineProps<{ modelValue: SkillFilterState }>()
const emit = defineEmits<{ 'update:modelValue': [SkillFilterState] }>()

const local = reactive<SkillFilterState>({ ...props.modelValue })

const hasActiveFilter = computed(() =>
  local.query !== '' || local.type !== 'all' || local.status !== 'all' || local.update !== 'all'
)

function sync() {
  emit('update:modelValue', { ...local })
}

function clearFilter() {
  Object.assign(local, { query: '', type: 'all', status: 'all', update: 'all' })
  sync()
}
</script>
```

- [ ] **Step 2: 建立 `src/scss/components/_SkillFilterBar.scss`**

```scss
.SkillFilterBar {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 14px;

  .sfb-search {
    flex: 1;
    min-width: 180px;
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--surface);
    border: 1px solid var(--divider-a50);
    border-radius: 8px;
    padding: 7px 12px;
    transition: border-color 0.15s;

    &:focus-within { border-color: $color_main_1; }

    .material-symbols-outlined { font-size: 18px; color: var(--text-faint); }

    .sfb-input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 13px;
      color: var(--text);
      outline: none;
      &::placeholder { color: var(--text-faint); }
    }
  }

  .sfb-select {
    font-size: 13px;
    padding: 7px 10px;
    height: auto;
  }

  .sfb-clear {
    font-size: 12px;
    padding: 6px 10px;
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--text-muted);
    .material-symbols-outlined { font-size: 16px; }
  }
}
```

- [ ] **Step 3: 在 `src/scss/components/_index.scss` 末尾加入**

```scss
@forward 'SkillFilterBar';
```

- [ ] **Step 4: Commit（元件先提交，下一個 Task 的 SkillManagement 整合會驗證效果）**

```bash
git add src/components/Skill/SkillFilterBar.vue src/scss/components/_SkillFilterBar.scss src/scss/components/_index.scss
git commit -m "feat(skill): add SkillFilterBar component with search and filter controls"
```

---

## Task 6: BatchUpdateModal.vue

**Files:**
- Create: `src/components/Skill/BatchUpdateModal.vue`
- Create: `src/scss/components/_BatchUpdateModal.scss`
- Modify: `src/scss/components/_index.scss`

**Interfaces:**
- Consumes: `store.pendingUpdateSkills`, `store.batchMergeUpstreamUpdates()` from Task 1
- Produces:
  ```ts
  // Props: modelValue: boolean
  // Emits: 'update:modelValue': [boolean], 'merged': [ids: string[]]
  ```

---

- [ ] **Step 1: 建立 `src/components/Skill/BatchUpdateModal.vue`**

```vue
<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="BatchUpdateModal" @click.self="emit('update:modelValue', false)">
        <div class="bum-dialog">
          <div class="bum-head">
            <h3>批量合併上游更新</h3>
            <button class="drawer-close-btn" @click="emit('update:modelValue', false)">
              <i class="material-symbols-outlined">close</i>
            </button>
          </div>

          <div class="bum-body">
            <p class="bum-hint">有衝突的技能需個別處理，批量合併時自動跳過。</p>
            <div class="bum-select-all">
              <label class="bum-row">
                <input type="checkbox" :checked="allSelected" :indeterminate="someSelected" @change="toggleAll" />
                全選（{{ nonConflict.length }} 個無衝突技能）
              </label>
            </div>
            <div class="bum-list">
              <div
                v-for="skill in store.pendingUpdateSkills"
                :key="skill.id"
                :class="['bum-item', !!skill.upstreamConflicts?.length && 'bum-item--conflict']"
              >
                <label class="bum-row">
                  <input
                    type="checkbox"
                    :checked="selected.has(skill.id)"
                    :disabled="!!skill.upstreamConflicts?.length"
                    @change="toggleItem(skill.id)"
                  />
                  <div class="bum-info">
                    <span class="bum-name">{{ skill.name }}</span>
                    <span class="bum-ver">v{{ skill.forkSourceVersion }} → v{{ skill.version }}</span>
                  </div>
                  <span v-if="skill.upstreamConflicts?.length" class="bum-badge bum-badge--warn">
                    <i class="material-symbols-outlined">warning</i>需確認衝突
                  </span>
                  <span v-else class="bum-badge bum-badge--ok">
                    <i class="material-symbols-outlined">check_circle</i>無衝突
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div class="bum-footer">
            <button class="custom-btn" @click="emit('update:modelValue', false)">取消</button>
            <button
              class="custom-btn custom-main-btn"
              :disabled="selected.size === 0"
              @click="handleMerge"
            >
              合併已選取（{{ selected.size }} 項）
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSkillStore } from '@/stores/skillStore'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [boolean]
  merged: [ids: string[]]
}>()

const store = useSkillStore()
const selected = ref(new Set<string>())

const nonConflict = computed(() =>
  store.pendingUpdateSkills.filter(s => !s.upstreamConflicts?.length)
)
const allSelected = computed(() =>
  nonConflict.value.length > 0 && nonConflict.value.every(s => selected.value.has(s.id))
)
const someSelected = computed(() =>
  nonConflict.value.some(s => selected.value.has(s.id)) && !allSelected.value
)

function toggleAll() {
  if (allSelected.value) {
    selected.value.clear()
  } else {
    nonConflict.value.forEach(s => selected.value.add(s.id))
  }
}

function toggleItem(id: string) {
  selected.value.has(id) ? selected.value.delete(id) : selected.value.add(id)
}

function handleMerge() {
  const merged = store.batchMergeUpstreamUpdates([...selected.value])
  emit('merged', merged)
  emit('update:modelValue', false)
  selected.value.clear()
}
</script>
```

- [ ] **Step 2: 建立 `src/scss/components/_BatchUpdateModal.scss`**

```scss
.BatchUpdateModal {
  position: fixed;
  inset: 0;
  z-index: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(9, 21, 26, 0.45);
  backdrop-filter: blur(4px);

  .bum-dialog {
    background: var(--surface);
    border-radius: 14px;
    width: 520px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    overflow: hidden;
  }

  .bum-head {
    padding: 18px 20px;
    border-bottom: 1px solid var(--divider-a50);
    display: flex;
    align-items: center;
    justify-content: space-between;
    h3 { font-size: 16px; font-weight: 600; }
  }

  .bum-body {
    padding: 16px 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .bum-hint { font-size: 13px; color: var(--text-muted); }

  .bum-select-all {
    padding: 10px 12px;
    background: var(--page-bg);
    border-radius: 8px;
  }

  .bum-row {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-size: 13px;
    input[type='checkbox'] { width: 16px; height: 16px; flex-shrink: 0; accent-color: $color_main_1; }
  }

  .bum-list { display: flex; flex-direction: column; gap: 4px; }

  .bum-item {
    padding: 10px 12px;
    border: 1px solid var(--divider-a50);
    border-radius: 8px;
    &--conflict { opacity: 0.6; }
  }

  .bum-info { flex: 1; }
  .bum-name { font-weight: 500; }
  .bum-ver { font-size: 12px; color: var(--text-faint); margin-left: 6px; }

  .bum-badge {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 5px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    .material-symbols-outlined { font-size: 14px; }
    &--warn { color: #92400e; background: #fffbeb; }
    &--ok { color: $color_main_2; }
  }

  .bum-footer {
    padding: 12px 20px;
    border-top: 1px solid var(--divider-a50);
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}
```

- [ ] **Step 3: 在 `src/scss/components/_index.scss` 末尾加入**

```scss
@forward 'BatchUpdateModal';
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Skill/BatchUpdateModal.vue src/scss/components/_BatchUpdateModal.scss src/scss/components/_index.scss
git commit -m "feat(skill): add BatchUpdateModal for bulk upstream merge"
```

---

## Task 7: ConflictResolveStep.vue + UpstreamUpdateDrawer 重構

**Files:**
- Create: `src/components/Skill/ConflictResolveStep.vue`
- Modify: `src/components/Skill/UpstreamUpdateDrawer.vue`

**Interfaces:**
- Consumes: `ConfirmModal` (Task 2), `ConflictItem`, `ConflictResolution` from Task 1
- Produces: `ConflictResolveStep` props: `conflicts: ConflictItem[]`; emits: `back`, `confirm: [ConflictResolution[]]`
- Modifies: `UpstreamUpdateDrawer` emit `merge` 新增 `resolutions?: ConflictResolution[]` 第二參數

---

- [ ] **Step 1: 建立 `src/components/Skill/ConflictResolveStep.vue`**

```vue
<template>
  <div class="ConflictResolveStep">
    <div class="crs-progress">
      衝突項目 {{ currentIdx + 1 }} / {{ conflicts.length }}
    </div>

    <div v-if="current" class="crs-conflict">
      <div class="crs-field-label">{{ current.label }}</div>
      <div class="crs-options">
        <label :class="['crs-option', resolutions[current.field] === 'mine' && 'is-selected']">
          <input type="radio" :value="'mine'" v-model="resolutions[current.field]" name="conflict" />
          <div class="crs-option-body">
            <div class="crs-option-tag">保留我的</div>
            <div class="crs-option-text">{{ current.mine }}</div>
          </div>
        </label>
        <label :class="['crs-option', resolutions[current.field] === 'upstream' && 'is-selected']">
          <input type="radio" :value="'upstream'" v-model="resolutions[current.field]" name="conflict" />
          <div class="crs-option-body">
            <div class="crs-option-tag crs-option-tag--upstream">採用上游的</div>
            <div class="crs-option-text">{{ current.upstream }}</div>
          </div>
        </label>
      </div>
    </div>

    <div class="crs-footer">
      <button class="custom-btn" @click="emit('back')">
        <i class="material-symbols-outlined">arrow_back</i>回到選項
      </button>
      <button
        class="custom-btn custom-main-btn"
        :disabled="!allResolved"
        @click="handleConfirm"
      >
        確認合併<i class="material-symbols-outlined">check</i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ConflictItem, ConflictResolution } from '@/stores/skillStore'

const props = defineProps<{ conflicts: ConflictItem[] }>()
const emit = defineEmits<{
  back: []
  confirm: [resolutions: ConflictResolution[]]
}>()

const currentIdx = ref(0)
const current = computed(() => props.conflicts[currentIdx.value] ?? null)
const resolutions = ref<Record<string, 'mine' | 'upstream'>>({})

const allResolved = computed(() =>
  props.conflicts.every(c => resolutions.value[c.field])
)

function handleConfirm() {
  const result: ConflictResolution[] = props.conflicts.map(c => ({
    field: c.field,
    choice: resolutions.value[c.field],
  }))
  emit('confirm', result)
}
</script>
```

- [ ] **Step 2: 在 UpstreamUpdateDrawer.vue 的 `<script setup>` 加入新的 imports 和 state**

在現有 `import type { Skill } from '@/stores/skillStore'` 行替換為：

```typescript
import { ref, watch } from 'vue'
import type { Skill, ConflictResolution } from '@/stores/skillStore'
import ConfirmModal from '@/components/ConfirmModal.vue'
import ConflictResolveStep from '@/components/Skill/ConflictResolveStep.vue'
```

在 `defineProps` 之後加入：

```typescript
const step = ref<'options' | 'resolve'>('options')
const showDetachConfirm = ref(false)

watch(() => props.skill, () => { step.value = 'options' })

function handleMergeClick() {
  if (!props.skill) return
  if (props.skill.upstreamConflicts?.length) {
    step.value = 'resolve'
  } else {
    emit('merge', props.skill)
  }
}

function handleConflictConfirm(resolutions: ConflictResolution[]) {
  if (!props.skill) return
  emit('merge', props.skill, resolutions)
  step.value = 'options'
}
```

修改 emits 中的 merge：
```typescript
const emit = defineEmits<{
  close: []
  merge: [skill: Skill, resolutions?: ConflictResolution[]]
  ignore: [skill: Skill]
  detach: [skill: Skill]
}>()
```

- [ ] **Step 3: 更新 UpstreamUpdateDrawer.vue 的 template**

在 `<div class="drawer-body">` 內，將整個 body 內容用 `<template v-if="step === 'options'">` 包起來，並在其後加入 resolve step：

找到 `<div class="drawer-body">` 之後的第一個子元素（通常是 `<div class="version-banner">`），在其之前加入：

```html
<template v-if="step === 'options'">
```

在最後一個 `</div>` 關閉 `option-cards` 之後、`</div>` 關閉 `drawer-body` 之前加入：

```html
</template>
<template v-else>
  <ConflictResolveStep
    :conflicts="skill!.upstreamConflicts ?? []"
    @back="step = 'options'"
    @confirm="handleConflictConfirm"
  />
</template>
```

找到「永久分離」option-card，將 `@click="emit('detach', skill!)"` 改為 `@click="showDetachConfirm = true"`。

找到「合併更新」option-card，將 `@click="emit('merge', skill!)"` 改為 `@click="handleMergeClick()"`.

在 `</Teleport>` 之前加入：

```html
<ConfirmModal
  v-model="showDetachConfirm"
  title="確認永久分離"
  message="此操作不可逆，分離後將不再收到上游更新通知，且無法重新關聯。確定要永久分離嗎？"
  confirm-label="永久分離"
  variant="danger"
  @confirm="emit('detach', skill!)"
/>
```

- [ ] **Step 4: 目視驗證**

訪問 `/view/Skills`，點「客服機器人（退貨版）」的「更新」按鈕，確認：
1. 點「合併更新」→ 切換至衝突解決畫面（顯示保留我的 / 採用上游的兩個選項）
2. 選擇後「確認合併」可點擊
3. 點「永久分離」→ 彈出紅色確認 Modal，點「永久分離」後執行

- [ ] **Step 5: Commit**

```bash
git add src/components/Skill/ConflictResolveStep.vue src/components/Skill/UpstreamUpdateDrawer.vue
git commit -m "feat(skill): add ConflictResolveStep and permanent detach confirmation modal"
```

---

## Task 8: Draft/Review SCSS + 路由接線

**Files:**
- Create: `src/scss/components/_DraftCard.scss`
- Create: `src/scss/components/_SkillReviewDrawer.scss`
- Create: `src/scss/components/_SkillVersionCompare.scss`
- Modify: `src/scss/components/_index.scss`
- Modify: `src/router/index.ts`

**Interfaces:**
- Produces: `/view/SkillEditor` 路由可訪問；三個既有元件有對應 SCSS

---

- [ ] **Step 1: 建立 `src/scss/components/_DraftCard.scss`**

```scss
.DraftCard {
  background: var(--surface);
  border: 1px dashed var(--divider-a50);
  border-radius: 12px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: box-shadow 0.2s;

  &:hover { box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06); }

  .draft-card-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--page-bg);
    border: 1px solid var(--divider-a50);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    .material-symbols-outlined { font-size: 20px; color: var(--text-faint); }
  }

  .draft-card-body { flex: 1; min-width: 0; }

  .draft-card-top {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 3px;
    flex-wrap: wrap;
  }

  .draft-card-name { font-size: 14px; font-weight: 600; color: var(--text); }
  .draft-card-hint { font-size: 11px; color: var(--text-faint); }

  .draft-card-desc {
    font-size: 12px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    &--auto { font-style: italic; color: var(--text-faint); }
  }

  .draft-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 5px;
  }

  .draft-completion {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .dc-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--divider-a50);
    &--done { background: $color_main_1; }
  }

  .dc-label { font-size: 11px; color: var(--text-faint); margin-left: 4px; }

  .draft-date { font-size: 11px; color: var(--text-faint); }

  .draft-card-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .dcard-btn {
    padding: 4px 10px;
    font-size: 12px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    .material-symbols-outlined { font-size: 15px; }

    &--submit {
      background: $color_main_1;
      border-color: $color_main_1;
      color: #fff;
      &:hover:not(:disabled) { background: $color_main_2; border-color: $color_main_2; }
      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }

    &--delete {
      color: #dc2626;
      border-color: #fecaca;
      &:hover { background: #fef2f2; }
    }
  }
}
```

- [ ] **Step 2: 建立 `src/scss/components/_SkillReviewDrawer.scss`**

```scss
.SkillReviewDrawer {
  position: fixed;
  inset: 0;
  z-index: 500;

  .srd-panel {
    position: absolute;
    top: 0;
    right: 0;
    width: 520px;
    height: 100vh;
    background: var(--surface);
    box-shadow: -8px 0 32px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    @media (max-width: 600px) { width: 100vw; }
  }

  .srd-head {
    padding: 18px 20px;
    border-bottom: 1px solid var(--divider-a50);
    display: flex;
    align-items: center;
    justify-content: space-between;
    h3 { font-size: 16px; font-weight: 600; }
  }

  .srd-body {
    padding: 20px;
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .srd-footer {
    padding: 14px 20px;
    border-top: 1px solid var(--divider-a50);
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }

  .srd-info {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    background: var(--page-bg);
    border-radius: 10px;
  }

  .srd-info-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: $color_main_4;
    color: $color_main_2;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    .material-symbols-outlined { font-size: 20px; }
  }

  .srd-skill-name { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
  .srd-meta-row { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }

  .srd-status-badge {
    font-size: 11px;
    color: #1e40af;
    background: #dbeafe;
    padding: 2px 8px;
    border-radius: 5px;
    font-weight: 500;
  }

  .srd-section {
    .srd-section-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-faint);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }
  }

  .srd-note-box {
    background: var(--page-bg);
    border-radius: 8px;
    padding: 12px 14px;
    display: flex;
    gap: 10px;
    font-size: 13px;
    color: var(--text-muted);
    border-left: 3px solid $color_main_1;
    .material-symbols-outlined { font-size: 18px; color: $color_main_1; flex-shrink: 0; }
  }

  .srd-summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .srd-summary-item {
    background: var(--page-bg);
    border-radius: 8px;
    padding: 10px 12px;
    &--full { grid-column: 1 / -1; }
  }

  .srd-summary-key { font-size: 11px; color: var(--text-faint); margin-bottom: 3px; }
  .srd-summary-val { font-size: 13px; color: var(--text); }

  .srd-timeline { display: flex; flex-direction: column; gap: 10px; }

  .srd-tl-item { display: flex; gap: 10px; align-items: flex-start; }

  .srd-tl-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-top: 3px;
    flex-shrink: 0;
    &.dot--submitted { background: $color_main_1; }
    &.dot--approved  { background: #16a34a; }
    &.dot--rejected  { background: #dc2626; }
    &.dot--withdrawn { background: var(--text-faint); }
  }

  .srd-tl-body { display: flex; gap: 6px; flex-wrap: wrap; font-size: 13px; align-items: baseline; }
  .srd-tl-action { font-weight: 600; }
  .srd-tl-by, .srd-tl-time { color: var(--text-faint); }

  .srd-tl-note {
    width: 100%;
    font-size: 12px;
    color: var(--text-muted);
    padding: 6px 10px;
    background: var(--page-bg);
    border-radius: 6px;
    margin-top: 2px;
  }

  .srd-feedback {
    width: 100%;
    font-size: 13px;
    border: 1px solid var(--divider-a50);
    border-radius: 8px;
    padding: 10px 12px;
    background: var(--surface);
    resize: vertical;
    min-height: 80px;
    color: var(--text);
    &:focus { outline: none; border-color: $color_main_1; }
  }
}
```

- [ ] **Step 3: 建立 `src/scss/components/_SkillVersionCompare.scss`**

```scss
.SkillVersionCompare {
  position: fixed;
  inset: 0;
  z-index: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(9, 21, 26, 0.45);
  backdrop-filter: blur(4px);

  .svc-dialog {
    background: var(--surface);
    border-radius: 14px;
    width: min(900px, 95vw);
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  }

  .svc-head {
    padding: 18px 20px;
    border-bottom: 1px solid var(--divider-a50);
    display: flex;
    align-items: center;
    justify-content: space-between;
    h3 { font-size: 16px; font-weight: 600; }
  }

  .svc-selectors {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--divider-a50);
  }

  .svc-select { font-size: 13px; }
  .svc-arrow { font-size: 20px; color: var(--text-faint); }

  .svc-legend-row {
    display: flex;
    gap: 12px;
    padding: 8px 20px;
    background: var(--page-bg);
    border-bottom: 1px solid var(--divider-a50);
  }

  .svc-legend {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 500;
    &--added   { background: #f0fdf4; color: #166534; }
    &--removed { background: #fef2f2; color: #991b1b; }
  }

  .svc-diff-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    flex: 1;
    overflow: hidden;
  }

  .svc-col {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-right: 1px solid var(--divider-a50);
    &:last-child { border-right: none; }
  }

  .svc-col-head {
    padding: 10px 14px;
    font-size: 13px;
    font-weight: 600;
    background: var(--page-bg);
    border-bottom: 1px solid var(--divider-a50);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .svc-status {
    font-size: 11px;
    padding: 2px 7px;
    border-radius: 4px;
    font-weight: 500;
    &--active    { background: #dcfce7; color: #166534; }
    &--reviewing { background: #dbeafe; color: #1e40af; }
    &--rejected  { background: #fee2e2; color: #991b1b; }
    &--draft     { background: #f3f4f6; color: #374151; }
    &--history   { background: var(--page-bg); color: var(--text-faint); }
  }

  .svc-col-body {
    padding: 14px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .svc-field { display: flex; flex-direction: column; gap: 4px; }
  .svc-field-label { font-size: 11px; color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.5px; }

  .svc-field-val {
    font-size: 13px;
    color: var(--text);
    &.is-added   { background: #f0fdf4; color: #166534; padding: 4px 6px; border-radius: 4px; }
    &.is-removed { background: #fef2f2; color: #991b1b; padding: 4px 6px; border-radius: 4px; }
  }

  .svc-caps { display: flex; flex-wrap: wrap; gap: 4px; }

  .svc-cap {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--page-bg);
    border: 1px solid var(--divider-a50);
    &.cap--added   { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }
    &.cap--removed { background: #fef2f2; color: #991b1b; border-color: #fecaca; }
  }

  .svc-field--instructions { flex: 1; }

  .svc-instructions-box {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    line-height: 1.7;
    padding: 10px;
    background: var(--page-bg);
    border-radius: 6px;
    overflow-y: auto;
    max-height: 280px;
  }

  .svc-line {
    padding: 1px 4px;
    border-radius: 2px;
    &.is-added   { background: #f0fdf4; color: #166534; }
    &.is-removed { background: #fef2f2; color: #991b1b; }
  }

  .svc-empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: var(--text-faint);
    font-size: 14px;
  }

  .svc-empty { color: var(--text-faint); font-style: italic; }
}
```

- [ ] **Step 4: 在 `src/scss/components/_index.scss` 末尾加入**

```scss
@forward 'DraftCard';
@forward 'SkillReviewDrawer';
@forward 'SkillVersionCompare';
```

- [ ] **Step 5: 在 `src/router/index.ts` 加入 SkillEditor 路由**

找到 `SkillTest` 路由定義之後，加入：

```typescript
      {
        path: '/view/SkillEditor',
        name: 'SkillEditor',
        component: () => import('@/views/SkillEditor.vue'),
        meta: { title: '技能編輯器', parentName: 'SkillManagement' },
      },
```

- [ ] **Step 6: 目視驗證**

直接訪問 `http://localhost:5173/view/SkillEditor`，確認頁面無 console error、麵包屑顯示「技能管理 > 技能編輯器」。

- [ ] **Step 7: Commit**

```bash
git add src/scss/components/_DraftCard.scss src/scss/components/_SkillReviewDrawer.scss \
        src/scss/components/_SkillVersionCompare.scss src/scss/components/_index.scss \
        src/router/index.ts
git commit -m "feat(skill): add SCSS for draft/review components and wire SkillEditor route"
```

---

## Task 9: SkillManagement.vue 大整合

**Files:**
- Modify: `src/views/SkillManagement.vue`
- Modify: `src/scss/views/_SkillManagement.scss`

**Interfaces:**
- Consumes: `SkillFilterBar` (Task 5), `BatchUpdateModal` (Task 6), `SkillReviewDrawer` (已建立), `DraftCard` (已建立), `store.drafts`, `store.pendingUpdateCount`, `store.pendingUpdateSkills`
- Consumes: `SkillDetailDrawer` emit `review` (Task 4)

---

- [ ] **Step 1: 完整改寫 `src/views/SkillManagement.vue`**

```vue
<template>
  <div class="SkillManagement views-page">
    <div class="views-page-content-box">

      <!-- Page Banner -->
      <div class="page-banner">
        <div>
          <AppBreadcrumb />
          <div class="banner-title">技能管理</div>
        </div>
      </div>

      <!-- Hero 統計列 -->
      <div class="skill-stats-row">
        <div class="skill-stat-card">
          <div class="skill-stat-icon icon--enabled">
            <i class="material-symbols-outlined">check_circle</i>
          </div>
          <div>
            <div class="skill-stat-num">{{ store.enabledCount }}</div>
            <div class="skill-stat-lbl">啟用中技能</div>
          </div>
        </div>
        <div class="skill-stat-card">
          <div class="skill-stat-icon icon--ext">
            <i class="material-symbols-outlined">extension</i>
          </div>
          <div>
            <div class="skill-stat-num">{{ store.extensionCount }}</div>
            <div class="skill-stat-lbl">企業擴充</div>
          </div>
        </div>
        <div class="skill-stat-card">
          <div class="skill-stat-icon icon--usage">
            <i class="material-symbols-outlined">bolt</i>
          </div>
          <div>
            <div class="skill-stat-num">{{ store.totalUsageCount }}</div>
            <div class="skill-stat-lbl">本月自動觸發</div>
          </div>
        </div>
        <div class="skill-stat-card">
          <div class="skill-stat-icon icon--pass">
            <i class="material-symbols-outlined">verified</i>
          </div>
          <div>
            <div class="skill-stat-num">{{ store.avgTestPassRate }}%</div>
            <div class="skill-stat-lbl">測試通過率</div>
          </div>
        </div>
      </div>

      <!-- 草稿區 -->
      <template v-if="store.drafts.length">
        <div class="skill-section-header">
          <h2>草稿（{{ store.drafts.length }}）</h2>
          <button class="custom-btn custom-main-btn" @click="router.push('/view/SkillEditor')">
            <i class="material-symbols-outlined">add</i>新增技能
          </button>
        </div>
        <div class="skill-draft-list">
          <DraftCard
            v-for="draft in store.drafts"
            :key="draft.id"
            :draft="draft"
            @view="router.push(`/view/SkillEditor?draftId=${draft.id}`)"
            @edit="router.push(`/view/SkillEditor?draftId=${draft.id}`)"
            @submit="store.submitDraft(draft.id)"
            @delete="store.deleteDraft(draft.id)"
          />
        </div>
      </template>

      <!-- 上游更新 Banner -->
      <div v-if="store.pendingUpdateCount > 0" class="upstream-banner">
        <span>
          <i class="material-symbols-outlined">upgrade</i>
          <strong>{{ store.pendingUpdateCount }} 個技能</strong>有上游更新可合併
        </span>
        <button class="custom-btn" @click="showBatchUpdate = true">查看全部</button>
      </div>

      <!-- 搜尋篩選 + 技能清單 Header -->
      <SkillFilterBar v-model="filterState" />

      <div class="skill-list-header">
        <h2>技能清單</h2>
        <button
          v-if="!store.drafts.length"
          class="custom-btn custom-main-btn"
          @click="router.push('/view/SkillEditor')"
        >
          <i class="material-symbols-outlined">add</i>新增技能
        </button>
      </div>

      <!-- 技能清單 -->
      <div class="skill-tree">
        <template v-for="skill in filteredSystemSkills" :key="skill.id">
          <div class="skill-group">
            <SkillCard
              :skill="skill"
              @click="detailSkill = $event"
              @test="handleTest"
              @toggle="store.toggleSkill($event.id)"
              @update="upstreamSkill = $event"
            />
            <template v-if="skill.children">
              <SkillCard
                v-for="child in filteredChildren(skill)"
                :key="child.id"
                :skill="child"
                :is-extension="true"
                @click="detailSkill = $event"
                @test="handleTest"
                @toggle="store.toggleSkill($event.id)"
                @update="upstreamSkill = $event"
              />
            </template>
          </div>
        </template>
        <SkillCard
          v-for="skill in filteredStandaloneExtensions"
          :key="skill.id"
          :skill="skill"
          :is-extension="true"
          @click="detailSkill = $event"
          @test="handleTest"
          @toggle="store.toggleSkill($event.id)"
          @update="upstreamSkill = $event"
        />
        <div v-if="noResults" class="skill-empty-state">
          <i class="material-symbols-outlined">search_off</i>
          <p>找不到符合篩選條件的技能</p>
        </div>
      </div>

    </div>

    <!-- Drawers & Modals -->
    <SkillDetailDrawer
      :skill="detailSkill"
      @close="detailSkill = null"
      @test="handleTest"
      @toggle="store.toggleSkill($event.id)"
      @review="handleReview"
    />
    <UpstreamUpdateDrawer
      :skill="upstreamSkill"
      @close="upstreamSkill = null"
      @merge="(s, r) => { store.mergeUpstreamUpdate(s.id, r); upstreamSkill = null }"
      @ignore="(s) => { store.ignoreUpstreamUpdate(s.id); upstreamSkill = null }"
      @detach="(s) => { store.detachUpstream(s.id); upstreamSkill = null }"
    />
    <BatchUpdateModal
      v-model="showBatchUpdate"
      @merged="showBatchUpdate = false"
    />
    <SkillReviewDrawer
      v-model="showReviewDrawer"
      :skill-id="reviewSkillId ?? ''"
      @approved="showReviewDrawer = false"
      @rejected="showReviewDrawer = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import SkillCard from '@/components/Skill/SkillCard.vue'
import SkillDetailDrawer from '@/components/Skill/SkillDetailDrawer.vue'
import UpstreamUpdateDrawer from '@/components/Skill/UpstreamUpdateDrawer.vue'
import BatchUpdateModal from '@/components/Skill/BatchUpdateModal.vue'
import SkillFilterBar from '@/components/Skill/SkillFilterBar.vue'
import DraftCard from '@/components/Skill/DraftCard.vue'
import SkillReviewDrawer from '@/components/Skill/SkillReviewDrawer.vue'
import { useSkillStore } from '@/stores/skillStore'
import type { Skill, SkillFilterState } from '@/stores/skillStore'

// Note: SkillFilterState 需從 SkillFilterBar.vue export，或移至 skillStore.ts
// 若 SkillFilterBar 未 export，可在此 inline 定義
type FilterState = {
  query: string
  type: 'all' | 'system' | 'extension'
  status: 'all' | 'enabled' | 'disabled'
  update: 'all' | 'has_update'
}

const router = useRouter()
const store = useSkillStore()

const detailSkill = ref<Skill | null>(null)
const upstreamSkill = ref<Skill | null>(null)
const showBatchUpdate = ref(false)
const showReviewDrawer = ref(false)
const reviewSkillId = ref<string | null>(null)
const filterState = ref<FilterState>({ query: '', type: 'all', status: 'all', update: 'all' })

function matchesFilter(skill: Skill): boolean {
  const f = filterState.value
  const q = f.query.toLowerCase()
  if (q && !skill.name.toLowerCase().includes(q) && !skill.description.toLowerCase().includes(q)) return false
  if (f.type === 'system' && skill.type !== 'system') return false
  if (f.type === 'extension' && skill.type !== 'extension') return false
  if (f.status === 'enabled' && !skill.isEnabled) return false
  if (f.status === 'disabled' && skill.isEnabled) return false
  if (f.update === 'has_update' && skill.upstreamUpdateStatus !== 'update_available') return false
  return true
}

const filteredSystemSkills = computed(() =>
  store.skills
    .filter(s => s.type === 'system')
    .filter(s => matchesFilter(s) || s.children?.some(c => matchesFilter(c)))
)

function filteredChildren(skill: Skill): Skill[] {
  return skill.children?.filter(c => matchesFilter(c)) ?? []
}

const filteredStandaloneExtensions = computed(() =>
  store.skills.filter(s => s.type === 'extension' && matchesFilter(s))
)

const noResults = computed(() =>
  filteredSystemSkills.value.length === 0 && filteredStandaloneExtensions.value.length === 0
)

function handleTest(skill: Skill) {
  router.push({ path: '/view/SkillTest', query: { skillId: skill.id } })
}

function handleReview(skill: Skill) {
  reviewSkillId.value = skill.id
  detailSkill.value = null
  showReviewDrawer.value = true
}
</script>
```

**注意：** `SkillFilterState` import 路徑改為從 `SkillFilterBar.vue` 引用（`import type { SkillFilterState } from '@/components/Skill/SkillFilterBar.vue'`），或在 SkillFilterBar.vue 中直接 export 此型別（已在 Task 5 的程式碼中 export）。將 Step 1 中的 `type FilterState` 替換為實際 import。

- [ ] **Step 2: 在 `_SkillManagement.scss` 加入草稿區和空狀態樣式**

在現有 `.SkillManagement` 規則內、`.skill-stats-row` 之後加入：

```scss
  .skill-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 16px 0 10px;
    h2 { font-size: 16px; font-weight: 600; }
  }

  .skill-draft-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
  }

  .skill-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 20px;
    color: var(--text-faint);
    gap: 8px;
    .material-symbols-outlined { font-size: 36px; }
    p { font-size: 14px; }
  }
```

- [ ] **Step 3: 目視驗證（完整清單）**

訪問 `/view/Skills`，依序確認：
1. 草稿區顯示「訂單追蹤助理」DraftCard
2. 上游更新 Banner 顯示「1 個技能有上游更新可合併」
3. FilterBar 出現在 Banner 下方
4. 輸入「客服」→ 清單即時縮減為客服相關技能
5. 點「查看全部」→ BatchUpdateModal 出現，無衝突技能可勾選
6. 點通用客服機器人卡片 → SkillDetailDrawer 出現「查看審核」按鈕
7. 點「查看審核」→ SkillReviewDrawer 從右側滑入，顯示版本資訊
8. 點「通過並發布」→ Drawer 關閉，卡片上的「審核中」badge 消失

- [ ] **Step 4: Commit**

```bash
git add src/views/SkillManagement.vue src/scss/views/_SkillManagement.scss
git commit -m "feat(skill): integrate draft section, filter bar, batch update, and review workflow into SkillManagement"
```

---

## Task 10: SkillTestAI 測試歷史

**Files:**
- Modify: `src/components/Skill/SkillTestAI.vue`

**Interfaces:**
- Consumes: `store.saveTestRun()`, `store.getTestRunHistory()` from Task 1
- The `aiTestReport` 整體報告 computed 應在 SkillTestAI 中已存在

---

- [ ] **Step 1: 在 SkillTestAI.vue 的 `<script setup>` 中加入歷史相關 state 和 computed**

找到現有的 `import` 區塊，確認引入了 `useSkillStore` 和必要的 vue composable。

加入（若尚未有）：

```typescript
import { ref, computed } from 'vue'
import { useSkillStore } from '@/stores/skillStore'

const store = useSkillStore()
// 假設元件已有 props: { skillId: string }，以及 aiTestReport computed

const showHistory = ref(false)
const testHistory = computed(() => store.getTestRunHistory(props.skillId))

function formatHistoryDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}
```

- [ ] **Step 2: 在 `computeAITestReport()` 呼叫後加入 saveTestRun**

找到 `computeAITestReport()` 被呼叫的地方（通常在 `runAllAITests` 或 `runSingleAITest` 完成後），在其後加入：

```typescript
if (store.aiTestReport) {
  store.saveTestRun(props.skillId, {
    total: store.aiTestReport.total,
    passed: store.aiTestReport.passed,
  })
}
```

- [ ] **Step 3: 在 template 的報告卡片（整體報告 section）下方加入歷史折疊區塊**

找到整體報告卡片的結尾（`</div>` 關閉報告卡片），在其後加入：

```html
<!-- 過往記錄 -->
<div v-if="testHistory.length" class="ai-history">
  <button class="ai-history-toggle" @click="showHistory = !showHistory">
    <i class="material-symbols-outlined">{{ showHistory ? 'expand_less' : 'expand_more' }}</i>
    過往記錄（{{ testHistory.length }} 筆）
  </button>
  <div v-if="showHistory" class="ai-history-list">
    <div v-for="run in testHistory" :key="run.id" class="ai-history-item">
      <span class="ai-history-date">{{ formatHistoryDate(run.date) }}</span>
      <span class="ai-history-rate">通過率 {{ Math.round(run.passRate * 100) }}%</span>
      <span class="ai-history-detail">（{{ run.passed }}/{{ run.total }}）</span>
    </div>
  </div>
</div>
```

- [ ] **Step 4: 在 SkillTestAI 對應的 SCSS 檔（`_SkillTestAI.scss` 或 `_SkillTest.scss`）中加入樣式**

找到 AI test 相關的 SCSS 檔案，加入：

```scss
.ai-history {
  margin-top: 8px;
  border: 1px solid var(--divider-a50);
  border-radius: 10px;
  overflow: hidden;
}

.ai-history-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: var(--page-bg);
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-muted);
  text-align: left;
  &:hover { color: var(--text); }
  .material-symbols-outlined { font-size: 18px; }
}

.ai-history-list {
  padding: 8px 14px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ai-history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.ai-history-date { color: var(--text-muted); }
.ai-history-rate { font-weight: 600; color: var(--text); }
.ai-history-detail { color: var(--text-faint); }
```

- [ ] **Step 5: 目視驗證**

訪問 `/view/SkillTest`，選擇任一技能，切換至「AI 快速測試」Tab：
1. 點「生成測試情境」→「全部執行」
2. 所有情境執行完畢後，整體報告出現
3. 報告下方出現「過往記錄」折疊列，點擊展開顯示當前一筆記錄
4. 重新執行一次，記錄變為 2 筆

- [ ] **Step 6: Commit**

```bash
git add src/components/Skill/SkillTestAI.vue
git commit -m "feat(skill): save test run history and show collapsible history panel in SkillTestAI"
```

---

## Self-Review 對照表

| Spec 需求 | 對應 Task |
|----------|----------|
| TG1: 型別擴充、mock 資料、14 個新 action | Task 1 |
| TG2: ConfirmModal | Task 2 |
| TG2: SkillCard reviewing badge | Task 3 |
| TG2: SkillDetailDrawer agent chips + 稽核記錄 + review 按鈕 | Task 4 |
| TG3: SkillFilterBar | Task 5 |
| TG4: BatchUpdateModal + pendingUpdateCount | Task 6 |
| TG5: ConflictResolveStep + UpstreamUpdateDrawer 重構 | Task 7 |
| TG6: DraftCard/SkillReviewDrawer SCSS + 路由 | Task 8 |
| TG6: SkillManagement 草稿區 + FilterBar + 批量更新 Banner + 審核入口 | Task 9 |
| TG7: 稽核記錄寫入（toggleSkill 等） | Task 1（Step 8） |
| TG8: 測試歷史紀錄 | Task 10 |
