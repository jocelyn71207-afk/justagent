# Teva 換季促銷方案規劃對話（conv5）— 設計文件

**日期：** 2026-07-31
**狀態：** 已核准，待轉換為實作計畫
**涉及模組：** AiViewer 對話介面（conversationListModal、AiViewerRightBox）、knowledgeStore（新增四筆知識庫項目）

---

## 背景與目標

情境：行銷部門在換季促銷檔期前，請 agent 協助提供 Teva 品牌的促銷方案。流程需包含：

1. 先查詢現有商品庫存（取用產品知識庫內容）。
2. 針對當前社群、時尚雜誌、趨勢報告，理解流行趨勢。
3. 生成行銷策略與風險評估報告。
4. **agent 一開始提供的內容有問題，由使用者檢查後指出，再請 agent 修正**——本次新增對話的核心示範重點。

新增第五個對話 **conv5**（承接 conv4 的編號慣例；conv3「TEVA 新品特徵貼標」仍維持既有 spec/plan、尚未實作，本次不佔用其編號）。conv5 與 conv4 一樣是**單一線性腳本**（無多步驟精靈），沿用 conv1/conv2/conv4 已驗證的架構慣例：腳本邏輯全部內聯在 `AiViewerRightBox.vue`，不引入新元件或共用 composable。

conv5 比 conv4 多一段「使用者發現問題 → agent 修正」的往返，此往返比照 conv1「旅程修改需求」懸浮面板的資料流（使用者自由輸入 → 推入 `forUser` 訊息 → 呼叫固定的修正函式，不做真正的文字比對），但**不使用 conv1 的 `postMessage`／iframe 通訊機制**（那是 conv1 互動式旅程儀表板專屬的機制）；conv5 的報告是靜態 HTML，因此改用 conv4 已驗證的「訊息內嵌快速回覆按鈕（`data-action`）」模式觸發面板開關，更貼合現有素材型態。

### 刻意植入的資料錯誤（修正情境的具體內容）

Agent 初版策略主打商品選為 **TEVA Original Universal**——這是合理但錯誤的判斷，因為它是 2026 年 6 月銷售第 4 名的熱銷品（見既有 `k7` chunk 2），初版策略只看了銷售排行、據此決定加碼曝光，卻沒有交叉比對「現有庫存僅剩 18 件」（新增 `k9`）。這個庫存不足以支撐初版規劃的 60% 廣告預算與大量曝光。使用者檢查後指出此矛盾，agent 重新核對庫存，將主打商品調整為庫存充足（320 件）、同樣是熱銷品的 **TEVA Hurricane XLT2**，並把 Original Universal 改包裝為「限量珍藏款」（利用低庫存製造稀缺感行銷，而非隱藏問題），同步更新風險評估表。

---

## 對話列表變更

**`src/components/AiViewer/conversationListModal.vue`**

- 新增一個 `<li>`：`{{ active: currentConversationId === 'conv5' }}`，文字「Teva 換季促銷方案規劃」，`@click="switchConversation('conv5')"`。

---

## 入口機制：快速任務

比照 conv4，透過「快速任務」清單進入：

```typescript
const cannedTaskItems = computed(() => {
  if (currentConversationId.value === 'conv2') {
    return [{ id: 'competitorAnalysis', text: '商品競品分析' }];
  }
  if (currentConversationId.value === 'conv4') {
    return [{ id: 'salesReport', text: '整理上月產品銷售報告' }];
  }
  if (currentConversationId.value === 'conv5') {
    return [{ id: 'tevaPromotion', text: '提供 Teva 換季促銷方案' }];
  }
  return [ /* 既有 conv1 罐頭任務 */ ];
});

function sendCannedTask(item: any) {
  isShowCannedTaskListBox.value = false;
  // ...既有 conv2 / conv4 分支...
  if (currentConversationId.value === 'conv5' && item.id === 'tevaPromotion') {
    resetConversation();
    nextTick(() => conv5InitFlow());
    return;
  }
  send();
}
```

`watch(currentConversationId, ...)`（畫布切換邏輯）新增：`else if (id === 'conv5') aiViewerBlocks.value = [];`（空畫布起點，報告 HTML 在流程中用 `addReportBlock` 加入）。

---

## 訊息陣列與既有機制串接

