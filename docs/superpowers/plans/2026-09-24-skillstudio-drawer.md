# SkillStudio 抽屜化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓「技能管理」頁面點選「建立技能」「編輯」「建議佇列建立」時，用近全螢幕的側邊抽屜呈現 SkillStudio 工作區，取代目前整頁導到 `/view/SkillStudio` 的做法，使用者留在技能管理列表的情境裡不會消失。

**Architecture:** 把 `SkillStudio.vue` 的工作區（左右兩欄：對話/積木 + 預覽/測試）抽成獨立元件 `SkillStudioWorkspace.vue`，讓兩個外殼共用：① 頁面殼 `SkillStudio.vue`（不變的路由入口，供 conv4 交接與導覽選單直接點「AI 賦能」使用）② 新的抽屜殼 `SkillStudioDrawer.vue`，掛載在 `SkillManagement.vue` 裡，由 `/view/Skills` 路由的 `skillId`/`method`/`from`/`tab` query 參數驅動開關。標題徽章邏輯抽成 `SkillStudioModeHeader.vue` 供兩個外殼共用。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Vue Router 4（`onBeforeRouteUpdate`/`onBeforeRouteLeave` 導覽守衛）、Pinia、Vitest + @vue/test-utils。

**Spec:** [docs/superpowers/specs/2026-09-24-skillstudio-drawer-design.md](../specs/2026-09-24-skillstudio-drawer-design.md)

## Global Constraints

- 禁止 `<style scoped>`；所有樣式在 `src/scss/` 管理，新增 SCSS 檔案要在對應的 `_index.scss` 手動 `@import`（沿用現有寫法，不是 `@forward`——實際 codebase 裡 `_index.scss` 全部用 `@import`）。
- 使用 `<script setup lang="ts">`，禁止 Options API。
- 顏色一律用 CSS Custom Properties（`var(--divider-a50)`、`var(--surface)` 等），不寫死 hex。
- 所有 import 使用 `@/` alias。
- 抽屜是「近全螢幕、完整保留兩欄工作區」，不是被否決過的小型置中 modal——`.SkillStudioDrawer` 要抄 `_SkillTest.scss` 裡 `.st-context-drawer` 那種「從右側滑入、`position:absolute; right:0`」的真抽屜版型，**不要**抄 `_SkillDetailDrawer.scss` 的 `.drawer-panel`（那個名字叫 Drawer，但實際是置中 scale+fade 的 modal）。
- conv4（AiViewer 交接）與導覽選單直接點「AI 賦能」，維持走 `/view/SkillStudio` 獨立頁面，不進抽屜。

---

## Task 1: 抽出 `SkillStudioWorkspace.vue`，`SkillStudio.vue` 改用它

**Files:**
- Create: `src/components/Skill/SkillStudioWorkspace.vue`
- Modify: `src/views/SkillStudio.vue`（整檔重寫，變薄）
- Test: `src/views/__tests__/SkillStudio.test.ts`（本任務**不修改**，用來驗證行為沒變）

**Interfaces:**
- Produces（`SkillStudioWorkspace.vue` 的對外介面，之後 Task 2/3 都會用到）：
  - Props：`initialQuery?: LocationQuery`（形狀同 `route.query`：`skillId`/`method`/`from`/`tab`）
  - `defineExpose({ isDirty: ComputedRef<boolean>, mode: Ref<StudioMode>, skillName: ComputedRef<string>, applyQuery: (query: LocationQuery) => void })`

- [ ] **Step 1: 建立 `SkillStudioWorkspace.vue`**

把 `SkillStudio.vue` 現有的 `.skill-studio-layout` 區塊（模板）與對應的 script 邏輯整個搬過來，只把觸發來源從 `route.query`/`onBeforeRouteLeave`/`onBeforeRouteUpdate` 改成「prop 初始化 + 對外暴露 `applyQuery` 方法」。這是機械式搬移，內容跟現在 `SkillStudio.vue` 幾乎逐行相同：

```vue
<template>
  <div class="skill-studio-layout">
    <div class="studio-chat-col">
      <!-- 方案三：從 conv4 交接過來的草稿，帶一條回原對話的路，並說明這顆草稿從哪來 -->
      <template v-if="handoffOrigin">
        <button type="button" class="custom-btn studio-back-link" @click="onBackToOrigin">
          <i class="material-symbols-outlined">arrow_back</i>返回原本的對話
        </button>
        <div class="studio-origin-bar">
          <i class="material-symbols-outlined">history</i>來自本對話的「{{ handoffOrigin.reason }}」流程
        </div>
      </template>
      <SkillMethodChooser v-if="!conv.draft.value.method" @choose="conv.chooseMethod" />
      <SkillStudioChat
        v-else-if="conv.draft.value.method === 'chat'"
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
      <div v-else class="studio-composer-col">
        <div class="studio-composer-head">
          <span :class="['ssc-mode-chip', `ssc-mode-chip--${conv.mode.value}`]">
            <i class="material-symbols-outlined">dashboard_customize</i>{{ conv.mode.value === 'create' ? '用行銷積木組裝' : `修改：${conv.draft.value.name}` }}
          </span>
          <button type="button" class="custom-btn studio-new-btn" @click="onNewSkill">
            <i class="material-symbols-outlined">add</i>建立新技能
          </button>
        </div>
        <SkillBlockComposer
          :name="conv.draft.value.name"
          :description="conv.draft.value.description"
          :section-ids="conv.draft.value.sectionIds"
          :name-conflict="nameConflict"
          @update:name="v => conv.updateBlocks({ name: v })"
          @update:description="v => conv.updateBlocks({ description: v })"
          @update:section-ids="ids => conv.updateBlocks({ sectionIds: ids })"
        />
      </div>
    </div>
    <div class="studio-side-col">
      <SkillStudioPreview
        v-model:active-tab="activeTab"
        :draft="conv.draft.value"
        :mode="conv.mode.value"
        :saved-skill-id="conv.savedSkillId.value"
        :is-dirty="conv.isDirty.value"
        :can-save="conv.canSave.value"
        :name-conflict="nameConflict"
        @save="onSave"
        @update:files="conv.updateFiles"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { LocationQuery } from 'vue-router'
import SkillStudioChat from '@/components/Skill/SkillStudioChat.vue'
import SkillStudioPreview from '@/components/Skill/SkillStudioPreview.vue'
import SkillMethodChooser from '@/components/Skill/SkillMethodChooser.vue'
import SkillBlockComposer from '@/components/Skill/SkillBlockComposer.vue'
import { useSkillStore } from '@/stores/skillStore'
import { useAiviewerStore } from '@/stores/AiViewerStore'
import { useSkillStudioConversation } from '@/composables/useSkillStudioConversation'
import { consumeSkillHandoff } from '@/composables/useSkillHandoff'
import type { SkillHandoffOrigin } from '@/composables/useSkillHandoff'
import popDialog from '@/services/popDialog'

// 外殼（頁面／抽屜）只認得「query 長什麼樣子」，不用知道 conv 內部狀態——
// 初次掛載讀 initialQuery；之後外殼自己的路由守衛通過後，用 defineExpose 出去的
// applyQuery() 重新套用，跟現在 SkillStudio.vue 的 applyQuery() 呼叫時機一致
const props = defineProps<{ initialQuery?: LocationQuery }>()

const router = useRouter()
const store = useSkillStore()
const aiviewerStore = useAiviewerStore()
const conv = useSkillStudioConversation()
const activeTab = ref<'preview' | 'test'>('preview')
// 方案三：conv4 的建議卡按「是」交接過來的來源；只在真的套用了交接草稿時設，
// 換去別的技能／重新開一顆新技能後清空——「返回原對話」連結才不會誤導
const handoffOrigin = ref<SkillHandoffOrigin | null>(null)

const nameConflict = computed(() => {
  const n = conv.draft.value.name.trim()
  return !!n && store.myPersonalSkills.some(s => s.id !== conv.savedSkillId.value && s.name === n)
})

// ?skillId= 進修改模式；找不到／不是個人技能都退回建立模式，不拋錯。
// ?from= 是方案三的 conv4 交接：consumeSkillHandoff() 有值才套用預填草稿並記住
// 返回連結；讀不到（例如重新整理過頁面、交接資料已被用掉）就退回一般建立模式。
function applyQuery(query: LocationQuery) {
  activeTab.value = query.tab === 'test' ? 'test' : 'preview'
  const skillId = typeof query.skillId === 'string' ? query.skillId : ''
  if (skillId) {
    const skill = store.findSkill(skillId)
    if (!skill) {
      popDialog.toast('找不到這個技能')
    } else if (skill.zone !== 'personal') {
      popDialog.toast('Library 技能請先在技能管理複製為個人技能')
    } else if (conv.loadSkill(skillId)) {
      return
    }
  } else if (query.from) {
    const handoff = consumeSkillHandoff()
    if (handoff) {
      handoffOrigin.value = handoff.origin
      conv.startCreate(handoff.prefill, handoff.openingMessage)
      activeTab.value = 'preview'
      return
    }
  }
  conv.startCreate()
  // ?method= 是從技能管理「建立技能」選擇框直接指定的方式（對話／積木），
  // 讓使用者不用進來又被 SkillMethodChooser 問一次同樣的問題
  if (query.method === 'chat' || query.method === 'blocks') {
    conv.chooseMethod(query.method)
  }
  activeTab.value = 'preview'
}

// 方案三：真的存過技能才補一句「已建立」——回去晃一圈但沒存，代理人沒東西好回報
function onBackToOrigin() {
  guardDirty(() => {
    if (handoffOrigin.value?.conversationId === 'conv4' && conv.savedSkillId.value) {
      aiviewerStore.pushConv4Message({ agent: 'brain', msg: `✅ 個人技能「${conv.draft.value.name}」已建立完成。` })
    }
    router.push({ name: 'AiViewer' })
  })
}

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
    handoffOrigin.value = null
  })
}

function onNewSkill() {
  guardDirty(() => {
    conv.startCreate()
    activeTab.value = 'preview'
    handoffOrigin.value = null
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

onMounted(() => {
  applyQuery(props.initialQuery ?? {})
})

defineExpose({
  isDirty: conv.isDirty,
  mode: conv.mode,
  skillName: computed(() => conv.draft.value.name),
  applyQuery,
})
</script>
```

