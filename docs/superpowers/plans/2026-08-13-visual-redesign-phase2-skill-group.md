# Phase 2：Skill 管理群組版型與活潑感 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 為 SkillManagement、SkillTest、SkillEditor 建立一套可重用的「活潑感」互動樣式系統，套用到三個 view 上；同時做一個真實的結構性版面調整（Library 技能管理的企業/團隊區塊）與兩個 SkillEditor 步驟的重排，並清除確認無用的死程式碼。

**Architecture:** 活潑感系統是一組共用 CSS class（放在 `src/scss/_custom.scss`），其餘任務都是套用這組 class 到既有模板元素上，加上少量的模板重排（不動任何 computed 邏輯，`groupedTeamSkills`／`librarySubgroups` 這些資料早就存在，只是改變渲染方式）。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、SCSS、CSS `@keyframes`/`prefers-reduced-motion`、Vitest + `@vue/test-utils`。

## Global Constraints

- 企業色與 Phase 0/1 已建立的 token（`--primary`、`--accent`、`--tag-*`、`$spacing` 等）不可修改數值，只能重用
- SkillManagement 的 4 張統計卡**維持等大**，不做 hero/尺寸區分（使用者明確決定）
- 不改 `AppBreadcrumb`（10 個其他 view 共用）
- 不碰 `skillStore.ts` 的任何商業邏輯／資料結構
- 不改 `SkillTestChat.vue`／`SkillTestAI.vue` 內部邏輯或版面
- 不改側邊欄＋內容區的整體殼
- **`_SkillTest.scss` 的 `.version-dd`／`.version-dd-btn`／`.version-dd-menu`／`.version-dd-item`／`.version-current-tag` 是 `SkillVersionPicker.vue` 實際在用的樣式（已於規劃階段確認，非死程式碼）——不可刪除**，這點修正了原設計 spec 草稿中「可能是死程式碼」的推測
- 活潑感的動畫效果必須包在 `@media (prefers-reduced-motion: no-preference)` 內，`reduce` 時只保留顏色類回饋

---

### Task 1：活潑感共用系統（`_custom.scss`）

**Files:**
- Modify: `src/scss/_custom.scss`（檔案結尾，`.tag-badge` 之後新增）

**Interfaces:**
- Produces：`.lively-stagger`（套用在清單/格線容器，其直接子元素會依序 fade-in-up）、`.lively-card`（套用在卡片元素，含 hover 上浮/陰影/邊框變色）、`.lively-icon`（套用在卡片內的 icon 元素，`.lively-card:hover` 時觸發微旋轉+放大）、`.lively-corner-a` / `.lively-corner-b`（不規則圓角配對，供 `nth-child` 交錯使用）——後續 Task 3-7 都會套用這些 class 到既有模板元素

- [ ] **Step 1: 在 `_custom.scss` 結尾新增活潑感系統**

```scss
// ── Phase 2：活潑感互動系統（進場 stagger + hover 彈性回饋 + 不規則圓角）─────
// 使用方式：
//   容器套 .lively-stagger，直接子元素會依序淡入上浮（最多 8 個有 delay，第 9 個起沿用第 8 個的 delay）
//   卡片套 .lively-card（+ 卡片內想要有微旋轉回饋的 icon 套 .lively-icon）
//   想要不規則圓角交錯的清單，配合 nth-child(odd)/(even) 分別加 .lively-corner-a / .lively-corner-b
@media (prefers-reduced-motion: no-preference) {
  .lively-stagger {
    > * {
      opacity: 0;
      animation: lively-fade-in-up 0.5s cubic-bezier(0.34, 1.4, 0.64, 1) forwards;
    }
    @for $i from 1 through 8 {
      > *:nth-child(#{$i}) { animation-delay: #{$i * 0.08}s; }
    }
    > *:nth-child(n + 9) { animation-delay: 0.64s; }
  }

  @keyframes lively-fade-in-up {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .lively-card {
    transition: transform 0.22s cubic-bezier(0.34, 1.4, 0.64, 1), box-shadow 0.22s ease, border-color 0.22s ease;

    &:hover {
      transform: translateY(-3px) scale(1.02);
      box-shadow: var(--shadow-md);
      border-color: var(--primary);
    }
  }

  .lively-icon {
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .lively-card:hover .lively-icon {
    transform: rotate(-8deg) scale(1.1);
  }

  .lively-corner-a { border-radius: 18px 6px 18px 6px; }
  .lively-corner-b { border-radius: 6px 18px 6px 18px; }
  .lively-card.lively-corner-a:hover,
  .lively-card.lively-corner-b:hover {
    transform: translateY(-3px) scale(1.02) rotate(-0.5deg);
  }
}

// reduced-motion 時仍保留顏色類回饋，只是沒有位移/旋轉/進場動畫
@media (prefers-reduced-motion: reduce) {
  .lively-card {
    transition: box-shadow 0.15s ease, border-color 0.15s ease;
    &:hover {
      box-shadow: var(--shadow-md);
      border-color: var(--primary);
    }
  }
}
```

- [ ] **Step 2: 編譯驗證**

Run: `npm run build`
Expected: 建置成功

- [ ] **Step 3: Commit**

```bash
git add src/scss/_custom.scss
git commit -m "feat(custom): add phase 2 liveliness system (stagger, hover, irregular corners)"
```

---

### Task 2：SkillManagement 死程式碼清理

**Files:**
- Modify: `src/scss/views/_SkillManagement.scss`

**Interfaces:**
- 無新介面，純刪除確認無用的規則

- [ ] **Step 1: 刪除以下已確認無樣板引用的規則區塊**

