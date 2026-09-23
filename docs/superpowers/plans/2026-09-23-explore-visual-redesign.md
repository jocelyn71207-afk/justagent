# 探索單元視覺重新設計 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把探索頁的視覺語言從「Hero Banner + 頒獎台排行 + 卡片網格」換成「安靜、資訊密度高的情境清單」，Agent/Skill 兩個分頁都改成同一套版面，顏色/字型/icon 全部改用產品既有的 token 系統。

**Architecture:** `AgentCard.vue`／`ExploreSkillCard.vue` 從卡片元件改寫成清單列元件（拿掉頒獎台/rank 概念）；`Explore.vue` 拿掉 Hero/頒獎台/推薦網格/分類 chip，改成搜尋框 + 精選列 + 清單；`_Explore.scss` 大量刪除死掉的舊版面 CSS，新增清單列樣式；三個既有測試檔案改寫成驗證新版面。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Pinia、Vitest + @vue/test-utils、SCSS。

**Spec:** `docs/superpowers/specs/2026-09-23-explore-visual-redesign-design.md`

## Global Constraints

- 顏色/字型/icon 只能用產品既有系統：`--primary`/`--accent`（teal-green）、8 組 `--tag-*` 低飽和色、Public Sans / Noto Sans TC / JetBrains Mono、Material Symbols Outlined。不新增任何色票或字型，不使用 emoji。
- 不改變 favorite（`exploreStore.toggleFavorite`）、install（`skillStore.assignSkillToAgent`）背後的資料流，只換視覺容器。
- 不重新設計三個 Modal（`AgentDetailModal`/`SkillDetailModal`/`AssignSkillToAgentModal`）的版面結構。
- 不對清單重新排序——熱門 Agent 不會被排到最前面，只用一個小角標標示，維持 `exploreStore.agents` 原本的陣列順序。
- 全部使用 `<script setup lang="ts">`，禁止 Options API；樣式一律寫在 `src/scss/`，禁止 `<style scoped>`；import 一律用 `@/` alias；顏色一律用 CSS Custom Properties，不寫死 hex。
- 本次不新增任何 `.scss` 檔案，只修改既有的 `src/scss/views/_Explore.scss`。
- 沒有任何一步需要呼叫 `src/services/http.ts`。
- **執行環境註記**：Task 1（`AgentCard.vue`）會把 `rank` prop 換成 `featured`/`badgeLabel`，但 `Explore.vue` 要到 Task 4 才會跟著改——這中間 `npm run type-check` 對 `Explore.vue` 會出現預期中的暫時性錯誤（呼叫端還在用舊的 `rank` prop），這是刻意的由下而上施工順序（先改葉節點元件，容器最後改），不是需要提前修的迴歸，Task 4 完成後這些錯誤會全部消失。

---

### Task 1: `AgentCard.vue` — 改寫成清單列元件

**Files:**
- Modify: `src/components/Explore/AgentCard.vue`（整檔重寫）

**Interfaces:**
- Consumes: `Agent`（`@/stores/exploreStore`，不變）
- Produces: `AgentCard` props 從 `{ agent: Agent; rank?: number; isFavorite?: boolean }` 改成 `{ agent: Agent; featured?: boolean; isFavorite?: boolean; badgeLabel?: string }`，emit `click`（不變）

- [ ] **Step 1: 改寫 `AgentCard.vue`**

```vue
<template>
  <div class="explore-row" :class="{ 'explore-row--featured': featured }" @click="emit('click')">
    <div :class="['explore-row-icon', `agent-icon--${agent.colorKey}`]">
      <i class="material-symbols-outlined">{{ agent.icon }}</i>
    </div>
    <div class="explore-row-body">
      <p class="explore-row-question">{{ agent.painPoint }}</p>
      <div class="explore-row-meta">
        <span class="explore-row-name">{{ agent.name }}</span>
        <i v-if="isFavorite" class="material-symbols-outlined material-fill explore-row-star">star</i>
      </div>
    </div>
    <span v-if="badgeLabel" class="explore-row-badge">{{ badgeLabel }}</span>
  </div>
</template>

<script setup lang="ts">
import type { Agent } from '@/stores/exploreStore'

defineProps<{
  agent: Agent
  featured?: boolean
  isFavorite?: boolean
  badgeLabel?: string
}>()

const emit = defineEmits<{
  click: []
}>()
</script>
```

