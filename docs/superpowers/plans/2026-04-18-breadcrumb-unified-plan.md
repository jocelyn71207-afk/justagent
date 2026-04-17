# Breadcrumb Unified Logic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all scattered inline breadcrumb HTML across 8+ views with a single `<AppBreadcrumb>` component backed by a `useBreadcrumb` composable that reads from router meta + rootStore.

**Architecture:** A module-level `_dynamicLabel` ref in `useBreadcrumb.ts` acts as a shared singleton that auto-clears on route change. The composable computes an ordered breadcrumb chain: company name (from rootStore) → team name (from query) → parent route (from router.getRoutes()) → current page title (static meta or dynamic override). `AppBreadcrumb.vue` renders this chain and hides itself when only 1 item exists (no useful breadcrumb).

**Tech Stack:** Vue 3 Composition API, TypeScript, Vue Router 4, Pinia (rootStore), SCSS

---

## File Map

| Action | File |
|--------|------|
| Modify | `src/router/index.ts` |
| Modify | `src/stores/rootStore.ts` |
| Modify | `src/components/AppMenuTree.vue` |
| Create | `src/composables/useBreadcrumb.ts` |
| Create | `src/components/AppBreadcrumb.vue` |
| Modify | `src/scss/_layout.scss` |
| Modify | `src/views/KnowledgeBase.vue` |
| Modify | `src/views/TeamAccessManagement.vue` |
| Modify | `src/views/ProjectTrashCans.vue` |
| Modify | `src/views/ResourceLibrary.vue` |
| Modify | `src/views/CompanyTeamSettings.vue` |
| Modify | `src/components/ProjectListContent/ProjectListContent.vue` |
| Modify | `src/scss/components/_ProjectListContent.scss` |
| Modify | `src/views/KnowledgeDetail.vue` |
| Modify | `src/views/KnowledgeEditor.vue` |

---

## Task 1: Router Meta + TypeScript Augmentation + rootStore

**Files:**
- Modify: `src/router/index.ts`
- Modify: `src/stores/rootStore.ts`

- [ ] **Step 1: Add RouteMeta type augmentation to `src/router/index.ts`**

Add the following block immediately after the existing imports (before `export const routes`):

```typescript
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    parentName?: string
    useCompanyName?: boolean
    hideMenuTree?: boolean
  }
}
```

- [ ] **Step 2: Add `meta` fields to all child routes in `src/router/index.ts`**

Replace the `children` array (lines 23–87) with:

```typescript
children: [
  {
    path: '/view/ProjectDashboard',
    name: 'ProjectDashboard',
    component: () => import('@/views/ProjectDashboard.vue'),
    meta: { title: '最近使用' },
  },
  {
    path: '/view/TeamProject',
    name: 'TeamProject',
    component: () => import('@/views/TeamProject.vue'),
    meta: { title: '團隊專案' },
  },
  {
    path: '/view/ResourceLibrary',
    name: 'ResourceLibrary',
    component: () => import('@/views/ResourceLibrary.vue'),
    meta: { title: '共享資源庫' },
  },
  {
    path: '/view/TeamAccessManagement',
    name: 'TeamAccessManagement',
    component: () => import('@/views/TeamAccessManagement.vue'),
    meta: { title: '權限管理' },
  },
  {
    path: '/view/AiViewer',
    name: 'AiViewer',
    component: () => import('@/views/AiViewer.vue'),
    meta: { hideMenuTree: true },
  },
  {
    path: '/view/CompanyTeamSettings',
    name: 'CompanyTeamSettings',
    component: () => import('@/views/CompanyTeamSettings.vue'),
    meta: { title: '企業/團隊設定', useCompanyName: true },
  },
  {
    path: '/view/GUI',
    name: 'GUI',
    component: () => import('@/views/GUI.vue'),
  },
  {
    path: '/view/ProjectTrashCans',
    name: 'ProjectTrashCans',
    component: () => import('@/views/ProjectTrashCans.vue'),
    meta: { title: '垃圾桶' },
  },
  {
    path: '/view/KnowledgeBase',
    name: 'KnowledgeBase',
    component: () => import('@/views/KnowledgeBase.vue'),
    meta: { title: '知識庫管理' },
  },
  {
    path: '/view/KnowledgeDetail/:id',
    name: 'KnowledgeDetail',
    component: () => import('@/views/KnowledgeDetail.vue'),
    props: true,
    meta: { title: '知識庫', parentName: 'KnowledgeBase' },
  },
  {
    path: '/view/KnowledgeEditor/:knowledgeId/:versionId',
    name: 'KnowledgeEditor',
    component: () => import('@/views/KnowledgeEditor.vue'),
    props: true,
    meta: { title: '編輯器', parentName: 'KnowledgeBase' },
  },
  {
    path: '/view/Explore',
    name: 'Explore',
    component: () => import('@/views/Explore.vue'),
    meta: { title: '探索' },
  },
]
```

