# AiViewer 畫布科技感升級 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將 AiViewer 畫布的背景格線、區塊質感、控制列樣式升級為毛玻璃 + 細十字格線的科技精緻風格，不改動任何互動邏輯。

**Architecture:** 方案 B — SCSS 為主 + 少量 Vue computed 調整。修改 `_AiViewer.scss` 中的背景、block、控制列樣式；同步修改 `AiViewer.vue` 的 `centerBoxStyle` computed 讓格線隨畫布縮放正確同步。不新增任何元件或邏輯。

**Tech Stack:** Vue 3 `<script setup>`, SCSS（Dart Sass），無新增依賴

---

## 受影響的檔案

| 檔案 | 變更類型 | 說明 |
|------|----------|------|
| `src/views/AiViewer.vue` | 修改 | `centerBoxStyle` computed，第 417–427 行 |
| `src/scss/views/_AiViewer.scss` | 修改 | `.center-box` 背景、`.AiViewerContentBox`、`.AiViewerContentResize` 選取狀態、`.AiViewr-ctrl-box` |

> 本任務無法用 Vitest 做單元測試（純視覺 CSS 變更）。驗收方式為跑 dev server 目視確認，每個 task 都有明確的視覺檢查清單。

---

## Task 1：格線背景 — Vue computed 更新

**Files:**
- Modify: `src/views/AiViewer.vue:417-427`

`centerBoxStyle` 原本只回傳一個 `backgroundSize`（對應圓點）。改為回傳四層 `background-size`，對應新的雙層細十字格線。

- [ ] **Step 1：修改 `centerBoxStyle` computed**

找到 `src/views/AiViewer.vue` 第 417 行的 `centerBoxStyle` computed，將整個函式內容替換為：

```ts
const centerBoxStyle = computed(() => {
  // 細十字格線雙層縮放（大格 96px / 小格 24px，隨畫布 scale 同步）
  const small = 24 * centerContentScale.value;
  const large = 96 * centerContentScale.value;
  return {
    backgroundSize: `${large}px ${large}px, ${large}px ${large}px, ${small}px ${small}px, ${small}px ${small}px`,
  };
});
```

- [ ] **Step 2：跑 dev server，確認沒有 TS 錯誤**

```bash
npm run dev
```

預期：dev server 正常啟動，terminal 無紅色 error。

- [ ] **Step 3：commit**

```bash
git add src/views/AiViewer.vue
git commit -m "feat: update centerBoxStyle computed for cross-grid zoom sync"
```

---

## Task 2：格線背景 — SCSS 替換

**Files:**
- Modify: `src/scss/views/_AiViewer.scss:21-40`（`.AiViewer .center-box` 區塊）

將圓點 `radial-gradient` 換成細十字格線的 `repeating-linear-gradient`。`background-size` 初始值需對應 Task 1 中 `scale = 1.0` 時的尺寸（large=96px, small=24px）。

- [ ] **Step 1：替換 `.center-box` 的 background-image 與 background-size**

找到 `_AiViewer.scss` 第 33–40 行，將以下區塊：

```scss
// 圓點點背景
background-image: radial-gradient(circle, rgba($black, 0.1) 1px, transparent 1px);
background-size: 10px 10px; // 點點間距 js 會依照縮放比例調整
background-position: 0 0;

// 特別客製深色主題
@media (prefers-color-scheme: dark) {
  background-image: radial-gradient(circle, rgba($white, 0.08) 1px, transparent 1px);
}
```

替換為：

```scss
// 細十字格線背景（大格 96px / 小格 24px，js 會依縮放比例動態調整 background-size）
background-image:
  repeating-linear-gradient(rgba($black, 0.055) 0px, transparent 1px),
  repeating-linear-gradient(90deg, rgba($black, 0.055) 0px, transparent 1px),
  repeating-linear-gradient(rgba($black, 0.025) 0px, transparent 1px),
  repeating-linear-gradient(90deg, rgba($black, 0.025) 0px, transparent 1px);
background-size: 96px 96px, 96px 96px, 24px 24px, 24px 24px; // js 會覆蓋此值
background-position: 0 0;

// 特別客製深色主題
@media (prefers-color-scheme: dark) {
  background-image:
    repeating-linear-gradient(rgba($white, 0.04) 0px, transparent 1px),
    repeating-linear-gradient(90deg, rgba($white, 0.04) 0px, transparent 1px),
    repeating-linear-gradient(rgba($white, 0.018) 0px, transparent 1px),
    repeating-linear-gradient(90deg, rgba($white, 0.018) 0px, transparent 1px);
}
```

