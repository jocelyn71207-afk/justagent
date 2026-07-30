# TEVA 新品特徵貼標對話（conv3）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a third scripted demo conversation ("conv3") to the AiViewer chat panel, simulating a user asking the AI to feature-tag a batch of messy TEVA factory catalogs by color/style/material/size/theme, ending with an HTML report block added to the canvas.

**Architecture:** conv3 follows the exact same conventions as the existing conv1 (`conv1Msgs` + `processConv1Msg`) and conv2 (`conv2Msgs` + floating panels + pill row + multi-step wizard) flows, all inline in `AiViewerRightBox.vue` — no new components, no new abstraction layer. Entry is via the "快速任務" (canned task) menu, matching conv2's entry mechanism. The wizard has one path (no mode branching): upload messy files → confirm 5 tagging dimensions → review & run → HTML report added to canvas.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Pinia (`AiViewerStore`), plain `ref`/`computed` state (no new types — this codebase has no formal chat-message interface; message shape is ad hoc `any`, consistent with existing conv1/conv2 code).

## Global Constraints

- `<script setup lang="ts">` only, no Options API (per `AI_RULES.md` / `CLAUDE.md`).
- No `<style scoped>` — this file has no `<style>` block at all; conv3 reuses conv2's existing SCSS classes (`.conv2-fp`, `.conv2-pill*`, `.conv2-search-card`, `.conv2-ss*`, `.conv2-feat-item`, `.oneFileItem`, etc. — all already defined in `src/scss/views/_AiViewer.scss`). **No new SCSS files or classes are introduced by this plan.**
- All imports use the `@/` alias.
- No hardcoded hex colors are introduced (this plan adds no new colors — it reuses existing classes; the one new file, `public/teva_feature_tagging_report.html`, is a static standalone report page outside the Vue app's style system, matching how the existing `hurricane_trailsetter_*.html` reports are built, so the CSS-custom-property convention doesn't apply there).
- **No automated test coverage exists for this feature area.** conv1 and conv2 (the two existing scripted conversations this plan mirrors) have zero unit or e2e tests — this is a "切版" (UI slicing) demo feature per `PROJECT_CONTEXT.md` §10. Each task's verification step is therefore a manual dev-server walkthrough (`npm run dev`) plus `npm run lint` / `npm run type-check`, consistent with existing project practice. Do not invent new Vitest/Playwright specs for this feature — that would be scope creep beyond the approved spec.
- Every task must leave `npm run type-check` passing — later tasks reference refs/functions declared in earlier tasks, so all conv3 state is declared upfront in Task 2 even though its floating-panel templates arrive in Tasks 3–4 (declaring it upfront keeps every intermediate commit type-safe).

---

## File Structure

| File | Change |
|---|---|
| `src/components/AiViewer/conversationListModal.vue` | Modify — add conv3 list item, remove "max 2 conversations" copy |
| `src/components/AiViewer/AiViewerRightBox.vue` | Modify — add conv3 state/functions, extend shared computeds (`testMsgs`, `resetConversation`, `currentConversationTitle`, `inputAreaHidden`, `cannedTaskItems`, `sendCannedTask`, `watch(currentConversationId)`), add two floating-panel template blocks + pill row |
| `public/teva_feature_tagging_report.html` | Create — self-hosted HTML report (12 mock TEVA SKUs tagged across 5 dimensions), referenced via `/justagent/teva_feature_tagging_report.html` |

---

### Task 1: Conversation list entry + canvas reset wiring

**Files:**
- Modify: `src/components/AiViewer/conversationListModal.vue:10-21`
- Modify: `src/components/AiViewer/AiViewerRightBox.vue:942-948`

**Interfaces:**
- Consumes: `currentConversationId` (existing `Ref<string>` from `AiViewerStore`, already used by both files)
- Produces: nothing new consumed by later tasks — this task is self-contained UI wiring

- [ ] **Step 1: Add the conv3 list item and remove the 2-conversation limit copy**

In `src/components/AiViewer/conversationListModal.vue`, replace lines 10-21:

```html
      <ul class="conversation-list">
        <li :class="{ active: currentConversationId === 'conv1' }" @click="switchConversation('conv1')">
          <span>2026商品文件翻譯</span>
          <i class="material-symbols-outlined" @click="deleteFn($event)">delete</i>
        </li>
        <li :class="{ active: currentConversationId === 'conv2' }" @click="switchConversation('conv2')">
          <span>未命名對話</span>
          <i class="material-symbols-outlined" @click="deleteFn($event)">delete</i>
        </li>
      </ul>

      <div class="remark">一個專案最多兩個對話，如要開啟新對話請刪除其中一個。</div>
    </div>
```

with:

```html
      <ul class="conversation-list">
        <li :class="{ active: currentConversationId === 'conv1' }" @click="switchConversation('conv1')">
          <span>2026商品文件翻譯</span>
          <i class="material-symbols-outlined" @click="deleteFn($event)">delete</i>
        </li>
        <li :class="{ active: currentConversationId === 'conv2' }" @click="switchConversation('conv2')">
          <span>未命名對話</span>
          <i class="material-symbols-outlined" @click="deleteFn($event)">delete</i>
        </li>
        <li :class="{ active: currentConversationId === 'conv3' }" @click="switchConversation('conv3')">
          <span>TEVA新品特徵貼標</span>
          <i class="material-symbols-outlined" @click="deleteFn($event)">delete</i>
        </li>
      </ul>
    </div>
```

- [ ] **Step 2: Reset the canvas when switching to conv3**

In `src/components/AiViewer/AiViewerRightBox.vue`, replace lines 942-948:

```typescript
watch(currentConversationId, (id) => {
  if (id === 'conv1') {
    aiViewerBlocks.value = [];
  } else if (id === 'conv2') {
    aiViewerBlocks.value = [...aiviewerStore.INITIAL_BLOCKS];
  }
}, { immediate: true });
```

with:

```typescript
watch(currentConversationId, (id) => {
  if (id === 'conv1') {
    aiViewerBlocks.value = [];
  } else if (id === 'conv2') {
    aiViewerBlocks.value = [...aiviewerStore.INITIAL_BLOCKS];
  } else if (id === 'conv3') {
    aiViewerBlocks.value = [];
  }
}, { immediate: true });
```

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, open a project's AiViewer view.

