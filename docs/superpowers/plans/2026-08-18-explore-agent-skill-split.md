# 探索頁面改版：Agent／Skill 雙分頁 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `src/views/Explore.vue` 從單一 Agent 導向的探索頁，改成「Agent 探索」／「Skill 探索」雙分頁：Agent 卡片主打情境痛點文字，Skill 卡片主打功能分類，兩者資料模型與版面各自獨立。

**Architecture:** 在既有 `Explore.vue` 內新增一個 `activeExploreTab` 分頁狀態，把現有 Agent 版面包進 `v-if` 區塊並補上 `painPoint` 欄位；抽出一個共用的 `AgentCard.vue` 元件取代頒獎台/大家都在用兩處重複的卡片 template；最後新增一組獨立的 `ExploreSkill` 資料模型、`ExploreSkillCard.vue` 元件與 Skill 分頁版面。全部資料維持寫死在 `Explore.vue`（不接 store），不新增 scss 檔案（沿用既有 `src/scss/views/_Explore.scss`）。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、SCSS（`src/scss/` 管理，禁止 `<style scoped>`）。

## Global Constraints

**2026-08-18 修訂說明（Task 1 完成後才發現）：** 本文件與同名 spec 原始版本誤把另一個尚未合併回 `main` 的並行分支上的 `Explore.vue`（用 `colorKey: ColorKey` CSS class 做圖示配色）當成 `main` 現況。`main`／`origin/main` 上實際的 `Agent`／`ExploreSkill` 圖示配色欄位是 `bgColor: string`／`accentColor: string`（inline style，寫死 hex，沿用既有調色盤）。Task 1 已經照實際檔案結構正確實作（未受影響，因為 Task 1 不touch 顏色欄位）；Task 2、Task 3 以下的程式碼範例已全部修正為 `bgColor`/`accentColor`，不要再套用任何 `colorKey`/`ColorKey` 相關程式碼。

- 使用 `<script setup lang="ts">`，禁止 Options API。
- 樣式統一在 `src/scss/` 管理，禁止 `<style scoped>`；本次不新增 scss 檔案，所有新 class 都加進既有的 `src/scss/views/_Explore.scss`（已被 `src/scss/views/_index.scss` `@import`，不需要額外處理 index）。
- 不接真實 `skillStore`／後端資料——`ExploreSkill` 是這個頁面自己的 mock 資料，跟 `skillStore.ts` 的 `Skill`型別無關，不互相 import。
- 不建立全站共用 `Agent`／`AgentStore`——`Agent` interface 維持是 `Explore.vue` 專屬的展示型別。
- 不動 2026-08-14 視覺改版 spec 已完成的頒獎台版型／`lively-*` 動畫 class，Agent 分頁沿用現有版面結構，只換卡片內顯示的文字欄位。
- Skill 探索不做頒獎台／人氣競賽式編排，版面比 Agent 分頁精簡（搜尋 + 功能類型 chip + 熱門技能網格）。
- `AgentBadge`（`new`/`hot`/`sat`）型別沿用給 Skill 用，但 Skill mock 資料只使用 `new`／`hot`，不使用 `sat`。

---

## Task 1: 分頁籤切換 + Agent `painPoint` 欄位

**Files:**
- Modify: `src/views/Explore.vue`（template 全部區塊、`Agent` interface、`allAgents` mock 資料、`<script setup>` 新增 `activeExploreTab`）

**Interfaces:**
- Produces: `activeExploreTab: Ref<'agent' | 'skill'>`——Task 3 會用它來控制 Skill 分頁的 `v-if`。`Agent` interface 新增 `painPoint: string`（必填）——Task 2 抽出的 `AgentCard.vue` 會消費這個欄位。

- [ ] **Step 1: 在 `Agent` interface 新增 `painPoint` 欄位**

`src/views/Explore.vue`，把（第 202-210 行）：

```ts
interface Agent {
  name: string
  desc: string
  icon: string
  colorKey: ColorKey
  tags: string[]
  badge?: AgentBadge
  categories: string[]
}
```

