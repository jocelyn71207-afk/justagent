# 深度分析流程重構：上傳面板整合至 Step 2

**Date:** 2026-04-10  
**File:** `src/components/AiViewer/AiViewerRightBox.vue`  
**Scope:** 商品競品分析 → 深度分析模式（不影響初步分析）

---

## 目標

將深度分析流程中獨立的「上傳商品資料」浮動面板移除，改將圖片上傳整合進 Step panel 的第二步驟，同時將商品名稱與商品描述改為必填欄位。

---

## 流程變更

### Before
```
選深度分析
  → 上傳面板 (conv2UploadFpVisible) 出現 [圖片 + 描述]
  → 使用者點「開始分析」→ conv2StartAnalysis()
  → AI thinking → 商品卡片 → 確認按鈕
  → conv2ConfirmProduct() → Step panel 從 Step 1 開啟
```

### After
```
選深度分析
  → AI push 一句話：「好的！請在下方面板完成深度分析設定。」
  → Step panel 直接從 Step 1 開啟
```

---

## 具體變更

### 1. `conv2SelectMode('deep')` 行為
- **移除**：顯示 `conv2UploadFpVisible = true` 及相關 pill
- **移除**：AI 訊息「需要你提供一些商品的圖片…」
- **新增**：push AI 訊息「好的！請在下方面板完成深度分析設定。」
- **新增**：`conv2CurStep.value = 1; conv2StepFpVisible.value = true; conv2ShowStepPill.value = true`

### 2. Step 2 模板（`v-show="conv2CurStep === 2"`）

在現有欄位（品牌、定價、商品名稱、商品描述）**之前**，新增圖片上傳區塊：

```html
<!-- 圖片上傳框（沿用 conv2-up-img-box 樣式） -->
<div class="conv2-up-img-box" style="margin-bottom:10px">
  <img :src="DEMO_IMG" />
</div>
```

欄位標籤變更：
- **note**：從「非必填」改為「圖片選填；商品名稱與描述為必填」
- **商品名稱**：移除「選填」label，改加「*」必填標示
- **商品描述**：移除「選填」label，改加「*」必填標示

新增錯誤訊息顯示：
```html
<div class="conv2-err">{{ conv2S2Err }}</div>
```

### 3. Step 2 → 3 驗證邏輯

新增 ref：
```ts
const conv2S2Err = ref('');
```

新增驗證函式（或修改「確認 →」按鈕的 click handler）：
```ts
function conv2GoStep2to3() {
  if (!conv2S2Name.value.trim() || !conv2S2Desc.value.trim()) {
    conv2S2Err.value = '商品名稱與描述為必填';
    return;
  }
  conv2S2Err.value = '';
  conv2GoStep(3);
}
```

「確認 →」按鈕改為呼叫 `conv2GoStep2to3()`，「← 返回」維持呼叫 `conv2GoStep(1)`。

### 4. 初步分析不變

`conv2SelectMode('init')` 分支邏輯完全不動。

---

## 不在本次範圍內

- 上傳面板的實際檔案選擇功能（demo 維持顯示 DEMO_IMG）
- Step 45 確認頁的 review grid（可選擇性加上商品名稱列）
- 初步分析的任何流程

---

## 影響評估

- **單一檔案**：`AiViewerRightBox.vue`（template + script setup）
- **無新元件**、**無 store 變更**、**無 SCSS 新增**（圖片框沿用既有 class）
