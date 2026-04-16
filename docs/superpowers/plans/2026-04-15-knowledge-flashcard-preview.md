# Knowledge Flashcard Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 改造「建立知識內容」Wizard 的 Step 3 預覽，依檔案類型顯示 Q&A 格狀題卡（一般檔案）或 HTML 表格（EXCEL / MD）。

**Architecture:** 在現有 `CreateKnowledgeWizardModal.vue` 中新增 `isTablePreview` computed，並把 `generatedContent` 從 `string` 改為 union type。Step 3 預覽區改用兩個新子元件（`KnowledgeFlashcardPreview` / `KnowledgeTablePreview`）做條件渲染，`buildContent()` 改為回傳對應的結構化資料。樣式加在現有的 `src/scss/views/_KnowledgeBase.scss` 內。

**Tech Stack:** Vue 3 Composition API (`<script setup lang="ts">`), TypeScript, SCSS (CSS Custom Properties)

---

## 檔案對照表

| 操作 | 路徑 |
|---|---|
| 修改 | `src/components/Knowledge/CreateKnowledgeWizardModal.vue` |
| 新增 | `src/components/Knowledge/KnowledgeFlashcardPreview.vue` |
| 新增 | `src/components/Knowledge/KnowledgeTablePreview.vue` |
| 修改 | `src/scss/views/_KnowledgeBase.scss` |

---

## Task 1：新增型別 & isTablePreview computed

**目標：** 在 `CreateKnowledgeWizardModal.vue` 的 `<script setup>` 中定義資料型別並調整 `generatedContent` ref，為後續步驟奠定型別基礎。

**Files:**
- Modify: `src/components/Knowledge/CreateKnowledgeWizardModal.vue`

- [ ] **Step 1: 在 `<script setup>` 頂部加入 union type 定義**

找到 `const knowledgeStore = useKnowledgeStore()` 這行，在它**之前**插入以下型別：

```ts
// ── 知識預覽資料型別 ──
interface FlashcardItem {
  q: string
  a: string
}

interface TableData {
  headers: string[]
  rows: string[][]
}

type GeneratedContent = FlashcardItem[] | TableData | null
```

- [ ] **Step 2: 新增 `TABLE_TYPES` 常數與 `isTablePreview` computed**

找到 `const selectedTemplateLabel = computed(` 這行，在它**之前**插入：

```ts
const TABLE_TYPES = ['EXCEL', 'MD']

const isTablePreview = computed(() =>
  TABLE_TYPES.includes(props.file?.fileType?.toUpperCase() ?? '')
)
```

- [ ] **Step 3: 更新 `generatedContent` 的型別**

找到：
```ts
const generatedContent = ref('');
```
改為：
```ts
const generatedContent = ref<GeneratedContent>(null)
```

- [ ] **Step 4: 確認 TypeScript 編譯無錯**

```bash
npm run type-check
```
預期輸出：無錯誤（目前 `buildContent` 仍回傳 `string`，會有型別不符錯誤，在 Task 4 修正）。此步驟先確認 interface 本身語法正確即可。

- [ ] **Step 5: Commit**

```bash
git add src/components/Knowledge/CreateKnowledgeWizardModal.vue
git commit -m "feat(knowledge): add FlashcardItem/TableData types and isTablePreview computed"
```

---

## Task 2：建立 `KnowledgeFlashcardPreview.vue`

**目標：** 新增子元件，接收 `FlashcardItem[]`，以 2 欄格狀顯示 Q&A 題卡。

**Files:**
- Create: `src/components/Knowledge/KnowledgeFlashcardPreview.vue`

- [ ] **Step 1: 建立元件檔案**

建立 `src/components/Knowledge/KnowledgeFlashcardPreview.vue`，內容如下：

```vue
<template>
  <div class="KnowledgeFlashcardPreview">
    <div class="flashcard-count">共 {{ cards.length }} 張題卡</div>
    <div class="flashcard-grid">
      <div class="flashcard" v-for="(card, i) in cards" :key="i">
        <div class="flashcard-q-row">
          <div class="flashcard-q-badge">Q</div>
          <div class="flashcard-q-text">{{ card.q }}</div>
        </div>
        <div class="flashcard-sep"></div>
        <div class="flashcard-a-row">
          <div class="flashcard-a-badge">A</div>
          <div class="flashcard-a-text">{{ card.a }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface FlashcardItem {
  q: string
  a: string
}

defineProps<{ cards: FlashcardItem[] }>()
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Knowledge/KnowledgeFlashcardPreview.vue
git commit -m "feat(knowledge): add KnowledgeFlashcardPreview component"
```

