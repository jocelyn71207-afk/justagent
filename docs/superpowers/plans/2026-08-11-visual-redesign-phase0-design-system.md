# Phase 0：設計語言與共用元件 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在既有的 Jade Mist 02 CSS 變數系統上擴充設計 token（分類色、透明度階梯、陰影層級、字級/間距階梯），並修正稽核報告中發現的「顏色寫死導致 dark mode 顯示錯誤」的案例，同時把 4 個 icon-only 可點擊元素改成有鍵盤/螢幕閱讀器支援的真正按鈕。

**Architecture:** 純樣式層擴充，不新增任何 Vue 元件、不改變任何 store/API 邏輯。所有新 token 加在既有的 `_theme.scss` / `_themeDark.scss` / `_variables.scss` / `_button.scss` 檔案裡；新的共用樣式類別（卡片、tag badge、icon-btn）加在 `_custom.scss`（既有的「客製化」共用樣式檔，於 `style.scss` 最後被 import，可安全引用所有前面定義的 token）。4 個既有 view 檔案只修正被稽核點名的具體行，不動其餘邏輯。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、SCSS（`@import` 手動註冊於各 `_index.scss`，此為專案既有慣例，非 `@forward`）、Vitest + `@vue/test-utils`、ESLint、vue-tsc。

## Global Constraints

- 企業色 `--primary: #00A078` / `--accent: #00C896` 數值不可變動（本計畫任何一步都不修改這兩個 token 的值）
- 所有新色彩一律走 CSS Custom Properties，不寫死 hex（CLAUDE.md 硬性規定）
- 不使用 `<style scoped>`；樣式一律放在 `src/scss/` 對應目錄
- 新增 SCSS 檔案需在對應的 `_index.scss` 手動加一行 import（本計畫不新增檔案，只改既有檔案，故不觸發此規則）
- 不更換字體家族、不更換 icon 套件（Material Symbols Outlined 維持）
- 不處理任何功能性 bug（假互動、TODO 邏輯、console.log 殘留）——那些不在本次視覺重新設計範圍內
- 不修改 `JourneyDashboard.vue`、`Explore.vue` 本身——本計畫只準備分類色 token，實際套用留給 Phase 2
- **CSS-only 任務的驗證方式**：專案目前沒有任何 Vue 元件的 mount 測試慣例（現有 `*.test.ts` 全部只測 stores/utils），純樣式改動不新增 Vitest 測試，改以 `npm run build`（驗證 SCSS 可編譯）+ 目標字串的 grep 檢查（確認舊的寫死值已消失）作為驗證步驟。涉及 Vue 模板屬性變更（icon-button 可及性修正）的任務會用 `@vue/test-utils` 寫真正的元件測試。

---

### Task 1: 色彩 Token 擴充（light，`_theme.scss`）

**Files:**
- Modify: `src/scss/base/_theme.scss:83-84`（在既有 `:root` 區塊結尾、`}` 之前插入新區段）

**Interfaces:**
- Produces：`--primary-a08` `--primary-a12` `--primary-a20` `--primary-a40`、`--tag-violet-bg` `--tag-violet-text`、`--tag-blue-bg` `--tag-blue-text`、`--tag-amber-bg` `--tag-amber-text`、`--tag-teal-bg` `--tag-teal-text`、`--danger-soft`、`--shadow-sm` `--shadow-md` `--shadow-lg` — 後續 Task 2, 4, 5, 6, 7, 8, 9, 10 都會用到這些變數名稱

- [ ] **Step 1: 在 `_theme.scss` 的 `:root` 區塊內、`--color-switch-active-bg` 那行之後、結尾 `}` 之前，插入新 token**

```scss
  // ── Phase 0：分類色（violet/blue/amber/teal 四組，供狀態/分類 badge 使用）──────
  // 註：--primary 在 light/dark 皆為 #00A078，故 alpha 階梯與陰影不需要在
  // _themeDark.scss 重複宣告，會透過 CSS 繼承自動套用到深色模式。
  --primary-a08:            rgba(0,160,120,0.08);
  --primary-a12:            rgba(0,160,120,0.12);
  --primary-a20:            rgba(0,160,120,0.20);
  --primary-a40:            rgba(0,160,120,0.40);

  --tag-violet-bg:          #EEEDFE;
  --tag-violet-text:        #534AB7;
  --tag-blue-bg:            #E3EFFC;
  --tag-blue-text:          #1255B0;
  --tag-amber-bg:           #FBF1E0;
  --tag-amber-text:         #8A5A00;
  --tag-teal-bg:            #CFEFE2;
  --tag-teal-text:          #00614A;

  --danger-soft:            #FBEAE7;

  // ── Phase 0：陰影層級（沿用既有 --shadow RGB 基底，light/dark 各自套用）──────
  --shadow-sm:              0 1px 2px rgba(var(--shadow), 0.06);
  --shadow-md:              0 8px 24px -8px rgba(var(--shadow), 0.18);
  --shadow-lg:              0 24px 64px -16px rgba(var(--shadow), 0.28);
```

- [ ] **Step 2: 編譯驗證**

Run: `npm run build`
Expected: 建置成功、無 SCSS 編譯錯誤

- [ ] **Step 3: Commit**

```bash
git add src/scss/base/_theme.scss
git commit -m "feat(theme): add phase 0 color tokens (alpha ladder, tag colors, shadows)"
```

---

### Task 2: 色彩 Token 擴充（dark，`_themeDark.scss`）

