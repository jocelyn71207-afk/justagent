# TEVA 涼鞋通路銷售與會員輪廓分析對話（conv6）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new AiViewer conversation (conv6 — conv5 was concurrently claimed by another in-flight spec/plan for a different scenario) where a marketing manager types a free-text question about TEVA sandal channel sales and member profile; the agent mocks an MCP query against Adobe Commerce/Magento, renders two Chart.js blocks on the canvas, offers three report options, and — when the user picks "通路銷售深度分析報告" — renders a full static HTML report on the canvas (the other two options show a placeholder).

**Architecture:** Follows the exact conventions already used for conv1 (free-text entry + keyword dispatch via `processConv1Msg`) and conv4 (`.conv2-search-card` progress card + `.conv1-quick-btn` follow-up buttons + `addReportBlock`/`addChartBlock`). All new logic is scripted inline in `AiViewerRightBox.vue` — no new components, no new composables, no new SCSS files.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Pinia (`AiViewerStore.ts`, `knowledgeStore.ts`), Chart.js (via existing `addChartBlock`/`chartAdapter`), static HTML served from `public/` under the `/justagent/` base path.

## Global Constraints

- 使用 `<script setup lang="ts">`，禁止 Options API（來自 `CLAUDE.md`）。
- 樣式統一在 `src/scss/` 管理，禁止 `<style scoped>`（來自 `CLAUDE.md`）——本計畫不新增任何 SCSS 檔案，全部沿用既有 class。
- 所有 import 使用 `@/` alias（來自 `CLAUDE.md`）。
- 這個功能區（AiViewer 對話腳本 `AiViewerRightBox.vue`）比照 conv1/conv2/conv4 現況，**完全沒有 Vitest 單元測試**——每個任務用 `npm run type-check` +（必要時）`npm run lint` 做靜態驗證，再啟動 `npm run dev` 於瀏覽器手動操作驗證該任務的可觀察行為，不新增測試檔案。
- 不引入新元件、新 composable 或新的訊息型別系統；訊息物件維持 `ref<any[]>` 的 ad hoc 寫法，與 conv1/conv2/conv4 一致。
- 對話腳本一律走 `setTimeout` 節奏（300ms → 1800ms → 600ms → 500ms），沿用 conv4 的時序慣例。
- 規格文件：`docs/superpowers/specs/2026-07-31-teva-channel-member-conversation-design.md`（已核准）。

---

### Task 1: conv6 進入點與共用狀態串接

**Files:**
- Modify: `src/components/AiViewer/conversationListModal.vue:19-22`
- Modify: `src/components/AiViewer/AiViewerRightBox.vue:937-951`（`currentConversationTitle` / `watch(currentConversationId)`）
- Modify: `src/components/AiViewer/AiViewerRightBox.vue:1160-1171`（`send()`）
- Modify: `src/components/AiViewer/AiViewerRightBox.vue:2560`（`conv4` 流程區塊結束處，插入新的 `conv6` 狀態區塊）
- Modify: `src/components/AiViewer/AiViewerRightBox.vue:2562-2568`（`testMsgs`）
- Modify: `src/components/AiViewer/AiViewerRightBox.vue:2570-2615`（`resetConversation()`）

**Interfaces:**
- Produces: `conv6Msgs: Ref<any[]>`, `conv6Title: Ref<string>`, `conv6ReportChoiceMade: Ref<boolean>`, `c6Push(msg: any): void`, `c6Scroll(): void`, `processConv6Msg(msg: string): void`（此任務先實作「無關鍵字比對，一律給引導語」的版本；Task 3 會替換為真正的關鍵字比對＋分析流程）。
- Consumes：既有的 `currentConversationId`（`storeToRefs(aiviewerStore)`，已在檔案頂部解構）、`AiAgentChatListScrollTo`、`userInputModal`、`aiViewerBlocks`。

- [ ] **Step 1: 對話列表新增 conv6 項目**

在 `src/components/AiViewer/conversationListModal.vue` 第 19–22 行（`conv4` 的 `<li>`）之後插入：

```html
        <li :class="{ active: currentConversationId === 'conv6' }" @click="switchConversation('conv6')">
          <span>TEVA涼鞋銷售分析</span>
          <i class="material-symbols-outlined" @click="deleteFn($event)">delete</i>
        </li>
```

- [ ] **Step 2: `currentConversationTitle` 與畫布重置 `watch` 新增 conv6 分支**

把 `src/components/AiViewer/AiViewerRightBox.vue:937-951` 改成：

