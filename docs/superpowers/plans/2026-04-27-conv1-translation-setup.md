# Conv1 翻譯設定互動流程 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將 conv1 的靜態 translationConfirm 卡片改為 3 步驟引導面板（選文件→選範圍→選語言），仿照 conv2 的 `.conv2-fp` 模式實作。

**Architecture:** 在 `AiViewerRightBox.vue` 新增 conv1 翻譯面板的 state 和 functions；面板 HTML 插入 `.AiViewrUserInputArea` 中（同 `.conv2-fp` 位置）；`AiViewerRecord.vue` 新增 `confirmed: false` 分支渲染；SCSS 新增面板 class。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Pinia store、SCSS at `src/scss/views/_AiViewer.scss`

---

## File Map

| 檔案 | 異動 |
|------|------|
| `src/components/AiViewer/AiViewerRightBox.vue` | 修改 id_3 初始值；新增 5 個 state refs、選項常數、2 個 functions；更新 `inputAreaHidden`；更新 `handleChatAreaClick`；新增面板 HTML |
| `src/components/AiViewer/AiViewerRecord.vue` | 新增 `confirmed: false` 分支 |
| `src/scss/views/_AiViewer.scss` | 新增 conv1 翻譯面板 class |

---

## Task 1: 修改 conv1Msgs id_3 初始值 + 新增選項常數

**Files:**
- Modify: `src/components/AiViewer/AiViewerRightBox.vue:789-798`

---

- [ ] **Step 1: 修改 conv1Msgs 中 id_3 的初始值為 `confirmed: false`**

在 `AiViewerRightBox.vue` 找到 `conv1Msgs` 陣列中的 `id_3` 記錄（目前約第 789 行），將以下內容：

```ts
  {
    id: 'id_3',
    forUser: true,
    cardType: 'translationConfirm',
    confirmed: true,
    file: 'AW26 Product Descriptions.xlsx',
    fileSize: 2834016,
    range: 'Line Sheet - Teva Footwear Fal/Features and Benefits (Product Bullets)',
    lang: '繁體中文',
    msg: '',
  },
```

改為：

```ts
  {
    id: 'id_3',
    forUser: true,
    cardType: 'translationConfirm',
    confirmed: false,
    file: '',
    fileSize: 2834016,
    range: '',
    lang: '',
    msg: '',
  },
```

- [ ] **Step 2: 在 conv1Msgs 陣列宣告之後（約第 860 行，緊接 `conv1DoneSteps` 之前）新增選項常數**

```ts
const conv1RangeOptions = [
  { value: 'Features and Benefits (Product Bullets)', label: 'Features and Benefits (Product Bullets)', sub: 'Line Sheet · Teva Footwear Fall · 143 欄位' },
  { value: '全部工作表', label: '全部工作表', sub: '所有 Sheet 完整翻譯' },
  { value: 'Line Sheet only', label: 'Line Sheet only', sub: '僅翻譯 Line Sheet 頁' },
]
const conv1LangOptions = [
  { value: '繁體中文', label: '繁體中文', flag: '🇹🇼', sub: 'Traditional Chinese' },
  { value: '簡體中文', label: '簡體中文', flag: '🇨🇳', sub: 'Simplified Chinese' },
  { value: '日文', label: '日文', flag: '🇯🇵', sub: 'Japanese' },
  { value: '韓文', label: '韓文', flag: '🇰🇷', sub: 'Korean' },
]
```

- [ ] **Step 3: 確認 dev server 可正常啟動**

```bash
npm run dev
```

開啟 conv1，確認第 3 則訊息（使用者卡片）現在顯示空白的 range 和 lang（之後 Task 4 會修正渲染）。

- [ ] **Step 4: Commit**

```bash
git add src/components/AiViewer/AiViewerRightBox.vue
git commit -m "feat: set conv1 id_3 confirmed=false, add translation option constants"
```

---

## Task 2: 新增 State、Functions，更新 inputAreaHidden 和 handleChatAreaClick

**Files:**
- Modify: `src/components/AiViewer/AiViewerRightBox.vue:1294` (state + functions)
- Modify: `src/components/AiViewer/AiViewerRightBox.vue:1294` (inputAreaHidden)
- Modify: `src/components/AiViewer/AiViewerRightBox.vue:1476` (handleChatAreaClick)

