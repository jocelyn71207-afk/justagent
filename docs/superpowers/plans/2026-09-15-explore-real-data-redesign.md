# 探索單元重新設計：打通資料/互動 + 視覺翻新 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把「探索」頁（`src/views/Explore.vue`）的 Agent／Skill 探索從假資料、假互動改成打通真正的 store 資料與可驗證的互動行為，同時做小範圍的視覺整理，並補齊 PRD／PROJECT_CONTEXT 文件落差。

**Architecture:** 新增 `exploreStore.ts` 承載 Agent 型別與常用清單（localStorage 持久化）；Skill 探索改讀既有的 `skillStore.ts`（新增選填 `functionType` 欄位 + `assignSkillToAgent` action）；`Explore.vue` 從 476 行的單一檔案拆成容器 + 3 個獨立 Modal 元件（`AgentDetailModal`／`SkillDetailModal`／`AssignSkillToAgentModal`），並把「使用熱度榜」「大家都在用」兩個資料重疊的區塊合併成一個「熱門 Agent」區塊。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Pinia（composition-style 「setup stores」）、Vitest + @vue/test-utils、SCSS（`src/scss/views/_Explore.scss`）。

**Spec:** `docs/superpowers/specs/2026-09-15-explore-real-data-redesign-design.md`

## Global Constraints

- 不接真後端 API：所有「持久化」指的是瀏覽器 `localStorage`（跟既有 `apiSimulatorStore.ts`/`http.ts` 的 token 儲存同一套 try/catch 容錯做法），不是伺服器端儲存。
- 不改 Agent／Skill 兩個分頁籤的 IA、不做無分頁的統一 grid。
- 不改「個人化推薦」（`rec-card`）區塊的版面與篩選邏輯，只換它讀的資料來源。
- 不改 Hero Banner 的精選邏輯（維持寫死指定「內容創作者」）。
- `skillStore.ts` 既有 `Skill` 型別欄位語意不變，只新增一個選填欄位 `functionType`，不得讓既有消費者（`SkillManagement.vue`、`SkillCard.vue` 等）出現型別錯誤。
- 全部使用 `<script setup lang="ts">`，禁止 Options API；樣式一律寫在 `src/scss/`，禁止 `<style scoped>`；import 一律用 `@/` alias；顏色一律用 CSS Custom Properties，不寫死 hex。
- 本次不新增任何 `.scss` 檔案——所有新增的 class 都加進既有的 `src/scss/views/_Explore.scss`（已被 `src/scss/views/_index.scss:13` `@import`，不需要動 index）。
- 沒有任何一步需要呼叫 `src/services/http.ts`（本次全部是本機 store/localStorage 操作）。
- **執行環境註記（2026-09-15 進 worktree 時發現）**：這份計畫是對照 repo 的 `main` branch內容撰寫的；實際執行的 worktree 分支是從 `origin/main` 分出來的，`origin/main` 已經先合併了一個「單一導覽欄」改版（拿掉 rail + side-panel 兩欄式設計）。已核對過：`Explore.vue`、`AgentCard.vue`、`ExploreSkillCard.vue`、`compModal.vue`、`_Explore.scss`、`skillStore.ts` 裡本計畫會動到的部分、`PRD-v1.4.md` 4.7 章節，在 `main`／`origin/main` 兩邊完全一致，可以直接照本計畫執行；唯一有落差的是 `PROJECT_CONTEXT.md`（3.9 節文字本身相同，但上下文的導覽述語從「rail/side-panel」改成「導覽欄/團隊選單面板」），Task 10 已經照 `origin/main` 現況調整用字。

---

### Task 1: `skillStore.ts` — 新增 `functionType` 欄位與 `assignSkillToAgent` action

**Files:**
- Modify: `src/stores/skillStore.ts:78-123`（`Skill` interface）
- Modify: `src/stores/skillStore.ts:196-668`（6 筆頂層 `MOCK_SKILLS` 補上 `functionType`）
- Modify: `src/stores/skillStore.ts:1138`（`toggleSkill` 之後新增 `assignSkillToAgent`）、`src/stores/skillStore.ts:1775-1852`（`return` 區塊新增 export）
- Test: `src/stores/__tests__/skillStore.assignSkillToAgent.test.ts`

**Interfaces:**
- Produces: `export type SkillFunctionType = '文字生成' | '資料查詢' | '流程自動化' | '分析報表' | '溝通協作'`；`Skill.functionType?: SkillFunctionType`；`useSkillStore().assignSkillToAgent(skillId: string, agentId: string): void`

- [ ] **Step 1: 寫失敗測試 `assignSkillToAgent`**

建立 `src/stores/__tests__/skillStore.assignSkillToAgent.test.ts`：

```ts
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useSkillStore } from '@/stores/skillStore'

describe('skillStore.assignSkillToAgent', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('把 Agent id 加入指定技能的 assignedAgents', () => {
    const store = useSkillStore()
    store.assignSkillToAgent('sys-doc-001', 'agent-content-creator')
    expect(store.findSkill('sys-doc-001')?.assignedAgents).toContain('agent-content-creator')
  })

  it('重複呼叫同一組 skillId/agentId 不會造成 assignedAgents 出現重複 id', () => {
    const store = useSkillStore()
    store.assignSkillToAgent('sys-doc-001', 'agent-content-creator')
    store.assignSkillToAgent('sys-doc-001', 'agent-content-creator')
    const assigned = store.findSkill('sys-doc-001')?.assignedAgents ?? []
    expect(assigned.filter(id => id === 'agent-content-creator')).toHaveLength(1)
  })

  it('對不存在的 skillId 呼叫時安全略過，不拋錯', () => {
    const store = useSkillStore()
    expect(() => store.assignSkillToAgent('not-exist', 'agent-content-creator')).not.toThrow()
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npx vitest run src/stores/__tests__/skillStore.assignSkillToAgent.test.ts`
Expected: FAIL，因為 `assignSkillToAgent` 尚不存在（`TypeError: store.assignSkillToAgent is not a function`）

- [ ] **Step 3: 新增 `SkillFunctionType` 型別與 `functionType` 欄位**

在 `src/stores/skillStore.ts` 裡，`export interface Skill {` 前面加一行型別：

```ts
export type SkillFunctionType = '文字生成' | '資料查詢' | '流程自動化' | '分析報表' | '溝通協作'

export interface Skill {
```

在既有 `Skill` interface 的 `capabilities?: SkillCapability[]` 這一行後面加一行：

```ts
  capabilities?: SkillCapability[]
  functionType?: SkillFunctionType   // 探索頁分類/篩選用，選填不影響既有消費者
```

- [ ] **Step 4: 幫 6 筆頂層 `MOCK_SKILLS` 補上 `functionType`**

逐一在每筆的 `description:` 那行後面加一行（用該筆的 `id`/`name` 精準定位，避免改到巢狀 `children` 裡的技能）：

```ts
    id: 'sys-cs-001',
    name: '通用客服機器人',
    description: '處理客戶諮詢與 FAQ，支援多語言與情緒分析',
    functionType: '溝通協作',
```

```ts
    id: 'sys-doc-001',
    name: '文件摘要生成',
    description: '自動摘要長文件，支援 PDF / Word / Markdown',
    functionType: '文字生成',
```

```ts
    id: 'sys-meeting-001',
    name: '會議摘要',
    description: '會議錄音轉文字並生成摘要與 action items',
    functionType: '文字生成',
```

```ts
    id: 'ext-erp-001',
    name: 'ERP 庫存查詢',
    description: '根據產品 ID 查詢即時庫存量，支援多個倉庫',
    functionType: '資料查詢',
```

