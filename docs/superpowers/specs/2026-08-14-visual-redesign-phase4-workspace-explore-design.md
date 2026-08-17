# 全站視覺重新設計 — Phase 4：Explore 版型調整 + JourneyDashboard 套上設計系統

**日期：** 2026-08-14
**範圍：** Explore（使用熱度榜版型調整 + 活潑感套用）、JourneyDashboard（整頁從 inline hex 重建到 token 系統）
**不含：** AiViewer、GUI.vue（見第 5 節非目標）
**前置文件：**
- `2026-08-11-visual-redesign-phase0-design-system.md`（Phase 0，色彩/字級/間距/陰影 token，含 `--success`/`--tag-blue-*` 等既有語意色）
- `2026-08-13-visual-redesign-phase2-skill-group-design.md`（Phase 2，活潑感互動系統 `.lively-stagger`/`.lively-card`）

---

## 1. 背景與目標

「工作區與探索」是最後兩組未處理的 view 之一（另一組「知識庫」尚未排入順序）。這組原本包含 4 個 view（AiViewer、GUI、Explore、JourneyDashboard），但彼此複雜度落差極大：

- **AiViewer**（1848 行 + 4214 行 SCSS，全站最大）是 Konva.js 做的無限畫布工具，跟一般頁面的「版型/配色重新設計」思路完全不同，需要獨立一個 phase 處理（Phase 5），這裡不動它。
- **GUI.vue** 是開發者用的元件樣式展示頁，不是使用者會看到的產品頁面，這次排除在視覺重新設計範圍外。裡面原本有一組寫死的 JWT bearer token、且頁面載入時會無條件觸發兩次真實 API 呼叫——這兩個資安/衛生問題已經在本次視覺工作之外單獨修掉並 commit（`security: remove hardcoded JWT token and unconditional API calls from GUI.vue`），不算在這份 spec 的範圍內。

Phase 4 因此只處理剩下兩個真正的產品頁面：

- **Explore**：四個 view 裡狀態最好的，已經是正常的搜尋/hero banner/排行榜/推薦網格版型，token 使用乾淨。這次要做版型調整（排行榜分層）+ 套用 Phase 2 的活潑感系統，不是從頭重做。
- **JourneyDashboard**：目前完全沒有接上設計系統——整頁用 inline `:style`/computed style-object 寫死 hex 色，連 SCSS 檔案都不存在，深色調固定不跟著 app 的 light/dark 主題切換。這次要整頁重建成 class + SCSS + token。

---

## 2. Explore

### 2.1 使用熱度榜 → 頒獎台版型

現況：`使用熱度榜` 跟 `大家都在用` 兩個區塊共用同一個 `.agent-grid.agent-grid--4` 四欄網格 + 共用的 `.agent-card` 樣式，只有 `.rank-badge`（熱度榜用，`:nth-child(1/2/3/n+4)` 已經有不同底色區分名次）跟 `.agent-badge`（大家都在用，new/hot/高滿意度標籤）不同。

**改動只限熱度榜區塊**，`.agent-card`/`.agent-grid--4` 這兩個共用 class 本身不修改（大家都在用區塊要維持完全不受影響）：

- 熱度榜的樣板結構改成獨立的頒獎台佈局（不再套用 `.agent-grid--4`）：
  - 第 1 名置中、抬高（`margin-bottom` 負向位移或額外 padding 做出「站得比較高」的視覺效果）、卡片邊框改用 `var(--accent)` 強調色 + 較明顯的陰影
  - 第 2、3 名分列第 1 名左右兩側，卡片略小、位置略低
  - 第 4 名移出頒獎台，改成頒獎台下方一條次要列（單行，卡片變成精簡的「排名 + icon + 名稱」橫式列，不再是完整卡片），避免頒獎台網格被迫塞出第 4 個不上不下的位置
- 名次徽章沿用現有的 `--accent`（第1）/`--accent-soft`（第2）/`--color-wise-rank-bronze-bg`（第3）配色邏輯，不新增顏色 token
- 「大家都在用」「為你推薦」兩個區塊維持完全等大網格，不套用任何分層——這兩組本來就沒有真實排名意義（都是同批次的推薦/熱門項目），刻意不比照熱度榜做視覺分層，避免編造假的重要性

### 2.2 活潑感系統套用

`.agent-card`（含熱度榜新版頒獎台卡片、大家都在用、為你推薦三處）套用 Phase 2 的 `.lively-stagger`（區塊容器）+ `.lively-card`（卡片本身）。`.agent-card` 目前已有自己的 hover transform/shadow（`transform: translateY(-4px) scale(1.02)` 等），跟 `.lively-card` 的 hover 效果數值不同但方向一致（同樣是上浮+放大+陰影加深）——採用 `.lively-card` 取代 `.agent-card` 現有的 hover 規則，避免兩者在 cascade 上打架（比照 Phase 3 教訓：同一元素的 `transform`/`transition` 不要被兩個不同來源的規則同時宣告）。

