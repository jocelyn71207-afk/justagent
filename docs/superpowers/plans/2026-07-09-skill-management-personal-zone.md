# 技能管理個人區整合 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重構技能管理頁面，整合「我的技能」個人區與 Library 技能為單頁呈現，並強制 Library 技能不可停用/刪除。

**Architecture:** 分四個獨立任務：(1) store 型別與 mock 資料，(2) PersonalSkillCard 元件，(3) SkillCard/SkillDetailDrawer 限制，(4) SkillManagement.vue 頁面重構。每個任務都可獨立 build + test。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Pinia（composition style）、SCSS（`@import` convention）、Vitest、Material Symbols Outlined icons

## Global Constraints

- 所有元件使用 `<script setup lang="ts">`，禁止 Options API
- 樣式在 `src/scss/` 管理，禁止 `<style scoped>`
- 新增 SCSS 檔案需在 `src/scss/components/_index.scss` 手動加 `@import`
- 所有 import 使用 `@/` alias
- 顏色使用 CSS Custom Properties 或 SCSS 變數，不寫死 hex
- Material Symbols Outlined icon font 已全域載入
- 個人技能 `zone: 'personal'`；Library 技能 `zone` 為 undefined 或 `'library'`
- Status badge classes: `tag--available`（綠）、`tag--reviewing`（警告黃）、`tag--has-library`（ai 藍）
- 按鈕 class 規範：主要按鈕 `custom-btn custom-main-btn`，次要 `custom-btn`，危險 `custom-btn btn--danger-ghost`

---

### Task 1: skillStore — PersonalSkill 型別、mock 資料、actions

**Files:**
- Modify: `src/stores/skillStore.ts`
- Modify: `src/stores/__tests__/skillStore.test.ts`

**Interfaces:**
- Produces（供 Task 2、3、4 使用）：
  - `Skill` 新欄位：`zone?: 'personal' | 'library'`、`personalStatus?: 'available' | 'reviewing' | 'has_library'`、`derivedFrom?: string`、`hasLibraryUpdate?: boolean`、`submitNote?: string`、`submitMode?: 'version_update' | 'new_skill'`
  - store 新 export：`myPersonalSkills: ComputedRef<Skill[]>`（只含未刪除的個人技能）
  - 新 actions：`submitPersonalSkill(id, mode, note)`、`deletePersonalSkill(id)`

- [ ] **Step 1: 在 `Skill` interface 加入個人技能欄位**

在 `src/stores/skillStore.ts` 的 `Skill` interface（目前第 74 行）加入以下欄位：

```ts
export interface Skill {
  // ... 現有欄位不動 ...
  zone?: 'personal' | 'library'
  personalStatus?: 'available' | 'reviewing' | 'has_library'
  derivedFrom?: string
  hasLibraryUpdate?: boolean
  submitNote?: string
  submitMode?: 'version_update' | 'new_skill'
}
```

- [ ] **Step 2: 確認型別變更不影響現有 build**

```bash
cd /Users/jocelyn/Desktop/規劃/demosite
npm run type-check
```

Expected: 無 error（新欄位都是 optional）

- [ ] **Step 3: 加入 MOCK_PERSONAL_SKILLS 常數**

在 `MOCK_DRAFTS` 常數定義之前（約第 566 行）加入：

```ts
const MOCK_PERSONAL_SKILLS: Skill[] = [
  {
    id: 'personal-001',
    name: '週報自動生成',
    description: '根據本週的會議記錄、任務清單，自動整理生成週報摘要',
    type: 'extension',
    origin: 'manually_created',
    zone: 'personal',
    personalStatus: 'available',
    derivedFrom: 'sys-meeting-001',
    hasLibraryUpdate: false,
    version: '1.0.0',
    isEnabled: true,
    usageCount: 0,
    testPassRate: 0,
    avgLatencyMs: 0,
    instructions: '你是一個週報助理，協助使用者根據本週資料自動生成結構化週報。',
  },
  {
    id: 'personal-002',
    name: '客服對話品質評估',
    description: '自動分析客服對話品質，評估回答準確度與客戶滿意度',
    type: 'extension',
    origin: 'manually_created',
    zone: 'personal',
    personalStatus: 'reviewing',
    derivedFrom: 'sys-cs-001',
    hasLibraryUpdate: true,
    version: '1.0.0',
    isEnabled: true,
    usageCount: 0,
    testPassRate: 0,
    avgLatencyMs: 0,
    instructions: '你是客服品質評估助理，分析客服對話品質。',
  },
  {
    id: 'personal-003',
    name: 'ERP 報表彙整',
    description: '整合 ERP 系統數據，自動生成週期性報表',
    type: 'extension',
    origin: 'manually_created',
    zone: 'personal',
    personalStatus: 'has_library',
    version: '1.0.0',
    isEnabled: false,
    usageCount: 0,
    testPassRate: 0,
    avgLatencyMs: 0,
    instructions: '你是 ERP 報表助理，整合多系統數據生成週期性報表。',
  },
]
```

- [ ] **Step 4: 加入 `myPersonalSkills` ref 與 computed**

在 `useSkillStore` 函式內，`myDrafts` ref 宣告之後（約第 600 行）加入：

