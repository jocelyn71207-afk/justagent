# Conv1 翻譯設定互動流程 Implementation Design

**Goal:** 將 conv1「2026商品文件翻譯」的靜態確認卡片，改為步驟引導面板（仿 conv2 模式），讓使用者可互動選擇翻譯文件、範圍、語言後送出。

**Architecture:** 在 `AiViewerRightBox.vue` 新增一組 conv1 專屬的步驟面板 state（`conv1TranslPanelVisible`、`conv1TranslStep`、選項資料 refs），面板渲染在輸入框上方（同 `.conv2-fp` 模式）。AI 第一條回覆訊息（id_2）改為包含「設定翻譯參數 →」按鈕，點擊後開啟面板。送出後推送 `translationConfirm` 訊息並觸發既有 AI 回覆流程。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Pinia（`useAiviewerStore`），SCSS at `src/scss/views/_AiViewer.scss`，現有 conv1Msgs / cardType 機制不變。

---

## 元件架構

### State（新增於 `AiViewerRightBox.vue`）

```ts
const conv1TranslPanelVisible = ref(false)
const conv1TranslStep = ref(1)           // 1 | 2 | 3
const conv1TranslFile = ref('AW26 Product Descriptions.xlsx')
const conv1TranslRange = ref('')         // 空字串 = 尚未選擇
const conv1TranslLang = ref('')          // 空字串 = 尚未選擇
```

### 觸發方式

- conv1Msgs 中 `id_2`（AI 的第一次確認回覆）訊息，在 `AiViewerRecord.vue` 渲染時，若 `forUser === false` 且 `id === 'id_2'`，泡泡下方出現「設定翻譯參數 →」按鈕。
- 點擊按鈕 → 呼叫 `conv1OpenTranslPanel()`，設 `conv1TranslPanelVisible = true`、`conv1TranslStep = 1`。

### 面板 UI（`.conv1-transl-fp`）

面板位置：`v-show="conv1TranslPanelVisible && currentConversationId === 'conv1'"` 同 `.conv2-fp`，出現在 `.right-box-bottom` 的上方。

**Header（共用）**
- 進度條：3 個 dot，`.done`（綠）/ `.active`（深綠）/ 空白
- 步驟標題（隨 `conv1TranslStep` 切換）
- 關閉按鈕 → `conv1TranslPanelVisible = false`

**Step 1 — 選擇翻譯文件**
- 顯示專案中已有的檔案清單（目前只有 `AW26 Product Descriptions.xlsx`）
- 每筆為可選的 file card，預設選中
- 底部：「＋ 上傳其他檔案」（純 UI，不實作上傳功能）
- 下一步條件：`conv1TranslFile` 不為空

**Step 2 — 選擇翻譯範圍**
- 選項（radio list，單選）：
  1. `Features and Benefits (Product Bullets)` — Line Sheet · Teva Footwear Fall · 143 欄位
  2. `全部工作表` — 所有 Sheet 完整翻譯
  3. `Line Sheet only` — 僅翻譯 Line Sheet 頁
- 下一步條件：`conv1TranslRange` 不為空

**Step 3 — 選擇目標語言**
- 選項（2×2 grid，單選 chip）：繁體中文 🇹🇼、簡體中文 🇨🇳、日文 🇯🇵、韓文 🇰🇷
- 送出條件：`conv1TranslLang` 不為空
- 送出按鈕文字：「確認送出 ✓」

### 送出邏輯 `conv1TranslSubmit()`

```ts
function conv1TranslSubmit() {
  conv1TranslPanelVisible.value = false
  // 找到靜態 id_3 並 in-place 更新（不改陣列順序）
  const record = conv1Msgs.value.find(m => m.id === 'id_3')
  if (record) {
    record.confirmed = true
    record.file = conv1TranslFile.value
    record.range = conv1TranslRange.value
    record.lang = conv1TranslLang.value
  }
  nextTick(() => AiAgentChatListScrollTo('ASC'))
}
```

> id_4 以後的靜態訊息維持原樣，不做任何修改。

### conv1Msgs 初始值調整

- `id_3` 保留在陣列中，但初始值改為 `confirmed: false`（其餘欄位保留預設值）。
- `id_2` 的訊息文字不變；在 `AiViewerRecord.vue` 渲染時，若該訊息 id 為 `id_2` 且 conv1 的 id_3 尚未 confirmed，泡泡下方加上「設定翻譯參數 →」按鈕。

### translationConfirm 卡片雙態渲染（`AiViewerRecord.vue`）

`cardType: 'translationConfirm'` 依 `confirmed` 值渲染兩種狀態：
- `confirmed: false` → 顯示「等待設定」的佔位卡片，包含「設定翻譯參數 →」按鈕（點擊呼叫 `conv1OpenTranslPanel()`）
- `confirmed: true` → 顯示現有的已確認摘要卡片（維持原樣）

---

## SCSS（新增 class）

新 class 與 `.conv2-fp` 共用大部分樣式結構，以下為 conv1 專屬 class：

```
.conv1-transl-fp          // 面板外層容器（位於 .right-box-bottom 上方）
.conv1-transl-step-track  // 進度條容器
.conv1-transl-sd          // 單個 dot
.conv1-transl-file-card   // Step 1 文件卡片
.conv1-transl-range-item  // Step 2 範圍選項
.conv1-transl-lang-chip   // Step 3 語言選項
```

---

## 不在本次範圍內

- 實際上傳檔案功能（「＋ 上傳其他檔案」為純 UI）
- 語言選完後自動觸發多語言翻譯（已有 id_6 日文靜態流程，維持原樣）
- 修改 conv1 既有的後續 AI 回覆（id_4 以後不動）