### 2.3 死程式碼/寫死色清理

`_Explore.scss` 裡多處 `rgba(14, 15, 12, 0.XX)`（一個未 token 化的近黑色，用於邊框/陰影）改用最接近的既有 token（例如 `var(--divider)`、`var(--shadow-sm)`/`var(--shadow-md)`，實作階段依實際數值比對現有 token 選最接近的，不新增 token）。

---

## 3. JourneyDashboard

### 3.1 整頁重建範圍

目前 `JourneyDashboard.vue` 沒有 `<style>` block、沒有對應的 SCSS 檔案，所有顏色都是 inline hex（`#0f1117`、`#1a1d27`、`#2a2d3a`、`#3b72f6`、`#16a34a`、`#0891b2`、`#7c3aed`、`#5c6370`、`#9ca3af` 等），且不論 app 是 light 或 dark 主題，這頁固定顯示同一套深色調。

這次重建：
- 樣板從 inline `:style`/`:style` 綁定 + `statusBadgeStyle()`/`nodeCardStyle()`/`nodeKeyColor()` 三個回傳 style 物件的函式，改成純 class + 新建的 `src/scss/views/_JourneyDashboard.scss`（並在 `src/scss/views/_index.scss` 加入 `@import "./JourneyDashboard";`）
- 顏色**不新增任何 token**，直接沿用 Phase 0 已建立的既有 token：
  - 完成（done）→ `var(--success)`
  - 執行中（running）→ `var(--tag-blue-bg)` / `var(--tag-blue-text)`
  - 尚未開始（pending）→ `var(--divider)`（邊框）+ `var(--text-faint)`（文字/圖示色，弱化顯示）
  - 頁面背景/卡片/文字 → `var(--page-bg)`/`var(--surface)`/`var(--text)`/`var(--text-muted)`
- 進度條漸層：完成狀態用 `linear-gradient(90deg, var(--success), var(--accent))`，執行中狀態用 `linear-gradient(90deg, var(--tag-blue-text), var(--primary))`（沿用現有雙色漸層的視覺語言，但改用 token 而非寫死 `#16a34a,#0891b2`/`#7c3aed,#3b72f6`）
- 跟其餘頁面一樣走 `[data-theme="dark"]` + `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }` 雙區塊模式——但由於這裡全部改用 CSS 變數，大部分顏色會直接透過既有 token 的 dark 版本自動切換，不需要另外寫 dark-mode 專屬覆寫規則（除非實作時發現特定視覺效果在 dark 模式下需要微調，例如陰影強度）

### 3.2 節點呈現：從平鋪 Chip 改成連接式步驟條

目前每個節點是獨立的方形 chip，用 `flex-wrap` 平鋪排列，彼此看不出順序關係。改為**連接式步驟條**（stepper）：

- 每個節點是一個「圓點 + key + label」的直向排列項目，項目之間用一條水平線連接
- 圓點狀態呈現：
  - 完成：實心圓點（`var(--success)` 底色），圓點內顯示 ✓
  - 執行中：空心圓點（`var(--tag-blue-text)` 邊框），圓點內顯示一個實心小點（●），維持原本「執行中」的閃爍效果（`@keyframes` 透明度或 scale 呼吸動畫，套用 `prefers-reduced-motion` 判斷後停用）
  - 尚未開始：空心圓點（`var(--divider)` 邊框），圓點內顯示流水號（第幾步）
- 連接線：目前節點與「下一個尚未開始」節點之間的線段用淺色（`var(--divider)`），已完成/執行中節點之間的線段用 `var(--success)` 實色，具體呈現「走到哪一步」的進度感
- 執行中節點下方維持顯示「執行中」小字 + 閃爍圓點（沿用原本行為，只換色成 token）；已完成節點下方維持顯示完成時間（`formatTime()` 邏輯不變）
- 節點數較多的旅程（行銷旅程 6 個節點）在窄螢幕下允許步驟條換行（`flex-wrap: wrap`），連接線邏輯只需保證同一行內相鄰節點之間的視覺連接，不必跨行畫線（跨行的視覺連接屬於次要細節，不強求）

### 3.3 其餘元素

- 標題列（「Hurricane Trailsetter · AW26」eyebrow + 「🗺️ 旅程執行紀錄」標題 + 副標 + 「← 返回 AiViewer」按鈕）改用 token 上色，文案/圖示/按鈕行為都不變
- 空狀態畫面（🗺️ icon + 「尚無旅程記錄」+ 提示文字）改用 token 上色，內容不變
- 目前行銷旅程（marketing）與生日旅程（birthday）混在同一份清單裡顯示，**不新增分類/篩選功能**——這次只處理視覺，維持現有「全部列在一起」的行為
- 套用 Phase 2 活潑感系統：`.lively-stagger` 套在旅程卡片列表容器（卡片依序淡入），旅程卡片本身不套 `.lively-card`（旅程卡片沒有 hover 互動需求，這頁是唯讀報表，不是可點擊的卡片列表——只有「返回 AiViewer」按鈕本身可以有 hover 回饋）

