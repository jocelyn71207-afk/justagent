# Phase 1：專案與團隊管理群組版型重設計 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在維持「側邊欄＋內容區」整體殼不變的前提下，讓「專案與團隊管理」群組（ProjectDashboard、ProjectTrashCans、TeamProject、TeamAccessManagement、CompanyTeamSettings）的內容區版面呼應資料本身的重要性/急迫度，取代目前齊頭式的卡片格線、KPI 膠囊與純表格排版。

**Architecture:** 純樣板（template）與樣式（SCSS）層改動，沿用既有的 computed 邏輯（`expiryUrgency()`、`roleStats`、`getRoleClass()` 均已存在，不需要新增判斷邏輯），只在需要展示新增內容（如「最近異動」）時比照各檔案既有的本地假資料慣例新增資料，不觸碰任何 store/API。ProjectDashboard 與 TeamProject 共用 `ProjectListContent.vue`，改一次兩邊都生效。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、SCSS（CSS Grid `grid-column`/`grid-row` span 做版面分級）、Vitest + `@vue/test-utils`。

## Global Constraints

- 側邊欄＋內容區的整體殼不可變動；只調整內容區內部版面
- **任何新增的「重點/hero」視覺區塊，light mode 下一律使用品牌色的淺色調（`--tag-teal-bg`/`--accent-soft` 等），不可使用深色/近黑色 solid 色塊**（這是本次 spec 明確訂正過的規則）
- 不改變任何頁面的資訊架構：欄位、篩選條件、操作項目本身不變，只調整排版呈現方式
- 不改動任何 modal（`TeamAccountSettingModal`、`ProjectSettingModal`、`TeamSettingModal`、`AddPlatformAdminModal`）的內部版面或商業邏輯
- 不新增/修改任何 API 串接或 store 商業邏輯；唯一例外是 TeamAccessManagement 新增一個純展示用的本地假資料陣列（見 Task 3）
- 沿用 Phase 0 已建立的 design token（`--tag-*`、`--primary-a*`、`$spacing`、`--shadow-*`），不新增品牌色以外的顏色
- 不觸碰 KnowledgeBase、SkillEditor、Explore、AiViewer、GUI、JourneyDashboard、KnowledgeDetail/Editor、SkillManagement、SkillTest、LoginView、AppEntrance

---

### Task 1: ProjectListContent 卡片格線 — Spotlight 卡片（影響 ProjectDashboard + TeamProject）

**Files:**
- Modify: `src/components/ProjectListContent/ProjectListContent.vue:68`（`.project-card` 的 `:class` 綁定）
- Modify: `src/scss/components/_ProjectListContent.scss`（`.project-card` 規則區塊內新增 `&.is-spotlight`）
- Test: `src/components/ProjectListContent/__tests__/ProjectListContent.spotlight.test.ts`（新增）

**Interfaces:**
- Consumes：既有的 `displayProjectList`（已按 `sortFn()` 排序，預設新→舊）、既有的 `.project-card` class 與其子元素結構
- Produces：`.is-spotlight` CSS class，套用在 `displayProjectList` 陣列 index 0 的卡片上；後續無其他任務依賴此名稱

- [ ] **Step 1: 寫失敗測試 — 陣列第一張卡片要有 `is-spotlight` class，其餘沒有**

```ts
// src/components/ProjectListContent/__tests__/ProjectListContent.spotlight.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import ProjectListContent from '../ProjectListContent.vue'

describe('ProjectListContent spotlight 卡片', () => {
  it('卡片檢視下，清單第一張卡片有 is-spotlight class，其餘沒有', async () => {
    setActivePinia(createPinia())
    const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    const wrapper = mount(ProjectListContent, {
      props: { title: '最近使用', mode: 'recent' },
      global: { plugins: [router], stubs: { AppBreadcrumb: true, ProjectSettingModal: true } },
    })
    await wrapper.vm.$nextTick()
    const cards = wrapper.findAll('.project-card')
    expect(cards.length).toBeGreaterThan(1)
    expect(cards[0].classes()).toContain('is-spotlight')
    for (let i = 1; i < cards.length; i++) {
      expect(cards[i].classes()).not.toContain('is-spotlight')
    }
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npx vitest run src/components/ProjectListContent/__tests__/ProjectListContent.spotlight.test.ts`
Expected: FAIL（目前沒有任何卡片有 `is-spotlight` class）