```ts
    id: 'team-weekly-001',
    name: '業績週報生成',
    description: '根據本週銷售數據自動整理業績摘要，含商品排行與目標達成率分析',
    functionType: '分析報表',
```

```ts
    id: 'team-marketing-001',
    name: '行銷文案生成',
    description: '根據活動主題與目標受眾，自動生成社群貼文、EDM 標題與 CTA 文案',
    functionType: '文字生成',
```

（其餘巢狀在 `children` 裡的 extension 技能、以及 `MOCK_PERSONAL_SKILLS` 裡 `zone: 'personal'` 的技能，都不補這個欄位——後者本來就不會出現在 Explore 的公開技能牆上。）

- [ ] **Step 5: 新增 `assignSkillToAgent` action**

在 `toggleSkill` function 後面（約 `skillStore.ts:1150` 之後）加入：

```ts
  function assignSkillToAgent(skillId: string, agentId: string): void {
    const skill = findSkill(skillId)
    if (!skill) return
    skill.assignedAgents ??= []
    if (!skill.assignedAgents.includes(agentId)) {
      skill.assignedAgents.push(agentId)
    }
  }
```

並在檔案尾端的 `return { ... }` 區塊裡，`toggleSkill,` 那行後面加上：

```ts
    toggleSkill,
    assignSkillToAgent,
```

- [ ] **Step 6: 執行測試確認通過**

Run: `npx vitest run src/stores/__tests__/skillStore.assignSkillToAgent.test.ts`
Expected: PASS（3 個測試都過）

- [ ] **Step 7: 型別檢查**

Run: `npm run type-check`
Expected: 無錯誤（`functionType` 是選填欄位，既有消費者不受影響）

- [ ] **Step 8: Commit**

```bash
git add src/stores/skillStore.ts src/stores/__tests__/skillStore.assignSkillToAgent.test.ts
git commit -m "feat(skillStore): add functionType field and assignSkillToAgent action"
```

---

### Task 2: 新增 `exploreStore.ts`

**Files:**
- Create: `src/stores/exploreStore.ts`
- Test: `src/stores/__tests__/exploreStore.test.ts`

**Interfaces:**
- Consumes: `import type { SkillFunctionType } from './skillStore'`（Task 1 產出）
- Produces: `export type ColorKey`、`export interface AgentBadge`、`export interface Agent`、`export function getSkillVisual(functionType?: SkillFunctionType): { icon: string; colorKey: ColorKey }`、`export const useExploreStore` 提供 `agents: Ref<Agent[]>`、`favoriteAgentIds: Ref<string[]>`、`isFavorite(agentId: string): boolean`、`toggleFavorite(agentId: string): void`

- [ ] **Step 1: 寫失敗測試**

建立 `src/stores/__tests__/exploreStore.test.ts`：

```ts
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useExploreStore, getSkillVisual } from '@/stores/exploreStore'

describe('exploreStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('agents 至少有 10 筆，且每筆都有唯一的 id', () => {
    const store = useExploreStore()
    expect(store.agents.length).toBeGreaterThanOrEqual(10)
    const ids = store.agents.map(a => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('toggleFavorite 可以加入與移出常用清單', () => {
    const store = useExploreStore()
    const agentId = store.agents[0].id
    expect(store.isFavorite(agentId)).toBe(false)

    store.toggleFavorite(agentId)
    expect(store.isFavorite(agentId)).toBe(true)
    expect(store.favoriteAgentIds).toContain(agentId)

    store.toggleFavorite(agentId)
    expect(store.isFavorite(agentId)).toBe(false)
    expect(store.favoriteAgentIds).not.toContain(agentId)
  })

  it('toggleFavorite 寫入 localStorage，重新建立 store 後常用清單狀態仍在', () => {
    const store = useExploreStore()
    const agentId = store.agents[1].id
    store.toggleFavorite(agentId)

    setActivePinia(createPinia())
    const freshStore = useExploreStore()
    expect(freshStore.isFavorite(agentId)).toBe(true)
  })

  it('localStorage 內容損毀時，favoriteAgentIds 安全 fallback 為空陣列', () => {
    localStorage.setItem('explore.favoriteAgentIds', '{not valid json')
    setActivePinia(createPinia())
    const store = useExploreStore()
    expect(store.favoriteAgentIds).toEqual([])
  })

  it('getSkillVisual 依 functionType 回傳固定的 icon/colorKey，沒有 functionType 時回傳預設值', () => {
    expect(getSkillVisual('資料查詢')).toEqual({ icon: 'travel_explore', colorKey: 'teal' })
    expect(getSkillVisual(undefined)).toEqual({ icon: 'psychology', colorKey: 'rose' })
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npx vitest run src/stores/__tests__/exploreStore.test.ts`
Expected: FAIL（`Cannot find module '@/stores/exploreStore'`）

- [ ] **Step 3: 建立 `exploreStore.ts`**