（拿掉 `rank`/`podium-card`/`rank-badge` 那整套頒獎台視覺概念——不是留著沒用到，是這次改版直接廢棄，`_Explore.scss` 對應的 CSS 會在 Task 3 一併刪掉。`lively-card` class 這次刻意不加在 `.explore-row` 上：新的 `.explore-row:hover`（Task 3 新增）自己有一套背景色+陰影的 hover 效果，跟 `lively-card` 的上浮+放大效果同時套用會造成 cascade 衝突——2026-08-14 那次視覺改版的 spec 就明確警告過這件事。`.explore-list` 容器仍然保留 `lively-stagger`，進場動畫維持。）

- [ ] **Step 2: 型別檢查**

Run: `npm run type-check`
Expected: `AgentCard.vue` 本身無錯誤；`Explore.vue` 會出現預期中的暫時性錯誤（呼叫端還在傳 `rank` prop），這是 Global Constraints 已說明的已知狀態，不用修

- [ ] **Step 3: Commit**

```bash
git add src/components/Explore/AgentCard.vue
git commit -m "refactor(explore): AgentCard becomes a list row, drop podium/rank concept"
```

---

### Task 2: `ExploreSkillCard.vue` — 改寫成清單列元件

**Files:**
- Modify: `src/components/Explore/ExploreSkillCard.vue`（整檔重寫）

**Interfaces:**
- Consumes: `Skill`（`@/stores/skillStore`，不變）、`getSkillVisual`（`@/stores/exploreStore`，不變）
- Produces: props 不變（`{ skill: Skill }`），emit `click`（不變），只換內部 template/class

- [ ] **Step 1: 改寫 `ExploreSkillCard.vue`**

```vue
<template>
  <div class="explore-row" @click="emit('click')">
    <div :class="['explore-row-icon', `agent-icon--${visual.colorKey}`]">
      <i class="material-symbols-outlined">{{ visual.icon }}</i>
    </div>
    <div class="explore-row-body">
      <p class="explore-row-question">{{ capabilityText }}</p>
      <div class="explore-row-meta">
        <span class="explore-row-name">{{ skill.name }}</span>
        <span v-if="skill.functionType" class="explore-row-tag">{{ skill.functionType }}</span>
      </div>
    </div>
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

- [ ] **Step 2: 型別檢查**

Run: `npm run type-check`
Expected: `ExploreSkillCard.vue` 本身無錯誤（這個元件的 props 沒變，`Explore.vue` 呼叫端不會因為這個檔案出現新錯誤）

- [ ] **Step 3: Commit**

```bash
git add src/components/Explore/ExploreSkillCard.vue
git commit -m "refactor(explore): ExploreSkillCard becomes a list row"
```

---

### Task 3: `_Explore.scss` — 刪除舊版面樣式、新增清單樣式

**Files:**
- Modify: `src/scss/views/_Explore.scss`（整檔重寫）

**Interfaces:**
- 無程式介面，純 CSS。新增的 class：`.explore-list`、`.explore-row`、`.explore-row--featured`、`.explore-row-icon`、`.explore-row-body`、`.explore-row-question`、`.explore-row-meta`、`.explore-row-name`、`.explore-row-star`、`.explore-row-tag`、`.explore-row-badge`。刪除的 class：`.search-chips`/`.chip`、`.recs-chips`/`.recs-chip`、`.explore-hero`/`.hero-*`、`.section-header`（只有這個 `.Explore` 範圍內的定義是死的——`SkillManagement.vue` 有自己另一份不受影響的 `.section-header`，不是同一條規則）、`.agent-favorite-mark`、`.ranking-podium`/`.podium-card`/`.rank-badge`/`.ranking-more`（含底下 `@media (max-width: 620px)` 那個響應式區塊）、`.recs-box`/`.recs-header`/`.recs-avatar`/`.recs-title`/`.recs-grid`/`.rec-card`、`.skill-grid`/`.explore-skill-card`。

- [ ] **Step 1: 用下面的完整內容取代整個檔案**

```scss
// ── Explore 頁面 Wise 設計系統 ─────────────────────────────────────────────────