- [ ] **Step 3: 修改 `ProjectListContent.vue` 第 68 行**

現有：
```html
        <div class="project-card" v-for="(item, i) in displayProjectList" :key="'card' + i"
          @click="gotoAiViewer(item)"
          @mouseenter="item.isHovered = true"
          @mouseleave="item.isHovered = false; item.showMoreOption = false">
```

改為：
```html
        <div :class="['project-card', { 'is-spotlight': i === 0 }]" v-for="(item, i) in displayProjectList" :key="'card' + i"
          @click="gotoAiViewer(item)"
          @mouseenter="item.isHovered = true"
          @mouseleave="item.isHovered = false; item.showMoreOption = false">
```

- [ ] **Step 4: 執行測試確認通過**

Run: `npx vitest run src/components/ProjectListContent/__tests__/ProjectListContent.spotlight.test.ts`
Expected: PASS

- [ ] **Step 5: 在 `_ProjectListContent.scss` 的 `.project-card` 規則區塊內新增 spotlight 樣式**

在 `.project-card { ... }` 區塊內（`&.is-selected, &.active { ... }` 規則之後）新增：
```scss
    // ── Spotlight 卡片（清單第一張，通常是最近更新的專案）──
    &.is-spotlight {
      grid-column: span 2;

      .card-img { height: 220px; }
      .card-footer .card-name {
        font-size: 15px;
        -webkit-line-clamp: 1;
      }
    }
```

- [ ] **Step 6: 編譯驗證**

Run: `npm run build`
Expected: 建置成功

- [ ] **Step 7: 執行完整測試套件確認沒有連帶壞掉其他測試**

Run: `npx vitest run`
Expected: 全部通過

- [ ] **Step 8: Commit**

```bash
git add src/components/ProjectListContent/ProjectListContent.vue src/scss/components/_ProjectListContent.scss src/components/ProjectListContent/__tests__/ProjectListContent.spotlight.test.ts
git commit -m "feat(project-list): spotlight first card in grid (ProjectDashboard + TeamProject)"
```

---

### Task 2: ProjectTrashCans — Bento 卡片（依到期急迫度分級）+ Hero 統計列

**Files:**
- Modify: `src/views/ProjectTrashCans.vue`（`.trash-info-banner` 替換為統計列；卡片 `:class` 綁定加上急迫度分級 class）
- Modify: `src/scss/views/_ProjectTrashCans.scss`（新增統計列與 bento span 樣式）
- Test: `src/views/__tests__/ProjectTrashCans.bento.test.ts`（新增）

**Interfaces:**
- Consumes：既有的 `expiryUrgency(dateStr): 'urgent' | 'warning' | 'normal'`、`calcRemainingDays()`、`displayProjectList`
- Produces：`.trash-bento-summary` 統計列（含 `.hero`/`.side` 兩種 tile）；卡片 class `bento-urgent`/`bento-warning`/`bento-normal`（`urgent` → `grid-column: span 2`，其餘維持原尺寸）

- [ ] **Step 1: 寫失敗測試 — 急迫度為 urgent 的卡片要有 `bento-urgent` class 並且視覺上跨兩欄**

```ts
// src/views/__tests__/ProjectTrashCans.bento.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import ProjectTrashCans from '../ProjectTrashCans.vue'

describe('ProjectTrashCans bento 卡片', () => {
  it('每張卡片依急迫度套用對應的 bento class', async () => {
    setActivePinia(createPinia())
    const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    const wrapper = mount(ProjectTrashCans, {
      global: { plugins: [router], stubs: { AppBreadcrumb: true, compDropDown: true } },
    })
    await wrapper.vm.$nextTick()
    const cards = wrapper.findAll('.project-card')
    expect(cards.length).toBeGreaterThan(0)
    // 每張卡片必須恰好命中三個急迫度 class 之一
    cards.forEach((card) => {
      const hasBentoClass = ['bento-urgent', 'bento-warning', 'bento-normal'].some(c => card.classes().includes(c))
      expect(hasBentoClass).toBe(true)
    })
    // 統計摘要列存在
    expect(wrapper.find('.trash-bento-summary').exists()).toBe(true)
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npx vitest run src/views/__tests__/ProjectTrashCans.bento.test.ts`
Expected: FAIL（目前沒有 `bento-*` class，也沒有 `.trash-bento-summary`）

