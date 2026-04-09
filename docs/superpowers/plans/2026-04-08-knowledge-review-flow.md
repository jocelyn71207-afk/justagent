# 知識庫審核流程 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 補全知識庫審核方的通過/退回流程，包含資料模型、store actions、ReviewDrawer 元件，以及列表頁與詳情頁的入口串接。

**Architecture:** 以右側抽屜（ReviewDrawer）作為審核操作介面，和現有 VersionHistoryDrawer 採相同的 fixed panel 模式。store 新增 `approveVersion`、`rejectVersion`、`withdrawReview` 三個 action，確保狀態轉換與 reviewHistory 稽核紀錄同步寫入。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Pinia、SCSS（全域樣式，無 scoped）

---

## 檔案地圖

| 動作 | 路徑 | 說明 |
|------|------|------|
| 修改 | `src/stores/knowledgeStore.ts` | 新增 interface、補 submitForReview、新增 approve/reject/withdraw |
| 新建 | `src/components/Knowledge/ReviewDrawer.vue` | 審核抽屜元件 |
| 修改 | `src/views/KnowledgeBase.vue` | 更多選單加「審核」入口、統計卡可點篩選 |
| 修改 | `src/views/KnowledgeDetail.vue` | 加「開始審核」按鈕、實作「撤回審核」 |
| 修改 | `src/components/Knowledge/VersionHistoryDrawer.vue` | 每個版本下方顯示 reviewHistory 時間軸 |
| 修改 | `src/scss/views/_KnowledgeBase.scss` | ReviewDrawer 樣式、review-history 時間軸樣式 |

---

## Task 1：擴充 knowledgeStore 資料結構與 store actions

**Files:**
- Modify: `src/stores/knowledgeStore.ts`

- [ ] **Step 1：新增 ReviewRecord interface 與擴充 KnowledgeVersion**

在 `src/stores/knowledgeStore.ts` 的 `SourceFileRef` interface 下方加入：

```ts
export interface ReviewRecord {
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN'
  by: string
  time: string
  note?: string
}
```

將 `KnowledgeVersion` 新增欄位（在 `sourceFiles` 之後）：

```ts
  reviewNote?: string
  reviewedBy?: string
  reviewedTime?: string
  reviewFeedback?: string
  reviewHistory?: ReviewRecord[]
```

- [ ] **Step 2：修正 submitForReview，補寫 reviewNote 與 reviewHistory**

將現有 `submitForReview` 函式替換為：

```ts
const submitForReview = (knowledgeId: string, versionId: string, reviewerId: string, note: string) => {
  const k = getKnowledgeById(knowledgeId);
  if (!k) return;
  const v = k.versions.find(ver => ver.id === versionId);
  if (v && (v.status === 'DRAFT' || v.status === 'REJECTED')) {
    v.status = 'REVIEWING';
    v.reviewNote = note;
    v.reviewHistory = [
      ...(v.reviewHistory ?? []),
      {
        action: 'SUBMITTED',
        by: reviewerId,
        time: new Date().toISOString().replace('T', ' ').slice(0, 16),
        note,
      },
    ];
    k.status = 'REVIEWING';
  }
};
```

- [ ] **Step 3：新增 approveVersion**

在 `restoreToDraft` 函式之後加入：

```ts
const approveVersion = (knowledgeId: string, versionId: string) => {
  const k = getKnowledgeById(knowledgeId);
  if (!k) return;
  const v = k.versions.find(ver => ver.id === versionId);
  if (!v || v.status !== 'REVIEWING') return;

  const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

  // 前一個 PUBLISHED 轉為 HISTORY
  for (const ver of k.versions) {
    if (ver.status === 'PUBLISHED') ver.status = 'HISTORY';
  }

  v.status = 'PUBLISHED';
  v.reviewedBy = 'Current User';
  v.reviewedTime = now;
  v.reviewHistory = [
    ...(v.reviewHistory ?? []),
    { action: 'APPROVED', by: 'Current User', time: now },
  ];

  k.status = 'PUBLISHED';
  k.currentVersion = v.versionNumber;
  k.lastUpdateTime = now;
};
```

