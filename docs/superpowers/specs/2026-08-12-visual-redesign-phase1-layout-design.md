# 全站視覺重新設計 — Phase 1：專案與團隊管理群組版型重設計

**日期：** 2026-08-12
**範圍：** ProjectDashboard、ProjectTrashCans、TeamProject、TeamAccessManagement、CompanyTeamSettings 五個 view 的版型（layout）調整
**前置文件：**
- `2026-08-11-visual-redesign-phase0-design-system.md`（Phase 0，本次沿用其 design token：色彩、字級、間距、卡片/badge 樣式）
- Phase 0 已合併/待合併的實作（`_theme.scss`/`_themeDark.scss`/`_variables.scss`/`_button.scss`/`_custom.scss` 的 token 擴充）

---

## 1. 背景與目標

Phase 0 只處理了顏色 token、dark mode 正確性與元件可及性，刻意不動版面結構。套用完 Phase 0 後，使用者實際瀏覽時的回饋是「版面看起來還是死板（B 版 mockup：齊頭式卡片、齊頭式 KPI 膠囊、純表格）」。Phase 1 的目標是在**維持「側邊欄＋內容區」整體殼不變**的前提下，讓內容區的版面呼應資料本身的重要性/急迫度，不再是齊頭式排版。

視覺方向已透過瀏覽器 mockup 確認（bento 排法：卡片/區塊大小依急迫度或角色重要性決定），並修正了一個問題：**light mode 不可以出現大面積深色色塊**（原 mockup 的「企業擁有者」hero 卡用了近黑色底 `#09151A`，會在淺色頁面中顯得突兀，違反 Phase 0 已定案的「light 為主」原則，稽核報告也點名過這個模式）。

---

## 2. 各 View 的版型處理方式

這 5 個 view 不是同一種頁面型態，處理方式分三類：

### 2.1 卡片列表類（ProjectDashboard、TeamProject → 共用 `ProjectListContent.vue`）

`ProjectDashboard.vue` 與 `TeamProject.vue` 都只是薄包裝層，實際版面邏輯全部在共用元件 `src/components/ProjectListContent/ProjectListContent.vue`（同時support `mode="recent"` 與 `mode="team"`）。**只需要改這一個元件，兩個 view 會同時生效**。

處理方式：卡片格線由目前的齊頭式改為「第一張（陣列中最近更新的專案）拉成 spotlight 大卡（跨 2 欄），其餘維持一般大小」，格線本身改用 `repeat(auto-fit, minmax(...))` 響應式寫法。Banner 區的 KPI 數字（Active/Review）維持現有的資訊，只調整視覺樣式使用 Phase 0 的 token。

### 2.2 Bento 卡片類（ProjectTrashCans）

依「剩餘天數」的急迫度分三層（緊急/警示/一般），級距對應到卡片的 `grid-column`/`grid-row` span 值：越急迫的卡片越大。頂部原本的純文字警示橫幅，改為「一大一小」的統計摘要（最急迫數量的 hero 統計 + 次要統計），呼應 mockup 的 B→C 版比較。

### 2.3 表格＋側欄類（TeamAccessManagement）

- 企業擁有者（`role === '企業擁有者'`，全站只會有 1 個）獨立拉成一張 hero 卡，**使用淺色的品牌色調（`--tag-teal-bg`/`--tag-teal-text` 或 `--accent-soft`/`--primary-hover`），不用深色底**，避免 light mode 出現深色塊。
- 其餘角色（平台管理者/團隊主管/專案人員＋檢視者，後兩者可合併顯示）改成 KPI tile，一大一小的比例（企業擁有者 hero 最寬）。
- 主表格右側新增「最近異動」活動側欄（`grid-template-columns: 1fr 240px`），內容是新增的小型假資料陣列（見 §3）。
- 表格本身維持表格形式（資料表格不適合打散成卡片，稽核也沒有把它列為問題），只調整間距、avatar 造型、hover 回饋。

### 2.4 設定表單類（CompanyTeamSettings）

這頁本質是設定表單（企業類型、團隊類型等 info row），bento/hero 版型不適用。處理方式是「精修」而非「重排版」：把現有的 `info-card` 分組改成更清楚的雙欄卡片排列，section 標題加上圖示，呼應 Phase 0 已建立的視覺語言，但不改變資訊架構或欄位順序。

---

## 3. 資料需求

