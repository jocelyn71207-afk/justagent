# 銷售報告整理與建議建立 Skill 對話（conv4）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a third *implemented* scripted demo conversation ("conv4") to the AiViewer chat panel, simulating a user asking the AI to compile last month's product sales report (referencing two `@`-mentioned documents), after which the AI proactively offers to save this workflow as a reusable Skill.

**Architecture:** conv4 follows the exact same conventions as the existing conv1 (`conv1Msgs`) and conv2 (`conv2Msgs` + `.conv2-search-card` progress-card mechanism) flows, all inline in `AiViewerRightBox.vue` — no new components, no new abstraction layer. Entry is via the "快速任務" (canned task) menu, matching conv2's entry mechanism. Unlike conv2/conv3, conv4 has **no floating panel and no input-locking wizard** — it is a single linear script: user request → search/format progress card → report added to canvas (with a "參考來源" citation chip, reusing conv1's existing `sources` mechanism) → AI asks whether to save as a Skill → user picks one of two inline quick-reply buttons → confirmation message. The two `@`-mentioned source documents are backed by two new mock entries in `knowledgeStore.ts` so the citation chips are genuinely clickable and show real content in `KnowledgeSourceDrawer`.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Pinia (`AiViewerStore`, `knowledgeStore`), plain `ref`/`computed` state (no new types — this codebase has no formal chat-message interface; message shape is ad hoc `any`, consistent with existing conv1/conv2 code).

## Global Constraints