**Files:**
- Modify: `src/scss/base/_themeDark.scss:81-83`（`[data-theme="dark"]` 區塊）
- Modify: `src/scss/base/_themeDark.scss:158-161`（`@media (prefers-color-scheme: dark)` 區塊——**兩處都要改，數值必須一致**，這是檔案開頭註解明訂的規則）

**Interfaces:**
- Consumes：Task 1 定義的 token 名稱（`--tag-violet-bg` 等）
- Produces：上述 token 的 dark 版本值

- [ ] **Step 1: 在 `_themeDark.scss` 第一個區塊（`[data-theme="dark"]:root:not(...)`）的 `--color-switch-active-bg` 那行之後、結尾 `}` 之前插入**

```scss
    // ── Phase 0：分類色（dark）──────────────────────────────────────────────
    --tag-violet-bg:          #241F45;
    --tag-violet-text:        #B7B0F5;
    --tag-blue-bg:            #12283F;
    --tag-blue-text:          #7EB3ED;
    --tag-amber-bg:           #3A2A10;
    --tag-amber-text:         #F0C878;
    --tag-teal-bg:            #0E3E32;
    --tag-teal-text:          #6EE7C4;

    --danger-soft:            #3A1E1A;
```

- [ ] **Step 2: 在第二個區塊（`@media (prefers-color-scheme: dark) { :root:not(...) { ... } }`）貼上完全相同的內容**（同一段文字，貼在該區塊的 `--color-switch-active-bg` 那行之後、結尾 `}` 之前）

- [ ] **Step 3: 編譯驗證**

Run: `npm run build`
Expected: 建置成功

- [ ] **Step 4: 手動驗證兩區塊數值一致**

Run: `grep -A9 "tag-violet-bg" src/scss/base/_themeDark.scss`
Expected: 輸出兩組數值完全相同（各自對應兩個區塊）

- [ ] **Step 5: Commit**

```bash
git add src/scss/base/_themeDark.scss
git commit -m "feat(theme): add phase 0 dark-mode tag color values"
```

---

### Task 3: 字級與間距階梯（`_variables.scss`）

**Files:**
- Modify: `src/scss/base/_variables.scss:111-118`（Typography 區段結尾）

**Interfaces:**
- Produces：`$font-caption` `$font-label` `$font-h-sm` `$font-h-md` `$font-h-lg`、`$spacing` SCSS map

- [ ] **Step 1: 在 Typography 區段（`$font-family-mono` 之後、`$line-height-base` 之後）插入字級階梯**

現有內容：
```scss
$font-family: 'Noto Sans TC', system-ui, sans-serif;
$font-family-heading: 'Public Sans', sans-serif;
$font-family-mono: 'JetBrains Mono', monospace;
$font-size-base: 16px;
$font-form-size: 14px;
$line-height-base: 1.5;
```

改為：
```scss
$font-family: 'Noto Sans TC', system-ui, sans-serif;
$font-family-heading: 'Public Sans', sans-serif;
$font-family-mono: 'JetBrains Mono', monospace;
$font-size-base: 16px;
$font-form-size: 14px;
$line-height-base: 1.5;

// ── Phase 0：字級階梯（新增，$font-size-base/$font-form-size 維持原意不變）──
$font-caption: 12px;  // 時間戳、次要說明
$font-label:   13px;  // badge、tag、表單 label
$font-h-sm:    18px;  // 卡片標題
$font-h-md:    22px;  // 區塊標題
$font-h-lg:    28px;  // 頁面主標題

// ── Phase 0：間距階梯 ──────────────────────────────────────────────────
$spacing: (
  1: 4px,
  2: 8px,
  3: 12px,
  4: 16px,
  5: 20px,
  6: 24px,
  8: 32px,
  10: 40px,
  12: 48px,
);
```

- [ ] **Step 2: 編譯驗證**

Run: `npm run build`
Expected: 建置成功

- [ ] **Step 3: Commit**

```bash
git add src/scss/base/_variables.scss
git commit -m "feat(variables): add phase 0 typography scale and spacing map"
```

---

### Task 4: 按鈕互動三態 + 共用 icon-btn 樣式（`_button.scss`）

**Files:**
- Modify: `src/scss/base/_button.scss:1-47`（`button.custom-btn` 區塊，新增 focus-visible/active 狀態）
- Modify: `src/scss/base/_button.scss`（檔案結尾新增 `.icon-btn` 共用類別）

**Interfaces:**
- Produces：`.icon-btn` CSS class — 供 Task 6、7、8、9 的 icon-only 按鈕使用；規格為：`display:inline-flex; align-items:center; justify-content:center; border:none; background:transparent; cursor:pointer; border-radius:6px; padding:4px; color:var(--text-faint); transition: background-color .18s ease, color .18s ease, transform .18s ease;` 加 `:hover{background:var(--sidebar-hover); color:var(--text);}`、`:active{transform:scale(0.92);}`、`:focus-visible{outline:2px solid var(--primary); outline-offset:1px;}`

- [ ] **Step 1: 在 `button.custom-btn` 的 `&:active, &:focus` 區塊補上 `transform` 與獨立的 `:focus-visible` 規則**

現有（第 23-30 行）：
```scss
  &:active,
  &:focus {
    border-color: $color_main_2;
    color: $color_main_2;
    background-color: var(--page-bg);
    outline: none;
    box-shadow: none;
  }
```