```ts
import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { SkillFunctionType } from './skillStore'

export type ColorKey = 'violet' | 'blue' | 'amber' | 'teal' | 'green' | 'rust' | 'rose'

export interface AgentBadge {
  type: 'new' | 'hot' | 'sat'
  label: string
}

export interface Agent {
  id: string
  name: string
  desc: string
  painPoint: string
  icon: string
  colorKey: ColorKey
  tags: string[]
  badge?: AgentBadge
  categories: string[]
}

const AGENTS: Agent[] = [
  {
    id: 'agent-content-creator',
    name: '內容創作者',
    desc: '撰寫高品質的文章與多媒體內容，精準策略角度，吸引目標受眾，增強社交媒體互動。',
    painPoint: '還在對著空白文件發呆，不知道從何下筆？',
    icon: 'edit_note',
    colorKey: 'violet',
    tags: ['內容', '創作', '社群', '行銷'],
    categories: ['全部', '文件撰寫'],
  },
  {
    id: 'agent-social-media',
    name: '社群管理',
    desc: '管理各平台社群，增進用戶互動，制定策略以提升用戶忠誠度和品牌影響力。',
    painPoint: '每天要顧好幾個社群帳號，回覆訊息回到分身乏術？',
    icon: 'group',
    colorKey: 'teal',
    tags: ['社群', '行銷', '策略', '互動'],
    categories: ['全部'],
  },
  {
    id: 'agent-project-mgmt',
    name: '專案管理',
    desc: '從規劃到執行，確保資源最佳配置和時程有效利用。',
    painPoint: '專案時程一多，資源分配跟進度追蹤就開始亂？',
    icon: 'task_alt',
    colorKey: 'amber',
    tags: ['專案', '管理', '規劃', '執行'],
    categories: ['全部', '會議準備'],
  },
  {
    id: 'agent-finance-analyst',
    name: '財務分析師',
    desc: '分析公司財務數據，制定預算與報告，提供可行建議以支持企業經營目標。',
    painPoint: '一堆報表數字擺在眼前，卻看不出關鍵趨勢？',
    icon: 'bar_chart',
    colorKey: 'blue',
    tags: ['財務', '分析', '預算', '報告'],
    badge: { type: 'new', label: '新上架' },
    categories: ['全部', '報表分析', '財務管理'],
  },
  {
    id: 'agent-seo-expert',
    name: 'SEO 專家',
    desc: '優化網站內容與結構，提升搜尋引擎排名，幫助品牌獲得更多自然流量。',
    painPoint: '網站流量怎麼做都上不去，搜尋排名一直卡關？',
    icon: 'travel_explore',
    colorKey: 'green',
    tags: ['SEO', '優化', '搜尋', '流量'],
    badge: { type: 'new', label: '新上架' },
    categories: ['全部'],
  },
  {
    id: 'agent-customer-service',
    name: '顧客服務管理',
    desc: '提升客戶整體滿意度，解決客戶問題並收集回饋，提升服務品質與客戶忠誠度。',
    painPoint: '客訴訊息一多，回覆速度跟服務品質很難兼顧？',
    icon: 'support_agent',
    colorKey: 'rust',
    tags: ['客服', '滿意度', '回饋', '忠誠'],
    badge: { type: 'sat', label: '高滿意度' },
    categories: ['全部', '客服分析'],
  },
  {
    id: 'agent-bookkeeping',
    name: '記帳助理',
    desc: '帳務整理、報帳核對與簡單財務報表製作，確保每筆費用都有跡可循。',
    painPoint: '帳務單據一多就對不上，報帳核銷永遠卡在對帳？',
    icon: 'receipt_long',
    colorKey: 'teal',
    tags: ['帳務', '報表', '財務', '核對'],
    badge: { type: 'sat', label: '高滿意度' },
    categories: ['全部', '報表分析', '財務管理'],
  },
  {
    id: 'agent-hr-admin',
    name: '人資行政助理',
    desc: '快速產出職位說明、履歷篩選建議與面試準備，將複雜 HR 行政工作自動化。',
    painPoint: '職缺說明跟履歷篩選佔掉大半天，招募進度卻停滯不前？',
    icon: 'badge',
    colorKey: 'green',
    tags: ['HR', '招募', '行政', '人才'],
    badge: { type: 'new', label: '新上架' },
    categories: ['全部', '人資行政'],
  },
  {
    id: 'agent-design',
    name: '設計助理',
    desc: '協助創建視覺素材，提供設計建議與排版指引，提升品牌視覺一致性。',
    painPoint: '想要的視覺效果說不清楚，設計來回改版改到懷疑人生？',
    icon: 'palette',
    colorKey: 'rose',
    tags: ['設計', '素材', '視覺', '排版'],
    categories: ['全部', '設計輔助'],
  },
  {
    id: 'agent-meeting-recorder',
    name: '會議記錄員',
    desc: '自動整理會議記錄，摘要關鍵決議與行動項目，確保團隊決策能落實執行。',
    painPoint: '開完會才發現重點都忘了，行動項目沒人跟進？',
    icon: 'mic',
    colorKey: 'violet',
    tags: ['會議', '記錄', '摘要', '行動'],
    categories: ['全部', '會議準備'],
  },
]

// Skill 探索卡片視覺（icon/colorKey）：真正的 skillStore.Skill 型別沒有這兩個展示用欄位，
// 依 functionType 對應固定的 icon/colorKey；沒有 functionType 的技能 fallback 成中性樣式
const FUNCTION_TYPE_VISUAL: Record<SkillFunctionType, { icon: string; colorKey: ColorKey }> = {
  '文字生成': { icon: 'summarize', colorKey: 'violet' },
  '資料查詢': { icon: 'travel_explore', colorKey: 'teal' },
  '流程自動化': { icon: 'sync_alt', colorKey: 'blue' },
  '分析報表': { icon: 'bar_chart', colorKey: 'amber' },
  '溝通協作': { icon: 'forum', colorKey: 'green' },
}

const DEFAULT_SKILL_VISUAL: { icon: string; colorKey: ColorKey } = { icon: 'psychology', colorKey: 'rose' }

export function getSkillVisual(functionType?: SkillFunctionType): { icon: string; colorKey: ColorKey } {
  if (!functionType) return DEFAULT_SKILL_VISUAL
  return FUNCTION_TYPE_VISUAL[functionType] ?? DEFAULT_SKILL_VISUAL
}

const FAVORITES_STORAGE_KEY = 'explore.favoriteAgentIds'

function loadFavoriteIds(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

function saveFavoriteIds(ids: string[]): void {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // localStorage 不可用（無痕模式等）時，僅維持記憶體內狀態，不拋錯
  }
}

export const useExploreStore = defineStore('exploreStore', () => {
  const agents = ref<Agent[]>(AGENTS)
  const favoriteAgentIds = ref<string[]>(loadFavoriteIds())

  function isFavorite(agentId: string): boolean {
    return favoriteAgentIds.value.includes(agentId)
  }

  function toggleFavorite(agentId: string): void {
    const idx = favoriteAgentIds.value.indexOf(agentId)
    if (idx >= 0) {
      favoriteAgentIds.value.splice(idx, 1)
    } else {
      favoriteAgentIds.value.push(agentId)
    }
    saveFavoriteIds(favoriteAgentIds.value)
  }

  return { agents, favoriteAgentIds, isFavorite, toggleFavorite }
})
```

- [ ] **Step 4: 執行測試確認通過**

Run: `npx vitest run src/stores/__tests__/exploreStore.test.ts`
Expected: PASS（6 個測試都過）

- [ ] **Step 5: 型別檢查**

Run: `npm run type-check`
Expected: 無錯誤

- [ ] **Step 6: Commit**

```bash
git add src/stores/exploreStore.ts src/stores/__tests__/exploreStore.test.ts
git commit -m "feat(explore): add exploreStore with Agent catalog and favorite list"
```

---

### Task 3: `AgentCard.vue` — 改讀共用型別、加入常用清單標記

**Files:**
- Modify: `src/components/Explore/AgentCard.vue`（整檔）
- Modify: `src/scss/views/_Explore.scss`（新增 `.agent-favorite-mark`）

**Interfaces:**
- Consumes: `import type { Agent } from '@/stores/exploreStore'`（Task 2 產出）
- Produces: `AgentCard` props 新增 `isFavorite?: boolean`

- [ ] **Step 1: 改寫 `AgentCard.vue`**

```vue
<template>
  <div
    :class="[
      'agent-card-unit',
      'lively-card',
      rank !== undefined ? `podium-card podium-card--rank-${rank}` : 'agent-card',
    ]"
    @click="emit('click')"
  >
    <div v-if="rank !== undefined" class="rank-badge">{{ rank }}</div>
    <span
      v-else-if="agent.badge"
      :class="['agent-badge', `agent-badge--${agent.badge.type}`]"
    >
      {{ agent.badge.label }}
    </span>
    <i v-if="isFavorite" class="material-symbols-outlined material-fill agent-favorite-mark">star</i>
    <div :class="['agent-icon', `agent-icon--${agent.colorKey}`]">
      <i class="material-symbols-outlined">{{ agent.icon }}</i>
    </div>
    <h4>{{ agent.name }}</h4>
    <p>{{ agent.painPoint }}</p>
  </div>
</template>

<script setup lang="ts">
import type { Agent } from '@/stores/exploreStore'

defineProps<{
  agent: Agent
  rank?: number
  isFavorite?: boolean
}>()

const emit = defineEmits<{
  click: []
}>()
</script>
```

- [ ] **Step 2: 在 `_Explore.scss` 新增 `.agent-favorite-mark` 樣式**

在 `.agent-icon { ... }` 區塊（`src/scss/views/_Explore.scss:307` 附近，`.agent-card-unit` 底下）後面加入：

```scss
    .agent-favorite-mark {
      position: absolute;
      top: 14px;
      left: 14px;
      font-size: 16px;
      color: var(--tag-amber-text);
    }
```

- [ ] **Step 3: 型別檢查**

Run: `npm run type-check`
Expected: 無錯誤（`AgentCard.vue` 目前還沒被其他改動的檔案引用新 prop，暫時不影響現有呼叫端）

- [ ] **Step 4: Commit**

```bash
git add src/components/Explore/AgentCard.vue src/scss/views/_Explore.scss
git commit -m "refactor(explore): AgentCard reads shared Agent type, shows favorite mark"
```

---

### Task 4: `ExploreSkillCard.vue` — 改接真正的 `Skill` 型別

**Files:**
- Modify: `src/components/Explore/ExploreSkillCard.vue`（整檔）

