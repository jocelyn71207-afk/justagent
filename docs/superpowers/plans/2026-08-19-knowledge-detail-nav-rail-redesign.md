# 知識內容頁改版：側邊導覽列 + 可收合 Metadata 抽屜 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `KnowledgeDetail.vue` 的橫向 4 分頁籤改成左側垂直導覽列，metadata 側欄改成跨分頁常駐、可收合的抽屜，主內容全寬顯示。

**Architecture:** 純 template／scss 重構，不動任何既有的 computed/store 邏輯——`activeTabKey`、`knowledge`、`activeVer` 等資料流完全不變，只是重新排版；新增一個 `isMetadataOpen` ref 控制抽屜顯示。Task 1 做重構本身，Task 2 修正被重構影響的既有測試選擇器並補上新的版面測試。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、SCSS（`src/scss/` 管理，禁止 `<style scoped>`）、Vitest + `@vue/test-utils`（沿用專案既有的 view-level component test 慣例）。

## Global Constraints

- 使用 `<script setup lang="ts">`，禁止 Options API。
- 樣式統一在 `src/scss/` 管理，禁止 `<style scoped>`；本次不新增 scss 檔案，所有變動都在既有的 `src/scss/views/_KnowledgeDetail.scss` 裡。
- 不新增 Vue component、不新增 store、不接新的 API；`ChunkPreviewTab.vue`／`ConversionLogTab.vue` 兩個委派元件與 5 個 Modal/Drawer 的行為完全不動。
- 4 個分頁的內容（概覽／版本歷程／分段預覽／轉換結果）本身逐字保留，只搬動容器結構，不改動裡面的資料綁定或按鈕行為。
- Metadata 抽屜（版本資訊／分類與標籤／Pipeline／來源附件）四個導覽項目切換時都要維持存在，不能隨 `activeTabKey` 改變而被卸載或重新渲染。
- `isMetadataOpen` 預設 `true`，不做 localStorage 或任何形式的持久化。

---

## Task 1: 版面重構（導覽列 + 主內容 + metadata 抽屜）

**Files:**
- Modify: `src/views/KnowledgeDetail.vue`（template 第 15-63 行的 header 動作區、第 65-252 行的分頁籤與 4 個分頁面板、第 376-382 行的 `tabs`／`activeTabKey` script）
- Modify: `src/scss/views/_KnowledgeDetail.scss`（第 72-127 行）

**Interfaces:**
- Produces: `isMetadataOpen: Ref<boolean>`（新增）、`tabs` 陣列每個項目新增 `icon: string` 欄位。兩者都只在這個檔案內使用，沒有其他任務依賴它們的介面，但 Task 2 的測試會斷言這兩者的行為。

- [ ] **Step 1: `tabs` 陣列新增 `icon` 欄位**

`src/views/KnowledgeDetail.vue` 第 376-381 行，把：

```ts
const tabs = [
  { key: 'overview', label: '概覽' },
  { key: 'history', label: '版本歷程' },
  { key: 'chunks', label: '分段預覽' },
  { key: 'conversion', label: '轉換結果' },
]
```

改為：

```ts
const tabs = [
  { key: 'overview', label: '概覽', icon: 'description' },
  { key: 'history', label: '版本歷程', icon: 'history' },
  { key: 'chunks', label: '分段預覽', icon: 'view_agenda' },
  { key: 'conversion', label: '轉換結果', icon: 'sync_alt' },
]
```

- [ ] **Step 2: 新增 `isMetadataOpen` 狀態**

同一個檔案，在 `const activeTabKey = ref('overview')`（第 382 行，Step 1 改完後這行不動）後面新增一行：

```ts
const isMetadataOpen = ref(true)
```

- [ ] **Step 3: Header 新增 metadata 切換按鈕**

`src/views/KnowledgeDetail.vue` 第 23 行：

```html
        <div class="header-right-box">
```