改為：
```scss
  &:active {
    border-color: $color_main_2;
    color: $color_main_2;
    background-color: var(--page-bg);
    transform: scale(0.98);
  }
  &:focus {
    outline: none;
  }
  &:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 1px;
  }
```

（`transition` 屬性 `button.custom-btn` 目前完全沒有定義；在同一個 selector 內，`cursor: pointer;` 那行之後加一行 `transition: border-color 0.2s ease, color 0.2s ease, background-color 0.2s ease, transform 0.15s ease;`）

- [ ] **Step 2: 在檔案結尾新增共用 `.icon-btn` 類別**

```scss
// ── Phase 0：共用 icon-only 按鈕（取代 <i>/<div> 加 @click 的模式）──────────
// 使用方式：<button type="button" class="icon-btn" aria-label="說明文字"><i class="material-symbols-outlined">icon_name</i></button>
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  padding: 4px;
  color: var(--text-faint);
  transition: background-color 0.18s ease, color 0.18s ease, transform 0.18s ease;

  > i,
  > .material-symbols-outlined {
    font-size: inherit;
  }

  &:hover {
    background-color: var(--sidebar-hover);
    color: var(--text);
  }
  &:active {
    transform: scale(0.92);
  }
  &:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 1px;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    &:hover { background-color: transparent; color: var(--text-faint); }
  }
}
```

- [ ] **Step 3: 編譯驗證**

Run: `npm run build`
Expected: 建置成功

- [ ] **Step 4: Commit**

```bash
git add src/scss/base/_button.scss
git commit -m "feat(button): add focus-visible state and shared .icon-btn class"
```

---

### Task 5: 卡片標準樣式 + 分類 Badge（`_custom.scss`）

**Files:**
- Modify: `src/scss/_custom.scss`（檔案結尾新增，該檔為既有「客製化」共用樣式檔，於 `style.scss:18` 最後被 import）

**Interfaces:**
- Consumes：Task 1/2 的 `--tag-*` token
- Produces：`.entity-card`（含 `.entity-card--violet/--blue/--amber/--teal` 修飾）、`.tag-badge`（含相同四個修飾）供 Phase 1+ 套用到各 view 時使用；本任務只建立樣式，不套用到任何模板（套用是 Phase 1+ 各自 view 的工作）

- [ ] **Step 1: 在 `_custom.scss` 結尾（`.required-mark` 之後）新增**

```scss
// ── Phase 0：標準卡片樣式（細邊框 + 左側色條標示狀態/分類）──────────────────
// 取代泛用的 border+shadow+白底卡片；預設不用陰影，陰影只留給 popover/modal。
.entity-card {
  position: relative;
  border: 1px solid var(--divider);
  border-radius: $radius-lg;
  background: var(--surface);
  padding: 12px 14px 12px 17px;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 12px;
    bottom: 12px;
    width: 3px;
    border-radius: 2px;
    background: var(--divider);
  }

  &--violet::before { background: $color-explore-accent-mid; }
  &--blue::before   { background: var(--tag-blue-text); }
  &--amber::before  { background: var(--warning); }
  &--teal::before   { background: var(--primary); }
}

// ── Phase 0：分類 Badge（接到分類色 token，取代各頁各自寫死的 badge 顏色）───
.tag-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: $font-label;
  font-weight: 600;
  padding: 2px 9px;
  border-radius: 9999px;
  white-space: nowrap;

  &--violet { background: var(--tag-violet-bg); color: var(--tag-violet-text); }
  &--blue   { background: var(--tag-blue-bg);   color: var(--tag-blue-text); }
  &--amber  { background: var(--tag-amber-bg);  color: var(--tag-amber-text); }
  &--teal   { background: var(--tag-teal-bg);   color: var(--tag-teal-text); }
}
```

- [ ] **Step 2: 編譯驗證**

Run: `npm run build`
Expected: 建置成功

- [ ] **Step 3: Commit**

```bash
git add src/scss/_custom.scss
git commit -m "feat(custom): add entity-card and tag-badge shared patterns"
```

---

### Task 6: 修正 TeamAccessManagement — 顏色 token 化 + 排序/操作按鈕可及性

**Files:**
- Modify: `src/scss/views/_TeamAccessManagement.scss:96, 108, 119, 134, 193-195, 213`
- Modify: `src/views/TeamAccessManagement.vue:39-42, 65-66`
- Test: `src/views/__tests__/TeamAccessManagement.a11y.test.ts`（新增）

**Interfaces:**
- Consumes：`.icon-btn`（Task 4）、`--tag-blue-bg/-text`（Task 1/2）、`--divider`（既有）

- [ ] **Step 1: 寫失敗測試 — 排序與操作按鈕必須是可聚焦的 `<button>` 且有 `aria-label`**

```ts
// src/views/__tests__/TeamAccessManagement.a11y.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TeamAccessManagement from '../TeamAccessManagement.vue'

describe('TeamAccessManagement 可及性', () => {
  it('排序與操作按鈕使用真正的 <button>，且 icon-only 按鈕有 aria-label', () => {
    setActivePinia(createPinia())
    const wrapper = mount(TeamAccessManagement, {
      global: { stubs: { AppBreadcrumb: true, compPagination: true, TeamAccountSettingModal: true } },
    })

    const sortBtn = wrapper.find('.sort-btn')
    expect(sortBtn.element.tagName).toBe('BUTTON')
    expect(sortBtn.attributes('aria-label')).toBeTruthy()

    const actionBtns = wrapper.findAll('.action-btn')
    expect(actionBtns.length).toBeGreaterThan(0)
    actionBtns.forEach((btn) => {
      expect(btn.element.tagName).toBe('BUTTON')
      expect(btn.attributes('aria-label')).toBeTruthy()
    })
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npx vitest run src/views/__tests__/TeamAccessManagement.a11y.test.ts`
Expected: FAIL（目前是 `<span>`/`<i>`，不是 `<button>`，也沒有 `aria-label`）