```typescript
const conv5Msgs = ref<any[]>([]);
let conv5IdCounter = 2;
const conv5Title = ref('');
function c5Push(msg: any) { conv5Msgs.value.push({ id: `c5_${conv5IdCounter++}`, ...msg }); }
function c5Scroll() { nextTick(() => AiAgentChatListScrollTo('ASC')); }
```

`testMsgs` 由三選一擴充為四選一：

```typescript
const testMsgs = computed(() => {
  const msgs = currentConversationId.value === 'conv2' ? conv2Msgs.value
    : currentConversationId.value === 'conv4' ? conv4Msgs.value
    : currentConversationId.value === 'conv5' ? conv5Msgs.value
    : conv1Msgs.value;
  return msgs.filter((m: any) => !(m.cardType === 'translationConfirm' && !m.confirmed));
});
```

`resetConversation()` 新增一個與 conv2/conv4 平行（非 `else if`）的區塊：

```typescript
if (currentConversationId.value === 'conv5') {
  conv5IdCounter = 2;
  conv5Title.value = '';
  conv5Msgs.value = [];
  conv5ConcernFpVisible.value = false;
  conv5ConcernInput.value = '';
}
```

`currentConversationTitle` 新增分支：

```typescript
if (currentConversationId.value === 'conv5') return conv5Title.value || 'Teva 換季促銷方案規劃';
```

`inputAreaHidden` 擴充，讓修正意見懸浮面板開啟時鎖定輸入框（與 conv2FpActive / showJourneyModifyPill / conv1TranslPanelVisible 同一慣例）：

```typescript
const inputAreaHidden = computed(() =>
  conv2FpActive.value || showJourneyModifyPill.value || conv1TranslPanelVisible.value || conv5ConcernFpVisible.value
);
```

> conv5 沒有多步驟精靈，只有單一懸浮面板（修正意見），因此不需要 `conv5FpActive` 這類多面板旗標，直接用 `conv5ConcernFpVisible` 一個布林值即可。

---

## 對話腳本

### 引用來源

```typescript
const CONV5_INVENTORY_SOURCE: KnowledgeSource[] = [
  { knowledgeId: 'k9', title: 'Teva 商品庫存即時資料', chunkIndexes: [1] },
];
const CONV5_TREND_SOURCES: KnowledgeSource[] = [
  { knowledgeId: 'k10', title: '2026換季社群輿情彙整', chunkIndexes: [1] },
  { knowledgeId: 'k11', title: '時尚雜誌趨勢報導彙整', chunkIndexes: [1] },
  { knowledgeId: 'k12', title: '戶外機能鞋產業趨勢報告', chunkIndexes: [1] },
];
const CONV5_STRATEGY_SOURCES: KnowledgeSource[] = [
  { knowledgeId: 'k7', title: '2026Q1產品銷售數據彙總', chunkIndexes: [2] },
  ...CONV5_INVENTORY_SOURCE,
  ...CONV5_TREND_SOURCES,
];
const CONV5_REVISED_SOURCES: KnowledgeSource[] = [
  { knowledgeId: 'k9', title: 'Teva 商品庫存即時資料', chunkIndexes: [1, 2] },
  { knowledgeId: 'k7', title: '2026Q1產品銷售數據彙總', chunkIndexes: [2] },
];
```

`CONV5_INVENTORY_SOURCE` 刻意只引用 `k9` chunk 1（品項總覽），**不**引用 chunk 2（低庫存警示）——這正是初版策略沒有交叉比對到低庫存警示的敘事破綻；修正後的 `CONV5_REVISED_SOURCES` 才把 chunk 2 補上，形成因果對照。

### 函式（比照 conv4InitFlow 的節奏與 setTimeout 時序）