.Explore.views-page {
  background: var(--page-bg);
  position: relative;
}

.Explore .views-page-content-box {
  position: relative;
  background: var(--page-bg) !important;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  box-shadow: none;
  border: none;
  border-radius: 0;
}

.Explore {
  // ── 搜尋列 ──────────────────────────────────────
  .explore-search-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--surface);
    border: 1px solid var(--divider);
    border-radius: 9999px;
    padding: 11px 20px;
    margin-bottom: 12px;
    box-shadow: rgba(var(--shadow), 0.06) 0px 2px 8px;
    cursor: text;
    transition: box-shadow 0.18s;

    &:focus-within {
      box-shadow: rgba(var(--shadow), 0.12) 0px 0px 0px 2px;
    }

    i {
      font-size: 18px;
      color: var(--text-faint);
      flex-shrink: 0;
    }

    input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 15px;
      font-weight: 600;
      color: var(--text);
      background: transparent;
      font-feature-settings: "calt";

      &::placeholder {
        color: var(--text-faint);
        font-weight: 400;
      }
    }
  }

  // Agent 圖示色系：對應 --tag-*-bg/text token（light/dark 都有定義），
  // 用固定色票取代每個 agent 各自寫死的 hex，深色模式才會正確換色
  .agent-icon,
  .explore-modal-icon,
  .explore-row-icon {
    &.agent-icon--violet { background: var(--tag-violet-bg); i { color: var(--tag-violet-text); } }
    &.agent-icon--blue   { background: var(--tag-blue-bg);   i { color: var(--tag-blue-text); } }
    &.agent-icon--amber  { background: var(--tag-amber-bg);  i { color: var(--tag-amber-text); } }
    &.agent-icon--teal   { background: var(--tag-teal-bg);   i { color: var(--tag-teal-text); } }
    &.agent-icon--green  { background: var(--tag-green-bg);  i { color: var(--tag-green-text); } }
    &.agent-icon--rust   { background: var(--tag-rust-bg);   i { color: var(--tag-rust-text); } }
    &.agent-icon--rose   { background: var(--tag-rose-bg);   i { color: var(--tag-rose-text); } }
  }

  // ── 情境清單（Agent 探索／Skill 探索共用）──────────────────────
  .explore-list {
    display: flex;
    flex-direction: column;
  }

  .explore-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 8px;
    border-bottom: 1px solid var(--divider);
    cursor: pointer;

    &:last-child { border-bottom: none; }

    &:hover {
      background: var(--surface);
      box-shadow: var(--shadow-sm);
      border-radius: 12px;
      margin: 0 -12px;
      padding: 14px 20px;
    }

    &--featured {
      background: var(--surface);
      border: 1px solid var(--divider);
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 20px;

      .explore-row-icon { width: 56px; height: 56px; }
    }
  }

  .explore-row-icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    i { font-size: 26px; }
  }

  .explore-row-body { flex: 1; min-width: 0; }

  .explore-row-question {
    font-family: 'Public Sans', sans-serif;
    font-size: 14.5px;
    font-weight: 600;
    margin: 0 0 4px;
    line-height: 1.4;
    color: var(--text);
  }

  .explore-row-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-muted);
  }

  .explore-row-name { font-weight: 600; color: var(--text); }
  .explore-row-star { font-size: 14px; color: var(--tag-amber-text); }
  .explore-row-tag { font-size: 11px; color: var(--text-faint); }

  .explore-row-badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: .4px;
    padding: 2px 8px;
    border-radius: 6px;
    background: var(--tag-amber-bg);
    color: var(--tag-amber-text);
    flex-shrink: 0;
  }

  // ── Modal 內容（保留原樣）────────────────────────────────────────────────────
  .explore-modal-content {
    .explore-modal-icon {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 14px;

      i {
        font-size: 28px;
      }
    }

    .explore-modal-painpoint {
      font-size: 14px;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 6px;
    }

    .explore-modal-desc {
      font-size: 14px;
      color: var(--text-a70);
      line-height: 1.65;
      margin-bottom: 20px;
    }

    .explore-modal-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 24px;

      .explore-modal-tag {
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 500;
        background: var(--surface);
        color: var(--text-a70);
        border: 1px solid var(--divider);
      }
    }
  }

  .explore-modal-footer {
    display: flex;
    gap: 8px;

    .custom-btn {
      flex: 1;
    }
  }

  // Skill 功能類型標籤：需同時適用於清單列（.explore-row 內）與 Modal
  // （Modal 根層 .Explore.explore-modal-box 與頁面 .Explore.views-page 是兩個平行的
  // .Explore 子樹，因此不掛在 .explore-row 或 .views-page 之下，直接掛在 .Explore）
  .skill-function-badge {
    @extend %badge-shape;
    background: var(--tag-slate-bg);
    color: var(--tag-slate-text);
  }

  // 找不到符合條件的空狀態：跟 .skill-function-badge 同樣的理由，Agent／Skill 探索的
  // 清單空狀態與 AssignSkillToAgentModal 的 Agent 選擇器都要用得到，
  // 而 Modal 根層 .Explore.explore-modal-box 跟頁面 .Explore.views-page 是平行子樹，
  // 所以不掛在 .views-page 之下，直接掛在 .Explore
  .explore-empty-state {
    text-align: center;
    color: var(--text-muted);
    padding: 40px 0;
    font-size: 14px;
  }
}

