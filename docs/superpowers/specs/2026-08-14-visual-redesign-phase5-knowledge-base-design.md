# 全站視覺重新設計 — Phase 5：知識庫群組（KnowledgeBase、KnowledgeDetail、KnowledgeEditor）

**日期：** 2026-08-14
**範圍：** KnowledgeBase、KnowledgeDetail 的配色/token/dark mode/活潑感潤飾；KnowledgeEditor 從單頁表單改為 3 步驟向導；SCSS 死程式碼清理 + 拆檔
**不含：** ResourceLibrary（Phase 0 已處理）、AiViewer（獨立 Phase 6，含旅程面板 token 對齊）
**前置文件：**
- `2026-08-11-visual-redesign-phase0-design-system.md`（Phase 0，色彩/字級/間距/陰影 token，`--tag-violet/-blue/-amber/-teal` 分類色）
- `2026-08-13-visual-redesign-phase2-skill-group-design.md`（Phase 2，SkillEditor 3 步驟向導的 stepper 視覺語言、活潑感系統 `.lively-stagger`/`.lively-card`）

---

## 1. 背景與目標

「知識庫」群組實際涵蓋 3 個 view：`KnowledgeBase.vue`（清單/儀表板）、`KnowledgeDetail.vue`（內容檢視器）、`KnowledgeEditor.vue`（編輯表單）。探索過程中發現這組的技術現況比預期複雜：

**SCSS 現況（不是設計問題，是既有程式碼的技術債）：**
- `KnowledgeApiSources.vue` 這個 view 早已被刪除（功能併入 `KnowledgeBase.vue` 的「資料來源」分頁，由 `DataSourceTab.vue` 元件負責），但對應的 `src/scss/views/_KnowledgeApiSources.scss`（421 行）沒有一併移除，變成 100% 用不到的死程式碼（頂層 class `.KnowledgeApiSources` 在整個專案裡找不到任何對應元素）
- `src/scss/views/_Knowledge.scss`（278 行）也是死程式碼——綁定的 `.Knowledge` class 現在整個專案裡沒有任何元素在用（推測是早年重構嘗試留下的孤兒檔案，同名 class 如 `.filter-row`/`.kb-tab-nav`/`.editor-banner` 的真正樣式其實重複定義在下面這個檔案裡）
- 真正在用的樣式全部集中在 `src/scss/views/_KnowledgeBase.scss`（2595 行），這個檔案用 `.KnowledgeBase` 當作外層 class 同時涵蓋 KnowledgeBase、KnowledgeDetail、KnowledgeEditor 三個 view，加上好幾個 modal（`CreateKnowledgeWizardModal`、`SourceUpdateModal`、`CreateVersionModal`、`VersionCompareModal`、`ReviewDrawer`）的樣式，是一個混雜多個 view 職責的巨型檔案
- 裡面有 40+ 處寫死的 hex 色（狀態徽章、KPI 卡片、pipeline 進度色），完全沒有任何 dark mode 覆寫

**三個 view 的真實樣貌差異很大：**
- **KnowledgeBase**：清單/儀表板混合體——5 張 KPI 統計卡（含一張帶進度條的「轉換率」卡）+ 可批次操作/篩選的資料表格（每列 12 項情境式操作選單）+ 內部分頁切到「資料來源」子畫面（`DataSourceTab`）
- **KnowledgeDetail**：三者中最豐富的——狀態相依的頂部操作按鈕 + 4 分頁（概覽含 Markdown 渲染、版本歷程時間軸、分段預覽、轉換紀錄），是內容檢視器而非表單
- **KnowledgeEditor**：目前是單頁兩欄表單，**完全沒有像 `SkillEditor.vue` 那樣的多步驟向導概念**——只有「儲存草稿」「送出審核」兩個終端動作

這次的目標：
1. 清掉確認死掉的 SCSS 檔案，把真正在用的 `_KnowledgeBase.scss` 拆成三個 view 各自的檔案（比照專案其餘 view 的慣例）
2. KnowledgeBase、KnowledgeDetail 做配色/token/dark mode/活潑感潤飾，不大改版型結構
3. KnowledgeEditor 從單頁表單改為 3 步驟向導，比照 Phase 2 已建立的 SkillEditor stepper 視覺語言

---

## 2. SCSS 死程式碼清理與拆檔

### 2.1 刪除確認死掉的檔案

- 刪除 `src/scss/views/_Knowledge.scss`（全部 278 行皆為死程式碼，`.Knowledge` class 無任何對應元素）
- 刪除 `src/scss/views/_KnowledgeApiSources.scss`（全部 421 行皆為死程式碼，對應的 view 早已刪除）
- 在 `src/scss/views/_index.scss` 移除這兩個檔案的 `@import` 行
- `ApiSourceModal.vue` 元件檔案本身已經在更早的清理中被刪除（只剩 SCSS 孤兒），這次不需要額外處理元件檔案

