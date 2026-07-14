# Skill 管理單元實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在現有 Vue 3 專案中新增「技能管理」功能模組，包含技能清單頁（啟用/停用、上游更新）與技能測試沙盒（對話模式 + JSON 模式）。

**Architecture:** 新增兩條路由 `/view/Skills`（SkillManagement.vue）與 `/view/SkillTest`（SkillTest.vue），掛在企業層級側邊欄下。資料由 Pinia skillStore 管理，此次全部使用 mock 資料，不串接真實 API。

**Tech Stack:** Vue 3 (script setup + TypeScript)、Pinia、Vue Router、SCSS (BEM-lite)、Material Symbols Outlined 圖示

## Global Constraints

- `<script setup lang="ts">`，禁止 Options API
- 禁止 `<style scoped>`，樣式統一在 `src/scss/` 管理
- 所有 import 使用 `@/` alias
- 顏色使用 CSS Custom Properties / SCSS 變數，禁止寫死 hex（例外：SCSS 變數 `$color_main_1` 等已在 base 定義者可直接用）
- Pinia store 使用 setup function 風格：`defineStore('id', () => { ... })`
- 圖示使用 `<i class="material-symbols-outlined">icon_name</i>`
- 新增 SCSS 檔後必須在對應 `_index.scss` 加 `@import`
- 此次不串接真實 API，全部使用 mock 資料

---

## 檔案總覽

| 動作 | 路徑 |
|------|------|
| Create | `src/stores/skillStore.ts` |
| Create | `src/stores/__tests__/skillStore.test.ts` |
| Create | `src/views/SkillManagement.vue` |
| Create | `src/views/SkillTest.vue` |
| Create | `src/components/Skill/SkillCard.vue` |
| Create | `src/components/Skill/SkillDetailDrawer.vue` |
| Create | `src/components/Skill/UpstreamUpdateDrawer.vue` |
| Create | `src/components/Skill/SkillTestChat.vue` |
| Create | `src/components/Skill/SkillTestJson.vue` |
| Create | `src/scss/views/_SkillManagement.scss` |
| Create | `src/scss/views/_SkillTest.scss` |
| Create | `src/scss/components/_SkillCard.scss` |
| Create | `src/scss/components/_SkillDetailDrawer.scss` |
| Create | `src/scss/components/_UpstreamUpdateDrawer.scss` |
| Modify | `src/router/index.ts` |
| Modify | `src/components/AppMenuTree.vue` |
| Modify | `src/scss/views/_index.scss` |
| Modify | `src/scss/components/_index.scss` |

---

## Task 1: skillStore.ts — 資料型別、Mock 資料、Store

**Files:**
- Create: `src/stores/skillStore.ts`
- Create: `src/stores/__tests__/skillStore.test.ts`

**Interfaces:**
- Produces: `Skill` (exported interface)、`ChatMessage` (exported interface)、`useSkillStore()` composable，後續所有 task 均 import 這些型別

---

- [ ] **Step 1: 建立測試檔，寫第一批失敗測試**

建立 `src/stores/__tests__/skillStore.test.ts`：

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSkillStore } from '@/stores/skillStore'

describe('skillStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始載入包含 mock skill 資料', () => {
    const store = useSkillStore()
    expect(store.skills.length).toBeGreaterThan(0)
  })

  it('flatSkills 攤平 system + extension skills', () => {
    const store = useSkillStore()
    const flat = store.flatSkills
    const hasExtension = flat.some(s => s.type === 'extension')
    expect(hasExtension).toBe(true)
  })

  it('toggleSkill 切換啟用狀態', () => {
    const store = useSkillStore()
    const skill = store.flatSkills[0]
    const original = skill.isEnabled
    store.toggleSkill(skill.id)
    expect(store.findSkill(skill.id)!.isEnabled).toBe(!original)
  })

  it('ignoreUpstreamUpdate 將狀態改為 ignored', () => {
    const store = useSkillStore()
    const ext = store.flatSkills.find(s => s.upstreamUpdateStatus === 'update_available')!
    store.ignoreUpstreamUpdate(ext.id)
    expect(store.findSkill(ext.id)!.upstreamUpdateStatus).toBe('ignored')
  })

  it('mergeUpstreamUpdate 將狀態改為 up_to_date', () => {
    const store = useSkillStore()
    const ext = store.flatSkills.find(s => s.upstreamUpdateStatus === 'update_available')!
    store.mergeUpstreamUpdate(ext.id)
    expect(store.findSkill(ext.id)!.upstreamUpdateStatus).toBe('up_to_date')
  })

  it('detachUpstream 解除上游連結', () => {
    const store = useSkillStore()
    const ext = store.flatSkills.find(s => s.upstreamLink === 'linked')!
    store.detachUpstream(ext.id)
    expect(store.findSkill(ext.id)!.upstreamLink).toBe('unlinked')
  })

  it('firstPendingUpdate 返回第一個待更新技能', () => {
    const store = useSkillStore()
    expect(store.firstPendingUpdate).not.toBeNull()
    expect(store.firstPendingUpdate!.upstreamUpdateStatus).toBe('update_available')
  })

  it('resetConversation 清空對話歷史', async () => {
    const store = useSkillStore()
    await store.sendChatMessage('any-id', '測試訊息')
    expect(store.testConversationHistory.length).toBeGreaterThan(0)
    store.resetConversation()
    expect(store.testConversationHistory.length).toBe(0)
  })
})
```

- [ ] **Step 2: 執行測試確認全部失敗**

```bash
npm run test:unit -- skillStore
```

預期輸出：`FAIL` — `Cannot find module '@/stores/skillStore'`

- [ ] **Step 3: 建立 `src/stores/skillStore.ts`**

```typescript
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export interface Skill {
  id: string
  name: string
  description: string
  type: 'system' | 'extension'
  origin: 'platform_created' | 'conversation_evolved' | 'custom_version'
  version: string
  isEnabled: boolean
  usageCount: number
  testPassRate: number       // 0–1
  avgLatencyMs: number
  forkSourceId?: string
  forkSourceVersion?: string
  upstreamLink: 'linked' | 'unlinked'
  upstreamUpdateStatus: 'up_to_date' | 'update_available' | 'conflict' | 'ignored'
  evolutionContext?: string
  children?: Skill[]         // 僅 system skill 有此欄位
}

export interface ChatMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  toolTrace?: { name: string; latencyMs: number }[]
}

const MOCK_SKILLS: Skill[] = [
  {
    id: 'sys-cs-001',
    name: '通用客服機器人',
    description: '處理客戶諮詢與 FAQ，支援多語言與情緒分析',
    type: 'system',
    origin: 'platform_created',
    version: '2.4.0',
    isEnabled: true,
    usageCount: 0,
    testPassRate: 0.96,
    avgLatencyMs: 280,
    upstreamLink: 'linked',
    upstreamUpdateStatus: 'up_to_date',
    children: [
      {
        id: 'ext-cs-return-001',
        name: '客服機器人 (退貨版)',
        description: '針對退貨問題，依設定的服務原則回應退貨政策與審核',
        type: 'extension',
        origin: 'conversation_evolved',
        version: '1.0.0',
        isEnabled: true,
        usageCount: 89,
        testPassRate: 0.94,
        avgLatencyMs: 342,
        forkSourceId: 'sys-cs-001',
        forkSourceVersion: '2.3.1',
        upstreamLink: 'linked',
        upstreamUpdateStatus: 'update_available',
        evolutionContext: '用戶說：「以後遇到退貨問題，先查詢訂單狀態再根據退貨政策給建議」',
      },
    ],
  },
  {
    id: 'sys-doc-001',
    name: '文件摘要生成',
    description: '自動摘要長文件，支援 PDF / Word / Markdown',
    type: 'system',
    origin: 'platform_created',
    version: '1.5.0',
    isEnabled: true,
    usageCount: 0,
    testPassRate: 0.91,
    avgLatencyMs: 450,
    upstreamLink: 'linked',
    upstreamUpdateStatus: 'up_to_date',
  },
  {
    id: 'sys-meeting-001',
    name: '會議摘要',
    description: '會議錄音轉文字並生成摘要與 action items',
    type: 'system',
    origin: 'platform_created',
    version: '2.1.0',
    isEnabled: true,
    usageCount: 0,
    testPassRate: 0.88,
    avgLatencyMs: 520,
    upstreamLink: 'linked',
    upstreamUpdateStatus: 'up_to_date',
    children: [
      {
        id: 'ext-meeting-eng-001',
        name: '會議摘要 (工程版)',
        description: '工程會議格式，自動標記 action items 至 Jira',
        type: 'extension',
        origin: 'custom_version',
        version: '1.2.0',
        isEnabled: true,
        usageCount: 34,
        testPassRate: 0.85,
        avgLatencyMs: 480,
        forkSourceId: 'sys-meeting-001',
        forkSourceVersion: '2.0.0',
        upstreamLink: 'unlinked',
        upstreamUpdateStatus: 'ignored',
      },
    ],
  },
  {
    id: 'ext-erp-001',
    name: 'ERP 庫存查詢',
    description: '根據產品 ID 查詢即時庫存量，支援多個倉庫',
    type: 'extension',
    origin: 'custom_version',
    version: '1.1.0',
    isEnabled: true,
    usageCount: 156,
    testPassRate: 0.99,
    avgLatencyMs: 120,
    upstreamLink: 'unlinked',
    upstreamUpdateStatus: 'ignored',
  },
]

