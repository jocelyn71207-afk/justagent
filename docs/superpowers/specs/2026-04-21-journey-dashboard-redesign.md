# 旅程 Dashboard HTML 重設計 設計 spec

**日期：** 2026-04-21
**分支：** 0420
**功能：** 重新設計 Canvas 旅程 Dashboard HTML，改為淺色主題完整旅程樹 + 右側滑入 Drawer 顯示執行狀態

---

## 1. 功能概述

替換 `public/hurricane_trailsetter_journey_dashboard.html`：

1. **完整旅程樹**：HTML 載入後即顯示 D0→D30 全部節點（靜態結構，隨執行狀態動態更新樣式）
2. **啟動按鈕**：Header 右側「▶ 啟動旅程」按鈕，點擊後 postMessage 通知父層 Vue 建立新旅程並開始執行
3. **右側 Drawer**：點啟動後滑入，顯示每個旅程的即時節點進度 + 數據概覽
4. **淺色主題**：白底＋彩色節點邊框，符合參考圖風格

---

## 2. 改動範圍

| 檔案 | 類型 | 說明 |
|---|---|---|
| `public/hurricane_trailsetter_journey_dashboard.html` | 改寫 | 完整重設計，淺色主題 |
| `src/components/AiViewer/AiViewerRightBox.vue` | 修改 | 新增 `journey-start-request` postMessage 監聽 |

---

## 3. 視覺設計

### 3.1 配色系統

| 節點 | 邊框色 | 背景色 | 說明 |
|---|---|---|---|
| D0 旅程起點 | `#3b72f6` | `#eff6ff` | 藍色 |
| D1 / D7 / D14 訊息節點 | `#0891b2` | `#f0fdfe` | 青色 |
| D3 條件分流 | `#f59e0b` | `#fffbeb` | 橙黃色 |
| D30 轉換完成 | `#16a34a` | `#f0fdf4` | 綠色 |

節點執行狀態疊加：
- `pending`：節點 opacity 0.45
- `running`：`box-shadow: 0 0 0 3px rgba(59,114,246,.12)`，標題顯示「● 執行中」
- `done`：右上角 `✓` badge（綠底白字圓形）

### 3.2 D3 條件分流節點

D3 節點下方分出兩個子分支卡片：

```
        D3 行為條件分流
       /              \
   是 ✓               否 ✗
限時優惠碼           換標題重發
+ LINE 提醒          + 再行銷
```

分支線：水平連接線 + 左右各一個垂直線接子節點卡片

### 3.3 整體版面

```
┌──────────────────────────────────────────────┐
│  🗺️ Hurricane AW26 旅程      [ ▶ 啟動旅程 ] │  ← header (固定)
├─────────────────────────┬────────────────────┤
│                         │                    │
│   旅程節點樹             │   Drawer（滑入）   │
│   (scrollable)          │   執行狀態         │
│                         │   (scrollable)     │
│                         │                    │
└─────────────────────────┴────────────────────┘
```

- 樹狀區：`flex:1`，Drawer 關閉時佔全寬
- Drawer：`width: 0 → 200px`，`transition: width .3s ease`，Drawer 開啟時樹狀區自然縮窄
- Drawer 頂部有 `×` 關閉按鈕

---

## 4. 旅程節點定義

HTML 內部 hardcode 節點定義（與 journeyStore 的 NODE_TEMPLATES 對應）：

```javascript
var NODES = [
  { key:'D0',  label:'觸發加入旅程', sub:'🚀 首次訪問 / 加入購物車', type:'setup' },
  { key:'D1',  label:'歡迎序列啟動', sub:'💌 Email + LINE 歡迎',      type:'msg'   },
  { key:'D3',  label:'行為條件分流', sub:'🔀 Email 開啟條件',          type:'cond'  },
  { key:'D7',  label:'產品深度培育', sub:'📖 Email + IG 廣告',         type:'msg'   },
  { key:'D14', label:'購買轉換衝刺', sub:'⚡ 未結帳提醒',              type:'msg'   },
  { key:'D30', label:'購後回購培育', sub:'⭐ 完成購買 / 回購',         type:'end'   },
];
```

D3 分支子節點（固定顯示，不受執行狀態影響）：

```javascript
var D3_BRANCHES = {
  yes: { label:'已開啟 Email', desc:'限時優惠碼 + LINE 提醒' },
  no:  { label:'未開啟',       desc:'換標題重發 + 再行銷'    },
};
```

---

## 5. Drawer 設計

### 5.1 Drawer 內容結構

每個旅程顯示一個區塊：

```
User #1 · 執行中
✓ D0 觸發加入旅程   （done，文字刪除線）
▶ D1 歡迎序列啟動   （running，藍色粗體）
○ D3 行為條件分流   （pending，灰色）
...
[===       ] 1 / 6

─────────────────
數據概覽
旅程觸發    1
訊息發送    2
完成率      —
預估完成    17s
```

