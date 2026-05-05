# Dark Mode Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fixed pill-shaped sun/switch/moon toggle in the top-right corner of `Full.vue` that toggles dark mode by setting `document.documentElement.dataset.theme`.

**Architecture:** A self-contained `AppThemeToggle.vue` component holds a local `isDark` ref and mutates `dataset.theme` directly on click. No store, no localStorage. The existing `[data-theme="dark"]:root` selectors in `_themeDark.scss` respond automatically.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, SCSS with Jade Mist 02 CSS custom properties, Material Symbols Rounded icon font (already loaded in the project).

---

### Task 1: Create `_AppThemeToggle.scss`

**Files:**
- Create: `src/scss/components/_AppThemeToggle.scss`
- Modify: `src/scss/components/_index.scss`

- [ ] **Step 1: Create the SCSS file**

Create `src/scss/components/_AppThemeToggle.scss` with this exact content:

```scss
.AppThemeToggle {
  position: fixed;
  top: 16px;
  right: 20px;
  z-index: 200;
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--surface);
  border: 1px solid var(--divider);
  border-radius: 999px;
  padding: 5px 10px;
  box-shadow: 0 2px 8px rgba(var(--shadow), 0.08);
  cursor: pointer;
  user-select: none;

  .AppThemeToggle-icon {
    font-size: 16px;
    line-height: 1;
    color: var(--text);
    transition: opacity 0.2s;

    &.is-inactive {
      opacity: 0.4;
    }
  }

  .AppThemeToggle-track {
    width: 32px;
    height: 18px;
    border-radius: 999px;
    background: var(--sidebar-hover);
    position: relative;
    transition: background 0.2s;

    &.is-dark {
      background: var(--primary);
    }
  }

  .AppThemeToggle-thumb {
    width: 12px;
    height: 12px;
    border-radius: 999px;
    background: #fff;
    position: absolute;
    top: 3px;
    left: 3px;
    transition: transform 0.2s;

    &.is-dark {
      transform: translateX(14px);
    }
  }
}
```

- [ ] **Step 2: Register the SCSS file in `_index.scss`**

Open `src/scss/components/_index.scss`. Add `@import "./AppThemeToggle";` at the end of the file, after the last existing `@import` line.

The file currently ends with:
```scss
@import "./DataSourceTab";
```

Add one line so it becomes:
```scss
@import "./DataSourceTab";
@import "./AppThemeToggle";
```

- [ ] **Step 3: Verify the SCSS compiles**

```bash
npm run build 2>&1 | tail -20
```

Expected: build completes without errors referencing `AppThemeToggle`.

- [ ] **Step 4: Commit**

```bash
git add src/scss/components/_AppThemeToggle.scss src/scss/components/_index.scss
git commit -m "feat: add AppThemeToggle SCSS styles"
```

---

### Task 2: Create `AppThemeToggle.vue` and wire into `Full.vue`

**Files:**
- Create: `src/components/AppThemeToggle.vue`
- Modify: `src/container/Full.vue`

- [ ] **Step 1: Create the Vue component**

Create `src/components/AppThemeToggle.vue` with this exact content:

```vue
<template>
  <div class="AppThemeToggle" @click="toggle">
    <span
      class="AppThemeToggle-icon material-symbols-rounded"
      :class="{ 'is-inactive': isDark }"
    >light_mode</span>

    <div class="AppThemeToggle-track" :class="{ 'is-dark': isDark }">
      <div class="AppThemeToggle-thumb" :class="{ 'is-dark': isDark }" />
    </div>

    <span
      class="AppThemeToggle-icon material-symbols-rounded"
      :class="{ 'is-inactive': !isDark }"
    >dark_mode</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isDark = ref(false)

function toggle() {
  isDark.value = !isDark.value
  document.documentElement.dataset.theme = isDark.value ? 'dark' : 'light'
}
</script>
```

- [ ] **Step 2: Add `<AppThemeToggle />` to `Full.vue`**

Open `src/container/Full.vue`.

Add the import after the existing component imports (after the `AppBuserModal` import line):

```ts
import AppThemeToggle from '@/components/AppThemeToggle.vue';
```

Add the component tag inside the `<div :class="['Full']">` wrapper, just before the closing `</div>`, after `<AppBuserModal />`:

```html
    </div>

    <AppThemeToggle />
  </div>
```

The final `Full.vue` template should look like:

```vue
<template>
  <div :class="['Full']" ref="fullEl">
    <div :class="['main', { show: isShowMain }]">
      <AppMenuTree v-if="!route.meta.hideMenuTree" />

      <!-- 當前單元 -->
      <router-view />

      <!-- 通用性查詢結果介面 -->
      <AppSearchPage v-if="isEnterAppSearchPage" />

      <!-- TODO... 這邊預計要放上傳檔案的組件, 讓上傳中的檔案不會因為 router 切換而被影響 -->
      <AppBatchUpload />

      <!-- Buser Modal -->
      <AppBuserModal />

    </div>

    <AppThemeToggle />
  </div>
</template>
```

And the script section imports should include:

```ts
import AppThemeToggle from '@/components/AppThemeToggle.vue';
```

- [ ] **Step 3: Run type-check**

```bash
npm run type-check 2>&1 | tail -20
```

Expected: no errors referencing `AppThemeToggle`.

- [ ] **Step 4: Run dev server and verify visually**

```bash
npm run dev
```

Open `http://localhost:5173` in a browser. Verify:
1. The pill toggle appears in the top-right corner of every page
2. Clicking it slides the thumb right and the page switches to dark mode (dark background, light text)
3. Clicking again slides thumb left and page returns to light mode
4. The active icon is fully opaque; the inactive icon is at 40% opacity

- [ ] **Step 5: Commit**

```bash
git add src/components/AppThemeToggle.vue src/container/Full.vue
git commit -m "feat: add dark mode toggle to app shell"
```