改為：

```ts
interface Agent {
  name: string
  desc: string
  painPoint: string
  icon: string
  colorKey: ColorKey
  tags: string[]
  badge?: AgentBadge
  categories: string[]
}
```

- [ ] **Step 2: 幫 10 筆 `allAgents` mock 資料補上 `painPoint`**

`src/views/Explore.vue` 第 212-298 行的 `allAgents` 陣列，在每一筆物件的 `desc` 欄位後面新增一行 `painPoint`，內容依序如下（跟現有物件的其他欄位一起保留，只新增這一行，位置緊接在 `desc:` 之後）：

```ts
const allAgents: Agent[] = [
  {
    name: '內容創作者',
    desc: '撰寫高品質的文章與多媒體內容，精準策略角度，吸引目標受眾，增強社交媒體互動。',
    painPoint: '還在對著空白文件發呆，不知道從何下筆？',
    icon: 'edit_note',
    colorKey: 'violet',
    tags: ['內容', '創作', '社群', '行銷'],
    categories: ['全部', '文件撰寫'],
  },
  {
    name: '社群管理',
    desc: '管理各平台社群，增進用戶互動，制定策略以提升用戶忠誠度和品牌影響力。',
    painPoint: '每天要顧好幾個社群帳號，回覆訊息回到分身乏術？',
    icon: 'group',
    colorKey: 'teal',
    tags: ['社群', '行銷', '策略', '互動'],
    categories: ['全部'],
  },
  {
    name: '專案管理',
    desc: '從規劃到執行，確保資源最佳配置和時程有效利用。',
    painPoint: '專案時程一多，資源分配跟進度追蹤就開始亂？',
    icon: 'task_alt',
    colorKey: 'amber',
    tags: ['專案', '管理', '規劃', '執行'],
    categories: ['全部', '會議準備'],
  },
  {
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
    name: '設計助理',
    desc: '協助創建視覺素材，提供設計建議與排版指引，提升品牌視覺一致性。',
    painPoint: '想要的視覺效果說不清楚，設計來回改版改到懷疑人生？',
    icon: 'palette',
    colorKey: 'rose',
    tags: ['設計', '素材', '視覺', '排版'],
    categories: ['全部', '設計輔助'],
  },
  {
    name: '會議記錄員',
    desc: '自動整理會議記錄，摘要關鍵決議與行動項目，確保團隊決策能落實執行。',
    painPoint: '開完會才發現重點都忘了，行動項目沒人跟進？',
    icon: 'mic',
    colorKey: 'violet',
    tags: ['會議', '記錄', '摘要', '行動'],
    categories: ['全部', '會議準備'],
  },
]
```

- [ ] **Step 3: 新增 `activeExploreTab` 狀態**

`src/views/Explore.vue`，在 `const searchKeyword = ref('')`（第 174 行）前面新增：

```ts
const activeExploreTab = ref<'agent' | 'skill'>('agent')
```

- [ ] **Step 4: template 加上分頁籤列，並把現有內容包進 `v-if="activeExploreTab === 'agent'"`**

把（第 1-133 行，`<template>` 開頭到 `.views-page-content-box` 結束）：

```html
<template>
  <div class="Explore views-page" v-show="!isEnterAppSearchPage">
    <div class="views-page-content-box">

      <!-- 搜尋列 -->
      <div class="explore-search-bar">
```

改為：

```html
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
```

這個步驟在 Step 5（`desc` → `painPoint` 文字替換）之前執行，此時 `rec-card-desc` 那行還是原本的 `{{ agent.desc }}`。用這一行當獨一無二的錨點（這段文字在檔案裡只出現一次）：

```html
            <p class="rec-card-desc">{{ agent.desc }}</p>
          </div>
        </div>

      </div>

    </div>
  </div>
```

改為（新增一個 `</template>` 收掉 Agent 分頁的 `v-if`，位置在 `.recs-box` 的 `</div>` 之後、`.views-page-content-box` 的 `</div>` 之前）：