- [ ] **Step 3: Add `nowMenuTreeCompanyName` to `src/stores/rootStore.ts`**

After line 16 (`const nowMenuTreeCompanyId = ref('');`), add:

```typescript
const nowMenuTreeCompanyName = ref<string>('Teva')
```

Then in the `return` object (after `nowMenuTreeCompanyId`), add `nowMenuTreeCompanyName`:

```typescript
return {
  isShowBatchUpload,
  isBatchUploading,
  isBatchUploadSuccess,

  isEnterAppSearchPage,
  projectListMode,
  appSearchKeyword,

  nowMenuTreeCompanyId,
  nowMenuTreeCompanyName,
  isShowBuserModal,

  testGroups,

  openBatchUploadFn,
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/jocelyn/Desktop/demosite && npx vue-tsc --noEmit
```

Expected: no errors related to `RouteMeta` or `nowMenuTreeCompanyName`.

- [ ] **Step 5: Commit**

```bash
cd /Users/jocelyn/Desktop/demosite
git add src/router/index.ts src/stores/rootStore.ts
git commit -m "feat: add router meta titles and rootStore nowMenuTreeCompanyName for breadcrumb"
```

---

## Task 2: Update AppMenuTree Company Select

**Files:**
- Modify: `src/components/AppMenuTree.vue` (lines 61–63)

- [ ] **Step 1: Replace hardcoded company options with Teva/UGG + v-model**

The current code at lines 61–63:
```vue
<select class="custom-select w-100">
  <option value="企業A">企業A</option>
  <option value="企業B">企業B</option>
</select>
```

Replace with:
```vue
<select class="custom-select w-100" v-model="rootStore.nowMenuTreeCompanyName">
  <option value="Teva">Teva</option>
  <option value="UGG">UGG</option>
</select>
```

- [ ] **Step 2: Verify `rootStore` is imported in AppMenuTree.vue**

Run:
```bash
grep -n "rootStore\|useRootStore" /Users/jocelyn/Desktop/demosite/src/components/AppMenuTree.vue | head -5
```

If `useRootStore` is already imported and `rootStore` is defined, no change needed. If not, add to `<script setup>`:
```typescript
import { useRootStore } from '@/stores/rootStore'
const rootStore = useRootStore()
```

- [ ] **Step 3: Commit**

```bash
cd /Users/jocelyn/Desktop/demosite
git add src/components/AppMenuTree.vue
git commit -m "feat: update company select to Teva/UGG with v-model binding to rootStore"
```

---

## Task 3: Create `useBreadcrumb` Composable

**Files:**
- Create: `src/composables/useBreadcrumb.ts`

- [ ] **Step 1: Create the file**

Create `src/composables/useBreadcrumb.ts` with:

```typescript
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'
import { useRootStore } from '@/stores/rootStore'

export type BreadcrumbItem = {
  label: string
  to?: RouteLocationRaw
}

const _dynamicLabel = ref<string | null>(null)

export function useBreadcrumb() {
  const route = useRoute()
  const router = useRouter()
  const rootStore = useRootStore()

  watch(
    () => route.fullPath,
    () => { _dynamicLabel.value = null }
  )

  const items = computed<BreadcrumbItem[]>(() => {
    const result: BreadcrumbItem[] = []
    const { title, parentName, useCompanyName } = route.meta

    if (useCompanyName) {
      result.push({ label: rootStore.nowMenuTreeCompanyName })
    }

    if (route.query.teamName) {
      result.push({
        label: route.query.teamName as string,
        to: {
          name: 'TeamProject',
          query: {
            teamId: route.query.teamId,
            teamName: route.query.teamName,
          },
        },
      })
    }

    if (parentName) {
      const parentMeta = router.getRoutes().find(r => r.name === parentName)?.meta
      result.push({
        label: parentMeta?.title ?? parentName,
        to: {
          name: parentName,
          query: route.query.teamId
            ? { teamId: route.query.teamId, teamName: route.query.teamName }
            : undefined,
        },
      })
    }

    result.push({
      label: _dynamicLabel.value ?? title ?? (route.name as string),
    })

    return result
  })

  function setDynamic(label: string) {
    _dynamicLabel.value = label
  }

  return { items, setDynamic }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/jocelyn/Desktop/demosite && npx vue-tsc --noEmit
```

