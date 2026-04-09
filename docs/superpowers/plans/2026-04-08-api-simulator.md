# API 模擬器 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 為整個 demo site 加入假 API 流程體驗——Loading skeleton、Error 畫面、Router progress bar，以及一個 Dev Toggle 面板可即時切換模式。

**Architecture:** 集中式 `apiSimulatorStore` 管理全域模式（normal/loading/error）和延遲，所有頁面透過 `useApiCall()` composable 讀取 mock data，該 composable 根據 simulator 狀態模擬非同步行為。Dev Toggle 僅在 DEV 環境渲染。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Pinia、SCSS（全域樣式）、`@/` alias

---

## 檔案地圖

| 動作 | 路徑 |
|------|------|
| 新建 | `src/stores/apiSimulatorStore.ts` |
| 新建 | `src/composables/useApiCall.ts` |
| 新建 | `src/components/AppSkeleton.vue` |
| 新建 | `src/components/AppErrorState.vue` |
| 新建 | `src/components/AppDevToggle.vue` |
| 新建 | `src/scss/components/_AppSkeleton.scss` |
| 新建 | `src/scss/components/_AppDevToggle.scss` |
| 修改 | `src/scss/components/_index.scss` |
| 修改 | `src/scss/_layout.scss` |
| 修改 | `App.vue` |
| 修改 | `src/views/KnowledgeBase.vue` |
| 修改 | `src/views/KnowledgeDetail.vue` |
| 修改 | `src/views/ResourceLibrary.vue` |
| 修改 | `src/components/ProjectListContent/ProjectListContent.vue` |
| 修改 | `src/components/Knowledge/VersionHistoryDrawer.vue` |
| 修改 | `src/components/Knowledge/ReviewDrawer.vue` |

---

## Task 1：apiSimulatorStore

**Files:**
- Create: `src/stores/apiSimulatorStore.ts`

- [ ] **Step 1：建立 store 檔案**

```ts
// src/stores/apiSimulatorStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ApiMode = 'normal' | 'loading' | 'error';
export type ApiDelay = 200 | 500 | 1000 | 2000;

const STORAGE_KEY = 'api-simulator';

interface PersistedState {
  mode: ApiMode;
  delay: ApiDelay;
  errorMessage: string;
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { mode: 'normal', delay: 500, errorMessage: '伺服器發生錯誤，請稍後再試' };
}

export const useApiSimulatorStore = defineStore('apiSimulator', () => {
  const saved = loadState();
  const mode = ref<ApiMode>(saved.mode);
  const delay = ref<ApiDelay>(saved.delay);
  const errorMessage = ref<string>(saved.errorMessage);

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      mode: mode.value,
      delay: delay.value,
      errorMessage: errorMessage.value,
    }));
  }

  function setMode(m: ApiMode) { mode.value = m; save(); }
  function setDelay(d: ApiDelay) { delay.value = d; save(); }
  function setErrorMessage(msg: string) { errorMessage.value = msg; save(); }

  return { mode, delay, errorMessage, setMode, setDelay, setErrorMessage };
});
```

- [ ] **Step 2：Commit**

```bash
git add src/stores/apiSimulatorStore.ts
git commit -m "feat(store): add apiSimulatorStore with localStorage persistence"
```

---

## Task 2：useApiCall composable

**Files:**
- Create: `src/composables/useApiCall.ts`

- [ ] **Step 1：建立 composable**