- [ ] **Step 2：瀏覽器開啟 `/view/AiViewer`，視覺確認**

預期：
- 畫布背景從圓點改為細十字格線
- 縮放畫布時（滾輪 or 縮放按鈕），格線間距隨縮放同步變化
- 深色模式下格線可見（白色細線）

- [ ] **Step 3：commit**

```bash
git add src/scss/views/_AiViewer.scss
git commit -m "feat: replace dot grid with fine cross grid in AiViewer canvas"
```

---

## Task 3：區塊（Block）質感升級

**Files:**
- Modify: `src/scss/views/_AiViewer.scss:1180-1190`（`.AiViewerContentBox` 區塊）

`.AiViewerContentBox` 目前使用 `var(--color-background)` 純白背景 + `var(--color-border)` 灰色邊框。改為毛玻璃質感 + emerald 邊框微光。

- [ ] **Step 1：修改 `.AiViewerContentBox` 基本樣式**

找到 `_AiViewer.scss` 第 1180 行的 `.AiViewerContentBox {`，將以下幾行：

```scss
background-color: var(--color-background);
border: 2px solid var(--color-border);
border-radius: 20px;
```

替換為：

```scss
background: rgba(255, 255, 255, 0.78);
border: 1px solid rgba(52, 211, 153, 0.28);
border-radius: 12px;
backdrop-filter: blur(14px);
-webkit-backdrop-filter: blur(14px);
box-shadow:
  0 4px 20px rgba(5, 150, 105, 0.09),
  0 1px 4px rgba(0, 0, 0, 0.06),
  0 0 0 1px rgba(52, 211, 153, 0.10);
```

- [ ] **Step 2：深色主題補充**

在 `_AiViewer.scss` 的 `.AiViewerContentBox` 區塊內尾端，加入深色主題覆蓋：

```scss
@media (prefers-color-scheme: dark) {
  background: rgba(40, 42, 46, 0.82);
  border-color: rgba(52, 211, 153, 0.22);
}
```

- [ ] **Step 3：瀏覽器確認**

預期：
- 每個 block 容器有淡 emerald 邊框 + 毛玻璃半透明背景
- 格線透過毛玻璃隱約可見（不是被純白蓋死）
- 深色模式下 block 呈深色半透明

- [ ] **Step 4：commit**

```bash
git add src/scss/views/_AiViewer.scss
git commit -m "feat: upgrade AiViewerContentBox to glassmorphism style"
```

---

## Task 4：選取狀態升級

**Files:**
- Modify: `src/scss/views/_AiViewer.scss:1107-1140`（`.AiViewerContentResize` 區塊）

升級單選（`.isActive`）與多選（`.isMultiActive`）兩種狀態的視覺。光暈保持收斂，不外擴。

- [ ] **Step 1：修改單選狀態 `.isActive`**

找到 `_AiViewer.scss` 第 1110 行的 `&.isActive {`，將其中的 `.vue-drag-resize-rotate` 修改如下（原本只改 `border-color`）：

```scss
&.isActive {
  &.vue-drag-resize-rotate {
    border-radius: 12px; // 與 AiViewerContentBox 同步
  }
  .AiViewerContentBox {
    border-color: rgba(52, 211, 153, 0.60);
    box-shadow:
      0 0 0 2px rgba(52, 211, 153, 0.20),  // 細 outline，不外擴
      0 4px 20px rgba(5, 150, 105, 0.10);  // 輕微下方陰影
  }
  // 提升內容區塊避免拖曳時誤觸（保留原有邏輯）
  .AiViewerContentBox .content-box {
    &:before {
      z-index: -1;
    }
  }
}
```

- [ ] **Step 2：修改多選狀態 `.isMultiActive`**

找到第 1129 行的 `&.isMultiActive {`，將原本的多層 box-shadow 替換為：

```scss
&.isMultiActive {
  box-shadow:
    0 0 0 2px rgba(5, 150, 105, 0.50),
    0 0 8px rgba(5, 150, 105, 0.25);
  border-radius: 12px;
  .AiViewerContentBox {
    border-color: transparent;
  }
}
```

- [ ] **Step 3：瀏覽器確認**

預期：
- 點擊 block：emerald 細邊出現，無大範圍外擴光暈
- Cmd+Shift 進入多選模式，點擊 block：出現收斂的綠色外框
- 多選模式下拖曳選取框仍正常運作

- [ ] **Step 4：commit**

```bash
git add src/scss/views/_AiViewer.scss
git commit -m "feat: upgrade block selection states with contained emerald glow"
```

---

## Task 5：浮動控制列升級