---

## Task 3：建立 `KnowledgeTablePreview.vue`

**目標：** 新增子元件，接收 `TableData`，以 `<table>` 顯示，沿用現有 `.custom-table` 樣式。

**Files:**
- Create: `src/components/Knowledge/KnowledgeTablePreview.vue`

- [ ] **Step 1: 建立元件檔案**

建立 `src/components/Knowledge/KnowledgeTablePreview.vue`，內容如下：

```vue
<template>
  <div class="KnowledgeTablePreview">
    <table class="custom-table">
      <thead>
        <tr>
          <th v-for="header in data.headers" :key="header">{{ header }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, ri) in data.rows" :key="ri">
          <td v-for="(cell, ci) in row" :key="ci">{{ cell }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
interface TableData {
  headers: string[]
  rows: string[][]
}

defineProps<{ data: TableData }>()
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Knowledge/KnowledgeTablePreview.vue
git commit -m "feat(knowledge): add KnowledgeTablePreview component"
```

---

## Task 4：加入 SCSS 樣式

**目標：** 在 `_KnowledgeBase.scss` 的 `.CreateKnowledgeWizardModal` 區塊末尾，加入題卡與表格預覽的樣式。

**Files:**
- Modify: `src/scss/views/_KnowledgeBase.scss`

- [ ] **Step 1: 找到 `.wizard-footer-actions` 前的插入點**

在 `_KnowledgeBase.scss` 內找到：
```scss
  // ── Footer Actions ──
  .wizard-footer-actions {
```
在這行**之前**插入以下樣式區塊（注意縮排，此段位於 `.CreateKnowledgeWizardModal { ... }` 內）：

```scss
  // ── Flashcard Preview ──
  .KnowledgeFlashcardPreview {
    .flashcard-count {
      font-size: 12px;
      color: var(--color-text-alpha40);
      margin-bottom: 10px;
    }

    .flashcard-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      max-height: 300px;
      overflow-y: auto;
      @include use-scroll-bar(rgba(0, 0, 0, 0.1));
    }

    .flashcard {
      background: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: border-color 0.15s, box-shadow 0.15s;

      &:hover {
        border-color: var(--color-main-alpha40);
        box-shadow: 0 2px 10px var(--color-main-alpha10);
      }
    }

    .flashcard-q-row,
    .flashcard-a-row {
      display: flex;
      align-items: flex-start;
      gap: 7px;
    }

    .flashcard-q-badge {
      flex-shrink: 0;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--color-main);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 1px;
    }

    .flashcard-a-badge {
      flex-shrink: 0;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 1.5px solid var(--color-main);
      color: var(--color-main);
      font-size: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 1px;
      background: var(--color-background);
    }

    .flashcard-q-text {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text);
      line-height: 1.5;
    }

    .flashcard-sep {
      height: 1px;
      background: var(--color-border);
    }

    .flashcard-a-text {
      font-size: 11.5px;
      color: var(--color-text-alpha70);
      line-height: 1.55;
    }
  }

  // ── Table Preview ──
  .KnowledgeTablePreview {
    max-height: 300px;
    overflow-y: auto;
    @include use-scroll-bar(rgba(0, 0, 0, 0.1));
  }

```

- [ ] **Step 2: Lint 確認**

```bash
npm run lint
```
預期輸出：無錯誤。

- [ ] **Step 3: Commit**

```bash
git add src/scss/views/_KnowledgeBase.scss
git commit -m "feat(knowledge): add flashcard and table preview SCSS styles"
```

---

## Task 5：改寫 `buildContent()` 回傳結構化資料

**目標：** 將 `buildContent()` 拆成 `buildFlashcardContent()` 和 `buildTableContent()`，各自回傳正確型別，舊的 string mock 全部移除。

**Files:**
- Modify: `src/components/Knowledge/CreateKnowledgeWizardModal.vue`

- [ ] **Step 1: 找到並刪除現有的 `buildContent()` 函式**