```ts
// src/composables/useApiCall.ts
import { ref, watch, watchEffect, onUnmounted } from 'vue';
import type { Ref } from 'vue';
import { useApiSimulatorStore } from '@/stores/apiSimulatorStore';

export function useApiCall<T>(fetcher: () => T) {
  const simulator = useApiSimulatorStore();
  const data = ref<T | null>(null) as Ref<T | null>;
  const isLoading = ref(true);
  const hasError = ref(false);
  const errorMessage = ref('');

  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopEffect: (() => void) | null = null;

  function clearTimer() {
    if (timer !== null) { clearTimeout(timer); timer = null; }
  }

  function execute() {
    clearTimer();
    if (stopEffect) { stopEffect(); stopEffect = null; }

    isLoading.value = true;
    hasError.value = false;
    errorMessage.value = '';

    // 永遠 pending：不設 timer，等待 mode 改變後 watch 重新觸發
    if (simulator.mode === 'loading') return;

    timer = setTimeout(() => {
      timer = null;
      if (simulator.mode === 'error') {
        isLoading.value = false;
        hasError.value = true;
        errorMessage.value = simulator.errorMessage;
      } else {
        // 成功後用 watchEffect 保持 data 與 store 同步（響應後續 store mutations）
        stopEffect = watchEffect(() => {
          data.value = fetcher();
        });
        isLoading.value = false;
      }
    }, simulator.delay);
  }

  // mode 改變時重新執行（immediate: true 表示 mount 時立即執行）
  watch(() => simulator.mode, execute, { immediate: true });

  onUnmounted(() => {
    clearTimer();
    if (stopEffect) stopEffect();
  });

  return { data, isLoading, hasError, errorMessage, retry: execute };
}
```

- [ ] **Step 2：Commit**

```bash
git add src/composables/useApiCall.ts
git commit -m "feat(composable): add useApiCall with simulator-driven async simulation"
```

---

## Task 3：AppSkeleton + AppErrorState UI 元件

**Files:**
- Create: `src/components/AppSkeleton.vue`
- Create: `src/components/AppErrorState.vue`
- Create: `src/scss/components/_AppSkeleton.scss`
- Modify: `src/scss/components/_index.scss`

- [ ] **Step 1：建立 AppSkeleton.vue**

```vue
<!-- src/components/AppSkeleton.vue -->
<template>
  <!-- 列表骨架：5 列 -->
  <div v-if="type === 'list'" class="app-skeleton app-skeleton--list">
    <div v-for="i in 5" :key="i" class="skeleton-row">
      <div class="skeleton-cell skeleton-cell--icon"></div>
      <div class="skeleton-cell-group">
        <div class="skeleton-cell skeleton-cell--title"></div>
        <div class="skeleton-cell skeleton-cell--subtitle"></div>
      </div>
      <div class="skeleton-cell skeleton-cell--badge"></div>
    </div>
  </div>

  <!-- Card 骨架：spinner -->
  <div v-else-if="type === 'card'" class="app-skeleton app-skeleton--card">
    <div class="skeleton-spinner"></div>
    <div class="skeleton-spinner-label">載入中...</div>
  </div>

  <!-- Detail 骨架：標題 + 段落 -->
  <div v-else-if="type === 'detail'" class="app-skeleton app-skeleton--detail">
    <div class="skeleton-cell skeleton-cell--heading"></div>
    <div class="skeleton-cell skeleton-cell--tag"></div>
    <div class="skeleton-cell skeleton-cell--para"></div>
    <div class="skeleton-cell skeleton-cell--para"></div>
    <div class="skeleton-cell skeleton-cell--para skeleton-cell--para-short"></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ type: 'list' | 'card' | 'detail' }>();
</script>
```

- [ ] **Step 2：建立 AppErrorState.vue**

```vue
<!-- src/components/AppErrorState.vue -->
<template>
  <div :class="['app-error-state', { 'app-error-state--inline': inline }]">
    <i class="material-symbols-outlined app-error-state__icon">error_outline</i>
    <div class="app-error-state__message">{{ message }}</div>
    <button class="custom-btn custom-main-btn mt-3" @click="$emit('retry')">
      <i class="material-symbols-outlined">refresh</i>
      重試
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ message: string; inline?: boolean }>();
defineEmits<{ retry: [] }>();
</script>
```

- [ ] **Step 3：建立 _AppSkeleton.scss**

