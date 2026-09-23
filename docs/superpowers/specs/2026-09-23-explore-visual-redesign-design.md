# 探索單元視覺重新設計 — 設計文件

日期：2026-09-23

## 背景

`src/views/Explore.vue` 上一輪（[`2026-09-15-explore-real-data-redesign-design.md`](./2026-09-15-explore-real-data-redesign-design.md)）已經把資料/互動打通成真的了，但那次刻意保留了 2026-08-14 那次視覺改版（[`2026-08-14-visual-redesign-phase4-workspace-explore-design.md`](./2026-08-14-visual-redesign-phase4-workspace-explore-design.md)）留下的版面：Hero Banner + 頒獎台排行 + 卡片網格。這次要推翻那套視覺語言，換一套新的。

本文件的設計方向是透過瀏覽器 mockup 反覆試錯收斂出來的（superpowers 的 brainstorming visual-companion），過程中明確排除了以下幾個方向，記錄下來避免之後重蹈覆轍：

- **紫色漸層 + emoji 的「app 商店」風**：使用者反饋「整體設計很 ai 感覺，不要使用 emoji、顏色需要參考整體產品，現在感覺很鮮艷」——顏色沒有對齊產品既有色票（發明了一套新的紫紅漸層），icon 用 emoji 而非產品既有的 Material Symbols。
- **不對稱 Bento 網格 + 大字級 masthead**：換掉顏色跟 emoji 之後，使用者反饋「好醜」——問題不在顏色，是版面骨架本身太刻意（巨大裝飾性數字、大小不一的磁磚）。
- **純清單、無圖像版**：拿掉裝飾之後太素，使用者反饋「希望有一點圖像，不要全部由文字組成」。

最終收斂方向：**安靜、資訊密度高的清單，用資料裡本來就有的「情境痛點」文字當標題，配一個有份量但不誇張的 icon 色塊**。

## 目標

- Agent 探索、Skill 探索兩個分頁都改成同一套「情境清單」版面，取代現在的 Hero/頒獎台/卡片網格系統。
- 顏色/字型/icon 全部改用產品既有的系統：`--primary`/`--accent`（teal-green）、8 組 `--tag-*` 低飽和色、Public Sans / Noto Sans TC / JetBrains Mono、Material Symbols Outlined。不新增任何色票或字型。
- 拿掉分類 chip 篩選列（Agent 的「內容創作/財務分析/…」、Skill 的功能類型 chip），兩個分頁都只留搜尋框。
- Agent 搜尋從「按 Enter 才跳出結果」改成即時篩選（跟 Skill 分頁的搜尋行為一致），因為拿掉分類 chip 之後，搜尋框變成唯一的縮小範圍工具，即時篩選才符合「資訊導向」的方向。

## 非目標

- 不改變 favorite（加入常用清單）、install（加入我的技能）背後的資料流與 store action——`exploreStore.ts`、`skillStore.ts` 的邏輯完全不動，只換視覺容器（從卡片變成清單列）。
- 不重新設計三個 Modal（`AgentDetailModal`/`SkillDetailModal`/`AssignSkillToAgentModal`）的版面結構，只做顏色/字型的一致性檢查（它們目前用的 token 本來就正確，預期不太需要改動）。
- 不新增深色模式以外的主題。
- 不改變「由我推薦」精選 Agent 寫死指定「內容創作者」的邏輯。
- 不對清單重新排序（熱門 Agent 不會被排到最前面，只用一個小角標標示），維持 `exploreStore.agents` 原本的陣列順序——避免「排序又要跟著角標邏輯掉」這種容易兜不攏的行為。

## 設計

### 1. 視覺語彙（兩個分頁共用）

- 清單一列一個項目：52px 圓角色塊 icon（`--tag-{colorKey}-bg` 底、`--tag-{colorKey}-text` 圖示色，沿用現有 `getSkillVisual`／`Agent.colorKey` 的配色邏輯）＋ 情境提問句/能力描述當標題 ＋ 名稱／中繼資訊一行。
- 「由我推薦」精選項目視覺上放大一級，獨立成一塊（背景用 `--surface` + `--divider` 邊框），其餘項目是普通清單列（沒有邊框，靠 `--divider` 分隔線 + hover 時的 `--surface` 底色浮出）。
- 一列最多顯示一個角標（`--tag-amber-bg`/`--tag-amber-text` 底色的小圓角矩形，`JetBrains Mono` 字重 700），優先序：Agent 自己的 `badge`（`new`/`sat`）> 熱門排行角標（新引入，見下）。Skill 沒有 badge 資料，不顯示角標，改顯示 `functionType` 當作素色小標籤（`--text-faint`，非彩色，跟角標明確區分開，避免每列都塞滿顏色）。
- 「已加入常用清單」用一顆小 `star`（`material-fill`）圖示接在名稱後面，顏色 `--tag-amber-text`，取代原本 `AgentCard.vue` 貼在卡片角落的絕對定位星號。