---

- [ ] **Step 1: 在 `inputAreaHidden` 宣告（約第 1294 行）之後，新增 5 個 state refs 和 2 個 functions**

找到這一行：
```ts
const inputAreaHidden = computed(() => conv2FpActive.value || showJourneyModifyPill.value);
```

在它的**後面**插入：

```ts
const conv1TranslPanelVisible = ref(false)
const conv1TranslStep = ref(1)
const conv1TranslFile = ref('AW26 Product Descriptions.xlsx')
const conv1TranslRange = ref('')
const conv1TranslLang = ref('')

function conv1OpenTranslPanel() {
  conv1TranslStep.value = 1
  conv1TranslFile.value = 'AW26 Product Descriptions.xlsx'
  conv1TranslRange.value = ''
  conv1TranslLang.value = ''
  conv1TranslPanelVisible.value = true
}

function conv1TranslSubmit() {
  conv1TranslPanelVisible.value = false
  const record = conv1Msgs.value.find((m: any) => m.id === 'id_3')
  if (record) {
    record.confirmed = true
    record.file = conv1TranslFile.value
    record.range = conv1TranslRange.value
    record.lang = conv1TranslLang.value
  }
  nextTick(() => AiAgentChatListScrollTo('ASC'))
}
```

- [ ] **Step 2: 更新 `inputAreaHidden` 加入 `conv1TranslPanelVisible`**

將：
```ts
const inputAreaHidden = computed(() => conv2FpActive.value || showJourneyModifyPill.value);
```

改為：
```ts
const inputAreaHidden = computed(() => conv2FpActive.value || showJourneyModifyPill.value || conv1TranslPanelVisible.value);
```

- [ ] **Step 3: 在 `handleChatAreaClick` 中加入新 action 處理**

找到 `handleChatAreaClick`（約第 1461 行），在 `conv1-next-step` 的處理之後（約第 1476 行），緊接 `if (currentConversationId.value !== 'conv2') return;` 之前，插入：

```ts
  if (action === 'conv1-open-transl-panel') {
    conv1OpenTranslPanel()
    return
  }
```

- [ ] **Step 4: 確認 TypeScript 無錯誤**

```bash
npm run type-check
```

Expected: 無錯誤輸出。

- [ ] **Step 5: Commit**

```bash
git add src/components/AiViewer/AiViewerRightBox.vue
git commit -m "feat: add conv1 translation panel state, functions, and click handler"
```

---

## Task 3: 新增面板 HTML Template

**Files:**
- Modify: `src/components/AiViewer/AiViewerRightBox.vue:361` (template)

---

- [ ] **Step 1: 在 `<!-- Conv1 旅程修改需求懸浮面板 -->` 這個 comment 之前（約第 361 行），插入翻譯設定面板 HTML**

找到這段（約第 361 行）：
```html
        <!-- Conv1 旅程修改需求懸浮面板 -->
        <div v-if="showJourneyModifyPill && currentConversationId !== 'conv2'" class="conv2-fp" @click.stop>
```

在它的**前面**插入：