- [ ] **Step 3: 修改 `TeamAccessManagement.vue` 模板**

現有（第 38-43 行）：
```html
              <th width="130">
                <span class="sort-btn" @click="toggleSort">
                  職位
                  <i class="material-symbols-outlined">arrow_downward</i>
                </span>
              </th>
```

改為：
```html
              <th width="130">
                <button type="button" class="sort-btn" aria-label="依職位排序" @click="toggleSort">
                  職位
                  <i class="material-symbols-outlined">arrow_downward</i>
                </button>
              </th>
```

現有（第 64-67 行）：
```html
                <template v-if="member.role !== '企業擁有者' && member.role !== '平台管理者'">
                  <i class="material-symbols-outlined action-btn" @click="deleteMember(member)">delete</i>
                  <i class="material-symbols-outlined action-btn" @click="editMember(member)">edit</i>
                </template>
```

改為：
```html
                <template v-if="member.role !== '企業擁有者' && member.role !== '平台管理者'">
                  <button type="button" class="icon-btn action-btn" aria-label="刪除成員" @click="deleteMember(member)"><i class="material-symbols-outlined">delete</i></button>
                  <button type="button" class="icon-btn action-btn" aria-label="編輯成員" @click="editMember(member)"><i class="material-symbols-outlined">edit</i></button>
                </template>
```

- [ ] **Step 4: 執行測試確認通過**

Run: `npx vitest run src/views/__tests__/TeamAccessManagement.a11y.test.ts`
Expected: PASS

- [ ] **Step 5: 修正 `_TeamAccessManagement.scss` 的寫死顏色**

`.sort-btn` 是新的 `<button>`，需要移除瀏覽器預設按鈕樣式，在 `_TeamAccessManagement.scss` 的 `.new-table-box` 區塊後面新增：
```scss
  .sort-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: none;
    background: transparent;
    padding: 0;
    font: inherit;
    color: inherit;
    cursor: pointer;
    &:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
      border-radius: 4px;
    }
  }
```

`role-admin`（第 193-195 行）現有：
```scss
  .role-admin {
    background-color: rgba(24, 119, 242, 0.12);
    color: #1255b0;
    &.stat-dot { background-color: #1877f2; }
  }
```
改為：
```scss
  .role-admin {
    background-color: var(--tag-blue-bg);
    color: var(--tag-blue-text);
    &.stat-dot { background-color: var(--tag-blue-text); }
  }
```

第 96、108、119、134、213 行的 `border: 1px solid rgba(14, 15, 12, 0.10);`（或 `0.12`）全部改為 `border: 1px solid var(--divider);`

- [ ] **Step 6: 編譯與測試驗證**

Run: `npm run build && npx vitest run src/views/__tests__/TeamAccessManagement.a11y.test.ts`
Expected: 建置成功、測試 PASS

- [ ] **Step 7: grep 確認寫死顏色已清除**

Run: `grep -n "rgba(14, 15, 12\|rgba(24, 119, 242\|#1255b0\|#1877f2" src/scss/views/_TeamAccessManagement.scss`
Expected: 無輸出（找不到任何一項）

- [ ] **Step 8: Commit**

```bash
git add src/views/TeamAccessManagement.vue src/scss/views/_TeamAccessManagement.scss src/views/__tests__/TeamAccessManagement.a11y.test.ts
git commit -m "fix(team-access): token-ize hardcoded colors, make sort/action controls real buttons"
```

---

### Task 7: 修正 ProjectTrashCans — 到期徽章/警示橫幅 token 化 + 更多選項按鈕可及性

**Files:**
- Modify: `src/scss/views/_ProjectTrashCans.scss:53-55, 74`
- Modify: `src/views/ProjectTrashCans.vue:46`
- Test: `src/views/__tests__/ProjectTrashCans.a11y.test.ts`（新增）

**Interfaces:**
- Consumes：`.icon-btn`（Task 4）、`--danger`/`--warning`（既有，_theme.scss 已定義）

- [ ] **Step 1: 寫失敗測試**

```ts
// src/views/__tests__/ProjectTrashCans.a11y.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ProjectTrashCans from '../ProjectTrashCans.vue'

describe('ProjectTrashCans 可及性', () => {
  it('「更多選項」觸發元素是可聚焦的 <button> 且有 aria-label', () => {
    setActivePinia(createPinia())
    const wrapper = mount(ProjectTrashCans, {
      global: { stubs: { AppBreadcrumb: true, compDropDown: true } },
    })
    const moreBtn = wrapper.find('.more-btn')
    expect(moreBtn.element.tagName).toBe('BUTTON')
    expect(moreBtn.attributes('aria-label')).toBeTruthy()
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npx vitest run src/views/__tests__/ProjectTrashCans.a11y.test.ts`
Expected: FAIL（目前是 `<i>`，沒有 `aria-label`）

- [ ] **Step 3: 修改 `ProjectTrashCans.vue` 第 46 行**