### 2. `AgentCard.vue` → 改寫成清單列元件

拿掉 `rank`/頒獎台相關的所有東西（`podium-card`/`rank-badge` 那套視覺概念整個廢棄，不是留著沒用到）：

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

（`agent-icon--{colorKey}` 沿用 `_Explore.scss` 既有的 `.agent-icon, .explore-modal-icon { &.agent-icon--violet {...} }` 這組 modifier class，寫法跟 `ExploreSkillCard.vue` 現有的 `:class="['agent-icon', \`agent-icon--${visual.colorKey}\`]"` 一致。因為新的 base class 叫 `.explore-row-icon`（不是 `.agent-icon`），這組既有規則的選擇器需要在 `_Explore.scss` 裡多加一個 `.explore-row-icon`（見第 5 節），modifier class 本身不用重複定義。）

`badgeLabel` 的判斷邏輯（新的計算屬性，放在 `Explore.vue`，`AgentCard.vue` 不需要知道「熱門排行」這個概念，維持單純的展示元件）：

```ts
const RANKING_NAMES = ['內容創作者', '社群管理', '專案管理', '顧客服務管理']

function badgeLabelFor(agent: Agent): string | undefined {
  if (agent.badge) return agent.badge.label
  if (agent.name !== featuredAgent.value.name && RANKING_NAMES.includes(agent.name)) return '熱門'
  return undefined
}
```

### 3. `ExploreSkillCard.vue` → 改寫成清單列元件

跟 `AgentCard.vue` 同構，差別是標題文字來源（`capability` 而非 `painPoint`）、沒有 badge、多一個素色的 `functionType` 標籤：

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

### 4. `Explore.vue`：拿掉 Hero/頒獎台/推薦網格，改成清單

**Agent 分頁**移除：`.search-chips`（分類 chip）、`.explore-hero`（Hero Banner 大區塊，改成清單裡的精選列）、`.ranking-podium`/`.ranking-more`（頒獎台）、`.recs-box`/`.recs-chips`/`.recs-grid`（個人化推薦網格 + 分類篩選）。對應的 script 移除：`chipCategories`、`activeChip`、`filteredRecsAgents`、`podiumAgents`、`fourthRankedAgent`（`rankingAgents` 改用途，變成 `badgeLabelFor` 用的名單常數，不再是「切出前3+第4」的資料處理）。

搜尋從「按 Enter 找第一筆、開 Modal 或 toast」改成即時篩選（跟 Skill 分頁一致）：

```ts
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
```

（原本 `onSearchEnter` 直接開 Modal 的行為拿掉——清單本身已經即時篩選出結果，使用者自己點選即可，不需要「按 Enter 自動開第一筆」這個原本用來補償沒有列表可看的權宜設計。）

Template 改成：

```html
<template v-if="activeExploreTab === 'agent'">
  <div class="explore-search-bar">
    <i class="material-symbols-outlined">search</i>
    <input type="text" v-model="searchKeyword" placeholder="搜尋 Agent 助理..." />
  </div>

  <AgentCard :agent="featuredAgent" featured :is-favorite="exploreStore.isFavorite(featuredAgent.id)" @click="openModal(featuredAgent)" />

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
```

**Skill 分頁**移除：`.recs-chips`（功能類型 chip）跟對應的 `skillFunctionTypeChips`/`activeSkillChip`。`filteredExploreSkills` 拿掉 `functionType` 篩選那個條件，只留關鍵字：

```ts
const filteredExploreSkills = computed(() =>
  publicSkills.value.filter(s =>
    !skillSearchKeyword.value.trim() || s.name.includes(skillSearchKeyword.value.trim())
  )
)
```

`.skill-grid` 換成 `.explore-list`（跟 Agent 分頁共用同一份清單樣式），`onSkillSearchEnter` 這個「找不到才 toast」的輔助函式拿掉——空狀態已經有 `.explore-empty-state` 顯示，不需要額外 toast。

### 5. `_Explore.scss`：大量刪舊、新增清單樣式

刪除（確認沒有其他 `.vue` 檔案還在用之後移除，不是留著養蚊子）：`.explore-hero`／`.hero-*`、`.search-chips`／`.chip`、`.ranking-podium`／`.podium-card`／`.rank-badge`／`.ranking-more`、`.recs-box`／`.recs-header`／`.recs-avatar`／`.recs-title`／`.recs-chips`／`.recs-chip`／`.recs-grid`／`.rec-card`（連同上一輪已經確認是死碼但當時沒清的 `%explore-agent-badge`／`.agent-card`／`.agent-grid`／`.agent-grid--4`，這次整個方向都不要了，一次清乾淨）、`AgentCard.vue`／`ExploreSkillCard.vue` 舊版對應的 `.agent-favorite-mark`（絕對定位版本，新版用行內 `.explore-row-star`）。