- [ ] **Step 3: 修改 `ProjectTrashCans.vue` — 統計列與卡片 class**

現有（第 25-28 行，警示橫幅）：
```html
      <div class="trash-info-banner" v-if="trashList.length">
        <i class="material-symbols-outlined">warning</i>
        <span>專案將依剩餘天數自動永久刪除。<strong>紅色標籤</strong>代表 3 天內到期，請盡快還原或確認刪除。</span>
      </div>
```

改為：
```html
      <div class="trash-bento-summary" v-if="trashList.length">
        <div class="hero">
          <div class="tag">最緊急</div>
          <div class="big">{{ urgentCount }} 個</div>
          <div class="cap">3 天內即將永久刪除</div>
        </div>
        <div class="side"><b>{{ warningCount }}</b><span>7 天內到期</span></div>
        <div class="side"><b>{{ trashList.length }}</b><span>全部項目</span></div>
      </div>
```

現有（第 31-33 行，卡片格線與卡片 class）：
```html
      <div class="card-list-box mt-2" v-if="displayProjectList.length">
        <div class="one-card-box project-card" v-for="(item, i) in displayProjectList" :key="i"
          @mouseleave="item.showMoreOption = false;">
```

改為：
```html
      <div class="card-list-box mt-2" v-if="displayProjectList.length">
        <div :class="['one-card-box', 'project-card', `bento-${expiryUrgency(item.remainingDays)}`]" v-for="(item, i) in displayProjectList" :key="i"
          @mouseleave="item.showMoreOption = false;">
```

- [ ] **Step 4: 在 `<script setup>` 新增兩個統計用的 computed（放在既有 `displayProjectList` computed 之後）**

```ts
// 急迫（3 天內到期）與警示（7 天內到期）的數量統計，供 bento 統計列使用
const urgentCount = computed(() => trashList.value.filter((item: any) => expiryUrgency(item.remainingDays) === 'urgent').length);
const warningCount = computed(() => trashList.value.filter((item: any) => expiryUrgency(item.remainingDays) === 'warning').length);
```

- [ ] **Step 5: 執行測試確認通過**

Run: `npx vitest run src/views/__tests__/ProjectTrashCans.bento.test.ts`
Expected: PASS

- [ ] **Step 6: 修改 `_ProjectTrashCans.scss` — 新增統計列樣式，並讓 urgent 卡片跨兩欄**

在檔案開頭（`.ProjectTrashCans {` 之後，`.card-list-box .one-card-box.project-card` 規則之前）新增：
```scss
  // ── Bento 統計摘要列 ─────────────────────────────
  .trash-bento-summary {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;

    .hero {
      flex: 1.3 1 260px;
      background: linear-gradient(135deg, var(--surface), var(--danger-soft));
      border: 1px solid var(--danger);
      border-radius: 14px;
      padding: 16px 20px;

      .tag {
        font-size: 11px;
        font-weight: 700;
        color: var(--danger);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .big {
        font-size: 30px;
        font-weight: 700;
        color: var(--text);
        font-family: $font-family-heading;
        margin-top: 4px;
        font-variant-numeric: tabular-nums;
      }
      .cap { font-size: 12.5px; color: var(--text-faint); margin-top: 2px; }
    }

    .side {
      flex: 1 1 160px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 2px;
      background: var(--surface);
      border: 1px solid var(--divider);
      border-radius: 14px;
      padding: 12px 16px;

      b { font-size: 20px; color: var(--text); font-variant-numeric: tabular-nums; }
      span { font-size: 11.5px; color: var(--text-faint); }
    }
  }
```

