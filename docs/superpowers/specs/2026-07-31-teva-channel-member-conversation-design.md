# TEVA 涼鞋通路銷售與會員輪廓分析對話（conv6）— 設計文件

**日期：** 2026-07-31
**狀態：** 已核准，待轉換為實作計畫
**涉及模組：** AiViewer 對話介面（conversationListModal、AiViewerRightBox）、knowledgeStore（新增兩筆知識庫項目）

---

## 背景與目標

情境：行銷主管在 AiViewer 對話介面直接打字詢問：

> 「這一季 TEVA 涼鞋在各通路的銷售表現與會員輪廓？」

Agent 理解需求後，模擬透過 **MCP 串接 Adobe Commerce（Magento）** 執行資料查詢與交叉分析，將分析結果轉成 2 張圖表放上畫布，並附上文字洞察摘要；接着主動詢問使用者是否需要把洞察製作成正式報告、要選哪一種洞察報告，使用者選擇其中一種後，Agent 產出對應的洞察報告並放上畫布呈現。

新增對話 **conv6**（現有程式碼實作到 conv1/conv2/conv4；conv3「TEVA 新品特徵貼標」已有核准 spec/plan 但尚未實作，保留其編號，不佔用 conv3；conv5 編號同時間被另一份「Teva 換季促銷方案規劃對話」spec/plan 佔用，為避免衝突，本對話改編號為 conv6）。

conv6 沿用 conv1（`conv1Msgs` + 自由輸入 + `processConv1Msg` 關鍵字比對）與 conv4（`conv4Msgs` + `.conv2-search-card` 進度卡 + 按鈕式後續選項）已驗證過的架構慣例，不引入新的抽象層或元件切分方式——腳本化邏輯全部留在 `AiViewerRightBox.vue`。與 conv4 最大的差異是**入口機制**：conv6 是第一個「非 conv1」但仍走自由輸入＋關鍵字比對進入的對話（conv2/conv4 都是快速任務按鈕進入）。

---

## 對話列表變更

**`src/components/AiViewer/conversationListModal.vue`**

- 新增一個 `<li>`：`{{ active: currentConversationId === 'conv6' }}`，文字「TEVA涼鞋銷售分析」，`@click="switchConversation('conv6')"`。

---

## 入口機制：自由輸入 + 寬鬆關鍵字比對

比照 conv1（唯一現有的自由輸入對話），conv6 **不使用快速任務選單**，`cannedTaskItems` / `sendCannedTask` 不需新增分支。使用者切到 conv6（空對話）後，直接在輸入框打字。

`send()` 新增一個與 conv1 平行的分支：

