# 銷售報告整理與建議建立 Skill 對話（conv4）— 設計文件

**日期：** 2026-07-30
**狀態：** 已核准，待轉換為實作計畫
**涉及模組：** AiViewer 對話介面（conversationListModal、AiViewerRightBox）、knowledgeStore（新增兩筆知識庫項目）

---

## 背景與目標

情境：產品部同仁於 AiViewer 協作型對話介面下達需求：

> 「請幫我整理上個月的產品銷售報告，相關資料請幫我查詢 @2026Q1產品銷售，輸出格式請參考 @三諾產品部輸出報告規範」

Agent 完成報告後，主動偵測到「查詢銷售資料＋套用部門報告規範」這類整理流程具重複性，詢問使用者是否要建立成 Skill；使用者確認後，顯示 Skill 已建立的確認訊息，之後產品部同仁可快速取得同類報告（此次僅在對話中模擬「已建立」的結果，不寫入真正的 Skill 管理功能 `skillStore.ts`，理由見〈不在此次範圍內〉）。

新增第三個實作出來的情境對話 **conv4**（目前程式碼僅有 conv1、conv2；conv3「TEVA 新品特徵貼標」已有核准的獨立 spec/plan 但尚未實作，為保留其編號與文件的有效性，本次新對話刻意編號為 conv4，不佔用 conv3）。

conv4 沿用 conv1（`conv1Msgs`）與 conv2（`conv2Msgs` + 快速任務進入 + `conv2-search-card` 進度卡）已驗證過的架構慣例，不引入新的抽象層或元件切分方式——腳本化邏輯全部留在 `AiViewerRightBox.vue`，與現有寫法一致。conv4 是單一線性腳本（無多步驟精靈、無懸浮面板、無需鎖定輸入框），複雜度低於 conv2/conv3。

---

## 對話列表變更

**`src/components/AiViewer/conversationListModal.vue`**

- 新增一個 `<li>`：`{{ active: currentConversationId === 'conv4' }}`，文字「產品銷售報告整理」，`@click="switchConversation('conv4')"`。
- 移除 `.remark` 文案「一個專案最多兩個對話，如要開啟新對話請刪除其中一個。」（新增第三個對話後此文案不再成立；不需要新文案替代，直接拿掉即可——與 conv3 spec 先前的決定一致）。

---

## 入口機制：快速任務

比照 conv2（非 conv1 的空白疊層輸入），conv4 透過「快速任務」（⚡ 按鈕）清單進入，不使用自由輸入比對關鍵字：