在 `.card-list-box .one-card-box.project-card { ... }` 規則區塊內（`cursor: default;` 那行之後）新增：
```scss
    // ── Bento 分級：urgent 卡片放大跨欄 ─────────────
    &.bento-urgent {
      grid-column: span 2;
      max-width: none;
    }
```

- [ ] **Step 7: 編譯驗證**

Run: `npm run build`
Expected: 建置成功

- [ ] **Step 8: 執行完整測試套件**

Run: `npx vitest run`
Expected: 全部通過

- [ ] **Step 9: Commit**

```bash
git add src/views/ProjectTrashCans.vue src/scss/views/_ProjectTrashCans.scss src/views/__tests__/ProjectTrashCans.bento.test.ts
git commit -m "feat(project-trash): bento card sizing by expiry urgency, hero summary row"
```

---

### Task 3: TeamAccessManagement — 企業擁有者 Hero 卡 + 角色 KPI Tile + 最近異動側欄

**Files:**
- Modify: `src/views/TeamAccessManagement.vue`（`.stats-bar` 改為 hero/tile 結構；表格外層加上 split layout 與活動側欄；新增假資料）
- Modify: `src/scss/views/_TeamAccessManagement.scss`（新增 hero/tile/split-layout/activity-panel 樣式）
- Test: `src/views/__tests__/TeamAccessManagement.layout.test.ts`（新增）

**Interfaces:**
- Consumes：既有的 `roleStats`（已按 `roleOrder` 排序，企業擁有者一定排第一個，如果存在的話）、`getRoleClass()`
- Produces：`recentActivity` ref（型別 `AccessActivity[]`，欄位 `id/memberName/action/time`），本任務內部使用，不供其他任務消費

- [ ] **Step 1: 寫失敗測試 — 角色統計第一項要用 hero 樣式呈現，且「最近異動」側欄要存在**

```ts
// src/views/__tests__/TeamAccessManagement.layout.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TeamAccessManagement from '../TeamAccessManagement.vue'

describe('TeamAccessManagement 版型', () => {
  it('企業擁有者以 hero 卡呈現，其餘角色是 tile，且有最近異動側欄', () => {
    setActivePinia(createPinia())
    const wrapper = mount(TeamAccessManagement, {
      global: { stubs: { AppBreadcrumb: true, compPagination: true, TeamAccountSettingModal: true } },
    })

    const hero = wrapper.find('.role-stat-hero')
    expect(hero.exists()).toBe(true)
    expect(hero.text()).toContain('企業擁有者')

    const tiles = wrapper.findAll('.role-stat-tile')
    expect(tiles.length).toBeGreaterThan(0)

    expect(wrapper.find('.access-activity-panel').exists()).toBe(true)
    expect(wrapper.findAll('.access-activity-item').length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npx vitest run src/views/__tests__/TeamAccessManagement.layout.test.ts`
Expected: FAIL（目前是純 `.stats-bar`/`.stat-item`，沒有 hero/tile/活動側欄）

- [ ] **Step 3: 在 `<script setup>` 新增最近異動假資料（放在 `roleStats` computed 之後）**

```ts
// 最近權限異動紀錄  TODO... 後端吐資料（目前無對應 API，純前端展示用）
interface AccessActivity {
  id: string;
  memberName: string;
  action: string;
  time: string;
}
const recentActivity = ref<AccessActivity[]>([
  { id: 'act1', memberName: 'Kevin',  action: '被設為團隊主管',   time: '2 小時前' },
  { id: 'act2', memberName: 'Iris',   action: '加入專案人員',     time: '昨天' },
  { id: 'act3', memberName: 'Wendy',  action: '權限被調整',       time: '3 天前' },
]);
```

- [ ] **Step 4: 修改樣板 — 角色統計列改為 hero/tile 結構**