**Interfaces:**
- Consumes: `import type { Skill } from '@/stores/skillStore'`、`import { getSkillVisual } from '@/stores/exploreStore'`（Task 1、2 產出）

- [ ] **Step 1: 改寫 `ExploreSkillCard.vue`**

```vue
<template>
  <div class="explore-skill-card lively-card" @click="emit('click')">
    <div :class="['agent-icon', `agent-icon--${visual.colorKey}`]">
      <i class="material-symbols-outlined">{{ visual.icon }}</i>
    </div>
    <span v-if="skill.functionType" class="skill-function-badge">{{ skill.functionType }}</span>
    <h4>{{ skill.name }}</h4>
    <p>{{ capabilityText }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Skill } from '@/stores/skillStore'
import { getSkillVisual } from '@/stores/exploreStore'

const props = defineProps<{
  skill: Skill
}>()

const emit = defineEmits<{
  click: []
}>()

const visual = computed(() => getSkillVisual(props.skill.functionType))
const capabilityText = computed(() => props.skill.capabilities?.[0]?.description ?? props.skill.description)
</script>
```

（原本的 `skill.badge`／NEW-HOT 角標拿掉：那是 Explore 自己發明、跟真正技能資料無關的假標記，改接真資料後沒有對應欄位可以驅動它，不再假裝有這個資訊。）

- [ ] **Step 2: 型別檢查**

Run: `npm run type-check`
Expected: 無錯誤

- [ ] **Step 3: Commit**

```bash
git add src/components/Explore/ExploreSkillCard.vue
git commit -m "refactor(explore): ExploreSkillCard reads real Skill type from skillStore"
```

---

### Task 5: 新增 `AgentDetailModal.vue`

**Files:**
- Create: `src/components/Explore/AgentDetailModal.vue`

**Interfaces:**
- Consumes: `Agent`（Task 2）、`useExploreStore`（Task 2）、`compModal`（`src/components/compModal/compModal.vue`，props `modelValue/title/width/closeOnMask`，emit `update:modelValue`）、`popDialog`（`src/services/popDialog`）
- Produces: `AgentDetailModal` props `{ modelValue: boolean; agent: Agent | null }`，emit `update:modelValue`

- [ ] **Step 1: 建立 `AgentDetailModal.vue`**

```vue
<template>
  <compModal
    :modelValue="modelValue"
    @update:modelValue="emit('update:modelValue', $event)"
    :title="agent?.name ?? ''"
    :width="440"
    :closeOnMask="true"
  >
    <template v-if="agent">
      <div class="Explore explore-modal-box">
        <div class="explore-modal-content">
          <div :class="['explore-modal-icon', `agent-icon--${agent.colorKey}`]">
            <i class="material-symbols-outlined">{{ agent.icon }}</i>
          </div>
          <p class="explore-modal-painpoint">{{ agent.painPoint }}</p>
          <p class="explore-modal-desc">{{ agent.desc }}</p>
          <div class="explore-modal-tags">
            <span v-for="tag in agent.tags" :key="tag" class="explore-modal-tag">{{ tag }}</span>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="Explore explore-modal-footer">
        <button class="custom-btn custom-main-btn" @click="onToggleFavorite">
          {{ isFavorite ? '已加入常用清單' : '加入常用清單' }}
        </button>
        <button class="custom-btn" @click="emit('update:modelValue', false)">取消</button>
      </div>
    </template>
  </compModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import compModal from '@/components/compModal/compModal.vue'
import type { Agent } from '@/stores/exploreStore'
import { useExploreStore } from '@/stores/exploreStore'
import popDialog from '@/services/popDialog'

const props = defineProps<{
  modelValue: boolean
  agent: Agent | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const exploreStore = useExploreStore()

const isFavorite = computed(() => (props.agent ? exploreStore.isFavorite(props.agent.id) : false))

function onToggleFavorite() {
  if (!props.agent) return
  const wasFavorite = isFavorite.value
  exploreStore.toggleFavorite(props.agent.id)
  popDialog.toast(wasFavorite ? '已從常用清單移除' : '已加入常用清單')
}
</script>
```

（按「加入/移出常用清單」不會自動關閉 Modal——這是一個可以來回切換的動作，讓使用者留在 Modal 裡看到按鈕文字即時變化，要離開時自己按「取消」或點遮罩關閉。）

- [ ] **Step 2: 型別檢查**

Run: `npm run type-check`
Expected: 無錯誤

- [ ] **Step 3: Commit**

```bash
git add src/components/Explore/AgentDetailModal.vue
git commit -m "feat(explore): add AgentDetailModal with real favorite toggle"
```

---

### Task 6: 新增 `SkillDetailModal.vue`

**Files:**
- Create: `src/components/Explore/SkillDetailModal.vue`

**Interfaces:**
- Consumes: `Skill`（Task 1）、`getSkillVisual`（Task 2）、`compModal`
- Produces: `SkillDetailModal` props `{ modelValue: boolean; skill: Skill | null }`，emit `update:modelValue`、`assign`（父層收到後負責開啟 `AssignSkillToAgentModal`）

- [ ] **Step 1: 建立 `SkillDetailModal.vue`**

```vue
<template>
  <compModal
    :modelValue="modelValue"
    @update:modelValue="emit('update:modelValue', $event)"
    :title="skill?.name ?? ''"
    :width="440"
    :closeOnMask="true"
  >
    <template v-if="skill">
      <div class="Explore explore-modal-box">
        <div class="explore-modal-content">
          <div :class="['explore-modal-icon', `agent-icon--${visual.colorKey}`]">
            <i class="material-symbols-outlined">{{ visual.icon }}</i>
          </div>
          <span v-if="skill.functionType" class="skill-function-badge">{{ skill.functionType }}</span>
          <p class="explore-modal-desc">{{ capabilityText }}</p>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="Explore explore-modal-footer">
        <button class="custom-btn custom-main-btn" @click="onAssignClick">加入我的技能</button>
        <button class="custom-btn" @click="emit('update:modelValue', false)">取消</button>
      </div>
    </template>
  </compModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import compModal from '@/components/compModal/compModal.vue'
import type { Skill } from '@/stores/skillStore'
import { getSkillVisual } from '@/stores/exploreStore'

const props = defineProps<{
  modelValue: boolean
  skill: Skill | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'assign'): void
}>()

const visual = computed(() => getSkillVisual(props.skill?.functionType))
const capabilityText = computed(() => props.skill?.capabilities?.[0]?.description ?? props.skill?.description ?? '')

function onAssignClick() {
  emit('update:modelValue', false)
  emit('assign')
}
</script>
```

- [ ] **Step 2: 型別檢查**

Run: `npm run type-check`
Expected: 無錯誤

- [ ] **Step 3: Commit**

```bash
git add src/components/Explore/SkillDetailModal.vue
git commit -m "feat(explore): add SkillDetailModal, assign action emits to parent"
```

---

### Task 7: 新增 `AssignSkillToAgentModal.vue`

**Files:**
- Create: `src/components/Explore/AssignSkillToAgentModal.vue`
- Test: `src/components/Explore/__tests__/AssignSkillToAgentModal.test.ts`
- Modify: `src/scss/views/_Explore.scss`（新增 `.assign-agent-search`／`.assign-agent-list`／`.assign-agent-item`）

**Interfaces:**
- Consumes: `useExploreStore().agents`（Task 2）、`useSkillStore().assignSkillToAgent`（Task 1）、`Skill`（Task 1）
- Produces: `AssignSkillToAgentModal` props `{ modelValue: boolean; skill: Skill | null }`，emit `update:modelValue`

- [ ] **Step 1: 寫失敗測試**