- Click the chat header title → click "對話列表" → modal shows **3** items: 2026商品文件翻譯 / 未命名對話 / TEVA新品特徵貼標, and the "一個專案最多兩個對話" line is gone.
- Click "TEVA新品特徵貼標" → modal closes, canvas is empty (no blocks). The chat header title will still show conv1's title at this point ("未命名對話" fallback) — that's expected, it's fixed in Task 2.
- Click "2026商品文件翻譯" then "未命名對話" → confirm both still work exactly as before (regression check).

- [ ] **Step 4: Commit**

```bash
git add src/components/AiViewer/conversationListModal.vue src/components/AiViewer/AiViewerRightBox.vue
git commit -m "feat(ai-viewer): add conv3 entry to conversation list"
```

---

### Task 2: conv3 state, entry point, and shared-computed wiring

**Files:**
- Modify: `src/components/AiViewer/AiViewerRightBox.vue:937-940` (`currentConversationTitle`)
- Modify: `src/components/AiViewer/AiViewerRightBox.vue:988-1010` (`cannedTaskItems` / `sendCannedTask`)
- Modify: `src/components/AiViewer/AiViewerRightBox.vue:1863` (`inputAreaHidden`)
- Modify: `src/components/AiViewer/AiViewerRightBox.vue:2435-2480` (`testMsgs` / `resetConversation`)
- Modify: `src/components/AiViewer/AiViewerRightBox.vue:2433` (insert new "Conversation 3" section between the end of the conv2 section and `testMsgs`)

**Interfaces:**
- Consumes: `currentConversationId` (store), `AiAgentChatListScrollTo` (existing local function), `nextTick` (Vue import already present)
- Produces (used by Task 3 & 4): `conv3Msgs: Ref<any[]>`, `conv3Title: Ref<string>`, `conv3InputLocked: Ref<boolean>`, `conv3UploadFpVisible/conv3ShowUploadPill: Ref<boolean>`, `conv3UploadedFiles: Ref<{name:string;type:string;size:number}[]>`, `CONV3_DEMO_FILES` (const array of the same shape), `conv3DimFpVisible/conv3ShowDimPill: Ref<boolean>`, `conv3Dims: Ref<{key:string;title:string;sel:boolean}[]>`, `conv3DimErr: Ref<string>`, `conv3FpActive: ComputedRef<boolean>`, `c3Push(msg: any): void`, `c3Scroll(): void`, `conv3LeaveFastTask(): void`

- [ ] **Step 1: Extend `currentConversationTitle`**

Replace lines 937-940:

```typescript
const currentConversationTitle = computed(() => {
  if (currentConversationId.value === 'conv2') return conv2Title.value || '未命名對話';
  return conv1Title.value;
});
```

with:

```typescript
const currentConversationTitle = computed(() => {
  if (currentConversationId.value === 'conv2') return conv2Title.value || '未命名對話';
  if (currentConversationId.value === 'conv3') return conv3Title.value || 'TEVA新品特徵貼標';
  return conv1Title.value;
});
```

