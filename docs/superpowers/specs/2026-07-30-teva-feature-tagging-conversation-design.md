# TEVA 新品特徵貼標對話（conv3）— 設計文件

**日期：** 2026-07-30
**狀態：** 已核准，待實作
**涉及模組：** AiViewer 對話介面（conversationListModal、AiViewerRightBox）

---

## 背景與目標

情境：使用者提供雜亂的 TEVA 原廠型錄、官方文件，同仁於 AiViewer 協作型對話介面下達需求：

> 「請整理這批 TEVA 新品原廠文件，依顏色、款式、材質、尺碼、風格完成特徵貼標」

目前對話列表（`conversationListModal.vue`）寫死只支援兩個對話（conv1：2026商品文件翻譯、conv2：競品分析），且 Modal 上明寫「一個專案最多兩個對話」。本次要新增第三個情境對話 **conv3**，並移除該筆數上限文案。

conv3 沿用 conv1（`conv1Msgs` + `processConv1Msg`）與 conv2（`conv2Msgs` + 懸浮面板 + pill row + 多步驟精靈）已驗證過的架構慣例，不引入新的抽象層或元件切分方式 —— 三個對話的腳本化邏輯全部留在 `AiViewerRightBox.vue`，與現有寫法一致。

---

## 對話列表變更

**`src/components/AiViewer/conversationListModal.vue`**

- 新增一個 `<li>`：`{{ active: currentConversationId === 'conv3' }}`，文字「TEVA新品特徵貼標」，`@click="switchConversation('conv3')"`。
- 移除 `.remark` 文案「一個專案最多兩個對話，如要開啟新對話請刪除其中一個。」（三個對話後此文案不再成立；不需要新文案替代，直接拿掉即可）。

---

## 入口機制：快速任務

比照 conv2（非 conv1 的空白疊層輸入），conv3 透過「快速任務」（⚡ 按鈕）清單進入，不使用自由輸入比對關鍵字：

```typescript
const cannedTaskItems = computed(() => {
  if (currentConversationId.value === 'conv2') {
    return [{ id: 'competitorAnalysis', text: '商品競品分析' }];
  }
  if (currentConversationId.value === 'conv3') {
    return [{ id: 'tevaFeatureTagging', text: 'TEVA新品特徵貼標' }];
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
  if (currentConversationId.value === 'conv3' && item.id === 'tevaFeatureTagging') {
    resetConversation();
    nextTick(() => conv3InitFlow());
    return;
  }
  send();
}
```

`watch(currentConversationId, ...)`（畫布切換邏輯）新增一支：`else if (id === 'conv3') aiViewerBlocks.value = [];`（沿用 conv1 的空畫布起點，貼標結果的 HTML report 區塊在流程結束時用 `addReportBlock` 加入）。

---

## 訊息陣列與既有機制串接

```typescript
const conv3Msgs = ref<any[]>([]);
let conv3IdCounter = 2;
function c3Push(msg: any) { conv3Msgs.value.push({ id: `c3_${conv3IdCounter++}`, ...msg }); }
function c3Scroll() { nextTick(() => AiAgentChatListScrollTo('ASC')); }
```

`testMsgs` 由二選一改三選一：

```typescript
const testMsgs = computed(() => {
  const msgs = currentConversationId.value === 'conv2' ? conv2Msgs.value
    : currentConversationId.value === 'conv3' ? conv3Msgs.value
    : conv1Msgs.value;
  return msgs.filter((m: any) => !(m.cardType === 'translationConfirm' && !m.confirmed));
});
```

`resetConversation()` 新增一個 `if (currentConversationId.value === 'conv3') { ...重置所有 conv3* ref... }` 區塊（與現有 conv2 區塊平行、不是 else if，維持原檔風格）。

`currentConversationTitle` 新增 conv3 分支：

```typescript
const conv3Title = ref('');
const currentConversationTitle = computed(() => {
  if (currentConversationId.value === 'conv2') return conv2Title.value || '未命名對話';
  if (currentConversationId.value === 'conv3') return conv3Title.value || 'TEVA新品特徵貼標';
  return conv1Title.value;
});
```

> conv3 所有互動元件都在懸浮面板內，比照 conv2 面板按鈕的寫法用 `@click.stop="conv3XXX()"` 直接呼叫，不需要透過 `handleChatAreaClick` 的 `data-action` delegation（那套機制只用於「嵌在聊天泡泡 HTML 字串裡」的按鈕，例如 conv2 的 `confirm-product`；conv3 沒有這類需求，因此不新增 `conv3Dispatch`）。

`inputAreaHidden` 計算屬性納入 conv3 的面板可見狀態（比照 `conv2FpActive`）：

