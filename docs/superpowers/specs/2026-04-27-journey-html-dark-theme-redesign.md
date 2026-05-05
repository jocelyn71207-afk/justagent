# Journey HTML 淺色 Canvas 風格重設計規格

**日期：** 2026-04-27
**目標：** 將三個旅程 HTML iframe 檔案統一改為淺色 canvas 風格，節點改用彩色 header pill 設計。

---

## 適用檔案

| 檔案 | 內容 | 主調色 |
|------|------|--------|
| `public/hurricane_trailsetter_journey_dashboard.html` | 行銷旅程 D0→D30 + 啟動/修改按鈕 + 狀態同步 | 藍色 `#3b72f6` |
| `public/hurricane_trailsetter_birthday_journey.html` | 生日旅程 PRE7→D30 + 啟動/修改按鈕 + 狀態同步 | 紫色 `#7c3aed` |
| `public/hurricane_trailsetter_journey_flow.html` | 旅程流程圖報告（靜態，無互動） | 綠色 `#059669` |

---

## 視覺規格

### Canvas 背景

```css
background-color: #f8faff;
background-image: radial-gradient(circle, #c7d2fe 1px, transparent 1px);
background-size: 24px 24px;
```

生日旅程改用紫色格線：
```css
background-color: #faf5ff;
background-image: radial-gradient(circle, #ddd6fe 1px, transparent 1px);
```

### Topbar（保持原位）

- 背景 `#fff`，底部邊框 `1px solid #e5e7eb`
- 左側：品牌 label + 旅程標題
- 右側：功能按鈕（位置與原設計一致）
- 生日旅程原有的 segment stat bar 保留在 topbar 下方

### 縮放控制（視覺用，不需實作縮放功能）

- 右上角固定：`position: absolute; top: 10px; right: 10px`
- 白底 + `#e5e7eb` 邊框 + 圓角 8px
- 顯示「−  100%  +」三個元素（按鈕點擊無需功能）

### 左側 Sidebar

不顯示。

### 節點設計

每個節點由兩部分組成：

**Header pill（彩色背景條）：**
```html
<div class="jnode-hdr hdr-{color}">
  {icon} {節點類型名稱}
</div>
```

**Body（白底卡片）：**
```html
<div class="jnode-body">
  <div class="jnode-title">節點標題</div>
  <div class="jnode-sub">副說明</div>
</div>
```

**左側 accent border：** `border-left: 3px solid {accent-color}`

**節點類型對應色：**

| 類型 | Header class | Left border | 用於 |
|------|-------------|------------|------|
| 觸發/起點 | `hdr-blue` `#eff6ff / #2563eb` | `#3b72f6` | D0（行銷）、D0（生日） |
| 訊息發送 | `hdr-teal` `#f0fdfe / #0891b2` | `#0891b2` | D1、D7、D14 |
| 條件分流 | `hdr-purple` `#f5f3ff / #7c3aed` | `#7c3aed` | D3（行銷）、過濾節點 |
| 旅程終點 | `hdr-green` `#f0fdf4 / #16a34a` | `#16a34a` | D30 |
| 篩選/過濾 | `hdr-purple`（同條件分流） | `#7c3aed` | 生日 PRE7 |
| 回購/培育 | `hdr-amber` `#fffbeb / #d97706` | `#f59e0b` | D7（生日回購）|

生日旅程主色改為紫色系，running glow 用 `rgba(124,58,237,0.2)`。

### 節點狀態

| 狀態 | 視覺 |
|------|------|
| `pending` | 正常顯示 |
| `running` | `box-shadow: 0 0 0 3px rgba(59,114,246,0.2)` + running pill 動畫 |
| `done` | 右上角綠色 ✓ badge，body opacity 稍降 |

connector line：pending 用 `#d1d5db`，done 用 `#16a34a`。

---

## 功能保留（不得移除）

### journey_dashboard.html + birthday_journey.html

- `btn-start` → `postMessage({ type: 'journey-start-request' })`
- `btn-modify` → `postMessage({ type: 'journey-modify-request' })`
- `window.addEventListener('message', ...)` 接收 `journey-state-sync` / `birthday-journey-state-sync`
- `window.parent.postMessage({ type: 'journey-state-request' })` 初始化
- `renderTree(journeys)` 根據 journeys 陣列更新每個節點的 status class

### journey_flow.html

靜態報告，無 postMessage，只改樣式。

---

## 範圍限制

- 只改 CSS 與 HTML 結構，不改 JavaScript 邏輯
- `journey_flow.html` 的節點內容（文字、標籤）可一起更新成新風格，JS 不動
- 不新增任何互動功能（縮放、拖曳等）