```ts
const myPersonalSkillsRef = ref<Skill[]>(JSON.parse(JSON.stringify(MOCK_PERSONAL_SKILLS)))

const myPersonalSkills = computed<Skill[]>(() =>
  myPersonalSkillsRef.value.filter(s => !s.deletedAt)
)
```

- [ ] **Step 5: 更新 `findSkill` 以包含個人技能**

找到 `function findSkill` 定義（約第 665 行），在 Library 查找之後、draft fallback 之前加入個人技能查找：

```ts
function findSkill(id: string): Skill | undefined {
  const library = flatSkills.value.find(s => s.id === id)
  if (library) return library
  const personal = myPersonalSkillsRef.value.find(s => s.id === id)
  if (personal) return personal
  // draft fallback（保留至草稿清理任務）
  const draft = myDrafts.value.find(d => d.id === id)
  if (!draft) return undefined
  return {
    id: draft.id,
    name: draft.name || '未命名草稿',
    description: draft.description,
    type: draft.type,
    origin: 'manually_created',
    version: '草稿',
    isEnabled: false,
    usageCount: 0,
    testPassRate: 0,
    avgLatencyMs: 0,
    instructions: draft.instructions,
    triggerHint: draft.triggerHint,
    assignedAgents: draft.assignedAgents,
    forkSourceId: draft.forkSourceId,
  }
}
```

- [ ] **Step 6: 加入 `submitPersonalSkill` 和 `deletePersonalSkill` actions**

在 `deleteDraft` 函式之後加入：

```ts
function submitPersonalSkill(
  id: string,
  mode: 'new_skill' | 'version_update',
  note: string
): void {
  const skill = myPersonalSkillsRef.value.find(s => s.id === id)
  if (!skill) return
  skill.personalStatus = 'reviewing'
  skill.submitNote = note
  skill.submitMode = mode
}

function deletePersonalSkill(id: string): void {
  const idx = myPersonalSkillsRef.value.findIndex(s => s.id === id)
  if (idx !== -1) myPersonalSkillsRef.value.splice(idx, 1)
}
```

- [ ] **Step 7: 加入新 export 到 store return 物件**

在 `return { ... }` 內加入（在 `myDrafts` 附近）：

```ts
myPersonalSkills,
submitPersonalSkill,
deletePersonalSkill,
```

- [ ] **Step 8: 寫失敗測試**

在 `src/stores/__tests__/skillStore.test.ts` 末尾加入新 describe 區塊：

```ts
describe('PersonalSkill', () => {
  it('myPersonalSkills 初始有 3 筆且都是 zone:personal', () => {
    const store = useSkillStore()
    expect(store.myPersonalSkills.length).toBe(3)
    store.myPersonalSkills.forEach(s => expect(s.zone).toBe('personal'))
  })

  it('submitPersonalSkill 將 personalStatus 設為 reviewing 並記錄 note 和 mode', () => {
    const store = useSkillStore()
    const skill = store.myPersonalSkills[0]
    expect(skill.personalStatus).toBe('available')
    store.submitPersonalSkill(skill.id, 'new_skill', '測試說明')
    expect(store.myPersonalSkills[0].personalStatus).toBe('reviewing')
    expect(store.myPersonalSkills[0].submitNote).toBe('測試說明')
    expect(store.myPersonalSkills[0].submitMode).toBe('new_skill')
  })

  it('submitPersonalSkill 對不存在 id 不報錯', () => {
    const store = useSkillStore()
    expect(() => store.submitPersonalSkill('nonexistent', 'new_skill', '')).not.toThrow()
  })

  it('deletePersonalSkill 從列表中移除', () => {
    const store = useSkillStore()
    const before = store.myPersonalSkills.length
    store.deletePersonalSkill(store.myPersonalSkills[0].id)
    expect(store.myPersonalSkills.length).toBe(before - 1)
  })

  it('findSkill 可找到個人技能', () => {
    const store = useSkillStore()
    const result = store.findSkill('personal-001')
    expect(result).toBeDefined()
    expect(result?.zone).toBe('personal')
  })
})
```

- [ ] **Step 9: 確認測試失敗**

```bash
npm run test:unit -- --run src/stores/__tests__/skillStore.test.ts
```

Expected: 新加的 PersonalSkill describe 顯示 FAIL（因 myPersonalSkills 等尚未 implement）

（實際上在 Step 4-7 已實作，這步是確認之前的舊測試不受影響）

- [ ] **Step 10: 執行全部測試確認通過**

```bash
npm run test:unit -- --run
```

Expected: 全部 pass（新測試通過，舊測試不受影響）

- [ ] **Step 11: Commit**

```bash
git add src/stores/skillStore.ts src/stores/__tests__/skillStore.test.ts
git commit -m "feat(skill): add PersonalSkill type, mock data, and store actions"
```

---

### Task 2: PersonalSkillCard 元件 + SCSS

**Files:**
- Create: `src/components/Skill/PersonalSkillCard.vue`
- Create: `src/scss/components/_PersonalSkillCard.scss`
- Modify: `src/scss/components/_index.scss`