現有：
```html
            <i class="material-symbols-outlined more-btn" @click="item.showMoreOption = true">more_horiz</i>
```

改為：
```html
            <button type="button" class="icon-btn more-btn" aria-label="更多選項" @click="item.showMoreOption = true"><i class="material-symbols-outlined">more_horiz</i></button>
```

- [ ] **Step 4: 執行測試確認通過**

Run: `npx vitest run src/views/__tests__/ProjectTrashCans.a11y.test.ts`
Expected: PASS

- [ ] **Step 5: 修正 `_ProjectTrashCans.scss` 的到期徽章與警示橫幅（第 53-55、74 行）**

現有（第 53-55 行）：
```scss
        &--urgent  { background: $color-danger; }
        &--warning { background: $color-warning-amber; color: $color-warning-text-dark; }
        &--normal  { background: rgba($black, 0.38); }
```
改為（`--normal` 是疊在圖片縮圖上的半透明黑色遮罩，非主題化 UI 表面，維持不變）：
```scss
        &--urgent  { background: var(--danger); }
        &--warning { background: var(--warning); color: $color-warning-text-dark; }
        &--normal  { background: rgba($black, 0.38); }
```

現有（第 74 行起 `.trash-info-banner`）：
```scss
    background: $color-warning-bg;
    border: 1px solid $color-warning-border;
    color: $color-warning-text;
```
改為：
```scss
    background: var(--warning-soft, #FBF1E0);
    border: 1px solid var(--warning);
    color: $color-warning-text;
```

> 註：`--warning-soft` 尚未在 Task 1 定義，這裡用 CSS `var(--x, fallback)` 語法直接給 fallback 值，避免新增第三個 token 檔案改動；`$color-warning-text` 是固定深棕色文字、在兩個主題的 amber 底色上都有足夠對比，維持 SCSS 常數不變。

- [ ] **Step 6: 編譯與測試驗證**

Run: `npm run build && npx vitest run src/views/__tests__/ProjectTrashCans.a11y.test.ts`
Expected: 建置成功、測試 PASS

- [ ] **Step 7: grep 確認**

Run: `grep -n "color-danger\|color-warning-amber\|color-warning-bg\|color-warning-border" src/scss/views/_ProjectTrashCans.scss`
Expected: 無輸出

- [ ] **Step 8: Commit**

```bash
git add src/views/ProjectTrashCans.vue src/scss/views/_ProjectTrashCans.scss src/views/__tests__/ProjectTrashCans.a11y.test.ts
git commit -m "fix(project-trash): token-ize expiry badge colors, make more-options button accessible"
```

---

### Task 8: 修正 ResourceLibrary — Badge 邊框 token 化 + 兩處更多選項按鈕可及性

**Files:**
- Modify: `src/scss/views/_ResourceLibrary.scss:45, 64`
- Modify: `src/views/ResourceLibrary.vue:76, 143`
- Test: `src/views/__tests__/ResourceLibrary.a11y.test.ts`（新增）

**Interfaces:**
- Consumes：`.icon-btn`（Task 4）、`--primary-a12`（Task 1）

- [ ] **Step 1: 寫失敗測試**

```ts
// src/views/__tests__/ResourceLibrary.a11y.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ResourceLibrary from '../ResourceLibrary.vue'

describe('ResourceLibrary 可及性', () => {
  it('卡片檢視與列表檢視的「更多選項」都是可聚焦的 <button> 且有 aria-label', () => {
    setActivePinia(createPinia())
    const wrapper = mount(ResourceLibrary, {
      global: { stubs: { AppBreadcrumb: true, compListCardSwitch: true, compTabs: true, compDropDown: true, AppSkeleton: true, AppErrorState: true, compPagination: true } },
    })
    const moreBtns = wrapper.findAll('.more-btn')
    expect(moreBtns.length).toBeGreaterThan(0)
    moreBtns.forEach((btn) => {
      expect(btn.element.tagName).toBe('BUTTON')
      expect(btn.attributes('aria-label')).toBeTruthy()
    })
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npx vitest run src/views/__tests__/ResourceLibrary.a11y.test.ts`
Expected: FAIL

- [ ] **Step 3: 修改 `ResourceLibrary.vue` 第 76 行（卡片檢視）**

現有：
```html
                <i class="material-symbols-outlined more-btn" @click="item.showMoreOption = !item.showMoreOption">more_horiz</i>
```
改為：
```html
                <button type="button" class="icon-btn more-btn" aria-label="更多選項" @click="item.showMoreOption = !item.showMoreOption"><i class="material-symbols-outlined">more_horiz</i></button>
```

第 143 行（列表檢視）現有：
```html
                    <i class="material-symbols-outlined material-fill more-btn" @click.stop="item.showMoreOption = true">more_horiz</i>
```
改為：
```html
                    <button type="button" class="icon-btn more-btn material-fill" aria-label="更多選項" @click.stop="item.showMoreOption = true"><i class="material-symbols-outlined">more_horiz</i></button>
```

- [ ] **Step 4: 執行測試確認通過**

Run: `npx vitest run src/views/__tests__/ResourceLibrary.a11y.test.ts`
Expected: PASS

- [ ] **Step 5: 修正 `_ResourceLibrary.scss` 第 45、64 行**

現有（第 45 行，`.knowledge-badge`）：
```scss
    background: rgba(0, 160, 120, 0.12);
```
改為：
```scss
    background: var(--primary-a12);
```

