# AI 思維鏈與知識來源顯示 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 AI 對話介面中顯示動態思維鏈步驟（`isThinking` 階段），並在回答底部附上知識來源 Chip，點擊開啟右側抽屜查看 chunk 細節。

**Architecture:** 新建 `ThinkingChainCard.vue`（步驟卡片，帶動畫與折疊）與 `KnowledgeSourceDrawer.vue`（知識來源側邊抽屜，透過 Teleport 掛在 body 層）；修改 `AiViewerRecord.vue` 加入這兩個元件；修改 `AiViewerRightBox.vue` 提供 provide/inject 狀態並在 mock 資料中注入 `thinkingSteps` 與 `sources`。

**Tech Stack:** Vue 3 Composition API (`<script setup lang="ts">`), Pinia, SCSS CSS custom properties, Material Symbols Outlined icons

## Global Constraints

- 所有 Vue 元件使用 `<script setup lang="ts">`，禁止 Options API
- 樣式放在 `src/scss/` 下，禁止 `<style scoped>`
- 所有 import 使用 `@/` alias
- 顏色使用 CSS custom properties（`var(--surface)`, `var(--divider)`, `var(--text)`, `var(--text-a60)`），不寫死 hex
- 新 SCSS 檔案需在 `src/scss/components/_index.scss` 加入 `@import` 才會被打包

---

## File Map

| 檔案 | 類型 | 責任 |
|------|------|------|
| `src/components/AiViewer/ThinkingChainCard.vue` | 新建 | 展示動態思維鏈步驟；支援展開/折疊 |
| `src/components/AiViewer/KnowledgeSourceDrawer.vue` | 新建 | 側邊抽屜，顯示 chunk 細節；透過 inject 接收狀態 |
| `src/components/AiViewer/AiViewerRecord.vue` | 修改 | 整合 ThinkingChainCard、source chips；inject openDrawer |
| `src/components/AiViewer/AiViewerRightBox.vue` | 修改 | provide 抽屜狀態；更新 mock 資料加入 thinkingSteps + sources；掛載 KnowledgeSourceDrawer |
| `src/scss/components/_thinkingChain.scss` | 新建 | ThinkingChainCard、KnowledgeSourceDrawer、source chips 樣式 |
| `src/scss/components/_index.scss` | 修改 | 加入 `@import './thinkingChain'` |
| `src/scss/views/_AiViewer.scss` | 修改 | 在 `.AiViewerRecord` 區塊加入 `.message-wrap` layout 樣式 |

---

## Task 1: SCSS Scaffolding

**Files:**
- Create: `src/scss/components/_thinkingChain.scss`
- Modify: `src/scss/components/_index.scss` (add import at end)
- Modify: `src/scss/views/_AiViewer.scss` (add `.message-wrap` inside `.AiViewerRecord`)

**Interfaces:**
- Produces: CSS classes used by Tasks 2–4: `.thinking-chain-card`, `.thinking-chain-toggle`, `.thinking-step`, `.thinking-step-icon`, `.thinking-step-tag`, `.thinking-step-spinner`, `.source-chips`, `.source-chip`, `.knowledge-drawer`, `.knowledge-drawer-overlay`, `.message-wrap`

- [ ] **Step 1: Create `_thinkingChain.scss`**

Create `/Users/jocelyn/Desktop/規劃/demosite/src/scss/components/_thinkingChain.scss` with this content:

```scss
// ── Thinking Chain Card ──────────────────────────────────────────────
.thinking-chain-card {
  background-color: var(--surface);
  border: 1px solid var(--divider);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;

  .thinking-card-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-a60);
    margin-bottom: 10px;

    .spinning-icon {
      animation: aiThinking 1.2s infinite;
      font-size: 18px;
    }

    .collapse-btn {
      margin-left: auto;
      display: flex;
      align-items: center;
      cursor: pointer;
      color: var(--text-a60);
      padding: 2px;
      border-radius: 4px;
      font-size: 18px;
      &:hover { color: var(--text); }
    }
  }

  .thinking-steps {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .thinking-step {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    color: var(--text);
    opacity: 0;
    transform: translateY(4px);
    transition: opacity 0.3s ease, transform 0.3s ease;

    &.visible {
      opacity: 1;
      transform: translateY(0);
    }

    &.last-active {
      color: var(--text-a60);
    }
  }

  .thinking-step-icon {
    font-size: 16px;
    flex-shrink: 0;
    color: var(--primary, #5b69ff);
    margin-top: 1px;
  }

  .thinking-step-body {
    flex: 1;
    line-height: 1.5;
  }

  .thinking-step-detail {
    font-size: 12px;
    color: var(--text-a60);
    margin-left: 4px;
  }

  .thinking-step-tag {
    display: inline-block;
    background-color: var(--primary-a10, rgba(91, 105, 255, 0.1));
    color: var(--primary, #5b69ff);
    border-radius: 4px;
    padding: 0 6px;
    font-size: 12px;
    margin-left: 6px;
    vertical-align: middle;
  }

  .thinking-step-spinner {
    display: inline-block;
    width: 10px;
    height: 10px;
    border: 2px solid var(--divider);
    border-top-color: var(--primary, #5b69ff);
    border-radius: 50%;
    animation: thinkingSpinStep 0.8s linear infinite;
    margin-left: 6px;
    vertical-align: middle;
  }
}

// Collapsed toggle tag
.thinking-chain-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-a60);
  cursor: pointer;
  padding: 2px 0;
  user-select: none;
  background: none;
  border: none;

  &:hover { color: var(--text); }

  .toggle-icon {
    font-size: 14px;
    transition: transform 0.2s ease;
  }
}

// ── Source chips ─────────────────────────────────────────────────────
.source-chips {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
  font-size: 12px;

  .source-chips-label {
    color: var(--text-a60);
  }

  .source-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background-color: var(--surface);
    border: 1px solid var(--divider);
    border-radius: 20px;
    padding: 3px 10px 3px 6px;
    font-size: 12px;
    cursor: pointer;
    color: var(--text);
    transition: background-color 0.15s;

    &:hover { background-color: var(--surface-hover, rgba(0, 0, 0, 0.04)); }

    i { font-size: 14px; color: var(--text-a60); }
  }
}

// ── Knowledge Source Drawer ──────────────────────────────────────────
.knowledge-drawer-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.2);
  z-index: 200;
}

.knowledge-drawer {
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: 360px;
  background-color: var(--page-bg);
  border-left: 1px solid var(--divider);
  z-index: 201;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.25s ease;

  &.open { transform: translateX(0); }

  .drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--divider);
    font-weight: 600;
    font-size: 15px;
    flex-shrink: 0;
  }

  .drawer-close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-a60);
    padding: 4px;
    border-radius: 6px;
    background: none;
    border: none;

    &:hover { background-color: var(--surface-hover, rgba(0,0,0,0.06)); }
    i { font-size: 20px; }
  }

  .drawer-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .drawer-source-group {
    .drawer-source-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 8px;
      i { font-size: 18px; color: var(--text-a60); }
    }

    .drawer-source-divider {
      border: none;
      border-top: 1px solid var(--divider);
      margin: 0 0 8px;
    }
  }

  .drawer-chunk-item {
    padding: 10px 0;
    border-bottom: 1px solid var(--divider);

    &:last-child { border-bottom: none; }

    .chunk-section-path {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-a60);
      margin-bottom: 4px;
      &::before { content: '§ '; }
    }

    .chunk-gist {
      font-size: 13px;
      color: var(--text);
      line-height: 1.5;
    }

    .chunk-citation {
      display: inline-block;
      font-size: 11px;
      color: var(--text-a40, rgba(0,0,0,0.4));
      margin-top: 4px;
    }
  }
}

@keyframes thinkingSpinStep {
  to { transform: rotate(360deg); }
}
```

- [ ] **Step 2: Register in `_index.scss`**

Open `src/scss/components/_index.scss`. Append this line at the end of the file (after the last `@import`):