改為（在 `header-right-box` 內、最前面插入切換按鈕，其餘既有內容不動）：

```html
        <div class="header-right-box">
          <button class="custom-btn" @click="isMetadataOpen = !isMetadataOpen">
            <i class="material-symbols-outlined">{{ isMetadataOpen ? 'right_panel_close' : 'right_panel_open' }}</i>
            {{ isMetadataOpen ? '隱藏詳細資訊' : '顯示詳細資訊' }}
          </button>
```

（後面接原本第 24 行開始的 `<template v-if="knowledge.status === 'active'">...` 一路到第 62 行的 `</template>`，都不動。）

- [ ] **Step 4: 分頁籤 + 4 個分頁面板改成導覽列 + 主內容 + metadata 抽屜**

把（第 65-252 行，完整區塊）：

```html
      <!-- 4 Tabs -->
      <div class="detail-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['detail-tab-btn', { 'is-active': activeTabKey === tab.key }]"
          @click="activeTabKey = tab.key"
        >{{ tab.label }}</button>
      </div>

      <!-- Tab 1: 概覽 -->
      <div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'overview' }]">

        <!-- Pipeline 審核提示 banner -->
        <div v-if="isPipelineReview" class="pipeline-review-banner">
          <i class="material-symbols-outlined">smart_toy</i>
          <span>此條目由 Pipeline 處理完成，以下為 AI 生成的知識摘要。請切換至「分段預覽」審查內容品質，確認無誤後點擊「開始審核」批准發佈。</span>
        </div>

        <div class="detail-overview-grid">

          <!-- 左：內容預覽 -->
          <div class="content-preview">
            <div class="article-meta">
              <span class="fc-grey-1 fs-14">{{ activeVer?.summary || '（無摘要）' }}</span>
            </div>
            <div class="article-body">
              <div class="markdown-body" v-html="renderedContent"></div>
            </div>
          </div>

          <!-- 右：側欄 -->
          <div class="detail-sidebar-card">
            <!-- 版本 & 狀態 -->
            <div class="sidebar-section">
              <div class="sidebar-section-title">版本資訊</div>
              <div class="d-flex flex-wrap gap-2 align-items-center mb-3">
                <span class="version-badge" :class="{ major: activeVer?.versionNumber?.endsWith('.0') }">
                  {{ activeVer?.versionNumber }}
                </span>
                <span :class="['status-badge', `status-badge--${activeVer?.status}`]">
                  {{ statusLabelMap[activeVer?.status ?? ''] }}
                </span>
                <span v-if="activeVer?.versionType" class="tag-chip">{{ activeVer.versionType }}</span>
              </div>
              <div class="sidebar-row">
                <span class="sidebar-label">更新人</span>
                <span>{{ activeVer?.lastUpdateBy }}</span>
              </div>
              <div class="sidebar-row">
                <span class="sidebar-label">更新時間</span>
                <span>{{ activeVer?.lastUpdateTime }}</span>
              </div>
              <div v-if="activeVer?.updateNote" class="sidebar-row sidebar-row--top">
                <span class="sidebar-label">說明</span>
                <span class="fc-grey-1">{{ activeVer.updateNote }}</span>
              </div>
            </div>

            <div class="sidebar-divider"></div>

            <!-- 分類 & 標籤 -->
            <div class="sidebar-section">
              <div class="sidebar-row">
                <span class="sidebar-label">分類</span>
                <span class="category-tag">{{ knowledge.category }}</span>
              </div>
              <div class="sidebar-row sidebar-row--top">
                <span class="sidebar-label">標籤</span>
                <div class="d-flex flex-wrap gap-1">
                  <span
                    v-for="tag in activeVer?.tags"
                    :key="tag"
                    :class="['tag-chip', { 'tag-chip--system': activeVer?.systemTags?.includes(tag) }]"
                  >
                    <i v-if="activeVer?.systemTags?.includes(tag)" class="material-symbols-outlined fs-11 mr-1">smart_toy</i>
                    {{ tag }}
                  </span>
                  <span v-if="!activeVer?.tags?.length" class="fc-grey-1 fs-13">無標籤</span>
                </div>
              </div>
            </div>

            <div class="sidebar-divider"></div>

            <!-- Pipeline -->
            <div class="sidebar-section">
              <div class="sidebar-section-title">Pipeline</div>
              <template v-if="knowledge.status === 'processing'">
                <div class="pipeline-progress-wrap">
                  <div class="pipeline-progress-bar" style="flex:1; max-width:120px;">
                    <div class="pipeline-progress-fill" :style="{ width: knowledge.pipelineProgress + '%' }"></div>
                  </div>
                  <span class="pipeline-stage-label">{{ pipelineStageLabelMap[knowledge.pipelineStage ?? ''] ?? knowledge.pipelineStage }} {{ knowledge.pipelineProgress }}%</span>
                </div>
              </template>
              <template v-else>
                <div class="pipeline-stages">
                  <span class="pipeline-stage-badge is-done"><i class="material-symbols-outlined">check</i>分段</span>
                  <span class="pipeline-stage-badge is-done"><i class="material-symbols-outlined">check</i>向量化</span>
                  <span class="pipeline-stage-badge is-done"><i class="material-symbols-outlined">check</i>建立索引</span>
                </div>
              </template>
              <div v-if="knowledge.pipelineError" class="fs-12 mt-2 pipeline-error-text">
                {{ knowledge.pipelineError }}
              </div>
            </div>

            <div class="sidebar-divider"></div>

            <!-- 來源附件 -->
            <div class="sidebar-section">
              <div class="sidebar-section-title">來源附件</div>
              <div v-if="activeVer?.sourceFiles?.length" class="d-flex flex-column gap-2">
                <div
                  v-for="f in activeVer.sourceFiles"
                  :key="f.fileId"
                  class="sidebar-file-item"
                >
                  <i class="material-symbols-outlined fs-14">description</i>
                  <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ f.fileName }}</span>
                  <button
                    class="custom-btn fs-11 py-0 px-2"
                    style="white-space:nowrap;"
                    @click="openFilePreview(f.fileId, f.fileName)"
                  >查看原檔</button>
                </div>
              </div>
              <div v-else class="fc-grey-1 fs-13">尚未關聯任何來源檔案</div>
            </div>
          </div>

        </div>
      </div>

      <!-- Tab 2: 版本歷程 -->
      <div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'history' }]">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="fc-grey-1 fs-13">共 {{ knowledge.versions.length }} 個版本</div>
        </div>
        <div class="version-timeline lively-stagger">
          <div
            v-for="(ver, idx) in [...knowledge.versions].reverse()"
            :key="ver.id"
            class="version-timeline-item lively-card"
          >
            <div class="version-timeline-node">
              <div :class="['node-dot', { 'is-active': ver.status === 'active' }]"></div>
              <div v-if="idx < knowledge.versions.length - 1" class="node-line"></div>
            </div>
            <div class="version-timeline-body">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <div class="d-flex gap-2 align-items-center">
                  <span class="fw-600 fs-14">{{ ver.versionNumber }}</span>
                  <span :class="['status-badge', `status-badge--${ver.status}`]">{{ statusLabelMap[ver.status] }}</span>
                  <span v-if="ver.versionType" class="tag-chip">{{ ver.versionType }}</span>
                </div>
                <span class="fc-grey-1 fs-13">{{ ver.lastUpdateTime }}</span>
              </div>
              <div class="fc-grey-1 fs-13">{{ ver.updateNote }} ・ {{ ver.lastUpdateBy }}</div>
              <div v-if="ver.status === 'history'" class="d-flex gap-2 mt-2">
                <button class="custom-btn fs-12 py-1 px-2" @click="openRestore(ver.id)">
                  <i class="material-symbols-outlined fs-14">restore</i>還原為草稿
                </button>
                <button class="custom-btn fs-12 py-1 px-2" @click="openCompare(ver.id)">
                  <i class="material-symbols-outlined fs-14">compare</i>與目前版比較
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 3: 分段預覽 -->
      <div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'chunks' }]">
        <ChunkPreviewTab
          :chunks="activeVer?.chunks ?? []"
          :source-type="knowledge.sourceType"
        />
      </div>

      <!-- Tab 4: 轉換結果 -->
      <div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'conversion' }]">
        <ConversionLogTab
          :conversion-log="activeVer?.conversionLog ?? []"
          :status="knowledge.status"
        />
      </div>
```