### 5.2 多旅程支援

- 每次點「啟動旅程」新增一個旅程區塊至 Drawer
- 新旅程區塊插入至頂部（newest-first）
- 已完成旅程：狀態顯示「已完成 ✓」，完成率顯示百分比

### 5.3 數據概覽欄位

| 欄位 | 說明 |
|---|---|
| 旅程觸發 | journeys 總數（含進行中） |
| 訊息發送 | done 節點中 type 為 msg 的節點數 × journeys 數（估算） |
| 完成率 | done journeys / total journeys（未完成時顯示「—」） |
| 預估完成 | 剩餘節點 × 平均每節點秒數（固定估算：約 2.5s/節點） |

---

## 6. postMessage 協定

### 6.1 新增：`journey-start-request`（HTML → 父層）

使用者點「▶ 啟動旅程」時：
1. **立即**：Drawer 展開（CSS class toggle，不等待 postMessage 回應）
2. **同步**：發送 postMessage 通知父層建立旅程

```javascript
// btn-start click handler
openDrawer()  // 立即展開 Drawer
window.parent.postMessage({ type: 'journey-start-request' }, '*')
```

### 6.2 現有不變

| 方向 | type | 說明 |
|---|---|---|
| HTML → 父層 | `journey-state-request` | HTML 載入後主動索取初始狀態 |
| 父層 → HTML | `journey-state-sync` | 每次節點狀態變更後推送完整 journeys 陣列 |

### 6.3 父層新增監聽（`AiViewerRightBox.vue`）

```typescript
function handleJourneyStartRequest(event: MessageEvent) {
  if (event.data?.type !== 'journey-start-request') return
  _journeyUserCount++  // 與 chip handler 共用同一個 module-level 變數，計數連續遞增
  const journeyId = journeyStore.createJourney(`User #${_journeyUserCount}`)
  startJourneyExecution(journeyId)
  syncJourneyToIframe()
}
// onMounted 註冊，onUnmounted 移除
```

---

## 7. HTML 結構概要

```html
<body>
  <!-- Header（fixed） -->
  <div class="topbar">
    <div class="topbar-info">...</div>
    <button id="btn-start">▶ 啟動旅程</button>
  </div>

  <!-- Main layout -->
  <div class="layout">
    <!-- 旅程樹 -->
    <div class="tree-panel" id="treePanel">
      <!-- D0, D1, D3（含 branch row）, D7, D14, D30 -->
      <!-- 節點 class 由 renderTree(journeys) 動態更新 -->
    </div>

    <!-- 右側 Drawer -->
    <div class="drawer" id="drawer">
      <div class="drawer-hdr">執行狀態 <span id="btn-close">×</span></div>
      <div class="drawer-body" id="drawerBody">
        <!-- renderDrawer(journeys) 動態填入 -->
      </div>
    </div>
  </div>

  <script>
    // renderTree(journeys)    — 根據 journeys 陣列更新節點 class
    // renderDrawer(journeys)  — 重繪 Drawer 旅程列表
    // postMessage listeners
  </script>
</body>
```

---

## 8. 渲染函式設計

### 8.1 `renderTree(journeys)`

取所有旅程中「最新一筆」作為節點樹的顯示狀態（多旅程時，樹狀只反映最新旅程進度；詳細各旅程狀態在 Drawer 查看）。

邏輯：
1. 取 `journeys[0]`（newest-first），若無則全部 pending
2. 對每個 `NODES[i]`，找對應 `node.status`
3. 更新 DOM 節點的 class：`pending` / `running` / `done`
4. `done` 時插入 ✓ badge；`running` 時顯示動態 dot

### 8.2 `renderDrawer(journeys)`

完整重繪 Drawer 內容（無需 diff）：

```javascript
function renderDrawer(journeys) {
  var body = document.getElementById('drawerBody');
  if (!journeys || journeys.length === 0) {
    body.innerHTML = '<div class="empty-hint">尚無旅程…</div>';
    return;
  }
  body.innerHTML = journeys.map(renderJourneyBlock).join('');
}

// renderJourneyBlock(journey) 產生單一旅程 HTML 字串：
// - 標題：userName + 狀態 badge
// - 節點列表：每個 node 一行（done/running/pending 三種樣式）
// - 進度條 + 節點計數
// - 數據概覽區塊（旅程觸發、訊息發送估算、完成率、預估完成）
// 使用 escHtml() 對 userName / node.label 做 XSS 防護
```

---

## 9. 不在此次範圍

- 不修改 `journeyStore.ts`（資料模型不變）
- 不修改 `JourneyDashboard.vue`（獨立頁面不受影響）
- 不修改路由
- 不新增 SCSS
- `AiViewerRightBox.vue` 的 chip 自動啟動旅程邏輯保留不動（現有第一筆旅程仍由 chip 觸發）
