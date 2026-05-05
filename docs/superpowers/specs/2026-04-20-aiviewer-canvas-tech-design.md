# AiViewer 畫布科技感升級 — 設計規格

**日期：** 2026-04-20
**範圍：** `src/views/AiViewer.vue`、`src/scss/views/_AiViewer.scss`
**實作方案：** 方案 B（SCSS 為主 + 少量 Vue computed 調整）

---

## 1. 設計目標

在保留現有 Spring Green（emerald）設計系統與淺色風格的前提下，提升畫布區塊的科技精緻感。不改變互動邏輯，只升級視覺層。

---

## 2. 各部位設計規格

### 2.1 畫布背景（`.center-box`）

**變更：** 圓點格線 → 細十字格線（大格 + 小格雙層）

```scss
// 替換現有 radial-gradient 圓點
background-image:
  repeating-linear-gradient(rgba(0,0,0,0.055) 0px, transparent 1px),       // 水平大格線
  repeating-linear-gradient(90deg, rgba(0,0,0,0.055) 0px, transparent 1px), // 垂直大格線
  repeating-linear-gradient(rgba(0,0,0,0.025) 0px, transparent 1px),        // 水平小格線
  repeating-linear-gradient(90deg, rgba(0,0,0,0.025) 0px, transparent 1px); // 垂直小格線
background-size: 96px 96px, 96px 96px, 24px 24px, 24px 24px;
```

**深色主題：** 將 `rgba(0,0,0,...)` 改為 `rgba(255,255,255,...)`，opacity 各降約 40%。

**縮放同步（Vue computed）：** 修改 `centerBoxStyle` computed，讓 `background-size` 隨 `centerContentScale` 同步縮放：

```ts
// 原本
const bgSize = 10 * centerContentScale.value;
return { backgroundSize: `${bgSize}px ${bgSize}px` };

// 改為（雙層格線同步）
const small = 24 * centerContentScale.value;
const large = 96 * centerContentScale.value;
return {
  backgroundSize: `${large}px ${large}px, ${large}px ${large}px, ${small}px ${small}px, ${small}px ${small}px`
};
```

---

### 2.2 區塊（Block）質感升級

**目標 class：** `.AiViewerContentBox`（`src/scss/views/_AiViewer.scss` 第 1180 行）

> 注意：block 不新增標題列結構，只升級現有容器的邊框、背景、陰影質感。

**一般狀態（非選取）：**
```scss
.AiViewerContentBox {
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(52, 211, 153, 0.28);   // 原 var(--color-border)
  border-radius: 12px;                           // 原 20px，稍微收緊
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow:
    0 4px 20px rgba(5, 150, 105, 0.09),
    0 1px 4px rgba(0, 0, 0, 0.06),
    0 0 0 1px rgba(52, 211, 153, 0.10);
}
```

**單選狀態（`.AiViewerContentResize.isActive`）：**
```scss
.AiViewerContentResize.isActive {
  .vue-drag-resize-rotate {
    border-radius: 12px;  // 同步收緊
  }
  .AiViewerContentBox {
    border-color: rgba(52, 211, 153, 0.60);
    box-shadow:
      0 0 0 2px rgba(52, 211, 153, 0.20),  // 細 outline，不外擴
      0 4px 20px rgba(5, 150, 105, 0.10);  // 輕微下方陰影
  }
}
```

**多選狀態（`.AiViewerContentResize.isMultiActive`）：** 維持現有 box-shadow 邏輯，光暈同步調整為收斂版：
```scss
.AiViewerContentResize.isMultiActive {
  box-shadow:
    0 0 0 2px rgba(5, 150, 105, 0.50),
    0 0 8px rgba(5, 150, 105, 0.25);
  border-radius: 12px;
}
```

---

### 2.3 浮動控制列（`.AiViewr-ctrl-box`）

所有浮動控制元件統一升級為毛玻璃膠囊樣式：

```scss
.AiViewr-ctrl-box {
  background: rgba(255, 255, 255, 0.80);
  border: 1px solid rgba(52, 211, 153, 0.20);
  border-radius: 28px;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow:
    0 2px 12px rgba(0, 0, 0, 0.07),
    0 0 0 1px rgba(52, 211, 153, 0.08);

  // hover 狀態
  .ctrl-btn:hover {
    background: rgba(52, 211, 153, 0.10);
    color: var(--color-wise-dark-green);
    border-radius: 50%;
  }

  // active 按鈕（例如功能列的選中按鈕）
  .ctrl-btn.active {
    background: rgba(52, 211, 153, 0.15);
    color: var(--color-wise-dark-green);
  }

  // 百分比文字
  .percent {
    color: var(--color-primary);
    font-weight: 600;
  }
}
```

深色主題下 background 改為 `rgba(30, 32, 36, 0.85)`，border 改為 `rgba(52, 211, 153, 0.15)`。

---

## 3. 不在本次範圍內

- Block 內容區域的樣式（PDF 閱讀器、圖表、圖片等）保持不變
- 右側 Panel（`AiViewerRightBox`）不在本次範圍
- 動畫效果（掃描線、閃爍等）不加入
- Konva.js GridLayer 不改動

---

## 4. 檔案變動清單

| 檔案 | 變動類型 | 說明 |
|------|----------|------|
| `src/scss/views/_AiViewer.scss` | 修改 | 格線背景、block 選取樣式、控制列樣式 |
| `src/views/AiViewer.vue` | 修改 | `centerBoxStyle` computed 格線縮放邏輯 |

---

## 5. 驗收標準

- [ ] 格線隨畫布縮放同步縮小/放大
- [ ] 深色主題格線正常顯示（白色格線）
- [ ] Block 選取時出現細 emerald outline，無大範圍外擴光暈
- [ ] 所有浮動控制列呈現毛玻璃膠囊樣式
- [ ] 控制列 hover 有 emerald 淡底反饋
- [ ] 不影響拖曳、縮放、多選等互動功能