```scss
// src/scss/components/_AppSkeleton.scss

@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: calc(400px + 100%) 0; }
}

%skeleton-shimmer {
  background: linear-gradient(
    90deg,
    var(--color-border-1-alpha30) 25%,
    var(--color-border-1-alpha50) 50%,
    var(--color-border-1-alpha30) 75%
  );
  background-size: 400px 100%;
  animation: shimmer 1.4s infinite linear;
  border-radius: 6px;
}

// ── List skeleton ──
.app-skeleton--list {
  padding: 8px 0;

  .skeleton-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--color-border-1-alpha20);
  }

  .skeleton-cell-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

// ── Detail skeleton ──
.app-skeleton--detail {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

// ── Card skeleton (spinner) ──
.app-skeleton--card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  gap: 12px;

  .skeleton-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid var(--color-border-1-alpha30);
    border-top-color: var(--color-main);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .skeleton-spinner-label {
    font-size: 13px;
    color: var(--color-text-alpha50);
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// ── Shared skeleton cells ──
.skeleton-cell {
  @extend %skeleton-shimmer;

  &--icon    { width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0; }
  &--title   { height: 16px; width: 55%; }
  &--subtitle{ height: 12px; width: 35%; }
  &--badge   { height: 22px; width: 60px; border-radius: 20px; flex-shrink: 0; }
  &--heading { height: 28px; width: 60%; }
  &--tag     { height: 20px; width: 80px; border-radius: 20px; }
  &--para    { height: 14px; width: 100%; }
  &--para-short { width: 65%; }
}

// ── AppErrorState ──
.app-error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;

  &--inline {
    padding: 32px 20px;
  }

  &__icon {
    font-size: 48px;
    color: var(--color-text-alpha30);
    margin-bottom: 12px;
  }

  &__message {
    font-size: 14px;
    color: var(--color-text-alpha60);
    max-width: 320px;
    line-height: 1.6;
  }
}
```

- [ ] **Step 4：在 `_index.scss` 加入 import**

在 `src/scss/components/_index.scss` 最後加一行：

```scss
@import "./AppSkeleton";
```

- [ ] **Step 5：Commit**

```bash
git add src/components/AppSkeleton.vue src/components/AppErrorState.vue \
        src/scss/components/_AppSkeleton.scss src/scss/components/_index.scss
git commit -m "feat: add AppSkeleton and AppErrorState components"
```

---

## Task 4：AppDevToggle 元件

**Files:**
- Create: `src/components/AppDevToggle.vue`
- Create: `src/scss/components/_AppDevToggle.scss`
- Modify: `src/scss/components/_index.scss`

- [ ] **Step 1：建立 AppDevToggle.vue**