```typescript
const conv3FpActive = computed(() =>
  currentConversationId.value === 'conv3' && (conv3ShowUploadPill.value || conv3ShowDimPill.value || conv3InputLocked.value)
);
const inputAreaHidden = computed(() =>
  conv2FpActive.value || conv3FpActive.value || showJourneyModifyPill.value || conv1TranslPanelVisible.value
);
```

---

## 精靈流程（單一路徑，3 步驟 + 處理中 + 結果）

### 狀態（conv3\* refs，比照 conv2 命名慣例）

```typescript
const conv3InputLocked = ref(false);

// Step 1：上傳原廠文件
const conv3UploadFpVisible = ref(false);
const conv3ShowUploadPill = ref(false);
const conv3UploadedFiles = ref<{ name: string; type: string; size: number }[]>([]);

// Step 2：貼標維度確認
const conv3DimFpVisible = ref(false);
const conv3ShowDimPill = ref(false);
const conv3Dims = ref([
  { key: 'color',    title: '顏色', sel: true },
  { key: 'style',    title: '款式', sel: true },
  { key: 'material', title: '材質', sel: true },
  { key: 'size',     title: '尺碼', sel: true },
  { key: 'theme',    title: '風格', sel: true },
]);
const conv3DimErr = ref('');

// Step 3：確認設定（沿用上面兩組資料做摘要，不需要額外 ref）
```

### Mock 上傳檔案清單（強調「雜亂」）

```typescript
const CONV3_DEMO_FILES = [
  { name: 'TEVA_AW26_目錄_final_v3(1).pdf', type: 'PDF', size: 8_412_000 },
  { name: '原廠規格表_更新版.xlsx', type: 'EXCEL', size: 1_204_500 },
  { name: 'TEVA官網介紹_複製.docx', type: 'WORD', size: 340_200 },
  { name: '特徵資料_舊版_勿用.txt', type: 'TXT', size: 18_600 },
];
```

### 函式（比照 conv2InitFlow / conv2StartAnalysis / conv2StartSearch / conv2DoneComps 的節奏與 setTimeout 時序）

```typescript
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
  c3Push({ msg: `收到，我先掃描這批檔案⋯<div class="conv2-search-card">
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

function conv3TogDim(d: any) {
  const selCount = conv3Dims.value.filter(x => x.sel).length;
  if (d.sel && selCount <= 1) { conv3DimErr.value = '至少選 1 個維度'; return; }
  d.sel = !d.sel;
  conv3DimErr.value = '';
}

function conv3ConfirmDims() {
  if (!conv3Dims.value.some(d => d.sel)) { conv3DimErr.value = '至少選 1 個維度'; return; }
  conv3DimFpVisible.value = false;
  const dimNames = conv3Dims.value.filter(d => d.sel).map(d => d.title).join('、');
  c3Push({ forUser: true, msg: `確認以 ${dimNames} 進行貼標，開始執行。` });
  c3Push({ msg: `設定已確認，開始貼標⋯<div class="conv2-search-card">
    <div class="conv2-ss conv2-ss--done">DocumentParser 解析原廠型錄與規格表</div>
    <div class="conv2-ss conv2-ss--done">SkuNormalizer 合併重複／雜亂命名的商品資料</div>
    <div class="conv2-ss conv2-ss--active">FeatureTagger 依 ${dimNames} 進行特徵貼標中</div>
    <div class="conv2-ss conv2-ss--wait">QualityReview 交叉比對命名與規格一致性</div>
  </div>` });
  c3Scroll();
  conv3ShowDimPill.value = false;
  setTimeout(() => conv3ShowResult(dimNames), 2200);
}

function conv3ShowResult(dimNames: string) {
  conv3InputLocked.value = false;
  conv3FlipSearchCard(['conv2-ss--active', 'conv2-ss--wait'], ['conv2-ss--done', 'conv2-ss--done']);
  try {
    addReportBlock('/justagent/teva_feature_tagging_report.html', 'TEVA_特徵貼標報告.html');
  } catch (e) { /* 畫布可能尚未初始化 */ }
  c3Push({ msg: `✅ 貼標完成！12 個 SKU 已依 ${dimNames} 完成特徵貼標，報告已加入畫布，可直接查看或下載。` });
  c3Push({ finishResponse: true, msg: `<div class="oneFileItem">...檔案下載卡（沿用 conv2ShowReport 樣式）...</div>` });
  c3Scroll();
}