export const useSkillStore = defineStore('skillStore', () => {
  const skills = ref<Skill[]>(MOCK_SKILLS)
  const selectedSkillId = ref<string | null>(null)
  const testConversationHistory = ref<ChatMessage[]>([])
  const testJsonInput = ref<string>('{\n  "user_message": "",\n  "context": {}\n}')
  const testJsonOutput = ref<string | null>(null)
  const testIsRunning = ref(false)

  const flatSkills = computed<Skill[]>(() => {
    const result: Skill[] = []
    for (const s of skills.value) {
      result.push(s)
      if (s.children) result.push(...s.children)
    }
    return result
  })

  const enabledCount = computed(() => flatSkills.value.filter(s => s.isEnabled).length)
  const extensionCount = computed(() => flatSkills.value.filter(s => s.type === 'extension').length)
  const totalUsageCount = computed(() => flatSkills.value.reduce((sum, s) => sum + s.usageCount, 0))
  const avgTestPassRate = computed(() => {
    const all = flatSkills.value
    if (!all.length) return 0
    return Math.round(all.reduce((sum, s) => sum + s.testPassRate, 0) / all.length * 100)
  })
  const firstPendingUpdate = computed(() =>
    flatSkills.value.find(s => s.upstreamUpdateStatus === 'update_available') ?? null
  )

  function findSkill(id: string): Skill | undefined {
    return flatSkills.value.find(s => s.id === id)
  }

  function toggleSkill(id: string): void {
    const skill = findSkill(id)
    if (skill) skill.isEnabled = !skill.isEnabled
  }

  function ignoreUpstreamUpdate(id: string): void {
    const skill = findSkill(id)
    if (skill) skill.upstreamUpdateStatus = 'ignored'
  }

  function mergeUpstreamUpdate(id: string): void {
    const skill = findSkill(id)
    if (skill) {
      skill.upstreamUpdateStatus = 'up_to_date'
      if (skill.forkSourceVersion) skill.forkSourceVersion = skill.version
    }
  }

  function detachUpstream(id: string): void {
    const skill = findSkill(id)
    if (skill) {
      skill.upstreamLink = 'unlinked'
      skill.upstreamUpdateStatus = 'ignored'
    }
  }

  function setSelectedSkill(id: string): void {
    selectedSkillId.value = id
  }

  function resetConversation(): void {
    testConversationHistory.value = []
  }

  async function sendChatMessage(_skillId: string, message: string): Promise<void> {
    testIsRunning.value = true
    testConversationHistory.value.push({
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
    })
    await new Promise(r => setTimeout(r, 800))
    testConversationHistory.value.push({
      id: `msg-${Date.now() + 1}`,
      role: 'agent',
      content: `（Mock）已收到您的問題：「${message}」，正在處理中...`,
      toolTrace: [
        { name: 'query-knowledge-base', latencyMs: 156 },
        { name: 'generate-response', latencyMs: 234 },
      ],
    })
    testIsRunning.value = false
  }

  async function runJsonTest(_skillId: string, _input: string): Promise<void> {
    testIsRunning.value = true
    testJsonOutput.value = null
    await new Promise(r => setTimeout(r, 600))
    testJsonOutput.value = JSON.stringify({
      reply: '（Mock）已收到輸入並完成處理',
      action: 'processed',
      confidence: 0.92,
      tools_called: ['query-knowledge-base'],
    }, null, 2)
    testIsRunning.value = false
  }

  return {
    skills,
    selectedSkillId,
    testConversationHistory,
    testJsonInput,
    testJsonOutput,
    testIsRunning,
    flatSkills,
    enabledCount,
    extensionCount,
    totalUsageCount,
    avgTestPassRate,
    firstPendingUpdate,
    findSkill,
    toggleSkill,
    ignoreUpstreamUpdate,
    mergeUpstreamUpdate,
    detachUpstream,
    setSelectedSkill,
    resetConversation,
    sendChatMessage,
    runJsonTest,
  }
})
```

- [ ] **Step 4: 執行測試確認全部通過**

```bash
npm run test:unit -- skillStore
```

預期輸出：所有 8 個測試 `PASS`

- [ ] **Step 5: Commit**

```bash
git add src/stores/skillStore.ts src/stores/__tests__/skillStore.test.ts
git commit -m "feat(skill): add skillStore with Skill/ChatMessage types and mock data"
```

---

## Task 2: 路由、側邊欄、SCSS 腳架

**Files:**
- Modify: `src/router/index.ts`
- Modify: `src/components/AppMenuTree.vue`
- Modify: `src/scss/views/_index.scss`
- Modify: `src/scss/components/_index.scss`
- Create: `src/scss/views/_SkillManagement.scss` (空檔佔位)
- Create: `src/scss/views/_SkillTest.scss` (空檔佔位)
- Create: `src/scss/components/_SkillCard.scss` (空檔佔位)
- Create: `src/scss/components/_SkillDetailDrawer.scss` (空檔佔位)
- Create: `src/scss/components/_UpstreamUpdateDrawer.scss` (空檔佔位)

**Interfaces:**
- Consumes: 無
- Produces: `/view/Skills` 與 `/view/SkillTest` 路由可訪問；側邊欄顯示「技能管理」展開項

---

- [ ] **Step 1: 在 `src/router/index.ts` 新增兩條路由**

在 `children` 陣列的最後一個項目（`Explore`）之後加入：

```typescript
      {
        path: '/view/Skills',
        name: 'SkillManagement',
        component: () => import('@/views/SkillManagement.vue'),
        meta: { title: '技能管理' },
      },
      {
        path: '/view/SkillTest',
        name: 'SkillTest',
        component: () => import('@/views/SkillTest.vue'),
        meta: { title: '技能測試沙盒', parentName: 'SkillManagement' },
      },