```vue
<!-- src/components/AppDevToggle.vue -->
<template>
  <div v-if="isDev" class="app-dev-toggle" :class="{ open: isOpen }">
    <!-- 切換按鈕 -->
    <button class="dev-toggle-btn" @click="isOpen = !isOpen" title="API 模擬器">
      <i class="material-symbols-outlined">settings</i>
    </button>

    <!-- 展開面板 -->
    <div v-if="isOpen" class="dev-toggle-panel">
      <div class="dev-toggle-header">
        <i class="material-symbols-outlined fs-14">settings</i>
        API 模擬器
      </div>

      <!-- 模式 -->
      <div class="dev-toggle-section">
        <div class="dev-toggle-label">模式</div>
        <div class="dev-toggle-radio-group">
          <label v-for="m in modes" :key="m.value" class="dev-toggle-radio">
            <input type="radio" :value="m.value" v-model="currentMode" />
            {{ m.label }}
          </label>
        </div>
      </div>

      <!-- 延遲時間 -->
      <div class="dev-toggle-section">
        <div class="dev-toggle-label">延遲時間</div>
        <select class="custom-input w-100" v-model.number="currentDelay">
          <option v-for="d in delays" :key="d" :value="d">{{ d }} ms</option>
        </select>
      </div>

      <!-- 錯誤訊息（只在 error 模式顯示） -->
      <div class="dev-toggle-section" v-if="currentMode === 'error'">
        <div class="dev-toggle-label">錯誤訊息</div>
        <input class="custom-input w-100" v-model="currentErrorMessage" placeholder="錯誤訊息" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useApiSimulatorStore } from '@/stores/apiSimulatorStore';
import type { ApiMode, ApiDelay } from '@/stores/apiSimulatorStore';

const isDev = import.meta.env.DEV;
const simulator = useApiSimulatorStore();
const isOpen = ref(false);

const modes: { value: ApiMode; label: string }[] = [
  { value: 'normal',  label: '正常' },
  { value: 'loading', label: '載入中' },
  { value: 'error',   label: '錯誤' },
];
const delays: ApiDelay[] = [200, 500, 1000, 2000];

const currentMode = computed({
  get: () => simulator.mode,
  set: (v: ApiMode) => simulator.setMode(v),
});
const currentDelay = computed({
  get: () => simulator.delay,
  set: (v: number) => simulator.setDelay(v as ApiDelay),
});
const currentErrorMessage = computed({
  get: () => simulator.errorMessage,
  set: (v: string) => simulator.setErrorMessage(v),
});
</script>
```

- [ ] **Step 2：建立 _AppDevToggle.scss**

```scss
// src/scss/components/_AppDevToggle.scss

.app-dev-toggle {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;

  .dev-toggle-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: var(--color-main);
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s;

    &:hover { transform: scale(1.08); }

    .material-symbols-outlined { font-size: 20px; }
  }

  .dev-toggle-panel {
    background: var(--color-background);
    border: 1px solid var(--color-border-1-alpha50);
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    width: 240px;
    overflow: hidden;
  }

  .dev-toggle-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px 16px;
    font-size: 13px;
    font-weight: 700;
    background: var(--color-background-1);
    border-bottom: 1px solid var(--color-border-1-alpha30);
    color: var(--color-text);
  }

  .dev-toggle-section {
    padding: 12px 16px;
    border-bottom: 1px solid var(--color-border-1-alpha20);

    &:last-child { border-bottom: none; }
  }

  .dev-toggle-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--color-text-alpha40);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }

  .dev-toggle-radio-group {
    display: flex;
    gap: 12px;
  }

  .dev-toggle-radio {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: var(--color-text);
    cursor: pointer;

    input[type='radio'] { cursor: pointer; accent-color: var(--color-main); }
  }
}
```

- [ ] **Step 3：在 `_index.scss` 最後加入 import**

```scss
@import "./AppDevToggle";
```

- [ ] **Step 4：Commit**

```bash
git add src/components/AppDevToggle.vue src/scss/components/_AppDevToggle.scss \
        src/scss/components/_index.scss
git commit -m "feat: add AppDevToggle floating panel"
```

---

## Task 5：App.vue — Progress Bar + 掛載 DevToggle

**Files:**
- Modify: `App.vue`
- Modify: `src/scss/_layout.scss`

- [ ] **Step 1：在 `src/scss/_layout.scss` 最後加入 progress bar 樣式**

讀取 `src/scss/_layout.scss`，在檔案最後加入：

```scss
// ── Router progress bar ──
.app-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: var(--color-main);
  z-index: 9998;
  transition: width 0.25s ease, opacity 0.3s ease;
  pointer-events: none;
}
```

- [ ] **Step 2：替換 App.vue 全部內容**