(`conv3Title` is declared in Step 5 below — safe forward reference since this getter isn't invoked until after the whole `<script setup>` body has run.)

- [ ] **Step 2: Extend `cannedTaskItems` and `sendCannedTask`**

Replace lines 988-1010:

```typescript
const cannedTaskItems = computed(() => {
  if (currentConversationId.value === 'conv2') {
    return [{ id: 'competitorAnalysis', text: '商品競品分析' }];
  }
  return [
    { id: 'cannedTask1', text: '快速罐頭任務範例文字1' },
    { id: 'cannedTask2', text: '快速罐頭任務範例文字2' },
    { id: 'cannedTask3', text: '快速罐頭任務範例文字33333333333333333333333' },
    { id: 'cannedTask4', text: '快速罐頭任務範例文字4' },
    { id: 'cannedTask5', text: '快速罐頭任務範例文字5' },
    { id: 'cannedTask6', text: '快速罐頭任務範例文字6' },
  ];
});
// 切換罐頭任務
function sendCannedTask(item: any) {
  isShowCannedTaskListBox.value = false;
  if (currentConversationId.value === 'conv2' && item.id === 'competitorAnalysis') {
    resetConversation();
    nextTick(() => conv2InitFlow());
    return;
  }
  send();
}
```

with:

```typescript
const cannedTaskItems = computed(() => {
  if (currentConversationId.value === 'conv2') {
    return [{ id: 'competitorAnalysis', text: '商品競品分析' }];
  }
  if (currentConversationId.value === 'conv3') {
    return [{ id: 'tevaFeatureTagging', text: 'TEVA新品特徵貼標' }];
  }
  return [
    { id: 'cannedTask1', text: '快速罐頭任務範例文字1' },
    { id: 'cannedTask2', text: '快速罐頭任務範例文字2' },
    { id: 'cannedTask3', text: '快速罐頭任務範例文字33333333333333333333333' },
    { id: 'cannedTask4', text: '快速罐頭任務範例文字4' },
    { id: 'cannedTask5', text: '快速罐頭任務範例文字5' },
    { id: 'cannedTask6', text: '快速罐頭任務範例文字6' },
  ];
});
// 切換罐頭任務
function sendCannedTask(item: any) {
  isShowCannedTaskListBox.value = false;
  if (currentConversationId.value === 'conv2' && item.id === 'competitorAnalysis') {
    resetConversation();
    nextTick(() => conv2InitFlow());
    return;
  }
  if (currentConversationId.value === 'conv3' && item.id === 'tevaFeatureTagging') {
    resetConversation();
    nextTick(() => conv3InitFlow());
    return;
  }
  send();
}
```

- [ ] **Step 3: Extend `inputAreaHidden`**

Replace line 1863:

```typescript
const inputAreaHidden = computed(() => conv2FpActive.value || showJourneyModifyPill.value || conv1TranslPanelVisible.value);
```

with:

```typescript
const inputAreaHidden = computed(() => conv2FpActive.value || conv3FpActive.value || showJourneyModifyPill.value || conv1TranslPanelVisible.value);
```

(`conv3FpActive` is declared in Step 5 — same safe-forward-reference reasoning as Step 1.)

- [ ] **Step 4: Extend `testMsgs` and `resetConversation`**

Replace lines 2435-2480:

```typescript
const testMsgs = computed(() => {
  const msgs = currentConversationId.value === 'conv2' ? conv2Msgs.value : conv1Msgs.value;
  // 未確認的 translationConfirm 不在河道上顯示任何泡泡
  return msgs.filter((m: any) => !(m.cardType === 'translationConfirm' && !m.confirmed));
});

function resetConversation() {
  if (currentConversationId.value === 'conv2') {
    conv2IdCounter = 2;
    conv2Mode.value = '';
    conv2Title.value = '';
    conv2Msgs.value = [];
    conv2UploadFpVisible.value = false;
    conv2ShowUploadPill.value = false;
    conv2UploadImgLoaded.value = false;
    conv2UploadDesc.value = '';
    conv2StepFpVisible.value = false;
    conv2ShowStepPill.value = false;
    conv2CurStep.value = 1;
    conv2S1Cat.value = '室內拖鞋';
    conv2S1Custom.value = '';
    conv2S1ImgLoaded.value = false;
    conv2S1ShowSkuInput.value = false;
    conv2S1SkuInput.value = '';
    conv2S2Brand.value = '';
    conv2S2Price.value = '';
    conv2S2Name.value = '';
    conv2S2Desc.value = '';
    conv2S2Err.value = '';
    conv2S3Err.value = '';
    conv2S3Features.value.forEach(f => { f.sel = f.key === 'material' || f.key === 'design'; });
    conv2S4Scope.value = 'tw';
    conv2S4Domain.value = '';
    conv2S5SelComps.value = new Set();
    conv2S5Err.value = '';
    conv2HoverComp.value = null;
    conv2InputLocked.value = false;
    conv2DirectFpVisible.value = false;
    conv2ShowDirectPill.value = false;
    conv2DirectFpStep.value = 1;
    conv2DirectMethod.value = '';
    conv2DirectSkuInput.value = '';
    conv2DirectUrlInput.value = '';
  }
  nextTick(() => AiAgentChatListScrollTo('ASC'));
}
```

with:

```typescript
const testMsgs = computed(() => {
  const msgs = currentConversationId.value === 'conv2' ? conv2Msgs.value
    : currentConversationId.value === 'conv3' ? conv3Msgs.value
    : conv1Msgs.value;
  // 未確認的 translationConfirm 不在河道上顯示任何泡泡
  return msgs.filter((m: any) => !(m.cardType === 'translationConfirm' && !m.confirmed));
});

function resetConversation() {
  if (currentConversationId.value === 'conv2') {
    conv2IdCounter = 2;
    conv2Mode.value = '';
    conv2Title.value = '';
    conv2Msgs.value = [];
    conv2UploadFpVisible.value = false;
    conv2ShowUploadPill.value = false;
    conv2UploadImgLoaded.value = false;
    conv2UploadDesc.value = '';
    conv2StepFpVisible.value = false;
    conv2ShowStepPill.value = false;
    conv2CurStep.value = 1;
    conv2S1Cat.value = '室內拖鞋';
    conv2S1Custom.value = '';
    conv2S1ImgLoaded.value = false;
    conv2S1ShowSkuInput.value = false;
    conv2S1SkuInput.value = '';
    conv2S2Brand.value = '';
    conv2S2Price.value = '';
    conv2S2Name.value = '';
    conv2S2Desc.value = '';
    conv2S2Err.value = '';
    conv2S3Err.value = '';
    conv2S3Features.value.forEach(f => { f.sel = f.key === 'material' || f.key === 'design'; });
    conv2S4Scope.value = 'tw';
    conv2S4Domain.value = '';
    conv2S5SelComps.value = new Set();
    conv2S5Err.value = '';
    conv2HoverComp.value = null;
    conv2InputLocked.value = false;
    conv2DirectFpVisible.value = false;
    conv2ShowDirectPill.value = false;
    conv2DirectFpStep.value = 1;
    conv2DirectMethod.value = '';
    conv2DirectSkuInput.value = '';
    conv2DirectUrlInput.value = '';
  }
  if (currentConversationId.value === 'conv3') {
    conv3IdCounter = 2;
    conv3Title.value = '';
    conv3Msgs.value = [];
    conv3InputLocked.value = false;
    conv3UploadFpVisible.value = false;
    conv3ShowUploadPill.value = false;
    conv3UploadedFiles.value = [];
    conv3DimFpVisible.value = false;
    conv3ShowDimPill.value = false;
    conv3Dims.value.forEach(d => { d.sel = true; });
    conv3DimErr.value = '';
  }
  nextTick(() => AiAgentChatListScrollTo('ASC'));
}
```

- [ ] **Step 5: Insert the new conv3 state block**

In `src/components/AiViewer/AiViewerRightBox.vue`, insert this new section immediately after line 2433 (`// -------- end Conversation 2 流程 --------`) and before the `testMsgs` computed (which Step 4 just modified):

```typescript
// -------- Conversation 3 流程 --------
const conv3InputLocked = ref(false); // 快速任務觸發後鎖定輸入框
const conv3Msgs = ref<any[]>([]);
let conv3IdCounter = 2;
const conv3Title = ref('');

function c3Push(msg: any) {
  conv3Msgs.value.push({ id: `c3_${conv3IdCounter++}`, ...msg });
}
function c3Scroll() {
  nextTick(() => AiAgentChatListScrollTo('ASC'));
}

// Step 1：上傳原廠文件（面板本體於後續任務建立）
const conv3UploadFpVisible = ref(false);
const conv3ShowUploadPill = ref(false);
const conv3UploadedFiles = ref<{ name: string; type: string; size: number }[]>([]);
const CONV3_DEMO_FILES: { name: string; type: string; size: number }[] = [
  { name: 'TEVA_AW26_目錄_final_v3(1).pdf', type: 'PDF', size: 8_412_000 },
  { name: '原廠規格表_更新版.xlsx', type: 'EXCEL', size: 1_204_500 },
  { name: 'TEVA官網介紹_複製.docx', type: 'WORD', size: 340_200 },
  { name: '特徵資料_舊版_勿用.txt', type: 'TXT', size: 18_600 },
];

// Step 2：貼標維度確認（面板本體於後續任務建立）
const conv3DimFpVisible = ref(false);
const conv3ShowDimPill = ref(false);
const conv3Dims = ref([
  { key: 'color', title: '顏色', sel: true },
  { key: 'style', title: '款式', sel: true },
  { key: 'material', title: '材質', sel: true },
  { key: 'size', title: '尺碼', sel: true },
  { key: 'theme', title: '風格', sel: true },
]);
const conv3DimErr = ref('');

// fp 互動模式中：完全隱藏原始輸入列（比照 conv2FpActive）
const conv3FpActive = computed(() =>
  currentConversationId.value === 'conv3' && (conv3ShowUploadPill.value || conv3ShowDimPill.value || conv3InputLocked.value)
);

function conv3InitFlow() {
  if (conv3Msgs.value.length > 0) return;
  conv3InputLocked.value = true;
  conv3Title.value = 'TEVA新品特徵貼標';
  c3Push({ forUser: true, msg: '請整理這批 TEVA 新品原廠文件，依顏色、款式、材質、尺碼、風格完成特徵貼標' });
  setTimeout(() => {
    c3Push({ msg: '收到！這批原廠文件看起來版本蠻雜亂的，麻煩先在下方面板附加要整理的檔案。' });
    c3Scroll();
    conv3UploadFpVisible.value = true;
    conv3ShowUploadPill.value = true;
  }, 300);
}

function conv3LeaveFastTask() {
  conv3InputLocked.value = false;
  conv3ShowUploadPill.value = false;
  conv3UploadFpVisible.value = false;
  conv3ShowDimPill.value = false;
  conv3DimFpVisible.value = false;
}
// -------- end Conversation 3 流程 --------

```

- [ ] **Step 6: Verify types and manual walkthrough**

Run: `npm run type-check`
Expected: no errors.

Run: `npm run dev`, open AiViewer, switch to conv3 via the conversation list.

- Chat header title now correctly shows "TEVA新品特徵貼標" (fixes the gap noted at the end of Task 1).
- Click the ⚡ (快速任務) button → exactly one item appears: "TEVA新品特徵貼標". Click it.
- Two chat bubbles appear in order: the user's request ("請整理這批 TEVA 新品原廠文件...") then, ~300ms later, the AI's reply asking to attach files. No floating panel appears yet (expected — its template is added in Task 3).
- Switch to conv1 and conv2 and confirm both are unaffected (regression check for the shared `cannedTaskItems`/`sendCannedTask`/`testMsgs`/`resetConversation` edits).

- [ ] **Step 7: Commit**

```bash
git add src/components/AiViewer/AiViewerRightBox.vue
git commit -m "feat(ai-viewer): wire up conv3 state, entry point, and shared computeds"
```

---

### Task 3: Upload panel (Step 1 — 上傳原廠文件)

**Files:**
- Modify: `src/components/AiViewer/AiViewerRightBox.vue:472` (template — insert new floating panel after the conv2 step-wizard panel closes)
- Modify: `src/components/AiViewer/AiViewerRightBox.vue:541` (template — insert conv3 pill row + leave-row after the conv2 `<template>` block closes)
- Modify: `src/components/AiViewer/AiViewerRightBox.vue` script — insert `conv3FlipSearchCard`, `conv3LoadDemoFiles`, `conv3ConfirmUpload` next to the other conv3 functions added in Task 2

**Interfaces:**
- Consumes: `conv3UploadFpVisible`, `conv3ShowUploadPill`, `conv3UploadedFiles`, `CONV3_DEMO_FILES`, `conv3DimFpVisible`, `conv3ShowDimPill`, `c3Push`, `c3Scroll`, `conv3Msgs` (all from Task 2), plus existing `useIconFileTypes` (store) and `formatFileSize` (from `@/utils/file`, already imported at the top of this file)
- Produces (used by Task 4): `conv3FlipSearchCard(from: string[], to: string[]): void`

- [ ] **Step 1: Add the upload panel template**

In `src/components/AiViewer/AiViewerRightBox.vue`, insert immediately after line 472 (the `</div>` that closes the conv2 step-wizard panel, right before the blank line and `<!-- 要上傳的附件 -->` comment at line 474):

```html

      <!-- Conv3 上傳原廠文件懸浮面板 -->
      <div v-show="conv3UploadFpVisible && currentConversationId === 'conv3'" class="conv2-fp" @click.stop>
        <div class="conv2-fp-top">
          <span class="conv2-fp-title">上傳原廠文件</span>
          <button class="conv2-fp-close-btn" @click.stop="conv3UploadFpVisible = false">
            <i class="material-symbols-outlined">close</i>
          </button>
        </div>
        <div class="conv2-fp-body">
          <div class="conv2-info-note">✦ 點擊下方區域附加這批 TEVA 原廠型錄與文件</div>
          <div v-if="conv3UploadedFiles.length === 0"
            class="conv2-up-img-box conv2-up-img-box--empty"
            style="height:64px"
            @click.stop="conv3LoadDemoFiles()">
            <div class="conv2-up-img-placeholder">
              <i class="material-symbols-outlined">upload_file</i>
              <span>點擊附加原廠文件</span>
            </div>
          </div>
          <div v-else>
            <div class="oneFileItem" v-for="(f, i) in conv3UploadedFiles" :key="'conv3-file-' + i" style="margin-bottom:6px">
              <img class="file-icon" :src="useIconFileTypes[f.type]" v-if="useIconFileTypes[f.type]" />
              <span class="noFile-icon" v-else><i class="material-symbols-outlined">draft</i></span>
              <div class="file-info-box">
                <div class="file-name">{{ f.name }}</div>
                <div class="file-size">{{ f.type }}．{{ formatFileSize(f.size) }}</div>
              </div>
            </div>
          </div>
          <div class="conv2-fp-btn-row">
            <button class="conv2-fp-submit-btn" :disabled="conv3UploadedFiles.length === 0" @click.stop="conv3ConfirmUpload()">確認附加，開始整理 →</button>
          </div>
        </div>
      </div>
```

- [ ] **Step 2: Add the conv3 pill row and leave-row**

Insert immediately after line 541 (the `</template>` that closes the conv2 pill-row/leave-row block), before the `<!-- Conv1 翻譯設定步驟面板 -->` comment:

```html
        <template v-if="currentConversationId === 'conv3'">
          <div class="conv2-pill-row" v-show="conv3ShowUploadPill || conv3ShowDimPill">
            <div class="conv2-pill" :class="{'conv2-pill--collapsed': !conv3UploadFpVisible}"
              v-show="conv3ShowUploadPill"
              @click.stop="conv3UploadFpVisible = !conv3UploadFpVisible">
              <span class="conv2-pill-dot"></span>上傳原廠文件
              <i class="material-symbols-outlined" style="font-size:14px">{{ conv3UploadFpVisible ? 'expand_more' : 'expand_less' }}</i>
            </div>
            <div class="conv2-pill" :class="{'conv2-pill--collapsed': !conv3DimFpVisible}"
              v-show="conv3ShowDimPill"
              @click.stop="conv3DimFpVisible = !conv3DimFpVisible">
              <span class="conv2-pill-dot"></span>貼標維度確認
              <i class="material-symbols-outlined" style="font-size:14px">{{ conv3DimFpVisible ? 'expand_more' : 'expand_less' }}</i>
            </div>
          </div>
          <div v-if="conv3InputLocked" class="conv2-leave-row">
            <button class="conv2-leave-btn" @click.stop="conv3LeaveFastTask()">
              <i class="material-symbols-outlined">close</i>離開快速任務
            </button>
          </div>
        </template>
```

- [ ] **Step 3: Add `conv3FlipSearchCard` and the upload-panel functions**

In the script section, immediately after the `conv3LeaveFastTask` function added in Task 2 (still inside the `// -------- Conversation 3 流程 --------` ... `// -------- end Conversation 3 流程 --------` block — move the end-marker comment down below these new functions), add:

```typescript
// 尋找最後一則含 'conv2-search-card' 的處理進度訊息，把指定 class 依序替換（比照 conv2DirectSubmitSku 的做法）
function conv3FlipSearchCard(from: string[], to: string[]) {
  const msgs = conv3Msgs.value;
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].msg?.includes('conv2-search-card')) {
      let msg = msgs[i].msg as string;
      from.forEach((f, idx) => { msg = msg.replace(f, to[idx]); });
      conv3Msgs.value[i] = { ...msgs[i], msg };
      return;
    }
  }
}

function conv3LoadDemoFiles() {
  if (conv3UploadedFiles.value.length) return;
  conv3UploadedFiles.value = [...CONV3_DEMO_FILES];
}

function conv3ConfirmUpload() {
  if (!conv3UploadedFiles.value.length) return;
  conv3UploadFpVisible.value = false;
  conv3ShowUploadPill.value = false;
  const fileListHtml = conv3UploadedFiles.value.map((f, i) => `${i + 1}. ${f.name}`).join('<br>');
  c3Push({ forUser: true, msg: `已附加 ${conv3UploadedFiles.value.length} 份文件：<br>${fileListHtml}` });
  c3Push({ msg: `收到，我先掃描這批檔案⋯<div class="conv2-search-card" style="margin-top:8px">
  <div class="conv2-ss conv2-ss--active">DocumentParser 解析原廠型錄與規格表</div>
  <div class="conv2-ss conv2-ss--wait">SkuNormalizer 合併重複／雜亂命名的商品資料</div>
</div>` });
  c3Scroll();
  setTimeout(() => {
    conv3FlipSearchCard(['conv2-ss--active', 'conv2-ss--wait'], ['conv2-ss--done', 'conv2-ss--done']);
    c3Push({ msg: `已解析 4 份文件，合併雜亂命名後共識別 <strong>12 個 SKU</strong>。請在下方面板確認要貼標的特徵維度。` });
    c3Scroll();
    conv3DimFpVisible.value = true;
    conv3ShowDimPill.value = true;
  }, 1800);
}
```

- [ ] **Step 4: Verify types and manual walkthrough**

Run: `npm run type-check`
Expected: no errors.

Run: `npm run dev`, switch to conv3, click ⚡ → "TEVA新品特徵貼標".

- After the AI's "麻煩先在下方面板附加要整理的檔案" message, the floating panel now appears with an "點擊附加原廠文件" upload zone.
- Click it → 4 messy-named demo files appear as file chips (with correct icons for PDF/EXCEL/WORD/TXT and correct sizes via `formatFileSize`).
- Click "確認附加，開始整理 →" → a user bubble lists the 4 files, then an AI bubble shows the two-step progress card (DocumentParser active, SkuNormalizer waiting).
- After ~1.8s, both steps flip to done and a new AI message appears: "已解析 4 份文件...12 個 SKU...請在下方面板確認要貼標的特徵維度。" No dimension panel appears yet (expected — its template is added in Task 4). The "離開快速任務" button is visible throughout (conv3InputLocked stays true).

- [ ] **Step 5: Commit**

```bash
git add src/components/AiViewer/AiViewerRightBox.vue
git commit -m "feat(ai-viewer): add conv3 upload-files panel and scanning progress"
```

---

### Task 4: Dimension panel (Step 2 — 貼標維度確認) + result

**Files:**
- Modify: `src/components/AiViewer/AiViewerRightBox.vue` template — insert dimension-confirmation floating panel right after the upload panel added in Task 3
- Modify: `src/components/AiViewer/AiViewerRightBox.vue` script — add `conv3TogDim`, `conv3ConfirmDims`, `conv3ShowResult`

**Interfaces:**
- Consumes: `conv3Dims`, `conv3DimErr`, `conv3DimFpVisible`, `conv3ShowDimPill`, `conv3InputLocked`, `c3Push`, `c3Scroll`, `conv3FlipSearchCard` (Task 3), `addReportBlock` (existing, destructured from `aiviewerStore` at the top of the script), `htmlIcon` (existing import)
- Produces: nothing consumed by later tasks (Task 5 only needs the `addReportBlock` URL string to match, see Step 3 below)

- [ ] **Step 1: Add the dimension-confirmation panel template**

Insert immediately after the closing `</div>` of the "Conv3 上傳原廠文件懸浮面板" block added in Task 3 Step 1:

```html

      <!-- Conv3 貼標維度確認懸浮面板 -->
      <div v-show="conv3DimFpVisible && currentConversationId === 'conv3'" class="conv2-fp" @click.stop>
        <div class="conv2-fp-top">
          <span class="conv2-fp-title">貼標維度確認</span>
          <button class="conv2-fp-close-btn" @click.stop="conv3DimFpVisible = false">
            <i class="material-symbols-outlined">close</i>
          </button>
        </div>
        <div class="conv2-fp-body">
          <div class="conv2-pdesc">多選（至少 1 項）</div>
          <div v-for="d in conv3Dims" :key="d.key"
            :class="['conv2-feat-item', {sel: d.sel}]"
            @click.stop="conv3TogDim(d)">
            <div class="conv2-fcb">
              <svg v-if="d.sel" width="8" height="6" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="#1d4ed8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <div class="conv2-ft">{{ d.title }}</div>
          </div>
          <div class="conv2-err">{{ conv3DimErr }}</div>
          <div class="conv2-fp-btn-row">
            <span class="conv2-cbadge">已選 {{ conv3Dims.filter(d => d.sel).length }} / {{ conv3Dims.length }}</span>
            <button class="conv2-fp-btn" @click.stop="conv3ConfirmDims()">確認 →</button>
          </div>
        </div>
      </div>
```

- [ ] **Step 2: Add `conv3TogDim`, `conv3ConfirmDims`, `conv3ShowResult`**

In the script, add these right after `conv3ConfirmUpload` (added in Task 3 Step 3), still within the `// -------- Conversation 3 流程 --------` block:

```typescript
function conv3TogDim(d: any) {
  const selCount = conv3Dims.value.filter(x => x.sel).length;
  if (d.sel && selCount <= 1) { conv3DimErr.value = '至少選 1 個維度'; return; }
  d.sel = !d.sel;
  conv3DimErr.value = '';
}

function conv3ConfirmDims() {
  if (!conv3Dims.value.some(d => d.sel)) { conv3DimErr.value = '至少選 1 個維度'; return; }
  conv3DimFpVisible.value = false;
  conv3ShowDimPill.value = false;
  const dimNames = conv3Dims.value.filter(d => d.sel).map(d => d.title).join('、');
  c3Push({ forUser: true, msg: `確認以 ${dimNames} 進行貼標，開始執行。` });
  c3Push({ msg: `設定已確認，開始貼標⋯<div class="conv2-search-card" style="margin-top:8px">
  <div class="conv2-ss conv2-ss--done">DocumentParser 解析原廠型錄與規格表</div>
  <div class="conv2-ss conv2-ss--done">SkuNormalizer 合併重複／雜亂命名的商品資料</div>
  <div class="conv2-ss conv2-ss--active">FeatureTagger 依 ${dimNames} 進行特徵貼標中</div>
  <div class="conv2-ss conv2-ss--wait">QualityReview 交叉比對命名與規格一致性</div>
</div>` });
  c3Scroll();
  setTimeout(() => conv3ShowResult(dimNames), 2200);
}

function conv3ShowResult(dimNames: string) {
  conv3InputLocked.value = false;
  conv3FlipSearchCard(['conv2-ss--active', 'conv2-ss--wait'], ['conv2-ss--done', 'conv2-ss--done']);
  try {
    addReportBlock('/justagent/teva_feature_tagging_report.html', 'TEVA_特徵貼標報告.html');
  } catch (e) { /* 畫布可能尚未初始化 */ }
  c3Push({ msg: `✅ 貼標完成！12 個 SKU 已依 ${dimNames} 完成特徵貼標，報告已加入畫布，可直接查看或下載。` });
  c3Push({ finishResponse: true, msg: `<div class="oneFileItem">
  <img class="file-icon" src="${htmlIcon}" />
  <div class="file-info-box">
    <div class="file-name">TEVA_特徵貼標報告.html</div>
    <div class="file-size">HTML · 6.4 KB · 已加到畫布</div>
  </div>
</div>` });
  c3Scroll();
}
```

- [ ] **Step 3: Verify types and manual walkthrough**

Run: `npm run type-check`
Expected: no errors.

Run: `npm run dev`, replay the conv3 flow from the start (click 快速任務 → TEVA新品特徵貼標 → upload demo files → confirm).

- After the "請在下方面板確認要貼標的特徵維度" message, the dimension panel now appears with 5 pre-checked items (顏色/款式/材質/尺碼/風格), a running "已選 5 / 5" badge, and an enabled "確認 →" button.
- Un-checking down to 1 item and trying to uncheck the last one shows "至少選 1 個維度" and blocks it.
- Click "確認 →" → a user bubble confirms the chosen dimensions, then a 4-step progress card appears (first two already done, third active, fourth waiting).
- After ~2.2s, the active/waiting steps flip to done, a final AI message announces completion, and a file card for `TEVA_特徵貼標報告.html` appears. A new HTML block is added to the canvas — it will show a 404/blank iframe at this point, since the report file doesn't exist yet (expected — created in Task 5). `conv3InputLocked` becomes false and the "離開快速任務" button disappears.

- [ ] **Step 4: Commit**

```bash
git add src/components/AiViewer/AiViewerRightBox.vue
git commit -m "feat(ai-viewer): add conv3 dimension-tagging panel and completion flow"
```

---

### Task 5: TEVA feature-tagging HTML report

**Files:**
- Create: `public/teva_feature_tagging_report.html`

**Interfaces:**
- Consumes: nothing (static standalone file)
- Produces: a file served at build/runtime as `/justagent/teva_feature_tagging_report.html` (via the Vite `base: '/justagent/'` config already in `vite.config.ts`), which is the exact URL `conv3ShowResult` (Task 4) passes to `addReportBlock`

- [ ] **Step 1: Create the report file**

Create `public/teva_feature_tagging_report.html` with this exact content (mirrors the CSS-variable design language already used by `public/hurricane_trailsetter_marketing_strategy.html`, so it renders consistently inside the canvas's HTML block):

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TEVA 新品特徵貼標報告</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #f7f8fa;
    --surface: #ffffff;
    --surface2: #f1f3f7;
    --border: #e4e7ed;
    --text: #1a1d23;
    --text-2: #5c6370;
    --text-3: #9ca3af;
    --blue: #3b72f6;
    --blue-light: rgba(59,114,246,0.08);
    --green: #16a34a;
    --orange: #ea580c;
    --purple: #7c3aed;
  }
  body {
    background: var(--bg);
    font-family: 'Helvetica Neue', 'PingFang TC', 'Microsoft JhengHei', sans-serif;
    color: var(--text);
    padding: 28px 24px 48px;
    font-size: 13px;
    line-height: 1.6;
  }
  .report-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; gap: 12px; }
  .report-brand { font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--blue); margin-bottom: 4px; }
  .report-title { font-size: 20px; font-weight: 800; letter-spacing: -.3px; }
  .report-meta { font-size: 11px; color: var(--text-3); margin-top: 4px; }
  .report-tag { font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 20px; background: var(--blue-light); color: var(--blue); border: 1px solid rgba(59,114,246,.2); white-space: nowrap; align-self: flex-start; margin-top: 4px; }
  .stat-row { display: flex; gap: 10px; margin-bottom: 22px; }
  .stat-card { flex: 1; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; }
  .stat-val { font-size: 20px; font-weight: 800; }
  .stat-lbl { font-size: 11px; color: var(--text-2); margin-top: 2px; }
  .section-title { font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--text-3); margin: 22px 0 10px; }
  .tag-summary { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 6px; }
  .tag-chip { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; background: var(--surface2); border: 1px solid var(--border); color: var(--text-2); }
  table { width: 100%; border-collapse: collapse; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
  thead th { text-align: left; font-size: 10px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--text-3); background: var(--surface2); padding: 10px 12px; border-bottom: 1px solid var(--border); }
  tbody td { padding: 10px 12px; border-bottom: 1px solid var(--border); font-size: 12px; vertical-align: top; }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover { background: var(--blue-light); }
  .sku-cell { font-family: 'SF Mono', Menlo, monospace; font-size: 11px; color: var(--text-2); }
  .name-cell { font-weight: 700; }
  .dim-color { color: var(--purple); }
  .dim-style { color: var(--blue); }
  .dim-material { color: var(--orange); }
  .dim-theme { color: var(--green); }