```typescript
function send() {
  if (currentConversationId.value === 'conv1') { /* 既有邏輯 */ }
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

`processConv6Msg` 做寬鬆關鍵字比對——訊息同時包含「TEVA」與「銷售/會員/通路/業績/輪廓」任一詞即觸發完整分析流程；只在**第一則訊息**（`conv6Msgs.value.length === 1`，也就是剛推入的使用者泡泡）判斷，之後的輸入一律给通用回覆，避免範圍蔓延：

```typescript
function processConv6Msg(msg: string) {
  if (conv6Msgs.value.length > 1) {
    setTimeout(() => c6Push({ msg: '這個對話目前僅示範單一分析情境，如需查看其他洞察，歡迎開新對話 🙌' }), 400);
    c6Scroll();
    return;
  }
  const hasTeva = msg.includes('TEVA');
  const hasTopic = ['銷售', '會員', '通路', '業績', '輪廓'].some(k => msg.includes(k));
  if (hasTeva && hasTopic) {
    conv6Title.value = 'TEVA涼鞋銷售分析';
    conv6RunAnalysis();
    return;
  }
  setTimeout(() => c6Push({ msg: '目前僅能協助 TEVA 涼鞋相關的銷售與會員輪廓分析，請描述您想了解的通路或會員面向 🙏' }), 400);
  c6Scroll();
}
```

`watch(currentConversationId, ...)`（畫布切換邏輯）新增一支：`else if (id === 'conv6') aiViewerBlocks.value = [];`（空畫布起點，圖表與報告在流程中用 `addChartBlock` / `addReportBlock` 加入）。

---

## 訊息陣列與既有機制串接

```typescript
const conv6Msgs = ref<any[]>([]);
let conv6IdCounter = 2;
const conv6Title = ref('');
const conv6ReportChoiceMade = ref(false);
function c6Push(msg: any) { conv6Msgs.value.push({ id: `c6_${conv6IdCounter++}`, ...msg }); }
function c6Scroll() { nextTick(() => AiAgentChatListScrollTo('ASC')); }
```

`testMsgs` 從三選一擴充為四選一：

```typescript
const testMsgs = computed(() => {
  const msgs = currentConversationId.value === 'conv2' ? conv2Msgs.value
    : currentConversationId.value === 'conv4' ? conv4Msgs.value
    : currentConversationId.value === 'conv6' ? conv6Msgs.value
    : conv1Msgs.value;
  return msgs.filter((m: any) => !(m.cardType === 'translationConfirm' && !m.confirmed));
});
```

`resetConversation()` 新增一個 `if (currentConversationId.value === 'conv6') { conv6IdCounter = 2; conv6Title.value = ''; conv6Msgs.value = []; conv6ReportChoiceMade.value = false; }` 區塊（與 conv4 區塊平行）。

`currentConversationTitle` 新增 conv6 分支：

```typescript
const currentConversationTitle = computed(() => {
  if (currentConversationId.value === 'conv2') return conv2Title.value || '未命名對話';
  if (currentConversationId.value === 'conv4') return conv4Title.value || '產品銷售報告整理';
  if (currentConversationId.value === 'conv6') return conv6Title.value || 'TEVA涼鞋銷售分析';
  return conv1Title.value;
});
```

---

## 對話腳本

### 引用來源

```typescript
const CONV6_SOURCES: KnowledgeSource[] = [
  { knowledgeId: 'k13', title: 'TEVA涼鞋2026Q2通路銷售數據彙總', chunkIndexes: [1, 2] },
  { knowledgeId: 'k14', title: 'TEVA會員CRM分群與回購定義', chunkIndexes: [1, 2] },
];
```

### 分析資料（圖表與報告需共用同一組口徑，避免自相矛盾）

各通路銷售（2026 Q2，單位：新台幣萬元 / 較去年同期成長）：

| 通路 | 銷售額（萬） | YoY |
|------|------------|-----|
| 官網直營 | 1,240 | +18% |
| 天貓旗艦店 | 980 | +32% |
| 蝦皮商城 | 760 | +9% |
| 實體門市 | 1,530 | -4% |
| 經銷通路 | 610 | +6% |
| **總計** | **5,120** | **+12.6%** |

會員輪廓（回購結構）：新會員 32% ／ 回購會員 68%。

### 函式

```typescript
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
        msg: `✅ 已完成 TEVA 涼鞋 2026Q2 各通路銷售與會員輪廓分析，圖表已加入畫布。\n\n重點洞察：實體門市貢獻最高但年減 4%，天貓旗艦店成長最快（+32%）；會員回購占比達 68%，顯示既有會員貢獻穩定。`,
        sources: CONV6_SOURCES,
      });
      c6Scroll();
      setTimeout(() => conv6AskReportChoice(), 600);
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
        msg: `✅ 已完成「通路銷售深度分析報告」，報告已加入畫布，可直接查看或下載。`,
        sources: CONV6_SOURCES,
      });
    } else {
      c6Push({ msg: `「${CONV6_REPORT_LABELS[kind]}」功能即將推出，敬請期待 🚀` });
    }
    c6Scroll();
  }, 500);
}
```

### 按鈕點擊處理

在 `handleChatAreaClick` 中新增（比照 conv4 的 `conv4-build-skill` / `conv4-skip-skill` 分支位置）：

```typescript
if (action === 'conv6-report-channel') { conv6ChooseReport('channel'); return; }
if (action === 'conv6-report-member') { conv6ChooseReport('member'); return; }
if (action === 'conv6-report-strategy') { conv6ChooseReport('strategy'); return; }
```

> 按鈕沿用既有的 `.conv1-quick-btn` / `.conv1-quick-btns` 樣式，不新增 CSS class，與 conv4 的作法一致。

---

## 知識庫串接：`src/stores/knowledgeStore.ts` 新增兩筆項目

比照 conv4 新增 `k7`/`k8` 的作法，接在陣列現有最後一筆之後（若實作時 `k7`/`k8` 已存在則接續為 `k13`/`k14`）：

- **`k13`**：`title: 'TEVA涼鞋2026Q2通路銷售數據彙總'`，`category: '商品文件'`，單一版本、2 個 chunk，內容涵蓋「各通路銷售額與年成長」「熱銷款式與尺碼分布」，數字口徑需與分析腳本、報告 HTML 一致（見上方〈分析資料〉表格）。
- **`k14`**：`title: 'TEVA會員CRM分群與回購定義'`，`category: '規則說明'`，單一版本、2 個 chunk，內容說明會員分群邏輯（新會員／回購會員定義、回購期間門檻）。

兩者皆為 `status: 'active'`、`sourceType: 'FILE'`、`pipelineProgress: 100`、`pipelineStage: null`、`pipelineError: null`、`sourceStale: false`、`staleSourceFileIds: []`、`lastSyncAt: null`、`apiSourceId: null`、`apiSourceName: null`，`embeddingModel`/`embeddingDimension`/`embeddingCount` 比照既有項目填入合理值。

---

## 結果報告：`public/teva_channel_sales_report.html`

新建一份自架 HTML（走 `/justagent/` base path），風格比照 `sanuo_2026_06_sales_report.html` / `hurricane_trailsetter_*.html` 系列（同一套 CSS 變數語言）。內容：

- 頁首：報告標題「TEVA涼鞋 2026Q2 通路銷售深度分析報告」、資料來源標註（MCP · Adobe Commerce）、狀態標籤「已完成」。
- 統計卡（4 張）：總營業額（5,120萬）、整體 YoY（+12.6%）、TOP 通路（實體門市）、會員回購率（68%）。
- 通路明細表：欄位為 `通路 / 銷售額（萬元）/ 訂單數 / YoY`，資料沿用上方〈分析資料〉表格的 5 個通路，不與圖表數字矛盾。
- 洞察與建議段落：至少 3 點（例如：天貓成長動能最強建議加碼投放、實體門市年減需檢視庫存與陳列、會員回購率高建議強化會員經營）。
- 實作時套用 `frontend-design` skill 產出實際排版與文案細節（此份規格只定義結構與數字口徑）。

---

## 樣式

不新增獨立 SCSS 檔案；沿用既有的 `.conv2-search-card` / `.conv2-ss*` / `.conv1-quick-btn(s)` 等 class。

---

## 不在此次範圍內

- 「會員輪廓與行為洞察報告」「行銷策略建議報告」的實際報告內容（僅顯示「敬請期待」佔位訊息，不產生報告檔案）。
- 對話播放中鎖定輸入框／顯示「離開快速任務」列（conv6 沒有懸浮面板，無需這套機制）。
- 真正串接 Adobe Commerce / Magento API 或任何真實 MCP 連線（僅在訊息 HTML 中以查詢卡文字模擬工具呼叫名稱與狀態）。
- 使用者在分析或報告流程播放中途插話的中斷處理（`processConv6Msg` 僅處理「流程尚未開始」與「流程已開始」兩種狀態，不做更細的狀態機）。
- 三個以上對話（conv1/conv2/conv4/conv6）的訊息陣列/腳本邏輯抽成共用 composable（維持現有內聯寫法，避免過早抽象）。

---

## 檔案異動清單

| 檔案 | 異動類型 |
|------|----------|
| `src/components/AiViewer/conversationListModal.vue` | 修改（新增 conv6 列表項） |
| `src/components/AiViewer/AiViewerRightBox.vue` | 修改（新增 conv6 狀態、函式；`send()` 新增自由輸入分支；`handleChatAreaClick` 新增 3 個 data-action 分支；擴充 `testMsgs` / `resetConversation` / `currentConversationTitle` / `watch(currentConversationId)`） |
| `src/stores/knowledgeStore.ts` | 修改（`knowledgeList` 新增 `k13`、`k14` 兩筆項目） |
| `public/teva_channel_sales_report.html` | 新建 |