現有（第 23-30 行）：
```html
      <!-- 角色統計概覽 -->
      <div class="stats-bar">
        <div class="stat-item" v-for="stat in roleStats" :key="stat.role">
          <span class="stat-dot" :class="getRoleClass(stat.role)"></span>
          <span class="stat-label">{{ stat.role }}</span>
          <span class="stat-count">{{ stat.count }}</span>
        </div>
      </div>
```

改為：
```html
      <!-- 角色統計概覽：企業擁有者是唯一的 hero，其餘是 tile -->
      <div class="role-stats-row">
        <div
          v-for="(stat, si) in roleStats"
          :key="stat.role"
          :class="si === 0 ? 'role-stat-hero' : 'role-stat-tile'"
        >
          <template v-if="si === 0">
            <div class="cap">{{ stat.role }}</div>
            <div class="big">{{ stat.count }}</div>
          </template>
          <template v-else>
            <b>{{ stat.count }}</b>
            <span>{{ stat.role }}</span>
          </template>
        </div>
      </div>
```

- [ ] **Step 5: 修改樣板 — 表格區改為表格＋活動側欄的 split layout**

現有（第 32-73 行左右，`.table-box.new-table-box` 到 `</div>` 結尾，維持表格內部結構不變，只調整外層包裹）：

現有外層：
```html
      <div class="table-box new-table-box">
        <table class="custom-table">
          ...（維持不變）...
        </table>
      </div>
```

改為：
```html
      <div class="access-split-layout">
        <div class="table-box new-table-box">
          <table class="custom-table">
            ...（維持不變）...
          </table>
        </div>
        <div class="access-activity-panel">
          <h4>最近異動</h4>
          <div class="access-activity-item" v-for="act in recentActivity" :key="act.id">
            <span class="dot"></span>
            <div>
              <p><b>{{ act.memberName }}</b> {{ act.action }}</p>
              <time>{{ act.time }}</time>
            </div>
          </div>
        </div>
      </div>
```

- [ ] **Step 6: 執行測試確認通過**

Run: `npx vitest run src/views/__tests__/TeamAccessManagement.layout.test.ts`
Expected: PASS

- [ ] **Step 7: 新增 SCSS 樣式（在 `_TeamAccessManagement.scss` 的 `.stats-bar`/`.stat-item`/`.stat-dot`/`.stat-label`/`.stat-count` 規則之後，或直接取代——保留舊 class 供其他地方沿用的疑慮不存在，可直接新增新規則）**

```scss
  // ── 角色統計：hero + tile ───────────────────────────
  // 注意：hero 卡在 light mode use 品牌淺色調（--tag-teal-bg），不可用深色/近黑色底
  .role-stats-row {
    display: flex;
    gap: 10px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .role-stat-hero {
    flex: 1.4 1 240px;
    background: var(--tag-teal-bg);
    border: 1px solid var(--primary);
    border-radius: 14px;
    padding: 14px 18px;

    .cap {
      font-size: 11px;
      font-weight: 700;
      color: var(--tag-teal-text);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .big {
      font-size: 26px;
      font-weight: 700;
      color: var(--text);
      font-family: $font-family-heading;
      margin-top: 4px;
      font-variant-numeric: tabular-nums;
    }
  }

  .role-stat-tile {
    flex: 1 1 140px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    background: var(--surface);
    border: 1px solid var(--divider);
    border-radius: 14px;
    padding: 10px 16px;

    b { font-size: 20px; color: var(--text); font-variant-numeric: tabular-nums; }
    span { font-size: 11.5px; color: var(--text-faint); }
  }

  // ── 表格 ＋ 最近異動側欄 ─────────────────────────────
  .access-split-layout {
    display: grid;
    grid-template-columns: 1fr 240px;
    gap: 16px;
    align-items: start;

    @media (max-width: $breakpoint-tablet) {
      grid-template-columns: 1fr;
    }
  }

  .access-activity-panel {
    background: var(--sidebar-bg);
    border: 1px solid var(--divider);
    border-radius: 12px;
    padding: 16px;

    h4 {
      margin: 0 0 10px;
      font-size: 12px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
  }

  .access-activity-item {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin-bottom: 12px;
    font-size: 12px;

    &:last-child { margin-bottom: 0; }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--primary);
      margin-top: 5px;
      flex-shrink: 0;
    }

    p { margin: 0; color: var(--text); }
    time { font-size: 10.5px; color: var(--text-faint); }
  }
```