```scss
@import "./thinkingChain";
```

- [ ] **Step 3: Add `.message-wrap` layout to `_AiViewer.scss`**

In `src/scss/views/_AiViewer.scss`, find the `.AiViewerRecord .content-box` rule (currently at line ~1939). Replace:

```scss
  .content-box {
    flex: 1;
    min-width: 0;
    padding: 10px 14px;
    background-color: var(--surface);
    border-radius: 12px;
    border-top-left-radius: 2px;
    line-height: 1.6;
  }
```

with:

```scss
  .message-wrap {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .content-box {
    padding: 10px 14px;
    background-color: var(--surface);
    border-radius: 12px;
    border-top-left-radius: 2px;
    line-height: 1.6;
  }
```

- [ ] **Step 4: Verify styles compile**

```bash
cd /Users/jocelyn/Desktop/規劃/demosite && npm run type-check 2>&1 | head -20
```

Expected: no SCSS-related errors (type-check doesn't compile SCSS, but ensures the project builds). If there are errors, they are unrelated to this task — note them and continue.

- [ ] **Step 5: Commit**

```bash
git add src/scss/components/_thinkingChain.scss src/scss/components/_index.scss src/scss/views/_AiViewer.scss
git commit -m "feat(thinking-chain): add SCSS for thinking card, source chips, knowledge drawer"
```

---

## Task 2: ThinkingChainCard.vue

**Files:**
- Create: `src/components/AiViewer/ThinkingChainCard.vue`

**Interfaces:**
- Consumes: CSS classes from Task 1 (`.thinking-chain-card`, `.thinking-chain-toggle`, `.thinking-step`, etc.)
- Produces:
  - `ThinkingChainCard` default export, used by Task 4
  - Props: `steps: ThinkingStep[]`, `sources: KnowledgeSource[]`, `isThinking: boolean`
  - Local types: `ThinkingStep`, `KnowledgeSource` (re-declared inline; no shared types file needed)

- [ ] **Step 1: Create ThinkingChainCard.vue**

Create `src/components/AiViewer/ThinkingChainCard.vue`:

```vue
<template>
  <div>
    <!-- Collapsed toggle (shown after thinking ends, while not expanded) -->
    <button
      v-if="!props.isThinking && !isExpanded"
      class="thinking-chain-toggle"
      @click="isExpanded = true"
    >
      <i class="material-symbols-outlined toggle-icon">mode_comment</i>
      查看推理過程
      <i class="material-symbols-outlined toggle-icon">expand_more</i>
    </button>

    <!-- Full card (shown while thinking OR manually expanded) -->
    <div v-if="props.isThinking || isExpanded" class="thinking-chain-card">
      <div class="thinking-card-header">
        <i class="material-symbols-outlined spinning-icon" v-if="props.isThinking">
          filter_vintage
        </i>
        <span>{{ props.isThinking ? 'AI 正在思考...' : '推理過程' }}</span>
        <button v-if="!props.isThinking" class="collapse-btn" @click="isExpanded = false">
          <i class="material-symbols-outlined">expand_less</i>
        </button>
      </div>

      <div class="thinking-steps">
        <div
          v-for="(step, i) in props.steps"
          :key="i"
          :class="[
            'thinking-step',
            { visible: i < visibleCount },
            { 'last-active': props.isThinking && i === visibleCount - 1 },
          ]"
        >
          <i class="material-symbols-outlined thinking-step-icon">{{ iconMap[step.type] }}</i>
          <div class="thinking-step-body">
            <span>{{ step.label }}</span>
            <template v-if="step.type === 'search'">
              <span
                v-for="src in props.sources"
                :key="src.knowledgeId"
                class="thinking-step-tag"
              >{{ src.title }}</span>
            </template>
            <span v-if="step.detail" class="thinking-step-detail">{{ step.detail }}</span>
            <span
              v-if="props.isThinking && i === visibleCount - 1"
              class="thinking-step-spinner"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onUnmounted } from 'vue'

interface ThinkingStep {
  label: string
  detail?: string
  type: 'think' | 'search' | 'synthesize'
}

interface KnowledgeSource {
  knowledgeId: string
  title: string
  chunkIndexes: number[]
}

const props = defineProps<{
  steps: ThinkingStep[]
  sources: KnowledgeSource[]
  isThinking: boolean
}>()

const iconMap: Record<ThinkingStep['type'], string> = {
  think: 'psychology',
  search: 'travel_explore',
  synthesize: 'auto_awesome',
}

const visibleCount = ref(0)
const isExpanded = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

function startAnimation() {
  visibleCount.value = 0
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    if (visibleCount.value < props.steps.length) {
      visibleCount.value++
    } else {
      clearInterval(timer!)
      timer = null
    }
  }, 800)
}

watch(
  () => props.isThinking,
  (val, oldVal) => {
    if (val) {
      // Entering thinking state: animate steps
      isExpanded.value = true
      startAnimation()
    } else if (oldVal === true) {
      // Finished thinking: show all steps, then auto-collapse after 300ms
      visibleCount.value = props.steps.length
      if (timer) { clearInterval(timer); timer = null }
      setTimeout(() => { isExpanded.value = false }, 300)
    } else {
      // Mounted already in non-thinking state (finished response re-render)
      visibleCount.value = props.steps.length
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/AiViewer/ThinkingChainCard.vue
git commit -m "feat(thinking-chain): add ThinkingChainCard component"
```

---

## Task 3: KnowledgeSourceDrawer.vue

**Files:**
- Create: `src/components/AiViewer/KnowledgeSourceDrawer.vue`

**Interfaces:**
- Consumes:
  - inject `'drawerOpen'`: `Ref<boolean>` — provided by Task 5
  - inject `'drawerSources'`: `Ref<KnowledgeSource[]>` — provided by Task 5
  - `knowledgeStore.knowledgeList` from `useKnowledgeStore()`
  - CSS classes from Task 1 (`.knowledge-drawer`, `.knowledge-drawer-overlay`, etc.)
- Produces: `KnowledgeSourceDrawer` default export, used by Task 5

- [ ] **Step 1: Create KnowledgeSourceDrawer.vue**

Create `src/components/AiViewer/KnowledgeSourceDrawer.vue`:

```vue
<template>
  <Teleport to="body">
    <template v-if="drawerOpen">
      <div class="knowledge-drawer-overlay" @click="close" />
      <div class="knowledge-drawer open">
        <div class="drawer-header">
          <span>知識來源</span>
          <button class="drawer-close-btn" @click="close">
            <i class="material-symbols-outlined">close</i>
          </button>
        </div>
        <div class="drawer-body">
          <div
            v-for="src in drawerSources"
            :key="src.knowledgeId"
            class="drawer-source-group"
          >
            <div class="drawer-source-title">
              <i class="material-symbols-outlined">book</i>
              {{ src.title }}
            </div>
            <hr class="drawer-source-divider" />
            <div
              v-for="chunk in getSrcChunks(src)"
              :key="chunk.index"
              class="drawer-chunk-item"
            >
              <div class="chunk-section-path">
                {{ chunk.sectionPath ?? `段落 ${chunk.index + 1}` }}
              </div>
              <div class="chunk-gist">
                {{ chunk.gist ?? chunk.content.slice(0, 100) }}
              </div>
              <span v-if="chunk.citationCount" class="chunk-citation">
                引用 {{ chunk.citationCount }} 次
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Teleport>
</template>

<script lang="ts" setup>
import { inject } from 'vue'
import type { Ref } from 'vue'
import { useKnowledgeStore } from '@/stores/knowledgeStore'
import type { ChunkPreview } from '@/stores/knowledgeStore'

interface KnowledgeSource {
  knowledgeId: string
  title: string
  chunkIndexes: number[]
}

const drawerOpen = inject<Ref<boolean>>('drawerOpen')!
const drawerSources = inject<Ref<KnowledgeSource[]>>('drawerSources')!

const knowledgeStore = useKnowledgeStore()

function close() {
  drawerOpen.value = false
}

function getSrcChunks(src: KnowledgeSource): ChunkPreview[] {
  const item = knowledgeStore.knowledgeList.find(k => k.id === src.knowledgeId)
  if (!item) return []
  const version = item.versions[0]
  if (!version) return []
  return src.chunkIndexes.map(idx => version.chunks[idx]).filter(Boolean)
}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/AiViewer/KnowledgeSourceDrawer.vue
git commit -m "feat(thinking-chain): add KnowledgeSourceDrawer component"
```

---

## Task 4: Modify AiViewerRecord.vue

**Files:**
- Modify: `src/components/AiViewer/AiViewerRecord.vue`

**Interfaces:**
- Consumes:
  - `ThinkingChainCard` from Task 2
  - inject `'openDrawer'`: `(sources: KnowledgeSource[]) => void` — provided by Task 5
  - `props.source.thinkingSteps?: ThinkingStep[]`
  - `props.source.sources?: KnowledgeSource[]`
  - CSS classes from Task 1 (`.message-wrap`, `.source-chips`, `.source-chip`)

- [ ] **Step 1: Replace the entire template in AiViewerRecord.vue**

The new template wraps content in `.message-wrap`, integrates ThinkingChainCard, removes the old isThinking spinner block, and adds source chips.

Replace the full `<template>` block (lines 1–110 of the current file) with:

```vue
<template>
  <div :class="['AiViewerRecord', {
    forUser: props.source.forUser,
    isThinking: props.source.isThinking,
    feedback: props.source.finishResponse
  }]">
    <!-- AI 頭像 (非使用者、非 thinking 狀態) -->
    <div class="ai-avatar" v-if="!props.source.forUser && !props.source.isThinking">AI</div>

    <div class="message-wrap">
      <!-- 思維鏈卡片：AI 訊息且有 thinkingSteps 或正在 thinking 時顯示 -->
      <ThinkingChainCard
        v-if="!props.source.forUser && (props.source.isThinking || props.source.thinkingSteps?.length)"
        :steps="props.source.thinkingSteps ?? []"
        :sources="props.source.sources ?? []"
        :isThinking="props.source.isThinking ?? false"
      />

      <!-- 訊息內容（thinking 時隱藏） -->
      <div class="content-box" v-if="!props.source.isThinking">

        <!-- 翻譯確認卡片（使用者訊息） -->
        <div class="translation-confirm-card" v-if="props.source.cardType === 'translationConfirm' && props.source.confirmed">
          <div class="tc-file-row">
            <img class="tc-file-icon" :src="excelIcon" alt="xlsx">
            <div class="tc-file-info">
              <div class="tc-file-name">{{ props.source.file }}</div>
              <div class="tc-file-meta">XLSX · {{ formatFileSize(props.source.fileSize) }}</div>
            </div>
            <button class="tc-dl-more-btn">
              <i class="material-symbols-outlined">more_horiz</i>
            </button>
          </div>
          <div class="tc-divider"></div>
          <div class="tc-info-row">
            <span class="tc-info-label">翻譯範圍</span>
            <span class="tc-info-value">{{ props.source.range }}</span>
          </div>
          <div class="tc-info-row" v-if="props.source.columns">
            <span class="tc-info-label">翻譯欄位</span>
            <span class="tc-info-value">{{ props.source.columns }}</span>
          </div>
          <div class="tc-info-row" v-else-if="props.source.range && props.source.range !== '全部工作表'">
            <span class="tc-info-label">翻譯欄位</span>
            <span class="tc-info-value tc-info-value--muted">全部欄位</span>
          </div>
          <div class="tc-info-row">
            <span class="tc-info-label">翻譯語言</span>
            <span class="tc-info-value">{{ props.source.lang }}</span>
          </div>
        </div>

        <!-- 翻譯設定尚未確認：河道上不顯示任何內容 -->
        <template v-else-if="props.source.cardType === 'translationConfirm' && !props.source.confirmed"></template>

        <!-- 翻譯完成（AI 訊息含下載檔案） -->
        <template v-else-if="props.source.cardType === 'translationComplete'">
          <div v-html="displayMsg"></div>
          <div class="tc-download-list">
            <div class="tc-download-item" v-for="file in props.source.files" :key="file.name">
              <img class="tc-dl-icon" :src="getFileIcon(file.type)" :alt="file.type">
              <div class="tc-dl-info">
                <div class="tc-dl-name">{{ file.name }}</div>
                <div class="tc-dl-meta">{{ file.type }} · {{ formatFileSize(file.size) }}</div>
              </div>
              <button class="tc-dl-more-btn">
                <i class="material-symbols-outlined">more_horiz</i>
              </button>
            </div>
          </div>
        </template>

        <!-- 下一步選擇（快速按鈕） -->
        <template v-else-if="props.source.cardType === 'nextStepPrompt'">
          <div v-html="displayMsg"></div>
          <div class="conv1-quick-btns">
            <span
              v-for="step in props.source.nextSteps"
              :key="step.msg"
              class="conv1-quick-btn"
              :data-action="'conv1-next-step'"
              :data-value="step.msg"
            >{{ step.label }}</span>
          </div>
        </template>

        <!-- 處理中訊息（含 loading 動畫） -->
        <template v-else-if="props.source.isProcessing">
          <div v-html="displayMsg"></div>
          <div class="ai-processing-dots">
            <span></span><span></span><span></span>
          </div>
        </template>

        <!-- 一般訊息 -->
        <div v-html="displayMsg" v-else></div>

        <!-- 模擬建議追問   TODO... 邏輯還未確定 -->
        <div class="suggest-asking-box" v-if="false && props.source.finishResponse">
          <div class="fw-600">建議追問</div>
          <div class="suggest-item">
            <span>請問您需要我針對 Goldenstar 系列 生成一份對比圖表，或是查看 Minimel 在不同區域的銷售分佈？</span>
            <i class="material-symbols-outlined">arrow_forward</i>
          </div>
          <div class="suggest-item">
            <span>我已經準備好這份 4 月銷售摘要的 PPT 報告草稿，需要我直接將剛才的數據圖表導出為 PowerPoint 簡報嗎？</span>
            <i class="material-symbols-outlined">arrow_forward</i>
          </div>
        </div>
      </div>

      <!-- 知識來源 Chips（回答完成且有 sources 時顯示） -->
      <div
        v-if="props.source.finishResponse && props.source.sources?.length"
        class="source-chips"
      >
        <span class="source-chips-label">參考來源：</span>
        <button
          v-for="src in props.source.sources"
          :key="src.knowledgeId"
          class="source-chip"
          @click="openDrawer(props.source.sources)"
        >
          <i class="material-symbols-outlined">book</i>
          {{ src.title }}
        </button>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Replace the `<script setup>` block**

Replace the full `<script lang="ts" setup>` block with:

```vue
<script lang="ts" setup>
import { ref, watchEffect, inject } from 'vue'
import { formatFileSize } from '@/utils/file'
import excelIcon from '@/assets/fileTypeIcon/excel.svg'
import txtIcon from '@/assets/fileTypeIcon/txt.svg'
import htmlIcon from '@/assets/fileTypeIcon/html.svg'
import pdfIcon from '@/assets/fileTypeIcon/pdf.svg'
import jsonIcon from '@/assets/fileTypeIcon/json.svg'
import ThinkingChainCard from '@/components/AiViewer/ThinkingChainCard.vue'

interface KnowledgeSource {
  knowledgeId: string
  title: string
  chunkIndexes: number[]
}

const props = defineProps<{
  source: any
  index: number
}>()

const openDrawer = inject<(sources: KnowledgeSource[]) => void>('openDrawer')!

const displayMsg = ref('')

watchEffect(() => {
  displayMsg.value = props.source.msg
})

function getFileIcon(type: string): string {
  const map: Record<string, string> = {
    XLSX: excelIcon,
    EXCEL: excelIcon,
    TXT: txtIcon,
    JSON: jsonIcon,
    HTML: htmlIcon,
    PDF: pdfIcon,
  }
  return map[type] ?? excelIcon
}
</script>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/AiViewer/AiViewerRecord.vue
git commit -m "feat(thinking-chain): integrate ThinkingChainCard and source chips in AiViewerRecord"
```

---

## Task 5: Modify AiViewerRightBox.vue — provide/inject + mock data

**Files:**
- Modify: `src/components/AiViewer/AiViewerRightBox.vue`

**Interfaces:**
- Consumes: `KnowledgeSourceDrawer` from Task 3
- Produces:
  - `provide('drawerOpen', drawerOpen)` — `Ref<boolean>`
  - `provide('drawerSources', drawerSources)` — `Ref<KnowledgeSource[]>`
  - `provide('openDrawer', openDrawer)` — `(sources: KnowledgeSource[]) => void`
  - Updated mock data: `isThinking` messages carry `thinkingSteps` + `sources`; response messages carry `thinkingSteps` + `sources`

- [ ] **Step 1: Add KnowledgeSourceDrawer import and template mount**

In `AiViewerRightBox.vue`, find the `<script lang="ts" setup>` import block and add after the existing component imports:

```typescript
import KnowledgeSourceDrawer from '@/components/AiViewer/KnowledgeSourceDrawer.vue'
```

Then in the `<template>`, find the root element of `AiViewerRightBox` (the outermost `<div class="AiViewerRightBox">` or equivalent) and add `<KnowledgeSourceDrawer />` as the last child inside it.

Search for the closing tag of the root template element and insert before it:
```html
<KnowledgeSourceDrawer />
```

- [ ] **Step 2: Add drawer state + provide**

In the `<script setup>` section, find the `provide` calls (search for `provide(`) or, if none exist yet, find a good location near the top of the script block. Add the following block — place it after the existing `ref` declarations and before `function send()`:

```typescript
// ── Drawer state (知識來源側邊抽屜) ────────────────────────────────
const drawerOpen = ref(false)
const drawerSources = ref<KnowledgeSource[]>([])

function openDrawer(sources: KnowledgeSource[]) {
  drawerSources.value = sources
  drawerOpen.value = true
}

provide('drawerOpen', drawerOpen)
provide('drawerSources', drawerSources)
provide('openDrawer', openDrawer)
```

Also add the type declaration near the top of the script, alongside other interface declarations:

```typescript
interface KnowledgeSource {
  knowledgeId: string
  title: string
  chunkIndexes: number[]
}
```

Add `provide` to the Vue import if not already there:
```typescript
import { ..., provide } from 'vue'
```

- [ ] **Step 3: Define mock thinking data constants**

Add these constants immediately before the `conv1Msgs` declaration (line ~1218):

```typescript
// Mock thinking data — injected into AI messages so ThinkingChainCard can display them
const MOCK_THINKING_STEPS = [
  { type: 'think' as const, label: '分析問題意圖' },
  { type: 'search' as const, label: '查詢知識庫', detail: '找到 2 篇相關段落' },
  { type: 'synthesize' as const, label: '整合資訊，組織回答' },
]
const MOCK_SOURCES: KnowledgeSource[] = [
  { knowledgeId: 'k5', title: '商品目錄 Q2', chunkIndexes: [0, 1] },
]
```

- [ ] **Step 4: Update `c1PushThinkingThenReply` — thinking push**

Find `c1PushThinkingThenReply` (around line 1272). Replace:

```typescript
  conv1Msgs.value.push({ id: thinkingId, isThinking: true });
```

with:

```typescript
  conv1Msgs.value.push({
    id: thinkingId,
    isThinking: true,
    thinkingSteps: MOCK_THINKING_STEPS,
    sources: MOCK_SOURCES,
  });
```

- [ ] **Step 5: Update `c1PushThinkingThenReply` — response push**

In the same function, find the `conv1Msgs.value.push({ id: 'ai-reply-...', finishResponse: true, ... })` inside the `setTimeout`. Replace:

```typescript
    conv1Msgs.value.push({
      id: 'ai-reply-' + Date.now(),
      finishResponse: true,
      cardType: 'translationComplete',
      msg: replyMsg,
      files,
    });
```

with:

```typescript
    conv1Msgs.value.push({
      id: 'ai-reply-' + Date.now(),
      finishResponse: true,
      cardType: 'translationComplete',
      msg: replyMsg,
      files,
      thinkingSteps: MOCK_THINKING_STEPS,
      sources: MOCK_SOURCES,
    });
```

- [ ] **Step 6: Update `processConv1Msg` — all `isThinking: true` pushes**

In `processConv1Msg` (around line 1299), there are several `conv1Msgs.value.push({ id: thinkingId, isThinking: true })` calls. Update each one to include the mock data. The pattern to find and replace throughout this function:

**Find** (appears on lines ~1303, ~1329, ~1412, ~1433, ~1450):
```typescript
conv1Msgs.value.push({ id: thinkingId, isThinking: true })
```

**Replace each occurrence with:**
```typescript
conv1Msgs.value.push({
  id: thinkingId,
  isThinking: true,
  thinkingSteps: MOCK_THINKING_STEPS,
  sources: MOCK_SOURCES,
})
```

Note: the semicolons vary between occurrences — match the existing style.

- [ ] **Step 7: Update `processConv1Msg` — response pushes that should carry sources**

For response messages that pair with a thinking step, add `thinkingSteps` and `sources`. Find each `conv1Msgs.value.push({ id: 'ai-reply-...' , finishResponse: true, ... })` inside `processConv1Msg` setTimeout blocks and add the two fields:

```typescript
      thinkingSteps: MOCK_THINKING_STEPS,
      sources: MOCK_SOURCES,
```

There are approximately 4 such pushes in the function (行銷自動化旅程, 旅程過於單一, 壽星, and the 圖表 one). Add the two fields to each.

- [ ] **Step 8: Commit**

```bash
git add src/components/AiViewer/AiViewerRightBox.vue
git commit -m "feat(thinking-chain): wire provide/inject and inject mock thinkingSteps+sources into AI messages"
```

---

## Task 6: Manual Smoke Test

**Files:** None modified

- [ ] **Step 1: Start dev server**

```bash
cd /Users/jocelyn/Desktop/規劃/demosite && npm run dev
```

- [ ] **Step 2: Open the AI conversation**

Navigate to the AiViewer page in browser. Send any message in conv1 (e.g., the initial translation request or "生成行銷策略").

- [ ] **Step 3: Verify thinking phase**

While `isThinking: true`, confirm:
- The old spinner icon + "AI processing" text is gone
- ThinkingChainCard is visible with animated steps appearing one by one (~800ms apart)
- The `search` step shows "商品目錄 Q2" as a blue tag
- The last visible step has a small spinning indicator

- [ ] **Step 4: Verify response phase**

After the response appears, confirm:
- ThinkingChainCard collapses to "查看推理過程 ∨" small tag above the response bubble
- Response bubble appears normally with content
- "參考來源：📚 商品目錄 Q2" chip appears below the response

- [ ] **Step 5: Verify drawer**

Click the "商品目錄 Q2" chip. Confirm:
- KnowledgeSourceDrawer slides in from the right
- Shows "📚 商品目錄 Q2" heading
- Shows chunk 0 and chunk 1 with sectionPath, gist, and citationCount
- Clicking the overlay or ✕ button closes the drawer

- [ ] **Step 6: Verify toggle**

Click "查看推理過程 ∨". Confirm:
- ThinkingChainCard expands to show all 3 steps (no animation this time — all visible immediately)
- Clicking "∧" collapse button collapses it again

- [ ] **Step 7: Final commit if any fixes were needed**

```bash
git add -p  # stage only relevant changes
git commit -m "fix(thinking-chain): address smoke test issues"
```
