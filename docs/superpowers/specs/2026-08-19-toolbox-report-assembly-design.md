# 工具箱與報告組裝 Block 設計 spec

**日期：** 2026-08-19
**功能：** AiViewer 對話輸入區新增「工具箱」入口；工具箱第一個工具「行銷報告生成」提供可拖曳組裝的報告章節 Block

---

## 1. 背景與目標

使用者希望在 AiViewer 對話輸入區旁提供一個「工具箱」入口（與附加檔案、引用知識庫等按鈕並列），點擊後可選擇不同 AI 生成能力。這輪先實作第一個工具「行銷報告生成」：使用者透過對話跟 AI 討論報告方向，AI 提出章節結構，使用者可在畫布上以拖曳排序、積木盒加入/移除的方式進一步調整，最後可存成模板供之後重複使用。

參考原型：使用者提供的 artifact（報告組裝畫布互動草圖）——中央清單（畫布內文字為「畫布」，但實際是可拖曳排序清單）+ 底部積木盒（依分類分組、可展開）+ 右側對話輔助排版。

## 2. 範圍

### 2.1 這輪要做

1. AiViewer 對話輸入區新增「工具箱」按鈕與彈出選單
2. 選單第一項「行銷報告生成」可點擊，其餘（圖像生成、創作音樂、Deep Search）以「即將推出」灰化呈現，僅佔位不可點
3. 點擊「行銷報告生成」啟動一段沿用既有 conv 劇本模式的引導對話（比照 artifact 腳本：詢問方向 → 確認範圍 → 生成初版結構）
4. 對話結束後，在畫布上建立一個新的 blockType `'REPORT'`（報告組裝 Block），內容為 AI 建議的章節清單
5. 報告組裝 Block 內可直接拖曳排序、點 × 移除、從積木盒（依分類分組、可展開/收合）加入新章節
6. 「存成模板」按鈕：本輪僅做前端狀態切換＋ toast 提示，不接真實後端持久化
7. 章節目錄（積木盒內容）本輪使用假資料，比照專案目前「切版」階段慣例

### 2.2 這輪不做（明確排除）

- **旅程儀表板**：不在工具箱選單放入任何入口（含灰化佔位），設計留給下一輪。現況備忘：`/view/journeys`（`JourneyDashboard.vue`）已存在，但資料模型與情境綁死在「Hurricane Trailsetter AW26 行銷自動化旅程」demo 上（見 3.4），不是通用的排程任務總覽。下一輪需要決定「延伸這個既有頁面」還是「另起新的」。
- **不修改既有 conv1～conv6 劇本邏輯**：`addReportBlock()`、`cannedTaskItems` 及各 convN 腳本維持原樣，新工具是平行的新機制，不共用 `cannedTaskItems` 陣列（原因見 3.2）。
- **不做真實 AI 串接**：引導對話內容為腳本（比照現有 convN 模式），不呼叫真實 LLM。
- **不做章節目錄後端 API**：積木盒資料為前端假資料，不建立 `reportSectionApi.ts` 之類的服務層（等真正串接時再補）。
- **不做模板真正儲存/排程重跑**：「存成模板」只是 UI 狀態展示。

## 3. 現況相關機制（既有程式碼調查結果）

### 3.1 輸入區按鈕與彈出選單模式

`src/components/AiViewer/AiViewerRightBox.vue` 的 `.input-group-box` 內已有三個按鈕（快速任務 `bolt`、附加檔案 `add`、引用知識庫 `menu_book`），皆為 `<button class="custom-btn">` + `<i class="material-symbols-outlined">`，用 `v-tooltip` 顯示提示文字。彈出選單沿用共用樣式 `next-option-box`（定義於 `src/scss/views/_AiViewer.scss`），搭配 `ref` + `isOpenXXX` 布林 + `initClickOutsideListener()`（`src/utils/utils.ts`）做點擊外部關閉。工具箱直接複製此模式即可，不需要新的互動機制。

### 3.2 cannedTask + convN 劇本模式

`cannedTaskItems` 是「當前對話」綁定的假資料（例如 conv4 對應 `{ id: 'salesReport', text: '整理上月產品銷售報告' }`），`sendCannedTask()` 依 `currentConversationId` 分流啟動對應的 convN 腳本（`conv4InitFlow()` 等），腳本跑完呼叫 `addReportBlock(fileUrl, fileName)`（`AiViewerStore.ts`）在畫布放一個 `blockType: 'HTML'` 的靜態報告區塊（iframe 載入寫死的 HTML 檔案）。

