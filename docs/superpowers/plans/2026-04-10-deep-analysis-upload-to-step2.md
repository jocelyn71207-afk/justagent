# 深度分析：上傳面板整合至 Step 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將深度分析流程中獨立的「上傳商品資料」浮動面板移除，改為選擇「深度分析」後直接開啟 Step panel，並將圖片上傳框整合至 Step 2，同時將商品名稱與商品描述改為必填。

**Architecture:** 單一檔案修改（`AiViewerRightBox.vue`）。拆分 `conv2SelectMode` 中 init/deep 的分支邏輯，Step 2 模板新增圖片框與必填驗證，新增 `conv2S2Err` ref 和 `conv2GoStep2to3()` 驗證函式。

**Tech Stack:** Vue 3 (script setup + Composition API), TypeScript

---

## File Map

| File | 動作 |
|---|---|
| `src/components/AiViewer/AiViewerRightBox.vue` | 修改 template（Step 2 區塊）+ script setup（新增 ref、函式、修改 conv2SelectMode） |

---

### Task 1：拆分 `conv2SelectMode` — deep mode 直接開啟 Step panel

**Files:**
- Modify: `src/components/AiViewer/AiViewerRightBox.vue`（`conv2SelectMode` 函式）

**背景：** 目前 `init` 和 `deep` 走同一個分支（都顯示上傳面板）。需將 `deep` 獨立出來，直接開啟 Step panel。

- [ ] **Step 1: 找到 `conv2SelectMode` 函式（約 1149 行）並修改**

將現有程式碼：

```typescript
  // init / deep: 開啟上傳懸浮面板
  setTimeout(() => {
    c2Push({ msg: `需要你提供一些商品的圖片或詳細文字描述，才能進行${labels[mode]}，請在下方面板上傳商品資訊。` });
    c2Scroll();
    conv2UploadFpVisible.value = true;
    conv2ShowUploadPill.value = true;
  }, 400);
}
```

替換為：

```typescript
  if (mode === 'deep') {
    setTimeout(() => {
      c2Push({ msg: '好的！請在下方面板完成深度分析設定。' });
      c2Scroll();
      conv2CurStep.value = 1;
      conv2StepFpVisible.value = true;
      conv2ShowStepPill.value = true;
    }, 400);
    return;
  }

  // init: 開啟上傳懸浮面板
  setTimeout(() => {
    c2Push({ msg: `需要你提供一些商品的圖片或詳細文字描述，才能進行${labels[mode]}，請在下方面板上傳商品資訊。` });
    c2Scroll();
    conv2UploadFpVisible.value = true;
    conv2ShowUploadPill.value = true;
  }, 400);
}
```

- [ ] **Step 2: 啟動 dev server 手動驗證**

```bash
npm run dev
```

在瀏覽器開啟 conv2 頁面，點擊「商品競品分析」→「深度分析」，確認：
- **不出現**「上傳商品資料」浮動面板
- **不出現**「需要你提供一些商品的圖片…」訊息
- **出現**「好的！請在下方面板完成深度分析設定。」訊息
- Step panel 直接從 Step 1 開啟

- [ ] **Step 3: Commit**

```bash
git add src/components/AiViewer/AiViewerRightBox.vue
git commit -m "feat(conv2): deep mode skips upload panel, opens step panel directly"
```

---

### Task 2：新增 `conv2S2Err` ref 與 `conv2GoStep2to3()` 驗證函式

**Files:**
- Modify: `src/components/AiViewer/AiViewerRightBox.vue`（script setup）

**背景：** Step 2 → 3 的「確認 →」需要驗證商品名稱和商品描述不為空，需要新增 error state 和驗證函式。

- [ ] **Step 1: 在 `conv2S2Desc` 那行之後新增 `conv2S2Err` ref**

找到（約 986 行）：
```typescript
const conv2S2Desc = ref(DEMO_DESC);
```

在其後新增：
```typescript
const conv2S2Err = ref('');
```

- [ ] **Step 2: 在 `conv2GoStep` 函式之後新增 `conv2GoStep2to3` 函式**

找到（約 977 行）：
```typescript
function conv2GoStep(n: number | string) { conv2CurStep.value = n; }
```

在其後新增：
```typescript
function conv2GoStep2to3() {
  if (!conv2S2Name.value.trim() || !conv2S2Desc.value.trim()) {
    conv2S2Err.value = '商品名稱與描述為必填';
    return;
  }
  conv2S2Err.value = '';
  conv2GoStep(3);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/AiViewer/AiViewerRightBox.vue
git commit -m "feat(conv2): add step2 validation ref and goStep2to3 function"
```

---

### Task 3：更新 Step 2 模板 — 加圖片框、必填標示、錯誤訊息