刪除 `.skill-stat-card` 內的 `&--alert` 修飾（第 38-42 行）：
```scss
    &--alert {
      border-color: $color-warning-border;
      background: $color-warning-bg;
    }
```

刪除 `.skill-stat-icon` 內的 `&.icon--pending` 與 `&.icon--pass`（第 71-79 行）：
```scss
    &.icon--pending {
      background: $color-warning-bg;
      color: $color-warning-amber;
      border: 1px solid $color-warning-border;
    }
    &.icon--pass {
      background: $color_main_4;
      color: $color_main_2;
    }
```

刪除 `.skill-search-clear`（約第 134-146 行，`.skill-search` 區塊內）：
```scss
    .skill-search-clear {
      border: none;
      background: none;
      padding: 0;
      cursor: pointer;
      color: var(--text-faint);
      display: flex;
      align-items: center;

      .material-symbols-outlined { font-size: 14px; }
      &:hover { color: var(--text); }
    }
```

刪除整個「── Filter chips ──」區塊，包含 `.filter-chips` 與 `.filter-chip`（約第 148-216 行，從註解 `// ── Filter chips ──` 開始到該區塊結尾）。

刪除整個「── Skill tree ──」區塊，包含 `.skill-tree`（約第 218-224 行）。

刪除整個「── Group box ──」區塊，包含 `.skill-group-box` 與其所有巢狀規則（約第 226-319 行，從註解 `// ── Group box ──` 開始到該區塊結尾）。

刪除整個「── Empty state ──」區塊，包含 `.skill-empty`（約第 321-333 行）——**注意**：不要跟後面的 `.skill-section-empty`（約第 492-498 行）搞混，那個仍在使用，不可刪除。

刪除 `.skill-manage-list`（約第 484-490 行）：
```scss
  .skill-manage-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;

    @media (max-width: 860px) { grid-template-columns: 1fr; }
  }
```

- [ ] **Step 2: 刪除後用 grep 確認這些 class 名稱在 `SkillManagement.vue` 與其引用的元件中都沒有出現**

Run: `grep -rn "skill-search-clear\|filter-chip\|skill-tree\|skill-group-box\|skill-group-children\|class=\"skill-empty\"\|skill-manage-list" src/views/SkillManagement.vue src/components/Skill/`
Expected: 無輸出（`skill-section-empty` 不會被這個 pattern 匹配到，因為 pattern 是 `skill-empty` 不是 `skill-section-empty`）

- [ ] **Step 3: 編譯驗證**

Run: `npm run build`
Expected: 建置成功

- [ ] **Step 4: 執行完整測試套件**

Run: `npx vitest run`
Expected: 全部通過（純樣式刪除，不應該影響任何測試）

- [ ] **Step 5: Commit**

```bash
git add src/scss/views/_SkillManagement.scss
git commit -m "chore(skill-management): remove dead CSS (filter-chips, skill-tree, skill-group-box, etc.)"
```

---

### Task 3：SkillManagement 統計列＋審核卡片活潑感與自然高度

**Files:**
- Modify: `src/views/SkillManagement.vue`（統計卡與 `SkillReviewCard` 清單容器加 class）
- Modify: `src/scss/views/_SkillManagement.scss`（`.src-list` 加 `align-items: start`）
- Test: `src/views/__tests__/SkillManagement.liveliness.test.ts`（新增）

**Interfaces:**
- Consumes：Task 1 的 `.lively-stagger`／`.lively-card`／`.lively-icon`（class 名稱）、既有的 `store.pendingReviewSkills`

- [ ] **Step 1: 寫失敗測試 — 統計列容器與審核卡片清單容器要有活潑感 class**

```ts
// src/views/__tests__/SkillManagement.liveliness.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SkillManagement from '../SkillManagement.vue'

describe('SkillManagement 活潑感套用', () => {
  it('統計列容器有 lively-stagger，每張統計卡有 lively-card', () => {
    setActivePinia(createPinia())
    const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    const wrapper = mount(SkillManagement, {
      global: { plugins: [router], stubs: { AppBreadcrumb: true, LibraryBrowseModal: true, SkillDetailDrawer: true, UpstreamUpdateDrawer: true, SkillReviewDrawer: true, BatchUpdateModal: true, SkillEditChatModal: true } },
    })
    const statsRow = wrapper.find('.skill-stats-row')
    expect(statsRow.classes()).toContain('lively-stagger')
    const statCards = wrapper.findAll('.skill-stat-card')
    expect(statCards.length).toBe(4)
    statCards.forEach(card => expect(card.classes()).toContain('lively-card'))
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npx vitest run src/views/__tests__/SkillManagement.liveliness.test.ts`
Expected: FAIL（目前 `.skill-stats-row`/`.skill-stat-card` 沒有 `lively-*` class）

- [ ] **Step 3: 修改 `SkillManagement.vue` 統計列（第 22-58 行）**

現有第 22 行：
```html
      <div class="skill-stats-row">
```
改為：
```html
      <div class="skill-stats-row lively-stagger">
```

現有 4 處（第 23、32、41、50 行）：
```html
        <div class="skill-stat-card">
```
全部改為：
```html
        <div class="skill-stat-card lively-card">
```

現有 4 處 `.skill-stat-icon`（第 24、33、42、51 行），例如：
```html
          <div class="skill-stat-icon icon--enabled">
```
全部加上 `lively-icon`，改為：
```html
          <div class="skill-stat-icon icon--enabled lively-icon">
```
（其餘三個 `icon--ext`/`icon--team`/`icon--usage` 比照辦理）