```typescript
const currentConversationTitle = computed(() => {
  if (currentConversationId.value === 'conv2') return conv2Title.value || '未命名對話';
  if (currentConversationId.value === 'conv4') return conv4Title.value || '產品銷售報告整理';
  if (currentConversationId.value === 'conv6') return conv6Title.value || 'TEVA涼鞋銷售分析';
  return conv1Title.value;
});

watch(currentConversationId, (id) => {
  if (id === 'conv1') {
    aiViewerBlocks.value = [];
  } else if (id === 'conv2') {
    aiViewerBlocks.value = [...aiviewerStore.INITIAL_BLOCKS];
  } else if (id === 'conv4') {
    aiViewerBlocks.value = [];
  } else if (id === 'conv6') {
    aiViewerBlocks.value = [];
  }
}, { immediate: true });
```

- [ ] **Step 3: 新增 conv6 狀態區塊與 stub 版 `processConv6Msg`**

在 `src/components/AiViewer/AiViewerRightBox.vue:2560`（`// -------- end Conversation 4 流程 --------` 這一行）之後插入一整個新區塊：

```typescript
// -------- start Conversation 6 流程 --------
const conv6Msgs = ref<any[]>([]);
let conv6IdCounter = 2;
const conv6Title = ref('');
const conv6ReportChoiceMade = ref(false);
function c6Push(msg: any) { conv6Msgs.value.push({ id: `c6_${conv6IdCounter++}`, ...msg }); }
function c6Scroll() { nextTick(() => AiAgentChatListScrollTo('ASC')); }

function processConv6Msg(msg: string) {
  if (conv6Msgs.value.length > 1) {
    setTimeout(() => { c6Push({ msg: '這個對話目前僅示範單一分析情境，如需查看其他洞察，歡迎開新對話 🙌' }); c6Scroll(); }, 400);
    return;
  }
  setTimeout(() => { c6Push({ msg: '目前僅能協助 TEVA 涼鞋相關的銷售與會員輪廓分析，請描述您想了解的通路或會員面向 🙏' }); c6Scroll(); }, 400);
}
// -------- end Conversation 6 流程 --------
```

> 這裡刻意先讓 `processConv6Msg` 對任何輸入都回覆引導語，讓 Task 1 有獨立可驗證的行為；Task 3 會把函式本體換成真正的關鍵字比對＋分析流程，函式簽章 `processConv6Msg(msg: string): void` 不變。

- [ ] **Step 4: `send()` 新增 conv6 自由輸入分支**

把 `src/components/AiViewer/AiViewerRightBox.vue:1160-1171` 改成：

```typescript
function send() {
  if (currentConversationId.value === 'conv1') {
    const msg = userInputModal.value.msg.trim();
    if (!msg) return;
    conv1Msgs.value.push({ id: 'user-' + Date.now(), forUser: true, msg });
    userInputModal.value.msg = '';
    nextTick(() => AiAgentChatListScrollTo('ASC'));
    processConv1Msg(msg);
    return;
  }
  if (currentConversationId.value === 'conv6') {
    const msg = userInputModal.value.msg.trim();
    if (!msg) return;
    conv6Msgs.value.push({ id: 'user-' + Date.now(), forUser: true, msg });
    userInputModal.value.msg = '';
    nextTick(() => AiAgentChatListScrollTo('ASC'));
    processConv6Msg(msg);
    return;
  }
  sendUserInput();
}
```

- [ ] **Step 5: `testMsgs` 擴充為四選一**

把 `src/components/AiViewer/AiViewerRightBox.vue:2562-2568` 改成：

```typescript
const testMsgs = computed(() => {
  const msgs = currentConversationId.value === 'conv2' ? conv2Msgs.value
    : currentConversationId.value === 'conv4' ? conv4Msgs.value
    : currentConversationId.value === 'conv6' ? conv6Msgs.value
    : conv1Msgs.value;
  // 未確認的 translationConfirm 不在河道上顯示任何泡泡
  return msgs.filter((m: any) => !(m.cardType === 'translationConfirm' && !m.confirmed));
});
```

- [ ] **Step 6: `resetConversation()` 新增 conv6 分支**

在 `src/components/AiViewer/AiViewerRightBox.vue:2608-2613`（`conv4` 的 `if` 區塊）之後插入：

```typescript
  if (currentConversationId.value === 'conv6') {
    conv6IdCounter = 2;
    conv6Title.value = '';
    conv6Msgs.value = [];
    conv6ReportChoiceMade.value = false;
  }
```

- [ ] **Step 7: 型別與 lint 檢查**

Run: `npm run type-check`
Expected: 無新增錯誤（原有錯誤數量不變）。

Run: `npm run lint`
Expected: 無新增 lint 錯誤。

- [ ] **Step 8: 手動瀏覽器驗證**

Run: `npm run dev`，開啟 AiViewer 頁面 → 點開對話列表 → 應看到「TEVA涼鞋銷售分析」項目 → 點擊切換進去（空對話、畫布清空）→ 在輸入框打任意文字（例如「你好」）送出 → 應看到自己的訊息泡泡，接着 ~400ms 後看到 AI 回覆「目前僅能協助 TEVA 涼鞋相關的銷售與會員輪廓分析⋯」。

- [ ] **Step 9: Commit**

