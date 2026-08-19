# 知識內容頁改版：側邊導覽列 + 可收合 Metadata 抽屜 — 設計文件

日期：2026-08-19

## 背景

`src/views/KnowledgeDetail.vue`（476 行）是使用者點進單一知識項目查看內容的頁面，目前版面：頂部橫向 4 個分頁籤（概覽／版本歷程／分段預覽／轉換結果），只有「概覽」分頁是左右兩欄（`detail-overview-grid`，`1fr : 280px`），右側 `detail-sidebar-card` 顯示版本資訊、分類標籤、Pipeline 進度、來源附件；切到其他 3 個分頁就完全看不到這些 metadata。

這次改版是三個版型提案（分頁式常駐側欄／單頁捲動／側邊導覽列）比稿後，使用者選定「**C · 側邊導覽列**」：把橫向分頁籤改成左側窄導覽列，主內容區全寬顯示；metadata 移到右側，做成可收合的抽屜，四個導覽項目共用同一個抽屜（不綁定特定項目），預設每次進頁都展開、不記憶使用者上次的開關狀態。

## 目標

- 4 個分頁籤（概覽／版本歷程／分段預覽／轉換結果）改成左側垂直導覽列，圖示＋文字，選取狀態沿用現有 `activeTabKey` 邏輯，只換渲染方式。
- 概覽分頁的內容預覽（`content-preview`）從「跟側欄並排的左欄」變成主內容區全寬顯示。
- 現有側欄（版本資訊、分類與標籤、Pipeline、來源附件）搬到頁面層級的 metadata 抽屜，四個導覽項目切換時抽屜都維持在（不隨分頁內容重新掛載/卸載）。
- Header 新增一個「顯示/隱藏 metadata」切換按鈕，控制抽屜開關；預設展開，不做 localStorage 記憶。

## 非目標

- 不新增 Vue component、不新增 store、不接新的 API——完全是既有 `KnowledgeDetail.vue` 的 template／scss 重構，資料流（`knowledge`、`activeVer`、`tabs`、`activeTabKey` 等既有 computed/ref）不變。
- 不改 `ChunkPreviewTab.vue`／`ConversionLogTab.vue` 這兩個委派元件本身，只改它們被掛載的容器版面。
- 不改 5 個 Modal/Drawer（`CreateVersionModal`／`RestoreVersionModal`／`VersionCompareModal`／`ReviewDrawer`／`FilePreviewModal`）的行為與觸發邏輯。
- 不動 `KnowledgeBase.vue`（列表頁）或 `KnowledgeEditor.vue`（草稿編輯器）——範圍限定在 `KnowledgeDetail.vue` 這一頁。
- 響應式：沿用既有 `@media (max-width: 960px)` 斷點的精神（窄螢幕時側欄/抽屜退化成堆疊），不特別設計新的斷點策略。

## 設計

### 1. 版面骨架：`.detail-shell`（導覽列 + 主內容 + 抽屜）

`KnowledgeDetail.vue` 目前結構（第 65-252 行）：

```html
<!-- 4 Tabs -->
<div class="detail-tabs"> ... </div>

<!-- Tab 1: 概覽 -->
<div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'overview' }]">
  ...
  <div class="detail-overview-grid">
    <div class="content-preview"> ... </div>
    <div class="detail-sidebar-card"> ... </div>
  </div>
</div>

<!-- Tab 2/3/4 -->
<div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'history' }]"> ... </div>
<div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'chunks' }]"> ... </div>
<div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'conversion' }]"> ... </div>
```

改為：

```html
<div class="detail-shell">

  <!-- 左：導覽列 -->
  <div class="detail-nav-rail">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      :class="['detail-nav-item', { 'is-active': activeTabKey === tab.key }]"
      @click="activeTabKey = tab.key"
    >
      <i class="material-symbols-outlined">{{ tab.icon }}</i>
      <span>{{ tab.label }}</span>
    </button>
  </div>

  <!-- 中：主內容（4 個分頁內容原封不動搬進來，只是不再跟側欄並排） -->
  <div class="detail-main">

    <!-- Tab 1: 概覽 -->
    <div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'overview' }]">
      <div v-if="isPipelineReview" class="pipeline-review-banner">
        <i class="material-symbols-outlined">smart_toy</i>
        <span>此條目由 Pipeline 處理完成，以下為 AI 生成的知識摘要。請切換至「分段預覽」審查內容品質，確認無誤後點擊「開始審核」批准發佈。</span>
      </div>
      <div class="content-preview">
        <div class="article-meta">
          <span class="fc-grey-1 fs-14">{{ activeVer?.summary || '（無摘要）' }}</span>
        </div>
        <div class="article-body">
          <div class="markdown-body" v-html="renderedContent"></div>
        </div>
      </div>
    </div>

    <!-- Tab 2/3/4：內容不變，只是不再跟側欄搶版面 -->
    <div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'history' }]"> ...（原內容不動）... </div>
    <div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'chunks' }]"> ...（原內容不動）... </div>
    <div :class="['detail-tab-panel', { 'is-active': activeTabKey === 'conversion' }]"> ...（原內容不動）... </div>
  </div>

  <!-- 右：metadata 抽屜（4 個導覽項目共用，isMetadataOpen 控制顯示） -->
  <div v-if="isMetadataOpen" class="detail-metadata-drawer">
    <!-- 原 detail-sidebar-card 的 4 個 sidebar-section 原封不動搬過來 -->
  </div>

</div>
```