```

- [ ] **Step 2: 在 `src/components/AppMenuTree.vue` 的 `<script setup>` 新增 `isSkillOpen`**

在 `const isMobileMenuOpen = ref(false)` 這行之後加入：

```typescript
const isSkillOpen = ref(true)
```

- [ ] **Step 3: 在 `AppMenuTree.vue` 的 template 中新增技能管理區塊**

找到 `company-box` 內「企業/團隊設定」的 `one-btn-item` 結束標籤 `</div>` 之後，`</div>` 關閉 `company-box` 之前，插入：

```html
        <!-- 技能管理 -->
        <div class="one-btn-item sub-group-header"
          @click="isSkillOpen = !isSkillOpen"
          :class="{ active: route.path === '/view/Skills' || route.path === '/view/SkillTest' }">
          <i class="material-symbols-outlined">psychology</i>
          技能管理
          <i class="material-symbols-outlined sub-arrow">{{ isSkillOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</i>
        </div>
        <div class="sub-menu-box" v-if="isSkillOpen">
          <div class="one-btn-item">
            <RouterLink to="/view/Skills" custom v-slot="{ href, navigate }">
              <a :href="href" @click="navigate" :class="{ active: route.path === '/view/Skills' }">
                <i class="material-symbols-outlined">auto_awesome</i>
                我的技能
              </a>
            </RouterLink>
          </div>
          <div class="one-btn-item">
            <RouterLink to="/view/SkillTest" custom v-slot="{ href, navigate }">
              <a :href="href" @click="navigate" :class="{ active: route.path === '/view/SkillTest' }">
                <i class="material-symbols-outlined">science</i>
                技能測試沙盒
              </a>
            </RouterLink>
          </div>
        </div>
```

- [ ] **Step 4: 建立空白 SCSS 佔位檔**

```bash
touch src/scss/views/_SkillManagement.scss \
      src/scss/views/_SkillTest.scss \
      src/scss/components/_SkillCard.scss \
      src/scss/components/_SkillDetailDrawer.scss \
      src/scss/components/_UpstreamUpdateDrawer.scss
```

- [ ] **Step 5: 在 `src/scss/views/_index.scss` 末尾加入兩行**

```scss
@import "./SkillManagement";
@import "./SkillTest";
```

- [ ] **Step 6: 在 `src/scss/components/_index.scss` 末尾加入三行**

```scss
@import "./SkillCard";
@import "./SkillDetailDrawer";
@import "./UpstreamUpdateDrawer";
```

- [ ] **Step 7: 建立暫時的 view 佔位檔供路由不報錯**

建立 `src/views/SkillManagement.vue`：

```vue
<template>
  <div class="SkillManagement views-page">
    <div class="views-page-content-box">
      <p>技能管理（施工中）</p>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
```

建立 `src/views/SkillTest.vue`：

```vue
<template>
  <div class="SkillTest views-page">
    <div class="views-page-content-box">
      <p>技能測試沙盒（施工中）</p>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
```

- [ ] **Step 8: 啟動 dev server，確認側邊欄出現「技能管理」，兩條路由可訪問不報錯**

```bash
npm run dev
```

瀏覽器開啟 `http://localhost:5173`，登入後確認：
1. 左側「企業/團隊設定」下方出現「技能管理 ▲」展開項
2. 點擊「我的技能」→ URL 變為 `/view/Skills`，頁面顯示「技能管理（施工中）」
3. 點擊「技能測試沙盒」→ URL 變為 `/view/SkillTest`，頁面顯示「技能測試沙盒（施工中）」
4. 無 console error

- [ ] **Step 9: Commit**

```bash
git add src/router/index.ts src/components/AppMenuTree.vue \
        src/scss/views/_index.scss src/scss/components/_index.scss \
        src/scss/views/_SkillManagement.scss src/scss/views/_SkillTest.scss \
        src/scss/components/_SkillCard.scss src/scss/components/_SkillDetailDrawer.scss \
        src/scss/components/_UpstreamUpdateDrawer.scss \
        src/views/SkillManagement.vue src/views/SkillTest.vue
git commit -m "feat(skill): wire routes, sidebar entry, and SCSS scaffolding"
```

---

## Task 3: SkillCard.vue + _SkillCard.scss

**Files:**
- Create: `src/components/Skill/SkillCard.vue`
- Modify: `src/scss/components/_SkillCard.scss`

**Interfaces:**
- Consumes: `Skill` from `@/stores/skillStore`
- Produces:
  ```ts
  // Props
  skill: Skill
  isExtension?: boolean   // default false
  // Emits
  emit('click', skill: Skill)
  emit('test', skill: Skill)
  emit('toggle', skill: Skill)
  emit('update', skill: Skill)   // 只有 extension + update_available 才觸發
  ```

---

- [ ] **Step 1: 建立 `src/components/Skill/` 目錄並建立 `SkillCard.vue`**

```bash
mkdir -p src/components/Skill
```

建立 `src/components/Skill/SkillCard.vue`：

```vue
<template>
  <div
    :class="[
      'SkillCard',
      { 'is-extension': isExtension },
      { 'is-standalone': isExtension && !skill.forkSourceId },
      { 'is-disabled': !skill.isEnabled },
    ]"
    @click="emit('click', skill)"
  >
    <div :class="['skill-card-icon', isExtension ? 'icon--ext' : 'icon--sys']">
      <i class="material-symbols-outlined">{{ isExtension ? 'extension' : 'psychology' }}</i>
    </div>

    <div class="skill-card-body">
      <div class="skill-card-name">
        {{ skill.name }}
        <span :class="['skill-tag', isExtension ? 'tag--ext' : 'tag--sys']">
          {{ isExtension ? originLabel : '系統技能' }}
        </span>
        <span class="skill-tag tag--version">v{{ skill.version }}</span>
        <span v-if="skill.upstreamUpdateStatus === 'update_available'" class="skill-tag tag--update">
          ↑ 更新
        </span>
      </div>
      <div class="skill-card-desc">{{ skill.description }}</div>
      <div v-if="isExtension" class="skill-card-lineage">
        <template v-if="skill.upstreamLink === 'linked'">
          演化自 v{{ skill.forkSourceVersion }}
        </template>
        <template v-else>
          已解除上游連結，由您主動維護
        </template>
      </div>
    </div>

    <div class="skill-card-meta">
      <span :class="['status-dot', skill.isEnabled ? 'dot--on' : 'dot--off']"></span>
      <span class="status-text">{{ skill.isEnabled ? '啟用中' : '已停用' }}</span>
    </div>

    <div class="skill-card-actions" @click.stop>
      <button
        v-if="skill.upstreamUpdateStatus === 'update_available'"
        class="custom-btn skill-action-btn btn--warning"
        @click="emit('update', skill)"
      >
        更新
      </button>
      <button class="custom-btn skill-action-btn" @click="emit('test', skill)">測試</button>
      <button
        :class="['custom-btn', 'skill-action-btn', 'btn--danger-ghost']"
        @click="emit('toggle', skill)"
      >
        {{ skill.isEnabled ? '停用' : '啟用' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Skill } from '@/stores/skillStore'

const props = withDefaults(defineProps<{
  skill: Skill
  isExtension?: boolean
}>(), {
  isExtension: false,
})

const emit = defineEmits<{
  click: [skill: Skill]
  test: [skill: Skill]
  toggle: [skill: Skill]
  update: [skill: Skill]
}>()

const originLabel = computed(() => {
  if (props.skill.origin === 'conversation_evolved') return '對話演化'
  if (props.skill.origin === 'custom_version') return '自訂版本'
  return '擴充技能'
})
</script>
```

（注意：`computed` 需從 vue import，在 script setup 中加入：）

修正 script 區塊的 import 行：

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { Skill } from '@/stores/skillStore'
// ... 其餘相同
</script>
```

- [ ] **Step 2: 填寫 `src/scss/components/_SkillCard.scss`**

```scss
@use "sass:color";

.SkillCard {
  background: var(--surface);
  border: 1px solid var(--divider-a50);
  border-radius: 12px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s, opacity 0.2s;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }

  &.is-extension {
    margin-left: 28px;
    border-left: 2px solid $color_main_1;
    border-radius: 0 12px 12px 0;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      left: -2px;
      top: 50%;
      width: 16px;
      height: 2px;
      background: $color_main_1;
    }
  }

  &.is-standalone {
    margin-left: 0;
    border-left: 3px solid #f59e0b;
    border-radius: 12px;

    &::before { display: none; }
  }

  &.is-disabled {
    opacity: 0.45;
    pointer-events: none;

    .skill-card-actions {
      pointer-events: auto;
    }
  }

  .skill-card-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .material-symbols-outlined { font-size: 20px; }

    &.icon--sys {
      background: $color_main_4;
      color: $color_main_2;
    }

    &.icon--ext {
      background: #fef3c7;
      color: #b45309;
    }
  }

  .skill-card-body {
    flex: 1;
    min-width: 0;

    .skill-card-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 3px;
    }

    .skill-card-desc {
      font-size: 12px;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 480px;
    }

    .skill-card-lineage {
      font-size: 11px;
      color: $color_main_1;
      margin-top: 3px;
    }
  }

  .skill-card-meta {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;

    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      &.dot--on  { background: $color_main_1; }
      &.dot--off { background: var(--text-faint); }
    }

    .status-text {
      font-size: 11px;
      color: var(--text-muted);
      white-space: nowrap;
    }
  }

  .skill-card-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }
}