- [ ] **Step 2: 把 `SkillStudio.vue` 改寫成薄頁面殼，委派給 `SkillStudioWorkspace`**

整份取代 `src/views/SkillStudio.vue`：

```vue
<template>
  <div class="SkillStudio views-page">
    <div class="views-page-content-box">
      <div class="page-banner">
        <div>
          <AppBreadcrumb />
          <div class="banner-title">{{ workspaceRef?.mode === 'edit' ? '修改技能' : '新增技能' }}</div>
        </div>
      </div>

      <SkillStudioWorkspace ref="workspaceRef" :initial-query="route.query" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import SkillStudioWorkspace from '@/components/Skill/SkillStudioWorkspace.vue'
import popDialog from '@/services/popDialog'

const route = useRoute()
const workspaceRef = ref<InstanceType<typeof SkillStudioWorkspace> | null>(null)

onBeforeRouteUpdate((to, _from, next) => {
  if (!workspaceRef.value?.isDirty) {
    workspaceRef.value?.applyQuery(to.query)
    return next()
  }
  popDialog.confirm('有未儲存的變更，確定要放棄嗎？', '放棄變更', '留下', () => {
    workspaceRef.value?.applyQuery(to.query)
    next()
  }, () => next(false))
})

onBeforeRouteLeave((_to, _from, next) => {
  if (!workspaceRef.value?.isDirty) return next()
  popDialog.confirm('有未儲存的變更，確定離開？', '離開', '留下', () => next(), () => next(false))
})
</script>
```

**重要（IMPORTANT）**：`workspaceRef` 是指向 `SkillStudioWorkspace` 元件實例的 template ref，`isDirty`/`mode`/`skillName` 是透過該元件的 `defineExpose()` 暴露出來的。Vue 3 對 `defineExpose` 出去的物件會自動 unwrap 一層 ref（跟 `<script setup>` 頂層 ref 在自己模板裡自動 unwrap 是同一套機制，只是這次是透過子元件的 public instance proxy），所以從父層透過 `workspaceRef.value.isDirty`／`workspaceRef?.mode`／`workspaceRef?.skillName` 拿到的**已經是 unwrap 過的原始值**（boolean／字串），不要再多接一個 `.value`——多接的話會讀到 `undefined`，产生「永遠等於預設值」這種難以察覺的錯誤（本任務第一輪實作＋審查就是抓到這個問題）。這條規則套用到這份計畫裡**所有**透過 `workspaceRef`／`drawerRef` 存取 `isDirty`/`mode`/`skillName` 的地方，後面的 Task 2/3/4 一律不要加這個 `.value`。

注意：這一步先保留原本純文字的 `.banner-title`（「新增技能」/「修改技能」，不含 `ssc-mode-chip` 徽章），因為徽章邏輯要等 Task 2 抽出 `SkillStudioModeHeader.vue` 才接上——這步只驗證「工作區搬家後行為不變」，不要在同一步裡混入 Task 2 的改動。

- [ ] **Step 3: 跑現有測試，確認搬家後行為沒變**

Run: `npm run test:unit -- src/views/__tests__/SkillStudio.test.ts`

Expected: **2 個測試會失敗**——`渲染 banner 標題與左右兩欄版面：建立模式顯示「新增技能」＋建立 chip` 和 `?skillId= 個人技能：banner 顯示「修改技能」＋修改 chip（含技能名稱）`，因為它們斷言 `.banner-title-row .ssc-mode-chip` 存在，但 Step 2 刻意還沒接上徽章。其餘 20 個測試應該全部 PASS（這才是這一步真正要驗證的：工作區搬家沒有破壞任何既有行為）。

- [ ] **Step 4: Commit**

```bash
git add src/components/Skill/SkillStudioWorkspace.vue src/views/SkillStudio.vue
git commit -m "refactor(skill-studio): extract SkillStudioWorkspace from SkillStudio page shell"
```

---

## Task 2: 抽出 `SkillStudioModeHeader.vue`，頁面殼接回徽章

**Files:**
- Create: `src/components/Skill/SkillStudioModeHeader.vue`
- Create: `src/components/__tests__/SkillStudioModeHeader.test.ts`
- Modify: `src/views/SkillStudio.vue:6-9`（把 Task 1 暫時寫的純文字標題換成這個元件）

**Interfaces:**
- Consumes：`StudioMode` type from `@/composables/useSkillStudioConversation`（Task 1 已存在）
- Produces：`SkillStudioModeHeader` props `{ mode: StudioMode; skillName: string }`，渲染 `.banner-title-row`（含 `.banner-title` + `.ssc-mode-chip`），供 Task 1 的頁面殼與 Task 3 的抽屜殼共用

- [ ] **Step 1: 寫 `SkillStudioModeHeader.test.ts`（先寫失敗測試）**

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SkillStudioModeHeader from '@/components/Skill/SkillStudioModeHeader.vue'