**Files:**
- Modify: `src/scss/views/_AiViewer.scss:843-875`（`.AiViewr-ctrl-box` 區塊）

將所有浮動控制列統一升級為毛玻璃膠囊樣式，替換現有的 `--color-background-1-alpha70` 半透明背景。

- [ ] **Step 1：修改 `.AiViewr-ctrl-box` 基本樣式**

找到第 843 行的 `.AiViewr-ctrl-box {`，將以下屬性：

```scss
background-color: var(--color-background-1-alpha70);
backdrop-filter: blur(2px);
-webkit-backdrop-filter: blur(2px);
padding: 0 8px;
border-radius: 12px;
```

替換為：

```scss
background: rgba(255, 255, 255, 0.80);
border: 1px solid rgba(52, 211, 153, 0.20);
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
padding: 0 8px;
border-radius: 28px;
box-shadow:
  0 2px 12px rgba(0, 0, 0, 0.07),
  0 0 0 1px rgba(52, 211, 153, 0.08);
```

- [ ] **Step 2：ctrl-btn hover 效果**

在 `.AiViewr-ctrl-box` 的 `.ctrl-btn` 區塊內，加入 hover 樣式：

```scss
.ctrl-btn {
  height: 24px;
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 5px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 50%; // 新增
  transition: background 0.15s, color 0.15s; // 新增

  &:hover { // 新增
    background: rgba(52, 211, 153, 0.10);
    color: var(--color-wise-dark-green);
  }

  &.active { // 新增（功能列選中狀態）
    background: rgba(52, 211, 153, 0.15);
    color: var(--color-wise-dark-green);
  }
}
```

- [ ] **Step 3：縮放列百分比文字**

找到 `_AiViewer.scss` 第 935 行的 `.percent {` 區塊，在現有樣式中加入 `color` 並將 `font-weight` 從 `500` 改為 `600`：

```scss
.percent {
  width: 50px;
  margin: 0 5px;
  padding: 7.75px 0px;
  font-size: 14px;
  font-weight: 600;          // 原 500 → 改為 600
  color: var(--color-primary); // 新增：emerald 綠色
  text-align: center;
  border-radius: 6px;
  cursor: pointer;
  &:hover {
    background-color: var(--color-background-2-alpha20);
  }
}
```

- [ ] **Step 4：深色主題補充**

在 `.AiViewr-ctrl-box` 結尾加入深色主題覆蓋：

```scss
@media (prefers-color-scheme: dark) {
  background: rgba(30, 32, 36, 0.85);
  border-color: rgba(52, 211, 153, 0.15);
}
```

- [ ] **Step 5：瀏覽器確認**

預期：
- 縮放列、功能列、用戶列、右側收合按鈕 → 全部呈膠囊形毛玻璃樣式
- 按鈕 hover 有淡 emerald 圓形底色
- 功能列中已選中的按鈕（如「畫布內容查詢」）有較深的 emerald 底色
- 多選模式下控制列正確隱藏（原有邏輯保持不變）

- [ ] **Step 6：commit**

```bash
git add src/scss/views/_AiViewer.scss
git commit -m "feat: upgrade floating control bars to glassmorphism capsule style"
```

---

## Task 6：整合驗收

**Files:** 無新增，僅驗證

- [ ] **Step 1：執行 type-check 與 lint**

```bash
npm run type-check && npm run lint
```

預期：無錯誤輸出。

- [ ] **Step 2：完整功能迴歸測試（瀏覽器目視）**

開啟 dev server，進入 AiViewer 頁面，依序確認：

| 項目 | 預期行為 |
|------|----------|
| 格線背景 | 細十字格線，大格 96px / 小格 24px |
| 格線縮放 | 滾輪縮放時格線間距同步變化 |
| Block 一般狀態 | 毛玻璃半透明 + emerald 細邊框 |
| Block 單選 | emerald 邊框加深 + 細 2px outline，無大光暈 |
| Block 多選 | 收斂綠框，拖曳選取框仍正常 |
| 控制列外觀 | 膠囊毛玻璃，有 emerald 細邊 |
| ctrl-btn hover | 淡 emerald 圓底出現 |
| 多選模式隱藏 | 控制列在多選模式下正確隱藏（原邏輯） |
| 深色模式 | 格線改白色，block 改深色半透明，控制列改深色 |
| 拖曳 block | 正常拖曳，無樣式破版 |
| 縮放 block | resize handle 正常，block 尺寸正確更新 |

- [ ] **Step 3：如有發現問題，修正後再次確認**

- [ ] **Step 4：最終 commit**

```bash
git add -A
git commit -m "feat: complete AiViewer canvas tech-feel upgrade"
```