改為：

```html
      <!-- 導覽列 + 主內容 + metadata 抽屜 -->
      <div class="detail-shell">

        <!-- 左：導覽列 -->
        <div class="detail-nav-rail">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="['detail-nav-item', { 'is-active': activeTabKey === tab.key }]"
            @click="activeTabKey = tab.key"
          >
            <i class="material-symbols-outlined">{{ tab.icon }}</i>
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <!-- 中：主內容 -->
        <div class="detail-main">

          <!-- Tab 1: 概覽 -->
          <div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'overview' }]">

            <!-- Pipeline 審核提示 banner -->
            <div v-if="isPipelineReview" class="pipeline-review-banner">
              <i class="material-symbols-outlined">smart_toy</i>
              <span>此條目由 Pipeline 處理完成，以下為 AI 生成的知識摘要。請切換至「分段預覽」審查內容品質，確認無誤後點擊「開始審核」批准發佈。</span>
            </div>

            <div class="content-preview">
              <div class="article-meta">
                <span class="fc-grey-1 fs-14">{{ activeVer?.summary || '（無摘要）' }}</span>
              </div>
              <div class="article-body">
                <div class="markdown-body" v-html="renderedContent"></div>
              </div>
            </div>
          </div>

          <!-- Tab 2: 版本歷程 -->
          <div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'history' }]">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div class="fc-grey-1 fs-13">共 {{ knowledge.versions.length }} 個版本</div>
            </div>
            <div class="version-timeline lively-stagger">
              <div
                v-for="(ver, idx) in [...knowledge.versions].reverse()"
                :key="ver.id"
                class="version-timeline-item lively-card"
              >
                <div class="version-timeline-node">
                  <div :class="['node-dot', { 'is-active': ver.status === 'active' }]"></div>
                  <div v-if="idx < knowledge.versions.length - 1" class="node-line"></div>
                </div>
                <div class="version-timeline-body">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <div class="d-flex gap-2 align-items-center">
                      <span class="fw-600 fs-14">{{ ver.versionNumber }}</span>
                      <span :class="['status-badge', `status-badge--${ver.status}`]">{{ statusLabelMap[ver.status] }}</span>
                      <span v-if="ver.versionType" class="tag-chip">{{ ver.versionType }}</span>
                    </div>
                    <span class="fc-grey-1 fs-13">{{ ver.lastUpdateTime }}</span>
                  </div>
                  <div class="fc-grey-1 fs-13">{{ ver.updateNote }} ・ {{ ver.lastUpdateBy }}</div>
                  <div v-if="ver.status === 'history'" class="d-flex gap-2 mt-2">
                    <button class="custom-btn fs-12 py-1 px-2" @click="openRestore(ver.id)">
                      <i class="material-symbols-outlined fs-14">restore</i>還原為草稿
                    </button>
                    <button class="custom-btn fs-12 py-1 px-2" @click="openCompare(ver.id)">
                      <i class="material-symbols-outlined fs-14">compare</i>與目前版比較
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab 3: 分段預覽 -->
          <div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'chunks' }]">
            <ChunkPreviewTab
              :chunks="activeVer?.chunks ?? []"
              :source-type="knowledge.sourceType"
            />
          </div>

          <!-- Tab 4: 轉換結果 -->
          <div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'conversion' }]">
            <ConversionLogTab
              :conversion-log="activeVer?.conversionLog ?? []"
              :status="knowledge.status"
            />
          </div>

        </div>

        <!-- 右：metadata 抽屜（4 個導覽項目共用，不隨 activeTabKey 卸載） -->
        <div v-if="isMetadataOpen" class="detail-metadata-drawer">
          <!-- 版本 & 狀態 -->
          <div class="sidebar-section">
            <div class="sidebar-section-title">版本資訊</div>
            <div class="d-flex flex-wrap gap-2 align-items-center mb-3">
              <span class="version-badge" :class="{ major: activeVer?.versionNumber?.endsWith('.0') }">
                {{ activeVer?.versionNumber }}
              </span>
              <span :class="['status-badge', `status-badge--${activeVer?.status}`]">
                {{ statusLabelMap[activeVer?.status ?? ''] }}
              </span>
              <span v-if="activeVer?.versionType" class="tag-chip">{{ activeVer.versionType }}</span>
            </div>
            <div class="sidebar-row">
              <span class="sidebar-label">更新人</span>
              <span>{{ activeVer?.lastUpdateBy }}</span>
            </div>
            <div class="sidebar-row">
              <span class="sidebar-label">更新時間</span>
              <span>{{ activeVer?.lastUpdateTime }}</span>
            </div>
            <div v-if="activeVer?.updateNote" class="sidebar-row sidebar-row--top">
              <span class="sidebar-label">說明</span>
              <span class="fc-grey-1">{{ activeVer.updateNote }}</span>
            </div>
          </div>

          <div class="sidebar-divider"></div>

          <!-- 分類 & 標籤 -->
          <div class="sidebar-section">
            <div class="sidebar-row">
              <span class="sidebar-label">分類</span>
              <span class="category-tag">{{ knowledge.category }}</span>
            </div>
            <div class="sidebar-row sidebar-row--top">
              <span class="sidebar-label">標籤</span>
              <div class="d-flex flex-wrap gap-1">
                <span
                  v-for="tag in activeVer?.tags"
                  :key="tag"
                  :class="['tag-chip', { 'tag-chip--system': activeVer?.systemTags?.includes(tag) }]"
                >
                  <i v-if="activeVer?.systemTags?.includes(tag)" class="material-symbols-outlined fs-11 mr-1">smart_toy</i>
                  {{ tag }}
                </span>
                <span v-if="!activeVer?.tags?.length" class="fc-grey-1 fs-13">無標籤</span>
              </div>
            </div>
          </div>

          <div class="sidebar-divider"></div>

          <!-- Pipeline -->
          <div class="sidebar-section">
            <div class="sidebar-section-title">Pipeline</div>
            <template v-if="knowledge.status === 'processing'">
              <div class="pipeline-progress-wrap">
                <div class="pipeline-progress-bar" style="flex:1; max-width:120px;">
                  <div class="pipeline-progress-fill" :style="{ width: knowledge.pipelineProgress + '%' }"></div>
                </div>
                <span class="pipeline-stage-label">{{ pipelineStageLabelMap[knowledge.pipelineStage ?? ''] ?? knowledge.pipelineStage }} {{ knowledge.pipelineProgress }}%</span>
              </div>
            </template>
            <template v-else>
              <div class="pipeline-stages">
                <span class="pipeline-stage-badge is-done"><i class="material-symbols-outlined">check</i>分段</span>
                <span class="pipeline-stage-badge is-done"><i class="material-symbols-outlined">check</i>向量化</span>
                <span class="pipeline-stage-badge is-done"><i class="material-symbols-outlined">check</i>建立索引</span>
              </div>
            </template>
            <div v-if="knowledge.pipelineError" class="fs-12 mt-2 pipeline-error-text">
              {{ knowledge.pipelineError }}
            </div>
          </div>

          <div class="sidebar-divider"></div>

          <!-- 來源附件 -->
          <div class="sidebar-section">
            <div class="sidebar-section-title">來源附件</div>
            <div v-if="activeVer?.sourceFiles?.length" class="d-flex flex-column gap-2">
              <div
                v-for="f in activeVer.sourceFiles"
                :key="f.fileId"
                class="sidebar-file-item"
              >
                <i class="material-symbols-outlined fs-14">description</i>
                <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ f.fileName }}</span>
                <button
                  class="custom-btn fs-11 py-0 px-2"
                  style="white-space:nowrap;"
                  @click="openFilePreview(f.fileId, f.fileName)"
                >查看原檔</button>
              </div>
            </div>
            <div v-else class="fc-grey-1 fs-13">尚未關聯任何來源檔案</div>
          </div>
        </div>

      </div>
```