現有（第 64 行，`.badge--raw`）：
```scss
      border: 1px solid rgba(14, 15, 12, 0.10);
```
改為：
```scss
      border: 1px solid var(--divider);
```

- [ ] **Step 6: 編譯與測試驗證**

Run: `npm run build && npx vitest run src/views/__tests__/ResourceLibrary.a11y.test.ts`
Expected: 建置成功、測試 PASS

- [ ] **Step 7: grep 確認**

Run: `grep -n "rgba(0, 160, 120\|rgba(14, 15, 12" src/scss/views/_ResourceLibrary.scss`
Expected: 無輸出

- [ ] **Step 8: Commit**

```bash
git add src/views/ResourceLibrary.vue src/scss/views/_ResourceLibrary.scss src/views/__tests__/ResourceLibrary.a11y.test.ts
git commit -m "fix(resource-library): token-ize badge colors, make more-options buttons accessible"
```

---

### Task 9: 修正 SkillEditor — SCSS 常數 token 化 + 步驟指示器可及性

**Files:**
- Modify: `src/scss/views/_SkillEditor.scss:57-64, 73-74, 112, 228, 254, 322-331`
- Modify: `src/views/SkillEditor.vue:18-30`
- Test: `src/views/__tests__/SkillEditor.a11y.test.ts`（新增）

**Interfaces:**
- Consumes：既有 `--primary` `--primary-hover` `--accent` `--accent-soft` `--primary-fg` `--danger`（均已在 `_theme.scss`/`_themeDark.scss` 定義，無需新增）

- [ ] **Step 1: 寫失敗測試 — 步驟指示器必須可用鍵盤操作**

```ts
// src/views/__tests__/SkillEditor.a11y.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SkillEditor from '../SkillEditor.vue'

describe('SkillEditor 步驟指示器可及性', () => {
  it('每個步驟項目都是可聚焦的 <button>', async () => {
    setActivePinia(createPinia())
    const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    const wrapper = mount(SkillEditor, {
      global: { plugins: [router], stubs: { AppBreadcrumb: true } },
    })
    const steps = wrapper.findAll('.se-step')
    expect(steps.length).toBeGreaterThan(0)
    steps.forEach((step) => {
      expect(step.element.tagName).toBe('BUTTON')
    })
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npx vitest run src/views/__tests__/SkillEditor.a11y.test.ts`
Expected: FAIL（目前 `.se-step` 是 `<div>`）

- [ ] **Step 3: 修改 `SkillEditor.vue` 第 18-30 行**

現有：
```html
      <div class="se-stepper">
        <div
          v-for="(label, i) in STEPS"
          :key="i"
          :class="['se-step', { 'is-active': currentStep === i, 'is-done': currentStep > i }]"
          @click="currentStep > i ? (currentStep = i) : undefined"
        >
          <div class="se-step-bubble">
            <i v-if="currentStep > i" class="material-symbols-outlined">check</i>
            <span v-else>{{ i + 1 }}</span>
          </div>
          <span class="se-step-label">{{ label }}</span>
        </div>
        <div class="se-step-track">
          <div class="se-step-fill" :style="{ width: fillWidth }" />
        </div>
      </div>
```

改為：
```html
      <div class="se-stepper">
        <button
          type="button"
          v-for="(label, i) in STEPS"
          :key="i"
          :class="['se-step', { 'is-active': currentStep === i, 'is-done': currentStep > i }]"
          :disabled="currentStep <= i"
          :aria-current="currentStep === i ? 'step' : undefined"
          @click="currentStep > i ? (currentStep = i) : undefined"
        >
          <span class="se-step-bubble">
            <i v-if="currentStep > i" class="material-symbols-outlined">check</i>
            <span v-else>{{ i + 1 }}</span>
          </span>
          <span class="se-step-label">{{ label }}</span>
        </button>
        <div class="se-step-track">
          <div class="se-step-fill" :style="{ width: fillWidth }" />
        </div>
      </div>
```

（`.se-step` 從 `<div>` 換成 `<button>` 後需要在 scss 重置瀏覽器預設按鈕樣式；`:disabled` 用來讓「還沒走到的步驟」原生不可點擊，取代原本 `undefined` handler 的靜默無效果）

- [ ] **Step 4: 執行測試確認通過**

Run: `npx vitest run src/views/__tests__/SkillEditor.a11y.test.ts`
Expected: PASS

- [ ] **Step 5: 修正 `_SkillEditor.scss` — 重置按鈕預設樣式 + token 化寫死顏色**

在 `.se-step` 既有規則的最前面（selector 開頭）新增按鈕重置：
```scss
  .se-step {
    // Phase 0：從 <div> 改為 <button>，重置原生按鈕樣式
    border: none;
    background: transparent;
    font: inherit;
    text-align: inherit;
    padding: 0;
    &:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
      border-radius: 6px;
    }
    &:disabled { cursor: default; }
    // ...既有規則維持...
  }
```

第 57-64 行（`.is-active &` / `.is-done &`，`.se-step-bubble` 內）：
```scss
    .is-active & {
      border-color: $color_main_1;
      background: $color_main_1;
      color: #fff;
    }
    .is-done & {
      border-color: $color_main_1;
      background: $color_main_5;
      color: $color_main_1;
    }
```
改為：
```scss
    .is-active & {
      border-color: var(--primary);
      background: var(--primary);
      color: var(--primary-fg);
    }
    .is-done & {
      border-color: var(--primary);
      background: var(--accent-soft);
      color: var(--primary);
    }
```