```bash
git add src/components/AiViewer/conversationListModal.vue src/components/AiViewer/AiViewerRightBox.vue
git commit -m "feat(ai-viewer): wire up conv6 entry point and shared computeds"
```

---

### Task 2: 知識庫新增 TEVA 通路銷售與會員分群兩筆項目

**Files:**
- Modify: `src/stores/knowledgeStore.ts:719-789`（`k8` 項目結束後、`]);` 之前）

**Interfaces:**
- Produces: `knowledgeList` 新增 `id: 'k13'`、`id: 'k14'` 兩筆 `KnowledgeItem`，供 Task 3 的 `CONV6_SOURCES` 以 `knowledgeId: 'k13'` / `'k14'` 引用。
- Consumes: 現有 `KnowledgeItem` / `KnowledgeVersion` / `chunk` 型別（檔案內既有定義，不需改動）。

- [ ] **Step 1: 在 `k8` 之後、陣列收尾 `]);` 之前插入 `k13`、`k14`**

在 `src/stores/knowledgeStore.ts` 第 788 行（`k8` 物件的收尾 `},`）之後插入：

```typescript
    {
      id: 'k13',
      title: 'TEVA涼鞋2026Q2通路銷售數據彙總',
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
      lastUpdateTime: '2026-07-05 10:00',
      lastUpdateBy: 'Lucas',
      versions: [
        {
          id: 'k13-v1.0',
          knowledgeId: 'k13',
          versionNumber: 'v1.0',
          versionType: 'MAJOR',
          status: 'active',
          title: 'TEVA涼鞋2026Q2通路銷售數據彙總',
          summary: 'TEVA涼鞋2026年第二季（4-6月）各通路銷售額、年成長率與熱銷款式彙總。',
          content: '# TEVA涼鞋 2026Q2 通路銷售數據彙總\n\n總銷售額 NT$51,200,000，較去年同期成長 12.6%。通路別：官網直營 1,240萬（+18%）、天貓旗艦店 980萬（+32%）、蝦皮商城 760萬（+9%）、實體門市 1,530萬（-4%）、經銷通路 610萬（+6%）。',
          tags: ['銷售', 'TEVA', '通路'],
          systemTags: ['商品文件'],
          lastUpdateBy: 'Lucas',
          lastUpdateTime: '2026-07-05 10:00',
          updateNote: '建立 2026Q2 TEVA涼鞋通路銷售數據彙總',
          sourceFiles: [{ fileId: 'res-teva-sales-2026-q2', fileName: 'TEVA_2026Q2銷售明細.xlsx', linkedVersion: 1 }],
          chunks: [
            {
              index: 1,
              sectionPath: '一、通路銷售總覽',
              content: 'TEVA涼鞋2026Q2總銷售額 NT$51,200,000，較去年同期成長 12.6%。五大通路：官網直營 1,240萬元（YoY +18%）、天貓旗艦店 980萬元（YoY +32%）、蝦皮商城 760萬元（YoY +9%）、實體門市 1,530萬元（YoY -4%）、經銷通路 610萬元（YoY +6%）。',
              tokenCount: 256,
              sourceType: 'text',
              gist: 'TEVA涼鞋2026Q2各通路銷售額與年成長率彙總。',
              qaPairs: [
                'TEVA涼鞋這一季總銷售額是多少？',
                '哪個通路成長最快？',
                '實體門市這一季表現如何？',
              ],
              taxonomyTags: ['商品文件/銷售報表/通路彙總'],
              citationCount: 2,
            },
            {
              index: 2,
              sectionPath: '二、熱銷款式與尺碼分布',
              content: '熱銷前三名款式：TEVA Hurricane XLT2（占通路總銷量 28%）、TEVA Original Universal（22%）、TEVA Midform Universal（15%）。尺碼分布集中於 US 7-9（女）與 US 9-11（男），合計占比 64%。',
              tokenCount: 210,
              sourceType: 'text',
              gist: 'TEVA涼鞋熱銷款式排行與主力尺碼分布。',
              qaPairs: [
                '這一季賣最好的TEVA款式是什麼？',
                '尺碼主要集中在哪個區間？',
              ],
              taxonomyTags: ['商品文件/銷售報表/熱銷款式'],
              citationCount: 1,
            },
          ],
          embeddingModel: 'text-embedding-3-large',
          embeddingDimension: 3072,
          embeddingCount: 2,
        },
      ],
    },
    {
      id: 'k14',
      title: 'TEVA會員CRM分群與回購定義',
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
      lastUpdateTime: '2026-02-10 11:00',
      lastUpdateBy: 'Admin',
      versions: [
        {
          id: 'k14-v1.0',
          knowledgeId: 'k14',
          versionNumber: 'v1.0',
          versionType: 'MAJOR',
          status: 'active',
          title: 'TEVA會員CRM分群與回購定義',
          summary: '會員分群邏輯：新會員／回購會員的定義與回購期間門檻。',
          content: '# TEVA會員CRM分群與回購定義\n\n新會員：首次購買 TEVA 商品且無 12 個月內購買紀錄；回購會員：12 個月內有第 2 次（含）以上購買紀錄。2026Q2 回購會員占比 68%。',
          tags: ['會員', 'CRM', 'TEVA'],
          systemTags: ['規則說明'],
          lastUpdateBy: 'Admin',
          lastUpdateTime: '2026-02-10 11:00',
          updateNote: '初版發布',
          sourceFiles: [{ fileId: 'res-teva-crm-def', fileName: 'TEVA會員CRM分群定義.pdf', linkedVersion: 1 }],
          chunks: [
            {
              index: 1,
              sectionPath: '一、會員分群定義',
              content: '新會員：首次購買 TEVA 商品，且過去 12 個月內無其他購買紀錄。回購會員：過去 12 個月內累計購買達 2 次（含）以上。分群依購買時間軸每月重新計算一次。',
              tokenCount: 220,
              sourceType: 'text',
              gist: '說明新會員與回購會員的判定條件與計算週期。',
              qaPairs: [
                '什麼是回購會員？',
                '新會員怎麼定義？',
                '分群多久重新計算一次？',
              ],
              taxonomyTags: ['規則說明/會員規則/分群定義'],
              citationCount: 3,
            },
            {
              index: 2,
              sectionPath: '二、2026Q2回購結構',
              content: '2026Q2 TEVA涼鞋購買會員中，回購會員占比 68%，新會員占比 32%。回購會員平均年貢獻金額為新會員的 2.3 倍。',
              tokenCount: 168,
              sourceType: 'text',
              gist: '2026Q2 TEVA涼鞋會員回購占比與貢獻度比較。',
              qaPairs: [
                '這一季回購會員占比多少？',
                '回購會員貢獻度跟新會員比起來如何？',
              ],
              taxonomyTags: ['規則說明/會員規則/回購結構'],
              citationCount: 1,
            },
          ],
          embeddingModel: 'text-embedding-3-large',
          embeddingDimension: 3072,
          embeddingCount: 2,
        },
      ],
    },
```