.Explore.views-page {
  .explore-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;

    .explore-tab {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 999px;
      border: 1px solid var(--divider-a50);
      background: var(--surface);
      color: var(--text-muted);
      font-size: 14px;
      cursor: pointer;

      .material-symbols-outlined { font-size: 18px; }

      &.active {
        background: var(--accent);
        border-color: var(--accent);
        color: var(--primary-hover);
      }

      &:hover:not(.active) { background: var(--page-bg); }
    }
  }
}

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

.assign-agent-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--tag-slate-bg);

  i {
    font-size: 18px;
    color: var(--tag-slate-text);
  }
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

- [ ] **Step 2: 執行 build 確認 SCSS 編譯成功**

Run: `npm run build`
Expected: 成功（`%badge-shape` 這個 placeholder 定義在 `src/scss/_custom.scss`，同一次編譯範圍內，`@extend` 可以正常解析）

- [ ] **Step 3: Commit**

```bash
git add src/scss/views/_Explore.scss
git commit -m "style(explore): replace hero/podium/grid CSS with quiet list styles"
```

---

### Task 4: `Explore.vue` — 拿掉 Hero/頒獎台/推薦網格，改成清單；重寫既有 3 個測試檔案

**Files:**
- Modify: `src/views/Explore.vue`（整檔重寫）
- Modify: `src/views/__tests__/Explore.ranking.test.ts`（整檔重寫）
- Modify: `src/views/__tests__/Explore.skillTab.test.ts`（整檔重寫）
- Modify: `src/views/__tests__/Explore.favorite.test.ts`（整檔重寫）