</style>
</head>
<body>
  <div class="report-header">
    <div>
      <div class="report-brand">JustAgent · AI 貼標</div>
      <div class="report-title">TEVA 新品特徵貼標報告</div>
      <div class="report-meta">來源文件 4 份 · AW26 新品原廠型錄與規格表 · 貼標維度：顏色／款式／材質／尺碼／風格</div>
    </div>
    <span class="report-tag">貼標完成</span>
  </div>

  <div class="stat-row">
    <div class="stat-card"><div class="stat-val">4</div><div class="stat-lbl">來源文件</div></div>
    <div class="stat-card"><div class="stat-val">12</div><div class="stat-lbl">識別 SKU</div></div>
    <div class="stat-card"><div class="stat-val">5</div><div class="stat-lbl">貼標維度</div></div>
    <div class="stat-card"><div class="stat-val">100%</div><div class="stat-lbl">完成率</div></div>
  </div>

  <div class="section-title">維度分佈</div>
  <div class="tag-summary">
    <span class="tag-chip">顏色：12 種</span>
    <span class="tag-chip">款式：11 種</span>
    <span class="tag-chip">材質：11 種組合</span>
    <span class="tag-chip">尺碼區間：8 種</span>
    <span class="tag-chip">風格：7 種</span>
  </div>

  <div class="section-title">特徵貼標結果</div>
  <table>
    <thead>
      <tr><th>SKU</th><th>品名</th><th>顏色</th><th>款式</th><th>材質</th><th>尺碼</th><th>風格</th></tr>
    </thead>
    <tbody>
      <tr><td class="sku-cell">TEV-AW26-001</td><td class="name-cell">Hurricane XLT2</td><td class="dim-color">曜石黑</td><td class="dim-style">運動涼鞋</td><td class="dim-material">再生聚酯纖維織帶／EVA 中底</td><td>US 7–12</td><td class="dim-theme">機能戶外</td></tr>
      <tr><td class="sku-cell">TEV-AW26-002</td><td class="name-cell">Original Universal</td><td class="dim-color">珊瑚橘</td><td class="dim-style">經典一字帶涼鞋</td><td class="dim-material">尼龍織帶／橡膠大底</td><td>US 5–10</td><td class="dim-theme">復古休閒</td></tr>
      <tr><td class="sku-cell">TEV-AW26-003</td><td class="name-cell">Midform Universal</td><td class="dim-color">卡其棕</td><td class="dim-style">厚底涼鞋</td><td class="dim-material">再生聚酯纖維／厚底發泡橡膠</td><td>US 5–9</td><td class="dim-theme">街頭時尚</td></tr>
      <tr><td class="sku-cell">TEV-AW26-004</td><td class="name-cell">Hurricane Verge</td><td class="dim-color">深海藍</td><td class="dim-style">水陸機能鞋</td><td class="dim-material">透氣網布／防滑橡膠底</td><td>US 6–11</td><td class="dim-theme">機能戶外</td></tr>
      <tr><td class="sku-cell">TEV-AW26-005</td><td class="name-cell">ReEmber</td><td class="dim-color">燕麥米</td><td class="dim-style">保暖厚底涼鞋</td><td class="dim-material">人造絨毛內裡／EVA 中底</td><td>US 5–9</td><td class="dim-theme">冬季暖感</td></tr>
      <tr><td class="sku-cell">TEV-AW26-006</td><td class="name-cell">Flatform Universal</td><td class="dim-color">奶油白</td><td class="dim-style">厚底涼鞋</td><td class="dim-material">織帶尼龍／厚底橡膠</td><td>US 5–9.5</td><td class="dim-theme">街頭時尚</td></tr>
      <tr><td class="sku-cell">TEV-AW26-007</td><td class="name-cell">Terra Fi 5</td><td class="dim-color">石墨灰</td><td class="dim-style">全地形機能涼鞋</td><td class="dim-material">皮革織帶／Spider 橡膠大底</td><td>US 7–13</td><td class="dim-theme">機能戶外</td></tr>
      <tr><td class="sku-cell">TEV-AW26-008</td><td class="name-cell">Original Universal Kids</td><td class="dim-color">檸檬黃</td><td class="dim-style">童款經典涼鞋</td><td class="dim-material">尼龍織帶／橡膠大底</td><td>US 11C–3Y</td><td class="dim-theme">繽紛童趣</td></tr>
      <tr><td class="sku-cell">TEV-AW26-009</td><td class="name-cell">Hurricane Drift</td><td class="dim-color">螢光綠</td><td class="dim-style">輕量運動涼鞋</td><td class="dim-material">再生聚酯纖維／輕量 EVA</td><td>US 6–12</td><td class="dim-theme">機能戶外</td></tr>
      <tr><td class="sku-cell">TEV-AW26-010</td><td class="name-cell">Voya Infinity</td><td class="dim-color">霧粉色</td><td class="dim-style">織帶涼鞋</td><td class="dim-material">彈性織帶／橡膠大底</td><td>US 5–10</td><td class="dim-theme">復古休閒</td></tr>
      <tr><td class="sku-cell">TEV-AW26-011</td><td class="name-cell">Original Universal Premier</td><td class="dim-color">焦糖棕</td><td class="dim-style">皮革一字帶涼鞋</td><td class="dim-material">頭層牛皮／橡膠大底</td><td>US 5–10</td><td class="dim-theme">質感簡約</td></tr>
      <tr><td class="sku-cell">TEV-AW26-012</td><td class="name-cell">ReRoam</td><td class="dim-color">炭燒黑</td><td class="dim-style">居家／露營拖鞋</td><td class="dim-material">再生聚酯纖維絨毛／防滑底</td><td>US 6–12</td><td class="dim-theme">露營悠閒</td></tr>
    </tbody>
  </table>