```typescript
function conv5InitFlow() {
  if (conv5Msgs.value.length > 0) return;
  conv5Title.value = 'Teva 換季促銷方案規劃';
  c5Push({ forUser: true, msg: '換季檔期快到了，幫我提供一份 Teva 的促銷方案，記得先看一下目前庫存，也了解一下現在社群、時尚雜誌跟趨勢報告在流行什麼，最後整理成行銷策略和風險評估。' });

  setTimeout(() => {
    c5Push({ msg: `收到，我先查詢目前的商品庫存⋯<div class="conv2-search-card">
      <div class="conv2-ss conv2-ss--active">InventoryQuery 查詢 Teva 商品線即時庫存</div>
    </div>` });
    c5Scroll();

    setTimeout(() => {
      conv5FlipSearchCard(['conv2-ss--active'], ['conv2-ss--done']);
      c5Push({
        finishResponse: true,
        msg: '📦 庫存查詢完成：Hurricane XLT2、Hurricane Verge、新品 Ridgeview 庫存皆充足；Original Universal 是 6 月熱銷品之一。接著我來看看目前社群、時尚雜誌與趨勢報告在流行什麼⋯',
        sources: CONV5_INVENTORY_SOURCE,
      });
      c5Scroll();

      setTimeout(() => {
        c5Push({ msg: `<div class="conv2-search-card">
          <div class="conv2-ss conv2-ss--active">SocialTrendScan 社群輿情掃描</div>
          <div class="conv2-ss conv2-ss--wait">MagazineTrendScan 時尚雜誌趨勢彙整</div>
          <div class="conv2-ss conv2-ss--wait">IndustryReportScan 產業趨勢報告彙整</div>
        </div>` });
        c5Scroll();

        setTimeout(() => {
          conv5FlipSearchCard(
            ['conv2-ss--active', 'conv2-ss--wait', 'conv2-ss--wait'],
            ['conv2-ss--done', 'conv2-ss--done', 'conv2-ss--done'],
          );
          try {
            addReportBlock('/justagent/teva_seasonal_promotion_strategy.html', 'Teva 2026 換季促銷方案.html');
          } catch (e) { /* 畫布可能尚未初始化 */ }
          c5Push({
            finishResponse: true,
            msg: `✅ 已完成 Teva 換季促銷方案，主打商品鎖定 6 月銷售亮眼的 Original Universal，並依 Gorpcore／機能穿搭趨勢規劃社群與雜誌曝光。報告已加入畫布。<div class="oneFileItem">
  <img class="file-icon" src="${htmlIcon}" />
  <div class="file-info-box">
    <div class="file-name">Teva 2026 換季促銷方案.html</div>
    <div class="file-size">HTML · 6.2 KB · 已加到畫布</div>
  </div>
</div>
<div class="conv1-quick-btns" style="margin-top:8px">
  <span class="conv1-quick-btn" data-action="conv5-approve">✅ 沒問題，可以啟動</span>
  <span class="conv1-quick-btn" data-action="conv5-raise-concern">⚠️ 我有疑慮</span>
</div>`,
            sources: CONV5_STRATEGY_SOURCES,
          });
          c5Scroll();
        }, 1800);
      }, 500);
    }, 1600);
  }, 300);
}

// 尋找最後一則含 'conv2-search-card' 的訊息，把指定 class 依序替換（比照 conv4FlipSearchCard）
function conv5FlipSearchCard(from: string[], to: string[]) {
  const msgs = conv5Msgs.value;
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].msg?.includes('conv2-search-card')) {
      let msg = msgs[i].msg as string;
      from.forEach((f, idx) => { msg = msg.replace(f, to[idx]); });
      conv5Msgs.value[i] = { ...msgs[i], msg };
      return;
    }
  }
}

function conv5Approve() {
  c5Push({ forUser: true, msg: '沒問題，可以啟動' });
  c5Scroll();
  setTimeout(() => {
    c5Push({ msg: '太好了，方案已確認，8/15 檔期啟動前我會再提醒相關單位備貨與素材上架！' });
    c5Scroll();
  }, 500);
}

const conv5ConcernFpVisible = ref(false);
const conv5ConcernInput = ref('');
function submitConv5Concern() {
  const msg = conv5ConcernInput.value.trim();
  if (!msg) return;
  c5Push({ forUser: true, msg });
  conv5ConcernInput.value = '';
  conv5ConcernFpVisible.value = false;
  c5Scroll();
  conv5ReviseStrategy();
}

function conv5ReviseStrategy() {
  setTimeout(() => {
    c5Push({ msg: `您說得對，我重新核對一次庫存⋯<div class="conv2-search-card">
      <div class="conv2-ss conv2-ss--active">InventoryQuery 重新核對 Teva 商品線即時庫存</div>
    </div>` });
    c5Scroll();

    setTimeout(() => {
      conv5FlipSearchCard(['conv2-ss--active'], ['conv2-ss--done']);
      try {
        addReportBlock('/justagent/teva_seasonal_promotion_strategy-1.html', 'Teva 2026 換季促銷方案（修正版）.html');
      } catch (e) { /* 畫布可能尚未初始化 */ }
      c5Push({
        finishResponse: true,
        msg: `已修正：Original Universal 現貨僅剩 18 件，不適合作為大量曝光的主打商品，已改由庫存充足（320 件）、同樣熱銷的 Hurricane XLT2 接手主打，60% 廣告預算同步轉移；Original Universal 改包裝為「限量珍藏款」，用低庫存做稀缺感話題操作，風險評估表也已同步更新。修正版報告已加入畫布。`,
        sources: CONV5_REVISED_SOURCES,
      });
      c5Scroll();
    }, 1800);
  }, 300);
}
```

