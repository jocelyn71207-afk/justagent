# 技能測試沙盒配色與清單改版 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修正 SkillTest 沙盒 agent 對話泡泡跟背景同色看不見的問題，並把左側技能清單改成「我的技能／Library 技能」分區、Library 依 scope 分組、且每個技能都能選版本測試。

**Architecture:** 分四個獨立任務：(1) skillStore 加入版本選擇 state 與 helper，(2) agent 泡泡配色修正（純 CSS），(3) 側邊欄分區/分組/版本控制的 CSS，(4) 新增 SkillVersionPicker 元件並重寫 SkillTest.vue 側邊欄樣板。前三個任務互相獨立、第四個任務依賴 Task 1 的 store API 與 Task 3 的 CSS class。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Pinia（composition style）、SCSS（`@import` convention）、Vitest

## Global Constraints

- 所有元件使用 `<script setup lang="ts">`，禁止 Options API
- 樣式在 `src/scss/` 管理，禁止 `<style scoped>`
- 顏色使用 CSS Custom Properties 或既有 SCSS 變數（`$color_main_*`），不寫死 hex
- 個人技能 `zone === 'personal'`；Library 技能 `zone` 為 `undefined`（不是 `'library'`）
- 個人技能版本存在 `skill.personalVersions`（`{ versionTag, isActive }`），Library 技能版本存在 `skill.versions`（`{ versionTag, status }`，`status === 'active'` 才是使用中版本）；兩者都可能為 `undefined`，此時退回單一版本 `skill.version`
- Library scope 的企業標籤重用既有 `.skill-tag.tag--enterprise`（`src/scss/components/_SkillCard.scss`），團隊標籤重用既有 `.lsr-team-badge`（`src/scss/components/_LibrarySkillRow.scss`）——這兩個 class 已透過 `_index.scss` 全域載入，不用重新定義顏色
- 這次改版**不**處理：版本間測試結果差異化模擬、`PersonalSkillGroup.vue` 既有的 `tag--available`/`tag--has-library` CSS 缺失、右側面板 header 的 `v{{version}}`/`tag--sys`/`tag--ext` 顯示邏輯
- 已知既有失敗測試（與本次改版無關，不用修）：`skillStore.test.ts` 的「myPersonalSkills 初始有 3 筆」斷言與目前 mock 資料（6 筆）不符，執行 `npm run test:unit` 時會看到這筆既有失敗，不是本次改動造成的

---

### Task 1: skillStore — 版本選擇 state 與 helper

**Files:**
- Modify: `src/stores/skillStore.ts`
- Modify: `src/stores/__tests__/skillStore.test.ts`

**Interfaces:**
- Produces（供 Task 4 使用）：
  - `selectedVersionTag: Ref<string | null>`
  - `getVersionOptions(skillId: string): { versionTag: string; isActive: boolean }[]`
  - `getDefaultVersionTag(skillId: string): string | null`
  - `setSelectedSkill(id: string, versionTag?: string): void`（既有函式擴充第二參數，行為向下相容）

- [ ] **Step 1: 寫失敗測試 — `getVersionOptions`**

在 `src/stores/__tests__/skillStore.test.ts` 最後一個 `describe` 區塊（`SkillManagement 頁面整合`）後面加入新區塊：

```ts
  describe('版本測試選擇（SkillTest 沙盒）', () => {
    it('getVersionOptions 對多版本個人技能回傳所有版本並標示使用中版本', () => {
      const store = useSkillStore()
      const options = store.getVersionOptions('personal-001')
      expect(options).toEqual([
        { versionTag: '1.0', isActive: false },
        { versionTag: '1.1', isActive: true },
      ])
    })

    it('getVersionOptions 對單一版本個人技能回傳單一項目', () => {
      const store = useSkillStore()
      const options = store.getVersionOptions('personal-002')
      expect(options).toEqual([{ versionTag: '1.0', isActive: true }])
    })

    it('getVersionOptions 對多版本 Library 技能依 status 判斷使用中版本', () => {
      const store = useSkillStore()
      const options = store.getVersionOptions('sys-cs-001')
      expect(options).toContainEqual({ versionTag: '2.4.0', isActive: true })
      expect(options).toContainEqual({ versionTag: '2.4.1', isActive: false })
    })

    it('getVersionOptions 對不存在的技能回傳空陣列', () => {
      const store = useSkillStore()
      expect(store.getVersionOptions('nonexistent')).toEqual([])
    })

    it('setSelectedSkill 未指定 versionTag 時預設使用「使用中」版本', () => {
      const store = useSkillStore()
      store.setSelectedSkill('personal-001')
      expect(store.selectedVersionTag).toBe('1.1')
    })

    it('setSelectedSkill 指定 versionTag 時採用該版本', () => {
      const store = useSkillStore()
      store.setSelectedSkill('personal-001', '1.0')
      expect(store.selectedVersionTag).toBe('1.0')
    })

    it('setSelectedSkill 對沒有 active 版本的技能退回第一個版本', () => {
      const store = useSkillStore()
      store.setSelectedSkill('ext-cs-return-001')
      expect(store.selectedVersionTag).toBe('1.0.0')
    })
  })
```