describe('SkillStudioModeHeader', () => {
  it('建立模式：標題「新增技能」＋建立色系 chip', () => {
    const wrapper = mount(SkillStudioModeHeader, { props: { mode: 'create', skillName: '' } })
    expect(wrapper.find('.banner-title').text()).toBe('新增技能')
    expect(wrapper.find('.ssc-mode-chip').classes()).toContain('ssc-mode-chip--create')
    expect(wrapper.find('.ssc-mode-chip').text()).toContain('建立新技能')
  })

  it('修改模式：標題「修改技能」＋修改色系 chip，內含技能名稱', () => {
    const wrapper = mount(SkillStudioModeHeader, { props: { mode: 'edit', skillName: '週報自動生成' } })
    expect(wrapper.find('.banner-title').text()).toBe('修改技能')
    expect(wrapper.find('.ssc-mode-chip').classes()).toContain('ssc-mode-chip--edit')
    expect(wrapper.find('.ssc-mode-chip').text()).toContain('修改：週報自動生成')
  })
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npm run test:unit -- src/components/__tests__/SkillStudioModeHeader.test.ts`
Expected: FAIL — 找不到 `@/components/Skill/SkillStudioModeHeader.vue`

- [ ] **Step 3: 建立 `SkillStudioModeHeader.vue`**

```vue
<template>
  <div class="banner-title-row">
    <div class="banner-title">{{ props.mode === 'create' ? '新增技能' : '修改技能' }}</div>
    <span :class="['ssc-mode-chip', `ssc-mode-chip--${props.mode}`]">
      <i class="material-symbols-outlined">{{ props.mode === 'create' ? 'auto_fix_high' : 'person' }}</i>
      {{ props.mode === 'create' ? '建立新技能' : `修改：${props.skillName}` }}
    </span>
  </div>
</template>

<script setup lang="ts">
import type { StudioMode } from '@/composables/useSkillStudioConversation'

const props = defineProps<{ mode: StudioMode; skillName: string }>()
</script>
```

- [ ] **Step 4: 跑測試確認通過**

Run: `npm run test:unit -- src/components/__tests__/SkillStudioModeHeader.test.ts`
Expected: PASS（2 個測試）

- [ ] **Step 5: `SkillStudio.vue` 接回徽章**

修改 `src/views/SkillStudio.vue` 的 `<template>`，把 Task 1 暫時寫的純文字標題：

```html
<div class="page-banner">
  <div>
    <AppBreadcrumb />
    <div class="banner-title">{{ workspaceRef?.mode === 'edit' ? '修改技能' : '新增技能' }}</div>
  </div>
</div>
```

換成：

```html
<div class="page-banner">
  <div>
    <AppBreadcrumb />
    <SkillStudioModeHeader
      :mode="workspaceRef?.mode ?? 'create'"
      :skill-name="workspaceRef?.skillName ?? ''"
    />
  </div>
</div>
```

（`workspaceRef?.mode`／`workspaceRef?.skillName` 不加 `.value`——Task 1 結尾已經說明過，透過 `defineExpose` 暴露出來的 ref 在父層讀取時已經自動 unwrap 過了。）

並在 `<script setup>` 加一行 import：

```ts
import SkillStudioModeHeader from '@/components/Skill/SkillStudioModeHeader.vue'
```

- [ ] **Step 6: 跑 `SkillStudio.test.ts`，確認全部（含徽章斷言）通過**

Run: `npm run test:unit -- src/views/__tests__/SkillStudio.test.ts`
Expected: PASS，22 個測試全綠（Task 1 Step 3 提到的那 2 個徽章測試這次應該通過了）

- [ ] **Step 7: Commit**

```bash
git add src/components/Skill/SkillStudioModeHeader.vue src/components/__tests__/SkillStudioModeHeader.test.ts src/views/SkillStudio.vue
git commit -m "refactor(skill-studio): extract SkillStudioModeHeader shared by page shell and drawer"
```

---

## Task 3: 新增 `SkillStudioDrawer.vue`（尚未接上 SkillManagement）

**Files:**
- Create: `src/components/Skill/SkillStudioDrawer.vue`
- Create: `src/scss/components/_SkillStudioDrawer.scss`
- Modify: `src/scss/components/_index.scss`（新增一行 `@import`）
- Create: `src/components/__tests__/SkillStudioDrawer.test.ts`

**Interfaces:**
- Consumes：`SkillStudioWorkspace`（Task 1）、`SkillStudioModeHeader`（Task 2）
- Produces：`SkillStudioDrawer` props `{ open: boolean; query: LocationQuery }`，emits `close`，`defineExpose({ isDirty: ComputedRef<boolean>, applyQuery: (query: LocationQuery) => void })`——這個介面就是 Task 4 要接進 `SkillManagement.vue` 的那組

- [ ] **Step 1: 寫 `SkillStudioDrawer.test.ts`（先寫失敗測試）**

```ts
import { describe, it, expect } from 'vitest'
import { mount, DOMWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SkillStudioDrawer from '@/components/Skill/SkillStudioDrawer.vue'

describe('SkillStudioDrawer', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('open=false：不渲染面板內容', () => {
    const wrapper = mount(SkillStudioDrawer, { props: { open: false, query: {} } })
    expect(wrapper.find('.ssd-panel').exists()).toBe(false)
  })

  it('open=true：渲染面板、標題徽章、工作區', async () => {
    const wrapper = mount(SkillStudioDrawer, { props: { open: true, query: { method: 'chat' } } })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.ssd-panel').exists()).toBe(true)
    expect(wrapper.find('.banner-title').text()).toBe('新增技能')
    expect(wrapper.find('.SkillStudioChat').exists()).toBe(true)
  })

  it('點背景遮罩觸發 close', async () => {
    const wrapper = mount(SkillStudioDrawer, { props: { open: true, query: {} } })
    await wrapper.find('.ssd-mask').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('點右上角關閉鈕觸發 close', async () => {
    const wrapper = mount(SkillStudioDrawer, { props: { open: true, query: {} } })
    await wrapper.find('.ssd-close-btn').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('exposed isDirty 反映內部工作區的未儲存狀態；關閉時為 false', async () => {
    const wrapper = mount(SkillStudioDrawer, { props: { open: false, query: {} } })
    expect((wrapper.vm as any).isDirty).toBe(false)
  })
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npm run test:unit -- src/components/__tests__/SkillStudioDrawer.test.ts`
Expected: FAIL — 找不到 `@/components/Skill/SkillStudioDrawer.vue`

- [ ] **Step 3: 建立 `SkillStudioDrawer.vue`**

```vue
<template>
  <Teleport to="body">
    <Transition name="ssd-fade">
      <div v-if="props.open" class="SkillStudioDrawer">
        <div class="ssd-mask" @click="emit('close')" />
        <div class="ssd-panel">
          <div class="ssd-head">
            <SkillStudioModeHeader
              :mode="workspaceRef?.mode ?? 'create'"
              :skill-name="workspaceRef?.skillName ?? ''"
            />
            <button type="button" class="ssd-close-btn" @click="emit('close')">
              <i class="material-symbols-outlined">close</i>
            </button>
          </div>
          <div class="ssd-body">
            <SkillStudioWorkspace ref="workspaceRef" :initial-query="props.query" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { LocationQuery } from 'vue-router'
import SkillStudioWorkspace from '@/components/Skill/SkillStudioWorkspace.vue'
import SkillStudioModeHeader from '@/components/Skill/SkillStudioModeHeader.vue'

const props = defineProps<{ open: boolean; query: LocationQuery }>()
const emit = defineEmits<{ close: [] }>()

const workspaceRef = ref<InstanceType<typeof SkillStudioWorkspace> | null>(null)

defineExpose({
  isDirty: computed(() => workspaceRef.value?.isDirty ?? false),
  applyQuery: (q: LocationQuery) => workspaceRef.value?.applyQuery(q),
})
</script>
```

（同 Task 1 結尾的重要提醒：`workspaceRef.value?.isDirty` 不加 `.value`——`defineExpose` 出去的 ref 在父層讀取時已經自動 unwrap 過了。）

- [ ] **Step 4: 建立 `_SkillStudioDrawer.scss`**

```scss
// ── SkillStudioDrawer：技能管理頁點「建立/編輯」時，用近全螢幕的側邊抽屜取代整頁導頁 ──
// 版型抄 _SkillTest.scss 的 .st-context-drawer（真的從右側滑入的抽屜），
// 不是 _SkillDetailDrawer.scss 的 .drawer-panel（那個叫 Drawer 但其實是置中
// scale+fade 的 modal——技能管理過去就是因為那種小 modal 太擠才改走獨立頁面，
// 見 SkillManagement.vue:762-763 的註解，不要走回頭路）
.SkillStudioDrawer {
  position: fixed;
  inset: 0;
  z-index: 500;

  .ssd-mask {
    position: absolute;
    inset: 0;
    background: rgba(9, 21, 26, 0.35);
    backdrop-filter: blur(4px);
  }

  .ssd-panel {
    position: absolute;
    top: 0;
    right: 0;
    width: calc(100vw - 64px);
    max-width: 1400px;
    height: 100vh;
    background: var(--surface);
    box-shadow: -8px 0 32px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    overflow: hidden;

    @media (max-width: 1023px) { width: 100vw; max-width: none; }
  }

  .ssd-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--divider-a50);
    flex-shrink: 0;
  }

  .ssd-close-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid var(--divider-a50);
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    flex-shrink: 0;

    .material-symbols-outlined { font-size: 18px; }
    &:hover { background: var(--page-bg); color: var(--text); }
  }

  .ssd-body {
    flex: 1;
    min-height: 0;
    display: flex;

    // .skill-studio-layout 原本假設自己套在 .page-banner 之下，用
    // calc(100vh - 172px) 抓高度；抽屜的頭比 page-banner 矮，且已經是
    // flex 子層，直接吃滿剩餘高度即可，邊框/圓角交給 .ssd-panel 處理
    .skill-studio-layout {
      height: 100%;
      border: none;
      border-radius: 0;
    }
  }
}

// 抽屜進出場：從右側滑入
.ssd-fade-enter-active,
.ssd-fade-leave-active {
  transition: opacity 0.2s ease;
  .ssd-panel { transition: transform 0.22s cubic-bezier(0.34, 1.2, 0.64, 1); }
}
.ssd-fade-enter-from,
.ssd-fade-leave-to {
  opacity: 0;
  .ssd-panel { transform: translateX(100%); }
}

@media (prefers-reduced-motion: reduce) {
  .ssd-fade-enter-active,
  .ssd-fade-leave-active {
    transition: opacity 0.1s linear;
    .ssd-panel { transition: none; }
  }
  .ssd-fade-enter-from,
  .ssd-fade-leave-to {
    .ssd-panel { transform: none; }
  }
}
```

- [ ] **Step 5: 註冊進 `_index.scss`**

修改 `src/scss/components/_index.scss`，在 `@import "./SkillReviewDrawer";` 之後加一行（跟其他 Skill 系列元件放一起）：

```scss
@import "./SkillStudioDrawer";
```

- [ ] **Step 6: 跑測試確認通過**

Run: `npm run test:unit -- src/components/__tests__/SkillStudioDrawer.test.ts`
Expected: PASS（5 個測試）

- [ ] **Step 7: Commit**

```bash
git add src/components/Skill/SkillStudioDrawer.vue src/components/__tests__/SkillStudioDrawer.test.ts src/scss/components/_SkillStudioDrawer.scss src/scss/components/_index.scss
git commit -m "feat(skill-studio): add SkillStudioDrawer shell (not wired into SkillManagement yet)"
```

---

## Task 4: `SkillManagement.vue` 掛上抽屜、改四個入口點、加路由守衛

**這個 task 執行途中發現的範圍調整**：原始 spec 只列了 3 個入口點（建立/編輯/建議佇列建立），但實際檢查 `SkillManagement.vue` 發現還有第 4 個——啟用前測試閘門對話框裡的「去修改技能內容」按鈕（`handleEnableGateRevise`，:839-844），做的事跟「編輯」入口的 `handleChatEdit`完全一樣（push 到 SkillStudio 帶 skillId）。已跟使用者確認，這個也一併改成抽屜，保持所有「從技能管理頁觸發、導去 SkillStudio 帶 skillId/method/from」的入口行為一致，不留下一個顯示方式不一致的例外。

**Files:**
- Modify: `src/views/SkillManagement.vue`
- Modify: `src/views/__tests__/SkillManagement.createChoice.test.ts`
- Modify: `src/views/__tests__/SkillManagement.blockEditChoice.test.ts`
- Modify: `src/views/__tests__/SkillManagement.suggestions.test.ts`
- Modify: `src/views/__tests__/SkillManagement.enableGate.test.ts`
- Modify: `src/views/__tests__/SkillManagement.teamCards.test.ts`
- Modify: `src/views/__tests__/SkillManagement.liveliness.test.ts`

**Interfaces:**
- Consumes：`SkillStudioDrawer`（Task 3）的 `{ open, query }` props / `close` emit / `defineExpose({ isDirty, applyQuery })`

- [ ] **Step 1: `SkillManagement.vue` 加 import 與路由相關 state**

在 `src/views/SkillManagement.vue:548-549` 的 import 區塊，把：

```ts
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
```

改成：

```ts
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
```

在 `src/views/SkillManagement.vue:559` 之後（`import { setSkillHandoff } from '@/composables/useSkillHandoff'` 那行下面）加兩行（`popDialog` 這個檔案目前完全沒 import 過——它自己的確認對話框都是用內建的 Teleport + ref 手刻，不是走 `popDialog` service，不要假設它已經存在）：

```ts
import SkillStudioDrawer from '@/components/Skill/SkillStudioDrawer.vue'
import popDialog from '@/services/popDialog'
```

在 `src/views/SkillManagement.vue:564`（`const router = useRouter()` 那行）之後加：

```ts
const route = useRoute()
const drawerRef = ref<InstanceType<typeof SkillStudioDrawer> | null>(null)

// 抽屜開關與內容完全由這三個既有 query 參數決定，不新增額外旗標——
// 跟 SkillStudioWorkspace.applyQuery() 判斷式用的是同一組參數
const drawerOpen = computed(() => !!(route.query.skillId || route.query.method || route.query.from))
const drawerQuery = computed(() => ({
  skillId: route.query.skillId,
  method: route.query.method,
  from: route.query.from,
  tab: route.query.tab,
}))

function closeDrawer() {
  router.push({ path: '/view/Skills' })
}

// 抽屜開著且有未儲存變更時，換編輯目標／關閉抽屜都要先確認——
// 邏輯跟 SkillStudio.vue（頁面殼）的 onBeforeRouteUpdate 一模一樣，只是搬到這裡，
// 因為抽屜開關本身就是同一個 /view/Skills 路由上的 query 變化
onBeforeRouteUpdate((to, _from, next) => {
  if (!drawerRef.value?.isDirty) {
    drawerRef.value?.applyQuery({ skillId: to.query.skillId, method: to.query.method, from: to.query.from, tab: to.query.tab })
    return next()
  }
  popDialog.confirm('有未儲存的變更，確定要放棄嗎？', '放棄變更', '留下', () => {
    drawerRef.value?.applyQuery({ skillId: to.query.skillId, method: to.query.method, from: to.query.from, tab: to.query.tab })
    next()
  }, () => next(false))
})

// 抽屜開著且有未儲存變更時，從左側導覽離開 /view/Skills 也要先確認
onBeforeRouteLeave((_to, _from, next) => {
  if (!drawerRef.value?.isDirty) return next()
  popDialog.confirm('有未儲存的變更，確定離開？', '離開', '留下', () => next(), () => next(false))
})
```

（同前面 Task 1/3 的提醒：`drawerRef.value?.isDirty` 不加 `.value`——`SkillStudioDrawer` 自己 `defineExpose` 出去的 `isDirty` 是個 `computed`，一樣會被父層的 public instance proxy 自動 unwrap。）

- [ ] **Step 2: 改四個入口點，push query 而不是換路由名稱**

`src/views/SkillManagement.vue:678-686`（`buildSuggestion`）：

```ts
function buildSuggestion(s: SkillSuggestionEntry) {
  setSkillHandoff({
    prefill: suggestionToPrefill(s),
    openingMessage: suggestionOpeningMessage(s),
    origin: { conversationId: s.conversationId, reason: s.reason },
  })
  store.dismissSuggestion(s.id)
  router.push({ query: { from: s.conversationId } })
}
```

`src/views/SkillManagement.vue:692-699`（`handleCreateWithChat`/`handleCreateWithBlocks`）：

```ts
function handleCreateWithChat() {
  showCreateChoice.value = false
  router.push({ query: { method: 'chat' } })
}
function handleCreateWithBlocks() {
  showCreateChoice.value = false
  router.push({ query: { method: 'blocks' } })
}
```

`src/views/SkillManagement.vue:764-769`（`handleChatEdit`）：

```ts
function handleChatEdit() {
  if (!editChoiceSkill.value) return
  const skillId = editChoiceSkill.value.id
  editChoiceSkill.value = null
  router.push({ query: { skillId } })
}
```

`src/views/SkillManagement.vue:839-844`（`handleEnableGateRevise`，本 task 開頭提到的第 4 個入口點）：

```ts
function handleEnableGateRevise() {
  if (!enableGateSkill.value) return
  const skillId = enableGateSkill.value.id
  enableGateSkill.value = null
  router.push({ query: { skillId } })
}
```

（`handleCreateManually`、`handleDirectEdit`、`handleEnableGateOverride` 不動：前兩個導去 `/view/SkillEditor`，跟這次改動無關；`handleEnableGateOverride` 根本不導頁。）

- [ ] **Step 3: 模板掛上 `<SkillStudioDrawer>`**

在 `src/views/SkillManagement.vue:261` 的 `</BatchUpdateModal>`（見既有的 `<!-- Drawers -->` 區塊）之後加：

```html
<SkillStudioDrawer
  ref="drawerRef"
  :open="drawerOpen"
  :query="drawerQuery"
  @close="closeDrawer"
/>
```

- [ ] **Step 4: 修有共用 `mountPage()` helper 的 4 個檔案（createChoice/blockEditChoice/suggestions/enableGate）**

`onBeforeRouteUpdate`/`onBeforeRouteLeave` 這兩個 composition API 守衛，在元件沒有被掛在一個「匹配到的路由記錄」底下時只會印警告、不會真的註冊（同 `SkillStudio.test.ts` 頂部註解提到的「No active route record was found」）。以下四個檔案的 `mountPage()` 目前是直接 `mount(SkillManagement, ...)`，不經過 `<router-view>`，Task 4 加了守衛之後這樣掛載會讓守衛完全不生效——修法是比照 `SkillStudio.test.ts` 的 `mountAt()` 寫法，改成註冊 `/view/Skills` 路由、`router.push` 過去、掛 `<router-view/>`，並把 `mountPage` 改成 `async`。

`src/views/__tests__/SkillManagement.createChoice.test.ts:20-34` 的 `mountPage()`，把：

```ts
  function mountPage() {
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div/>' } },
        { path: '/view/SkillStudio', name: 'SkillStudio', component: { template: '<div/>' } },
        { path: '/view/SkillEditor', name: 'SkillEditor', component: { template: '<div/>' } },
      ],
    })
    const wrapper = mount(SkillManagement, {
      global: { plugins: [router], stubs: { AppBreadcrumb: true, LibraryBrowseModal: true, SkillDetailDrawer: true, UpstreamUpdateDrawer: true, SkillReviewDrawer: true, BatchUpdateModal: true } },
    })
    currentWrapper = wrapper
    return { wrapper, router }
  }
```

改成：

```ts
  async function mountPage() {
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div/>' } },
        { path: '/view/Skills', name: 'SkillManagement', component: SkillManagement },
        { path: '/view/SkillEditor', name: 'SkillEditor', component: { template: '<div/>' } },
      ],
    })
    await router.push('/view/Skills')
    await router.isReady()
    const wrapper = mount(
      { template: '<router-view />' },
      { global: { plugins: [router], stubs: { AppBreadcrumb: true, LibraryBrowseModal: true, SkillDetailDrawer: true, UpstreamUpdateDrawer: true, SkillReviewDrawer: true, BatchUpdateModal: true } } },
    )
    currentWrapper = wrapper
    return { wrapper: wrapper.findComponent(SkillManagement), router }
  }