建立 `src/components/Explore/__tests__/AssignSkillToAgentModal.test.ts`：

```ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AssignSkillToAgentModal from '../AssignSkillToAgentModal.vue'
import { useSkillStore } from '@/stores/skillStore'
import { useExploreStore } from '@/stores/exploreStore'

vi.mock('@/services/popDialog', () => ({ default: { toast: vi.fn() } }))

function mountModal() {
  setActivePinia(createPinia())
  const skillStore = useSkillStore()
  const exploreStore = useExploreStore()
  const skill = skillStore.findSkill('sys-doc-001')!
  const wrapper = mount(AssignSkillToAgentModal, {
    props: { modelValue: true, skill },
  })
  return { wrapper, skillStore, exploreStore, skill }
}

describe('AssignSkillToAgentModal', () => {
  it('點選一個尚未裝過的 Agent 會呼叫 skillStore.assignSkillToAgent，並關閉 Modal', async () => {
    const { wrapper, skillStore, exploreStore, skill } = mountModal()
    const firstAgent = exploreStore.agents[0]
    const item = wrapper.findAll('.assign-agent-item')[0]
    expect(item.text()).toContain(firstAgent.name)

    await item.trigger('click')

    expect(skillStore.findSkill(skill.id)?.assignedAgents).toContain(firstAgent.id)
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([false])
  })

  it('已經裝過此技能的 Agent 顯示為已裝入，點擊不會重複加入也不會關閉 Modal', async () => {
    const { wrapper, skillStore, exploreStore, skill } = mountModal()
    const firstAgent = exploreStore.agents[0]

    skillStore.assignSkillToAgent(skill.id, firstAgent.id)
    await wrapper.vm.$nextTick()

    const item = wrapper.findAll('.assign-agent-item')[0]
    expect(item.classes()).toContain('assign-agent-item--assigned')
    expect(item.text()).toContain('已裝入')

    await item.trigger('click')
    const assigned = skillStore.findSkill(skill.id)?.assignedAgents ?? []
    expect(assigned.filter(id => id === firstAgent.id)).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('輸入搜尋關鍵字可以篩選 Agent 清單', async () => {
    const { wrapper } = mountModal()
    const input = wrapper.find('.assign-agent-search input')
    await input.setValue('設計')

    const items = wrapper.findAll('.assign-agent-item')
    expect(items).toHaveLength(1)
    expect(items[0].text()).toContain('設計助理')
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npx vitest run src/components/Explore/__tests__/AssignSkillToAgentModal.test.ts`
Expected: FAIL（找不到 `../AssignSkillToAgentModal.vue`）

- [ ] **Step 3: 建立 `AssignSkillToAgentModal.vue`**

```vue
<template>
  <compModal
    :modelValue="modelValue"
    @update:modelValue="emit('update:modelValue', $event)"
    :title="skill ? `將「${skill.name}」加入 Agent` : ''"
    :width="440"
    :closeOnMask="true"
  >
    <template v-if="skill">
      <div class="Explore explore-modal-box">
        <div class="assign-agent-search">
          <i class="material-symbols-outlined">search</i>
          <input type="text" v-model="keyword" placeholder="搜尋 Agent..." />
        </div>
        <ul class="assign-agent-list">
          <li
            v-for="agent in filteredAgents"
            :key="agent.id"
            :class="['assign-agent-item', { 'assign-agent-item--assigned': isAssigned(agent.id) }]"
            @click="!isAssigned(agent.id) && onAssign(agent.id)"
          >
            <div :class="['agent-icon', `agent-icon--${agent.colorKey}`]">
              <i class="material-symbols-outlined">{{ agent.icon }}</i>
            </div>
            <span class="assign-agent-name">{{ agent.name }}</span>
            <span v-if="isAssigned(agent.id)" class="assign-agent-status">已裝入</span>
          </li>
        </ul>
      </div>
    </template>
    <template #footer>
      <div class="Explore explore-modal-footer">
        <button class="custom-btn" @click="emit('update:modelValue', false)">取消</button>
      </div>
    </template>
  </compModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import compModal from '@/components/compModal/compModal.vue'
import { useExploreStore } from '@/stores/exploreStore'
import { useSkillStore } from '@/stores/skillStore'
import type { Skill } from '@/stores/skillStore'
import popDialog from '@/services/popDialog'

const props = defineProps<{
  modelValue: boolean
  skill: Skill | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const exploreStore = useExploreStore()
const skillStore = useSkillStore()

const keyword = ref('')

const filteredAgents = computed(() =>
  exploreStore.agents.filter(a => !keyword.value.trim() || a.name.includes(keyword.value.trim()))
)

function isAssigned(agentId: string): boolean {
  return !!props.skill?.assignedAgents?.includes(agentId)
}

function onAssign(agentId: string) {
  if (!props.skill) return
  const agent = exploreStore.agents.find(a => a.id === agentId)
  skillStore.assignSkillToAgent(props.skill.id, agentId)
  popDialog.toast(`已將「${props.skill.name}」加入「${agent?.name ?? ''}」`)
  emit('update:modelValue', false)
}
</script>
```

- [ ] **Step 4: 執行測試確認通過**

Run: `npx vitest run src/components/Explore/__tests__/AssignSkillToAgentModal.test.ts`
Expected: PASS（3 個測試都過）

- [ ] **Step 5: 在 `_Explore.scss` 新增選擇器樣式**

在 `src/scss/views/_Explore.scss` 檔案尾端加入：

```scss
.assign-agent-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--divider);
  border-radius: 8px;
  margin-bottom: 12px;

  input {
    border: none;
    outline: none;
    background: transparent;
    flex: 1;
    color: var(--text);
  }
}

.assign-agent-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 320px;
  overflow-y: auto;
}

.assign-agent-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background: var(--hint);
  }

  .agent-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 18px;
    }
  }

  .assign-agent-name {
    flex: 1;
  }

  .assign-agent-status {
    font-size: 12px;
    color: var(--text-muted);
  }

  &--assigned {
    cursor: not-allowed;
    opacity: 0.5;

    &:hover {
      background: transparent;
    }
  }
}
```

- [ ] **Step 6: 型別檢查**

Run: `npm run type-check`
Expected: 無錯誤

- [ ] **Step 7: Commit**

```bash
git add src/components/Explore/AssignSkillToAgentModal.vue src/components/Explore/__tests__/AssignSkillToAgentModal.test.ts src/scss/views/_Explore.scss
git commit -m "feat(explore): add AssignSkillToAgentModal for installing a skill onto an agent"
```

---

### Task 8: 重寫 `Explore.vue`，合併「熱門 Agent」區塊，更新既有測試

**Files:**
- Modify: `src/views/Explore.vue`（整檔重寫）
- Modify: `src/views/__tests__/Explore.ranking.test.ts`（整檔重寫）
- Verify（不需修改）: `src/views/__tests__/Explore.skillTab.test.ts`
- Create: `src/views/__tests__/Explore.favorite.test.ts`

**Interfaces:**
- Consumes: `useExploreStore`（Task 2）、`useSkillStore`（Task 1）、`AgentCard`（Task 3）、`ExploreSkillCard`（Task 4）、`AgentDetailModal`（Task 5）、`SkillDetailModal`（Task 6）、`AssignSkillToAgentModal`（Task 7）

- [ ] **Step 1: 重寫 `Explore.vue`**