```html
            <p class="rec-card-desc">{{ agent.desc }}</p>
          </div>
        </div>

      </div>

      </template>

    </div>
  </div>
```

（Skill 分頁的 `<template v-if="activeExploreTab === 'skill'">...</template>` 會在 Task 3 加在這個新 `</template>` 之後、`.views-page-content-box` 的 `</div>` 之前——這個任務先確保 Agent 區塊被正確包住即可，不用預留空位。）

- [ ] **Step 5: 卡片顯示欄位從 `desc` 換成 `painPoint`**

以下 5 處，把顯示 `agent.desc`／`featuredAgent.desc`／`fourthRankedAgent.desc` 的地方換成對應的 `painPoint`：

Hero Banner（原第 35 行）：
```html
          <div class="hero-cta-desc">{{ featuredAgent.desc }}</div>
```
改為：
```html
          <div class="hero-cta-desc">{{ featuredAgent.painPoint }}</div>
```

頒獎台卡片（原第 57 行，在 `podium-card` 的 `<p>` 標籤）：
```html
          <p>{{ agent.desc }}</p>
```
改為：
```html
          <p>{{ agent.painPoint }}</p>
```

第四名（原第 70 行）：
```html
        <span class="ranking-more-desc">{{ fourthRankedAgent.desc }}</span>
```
改為：
```html
        <span class="ranking-more-desc">{{ fourthRankedAgent.painPoint }}</span>
```

「大家都在用」卡片（原第 92 行，在 `agent-card` 的 `<p>` 標籤）：
```html
          <p>{{ agent.desc }}</p>
```
改為：
```html
          <p>{{ agent.painPoint }}</p>
```

個人化推薦卡片（原第 126 行）：
```html
            <p class="rec-card-desc">{{ agent.desc }}</p>
```
改為：
```html
            <p class="rec-card-desc">{{ agent.painPoint }}</p>
```

- [ ] **Step 6: Modal 詳情新增 `painPoint` 引言**

把（原第 141-153 行）：

```html
    <template v-if="selectedAgent">
      <div class="Explore explore-modal-box">
        <div class="explore-modal-content">
          <div class="explore-modal-icon" :style="{ background: selectedAgent.bgColor }">
            <i class="material-symbols-outlined" :style="{ color: selectedAgent.accentColor }">{{ selectedAgent.icon }}</i>
          </div>
          <p class="explore-modal-desc">{{ selectedAgent.desc }}</p>
          <div class="explore-modal-tags">
            <span v-for="tag in selectedAgent.tags" :key="tag" class="explore-modal-tag">{{ tag }}</span>
          </div>
        </div>
      </div>
    </template>
```

改為：

```html
    <template v-if="selectedAgent">
      <div class="Explore explore-modal-box">
        <div class="explore-modal-content">
          <div class="explore-modal-icon" :style="{ background: selectedAgent.bgColor }">
            <i class="material-symbols-outlined" :style="{ color: selectedAgent.accentColor }">{{ selectedAgent.icon }}</i>
          </div>
          <p class="explore-modal-painpoint">{{ selectedAgent.painPoint }}</p>
          <p class="explore-modal-desc">{{ selectedAgent.desc }}</p>
          <div class="explore-modal-tags">
            <span v-for="tag in selectedAgent.tags" :key="tag" class="explore-modal-tag">{{ tag }}</span>
          </div>
        </div>
      </div>
    </template>
```

- [ ] **Step 7: 補上 scss——分頁籤樣式 + painPoint 文字樣式**

`src/scss/views/_Explore.scss`，在檔案最後面新增（沿用檔案裡既有的 `--tag-*`／`var(--text-*)` token 命名慣例，不寫死 hex）：

```scss
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
        background: $color_main_1;
        border-color: $color_main_1;
        color: #fff;
      }

      &:hover:not(.active) { background: var(--page-bg); }
    }
  }

  .explore-modal-painpoint {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 6px;
  }
}
```

- [ ] **Step 8: 型別檢查**

Run: `npm run type-check`
Expected: 無錯誤。