- `<script setup lang="ts">` only, no Options API (per `AI_RULES.md` / `CLAUDE.md`).
- No `<style scoped>` — `AiViewerRightBox.vue` has no `<style>` block at all; conv4 reuses existing SCSS classes (`.conv2-search-card`, `.conv2-ss*`, `.conv1-quick-btn(s)`, `.oneFileItem`) already defined in `src/scss/views/_AiViewer.scss`. **No new SCSS files or classes are introduced by this plan** — the one small bespoke visual (the Skill-confirmation preview card) uses an inline `style="..."` attribute directly in the message HTML string, the same ad hoc pattern already used throughout conv1–conv3 for chat-bubble HTML.
- All imports use the `@/` alias.
- No hardcoded hex colors in Vue/TS files (the new inline-styled Skill confirmation card uses only a generic gray text color already used elsewhere as a literal in this codebase's chat HTML strings, e.g. `#5c6370`, consistent with existing inline-styled bubble content such as `conv2-search-card` usages). The one new file, `public/sanuo_2026_06_sales_report.html`, is a static standalone report page outside the Vue app's style system (same as the existing `hurricane_trailsetter_*.html` / TEVA reports), so the CSS-custom-property-only convention doesn't apply there — it defines its own `:root` variables exactly like those existing reports do.
- **No automated test coverage exists for this feature area.** conv1 and conv2 (the two existing scripted conversations this plan mirrors) have zero unit or e2e tests — this is a "切版" (UI slicing) demo feature per `PROJECT_CONTEXT.md` §10. Each task's verification step is therefore a manual dev-server walkthrough (`npm run dev`) plus `npm run lint` / `npm run type-check`, consistent with existing project practice and the precedent set by the (unimplemented) conv3 plan. Do not invent new Vitest/Playwright specs for this feature.
- Every task must leave `npm run type-check` passing.
- Numeric consistency: the sales figures quoted in the new `knowledgeStore.ts` mock entry (Task 1), the AI's chat message (Task 4), and the HTML report (Task 6) must all agree (see the shared numbers table in Task 1).
- conv4 is numbered "conv4" deliberately, even though it is only the third *implemented* conversation — this preserves the existing, already-approved conv3 (TEVA) spec/plan for future independent implementation without renumbering conflicts.

---

## File Structure

| File | Change |
|---|---|
| `src/stores/knowledgeStore.ts` | Modify — add two `KnowledgeItem` entries (`k7`, `k8`) to `knowledgeList` |
| `src/components/AiViewer/conversationListModal.vue` | Modify — add conv4 list item, remove "max 2 conversations" copy |
| `src/components/AiViewer/AiViewerRightBox.vue` | Modify — add conv4 state/functions, extend shared computeds (`testMsgs`, `resetConversation`, `currentConversationTitle`, `cannedTaskItems`, `sendCannedTask`, `watch(currentConversationId)`), add 2 new `data-action` branches in `handleChatAreaClick` |
| `public/sanuo_2026_06_sales_report.html` | Create — self-hosted HTML report, referenced via `/justagent/sanuo_2026_06_sales_report.html` |

**Shared numbers (must match across Tasks 1, 4, 6):**

| Metric | Value |
|---|---|
| 報告期間 | 2026年6月 |
| 總營業額 | NT$19,650,000 |
| 較上月成長 | +6.1% |
| 熱銷品項數 | 10 |
| 訂單數 | 3,420 筆 |
| 品類佔比 | 涼鞋 30%／機能健走鞋 26%／靴類 25%／生活配件 12%／拖鞋 7% |

---

### Task 1: Knowledge base entries for the two `@`-mentioned documents

**Files:**
- Modify: `src/stores/knowledgeStore.ts:648-649`

**Interfaces:**
- Consumes: existing `KnowledgeItem`/`KnowledgeVersion`/`ChunkPreview` interfaces (already defined at lines 112-122, 179-225), existing `knowledgeList` ref
- Produces: two new knowledge IDs consumed by Task 3's `CONV4_SOURCES` — `k7` (title `'2026Q1產品銷售數據彙總'`) and `k8` (title `'三諾產品部輸出報告規範 v1.0'`)

- [ ] **Step 1: Add the `k7` and `k8` entries**

In `src/stores/knowledgeStore.ts`, replace lines 648-649:

```typescript
    },
  ]);
```

with:

```typescript
    },
    {
      id: 'k7',
      title: '2026Q1產品銷售數據彙總',
      category: '商品文件',
      status: 'active',
      sourceType: 'FILE',
      pipelineProgress: 100,
      pipelineStage: null,
      pipelineError: null,
      sourceStale: false,
      staleSourceFileIds: [],
      lastSyncAt: null,
      apiSourceId: null,
      apiSourceName: null,
      lastUpdateTime: '2026-07-01 09:00',
      lastUpdateBy: 'Lucas',
      versions: [
        {
          id: 'k7-v1.0',
          knowledgeId: 'k7',
          versionNumber: 'v1.0',
          versionType: 'MAJOR',
          status: 'active',
          title: '2026Q1產品銷售數據彙總',
          summary: '2026年6月（上月）產品銷售數據彙總，含總營業額、品類佔比與熱銷品項明細。',
          content: '# 2026年6月產品銷售數據彙總\n\n總營業額 NT$19,650,000，較上月成長 6.1%，熱銷品項 10 項，訂單數約 3,420 筆。品類佔比：涼鞋 30%、機能健走鞋 26%、靴類 25%、生活配件 12%、拖鞋 7%。',
          tags: ['銷售', '產品部'],
          systemTags: ['商品文件'],
          lastUpdateBy: 'Lucas',
          lastUpdateTime: '2026-07-01 09:00',
          updateNote: '建立 2026年6月銷售數據彙總',
          sourceFiles: [{ fileId: 'res-sales-2026-06', fileName: '2026年6月銷售明細.xlsx', linkedVersion: 1 }],
          chunks: [
            {
              index: 1,
              sectionPath: '一、銷售總覽',
              content: '2026年6月總營業額 NT$19,650,000，較上月成長 6.1%。訂單數約 3,420 筆，熱銷品項共 10 項。品類佔比：涼鞋 30%、機能健走鞋 26%、靴類 25%、生活配件 12%、拖鞋 7%。',
              tokenCount: 268,
              sourceType: 'text',
              gist: '2026年6月銷售總覽：總營業額 NT$19,650,000、較上月成長 6.1%、熱銷品項 10 項、品類佔比明細。',
              qaPairs: [
                '2026年6月總營業額是多少？',
                '較上月成長多少？',
                '這個月熱銷品項有幾項？',
                '各品類佔比如何分配？',
              ],
              taxonomyTags: ['商品文件/銷售報表/月度彙總'],
              citationCount: 3,
            },
            {
              index: 2,
              sectionPath: '二、熱銷品項明細',
              content: '熱銷前五名：UGG Classic Mini II 雪靴（NT$3,720,000）、Hurricane Trailsetter 健走鞋（NT$3,348,000）、TEVA Hurricane XLT2 涼鞋（NT$2,795,000）、TEVA Original Universal（NT$1,988,000）、UGG Tasman 拖鞋（NT$1,470,000）。',
              tokenCount: 245,
              sourceType: 'text',
              gist: '列出 2026年6月銷售金額前五名的品項與對應營業額。',
              qaPairs: [
                '這個月賣最好的商品是什麼？',
                'UGG Classic Mini II 賣了多少錢？',
                '熱銷前五名有哪些？',
              ],
              taxonomyTags: ['商品文件/銷售報表/熱銷品項'],
              citationCount: 2,
            },
          ],
          embeddingModel: 'text-embedding-3-large',
          embeddingDimension: 3072,
          embeddingCount: 2,
        },
      ],
    },
    {
      id: 'k8',
      title: '三諾產品部輸出報告規範 v1.0',
      category: '規則說明',
      status: 'active',
      sourceType: 'FILE',
      pipelineProgress: 100,
      pipelineStage: null,
      pipelineError: null,
      sourceStale: false,
      staleSourceFileIds: [],
      lastSyncAt: null,
      apiSourceId: null,
      apiSourceName: null,
      lastUpdateTime: '2026-03-02 14:20',
      lastUpdateBy: 'Admin',
      versions: [
        {
          id: 'k8-v1.0',
          knowledgeId: 'k8',
          versionNumber: 'v1.0',
          versionType: 'MAJOR',
          status: 'active',
          title: '三諾產品部輸出報告規範 v1.0',
          summary: '三諾產品部對外輸出報告的必要章節、視覺風格與命名規則。',
          content: '# 三諾產品部輸出報告規範\n\n所有對外輸出報告須包含摘要卡、品類佔比、明細表格三個區塊，並沿用部門既定的視覺配色與檔名規則。',
          tags: ['報告規範', '產品部'],
          systemTags: ['規則說明'],
          lastUpdateBy: 'Admin',
          lastUpdateTime: '2026-03-02 14:20',
          updateNote: '初版發布',
          sourceFiles: [{ fileId: 'res-report-spec-1', fileName: '三諾產品部輸出報告規範.pdf', linkedVersion: 1 }],
          chunks: [
            {
              index: 1,
              sectionPath: '一、必要章節',
              content: '報告須包含三個區塊：（1）摘要卡：總營業額、較上月成長、熱銷品項數、訂單數；（2）品類佔比：以 chip 形式呈現各品類銷售佔比；（3）明細表格：至少含品名、品牌、類別、銷售數量、銷售金額、較上月成長六個欄位。',
              tokenCount: 312,
              sourceType: 'text',
              gist: '報告必須包含摘要卡、品類佔比、明細表格三個區塊，並列出各區塊的必要欄位。',
              qaPairs: [
                '報告一定要有哪些區塊？',
                '摘要卡要放哪些數字？',
                '明細表格至少要有哪些欄位？',
              ],
              taxonomyTags: ['規則說明/報告規範/必要章節'],
              citationCount: 4,
            },
            {
              index: 2,
              sectionPath: '二、視覺與命名規則',
              content: '視覺風格沿用部門既有報告色票（CSS 變數命名慣例：--bg、--surface、--border、--blue）；輸出檔名格式為 sanuo_西元年_兩位數月份_sales_report.html。',
              tokenCount: 198,
              sourceType: 'text',
              gist: '說明報告的配色 CSS 變數慣例與輸出檔名的命名規則。',
              qaPairs: [
                '報告的配色規則是什麼？',
                '報告檔名要怎麼命名？',
              ],
              taxonomyTags: ['規則說明/報告規範/視覺與命名'],
              citationCount: 1,
            },
          ],
          embeddingModel: 'text-embedding-3-large',
          embeddingDimension: 3072,
          embeddingCount: 2,
        },
      ],
    },
  ]);
```

- [ ] **Step 2: Verify types**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 3: Manual verification**

Run: `npm run dev`. If the app has a knowledge-base management page (check the router for a route mounting a component that reads `useKnowledgeStore().knowledgeList`), open it and confirm two new entries appear: "2026Q1產品銷售數據彙總" (商品文件) and "三諾產品部輸出報告規範 v1.0" (規則說明). If no such page exists in this build, skip this visual check — Task 4/5's manual walkthrough will verify the data through the chat citation-chip drawer instead.

- [ ] **Step 4: Commit**

```bash
git add src/stores/knowledgeStore.ts
git commit -m "feat(knowledge): add mock sales-data and report-spec knowledge entries"
```

---

### Task 2: Conversation list entry + canvas reset wiring

**Files:**
- Modify: `src/components/AiViewer/conversationListModal.vue:10-21`
- Modify: `src/components/AiViewer/AiViewerRightBox.vue:942-948`

**Interfaces:**
- Consumes: `currentConversationId` (existing `Ref<string>` from `AiViewerStore`, already used by both files)
- Produces: nothing new consumed by later tasks — this task is self-contained UI wiring

- [ ] **Step 1: Add the conv4 list item and remove the 2-conversation limit copy**

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
        <li :class="{ active: currentConversationId === 'conv4' }" @click="switchConversation('conv4')">
          <span>產品銷售報告整理</span>
          <i class="material-symbols-outlined" @click="deleteFn($event)">delete</i>
        </li>
      </ul>
    </div>
```

- [ ] **Step 2: Reset the canvas when switching to conv4**

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
  } else if (id === 'conv4') {
    aiViewerBlocks.value = [];
  }
}, { immediate: true });
```

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, open a project's AiViewer view.

- Click the chat header title → click "對話列表" → modal shows **3** items: 2026商品文件翻譯 / 未命名對話 / 產品銷售報告整理, and the "一個專案最多兩個對話" line is gone.
- Click "產品銷售報告整理" → modal closes, canvas is empty (no blocks). The chat header title will still show conv1's title at this point ("未命名對話" fallback) — expected, fixed in Task 3.
- Click "2026商品文件翻譯" then "未命名對話" → confirm both still work exactly as before (regression check).

- [ ] **Step 4: Commit**

```bash
git add src/components/AiViewer/conversationListModal.vue src/components/AiViewer/AiViewerRightBox.vue
git commit -m "feat(ai-viewer): add conv4 entry to conversation list"
```

---

### Task 3: conv4 state, entry point, and shared-computed wiring

**Files:**
- Modify: `src/components/AiViewer/AiViewerRightBox.vue:936-940` (`currentConversationTitle`)
- Modify: `src/components/AiViewer/AiViewerRightBox.vue:988-1010` (`cannedTaskItems` / `sendCannedTask`)
- Modify: `src/components/AiViewer/AiViewerRightBox.vue:2433-2434` (insert the new conv4 state block right after the `// -------- end Conversation 2 流程 --------` marker, same insertion point the existing conv3 plan uses for conv3's state block)
- Modify: `src/components/AiViewer/AiViewerRightBox.vue:2435-2480` (`testMsgs` / `resetConversation`, now immediately following the inserted block)

**Interfaces:**
- Consumes: `currentConversationId` (store), `AiAgentChatListScrollTo` (existing local function), `nextTick` (Vue import already present), `KnowledgeSource` interface (already declared at line 764)
- Produces (used by Tasks 4 & 5): `conv4Msgs: Ref<any[]>`, `conv4Title: Ref<string>`, `CONV4_SOURCES: KnowledgeSource[]`, `c4Push(msg: any): void`, `c4Scroll(): void`

- [ ] **Step 1: Extend `currentConversationTitle`**

Replace lines 936-940:

```typescript
const conv1Title = ref('未命名對話');
const currentConversationTitle = computed(() => {
  if (currentConversationId.value === 'conv2') return conv2Title.value || '未命名對話';
  return conv1Title.value;
});
```

with:

```typescript
const conv1Title = ref('未命名對話');
const currentConversationTitle = computed(() => {
  if (currentConversationId.value === 'conv2') return conv2Title.value || '未命名對話';
  if (currentConversationId.value === 'conv4') return conv4Title.value || '產品銷售報告整理';
  return conv1Title.value;
});
```

(`conv4Title` is declared in Step 3 below — safe forward reference since this getter isn't invoked until after the whole `<script setup>` body has run.)

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
  if (currentConversationId.value === 'conv4') {
    return [{ id: 'salesReport', text: '整理上月產品銷售報告' }];
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
  if (currentConversationId.value === 'conv4' && item.id === 'salesReport') {
    resetConversation();
    nextTick(() => conv4InitFlow());
    return;
  }
  send();
}
```

- [ ] **Step 3: Insert the conv4 state block and `CONV4_SOURCES`**

In `src/components/AiViewer/AiViewerRightBox.vue`, find the line:

```typescript
// -------- end Conversation 2 流程 --------
```

(immediately before the `testMsgs` computed at line 2435) and insert this new block directly after it:

```typescript
// -------- Conversation 4 流程 --------
const conv4Msgs = ref<any[]>([]);
let conv4IdCounter = 2;
const conv4Title = ref('');

function c4Push(msg: any) {
  conv4Msgs.value.push({ id: `c4_${conv4IdCounter++}`, ...msg });
}
function c4Scroll() {
  nextTick(() => AiAgentChatListScrollTo('ASC'));
}

const CONV4_SOURCES: KnowledgeSource[] = [
  { knowledgeId: 'k7', title: '2026Q1產品銷售', chunkIndexes: [0, 1] },
  { knowledgeId: 'k8', title: '三諾產品部輸出報告規範', chunkIndexes: [0, 1] },
];
// -------- end Conversation 4 流程（函式將於後續任務接續新增）--------
```

(`KnowledgeSource` is already declared as an interface at line 764, and `MOCK_SOURCES` at line 1246 already demonstrates the same type — this just reuses it.)

> `chunkIndexes: [0, 1]` — array indices into `versions[0].chunks`, i.e. the first and second chunk objects (which carry `index: 1` and `index: 2` as their own *display* numbering field; `getSrcChunks` in `KnowledgeSourceDrawer.vue` indexes into the `chunks` array positionally with `src.chunkIndexes.map(idx => version.chunks[idx])`, so `0` and `1` correctly select both chunks added in Task 1).

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
    : currentConversationId.value === 'conv4' ? conv4Msgs.value
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
  if (currentConversationId.value === 'conv4') {
    conv4IdCounter = 2;
    conv4Title.value = '';
    conv4Msgs.value = [];
  }
  nextTick(() => AiAgentChatListScrollTo('ASC'));
}
```

- [ ] **Step 5: Verify types and manual walkthrough**

Run: `npm run type-check`
Expected: errors referencing `conv4InitFlow` not defined (it's added in Task 4) — this is expected at this intermediate point; note it and continue, or if the workflow requires a fully green intermediate state, temporarily stub `function conv4InitFlow() {}` right after the Step 3 block and remove the stub in Task 4 Step 1. Prefer running Tasks 3 and 4 together in one commit if `type-check` must stay green at every commit.

Run: `npm run dev`, open AiViewer, switch to conv4 via the conversation list.

- Chat header title now correctly shows "產品銷售報告整理".
- Click the ⚡ (快速任務) button → exactly one item appears: "整理上月產品銷售報告".
- Switch to conv1 and conv2 and confirm both are unaffected (regression check for the shared `cannedTaskItems`/`sendCannedTask`/`testMsgs`/`resetConversation` edits).

- [ ] **Step 6: Commit**

```bash
git add src/components/AiViewer/AiViewerRightBox.vue
git commit -m "feat(ai-viewer): wire up conv4 state, entry point, and shared computeds"
```

---

### Task 4: conv4 script — request, progress card, report, and citation chips

**Files:**
- Modify: `src/components/AiViewer/AiViewerRightBox.vue` script — replace the Task 3 end-marker comment with the real conv4 flow functions

**Interfaces:**
- Consumes: `conv4Msgs`, `conv4Title`, `c4Push`, `c4Scroll`, `CONV4_SOURCES` (Task 3), `addReportBlock` (existing, destructured from `aiviewerStore` at the top of the script), `htmlIcon` (existing import)
- Produces (used by Task 5): `conv4InitFlow(): void`, `conv4FlipSearchCard(from: string[], to: string[]): void`

- [ ] **Step 1: Replace the Task 3 end marker with the real flow functions**

Replace:

```typescript
// -------- end Conversation 4 流程（函式將於後續任務接續新增）--------
```

with:

```typescript
function conv4InitFlow() {
  if (conv4Msgs.value.length > 0) return;
  conv4Title.value = '產品銷售報告整理';
  c4Push({ forUser: true, msg: '請幫我整理上個月的產品銷售報告，相關資料請幫我查詢 @2026Q1產品銷售，輸出格式請參考 @三諾產品部輸出報告規範' });
  setTimeout(() => {
    c4Push({ msg: `收到，我先查詢資料並套用指定的輸出格式規範⋯<div class="conv2-search-card">
  <div class="conv2-ss conv2-ss--active">SalesDataQuery 查詢 2026Q1 產品銷售數據</div>
  <div class="conv2-ss conv2-ss--wait">ReportFormatter 套用三諾產品部輸出報告規範</div>
</div>` });
    c4Scroll();
    setTimeout(() => {
      conv4FlipSearchCard(['conv2-ss--active', 'conv2-ss--wait'], ['conv2-ss--done', 'conv2-ss--done']);
      try {
        addReportBlock('/justagent/sanuo_2026_06_sales_report.html', '2026年6月產品銷售報告.html');
      } catch (e) { /* 畫布可能尚未初始化 */ }
      c4Push({
        finishResponse: true,
        msg: `✅ 已完成上個月（6月）產品銷售報告，報告已加入畫布，可直接查看或下載。<div class="oneFileItem">
  <img class="file-icon" src="${htmlIcon}" />
  <div class="file-info-box">
    <div class="file-name">2026年6月產品銷售報告.html</div>
    <div class="file-size">HTML · 5.8 KB · 已加到畫布</div>
  </div>
</div>`,
        sources: CONV4_SOURCES,
      });
      c4Scroll();
      setTimeout(() => conv4AskBuildSkill(), 600);
    }, 1800);
  }, 300);
}

// 尋找最後一則含 'conv2-search-card' 的訊息，把指定 class 依序替換（比照 conv2 系列訊息的做法）
function conv4FlipSearchCard(from: string[], to: string[]) {
  const msgs = conv4Msgs.value;
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].msg?.includes('conv2-search-card')) {
      let msg = msgs[i].msg as string;
      from.forEach((f, idx) => { msg = msg.replace(f, to[idx]); });
      conv4Msgs.value[i] = { ...msgs[i], msg };
      return;
    }
  }
}
// -------- end Conversation 4 流程（Skill 建議函式將於下一個任務新增）--------
```

- [ ] **Step 2: Verify types**

Run: `npm run type-check`
Expected: error `conv4AskBuildSkill` is not defined (added in Task 5). This is expected — Task 4 and Task 5 together form one fully type-checkable state. If a green intermediate commit is required, add a temporary `function conv4AskBuildSkill() {}` stub here and remove it in Task 5 Step 1.

- [ ] **Step 3: Manual walkthrough**

Run: `npm run dev`, switch to conv4, click ⚡ → "整理上月產品銷售報告".

- User bubble shows the request text with the two `@`-mentions as plain text.
- ~300ms later, an AI bubble shows the two-step progress card (`SalesDataQuery` active, `ReportFormatter` waiting).
- ~1.8s later, both steps flip to "done", a new HTML block appears on the canvas (may show blank/404 until Task 6 creates the file — expected at this point), a completion message appears with a file-download card, and a "參考來源" chip row shows two chips: "2026Q1產品銷售" and "三諾產品部輸出報告規範".
- Click either chip → the knowledge drawer opens; confirm each shows two chunk entries with real gist/section-path text (from Task 1's `k7`/`k8` data), not an empty list.
- ~600ms after the completion message, nothing further appears yet (expected — Task 5 adds the Skill-suggestion message).

- [ ] **Step 4: Commit**

```bash
git add src/components/AiViewer/AiViewerRightBox.vue
git commit -m "feat(ai-viewer): add conv4 request/progress/report flow with source citations"
```

---

### Task 5: Skill-suggestion interaction

**Files:**
- Modify: `src/components/AiViewer/AiViewerRightBox.vue` script — replace the Task 4 end marker with `conv4AskBuildSkill`, `conv4BuildSkill`, `conv4SkipSkill`
- Modify: `src/components/AiViewer/AiViewerRightBox.vue:2147-2153` (`handleChatAreaClick` — insert two new `data-action` branches before the existing conv1 branches)

**Interfaces:**
- Consumes: `conv4Msgs`, `c4Push`, `c4Scroll` (Task 3), `conv4InitFlow`/`conv4FlipSearchCard` (Task 4, not directly called here but same section)
- Produces: nothing consumed by later tasks (Task 6 is independent; Task 7 is verification only)

- [ ] **Step 1: Replace the Task 4 end marker with the Skill-suggestion functions**

Replace:

```typescript
// -------- end Conversation 4 流程（Skill 建議函式將於下一個任務新增）--------
```

with:

```typescript
function conv4AskBuildSkill() {
  c4Push({
    msg: `我留意到「查詢銷售資料＋套用部門報告規範」這類整理流程你之後可能會重複用到。要不要我把這個流程存成一個 Skill，之後產品部同仁都能快速套用？
<div class="conv1-quick-btns" style="margin-top:8px">
  <span class="conv1-quick-btn" data-action="conv4-build-skill">是，幫我建立 Skill</span>
  <span class="conv1-quick-btn" data-action="conv4-skip-skill">不用了</span>
</div>`,
  });
  c4Scroll();
}

function conv4BuildSkill() {
  c4Push({ forUser: true, msg: '是，幫我建立 Skill' });
  c4Scroll();
  setTimeout(() => {
    c4Push({
      finishResponse: true,
      msg: `<div style="border:1px solid #e4e7ed;border-radius:10px;padding:10px 12px;margin-bottom:8px;display:flex;gap:10px;align-items:flex-start">
  <span style="font-size:20px;line-height:1">🧩</span>
  <div>
    <div style="font-weight:700">產品銷售報告整理</div>
    <div style="font-size:12px;color:#5c6370;margin-top:2px">查詢指定月份產品銷售數據，並依三諾產品部輸出報告規範自動產出報告</div>
  </div>
</div>✅ Skill「產品銷售報告整理」已建立，之後產品部同仁都能快速套用這個流程。`,
    });
    c4Scroll();
  }, 500);
}

function conv4SkipSkill() {
  c4Push({ forUser: true, msg: '不用了' });
  c4Scroll();
  setTimeout(() => {
    c4Push({ msg: '好的，這次的報告已保留在畫布中，之後有需要歡迎再跟我說一聲！' });
    c4Scroll();
  }, 500);
}
// -------- end Conversation 4 流程 --------
```

- [ ] **Step 2: Wire up the two new buttons in `handleChatAreaClick`**

In `src/components/AiViewer/AiViewerRightBox.vue`, replace lines 2147-2153:

```typescript
  // conv1 下一步快速按鈕
  if (action === 'conv1-next-step') {
    const msg = value;
    conv1Msgs.value.push({ id: 'btn-user-' + Date.now(), forUser: true, msg });
    nextTick(() => AiAgentChatListScrollTo('ASC'));
    processConv1Msg(msg);
    return;
  }
```

with:

```typescript
  // conv1 下一步快速按鈕
  if (action === 'conv1-next-step') {
    const msg = value;
    conv1Msgs.value.push({ id: 'btn-user-' + Date.now(), forUser: true, msg });
    nextTick(() => AiAgentChatListScrollTo('ASC'));
    processConv1Msg(msg);
    return;
  }

  // conv4 是否建立 Skill 快速按鈕
  if (action === 'conv4-build-skill') {
    conv4BuildSkill();
    return;
  }
  if (action === 'conv4-skip-skill') {
    conv4SkipSkill();
    return;
  }
```

- [ ] **Step 3: Verify types and manual walkthrough**

Run: `npm run type-check`
Expected: no errors.

Run: `npm run dev`, replay the conv4 flow from the start (click ⚡ → "整理上月產品銷售報告", wait for the report to complete).

- After the completion message + source chips, a new AI bubble appears asking about building a Skill, with two clickable buttons: "是，幫我建立 Skill" / "不用了".
- Click "是，幫我建立 Skill" → a user bubble echoes the choice, then ~500ms later a confirmation bubble shows a bordered mini card (🧩 icon, "產品銷售報告整理" title, one-line description) followed by "✅ Skill「產品銷售報告整理」已建立...".
- Reset (switch to conv1 then back to conv4, or reload) and replay, this time clicking "不用了" → a user bubble echoes it, then ~500ms later "好的，這次的報告已保留在畫布中...".
- Switch to conv1/conv2 and confirm both are unaffected (regression check for the `handleChatAreaClick` edit).

- [ ] **Step 4: Commit**

```bash
git add src/components/AiViewer/AiViewerRightBox.vue
git commit -m "feat(ai-viewer): add conv4 skill-suggestion interaction"
```

---

### Task 6: Sales report HTML

**Files:**
- Create: `public/sanuo_2026_06_sales_report.html`

**Interfaces:**
- Consumes: nothing (static standalone file)
- Produces: a file served at build/runtime as `/justagent/sanuo_2026_06_sales_report.html` (via the Vite `base: '/justagent/'` config already in `vite.config.ts`), matching the URL `conv4InitFlow` (Task 4) passes to `addReportBlock`

- [ ] **Step 1: Create the report file**

Create `public/sanuo_2026_06_sales_report.html` with this exact content (mirrors the CSS-variable design language already used by `public/hurricane_trailsetter_marketing_strategy.html`):

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>三諾產品部 2026年6月產品銷售報告</title>
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
  .stat-val.up { color: var(--green); }
  .section-title { font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--text-3); margin: 22px 0 10px; }
  .tag-summary { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 6px; }
  .tag-chip { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; background: var(--surface2); border: 1px solid var(--border); color: var(--text-2); }
  table { width: 100%; border-collapse: collapse; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
  thead th { text-align: left; font-size: 10px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--text-3); background: var(--surface2); padding: 10px 12px; border-bottom: 1px solid var(--border); }
  tbody td { padding: 10px 12px; border-bottom: 1px solid var(--border); font-size: 12px; vertical-align: top; }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover { background: var(--blue-light); }
  .name-cell { font-weight: 700; }
  .growth-up { color: var(--green); font-weight: 600; }
  .growth-down { color: #dc2626; font-weight: 600; }
</style>
</head>
<body>
  <div class="report-header">
    <div>
      <div class="report-brand">JustAgent · 產品銷售報告</div>
      <div class="report-title">三諾產品部 2026年6月產品銷售報告</div>
      <div class="report-meta">資料來源：2026Q1產品銷售 · 輸出格式：三諾產品部輸出報告規範 v1.0</div>
    </div>
    <span class="report-tag">已完成</span>
  </div>

  <div class="stat-row">
    <div class="stat-card"><div class="stat-val">NT$19,650,000</div><div class="stat-lbl">總營業額</div></div>
    <div class="stat-card"><div class="stat-val up">+6.1%</div><div class="stat-lbl">較上月成長</div></div>
    <div class="stat-card"><div class="stat-val">10</div><div class="stat-lbl">熱銷品項數</div></div>
    <div class="stat-card"><div class="stat-val">3,420</div><div class="stat-lbl">訂單數</div></div>
  </div>

  <div class="section-title">品類佔比</div>
  <div class="tag-summary">
    <span class="tag-chip">涼鞋 30%</span>
    <span class="tag-chip">機能健走鞋 26%</span>
    <span class="tag-chip">靴類 25%</span>
    <span class="tag-chip">生活配件 12%</span>
    <span class="tag-chip">拖鞋 7%</span>
  </div>

  <div class="section-title">產品銷售明細</div>
  <table>
    <thead>
      <tr><th>品名</th><th>品牌</th><th>類別</th><th>銷售數量</th><th>銷售金額</th><th>較上月成長</th></tr>
    </thead>
    <tbody>
      <tr><td class="name-cell">UGG Classic Mini II 雪靴</td><td>UGG</td><td>靴類</td><td>1,240 雙</td><td>NT$3,720,000</td><td class="growth-up">+4.2%</td></tr>
      <tr><td class="name-cell">Hurricane Trailsetter 健走鞋</td><td>Hurricane Trailsetter</td><td>機能健走鞋</td><td>1,860 雙</td><td>NT$3,348,000</td><td class="growth-up">+7.1%</td></tr>
      <tr><td class="name-cell">TEVA Hurricane XLT2 涼鞋</td><td>TEVA</td><td>涼鞋</td><td>2,150 雙</td><td>NT$2,795,000</td><td class="growth-up">+9.6%</td></tr>
      <tr><td class="name-cell">TEVA Original Universal</td><td>TEVA</td><td>涼鞋</td><td>1,530 雙</td><td>NT$1,988,000</td><td class="growth-up">+5.8%</td></tr>
      <tr><td class="name-cell">Hurricane Verge 水陸機能鞋</td><td>Hurricane Trailsetter</td><td>機能健走鞋</td><td>760 雙</td><td>NT$1,672,000</td><td class="growth-up">+11.4%</td></tr>
      <tr><td class="name-cell">UGG Tasman 拖鞋</td><td>UGG</td><td>拖鞋</td><td>980 雙</td><td>NT$1,470,000</td><td class="growth-up">+2.3%</td></tr>
      <tr><td class="name-cell">UGG Neumel 短靴</td><td>UGG</td><td>靴類</td><td>690 雙</td><td>NT$1,242,000</td><td class="growth-down">-1.8%</td></tr>
      <tr><td class="name-cell">瑜珈墊（環保材質）</td><td>自有品牌</td><td>生活配件</td><td>1,120 件</td><td>NT$1,344,000</td><td class="growth-up">+6.9%</td></tr>
      <tr><td class="name-cell">TEVA ReEmber 保暖涼鞋</td><td>TEVA</td><td>涼鞋</td><td>540 雙</td><td>NT$1,021,000</td><td class="growth-up">+8.0%</td></tr>
      <tr><td class="name-cell">機能運動襪 3 入組</td><td>自有品牌</td><td>生活配件</td><td>4,200 組</td><td>NT$1,050,000</td><td class="growth-up">+3.5%</td></tr>
    </tbody>
  </table>
</body>
</html>
```

- [ ] **Step 2: Verify the report renders**

Run: `npm run dev`. Navigate directly to `http://localhost:<port>/justagent/sanuo_2026_06_sales_report.html` in a browser tab.

- The page renders without console errors: header, 4 stat cards (totals matching the shared-numbers table above), 5 品類佔比 chips, and the 10-row table are all visible, styled consistently with the existing `hurricane_trailsetter_*.html` report.
- Confirm the 10 row values sum to NT$19,650,000 (matches the "總營業額" stat card) — this was computed by hand when the numbers were chosen, re-add them here to double check: 3,720,000 + 3,348,000 + 2,795,000 + 1,988,000 + 1,672,000 + 1,470,000 + 1,242,000 + 1,344,000 + 1,021,000 + 1,050,000 = 19,650,000.
- Back in the AiViewer canvas, replay conv4's flow and confirm the HTML block added by `conv4InitFlow` now shows this same content instead of a blank/404 iframe.

- [ ] **Step 3: Commit**

```bash
git add public/sanuo_2026_06_sales_report.html
git commit -m "feat(ai-viewer): add 2026-06 sales report HTML for conv4"
```

---

### Task 7: Final regression pass

**Files:** none (verification only — no code changes expected)

**Interfaces:** N/A

- [ ] **Step 1: Static checks**

Run: `npm run lint`
Expected: no errors (pre-existing warnings acceptable; do not introduce new ones).

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 2: Full manual walkthrough**

Run: `npm run dev`, open a project's AiViewer view, and in one sitting:

1. Open "對話列表" → confirm 3 items, no "最多兩個對話" text.
2. Run conv1's translation flow start-to-finish → confirm unaffected by this change.
3. Run conv2's "商品競品分析" canned task through to completion → confirm unaffected.
4. Run conv4's "整理上月產品銷售報告" canned task through to completion:
   - Request bubble with the two `@`-mentions.
   - Progress card flips from active/wait to done.
   - Report added to canvas, matches Task 6's file.
   - "參考來源" chips open the drawer with real `k7`/`k8` content.
   - Skill-suggestion message appears with two buttons.
   - Clicking "是，幫我建立 Skill" shows the mini card + confirmation.
5. Switch back to conv4 fresh (reload or switch away and back), replay, this time click "不用了" → confirm the decline message appears instead.
6. Switch between all three conversations a few times → confirm no console errors and no cross-conversation state leakage (e.g. conv2's messages never show while on conv4, and vice versa).

If any issue is found, fix it in a follow-up commit (not a new task — this plan ends here); otherwise no commit is needed for this task.

---

## Self-Review Notes (from plan authoring)

- **Spec coverage:** all sections of `docs/superpowers/specs/2026-07-30-sales-report-skill-suggestion-conversation-design.md` are covered — knowledge base entries (Task 1), conversation list (Task 2), entry mechanism + shared wiring (Task 3), request/progress/report/citations (Task 4), Skill-suggestion interaction (Task 5), HTML report (Task 6), regression (Task 7).
- **Type/name consistency check:** `conv4Msgs`, `conv4Title`, `conv4IdCounter`, `c4Push`/`c4Scroll`, `CONV4_SOURCES`, `conv4InitFlow`, `conv4FlipSearchCard`, `conv4AskBuildSkill`, `conv4BuildSkill`, `conv4SkipSkill` are spelled identically everywhere they're declared and used across Tasks 3–5. `data-action` values (`conv4-build-skill`, `conv4-skip-skill`) match between the template string in Task 5 Step 1 and the `handleChatAreaClick` branches in Task 5 Step 2.
- **Data consistency check:** 總營業額 NT$19,650,000 appears identically in Task 1's `k7` chunk 1, Task 4's nothing (the chat message doesn't restate the number, only cites the source), and Task 6's stat card + is verified against the sum of the 10 table rows. 熱銷品項數 "10" matches the 10 rows in Task 6's table (not the earlier draft's mismatched "12").
- **Report URL consistency check:** `conv4InitFlow` (Task 4) calls `addReportBlock('/justagent/sanuo_2026_06_sales_report.html', ...)` and Task 6 creates `public/sanuo_2026_06_sales_report.html` — matches the existing `vite.config.ts` `base: '/justagent/'` rewrite already used by conv1's local reports.
- **Knowledge chunk index check:** `CONV4_SOURCES` (Task 3) uses `chunkIndexes: [0, 1]` — positional array indices, not the chunks' own `index: 1`/`index: 2` display field — matching how `KnowledgeSourceDrawer.vue`'s `getSrcChunks` actually indexes (`version.chunks[idx]`), same as the existing `MOCK_SOURCES` precedent (`k5`, `chunkIndexes: [0, 1]`).