- [ ] **Step 4：新增 rejectVersion**

```ts
const rejectVersion = (knowledgeId: string, versionId: string, feedback?: string) => {
  const k = getKnowledgeById(knowledgeId);
  if (!k) return;
  const v = k.versions.find(ver => ver.id === versionId);
  if (!v || v.status !== 'REVIEWING') return;

  const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

  v.status = 'REJECTED';
  v.reviewFeedback = feedback;
  v.reviewHistory = [
    ...(v.reviewHistory ?? []),
    { action: 'REJECTED', by: 'Current User', time: now, note: feedback },
  ];

  k.status = 'REJECTED';
};
```

- [ ] **Step 5：新增 withdrawReview**

```ts
const withdrawReview = (knowledgeId: string, versionId: string) => {
  const k = getKnowledgeById(knowledgeId);
  if (!k) return;
  const v = k.versions.find(ver => ver.id === versionId);
  if (!v || v.status !== 'REVIEWING') return;

  const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

  v.status = 'DRAFT';
  v.reviewHistory = [
    ...(v.reviewHistory ?? []),
    { action: 'WITHDRAWN', by: 'Current User', time: now },
  ];

  k.status = 'DRAFT';
};
```

- [ ] **Step 6：將五個新 action 加入 return 物件**

在 `return {` 的物件裡加入：

```ts
approveVersion,
rejectVersion,
withdrawReview,
```

- [ ] **Step 7：Commit**

```bash
git add src/stores/knowledgeStore.ts
git commit -m "feat(store): add ReviewRecord, approveVersion, rejectVersion, withdrawReview"
```

---

## Task 2：建立 ReviewDrawer.vue 元件

**Files:**
- Create: `src/components/Knowledge/ReviewDrawer.vue`

- [ ] **Step 1：建立元件檔案**

建立 `src/components/Knowledge/ReviewDrawer.vue`：