- [ ] **Step 2: 型別檢查**

Run: `npm run type-check`
Expected: 無新增錯誤。

- [ ] **Step 3: 手動瀏覽器驗證**

Run: `npm run dev`，開啟 `/view/KnowledgeBase`，確認列表中出現「TEVA涼鞋2026Q2通路銷售數據彙總」與「TEVA會員CRM分群與回購定義」兩筆項目，點進去可看到上方 2 個 chunk 內容。

- [ ] **Step 4: Commit**

```bash
git add src/stores/knowledgeStore.ts
git commit -m "feat(knowledge): add TEVA channel sales and member CRM knowledge entries"
```

---

### Task 3: 分析流程（關鍵字比對 → MCP 查詢卡 → 圖表輸出 → 完成訊息）

**Files:**
- Modify: `src/components/AiViewer/AiViewerRightBox.vue`（Task 1 新增的 conv6 區塊內：擴充 `processConv6Msg`，新增 `conv6RunAnalysis`、`conv6FlipSearchCard`、`CONV6_SOURCES`）

**Interfaces:**
- Consumes: Task 1 的 `conv6Msgs`、`c6Push`、`c6Scroll`；Task 2 的 `knowledgeId: 'k13'` / `'k14'`；既有的 `addChartBlock(chartData: any, blockName: string): void`（`src/stores/AiViewerStore.ts:984`，已在檔案頂部解構 `const { sendUserInput, addReportBlock, addChartBlock } = aiviewerStore;`）；既有的 `KnowledgeSource` 介面（`AiViewerRightBox.vue:764`）。
- Produces: `processConv6Msg(msg: string): void`（正式版，取代 Task 1 的 stub）、`conv6RunAnalysis(): void`、`conv6FlipSearchCard(from: string[], to: string[]): void`、`CONV6_SOURCES: KnowledgeSource[]`。Task 4 會呼叫 `conv6RunAnalysis` 流程結尾觸發的 `conv6AskReportChoice()`（Task 4 定義）。

- [ ] **Step 1: 用正式版取代 stub `processConv6Msg`，並新增 `CONV6_SOURCES`／`conv6RunAnalysis`／`conv6FlipSearchCard`**

把 Task 1 寫入的整個 `// -------- start Conversation 6 流程 --------` … `// -------- end Conversation 6 流程 --------` 區塊，改成：