**Interfaces:**
- Consumes: `AgentCard`（Task 1，props `{agent, featured?, isFavorite?, badgeLabel?}`）、`ExploreSkillCard`（Task 2，props 不變）、`exploreStore`/`skillStore`（不變）

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
        />
      </div>

      <AgentCard
        :agent="featuredAgent"
        featured
        :is-favorite="exploreStore.isFavorite(featuredAgent.id)"
        @click="openModal(featuredAgent)"
      />

      <div v-if="!filteredAgents.length" class="explore-empty-state">找不到符合條件的 Agent</div>
      <div v-else class="explore-list lively-stagger">
        <AgentCard
          v-for="agent in filteredAgents"
          :key="agent.id"
          :agent="agent"
          :is-favorite="exploreStore.isFavorite(agent.id)"
          :badge-label="badgeLabelFor(agent)"
          @click="openModal(agent)"
        />
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
        />
      </div>

      <div v-if="!filteredExploreSkills.length" class="explore-empty-state">找不到符合條件的技能</div>
      <div v-else class="explore-list lively-stagger">
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
import type { Skill } from '@/stores/skillStore'
import AgentCard from '@/components/Explore/AgentCard.vue'
import ExploreSkillCard from '@/components/Explore/ExploreSkillCard.vue'
import AgentDetailModal from '@/components/Explore/AgentDetailModal.vue'
import SkillDetailModal from '@/components/Explore/SkillDetailModal.vue'
import AssignSkillToAgentModal from '@/components/Explore/AssignSkillToAgentModal.vue'

const rootStore = useRootStore()
const { isEnterAppSearchPage } = storeToRefs(rootStore)

const exploreStore = useExploreStore()
const skillStore = useSkillStore()

const activeExploreTab = ref<'agent' | 'skill'>('agent')

// Featured hero agent（維持寫死指定「內容創作者」，跟改版前邏輯相同）
const featuredAgent = computed(() => exploreStore.agents.find(a => a.name === '內容創作者')!)

// 熱門角標名單：跟以前「使用熱度榜」同一份資料，只是不再切出頒獎台/次要列，
// 改成清單裡的一個小角標。優先序：Agent 自己的 badge（new/sat）> 熱門角標。
const RANKING_NAMES = ['內容創作者', '社群管理', '專案管理', '顧客服務管理']

function badgeLabelFor(agent: Agent): string | undefined {
  if (agent.badge) return agent.badge.label
  if (agent.name !== featuredAgent.value.name && RANKING_NAMES.includes(agent.name)) return '熱門'
  return undefined
}

// 搜尋（即時篩選，不需要按 Enter；拿掉分類 chip 之後搜尋框是唯一的縮小範圍工具）
const searchKeyword = ref('')

const otherAgents = computed(() =>
  exploreStore.agents.filter(a => a.name !== featuredAgent.value.name)
)

const filteredAgents = computed(() =>
  otherAgents.value.filter(a =>
    !searchKeyword.value.trim() ||
    a.name.includes(searchKeyword.value.trim()) ||
    a.tags.some(t => t.includes(searchKeyword.value.trim()))
  )
)

// Agent 詳情 Modal
const isModalOpen = ref(false)
const selectedAgent = ref<Agent | null>(null)

function openModal(agent: Agent) {
  selectedAgent.value = agent
  isModalOpen.value = true
}

// Skill 探索：資料源接真正的 skillStore，只列出非個人草稿、目前啟用中、未刪除的技能
const skillSearchKeyword = ref('')

const publicSkills = computed(() =>
  skillStore.skills.filter(s => s.zone !== 'personal' && s.isEnabled && !s.deletedAt)
)

const filteredExploreSkills = computed(() =>
  publicSkills.value.filter(s =>
    !skillSearchKeyword.value.trim() || s.name.includes(skillSearchKeyword.value.trim())
  )
)

const isSkillModalOpen = ref(false)
const selectedSkill = ref<Skill | null>(null)

function openSkillModal(skill: Skill) {
  selectedSkill.value = skill
  isSkillModalOpen.value = true
}

