# 行銷自動化旅程執行系統 設計 spec

**日期：** 2026-04-21
**分支：** 0420
**功能：** 使用者選擇「生成行銷自動化旅程」後，AI 自動依序驅動旅程節點；Canvas 顯示樹狀流程圖進度；獨立頁面查看所有用戶旅程

---

## 1. 功能概述

觸發旅程後：
1. `journeyStore` 建立新旅程記錄（支援多個並行用戶旅程）
2. Canvas 上出現共用「旅程總覽」HTML 區塊（樹狀流程圖，所有旅程並排）
3. AI 自動依序執行 D0→D1→D3→D7→D14→D30，每次節點變更透過 `postMessage` 推送狀態同步至 HTML
4. `/view/journeys` 獨立頁面列出所有旅程及各節點進度

---

## 2. 改動範圍

| 檔案 | 類型 | 說明 |
|---|---|---|
| `src/stores/journeyStore.ts` | 新建 | 旅程狀態 Pinia store |
| `src/components/AiViewer/AiViewerRightBox.vue` | 修改 | 觸發旅程、自動執行鏈、postMessage 推送 |
| `public/hurricane_trailsetter_journey_dashboard.html` | 新建 | Canvas 共用旅程總覽 HTML（樹狀流程圖） |
| `src/views/JourneyDashboard.vue` | 新建 | `/view/journeys` 旅程總覽頁面 |
| `src/router/index.ts` | 修改 | 新增 `/view/journeys` 路由 |
| `src/views/AiViewer.vue` | 修改 | 頂部下拉選單新增「旅程總覽」入口 |

---

## 3. 資料模型

### 3.1 型別定義（`src/stores/journeyStore.ts`）

```typescript
export type NodeStatus = 'pending' | 'running' | 'done'

export interface JourneyNode {
  key: string           // 'D0' | 'D1' | 'D3' | 'D7' | 'D14' | 'D30'
  label: string         // '觸發加入旅程'
  status: NodeStatus
  startedAt?: number
  completedAt?: number
}

export interface JourneyRecord {
  id: string            // 'journey-' + Date.now()
  userName: string      // 'User #1'、'User #2'（自動遞增）
  createdAt: number
  status: 'running' | 'done'
  nodes: JourneyNode[]
}
```

### 3.2 Store actions

```typescript
createJourney(userName: string): string   // 回傳 journey id
setNodeRunning(journeyId: string, nodeKey: string): void
setNodeDone(journeyId: string, nodeKey: string): void
// setNodeDone 內部：若全部節點 done → journey.status = 'done'
```

### 3.3 節點初始定義（6 個，每次建立旅程時複製）

```typescript
const JOURNEY_NODES: Omit<JourneyNode, 'status'>[] = [
  { key: 'D0',  label: '觸發加入旅程' },
  { key: 'D1',  label: '歡迎序列啟動' },
  { key: 'D3',  label: '行為條件分流' },
  { key: 'D7',  label: '產品深度培育' },
  { key: 'D14', label: '購買轉換衝刺' },
  { key: 'D30', label: '購後回購培育' },
]
```

---

## 4. AiViewerRightBox.vue 改動

### 4.1 新增 import 與 ref

```typescript
import { useJourneyStore } from '@/stores/journeyStore'
const journeyStore = useJourneyStore()
const journeyDashboardAdded = ref(false)  // 只加一次 canvas 區塊
let _journeyUserCount = 0                 // User #N 遞增計數
```

### 4.2 修改 `行銷自動化旅程` handler

現有的 `c1PushThinkingThenReply(...)` 保留不動，在其後新增：