```vue
<template>
  <div v-if="modelValue" class="drawer-root">
    <!-- 遮罩 -->
    <div
      class="swal2-container swal2-backdrop-show"
      style="z-index: 1061;"
      @click.self="close"
    ></div>

    <!-- Drawer 面板 -->
    <div class="KnowledgeBase drawer-panel review-drawer-panel" :class="{ open: modelValue }">

      <!-- Header -->
      <div class="drawer-header p-4 d-flex justify-content-between align-items-center">
        <h5 class="drawer-title fw-700 mb-0 d-flex align-items-center">
          <i class="material-symbols-outlined mr-2">rate_review</i>
          審核申請
        </h5>
        <i class="material-symbols-outlined cursor-pointer fc-grey-1" @click="close">close</i>
      </div>

      <!-- Body -->
      <div class="drawer-body" v-if="knowledge && version">

        <!-- 條目 + 版本資訊 -->
        <div class="review-info-section">
          <div class="review-meta-row">
            <div class="knowledge-icon mr-3">
              <i class="material-symbols-outlined">menu_book</i>
            </div>
            <div>
              <div class="fs-16 fw-700">{{ knowledge.title }}</div>
              <div class="d-flex align-items-center gap-2 mt-1">
                <span class="version-badge" :class="{ major: version.versionNumber.endsWith('.0') }">
                  {{ version.versionNumber }}
                </span>
                <span class="status-badge status-badge--REVIEWING">
                  <i class="material-symbols-outlined">pending_actions</i>
                  審核中
                </span>
              </div>
            </div>
          </div>

          <div class="review-submit-info mt-3" v-if="version.reviewNote">
            <div class="review-submit-label">送審說明</div>
            <div class="review-submit-note">{{ version.reviewNote }}</div>
          </div>
        </div>

        <!-- 版本摘要 -->
        <div class="review-summary-section">
          <div class="review-section-title">版本摘要</div>
          <div class="review-summary-grid">
            <div class="review-summary-item">
              <span class="review-summary-label">標題</span>
              <span class="review-summary-value">{{ version.title }}</span>
            </div>
            <div class="review-summary-item">
              <span class="review-summary-label">分類</span>
              <span class="review-summary-value">{{ version.category || '（未設定）' }}</span>
            </div>
            <div class="review-summary-item">
              <span class="review-summary-label">標籤</span>
              <span class="review-summary-value">{{ version.tags?.join('、') || '（無標籤）' }}</span>
            </div>
            <div class="review-summary-item">
              <span class="review-summary-label">摘要</span>
              <span class="review-summary-value">{{ version.summary || '（無摘要）' }}</span>
            </div>
          </div>
        </div>

        <!-- 快速操作 -->
        <div class="review-actions-section">
          <button class="custom-btn w-100 mb-2" @click="openCompare">
            <i class="material-symbols-outlined">difference</i>
            與前一版比較
          </button>
        </div>

        <!-- 退回說明 -->
        <div class="review-feedback-section">
          <div class="review-section-title">退回說明（選填）</div>
          <textarea
            class="custom-input w-100"
            rows="3"
            v-model="feedback"
            placeholder="填寫退回原因，協助作者修改方向"
          ></textarea>
        </div>

      </div>

      <div class="p-5 text-center fc-grey-1" v-else>找不到審核資料</div>

      <!-- Footer -->
      <div class="review-footer" v-if="knowledge && version">
        <button class="custom-btn review-footer__reject" @click="handleReject">
          <i class="material-symbols-outlined">undo</i>
          退回
        </button>
        <button class="custom-btn custom-main-btn review-footer__approve" @click="handleApprove">
          <i class="material-symbols-outlined">verified</i>
          通過並發布
        </button>
      </div>

    </div>
  </div>

  <!-- 與前版比較 Modal（複用現有元件） -->
  <VersionCompareModal
    v-model="isCompareOpen"
    :knowledgeId="knowledgeId"
    :v1Id="compareV1Id"
    :v2Id="versionId"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useKnowledgeStore } from '@/stores/knowledgeStore';
import VersionCompareModal from '@/components/Knowledge/VersionCompareModal.vue';
import popDialog from '@/services/popDialog';

const props = defineProps<{
  modelValue: boolean;
  knowledgeId: string;
  versionId: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'approved': [];
  'rejected': [];
}>();

const knowledgeStore = useKnowledgeStore();

const knowledge = computed(() => knowledgeStore.getKnowledgeById(props.knowledgeId));
const version = computed(() => knowledgeStore.getVersionById(props.knowledgeId, props.versionId));

const feedback = ref('');

function close() {
  feedback.value = '';
  emit('update:modelValue', false);
}

function handleApprove() {
  knowledgeStore.approveVersion(props.knowledgeId, props.versionId);
  const vNum = version.value?.versionNumber ?? '';
  close();
  emit('approved');
  popDialog.toast(`已發布 ${vNum}`, 2000);
}

function handleReject() {
  knowledgeStore.rejectVersion(props.knowledgeId, props.versionId, feedback.value.trim() || undefined);
  close();
  emit('rejected');
  popDialog.toast('已退回，作者可重新編輯後送審', 2000);
}

// 與前版比較
const isCompareOpen = ref(false);
const compareV1Id = ref('');

function openCompare() {
  const k = knowledgeStore.getKnowledgeById(props.knowledgeId);
  if (!k) return;
  const idx = k.versions.findIndex(v => v.id === props.versionId);
  if (idx > 0) {
    compareV1Id.value = k.versions[idx - 1].id;
    isCompareOpen.value = true;
  } else {
    popDialog.alert('這是第一個版本，無前版可比較。');
  }
}
</script>
```

- [ ] **Step 2：Commit**

```bash
git add src/components/Knowledge/ReviewDrawer.vue
git commit -m "feat: add ReviewDrawer component"
```