```html
        <!-- Conv1 翻譯設定步驟面板 -->
        <div v-show="conv1TranslPanelVisible && currentConversationId === 'conv1'" class="conv2-fp conv1-transl-fp" @click.stop>
          <div class="conv2-fp-top">
            <div class="conv1-transl-step-track">
              <div :class="['conv1-transl-sd', { 'conv1-transl-sd--done': conv1TranslStep > 1, 'conv1-transl-sd--active': conv1TranslStep === 1 }]"></div>
              <div class="conv1-transl-sl"></div>
              <div :class="['conv1-transl-sd', { 'conv1-transl-sd--done': conv1TranslStep > 2, 'conv1-transl-sd--active': conv1TranslStep === 2 }]"></div>
              <div class="conv1-transl-sl"></div>
              <div :class="['conv1-transl-sd', { 'conv1-transl-sd--active': conv1TranslStep === 3 }]"></div>
            </div>
            <span class="conv2-fp-title">{{ ['選擇翻譯文件', '選擇翻譯範圍', '選擇目標語言'][conv1TranslStep - 1] }}</span>
            <button class="conv2-fp-close-btn" @click.stop="conv1TranslPanelVisible = false">
              <i class="material-symbols-outlined">close</i>
            </button>
          </div>
          <div class="conv2-fp-body">
            <!-- Step 1: 選擇翻譯文件 -->
            <div v-show="conv1TranslStep === 1">
              <div class="conv2-info-note">✦ 選擇要翻譯的 Excel 檔案</div>
              <div :class="['conv1-transl-file-card', { 'conv1-transl-file-card--selected': conv1TranslFile === 'AW26 Product Descriptions.xlsx' }]"
                   @click.stop="conv1TranslFile = 'AW26 Product Descriptions.xlsx'">
                <span class="conv1-transl-file-icon">📊</span>
                <div class="conv1-transl-file-info">
                  <div class="conv1-transl-file-name">AW26 Product Descriptions.xlsx</div>
                  <div class="conv1-transl-file-meta">XLSX · 2.7 MB · 已上傳</div>
                </div>
                <i class="material-symbols-outlined conv1-transl-file-check" v-if="conv1TranslFile === 'AW26 Product Descriptions.xlsx'">check_circle</i>
              </div>
              <div class="conv1-transl-upload-hint" @click.stop>
                <i class="material-symbols-outlined" style="font-size:14px">add</i>
                上傳其他檔案
              </div>
            </div>
            <!-- Step 2: 選擇翻譯範圍 -->
            <div v-show="conv1TranslStep === 2">
              <div class="conv2-info-note">✦ 選擇翻譯範圍</div>
              <div class="conv1-transl-range-list">
                <div v-for="(opt, i) in conv1RangeOptions" :key="i"
                     :class="['conv1-transl-range-item', { 'conv1-transl-range-item--selected': conv1TranslRange === opt.value }]"
                     @click.stop="conv1TranslRange = opt.value">
                  <div :class="['conv1-transl-radio', { 'conv1-transl-radio--sel': conv1TranslRange === opt.value }]"></div>
                  <div>
                    <div class="conv1-transl-range-title">{{ opt.label }}</div>
                    <div class="conv1-transl-range-sub">{{ opt.sub }}</div>
                  </div>
                </div>
              </div>
            </div>
            <!-- Step 3: 選擇目標語言 -->
            <div v-show="conv1TranslStep === 3">
              <div class="conv2-info-note">✦ 選擇目標語言</div>
              <div class="conv1-transl-lang-grid">
                <div v-for="(lang, i) in conv1LangOptions" :key="i"
                     :class="['conv1-transl-lang-chip', { 'conv1-transl-lang-chip--selected': conv1TranslLang === lang.value }]"
                     @click.stop="conv1TranslLang = lang.value">
                  <div class="conv1-transl-lang-flag">{{ lang.flag }}</div>
                  <div class="conv1-transl-lang-name">{{ lang.label }}</div>
                  <div class="conv1-transl-lang-sub">{{ lang.sub }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="conv1-transl-footer">
            <button v-if="conv1TranslStep > 1" class="conv2-fp-sec-btn" @click.stop="conv1TranslStep--">← 返回</button>
            <button v-if="conv1TranslStep < 3" class="conv2-fp-btn"
                    :disabled="(conv1TranslStep === 1 && !conv1TranslFile) || (conv1TranslStep === 2 && !conv1TranslRange)"
                    @click.stop="conv1TranslStep++">下一步 →</button>
            <button v-if="conv1TranslStep === 3" class="conv2-fp-btn"
                    :disabled="!conv1TranslLang"
                    @click.stop="conv1TranslSubmit()">確認送出 ✓</button>
          </div>
        </div>
```

- [ ] **Step 2: dev server 確認面板觸發（暫時測試）**

```bash
npm run dev
```

在瀏覽器 console 執行以下指令測試面板能否開啟（等 Task 4 完成才有正式入口）：

```js
// 在 Vue DevTools 找到 AiViewerRightBox 元件，或直接在 console 測試
// 暫時在 handleChatAreaClick 的 conv1-open-transl-panel 處加 console.log 驗證
```