**Interfaces:**
- Consumes（來自 Task 1）：`Skill`（含 `zone`、`personalStatus`、`derivedFrom`、`hasLibraryUpdate`）、`store.flatSkills`（查 derivedFromName）、`store.myPersonalSkills`（不直接用，但 store 已有）
- Produces（供 Task 4 使用）：`PersonalSkillCard` 元件，emits：`view(skill: Skill)`、`submit(skill: Skill)`

- [ ] **Step 1: 建立 `PersonalSkillCard.vue`**

建立 `src/components/Skill/PersonalSkillCard.vue`：

```vue
<template>
  <div class="PersonalSkillCard" @click="emit('view', skill)">
    <div class="psc-icon">
      <i class="material-symbols-outlined">person</i>
    </div>

    <div class="psc-body">
      <div class="psc-name-row">
        <span class="psc-name">{{ skill.name }}</span>
        <span :class="['skill-tag', statusTagClass]">{{ statusLabel }}</span>
      </div>
      <div class="psc-desc">{{ skill.description }}</div>
      <div v-if="derivedFromName || skill.hasLibraryUpdate" class="psc-meta">
        <span v-if="derivedFromName" class="psc-source">
          <i class="material-symbols-outlined">link</i>來源：{{ derivedFromName }}
        </span>
        <span v-if="skill.hasLibraryUpdate" class="psc-update-hint">
          <i class="material-symbols-outlined">warning</i>有更新
        </span>
      </div>
    </div>

    <div class="psc-actions" @click.stop>
      <button class="custom-btn psc-btn" @click="emit('view', skill)">
        <i class="material-symbols-outlined">open_in_new</i>查看詳情
      </button>
      <button
        :class="['custom-btn', 'psc-btn', canSubmit ? 'custom-main-btn' : '']"
        :disabled="!canSubmit"
        @click="emit('submit', skill)"
      >
        <i class="material-symbols-outlined">send</i>{{ submitLabel }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Skill } from '@/stores/skillStore'
import { useSkillStore } from '@/stores/skillStore'

const props = defineProps<{ skill: Skill }>()
const emit = defineEmits<{
  view: [skill: Skill]
  submit: [skill: Skill]
}>()

const store = useSkillStore()

const statusLabel = computed(() => {
  if (props.skill.personalStatus === 'reviewing') return '審核中'
  if (props.skill.personalStatus === 'has_library') return '已有Library版'
  return '可使用'
})

const statusTagClass = computed(() => {
  if (props.skill.personalStatus === 'reviewing') return 'tag--reviewing'
  if (props.skill.personalStatus === 'has_library') return 'tag--has-library'
  return 'tag--available'
})

const canSubmit = computed(() => props.skill.personalStatus !== 'reviewing')

const submitLabel = computed(() =>
  props.skill.personalStatus === 'has_library' ? '再次送審' : '送審'
)

const derivedFromName = computed(() => {
  if (!props.skill.derivedFrom) return null
  return store.flatSkills.find(s => s.id === props.skill.derivedFrom)?.name ?? null
})
</script>
```

- [ ] **Step 2: 建立 `_PersonalSkillCard.scss`**

建立 `src/scss/components/_PersonalSkillCard.scss`：

```scss
.PersonalSkillCard {
  background: var(--surface);
  border: 1px solid var(--divider-a50);
  border-radius: 14px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: box-shadow 0.2s, border-color 0.2s;

  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border-color: $color_main_3;
  }

  .psc-icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: $color-badge-ai-bg;
    color: $color-badge-ai-text;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    .material-symbols-outlined { font-size: 24px; }
  }

  .psc-body {
    flex: 1;
    min-width: 0;
  }

  .psc-name-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 4px;
  }

  .psc-name {
    font-size: 15px;
    font-weight: 700;
    color: var(--text);
  }

  .psc-desc {
    font-size: 12.5px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 520px;
    margin-bottom: 6px;
  }

  .psc-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 11.5px;
  }

  .psc-source {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    color: var(--text-faint);
    .material-symbols-outlined { font-size: 13px; }
  }

  .psc-update-hint {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    color: $color-warning-amber;
    font-weight: 600;
    .material-symbols-outlined { font-size: 13px; }
  }

  .psc-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .psc-btn {
    padding: 4px 12px;
    font-size: 12px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    .material-symbols-outlined { font-size: 14px; }
  }
}

// 個人技能 status tag 樣式（掛在全域 .skill-tag 下）
.skill-tag {
  &.tag--available {
    background: $color_main_5;
    color: $color_main_1;
    border: 1px solid $color_main_3;
  }

  &.tag--has-library {
    background: $color-badge-ai-bg;
    color: $color-badge-ai-text;
    border: 1px solid rgba($color-badge-ai-text, 0.4);
  }
}
```

- [ ] **Step 3: 在 `_index.scss` 加入 import**

在 `src/scss/components/_index.scss` 末尾加入：

```scss
@import './PersonalSkillCard';
```

- [ ] **Step 4: type-check 確認**

```bash
npm run type-check
```

Expected: 無 error

- [ ] **Step 5: build 確認**

```bash
npm run build 2>&1 | tail -5
```

Expected: 無 error

- [ ] **Step 6: Commit**