```typescript
// -------- start Conversation 6 流程 --------
const conv6Msgs = ref<any[]>([]);
let conv6IdCounter = 2;
const conv6Title = ref('');
const conv6ReportChoiceMade = ref(false);
function c6Push(msg: any) { conv6Msgs.value.push({ id: `c6_${conv6IdCounter++}`, ...msg }); }
function c6Scroll() { nextTick(() => AiAgentChatListScrollTo('ASC')); }

const CONV6_SOURCES: KnowledgeSource[] = [
  { knowledgeId: 'k13', title: 'TEVA涼鞋2026Q2通路銷售數據彙總', chunkIndexes: [1, 2] },
  { knowledgeId: 'k14', title: 'TEVA會員CRM分群與回購定義', chunkIndexes: [1, 2] },
];

function processConv6Msg(msg: string) {
  if (conv6Msgs.value.length > 1) {
    setTimeout(() => { c6Push({ msg: '這個對話目前僅示範單一分析情境，如需查看其他洞察，歡迎開新對話 🙌' }); c6Scroll(); }, 400);
    return;
  }
  const hasTeva = msg.includes('TEVA');
  const hasTopic = ['銷售', '會員', '通路', '業績', '輪廓'].some(k => msg.includes(k));
  if (hasTeva && hasTopic) {
    conv6Title.value = 'TEVA涼鞋銷售分析';
    conv6RunAnalysis();
    return;
  }
  setTimeout(() => { c6Push({ msg: '目前僅能協助 TEVA 涼鞋相關的銷售與會員輪廓分析，請描述您想了解的通路或會員面向 🙏' }); c6Scroll(); }, 400);
}

function conv6RunAnalysis() {
  setTimeout(() => {
    c6Push({ msg: `收到，我先透過 MCP 串接 Adobe Commerce 查詢並比對會員資料⋯<div class="conv2-search-card" style="margin-top:8px">
  <div class="conv2-ss conv2-ss--active">AdobeCommerceConnector（MCP）建立連線</div>
  <div class="conv2-ss conv2-ss--wait">MagentoSalesAPI 查詢 TEVA 涼鞋各通路銷售數據</div>
  <div class="conv2-ss conv2-ss--wait">MemberSegmentAnalyzer 交叉比對會員輪廓</div>
  <div class="conv2-ss conv2-ss--wait">ChannelPerformanceAggregator 彙整分析結果</div>
</div>` });
    c6Scroll();
    setTimeout(() => {
      conv6FlipSearchCard(
        ['conv2-ss--active', 'conv2-ss--wait', 'conv2-ss--wait', 'conv2-ss--wait'],
        ['conv2-ss--done', 'conv2-ss--done', 'conv2-ss--done', 'conv2-ss--done']
      );
      try {
        addChartBlock({
          chart: 'bar',
          title: 'TEVA涼鞋 2026Q2 各通路銷售額（萬元）',
          y_axis: { title: '銷售額（萬元）' },
          data: {
            labels: ['官網直營', '天貓旗艦店', '蝦皮商城', '實體門市', '經銷通路'],
            values: [{ '銷售額（萬元）': [1240, 980, 760, 1530, 610] }],
          },
        }, '各通路銷售表現.json');
      } catch (e) { /* 畫布可能尚未初始化 */ }
      try {
        addChartBlock({
          chart: 'doughnut',
          title: 'TEVA涼鞋會員回購結構',
          data: {
            labels: ['新會員', '回購會員'],
            values: [{ '會員占比（%）': [32, 68] }],
          },
        }, '會員輪廓分布.json');
      } catch (e) { /* 畫布可能尚未初始化 */ }
      c6Push({
        finishResponse: true,
        msg: `✅ 已完成 TEVA 涼鞋 2026Q2 各通路銷售與會員輪廓分析，圖表已加入畫布。<br><br>重點洞察：實體門市貢獻最高但年減 4%，天貓旗艦店成長最快（+32%）；會員回購占比達 68%，顯示既有會員貢獻穩定。`,
        sources: CONV6_SOURCES,
      });
      c6Scroll();
    }, 1800);
  }, 300);
}

// 尋找最後一則含 'conv2-search-card' 的訊息，把指定 class 依序替換（比照 conv4FlipSearchCard）
function conv6FlipSearchCard(from: string[], to: string[]) {
  const msgs = conv6Msgs.value;
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].msg?.includes('conv2-search-card')) {
      let msg = msgs[i].msg as string;
      from.forEach((f, idx) => { msg = msg.replace(f, to[idx]); });
      conv6Msgs.value[i] = { ...msgs[i], msg };
      return;
    }
  }
}
// -------- end Conversation 6 流程 --------
```

> 這一步刻意還不呼叫 `conv6AskReportChoice()`（Task 4 才會定義），先讓分析流程本身可獨立驗證。`conv6RunAnalysis` 結尾的 `setTimeout(() => conv6AskReportChoice(), 600)` 會在 Task 4 補上。

- [ ] **Step 2: 型別檢查**

Run: `npm run type-check`
Expected: 無新增錯誤（此時 `conv6AskReportChoice` 尚未定義也不會被引用，不會報錯）。

- [ ] **Step 3: 手動瀏覽器驗證**