```

這個檔案有 4 個呼叫點要補 `await`：`:38`、`:54`、`:68`、`:82`（都是 `const { wrapper, router } = mountPage()` 改成 `const { wrapper, router } = await mountPage()`）。

同樣的改法（helper 改 async + 內容改成 router-view 掛載）套用到：

- `src/views/__tests__/SkillManagement.blockEditChoice.test.ts:21-35`——呼叫點在 `:39`、`:67`、`:82`，都要補 `await`
- `src/views/__tests__/SkillManagement.suggestions.test.ts:19-33`——呼叫點在 `:37`、`:49`、`:64`、`:84`，都要補 `await`
- `src/views/__tests__/SkillManagement.enableGate.test.ts:18-32`——這個檔案的 stub 清單少一個 `SkillDetailDrawer`（原本就沒有，維持原樣即可，不用補），呼叫點在 `:38`、`:56`、`:73`、`:96`、`:109`、`:128`，都要補 `await`

- [ ] **Step 5: 修沒有共用 helper、每個 `it()` 各自 inline 掛載的 2 個檔案（teamCards/liveliness）**

`src/views/__tests__/SkillManagement.teamCards.test.ts` 沒有 `mountPage()` helper，兩個 `it()` 各自 inline 一份掛載邏輯，要分別修：

第一個 `it()`（:9-29，`'團隊技能區塊改為多欄卡片...'`），把 `:11-14`：

```ts
    const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    const wrapper = mount(SkillManagement, {
      global: { plugins: [router], stubs: { AppBreadcrumb: true, LibraryBrowseModal: true, SkillDetailDrawer: true, UpstreamUpdateDrawer: true, SkillReviewDrawer: true, BatchUpdateModal: true } },
    })
