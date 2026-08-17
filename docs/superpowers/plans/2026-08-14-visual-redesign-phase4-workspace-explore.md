# 全站視覺重新設計 Phase 4：Explore 版型調整 + JourneyDashboard 套上設計系統 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 Explore 的「使用熱度榜」改成頒獎台版型並套上 Phase 2 活潑感系統；把 JourneyDashboard 從 100% inline hex 重建成 class + SCSS + 既有 token，節點呈現從平鋪 chip 改為連接式步驟條。

**Architecture:** 兩個獨立任務，各自涵蓋樣板 + SCSS + 測試。Task 1（Explore）是在既有良好基礎上做局部版型調整；Task 2（JourneyDashboard）是整頁從零重建到設計系統，範圍更大但不涉及任何商業邏輯改動。兩者都只用 Phase 0 既有的 CSS 變數與 Phase 2 既有的 `.lively-stagger`/`.lively-card`，不新增任何 token。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Pinia、SCSS（CSS Custom Properties 主題 token）、Vitest + `@vue/test-utils`。

## Global Constraints

- 使用 `<script setup lang="ts">`，禁止 Options API（專案 `CLAUDE.md`）
- 樣式統一在 `src/scss/` 管理，禁止 `<style scoped>`（專案 `CLAUDE.md`）
- 顏色使用 CSS Custom Properties，不寫死 hex；不新增任何新 token——所有顏色需求都由 Phase 0 既有 token 滿足：`--success`、`--tag-blue-bg`/`--tag-blue-text`、`--tag-teal-bg`、`--divider`、`--divider-a20`、`--text-faint`、`--accent`、`--primary`、`--primary-fg`、`--accent-soft`、`--color-wise-rank-bronze-bg`/`-text`
- 套用 Phase 2 既有的活潑感系統 class：`.lively-stagger`（容器）、`.lively-card`（可互動卡片）——定義在 `src/scss/_custom.scss`，本次不新增或修改該檔案
- `prefers-reduced-motion` 判斷沿用既有慣例：動態效果包在 `@media (prefers-reduced-motion: no-preference)` 內
- 不改變 `journeyStore.ts`、`Explore.vue` 的 `allAgents`/搜尋/篩選邏輯——只改樣板結構與樣式
- 新增檔案 `src/scss/views/_JourneyDashboard.scss` 需要在 `src/scss/views/_index.scss` 手動 `@import`，否則不會被打包（專案 `CLAUDE.md` 的 Gotcha）

---

### Task 1: Explore —— 使用熱度榜頒獎台版型 + 活潑感系統

**Files:**
- Modify: `src/views/Explore.vue`（樣板第 40-59 行的熱度榜區塊 + 第 66-82 行的大家都在用區塊 + 第 98-117 行的為你推薦區塊 + script 新增 2 個 computed）
- Modify: `src/scss/views/_Explore.scss`（多處局部修改，見下方逐條說明）
- Test: `src/views/__tests__/Explore.ranking.test.ts`（新檔）

**Interfaces:**
- Consumes: 無前置任務
- Produces:（本次計畫內無後續任務依賴 Explore 的產物）

- [ ] **Step 1: 寫失敗測試**

建立 `src/views/__tests__/Explore.ranking.test.ts`：

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Explore from '../Explore.vue'

function mountExplore() {
  setActivePinia(createPinia())
  return mount(Explore, { global: { stubs: { compModal: true } } })
}

describe('Explore 使用熱度榜頒獎台版型', () => {
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

  it('「大家都在用」網格維持 4 張等大卡片，不受頒獎台版型影響', () => {
    const wrapper = mountExplore()
    const popularCards = wrapper.findAll('.agent-grid--4 .agent-card')
    expect(popularCards).toHaveLength(4)
    popularCards.forEach(card => {
      expect(card.classes()).not.toContain('podium-card')
    })
  })
})