// Tag chips
.skill-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 500;

  &.tag--sys     { background: $color_main_4; color: $color_main_2; }
  &.tag--ext     { background: #fef3c7; color: #b45309; }
  &.tag--version { background: var(--page-bg); color: var(--text-muted); border: 1px solid var(--divider-a50); }
  &.tag--update  { background: #fffbeb; color: #92400e; border: 1px solid #fcd34d; }
}

// Skill action button overrides
.skill-action-btn {
  padding: 4px 10px;
  font-size: 12px;

  &.btn--warning {
    background: #f59e0b;
    border-color: #f59e0b;
    color: #fff;
    &:hover { background: #d97706; border-color: #d97706; color: #fff; }
  }

  &.btn--danger-ghost {
    color: #dc2626;
    border-color: #fecaca;
    &:hover { background: #fef2f2; }
  }
}
```

- [ ] **Step 3: 在 SkillManagement.vue 加入 SkillCard 做快速目視驗證**

在 Step 7 的暫時佔位檔基礎上，暫時替換為：

```vue
<template>
  <div class="SkillManagement views-page">
    <div class="views-page-content-box">
      <SkillCard
        :skill="store.skills[0]"
        @click="() => {}"
        @test="() => {}"
        @toggle="store.toggleSkill($event.id)"
        @update="() => {}"
      />
      <SkillCard
        v-if="store.skills[0].children?.[0]"
        :skill="store.skills[0].children![0]"
        :is-extension="true"
        @click="() => {}"
        @test="() => {}"
        @toggle="store.toggleSkill($event.id)"
        @update="() => {}"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import SkillCard from '@/components/Skill/SkillCard.vue'
import { useSkillStore } from '@/stores/skillStore'
const store = useSkillStore()
</script>
```

啟動 dev server，訪問 `/view/Skills`，確認：
1. 一張系統技能卡片（綠色 icon 背景）正常顯示
2. 一張擴充技能卡片（縮排、左側綠線、amber icon 背景）正常顯示
3. 擴充卡片有「↑ 更新」badge（因為 mock 資料有 `update_available`）
4. 點擊「停用」按鈕→卡片 opacity 降低

- [ ] **Step 4: Commit**

```bash
git add src/components/Skill/SkillCard.vue src/scss/components/_SkillCard.scss src/views/SkillManagement.vue
git commit -m "feat(skill): add SkillCard component with system/extension variants"
```

---

## Task 4: SkillDetailDrawer.vue + _SkillDetailDrawer.scss

**Files:**
- Create: `src/components/Skill/SkillDetailDrawer.vue`
- Modify: `src/scss/components/_SkillDetailDrawer.scss`

**Interfaces:**
- Consumes: `Skill` from `@/stores/skillStore`
- Produces:
  ```ts
  // Props
  skill: Skill | null    // null 時 drawer 不顯示
  // Emits
  emit('close')
  emit('test', skill: Skill)
  emit('toggle', skill: Skill)
  ```

---

- [ ] **Step 1: 建立 `src/components/Skill/SkillDetailDrawer.vue`**

```vue
<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div v-if="skill" class="SkillDetailDrawer">
        <div class="drawer-mask" @click="emit('close')" />
        <div class="drawer-panel">
          <div class="drawer-head">
            <h3>{{ skill.name }}</h3>
            <button class="drawer-close-btn" @click="emit('close')">
              <i class="material-symbols-outlined">close</i>
            </button>
          </div>

          <div class="drawer-body">
            <!-- 來源關係 -->
            <div class="drawer-section">
              <div class="section-label">來源關係</div>
              <div class="lineage-row">
                <template v-if="skill.type === 'extension' && skill.forkSourceId">
                  <span class="lineage-node">系統技能</span>
                  <i class="material-symbols-outlined lineage-arrow">arrow_forward</i>
                  <span class="lineage-node lineage-node--origin">{{ originLabel }}</span>
                  <i class="material-symbols-outlined lineage-arrow">arrow_forward</i>
                  <span class="lineage-node lineage-node--current">{{ skill.name }}</span>
                </template>
                <template v-else>
                  <span class="lineage-node lineage-node--current">{{ skill.name }}</span>
                  <span class="lineage-badge">系統技能</span>
                </template>
              </div>
            </div>

            <!-- 演化上下文（僅 conversation_evolved） -->
            <div v-if="skill.evolutionContext" class="drawer-section">
              <div class="section-label">演化上下文</div>
              <div class="evolution-context">{{ skill.evolutionContext }}</div>
            </div>

            <!-- 運行統計 -->
            <div class="drawer-section">
              <div class="section-label">運行統計</div>
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-val">{{ skill.usageCount }}</div>
                  <div class="stat-lbl">自動觸發次數</div>
                </div>
                <div class="stat-item">
                  <div class="stat-val">{{ Math.round(skill.testPassRate * 100) }}%</div>
                  <div class="stat-lbl">測試通過率</div>
                </div>
                <div class="stat-item">
                  <div class="stat-val">{{ skill.avgLatencyMs }}ms</div>
                  <div class="stat-lbl">平均延遲</div>
                </div>
              </div>
            </div>

            <!-- 操作 -->
            <div class="drawer-actions">
              <button class="custom-btn" @click="emit('test', skill!)">
                <i class="material-symbols-outlined">science</i>
                對話測試
              </button>
              <button class="custom-btn" disabled>
                <i class="material-symbols-outlined">edit</i>
                編輯（後續規劃）
              </button>
              <button class="custom-btn btn--danger-ghost" @click="emit('toggle', skill!)">
                {{ skill.isEnabled ? '停用' : '啟用' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Skill } from '@/stores/skillStore'

const props = defineProps<{ skill: Skill | null }>()
const emit = defineEmits<{
  close: []
  test: [skill: Skill]
  toggle: [skill: Skill]
}>()

const originLabel = computed(() => {
  if (!props.skill) return ''
  if (props.skill.origin === 'conversation_evolved') return '對話演化'
  if (props.skill.origin === 'custom_version') return '自訂版本'
  return '擴充'
})
</script>
```

- [ ] **Step 2: 填寫 `src/scss/components/_SkillDetailDrawer.scss`**

```scss
.SkillDetailDrawer {
  position: fixed;
  inset: 0;
  z-index: 500;

  .drawer-mask {
    position: absolute;
    inset: 0;
    background: rgba(9, 21, 26, 0.35);
    backdrop-filter: blur(4px);
  }

  .drawer-panel {
    position: absolute;
    top: 0;
    right: 0;
    width: 480px;
    height: 100vh;
    background: var(--surface);
    box-shadow: -8px 0 32px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    overflow-y: auto;

    @media (max-width: 600px) { width: 100vw; }
  }

  .drawer-head {
    padding: 18px 20px;
    border-bottom: 1px solid var(--divider-a50);
    display: flex;
    align-items: center;
    justify-content: space-between;

    h3 { font-size: 16px; font-weight: 600; }

    .drawer-close-btn {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      border: 1px solid var(--divider-a50);
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      &:hover { background: var(--page-bg); color: var(--text); }

      .material-symbols-outlined { font-size: 18px; }
    }
  }

  .drawer-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .drawer-section {
    .section-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-faint);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }
  }

  .lineage-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    background: var(--page-bg);
    padding: 10px 14px;
    border-radius: 8px;

    .lineage-node {
      font-size: 13px;
      color: var(--text-muted);
      padding: 3px 8px;
      background: var(--surface);
      border-radius: 6px;
      border: 1px solid var(--divider-a50);

      &--origin  { color: #b45309; background: #fef3c7; border-color: #fde68a; }
      &--current { color: $color_main_2; background: $color_main_4; border-color: $color_main_3; font-weight: 600; }
    }

    .lineage-badge {
      font-size: 11px;
      color: $color_main_2;
      background: $color_main_4;
      padding: 2px 8px;
      border-radius: 5px;
      font-weight: 500;
    }

    .lineage-arrow {
      font-size: 16px;
      color: var(--text-faint);
    }
  }

  .evolution-context {
    background: var(--page-bg);
    border-radius: 8px;
    padding: 12px 14px;
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.6;
    border-left: 3px solid $color_main_1;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;

    .stat-item {
      background: var(--page-bg);
      border-radius: 8px;
      padding: 12px;
      text-align: center;

      .stat-val {
        font-size: 20px;
        font-weight: 700;
        color: var(--text);
      }

      .stat-lbl {
        font-size: 11px;
        color: var(--text-faint);
        margin-top: 2px;
      }
    }
  }

  .drawer-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;

    .custom-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      .material-symbols-outlined { font-size: 16px; }
    }

    .btn--danger-ghost {
      color: #dc2626;
      border-color: #fecaca;
      &:hover { background: #fef2f2; }
    }
  }
}

// Drawer transition
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.25s;
  .drawer-panel { transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
}
.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
  .drawer-panel { transform: translateX(100%); }
}
```

- [ ] **Step 3: 在 SkillManagement.vue 暫時加入 Drawer 做目視驗證**

在暫時的 SkillManagement.vue 中加入以下邏輯（此步驟只為驗證，Task 6 會完全改寫）：

```vue
<template>
  <div class="SkillManagement views-page">
    <div class="views-page-content-box">
      <SkillCard :skill="store.skills[0]"
        @click="selectedSkill = $event"
        @test="() => {}" @toggle="store.toggleSkill($event.id)" @update="() => {}" />
      <SkillDetailDrawer :skill="selectedSkill" @close="selectedSkill = null"
        @test="() => {}" @toggle="store.toggleSkill($event.id)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SkillCard from '@/components/Skill/SkillCard.vue'