const isAssignModalOpen = ref(false)
</script>
```

（`popDialog` 這個 import 這次整個拿掉——舊版 `onSearchEnter`/`showToast`/`onSkillSearchEnter` 都是唯一還在用它的地方，這三個函式全部隨著 Hero/頒獎台/「查看全部」連結一起被移除，`Explore.vue` 本身不再需要跳 toast。收藏/安裝的 toast 邏輯本來就在 `AgentDetailModal.vue`/`AssignSkillToAgentModal.vue` 裡，不受影響。）

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

describe('Explore Agent 探索：情境清單', () => {
  it('由我推薦精選列顯示內容創作者，套用 explore-row--featured', () => {
    const wrapper = mountExplore()
    const featured = wrapper.find('.explore-row--featured')
    expect(featured.exists()).toBe(true)
    expect(featured.find('.explore-row-name').text()).toBe('內容創作者')
  })

  it('精選 Agent 不會在下方清單重複出現，其餘 9 筆都渲染成清單列', () => {
    const wrapper = mountExplore()
    const rows = wrapper.findAll('.explore-list .explore-row')
    const names = rows.map(r => r.find('.explore-row-name').text())
    expect(names).not.toContain('內容創作者')
    expect(rows).toHaveLength(9)
  })

  it('沒有自己 badge、但在熱門排行名單內的 Agent 顯示「熱門」角標', () => {
    const wrapper = mountExplore()
    const rows = wrapper.findAll('.explore-list .explore-row')
    const socialRow = rows.find(r => r.find('.explore-row-name').text() === '社群管理')!
    expect(socialRow.find('.explore-row-badge').text()).toBe('熱門')
  })

  it('自己有 badge 的 Agent 優先顯示自己的角標，即使也在熱門排行名單內', () => {
    const wrapper = mountExplore()
    const rows = wrapper.findAll('.explore-list .explore-row')
    const csRow = rows.find(r => r.find('.explore-row-name').text() === '顧客服務管理')!
    expect(csRow.find('.explore-row-badge').text()).toBe('高滿意度')
  })

  it('不在熱門排行名單、也沒有自己 badge 的 Agent 不顯示角標', () => {
    const wrapper = mountExplore()
    const rows = wrapper.findAll('.explore-list .explore-row')
    const designRow = rows.find(r => r.find('.explore-row-name').text() === '設計助理')!
    expect(designRow.find('.explore-row-badge').exists()).toBe(false)
  })

  it('清單容器套用 lively-stagger 進場動畫（單列不再套用 lively-card，避免 hover 效果衝突）', () => {
    const wrapper = mountExplore()
    expect(wrapper.find('.explore-list').classes()).toContain('lively-stagger')
    wrapper.findAll('.explore-list .explore-row').forEach(r => expect(r.classes()).not.toContain('lively-card'))
  })
})

describe('Explore Agent 搜尋（即時篩選，不需要按 Enter）', () => {
  it('輸入關鍵字時清單即時縮小', async () => {
    const wrapper = mountExplore()
    const input = wrapper.find('.explore-search-bar input')
    await input.setValue('設計')

    const rows = wrapper.findAll('.explore-list .explore-row')
    expect(rows).toHaveLength(1)
    expect(rows[0].find('.explore-row-name').text()).toBe('設計助理')
  })

  it('關鍵字比對 tags 也算符合（搜尋「行銷」會找到社群管理）', async () => {
    const wrapper = mountExplore()
    const input = wrapper.find('.explore-search-bar input')
    await input.setValue('行銷')

    const rows = wrapper.findAll('.explore-list .explore-row')
    expect(rows).toHaveLength(1)
    expect(rows[0].find('.explore-row-name').text()).toBe('社群管理')
  })

  it('找不到符合條件的 Agent 時顯示空狀態', async () => {
    const wrapper = mountExplore()
    const input = wrapper.find('.explore-search-bar input')
    await input.setValue('絕對不存在的關鍵字xyz')

    expect(wrapper.find('.explore-empty-state').text()).toBe('找不到符合條件的 Agent')
  })
})
```

- [ ] **Step 3: 執行測試確認通過**

Run: `npx vitest run src/views/__tests__/Explore.ranking.test.ts`
Expected: PASS（8 個測試都過）