**這套機制不適合工具箱**：`cannedTaskItems` 是綁在單一對話情境上的假資料，工具箱要的是「跨對話、跨情境都能用的通用工具清單」，語意不同，硬塞進去會讓 `cannedTaskItems` 的角色混亂。因此工具箱清單是獨立的新資料結構（4.1）。

新的引導對話沿用「新增一個 convN 腳本」的既有模式（比照 conv4/5/6 的寫法：腳本訊息陣列 + 進度卡動畫 + 結尾建立 Block），但**產生的 Block 是新的互動式 `'REPORT'` 類型**，不是呼叫 `addReportBlock()`。

### 3.3 blockType 與 viewBlock 渲染慣例

`AiViewerBlock.blockType` 目前為 `'PDF' | 'EXCEL' | 'PPT' | 'IMAGE' | 'CHART' | 'TXT' | 'HTML' | 'MD' | 'WORD' | 'OTHER'`，各類型對應的渲染元件放在 `src/components/AiViewer/viewBlock/`，命名慣例是 `<type>ViewBox.vue`（如 `chartViewBox.vue`、`htmlFileViewBox.vue`），由 `AiViewerContentBox.vue` 依 `blockType` 分流渲染。新的報告組裝 Block 依此慣例新增 `reportAssemblyViewBox.vue`，並在 `blockType` 聯集新增 `'REPORT'`。

### 3.4 旅程功能現況（供下一輪參考，這輪不動）

- `src/stores/journeyStore.ts`：`JourneyRecord { status: 'running'|'done', nodes: JourneyNode[] }`，一次性狀態機，無排程/週期概念
- `src/views/JourneyDashboard.vue`（路由 `/view/journeys`，`hideMenuTree: true`，不在側邊選單）：列出所有 `journeys`，顯示 D0→D30 節點進度卡片，空狀態文案綁定「Hurricane Trailsetter AW26」demo
- 畫布內有對應的「旅程總覽」iframe（`public/hurricane_trailsetter_journey_dashboard.html`），透過 `postMessage` 跟 `AiViewerRightBox.vue` 的 `journeyStore` 同步狀態，`conv1` 有「修改旅程」浮層 `showJourneyModifyPill`
- **結論：現有「旅程」= 單一行銷自動化情境的節點時間軸視覺化，不是可重複排程執行的任務系統**，跟使用者要的「收納長時間、定期重跑排程任務」的儀表板是兩個不同的東西，只是撞名。下一輪要處理這個命名/範疇落差。

## 4. 架構設計

### 4.1 工具箱入口與選單

新按鈕加入 `.input-group-box` 內既有的按鈕群（`bolt`/`add`/`menu_book` 旁），圖示建議用 `construction`（可於實作時依實際視覺調整），tooltip「工具箱」。

選單資料為新的、與對話情境無關的靜態清單（元件內 `computed` 或獨立 `const`，比照 `cannedTaskItems` 目前也是元件內資料的慣例）：

```typescript
interface ToolboxItem {
  id: string
  icon: string        // Material Symbols icon 名稱
  name: string
  description: string
  enabled: boolean     // false = 灰化、不可點擊，顯示「即將推出」
}

const toolboxItems: ToolboxItem[] = [
  { id: 'reportAssembly', icon: 'bar_chart', name: '行銷報告生成', description: '拖曳組裝行銷週報章節', enabled: true },
  { id: 'imageGen',       icon: 'palette',   name: '圖像生成',     description: '即將推出', enabled: false },
  { id: 'musicGen',       icon: 'music_note',name: '創作音樂',     description: '即將推出', enabled: false },
  { id: 'deepSearch',     icon: 'search',    name: 'Deep Search', description: '即將推出', enabled: false },
]
```

選單樣式沿用 `next-option-box`，但選項內容從純文字 `option-item` 擴充為「icon + 名稱 + 一行說明」的版型（沿用同一個 CSS 命名慣例延伸，例如 `.option-item` 內部再包一層 `.option-item-icon` / `.option-item-body`），`enabled: false` 的項目加 `disabled` class（灰階、`pointer-events: none`）。

點擊 `reportAssembly` 項目：關閉選單 → 啟動 4.2 的引導對話流程。

### 4.2 報告組裝引導對話流程

新增一組腳本化對話流程（沿用 conv4/5/6 的既有寫法慣例：訊息陣列 + push 函式 + 進度卡動畫），內容比照 artifact 腳本：