- [ ] **Step 2: 執行測試確認失敗**

```bash
cd /Users/jocelyn/Desktop/規劃/demosite
npx vitest run src/stores/__tests__/skillStore.test.ts -t "版本測試選擇"
```

Expected: 7 個新測試全部 FAIL（`getVersionOptions is not a function` / `selectedVersionTag` 為 `undefined`）

- [ ] **Step 3: 加入 `selectedVersionTag` state**

在 `src/stores/skillStore.ts` 第 863 行 `const selectedSkillId = ref<string | null>(null)` 正下方加入：

```ts
  const selectedVersionTag = ref<string | null>(null)
```

- [ ] **Step 4: 加入 `getVersionOptions` 與 `getDefaultVersionTag`**

在 `src/stores/skillStore.ts` 的 `getReviewingVersion` 函式（第 961-963 行）後面加入：

```ts
  function getVersionOptions(skillId: string): { versionTag: string; isActive: boolean }[] {
    const skill = findSkill(skillId)
    if (!skill) return []
    if (skill.zone === 'personal' && skill.personalVersions?.length) {
      return skill.personalVersions.map(v => ({ versionTag: v.versionTag, isActive: v.isActive }))
    }
    if (skill.versions?.length) {
      return skill.versions.map(v => ({ versionTag: v.versionTag, isActive: v.status === 'active' }))
    }
    return [{ versionTag: skill.version, isActive: true }]
  }

  function getDefaultVersionTag(skillId: string): string | null {
    const options = getVersionOptions(skillId)
    if (!options.length) return null
    return options.find(v => v.isActive)?.versionTag ?? options[0].versionTag
  }
```

- [ ] **Step 5: 擴充 `setSelectedSkill` 支援 versionTag 參數**

在 `src/stores/skillStore.ts` 第 1358-1364 行，把：

```ts
  function setSelectedSkill(id: string): void {
    selectedSkillId.value = id
    aiTestScenarios.value = []
    aiTestReport.value = null
    aiTestIsGenerating.value = false
    aiTestIsRunning.value = false
  }
```

改成：

```ts
  function setSelectedSkill(id: string, versionTag?: string): void {
    selectedSkillId.value = id
    selectedVersionTag.value = versionTag ?? getDefaultVersionTag(id)
    aiTestScenarios.value = []
    aiTestReport.value = null
    aiTestIsGenerating.value = false
    aiTestIsRunning.value = false
  }
```

- [ ] **Step 6: 在 store 的 `return` 物件加入新 export**

在 `src/stores/skillStore.ts` 第 1474 行起的 `return { ... }` 物件裡，`selectedSkillId,` 那一行後面加入：

```ts
    selectedVersionTag,
```

並在 `getReviewingVersion,` 那一行後面加入：

```ts
    getVersionOptions,
    getDefaultVersionTag,
```

- [ ] **Step 7: 執行測試確認通過**

```bash
cd /Users/jocelyn/Desktop/規劃/demosite
npx vitest run src/stores/__tests__/skillStore.test.ts -t "版本測試選擇"
```

Expected: 7 個新測試全部 PASS

- [ ] **Step 8: 型別檢查**

```bash
cd /Users/jocelyn/Desktop/規劃/demosite
npm run type-check
```

Expected: 無新增 error

- [ ] **Step 9: Commit**