在 `CreateKnowledgeWizardModal.vue` 中找到 `function buildContent(` 開頭到對應的最後一個 `}` 為止，將整個函式（包含全部 case）刪除並替換為以下三個函式：

```ts
function buildFlashcardContent(template: string, _name: string): FlashcardItem[] {
  switch (template) {
    case 'PRODUCT':
      return [
        { q: '此商品的適用對象為何？', a: '適用於零售業門市人員與電商營運人員，用於日常銷售管理與庫存查核。' },
        { q: '商品定價調整的授權層級為何？', a: '門市主管可調整 ±5%，超過 5% 需區域督導核准，超過 15% 需總部審批。' },
        { q: '庫存低於安全水位時應如何處理？', a: '庫存低於安全水位（< 50 件）時，系統自動發送補貨通知，需於 3 個工作天內完成採購請購單。' },
        { q: '促銷活動的設定流程為何？', a: '由行銷部門建立活動方案 → 主管審核 → ERP 系統設定折扣 → 通知各通路門市執行。' },
        { q: '退貨商品應如何進行庫存調整？', a: '退貨完成後，系統自動回補庫存數量，若商品損壞需另建調撥單移轉至報廢倉。' },
      ]

    case 'SOP':
      return [
        { q: '開店前盤點作業的標準步驟為何？', a: '①收銀機初始化 ②商品陳列確認 ③庫存抽查（至少 5 項）④填寫開店檢查表 ⑤回報完成。' },
        { q: '顧客退換貨的標準流程為何？', a: '確認購買憑證 → 商品狀態檢查 → 填寫退換貨單 → 退款（原路返還）或換貨處理 → 庫存更新。' },
        { q: '每日結帳作業應在何時完成？', a: '須於閉店後 30 分鐘內完成日報表核對，並上傳至系統，異常金額需附說明。' },
        { q: '遇到系統故障時應如何處理？', a: '立即通知 IT 部門（分機 119），啟用備用紙本流程，記錄所有交易並在系統恢復後補登。' },
        { q: '消費者投訴的處理時效要求為何？', a: '當場受理 → 24 小時內初步回覆 → 72 小時內提供最終處理結果，嚴重投訴需主管親自簽核。' },
        { q: '新進員工獨立上崗前需完成哪些訓練？', a: '三天職前教育訓練 + POS 系統操作認證 + 消防安全演練，全部通過後主管簽核始可獨立作業。' },
      ]

    case 'GUIDE':
      return [
        { q: '如何進入此功能模組？', a: '登入系統後，從頂部主選單選擇對應功能，或使用側邊欄快捷入口進入。' },
        { q: '查詢資料時如何設定篩選條件？', a: '在篩選列依序設定「日期區間」→「資料類別」→「人員或部門範圍」，點擊「套用」即可。' },
        { q: '匯出報表支援哪些格式？', a: '支援 Excel（.xlsx）、CSV、PDF 三種格式，在結果頁右上角點選「匯出」後選擇格式下載。' },
        { q: '操作時出現「權限不足」提示應如何處理？', a: '聯繫系統管理員確認角色設定，或請主管在後台為您授予對應功能的存取權限。' },
        { q: '資料送出後可以修改嗎？', a: '送出後 2 小時內可由本人撤回修改，超過時限需由主管在審核介面退回後重新填送。' },
      ]

    case 'RULE':
      return [
        { q: '本規則的適用對象為何？', a: '適用於所有涉及相關業務的正職、約聘及外包人員，自入職日起生效。' },
        { q: '標準作業的完成時效要求為何？', a: '常規流程須在規定時間內完成，逾期需填寫延遲說明並取得主管書面核准。' },
        { q: '遇到無法遵循標準程序的特殊情況如何處理？', a: '說明原因並取得主管書面授權 → 記錄例外情況與實際處理過程 → 事後補充完整文件並歸檔。' },
        { q: '違反本規則的處理方式為何？', a: '輕微違規予以書面警告並要求改善，情節重大者依公司人事規定處理，必要時依法追究責任。' },
      ]

    default:
      return []
  }
}

function buildTableContent(template: string, name: string): TableData {
  switch (template) {
    case 'PRODUCT':
      return {
        headers: ['商品名稱', '商品編號', '規格', '售價', '庫存量'],
        rows: [
          [name + ' A', 'SKU-001', '標準款', 'NT$1,200', '350'],
          [name + ' B', 'SKU-002', '進階款', 'NT$2,500', '120'],
          [name + ' C', 'SKU-003', '旗艦款', 'NT$4,800', '45'],
        ],
      }
    case 'SOP':
      return {
        headers: ['步驟', '作業項目', '負責人', '完成時限', '備註'],
        rows: [
          ['1', '開店前盤點', '門市人員', '開店前 30 分鐘', '填寫開店檢查表'],
          ['2', '收銀機初始化', '門市人員', '開店前 15 分鐘', '確認零用金金額'],
          ['3', '日報表上傳', '門市主管', '閉店後 30 分鐘', '異常需附說明'],
        ],
      }
    case 'GUIDE':
      return {
        headers: ['功能名稱', '操作路徑', '所需權限', '備註'],
        rows: [
          ['資料查詢', '主選單 → 查詢', '一般使用者', '可匯出 Excel / CSV / PDF'],
          ['資料送審', '查詢結果 → 送審', '一般使用者', '2 小時內可撤回'],
          ['審核作業', '主選單 → 審核', '主管以上', '可退回或核准'],
        ],
      }
    case 'RULE':
      return {
        headers: ['規則項目', '適用對象', '標準', '違規處理'],
        rows: [
          ['完成時效', '全體人員', '依各作業規定', '逾期需主管核准說明'],
          ['資料記錄', '全體人員', '完整留存紀錄', '缺漏者書面警告'],
          ['例外申請', '全體人員', '書面授權', '事後歸檔存查'],
        ],
      }
    default:
      return { headers: ['項目', '說明'], rows: [['（無資料）', '']] }
  }
}

function buildContent(template: string, _fileName: string): GeneratedContent {
  const fileType = props.file?.fileType?.toUpperCase() ?? ''
  const name = _fileName.replace(/\.[^.]+$/, '')
  if (TABLE_TYPES.includes(fileType)) {
    return buildTableContent(template, name)
  }
  return buildFlashcardContent(template, name)
}
```