`.detail-overview-grid` 這個 class 整個拿掉（概覽內容不再需要跟側欄並排的兩欄 grid，`content-preview` 直接在 `.detail-main` 裡全寬顯示）。

### 2. Metadata 抽屜開關

`<script setup>` 新增：

```ts
const isMetadataOpen = ref(true)
```

Header 動作區（`views-page-header` 的 `header-right-box`，第 23-62 行）最前面新增一顆切換按鈕：

```html
<button class="custom-btn" @click="isMetadataOpen = !isMetadataOpen">
  <i class="material-symbols-outlined">{{ isMetadataOpen ? 'right_panel_close' : 'right_panel_open' }}</i>
  {{ isMetadataOpen ? '隱藏詳細資訊' : '顯示詳細資訊' }}
</button>
```

沒有 localStorage 或 store 持久化——每次重新進入這一頁（`props.id` 變動或整頁重新掛載）都是預設 `true`（展開），符合「不記憶」的決定。

### 3. `tabs` 陣列新增 `icon` 欄位

`src/views/KnowledgeDetail.vue` 第 376-381 行：

```ts
const tabs = [
  { key: 'overview', label: '概覽' },
  { key: 'history', label: '版本歷程' },
  { key: 'chunks', label: '分段預覽' },
  { key: 'conversion', label: '轉換結果' },
]
```

改為：

```ts
const tabs = [
  { key: 'overview', label: '概覽', icon: 'description' },
  { key: 'history', label: '版本歷程', icon: 'history' },
  { key: 'chunks', label: '分段預覽', icon: 'view_agenda' },
  { key: 'conversion', label: '轉換結果', icon: 'sync_alt' },
]
```

### 4. SCSS：新增導覽列／抽屜樣式，拿掉兩欄 grid

`src/scss/views/_KnowledgeDetail.scss` 目前的 `.detail-tabs`／`.detail-tab-btn`／`.detail-overview-grid`（第 73-117 行）整段替換成：

```scss
  // ── KnowledgeDetail 版面骨架：導覽列 + 主內容 + metadata 抽屜 ──
  .detail-shell {
    display: flex;
    align-items: flex-start;
    gap: 20px;

    @media (max-width: 960px) {
      flex-direction: column;
    }
  }

  .detail-nav-rail {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 104px;
    flex-shrink: 0;
    background: var(--sidebar-bg);
    border: 1px solid var(--divider-a50);
    border-radius: 14px;
    padding: 10px 6px;

    @media (max-width: 960px) {
      width: 100%;
      flex-direction: row;
      overflow-x: auto;
    }
  }

  .detail-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 10px 4px;
    border-radius: 10px;
    border: none;
    background: transparent;
    color: var(--text-faint);
    font-size: 11px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;

    .material-symbols-outlined { font-size: 20px; }

    &.is-active {
      background: var(--surface);
      color: var(--primary);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
      font-weight: 700;
    }

    &:hover:not(.is-active) { color: var(--text); }
  }

  .detail-main {
    flex: 1;
    min-width: 0;
  }

  .detail-metadata-drawer {
    width: 280px;
    flex-shrink: 0;
    background: var(--page-bg);
    border: 1px solid var(--divider-a50);
    border-radius: 16px;
    overflow: hidden;

    @media (max-width: 960px) {
      width: 100%;
    }
  }
```

`.detail-sidebar-card` 這個 class 名稱直接改成上面的 `.detail-metadata-drawer`（同一份 CSS 內容，只是改名反映它現在是頁面層級的抽屜，不是分頁內的側欄）；`.sidebar-section`／`.sidebar-section-title`／`.sidebar-divider`／`.sidebar-row`／`.sidebar-label`／`.sidebar-file-item`（第 129-175 行）全部保留不動，因為 template 裡的內容原封不動搬過去，用的還是同一批 class。