**逐行核對這是純粹的搬動，不是重寫**：概覽/版本歷程/分段預覽/轉換結果 4 個 `detail-tab-panel` 的內容、`pipeline-review-banner`、`content-preview`、`sidebar-section` × 4 全部逐字保留，只是換了容器（`detail-tabs`→`detail-nav-rail`、`detail-overview-grid` 拆開成 `detail-main` + `detail-metadata-drawer`）。複製貼上時請逐字比對，不要手動重打這些內容。

- [ ] **Step 5: SCSS — 導覽列樣式**

`src/scss/views/_KnowledgeDetail.scss` 第 72-100 行，把：

```scss
  // ── KnowledgeDetail 4-Tab ──
  .detail-tabs {
    display: flex;
    border-bottom: 2px solid var(--divider);
    margin-bottom: 16px;
  }

  .detail-tab-btn {
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-faint);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;

    &.is-active {
      color: var(--primary);
      border-bottom-color: var(--primary);
      font-weight: 700;
    }

    &:hover:not(.is-active) {
      color: var(--text);
    }
  }
```

改為：

```scss
  // ── KnowledgeDetail 版面骨架：左側導覽列 ──
  .detail-shell {
    display: flex;
    align-items: flex-start;
    gap: 20px;

    @media (max-width: 960px) {
      flex-direction: column;
    }
  }

  .detail-nav-rail {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 104px;
    flex-shrink: 0;
    background: var(--sidebar-bg);
    border: 1px solid var(--divider-a50);
    border-radius: 14px;
    padding: 10px 6px;

    @media (max-width: 960px) {
      width: 100%;
      flex-direction: row;
      overflow-x: auto;
    }
  }

  .detail-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 10px 4px;
    border-radius: 10px;
    border: none;
    background: transparent;
    color: var(--text-faint);
    font-size: 11px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;

    .material-symbols-outlined { font-size: 20px; }

    &.is-active {
      background: var(--surface);
      color: var(--primary);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
      font-weight: 700;
    }

    &:hover:not(.is-active) { color: var(--text); }
  }
```