或者：直接在 AiViewerRightBox.vue 的 `onMounted` 暫時加上：
```ts
onMounted(() => {
  // 測試用：確認面板可開啟。測試完移除此行。
  // conv1TranslPanelVisible.value = true
})
```

取消注釋這行，重整頁面，確認面板出現且 3 個步驟可正常切換，然後**移除**這行。

- [ ] **Step 3: Commit**

```bash
git add src/components/AiViewer/AiViewerRightBox.vue
git commit -m "feat: add conv1 translation setup panel HTML template"
```

---

## Task 4: AiViewerRecord.vue — 新增 `confirmed: false` 分支渲染

**Files:**
- Modify: `src/components/AiViewer/AiViewerRecord.vue:21-48`

---

- [ ] **Step 1: 在 `AiViewerRecord.vue` 中，將 `translationConfirm` 的條件加上 `confirmed` 判斷**

找到第 21 行：
```html
      <div class="translation-confirm-card" v-else-if="props.source.cardType === 'translationConfirm'">
```

改為：
```html
      <div class="translation-confirm-card" v-else-if="props.source.cardType === 'translationConfirm' && props.source.confirmed">
```

- [ ] **Step 2: 在原 `</div>` (第 48 行，translation-confirm-card 的結尾) 後面，加入 `confirmed: false` 的分支**

找到第 48 行的 `</div>` (translation-confirm-card 結束)，緊接其後插入：

```html
      <!-- 翻譯設定尚未確認（等待使用者操作面板） -->
      <div class="tc-pending-card" v-else-if="props.source.cardType === 'translationConfirm' && !props.source.confirmed">
        <div class="tc-pending-icon">📄</div>
        <div class="tc-pending-text">點擊下方按鈕設定翻譯參數</div>
        <button class="tc-setup-btn" data-action="conv1-open-transl-panel">設定翻譯參數 →</button>
      </div>
```

- [ ] **Step 3: 在 dev server 確認 confirmed=false 狀態的卡片顯示**

```bash
npm run dev
```

開啟 conv1，確認：
1. 第 3 則使用者訊息顯示「設定翻譯參數 →」按鈕
2. 點擊按鈕後，面板在輸入框上方彈出
3. 3 個步驟可順利切換，「返回」和「下一步」按鈕行為正確
4. Step 2 在未選擇範圍時「下一步」按鈕 disabled
5. Step 3 在未選擇語言時「確認送出」按鈕 disabled
6. 選完送出後，面板關閉，第 3 則訊息變為已確認的 translationConfirm 卡片（顯示文件/範圍/語言）

- [ ] **Step 4: Commit**

```bash
git add src/components/AiViewer/AiViewerRecord.vue
git commit -m "feat: add unconfirmed state rendering for translationConfirm card"
```

---

## Task 5: SCSS — 新增 conv1 翻譯面板樣式

**Files:**
- Modify: `src/scss/views/_AiViewer.scss` (在 `.conv2-fp { ... }` 區塊結束後，約第 2994 行之後新增)

---

- [ ] **Step 1: 在 `_AiViewer.scss` 的 `.conv2-fp` 區塊結束後（第 2994 行），新增以下樣式**