Run: `npm run dev`，切換到「TEVA涼鞋銷售分析」對話，輸入「這一季 TEVA 涼鞋在各通路的銷售表現與會員輪廓？」送出：
1. ~300ms 後應看到查詢卡（4 行工具名稱，初始 1 行 active、3 行 wait）。
2. ~1.8s 後查詢卡 4 行全部變成 done，畫布上出現 2 張圖表（通路銷售長條圖、會員回購結構甜甜圈圖）。
3. 同時出現完成訊息與「參考來源」chip，點擊 chip 應開啟抽屜並看到 k13/k14 的 chunk 內容。

再測試不符合關鍵字的輸入（例如「你好」）：應只收到引導語，不觸發分析。

- [ ] **Step 4: Commit**

```bash
git add src/components/AiViewer/AiViewerRightBox.vue
git commit -m "feat(ai-viewer): add conv6 MCP query, analysis and chart output flow"
```

---

### Task 4: 報告選擇按鈕與「通路銷售深度分析報告」產出

**Files:**
- Modify: `src/components/AiViewer/AiViewerRightBox.vue`（conv6 區塊內新增 `conv6AskReportChoice`、`CONV6_REPORT_LABELS`、`conv6ChooseReport`；`conv6RunAnalysis` 結尾接上 `conv6AskReportChoice()`；`handleChatAreaClick` 新增 3 個 `data-action` 分支）

**Interfaces:**
- Consumes: Task 3 的 `conv6Msgs`、`c6Push`、`c6Scroll`、`CONV6_SOURCES`；既有的 `addReportBlock(fileUrl: string, blockName: string): void`（`src/stores/AiViewerStore.ts:957`）；既有的 `htmlIcon`（`AiViewerRightBox.vue:761`）；`handleChatAreaClick`（`AiViewerRightBox.vue:2149`）。
- Produces: `conv6AskReportChoice(): void`、`conv6ChooseReport(kind: 'channel' | 'member' | 'strategy'): void`，供 `handleChatAreaClick` 的 3 個新 `data-action` 呼叫；`kind === 'channel'` 分支呼叫 `addReportBlock('/justagent/teva_channel_sales_report.html', ...)`（Task 5 建立該檔案）。

- [ ] **Step 1: `conv6RunAnalysis` 完成訊息後接上詢問報告選項**

在 Task 3 寫入的 `conv6RunAnalysis` 內，把：

```typescript
      c6Push({
        finishResponse: true,
        msg: `✅ 已完成 TEVA 涼鞋 2026Q2 各通路銷售與會員輪廓分析，圖表已加入畫布。<br><br>重點洞察：實體門市貢獻最高但年減 4%，天貓旗艦店成長最快（+32%）；會員回購占比達 68%，顯示既有會員貢獻穩定。`,
        sources: CONV6_SOURCES,
      });
      c6Scroll();
    }, 1800);
  }, 300);
}
```

改成：

```typescript
      c6Push({
        finishResponse: true,
        msg: `✅ 已完成 TEVA 涼鞋 2026Q2 各通路銷售與會員輪廓分析，圖表已加入畫布。<br><br>重點洞察：實體門市貢獻最高但年減 4%，天貓旗艦店成長最快（+32%）；會員回購占比達 68%，顯示既有會員貢獻穩定。`,
        sources: CONV6_SOURCES,
      });
      c6Scroll();
      setTimeout(() => conv6AskReportChoice(), 600);
    }, 1800);
  }, 300);
}
```

- [ ] **Step 2: 新增 `conv6AskReportChoice` 與 `conv6ChooseReport`**

在 `conv6FlipSearchCard` 函式定義之後（`// -------- end Conversation 6 流程 --------` 之前）插入：

```typescript
function conv6AskReportChoice() {
  c6Push({
    msg: `要不要我把這次的分析整理成一份洞察報告？你想要哪一種？
<div class="conv1-quick-btns" style="margin-top:8px">
  <span class="conv1-quick-btn" data-action="conv6-report-channel">通路銷售深度分析報告</span>
  <span class="conv1-quick-btn" data-action="conv6-report-member">會員輪廓與行為洞察報告</span>
  <span class="conv1-quick-btn" data-action="conv6-report-strategy">行銷策略建議報告</span>
</div>`,
  });
  c6Scroll();
}

const CONV6_REPORT_LABELS: Record<string, string> = {
  channel: '通路銷售深度分析報告',
  member: '會員輪廓與行為洞察報告',
  strategy: '行銷策略建議報告',
};

function conv6ChooseReport(kind: 'channel' | 'member' | 'strategy') {
  if (conv6ReportChoiceMade.value) return;
  conv6ReportChoiceMade.value = true;
  c6Push({ forUser: true, msg: `好，請幫我產出「${CONV6_REPORT_LABELS[kind]}」` });
  c6Scroll();
  setTimeout(() => {
    if (kind === 'channel') {
      try {
        addReportBlock('/justagent/teva_channel_sales_report.html', '通路銷售深度分析報告.html');
      } catch (e) { /* 畫布可能尚未初始化 */ }
      c6Push({
        finishResponse: true,
        msg: `✅ 已完成「通路銷售深度分析報告」，報告已加入畫布，可直接查看或下載。<div class="oneFileItem">
  <img class="file-icon" src="${htmlIcon}" />
  <div class="file-info-box">
    <div class="file-name">通路銷售深度分析報告.html</div>
    <div class="file-size">HTML · 已加到畫布</div>
  </div>