describe('Explore 活潑感套用', () => {
  it('頒獎台、大家都在用、為你推薦都套用 lively-stagger/lively-card', () => {
    const wrapper = mountExplore()
    expect(wrapper.find('.ranking-podium').classes()).toContain('lively-stagger')
    wrapper.findAll('.podium-card').forEach(c => expect(c.classes()).toContain('lively-card'))
    expect(wrapper.find('.agent-grid--4').classes()).toContain('lively-stagger')
    wrapper.findAll('.agent-grid--4 .agent-card').forEach(c => expect(c.classes()).toContain('lively-card'))
    expect(wrapper.find('.recs-grid').classes()).toContain('lively-stagger')
    wrapper.findAll('.rec-card').forEach(c => expect(c.classes()).toContain('lively-card'))
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npm run test:unit -- Explore.ranking`
Expected: FAIL —— 目前樣板沒有 `.podium-card`/`.ranking-more`/`.ranking-podium` 這些 class，`.agent-grid--4`/`.recs-grid` 也還沒有 `lively-stagger`

- [ ] **Step 3: 修改 `Explore.vue` 樣板 —— 熱度榜區塊**

找到現有的（第 40-59 行）：

```html
      <!-- 使用熱度榜 -->
      <div class="section-header">
        <h3>使用熱度榜</h3>
        <span class="see-all" @click="showToast('查看全部熱度')">查看全部</span>
      </div>
      <div class="agent-grid agent-grid--4 mb-4">
        <div
          v-for="(agent, i) in rankingAgents"
          :key="agent.name"
          class="agent-card"
          @click="openModal(agent)"
        >
          <div class="rank-badge">{{ i + 1 }}</div>
          <div class="agent-icon" :style="{ background: agent.bgColor }">
            <i class="material-symbols-outlined" :style="{ color: agent.accentColor }">{{ agent.icon }}</i>
          </div>
          <h4>{{ agent.name }}</h4>
          <p>{{ agent.desc }}</p>
        </div>
      </div>
```

整段替換為：

```html
      <!-- 使用熱度榜 -->
      <div class="section-header">
        <h3>使用熱度榜</h3>
        <span class="see-all" @click="showToast('查看全部熱度')">查看全部</span>
      </div>
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
          <p>{{ agent.desc }}</p>
        </div>
      </div>
      <div
        v-if="fourthRankedAgent"
        class="ranking-more lively-card mb-4"
        @click="openModal(fourthRankedAgent)"
      >
        <span class="rank-badge">4</span>
        <div class="agent-icon" :style="{ background: fourthRankedAgent.bgColor }">
          <i class="material-symbols-outlined" :style="{ color: fourthRankedAgent.accentColor }">{{ fourthRankedAgent.icon }}</i>
        </div>
        <span class="ranking-more-name">{{ fourthRankedAgent.name }}</span>
        <span class="ranking-more-desc">{{ fourthRankedAgent.desc }}</span>
      </div>
```

- [ ] **Step 4: 修改 `Explore.vue` 樣板 —— 大家都在用 + 為你推薦區塊套用活潑感 class**

找到（原第 66-70 行附近）：

```html
      <div class="agent-grid agent-grid--4 mb-5">
        <div
          v-for="agent in popularAgents"
          :key="agent.name"
          class="agent-card"
          @click="openModal(agent)"
        >
```

改為：

```html
      <div class="agent-grid agent-grid--4 lively-stagger mb-5">
        <div
          v-for="agent in popularAgents"
          :key="agent.name"
          class="agent-card lively-card"
          @click="openModal(agent)"
        >
```

找到（原第 98-104 行附近）：

```html
        <div class="recs-grid">
          <div
            v-for="agent in filteredRecsAgents"
            :key="agent.name"
            class="rec-card"
            @click="openModal(agent)"
          >
```

改為：

```html
        <div class="recs-grid lively-stagger">
          <div
            v-for="agent in filteredRecsAgents"
            :key="agent.name"
            class="rec-card lively-card"
            @click="openModal(agent)"
          >
```

- [ ] **Step 5: 修改 `Explore.vue` script —— 新增頒獎台資料 computed**

找到現有的（原第 295-298 行）：

```typescript
// 使用熱度榜（前 4）
const rankingAgents = computed(() =>
  allAgents.filter(a => ['內容創作者', '社群管理', '專案管理', '顧客服務管理'].includes(a.name))
)
```

在這段之後新增：

```typescript
// 熱度榜頒獎台：前 3 名進頒獎台，第 4 名移到下方次要列
const podiumAgents = computed(() => rankingAgents.value.slice(0, 3))
const fourthRankedAgent = computed(() => rankingAgents.value[3])
```

- [ ] **Step 6: 執行測試確認通過**

Run: `npm run test:unit -- Explore.ranking`
Expected: PASS（4 個測試）——此時畫面還沒有 Step 7-9 的樣式，頒獎台版面會是無樣式的堆疊，這是預期中間狀態

- [ ] **Step 7: 修改 `_Explore.scss` —— 移除 `.agent-card` 舊的 hover 與排名徽章規則**

找到（原第 238-279 行，含 `.agent-card` 的 `transition` 宣告後的 hover 區塊與 `.rank-badge` 區塊）：

```scss
    transition: all 0.22s cubic-bezier(0.34, 1.4, 0.64, 1);

    &:hover {
      transform: translateY(-4px) scale(1.02);
      box-shadow: rgba(14, 15, 12, 0.12) 0px 12px 32px;
      border-color: rgba(14, 15, 12, 0.20);
    }

    // .rank-badge 用於熱度榜，.agent-badge 用於大家都在用，兩者互斥不同時出現
    .rank-badge {
      position: absolute;
      top: 14px;
      right: 14px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &:nth-child(1) .rank-badge {
      background: var(--accent);
      color: var(--primary-hover);
    }

    &:nth-child(2) .rank-badge {
      background: var(--accent-soft);
      color: var(--text-muted);
    }

    &:nth-child(3) .rank-badge {
      background: var(--color-wise-rank-bronze-bg);
      color: var(--color-wise-rank-bronze-text);
    }

    &:nth-child(n+4) .rank-badge {
      background: var(--accent-soft);
      color: var(--text-muted);
    }

    .agent-badge {
```

替換為（`.agent-card` 不再套用自己的 hover——改由 `.lively-card` 提供；`.rank-badge` 移出去給頒獎台/次要列使用，見 Step 8）：

```scss
    transition: all 0.22s cubic-bezier(0.34, 1.4, 0.64, 1);

    .agent-badge {
```

- [ ] **Step 8: 修改 `_Explore.scss` —— 新增頒獎台版型的樣式**

在 `.agent-card { ... }` 這個規則區塊結束的 `}` 之後（原第 333 行之後，`.recs-box` 區塊開始之前）新增：

```scss
  // ── 使用熱度榜：頒獎台版型 ──────────────────────────
  .ranking-podium {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 16px;
  }

  .podium-card {
    position: relative;
    background: var(--surface);
    border: 1px solid var(--divider);
    border-radius: 20px;
    padding: 18px;
    cursor: pointer;
    width: 220px;

    .agent-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
      border: 1px solid var(--divider);

      i {
        font-size: 22px;
      }
    }

    h4 {
      font-size: 14px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 5px;
    }

    p {
      font-size: 12px;
      color: var(--text-faint);
      line-height: 1.55;
    }

    &--rank-1 {
      order: 2;
      width: 240px;
      padding: 24px 22px;
      border-color: var(--accent);
      box-shadow: rgba(var(--shadow), 0.18) 0px 10px 28px;

      .agent-icon {
        width: 52px;
        height: 52px;
        border-radius: 14px;

        i {
          font-size: 26px;
        }
      }

      h4 {
        font-size: 16px;
      }
    }

    &--rank-2 {
      order: 1;
      margin-bottom: 18px;
    }

    &--rank-3 {
      order: 3;
      margin-bottom: 18px;
    }
  }

  .rank-badge {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .podium-card--rank-1 .rank-badge {
    width: 28px;
    height: 28px;
    font-size: 13px;
    background: var(--accent);
    color: var(--primary-hover);
  }

  .podium-card--rank-2 .rank-badge {
    background: var(--accent-soft);
    color: var(--text-muted);
  }

  .podium-card--rank-3 .rank-badge {
    background: var(--color-wise-rank-bronze-bg);
    color: var(--color-wise-rank-bronze-text);
  }

  .ranking-more {
    display: flex;
    align-items: center;
    gap: 14px;
    background: var(--surface);
    border: 1px solid var(--divider);
    border-radius: 14px;
    padding: 12px 18px;
    cursor: pointer;

    .rank-badge {
      position: static;
      background: var(--accent-soft);
      color: var(--text-muted);
      flex-shrink: 0;
    }

    .agent-icon {
      width: 32px;
      height: 32px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: 1px solid var(--divider);

      i {
        font-size: 16px;
      }
    }

    .ranking-more-name {
      font-size: 13px;
      font-weight: 700;
      color: var(--text);
      flex-shrink: 0;
    }

    .ranking-more-desc {
      flex: 1;
      min-width: 0;
      font-size: 12px;
      color: var(--text-faint);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  @media (max-width: 620px) {
    .ranking-podium {
      flex-direction: column;
      align-items: stretch;
    }

    .podium-card {
      width: auto;
      order: 0 !important;
      margin-bottom: 0 !important;

      &--rank-1 {
        width: auto;
      }
    }
  }

```

- [ ] **Step 9: 修改 `_Explore.scss` —— 把寫死的 `rgba(14, 15, 12, ...)` 換成 token**

逐一找到並替換以下幾處（都在 `.Explore { ... }` 區塊內）：

1. `.explore-search-bar` 的 `border: 1px solid rgba(14, 15, 12, 0.12);` → `border: 1px solid var(--divider);`
2. `.explore-search-bar` 的 `box-shadow: rgba(14, 15, 12, 0.06) 0px 2px 8px;` → `box-shadow: rgba(var(--shadow), 0.06) 0px 2px 8px;`
3. `.explore-search-bar:focus-within` 的 `box-shadow: rgba(14, 15, 12, 0.12) 0px 0px 0px 2px;` → `box-shadow: rgba(var(--shadow), 0.12) 0px 0px 0px 2px;`
4. `.explore-hero` 的三行 `border-left`/`border-right`/`border-bottom: 1px solid rgba(14, 15, 12, 0.10);` → 三行都改成 `var(--divider)`
5. `.agent-card` 的 `border: 1px solid rgba(14, 15, 12, 0.12);` → `border: 1px solid var(--divider);`
6. `.agent-card .agent-icon` 的 `border: 1px solid rgba(14, 15, 12, 0.08);` → `border: 1px solid var(--divider);`
7. `.recs-box` 的 `border: 1px solid rgba(14, 15, 12, 0.12);` → `border: 1px solid var(--divider);`
8. `.rec-card` 的 `border: 1px solid rgba(14, 15, 12, 0.08);` → `border: 1px solid var(--divider);`
9. `.rec-icon` 的 `background: rgba(14, 15, 12, 0.06);` → `background: var(--divider-a20);`
10. `.rec-icon` 的 `border: 1px solid rgba(14, 15, 12, 0.08);` → `border: 1px solid var(--divider);`

同時找到 `.rec-card` 的 hover 區塊：

```scss
      &:hover {
        background: var(--accent-soft);
        transform: translateY(-3px) scale(1.015);
        box-shadow: rgba(14, 15, 12, 0.08) 0px 8px 20px;
      }
```

改為（`transform`/`box-shadow` 交給 `.lively-card` 負責，避免跟 `.lively-card` 的 hover 規則互相覆蓋）：

```scss
      &:hover {
        background: var(--accent-soft);
      }
```

- [ ] **Step 10: 執行測試確認通過**

Run: `npm run test:unit -- Explore.ranking`
Expected: PASS（4 個測試）

- [ ] **Step 11: 手動視覺檢查**

啟動 `npm run dev`，打開 `/view/Explore`：
- 桌面寬度：確認頒獎台呈現「#2 - #1（置中抬高）- #3」的排列，第 4 名在下方一條橫式列
- 縮小視窗到 620px 以下：確認頒獎台改成直向堆疊
- 切換 dark mode：確認頒獎台、次要列、大家都在用、為你推薦四個區塊顏色都正確
- 確認「大家都在用」「為你推薦」視覺上沒有被誤套用頒獎台樣式（維持等大網格）

- [ ] **Step 12: Commit**

```bash
git add src/views/Explore.vue src/scss/views/_Explore.scss src/views/__tests__/Explore.ranking.test.ts
git commit -m "feat(Explore): 使用熱度榜改為頒獎台版型，套用 Phase 2 活潑感系統"
```

---

### Task 2: JourneyDashboard —— 從 inline hex 重建到 token 系統 + 連接式步驟條

**Files:**
- Modify: `src/views/JourneyDashboard.vue`（整份重寫樣板，script 移除 3 個 style-object 函式）
- Create: `src/scss/views/_JourneyDashboard.scss`
- Modify: `src/scss/views/_index.scss`（新增 `@import "./JourneyDashboard";`）
- Test: `src/views/__tests__/JourneyDashboard.tokens.test.ts`（新檔）

**Interfaces:**
- Consumes: `src/stores/journeyStore.ts` 既有的 `useJourneyStore()`、`JourneyRecord`/`NodeStatus`/`JourneyType` 型別、`createJourney`/`setNodeRunning`/`setNodeDone` actions（全部不變）
- Produces:（本次計畫內無後續任務依賴 JourneyDashboard 的產物；為 Phase 5 留的備註見 spec 第 4 節，不在本次任務範圍）

- [ ] **Step 1: 寫失敗測試**

建立 `src/views/__tests__/JourneyDashboard.tokens.test.ts`：

```typescript
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import JourneyDashboard from '../JourneyDashboard.vue'
import { useJourneyStore } from '@/stores/journeyStore'

function mountDashboard() {
  setActivePinia(createPinia())
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/', component: { template: '<div/>' } }],
  })
  const wrapper = mount(JourneyDashboard, { global: { plugins: [router] } })
  return { wrapper, router }
}

describe('JourneyDashboard 空狀態', () => {
  it('沒有旅程時顯示空狀態', () => {
    const { wrapper } = mountDashboard()
    expect(wrapper.find('.jd-empty').exists()).toBe(true)
    expect(wrapper.find('.jd-list').exists()).toBe(false)
  })
})

describe('JourneyDashboard 節點狀態呈現', () => {
  it('done/running/pending 節點分別套用對應的 modifier class', () => {
    setActivePinia(createPinia())
    const journeyStore = useJourneyStore()
    const id = journeyStore.createJourney('王小美', 'marketing')
    journeyStore.setNodeDone(id, 'D0')
    journeyStore.setNodeDone(id, 'D1')
    journeyStore.setNodeRunning(id, 'D3')

    const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    const wrapper = mount(JourneyDashboard, { global: { plugins: [router] } })

    const steps = wrapper.findAll('.jd-step')
    expect(steps).toHaveLength(6)
    expect(steps[0].classes()).toContain('jd-step--done')
    expect(steps[1].classes()).toContain('jd-step--done')
    expect(steps[2].classes()).toContain('jd-step--running')
    expect(steps[3].classes()).toContain('jd-step--pending')

    expect(wrapper.find('.jd-badge').classes()).toContain('jd-badge--running')
    expect(wrapper.find('.jd-progress-fill').classes()).toContain('jd-progress-fill--running')
  })

  it('全部節點完成時，旅程狀態徽章與進度條套用 done 樣式', () => {
    setActivePinia(createPinia())
    const journeyStore = useJourneyStore()
    const id = journeyStore.createJourney('陳大文', 'birthday')
    const journey = journeyStore.journeys.find(j => j.id === id)!
    journey.nodes.forEach(n => journeyStore.setNodeDone(id, n.key))

    const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    const wrapper = mount(JourneyDashboard, { global: { plugins: [router] } })

    expect(wrapper.find('.jd-badge').classes()).toContain('jd-badge--done')
    expect(wrapper.find('.jd-progress-fill').classes()).toContain('jd-progress-fill--done')
  })
})

describe('JourneyDashboard 返回按鈕', () => {
  it('點擊返回按鈕導覽至 /view/AiViewer', async () => {
    const { wrapper, router } = mountDashboard()
    const pushSpy = vi.spyOn(router, 'push')
    await wrapper.find('.jd-back-btn').trigger('click')
    expect(pushSpy).toHaveBeenCalledWith('/view/AiViewer')
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npm run test:unit -- JourneyDashboard.tokens`
Expected: FAIL —— 目前樣板完全沒有 `.jd-empty`/`.jd-list`/`.jd-step`/`.jd-badge`/`.jd-progress-fill`/`.jd-back-btn` 這些 class（目前都是 inline style，沒有對應 class 名稱）

- [ ] **Step 3: 整份重寫 `JourneyDashboard.vue`**

```vue
<!-- src/views/JourneyDashboard.vue -->
<template>
  <div class="JourneyDashboard">

    <!-- Header -->
    <div class="jd-header">
      <div>
        <div class="jd-eyebrow">Hurricane Trailsetter · AW26</div>
        <div class="jd-title">🗺️ 旅程執行紀錄</div>
        <div class="jd-subtitle">行銷自動化旅程 — 各用戶進度追蹤</div>
      </div>
      <button class="jd-back-btn" @click="router.push('/view/AiViewer')">
        ← 返回 AiViewer
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="journeys.length === 0" class="jd-empty">
      <div class="jd-empty-icon">🗺️</div>
      <div class="jd-empty-title">尚無旅程記錄</div>
      <div class="jd-empty-desc">回到 AiViewer 並點擊「生成行銷自動化旅程」開始</div>
    </div>

    <!-- Journey list -->
    <div v-else class="jd-list lively-stagger">
      <div v-for="journey in journeys" :key="journey.id" class="jd-card">

        <div class="jd-card-head">
          <div>
            <div class="jd-user">{{ journey.userName }}</div>
            <div class="jd-meta">啟動：{{ formatDate(journey.createdAt) }}</div>
          </div>
          <div class="jd-card-right">
            <span class="jd-count">{{ doneCount(journey) }} / {{ journey.nodes.length }} 節點完成</span>
            <span :class="['jd-badge', `jd-badge--${journey.status}`]">
              {{ journey.status === 'done' ? '已完成' : '執行中' }}
            </span>
          </div>
        </div>

        <div class="jd-progress">
          <div
            :class="['jd-progress-fill', `jd-progress-fill--${journey.status}`]"
            :style="{ width: (doneCount(journey) / journey.nodes.length * 100) + '%' }"
          />
        </div>

        <div class="jd-track">
          <div
            v-for="(node, i) in journey.nodes"
            :key="node.key"
            :class="['jd-step', `jd-step--${node.status}`]"
          >
            <div class="jd-dot">
              <span v-if="node.status === 'done'">✓</span>
              <span v-else-if="node.status === 'running'">●</span>
              <span v-else>{{ i + 1 }}</span>
            </div>
            <div class="jd-step-key">{{ node.key }}</div>
            <div class="jd-step-label">{{ node.label }}</div>
            <div v-if="node.status === 'running'" class="jd-step-running">
              <span class="jd-blink-dot"></span>執行中
            </div>
            <div v-if="node.completedAt" class="jd-step-time">{{ formatTime(node.completedAt) }}</div>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useJourneyStore } from '@/stores/journeyStore'
import type { JourneyRecord } from '@/stores/journeyStore'

const router = useRouter()
const journeyStore = useJourneyStore()
const { journeys } = storeToRefs(journeyStore)

function doneCount(journey: JourneyRecord): number {
  return journey.nodes.filter(n => n.status === 'done').length
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
</script>
```

- [ ] **Step 4: 建立 `src/scss/views/_JourneyDashboard.scss`**

```scss
.JourneyDashboard {
  min-height: 100vh;
  width: 100%;
  background: var(--page-bg);
  color: var(--text);
  font-family: $font-family;
  padding: 32px 40px 60px;
}

// ── Header ──────────────────────────────────────────
.jd-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.jd-eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--tag-blue-text);
  margin-bottom: 4px;
}

.jd-title {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.4px;
  color: var(--text);
}

.jd-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

.jd-back-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid var(--divider);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  transition: color 0.15s ease;

  &:hover {
    color: var(--text);
  }
}

// ── Empty state ─────────────────────────────────────
.jd-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: var(--text-faint);
  gap: 12px;
}

.jd-empty-icon {
  font-size: 40px;
  opacity: 0.3;
}

.jd-empty-title {
  font-size: 14px;
}

.jd-empty-desc {
  font-size: 12px;
}

// ── Journey card list ───────────────────────────────
.jd-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.jd-card {
  background: var(--surface);
  border: 1px solid var(--divider);
  border-radius: 14px;
  padding: 20px 24px;
}

.jd-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.jd-user {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
}

.jd-meta {
  font-size: 11px;
  color: var(--text-faint);
  margin-top: 2px;
}

.jd-card-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.jd-count {
  font-size: 12px;
  color: var(--text-muted);
}

.jd-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  border: 1px solid;

  &--done {
    background: var(--tag-teal-bg);
    color: var(--success);
    border-color: var(--success);
  }

  &--running {
    background: var(--tag-blue-bg);
    color: var(--tag-blue-text);
    border-color: var(--tag-blue-text);
  }
}

// ── Progress bar ────────────────────────────────────
.jd-progress {
  background: var(--page-bg);
  border-radius: 6px;
  height: 6px;
  margin-bottom: 18px;
  overflow: hidden;
}

.jd-progress-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.5s ease;

  &--done {
    background: linear-gradient(90deg, var(--success), var(--accent));
  }

  &--running {
    background: linear-gradient(90deg, var(--tag-blue-text), var(--primary));
  }
}

// ── Node step track ─────────────────────────────────
.jd-track {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  row-gap: 20px;
}

.jd-step {
  flex: 1;
  min-width: 88px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  padding-top: 4px;

  &::before {
    content: '';
    position: absolute;
    top: 16px;
    left: -50%;
    width: 100%;
    height: 2px;
    background: var(--divider);
    z-index: 0;
  }

  &:first-child::before {
    display: none;
  }

  &--done::before,
  &--running::before {
    background: var(--success);
  }
}

.jd-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  z-index: 1;
  border: 2px solid;
  margin-bottom: 8px;
  background: var(--surface);
}

.jd-step--done .jd-dot {
  background: var(--success);
  border-color: var(--success);
  color: var(--primary-fg);
}

.jd-step--running .jd-dot {
  border-color: var(--tag-blue-text);
  color: var(--tag-blue-text);
}

.jd-step--pending .jd-dot {
  border-color: var(--divider);
  color: var(--text-faint);
}

.jd-step-key {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-faint);
}

.jd-step-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text);
  margin-top: 2px;
  max-width: 96px;
}