（既有的 `.stats-bar`/`.stat-item`/`.stat-dot`/`.stat-label`/`.stat-count` 規則因樣板已不再使用，保留在檔案中即可，不強制刪除——這是與 Phase 0 稽核報告一致的「新舊並存」技術債模式，非本次範圍，若要清理留待未來的整潔任務）

- [ ] **Step 8: 編譯驗證**

Run: `npm run build`
Expected: 建置成功

- [ ] **Step 9: 執行完整測試套件**

Run: `npx vitest run`
Expected: 全部通過

- [ ] **Step 10: Commit**

```bash
git add src/views/TeamAccessManagement.vue src/scss/views/_TeamAccessManagement.scss src/views/__tests__/TeamAccessManagement.layout.test.ts
git commit -m "feat(team-access): owner hero card, role KPI tiles, recent-activity side panel"
```

---

### Task 4: CompanyTeamSettings — 設定區塊雙欄排列

**Files:**
- Modify: `src/views/CompanyTeamSettings.vue`（`company-settings`/`team-settings` 內的 `.settings-block` 包一層雙欄容器）
- Modify: `src/scss/views/_CompanyTeamSettings.scss`（新增雙欄 grid 樣式）
- Test: `src/views/__tests__/CompanyTeamSettings.layout.test.ts`（新增）

**Interfaces:**
- Consumes：既有的 `agentList`、`adminList`、`isCompanyTab` 等既有資料與邏輯，完全不變
- Produces：無其他任務依賴

- [ ] **Step 1: 寫失敗測試 — 兩個 tab 底下的 settings-block 都要被包在雙欄容器裡**

```ts
// src/views/__tests__/CompanyTeamSettings.layout.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CompanyTeamSettings from '../CompanyTeamSettings.vue'

describe('CompanyTeamSettings 版型', () => {
  it('企業 tab 的設定區塊被包在雙欄容器內', () => {
    setActivePinia(createPinia())
    const wrapper = mount(CompanyTeamSettings, {
      global: { stubs: { AppBreadcrumb: true, compSwitch: true, TeamSettingModal: true, AddPlatformAdminModal: true } },
    })
    const grid = wrapper.find('.company-settings .settings-grid')
    expect(grid.exists()).toBe(true)
    expect(grid.findAll('.settings-block').length).toBe(2)
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npx vitest run src/views/__tests__/CompanyTeamSettings.layout.test.ts`
Expected: FAIL（目前沒有 `.settings-grid` 容器）

- [ ] **Step 3: 修改樣板 — 企業 tab（`company-settings`）內的兩個 `settings-block` 包一層 `settings-grid`**

現有：
```html
        <div class="settings-block">
          <div class="settings-block-header">
            <span class="material-symbols-outlined settings-block-icon">smart_toy</span>
            <span class="settings-block-title">現有 Agent</span>
          </div>
          <div class="agent-list">
            ...
          </div>
        </div>

        <div class="settings-block">
          <div class="settings-block-header">
            <span class="material-symbols-outlined settings-block-icon">admin_panel_settings</span>
            <span class="settings-block-title">平台管理者</span>
            ...
          </div>
          ...
        </div>
```

改為（`info-card` 維持在外面不動，只把兩個 `settings-block` 包進 `settings-grid`）：
```html
        <div class="settings-grid">
          <div class="settings-block">
            <div class="settings-block-header">
              <span class="material-symbols-outlined settings-block-icon">smart_toy</span>
              <span class="settings-block-title">現有 Agent</span>
            </div>
            <div class="agent-list">
              ...
            </div>
          </div>

          <div class="settings-block">
            <div class="settings-block-header">
              <span class="material-symbols-outlined settings-block-icon">admin_panel_settings</span>
              <span class="settings-block-title">平台管理者</span>
              ...
            </div>
            ...
          </div>
        </div>
```