第 73-74 行（`.se-step-label`）：
```scss
    .is-active & { color: $color_main_1; font-weight: 600; }
    .is-done  & { color: $color_main_2; }
```
改為：
```scss
    .is-active & { color: var(--primary); font-weight: 600; }
    .is-done  & { color: var(--primary-hover); }
```

第 112 行：
```scss
  .se-required { color: #dc2626; margin-left: 2px; }
```
改為：
```scss
  .se-required { color: var(--danger); margin-left: 2px; }
```

第 228 行（toggle 開關圓點）：
```scss
        background: #fff;
```
改為：
```scss
        background: var(--primary-fg);
```
（同一區塊內 `input:checked + .se-toggle-track { background: $color_main_1; ... }` 改為 `background: var(--primary);`）

第 254 行（`.se-ai-badge`）：
```scss
    color: $color_main_2;
    background: $color_main_4;
    border: 1px solid $color_main_3;
```
改為：
```scss
    color: var(--primary-hover);
    background: var(--accent-soft);
    border: 1px solid var(--accent);
```

第 322-331 行（`.se-chip` hover / `.is-selected`）：
```scss
    &:hover {
      border-color: $color_main_1;
      color: $color_main_2;
    }

    &.is-selected {
      background: $color_main_4;
      border-color: $color_main_3;
      color: $color_main_2;
      font-weight: 500;

      .se-chip-check { color: $color_main_1; }
    }
```
改為：
```scss
    &:hover {
      border-color: var(--primary);
      color: var(--primary-hover);
    }

    &.is-selected {
      background: var(--accent-soft);
      border-color: var(--accent);
      color: var(--primary-hover);
      font-weight: 500;

      .se-chip-check { color: var(--primary); }
    }
```

- [ ] **Step 6: 編譯與測試驗證**

Run: `npm run build && npx vitest run src/views/__tests__/SkillEditor.a11y.test.ts`
Expected: 建置成功、測試 PASS

- [ ] **Step 7: grep 確認 SkillEditor 範圍內的寫死顏色已清除**

Run: `grep -n "\$color_main_\|#dc2626\|background: #fff" src/scss/views/_SkillEditor.scss`
Expected: 無輸出

- [ ] **Step 8: Commit**

```bash
git add src/views/SkillEditor.vue src/scss/views/_SkillEditor.scss src/views/__tests__/SkillEditor.a11y.test.ts
git commit -m "fix(skill-editor): token-ize hardcoded colors, make stepper keyboard accessible"
```

---

### Task 10: 清理 KnowledgeBase 幽靈 M3 變數

**Files:**
- Modify: `src/scss/views/_KnowledgeBase.scss:2366-2594`

**Interfaces:**
- Consumes：既有 `--text-faint` `--danger` `--divider` `--text` `--surface` `--primary` `--primary-hover` `--accent-soft` `--text-muted`（均已存在，無需新增 token）

- [ ] **Step 1: 逐一替換幽靈變數與寫死 hex（同一個檔案內的字串替換，用 sed 一次處理，處理完人工檢查 diff）**

Run:
```bash
cd src/scss/views
sed -i '' \
  -e 's/var(--color-on-surface-variant, #43483E)/var(--text-faint)/g' \
  -e 's/var(--color-error, #BA1A1A)/var(--danger)/g' \
  -e 's/var(--color-outline, #C3C8BB)/var(--divider)/g' \
  -e 's/var(--color-on-surface, #1A1C18)/var(--text)/g' \
  -e 's/var(--color-surface, #FAFAFA)/var(--surface)/g' \
  -e 's/var(--color-surface-container, #F3F3F0)/var(--page-bg)/g' \
  -e 's/var(--color-primary-container, #E8FAA0)/var(--accent-soft)/g' \
  -e 's/var(--color-primary, #C8F135)/var(--primary)/g' \
  _KnowledgeBase.scss
```

- [ ] **Step 2: 逐一替換剩餘的裸 hex（`badge--success`、`step--failed`、`stat-icon--kpi`、`kpi-progress-bar` 等區塊）**

`.conversion-status-badge.badge--success`（原第 2398-2401 行附近）：
```scss
  &.badge--success {
    background: #E8FAA0;
    color: #2A3500;
  }
```
改為：
```scss
  &.badge--success {
    background: var(--accent-soft);
    color: var(--primary-hover);
  }
```

`.conversion-status-badge.badge--failed` 與 `.step--failed .step-header`：
```scss
  &.badge--failed {
    background: #FFE4E4;
    color: var(--danger);
  }
```
```scss
  &.step--failed .step-header { background: #FFE4E4; }
```
兩處 `#FFE4E4` 都改為 `var(--danger-soft)`。

`.step-error-msg` 與 `.error-log-pre`：
```scss
  background: #FFF5F5;
  border: 1px solid #FFD0D0;
```
兩處都改為：
```scss
  background: var(--danger-soft);
  border: 1px solid var(--danger);
```

`.stat-card--kpi`：
```scss
  background: #F0FFD4;
  ...
  box-shadow: 0 2px 12px rgba(200, 241, 53, 0.15);
```
改為：
```scss
  background: var(--accent-soft);
  ...
  box-shadow: 0 2px 12px var(--primary-a20);
```

`.kpi-badge`：`color: #2A3500;` → `color: var(--primary-hover);`