### 2.2 `_KnowledgeBase.scss` 拆成三個 view 檔案

把現有 2595 行按照 view 歸屬拆成：
- `src/scss/views/_KnowledgeBase.scss`：只保留 `KnowledgeBase.vue` 實際使用的規則（頁面 banner、KPI 卡片列、篩選/批次操作列、資料表格、`DataSourceTab` 相關樣式如果是這個檔案在管、`CreateKnowledgeWizardModal`/`SourceUpdateModal` 這兩個從 KnowledgeBase 開啟的 modal）
- `src/scss/views/_KnowledgeDetail.scss`（新檔）：`KnowledgeDetail.vue` 專屬的規則（狀態相依操作按鈕、4 分頁切換、版本歷程時間軸、`CreateVersionModal`/`RestoreVersionModal`/`VersionCompareModal`/`ReviewDrawer`/`FilePreviewModal` 這幾個從 Detail 開啟的 modal）
- `src/scss/views/_KnowledgeEditor.scss`（新檔）：`KnowledgeEditor.vue` 專屬的規則（表單欄位、新增的 3 步驟 stepper、`SubmitReviewModal`）

跨頁共用的規則（例如 `.status-badge--*` 系列、`.pipeline-*` 進度樣式——這些在 KnowledgeBase 的表格列跟 KnowledgeDetail 的側欄都會用到）歸到 `_KnowledgeBase.scss`（三個檔案裡最早載入的），不新增第四個共用檔案，避免範圍擴大。

新增的兩個檔案需要在 `src/scss/views/_index.scss` 手動 `@import`。

---

## 3. KnowledgeBase + KnowledgeDetail：配色/Token/Dark Mode/活潑感潤飾

**不改版型結構**——KPI 卡片列、資料表格、4 分頁、版本歷程時間軸的排列方式維持現狀。

- 40+ 處寫死的 hex 色（狀態徽章如 `#ede9fe`/`#7c3aed`、KPI 卡片如 `#fef3c7`/`#b45309`、pipeline 進度色）換成既有 token；找不到對應語意色的（例如審核狀態用的紫色），比照 Phase 0 建立的 `--tag-violet-bg`/`--tag-violet-text` 分類色 token 使用，不新增新 token
- `KnowledgeBase.vue`、`DataSourceTab.vue` 樣板裡的 inline `style="background:#fffbeb;..."` 這類寫死顏色，一併改成透過 class + token 呈現
- 補上 dark mode 覆寫（這組目前完全沒有任何 `[data-theme="dark"]`/`prefers-color-scheme` 區塊）
- 套用 Phase 2 活潑感系統：`.lively-stagger` 套在 KPI 卡片列、資料表格列容器、版本歷程時間軸容器；`.lively-card` 套在 KPI 卡片、資料表格列（若目前有 hover 效果，比照 Phase 3/4 教訓改由 `.lively-card` 統一提供，避免同一元素被兩個來源的 `transform`/`transition` 規則同時宣告）
- 順手修正 `KnowledgeDetail.vue:168` 的一個小 bug：`style="color:var(--color-danger,#dc2626);"` 引用了一個專案裡不存在的 token（真正的 danger 語意色 token 叫 `--danger`），目前只是靠 inline fallback 值矇混過去，沒有真的跟著 dark mode 切換。這次的 token 轉換工作會直接改成 `var(--danger)`，不算範圍外的功能性修改（純粹是同一批 token 轉換工作的一部分）

---

## 4. KnowledgeEditor：3 步驟向導化

這是本次唯一的結構性改動。目前是單頁兩欄表單（左欄標題/摘要/內容，右欄分類/標籤/來源檔案/可見範圍/更新說明/狀態資訊），改為比照 `SkillEditor.vue` 的 3 步驟向導（`se-stepper` 視覺語言：進場動畫、進度條、上一步/下一步導覽、驗證闖關）：

### Step 1・基本資訊
- 知識標題（必填）
- 內容摘要
- 分類（`compDropDown`）
- 標籤（tag chip 輸入）

### Step 2・內容與來源
- 知識內容（Markdown textarea，維持現狀不做真的 WYSIWYG 編輯器——`未來將支援所見即所得編輯器` 這句提示文字保留）
- 關聯來源檔案（含「從共用檔案管理選取」按鈕，維持現有的 `功能開發中` stub 行為，不修）
- 可見範圍（`compDropDown`）

### Step 3・確認與發布
- 本次更新說明（必填，送出前的最後一個必填欄位）
- 狀態資訊整理成確認卡片呈現（狀態/草稿版本/前一版本/最後編輯人），比照 Phase 2 SkillEditor 第 3 步驟「icon-led 標題卡片」的呈現方式，不是像現在這樣一直顯示在側欄
- 這一步同時是送出前的內容總覽（標題、分類、標籤、字數等摘要資訊），讓使用者在送審前有機會確認