- [ ] **Step 9: 手動驗證**

Run: `npm run dev`：
1. 進入探索頁，確認頂部出現「Agent 探索」／「Skill 探索」兩個分頁籤，預設「Agent 探索」為 active 狀態。
2. 確認 Hero Banner、熱度榜頒獎台、第四名、大家都在用、個人化推薦這五處卡片，顯示的文字都是情境式痛點問句（例如「還在對著空白文件發呆，不知道從何下筆？」），不是原本的功能說明文字。
3. 點一張 Agent 卡片開啟 Modal，確認 `painPoint` 顯示在 `desc` 上方，字級較粗，兩段文字都看得到。
4. 點「Skill 探索」分頁籤，確認畫面暫時變空白或維持舊版（這個任務還沒實作 Skill 分頁內容，Task 3 才會補上）——這一步只是確認點擊分頁籤時 Agent 區塊會正確隱藏，不會報錯。

- [ ] **Step 10: Commit**

```bash
git add src/views/Explore.vue src/scss/views/_Explore.scss
git commit -m "feat(Explore): add Agent/Skill tabs and pain-point copy for Agent cards

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: 抽出 `AgentCard.vue`（頒獎台 + 大家都在用）

**Files:**
- Create: `src/components/Explore/AgentCard.vue`
- Modify: `src/views/Explore.vue`（頒獎台與「大家都在用」兩處 template，改用 `<AgentCard>`）

**Interfaces:**
- Consumes: Task 1 的 `Agent` interface（含 `painPoint`）。
- Produces: `AgentCard.vue` — props `{ agent: Agent; rank?: number }`，emit `click: []`。`rank` 有值時顯示名次徽章（頒獎台用），未傳時不顯示（大家都在用的網格用）。這個元件只服務這兩處，個人化推薦的 `rec-card` 版面不同，不使用這個元件（沿用 spec 的說明，避免為了共用硬塞 variant prop）。

- [ ] **Step 1: 建立 `AgentCard.vue`**

建立 `src/components/Explore/AgentCard.vue`：

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
    <div class="agent-icon" :style="{ background: agent.bgColor }">
      <i class="material-symbols-outlined" :style="{ color: agent.accentColor }">{{ agent.icon }}</i>
    </div>
    <h4>{{ agent.name }}</h4>
    <p>{{ agent.painPoint }}</p>
  </div>
</template>

<script setup lang="ts">
interface AgentBadge {
  type: 'new' | 'hot' | 'sat'
  label: string
}

interface Agent {
  name: string
  desc: string
  painPoint: string
  icon: string
  bgColor: string
  accentColor: string
  tags: string[]
  badge?: AgentBadge
  categories: string[]
}

defineProps<{
  agent: Agent
  rank?: number
}>()

const emit = defineEmits<{
  click: []
}>()
</script>
```

**注意：** `class` 綁定用 `agent-card-unit` 當共同的基底 class（如果 `_Explore.scss` 沒有這個 class 也沒關係，純粹當語意標記用，不影響視覺——實際外觀還是靠 `podium-card`／`agent-card` 這兩個既有 class），`rank !== undefined` 時渲染 `podium-card podium-card--rank-N`（頒獎台版面），否則渲染 `agent-card`（大家都在用版面）。這樣同一個元件可以同時服務兩處版面不同的卡片。

- [ ] **Step 2: 頒獎台改用 `AgentCard`**

`src/views/Explore.vue`，把（Task 1 完成後的）：

```html
      <div class="ranking-podium lively-stagger mb-3">
        <div
          v-for="(agent, i) in podiumAgents"
          :key="agent.name"
          :class="['podium-card', 'lively-card', `podium-card--rank-${i + 1}`]"
          @click="openModal(agent)"
        >
          <div class="rank-badge">{{ i + 1 }}</div>
          <div class="agent-icon" :style="{ background: agent.bgColor }">
            <i class="material-symbols-outlined" :style="{ color: agent.accentColor }">{{ agent.icon }}</i>
          </div>
          <h4>{{ agent.name }}</h4>
          <p>{{ agent.painPoint }}</p>
        </div>
      </div>
```