---

## 4. 為 Phase 5（AiViewer）預留的一致性備註

AiViewer 內嵌的「旅程執行狀態」浮動面板（`_AiViewer.scss` 裡的 `.journey-canvas-drawer`/`.jcd-*` 系列）目前跟 JourneyDashboard 共用同一組寫死的 hex 色（`#3b72f6`、`#16a34a` 等），但兩邊各自寫各自的，沒有共用樣式來源。這份 spec 不動 AiViewer，但記錄下來：**Phase 5 處理 AiViewer 時，應該把 `.jcd-*` 的節點/狀態顏色改用這次在 JourneyDashboard 訂出的同一套 token（`--success`/`--tag-blue-*`/`--divider`/`--text-faint`）**，讓兩處視覺一致。這不是本次 Phase 4 的任務，只是承接方向的備忘。

---

## 5. 非目標

- 不處理 AiViewer（獨立 Phase 5）
- 不處理 GUI.vue（排除在視覺重新設計範圍外；資安問題已在本次之外單獨修掉）
- 不新增任何 CSS token——JourneyDashboard 的顏色需求全部由 Phase 0 既有 token 滿足
- 不改變 JourneyDashboard 的資料結構、商業邏輯或 `journeyStore.ts`
- 不幫 JourneyDashboard 加旅程類型（行銷/生日）篩選功能
- 不改 Explore 的搜尋/篩選/hero banner/為你推薦邏輯，只調整熱度榜版型 + 套用活潑感系統
- 不動 `AppBreadcrumb`/側邊欄殼（JourneyDashboard、AiViewer 因為 `hideMenuTree: true` 本來就不受側邊欄殼影響；Explore 維持原本側邊欄殼不變）

---

## 6. 測試

- `JourneyDashboard.vue`：既有邏輯（`doneCount`、`formatDate`、`formatTime`）不變，需要為新的 class-based 樣板結構（例如判斷節點是否套用 `done`/`running`/`pending` 對應 class）補 `@vue/test-utils` mount 測試，確認不同狀態的節點渲染出正確的 class
- `Explore.vue`：熱度榜改版後，補測試確認前 4 名 agent 資料正確分配到頒獎台的 3 個主要位置 + 1 個次要列表位置（例如渲染出的 DOM 結構/class 正確對應名次）
- 死程式碼/寫死色清理後執行 `npm run build` 確認沒有遺漏引用
- `npm run type-check`、`npm run lint`：僅檢查沒有新增的錯誤數
- 手動視覺檢查：
  - JourneyDashboard 在 light/dark 兩種模式下都要正常（這是本次最大的行為改變——從固定深色變成跟隨主題），確認沒有意外的對比度問題
  - Explore 熱度榜頒獎台版型在桌面/窄螢幕下都要正常收合
  - `prefers-reduced-motion: reduce` 時，JourneyDashboard 執行中節點的閃爍動畫、兩頁的 `.lively-stagger` 進場動畫都要正確停用

---

## 7. 成功標準

- Explore 熱度榜呈現頒獎台版型（#1 置中抬高、#2/#3 分列兩側、#4 移至次要列），「大家都在用」「為你推薦」維持等大網格不變
- Explore 全頁套用 Phase 2 活潑感系統，寫死的 `rgba(14,15,12,...)` 改用 token
- JourneyDashboard 完全移除 inline hex，全部改用既有 token，light/dark 主題切換正常運作
- JourneyDashboard 節點呈現改為連接式步驟條，正確反映完成/執行中/尚未開始三種狀態與順序進度
- `npm run build`、`npm run test:unit` 全部通過；`type-check`/`lint` 沒有新增錯誤數
- `prefers-reduced-motion` 正確停用兩頁的動畫效果

---

## 8. 風險與待確認事項

- JourneyDashboard 目前用 `journeyStore.ts` 的 mock 資料（行銷旅程 6 節點、生日旅程 5 節點），節點數不同會影響步驟條在窄螢幕下的換行行為，實作階段需要用兩種節點數都視覺驗證一次
- Explore 熱度榜頒獎台版型在極窄螢幕（例如 <480px）下，三張卡片並排可能過擠，實作階段需要確認是否需要額外的窄螢幕降級（例如改回直向堆疊），目前 spec 沒有明確規定降級規則，若視覺驗證時發現擠壓問題，落地為直向堆疊（#1 在最上方）
- `.agent-card` 目前的 hover 規則被 `.lively-card` 取代後，需要在实作階段確認「大家都在用」「為你推薦」兩個沒有分層的區塊視覺上不受影響（只是 hover 效果來源換了，卡片大小/排列不變）