.jd-step-running {
  font-size: 9px;
  color: var(--tag-blue-text);
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 3px;
}

.jd-blink-dot {
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--tag-blue-text);
}

@media (prefers-reduced-motion: no-preference) {
  .jd-blink-dot {
    animation: jd-blink 1s ease-in-out infinite;
  }
}

@keyframes jd-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.jd-step-time {
  font-size: 9px;
  color: var(--text-faint);
  margin-top: 4px;
}
```

- [ ] **Step 5: 註冊新的 SCSS 檔案**

修改 `src/scss/views/_index.scss`，在檔案最後新增一行：

```scss
@import "./JourneyDashboard";
```

- [ ] **Step 6: 執行測試確認通過**

Run: `npm run test:unit -- JourneyDashboard.tokens`
Expected: PASS（4 個測試）

- [ ] **Step 7: 執行 build 確認 SCSS 編譯無誤**

Run: `npm run build`
Expected: 編譯成功，無 SCSS 錯誤（新檔案已正確 `@import`，`$font-family` 變數可解析）

- [ ] **Step 8: 手動視覺檢查**

啟動 `npm run dev`，打開 `/view/journeys`（`JourneyDashboard` 的路由路徑）：
- 確認至少手動呼叫一次 `journeyStore.createJourney(...)` 加上 `setNodeRunning`/`setNodeDone`（可在瀏覽器 console 執行，或暫時在別處觸發）觀察卡片渲染，確認連接式步驟條正確顯示已完成（綠色實心 ✓）/執行中（藍色空心 + 閃爍點）/尚未開始（灰色空心 + 流水號）三種狀態
- 切換 dark mode：確認整頁顏色正確跟隨主題切換（這是本次最大的行為改變，過去這頁固定深色）
- 縮小視窗寬度：確認節點較多的旅程（行銷旅程 6 節點）步驟條會換行，不會被擠壓變形
- 開啟「減少動態效果」系統偏好設定，確認執行中節點的閃爍圓點動畫停用

- [ ] **Step 9: Commit**

```bash
git add src/views/JourneyDashboard.vue src/scss/views/_JourneyDashboard.scss src/scss/views/_index.scss src/views/__tests__/JourneyDashboard.tokens.test.ts
git commit -m "feat(JourneyDashboard): 從 inline hex 重建到 token 系統，節點改為連接式步驟條"
```

---

## 執行後檢查

兩個任務都完成後，執行一次全套驗證：

```bash
npm run test:unit
npm run build
npm run type-check
npm run lint
```

`test:unit`、`build` 必須全部通過；`type-check`、`lint` 只需確認沒有比修改前更多的錯誤數（既有技術債不在本次範圍）。