`.detail-tab-panel`（第 102-105 行，`display:none` / `&.is-active { display:block }`）維持不變，只是現在的容器變成 `.detail-main` 底下而不是跟 `.detail-overview-grid` 平行。

## 資料流

```
KnowledgeDetail.vue
  activeTabKey: 'overview' | 'history' | 'chunks' | 'conversion'（不變，只換渲染方式：橫向分頁籤 → 左側導覽列）
  isMetadataOpen: boolean（新增，預設 true，不持久化）

  .detail-nav-rail   → 點擊任一項目 → activeTabKey 改變 → .detail-main 內對應 .detail-tab-panel 顯示
  .detail-metadata-drawer → 由 isMetadataOpen 控制顯示/隱藏，內容不隨 activeTabKey 改變
```

## 測試計畫

專案已經有一套 view-level component test 慣例（`src/views/__tests__/*.layout.test.ts`／`*.tokens.test.ts`，例如 `CompanyTeamSettings.layout.test.ts`、`SkillEditor.step2Layout.test.ts`），`KnowledgeDetail.vue` 本身也已經有 `KnowledgeDetail.tokens.test.ts`。這次改版要：

1. **修正既有測試**：`KnowledgeDetail.tokens.test.ts` 第 61 行用 `wrapper.findAll('.detail-tab-btn')` 找「版本歷程」分頁按鈕——這個 class 名稱在這次改版後不存在了（改成 `.detail-nav-item`），需要同步更新選擇器，測試邏輯本身不變。
2. **新增 `KnowledgeDetail.layout.test.ts`**，比照現有 `*.layout.test.ts` 的 mount 慣例（`stubs` 清單參考 `KnowledgeDetail.tokens.test.ts` 現成的那一份），涵蓋：
   - 導覽列渲染出 4 個 `.detail-nav-item`，文字依序是「概覽／版本歷程／分段預覽／轉換結果」。
   - 點擊「版本歷程」導覽項目後，`activeTabKey` 對應的 `.detail-tab-panel.is-active` 內容正確切換（用既有的 `.version-timeline` 是否可見來斷言）。
   - 預設 `isMetadataOpen` 為 `true`，`.detail-metadata-drawer` 存在；點擊 metadata 切換按鈕後 `.detail-metadata-drawer` 消失，再點一次恢復。
   - 切換到「版本歷程」導覽項目時，`.detail-metadata-drawer` 仍然存在（驗證抽屜不隨分頁切換而卸載）。

手動驗證（`npm run dev`，因為型別檢查/單元測試不會告訴你排版好不好看）：
1. 進入任一知識項目詳情頁，確認左側是垂直導覽列（4 個圖示＋文字），右側是 metadata 抽屜，中間主內容全寬。
2. 點導覽列切到「版本歷程」／「分段預覽」／「轉換結果」，確認右側抽屜內容（版本號、狀態、標籤、Pipeline、來源附件）持續顯示、不會消失或被卸載。
3. 點 header 的「隱藏詳細資訊」按鈕，確認抽屜收起、主內容區變寬；再點一次「顯示詳細資訊」恢復。
4. 重新整理頁面（或重新導覽進來），確認抽屜預設是展開的，不會記住剛剛收起的狀態。
5. 窄視窗（<960px）下確認導覽列/抽屜合理堆疊，沒有版面破版。

## 風險與邊界情況

- `isMetadataOpen` 是單純的頁面內 `ref`，沒有做 `props.id` 變動時的特別 reset 邏輯——因為 Vue Router 切換到不同 `:id` 時如果元件被重新建立（非同一個 component instance 複用），`ref` 本來就會回到初始值 `true`，天生符合「不記憶」的需求；如果路由設定成同一個元件實例被複用（`KnowledgeDetail.vue` 目前沒有 `key` 綁 `props.id`，需要在實作時確認一下路由是否會重用實例——若會重用，`isMetadataOpen` 也不會因為換了不同知識項目而重置，這點在實作 Task 裡要留意並视情况決定是否需要在 `watch(() => props.id, ...)` 裡重設）。
- `.detail-tab-panel` 的顯示邏輯（`display:none`／`is-active`）不變，代表 4 個分頁的 DOM 在資料載入後都同時存在（沿用現有行為），效能特性跟改版前一致，不會因為這次重構而變差或變好。
- Metadata 抽屜搬到頁面層級後，`.sidebar-section` 裡原本只跟「概覽」語意相關的內容（例如 Pipeline 進度）現在在任何分頁都看得到——這是設計決定（使用者已確認要跨分頁常駐），不是疏漏。