```bash
git add src/components/Skill/PersonalSkillCard.vue src/scss/components/_PersonalSkillCard.scss src/scss/components/_index.scss
git commit -m "feat(skill): add PersonalSkillCard component and styles"
```

---

### Task 3: SkillCard toggle 移除 + SkillDetailDrawer 限制

**Files:**
- Modify: `src/components/Skill/SkillCard.vue`
- Modify: `src/components/Skill/SkillDetailDrawer.vue`

**Interfaces:**
- Consumes（來自 Task 1）：`Skill.zone`（用於 SkillDetailDrawer 判斷 isPersonal）
- Note: SkillCard 用於 Library section，toggle 直接移除；SkillDetailDrawer 供 Library 和個人技能共用

- [ ] **Step 1: 寫測試確認現有 toggle 行為**

在 `src/stores/__tests__/skillStore.test.ts` 的末尾加入（確認 Library skill 不能被 SkillManagement 頁面 toggle 後依然有 isEnabled 欄位，此 test 為確認型，不測 UI）：

```ts
describe('Library skill 欄位', () => {
  it('Library skill 有 isEnabled 欄位但 zone 不為 personal', () => {
    const store = useSkillStore()
    const libSkill = store.flatSkills[0]
    expect(libSkill.zone).not.toBe('personal')
    expect(typeof libSkill.isEnabled).toBe('boolean')
  })
})
```

```bash
npm run test:unit -- --run src/stores/__tests__/skillStore.test.ts
```

Expected: PASS

- [ ] **Step 2: 移除 SkillCard 的 toggle 按鈕和 emit**

開啟 `src/components/Skill/SkillCard.vue`。

**移除**以下程式碼（約第 55-59 行的停用/啟用按鈕）：

```html
<button
  :class="['custom-btn', 'skill-action-btn', 'btn--danger-ghost']"
  @click="emit('toggle', skill)"
>
  {{ skill.isEnabled ? '停用' : '啟用' }}
</button>
```

**同時移除** `emit` 定義中的 `toggle: [skill: Skill]`（在 `<script setup>` 的 `defineEmits` 中）：

```ts
// 從這裡移除 toggle: [skill: Skill]
const emit = defineEmits<{
  click: [skill: Skill]
  test: [skill: Skill]
  // toggle: [skill: Skill]  ← 刪除此行
  duplicate: [skill: Skill]
}>()
```

- [ ] **Step 3: 確認 SkillCard type-check**

```bash
npm run type-check
```

若有 error，代表某處仍綁定 `@toggle` 到 SkillCard；找到並移除。

- [ ] **Step 4: 在 SkillDetailDrawer 加入 `isPersonal` computed 並限制 toggle/delete**

開啟 `src/components/Skill/SkillDetailDrawer.vue`。

在 `<script setup>` 區塊，`const showConfirm = ref(false)` 之後加入：

```ts
const isPersonal = computed(() => props.skill?.zone === 'personal')
```

找到 toggle 按鈕所在的 `.dm-toggle` div（約第 60-68 行）：

```html
<div class="dm-toggle">
  <button
    class="custom-btn dm-toggle-btn btn--danger-ghost"
    @click="emit('toggle', skill!)"
  >
    {{ skill.isEnabled ? '停用' : '啟用技能' }}
  </button>
</div>
```

改為：

```html
<div v-if="isPersonal" class="dm-toggle">
  <button
    class="custom-btn dm-toggle-btn btn--danger-ghost"
    @click="emit('toggle', skill!)"
  >
    {{ skill.isEnabled ? '停用' : '啟用技能' }}
  </button>
</div>
```

找到危險操作區塊（約第 248 行）：

```html
<div v-if="skill.type === 'extension'" class="drawer-danger-zone">
```

改為：

```html
<div v-if="isPersonal" class="drawer-danger-zone">
```

- [ ] **Step 5: type-check 確認**

```bash
npm run type-check
```

Expected: 無 error

- [ ] **Step 6: 執行測試確認不影響現有測試**

```bash
npm run test:unit -- --run
```

Expected: 全部 pass

- [ ] **Step 7: Commit**

```bash
git add src/components/Skill/SkillCard.vue src/components/Skill/SkillDetailDrawer.vue src/stores/__tests__/skillStore.test.ts
git commit -m "feat(skill): remove Library skill toggle, restrict drawer delete/toggle to personal skills"
```

---

### Task 4: SkillManagement.vue 重構

**Files:**
- Modify: `src/views/SkillManagement.vue`
- Modify: `src/scss/views/_SkillManagement.scss`

**Interfaces:**
- Consumes（來自 Task 1）：`store.myPersonalSkills`、`store.submitPersonalSkill`、`store.deletePersonalSkill`、`store.toggleSkill`
- Consumes（來自 Task 2）：`PersonalSkillCard`（emit: view, submit）
- Consumes（來自 Task 3）：`SkillCard`（無 toggle emit）、`SkillDetailDrawer`（個人技能才顯示 toggle/delete）

- [ ] **Step 1: 寫一個 store 整合確認測試（預期通過）**

在 `src/stores/__tests__/skillStore.test.ts` 末尾加入：