**驗證規則**（比照 SkillEditor 的「驗證闖關」模式）：
- Step 1 → Step 2：知識標題、知識內容不可為空才能進到下一步（內容欄位雖然在 Step 2，但為了讓「下一步」按鈕邏輯跟 SkillEditor 一致，實作時可考慮把「必填」檢查點放在使用者離開對應步驟時，細節在實作計畫階段確認）
- 進到 Step 3 前：本次更新說明為必填（沿用現有 `handleSave`/`handleSubmitReview` 已有的必填檢查邏輯，只是從「送出前才檢查」改成「進入確認步驟前檢查」）

**不改的部分：**
- `handleSave`（儲存草稿）、`handleSubmitReview`（送出審核）背後的 store 呼叫邏輯完全不變
- `SubmitReviewModal` 維持現狀
- 「從共用檔案管理選取」按鈕的 stub 行為不變

---

## 5. 非目標

- 不處理 ResourceLibrary（Phase 0 已處理）、AiViewer（獨立 Phase 6）
- 不修 `downloadItem()` 目前用 `window.alert(...)` 假裝下載的問題
- 不修 `handleKnowledgeCreated` 這個特意留空的 no-op handler
- 不修「從共用檔案管理選取」按鈕的 `功能開發中` stub
- 不深入調查 `formData.visibility` 是否有確實被儲存/送出，維持現狀
- 不做真的 WYSIWYG 內容編輯器，`知識內容` 欄位維持 Markdown textarea
- 不改 `knowledgeStore.ts` 的資料結構或商業邏輯
- 不改 `AppBreadcrumb`/側邊欄殼
- 不新增任何 CSS token——找不到對應語意色時沿用 Phase 0 既有的分類色 token（`--tag-violet` 等）

---

## 6. 測試

- SCSS 拆檔/刪除死程式碼後執行 `npm run build` 確認沒有遺漏引用、沒有樣式跑掉（可用 Playwright 截圖比對拆檔前後的 KnowledgeBase/KnowledgeDetail 畫面，確保視覺上等價，只是檔案結構重整）
- KnowledgeEditor 向導化：比照 SkillEditor 既有的 `@vue/test-utils` 測試模式，補測試確認 3 步驟切換、每步驟的驗證闖關邏輯、`handleSave`/`handleSubmitReview` 在新版向導下仍正常運作
- KnowledgeBase/KnowledgeDetail 的活潑感/token 改動，補測試確認既有互動（表格列操作選單、分頁切換、版本歷程操作）在新樣式下仍正常
- `npm run type-check`、`npm run lint`：僅檢查沒有新增的錯誤數
- 手動視覺檢查：light/dark 兩種模式下確認三個 view 的顏色都正確，特別是狀態徽章、pipeline 進度色、KPI 卡片這幾個目前完全沒有 dark mode 的區塊
- 確認 `prefers-reduced-motion: reduce` 時活潑感動畫正確停用

---

## 7. 成功標準

- `_Knowledge.scss`、`_KnowledgeApiSources.scss` 刪除，`_KnowledgeBase.scss` 拆成三個 view 各自的檔案
- KnowledgeBase、KnowledgeDetail 全部顏色改用 token，light/dark 主題切換正常運作，套用活潑感系統
- `KnowledgeDetail.vue:168` 的 `--color-danger` 誤用修正為 `--danger`
- KnowledgeEditor 呈現 3 步驟向導（基本資訊/內容與來源/確認與發布），套用 SkillEditor 既有的 stepper 視覺語言，驗證闖關邏輯正常運作
- `npm run build`、`npm run test:unit` 全部通過；`type-check`/`lint` 沒有新增錯誤數

---

## 8. 風險與待確認事項

- `_KnowledgeBase.scss` 裡哪些規則屬於「跨頁共用」（狀態徽章、pipeline 進度色）、哪些屬於「KnowledgeBase 專屬」，實作階段需要先讀過樣板實際的 class 使用情況才能正確歸類拆檔，不能只憑檔案裡的規則順序猜測
- KnowledgeEditor 向導化的驗證闖關細節（哪個欄位在哪一步驗證）在實作計畫階段需要對照 SkillEditor 現有的驗證模式（`se-stepper` 元件、`currentStep` ref 邏輯）具體展開，這份 spec 只定調三步驟的欄位分配，不是逐行實作細節
- `DataSourceTab.vue` 是否也算在這次「配色/token 潤飾」範圍內——它在技術上是獨立元件（`src/components/Knowledge/`），不是 `src/views/` 底下的 view 檔案，但視覺上是 KnowledgeBase 的一個分頁；實作階段預設納入潤飾範圍（因為使用者會在同一頁面看到），若範圍評估後過大，可以拆成獨立任務或下一輪處理