- [ ] **Step 6: SCSS — 主內容區與 metadata 抽屜樣式**

同一個檔案，`.detail-tab-panel` 規則（Step 5 完成後緊接著的區塊）維持不動：

```scss
  .detail-tab-panel {
    display: none;
    &.is-active { display: block; }
  }
```

它後面的（原第 107-127 行）：

```scss
  // 概覽 Tab：主內容 + 固定寬度側欄
  .detail-overview-grid {
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: 20px;
    align-items: start;

    @media (max-width: 960px) {
      grid-template-columns: 1fr;
    }
  }

  // 側欄單卡片
  .detail-sidebar-card {
    background: var(--page-bg);
    border: 1px solid var(--divider-a50);
    border-radius: 16px;
    overflow: hidden;
    position: sticky;
    top: 20px;
  }
```

改為：

```scss
  .detail-main {
    flex: 1;
    min-width: 0;
  }

  // metadata 抽屜（跨 4 個導覽項目共用，不隨 activeTabKey 卸載）
  .detail-metadata-drawer {
    width: 280px;
    flex-shrink: 0;
    background: var(--page-bg);
    border: 1px solid var(--divider-a50);
    border-radius: 16px;
    overflow: hidden;
    position: sticky;
    top: 20px;

    @media (max-width: 960px) {
      width: 100%;
      position: static;
    }
  }
```