```
User：我想看一下最近的促銷活動效果
AI：先確認方向——你是想知道「該不該延續」，還是「哪種促銷類型最有效」？
User：（選擇/輸入）
AI：了解，那我們針對...做對照，可以嗎？
User：可以
AI：報告生成好了，左側畫布可以看到內容。這樣你滿意嗎？
```

**實作建議**：為避免繼續加重 `AiViewerRightBox.vue`（目前已 3200+ 行，遠超 AI_RULES 建議的單檔規模），這段新腳本邏輯獨立成一個 composable（如 `src/composables/useReportAssemblyConversation.ts`），只把觸發入口跟必要的 template 條件掛回 `AiViewerRightBox.vue`，不把新邏輯直接寫進原檔案。既有 conv1～conv6 維持原狀，不做遷移。

流程結束時，呼叫新的 store action（4.3）在畫布建立報告組裝 Block，帶入 AI 建議的初始章節清單。

### 4.3 報告組裝 Block

**資料模型**（`AiViewerBlock.data`，`blockType: 'REPORT'`）：

```typescript
interface ReportAssemblyBlockData {
  sectionIds: string[]      // 已組裝章節，依順序排列
  templateName?: string     // 存成模板後的名稱
}
```

**章節目錄**（積木盒假資料，比照 artifact 內容，先寫在新元件或新 composable 內，不建服務層）：

```typescript
interface ReportSection {
  id: string
  categoryId: string    // 對應分類（行銷活動成效／TA用戶畫像／會員留存與流失／商品深度分析）
  name: string
  description: string
}
```

**章節目錄假資料**（沿用 artifact 內容，避免實作時另外編造）：

| categoryId | 分類名稱 | 章節 id | 章節名稱 |
|---|---|---|---|
| promo | 行銷活動成效 | promo_kpi | 促銷核心 KPI |
| promo | 行銷活動成效 | promo_top10 | 前 10 大活動 |
| promo | 行銷活動成效 | promo_type | 活動類型分析 |
| promo | 行銷活動成效 | promo_monthly | 月度促銷趨勢 |
| promo | 行銷活動成效 | time_heatmap | 銷售熱門時段 |
| ta | TA 用戶畫像 | gender | 性別分布 |
| ta | TA 用戶畫像 | age | 年齡層分布 |
| ta | TA 用戶畫像 | gender_age_cross | 性別 × 年齡交叉 |
| ta | TA 用戶畫像 | city_distribution | 地理分布 |
| ta | TA 用戶畫像 | persona | 會員人物誌 |
| member | 會員留存與流失 | member_kpi | 會員留存核心 KPI |
| member | 會員留存與流失 | rfm_segments | RFM 分群 |
| product | 商品深度分析 | top_products | 熱銷商品 Top 10 |
| product | 商品深度分析 | low_sales_products | 低銷量商品清單 |

引導對話（4.2）預設建議的初始章節組合：`promo_kpi`、`promo_top10`、`promo_type`、`promo_monthly`、`time_heatmap`（對應腳本情境「上個月促銷活動效果」）。

**Store action**（`AiViewerStore.ts`，比照既有 `addReportBlock` 寫法）：

```typescript
function addReportAssemblyBlock(sectionIds: string[]) {
  // 建立新 AiViewerBlock，blockType: 'REPORT'，data: { sectionIds }
  // 走既有 checkCreatePos() 碰撞偵測邏輯決定畫布位置
}
```

**渲染元件**：`src/components/AiViewer/viewBlock/reportAssemblyViewBox.vue`，比照 artifact 畫面但拿掉右側對話面板（對話已經由 4.2 的主對話負責）：

- 已組裝章節清單：`<ol>` + `draggable`，拖曳重新排序、每項有 × 移除按鈕
- 積木盒：依 `categoryId` 分組，用 `<details>`/`<summary>` 展開收合（比照 artifact），每個章節項目有「+」加入按鈕，已加入的顯示「✓」
- 頂部「存成模板」按鈕：本輪點擊後呼叫 `popDialog.toast()` 顯示「已存成範本」，並把 `templateName` 寫入 `block.data`（僅前端狀態）

Block 本身走現有 `vue3-drag-resize` 的 Block 拖動/縮放機制（跟其他 blockType 一致），內部的章節拖曳排序是 Block **內部**的獨立互動，跟 Block 本身的拖動/縮放不衝突（比照現有做法：內部互動元件在 `@mousedown.stop` 阻止事件冒泡到 Block 外層拖動邏輯，需在實作時確認）。因為內容較豐滿（清單＋積木盒），此 blockType 建議給一個比預設稍大的初始寬高。

### 4.4 命名與慣例備忘