---

## Task 3：ReviewDrawer 樣式

**Files:**
- Modify: `src/scss/views/_KnowledgeBase.scss`

- [ ] **Step 1：在 `.KnowledgeBase { }` 區塊內加入 ReviewDrawer 專屬樣式**

在 `_KnowledgeBase.scss` 最後一個 `.KnowledgeBase` 大括號結尾之前，加入以下樣式（在 `.drawer-body { ... }` 規則之後）：

```scss
  // ── ReviewDrawer 審核抽屜 ──
  .review-drawer-panel {
    width: 520px;
    right: -520px;

    &.open { right: 0; }
  }

  .review-info-section {
    padding: 20px 24px;
    border-bottom: 1px solid var(--color-border-1-alpha30);
    background: var(--color-background-1);
  }

  .review-meta-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .review-submit-info {
    background: var(--color-background);
    border: 1px solid var(--color-border-1-alpha30);
    border-radius: 10px;
    padding: 12px 16px;
  }

  .review-submit-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--color-text-alpha40);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }

  .review-submit-note {
    font-size: 14px;
    line-height: 1.6;
    color: var(--color-text-alpha80);
  }

  .review-summary-section {
    padding: 20px 24px;
    border-bottom: 1px solid var(--color-border-1-alpha30);
  }

  .review-section-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--color-text-alpha60);
    margin-bottom: 12px;
  }

  .review-summary-grid {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .review-summary-item {
    display: flex;
    gap: 12px;
    font-size: 14px;
    align-items: baseline;
  }

  .review-summary-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-alpha40);
    width: 40px;
    flex-shrink: 0;
  }

  .review-summary-value {
    color: var(--color-text);
    flex: 1;
    line-height: 1.5;
  }

  .review-actions-section {
    padding: 16px 24px;
    border-bottom: 1px solid var(--color-border-1-alpha30);
  }

  .review-feedback-section {
    padding: 20px 24px;
    flex: 1;
  }

  .review-footer {
    border-top: 1px solid var(--color-border-1-alpha50);
    padding: 16px 24px;
    display: flex;
    gap: 10px;
    flex-shrink: 0;
    background: var(--color-background);

    &__reject {
      flex: 0 0 auto;
    }

    &__approve {
      flex: 1;
    }
  }
```

- [ ] **Step 2：Commit**

```bash
git add src/scss/views/_KnowledgeBase.scss
git commit -m "feat(styles): add ReviewDrawer styles"
```

---

## Task 4：KnowledgeBase 列表頁串接

**Files:**
- Modify: `src/views/KnowledgeBase.vue`

- [ ] **Step 1：import ReviewDrawer 並宣告狀態**

在 `src/views/KnowledgeBase.vue` script 的 import 區塊加入：

```ts
import ReviewDrawer from '@/components/Knowledge/ReviewDrawer.vue';
```

在 `const historyDrawer = ref();` 附近加入：

```ts
// 審核 Drawer
const isReviewDrawerOpen = ref(false);
const reviewKnowledgeId = ref('');
const reviewVersionId = ref('');

function openReviewDrawer(item: any) {
  const reviewingVersion = item.versions.find((v: any) => v.status === 'REVIEWING');
  if (!reviewingVersion) return;
  reviewKnowledgeId.value = item.id;
  reviewVersionId.value = reviewingVersion.id;
  activeMenuId.value = '';
  isReviewDrawerOpen.value = true;
}
```

- [ ] **Step 2：更多選單加「審核」選項**

在 KnowledgeBase.vue template 中，找到更多選單的 `next-option-box` 內，在「版本紀錄」選項之前加入：

```html
<div
  v-if="item.status === 'REVIEWING'"
  class="option-item"
  @click="openReviewDrawer(item)"
>
  <i class="material-symbols-outlined">rate_review</i>
  審核
</div>
```

- [ ] **Step 3：統計卡「版本審核中」加可點擊篩選**