```vue
<!-- App.vue -->
<template>
  <div
    class="app-progress-bar"
    :style="{ width: progress + '%', opacity: showProgress ? 1 : 0 }"
  ></div>
  <RouterView />
  <AppDevToggle />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RouterView, useRouter } from 'vue-router';
import AppDevToggle from '@/components/AppDevToggle.vue';

const router = useRouter();
const progress = ref(0);
const showProgress = ref(false);
let t1: ReturnType<typeof setTimeout>;
let t2: ReturnType<typeof setTimeout>;

router.beforeEach(() => {
  clearTimeout(t1); clearTimeout(t2);
  showProgress.value = true;
  progress.value = 20;
  t1 = setTimeout(() => { progress.value = 60; }, 150);
  t2 = setTimeout(() => { progress.value = 80; }, 400);
});

router.afterEach(() => {
  clearTimeout(t1); clearTimeout(t2);
  progress.value = 100;
  setTimeout(() => { showProgress.value = false; progress.value = 0; }, 300);
});

window.debug = {};

onMounted(async () => {
  const timeout = new Promise<void>(resolve => setTimeout(resolve, 3000));
  await Promise.race([
    document.fonts.load('1em "Material Symbols Rounded"'),
    timeout,
  ]);
  document.getElementById('app')?.classList.add('show');
});
</script>
```

- [ ] **Step 3：Commit**

```bash
git add App.vue src/scss/_layout.scss
git commit -m "feat: add router progress bar and mount AppDevToggle in App.vue"
```

---

## Task 6：KnowledgeBase.vue 整合

**Files:**
- Modify: `src/views/KnowledgeBase.vue`

- [ ] **Step 1：在 script 加入 import 和 useApiCall**

在 `src/views/KnowledgeBase.vue` 的 script `import` 區塊加入：

```ts
import AppSkeleton from '@/components/AppSkeleton.vue';
import AppErrorState from '@/components/AppErrorState.vue';
import { useApiCall } from '@/composables/useApiCall';
```

在 `const knowledgeStore = useKnowledgeStore();` 之後加入：

```ts
const {
  data: knowledgeListData,
  isLoading,
  hasError,
  errorMessage: apiErrorMessage,
  retry,
} = useApiCall(() => knowledgeStore.knowledgeList);
```

- [ ] **Step 2：更新 stats 和 filteredList 使用 knowledgeListData**

將現有：
```ts
const stats = computed(() => {
  const list = knowledgeStore.knowledgeList;
```
替換為：
```ts
const stats = computed(() => {
  const list = knowledgeListData.value ?? [];
```

將現有：
```ts
const filteredList = computed(() => {
  let list = [...knowledgeStore.knowledgeList];
```
替換為：
```ts
const filteredList = computed(() => {
  let list = [...(knowledgeListData.value ?? [])];
```

- [ ] **Step 3：在 template 的 `views-page-content-box` 內容區包上三態**

找到 `<div class="views-page-content-box">` 內、`views-page-header` div 之後的所有內容（統計卡、列表、分頁等），用以下結構包起來：

```html
<!-- 原本的 views-page-header 保留在外面 -->

<AppSkeleton v-if="isLoading" type="list" class="mt-4" />
<AppErrorState
  v-else-if="hasError"
  :message="apiErrorMessage"
  @retry="retry"
/>
<template v-else>
  <!-- 統計卡、過濾、列表、分頁 — 原本的內容全部放在這裡 -->
</template>
```

- [ ] **Step 4：Commit**

```bash
git add src/views/KnowledgeBase.vue
git commit -m "feat(KnowledgeBase): integrate useApiCall with skeleton and error state"
```

---

## Task 7：KnowledgeDetail.vue 整合

**Files:**
- Modify: `src/views/KnowledgeDetail.vue`

- [ ] **Step 1：加入 import**

```ts
import AppSkeleton from '@/components/AppSkeleton.vue';
import AppErrorState from '@/components/AppErrorState.vue';
import { useApiCall } from '@/composables/useApiCall';
```

在 `const knowledgeStore = useKnowledgeStore();` 之後加入：

```ts
const {
  data: knowledgeData,
  isLoading,
  hasError,
  errorMessage: apiErrorMessage,
  retry,
} = useApiCall(() => knowledgeStore.getKnowledgeById(props.id));
```

