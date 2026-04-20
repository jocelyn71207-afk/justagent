# 行銷自動化旅程功能設計 spec

**日期：** 2026-04-20
**分支：** 0420
**功能：** 在 conv1「2026商品文件翻譯」流程中新增「生成行銷自動化旅程」選項，點擊後生成互動式 HTML 報告並加到 AiViewer 畫布

---

## 1. 功能概述

在現有 conv1 `nextStepPrompt` 的快速按鈕中新增第四個選項「🗺️ 生成行銷自動化旅程」。點擊後 AI 模擬思考、回覆訊息並將 HTML 報告加到畫布。報告內含可點擊的 chip 按鈕，點擊後透過 `postMessage` 繼續觸發對話。

---

## 2. 改動範圍

| 檔案 | 類型 | 說明 |
|---|---|---|
| `src/components/AiViewer/AiViewerRightBox.vue` | 修改 | 新增 step 定義、初始 nextSteps、processConv1Msg handler、chip handlers |
| `public/hurricane_trailsetter_marketing_automation.html` | 新建 | 行銷自動化旅程 HTML 報告 |

---

## 3. AiViewerRightBox.vue 改動

### 3.1 C1_ALL_STEPS 新增

```typescript
const C1_ALL_STEPS = [
  { key: '行銷策略',       label: '🎯 生成行銷策略',       msg: '生成 Hurricane Trailsetter AW26 行銷策略報告' },
  { key: '用戶畫像',       label: '👤 目標客群用戶畫像',   msg: '分析 Hurricane Trailsetter 目標客群的用戶畫像' },
  { key: '圖表',           label: '📊 產出圖表',           msg: '給我 Hurricane Trailsetter 相關的銷售圖表，我要做報告使用' },
  { key: '行銷自動化旅程', label: '🗺️ 生成行銷自動化旅程', msg: '生成 Hurricane Trailsetter AW26 行銷自動化旅程' }, // 新增
];
```

### 3.2 id_10 nextSteps 新增

在 `conv1Msgs` 第 10 筆的 `nextSteps` 陣列末端新增：

```typescript
{ label: '🗺️ 生成行銷自動化旅程', msg: '生成 Hurricane Trailsetter AW26 行銷自動化旅程' }
```

### 3.3 processConv1Msg 新增 else if

```typescript
} else if (msg.includes('行銷自動化旅程')) {
  c1PushThinkingThenReply(
    2000,
    '已根據 AW26 銷售數據與用戶行為分析，完成 Hurricane Trailsetter 行銷自動化旅程規劃。旅程涵蓋 D0–D30 共 6 個節點，整合 Email、LINE、廣告、SMS 四大渠道，請在畫布中查閱。',
    [{ name: 'hurricane_trailsetter_marketing_automation.html', type: 'HTML', size: 9800 }],
    '/justagent/hurricane_trailsetter_marketing_automation.html',
    'hurricane_trailsetter_marketing_automation.html',
    '行銷自動化旅程',
  );
}
```

### 3.4 Chip 訊息 handlers（processConv1Msg 繼續擴充）

以下 chip 訊息皆從 `handleHurricaneChipMsg` 進入 `processConv1Msg`，需補上對應的 `else if`：

| 判斷條件 | AI 回覆內容 | 延遲 |
|---|---|---|
| `includes('廣告文案')` | 3 條 Meta 廣告標題 + 說明文字 | 1500ms |
| `includes('歡迎 Email 模板')` | 歡迎信主旨 + 正文結構（純文字回覆，無下載） | 1800ms |
| `includes('LINE 腳本')` | 歡迎訊息文字 + 快速回覆按鈕建議 | 1500ms |
| `includes('再行銷受眾')` | 受眾條件設定說明（行為事件、時間窗口、排除條件） | 1600ms |
| `includes('穿搭指南')` | Email 內容段落草稿 | 1800ms |
| `includes('棄單 SMS')` | 2 條 SMS 範本（含字數提示） | 1500ms |
| `includes('忠誠計畫')` | 積分規則 + 3 個會員等級設定建議 | 1800ms |

**回覆格式：** 純文字 AI 訊息（`{ id, msg }` 格式，不帶 `cardType`），不加入畫布，不呼叫 `pushConv1NextStepPrompt`。

---

## 4. HTML 報告設計

**檔案：** `public/hurricane_trailsetter_marketing_automation.html`

### 4.1 結構

- **Header**：品牌（Hurricane Trailsetter · AW26）、標題（行銷自動化旅程）、日期、badge
- **目標受眾**：新客 / 溫客 / VIP 三個 segment pill
- **旅程節點（6 個）**：

| 節點 | 觸發條件 | 渠道 | Chip |
|---|---|---|---|
| D0 觸發加入旅程 | 首次訪問商品頁 / 加入購物車 | Meta 廣告、Web Push | 生成廣告文案 |
| D1 歡迎序列啟動 | 自動 | Email、LINE | 生成 Email 模板、撰寫 LINE 腳本 |
| D3 行為條件分流 | Email 開啟 / 未開啟 | 條件分支（優惠碼 vs 再行銷） | 設定再行銷受眾 |
| D7 產品深度培育 | 自動 | Email、Instagram 廣告 | 生成穿搭指南 |
| D14 購買轉換衝刺 | 加入購物車未結帳 | SMS、LINE、動態再行銷 | 棄單 SMS 文案 |
| D30 購後回購培育 | 完成購買 | Email、LINE | 設計忠誠計畫 |

- **預估成效 KPI**：Email 開信率 28%、轉換率 4.2%、ROAS 1.8×、棄單流失率 −32%

### 4.2 Chip 互動機制

```javascript
function sendChip(el, msg) {
  window.parent.postMessage({ type: 'hurricane-chip-click', msg }, '*');
  el.classList.add('sent');          // 灰化 + 劃線，防止重複點擊
  showToast('已送出：' + msg.slice(0,28) + '…');  // 底部 toast 提示
}
```

`handleHurricaneChipMsg`（已存在）接收 `hurricane-chip-click` type，呼叫 `processConv1Msg` 繼續處理。

### 4.3 視覺風格

與現有 `hurricane_trailsetter_marketing_strategy.html` 一致：
- 字型：`Helvetica Neue` / `PingFang TC`
- 背景：`#f7f8fa`，surface：`#ffffff`
- 品牌色：`--blue: #3b72f6`，各渠道有獨立顏色（purple / green / orange / teal）
- 彩色 spine line 貫穿節點（漸層）

---

## 5. 不在此次範圍

- conv2 不受影響
- 不新增 SCSS（樣式全在 HTML 內）
- 不修改路由、Store、http.ts
- Chip 回覆不加入畫布，純聊天訊息即可