```ts
describe('SkillManagement 頁面整合', () => {
  it('myPersonalSkills 與 flatSkills 無 id 交集', () => {
    const store = useSkillStore()
    const libraryIds = new Set(store.flatSkills.map(s => s.id))
    store.myPersonalSkills.forEach(s => {
      expect(libraryIds.has(s.id)).toBe(false)
    })
  })
})
```

```bash
npm run test:unit -- --run src/stores/__tests__/skillStore.test.ts
```

Expected: PASS

- [ ] **Step 2: 改寫 `SkillManagement.vue` 的 `<template>`**

完整替換 `src/views/SkillManagement.vue` 的 `<template>` 內容為：

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
        <div class="page-banner-actions">
          <button class="custom-btn custom-main-btn" @click="router.push('/view/SkillEditor')">
            <i class="material-symbols-outlined">add</i>建立技能
          </button>
        </div>
      </div>

      <!-- Hero 統計列 -->
      <div class="skill-stats-row">
        <div class="skill-stat-card">
          <div class="skill-stat-icon icon--enabled">
            <i class="material-symbols-outlined">check_circle</i>
          </div>
          <div class="skill-stat-body">
            <div class="skill-stat-num">{{ store.enabledCount }}</div>
            <div class="skill-stat-lbl">啟用中技能</div>
          </div>
        </div>
        <div class="skill-stat-card">
          <div class="skill-stat-icon icon--ext">
            <i class="material-symbols-outlined">extension</i>
          </div>
          <div class="skill-stat-body">
            <div class="skill-stat-num">{{ store.extensionCount }}</div>
            <div class="skill-stat-lbl">企業擴充</div>
          </div>
        </div>
        <div class="skill-stat-card">
          <div class="skill-stat-icon icon--usage">
            <i class="material-symbols-outlined">bolt</i>
          </div>
          <div class="skill-stat-body">
            <div class="skill-stat-num">{{ store.totalUsageCount.toLocaleString() }}</div>
            <div class="skill-stat-lbl">本月自動觸發次數</div>
          </div>
        </div>
      </div>

      <!-- 上游更新 Banner -->
      <div v-if="store.pendingUpdateCount > 0" class="upstream-banner">
        <span>
          <i class="material-symbols-outlined">upgrade</i>
          <strong>{{ store.pendingUpdateSkills[0]?.name }}</strong>
          <template v-if="store.pendingUpdateCount > 1"> 等 {{ store.pendingUpdateCount }} 個技能</template>
          有上游更新可合併
        </span>
        <div class="upstream-banner-actions">
          <button class="custom-btn" @click="upstreamSkill = store.pendingUpdateSkills[0]">查看</button>
          <button v-if="store.pendingUpdateCount > 1" class="custom-btn" @click="showBatchUpdate = true">
            全部（{{ store.pendingUpdateCount }}）
          </button>
        </div>
      </div>

      <!-- 搜尋篩選 -->
      <SkillFilterBar v-model="filterState" />

      <!-- ── 我的技能 ─────────────────────────────── -->
      <div class="skill-sections">

        <div class="skill-section">
          <div class="skill-section-header">
            <i class="material-symbols-outlined">person</i>
            <span class="skill-section-title">我的技能</span>
            <span class="skill-section-count">{{ store.myPersonalSkills.length }}</span>
            <span class="skill-section-desc">你建立或從對話生成的個人技能，可送審加入 Library</span>
          </div>
          <div v-if="store.myPersonalSkills.length" class="my-skills-list">
            <PersonalSkillCard
              v-for="skill in store.myPersonalSkills"
              :key="skill.id"
              :skill="skill"
              @view="detailSkill = $event"
              @submit="handlePersonalSubmit"
            />
          </div>
          <div v-else class="my-skills-empty">
            <i class="material-symbols-outlined">person_search</i>
            <span>透過對話生成技能，或手動建立 skill 檔案後，技能會出現在這裡</span>
          </div>
        </div>

        <!-- 系統技能 -->
        <div v-if="showSystemSection" class="skill-section">
          <div class="skill-section-header">
            <i class="material-symbols-outlined">auto_awesome</i>
            <span class="skill-section-title">系統技能</span>
            <span class="skill-section-count">{{ filteredSystemSkills.length }}</span>
            <span class="skill-section-desc">平台提供的標準 AI 技能，企業可在此基礎上自訂擴充版本</span>
          </div>
          <div class="skill-tree">
            <template v-for="skill in filteredSystemSkills" :key="skill.id">
              <div class="skill-group-box">
                <SkillCard
                  :skill="skill"
                  :has-upstream-update="store.upstreamUpdateSkillIds.has(skill.id)"
                  @click="detailSkill = $event"
                  @test="handleTest"
                  @duplicate="handleDuplicate"
                />
                <div
                  v-if="skill.children?.filter(c => !c.deletedAt).length"
                  class="skill-group-children"
                >
                  <SkillCard
                    v-for="child in skill.children!.filter(c => !c.deletedAt)"
                    :key="child.id"
                    :skill="child"
                    :is-extension="true"
                    :has-upstream-update="store.upstreamUpdateSkillIds.has(child.id)"
                    @click="detailSkill = $event"
                    @test="handleTest"
                    @duplicate="handleDuplicate"
                  />
                </div>
              </div>
            </template>
            <div v-if="filteredSystemSkills.length === 0" class="skill-section-empty">
              此層級無符合條件的技能
            </div>
          </div>
        </div>

        <!-- 企業技能 -->
        <div v-if="showEnterpriseSection" class="skill-section">
          <div class="skill-section-header">
            <i class="material-symbols-outlined">corporate_fare</i>
            <span class="skill-section-title">企業技能</span>
            <span class="skill-section-count">{{ filteredEnterpriseSkills.length }}</span>
            <span class="skill-section-desc">企業自行建立，適用於全企業的自訂 AI 技能</span>
          </div>
          <div class="skill-tree">
            <SkillCard
              v-for="skill in filteredEnterpriseSkills"
              :key="skill.id"
              :skill="skill"
              :has-upstream-update="store.upstreamUpdateSkillIds.has(skill.id)"
              @click="detailSkill = $event"
              @test="handleTest"
              @duplicate="handleDuplicate"
            />
            <div v-if="filteredEnterpriseSkills.length === 0" class="skill-section-empty">
              此層級無符合條件的技能
            </div>
          </div>
        </div>

        <!-- 團隊技能 -->
        <div v-if="showTeamSection" class="skill-section">
          <div class="skill-section-header">
            <i class="material-symbols-outlined">groups</i>
            <span class="skill-section-title">團隊技能</span>
            <span class="skill-section-count">{{ filteredTeamSkills.length }}</span>
            <span class="skill-section-desc">由團隊成員建立，僅在本團隊範圍內使用</span>
          </div>
          <div class="skill-tree">
            <SkillCard
              v-for="skill in filteredTeamSkills"
              :key="skill.id"
              :skill="skill"
              :has-upstream-update="store.upstreamUpdateSkillIds.has(skill.id)"
              @click="detailSkill = $event"
              @test="handleTest"
              @duplicate="handleDuplicate"
            />
            <div v-if="filteredTeamSkills.length === 0" class="skill-section-empty">
              此層級無符合條件的技能
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Drawers -->
    <SkillDetailDrawer
      :skill="detailSkill"
      :upstream-version="upstreamVersionForDetail"
      @close="detailSkill = null"
      @test="handleTest"
      @toggle="handlePersonalToggle"
      @edit="(s) => router.push({ path: '/view/SkillEditor', query: { skillId: s.id } })"
      @delete="handlePersonalDelete"
      @duplicate="handleDuplicate"
      @review="(skillId, versionId) => { detailSkill = null; openReview(skillId, versionId) }"
      @open-upstream-update="openUpstreamUpdate"
    />

    <UpstreamUpdateDrawer
      :skill="upstreamSkill"
      :upstream-version="upstreamSkill ? (store.getUpstreamVersion(upstreamSkill.id) ?? '') : ''"
      @close="upstreamSkill = null"
      @merge="handleMerge"
      @ignore="(s) => { store.ignoreUpstreamUpdate(s.id); upstreamSkill = null }"
      @detach="handleDetach"
    />

    <SkillReviewDrawer
      v-model="showReviewDrawer"
      :skill-id="reviewingSkillId"
      @approved="showReviewDrawer = false"
      @rejected="showReviewDrawer = false"
    />

    <BatchUpdateModal
      v-model="showBatchUpdate"
      @merged="showBatchUpdate = false"
    />

    <!-- 送審 dialog -->
    <Teleport to="body">
      <Transition name="confirm-fade">
        <div
          v-if="submitConfirmSkill"
          class="draft-submit-overlay"
          @click.self="submitConfirmSkill = null"
        >
          <div class="draft-submit-dialog">
            <div class="dsd-header">
              <span class="dsd-title">送審至 Library</span>
              <button class="drawer-close-btn" @click="submitConfirmSkill = null">
                <i class="material-symbols-outlined">close</i>
              </button>
            </div>

            <div class="dsd-info">
              <div class="dsd-info-row">
                <span class="dsd-info-label">技能名稱</span>
                <span class="dsd-info-val">{{ submitConfirmSkill.name }}</span>
              </div>
              <div class="dsd-info-row">
                <span class="dsd-info-label">來源</span>
                <span class="dsd-info-val">{{ submitConfirmSkill.derivedFrom ? '對話延伸' : '手寫建立' }}</span>
              </div>
              <div v-if="submitConfirmSkill.derivedFrom" class="dsd-info-row">
                <span class="dsd-info-label">來源技能</span>
                <span class="dsd-info-val">{{ getDerivedFromName(submitConfirmSkill.derivedFrom) }}</span>
              </div>
            </div>

            <div class="dsd-options">
              <button
                :class="['dsd-option', submitMode === 'version_update' && 'is-selected']"
                :disabled="!submitConfirmSkill.derivedFrom"
                @click="submitMode = 'version_update'"
              >
                <i class="material-symbols-outlined">update</i>
                <div class="dsd-option-body">
                  <div class="dsd-option-title">更新版本</div>
                  <div class="dsd-option-desc">
                    提交為原技能的新版本，審核通過後更新現有技能
                    <span v-if="!submitConfirmSkill.derivedFrom">（此技能無來源技能）</span>
                  </div>
                </div>
                <i v-if="submitMode === 'version_update'" class="material-symbols-outlined dsd-check">check_circle</i>
              </button>

              <button
                :class="['dsd-option', submitMode === 'new_skill' && 'is-selected']"
                @click="submitMode = 'new_skill'"
              >
                <i class="material-symbols-outlined">add_circle</i>
                <div class="dsd-option-body">
                  <div class="dsd-option-title">建立新技能</div>
                  <div class="dsd-option-desc">作為獨立技能加入 Library，不影響原有技能</div>
                </div>
                <i v-if="submitMode === 'new_skill'" class="material-symbols-outlined dsd-check">check_circle</i>
              </button>
            </div>

            <div class="dsd-note">
              <label class="dsd-note-label">說明（選填）</label>
              <textarea
                v-model="submitNote"
                class="dsd-note-input"
                rows="3"
                :placeholder="submitMode === 'version_update'
                  ? '說明此版本的改動重點...'
                  : '描述適用情境、與現有技能的差異...'"
              ></textarea>
            </div>

            <div class="dsd-footer">
              <button class="custom-btn" @click="submitConfirmSkill = null">取消</button>
              <button class="custom-btn custom-main-btn" @click="confirmSubmitSkill">
                <i class="material-symbols-outlined">send</i>送出審核
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
```

- [ ] **Step 3: 改寫 `SkillManagement.vue` 的 `<script setup>`**

完整替換 `<script setup lang="ts">` 內容：

```ts
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import SkillCard from '@/components/Skill/SkillCard.vue'
import PersonalSkillCard from '@/components/Skill/PersonalSkillCard.vue'
import SkillDetailDrawer from '@/components/Skill/SkillDetailDrawer.vue'
import SkillReviewDrawer from '@/components/Skill/SkillReviewDrawer.vue'
import UpstreamUpdateDrawer from '@/components/Skill/UpstreamUpdateDrawer.vue'
import BatchUpdateModal from '@/components/Skill/BatchUpdateModal.vue'
import SkillFilterBar, { type SkillFilterState } from '@/components/Skill/SkillFilterBar.vue'
import { useSkillStore } from '@/stores/skillStore'
import type { Skill, ConflictResolution } from '@/stores/skillStore'