改為：

```html
      <div class="ranking-podium lively-stagger mb-3">
        <AgentCard
          v-for="(agent, i) in podiumAgents"
          :key="agent.name"
          :agent="agent"
          :rank="i + 1"
          @click="openModal(agent)"
        />
      </div>
```

- [ ] **Step 3:「大家都在用」改用 `AgentCard`**

把：

```html
      <div class="agent-grid agent-grid--4 lively-stagger mb-5">
        <div
          v-for="agent in popularAgents"
          :key="agent.name"
          class="agent-card lively-card"
          @click="openModal(agent)"
        >
          <span v-if="agent.badge" :class="['agent-badge', `agent-badge--${agent.badge.type}`]">
            {{ agent.badge.label }}
          </span>
          <div class="agent-icon" :style="{ background: agent.bgColor }">
            <i class="material-symbols-outlined" :style="{ color: agent.accentColor }">{{ agent.icon }}</i>
          </div>
          <h4>{{ agent.name }}</h4>
          <p>{{ agent.painPoint }}</p>
        </div>
      </div>
```

改為：

```html
      <div class="agent-grid agent-grid--4 lively-stagger mb-5">
        <AgentCard
          v-for="agent in popularAgents"
          :key="agent.name"
          :agent="agent"
          @click="openModal(agent)"
        />
      </div>
```

- [ ] **Step 4: import `AgentCard`**

`src/views/Explore.vue` 的 `<script setup>`，在 `import compModal from '@/components/compModal/compModal.vue'`（原第 167 行）後面新增：

```ts
import AgentCard from '@/components/Explore/AgentCard.vue'
```

- [ ] **Step 5: 型別檢查**

Run: `npm run type-check`
Expected: 無錯誤。

- [ ] **Step 6: 手動驗證**

Run: `npm run dev`：
1. 「Agent 探索」分頁的熱度榜頒獎台版面（含名次徽章、動畫）跟改動前視覺上完全一致。
2. 「大家都在用」網格版面（含 badge、動畫）跟改動前視覺上完全一致。
3. 點頒獎台或「大家都在用」的任一張卡片，確認一樣能正確開啟 Modal，內容正確對應到該 Agent。

- [ ] **Step 7: Commit**

```bash
git add src/components/Explore/AgentCard.vue src/views/Explore.vue
git commit -m "refactor(Explore): extract AgentCard component for podium and popular grid

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: Skill 探索分頁

**Files:**
- Create: `src/components/Explore/ExploreSkillCard.vue`
- Modify: `src/views/Explore.vue`（新增 `ExploreSkill` 型別、mock 資料、Skill 分頁 template、Skill Modal、篩選邏輯）
- Modify: `src/scss/views/_Explore.scss`（新增 Skill 卡片、功能分類標籤、Skill 網格樣式）

**Interfaces:**
- Consumes: Task 1 的 `activeExploreTab`。
- Produces: `ExploreSkillCard.vue` — props `{ skill: ExploreSkill }`，emit `click: []`。這是最後一個任務，沒有後續任務依賴它產生的介面。

- [ ] **Step 1: 建立 `ExploreSkillCard.vue`**

建立 `src/components/Explore/ExploreSkillCard.vue`：

```vue
<template>
  <div class="explore-skill-card lively-card" @click="emit('click')">
    <span v-if="skill.badge" :class="['agent-badge', `agent-badge--${skill.badge.type}`]">
      {{ skill.badge.label }}
    </span>
    <div class="agent-icon" :style="{ background: skill.bgColor }">
      <i class="material-symbols-outlined" :style="{ color: skill.accentColor }">{{ skill.icon }}</i>
    </div>
    <span class="skill-function-badge">{{ skill.functionType }}</span>
    <h4>{{ skill.name }}</h4>
    <p>{{ skill.capability }}</p>
  </div>
</template>