- [ ] **Step 2: 在 `buildContent()` 下方加入 `contentToString()` helper**

`handleConfirm` 需要把結構化資料轉成字串傳給 `knowledgeStore.createFromFile()`（型別為 `string`）。加入以下函式：

```ts
function contentToString(content: GeneratedContent): string {
  if (!content) return ''
  if (Array.isArray(content)) {
    // FlashcardItem[]
    return (content as FlashcardItem[])
      .map((card, i) => `Q${i + 1}. ${card.q}\nA${i + 1}. ${card.a}`)
      .join('\n\n')
  }
  // TableData
  const tableData = content as TableData
  const header = tableData.headers.join(' | ')
  const sep = tableData.headers.map(() => '---').join(' | ')
  const rows = tableData.rows.map(row => row.join(' | ')).join('\n')
  return `| ${header} |\n| ${sep} |\n${tableData.rows.map(row => `| ${row.join(' | ')} |`).join('\n')}`
}
```

同時更新 `handleConfirm()`，找到：
```ts
function handleConfirm() {
  emit('confirm', {
    template: selectedTemplateLabel.value,
    content: generatedContent.value,
  });
```
改為：
```ts
function handleConfirm() {
  emit('confirm', {
    template: selectedTemplateLabel.value,
    content: contentToString(generatedContent.value),
  });
```

- [ ] **Step 3: 確認 TypeScript 型別**

```bash
npm run type-check
```
預期輸出：無型別錯誤。

- [ ] **Step 4: Commit**

```bash
git add src/components/Knowledge/CreateKnowledgeWizardModal.vue
git commit -m "feat(knowledge): rewrite buildContent to return structured FlashcardItem[] or TableData"
```

---

## Task 6：更新 Step 3 Template 渲染

**目標：** 在 `CreateKnowledgeWizardModal.vue` 的 template 中，將 Step 3 的舊式 `<pre>` 預覽替換成 `KnowledgeFlashcardPreview` / `KnowledgeTablePreview` 條件渲染，並加入 import。

**Files:**
- Modify: `src/components/Knowledge/CreateKnowledgeWizardModal.vue`

- [ ] **Step 1: 在 `<script setup>` 加入 import**

找到現有的 import 區塊末尾（如 `import compModal from ...`），在之後加入：