- [ ] **Step 4: 執行測試確認通過**

Run: `npx vitest run src/views/__tests__/SkillManagement.liveliness.test.ts`
Expected: PASS

**以下 Step 5-6 是 CSS-only 的行為調整（grid `align-items` 不強制等高），jsdom 不會實際計算版面高度，無法用單元測試驗證視覺對齊結果——比照 Phase 0/1 對純 CSS 行為調整的處理方式，用 `npm run build` + Task 8 的手動視覺檢查驗證，不補假測試。**

- [ ] **Step 5: 修改 `SkillManagement.vue` 審核卡片清單容器（第 100 行）加上活潑感 class**

現有：
```html
            <div v-if="store.pendingReviewSkills.length" class="src-list">
```
改為：
```html
            <div v-if="store.pendingReviewSkills.length" class="src-list lively-stagger">
```

- [ ] **Step 6: 修改 `_SkillManagement.scss` 的 `.src-list`，讓卡片自然高度對齊（不強制等高）**

現有（約第 445-451 行）：
```scss
  .src-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;

    @media (max-width: 860px) { grid-template-columns: 1fr; }
  }
```
改為：
```scss
  .src-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    align-items: start;

    @media (max-width: 860px) { grid-template-columns: 1fr; }
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
git add src/views/SkillManagement.vue src/scss/views/_SkillManagement.scss src/views/__tests__/SkillManagement.liveliness.test.ts
git commit -m "feat(skill-management): apply liveliness to stats row, natural-height review cards"
```

---

### Task 4：SkillManagement Library 團隊技能改多欄卡片

**Files:**
- Modify: `src/views/SkillManagement.vue`（`.lsr-team-groups` 區塊的樣板結構）
- Modify: `src/scss/components/_LibrarySkillRow.scss`（`.lsr-team-groups`／`.lsr-team-group`／`.lsr-team-label` 樣式）
- Test: `src/views/__tests__/SkillManagement.teamCards.test.ts`（新增）

**Interfaces:**
- Consumes：既有的 `groupedTeamSkills` computed（`{ teamName: string; skills: Skill[] }[]`，已存在於 `SkillManagement.vue`，不需新增邏輯）

**背景**：`LibrarySkillRow.vue` 元件與 `.lsr-section-list`（2 欄技能列格線）同時被 `LibraryBrowseModal.vue` 使用，但 `.lsr-team-groups`／`.lsr-team-group`／`.lsr-team-label` 這三個 class 經過確認**只有** `SkillManagement.vue` 在用（`LibraryBrowseModal.vue` 沒有依團隊分組的畫面），所以這次改動不會影響 Modal。

- [ ] **Step 1: 寫失敗測試 — 團隊技能要渲染成獨立卡片，數量等於團隊分組數**

```ts
// src/views/__tests__/SkillManagement.teamCards.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SkillManagement from '../SkillManagement.vue'
import { useSkillStore } from '@/stores/skillStore'

describe('SkillManagement Library 團隊技能卡片', () => {
  it('團隊技能區塊改為多欄卡片，卡片數等於團隊分組數', async () => {
    setActivePinia(createPinia())
    const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    const wrapper = mount(SkillManagement, {
      global: { plugins: [router], stubs: { AppBreadcrumb: true, LibraryBrowseModal: true, SkillDetailDrawer: true, UpstreamUpdateDrawer: true, SkillReviewDrawer: true, BatchUpdateModal: true, SkillEditChatModal: true } },
    })
    const store = useSkillStore()
    // 切到管理區 tab 才會渲染 Library 技能管理區塊（點擊真正的 tab 按鈕，不碰內部狀態）
    const reviewTabBtn = wrapper.findAll('button').find(b => b.text().includes('管理區'))
    expect(reviewTabBtn, '目前 mock 角色需為管理者才看得到「管理區」tab，若找不到請確認 SkillManagement.vue 的 currentUserRole 預設值').toBeTruthy()
    await reviewTabBtn!.trigger('click')
    await wrapper.vm.$nextTick()

    const teamSkillCount = store.flatSkills.filter(s => s.scope === 'team').length
    if (teamSkillCount === 0) return // mock 資料若無團隊技能，此測試無從驗證，交由後續資料調整

    const teamGrid = wrapper.find('.lsr-team-grid')
    expect(teamGrid.exists()).toBe(true)
    const teamCards = wrapper.findAll('.lsr-team-card')
    expect(teamCards.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: 執行測試確認失敗（或確認 mock 資料含團隊技能後才失敗——若目前 mock 資料沒有 `scope==='team'` 的技能，先在下一步檢查後再判斷）**

Run: `npx vitest run src/views/__tests__/SkillManagement.teamCards.test.ts`
Expected: 若 mock 資料有團隊技能，FAIL（目前沒有 `.lsr-team-grid`/`.lsr-team-card`）；若 mock 資料目前沒有任何 `scope: 'team'` 的技能，測試會直接通過（因為提前 return）——這種情況下改用讀 `src/stores/skillStore.ts` 確認實際情況，並在報告中註明

- [ ] **Step 3: 修改 `SkillManagement.vue` 的團隊技能區塊（第 141-168 行）**

現有：
```html
              <!-- 團隊技能（依團隊分組） -->
              <div v-if="groupedTeamSkills.length" class="lsr-section-block lsr-section-block--team">
                <div class="lsr-section-header">
                  <i class="material-symbols-outlined">group</i>
                  <span class="lsr-section-title">團隊技能</span>
                  <span class="lsr-section-count">{{ groupedTeamSkills.reduce((s, g) => s + g.skills.length, 0) }}</span>
                </div>
                <div class="lsr-team-groups">
                  <div
                    v-for="group in groupedTeamSkills"
                    :key="group.teamName"
                    class="lsr-team-group"
                  >
                    <div class="lsr-team-label">
                      <i class="material-symbols-outlined">apartment</i>{{ group.teamName }}
                      <span class="lsr-section-count">{{ group.skills.length }}</span>
                    </div>
                    <div class="lsr-section-list">
                      <LibrarySkillRow
                        v-for="skill in group.skills"
                        :key="skill.id"
                        :skill="skill"
                        @click="detailSkillId = skill.id"
                      />
                    </div>
                  </div>
                </div>
              </div>