const router = useRouter()
const store = useSkillStore()

const detailSkill = ref<Skill | null>(null)
const showReviewDrawer = ref(false)
const reviewingSkillId = ref('')
const upstreamSkill = ref<Skill | null>(null)
const showBatchUpdate = ref(false)
const filterState = ref<SkillFilterState>({ query: '', type: 'all', status: 'all', update: 'all' })

// 送審 dialog 狀態
const submitConfirmSkill = ref<Skill | null>(null)
const submitMode = ref<'new_skill' | 'version_update'>('new_skill')
const submitNote = ref('')

const upstreamVersionForDetail = computed(() => {
  if (!detailSkill.value) return undefined
  return store.getUpstreamVersion(detailSkill.value.id)
})

const showSystemSection = computed(() =>
  filterState.value.type === 'all' || filterState.value.type === 'system'
)
const showEnterpriseSection = computed(() =>
  filterState.value.type === 'all' || filterState.value.type === 'enterprise'
)
const showTeamSection = computed(() =>
  filterState.value.type === 'all' || filterState.value.type === 'team'
)

const filteredSystemSkills = computed(() => {
  const f = filterState.value
  if (f.type === 'enterprise' || f.type === 'team') return []
  const q = f.query.toLowerCase().trim()
  return store.skills.filter(s => {
    if (s.type !== 'system' || s.deletedAt) return false
    const selfMatch = (
      (!q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)) &&
      (f.status === 'all' || (f.status === 'enabled' ? s.isEnabled : !s.isEnabled)) &&
      (f.update === 'all' || store.upstreamUpdateSkillIds.has(s.id))
    )
    const childMatch = (s.children ?? []).some(c =>
      !c.deletedAt &&
      (!q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)) &&
      (f.status === 'all' || (f.status === 'enabled' ? c.isEnabled : !c.isEnabled)) &&
      (f.update === 'all' || store.upstreamUpdateSkillIds.has(c.id))
    )
    return selfMatch || childMatch
  })
})