```vue
<template>
  <div class="Explore views-page" v-show="!isEnterAppSearchPage">
    <div class="views-page-content-box">

      <!-- 分頁籤 -->
      <div class="explore-tabs">
        <button
          :class="['explore-tab', { active: activeExploreTab === 'agent' }]"
          @click="activeExploreTab = 'agent'"
        >
          <i class="material-symbols-outlined">support_agent</i>Agent 探索
        </button>
        <button
          :class="['explore-tab', { active: activeExploreTab === 'skill' }]"
          @click="activeExploreTab = 'skill'"
        >
          <i class="material-symbols-outlined">psychology</i>Skill 探索
        </button>
      </div>

      <template v-if="activeExploreTab === 'agent'">

      <!-- 搜尋列 -->
      <div class="explore-search-bar">
        <i class="material-symbols-outlined">search</i>
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜尋 Agent 助理..."
          @keydown.enter="onSearchEnter"
        />
      </div>

      <!-- 搜尋快捷 chips -->
      <div class="search-chips">
        <span class="chip">內容創作</span>
        <span class="chip">財務分析</span>
        <span class="chip">會議記錄</span>
        <span class="chip">HR 行政</span>
        <span class="chip">設計輔助</span>
      </div>

      <!-- Hero Banner -->
      <div class="explore-hero">
        <div class="hero-left">
          <div class="hero-eyebrow-pill">AI Agent 平台</div>
          <h2>今天想讓 Agent 助理幫你做什麼？</h2>
          <p>發掘最強大工作效率，選擇最適合的 AI 助理</p>
        </div>
        <div class="hero-cta" @click="openModal(featuredAgent)">
          <div class="hero-cta-label">由我推薦</div>
          <div class="hero-cta-name">{{ featuredAgent.name }}</div>
          <div class="hero-cta-desc">{{ featuredAgent.painPoint }}</div>
          <div class="hero-cta-link">立即使用 →</div>
        </div>
      </div>

      <!-- 熱門 Agent -->
      <div class="section-header">
        <h3>熱門 Agent</h3>
        <span class="see-all" @click="showToast('查看全部熱門')">查看全部</span>
      </div>
      <div class="ranking-podium lively-stagger mb-3">
        <AgentCard
          v-for="(agent, i) in podiumAgents"
          :key="agent.id"
          :agent="agent"
          :rank="i + 1"
          :is-favorite="exploreStore.isFavorite(agent.id)"
          @click="openModal(agent)"
        />
      </div>
      <div
        v-if="fourthRankedAgent"
        class="ranking-more lively-card mb-4"
        @click="openModal(fourthRankedAgent)"
      >
        <span class="rank-badge">4</span>
        <div :class="['agent-icon', `agent-icon--${fourthRankedAgent.colorKey}`]">
          <i class="material-symbols-outlined">{{ fourthRankedAgent.icon }}</i>
        </div>
        <span class="ranking-more-name">{{ fourthRankedAgent.name }}</span>
        <span class="ranking-more-desc">{{ fourthRankedAgent.painPoint }}</span>
      </div>

      <!-- 個人化推薦 -->
      <div class="recs-box">
        <div class="recs-header">
          <div class="recs-avatar">L</div>
          <span class="recs-title">Lucas，根據你最近使用的 Agent 精選給你</span>
        </div>
        <div class="recs-chips">
          <span
            v-for="chip in chipCategories"
            :key="chip"
            :class="['recs-chip', { active: activeChip === chip }]"
            @click="activeChip = chip"
          >{{ chip }}</span>
        </div>
        <div class="recs-grid lively-stagger">
          <div
            v-for="agent in filteredRecsAgents"
            :key="agent.id"
            class="rec-card lively-card"
            @click="openModal(agent)"
          >
            <div class="rec-icon">
              <i class="material-symbols-outlined">{{ agent.icon }}</i>
            </div>
            <div class="rec-card-top">
              <span class="rec-card-name">{{ agent.name }}</span>
              <span v-if="agent.badge" class="rec-card-tag">
                {{ agent.badge.label }}
              </span>
            </div>
            <p class="rec-card-desc">{{ agent.painPoint }}</p>
          </div>
        </div>
      </div>

      </template>

      <template v-if="activeExploreTab === 'skill'">

      <!-- Skill 搜尋列 -->
      <div class="explore-search-bar">
        <i class="material-symbols-outlined">search</i>
        <input
          type="text"
          v-model="skillSearchKeyword"
          placeholder="搜尋技能..."
          @keydown.enter="onSkillSearchEnter"
        />
      </div>

      <!-- 功能類型 chip -->
      <div class="recs-chips mb-4">
        <span
          v-for="chip in skillFunctionTypeChips"
          :key="chip"
          :class="['recs-chip', { active: activeSkillChip === chip }]"
          @click="activeSkillChip = chip"
        >{{ chip }}</span>
      </div>

      <div class="section-header">
        <h3>熱門技能</h3>
      </div>
      <div v-if="!filteredExploreSkills.length" class="explore-empty-state">找不到符合條件的技能</div>
      <div v-else class="skill-grid lively-stagger">
        <ExploreSkillCard
          v-for="skill in filteredExploreSkills"
          :key="skill.id"
          :skill="skill"
          @click="openSkillModal(skill)"
        />
      </div>

      </template>

    </div>
  </div>

  <AgentDetailModal v-model="isModalOpen" :agent="selectedAgent" />
  <SkillDetailModal v-model="isSkillModalOpen" :skill="selectedSkill" @assign="isAssignModalOpen = true" />
  <AssignSkillToAgentModal v-model="isAssignModalOpen" :skill="selectedSkill" />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRootStore } from '@/stores/rootStore'
import { useExploreStore } from '@/stores/exploreStore'
import type { Agent } from '@/stores/exploreStore'
import { useSkillStore } from '@/stores/skillStore'
import type { Skill, SkillFunctionType } from '@/stores/skillStore'
import AgentCard from '@/components/Explore/AgentCard.vue'
import ExploreSkillCard from '@/components/Explore/ExploreSkillCard.vue'
import AgentDetailModal from '@/components/Explore/AgentDetailModal.vue'
import SkillDetailModal from '@/components/Explore/SkillDetailModal.vue'
import AssignSkillToAgentModal from '@/components/Explore/AssignSkillToAgentModal.vue'
import popDialog from '@/services/popDialog'

const rootStore = useRootStore()
const { isEnterAppSearchPage } = storeToRefs(rootStore)

const exploreStore = useExploreStore()
const skillStore = useSkillStore()

const activeExploreTab = ref<'agent' | 'skill'>('agent')

// 搜尋
const searchKeyword = ref('')
function onSearchEnter() {
  const kw = searchKeyword.value.trim()
  if (!kw) return
  const result = exploreStore.agents.filter(a =>
    a.name.includes(kw) || a.tags.some(t => t.includes(kw))
  )
  if (result.length) {
    openModal(result[0])
  } else {
    popDialog.toast('找不到相關 Agent')
  }
}

function showToast(msg: string) {
  popDialog.toast(msg)
}

// 熱門 Agent（頒獎台前 3 名 + 第 4 名次要列，同一份排名資料，不再重複另外呈現一次）
const rankingAgents = computed(() =>
  exploreStore.agents.filter(a => ['內容創作者', '社群管理', '專案管理', '顧客服務管理'].includes(a.name))
)
const podiumAgents = computed(() => rankingAgents.value.slice(0, 3))
const fourthRankedAgent = computed(() => rankingAgents.value[3])

// 個人化推薦
const chipCategories = ['全部', '報表分析', '會議準備', '文件撰寫', '財務管理', '人資行政', '設計輔助', '客服分析']
const activeChip = ref('全部')

const filteredRecsAgents = computed(() =>
  exploreStore.agents.filter(a => a.categories.includes(activeChip.value)).slice(0, 6)
)

// Featured hero agent
const featuredAgent = computed(() => exploreStore.agents.find(a => a.name === '內容創作者')!)

// Agent 詳情 Modal
const isModalOpen = ref(false)
const selectedAgent = ref<Agent | null>(null)

function openModal(agent: Agent) {
  selectedAgent.value = agent
  isModalOpen.value = true
}

// Skill 探索：資料源改接真正的 skillStore，只列出非個人草稿、目前啟用中的技能
const skillFunctionTypeChips: ('全部' | SkillFunctionType)[] = ['全部', '文字生成', '資料查詢', '流程自動化', '分析報表', '溝通協作']
const activeSkillChip = ref<'全部' | SkillFunctionType>('全部')
const skillSearchKeyword = ref('')

const publicSkills = computed(() =>
  skillStore.skills.filter(s => s.zone !== 'personal' && s.isEnabled)
)

const filteredExploreSkills = computed(() =>
  publicSkills.value.filter(s =>
    (activeSkillChip.value === '全部' || s.functionType === activeSkillChip.value) &&
    (!skillSearchKeyword.value.trim() || s.name.includes(skillSearchKeyword.value.trim()))
  )
)

function onSkillSearchEnter() {
  const kw = skillSearchKeyword.value.trim()
  if (!kw) return
  if (!filteredExploreSkills.value.length) popDialog.toast('找不到相關技能')
}

const isSkillModalOpen = ref(false)
const selectedSkill = ref<Skill | null>(null)

function openSkillModal(skill: Skill) {
  selectedSkill.value = skill
  isSkillModalOpen.value = true
}

const isAssignModalOpen = ref(false)
</script>
```