```

改成：

```ts
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div/>' } },
        { path: '/view/Skills', name: 'SkillManagement', component: SkillManagement },
      ],
    })
    await router.push('/view/Skills')
    await router.isReady()
    const rootWrapper = mount(
      { template: '<router-view />' },
      { global: { plugins: [router], stubs: { AppBreadcrumb: true, LibraryBrowseModal: true, SkillDetailDrawer: true, UpstreamUpdateDrawer: true, SkillReviewDrawer: true, BatchUpdateModal: true } } },
    )
    const wrapper = rootWrapper.findComponent(SkillManagement)
```

第二個 `it()`（:31-54，`'「跟 Agent 對話修改」導向 AI 賦能並帶 skillId'`），把 `:33-42`：

```ts
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div/>' } },
        { path: '/view/SkillStudio', name: 'SkillStudio', component: { template: '<div/>' } },
      ],
    })
    const wrapper = mount(SkillManagement, {
      global: { plugins: [router], stubs: { AppBreadcrumb: true, LibraryBrowseModal: true, SkillDetailDrawer: true, UpstreamUpdateDrawer: true, SkillReviewDrawer: true, BatchUpdateModal: true } },
    })
```

改成：

```ts
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div/>' } },
        { path: '/view/Skills', name: 'SkillManagement', component: SkillManagement },
      ],
    })
    await router.push('/view/Skills')
    await router.isReady()
    const rootWrapper = mount(
      { template: '<router-view />' },
      { global: { plugins: [router], stubs: { AppBreadcrumb: true, LibraryBrowseModal: true, SkillDetailDrawer: true, UpstreamUpdateDrawer: true, SkillReviewDrawer: true, BatchUpdateModal: true } } },
    )
    const wrapper = rootWrapper.findComponent(SkillManagement)
```

`src/views/__tests__/SkillManagement.liveliness.test.ts` 同樣只有一個 `it()`、inline 掛載，把 `:12-15`：

```ts
    const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    const wrapper = mount(SkillManagement, {
      global: { plugins: [router], stubs: { AppBreadcrumb: true, LibraryBrowseModal: true, SkillDetailDrawer: true, UpstreamUpdateDrawer: true, SkillReviewDrawer: true, BatchUpdateModal: true } },
    })
```

改成跟上面 teamCards 第一個 `it()` 完全一樣的替換內容（`router` 註冊 `/view/Skills`、push+isReady、`rootWrapper`/`wrapper = rootWrapper.findComponent(SkillManagement)`）。這個檔案裡的 `it('...', () => {...})` 目前是同步的，要記得連同改成 `async () => {...}` 才能用 `await router.push(...)`。

- [ ] **Step 6: 更新 5 個檔案裡跟這次入口點改動有關的 `push` 斷言**

`src/views/__tests__/SkillManagement.createChoice.test.ts:62`：

```ts
    expect(push).toHaveBeenCalledWith({ query: { method: 'chat' } })
```

同檔案 `:76`：

```ts
    expect(push).toHaveBeenCalledWith({ query: { method: 'blocks' } })
```

`src/views/__tests__/SkillManagement.blockEditChoice.test.ts:61`：

```ts
    expect(push).toHaveBeenCalledWith({ query: { skillId } })
```

`src/views/__tests__/SkillManagement.suggestions.test.ts:69`：

```ts
    expect(push).toHaveBeenCalledWith({ query: { from: 'conv4' } })
```

`src/views/__tests__/SkillManagement.teamCards.test.ts:52`（第二個 `it()`，斷言的是 `handleChatEdit`，跟 blockEditChoice 測的是同一個函式、不同技能情境）：

```ts
    expect(push).toHaveBeenCalledWith({ query: { skillId: skill.id } })
```

`src/views/__tests__/SkillManagement.enableGate.test.ts:82`（斷言的是本 task 新加進範圍的 `handleEnableGateRevise`）：

```ts
    expect(push).toHaveBeenCalledWith({ query: { skillId: id } })
```

`src/views/__tests__/SkillManagement.liveliness.test.ts` 不用改斷言（這個檔案完全不測導頁行為，只測統計列渲染）。

- [ ] **Step 7: 跑全部 SkillManagement 測試，確認通過**

Run: `npm run test:unit -- src/views/__tests__/SkillManagement`
Expected: PASS，全部檔案全綠

- [ ] **Step 8: 跑型別檢查**

Run: `npm run type-check`
Expected: 沒有新增的錯誤（既有的 `window.XLSX` 等第三方全域型別錯誤跟這次改動無關，忽略）

- [ ] **Step 9: Commit**

```bash
git add src/views/SkillManagement.vue src/views/__tests__/SkillManagement.createChoice.test.ts src/views/__tests__/SkillManagement.blockEditChoice.test.ts src/views/__tests__/SkillManagement.suggestions.test.ts src/views/__tests__/SkillManagement.enableGate.test.ts src/views/__tests__/SkillManagement.teamCards.test.ts src/views/__tests__/SkillManagement.liveliness.test.ts
git commit -m "feat(skill-studio): wire SkillStudioDrawer into SkillManagement entry points"
```

---

## Task 5: 新增 `SkillManagement.studioDrawer.test.ts`（抽屜行為專屬測試）

**Files:**
- Create: `src/views/__tests__/SkillManagement.studioDrawer.test.ts`

**Interfaces:**
- Consumes：Task 4 完成後的 `SkillManagement.vue`（`drawerOpen`/`drawerQuery`/`closeDrawer`/路由守衛）

- [ ] **Step 1: 寫測試**

```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SkillManagement from '../SkillManagement.vue'
import popDialog from '@/services/popDialog'
import { useSkillStore } from '@/stores/skillStore'