</div>`,
        sources: CONV6_SOURCES,
      });
    } else {
      c6Push({ msg: `「${CONV6_REPORT_LABELS[kind]}」功能即將推出，敬請期待 🚀` });
    }
    c6Scroll();
  }, 500);
}
```

- [ ] **Step 3: `handleChatAreaClick` 新增 3 個 `data-action` 分支**

在 `src/components/AiViewer/AiViewerRightBox.vue:2181-2184`（`conv4-skip-skill` 分支）之後插入：

```typescript
  if (action === 'conv6-report-channel') { conv6ChooseReport('channel'); return; }
  if (action === 'conv6-report-member') { conv6ChooseReport('member'); return; }
  if (action === 'conv6-report-strategy') { conv6ChooseReport('strategy'); return; }
```

- [ ] **Step 4: 型別檢查**

Run: `npm run type-check`
Expected: 無新增錯誤（此時 `teva_channel_sales_report.html` 尚未存在，但這只影響執行期 `addReportBlock` 的檔案是否能載入，不影響型別檢查；`htmlFileViewBox.vue` 的 iframe 在檔案不存在時只會顯示載入失敗，不會拋出例外）。

- [ ] **Step 5: 手動瀏覽器驗證**

Run: `npm run dev`，重跑 Task 3 的分析流程直到看到 3 個報告選項按鈕：
1. 點擊「通路銷售深度分析報告」→ 應看到自己選擇的回顯訊息，~500ms 後看到完成訊息＋檔案卡片（此時畫布上的 iframe 會顯示 404，屬預期——Task 5 會建立實際檔案）。
2. 重置對話（`resetConversation`／切出再切回）重跑一次，改點「會員輪廓與行為洞察報告」或「行銷策略建議報告」→ 應只看到「功能即將推出，敬請期待 🚀」，不呼叫 `addReportBlock`。
3. 任一按鈕點擊後，同一輪對話內再點其他按鈕應無反應（`conv6ReportChoiceMade` guard）。

- [ ] **Step 6: Commit**

```bash
git add src/components/AiViewer/AiViewerRightBox.vue
git commit -m "feat(ai-viewer): add conv6 report-choice buttons and channel report trigger"
```

---

### Task 5: 建立「通路銷售深度分析報告」靜態 HTML

**Files:**
- Create: `public/teva_channel_sales_report.html`

**Interfaces:**
- Consumes: 無程式介面依賴；由 Task 4 的 `addReportBlock('/justagent/teva_channel_sales_report.html', ...)` 以 `<iframe>` 方式載入（`htmlFileViewBox.vue`，既有元件，不需改動）。
- Produces: 一個自包含（inline `<style>`）的靜態報告頁面，數字需與 Task 2 / Task 3 使用的口徑一致（見下方資料表）。

- [ ] **Step 1: 建立報告檔案**

沿用 `public/sanuo_2026_06_sales_report.html` 的 CSS 變數與版面語言（`--bg`/`--surface`/`--border`/`--blue`/`--green` 等），建立 `public/teva_channel_sales_report.html`：

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TEVA涼鞋 2026Q2 通路銷售深度分析報告</title>
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
    --red: #dc2626;
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
  .stat-row { display: flex; gap: 10px; margin-bottom: 22px; flex-wrap: wrap; }
  .stat-card { flex: 1; min-width: 140px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; }
  .stat-val { font-size: 20px; font-weight: 800; }
  .stat-lbl { font-size: 11px; color: var(--text-2); margin-top: 2px; }
  .stat-val.up { color: var(--green); }
  .section-title { font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--text-3); margin: 22px 0 10px; }
  table { width: 100%; border-collapse: collapse; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
  thead th { text-align: left; font-size: 10px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--text-3); background: var(--surface2); padding: 10px 12px; border-bottom: 1px solid var(--border); }
  tbody td { padding: 10px 12px; border-bottom: 1px solid var(--border); font-size: 12px; vertical-align: top; }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover { background: var(--blue-light); }
  .name-cell { font-weight: 700; }
  .growth-up { color: var(--green); font-weight: 600; }
  .growth-down { color: var(--red); font-weight: 600; }
  .insight-list { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; }
  .insight-list li { margin-bottom: 8px; }
  .insight-list li:last-child { margin-bottom: 0; }