```bash
cd /Users/jocelyn/Desktop/規劃/demosite
git add src/stores/skillStore.ts src/stores/__tests__/skillStore.test.ts
git commit -m "feat(skill-test): add version selection state to skillStore"
```

---

### Task 2: Agent 對話泡泡配色修正

**Files:**
- Modify: `src/scss/views/_SkillTest.scss:239-253`

**Interfaces:**
- 無（純 CSS，不影響其他任務）

- [ ] **Step 1: 修正 `.bubble--agent` 背景與邊框**

在 `src/scss/views/_SkillTest.scss` 第 239-244 行，把：

```scss
    &.bubble--agent {
      align-self: flex-start;
      background: var(--page-bg);
      color: var(--text);
      border-bottom-left-radius: 4px;
    }
```

改成：

```scss
    &.bubble--agent {
      align-self: flex-start;
      background: var(--surface);
      border: 1px solid var(--divider-a50);
      color: var(--text);
      border-bottom-left-radius: 4px;
    }
```

- [ ] **Step 2: 「AI Agent」標籤改用品牌色**

在同檔案第 246-253 行，把：

```scss
    .bubble-label {
      font-size: 11px;
      font-weight: 600;
      opacity: 0.6;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
```

改成：

```scss
    .bubble-label {
      font-size: 11px;
      font-weight: 600;
      color: $color_main_2;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
```

- [ ] **Step 3: 啟動 dev server 手動驗證**

```bash
cd /Users/jocelyn/Desktop/規劃/demosite
npm run dev
```

開啟瀏覽器進入「技能測試沙盒」→ 任一技能 → 對話測試頁籤，輸入一句話送出。

Expected：
- User 泡泡維持右側綠底白字不變
- Agent 泡泡現在有白色（或深色主題下較亮的 surface 色）背景 + 細邊框，跟面板底色明顯分開，不再是隱形的
- 「AI AGENT」字樣呈深綠色，不是灰階

- [ ] **Step 4: Commit**

```bash
cd /Users/jocelyn/Desktop/規劃/demosite
git add src/scss/views/_SkillTest.scss
git commit -m "fix(skill-test): agent bubble background matched panel background, making it invisible"
```

---

### Task 3: 側邊欄分區／分組／版本控制樣式

**Files:**
- Modify: `src/scss/views/_SkillTest.scss:33-76`

**Interfaces:**
- Produces（供 Task 4 使用的 CSS class）：
  - `.section-badge-row`、`.section-badge`、`.section-badge--mine`、`.section-badge--library`
  - `.subgroup-label`
  - `.si-name`
  - `.version-inline`
  - `.version-dd`、`.version-dd-btn`（含 `.dd-caret`）、`.version-dd-menu`、`.version-dd-item`（含 `.is-current`）
  - `.version-current-tag`

- [ ] **Step 1: 移除 `.dot--draft` 死代碼**

在 `src/scss/views/_SkillTest.scss` 第 53-65 行，把：

```scss
    .skill-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;

      &.dot--sys  { background: #818cf8; }
      &.dot--ext  { background: #f59e0b; }
      &.dot--draft {
        background: transparent;
        border: 2px dashed var(--text-faint);
      }
    }
```

改成：

```scss
    .skill-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;

      &.dot--sys  { background: #818cf8; }
      &.dot--ext  { background: #f59e0b; }
    }
```

- [ ] **Step 2: 用色底標籤區塊標題取代 `.sidebar-section-label`**

在同檔案第 67-76 行，把：

```scss
    .sidebar-section-label {
      padding: 8px 16px 4px;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-faint);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-top: 1px solid var(--divider-a50);
      margin-top: 4px;
    }
```

改成：

```scss
    .section-badge-row {
      padding: 12px 16px 6px;

      &:not(:first-child) {
        margin-top: 4px;
        padding-top: 12px;
        border-top: 1px solid var(--divider-a50);
      }
    }

    .section-badge {
      display: inline-flex;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;

      &--mine    { background: $color_main_5; color: $color_main_2; }
      &--library { background: var(--divider-a50); color: var(--text-muted); }
    }

    .subgroup-label {
      padding: 8px 16px 3px;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-faint);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
```

- [ ] **Step 3: 加入單行技能列的版本控制樣式**