- [ ] **Step 4: 重寫 `Explore.skillTab.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Explore from '../Explore.vue'

function mountExplore() {
  setActivePinia(createPinia())
  return mount(Explore, { global: { stubs: { compModal: true } } })
}

describe('Explore Skill 探索分頁', () => {
  it('點擊「Skill 探索」分頁後顯示技能清單，Agent 分頁的精選列不再存在', async () => {
    const wrapper = mountExplore()
    expect(wrapper.find('.explore-row--featured').exists()).toBe(true)

    const tabs = wrapper.findAll('.explore-tab')
    await tabs[1].trigger('click')

    expect(wrapper.find('.explore-list').exists()).toBe(true)
    expect(wrapper.find('.explore-row--featured').exists()).toBe(false)
  })

  it('輸入搜尋關鍵字「會議」時，清單只剩 1 筆（會議摘要），不需要按 Enter', async () => {
    const wrapper = mountExplore()
    const tabs = wrapper.findAll('.explore-tab')
    await tabs[1].trigger('click')

    const input = wrapper.find('.explore-search-bar input')
    await input.setValue('會議')

    const rows = wrapper.findAll('.explore-list .explore-row')
    expect(rows).toHaveLength(1)
    expect(rows[0].find('.explore-row-name').text()).toBe('會議摘要')
  })

  it('找不到符合條件的技能時顯示空狀態', async () => {
    const wrapper = mountExplore()
    const tabs = wrapper.findAll('.explore-tab')
    await tabs[1].trigger('click')

    const input = wrapper.find('.explore-search-bar input')
    await input.setValue('絕對不存在的關鍵字xyz')

    expect(wrapper.find('.explore-empty-state').text()).toBe('找不到符合條件的技能')
  })
})
```

- [ ] **Step 5: 執行測試確認通過**

Run: `npx vitest run src/views/__tests__/Explore.skillTab.test.ts`
Expected: PASS（3 個測試都過）