```typescript
} else if (msg.includes('行銷自動化旅程')) {
  // 1. 現有 AI 回覆（保留）
  c1PushThinkingThenReply(
    2000,
    '已根據 AW26 銷售數據與用戶行為分析，完成 Hurricane Trailsetter 行銷自動化旅程規劃。旅程涵蓋 D0–D30 共 6 個節點，整合 Email、LINE、廣告、SMS 四大渠道，請在畫布中查閱。',
    [{ name: 'hurricane_trailsetter_marketing_automation.html', type: 'HTML', size: 9800 }],
    '/justagent/hurricane_trailsetter_marketing_automation.html',
    'hurricane_trailsetter_marketing_automation.html',
    '行銷自動化旅程',
  )

  // 2. 建立旅程記錄
  _journeyUserCount++
  const journeyId = journeyStore.createJourney(`User #${_journeyUserCount}`)

  // 3. Canvas 加共用 dashboard（只加一次）
  if (!journeyDashboardAdded.value) {
    addReportBlock('/justagent/hurricane_trailsetter_journey_dashboard.html', '旅程總覽')
    journeyDashboardAdded.value = true
  }

  // 4. 啟動自動執行鏈
  startJourneyExecution(journeyId)
}
```

### 4.3 `startJourneyExecution` 函式

每個節點分兩個 timeout：先 running，後 done。節點間不重疊。

```typescript
function startJourneyExecution(journeyId: string) {
  const schedule = [
    { key: 'D0',  runningDelay: 500,   doneDelay: 2000  },
    { key: 'D1',  runningDelay: 2500,  doneDelay: 5000  },
    { key: 'D3',  runningDelay: 5500,  doneDelay: 8500  },
    { key: 'D7',  runningDelay: 9000,  doneDelay: 11500 },
    { key: 'D14', runningDelay: 12000, doneDelay: 15000 },
    { key: 'D30', runningDelay: 15500, doneDelay: 18000 },
  ]

  for (const { key, runningDelay, doneDelay } of schedule) {
    setTimeout(() => {
      journeyStore.setNodeRunning(journeyId, key)
      syncJourneyToIframe()
    }, runningDelay)

    setTimeout(() => {
      journeyStore.setNodeDone(journeyId, key)
      syncJourneyToIframe()
    }, doneDelay)
  }
}
```

### 4.4 `syncJourneyToIframe` 函式

```typescript
function syncJourneyToIframe() {
  const iframe = document.querySelector(
    'iframe[src*="journey_dashboard"]'
  ) as HTMLIFrameElement | null
  iframe?.contentWindow?.postMessage(
    { type: 'journey-state-sync', journeys: journeyStore.journeys },
    '*'
  )
}
```

---

## 5. HTML 報告設計（`hurricane_trailsetter_journey_dashboard.html`）

### 5.1 視覺風格

參考提供的互動流程圖設計：
- **節點外型**：圓角卡片，漸層光暈邊框（`box-shadow` + `border: 1px solid`）
- **顏色狀態**：
  - `pending`：灰色，無光暈，低透明度
  - `running`：藍紫漸層光暈 + CSS keyframe 脈動動畫（`@keyframes pulse-glow`）
  - `done`：綠色光暈，節點頂部圓形圖示顯示 ✓
- **條件分支節點（D3）**：左右分叉，✓（已開啟）/ ✗（未開啟），用曲線 SVG 連接
- **連接線**：SVG `<path>` 貝茲曲線，顏色跟隨前一個節點狀態
- **節點頂部圓形圖示**：渠道對應顏色（Email=blue, LINE=green, SMS=teal, Ad=orange）

### 5.2 旅程並排顯示

多個旅程橫向並排，每個旅程為一欄，頂部顯示用戶名 + 進度（N/6）。

### 5.3 postMessage 監聽

```javascript
window.addEventListener('message', function(e) {
  if (e.data?.type !== 'journey-state-sync') return;
  renderJourneys(e.data.journeys);
});

// HTML 載入後主動請求初始狀態
window.parent.postMessage({ type: 'journey-state-request' }, '*');
```

`renderJourneys(journeys)` 整個重繪旅程列表（無需 diff）。

### 5.4 `journey-state-request` 回應

在 `AiViewerRightBox.vue` 的 `handleHurricaneChipMsg` 同層新增監聽：

```typescript
function handleJourneyStateRequest(event: MessageEvent) {
  if (event.data?.type !== 'journey-state-request') return
  syncJourneyToIframe()
}
// onMounted 註冊，onUnmounted 移除
```

---

## 6. 旅程總覽頁（`/view/journeys`）

### 6.1 路由

```typescript
{ path: '/view/journeys', name: 'JourneyDashboard', component: () => import('@/views/JourneyDashboard.vue') }
```

### 6.2 JourneyDashboard.vue 內容

- Header：「🗺️ 行銷自動化旅程 — 執行紀錄」
- 旅程卡片列表，每張卡片：
  - 用戶名（User #N）+ 狀態 badge（執行中 / 已完成）
  - 節點進度條（完成數/6）
  - 節點時間軸：每個節點顯示 key、label、完成時間（若有）
- 從 journeyStore 讀取，無資料時顯示空白提示

### 6.3 AiViewer 入口

`AiViewer.vue` 頂部左側下拉選單（已有 ProjectSettingModal 等選項）新增一筆：

```html
<div @click="router.push('/view/journeys')">🗺️ 旅程總覽</div>
```

---

## 7. 不在此次範圍

- 旅程資料不做跨 session 持久化（Pinia，刷新清除）
- 不新增 SCSS（樣式在 HTML 內、JourneyDashboard.vue 用 inline style）
- conv2 不受影響
- 不修改 http.ts 或後端 API