import SkillDetailDrawer from '@/components/Skill/SkillDetailDrawer.vue'
import { useSkillStore } from '@/stores/skillStore'
import type { Skill } from '@/stores/skillStore'
const store = useSkillStore()
const selectedSkill = ref<Skill | null>(null)
</script>
```

訪問 `/view/Skills`，點擊技能卡片確認：
1. Drawer 從右側滑入，有遮罩
2. 顯示來源關係、運行統計三格
3. 點擊遮罩或 X 關閉
4. 「對話測試」、「停用」按鈕可見

- [ ] **Step 4: Commit**

```bash
git add src/components/Skill/SkillDetailDrawer.vue src/scss/components/_SkillDetailDrawer.scss src/views/SkillManagement.vue
git commit -m "feat(skill): add SkillDetailDrawer with lineage, stats, and actions"
```

---

## Task 5: UpstreamUpdateDrawer.vue + _UpstreamUpdateDrawer.scss

**Files:**
- Create: `src/components/Skill/UpstreamUpdateDrawer.vue`
- Modify: `src/scss/components/_UpstreamUpdateDrawer.scss`

**Interfaces:**
- Consumes: `Skill` from `@/stores/skillStore`
- Produces:
  ```ts
  // Props
  skill: Skill | null
  // Emits
  emit('close')
  emit('merge', skill: Skill)
  emit('ignore', skill: Skill)
  emit('detach', skill: Skill)
  ```

---

- [ ] **Step 1: 建立 `src/components/Skill/UpstreamUpdateDrawer.vue`**

```vue
<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div v-if="skill" class="UpstreamUpdateDrawer">
        <div class="drawer-mask" @click="emit('close')" />
        <div class="drawer-panel">
          <div class="drawer-head">
            <h3>
              <i class="material-symbols-outlined">upgrade</i>
              上游有新版本
            </h3>
            <button class="drawer-close-btn" @click="emit('close')">
              <i class="material-symbols-outlined">close</i>
            </button>
          </div>

          <div class="drawer-body">
            <!-- 版本資訊 -->
            <div class="version-banner">
              你的「{{ skill.name }}」基於系統技能 v{{ skill.forkSourceVersion }} 演化。
              系統技能已更新至 <strong>v2.4.0</strong>，最新功能可合併。
            </div>

            <!-- 變更內容 -->
            <div class="drawer-section">
              <div class="section-label">新版本帶來什麼</div>
              <div class="diff-block">
                <div class="diff-title">新增：情緒分析功能</div>
                <div class="diff-body">
                  <div class="diff-line diff-add">+ 自動偵測用戶情緒，調整回覆語氣</div>
                  <div class="diff-line diff-add">+ 輸出新增 sentiment 欄位</div>
                </div>
              </div>
              <div class="diff-block">
                <div class="diff-title">Prompt 優化</div>
                <div class="diff-body">
                  <div class="diff-line diff-remove">- 你是一個客服助理</div>
                  <div class="diff-line diff-add">+ 你是一個專業客服助理，使用親切且專業的語氣</div>
                </div>
              </div>
            </div>

            <!-- 衝突分析 -->
            <div class="drawer-section">
              <div class="section-label">對你的影響</div>
              <div class="conflict-item conflict--ok">
                <i class="material-symbols-outlined">check_circle</i>
                可自動合併：情緒分析 Tool + Output Schema 更新
              </div>
              <div class="conflict-item conflict--warn">
                <i class="material-symbols-outlined">warning</i>
                需確認：Prompt 衝突（上游與你都有修改）
              </div>
            </div>

            <!-- 三種操作 -->
            <div class="drawer-section">
              <div class="section-label">你想怎麼做？</div>
              <div class="option-cards">
                <div class="option-card option-card--primary" @click="emit('merge', skill!)">
                  <div class="option-title">合併更新</div>
                  <div class="option-desc">無衝突部分自動套用，Prompt 衝突讓你選擇</div>
                </div>
                <div class="option-card" @click="emit('ignore', skill!)">
                  <div class="option-title">下次再說</div>
                  <div class="option-desc">不影響現有技能，下次更新時再提示</div>
                </div>
                <div class="option-card option-card--danger" @click="emit('detach', skill!)">
                  <div class="option-title">永久分離</div>
                  <div class="option-desc">不再收到更新通知，此操作不可逆</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { Skill } from '@/stores/skillStore'