**Files:**
- Modify: `src/components/AiViewer/AiViewerRightBox.vue`（template，Step 2 區塊約 184~197 行）

**背景：** Step 2 需要在頂部加上圖片上傳框（沿用既有 `conv2-up-img-box` class），將商品名稱與描述標為必填，加上錯誤訊息區塊，並將確認按鈕改為呼叫新的 `conv2GoStep2to3()`。

- [ ] **Step 1: 將 Step 2 整個 `<div v-show="conv2CurStep === 2">` 區塊替換**

找到現有程式碼（約 184~197 行）：

```html
          <!-- Step 2: 商品資訊 -->
          <div v-show="conv2CurStep === 2">
            <div class="conv2-info-note">✦ AI 從圖片與描述自動帶入，非必填</div>
            <div class="conv2-fg">
              <div><div class="conv2-fl">品牌 <span style="font-size:10px;color:var(--color-text-alpha50)">選填</span></div><input class="conv2-fi" v-model="conv2S2Brand" @click.stop /></div>
              <div><div class="conv2-fl">定價 <span style="font-size:10px;color:var(--color-text-alpha50)">選填</span></div><input class="conv2-fi" v-model="conv2S2Price" @click.stop /></div>
            </div>
            <div style="margin-bottom:7px"><div class="conv2-fl">商品名稱 <span style="font-size:10px;color:var(--color-text-alpha50)">選填</span></div><input class="conv2-fi conv2-fi--full" v-model="conv2S2Name" @click.stop /></div>
            <div><div class="conv2-fl">商品描述 <span style="font-size:10px;color:var(--color-text-alpha50)">選填</span></div><textarea class="conv2-fi conv2-fi--full conv2-fi--ta" v-model="conv2S2Desc" rows="2" @click.stop></textarea></div>
            <div class="conv2-fp-btn-row">
              <button class="conv2-fp-sec-btn" @click.stop="conv2GoStep(1)">← 返回</button>
              <button class="conv2-fp-btn" @click.stop="conv2GoStep(3)">確認 →</button>
            </div>
          </div>
```

替換為：

```html
          <!-- Step 2: 商品資訊 -->
          <div v-show="conv2CurStep === 2">
            <div class="conv2-info-note">✦ 圖片選填；商品名稱與描述為必填</div>
            <div class="conv2-up-img-box" style="margin-bottom:10px">
              <img :src="DEMO_IMG" />
            </div>
            <div class="conv2-fg">
              <div><div class="conv2-fl">品牌 <span style="font-size:10px;color:var(--color-text-alpha50)">選填</span></div><input class="conv2-fi" v-model="conv2S2Brand" @click.stop /></div>
              <div><div class="conv2-fl">定價 <span style="font-size:10px;color:var(--color-text-alpha50)">選填</span></div><input class="conv2-fi" v-model="conv2S2Price" @click.stop /></div>
            </div>
            <div style="margin-bottom:7px"><div class="conv2-fl">商品名稱 <span style="color:var(--color-error,#dc2626)">*</span></div><input class="conv2-fi conv2-fi--full" v-model="conv2S2Name" @click.stop /></div>
            <div><div class="conv2-fl">商品描述 <span style="color:var(--color-error,#dc2626)">*</span></div><textarea class="conv2-fi conv2-fi--full conv2-fi--ta" v-model="conv2S2Desc" rows="2" @click.stop></textarea></div>
            <div class="conv2-err">{{ conv2S2Err }}</div>
            <div class="conv2-fp-btn-row">
              <button class="conv2-fp-sec-btn" @click.stop="conv2GoStep(1)">← 返回</button>
              <button class="conv2-fp-btn" @click.stop="conv2GoStep2to3()">確認 →</button>
            </div>
          </div>
```

- [ ] **Step 2: 驗證 dev server**

```bash
npm run dev
```

確認：
- Step 2 頂部出現商品圖片框
- 商品名稱、商品描述旁顯示紅色「*」
- 清空商品名稱或描述後點「確認 →」，出現「商品名稱與描述為必填」錯誤訊息
- 填入兩欄後可正常前往 Step 3

- [ ] **Step 3: Commit**

```bash
git add src/components/AiViewer/AiViewerRightBox.vue
git commit -m "feat(conv2): step2 add image box and required validation for name/desc"
```

---

## 自我審查

| Spec 需求 | 對應 Task |
|---|---|
| 移除深度分析初始上傳面板 | Task 1 |
| 深度分析直接開啟 Step panel | Task 1 |
| Step 2 加入圖片上傳框 | Task 3 |
| 商品名稱必填 | Task 2 + 3 |
| 商品描述必填 | Task 2 + 3 |
| 初步分析流程不變 | Task 1（init 分支保留原邏輯） |