<script setup lang="ts">
interface AgentBadge {
  type: 'new' | 'hot' | 'sat'
  label: string
}

type SkillFunctionType = '文字生成' | '資料查詢' | '流程自動化' | '分析報表' | '溝通協作'

interface ExploreSkill {
  name: string
  functionType: SkillFunctionType
  capability: string
  icon: string
  bgColor: string
  accentColor: string
  badge?: AgentBadge
}

defineProps<{
  skill: ExploreSkill
}>()

const emit = defineEmits<{
  click: []
}>()
</script>
```

- [ ] **Step 2: 在 `Explore.vue` 新增 `ExploreSkill` 型別與 mock 資料**

`src/views/Explore.vue`，在 `allAgents` 陣列（Task 1 完成後、含 `painPoint` 的版本）結束的 `]` 之後（原第 298 行之後），新增：

```ts
// Skill 探索型別
type SkillFunctionType = '文字生成' | '資料查詢' | '流程自動化' | '分析報表' | '溝通協作'

interface ExploreSkill {
  name: string
  functionType: SkillFunctionType
  capability: string
  icon: string
  bgColor: string
  accentColor: string
  badge?: AgentBadge
}

const allExploreSkills: ExploreSkill[] = [
  { name: '週報自動生成', functionType: '文字生成', capability: '依本週資料自動產出結構化週報草稿。', icon: 'summarize', bgColor: '#EEEDFE', accentColor: '#534AB7' },
  { name: '會議摘要', functionType: '文字生成', capability: '將會議逐字稿摘要成重點與待辦事項。', icon: 'mic', bgColor: '#E6F1FB', accentColor: '#185FA5', badge: { type: 'hot', label: '熱門' } },
  { name: 'ERP 庫存查詢', functionType: '資料查詢', capability: '用自然語言查詢 ERP 系統即時庫存數量。', icon: 'inventory_2', bgColor: '#E1F5EE', accentColor: '#0F6E56' },
  { name: '客服對話品質評估', functionType: '分析報表', capability: '自動評分客服對話紀錄，標記待改進案例。', icon: 'reviews', bgColor: '#FAEEDA', accentColor: '#854F0B', badge: { type: 'new', label: '新上架' } },
  { name: '合約審核摘要', functionType: '文字生成', capability: '擷取合約關鍵條款，產出審核重點摘要。', icon: 'gavel', bgColor: '#FAECE7', accentColor: '#993C1D' },
  { name: '產品 FAQ 自動回覆', functionType: '溝通協作', capability: '依知識庫內容自動回覆常見產品問題。', icon: 'forum', bgColor: '#EAF3DE', accentColor: '#3B6D11', badge: { type: 'hot', label: '熱門' } },
  { name: 'ERP 報表彙整', functionType: '分析報表', capability: '跨系統彙整報表數據，產出單一檢視視圖。', icon: 'bar_chart', bgColor: '#FBEAF0', accentColor: '#993556' },
  { name: '訂單流程通知', functionType: '流程自動化', capability: '訂單狀態變更時自動通知相關人員與系統。', icon: 'sync_alt', bgColor: '#E6F1FB', accentColor: '#185FA5' },
]

const skillFunctionTypeChips = ['全部', '文字生成', '資料查詢', '流程自動化', '分析報表', '溝通協作']
const activeSkillChip = ref('全部')
const skillSearchKeyword = ref('')