defineProps<{ skill: Skill | null }>()
const emit = defineEmits<{
  close: []
  merge: [skill: Skill]
  ignore: [skill: Skill]
  detach: [skill: Skill]
}>()
</script>
```

- [ ] **Step 2: 填寫 `src/scss/components/_UpstreamUpdateDrawer.scss`**

```scss
.UpstreamUpdateDrawer {
  position: fixed;
  inset: 0;
  z-index: 500;

  .drawer-mask {
    position: absolute;
    inset: 0;
    background: rgba(9, 21, 26, 0.35);
    backdrop-filter: blur(4px);
  }

  .drawer-panel {
    position: absolute;
    top: 0;
    right: 0;
    width: 480px;
    height: 100vh;
    background: var(--surface);
    box-shadow: -8px 0 32px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    overflow-y: auto;

    @media (max-width: 600px) { width: 100vw; }
  }

  .drawer-head {
    padding: 18px 20px;
    border-bottom: 1px solid var(--divider-a50);
    display: flex;
    align-items: center;
    justify-content: space-between;

    h3 {
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      .material-symbols-outlined { font-size: 20px; color: #f59e0b; }
    }

    .drawer-close-btn {
      width: 30px; height: 30px;
      border-radius: 8px;
      border: 1px solid var(--divider-a50);
      background: transparent; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-muted);
      .material-symbols-outlined { font-size: 18px; }
      &:hover { background: var(--page-bg); color: var(--text); }
    }
  }

  .drawer-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .version-banner {
    background: #fffbeb;
    border: 1px solid #fcd34d;
    border-radius: 8px;
    padding: 12px 14px;
    font-size: 13px;
    color: #92400e;
    line-height: 1.6;

    strong { font-weight: 700; }
  }

  .drawer-section {
    .section-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-faint);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }
  }

  .diff-block {
    border: 1px solid var(--divider-a50);
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 8px;

    .diff-title {
      background: var(--page-bg);
      padding: 6px 12px;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
      border-bottom: 1px solid var(--divider-a50);
    }

    .diff-body {
      padding: 8px 12px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      line-height: 1.7;

      .diff-line {
        padding: 2px 6px;
        border-radius: 3px;
        margin-bottom: 2px;

        &.diff-add    { background: #f0fdf4; color: #166534; }
        &.diff-remove { background: #fef2f2; color: #991b1b; }
      }
    }
  }

  .conflict-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 13px;
    margin-bottom: 6px;

    .material-symbols-outlined { font-size: 18px; flex-shrink: 0; }

    &.conflict--ok {
      background: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
    }

    &.conflict--warn {
      background: #fffbeb;
      color: #92400e;
      border: 1px solid #fcd34d;
    }
  }

  .option-cards {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .option-card {
    border: 1px solid var(--divider-a50);
    border-radius: 10px;
    padding: 14px;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;

    &:hover { background: var(--page-bg); }

    .option-title { font-size: 14px; font-weight: 600; margin-bottom: 3px; }
    .option-desc  { font-size: 12px; color: var(--text-muted); }

    &--primary {
      border: 2px solid $color_main_1;
      background: $color_main_5;
      .option-title { color: $color_main_2; }
    }

    &--danger {
      border-color: #fecaca;
      .option-title { color: #dc2626; }
      &:hover { background: #fef2f2; }
    }
  }
}

// 共用 drawer transition（SkillDetailDrawer 也用到）
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.25s;
  .drawer-panel { transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
}
.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
  .drawer-panel { transform: translateX(100%); }
}
```

**注意：** `_SkillDetailDrawer.scss` 也定義了 `.drawer-fade-*` transition，兩個檔案不能重複定義。將 transition 規則只保留在 `_SkillDetailDrawer.scss`，在 `_UpstreamUpdateDrawer.scss` 中刪除重複的 transition 區塊。

- [ ] **Step 3: 目視驗證**

在 SkillManagement.vue 暫時加入 UpstreamUpdateDrawer，點擊擴充卡片的「更新」按鈕，確認：
1. Drawer 滑入，標題有黃色 upgrade icon
2. 版本 banner 顯示正確
3. Diff 區塊顯示 + / - 行
4. 衝突分析有綠色「可自動合併」和黃色「需確認」
5. 三張選項卡片樣式正確（primary 邊框、一般、紅色）
6. 點擊任一選項或 X 可關閉

- [ ] **Step 4: Commit**

```bash
git add src/components/Skill/UpstreamUpdateDrawer.vue src/scss/components/_UpstreamUpdateDrawer.scss
git commit -m "feat(skill): add UpstreamUpdateDrawer with diff view and three action options"
```

---

## Task 6: SkillManagement.vue + _SkillManagement.scss（完整實作）

**Files:**
- Modify: `src/views/SkillManagement.vue` (改寫暫時佔位版)
- Modify: `src/scss/views/_SkillManagement.scss`

**Interfaces:**
- Consumes: `useSkillStore()`, `SkillCard`, `SkillDetailDrawer`, `UpstreamUpdateDrawer`
- Produces: 完整的技能管理頁面

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

      <!-- 上游更新 Banner -->
      <div v-if="store.firstPendingUpdate" class="upstream-banner">
        <span>
          <i class="material-symbols-outlined">upgrade</i>
          <strong>{{ store.firstPendingUpdate.name }}</strong> 的上游有新版本可合併
        </span>
        <button class="custom-btn" @click="upstreamSkill = store.firstPendingUpdate">查看</button>
      </div>

      <!-- 技能清單 -->
      <div class="skill-list-header">
        <h2>技能清單</h2>
        <button class="custom-btn" disabled title="後續規劃">
          <i class="material-symbols-outlined">add</i>建立
        </button>
      </div>

      <div class="skill-tree">
        <!-- System Skills（含其下的 Extension） -->
        <template v-for="skill in systemSkills" :key="skill.id">
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
                v-for="child in skill.children"
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

        <!-- 獨立 Extension（頂層、無父系統技能） -->
        <SkillCard
          v-for="skill in standaloneExtensions"
          :key="skill.id"
          :skill="skill"
          :is-extension="true"
          @click="detailSkill = $event"
          @test="handleTest"
          @toggle="store.toggleSkill($event.id)"
          @update="upstreamSkill = $event"
        />
      </div>

    </div>

    <!-- Drawers -->
    <SkillDetailDrawer
      :skill="detailSkill"
      @close="detailSkill = null"
      @test="handleTest"
      @toggle="store.toggleSkill($event.id)"
    />
    <UpstreamUpdateDrawer
      :skill="upstreamSkill"
      @close="upstreamSkill = null"
      @merge="(s) => { store.mergeUpstreamUpdate(s.id); upstreamSkill = null }"
      @ignore="(s) => { store.ignoreUpstreamUpdate(s.id); upstreamSkill = null }"
      @detach="(s) => { store.detachUpstream(s.id); upstreamSkill = null }"
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
import { useSkillStore } from '@/stores/skillStore'
import type { Skill } from '@/stores/skillStore'

const router = useRouter()
const store = useSkillStore()

const detailSkill = ref<Skill | null>(null)
const upstreamSkill = ref<Skill | null>(null)

// store.skills 是頂層陣列，system skill 的 extension 子項放在 children 內
// 頂層中 type === 'extension' 的即為獨立 extension（無父系統技能）
const systemSkills = computed(() => store.skills.filter(s => s.type === 'system'))
const standaloneExtensions = computed(() => store.skills.filter(s => s.type === 'extension'))

function handleTest(skill: Skill) {
  router.push({ path: '/view/SkillTest', query: { skillId: skill.id } })
}
</script>
```

- [ ] **Step 2: 填寫 `src/scss/views/_SkillManagement.scss`**

```scss
@use "sass:color";

.SkillManagement {
  .skill-stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 16px;

    @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
    @media (max-width: 500px) { grid-template-columns: 1fr; }
  }

  .skill-stat-card {
    background: var(--surface);
    border: 1px solid var(--divider-a50);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .skill-stat-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .material-symbols-outlined { font-size: 20px; }

    &.icon--enabled { background: $color_main_4; color: $color_main_2; }
    &.icon--ext     { background: #fef3c7; color: #b45309; }
    &.icon--usage   { background: #ede9fe; color: #5b21b6; }
    &.icon--pass    { background: #dbeafe; color: #1e40af; }
  }

  .skill-stat-num {
    font-size: 24px;
    font-weight: 700;
    color: var(--text);
    line-height: 1.1;
  }

  .skill-stat-lbl {
    font-size: 11px;
    color: var(--text-faint);
    margin-top: 2px;
  }

  .upstream-banner {
    background: #fffbeb;
    border: 1px solid #fcd34d;
    border-radius: 12px;
    padding: 12px 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    font-size: 13px;
    color: #92400e;

    span {
      display: flex;
      align-items: center;
      gap: 6px;
      .material-symbols-outlined { font-size: 18px; color: #f59e0b; }
    }
  }

  .skill-list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    h2 { font-size: 16px; font-weight: 600; }
  }

  .skill-tree {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .skill-group {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin-bottom: 4px;
  }
}
```

- [ ] **Step 3: 目視驗證完整頁面**

啟動 dev server，訪問 `/view/Skills`，確認：
1. Hero 統計列顯示 4 個數字（7 啟用中、3 企業擴充、279 本月觸發、92% 通過率）
2. 上游更新 Banner 顯示「客服機器人 (退貨版) 的上游有新版本可合併」
3. 清單顯示 3 個 System Skill 群組，各群組下有縮排的 Extension Skill
4. 點擊任一卡片主體 → SkillDetailDrawer 滑入
5. 點擊 Extension 卡片的「更新」→ UpstreamUpdateDrawer 滑入
6. 選擇「合併更新」→ 上游 Banner 消失（status 改為 up_to_date）
7. 選擇「永久分離」→ lineage hint 改為「已解除上游連結」
8. 點擊[測試] → 跳至 `/view/SkillTest?skillId=xxx`

- [ ] **Step 4: Commit**

```bash
git add src/views/SkillManagement.vue src/scss/views/_SkillManagement.scss
git commit -m "feat(skill): implement full SkillManagement view with tree list and drawers"
```

---

## Task 7: SkillTestChat.vue + SkillTestJson.vue

**Files:**
- Create: `src/components/Skill/SkillTestChat.vue`
- Create: `src/components/Skill/SkillTestJson.vue`

**Interfaces:**
- Consumes: `useSkillStore()`（直接使用 store 的對話 / JSON 狀態）
- Produces:
  ```ts
  // SkillTestChat props
  skillId: string
  // SkillTestJson props
  skillId: string
  ```

---

- [ ] **Step 1: 建立 `src/components/Skill/SkillTestChat.vue`**

```vue
<template>
  <div class="SkillTestChat">
    <div class="chat-toolbar">
      <span class="system-hint">模擬 User 與 Agent 的真實對話，觀察技能觸發行為</span>
      <button class="custom-btn" @click="store.resetConversation()">
        <i class="material-symbols-outlined">restart_alt</i>重置對話
      </button>
    </div>

    <div class="chat-messages" ref="messagesEl">
      <div v-if="!store.testConversationHistory.length" class="chat-empty">
        <i class="material-symbols-outlined">chat_bubble_outline</i>
        <p>輸入訊息開始測試對話</p>
      </div>

      <template v-for="msg in store.testConversationHistory" :key="msg.id">
        <div :class="['chat-bubble', msg.role === 'user' ? 'bubble--user' : 'bubble--agent']">
          <div v-if="msg.role === 'agent'" class="bubble-label">AI Agent</div>
          <div class="bubble-content">{{ msg.content }}</div>
          <div v-if="msg.toolTrace?.length" class="tool-trace">
            <div class="trace-row" v-for="t in msg.toolTrace" :key="t.name">
              <i class="material-symbols-outlined">settings</i>
              {{ t.name }}
              <span class="trace-ms">{{ t.latencyMs }}ms</span>
            </div>
          </div>
        </div>
      </template>

      <div v-if="store.testIsRunning" class="chat-bubble bubble--agent">
        <div class="bubble-label">AI Agent</div>
        <div class="bubble-typing">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>

    <div class="chat-input-row">
      <input
        v-model="inputText"
        class="custom-input"
        placeholder="輸入測試訊息，模擬用戶..."
        :disabled="store.testIsRunning"
        @keydown.enter.prevent="handleSend"
      />
      <button
        class="custom-btn"
        :disabled="!inputText.trim() || store.testIsRunning"
        @click="handleSend"
      >
        <i class="material-symbols-outlined">send</i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useSkillStore } from '@/stores/skillStore'

const props = defineProps<{ skillId: string }>()
const store = useSkillStore()
const inputText = ref('')
const messagesEl = ref<HTMLElement | null>(null)

async function handleSend() {
  const msg = inputText.value.trim()
  if (!msg) return
  inputText.value = ''
  await store.sendChatMessage(props.skillId, msg)
}

watch(
  () => store.testConversationHistory.length,
  async () => {
    await nextTick()
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    }
  }
)
</script>
```

- [ ] **Step 2: 建立 `src/components/Skill/SkillTestJson.vue`**

```vue
<template>
  <div class="SkillTestJson">
    <!-- Input 區 -->
    <div class="json-section">
      <div class="json-section-label">
        <i class="material-symbols-outlined">input</i> Input (JSON)
      </div>
      <textarea
        v-model="store.testJsonInput"
        class="json-textarea"
        spellcheck="false"
        :disabled="store.testIsRunning"
      />
      <div class="json-actions">
        <button class="custom-btn" :disabled="store.testIsRunning" @click="handleRun">
          <i class="material-symbols-outlined">play_arrow</i>執行
        </button>
        <button class="custom-btn" @click="loadExample">載入範例</button>
        <button class="custom-btn" @click="store.testJsonInput = '{\n  \n}'">清除</button>
      </div>
    </div>

    <!-- Output 區 -->
    <div class="json-section">
      <div class="json-section-label">
        <i class="material-symbols-outlined">output</i> Output
        <span v-if="store.testJsonOutput && !store.testIsRunning" class="result-tag tag--success">
          ✓ 成功 · {{ lastLatencyMs }}ms
        </span>
        <span v-if="store.testIsRunning" class="result-tag tag--running">執行中...</span>
      </div>
      <div class="json-output">
        <pre v-if="store.testJsonOutput">{{ store.testJsonOutput }}</pre>
        <div v-else class="output-empty">執行後顯示結果</div>
      </div>
    </div>

    <!-- 呼叫鏈 -->
    <div v-if="callChain.length" class="call-chain">
      <div class="json-section-label">
        <i class="material-symbols-outlined">account_tree</i> 呼叫鏈
      </div>
      <div class="call-step" v-for="(step, i) in callChain" :key="i">
        <span class="step-num">{{ i + 1 }}</span>
        <span class="step-name">{{ step.name }}</span>
        <span class="step-ms">{{ step.latencyMs }}ms</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSkillStore } from '@/stores/skillStore'

const props = defineProps<{ skillId: string }>()
const store = useSkillStore()
const lastLatencyMs = ref(0)
const callChain = ref<{ name: string; latencyMs: number }[]>([])

async function handleRun() {
  const start = Date.now()
  callChain.value = []
  await store.runJsonTest(props.skillId, store.testJsonInput)
  lastLatencyMs.value = Date.now() - start
  callChain.value = [
    { name: 'Skill: 解析輸入', latencyMs: 12 },
    { name: 'Tool: query-knowledge-base', latencyMs: 156 },
    { name: 'Skill: 生成回覆', latencyMs: 234 },
  ]
}

function loadExample() {
  store.testJsonInput = JSON.stringify({
    user_message: '我上週買的藍牙耳機一直斷線，想退貨',
    context: {
      user_id: 'u-12345',
      channel: 'web_chat',
      order_id: 'A2024-0891',
    },
  }, null, 2)
}
</script>
```

- [ ] **Step 3: Commit（元件先 commit，下一個 task 的 SkillTest.vue 會驗證顯示效果）**

```bash
git add src/components/Skill/SkillTestChat.vue src/components/Skill/SkillTestJson.vue
git commit -m "feat(skill): add SkillTestChat and SkillTestJson subcomponents"
```

---

## Task 8: SkillTest.vue + _SkillTest.scss（完整實作）

**Files:**
- Modify: `src/views/SkillTest.vue` (改寫暫時佔位版)
- Modify: `src/scss/views/_SkillTest.scss`

**Interfaces:**
- Consumes: `useSkillStore()`, `SkillTestChat`, `SkillTestJson`
- Produces: 完整測試沙盒，從 query param `skillId` 自動選中技能

---

- [ ] **Step 1: 完整改寫 `src/views/SkillTest.vue`**

```vue
<template>
  <div class="SkillTest views-page">
    <div class="skill-test-layout">

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

      <!-- 右側：測試面板 -->
      <div class="test-panel">
        <template v-if="selectedSkill">
          <div class="test-panel-head">
            <div class="panel-title">
              {{ selectedSkill.name }}
              <span class="skill-tag tag--version">v{{ selectedSkill.version }}</span>
              <span :class="['skill-tag', selectedSkill.type === 'system' ? 'tag--sys' : 'tag--ext']">
                {{ selectedSkill.type === 'system' ? '系統技能' : '企業擴充' }}
              </span>
            </div>
            <!-- Mode Tab -->
            <div class="mode-tabs">
              <button
                :class="['mode-tab', { 'is-active': activeMode === 'chat' }]"
                @click="activeMode = 'chat'"
              >
                <i class="material-symbols-outlined">chat</i>對話模式
              </button>
              <button
                :class="['mode-tab', { 'is-active': activeMode === 'json' }]"
                @click="activeMode = 'json'"
              >
                <i class="material-symbols-outlined">data_object</i>JSON 模式
              </button>
            </div>
          </div>

          <SkillTestChat v-if="activeMode === 'chat'" :skill-id="selectedSkill.id" />
          <SkillTestJson v-else :skill-id="selectedSkill.id" />
        </template>

        <div v-else class="panel-empty">
          <i class="material-symbols-outlined">science</i>
          <p>請從左側選擇要測試的技能</p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import SkillTestChat from '@/components/Skill/SkillTestChat.vue'
import SkillTestJson from '@/components/Skill/SkillTestJson.vue'
import { useSkillStore } from '@/stores/skillStore'

const route = useRoute()
const store = useSkillStore()
const activeMode = ref<'chat' | 'json'>('chat')

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
</script>
```

- [ ] **Step 2: 填寫 `src/scss/views/_SkillTest.scss`**

```scss
@use "sass:color";

.SkillTest {
  height: 100%;

  .skill-test-layout {
    display: grid;
    grid-template-columns: 240px 1fr;
    height: calc(100vh - 60px);  // 60px = top header 高度，依實際調整
    overflow: hidden;
  }

  // ── 左側 Sidebar ──
  .test-sidebar {
    background: var(--surface);
    border-right: 1px solid var(--divider-a50);
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .sidebar-head {
      padding: 14px 16px;
      font-size: 13px;
      font-weight: 600;
      border-bottom: 1px solid var(--divider-a50);
      color: var(--text);
    }

    .sidebar-list {
      flex: 1;
      overflow-y: auto;
    }

    .sidebar-item {
      padding: 10px 16px;
      font-size: 13px;
      cursor: pointer;
      border-bottom: 1px solid var(--page-bg);
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-muted);
      transition: background 0.15s;

      &:hover { background: var(--page-bg); }

      &.is-active {
        background: $color_main_5;
        color: $color_main_2;
        font-weight: 500;
      }
    }

    .skill-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;

      &.dot--sys { background: #818cf8; }
      &.dot--ext { background: #f59e0b; }
    }
  }

  // ── 右側 Panel ──
  .test-panel {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--page-bg);
  }

  .test-panel-head {
    background: var(--surface);
    padding: 14px 20px;
    border-bottom: 1px solid var(--divider-a50);
    display: flex;
    align-items: center;
    justify-content: space-between;

    .panel-title {
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }

  .mode-tabs {
    display: flex;
    background: var(--page-bg);
    border-radius: 8px;
    padding: 2px;
    gap: 2px;
  }

  .mode-tab {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;

    .material-symbols-outlined { font-size: 16px; }

    &.is-active {
      background: var(--surface);
      color: var(--text);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    }

    &:hover:not(.is-active) { color: var(--text); }
  }

  .panel-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: var(--text-faint);

    .material-symbols-outlined { font-size: 48px; opacity: 0.3; }
    p { font-size: 14px; }
  }

  // ── SkillTestChat 樣式 ──
  .SkillTestChat {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .chat-toolbar {
      padding: 10px 20px;
      border-bottom: 1px solid var(--divider-a50);
      background: var(--surface);
      display: flex;
      align-items: center;
      justify-content: space-between;

      .system-hint { font-size: 12px; color: var(--text-faint); }

      .custom-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        .material-symbols-outlined { font-size: 15px; }
      }
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .chat-empty {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: var(--text-faint);
      .material-symbols-outlined { font-size: 36px; opacity: 0.3; }
      p { font-size: 13px; }
    }

    .chat-bubble {
      max-width: 75%;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 13px;
      line-height: 1.6;

      &.bubble--user {
        align-self: flex-end;
        background: $color_main_1;
        color: #fff;
        border-bottom-right-radius: 4px;
      }

      &.bubble--agent {
        align-self: flex-start;
        background: var(--surface);
        border: 1px solid var(--divider-a50);
        border-bottom-left-radius: 4px;
      }

      .bubble-label {
        font-size: 11px;
        color: var(--text-faint);
        margin-bottom: 4px;
        font-weight: 500;
      }

      .bubble-typing {
        display: flex;
        gap: 4px;
        padding: 4px 0;

        span {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--text-faint);
          animation: typing-bounce 1s infinite;

          &:nth-child(2) { animation-delay: 0.2s; }
          &:nth-child(3) { animation-delay: 0.4s; }
        }
      }

      .tool-trace {
        margin-top: 8px;
        padding: 8px 10px;
        background: var(--page-bg);
        border-radius: 6px;

        .trace-row {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: var(--text-faint);
          font-family: 'JetBrains Mono', monospace;
          .material-symbols-outlined { font-size: 13px; }
          .trace-ms { margin-left: auto; }
        }
      }
    }

    .chat-input-row {
      padding: 14px 20px;
      border-top: 1px solid var(--divider-a50);
      background: var(--surface);
      display: flex;
      gap: 8px;

      .custom-input { flex: 1; }
    }
  }

  // ── SkillTestJson 樣式 ──
  .SkillTestJson {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0;
    overflow-y: auto;
    padding: 20px;

    .json-section {
      background: var(--surface);
      border: 1px solid var(--divider-a50);
      border-radius: 12px;
      padding: 14px;
      margin-bottom: 12px;
    }

    .json-section-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 5px;
      margin-bottom: 8px;

      .material-symbols-outlined { font-size: 15px; }
    }

    .json-textarea {
      width: 100%;
      min-height: 130px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      line-height: 1.7;
      border: 1px solid var(--divider-a50);
      border-radius: 8px;
      padding: 10px 12px;
      background: var(--page-bg);
      color: var(--text);
      resize: vertical;
      outline: none;

      &:focus { border-color: $color_main_1; }
    }

    .json-actions {
      display: flex;
      gap: 8px;
      margin-top: 8px;

      .custom-btn { font-size: 12px; padding: 4px 10px; }
    }

    .json-output {
      min-height: 100px;
      background: var(--page-bg);
      border-radius: 8px;
      padding: 10px 12px;

      pre {
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        line-height: 1.7;
        color: var(--text);
        white-space: pre-wrap;
        margin: 0;
      }

      .output-empty {
        font-size: 12px;
        color: var(--text-faint);
        text-align: center;
        padding: 20px 0;
      }
    }

    .result-tag {
      margin-left: auto;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 5px;
      font-weight: 500;

      &.tag--success { background: $color_main_4; color: $color_main_2; }
      &.tag--running { background: #dbeafe; color: #1e40af; }
    }

    .call-chain {
      background: var(--surface);
      border: 1px solid var(--divider-a50);
      border-radius: 12px;
      padding: 14px;

      .call-step {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px 0 6px 10px;
        border-left: 2px solid $color_main_1;
        margin-bottom: 6px;
        font-size: 12px;
        color: var(--text-muted);

        .step-num {
          width: 18px; height: 18px;
          border-radius: 50%;
          background: $color_main_4;
          color: $color_main_2;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .step-name { flex: 1; }
        .step-ms   { color: var(--text-faint); }
      }
    }
  }
}

@keyframes typing-bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40%            { transform: translateY(-5px); }
}
```

- [ ] **Step 3: 目視驗證完整測試沙盒**

訪問 `/view/SkillTest`，確認：
1. 左側列表顯示所有技能（含 extension），有 dot 顏色區分
2. 預設選中第一個技能，右側顯示技能名稱與 tab
3. 對話模式：輸入訊息，0.8 秒後 Agent 回覆出現，附 tool trace
4. 切換 JSON 模式：點「載入範例」填入 JSON，點「執行」0.6 秒後顯示 Output 和呼叫鏈
5. 從 SkillManagement 點[測試]後，URL 帶 `?skillId=xxx`，測試沙盒自動選中對應技能

- [ ] **Step 4: 最終整合確認**

確認以下完整流程無誤：
1. 側邊欄「技能管理 > 我的技能」→ SkillManagement 頁面
2. 點擊「更新」→ UpstreamUpdateDrawer，選「合併更新」→ Banner 消失
3. 點擊「停用」→ 卡片灰化；點「啟用」→ 恢復
4. 點擊[測試] → 跳至 SkillTest，自動選中正確技能
5. 對話模式發送訊息 → 收到 mock 回覆
6. JSON 模式執行 → 顯示 Output + 呼叫鏈
7. 無 TypeScript 型別錯誤：`npm run type-check`

```bash
npm run type-check
```

預期：無錯誤輸出

- [ ] **Step 5: Commit**

```bash
git add src/views/SkillTest.vue src/scss/views/_SkillTest.scss
git commit -m "feat(skill): implement SkillTest sandbox with chat and JSON test modes"
```

---

## 完成核對清單

完成後執行一次完整確認：

```bash
npm run type-check   # TypeScript 無錯誤
npm run test:unit -- skillStore   # 8 個 store 測試全部通過
npm run lint         # ESLint 無錯誤
```

所有新增的 SCSS 已在 `_index.scss` 中 `@import`：

```bash
grep -E "SkillManagement|SkillTest|SkillCard|SkillDetailDrawer|UpstreamUpdateDrawer" \
  src/scss/views/_index.scss src/scss/components/_index.scss
```

預期：每個名稱各出現一次。