- [ ] **Step 2：更新 knowledge computed**

找到：
```ts
const knowledge = computed(() => knowledgeStore.getKnowledgeById(props.id));
```
替換為（利用 `knowledgeData` 保持 mock data 響應性）：
```ts
const knowledge = computed(() => knowledgeData.value ?? null);
```

- [ ] **Step 3：在 template 根層加入三態**

找到 `<div class="KnowledgeBase KnowledgeDetail views-page">` 內的 `<div class="views-page-content-box" v-if="knowledge">` 之前，加入：

```html
<AppSkeleton v-if="isLoading" type="detail" class="p-4" />
<AppErrorState
  v-else-if="hasError"
  :message="apiErrorMessage"
  @retry="retry"
/>
```

並將原有的 `<div class="views-page-content-box" v-if="knowledge">` 改為：

```html
<div class="views-page-content-box" v-else-if="knowledge">
```

- [ ] **Step 4：Commit**

```bash
git add src/views/KnowledgeDetail.vue
git commit -m "feat(KnowledgeDetail): integrate useApiCall with skeleton and error state"
```

---

## Task 8：ResourceLibrary + ProjectListContent 整合

**Files:**
- Modify: `src/views/ResourceLibrary.vue`
- Modify: `src/components/ProjectListContent/ProjectListContent.vue`

- [ ] **Step 1：ResourceLibrary — 加入 import 和 useApiCall**

在 `src/views/ResourceLibrary.vue` script 加入：

```ts
import AppSkeleton from '@/components/AppSkeleton.vue';
import AppErrorState from '@/components/AppErrorState.vue';
import { useApiCall } from '@/composables/useApiCall';
```

找到 `const resourceStore = useResourceStore();`（或類似的 store 讀取），之後加入：

```ts
const {
  data: resourceListData,
  isLoading,
  hasError,
  errorMessage: apiErrorMessage,
  retry,
} = useApiCall(() => resourceStore.resourceList);
```

將 template 中使用 `resourceStore.resourceList` 的地方改為 `resourceListData.value ?? []`。

在 template 過濾列表區域之前加入三態：

```html
<AppSkeleton v-if="isLoading" type="list" class="mt-4" />
<AppErrorState v-else-if="hasError" :message="apiErrorMessage" @retry="retry" />
<template v-else>
  <!-- 原本的列表/卡片區域 -->
</template>
```

- [ ] **Step 2：ProjectListContent — 加入 import 和 useApiCall**

在 `src/components/ProjectListContent/ProjectListContent.vue` script 加入：

```ts
import AppSkeleton from '@/components/AppSkeleton.vue';
import AppErrorState from '@/components/AppErrorState.vue';
import { useApiCall } from '@/composables/useApiCall';
```

找到 `props` 中用於提供 project 列表的 prop 或 store，加入：

```ts
import { useProjectStore } from '@/stores/projectStore'; // 依實際 store 名稱調整
const projectStore = useProjectStore();

const {
  data: projectListData,
  isLoading,
  hasError,
  errorMessage: apiErrorMessage,
  retry,
} = useApiCall(() => projectStore.projectList); // 依實際 getter 調整
```

將 template 中使用 project 列表的地方改為 `projectListData.value ?? []`。

在列表渲染區域之前加入三態（與 ResourceLibrary 相同模式）。

- [ ] **Step 3：Commit**

```bash
git add src/views/ResourceLibrary.vue \
        src/components/ProjectListContent/ProjectListContent.vue
git commit -m "feat: integrate useApiCall in ResourceLibrary and ProjectListContent"
```

---

## Task 9：VersionHistoryDrawer + ReviewDrawer 整合

**Files:**
- Modify: `src/components/Knowledge/VersionHistoryDrawer.vue`
- Modify: `src/components/Knowledge/ReviewDrawer.vue`

- [ ] **Step 1：VersionHistoryDrawer — 加入 import 和 useApiCall**