- [ ] **Step 6: 重寫 `Explore.favorite.test.ts`**

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
  it('點擊精選列開啟詳情 Modal 後，按「加入常用清單」會把該 Agent 加入常用清單，按鈕文字同步更新', async () => {
    const wrapper = mountExplore()
    const exploreStore = useExploreStore()
    const firstAgent = exploreStore.agents.find(a => a.name === '內容創作者')!

    await wrapper.find('.explore-row--featured').trigger('click')

    const favoriteBtn = wrapper.find('.explore-modal-footer .custom-main-btn')
    expect(favoriteBtn.text()).toBe('加入常用清單')

    await favoriteBtn.trigger('click')

    expect(exploreStore.isFavorite(firstAgent.id)).toBe(true)
    expect(favoriteBtn.text()).toBe('已加入常用清單')
  })

  it('已加入常用清單的 Agent，清單列上顯示收藏星號', async () => {
    const wrapper = mountExplore()
    const exploreStore = useExploreStore()
    const firstAgent = exploreStore.agents.find(a => a.name === '內容創作者')!
    exploreStore.toggleFavorite(firstAgent.id)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.explore-row--featured .explore-row-star').exists()).toBe(true)
  })
})
```

- [ ] **Step 7: 執行測試確認通過**

Run: `npx vitest run src/views/__tests__/Explore.favorite.test.ts`
Expected: PASS（2 個測試都過）

- [ ] **Step 8: 型別檢查與完整測試**

Run: `npm run type-check && npx vitest run src/views`
Expected: 全部無錯誤、全部通過（Task 1/2 留下的暫時性 `Explore.vue` 型別錯誤這裡應該全部消失）

- [ ] **Step 9: Commit**

```bash
git add src/views/Explore.vue src/views/__tests__/Explore.ranking.test.ts src/views/__tests__/Explore.skillTab.test.ts src/views/__tests__/Explore.favorite.test.ts
git commit -m "refactor(explore): replace hero/podium/grid layout with quiet scenario list"
```

---

### Task 5: Modal 一致性檢查

**Files:**
- Verify（預期不需要修改）: `src/components/Explore/AgentDetailModal.vue`、`src/components/Explore/SkillDetailModal.vue`、`src/components/Explore/AssignSkillToAgentModal.vue`
- Modify（僅在發現問題時）：同上

**Interfaces:**
- 無變更

- [ ] **Step 1: 檢查三個 Modal 有沒有寫死的顏色/字型**

Run: `grep -n "color:\s*#\|background:\s*#\|font-family:" src/components/Explore/AgentDetailModal.vue src/components/Explore/SkillDetailModal.vue src/components/Explore/AssignSkillToAgentModal.vue`

Expected: 這三個檔案本身沒有 `<style>` block（樣式都在 `_Explore.scss` 裡，Modal 檔案內只有 template/script），所以這個指令預期沒有輸出。如果有輸出，代表確實有內嵌寫死樣式，這種情況才需要往下修。

- [ ] **Step 2: 確認 Modal 用到的既有 class 都符合 token 系統**

檢查 `_Explore.scss` 裡 `.explore-modal-icon`（用 `agent-icon--{colorKey}` token）、`.explore-modal-*`（`.explore-modal-painpoint`/`.explore-modal-desc`/`.explore-modal-tags`）、`.skill-function-badge`（`@extend %badge-shape` + `--tag-slate-*`）、`.assign-agent-*`（`--tag-slate-*`/`--divider`/`--hint`/`--text-muted`）——這些在 Task 3 已經確認全部維持不變，沒有寫死色碼。這一步只是再次確認 Task 3 的重寫沒有不小心遺漏或改動到這些規則。

Run: `grep -n "explore-modal-icon\|explore-modal-painpoint\|explore-modal-desc\|explore-modal-tags\|explore-modal-footer\|skill-function-badge\|assign-agent-search\|assign-agent-list\|assign-agent-icon\|assign-agent-item" src/scss/views/_Explore.scss`

Expected: 每一個都至少出現一次，且內容符合本文件 Task 3 Step 1 裡貼出的完整檔案內容（`.skill-function-badge` 有 `@extend %badge-shape;` + `--tag-slate-bg`/`--tag-slate-text`；`.assign-agent-icon` 背景是 `--tag-slate-bg`；其餘 `.explore-modal-*` 都用 `var(--...)` token，沒有寫死色碼）——不要跟任何 git 歷史比對，直接對照 Task 3 貼出的內容逐條核對即可。

- [ ] **Step 3: 如果 Step 1/2 發現任何問題，在這裡修正**

（預期不會發現問題——這一步只在真的有發現時才動手，修正範圍限定在顏色/字型，不改版面結構）

- [ ] **Step 4: 完整測試 + build 一次**

Run: `npm run type-check && npm run build && npx vitest run`
Expected: 全部無錯誤、全部通過

- [ ] **Step 5: Commit（僅在 Step 3 有實際修改時才需要）**

```bash
git add src/components/Explore/AgentDetailModal.vue src/components/Explore/SkillDetailModal.vue src/components/Explore/AssignSkillToAgentModal.vue
git commit -m "style(explore): align modal styling with token system"
```

---

## 完成後整體驗證

- [ ] Run: `npm run type-check && npm run build && npx vitest run`
- Expected: 全部通過（型別、build、全部單元/元件測試）
- [ ] 手動驗證（`npm run dev`）：
  1. Agent 探索：精選列（內容創作者）＋清單。角標分三類，逐一核對（實際以 `exploreStore.ts` 當下資料為準）：只有「熱門」（社群管理、專案管理）；自己的 badge 蓋過熱門（顧客服務管理、記帳助理 → 顯示「高滿意度」；財務分析師、SEO 專家、人資行政助理 → 顯示「新上架」）；完全沒有角標（設計助理、會議記錄員）
  2. 輸入搜尋關鍵字即時篩選，不需要按 Enter
  3. 收藏一個 Agent，清單列上出現星號，重新整理後狀態仍在（localStorage 生效）
  4. Skill 探索：清單顯示真實技能資料，搜尋即時篩選，找不到時顯示空狀態
  5. 點一個技能 →「加入我的技能」→ 選一個 Agent → 確認正常安裝
  6. Light/Dark 兩種主題下清單、精選列、角標、icon 色塊都要正常顯示，比對 `--tag-*`/`--primary`/`--surface` 系列 token 在兩種主題下的實際渲染結果
  7. 窄螢幕（&lt;480px）下清單不會出現非預期的橫向捲軸（`.explore-row:hover` 用 `margin: 0 -12px` 撐開範圍，需要確認外層 padding 夠用）