- [ ] **Step 2: 重寫 `Explore.ranking.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Explore from '../Explore.vue'

function mountExplore() {
  setActivePinia(createPinia())
  return mount(Explore, { global: { stubs: { compModal: true } } })
}

describe('Explore 熱門 Agent（頒獎台＋次要列）', () => {
  it('頒獎台顯示前 3 名，套用對應的 rank 樣式 class', () => {
    const wrapper = mountExplore()
    const podiumCards = wrapper.findAll('.podium-card')
    expect(podiumCards).toHaveLength(3)
    expect(podiumCards[0].classes()).toContain('podium-card--rank-1')
    expect(podiumCards[1].classes()).toContain('podium-card--rank-2')
    expect(podiumCards[2].classes()).toContain('podium-card--rank-3')
    expect(podiumCards[0].find('h4').text()).toBe('內容創作者')
    expect(podiumCards[1].find('h4').text()).toBe('社群管理')
    expect(podiumCards[2].find('h4').text()).toBe('專案管理')
  })

  it('第 4 名移至頒獎台下方的次要列', () => {
    const wrapper = mountExplore()
    const more = wrapper.find('.ranking-more')
    expect(more.exists()).toBe(true)
    expect(more.find('.ranking-more-name').text()).toBe('顧客服務管理')
    expect(wrapper.findAll('.podium-card')).toHaveLength(3)
  })

  it('不再重複顯示「大家都在用」區塊——同一份排名資料只呈現一次', () => {
    const wrapper = mountExplore()
    expect(wrapper.find('.agent-grid--4').exists()).toBe(false)
  })
})

describe('Explore 活潑感套用', () => {
  it('頒獎台、為你推薦都套用 lively-stagger/lively-card', () => {
    const wrapper = mountExplore()
    expect(wrapper.find('.ranking-podium').classes()).toContain('lively-stagger')
    wrapper.findAll('.podium-card').forEach(c => expect(c.classes()).toContain('lively-card'))
    expect(wrapper.find('.recs-grid').classes()).toContain('lively-stagger')
    wrapper.findAll('.rec-card').forEach(c => expect(c.classes()).toContain('lively-card'))
  })
})
```

- [ ] **Step 3: 執行 ranking 測試確認通過**

Run: `npx vitest run src/views/__tests__/Explore.ranking.test.ts`
Expected: PASS（4 個測試都過）

- [ ] **Step 4: 執行既有 skillTab 測試，確認改接真資料後仍然通過**

Run: `npx vitest run src/views/__tests__/Explore.skillTab.test.ts`
Expected: PASS（不需要修改這個檔案——`skillStore` 目前 6 筆頂層 mock 技能裡，`資料查詢` 剛好只對應「ERP 庫存查詢」1 筆、關鍵字「會議」剛好只對應「會議摘要」1 筆，跟原本假資料的斷言結果一致）

- [ ] **Step 5: 寫失敗測試 `Explore.favorite.test.ts`**

建立 `src/views/__tests__/Explore.favorite.test.ts`：

```ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Explore from '../Explore.vue'
import { useExploreStore } from '@/stores/exploreStore'

vi.mock('@/services/popDialog', () => ({ default: { toast: vi.fn() } }))

function mountExplore() {
  localStorage.clear()
  setActivePinia(createPinia())
  return mount(Explore)
}

describe('Explore Agent 常用清單', () => {
  it('點擊 Agent 卡片開啟詳情 Modal 後，按「加入常用清單」會把該 Agent 加入常用清單，按鈕文字同步更新', async () => {
    const wrapper = mountExplore()
    const exploreStore = useExploreStore()
    const firstAgent = exploreStore.agents.find(a => a.name === '內容創作者')!

    await wrapper.findAll('.podium-card')[0].trigger('click')

    const favoriteBtn = wrapper.find('.explore-modal-footer .custom-main-btn')
    expect(favoriteBtn.text()).toBe('加入常用清單')

    await favoriteBtn.trigger('click')

    expect(exploreStore.isFavorite(firstAgent.id)).toBe(true)
    expect(favoriteBtn.text()).toBe('已加入常用清單')
  })

  it('已加入常用清單的 Agent，頒獎台卡片上顯示收藏星號', async () => {
    const wrapper = mountExplore()
    const exploreStore = useExploreStore()
    const firstAgent = exploreStore.agents.find(a => a.name === '內容創作者')!
    exploreStore.toggleFavorite(firstAgent.id)
    await wrapper.vm.$nextTick()

    const firstPodiumCard = wrapper.findAll('.podium-card')[0]
    expect(firstPodiumCard.find('.agent-favorite-mark').exists()).toBe(true)
  })
})
```

- [ ] **Step 6: 執行測試確認通過**

Run: `npx vitest run src/views/__tests__/Explore.favorite.test.ts`
Expected: PASS（2 個測試都過。因為這裡沒有 stub `compModal`，Modal 會真的渲染，footer 的按鈕才點得到）

- [ ] **Step 7: 型別檢查與完整測試**

Run: `npm run type-check && npx vitest run src/views`
Expected: 全部無錯誤、全部通過

- [ ] **Step 8: Commit**

```bash
git add src/views/Explore.vue src/views/__tests__/Explore.ranking.test.ts src/views/__tests__/Explore.favorite.test.ts
git commit -m "refactor(explore): wire Explore.vue to exploreStore/skillStore, merge ranking sections"
```

---

### Task 9: `_Explore.scss` — Badge 視覺整理

**Files:**
- Modify: `src/scss/views/_Explore.scss`

**Interfaces:**
- 無新增/變更的程式介面，純 CSS 整理，不影響任何 `.vue` 檔案的 class 名稱

- [ ] **Step 1: 在檔案開頭新增共用的角標 placeholder**

在 `src/scss/views/_Explore.scss` 第 1 行的註解之後、`.Explore.views-page {` 之前，加入：

```scss
// 「熱門/新上架/高滿意度」角標：原本在 .agent-card/.podium-card 與 .explore-skill-card
// 兩處各自重複宣告一模一樣的樣式，這裡收斂成一份共用 placeholder
%explore-agent-badge {
  position: absolute;
  top: 14px;
  right: 14px;
  font-size: 10px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 9999px;

  &--new {
    background: var(--hint);
    color: var(--primary-hover);
  }

  &--hot {
    background: var(--color-wise-badge-hot-bg);
    color: var(--color-wise-badge-hot-text);
  }

  &--sat {
    background: var(--hint);
    color: var(--primary);
  }
}
```