Expected: no errors on `useBreadcrumb.ts`.

- [ ] **Step 3: Commit**

```bash
cd /Users/jocelyn/Desktop/demosite
git add src/composables/useBreadcrumb.ts
git commit -m "feat: add useBreadcrumb composable with router meta + dynamic label support"
```

---

## Task 4: Create `AppBreadcrumb` Component + SCSS

**Files:**
- Create: `src/components/AppBreadcrumb.vue`
- Modify: `src/scss/_layout.scss`

- [ ] **Step 1: Create `src/components/AppBreadcrumb.vue`**

```vue
<template>
  <div class="banner-crumb" v-if="visibleItems.length">
    <template v-for="(item, i) in visibleItems" :key="i">
      <RouterLink v-if="item.to" :to="item.to" class="crumb-link">
        {{ item.label }}
      </RouterLink>
      <span v-else class="crumb-current">{{ item.label }}</span>
      <span v-if="i < visibleItems.length - 1" class="crumb-sep"> / </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBreadcrumb } from '@/composables/useBreadcrumb'

const { items } = useBreadcrumb()

const visibleItems = computed(() =>
  items.value.length > 1 ? items.value : []
)
</script>
```

- [ ] **Step 2: Add link styles to `.banner-crumb` in `src/scss/_layout.scss`**

Locate the `.banner-crumb` block (around line 97). Inside it, after the existing properties, add the nested rules:

```scss
.banner-crumb {
  // ... existing styles unchanged ...

  .crumb-link {
    color: inherit;
    text-decoration: none;
    opacity: 0.7;
    &:hover { opacity: 1; }
  }
  .crumb-current {
    opacity: 1;
  }
  .crumb-sep {
    opacity: 0.4;
    margin: 0 2px;
  }
}
```

Specifically, append these three rule blocks **inside** the `.banner-crumb { }` block in `_layout.scss`, after the `&::before` line.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/jocelyn/Desktop/demosite && npx vue-tsc --noEmit
```

Expected: no errors on `AppBreadcrumb.vue`.

- [ ] **Step 4: Commit**

```bash
cd /Users/jocelyn/Desktop/demosite
git add src/components/AppBreadcrumb.vue src/scss/_layout.scss
git commit -m "feat: add AppBreadcrumb component with crumb-link/current/sep styles"
```

---

## Task 5: Migrate Simple Views (Remove Inline banner-crumb)

**Files:**
- Modify: `src/views/KnowledgeBase.vue`
- Modify: `src/views/TeamAccessManagement.vue`
- Modify: `src/views/ProjectTrashCans.vue`
- Modify: `src/views/ResourceLibrary.vue`
- Modify: `src/views/CompanyTeamSettings.vue`
- Modify: `src/components/ProjectListContent/ProjectListContent.vue`
- Modify: `src/scss/components/_ProjectListContent.scss`

### KnowledgeBase.vue (line 8)

- [ ] **Step 1: Replace inline banner-crumb**

Replace:
```vue
<div class="banner-crumb">{{ teamName }}</div>
```
With:
```vue
<AppBreadcrumb />
```

Add import in `<script setup>`:
```typescript
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
```

### TeamAccessManagement.vue (line 7)

- [ ] **Step 2: Replace inline banner-crumb**

Replace:
```vue
<div class="banner-crumb">{{ teamName }} / 權限管理</div>
```
With:
```vue
<AppBreadcrumb />
```

Add import in `<script setup>`:
```typescript
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
```

### ProjectTrashCans.vue (line 7)

- [ ] **Step 3: Replace inline banner-crumb**

Replace:
```vue
<div class="banner-crumb">{{ teamName || '我的團隊' }} / 垃圾桶</div>
```
With:
```vue
<AppBreadcrumb />
```

Add import in `<script setup>`:
```typescript
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
```

### ResourceLibrary.vue (line 7)

- [ ] **Step 4: Replace inline banner-crumb**

Replace:
```vue
<div class="banner-crumb">{{ teamName || '共用資源' }}</div>
```
With:
```vue
<AppBreadcrumb />
```

Add import in `<script setup>`:
```typescript
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
```

### CompanyTeamSettings.vue (line 7)

- [ ] **Step 5: Replace inline banner-crumb**

Replace:
```vue
<div class="banner-crumb">公司名稱</div>
```
With:
```vue
<AppBreadcrumb />
```

Add import in `<script setup>`:
```typescript
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
```

### ProjectListContent.vue (line 8)

- [ ] **Step 6: Replace .plc-banner-breadcrumb with AppBreadcrumb**

Replace:
```vue
<div class="plc-banner-breadcrumb">{{ mode === 'team' ? '團隊' : '最近使用' }}</div>
```
With:
```vue
<AppBreadcrumb />
```

Add import in `<script setup>`:
```typescript
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
```

### _ProjectListContent.scss

- [ ] **Step 7: Remove `.plc-banner-breadcrumb` block**

In `src/scss/components/_ProjectListContent.scss`, remove the `.plc-banner-breadcrumb` block (lines 30–41):

```scss
.plc-banner-breadcrumb {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: $plc-emerald;
  margin-bottom: 4px;
  font-family: 'JetBrains Mono', monospace;
  opacity: 1;

  &::before { content: '>_ '; opacity: 0.5; }
}
```

The `.banner-crumb` styles in `_layout.scss` will now handle the visual styling via the `AppBreadcrumb` component.

- [ ] **Step 8: Verify TypeScript compiles**

```bash
cd /Users/jocelyn/Desktop/demosite && npx vue-tsc --noEmit
```

Expected: no unused variable warnings for `teamName` in the migrated views (if `teamName` was only used for banner-crumb, it may now be unused — remove it from those views if so).

- [ ] **Step 9: Commit**

```bash
cd /Users/jocelyn/Desktop/demosite
git add src/views/KnowledgeBase.vue src/views/TeamAccessManagement.vue \
  src/views/ProjectTrashCans.vue src/views/ResourceLibrary.vue \
  src/views/CompanyTeamSettings.vue \
  src/components/ProjectListContent/ProjectListContent.vue \
  src/scss/components/_ProjectListContent.scss