### 按鈕與面板

在 `handleChatAreaClick` 中，`conv2` 專屬 guard **之前**新增：

```typescript
if (action === 'conv5-approve') { conv5Approve(); return; }
if (action === 'conv5-raise-concern') { conv5ConcernFpVisible.value = true; return; }
```

Template（懸浮面板，比照 conv1 旅程修改需求面板寫法，插入既有 `conv2-fp` 群組附近）：

```html
<div v-if="conv5ConcernFpVisible && currentConversationId === 'conv5'" class="conv2-fp" @click.stop>
  <div class="conv2-fp-top">
    <span class="conv2-fp-title">回報方案疑慮</span>
    <button class="conv2-fp-close-btn" @click.stop="conv5ConcernFpVisible = false">
      <i class="material-symbols-outlined">close</i>
    </button>
  </div>
  <div class="conv2-fp-body">
    <div class="conv2-info-note">✦ 描述您發現的問題</div>
    <textarea class="conv2-fi conv2-fi--full conv2-fi--ta" v-model="conv5ConcernInput" rows="3" @click.stop
      placeholder="例如：主打商品的庫存足夠支撐大量曝光嗎？"></textarea>
    <div class="conv2-fp-btn-row">
      <button class="conv2-fp-submit-btn" @click.stop="submitConv5Concern()">確認送出 →</button>
    </div>
  </div>
</div>
```

> 沿用 `.conv1-quick-btn(s)` / `.conv2-fp*` / `.conv2-search-card` / `.conv2-ss*` / `.oneFileItem` 既有 class，不新增 CSS。guard 一律用正向的 `currentConversationId === 'conv5'`（吸取 conv1 `showJourneyModifyPill` guard 曾寫成否定式而外洩的review教訓）。使用者實際打字內容只用來推入 `forUser` 訊息，修正流程本身固定觸發 `conv5ReviseStrategy()`（不做真正的文字比對），與 conv1 `submitJourneyModify()` 固定呼叫 `processConv1Msg('旅程過於單一')` 的既有慣例一致。

---

## 知識庫串接：`src/stores/knowledgeStore.ts` 新增四筆項目

比照 `k7`（`sourceType: 'FILE'`）／`k5`（`sourceType: 'API'`、庫存狀態表格）風格，接在陣列現有 `k8` 之後：

- **`k9`**：`title: 'Teva 商品庫存即時資料'`，`category: '商品文件'`，`sourceType: 'API'`（`apiSourceName: 'Teva 商品庫存 API'`），單一版本、2 個 chunk：
  - chunk 1「Teva 商品線總覽」：列出 Hurricane XLT2（320件）、Hurricane Verge（210件）、新品 Ridgeview（260件）、Original Universal（18件）四款品項與庫存量。
  - chunk 2「低庫存警示」：Original Universal 因 6 月熱賣去化快，現貨僅剩 18 件，預計 8/20 補貨；明確提示「不建議作為大量曝光主打」。
  - chunk 內容需與 `k7` chunk 2 的 6 月熱銷金額（NT$1,988,000）口徑一致（同一款商品，銷售佳→庫存去化快的因果關係）。
- **`k10`**：`title: '2026換季社群輿情彙整'`，`category: '市場情報'`（新分類），`sourceType: 'API'`（`apiSourceName: '社群輿情監測 API'`），單一版本、1–2 個 chunk：Gorpcore／機能涼鞋穿搭聲量成長、熱門標籤（#機能涼鞋 #水陸兩用）、大地色系＋螢光點綴的顏色偏好。
- **`k11`**：`title: '時尚雜誌趨勢報導彙整'`，`category: '市場情報'`，`sourceType: 'FILE'`，單一版本、1–2 個 chunk：時尚雜誌報導 Gorpcore 機能風持續發燒、機能涼鞋＋機能襪的秋冬過渡穿搭、永續材質是各品牌行銷重點。
- **`k12`**：`title: '戶外機能鞋產業趨勢報告'`，`category: '市場情報'`，`sourceType: 'FILE'`，單一版本、1–2 個 chunk：戶外機能鞋市場年增率、消費者永續材質偏好上升、競品換季促銷／價格戰風險。