```typescript
const cannedTaskItems = computed(() => {
  if (currentConversationId.value === 'conv2') {
    return [{ id: 'competitorAnalysis', text: '商品競品分析' }];
  }
  if (currentConversationId.value === 'conv4') {
    return [{ id: 'salesReport', text: '整理上月產品銷售報告' }];
  }
  return [ /* 既有 conv1 罐頭任務 */ ];
});

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

`watch(currentConversationId, ...)`（畫布切換邏輯）新增一支：`else if (id === 'conv4') aiViewerBlocks.value = [];`（沿用 conv1 的空畫布起點，銷售報告 HTML 區塊在流程結束時用 `addReportBlock` 加入）。

---

## 訊息陣列與既有機制串接

```typescript
const conv4Msgs = ref<any[]>([]);
let conv4IdCounter = 2;
const conv4Title = ref('');
function c4Push(msg: any) { conv4Msgs.value.push({ id: `c4_${conv4IdCounter++}`, ...msg }); }
function c4Scroll() { nextTick(() => AiAgentChatListScrollTo('ASC')); }
```

`testMsgs` 目前是二選一（`conv2Msgs` / `conv1Msgs`），擴充為三選一：

```typescript
const testMsgs = computed(() => {
  const msgs = currentConversationId.value === 'conv2' ? conv2Msgs.value
    : currentConversationId.value === 'conv4' ? conv4Msgs.value
    : conv1Msgs.value;
  return msgs.filter((m: any) => !(m.cardType === 'translationConfirm' && !m.confirmed));
});
```

`resetConversation()` 新增一個 `if (currentConversationId.value === 'conv4') { conv4IdCounter = 2; conv4Title.value = ''; conv4Msgs.value = []; }` 區塊（與現有 conv2 區塊平行、不是 else if，維持原檔風格）。

`currentConversationTitle` 新增 conv4 分支：

```typescript
const currentConversationTitle = computed(() => {
  if (currentConversationId.value === 'conv2') return conv2Title.value || '未命名對話';
  if (currentConversationId.value === 'conv4') return conv4Title.value || '產品銷售報告整理';
  return conv1Title.value;
});
```

> conv4 沒有懸浮面板、沒有多步驟精靈、不需要鎖定輸入框，因此 **不需要** 擴充 `inputAreaHidden`／新增 `conv4FpActive`／`conv4InputLocked`／「離開快速任務」列。使用者理論上可在腳本播放中於輸入框打字送出訊息（`send()` 行為維持現狀，與 conv2/conv3 在快速任務播放中同樣可能被打斷的既有限制一致，非本次新增的缺口）——詳見〈不在此次範圍內〉。

---

## 對話腳本（單一路徑：查詢 → 產出報告 → 建議建立 Skill → 確認/婉拒）

### 引用來源（沿用 conv1 已驗證的 `sources` 參考來源 chip 機制）

```typescript
const CONV4_SOURCES: KnowledgeSource[] = [
  { knowledgeId: 'k7', title: '2026Q1產品銷售', chunkIndexes: [1, 2] },
  { knowledgeId: 'k8', title: '三諾產品部輸出報告規範', chunkIndexes: [1, 2] },
];
```

`knowledgeId` 對應〈知識庫串接〉章節新增的兩筆 `knowledgeStore.ts` 項目，讓使用者點擊訊息中的「參考來源」chip 時，`KnowledgeSourceDrawer` 能顯示真實的 mock 內容（不是空清單）。`title` 刻意採用與使用者原始 @ 提及完全一致的文字，讓 chip 顯示的名稱直接呼應開場白裡的 `@2026Q1產品銷售` / `@三諾產品部輸出報告規範`。

### 函式（比照 conv3InitFlow / conv3FlipSearchCard 的節奏與 setTimeout 時序）

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

// 尋找最後一則含 'conv2-search-card' 的訊息，把指定 class 依序替換（比照 conv3FlipSearchCard）
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
      msg: `<div style="border:1px solid var(--border-color, #e4e7ed);border-radius:10px;padding:10px 12px;margin-bottom:8px;display:flex;gap:10px;align-items:flex-start">
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
```

### 按鈕點擊處理

在 `handleChatAreaClick` 中，比照既有 `conv1-next-step` 等判斷的位置（`conv2` 專屬 guard `if (currentConversationId.value !== 'conv2') return;` **之前**），新增：

```typescript
if (action === 'conv4-build-skill') { conv4BuildSkill(); return; }
if (action === 'conv4-skip-skill') { conv4SkipSkill(); return; }
```

> 按鈕沿用既有的 `.conv1-quick-btn` / `.conv1-quick-btns` 樣式（原本只給 conv1 的 `nextStepPrompt` 用），不新增 CSS class——與 conv3 spec「跨對話重用既有 class」的慣例一致。這裡不透過 `cardType: 'nextStepPrompt'` + `processConv1Msg`（那條路徑是 conv1 專屬的關鍵字比對），而是比照 conv2 embedded 按鈕的 `data-action` 直接呼叫對應函式的寫法。

---

## 知識庫串接：`src/stores/knowledgeStore.ts` 新增兩筆項目

`sources` chip 點擊後由 `KnowledgeSourceDrawer` 透過 `knowledgeStore.knowledgeList` 依 `knowledgeId` 查找 `versions[0].chunks`。為讓抽屜顯示真實內容（而非空清單），新增兩筆 `KnowledgeItem`，比照現有 `k1`（`sourceType: 'FILE'`，結構最簡單）風格，接在陣列現有 `k6` 之後：

- **`k7`**：`title: '2026Q1產品銷售數據彙總'`，`category: '商品文件'`，單一版本、2 個 chunk，內容涵蓋「上月（6月）品類銷售總覽」「熱銷品項與通路表現」，需與最終報告（見下節）的數字口徑一致。
- **`k8`**：`title: '三諾產品部輸出報告規範 v1.0'`，`category: '規則說明'`（比照 `k6` 的分類），單一版本、2 個 chunk，內容說明報告必要章節（摘要卡、明細表格）、視覺風格與命名規則——最終 HTML 報告的結構需呼應這份規範描述的規則，形成敘事上的閉環。

兩者皆為 `status: 'active'`、`sourceType: 'FILE'`、`pipelineProgress: 100`、`pipelineStage: null`、`pipelineError: null`、`sourceStale: false`、`staleSourceFileIds: []`、`lastSyncAt: null`、`apiSourceId: null`、`apiSourceName: null`，`embeddingModel`/`embeddingDimension`/`embeddingCount` 比照 `k1` 填入合理值；不需要 `conversionLog`／`reviewNote` 等選填欄位。

> 此變更屬於「知識庫管理」功能區的資料，範圍外的影響：這兩筆項目之後也會出現在既有的知識庫管理列表頁（若該頁面存在）。這是刻意的選擇（詳見〈不在此次範圍內〉前的決策討論），因為使用者確認要讓「參考來源」chip 可實際點擊查看內容。

---

## 結果報告：`public/sanuo_2026_06_sales_report.html`

新建一份自架 HTML（比照 conv1/TEVA 報告的本地報告模式，走 `/justagent/` base path）。內容：

- 頁首：報告標題「三諾產品部 2026年6月產品銷售報告」、資料來源與格式規範標註、狀態標籤「已完成」。
- 統計卡：總營業額、較上月成長、熱銷品項數、訂單數（4 張 stat-card）。
- 品類銷售分佈摘要 chips（比照 TEVA 報告的「維度分佈」chips 寫法）。
- 主體表格：欄位為 `品名 / 品牌 / 類別 / 銷售數量 / 銷售金額 / 較上月成長`，8–10 筆 mock 資料，沿用本站既有的鞋類／戶外用品品牌宇宙（UGG、TEVA、Hurricane Trailsetter 等既有品牌，與 `k1`/TEVA 報告的既有素材呼應，不新增不相關的產業設定）。
- 視覺風格與現有 `hurricane_trailsetter_*.html` / `teva_feature_tagging_report.html` 系列報告一致（同一套 CSS 語言：`--bg`/`--surface`/`--border`/`--blue` 等 CSS 變數），確保在畫布 HTML 區塊中呈現時風格統一。
- 報告內的「總營業額」「熱銷品項數」等數字需與 `k7`（2026Q1產品銷售數據彙總）chunk 內容口徑一致，避免自相矛盾。
- 實作時套用 `frontend-design` skill 產出實際排版與 mock 資料明細（此份規格只定義結構與內容範圍，不逐字定案文案）。

---

## 樣式

不新增獨立 SCSS 檔案；沿用既有的 `.conv2-search-card` / `.conv2-ss*` / `.conv1-quick-btn(s)` / `.oneFileItem` 等 class。Skill 建立確認卡片的邊框樣式使用行內 `style` 屬性（比照聊天訊息一貫的 ad hoc HTML 字串寫法），不建立新 class，也不修改任何 `_index.scss`。

---

## 不在此次範圍內

- 使用者透過標準輸入框自由打字觸發 conv4（僅走快速任務按鈕進入，比照 conv2/conv3）。
- `@` 觸發的即時提及／自動完成 UI（本站目前完全沒有這個功能）；`@2026Q1產品銷售`、`@三諾產品部輸出報告規範` 僅以純文字出現在使用者訊息裡，實際「已查詢」的呈現方式是 AI 完成訊息上的「參考來源」chip（既有機制）。
- 對話播放中鎖定輸入框／顯示「離開快速任務」列（conv4 沒有懸浮面板，無需這套機制；使用者理論上仍可在播放中打字，這與 conv2/conv3 目前的既有限制一致，非本次新增）。
- 真正建立 Skill 並寫入 `src/stores/skillStore.ts` / 出現在 Skill 管理頁的列表中（Skill 管理功能目前有其他進行中的重構，本次僅在對話裡顯示「Skill 已建立」的 mock 確認訊息，避免與該重構衝突）。
- 三個以上對話（conv1/conv2/conv4，以及未來 conv3）的訊息陣列/腳本邏輯抽成共用 composable（維持與現有 conv1/conv2 一致的內聯寫法，避免過早抽象）。

---

## 檔案異動清單

| 檔案 | 異動類型 |
|------|----------|
| `src/components/AiViewer/conversationListModal.vue` | 修改（新增 conv4 列表項、移除兩對話上限文案） |
| `src/components/AiViewer/AiViewerRightBox.vue` | 修改（新增 conv4 狀態、函式、`handleChatAreaClick` 新增 2 個 data-action 分支；擴充 `testMsgs` / `resetConversation` / `currentConversationTitle` / `cannedTaskItems` / `sendCannedTask` / `watch(currentConversationId)`） |
| `src/stores/knowledgeStore.ts` | 修改（`knowledgeList` 新增 `k7`、`k8` 兩筆項目） |
| `public/sanuo_2026_06_sales_report.html` | 新建 |