```

改為：
```html
              <!-- 團隊技能（依團隊分組，每團隊一張卡片） -->
              <div v-if="groupedTeamSkills.length" class="lsr-section-block lsr-section-block--team">
                <div class="lsr-section-header">
                  <i class="material-symbols-outlined">group</i>
                  <span class="lsr-section-title">團隊技能</span>
                  <span class="lsr-section-count">{{ groupedTeamSkills.reduce((s, g) => s + g.skills.length, 0) }}</span>
                </div>
                <div class="lsr-team-grid lively-stagger">
                  <div
                    v-for="(group, gi) in groupedTeamSkills"
                    :key="group.teamName"
                    :class="['lsr-team-card', 'lively-card', gi % 2 === 0 ? 'lively-corner-a' : 'lively-corner-b']"
                  >
                    <div class="lsr-team-label">
                      <i class="material-symbols-outlined">apartment</i>{{ group.teamName }}
                      <span class="lsr-section-count">{{ group.skills.length }}</span>
                    </div>
                    <div class="lsr-section-list lsr-section-list--in-card">
                      <LibrarySkillRow
                        v-for="skill in group.skills"
                        :key="skill.id"
                        :skill="skill"
                        @click="detailSkillId = skill.id"
                      />
                    </div>
                  </div>
                </div>
              </div>
```

- [ ] **Step 4: 執行測試確認通過（或依 Step 2 的情況調整驗證方式）**

Run: `npx vitest run src/views/__tests__/SkillManagement.teamCards.test.ts`
Expected: PASS

- [ ] **Step 5: 修改 `_LibrarySkillRow.scss` — 把 `.lsr-team-groups`/`.lsr-team-group` 的直向堆疊改為響應式卡片格線**

現有（「── 團隊子群組 ──」區塊）：
```scss
.lsr-team-groups {
  display: flex;
  flex-direction: column;
}

.lsr-team-group {
  & + & { border-top: 1px solid var(--divider-a50); }
}

.lsr-team-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: #7c5fba;
  padding: 8px 16px 4px;

  .material-symbols-outlined { font-size: 14px; }
  .lsr-section-count { background: rgba(#7c5fba, 0.1); color: #7c5fba; }
}
```

改為：
```scss
.lsr-team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
  padding: 12px;
}

.lsr-team-card {
  border: 1px solid var(--divider-a50);
  background: var(--surface);
  padding: 12px 14px 14px;
}