vi.mock('@/services/popDialog', () => ({
  default: { toast: vi.fn(), confirm: vi.fn(), alert: vi.fn() },
}))

describe('SkillManagement 抽屜：技能管理頁內建立/編輯不離開列表', () => {
  let currentWrapper: VueWrapper | null = null

  afterEach(() => {
    currentWrapper?.unmount()
    currentWrapper = null
    vi.clearAllMocks()
  })

  async function mountAt(query: Record<string, string> = {}) {
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div/>' } },
        { path: '/view/Skills', name: 'SkillManagement', component: SkillManagement },
        { path: '/view/SkillEditor', name: 'SkillEditor', component: { template: '<div/>' } },
        { path: '/view/AiViewer', name: 'AiViewer', component: { template: '<div/>' } },
      ],
    })
    await router.push({ path: '/view/Skills', query })
    await router.isReady()
    const wrapper = mount(
      { template: '<router-view />' },
      { global: { plugins: [router], stubs: { AppBreadcrumb: true, LibraryBrowseModal: true, SkillDetailDrawer: true, UpstreamUpdateDrawer: true, SkillReviewDrawer: true, BatchUpdateModal: true } } },
    )
    currentWrapper = wrapper
    await flushPromises()
    return { wrapper, router }
  }

  it('無 query：抽屜不顯示', async () => {
    setActivePinia(createPinia())
    const { wrapper } = await mountAt()
    expect(wrapper.find('.ssd-panel').exists()).toBe(false)
  })

  it('帶 ?method=chat 掛載：抽屜自動打開，直接進對話模式', async () => {
    setActivePinia(createPinia())
    const { wrapper } = await mountAt({ method: 'chat' })
    expect(wrapper.find('.ssd-panel').exists()).toBe(true)
    expect(wrapper.find('.SkillStudioChat').exists()).toBe(true)
  })

  it('帶 ?skillId= 掛載（重新整理／分享連結情境）：抽屜打開在修改模式，內容正確', async () => {
    setActivePinia(createPinia())
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '週報自動生成', instructions: '1. 產出週報', triggerHint: 't', assignedAgents: [] })
    const { wrapper } = await mountAt({ skillId: id })
    expect(wrapper.find('.ssd-panel').exists()).toBe(true)
    expect(wrapper.find('.banner-title').text()).toBe('修改技能')
    expect(wrapper.find('.ssp-title').text()).toBe('週報自動生成')
  })

  it('點 X 關閉：無未儲存變更時直接關閉，query 清空', async () => {
    setActivePinia(createPinia())
    const { wrapper, router } = await mountAt({ method: 'chat' })
    await wrapper.find('.ssd-close-btn').trigger('click')
    await flushPromises()
    expect(popDialog.confirm).not.toHaveBeenCalled()
    expect(wrapper.find('.ssd-panel').exists()).toBe(false)
    expect(router.currentRoute.value.query).toEqual({})
  })

  it('點背景遮罩關閉：有未儲存變更時跳確認，取消則抽屜不關閉', async () => {
    setActivePinia(createPinia())
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '週報自動生成', instructions: '1. 產出週報', triggerHint: 't', assignedAgents: [] })
    const { wrapper } = await mountAt({ skillId: id })
    // loadSkill() 之後 gateStage 已經是 'active'（修改模式不用再走一輪意圖分流），
    // 送一句改名訊息會直接命中 interpretStudioMessage 的改名規則，讓 draft 變 dirty，
    // 不用像建立模式那樣先走過整輪 gathering
    const input = wrapper.find('.SkillStudioChat input.custom-input')
    await input.setValue('名稱改成「暫存中的修改」')
    await input.trigger('keydown.enter')
    await new Promise(r => setTimeout(r, 850))
    await flushPromises()

    await wrapper.find('.ssd-mask').trigger('click')
    expect(popDialog.confirm).toHaveBeenCalledWith('有未儲存的變更，確定要放棄嗎？', '放棄變更', '留下', expect.any(Function), expect.any(Function))
    expect(wrapper.find('.ssd-panel').exists()).toBe(true)

    const [, , , onConfirm] = vi.mocked(popDialog.confirm).mock.calls[0]
    ;(onConfirm as () => void)()
    await flushPromises()
    expect(wrapper.find('.ssd-panel').exists()).toBe(false)
  })

  it('抽屜開著時點另一顆技能的「編輯」：先跳確認，確認後換成新的編輯目標', async () => {
    setActivePinia(createPinia())
    const store = useSkillStore()
    const idA = store.createPersonalSkill({ name: '技能A', instructions: '1. A', triggerHint: 't', assignedAgents: [] })
    const idB = store.createPersonalSkill({ name: '技能B', instructions: '1. B', triggerHint: 't', assignedAgents: [] })
    const { wrapper, router } = await mountAt({ skillId: idA })
    expect(wrapper.find('.banner-title-row .ssc-mode-chip').text()).toContain('修改：技能A')

    // 直接改路由 query 模擬「在列表上點另一顆技能的編輯」（真正點擊路徑已由
    // createChoice/blockEditChoice 測試覆蓋，這裡只驗證抽屜開著時 query 變化的守衛行為）
    await router.push({ query: { skillId: idB } })
    await flushPromises()
    expect(popDialog.confirm).not.toHaveBeenCalled() // 技能A 沒有未儲存變更
    expect(wrapper.find('.banner-title-row .ssc-mode-chip').text()).toContain('修改：技能B')
  })
})
```

- [ ] **Step 2: 跑測試**

Run: `npm run test:unit -- src/views/__tests__/SkillManagement.studioDrawer.test.ts`
Expected: PASS，7 個測試全綠。

- [ ] **Step 3: Commit**

```bash
git add src/views/__tests__/SkillManagement.studioDrawer.test.ts
git commit -m "test(skill-management): cover drawer open/close and dirty-guard behavior"
```

---

## Task 6: 拆分 `SkillStudio.test.ts` → 新增 `SkillStudioWorkspace.test.ts`，頁面殼測試瘦身

**Files:**
- Create: `src/components/__tests__/SkillStudioWorkspace.test.ts`
- Modify: `src/views/__tests__/SkillStudio.test.ts`（瘦身，只留頁面殼相關斷言）

**Interfaces:**
- Consumes：`SkillStudioWorkspace`（Task 1）的 `initialQuery` prop 與 `defineExpose({ isDirty, mode, skillName, applyQuery })`

- [ ] **Step 1: 建立 `SkillStudioWorkspace.test.ts`，把工作區行為測試從 `SkillStudio.test.ts` 搬過來**

直接掛載 `SkillStudioWorkspace`（不經過路由），把原本 `mountAt(query)` 的角色換成 `mount(SkillStudioWorkspace, { props: { initialQuery: query } })`；原本測 `.banner-title`/`.banner-title-row` 的斷言不搬（那是頁面殼/抽屜殼的職責，Task 2 的 `SkillStudioModeHeader.test.ts` 已經覆蓋）；原本用 `router.push({ path: '/view/SkillStudio' })` 觸發 `onBeforeRouteUpdate` 的測試，改用 `wrapper.vm.applyQuery({})` 直接呼叫 exposed 方法；原本用 `router` 斷言 `push` 目的地（conv4 返回連結）的測試維持用真實 `useRouter()`，因為 `onBackToOrigin` 仍然在 `SkillStudioWorkspace` 內部呼叫 `router.push({ name: 'AiViewer' })`。

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SkillStudioWorkspace from '@/components/Skill/SkillStudioWorkspace.vue'
import popDialog from '@/services/popDialog'
import { useSkillStore } from '@/stores/skillStore'
import { useAiviewerStore } from '@/stores/AiViewerStore'
import { setSkillHandoff, consumeSkillHandoff } from '@/composables/useSkillHandoff'

vi.mock('@/services/popDialog', () => ({
  default: { toast: vi.fn(), confirm: vi.fn(), alert: vi.fn() },
}))

async function chooseChat(wrapper: any) {
  await wrapper.findAll('.smc-card')[0].trigger('click')
  await flushPromises()
}

function mountWorkspace(initialQuery: Record<string, string> = {}) {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div/>' } },
      { path: '/view/AiViewer', name: 'AiViewer', component: { template: '<div/>' } },
    ],
  })
  const wrapper = mount(SkillStudioWorkspace, {
    props: { initialQuery },
    global: { plugins: [router] },
  })
  return { wrapper, router }
}

describe('SkillStudioWorkspace', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('無 initialQuery：建立模式，左側 chip「建立新技能」，右側預覽空狀態', async () => {
    const { wrapper } = mountWorkspace()
    await flushPromises()
    expect(wrapper.find('.SkillMethodChooser').exists()).toBe(true)
    expect(wrapper.find('.studio-chat-col .ssc-mode-chip').exists()).toBe(false)
    await chooseChat(wrapper)
    expect(wrapper.find('.studio-chat-col .ssc-mode-chip').text()).toContain('建立新技能')
    expect(wrapper.text()).toContain('尚未命名的技能')
  })

  it('method: chat：跳過 SkillMethodChooser，直接進對話模式', async () => {
    const { wrapper } = mountWorkspace({ method: 'chat' })
    await flushPromises()
    expect(wrapper.find('.SkillMethodChooser').exists()).toBe(false)
    expect(wrapper.find('.SkillStudioChat').exists()).toBe(true)
  })

  it('method: blocks：跳過 SkillMethodChooser，直接進積木面板', async () => {
    const { wrapper } = mountWorkspace({ method: 'blocks' })
    await flushPromises()
    expect(wrapper.find('.SkillMethodChooser').exists()).toBe(false)
    expect(wrapper.find('.SkillBlockComposer').exists()).toBe(true)
  })

  it('skillId 個人技能：修改模式，預覽帶入該技能內容', async () => {
    const { wrapper } = mountWorkspace({ skillId: 'personal-001' })
    await flushPromises()
    expect(wrapper.find('.ssc-mode-chip').text()).toContain('修改：週報自動生成')
    expect(wrapper.find('.ssp-title').text()).toBe('週報自動生成')
  })

  it('skillId 是 Library 技能：toast 提示並退回建立模式', async () => {
    const { wrapper } = mountWorkspace({ skillId: 'sys-cs-001' })
    await flushPromises()
    expect(popDialog.toast).toHaveBeenCalledWith('Library 技能請先在技能管理複製為個人技能')
    expect(wrapper.find('.SkillMethodChooser').exists()).toBe(true)
  })

  it('skillId 不存在：toast「找不到這個技能」並退回建立模式', async () => {
    const { wrapper } = mountWorkspace({ skillId: 'nope-999' })
    await flushPromises()
    expect(popDialog.toast).toHaveBeenCalledWith('找不到這個技能')
    expect(wrapper.find('.SkillMethodChooser').exists()).toBe(true)
  })

  it('tab: test：預設切到測試 tab', async () => {
    const { wrapper } = mountWorkspace({ skillId: 'personal-001', tab: 'test' })
    await flushPromises()
    expect(wrapper.findAll('.ssp-tab-btn')[1].classes()).toContain('is-active')
  })

  it('送出訊息 → 草稿更新 → 儲存 → 建立個人技能、toast、自動切到測試 tab', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      const { wrapper } = mountWorkspace()
      await flushPromises()
      await chooseChat(wrapper)
      const store = useSkillStore()
      store.myPersonalSkills.forEach(s => store.deletePersonalSkill(s.id))
      const before = store.myPersonalSkills.length
      const input = wrapper.find('.SkillStudioChat input.custom-input')
      await input.setValue('幫我建立一個能查 ERP 庫存的技能')
      await input.trigger('keydown.enter')
      await vi.advanceTimersByTimeAsync(800)
      await flushPromises()

      await input.setValue('沒有特殊例外')
      await input.trigger('keydown.enter')
      await vi.advanceTimersByTimeAsync(800)
      await flushPromises()

      await input.setValue('照標準流程執行')
      await input.trigger('keydown.enter')
      await vi.advanceTimersByTimeAsync(800)
      await flushPromises()

      await input.setValue('對，沒錯')
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
    const { wrapper } = mountWorkspace()
    await flushPromises()
    await chooseChat(wrapper)
    await wrapper.find('.ssc-skill-select').setValue('personal-001')
    await flushPromises()
    expect(wrapper.find('.ssc-mode-chip').text()).toContain('修改：週報自動生成')
  })

  it('exposed applyQuery：外部呼叫可以重新套用（模擬外殼守衛通過後的行為）', async () => {
    const { wrapper } = mountWorkspace({ skillId: 'personal-001' })
    await flushPromises()
    expect(wrapper.find('.ssc-mode-chip').text()).toContain('修改：週報自動生成')
    ;(wrapper.vm as any).applyQuery({})
    await flushPromises()
    expect(popDialog.confirm).not.toHaveBeenCalled()
    expect(wrapper.find('.SkillMethodChooser').exists()).toBe(true)
  })

  it('選「用行銷積木組裝」：左欄變成積木面板；勾章節、命名、儲存 → 個人技能有 composition', async () => {
    const { wrapper } = mountWorkspace()
    await flushPromises()
    await wrapper.findAll('.smc-card')[1].trigger('click')
    await flushPromises()
    expect(wrapper.find('.studio-chat-col .SkillBlockComposer').exists()).toBe(true)
    expect(wrapper.find('.SkillStudioChat').exists()).toBe(false)
    expect(wrapper.find('.studio-composer-head .ssc-mode-chip').classes()).toContain('ssc-mode-chip--create')
    await wrapper.find('.sbc-name-input').setValue('行銷週報')
    await wrapper.findAll('.sbc-palette-item').find(i => i.text().includes('活動排行'))!.find('.sbc-add-btn').trigger('click')
    await flushPromises()
    expect(wrapper.find('.ssp-title').text()).toBe('行銷週報')
    expect(wrapper.text()).toContain('活動排行：各促銷活動帶動效果排行')
    await wrapper.find('.ssp-save-btn').trigger('click')
    await flushPromises()
    const store = useSkillStore()
    expect(store.myPersonalSkills[0].composition).toEqual({ sectionIds: ['promo_ranking'] })
  })

  it('skillId 指向有 composition 的技能：左欄直接是積木面板且勾選還原', async () => {
    setActivePinia(createPinia())
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '渠道週報', instructions: '依序產出以下章節：\n1. 渠道核心 KPI', triggerHint: 't', isEnabled: true, assignedAgents: [], composition: { sectionIds: ['ch_kpi'] } })
    const { wrapper } = mountWorkspace({ skillId: id })
    await flushPromises()
    expect(wrapper.find('.SkillBlockComposer').exists()).toBe(true)
    expect(wrapper.findAll('.sbc-list .sbc-item-name').map(n => n.text())).toEqual(['渠道核心 KPI'])
    expect(wrapper.find('.studio-composer-head .ssc-mode-chip').classes()).toContain('ssc-mode-chip--edit')
  })

  it('積木方式的左欄也有「建立新技能」，點擊回到方式選擇', async () => {
    const { wrapper } = mountWorkspace()
    await flushPromises()
    await wrapper.findAll('.smc-card')[1].trigger('click')
    await flushPromises()
    await wrapper.find('.studio-new-btn').trigger('click')
    await flushPromises()
    expect(wrapper.find('.SkillMethodChooser').exists()).toBe(true)
  })

  describe('conv4 交接（方案三）', () => {
    it('from: conv4 但沒有交接資料：退回一般建立模式，不顯示返回連結', async () => {
      const { wrapper } = mountWorkspace({ from: 'conv4' })
      await flushPromises()
      expect(wrapper.find('.SkillMethodChooser').exists()).toBe(true)
      expect(wrapper.find('.studio-back-link').exists()).toBe(false)
    })

    it('from: conv4 且有交接資料：直接進對話模式、套用預填草稿與開場白，並顯示返回連結', async () => {
      setSkillHandoff({
        prefill: { name: '產品銷售報告整理', instructions: '1. 查詢資料\n2. 套用規範產出' },
        openingMessage: '這顆技能來自本對話的「查詢銷售資料」流程，設定我先填好了。',
        origin: { conversationId: 'conv4', reason: '查詢銷售資料＋套用部門報告規範' },
      })
      const { wrapper, router } = mountWorkspace({ from: 'conv4' })
      await flushPromises()
      expect(wrapper.find('.SkillMethodChooser').exists()).toBe(false)
      expect(wrapper.find('.ssp-title').text()).toBe('產品銷售報告整理')
      expect(wrapper.text()).toContain('這顆技能來自本對話的「查詢銷售資料」流程')
      expect(wrapper.find('.studio-origin-bar').text()).toContain('來自本對話的「查詢銷售資料＋套用部門報告規範」流程')

      const back = wrapper.find('.studio-back-link')
      expect(back.exists()).toBe(true)
      const push = vi.spyOn(router, 'push')
      await back.trigger('click')
      expect(popDialog.confirm).toHaveBeenCalledWith('有未儲存的變更，確定要放棄嗎？', '放棄變更', '留下', expect.any(Function))
      expect(push).not.toHaveBeenCalled()
      const onConfirm = vi.mocked(popDialog.confirm).mock.calls[0][3] as () => void
      onConfirm()
      expect(push).toHaveBeenCalledWith({ name: 'AiViewer' })
      expect(useAiviewerStore().conv4Msgs).toEqual([])
    })

    it('儲存後再按返回：conv4 對話會補一句「已建立」確認訊息', async () => {
      setSkillHandoff({
        prefill: { name: '產品銷售報告整理', instructions: '1. 查詢資料' },
        openingMessage: '開場白',
        origin: { conversationId: 'conv4', reason: '查詢銷售資料＋套用部門報告規範' },
      })
      const { wrapper, router } = mountWorkspace({ from: 'conv4' })
      await flushPromises()
      await wrapper.find('.ssp-save-btn').trigger('click')
      await flushPromises()
      await wrapper.find('.studio-back-link').trigger('click')
      await flushPromises()
      expect(router.currentRoute.value.name).toBe('AiViewer')
      const aiviewer = useAiviewerStore()
      expect(aiviewer.conv4Msgs.at(-1)).toMatchObject({
        agent: 'brain',
        msg: '✅ 個人技能「產品銷售報告整理」已建立完成。',
      })
    })

    it('交接資料只套用一次：讀過就清空', async () => {
      setSkillHandoff({
        prefill: { name: '一次性草稿' },
        openingMessage: '開場白',
        origin: { conversationId: 'conv4', reason: 'x' },
      })
      mountWorkspace({ from: 'conv4' })
      await flushPromises()
      expect(consumeSkillHandoff()).toBeNull()
    })

    it('套用完交接草稿後按「建立新技能」：回到方式選擇，且不再顯示返回連結', async () => {
      setSkillHandoff({
        prefill: { name: '產品銷售報告整理' },
        openingMessage: '開場白',
        origin: { conversationId: 'conv4', reason: 'x' },
      })
      const { wrapper } = mountWorkspace({ from: 'conv4' })
      await flushPromises()
      await wrapper.find('.ssc-new-btn').trigger('click')
      await flushPromises()
      const onConfirm = vi.mocked(popDialog.confirm).mock.calls[0][3] as () => void
      onConfirm()
      await flushPromises()
      expect(wrapper.find('.SkillMethodChooser').exists()).toBe(true)
      expect(wrapper.find('.studio-back-link').exists()).toBe(false)
    })
  })
})
```