```ts
import KnowledgeFlashcardPreview from '@/components/Knowledge/KnowledgeFlashcardPreview.vue'
import KnowledgeTablePreview from '@/components/Knowledge/KnowledgeTablePreview.vue'
```

- [ ] **Step 2: 替換 Step 3 生成完成後的預覽區塊**

在 template 中找到：
```html
        <!-- 生成完成 -->
        <div v-else class="ai-preview-container">
          <div class="ai-preview-header">
            <div class="header-left">
              <i class="material-symbols-outlined title-icon">auto_awesome</i>
              <span class="header-title">AI 初稿預覽</span>
              <span class="template-badge">{{ selectedTemplateLabel }}</span>
            </div>
            <span class="header-hint">進入編輯器後可進行細部修改</span>
          </div>
          <div class="ai-preview-body">
            <div class="preview-title">{{ previewTitle }}</div>
            <div class="preview-scroll-area">
              <pre class="preview-text">{{ generatedContent }}</pre>
            </div>
          </div>
        </div>
```

替換為：
```html
        <!-- 生成完成 -->
        <div v-else class="ai-preview-container">
          <div class="ai-preview-header">
            <div class="header-left">
              <i class="material-symbols-outlined title-icon">auto_awesome</i>
              <span class="header-title">AI 初稿預覽</span>
              <span class="template-badge">{{ selectedTemplateLabel }}</span>
            </div>
            <span class="header-hint">進入編輯器後可進行細部修改</span>
          </div>
          <div class="ai-preview-body" v-if="generatedContent">
            <KnowledgeTablePreview
              v-if="isTablePreview"
              :data="(generatedContent as any)"
            />
            <KnowledgeFlashcardPreview
              v-else
              :cards="(generatedContent as any)"
            />
          </div>
        </div>
```

- [ ] **Step 3: 確認 TypeScript 與 Lint**

```bash
npm run type-check && npm run lint
```
預期輸出：無錯誤。

- [ ] **Step 4: 啟動 dev server 手動驗證**

```bash
npm run dev
```

驗證以下情境（使用假資料，在瀏覽器進行）：

**情境 A — 一般檔案（PDF、PPT 等）：**
1. 前往「共用檔案管理」，點擊任一非 EXCEL / MD 檔案的「更多」→「建立為知識內容」
2. Wizard 開啟 → Step 1 相似性檢查通過 → Step 2 選任一模板 → 點「確定」
3. Step 3 顯示載入動畫，完成後：
   - ✅ 出現 2 欄格狀題卡
   - ✅ 每張題卡有 Q（綠色圓形 badge）+ 分隔線 + A（outline badge）
   - ✅ hover 題卡時邊框變色、有陰影

**情境 B — 表格型檔案（EXCEL 或 MD）：**
1. 點擊 EXCEL 或 MD 檔案的「更多」→「建立為知識內容」
2. 相同步驟選模板
3. Step 3 完成後：
   - ✅ 出現 `<table>` 表格，有 thead + tbody
   - ✅ 沿用 `.custom-table` 樣式（灰色 header）

- [ ] **Step 5: Commit**

```bash
git add src/components/Knowledge/CreateKnowledgeWizardModal.vue
git commit -m "feat(knowledge): wire up flashcard/table preview in wizard step 3"
```

---

## Task 7：最終確認與清理

**目標：** 確認舊的 SCSS 樣式不殘留，功能完整。

**Files:**
- Modify: `src/scss/views/_KnowledgeBase.scss`（可能需要移除舊樣式）

- [ ] **Step 1: 確認 `.preview-title` 和 `.preview-scroll-area` 樣式已無作用**

在 `_KnowledgeBase.scss` 中搜尋 `.preview-title` 和 `.preview-scroll-area`，確認這些 class 已不再被 template 使用。若確認無其他地方使用，將對應 SCSS 區塊刪除：

```scss
      // 以下兩段可刪除（template 已移除對應 class）
      .preview-title { ... }
      .preview-scroll-area { ... }
```

- [ ] **Step 2: 執行 build 確認無錯誤**

```bash
npm run build
```
預期輸出：`built in X.Xs`，無 error / warning。

- [ ] **Step 3: Commit**

```bash
git add src/scss/views/_KnowledgeBase.scss
git commit -m "chore(knowledge): remove obsolete preview-title and preview-scroll-area SCSS"
```