`.stat-icon--kpi`：
```scss
  background: #E8FAA0;
  color: #5B6342;
```
改為：
```scss
  background: var(--accent-soft);
  color: var(--text-muted);
```

`.stat-number--kpi { color: #2A3500; }` → `color: var(--primary-hover);`
`.kpi-target { color: #5B6342; }` → `color: var(--text-muted);`
`.kpi-progress-bar { background: #D0D9C0; }` → `background: var(--divider);`

`.pipeline-review-banner`：
```scss
  background: #E8FAA0;
  border: 1px solid var(--color-primary, #C8F135);   // Step 1 已把這行變成 var(--primary)
  ...
  color: #2A3500;
```
改為：
```scss
  background: var(--accent-soft);
  border: 1px solid var(--primary);
  ...
  color: var(--primary-hover);
```

- [ ] **Step 3: 編譯驗證**

Run: `npm run build`
Expected: 建置成功

- [ ] **Step 4: grep 確認幽靈變數與裸 hex 已清除**

Run: `grep -n "color-on-surface\|color-error\|color-outline\|color-surface\|color-primary,\|#E8FAA0\|#2A3500\|#FFE4E4\|#FFF5F5\|#FFD0D0\|#F0FFD4\|#C8F135\|#5B6342\|#D0D9C0\|rgba(200, 241, 53" src/scss/views/_KnowledgeBase.scss`
Expected: 無輸出

- [ ] **Step 5: Commit**

```bash
git add src/scss/views/_KnowledgeBase.scss
git commit -m "fix(knowledge-base): remove undefined M3 ghost variables, use real design tokens"
```

---

### Task 11: 全面驗證與 Dark Mode 手動檢查

**Files:** 無新增/修改檔案，純驗證

- [ ] **Step 1: 型別檢查**

Run: `npm run type-check`
Expected: 無錯誤

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: 無錯誤（若有 auto-fix 產生變動，`git diff` 確認後一併 commit）

- [ ] **Step 3: 單元測試（含本計畫新增的 4 個 a11y 測試）**

Run: `npm run test:unit`
Expected: 全部通過，包含 Task 6-9 新增的 4 個 a11y 測試檔

- [ ] **Step 4: 建置**

Run: `npm run build`
Expected: 成功

- [ ] **Step 5: 全域 grep — 確認稽核報告點名、且在本次範圍內的寫死顏色都歸零**

Run:
```bash
grep -rn "rgba(14, 15, 12\|rgba(0, 160, 120\|rgba(24, 119, 242\|#7c5fba\|\$color_main_" \
  src/scss/views/_TeamAccessManagement.scss \
  src/scss/views/_ProjectTrashCans.scss \
  src/scss/views/_ResourceLibrary.scss \
  src/scss/views/_SkillEditor.scss \
  src/scss/views/_KnowledgeBase.scss
```
Expected: 無輸出

- [ ] **Step 6: 手動 dark mode 檢查（在 dev server 上人工操作，非自動化）**

Run: `npm run dev`，開啟瀏覽器切換 `AppThemeToggle` 到 dark mode，依序檢查：
- TeamAccessManagement：`role-admin` 藍色徽章、表格邊框
- ProjectTrashCans：到期徽章（urgent/warning）、警示橫幅
- ResourceLibrary：知識徽章、badge--raw 邊框
- SkillEditor：步驟泡泡（active/done 狀態）、AI badge、chip 選中狀態
- KnowledgeBase：轉換紀錄 badge、KPI 卡片、pipeline 審核橫幅

Expected: 以上元素在 dark mode 下顏色與 light mode 的品牌語意一致（teal/danger/warning 對應正確），沒有殘留的淺色系背景

- [ ] **Step 7: 鍵盤可及性人工確認**

在同一個 dev server 頁面，用 Tab 鍵在以下 4 個位置逐一 Tab 過去，確認可見 focus ring 且 Enter/Space 可觸發：
- TeamAccessManagement 的排序按鈕、編輯/刪除按鈕
- ProjectTrashCans 的更多選項按鈕
- ResourceLibrary 的更多選項按鈕（卡片檢視與列表檢視各一次）
- SkillEditor 的步驟指示器（已完成的步驟應可切換，未完成的應該原生 disabled 跳過)

- [ ] **Step 8: 最終 Commit（若 Step 2 lint 有 auto-fix 產生額外變動）**

```bash
git add -A
git commit -m "chore: phase 0 verification pass" --allow-empty
```

---

## Self-Review 摘要（撰寫計畫時已核對）

- **spec 涵蓋度**：spec 第 3 節（色彩 token）→ Task 1/2；第 4 節（字級/間距）→ Task 3；第 5 節（卡片/元件規則）→ Task 4/5；icon-button 可及性 → Task 6-9；第 6 節（dark mode 修正）→ Task 1/2/6-10 全程；第 7 節檔案範圍 → 逐一對應；第 8 節成功標準 → Task 11 涵蓋型別檢查/lint/測試/建置/手動 dark mode 檢查
- **一致性**：Task 1 明確註記「primary alpha 與陰影不需要在 dark 檔重複宣告」，避免 Task 2 誤植重複定義；`.se-step` 從 div 改 button 需要 disabled 樣式與 focus-visible，Task 9 已包含
- **範圍邊界**：JourneyDashboard.vue、Explore.vue 均未出現在任何 Task 的 Files 清單中，符合 spec 修正後的範圍界線