四筆皆需要 `versions[0].chunks[]` 內完整填入 `gist`／`qaPairs`／`taxonomyTags`／`citationCount`，比照 `k7`/`k9` 既有欄位規格，讓 `KnowledgeSourceDrawer` 點開時有真實內容可看。

---

## 結果報告：兩份自架 HTML

**`public/teva_seasonal_promotion_strategy.html`（初版）**

- 頁首：報告標題「Teva 2026 換季促銷方案」、副標「行銷策略與風險評估」、狀態標籤「草案 v1」。
- 摘要卡：主打商品（Original Universal）、檔期（8/15–9/30）、預算配置（社群廣告 60%／雜誌置入 20%／電商首頁 20%）、預期營收。
- 趨勢摘要區塊：呼應 `k10`/`k11`/`k12` 內容的 3 條趨勢重點（Gorpcore、色彩偏好、永續材質）。
- 風險評估表：供應鏈風險、市場競爭風險、庫存風險——庫存風險欄位刻意評為「低」或留空未評估，呼應「沒有交叉比對庫存」的資料錯誤。
- 視覺風格延續 `hurricane_trailsetter_marketing_strategy.html` 的 CSS 語言（`:root` 變數、卡片與表格排版），維持系列報告的一致性。

**`public/teva_seasonal_promotion_strategy-1.html`（修正版）**

- 與初版同結構，但：主打商品改為 Hurricane XLT2；新增「限量珍藏款：Original Universal」單元說明稀缺感操作角度；風險評估表庫存風險欄位更新為「高（Original Universal 現貨僅 18 件，已改列限量款；主力款 XLT2 庫存 320 件無虞）」。
- 頁首狀態標籤改為「修正版 v2」，並在報告最上方加一小段「本版修正說明」，逐條對照與初版的差異（主打商品、預算配置、風險評估三項）。
- 兩份報告的數字需彼此一致、且與 `k9`/`k7` 的庫存與銷售數字口徑一致，避免自相矛盾。
- 實作時套用 `frontend-design` skill 產出實際排版與 mock 資料明細，本規格只定義結構與內容範圍。

---

## 樣式

不新增獨立 SCSS 檔案；沿用既有 `.conv2-search-card` / `.conv2-ss*` / `.conv1-quick-btn(s)` / `.conv2-fp*` / `.oneFileItem` 等 class，不修改任何 `_index.scss`。

---

## 不在此次範圍內

- 使用者透過標準輸入框自由打字觸發 conv5（僅走快速任務按鈕進入，比照 conv2/conv4）。
- 修正意見面板做真正的文字理解／NLU 比對（比照 conv1 `submitJourneyModify()`，固定觸發同一條修正流程，不論使用者實際輸入什麼文字）。
- 「沒問題，可以啟動」之後的實際促銷排程／備貨系統串接（僅在對話中顯示一則確認訊息，不寫入任何 store）。
- 新增知識庫管理列表頁的篩選／分類 UI 因應新分類「市場情報」（沿用 `category` 既有渲染邏輯，若知識庫管理頁面本身有分類篩選，四筆新項目會自然出現在對應分類下，非本次新增功能）。
- 三個以上對話（conv1/conv2/conv4/conv5，以及未來 conv3）的訊息陣列/腳本邏輯抽成共用 composable（維持既有內聯寫法，避免過早抽象）。

---

## 檔案異動清單

| 檔案 | 異動類型 |
|------|----------|
| `src/components/AiViewer/conversationListModal.vue` | 修改（新增 conv5 列表項） |
| `src/components/AiViewer/AiViewerRightBox.vue` | 修改（新增 conv5 狀態、函式、懸浮面板、`handleChatAreaClick` 新增 2 個 data-action 分支；擴充 `testMsgs` / `resetConversation` / `currentConversationTitle` / `cannedTaskItems` / `sendCannedTask` / `inputAreaHidden` / `watch(currentConversationId)`） |
| `src/stores/knowledgeStore.ts` | 修改（`knowledgeList` 新增 `k9`、`k10`、`k11`、`k12` 四筆項目） |
| `public/teva_seasonal_promotion_strategy.html` | 新建 |
| `public/teva_seasonal_promotion_strategy-1.html` | 新建 |