`.sidebar-section`／`.sidebar-section-title`／`.sidebar-divider`／`.sidebar-row`／`.sidebar-label`／`.sidebar-file-item`（緊接在後面）維持完全不動。

- [ ] **Step 7: 型別檢查**

Run: `npm run type-check`
Expected: 無錯誤（若看到跟這次改動無關的既有型別錯誤，先確認是不是修改前就存在——參考本 repo 近期慣例，`useBreadcrumb.ts` 有 3 個已知、跟這次改動無關的既有錯誤，不用管）。

- [ ] **Step 8: 手動驗證**

Run: `npm run dev`：
1. 進入任一知識項目詳情頁，確認左側是垂直導覽列（4 個圖示＋文字：概覽/版本歷程/分段預覽/轉換結果），右側是 metadata 抽屜，中間主內容全寬顯示。
2. 點導覽列切到「版本歷程」，確認右側抽屜（版本號、狀態、標籤、Pipeline、來源附件）仍然顯示，沒有消失。再切到「分段預覽」「轉換結果」重複確認。
3. 點 header 的「隱藏詳細資訊」按鈕，確認抽屜收起、主內容區變寬；按鈕文字變成「顯示詳細資訊」；再點一次確認恢復。
4. 確認 Pipeline 審核提示 banner（若該知識項目狀態符合條件）只在「概覽」導覽項目顯示。
5. 縮小視窗到 960px 以下，確認導覽列變成橫向排列、metadata 抽屜變成全寬堆疊在下方，沒有破版。