- `blockType: 'REPORT'` 是全新類型，跟既有 `'HTML'`（conv4/5/6 產生的靜態報告檔案）不同，UI 文案上避免直接稱它是「HTML 報告」
- Block 內部的章節排序清單，UI 文案避免使用「畫布」一詞（該詞在此專案已固定指 AiViewer 的 Konva Stage），可用「章節清單」或「組裝清單」
- 「旅程」一詞已被既有功能佔用（3.4），這輪不會用到，但下一輪命名新的排程儀表板時要避開直接沿用「旅程」而不說明差異

## 5. 資料流

```
使用者點「工具箱」→ 開啟選單（純前端 state）
  → 點「行銷報告生成」→ 啟動引導對話（composable 內腳本，模擬 AI 回覆）
    → 對話結束 → aiviewerStore.addReportAssemblyBlock(sectionIds)
      → 畫布新增 blockType:'REPORT' 的 AiViewerBlock
        → reportAssemblyViewBox.vue 渲染章節清單 + 積木盒
          → 使用者拖曳/加入/移除 → 直接修改 block.data.sectionIds（本地狀態，即時反映）
          → 點「存成模板」→ block.data.templateName 寫入 + toast 提示（無後端）
```

## 6. 檔案異動清單（供後續實作計畫參考）

| 檔案 | 異動類型 | 說明 |
|---|---|---|
| `src/components/AiViewer/AiViewerRightBox.vue` | 修改 | 新增工具箱按鈕、選單 template、觸發引導對話的掛點 |
| `src/composables/useReportAssemblyConversation.ts` | 新增 | 引導對話腳本邏輯，獨立於主元件 |
| `src/stores/AiViewerStore.ts` | 修改 | 新增 `addReportAssemblyBlock()`，`blockType` 聯集新增 `'REPORT'` |
| `src/components/AiViewer/viewBlock/reportAssemblyViewBox.vue` | 新增 | 報告組裝 Block 渲染元件（章節清單＋積木盒） |
| `src/components/AiViewer/AiViewerContentBox.vue` | 修改 | `blockType === 'REPORT'` 分流渲染 |
| `src/scss/views/_AiViewer.scss` | 修改 | 工具箱選單、報告組裝 Block 樣式 |
| `src/types/`（視現況決定新增或沿用既有型別檔） | 新增/修改 | `ToolboxItem`、`ReportSection`、`ReportAssemblyBlockData` 型別 |

## 7. 錯誤處理

- 積木盒章節重複加入：`sectionIds` 已包含該 id 時，「+」按鈕視覺上顯示已加入（✓），點擊不重複加入（比照 artifact 邏輯）
- 章節清單為空：顯示提示文案「還沒有章節，從下方積木盒加入」（比照 artifact `empty-hint`），「存成模板」按鈕停用
- 拖曳排序邊界：拖到清單外或無效位置時還原排序（沿用 HTML5 drag and drop 的 `dragend` 清理 class 邏輯）
- 引導對話中途關閉 AiViewer 或切換專案：比照既有 convN 腳本行為（腳本狀態不持久化，重新進入需重新觸發）

## 8. 測試計畫

- **Vitest**：`addReportAssemblyBlock()` 的 store action（建立 block、碰撞偵測套用）；章節加入/移除/重排的純邏輯（若抽成 util）
- **Playwright**：新增 e2e 案例（`e2e/`）—— 開啟工具箱選單、點擊行銷報告生成、跑完引導對話腳本、確認畫布出現報告組裝 Block、拖曳排序後驗證順序、點「存成模板」驗證 toast 出現

## 9. 下一輪待辦：旅程儀表板

- 決定是延伸既有 `JourneyDashboard.vue` / `journeyStore`，還是另建通用的排程任務儀表板
- 若延伸既有頁面：需要把資料模型從「單一 Hurricane demo」泛化成「任意工具（報告生成等）都能建立的長任務記錄」
- 需要定義「排程/定期重跑」的真實機制（目前完全不存在，`JOURNEY_SCHEDULES` 只是動畫節奏參數）
- 工具箱選單屆時要不要加入「旅程儀表板」入口，以及跟 3.1 的按鈕群如何並存

## 10. 開放問題

- 工具箱按鈕的最終 icon 選擇（`construction` 為建議值，非定案）與確切放置順序（在 `bolt`/`add`/`menu_book` 之前還是之後）留給實作階段依視覺調整
- Block 內部章節拖曳排序跟 Block 外層 `vue3-drag-resize` 拖動的事件衝突處理，需在實作時實測確認 `@mousedown.stop` 是否足夠