// 尋找最後一則含 'conv2-search-card' 的訊息，把指定 class 依序替換（比照 conv2DirectSubmitSku 的做法抽出共用）
function conv3FlipSearchCard(from: string[], to: string[]) {
  const msgs = conv3Msgs.value;
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].msg?.includes('conv2-search-card')) {
      let msg = msgs[i].msg;
      from.forEach((f, idx) => { msg = msg.replace(f, to[idx]); });
      conv3Msgs.value[i] = { ...msgs[i], msg };
      return;
    }
  }
}

function conv3LeaveFastTask() {
  conv3InputLocked.value = false;
  conv3ShowUploadPill.value = false; conv3UploadFpVisible.value = false;
  conv3ShowDimPill.value = false; conv3DimFpVisible.value = false;
}
```

> 註：`conv2-search-card` / `conv2-ss` 系列樣式（已存在於 conv2 的 SCSS）直接沿用，不重複定義新 class，維持視覺一致。

### 樣板（template）新增區塊

比照 conv2 的三個 `conv2-fp` 懸浮面板寫法，新增兩個以 `v-show="... && currentConversationId === 'conv3'"` 為守衛的面板：

1. **上傳面板**（`conv3UploadFpVisible`）：一個可點擊的上傳區（`conv3LoadDemoFiles()`），已附加檔案清單（沿用 `oneFileItem` 的檔案卡片樣式與 `useIconFileTypes` 圖示對應），底部按鈕「確認附加，開始整理 →`（`conv3ConfirmUpload()`）。
2. **貼標維度面板**（`conv3DimFpVisible`）：5 個 chip（沿用 `conv2-chip`／`conv2-feat-item` 樣式其中一種，選用 `conv2-feat-item` 的 checkbox 樣式更貼近多選語意），`conv3DimErr` 錯誤提示，底部按鈕「確認 →」（`conv3ConfirmDims()`）。

Pill row（`conv2-pill-row` 結構沿用，不新增 class，只是加 `v-show="currentConversationId === 'conv3'"` 版本或擴充現有條件）顯示對應面板的收合狀態；`conv3InputLocked` 時顯示「離開快速任務」列（呼叫 `conv3LeaveFastTask()`）。

---

## 結果報告：`public/teva_feature_tagging_report.html`

新建一份自架 HTML（比照 conv1 的本地報告模式，走 `/justagent/` base path，不使用 conv2 的外部 CDN 連結）。內容：

- 頁首：報告標題「TEVA 新品特徵貼標報告」、來源文件 4 份、SKU 數 12、貼標維度 5 項的摘要卡。
- 主體：一個表格，欄位為 `SKU / 品名 / 顏色 / 款式 / 材質 / 尺碼 / 風格`，12 筆 mock TEVA 商品資料（例如涼鞋、水陸兩用鞋等品項，顏色如黑色／卡其／珊瑚橘，材質如再生聚酯纖維／橡膠大底，尺碼區間如 US 6–10 等）。
- 視覺風格與現有 `hurricane_trailsetter_*.html` 系列報告一致（同一套 CSS 語言），確保在畫布 HTML 區塊中呈現時風格統一。
- 實作時套用 `frontend-design` skill 產出實際排版與 mock 資料明細（此份規格只定義結構與內容範圍，不逐字定案文案）。

---

## 樣式

不新增獨立 SCSS 檔案；沿用 conv2 既有的 `.conv2-fp` / `.conv2-pill*` / `.conv2-search-card` / `.conv2-ss*` / `.conv2-chip` / `.conv2-feat-item` / `.oneFileItem` 等 class，僅在需要處新增少量 conv3 專屬的小幅樣式微調（若有）時，加在 `AiViewerRightBox.vue` 既有的 `<style>` 區塊或對應的 `src/scss/views/_index.scss` 相依檔案內，不另立新檔案。

---

## 不在此次範圍內

- 使用者透過標準「附加檔案」按鈕真正上傳本地檔案給 conv3（本次上傳一律走面板內的 demo 按鈕模擬）
- 貼標維度、SKU 資料的後端 API 串接
- conv3 的「貼標維度」允許使用者新增自訂維度（僅能勾選既有 5 項）
- 三個對話的訊息陣列/精靈邏輯抽成共用 composable（維持與 conv1/conv2 一致的內聯寫法，避免過早抽象）

---

## 檔案異動清單

| 檔案 | 異動類型 |
|------|----------|
| `src/components/AiViewer/conversationListModal.vue` | 修改（新增 conv3 列表項、移除兩對話上限文案） |
| `src/components/AiViewer/AiViewerRightBox.vue` | 修改（新增 conv3 狀態、函式、樣板區塊，擴充 testMsgs / resetConversation / cannedTaskItems / sendCannedTask / handleChatAreaClick / inputAreaHidden / currentConversationTitle / watch(currentConversationId)） |
| `public/teva_feature_tagging_report.html` | 新建 |