- [ ] **Step 9: Commit**

```bash
git add src/views/KnowledgeDetail.vue src/scss/views/_KnowledgeDetail.scss
git commit -m "redesign(KnowledgeDetail): tabs → left nav rail + persistent metadata drawer

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: 修正既有測試選擇器 + 新增版面測試

**Files:**
- Modify: `src/views/__tests__/KnowledgeDetail.tokens.test.ts`（第 61 行的選擇器）
- Create: `src/views/__tests__/KnowledgeDetail.layout.test.ts`

**Interfaces:**
- Consumes: Task 1 的 `.detail-nav-item`（取代 `.detail-tab-btn`）、`.detail-metadata-drawer`（取代 `.detail-sidebar-card`）、`isMetadataOpen`（透過切換按鈕操作，不直接存取元件內部狀態）。

- [ ] **Step 1: 修正 `KnowledgeDetail.tokens.test.ts` 的選擇器**

`src/views/__tests__/KnowledgeDetail.tokens.test.ts` 第 61 行，把：

```ts
    const historyTabBtn = wrapper.findAll('.detail-tab-btn').find(b => b.text().includes('版本歷程'))
```

改為：

```ts
    const historyTabBtn = wrapper.findAll('.detail-nav-item').find(b => b.text().includes('版本歷程'))
```

（這是唯一需要改的地方——這個測試檔案其他斷言、`describe`/`it` 文字、mount 設定都不動。）

- [ ] **Step 2: 執行既有測試確認修正生效**

Run: `npx vitest run src/views/__tests__/KnowledgeDetail.tokens.test.ts`
Expected: PASS（2 個既有測試都通過；如果 Task 1 還沒完成或沒做對，這裡會因為找不到 `.detail-nav-item` 而失敗——這個 Step 隱含驗證 Task 1 的導覽列渲染是正確的）。

- [ ] **Step 3: 寫 `KnowledgeDetail.layout.test.ts`**

建立 `src/views/__tests__/KnowledgeDetail.layout.test.ts`，mount 設定沿用 `KnowledgeDetail.tokens.test.ts` 現成的 stub 清單：

```ts
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import KnowledgeDetail from '../KnowledgeDetail.vue'
import { useKnowledgeStore } from '@/stores/knowledgeStore'