找到統計卡的「版本審核中」那個 `stat-card`，將整個 `div.stat-card` 加上 `@click` 和 cursor：

```html
<div class="stat-card" style="cursor: pointer;" @click="filterStatus = 'REVIEWING'">
```

- [ ] **Step 4：在 template 底部加入 ReviewDrawer**

在 `</div>` 最後（緊接 `SourceUpdateModal` 之後）加入：

```html
<ReviewDrawer
  v-model="isReviewDrawerOpen"
  :knowledgeId="reviewKnowledgeId"
  :versionId="reviewVersionId"
/>
```

- [ ] **Step 5：Commit**

```bash
git add src/views/KnowledgeBase.vue
git commit -m "feat(KnowledgeBase): add review drawer entry in list and stat card filter"
```

---

## Task 5：KnowledgeDetail 詳情頁串接

**Files:**
- Modify: `src/views/KnowledgeDetail.vue`

- [ ] **Step 1：import ReviewDrawer 並宣告狀態**

在 `src/views/KnowledgeDetail.vue` script import 區塊加入：

```ts
import ReviewDrawer from '@/components/Knowledge/ReviewDrawer.vue';
```

在 `const isCreateModalOpen = ref(false);` 附近加入：

```ts
const isReviewDrawerOpen = ref(false);

const reviewVersionId = computed(() => {
  return knowledge.value?.versions.find(v => v.status === 'REVIEWING')?.id ?? '';
});
```

- [ ] **Step 2：替換「撤回審核」按鈕區塊，加入「開始審核」與實作撤回**

找到 template 中 `v-else-if="knowledge.status === 'REVIEWING'"` 的按鈕區塊，替換為：

```html
<template v-else-if="knowledge.status === 'REVIEWING'">
  <button class="custom-btn ml-2" @click="handleWithdraw">
    <i class="material-symbols-outlined">undo</i>
    撤回審核
  </button>
  <button class="custom-btn custom-main-btn ml-2" @click="isReviewDrawerOpen = true">
    <i class="material-symbols-outlined">rate_review</i>
    開始審核
  </button>
</template>
```

在 script 的 `goToEditor` 函式附近加入：

```ts
function handleWithdraw() {
  const v = knowledge.value?.versions.find(ver => ver.status === 'REVIEWING');
  if (!v) return;
  popDialog.confirm('確定要撤回此審核申請嗎？版本將退回為草稿狀態。', () => {
    knowledgeStore.withdrawReview(props.id, v.id);
    popDialog.toast('已撤回審核，可繼續編輯草稿', 2000);
  });
}
```

- [ ] **Step 3：在 template 底部加入 ReviewDrawer**

在 `RestoreVersionModal` 之後加入：

```html
<ReviewDrawer
  v-model="isReviewDrawerOpen"
  :knowledgeId="props.id"
  :versionId="reviewVersionId"
/>
```

- [ ] **Step 4：Commit**

```bash
git add src/views/KnowledgeDetail.vue
git commit -m "feat(KnowledgeDetail): add review drawer, implement withdraw"
```

---

## Task 6：VersionHistoryDrawer 稽核紀錄時間軸

**Files:**
- Modify: `src/components/Knowledge/VersionHistoryDrawer.vue`
- Modify: `src/scss/views/_KnowledgeBase.scss`

- [ ] **Step 1：在每個 history-item 下方加入 reviewHistory 時間軸**

在 `VersionHistoryDrawer.vue` template 中，`<div class="history-note" ...>` 之後加入：

```html
<!-- 稽核紀錄時間軸 -->
<div class="review-timeline" v-if="v.reviewHistory?.length">
  <div
    class="review-timeline-item"
    v-for="(record, ri) in v.reviewHistory"
    :key="ri"
  >
    <div :class="['review-timeline-dot', `review-timeline-dot--${record.action.toLowerCase()}`]"></div>
    <div class="review-timeline-content">
      <span class="review-timeline-action">{{ reviewActionLabel[record.action] }}</span>
      <span class="review-timeline-by">{{ record.by }}</span>
      <span class="review-timeline-time">{{ record.time }}</span>
      <div class="review-timeline-note" v-if="record.note">{{ record.note }}</div>
    </div>
  </div>
</div>
```