git commit -m "feat: migrate simple views from inline banner-crumb to AppBreadcrumb component"
```

---

## Task 6: KnowledgeDetail — Replace Back Button with Breadcrumb

**Files:**
- Modify: `src/views/KnowledgeDetail.vue`

**Context:** Currently, lines 12–56 form a `.views-page-header` block that starts with a back button. The goal is to remove the back button from the left side and add a `.page-banner` with `<AppBreadcrumb />` above the header. The right-side action buttons in `header-right-box` remain untouched.

- [ ] **Step 1: Replace the back button + title in `.views-page-header`**

Find the current `.views-page-header` block starting at line 12:
```vue
<!-- 頂部導航與標題 -->
<div class="views-page-header">
  <div class="d-flex align-items-center">
    <button class="custom-btn mr-3" @click="router.back()">
      <i class="material-symbols-outlined">arrow_back</i>
    </button>
    <div class="page-title-group">
      <h3>{{ versionToShow.title }}</h3>
      <span class="category-tag ml-2">{{ knowledge.category }}</span>
    </div>
  </div>
  <div class="header-right-box">
    ...existing action buttons...
  </div>
</div>
```

Replace the `<!-- 頂部導航與標題 -->` comment and the entire opening of `.views-page-header` so it becomes:

```vue
<!-- 頂部麵包屑 -->
<div class="page-banner">
  <AppBreadcrumb />
  <div class="banner-title">{{ versionToShow.title }}</div>
</div>

<!-- 操作列 -->
<div class="views-page-header">
  <div class="d-flex align-items-center">
    <span class="category-tag">{{ knowledge.category }}</span>
  </div>
  <div class="header-right-box">
    ...existing action buttons unchanged...
  </div>
</div>
```

The `header-right-box` contents (版本紀錄, 建立新版本, 撤回審核, 開始審核, 繼續編輯草稿 buttons) remain exactly as-is.

- [ ] **Step 2: Add `setDynamic` call in `<script setup>`**

Add the import at the top of `<script setup>`:
```typescript
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import { useBreadcrumb } from '@/composables/useBreadcrumb'
```

After the existing `const knowledge` and `const versionToShow` computed/refs, add:
```typescript
const { setDynamic } = useBreadcrumb()

watch(versionToShow, (val) => {
  if (val?.title) setDynamic(val.title)
}, { immediate: true })
```

Note: `watch` is likely already imported (check existing imports). If not, add it to the Vue import line.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/jocelyn/Desktop/demosite && npx vue-tsc --noEmit
```

Expected: no errors. If `router` is now unused (it was only used for `router.back()`), check if it's still used elsewhere in the component before removing it.

- [ ] **Step 4: Commit**

```bash
cd /Users/jocelyn/Desktop/demosite
git add src/views/KnowledgeDetail.vue
git commit -m "feat: replace KnowledgeDetail back button with AppBreadcrumb and setDynamic"
```