- [ ] **Step 2: 讓兩處 `.agent-badge` 改用共用 placeholder**

第一處（`.agent-card-unit` 底下，原第 282-305 行）：

```scss
    .agent-badge {
      @extend %explore-agent-badge;
    }
```

第二處（`.explore-skill-card` 底下，原第 746-769 行）：

```scss
    .agent-badge {
      @extend %explore-agent-badge;
    }
```

（把原本各自完整重複的 `position/top/right/font-size/font-weight/padding/border-radius` 加上 `&--new/&--hot/&--sat` 整組刪掉，換成上面這 3 行。兩處的顏色 token 本身沒有問題，這裡純粹是消除重複宣告。）

- [ ] **Step 3: 讓 `.skill-function-badge` 改用全站共用的 `%badge-shape`**

`.skill-function-badge`（原第 673-680 行）目前是 12px、`padding: 2px 8px`、`border-radius: 5px` 的小圓角矩形，跟 2026-08-25 那次全站 badge 統一之後、其餘所有 tag/badge 一律改用的膠囊形狀（`%badge-shape`，`src/scss/_custom.scss:243`）不一致——`_Explore.scss` 當時沒被納入那次稽核範圍。改成：

```scss
  .skill-function-badge {
    @extend %badge-shape;
    background: var(--page-bg);
    color: var(--text-muted);
  }
```

（拿掉原本自己宣告的 `display/font-size/padding/border-radius`，改用 `%badge-shape` 提供的膠囊形狀；`background`/`color` 維持原本的 token 不變。）

- [ ] **Step 4: 執行 build 確認 SCSS 編譯成功**

Run: `npm run build`
Expected: 成功（SCSS `@extend` 對象在同一次編譯的 `_custom.scss`／`_Explore.scss` 都在範圍內，不會有找不到 placeholder 的錯誤）

- [ ] **Step 5: 執行既有 Explore 測試，確認 class 名稱沒被動到，行為不受影響**

Run: `npx vitest run src/views/__tests__/Explore.ranking.test.ts src/views/__tests__/Explore.skillTab.test.ts src/views/__tests__/Explore.favorite.test.ts`
Expected: 全部 PASS（這個 Task 只動 SCSS，不動任何 `.vue` 的 class/template）

- [ ] **Step 6: Commit**

```bash
git add src/scss/views/_Explore.scss
git commit -m "style(explore): dedupe agent badge styles, align skill-function-badge to shared %badge-shape"
```

---

### Task 10: 補齊 `PRD-v1.4.md`／`PROJECT_CONTEXT.md`

**Files:**
- Modify: `PRD-v1.4.md:931-948`
- Modify: `PROJECT_CONTEXT.md:110-112`

**Interfaces:**
- 無程式介面，純文件更新

- [ ] **Step 1: 更新 `PRD-v1.4.md` 4.7 章節**

把原本的：

```markdown
### 4.7 探索（Explore）（新增）

探索中心讓用戶發現與啟用各類 AI Agent 助理。

#### 4.7.1 頁面結構

- **搜尋列**：搜尋 Agent 助理，支援快速 chip（內容創作、財務分析、會議記錄等）
- **Hero Banner**：平台推薦的精選 Agent，可直接啟用
- **使用熱度榜**：依使用頻率排名的 Agent 列表
- **大家都在用**：熱門 Agent 卡片（含 NEW / HOT 等 badge）
- **個人化推薦**：依用戶最近使用紀錄推薦的 Agent，支援分類 chip 篩選

#### 4.7.2 Agent 卡片

- 顯示：Agent 名稱、說明、圖示、分類
- 點擊後開啟 Agent 詳情 Modal（可啟用 / 建立專案）

---
```

改成：

```markdown
### 4.7 探索（Explore）（新增）

探索中心讓用戶發現與啟用各類 AI Agent 助理，並瀏覽、安裝可用的技能。

#### 4.7.1 頁面結構

- **搜尋列**：搜尋 Agent 助理，支援快速 chip（內容創作、財務分析、會議記錄等）
- **Hero Banner**：平台推薦的精選 Agent，點擊開啟詳情
- **熱門 Agent**：依使用頻率排名的 Agent（頒獎台前 3 名 + 第 4 名次要列），取代原先「使用熱度榜」與「大家都在用」兩個資料重疊的區塊
- **個人化推薦**：依用戶最近使用紀錄推薦的 Agent，支援分類 chip 篩選

#### 4.7.2 Agent 卡片

- 顯示：Agent 名稱、情境痛點、圖示、標籤、NEW / HOT / 高滿意度等 badge
- 點擊後開啟 Agent 詳情 Modal，可將該 Agent「加入常用清單」（收藏／取消收藏，狀態存在瀏覽器本機）

#### 4.7.3 Skill 探索（補充說明：程式碼已先行實作，2026-09-15 補上文件）

- **搜尋列 + 功能類型 chip**：文字生成／資料查詢／流程自動化／分析報表／溝通協作
- **熱門技能 grid**：資料來源是技能管理模組（`skillStore`）中「非個人草稿、目前啟用中」的技能，不是探索頁自己的假資料
- **Skill 卡片**：顯示技能名稱、功能類型、能力說明（取該技能第一項能力描述）
- 點擊卡片開啟 Skill 詳情 Modal，按「加入我的技能」開啟 Agent 選擇器，可挑選任一 Agent 把該技能實際裝入（寫入該技能的 `assignedAgents`）；已裝過的 Agent 會標示為已裝入、無法重複選取

---
```

- [ ] **Step 2: 更新 `PROJECT_CONTEXT.md` 3.9 節**

把原本的：

```markdown
### 3.9 探索（Explore）
- 側邊選單 rail 上的全域項目，尚未整理進本文件
- 待補：功能範圍與 `src/views/Explore.vue` 的詳細說明
```

改成（用字對齊目前 3.8 節「單一導覽欄＋團隊選單面板」的新版述語，不再用已經拿掉的「rail/side-panel」講法）：

```markdown
### 3.9 探索（Explore）
- 導覽欄上的全域項目（`src/views/Explore.vue`），跟 3.1 ProjectDashboard 一樣不需要先選定團隊、不會觸發團隊選單面板
- 分「Agent 探索」與「Skill 探索」兩個分頁籤：
  - **Agent 探索**：搜尋、Hero 精選、熱門 Agent（頒獎台+次要列）、個人化推薦。資料來源是 `src/stores/exploreStore.ts` 的本機 Agent 清單（非真實後端）；點擊卡片開啟詳情 Modal，可「加入常用清單」（收藏狀態存在瀏覽器 localStorage）
  - **Skill 探索**：搜尋 + 功能類型 chip 篩選，資料來源接真正的技能管理資料（`src/stores/skillStore.ts` 的 `skills`，只列出非個人草稿且啟用中的技能）；點擊卡片可透過「加入我的技能」把該技能實際裝到選定的 Agent 上（寫入該技能的 `assignedAgents`）
- 詳見 `docs/superpowers/specs/2026-09-15-explore-real-data-redesign-design.md`
```

- [ ] **Step 3: Commit**

```bash
git add PRD-v1.4.md PROJECT_CONTEXT.md
git commit -m "docs: sync PRD/PROJECT_CONTEXT with Explore real-data redesign"
```

---

## 完成後整體驗證

- [ ] Run: `npm run type-check && npm run build && npx vitest run`
- Expected: 全部通過（型別、build、全部單元/元件測試）
- [ ] 手動驗證（`npm run dev`，比照 spec 的「測試計畫」手動驗證步驟 1-5）