.lsr-team-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: #7c5fba;
  padding: 0 0 8px;

  .material-symbols-outlined { font-size: 14px; }
  .lsr-section-count { background: rgba(#7c5fba, 0.1); color: #7c5fba; }
}

.lsr-section-list--in-card {
  padding: 0;
  grid-template-columns: 1fr;
}
```

（`.lsr-section-list`（無修飾符的原規則）保留不動，因為 `LibraryBrowseModal.vue`／企業技能區塊仍在用它的 2 欄版本；`.lsr-section-list--in-card` 是新增的修飾符，只在團隊卡片內部把欄數收成 1 欄、拿掉自己的 padding，因為外層 `.lsr-team-card` 已經有 padding 了）

- [ ] **Step 6: 編譯驗證**

Run: `npm run build`
Expected: 建置成功

- [ ] **Step 7: 執行完整測試套件**

Run: `npx vitest run`
Expected: 全部通過

- [ ] **Step 8: Commit**

```bash
git add src/views/SkillManagement.vue src/scss/components/_LibrarySkillRow.scss src/views/__tests__/SkillManagement.teamCards.test.ts
git commit -m "feat(skill-management): team skills as responsive multi-column cards"
```

---

### Task 5：SkillTest 側欄分類色條與活潑感

**Files:**
- Modify: `src/views/SkillTest.vue`（`subgroup-label` 與 `sidebar-item` 的 class 綁定）
- Modify: `src/scss/views/_SkillTest.scss`（分類色條樣式）
- Test: `src/views/__tests__/SkillTest.sidebar.test.ts`（新增）

**Interfaces:**
- Consumes：既有的 `librarySubgroups` computed（`{ key: 'system'|'enterprise'|'team'; label: string; skills: Skill[] }[]`，已存在，不需新增邏輯）
- **不可修改**：`.version-dd`／`.version-dd-btn`／`.version-dd-menu`／`.version-dd-item`／`.version-current-tag`（`SkillVersionPicker.vue` 實際使用中）

- [ ] **Step 1: 寫失敗測試 — 三個子分類的標籤要有對應的分類色 class**

```ts
// src/views/__tests__/SkillTest.sidebar.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SkillTest from '../SkillTest.vue'

describe('SkillTest 側欄分類色條', () => {
  it('系統/企業/團隊三個子分類標籤各自有對應的 subgroup-label--<key> class', () => {
    setActivePinia(createPinia())
    const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    const wrapper = mount(SkillTest, {
      global: { plugins: [router], stubs: { SkillTestChat: true, SkillTestAI: true } },
    })
    const labels = wrapper.findAll('.subgroup-label')
    expect(labels.length).toBeGreaterThan(0)
    labels.forEach(label => {
      const hasKeyClass = ['subgroup-label--system', 'subgroup-label--enterprise', 'subgroup-label--team'].some(c => label.classes().includes(c))
      expect(hasKeyClass).toBe(true)
    })
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npx vitest run src/views/__tests__/SkillTest.sidebar.test.ts`
Expected: FAIL（目前 `.subgroup-label` 沒有 `--system`/`--enterprise`/`--team` 修飾 class）

- [ ] **Step 3: 修改 `SkillTest.vue` 的 subgroup-label 綁定（第 36 行）**

現有：
```html
                <div class="subgroup-label">{{ group.label }}</div>
```
改為：
```html
                <div :class="['subgroup-label', `subgroup-label--${group.key}`]">{{ group.label }}</div>
```

同時把 sidebar-item 加上活潑感 hover（第 37-42 行的 class 綁定不變，但在最外層 `.sidebar-list` 加 `lively-stagger`；第 8 行）：

現有：
```html
        <div class="sidebar-list">
```
改為：
```html
        <div class="sidebar-list lively-stagger">
```

- [ ] **Step 4: 執行測試確認通過**

Run: `npx vitest run src/views/__tests__/SkillTest.sidebar.test.ts`
Expected: PASS

- [ ] **Step 5: 修改 `_SkillTest.scss` 的 `.subgroup-label`，新增分類色條修飾符**

現有（約第 161-168 行）：
```scss
    .subgroup-label {
      padding: 8px 16px 3px;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-faint);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
```
改為：
```scss
    .subgroup-label {
      padding: 8px 16px 3px 13px;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-faint);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-left: 3px solid transparent;
      margin-left: 3px;

      &--system     { border-left-color: var(--primary); }
      &--enterprise { border-left-color: var(--tag-blue-text); }
      &--team       { border-left-color: var(--tag-amber-text); }
    }
```

**注意**：`.version-dd`、`.version-dd-btn`、`.version-dd-menu`、`.version-dd-item`、`.version-current-tag`（約第 78-136 行）維持完全不動——這些是 `SkillVersionPicker.vue` 實際使用的樣式。

- [ ] **Step 6: 編譯驗證**

Run: `npm run build`
Expected: 建置成功

- [ ] **Step 7: 執行完整測試套件**

Run: `npx vitest run`
Expected: 全部通過

- [ ] **Step 8: Commit**

```bash
git add src/views/SkillTest.vue src/scss/views/_SkillTest.scss src/views/__tests__/SkillTest.sidebar.test.ts
git commit -m "feat(skill-test): color-coded sidebar subgroups, liveliness on sidebar list"
```

---

### Task 6：SkillEditor 第 2 步（技能指令）主要/次要分區

**Files:**
- Modify: `src/views/SkillEditor.vue`（Step 1 內容區塊的樣板結構，第 70-121 行）
- Modify: `src/scss/views/_SkillEditor.scss`（新增主要/次要區塊樣式）
- Test: `src/views/__tests__/SkillEditor.step2Layout.test.ts`（新增）

**Interfaces:**
- 無資料邏輯變更，純樣板重排 + 新增 CSS class

- [ ] **Step 1: 寫失敗測試 — 技能指令要在主要區塊容器內，觸發時機與所需檔案要在次要雙欄容器內**

```ts
// src/views/__tests__/SkillEditor.step2Layout.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SkillEditor from '../SkillEditor.vue'

describe('SkillEditor 第 2 步版面', () => {
  it('技能指令在 se-primary-section，觸發時機與所需檔案在 se-secondary-row 的雙欄內', async () => {
    setActivePinia(createPinia())
    const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    const wrapper = mount(SkillEditor, {
      global: { plugins: [router], stubs: { AppBreadcrumb: true } },
    })
    // 填寫技能名稱以解鎖下一步，切到第 2 步
    await wrapper.find('input.custom-input').setValue('測試技能')
    const nextBtn = wrapper.findAll('button').find(b => b.text().includes('下一步'))
    await nextBtn!.trigger('click')

    const primary = wrapper.find('.se-primary-section')
    expect(primary.exists()).toBe(true)
    expect(primary.text()).toContain('技能指令')

    const secondaryRow = wrapper.find('.se-secondary-row')
    expect(secondaryRow.exists()).toBe(true)
    expect(secondaryRow.findAll('.se-secondary-section').length).toBe(2)
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npx vitest run src/views/__tests__/SkillEditor.step2Layout.test.ts`
Expected: FAIL（目前沒有 `se-primary-section`/`se-secondary-row`/`se-secondary-section`）

- [ ] **Step 3: 修改 `SkillEditor.vue` 的 Step 1 內容（第 70-121 行）**

現有：
```html
        <!-- Step 1：技能指令 -->
        <template v-else-if="currentStep === 1">
          <div class="se-section">
            <label class="se-label">技能指令（Instructions）</label>
            <p class="se-hint">
              定義此技能的角色、行為規則與限制。Agent 執行此技能時依照這份指令運作。
              可使用 Markdown，支援條列式規則與範例。
            </p>
            <div class="se-editor-wrap">
              <textarea
                v-model="form.instructions"
                class="custom-input se-textarea-lg se-mono"
                :placeholder="instructionsPlaceholder"
              />
              <div class="se-char-count">{{ form.instructions.length }} 字元</div>
            </div>
          </div>
          <div class="se-section">
            <label class="se-label">觸發時機（選填）</label>
            <p class="se-hint">
              描述 Agent 在什麼情境下應優先選用此技能，幫助路由判斷更準確。
            </p>
            <textarea
              v-model="form.triggerHint"
              class="custom-input se-textarea-sm"
              placeholder="例：當用戶詢問庫存數量、倉庫存量、缺貨狀態等相關問題時使用"
              rows="3"
              maxlength="300"
            />
          </div>
          <div class="se-section">
            <label class="se-label">所需檔案（選填）</label>
            <p class="se-hint">上傳技能執行時需要參考的檔案，例如規則表、範本、FAQ 文件。</p>
            <SkillFileUpload v-model="form.files" />
          </div>
          <div class="se-section">
            <label class="se-label">指派 Agent（選填）</label>
            <p class="se-hint">選擇哪些 Agent 可以調用此技能。未指派時技能仍可建立，之後可再補充。</p>
            <div class="se-agent-grid">
              <button
                v-for="agent in AVAILABLE_AGENTS"
                :key="agent"
                type="button"
                :class="['se-agent-chip', { 'is-selected': form.assignedAgents.includes(agent) }]"
                @click="toggleAgent(agent)"
              >
                <i class="material-symbols-outlined">smart_toy</i>
                {{ agent }}
                <i v-if="form.assignedAgents.includes(agent)" class="material-symbols-outlined se-chip-check">check</i>
              </button>
            </div>
          </div>
        </template>
```

改為：
```html
        <!-- Step 1：技能指令 -->
        <template v-else-if="currentStep === 1">
          <div class="se-primary-section">
            <label class="se-label">技能指令（Instructions）</label>
            <p class="se-hint">
              定義此技能的角色、行為規則與限制。Agent 執行此技能時依照這份指令運作。
              可使用 Markdown，支援條列式規則與範例。
            </p>
            <div class="se-editor-wrap">
              <textarea
                v-model="form.instructions"
                class="custom-input se-textarea-lg se-mono"
                :placeholder="instructionsPlaceholder"
              />
              <div class="se-char-count">{{ form.instructions.length }} 字元</div>
            </div>
          </div>

          <div class="se-secondary-row">
            <div class="se-secondary-section">
              <label class="se-label">觸發時機（選填）</label>
              <p class="se-hint">描述 Agent 在什麼情境下應優先選用此技能，幫助路由判斷更準確。</p>
              <textarea
                v-model="form.triggerHint"
                class="custom-input se-textarea-sm"
                placeholder="例：當用戶詢問庫存數量、倉庫存量、缺貨狀態等相關問題時使用"
                rows="3"
                maxlength="300"
              />
            </div>
            <div class="se-secondary-section">
              <label class="se-label">所需檔案（選填）</label>
              <p class="se-hint">上傳技能執行時需要參考的檔案，例如規則表、範本、FAQ 文件。</p>
              <SkillFileUpload v-model="form.files" />
            </div>
          </div>

          <div class="se-section">
            <label class="se-label">指派 Agent（選填）</label>
            <p class="se-hint">選擇哪些 Agent 可以調用此技能。未指派時技能仍可建立，之後可再補充。</p>
            <div class="se-agent-grid lively-stagger">
              <button
                v-for="agent in AVAILABLE_AGENTS"
                :key="agent"
                type="button"
                :class="['se-agent-chip', 'lively-card', { 'is-selected': form.assignedAgents.includes(agent) }]"
                @click="toggleAgent(agent)"
              >
                <i class="material-symbols-outlined">smart_toy</i>
                {{ agent }}
                <i v-if="form.assignedAgents.includes(agent)" class="material-symbols-outlined se-chip-check">check</i>
              </button>
            </div>
          </div>
        </template>
```

- [ ] **Step 4: 執行測試確認通過**

Run: `npx vitest run src/views/__tests__/SkillEditor.step2Layout.test.ts`
Expected: PASS

- [ ] **Step 5: 修改 `_SkillEditor.scss` — 新增主要/次要區塊樣式**

在 `.se-section { margin-bottom: 22px; }` 規則之後新增：
```scss
  .se-primary-section {
    border: 1.5px solid var(--tag-teal-bg);
    border-radius: 14px;
    padding: 16px 18px;
    margin-bottom: 18px;
    background: var(--surface);
  }

  .se-secondary-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-bottom: 22px;

    @media (max-width: $breakpoint-tablet) { grid-template-columns: 1fr; }
  }

  .se-secondary-section {
    border: 1px solid var(--divider-a50);
    border-radius: 12px;
    padding: 14px 16px;
    background: var(--surface);
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
git add src/views/SkillEditor.vue src/scss/views/_SkillEditor.scss src/views/__tests__/SkillEditor.step2Layout.test.ts
git commit -m "feat(skill-editor): step 2 primary/secondary section layout"
```

---

### Task 7：SkillEditor 第 3 步（確認）分組確認卡

**Files:**
- Modify: `src/views/SkillEditor.vue`（Step 2 / 確認步驟內容，第 124-168 行）
- Modify: `src/scss/views/_SkillEditor.scss`（新增分組確認卡樣式）
- Test: `src/views/__tests__/SkillEditor.step3Layout.test.ts`（新增）

**Interfaces:**
- 無資料邏輯變更，純樣板重排

- [ ] **Step 1: 寫失敗測試 — 確認步驟要有標題與兩張分組卡**

```ts
// src/views/__tests__/SkillEditor.step3Layout.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SkillEditor from '../SkillEditor.vue'

describe('SkillEditor 第 3 步版面', () => {
  it('確認步驟顯示技能名稱標題，並分成「內容摘要」與「設定」兩張卡', async () => {
    setActivePinia(createPinia())
    const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    const wrapper = mount(SkillEditor, {
      global: { plugins: [router], stubs: { AppBreadcrumb: true } },
    })
    await wrapper.find('input.custom-input').setValue('庫存查詢助理')
    const buttons = wrapper.findAll('button')
    await buttons.find(b => b.text().includes('下一步'))!.trigger('click')
    await buttons.find(b => b.text().includes('下一步'))!.trigger('click')

    expect(wrapper.find('.se-confirm-title').text()).toBe('庫存查詢助理')
    const cards = wrapper.findAll('.se-confirm-card2')
    expect(cards.length).toBe(2)
    expect(cards[0].text()).toContain('內容摘要')
    expect(cards[1].text()).toContain('設定')
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npx vitest run src/views/__tests__/SkillEditor.step3Layout.test.ts`
Expected: FAIL（目前沒有 `se-confirm-title`/`se-confirm-card2`）

- [ ] **Step 3: 修改 `SkillEditor.vue` 的確認步驟（第 124-168 行）**

現有：
```html
        <!-- Step 2：確認 -->
        <template v-else>
          <div class="se-confirm-card">
            <div class="se-confirm-row">
              <span class="se-confirm-key">技能名稱</span>
              <span class="se-confirm-val">{{ form.name }}</span>
            </div>
            <div class="se-confirm-row">
              <span class="se-confirm-key">指令</span>
              <span class="se-confirm-val">
                <span v-if="form.instructions">{{ form.instructions.length }} 字元</span>
                <span v-else class="se-empty">（未填寫）</span>
              </span>
            </div>
            <div v-if="form.triggerHint" class="se-confirm-row">
              <span class="se-confirm-key">觸發時機</span>
              <span class="se-confirm-val">{{ form.triggerHint }}</span>
            </div>
            <div class="se-confirm-row">
              <span class="se-confirm-key">指派 Agent</span>
              <span class="se-confirm-val">
                <span v-if="form.assignedAgents.length">{{ form.assignedAgents.join('、') }}</span>
                <span v-else class="se-empty">（未指派）</span>
              </span>
            </div>
            <div class="se-confirm-row">
              <span class="se-confirm-key">所需檔案</span>
              <span class="se-confirm-val">
                <span v-if="form.files.length">{{ form.files.length }} 個檔案</span>
                <span v-else class="se-empty">（未上傳）</span>
              </span>
            </div>
            <div class="se-confirm-row se-confirm-row--toggle">
              <span class="se-confirm-key">{{ isEditMode ? '啟用狀態' : '建立後立即啟用' }}</span>
              <label class="se-toggle">
                <input type="checkbox" v-model="form.isEnabled" />
                <span class="se-toggle-track"></span>
              </label>
            </div>
          </div>

          <p class="se-confirm-note">
            <i class="material-symbols-outlined">info</i>
            {{ isEditMode ? '儲存後變更立即生效。' : '建立後可在技能管理頁隨時編輯或停用此技能。' }}
          </p>
        </template>
```

改為：
```html
        <!-- Step 2：確認 -->
        <template v-else>
          <h3 class="se-confirm-title">{{ form.name }}</h3>

          <div class="se-confirm-grid lively-stagger">
            <div class="se-confirm-card2 lively-card">
              <div class="se-confirm-card2-hd">
                <i class="material-symbols-outlined lively-icon">description</i>內容摘要
              </div>
              <div class="se-confirm-row">
                <span class="se-confirm-key">指令</span>
                <span class="se-confirm-val">
                  <span v-if="form.instructions">{{ form.instructions.length }} 字元</span>
                  <span v-else class="se-empty">（未填寫）</span>
                </span>
              </div>
              <div v-if="form.triggerHint" class="se-confirm-row">
                <span class="se-confirm-key">觸發時機</span>
                <span class="se-confirm-val">{{ form.triggerHint }}</span>
              </div>
              <div class="se-confirm-row">
                <span class="se-confirm-key">所需檔案</span>
                <span class="se-confirm-val">
                  <span v-if="form.files.length">{{ form.files.length }} 個檔案</span>
                  <span v-else class="se-empty">（未上傳）</span>
                </span>
              </div>
            </div>

            <div class="se-confirm-card2 lively-card">
              <div class="se-confirm-card2-hd">
                <i class="material-symbols-outlined lively-icon">tune</i>設定
              </div>
              <div class="se-confirm-row">
                <span class="se-confirm-key">指派 Agent</span>
                <span class="se-confirm-val">
                  <span v-if="form.assignedAgents.length">{{ form.assignedAgents.join('、') }}</span>
                  <span v-else class="se-empty">（未指派）</span>
                </span>
              </div>
              <div class="se-confirm-row se-confirm-row--toggle">
                <span class="se-confirm-key">{{ isEditMode ? '啟用狀態' : '建立後立即啟用' }}</span>
                <label class="se-toggle">
                  <input type="checkbox" v-model="form.isEnabled" />
                  <span class="se-toggle-track"></span>
                </label>
              </div>
            </div>
          </div>

          <p class="se-confirm-note">
            <i class="material-symbols-outlined">info</i>
            {{ isEditMode ? '儲存後變更立即生效。' : '建立後可在技能管理頁隨時編輯或停用此技能。' }}
          </p>
        </template>
```

（原本的 `.se-confirm-card`／`.se-confirm-row`（技能名稱那一列，已被標題取代）不再使用；`.se-confirm-key`/`.se-confirm-val`/`.se-empty`/`.se-confirm-row`/`.se-confirm-row--toggle`/`.se-toggle*` 樣式沿用不變，只是換了外層容器）

- [ ] **Step 4: 執行測試確認通過**

Run: `npx vitest run src/views/__tests__/SkillEditor.step3Layout.test.ts`
Expected: PASS

- [ ] **Step 5: 修改 `_SkillEditor.scss` — 新增標題與分組卡樣式，`.se-confirm-card` 改名保留給舊結構的相容（實際上不再被使用，可以直接砍掉並用新規則取代）**

現有（約第 163-201 行）：
```scss
  // 確認卡片
  .se-confirm-card {
    background: var(--surface);
    border: 1px solid var(--divider-a50);
    border-radius: 12px;
    padding: 4px 0;
    margin-bottom: 16px;
    max-width: 560px;
  }

  .se-confirm-row {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 12px 20px;
    border-bottom: 1px solid var(--divider-a50);

    &:last-child { border-bottom: none; }

    &.se-confirm-row--toggle {
      align-items: center;
    }
  }
```

改為（`.se-confirm-card` 拿掉，因為模板已不再使用它；新增 `.se-confirm-title`/`.se-confirm-grid`/`.se-confirm-card2`/`.se-confirm-card2-hd`；`.se-confirm-row` 的 padding 從 `12px 20px` 改為 `10px 0`，因為現在是在較窄的 `.se-confirm-card2` 內，且不再需要 `border-bottom` 的左右滿版延伸）：
```scss
  // 確認頁：標題 + 分組卡片
  .se-confirm-title {
    font-size: 22px;
    font-weight: 700;
    color: var(--text);
    font-family: $font-family-heading;
    margin: 0 0 16px;
  }

  .se-confirm-grid {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 16px;
    margin-bottom: 16px;

    @media (max-width: $breakpoint-tablet) { grid-template-columns: 1fr; }
  }

  .se-confirm-card2 {
    background: var(--surface);
    border: 1px solid var(--divider-a50);
    border-radius: 14px;
    padding: 16px 18px;
  }

  .se-confirm-card2-hd {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 12px;

    i { font-size: 17px; color: var(--primary); }
  }

  .se-confirm-row {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 8px 0;
    border-bottom: 1px solid var(--divider-a50);

    &:last-child { border-bottom: none; }

    &.se-confirm-row--toggle {
      align-items: center;
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
git add src/views/SkillEditor.vue src/scss/views/_SkillEditor.scss src/views/__tests__/SkillEditor.step3Layout.test.ts
git commit -m "feat(skill-editor): step 3 grouped confirmation cards with title"
```

---

### Task 8：全面驗證與視覺檢查

**Files:** 無新增/修改檔案，純驗證

- [ ] **Step 1: 型別檢查**

Run: `npm run type-check`
Expected: 沒有新增的錯誤（`src/composables/useBreadcrumb.ts` 既有的 3 個錯誤與本計畫無關）

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: 沒有新增的錯誤

- [ ] **Step 3: 完整單元測試**

Run: `npx vitest run`
Expected: 全部通過，包含本計畫新增的 6 個測試檔（Task 3-7）

- [ ] **Step 4: 建置**

Run: `npm run build`
Expected: 成功

- [ ] **Step 5: 啟動 dev server 做視覺檢查**

Run: `npm run dev -- --port 5183`

依序打開以下路徑，分別在 light 與 dark mode 下檢查：
- `/view/Skills`（SkillManagement）：統計列 hover 回饋、審核卡片（若有待審核資料）自然高度、Library 管理區的團隊技能多欄卡片
- `/view/SkillTest`：側欄三個分類的色條
- `/view/SkillEditor`：第 2 步的主要/次要分區、第 3 步的分組確認卡

同時用瀏覽器開發工具切換「模擬 prefers-reduced-motion: reduce」，確認動畫效果確實停用、但 hover 的顏色/陰影回饋還在。

Expected: 沒有任何 light mode 下的意外深色色塊；dark mode 下所有新增區塊顏色正確跟隨主題切換；`prefers-reduced-motion: reduce` 時動畫停用

- [ ] **Step 6: Commit（若 Step 2 lint 有 auto-fix 產生額外變動）**

```bash
git add -A
git commit -m "chore: phase 2 verification pass" --allow-empty
```

---

## Self-Review 摘要（撰寫計畫時已核對）

- **spec 涵蓋度**：spec §2.1（統計列/審核卡片/Library 團隊卡片）→ Task 3/4；§2.2（SkillTest 側欄色條）→ Task 5；§2.3（SkillEditor 第 2/3 步重排）→ Task 6/7；§3（死程式碼清理）→ Task 2（並修正了 `.version-dd*` 其實是活的、從清單移除）；§4（活潑感技術規格）→ Task 1；§7 成功標準 → Task 8 涵蓋
- **一致性**：Task 1 定義的 `.lively-*` class 名稱在 Task 3/4/5/6/7 都是同一套名稱套用，沒有命名分歧
- **範圍邊界**：`AppBreadcrumb`、`skillStore.ts`、`SkillTestChat.vue`、`SkillTestAI.vue`、`SkillVersionPicker.vue` 均未出現在任何 Task 的 Files 清單中（`SkillVersionPicker.vue` 只在 Task 5 的背景說明中被提及「不可修改其依賴的樣式」，未列入實際修改檔案）
- **統計卡不強制 hero**：Task 3 明確只加活潑感 class，不改變 4 張卡片的尺寸配置，符合使用者決定