修改：既有的 `.agent-icon, .explore-modal-icon { &.agent-icon--violet {...} }`（色彩 modifier 規則，`_Explore.scss` 現有段落）選擇器加上 `.explore-row-icon`，變成 `.agent-icon, .explore-modal-icon, .explore-row-icon { &.agent-icon--violet {...} ... }`——顏色 token 本身不變，只是讓新的清單列 icon 也能吃到同一組規則，不新增第二份色彩定義。

新增（放在 `.Explore` 共用層級，跟 `.skill-function-badge`/`.explore-empty-state` 同一個道理——清單列元件會同時用在頁面本體跟 Modal 裡的其他地方無關，但至少要跟頁面本體一致）：

```scss
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
```

`.explore-search-bar`、`.explore-tabs`／`.explore-tab`、`.explore-empty-state`、`.skill-function-badge`、`.section-header` 這些既有 class 維持不變（沒有理由重寫，本來就是安靜克制的樣式）。`section-header`（「熱門技能」那個小標題）在新版面裡拿掉了——清單本身沒有再分區塊標題，直接接在搜尋框後面。

### 6. Modal 一致性檢查（非重新設計）

三個 Modal 目前用的 `.explore-modal-icon`（`agent-icon--{colorKey}` 系列 token）、`.custom-btn`/`.custom-main-btn`（全站按鈕，已經是 `--primary` 系）、`.skill-function-badge`（已對齊 `%badge-shape`）都已經符合這次「只用產品既有 token」的原則，預期不需要改動。實作階段如果發現有寫死的顏色/字型，一併清掉，但不改版面結構。

## 資料流

跟上一輪完全一樣，只是渲染這份資料的容器從卡片/網格換成清單列：

```
exploreStore.agents → featuredAgent（精選，寫死內容創作者）+ 其餘 9 筆（filteredAgents，即時搜尋篩選）
  → AgentCard（清單列）→ AgentDetailModal → toggleFavorite(agent.id)

skillStore.skills → publicSkills（zone!=='personal' && isEnabled && !deletedAt）
  → filteredExploreSkills（即時搜尋篩選，拿掉 functionType 篩選）
  → ExploreSkillCard（清單列）→ SkillDetailModal →「加入我的技能」→ AssignSkillToAgentModal
    → skillStore.assignSkillToAgent(skillId, agentName)
```

## 測試計畫

既有三個測試檔案的斷言全部是針對舊版面的 class（`.podium-card`／`.ranking-more`／`.agent-grid--4`／`.agent-favorite-mark`），這次改版後這些 class 不存在了，需要整檔改寫，不是調整：

- `Explore.ranking.test.ts` → 改成驗證新的清單結構：精選列（`.explore-row--featured`）顯示正確的 Agent、其餘 Agent 依序渲染成 `.explore-row`、熱門角標只出現在 `RANKING_NAMES` 名單內（排除精選那個）的列上、有 `badge`（new/sat）的 Agent 優先顯示自己的角標而非「熱門」。
- `Explore.skillTab.test.ts` → 拿掉「切換功能類型 chip」那個測試案例（功能不存在了），保留搜尋篩選測試，`.skill-grid` 改成 `.explore-list` 選擇器。
- `Explore.favorite.test.ts` → `.podium-card` 改成 `.explore-row--featured`（或改收藏一個非精選的一般 `.explore-row`），`.agent-favorite-mark` 改成 `.explore-row-star`。
- 新增：Agent 搜尋即時篩選（輸入關鍵字不按 Enter 也會即時縮小清單）的測試——這是行為變更，需要明確測試覆蓋，不能只靠視覺檢查。

## 風險與待確認事項

- **Agent 搜尋從「Enter 才動作」改成「即時篩選」是本文件新做的判斷，不是使用者在畫面討論階段明確拍板的項目**——是視覺重排（拿掉分類 chip 之後搜尋框變成唯一的縮小範圍工具）帶出來的自然結果，理由已經寫在「目標」章節。如果之後使用者覺得這個行為變更不在預期內，這是最可能需要回頭確認的一點。
- 熱門角標「不影響排序」（見非目標）代表「內容創作者」以外的三個熱門 Agent（社群管理／專案管理／顧客服務管理）可能散落在清單中間，不是明顯地靠前——這是刻意的簡化（避免排序邏輯又要跟角標邏輯兜在一起），如果之後想要熱門 Agent 排前面，是可以再談的獨立小改動，不影響這次的骨架。
- `.explore-row:hover` 目前用 `margin: 0 -12px` 撐開 hover 範圍（沿用 mockup 驗證過的手法），實作時要確認在最外層 `.views-page-content-box` 的既有 padding 下不會裁切或造成橫向捲軸，窄螢幕（<480px）需要額外驗證一次。