const filteredEnterpriseSkills = computed(() => {
  const f = filterState.value
  if (f.type === 'system' || f.type === 'team') return []
  const q = f.query.toLowerCase().trim()
  return store.skills.filter(s => {
    if (s.scope !== 'enterprise' || s.deletedAt) return false
    if (q && !s.name.toLowerCase().includes(q) && !s.description.toLowerCase().includes(q)) return false
    if (f.status !== 'all' && (f.status === 'enabled' ? !s.isEnabled : s.isEnabled)) return false
    if (f.update === 'has_update' && !store.upstreamUpdateSkillIds.has(s.id)) return false
    return true
  })
})

const filteredTeamSkills = computed(() => {
  const f = filterState.value
  if (f.type === 'system' || f.type === 'enterprise') return []
  const q = f.query.toLowerCase().trim()
  return store.skills.filter(s => {
    if (s.scope !== 'team' || s.deletedAt) return false
    if (q && !s.name.toLowerCase().includes(q) && !s.description.toLowerCase().includes(q)) return false
    if (f.status !== 'all' && (f.status === 'enabled' ? !s.isEnabled : s.isEnabled)) return false
    if (f.update === 'has_update' && !store.upstreamUpdateSkillIds.has(s.id)) return false
    return true
  })
})

function handleTest(skill: Skill) {
  router.push({ path: '/view/SkillTest', query: { skillId: skill.id } })
}