（原本「同名個人技能」「同一路由 query 變化」「?tab=test 強制回到預覽 tab」等測試，內容跟上面已經涵蓋的情境重疊，不用整批照搬——保留涵蓋範圍即可，不用湊數。）

- [ ] **Step 2: 跑新測試檔案**

Run: `npm run test:unit -- src/components/__tests__/SkillStudioWorkspace.test.ts`
Expected: PASS

- [ ] **Step 3: 瘦身 `SkillStudio.test.ts`，只留頁面殼職責**

整份取代 `src/views/__tests__/SkillStudio.test.ts`：

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SkillStudio from '@/views/SkillStudio.vue'
import popDialog from '@/services/popDialog'
import { useSkillStore } from '@/stores/skillStore'

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
      { path: '/view/AiViewer', name: 'AiViewer', component: { template: '<div/>' } },
    ],
  })
  await router.push({ path: '/view/SkillStudio', query })
  await router.isReady()
  const wrapper = mount(
    { template: '<router-view />' },
    { global: { plugins: [router], stubs: { AppBreadcrumb: true } } },
  )
  await flushPromises()
  return { wrapper, router }
}

describe('SkillStudio（頁面殼）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('渲染 banner：建立模式顯示「新增技能」＋建立 chip，並掛載工作區', async () => {
    const { wrapper } = await mountAt()
    expect(wrapper.find('.banner-title').text()).toBe('新增技能')
    expect(wrapper.find('.banner-title-row .ssc-mode-chip').classes()).toContain('ssc-mode-chip--create')
    expect(wrapper.find('.skill-studio-layout .studio-chat-col').exists()).toBe(true)
    expect(wrapper.find('.skill-studio-layout .studio-side-col').exists()).toBe(true)
  })

  it('?skillId= 個人技能：banner 顯示「修改技能」＋修改 chip（含技能名稱）', async () => {
    const { wrapper } = await mountAt({ skillId: 'personal-001' })
    expect(wrapper.find('.banner-title').text()).toBe('修改技能')
    expect(wrapper.find('.banner-title-row .ssc-mode-chip').classes()).toContain('ssc-mode-chip--edit')
    expect(wrapper.find('.banner-title-row .ssc-mode-chip').text()).toContain('修改：週報自動生成')
  })

  it('同一路由 query 變化（skillId 移除）會重新套用；無未儲存變更時不彈確認', async () => {
    const { wrapper, router } = await mountAt({ skillId: 'personal-001' })
    expect(wrapper.find('.banner-title').text()).toBe('修改技能')
    await router.push({ path: '/view/SkillStudio' })
    await flushPromises()
    expect(popDialog.confirm).not.toHaveBeenCalled()
    expect(wrapper.find('.banner-title').text()).toBe('新增技能')
  })

  it('同一路由 query 變化：有未儲存變更時彈確認，取消則維持原本內容', async () => {
    const { wrapper, router } = await mountAt({ skillId: 'personal-001' })
    const store = useSkillStore()
    store.applyStudioPatch('personal-001', { name: '改過的名字還沒存' })
    // 直接改 store 不會讓 workspace 的 isDirty 變 true（isDirty 比對的是 workspace 自己的
    // draft vs snapshot），這裡改用 UI 操作讓草稿變 dirty：走「切換技能」讓 loadSkill
    // 重新載入，藉此製造一個乾淨的 dirty 情境不夠自然——改成直接送一句訊息
    const chatInput = wrapper.find('.SkillStudioChat input.custom-input')
    await chatInput.setValue('名稱改成「暫存中的修改」')
    await chatInput.trigger('keydown.enter')
    await new Promise(r => setTimeout(r, 850))
    await flushPromises()

    await router.push({ path: '/view/SkillStudio' })
    await flushPromises()
    expect(popDialog.confirm).toHaveBeenCalledWith('有未儲存的變更，確定要放棄嗎？', '放棄變更', '留下', expect.any(Function), expect.any(Function))
  })

  it('離開頁面：無未儲存變更時不彈確認', async () => {
    const { wrapper, router } = await mountAt()
    await router.push({ name: 'SkillManagement' })
    await flushPromises()
    expect(popDialog.confirm).not.toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe('SkillManagement')
  })
})
```

- [ ] **Step 4: 跑測試**

Run: `npm run test:unit -- src/views/__tests__/SkillStudio.test.ts`
Expected: PASS

- [ ] **Step 5: 跑全專案單元測試與型別檢查，確認沒有破壞其他地方**

Run: `npm run test:unit`
Expected: 全部 PASS

Run: `npm run type-check`
Expected: 沒有新增的錯誤

- [ ] **Step 6: Commit**

```bash
git add src/components/__tests__/SkillStudioWorkspace.test.ts src/views/__tests__/SkillStudio.test.ts
git commit -m "test(skill-studio): split workspace behavior tests out of page-shell test file"
```

---

## 完成後手動驗證（非自動化，補在最後一個 task 做完之後）

1. `npm run dev`，開 `/view/Skills`，點「建立技能」→「用對話建立」：抽屜應該從右側滑入，技能管理列表在背景可見（半透明遮罩），標題顯示「新增技能」＋teal 徽章。
2. 點右上角 X：無未儲存變更應該直接關閉，網址列的 query 清空回到 `/view/Skills`。
3. 對某個既有個人技能點「編輯」→「跟 Agent 對話修改」：抽屜打開在修改模式，標題「修改技能」＋slate 徽章，帶技能名稱。
4. 在抽屜裡改點內容讓草稿變 dirty，點背景遮罩：應該跳出「有未儲存的變更，確定要放棄嗎？」，取消後抽屜不關閉。
5. 重新整理瀏覽器（網址列帶著 `?skillId=...`）：抽屜應該直接以同一個修改狀態重新打開，不會掉回空的技能管理列表。
6. 從左側導覽選單直接點「AI 賦能」（不是從技能管理進來）：應該還是走獨立頁面 `/view/SkillStudio`，不是抽屜。