</style>
</head>
<body>
  <div class="report-header">
    <div>
      <div class="report-brand">JustAgent · 通路銷售深度分析</div>
      <div class="report-title">TEVA涼鞋 2026Q2 通路銷售深度分析報告</div>
      <div class="report-meta">資料來源：MCP · Adobe Commerce（Magento）· TEVA涼鞋2026Q2通路銷售數據彙總</div>
    </div>
    <span class="report-tag">已完成</span>
  </div>

  <div class="stat-row">
    <div class="stat-card">
      <div class="stat-val">NT$5,120萬</div>
      <div class="stat-lbl">總營業額</div>
    </div>
    <div class="stat-card">
      <div class="stat-val up">+12.6%</div>
      <div class="stat-lbl">整體年成長（YoY）</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">實體門市</div>
      <div class="stat-lbl">TOP 通路（1,530萬）</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">68%</div>
      <div class="stat-lbl">會員回購率</div>
    </div>
  </div>

  <div class="section-title">通路銷售明細</div>
  <table>
    <thead>
      <tr><th>通路</th><th>銷售額（萬元）</th><th>訂單數</th><th>較去年同期</th></tr>
    </thead>
    <tbody>
      <tr><td class="name-cell">實體門市</td><td>1,530</td><td>4,120</td><td class="growth-down">-4%</td></tr>
      <tr><td class="name-cell">官網直營</td><td>1,240</td><td>3,860</td><td class="growth-up">+18%</td></tr>
      <tr><td class="name-cell">天貓旗艦店</td><td>980</td><td>2,910</td><td class="growth-up">+32%</td></tr>
      <tr><td class="name-cell">蝦皮商城</td><td>760</td><td>2,540</td><td class="growth-up">+9%</td></tr>
      <tr><td class="name-cell">經銷通路</td><td>610</td><td>1,780</td><td class="growth-up">+6%</td></tr>
    </tbody>
  </table>

  <div class="section-title">洞察與建議</div>
  <ul class="insight-list">
    <li><strong>天貓旗艦店成長最快（+32%）：</strong>建議加碼站內廣告投放與直播帶貨資源，延續動能。</li>
    <li><strong>實體門市年減 4%：</strong>建議檢視門市庫存深度與陳列規劃，並評估與線上通路的價格／促銷一致性。</li>
    <li><strong>會員回購率達 68%：</strong>建議強化會員分級經營（如回購會員專屬優惠），提升既有會員終身價值。</li>
  </ul>
</body>
</html>
```

- [ ] **Step 2: 型別檢查（確認未影響前端建置）**

Run: `npm run type-check`
Expected: 無新增錯誤（純靜態檔案，不影響 TypeScript）。

- [ ] **Step 3: 手動瀏覽器端到端驗證（完整流程）**

Run: `npm run dev`，切換到「TEVA涼鞋銷售分析」對話（若之前測試過，先重置或開新對話清空狀態）：
1. 輸入「這一季 TEVA 涼鞋在各通路的銷售表現與會員輪廓？」送出。
2. 依序看到查詢卡 → 4 行翻牌為 done → 畫布出現 2 張圖表 → 完成訊息＋來源 chip。
3. 點擊「通路銷售深度分析報告」按鈕 → ~500ms 後畫布新增報告區塊，內容應正確顯示（iframe 載入 `teva_channel_sales_report.html`，無 404）。
4. 確認報告內數字（總營業額 5,120萬、YoY +12.6%、TOP 通路實體門市、會員回購率 68%、5 個通路明細）與 Task 3 圖表、Task 2 知識庫 chunk 內容口徑一致，無矛盾。

- [ ] **Step 4: Commit**

```bash
git add public/teva_channel_sales_report.html
git commit -m "feat(ai-viewer): add TEVA channel sales deep-dive report HTML for conv6"
```

---

## Self-Review Notes

- **Spec coverage**：對話列表新增（Task 1）、自由輸入＋寬鬆關鍵字比對（Task 1/3）、MCP 查詢卡與步驟命名（Task 3）、2 張 Chart.js 圖表（Task 3）、參考來源 chip 與知識庫串接（Task 2/3）、3 選項報告詢問＋按鈕（Task 4）、僅完整實作「通路銷售深度分析報告」其餘 2 種佔位（Task 4）、報告 HTML 產出並放上畫布（Task 5）——規格文件各章節均對應到任務，無遺漏。
- **Placeholder scan**：所有程式碼區塊均為可直接使用的完整內容，無 TBD / TODO。
- **Type consistency**：`conv6Msgs` / `c6Push` / `c6Scroll` / `processConv6Msg` / `conv6RunAnalysis` / `conv6FlipSearchCard` / `CONV6_SOURCES` / `conv6AskReportChoice` / `conv6ChooseReport` / `CONV6_REPORT_LABELS` 命名與簽章在 Task 1、3、4 之間保持一致；`conv6ChooseReport(kind: 'channel' | 'member' | 'strategy')` 與 `handleChatAreaClick` 呼叫時傳入的字面值一致。