function openReview(skillId: string, _versionId: string) {
  reviewingSkillId.value = skillId
  showReviewDrawer.value = true
}

function openUpstreamUpdate(skill: Skill) {
  detailSkill.value = null
  upstreamSkill.value = skill
}

function handleMerge(skill: Skill, resolutions?: ConflictResolution[]) {
  store.mergeUpstreamUpdate(skill.id, resolutions)
  upstreamSkill.value = null
}

function handleDetach(skill: Skill) {
  store.detachFromUpstream(skill.id)
  upstreamSkill.value = null
}

function handleDuplicate(skill: Skill) {
  store.duplicateSkill(skill.id)
  detailSkill.value = null
}

// ── 個人技能 handlers ──────────────────────────────

function handlePersonalSubmit(skill: Skill) {
  submitConfirmSkill.value = skill
  submitMode.value = skill.derivedFrom ? 'version_update' : 'new_skill'
  submitNote.value = ''
}

function confirmSubmitSkill() {
  if (!submitConfirmSkill.value) return
  store.submitPersonalSkill(submitConfirmSkill.value.id, submitMode.value, submitNote.value)
  submitConfirmSkill.value = null
  submitNote.value = ''
}

function handlePersonalDelete(skill: Skill) {
  store.deletePersonalSkill(skill.id)
  if (detailSkill.value?.id === skill.id) detailSkill.value = null
}

function handlePersonalToggle(skill: Skill) {
  store.toggleSkill(skill.id)
  if (detailSkill.value?.id === skill.id) {
    detailSkill.value = { ...detailSkill.value, isEnabled: !detailSkill.value.isEnabled }
  }
}

function getDerivedFromName(derivedFrom: string): string {
  return store.flatSkills.find(s => s.id === derivedFrom)?.name ?? derivedFrom
}
</script>
```

- [ ] **Step 4: 更新 `_SkillManagement.scss`**

在 `_SkillManagement.scss` 中：

**移除**以下區塊（不再需要 tab 切換樣式）：

```scss
// Segmented control for list ↔ drafts
.skill-view-tabs { ... }
.sview-tab { ... }
.sview-badge { ... }
```

**移除**草稿相關樣式：

```scss
// ── Draft list ────────────────────────────────
.draft-list { ... }
.draft-empty { ... }
```

**在** `.SkillManagement { ... }` 區塊內（於 `.skill-section-empty` 之後）加入：

```scss
// ── 我的技能 list ──────────────────────────────

.my-skills-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.my-skills-empty {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 24px 20px;
  color: var(--text-faint);
  font-size: 13px;
  background: var(--page-bg);
  border: 1px dashed var(--divider-a50);
  border-radius: 12px;

  .material-symbols-outlined { font-size: 22px; opacity: 0.6; flex-shrink: 0; }
}
```

**在** `.draft-submit-dialog { ... }` 區塊內加入（在 `.dsd-footer` 之前）：

```scss
.dsd-info {
  margin: 12px 20px 0;
  padding: 12px 14px;
  background: var(--page-bg);
  border: 1px solid var(--divider-a50);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dsd-info-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 13px;
}

.dsd-info-label {
  color: var(--text-faint);
  font-size: 12px;
  min-width: 56px;
  flex-shrink: 0;
}

.dsd-info-val {
  color: var(--text);
  font-weight: 500;
}

.dsd-note {
  padding: 12px 20px 0;
}

.dsd-note-label {
  display: block;
  font-size: 12px;
  color: var(--text-faint);
  margin-bottom: 6px;
}

.dsd-note-input {
  width: 100%;
  border: 1px solid var(--divider-a50);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--text);
  background: var(--surface);
  resize: vertical;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;

  &::placeholder { color: var(--text-faint); }
  &:focus {
    border-color: $color_main_1;
    box-shadow: 0 0 0 3px $color_main_5;
  }
}
```

**移除** `.skill-disable-overlay` 和 `.skill-disable-dialog` 整個區塊（共約 90 行，從 `// ── Disable confirm dialog` 開始）。

- [ ] **Step 5: type-check**

```bash
npm run type-check
```

Expected: 無 error。若有「Property 'toggle' does not exist on type」，代表 SkillCard 的 toggle emit 確認已在 Task 3 移除。

- [ ] **Step 6: 執行全部測試**

```bash
npm run test:unit -- --run
```

Expected: 全部 pass

- [ ] **Step 7: Commit**

```bash
git add src/views/SkillManagement.vue src/scss/views/_SkillManagement.scss src/stores/__tests__/skillStore.test.ts
git commit -m "feat(skill): refactor SkillManagement to single-page with personal zone section"
```