在 `.skill-dot { ... }` 區塊（Step 1 修改後的版本）後面、`.section-badge-row { ... }` 區塊（Step 2 新增的）前面，插入：

```scss
    .si-name {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .version-inline {
      font-size: 11px;
      color: var(--text-faint);
      flex-shrink: 0;
      font-variant-numeric: tabular-nums;
    }

    .version-dd {
      position: relative;
      flex-shrink: 0;
    }

    .version-dd-btn {
      font: inherit;
      font-size: 11px;
      font-weight: 600;
      color: inherit;
      background: var(--surface);
      border: 1px solid var(--divider-a50);
      border-radius: 5px;
      padding: 2px 6px;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-variant-numeric: tabular-nums;
      cursor: pointer;

      .dd-caret { font-size: 8px; opacity: 0.7; }
    }

    .version-dd-menu {
      position: absolute;
      top: calc(100% + 4px);
      right: 0;
      z-index: 10;
      background: var(--surface);
      border: 1px solid var(--divider-a50);
      border-radius: 8px;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
      padding: 4px;
      min-width: 108px;
    }

    .version-dd-item {
      padding: 6px 8px;
      font-size: 11.5px;
      color: var(--text-muted);
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      cursor: pointer;
      font-variant-numeric: tabular-nums;

      &:hover { background: var(--page-bg); }
      &.is-current { color: var(--text); font-weight: 700; }
    }

    .version-current-tag {
      font-size: 9px;
      font-weight: 700;
      background: $color_main_5;
      color: $color_main_1;
      padding: 1px 5px;
      border-radius: 4px;
      flex-shrink: 0;
    }
```

- [ ] **Step 4: 型別/建置檢查（純 CSS，用 build 確認 SCSS 沒有語法錯誤）**

```bash
cd /Users/jocelyn/Desktop/規劃/demosite
npm run build
```

Expected: build 成功，無 SCSS 編譯錯誤（這個階段頁面上還看不到分區效果，因為 Task 4 才會改樣板套用這些 class，屬正常現象）

- [ ] **Step 5: Commit**

```bash
cd /Users/jocelyn/Desktop/規劃/demosite
git add src/scss/views/_SkillTest.scss
git commit -m "style(skill-test): add sidebar section badge and version control styles"
```

---

### Task 4: SkillVersionPicker 元件 + SkillTest.vue 側邊欄重寫

**Files:**
- Create: `src/components/Skill/SkillVersionPicker.vue`
- Modify: `src/views/SkillTest.vue`

**Interfaces:**
- Consumes（來自 Task 1）：`store.myPersonalSkills`、`store.flatSkills`、`store.selectedSkillId`、`store.selectedVersionTag`、`store.getVersionOptions(skillId)`、`store.getDefaultVersionTag(skillId)`、`store.setSelectedSkill(id, versionTag?)`
- Consumes（來自 Task 3）：`.section-badge-row`、`.section-badge--mine`、`.section-badge--library`、`.subgroup-label`、`.si-name`、`.version-inline`、`.version-dd*`、`.version-current-tag`；既有全域 class `.skill-tag.tag--enterprise`、`.lsr-team-badge`
- Produces：`SkillVersionPicker` 元件 props `{ versions: { versionTag: string; isActive: boolean }[], modelValue: string }`，emit `update:modelValue(versionTag: string)`

- [ ] **Step 1: 建立 `SkillVersionPicker.vue`**

建立 `src/components/Skill/SkillVersionPicker.vue`：

```vue
<template>
  <span v-if="versions.length <= 1" class="version-inline">v{{ versions[0]?.versionTag }}</span>
  <div v-else class="version-dd" ref="ddRef">
    <button type="button" class="version-dd-btn" @click.stop="toggle">
      v{{ modelValue }} <span class="dd-caret">▾</span>
    </button>
    <div v-show="isOpen" class="version-dd-menu">
      <div
        v-for="v in versions"
        :key="v.versionTag"
        :class="['version-dd-item', { 'is-current': v.versionTag === modelValue }]"
        @click.stop="select(v.versionTag)"
      >
        v{{ v.versionTag }}
        <span v-if="v.isActive" class="version-current-tag">使用中</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

defineProps<{
  versions: { versionTag: string; isActive: boolean }[]
  modelValue: string
}>()

const emit = defineEmits<{ 'update:modelValue': [versionTag: string] }>()

const isOpen = ref(false)
const ddRef = ref<HTMLElement | null>(null)

function toggle() {
  isOpen.value = !isOpen.value
}

function select(versionTag: string) {
  emit('update:modelValue', versionTag)
  isOpen.value = false
}

function handleClickOutside(event: MouseEvent) {
  if (ddRef.value && !ddRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>
```