async function mountDetail() {
  setActivePinia(createPinia())
  const knowledgeStore = useKnowledgeStore()
  const knowledgeId = knowledgeStore.knowledgeList[0].id
  const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
  const wrapper = mount(KnowledgeDetail, {
    props: { id: knowledgeId },
    global: {
      plugins: [router],
      stubs: { AppSkeleton: true, AppErrorState: true, AppBreadcrumb: true, CreateVersionModal: true, RestoreVersionModal: true, VersionCompareModal: true, ReviewDrawer: true, FilePreviewModal: true, ChunkPreviewTab: true, ConversionLogTab: true },
    },
  })
  await flushPromises()
  await new Promise(resolve => setTimeout(resolve, 600))
  return wrapper
}

describe('KnowledgeDetail 導覽列改版', () => {
  it('左側導覽列渲染 4 個項目，文字依序為概覽/版本歷程/分段預覽/轉換結果', async () => {
    const wrapper = await mountDetail()
    const items = wrapper.findAll('.detail-nav-item')
    expect(items.length).toBe(4)
    expect(items.map(i => i.text())).toEqual(['概覽', '版本歷程', '分段預覽', '轉換結果'])
  })

  it('點擊「版本歷程」導覽項目後，對應分頁內容變成可見', async () => {
    const wrapper = await mountDetail()
    const historyItem = wrapper.findAll('.detail-nav-item').find(i => i.text().includes('版本歷程'))
    expect(historyItem).toBeTruthy()
    await historyItem!.trigger('click')
    const historyPanel = wrapper.find('.version-timeline').element.closest('.detail-tab-panel')
    expect(historyPanel?.className).toContain('is-active')
  })

  it('metadata 抽屜預設展開，點擊切換按鈕後隱藏，再點一次恢復', async () => {
    const wrapper = await mountDetail()
    expect(wrapper.find('.detail-metadata-drawer').exists()).toBe(true)

    const toggleBtn = wrapper.findAll('button').find(b => b.text().includes('隱藏詳細資訊'))
    expect(toggleBtn).toBeTruthy()
    await toggleBtn!.trigger('click')
    expect(wrapper.find('.detail-metadata-drawer').exists()).toBe(false)

    const reopenBtn = wrapper.findAll('button').find(b => b.text().includes('顯示詳細資訊'))
    expect(reopenBtn).toBeTruthy()
    await reopenBtn!.trigger('click')
    expect(wrapper.find('.detail-metadata-drawer').exists()).toBe(true)
  })

  it('切換導覽項目時，metadata 抽屜不會被卸載', async () => {
    const wrapper = await mountDetail()
    const chunksItem = wrapper.findAll('.detail-nav-item').find(i => i.text().includes('分段預覽'))
    await chunksItem!.trigger('click')
    expect(wrapper.find('.detail-metadata-drawer').exists()).toBe(true)

    const conversionItem = wrapper.findAll('.detail-nav-item').find(i => i.text().includes('轉換結果'))
    await conversionItem!.trigger('click')
    expect(wrapper.find('.detail-metadata-drawer').exists()).toBe(true)
  })
})
```

- [ ] **Step 4: 執行新測試確認通過**

Run: `npx vitest run src/views/__tests__/KnowledgeDetail.layout.test.ts`
Expected: PASS（4 個測試全過）。

- [ ] **Step 5: 執行完整測試套件確認沒有回歸**

Run: `npx vitest run`
Expected: 全部通過，沒有其他測試檔案因為這次改動而變紅。

- [ ] **Step 6: Commit**

```bash
git add src/views/__tests__/KnowledgeDetail.tokens.test.ts src/views/__tests__/KnowledgeDetail.layout.test.ts
git commit -m "test(KnowledgeDetail): fix nav-rail selector, add layout coverage for new shell

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```