在 `src/components/Knowledge/VersionHistoryDrawer.vue` script 加入：

```ts
import AppSkeleton from '@/components/AppSkeleton.vue';
import AppErrorState from '@/components/AppErrorState.vue';
import { useApiCall } from '@/composables/useApiCall';
```

在 `const knowledgeStore = useKnowledgeStore();` 之後加入：

```ts
const {
  data: knowledgeData,
  isLoading: drawerLoading,
  hasError: drawerError,
  errorMessage: drawerErrorMsg,
  retry: drawerRetry,
} = useApiCall(() => knowledgeStore.getKnowledgeById(props.knowledgeId));
```

將現有 `const knowledge = computed(() => ...)` 替換為：

```ts
const knowledge = computed(() => knowledgeData.value ?? null);
```

在 `<div class="drawer-body p-0" v-if="knowledge">` 之前、drawer-header 之後插入：

```html
<AppSkeleton v-if="drawerLoading" type="card" />
<AppErrorState
  v-else-if="drawerError"
  :message="drawerErrorMsg"
  :inline="true"
  @retry="drawerRetry"
/>
```

並將原有的 `<div class="drawer-body p-0" v-if="knowledge">` 改為：

```html
<div class="drawer-body p-0" v-else-if="knowledge">
```

- [ ] **Step 2：ReviewDrawer — 加入同樣模式**

在 `src/components/Knowledge/ReviewDrawer.vue` script 加入：

```ts
import AppSkeleton from '@/components/AppSkeleton.vue';
import AppErrorState from '@/components/AppErrorState.vue';
import { useApiCall } from '@/composables/useApiCall';
```

在 `const knowledgeStore = useKnowledgeStore();` 之後加入：

```ts
const {
  isLoading: drawerLoading,
  hasError: drawerError,
  errorMessage: drawerErrorMsg,
  retry: drawerRetry,
} = useApiCall(() => knowledgeStore.getVersionById(props.knowledgeId, props.versionId));
```

在 drawer-header 與 `<div class="drawer-body" v-if="knowledge && version">` 之間插入：

```html
<AppSkeleton v-if="drawerLoading" type="card" />
<AppErrorState
  v-else-if="drawerError"
  :message="drawerErrorMsg"
  :inline="true"
  @retry="drawerRetry"
/>
```

並將原有的 `v-if="knowledge && version"` 改為 `v-else-if="knowledge && version"`（drawer body 和 footer 都改）。

- [ ] **Step 3：Commit**

```bash
git add src/components/Knowledge/VersionHistoryDrawer.vue \
        src/components/Knowledge/ReviewDrawer.vue
git commit -m "feat: integrate useApiCall loading/error states in drawers"
```

---

## Self-Review

**Spec coverage check：**
- ✅ Loading skeleton（list/card/detail）→ Task 3
- ✅ Error 畫面 + 重試 → Task 3
- ✅ Router progress bar → Task 5
- ✅ Dev Toggle 面板（三種模式 + 延遲 + 錯誤訊息）→ Task 4
- ✅ localStorage 持久化 → Task 1
- ✅ DEV-only 渲染 → Task 4
- ✅ KnowledgeBase 整合 → Task 6
- ✅ KnowledgeDetail 整合 → Task 7
- ✅ ResourceLibrary 整合 → Task 8
- ✅ ProjectListContent 整合 → Task 8
- ✅ 主要 Drawer 整合（VersionHistoryDrawer、ReviewDrawer）→ Task 9

**Type consistency：**
- `ApiMode`、`ApiDelay` 在 Task 1 定義，Task 4 import 並使用
- `useApiCall()` 在 Task 2 定義，Task 6–9 都 import 自 `@/composables/useApiCall`
- `AppSkeleton` type prop: `'list' | 'card' | 'detail'` — 每個 Task 都使用正確的 type value
- `AppErrorState` props: `message: string, inline?: boolean`, emit `retry` — 所有使用處一致