- [ ] **Step 2: 重寫 `SkillTest.vue` 的 script — 資料來源與分組**

在 `src/views/SkillTest.vue` 的 `<script setup>` 區塊，把：

```ts
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import SkillTestChat from '@/components/Skill/SkillTestChat.vue'
import SkillTestAI from '@/components/Skill/SkillTestAI.vue'
import { useSkillStore } from '@/stores/skillStore'

const route = useRoute()
const store = useSkillStore()
const activeTab = ref<'chat' | 'ai'>('chat')

const selectedSkill = computed(() =>
  store.selectedSkillId ? store.findSkill(store.selectedSkillId) ?? null : null
)

onMounted(() => {
  const skillId = route.query.skillId as string | undefined
  if (skillId && store.findSkill(skillId)) {
    store.setSelectedSkill(skillId)
  } else if (store.flatSkills.length) {
    store.setSelectedSkill(store.flatSkills[0].id)
  }
})
```

改成：

```ts
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import SkillTestChat from '@/components/Skill/SkillTestChat.vue'
import SkillTestAI from '@/components/Skill/SkillTestAI.vue'
import SkillVersionPicker from '@/components/Skill/SkillVersionPicker.vue'
import { useSkillStore } from '@/stores/skillStore'
import type { Skill } from '@/stores/skillStore'

const route = useRoute()
const store = useSkillStore()
const activeTab = ref<'chat' | 'ai'>('chat')

const selectedSkill = computed(() =>
  store.selectedSkillId ? store.findSkill(store.selectedSkillId) ?? null : null
)

const personalSkills = computed(() => store.myPersonalSkills)
const enabledLibrarySkills = computed(() => store.flatSkills.filter(s => s.isEnabled))

const librarySubgroups = computed(() => [
  { key: 'system', label: '系統技能', skills: enabledLibrarySkills.value.filter(s => s.scope === 'system') },
  { key: 'enterprise', label: '企業擴充', skills: enabledLibrarySkills.value.filter(s => s.scope === 'enterprise') },
  { key: 'team', label: '團隊擴充', skills: enabledLibrarySkills.value.filter(s => s.scope === 'team') },
])

function displayVersionTag(skill: Skill): string {
  if (store.selectedSkillId === skill.id && store.selectedVersionTag) {
    return store.selectedVersionTag
  }
  return store.getDefaultVersionTag(skill.id) ?? ''
}

onMounted(() => {
  const skillId = route.query.skillId as string | undefined
  if (skillId && store.findSkill(skillId)) {
    store.setSelectedSkill(skillId)
  } else if (personalSkills.value.length) {
    store.setSelectedSkill(personalSkills.value[0].id)
  } else if (enabledLibrarySkills.value.length) {
    store.setSelectedSkill(enabledLibrarySkills.value[0].id)
  }
})
```

- [ ] **Step 3: 重寫側邊欄樣板**

在 `src/views/SkillTest.vue` 的 `<template>`，把：

```vue
      <!-- 左側：技能選擇 -->
      <div class="test-sidebar">
        <div class="sidebar-head">測試的技能</div>
        <div class="sidebar-list">
          <div
            v-for="skill in store.flatSkills"
            :key="skill.id"
            :class="['sidebar-item', { 'is-active': store.selectedSkillId === skill.id }]"
            @click="store.setSelectedSkill(skill.id)"
          >
            <span :class="['skill-dot', skill.type === 'system' ? 'dot--sys' : 'dot--ext']"></span>
            {{ skill.name }}
          </div>
        </div>
      </div>
```

改成：