const filteredExploreSkills = computed(() =>
  allExploreSkills.filter(s =>
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
const selectedExploreSkill = ref<ExploreSkill | null>(null)

function openSkillModal(skill: ExploreSkill) {
  selectedExploreSkill.value = skill
  isSkillModalOpen.value = true
}

function useExploreSkill() {
  popDialog.toast('已加入我的技能')
  isSkillModalOpen.value = false
}
```

- [ ] **Step 3: 新增 Skill 分頁 template**

`src/views/Explore.vue`，在 Task 1 Step 4 新增的 `</template>`（收 Agent 分頁的 `v-if`）之後、`.views-page-content-box` 的 `</div>` 之前，新增：

```html
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
      <div class="skill-grid lively-stagger">
        <ExploreSkillCard
          v-for="skill in filteredExploreSkills"
          :key="skill.name"
          :skill="skill"
          @click="openSkillModal(skill)"
        />
      </div>

      </template>
```

- [ ] **Step 4: 新增 Skill Modal**

`src/views/Explore.vue`，在 Agent Modal（`</compModal>`，Task 1 完成後的版本）之後，新增：

```html
  <!-- Skill 詳情 Modal -->
  <compModal
    v-model="isSkillModalOpen"
    :title="selectedExploreSkill?.name ?? ''"
    :width="440"
    :closeOnMask="true"
  >
    <template v-if="selectedExploreSkill">
      <div class="Explore explore-modal-box">
        <div class="explore-modal-content">
          <div class="explore-modal-icon" :style="{ background: selectedExploreSkill.bgColor }">
            <i class="material-symbols-outlined" :style="{ color: selectedExploreSkill.accentColor }">{{ selectedExploreSkill.icon }}</i>
          </div>
          <span class="skill-function-badge">{{ selectedExploreSkill.functionType }}</span>
          <p class="explore-modal-desc">{{ selectedExploreSkill.capability }}</p>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="Explore explore-modal-footer">
        <button class="custom-btn custom-main-btn" @click="useExploreSkill">加入我的技能</button>
        <button class="custom-btn" @click="isSkillModalOpen = false">取消</button>
      </div>
    </template>
  </compModal>
```

- [ ] **Step 5: import `ExploreSkillCard`**

`src/views/Explore.vue` 的 `<script setup>`，在 Task 2 新增的 `import AgentCard from '@/components/Explore/AgentCard.vue'` 後面新增：

```ts
import ExploreSkillCard from '@/components/Explore/ExploreSkillCard.vue'
```

- [ ] **Step 6: 補上 Skill 相關 scss**

`src/scss/views/_Explore.scss`，在 Task 1 Step 7 新增的 `.explore-tabs`／`.explore-modal-painpoint` 區塊後面，繼續新增（一樣巢狀在 `.Explore.views-page` 裡）：

```scss
  .skill-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .explore-skill-card {
    position: relative;
    background: var(--surface);
    border: 1px solid var(--divider-a50);
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;

    h4 { margin: 10px 0 4px; font-size: 15px; }
    p { font-size: 13px; color: var(--text-muted); margin: 0; }
  }

  .skill-function-badge {
    display: inline-block;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 5px;
    background: var(--page-bg);
    color: var(--text-muted);
    border: 1px solid var(--divider-a50);
    margin-top: 8px;
  }
```

- [ ] **Step 7: 型別檢查**

Run: `npm run type-check`
Expected: 無錯誤。

- [ ] **Step 8: 手動驗證**

Run: `npm run dev`：
1. 點「Skill 探索」分頁籤，確認出現搜尋列 + 功能類型 chip（全部/文字生成/資料查詢/流程自動化/分析報表/溝通協作）+「熱門技能」網格，8 張技能卡片都顯示功能分類標籤、名稱、能力說明。
2. 點功能類型 chip（例如「資料查詢」），確認網格只剩 `ERP 庫存查詢` 一張卡片。
3. 在搜尋框輸入技能名稱關鍵字（例如「會議」），確認網格即時篩選成只剩「會議摘要」。
4. 點一張技能卡片，確認 Modal 顯示功能分類標籤 + 能力說明，footer 是「加入我的技能」／「取消」；點「加入我的技能」出現 toast 且 Modal 關閉。
5. 切回「Agent 探索」分頁，確認 Agent 版面（含 Task 1、Task 2 的改動）維持正常，兩個分頁的搜尋輸入框與 chip 選取狀態互不影響。

- [ ] **Step 9: Commit**

```bash
git add src/components/Explore/ExploreSkillCard.vue src/views/Explore.vue src/scss/views/_Explore.scss
git commit -m "feat(Explore): add Skill exploration tab with function-type filtering

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```