```scss
// ── Conv1 翻譯設定步驟面板 ────────────────────────────────────────────────────
.conv1-transl-fp {
  .conv1-transl-step-track {
    display: flex;
    align-items: center;
    gap: 3px;
    flex-shrink: 0;
  }
  .conv1-transl-sd {
    width: 22px;
    height: 5px;
    border-radius: 3px;
    background: var(--color-border);
    transition: background 0.2s;
    &--done { background: var(--color-accent, #00C896); }
    &--active { background: var(--color-primary, #00A078); }
  }
  .conv1-transl-sl {
    width: 5px;
    height: 2px;
    background: var(--color-border);
  }

  // Step 1: 文件卡片
  .conv1-transl-file-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1.5px solid var(--color-border);
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
    margin-bottom: 8px;
    &:hover { border-color: var(--color-primary, #00A078); }
    &--selected {
      border-color: var(--color-primary, #00A078);
      background: var(--color-primary-subtle, #E6F7F0);
    }
  }
  .conv1-transl-file-icon { font-size: 22px; flex-shrink: 0; }
  .conv1-transl-file-info { flex: 1; min-width: 0; }
  .conv1-transl-file-name {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .conv1-transl-file-meta { font-size: 10px; color: var(--color-text-muted, #3F565E); margin-top: 1px; }
  .conv1-transl-file-check { font-size: 18px !important; color: var(--color-primary, #00A078); flex-shrink: 0; }
  .conv1-transl-upload-hint {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--color-text-muted, #3F565E);
    padding: 6px 2px 0;
    cursor: default;
    opacity: 0.6;
  }

  // Step 2: 範圍 radio list
  .conv1-transl-range-list { display: flex; flex-direction: column; gap: 5px; }
  .conv1-transl-range-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 7px 9px;
    border-radius: 7px;
    border: 1.5px solid var(--color-border);
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
    &:hover { border-color: var(--color-primary, #00A078); }
    &--selected {
      border-color: var(--color-primary, #00A078);
      background: var(--color-primary-subtle, #E6F7F0);
    }
  }
  .conv1-transl-radio {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid var(--color-border-strong, #C5D2D5);
    flex-shrink: 0;
    margin-top: 1px;
    transition: all 0.15s;
    position: relative;
    &--sel {
      border-color: var(--color-primary, #00A078);
      background: var(--color-primary, #00A078);
      &::after {
        content: '';
        position: absolute;
        inset: 3px;
        border-radius: 50%;
        background: #fff;
      }
    }
  }
  .conv1-transl-range-title { font-size: 11px; font-weight: 600; color: var(--color-text); }
  .conv1-transl-range-sub { font-size: 10px; color: var(--color-text-muted, #3F565E); margin-top: 1px; }

  // Step 3: 語言 chip grid
  .conv1-transl-lang-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  .conv1-transl-lang-chip {
    padding: 8px 10px;
    border-radius: 8px;
    border: 1.5px solid var(--color-border);
    cursor: pointer;
    text-align: center;
    transition: border-color 0.15s, background 0.15s;
    &:hover { border-color: var(--color-primary, #00A078); }
    &--selected {
      border-color: var(--color-primary, #00A078);
      background: var(--color-primary-subtle, #E6F7F0);
    }
  }
  .conv1-transl-lang-flag { font-size: 18px; margin-bottom: 3px; }
  .conv1-transl-lang-name { font-size: 11px; font-weight: 700; color: var(--color-text); }
  .conv1-transl-lang-sub { font-size: 9px; color: var(--color-text-muted, #3F565E); }

  // 面板底部按鈕列
  .conv1-transl-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-top: 0.5px solid var(--color-border);

    button {
      width: auto !important;
      height: auto !important;
      display: inline-flex !important;
      border-radius: 6px !important;
    }
  }
}

// ── translationConfirm 未確認狀態卡片 ─────────────────────────────────────────
.tc-pending-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  border-radius: 10px;
  background: var(--color-bg-subtle, #F8FAFB);
  border: 1px solid var(--color-border);
}
.tc-pending-icon { font-size: 20px; }
.tc-pending-text { font-size: 12px; color: var(--color-text-muted, #3F565E); }
.tc-setup-btn {
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  background: var(--color-primary, #00A078);
  color: #fff;
  border: none;
  cursor: pointer;
  &:hover { background: var(--color-primary-hover, #007F5F); }
}
```

- [ ] **Step 2: 確認樣式正確渲染**

```bash
npm run dev
```

確認：
1. 步驟面板的進度條 3 個 dot 顯示正確（active 深綠、done 亮綠、空白灰）
2. Step 1 文件卡片選中狀態有綠色邊框
3. Step 2 range radio 選中後有綠色邊框和 radio dot
4. Step 3 語言 chip 選中有綠色邊框
5. `tc-pending-card` 的「設定翻譯參數 →」按鈕顯示正確顏色

- [ ] **Step 3: Commit**

```bash
git add src/scss/views/_AiViewer.scss
git commit -m "style: add conv1 translation setup panel and tc-pending-card SCSS"
```