</body>
</html>
```

- [ ] **Step 2: Verify the report renders**

Run: `npm run dev`, replay the full conv3 flow end to end (or, faster: navigate directly to `http://localhost:<port>/justagent/teva_feature_tagging_report.html` in a browser tab to check the static file directly).

- The page renders without console errors: header, 4 stat cards, dimension-distribution chips, and the 12-row table are all visible, styled consistently with the existing `hurricane_trailsetter_*.html` reports.
- Back in the AiViewer canvas, the HTML block added by `conv3ShowResult` now shows this same content instead of a blank/404 iframe.

- [ ] **Step 3: Commit**

```bash
git add public/teva_feature_tagging_report.html
git commit -m "feat(ai-viewer): add TEVA feature-tagging HTML report"
```

---

### Task 6: Final regression pass

**Files:** none (verification only — no code changes expected)

**Interfaces:** N/A

- [ ] **Step 1: Static checks**

Run: `npm run lint`
Expected: no errors (warnings pre-existing to the codebase are acceptable; do not introduce new ones).

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 2: Full manual walkthrough**

Run: `npm run dev`, open a project's AiViewer view, and in one sitting:

1. Open "對話列表" → confirm 3 items, no "最多兩個對話" text.
2. Run conv1's translation flow start-to-finish (type any message in the empty-state overlay, confirm the translation panel, submit) → confirm unaffected by this change.
3. Run conv2's "商品競品分析" canned task through the "深度分析" path (or any path) to completion → confirm unaffected.
4. Run conv3's "TEVA新品特徵貼標" canned task through to completion (upload → confirm 4 files → confirm 5 dimensions → wait for report) → confirm the HTML report block appears correctly and matches Task 5's file.
5. Mid-flow in conv3, click "離開快速任務" → confirm the panel/pill closes, input area reappears normally, and clicking the ⚡ button again still offers "TEVA新品特徵貼標" (i.e. `resetConversation` + `conv3InitFlow` still work for a second run).
6. Resize the right panel and switch between all three conversations a few times → confirm no console errors and no cross-conversation state leakage (e.g. conv2's pills should never show while on conv3, and vice versa).

If any issue is found, fix it in a follow-up commit (not a new task — this plan ends here); otherwise no commit is needed for this task.

---

## Self-Review Notes (from plan authoring)

- **Spec coverage:** all sections of `docs/superpowers/specs/2026-07-30-teva-feature-tagging-conversation-design.md` are covered — conversation list (Task 1), entry mechanism + shared wiring (Task 2), upload step (Task 3), dimension step + result (Task 4), HTML report (Task 5), regression (Task 6).
- **Simplification vs. spec:** the spec's draft code included a `conv3Dispatch`/`handleChatAreaClick` wiring section and a `conv3-confirm-upload` data-action case; on review this was dead code (every conv3 control lives in a floating panel and calls its handler directly via `@click.stop`, exactly like conv2's panel buttons) — removed from both the spec and this plan.
- **Type/name consistency check:** `conv3Msgs`, `conv3Title`, `conv3InputLocked`, `conv3UploadFpVisible`/`conv3ShowUploadPill`/`conv3UploadedFiles`/`CONV3_DEMO_FILES`, `conv3DimFpVisible`/`conv3ShowDimPill`/`conv3Dims`/`conv3DimErr`, `conv3FpActive`, `c3Push`/`c3Scroll`, `conv3LeaveFastTask`/`conv3LoadDemoFiles`/`conv3ConfirmUpload`/`conv3FlipSearchCard`/`conv3TogDim`/`conv3ConfirmDims`/`conv3ShowResult` are spelled identically everywhere they're declared and used across Tasks 2–4.
- **Data consistency check:** "12 個 SKU" is stated identically in `conv3ConfirmUpload`'s message, `conv3ShowResult`'s message, and the report's stat card; the report's "維度分佈" chip counts (顏色12／款式11／材質11／尺碼區間8／風格7) were recomputed by hand against the actual 12 table rows in Task 5, not guessed.
- **Report URL consistency check:** `conv3ShowResult` (Task 4) calls `addReportBlock('/justagent/teva_feature_tagging_report.html', ...)` and Task 5 creates `public/teva_feature_tagging_report.html` — matches the existing `vite.config.ts` `base: '/justagent/'` rewrite already used by all of conv1's local reports.