```vue
      <!-- 左側：技能選擇 -->
      <div class="test-sidebar">
        <div class="sidebar-head">測試的技能</div>
        <div class="sidebar-list">

          <template v-if="personalSkills.length">
            <div class="section-badge-row">
              <span class="section-badge section-badge--mine">我的技能</span>
            </div>
            <div
              v-for="skill in personalSkills"
              :key="skill.id"
              :class="['sidebar-item', { 'is-active': store.selectedSkillId === skill.id }]"
              @click="store.setSelectedSkill(skill.id)"
            >
              <span class="si-name">{{ skill.name }}</span>
              <SkillVersionPicker
                :versions="store.getVersionOptions(skill.id)"
                :model-value="displayVersionTag(skill)"
                @update:model-value="v => store.setSelectedSkill(skill.id, v)"
              />
            </div>
          </template>

          <template v-if="librarySubgroups.some(g => g.skills.length)">
            <div class="section-badge-row">
              <span class="section-badge section-badge--library">Library 技能</span>
            </div>

            <template v-for="group in librarySubgroups" :key="group.key">
              <template v-if="group.skills.length">
                <div class="subgroup-label">{{ group.label }}</div>
                <div
                  v-for="skill in group.skills"
                  :key="skill.id"
                  :class="['sidebar-item', { 'is-active': store.selectedSkillId === skill.id }]"
                  @click="store.setSelectedSkill(skill.id)"
                >
                  <span :class="['skill-dot', skill.type === 'system' ? 'dot--sys' : 'dot--ext']"></span>
                  <span class="si-name">{{ skill.name }}</span>
                  <span v-if="skill.scope === 'enterprise'" class="skill-tag tag--enterprise">企業</span>
                  <span v-else-if="skill.scope === 'team' && skill.teamName" class="lsr-team-badge">{{ skill.teamName }}</span>
                  <SkillVersionPicker
                    :versions="store.getVersionOptions(skill.id)"
                    :model-value="displayVersionTag(skill)"
                    @update:model-value="v => store.setSelectedSkill(skill.id, v)"
                  />
                </div>
              </template>
            </template>
          </template>

        </div>
      </div>
```

- [ ] **Step 4: 型別檢查**

```bash
cd /Users/jocelyn/Desktop/規劃/demosite
npm run type-check
```

Expected: 無新增 error

- [ ] **Step 5: Lint**

```bash
cd /Users/jocelyn/Desktop/規劃/demosite
npm run lint
```

Expected: 無新增 error（可自動修正的會被 `--fix`）

- [ ] **Step 6: 啟動 dev server 手動驗證**

```bash
cd /Users/jocelyn/Desktop/規劃/demosite
npm run dev
```

開啟「技能測試沙盒」頁面，檢查：

- 側邊欄分成「我的技能」（品牌綠底標籤）與「Library 技能」（灰底標籤）兩區塊
- Library 技能底下依序出現「系統技能／企業擴充／團隊擴充」三個子標題，且各自只列出對應 scope 的技能
- 企業擴充技能顯示「企業」標籤，團隊擴充技能顯示團隊名稱標籤
- 只有一個版本的技能（如「客服對話品質評估」）右側顯示純文字版本號，點不出下拉選單
- 有多個版本的技能（如「週報自動生成」、「通用客服機器人」）右側是「vX.X ▾」下拉，點開能看到所有版本，使用中版本有「使用中」小標籤
- 點下拉選單中的其他版本，該技能列會被選中（高亮），且下拉按鈕文字更新為選中的版本
- 停用的技能（`isEnabled: false`）不會出現在 Library 技能清單中（可在 `skillStore.ts` mock 資料中找一筆 `isEnabled: false` 的 library skill 確認，若目前 mock 全部是 enabled，此步驟可略過並在 PR 說明中註記）
- 重新整理頁面，預設選中「我的技能」的第一筆（若我的技能為空，才會選 Library 第一筆）

- [ ] **Step 7: 執行既有 store 測試確認沒有新增迴歸**

```bash
cd /Users/jocelyn/Desktop/規劃/demosite
npx vitest run src/stores/__tests__/skillStore.test.ts
```

Expected: 除了 Global Constraints 提到的既有「myPersonalSkills 初始有 3 筆」失敗外，其餘全部 PASS

- [ ] **Step 8: Commit**

```bash
cd /Users/jocelyn/Desktop/規劃/demosite
git add src/components/Skill/SkillVersionPicker.vue src/views/SkillTest.vue
git commit -m "feat(skill-test): rework sidebar into personal/library sections with per-version testing"
```