同樣的方式套用到團隊 tab（`team-settings`）內的「實體門市」與「電子商務」兩個 `settings-block`，也包進一個 `settings-grid`。

- [ ] **Step 4: 執行測試確認通過**

Run: `npx vitest run src/views/__tests__/CompanyTeamSettings.layout.test.ts`
Expected: PASS

- [ ] **Step 5: 新增 SCSS 樣式**

在 `_CompanyTeamSettings.scss` 內新增（放在既有 `.settings-block` 規則之前或之後皆可）：
```scss
  .settings-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    align-items: start;

    @media (max-width: $breakpoint-tablet) {
      grid-template-columns: 1fr;
    }
  }
```

- [ ] **Step 6: 編譯驗證**

Run: `npm run build`
Expected: 建置成功

- [ ] **Step 7: 執行完整測試套件**

Run: `npx vitest run`
Expected: 全部通過

- [ ] **Step 8: Commit**

```bash
git add src/views/CompanyTeamSettings.vue src/scss/views/_CompanyTeamSettings.scss src/views/__tests__/CompanyTeamSettings.layout.test.ts
git commit -m "feat(company-team-settings): two-column layout for settings blocks"
```

---

### Task 5: 全面驗證與視覺檢查

**Files:** 無新增/修改檔案，純驗證

- [ ] **Step 1: 型別檢查**

Run: `npm run type-check`
Expected: 沒有新增的錯誤（`src/composables/useBreadcrumb.ts` 的 3 個既有錯誤與本計畫無關，維持原樣）

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: 沒有新增的錯誤（專案既有的 lint 技術債與本計畫無關）

- [ ] **Step 3: 完整單元測試**

Run: `npx vitest run`
Expected: 全部通過，包含本計畫新增的 4 個測試檔（Task 1-4）

- [ ] **Step 4: 建置**

Run: `npm run build`
Expected: 成功

- [ ] **Step 5: 啟動 dev server 做視覺檢查**

Run: `npm run dev -- --port 5183`

依序打開以下路徑，分別在 light 與 dark mode 下檢查：
- `/view/ProjectDashboard`（spotlight 卡片是否正確跨欄、圖片變高）
- `/view/TeamProject`（同一元件，確認 `mode="team"` 情境下也正常）
- `/view/ProjectTrashCans`（bento 統計列 + urgent 卡片跨欄）
- `/view/TeamAccessManagement`（企業擁有者 hero 卡在 light mode 下必須是淺色調，不可出現深色/近黑色色塊；最近異動側欄正確顯示）
- `/view/CompanyTeamSettings`（企業 tab 與團隊 tab 的設定區塊都要是雙欄排列）

Expected: 沒有任何 light mode 下的意外深色色塊；dark mode 下所有新增區塊顏色正確跟隨主題切換

- [ ] **Step 6: Commit（若 Step 2 lint 有 auto-fix 產生額外變動）**

```bash
git add -A
git commit -m "chore: phase 1 verification pass" --allow-empty
```

---

## Self-Review 摘要（撰寫計畫時已核對）

- **spec 涵蓋度**：spec §2.1（ProjectListContent spotlight）→ Task 1；§2.2（ProjectTrashCans bento）→ Task 2；§2.3（TeamAccessManagement hero/tile/側欄）→ Task 3；§2.4（CompanyTeamSettings 雙欄）→ Task 4；§3（最近異動假資料）→ Task 3 Step 3；§4 技術做法（不新增深色色塊、沿用 Phase 0 token）→ 已在 Global Constraints 與各 Task 的樣式選色中落實；§7 成功標準 → Task 5 涵蓋
- **一致性**：Task 3 的 hero 卡明確使用 `--tag-teal-bg`/`--tag-teal-text`（淺色），與 spec 訂正後的「不可深色塊」規則一致；未使用 Phase 0 mockup 階段曾經出現過的 `#09151A` 深色方案
- **範圍邊界**：`ProjectListContent.vue` 改動經確認只影響卡片版型本身，不影響 `mode='recent'`/`mode='team'` 的資料過濾邏輯（`displayProjectList` computed 完全未被觸碰）