---

## Task 7: KnowledgeEditor — Replace Close Button with Breadcrumb

**Files:**
- Modify: `src/views/KnowledgeEditor.vue`

**Context:** Currently, lines 6–25 form a `.views-page-header` with a close button (arrow_back → handleBack). The right side has 儲存草稿 and 送出審核 buttons. The goal is to add a `.page-banner` with `<AppBreadcrumb />` before the header and remove the close button from the left side.

- [ ] **Step 1: Replace the close button structure in `.views-page-header`**

Find the current `.views-page-header` block (lines 6–25):
```vue
<!-- 頂部操作列 -->
<div class="views-page-header">
  <div class="d-flex align-items-center">
    <button class="custom-btn mr-3" @click="handleBack">
      <i class="material-symbols-outlined">close</i>
    </button>
    <div class="page-title-group">
      <h3>編輯草稿 {{ draft.versionNumber }}</h3>
    </div>
  </div>
  <div class="header-right-box">
    <button class="custom-btn" @click="handleSave">
      <i class="material-symbols-outlined">save</i>
      儲存草稿
    </button>
    <button class="custom-btn custom-main-btn ml-2" @click="isReviewModalOpen = true">
      <i class="material-symbols-outlined">send</i>
      送出審核
    </button>
  </div>
</div>
```

Replace with:
```vue
<!-- 頂部麵包屑 -->
<div class="page-banner">
  <AppBreadcrumb />
  <div class="banner-title">編輯草稿 {{ draft.versionNumber }}</div>
</div>

<!-- 操作列 -->
<div class="views-page-header">
  <div class="d-flex align-items-center"></div>
  <div class="header-right-box">
    <button class="custom-btn" @click="handleSave">
      <i class="material-symbols-outlined">save</i>
      儲存草稿
    </button>
    <button class="custom-btn custom-main-btn ml-2" @click="isReviewModalOpen = true">
      <i class="material-symbols-outlined">send</i>
      送出審核
    </button>
  </div>
</div>
```

- [ ] **Step 2: Add `setDynamic` call in `<script setup>`**

Add imports:
```typescript
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import { useBreadcrumb } from '@/composables/useBreadcrumb'
```

After `const knowledge` and `const draft` computed definitions (around line 250), add:
```typescript
const { setDynamic } = useBreadcrumb()

watch(knowledge, (val) => {
  if (val?.title) setDynamic(val.title)
}, { immediate: true })
```

Note: The dynamic label here is `knowledge.title` (the parent knowledge article title, e.g. "商品退換貨說明"), matching the spec output `Teva電子商務 / 知識庫管理 / [文章標題]`.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/jocelyn/Desktop/demosite && npx vue-tsc --noEmit
```

Expected: no errors. Check if `handleBack` (which called `router.back()`) is still needed elsewhere; if the back button is the only call site, it can be removed. If `router` is now unused, remove it too.

- [ ] **Step 4: Commit**

```bash
cd /Users/jocelyn/Desktop/demosite
git add src/views/KnowledgeEditor.vue
git commit -m "feat: replace KnowledgeEditor close button with AppBreadcrumb and setDynamic"
```

---

## Spec Coverage Checklist

| Spec Requirement | Task |
|-----------------|------|
| Router meta: title + parentName + useCompanyName on all 10 routes | Task 1 |
| TS RouteMeta augmentation | Task 1 |
| rootStore.nowMenuTreeCompanyName | Task 1 |
| AppMenuTree select: Teva/UGG + v-model | Task 2 |
| useBreadcrumb composable | Task 3 |
| _dynamicLabel module-level ref, auto-clear on route change | Task 3 |
| AppBreadcrumb component, hides when ≤1 item | Task 4 |
| SCSS: .crumb-link, .crumb-current, .crumb-sep inside .banner-crumb | Task 4 |
| Migrate KnowledgeBase, TeamAccessManagement, ProjectTrashCans, ResourceLibrary, CompanyTeamSettings | Task 5 |
| Migrate ProjectListContent, remove .plc-banner-breadcrumb SCSS | Task 5 |
| KnowledgeDetail: breadcrumb + setDynamic(versionToShow.title) | Task 6 |
| KnowledgeEditor: breadcrumb + setDynamic(knowledge.title) | Task 7 |
| AiViewer, GUI, Login not touched | ✅ not in any task |
| router beforeEach guard not touched | ✅ not in any task |
| .banner-crumb core SCSS not changed (only additions) | ✅ Task 4 adds inside existing block |