TeamAccessManagement 的「最近異動」側欄需要一個資料來源，目前专案沒有這類記錄（`skillStore.ts` 有 `OperationRecord`/`auditLog` 的先例，但是給 Skill 用的，跟成員權限異動無關）。做法：比照 `TeamAccessManagement.vue` 現有的 `memberList` 假資料寫法（`// TODO... 後端吐資料` 慣例），新增一個型別化的本地假資料陣列（例如 `interface AccessActivity { id: string; memberName: string; action: string; time: string }`），純前端展示用，不涉及任何 store/API 改動。

---

## 4. 技術做法

- Bento 大小：用 CSS Grid 明確定位（`grid-column: span N`），依資料算出的 class（例如急迫度 tier、`isOwner` 布林值）動態綁定 `:class`。若這個判斷邏輯有複雜度（例如急迫度分級），抽成一個純函式（放在 `src/utils/` 或就地 `computed`），方便寫單元測試。
- 沿用 Phase 0 的 token：`--tag-*` 系列、`--primary-a08/-a12/-a20/-a40`、`$spacing` map、`.entity-card`/`.tag-badge`（Phase 0 已建但未套用，這是它們第一次被實際使用）。
- **不新增任何深色/近黑色的 solid 色塊在 light mode 預設狀態下**——任何「hero」卡一律使用品牌色淺色調（`accent-soft`/`tag-teal-bg` 這類），維持全頁一致的淺色基調；dark mode 下沿用既有主題切換機制即可，不需要特別處理。
- `ProjectListContent.vue` 是共用元件，改動需要同時檢查 `mode="recent"`（ProjectDashboard 用）與 `mode="team"`（TeamProject 用）兩種情境都正常。

---

## 5. 非目標（Phase 1 不做的事）

- 不處理 KnowledgeBase、SkillEditor、Explore、AiViewer、GUI、JourneyDashboard、KnowledgeDetail/Editor、SkillManagement、SkillTest、LoginView、AppEntrance（其餘 4 組，屬於後續 Phase）
- 不改任何 modal（TeamAccountSettingModal、專案建立/設定 modal 等）的內部版面或商業邏輯
- 不新增/修改任何 API 串接或 store 的商業邏輯（僅 TeamAccessManagement 新增純展示用的本地假資料）
- 不改變任何頁面的資訊架構（欄位、篩選條件、操作項目本身不變，只調整排版呈現方式）

---

## 6. 測試

這次改動主要是模板重排與新的 CSS Grid 定位邏輯，沒有新的商業邏輯分支（除了「急迫度分級」這類可抽成純函式的判斷）。測試重點：
- 若急迫度分級/owner 判斷抽成獨立函式，補純函式的單元測試（比照專案現有 `src/utils/__tests__/` 慣例）
- 確認既有互動（刪除/編輯/建立 modal、篩選 dropdown、分頁）在新版面下仍正常運作 —— 沿用 Phase 0 建立的 `@vue/test-utils` mount 測試模式，針對有改動互動元素的 view 補測試
- `npm run build`、`npm run type-check`（僅檢查未新增的錯誤數）、`npm run lint`（僅檢查未新增的錯誤數）
- 手動視覺檢查：確認 light mode 下沒有意外的深色塊、dark mode 下 hero/bento 卡片顏色正確

---

## 7. 成功標準

- `ProjectListContent.vue` 的 spotlight 卡片與其餘卡片的響應式格線，在 ProjectDashboard 與 TeamProject 兩處都正確顯示
- ProjectTrashCans 的卡片大小確實依剩餘天數分級呈現（可用截圖或 DOM 檢查驗證 `grid-column`/`grid-row` span 值對應正確的急迫度）
- TeamAccessManagement 的企業擁有者 hero 卡使用淺色品牌色調（非深色/黑色），light mode 下視覺一致；「最近異動」側欄正確顯示假資料
- CompanyTeamSettings 的 info-card 分組視覺上更清楚，但欄位/選項本身不變
- 全站切換 dark mode，5 個 view 的新版型顏色都正確
- `npm run build`、`npm run test:unit` 全部通過；`type-check`/`lint` 沒有新增錯誤數

---

## 8. 風險與待確認事項

- `ProjectListContent.vue` 是共用元件且檔案較大（稽核未特別提及但實務上是核心元件），改動範圍需要控制精準，避免影響其餘未列入本次計畫的呼叫情境
- 「最近異動」假資料的具體內容/筆數尚未定案，實作計畫階段會給出具體的 mock 資料
- Bento 分級的確切級距（例如「剩幾天算緊急」）沿用 ProjectTrashCans 既有的 `expiry-badge--urgent/--warning/--normal` 三個分級，不重新定義新的門檻