- [ ] **Step 2：在 script 的 statusLabelMap 下方加入 reviewActionLabel**

```ts
const reviewActionLabel: Record<string, string> = {
  SUBMITTED: '送出審核',
  APPROVED:  '審核通過',
  REJECTED:  '審核退回',
  WITHDRAWN: '撤回審核',
};
```

- [ ] **Step 3：加入時間軸 SCSS 樣式**

在 `_KnowledgeBase.scss` 的 `.review-footer { }` 之後加入：

```scss
  // ── 版本紀錄內的稽核時間軸 ──
  .review-timeline {
    margin-top: 10px;
    padding: 10px 14px;
    background: var(--color-background-1);
    border-radius: 8px;
    border: 1px solid var(--color-border-1-alpha20);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .review-timeline-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .review-timeline-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-top: 5px;
    flex-shrink: 0;

    &--submitted  { background: #1565c0; }
    &--approved   { background: #02a100; }
    &--rejected   { background: #c62828; }
    &--withdrawn  { background: var(--color-text-alpha40); }
  }

  .review-timeline-content {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    line-height: 1.5;
  }

  .review-timeline-action {
    font-weight: 700;
    color: var(--color-text-alpha80);
  }

  .review-timeline-by {
    color: var(--color-text-alpha50);
    &::before { content: '·'; margin-right: 6px; }
  }

  .review-timeline-time {
    color: var(--color-text-alpha40);
    font-size: 11px;
  }

  .review-timeline-note {
    width: 100%;
    font-size: 12px;
    color: var(--color-text-alpha60);
    margin-top: 2px;
    padding: 4px 8px;
    background: var(--color-background);
    border-radius: 4px;
    border-left: 2px solid var(--color-border-1-alpha50);
  }
```

- [ ] **Step 4：Commit**

```bash
git add src/components/Knowledge/VersionHistoryDrawer.vue src/scss/views/_KnowledgeBase.scss
git commit -m "feat: add review history timeline in VersionHistoryDrawer"
```

---

## Self-Review

**Spec coverage check:**
- ✅ ReviewRecord interface + KnowledgeVersion 欄位 → Task 1
- ✅ submitForReview 補寫 reviewNote + reviewHistory → Task 1 Step 2
- ✅ approveVersion（前版轉 HISTORY、currentVersion 更新）→ Task 1 Step 3
- ✅ rejectVersion（含 feedback）→ Task 1 Step 4
- ✅ withdrawReview → Task 1 Step 5
- ✅ ReviewDrawer 元件（送審資訊、版本摘要、退回說明、通過/退回按鈕）→ Task 2
- ✅ 與前版比較整合 VersionCompareModal → Task 2 Step 1
- ✅ ReviewDrawer 樣式 → Task 3
- ✅ KnowledgeBase 更多選單加「審核」→ Task 4 Step 2
- ✅ 統計卡點擊篩選 → Task 4 Step 3
- ✅ KnowledgeDetail「開始審核」按鈕 → Task 5 Step 2
- ✅ KnowledgeDetail 撤回審核實作 → Task 5 Step 2
- ✅ VersionHistoryDrawer 稽核紀錄時間軸 → Task 6

**Type consistency check:**
- `approveVersion(knowledgeId, versionId)` — 兩處呼叫參數一致
- `rejectVersion(knowledgeId, versionId, feedback?)` — ReviewDrawer 呼叫時 `feedback.value.trim() || undefined` 符合選填
- `withdrawReview(knowledgeId, versionId)` — KnowledgeDetail 呼叫一致
- `reviewActionLabel` 的 key 與 `ReviewRecord.action` 的四個值完全對應
