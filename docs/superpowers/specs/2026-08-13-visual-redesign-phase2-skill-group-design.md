# 全站視覺重新設計 — Phase 2：Skill 管理群組版型與活潑感

**日期：** 2026-08-13
**範圍：** SkillManagement、SkillTest、SkillEditor 三個 view 的版型調整 + 死程式碼清理 + 全新的「活潑感」互動系統
**前置文件：**
- `2026-08-11-visual-redesign-phase0-design-system.md`（Phase 0，色彩/字級/間距/陰影 token）
- `2026-08-12-visual-redesign-phase1-layout-design.md`（Phase 1，bento/hero 版型語言的先例）

---

## 1. 背景與目標

Phase 1 完成「專案與團隊管理」群組的版型重設計後，這次接續處理 Skill 管理群組（SkillManagement、SkillTest、SkillEditor）。這三個 view 形狀差異很大，不是套同一種公式：

- **SkillManagement** 最複雜：已有 hero 統計列（4 張等大卡）、tab、審核卡片、Library 分組清單
- **SkillTest** 是 sidebar + 主內容的 split 版面（跟 AiViewer 殼類似）
- **SkillEditor** 是線性精靈表單（Phase 0 已修過 token/無障礙）

過程中有兩個重要的使用者判斷需要記錄：
1. **統計卡不做假的重要性區分**——SkillManagement 的 4 張統計卡（啟用中技能/企業擴充/團隊擴充/本月觸發次數）是同性質的數字，使用者明確表示「不要區分 hero，4 張維持等大就好」。這跟 Phase 1 的 bento 精神並不矛盾：Phase 1 的教訓是「用資料本身的意義決定大小」，這裡的資料本身沒有意義上的主次之分，所以正確做法就是不強加。
2. **版型仍需要真正的結構調整，不只是裝飾**——使用者兩度回饋「版型死板」，要求在不編造假重要性的前提下，找到真實存在的結構差異來源。找到的真實差異：Library 技能管理裡「企業技能」是全公司唯一一份、「團隊技能」則依團隊分成多組——這是真實的 1 vs N 結構，不是編造的。

另外新增一套「活潑感」視覺系統（使用者從瀏覽器 mockup 比較中選出 A+C 組合）：
- **A：動態互動**——清單/卡片進場時依序淡入＋輕微上浮（stagger），hover 時上浮＋輕微放大＋陰影加深＋邊框變品牌色，icon 有微旋轉＋放大的彈性回饋
- **C：造型變化**——卡片圓角改成不規則配對（例如左上右下大、右上左下小），奇偶交錯；hover 時輕微旋轉 0.5-1 度
- **未選用 B**（每個分類各自的淡色調），維持 Phase 0 已定案的 teal 品牌色為主視覺語彙，不额外引入分類色當背景大面積使用（分類色 token 只用於小面積的色條/badge，這點跟 Phase 1 一致）
- 需加入 `prefers-reduced-motion` 判斷，使用者關閉動態效果時退回無動畫版本

---

## 2. 各 View 的版型與內容調整

### 2.1 SkillManagement.vue

**統計列**（`.skill-stats-row`）：維持 4 張等大卡片，**不做 hero/bento 尺寸區分**。只套用活潑感系統（進場 stagger、hover 回饋、icon 微旋轉、不規則圓角）。

**審核佇列**（管理區，`SkillReviewCard` 清單）：這些卡片本身內容量就不同（可展開的技能指令、選填的 AI 分析區塊），目前的格線可能強制等高，讓收合狀態的卡片看起來空。改為**自然高度對齊**（`align-items: start`，不強制 stretch），讓卡片高度反映真實內容量。套用活潑感系統。

> **更新（2026-08-25）：** 管理區入口已從 tab bar 上的「管理區」分頁改為頁面頂部的「團隊技能管理」按鈕（點擊後切到 `activeTab === 'review'`，內容區塊本身不變）；tab bar 現在只剩「我的技能」一個分頁，原本置頂的「瀏覽 Library」「建立技能」按鈕則搬到「我的技能」分頁內容區頂部。

**Library 技能管理**（`skill-manage-block`）：這是本次唯一的實質版面重分配：
- 「企業技能」區塊維持較寬的主要區塊（因為全公司只有一份，是單一實體）
- 「團隊技能」從目前「一條長列表依團隊分組」改為**每個團隊一張獨立卡片**，卡片之間用響應式多欄排列（`repeat(auto-fit, minmax(...))`），卡片內部才是原本 `LibrarySkillRow` 的 2 欄清單
- 兩個區塊都套用活潑感系統

### 2.2 SkillTest.vue

維持既有的 sidebar + 主內容 split 骨架（`skill-test-layout`：240px + 1fr），不做結構性改動。調整：
- Sidebar 內「Library 技能」底下的三個子分類（系統技能/企業擴充/團隊擴充）改用**左側色條**區分（teal/blue/amber，對應 Phase 0 的分類色 token），取代目前純文字的分類標籤——這是反映真實分類、不是編造的視覺層次
- Sidebar 清單項目、分類色條區塊套用活潑感系統（進場 stagger + hover 回饋）
- 右側 `test-panel` 不變

### 2.3 SkillEditor.vue

**第 2 步（技能指令）**：目前「技能指令」「觸發時機」「所需檔案」「指派 Agent」四個 `.se-section` 垂直等重排列。改為：
- 「技能指令」維持全寬、最大的主要區塊，給予稍微不同的視覺強調（例如 1.5px 的淺 teal 邊框），因為這是使用者填寫的核心內容
- 「觸發時機」+「所需檔案」合併成雙欄次要區塊，放在指令下方
- 「指派 Agent」維持全寬（chip 格子需要橫向空間），放在最下方

**第 3 步（確認）**：目前是單一長條 `.se-confirm-card` 列表。改為：
- 技能名稱拉成頁面標題（比照 Phase 1 CompanyTeamSettings 建立的 icon-led section 慣例，但這裡技能名稱本身夠重要，直接當標題用，不需要額外 icon）
- 下方分兩張並排的 icon 標題卡片：「內容摘要」（指令字數/觸發時機/檔案數）、「設定」（指派 Agent 數量/啟用狀態）

兩步都套用活潑感系統（進場 stagger、hover 回饋）；`se-agent-chip`（Phase 0 已有基礎 hover 樣式）疊加不規則圓角與更明顯的 hover 位移。

---

## 3. 死程式碼清理

在動這幾個檔案的同時一併清除已確認沒有樣板引用的死規則：

**`src/scss/views/_SkillManagement.scss`**：
- `.skill-search-clear`（~134-145 行）
- `.filter-chips` / `.filter-chip`（含 `--reviewing`/`--upstream` 修飾與 `.fc-badge`，~150-216 行）
- `.skill-tree`（~220-224 行）
- `.skill-group-box` 與其巢狀的 `.skill-group-children`/`SkillCard` 覆寫（~228-319 行）
- `.skill-empty`（~323-333 行，已被 `.skill-section-empty`/`.my-skills-empty` 取代）
- `.skill-manage-list`（~484-490 行，已被 `.lsr-sections`/`.lsr-section-list` 取代）
- `.skill-stat-card--alert` 修飾（~38-42 行）與 `.skill-stat-icon` 的 `icon--pending`/`icon--pass` 變體（~71-79 行，目前 4 張卡只用到 `icon--enabled`/`icon--ext`/`icon--team`/`icon--usage`）

**`src/scss/views/_SkillTest.scss`**：
- `.version-dd`、`.version-dd-btn`、`.version-dd-menu`、`.version-dd-item`、`.version-current-tag`（~78-136 行）——**清除前必須先確認** `SkillVersionPicker.vue`（現在樣板實際使用的版本選擇元件）沒有依賴這些確切的 class 名稱，避免誤刪還在用的樣式

---

## 4. 活潑感系統的技術規格

新增一組可重用的 CSS 規則（放在 `src/scss/_custom.scss`，延續 Phase 0 建立共用樣式的慣例）：

- **進場動畫**：`@keyframes fade-in-up`（opacity 0→1，translateY 10px→0），套用清單/卡片時用 `nth-child` 或內聯 `animation-delay` 做出依序出現的 stagger 效果（每項間隔約 80-100ms，最多累積到約 400ms 封頂，避免大清單等太久）
- **Hover 回饋**：`transform: translateY(-3px) scale(1.02)` + `box-shadow` 加深 + `border-color` 轉為 `var(--primary)`，transition 用 `cubic-bezier(.34,1.4,.64,1)` 做出彈性感；卡片內的 icon 元素疊加 `transform: rotate(-8deg) scale(1.1)`
- **造型變化**：卡片 `border-radius` 改用不對稱配對（例如 `20px 6px 20px 6px` / `6px 20px 6px 20px`），透過 `nth-child(odd)`/`nth-child(even)` 交錯；hover 時疊加 `rotate(0.5deg)` 左右的輕微旋轉
- **無障礙**：整組效果包在 `@media (prefers-reduced-motion: no-preference)` 內，`reduce` 時保留 hover 的顏色/陰影變化但移除位移/旋轉/進場動畫

---

## 5. 非目標

- 不改 `AppBreadcrumb`——這是全站共用元件，10 個其他 view 都在用，改動範圍太廣，不在本次範圍
- 不碰任何 store/API 商業邏輯（`skillStore.ts` 的資料結構、審核流程、草稿邏輯等完全不變）
- 不改 `SkillTestChat`/`SkillTestAI` 內部邏輯或版面
- 不改變側邊欄＋內容區的整體殼（延續 Phase 1 定案的原則）
- 不引入 Phase 0「未選用 B」的分類色大面積背景方案——分類色只用在小面積色條/badge

---

## 6. 測試

- 若「企業技能 vs 團隊技能卡片」的分組邏輯有新的計算（例如依團隊分組、依剩餘筆數決定卡片排列），若邏輯複雜到值得抽成獨立函式，比照 Phase 1 的模式補純函式單元測試
- 針對版面/樣板有改動的區塊（Library 技能管理雙區塊、SkillTest 側欄分類色條、SkillEditor 第 2/3 步重排），比照 Phase 0/1 建立的 `@vue/test-utils` mount 測試模式補測試，確認既有互動（審核核准/駁回、技能詳情開啟、Agent 指派、表單送出）在新版面下仍正常
- 死程式碼清理後執行 `npm run build` 確認沒有遺漏引用
- `npm run type-check`、`npm run lint`：僅檢查沒有新增的錯誤數（既有技術債不在本次範圍）
- 手動視覺檢查：light/dark 兩種主題下確認活潑感效果（進場動畫、hover、造型變化）都正常，且沒有意外的深色色塊（延續 Phase 1 訂正的規則）
- 確認 `prefers-reduced-motion: reduce` 時動畫確實停用

---

## 7. 成功標準

- SkillManagement 統計列維持 4 張等大卡片，套用活潑感系統
- SkillManagement 審核卡片改為自然高度對齊，不再強制等高
- SkillManagement Library 技能管理呈現「企業技能寬區塊 + 團隊技能多欄卡片」的真實結構差異
- SkillTest 側欄的系統/企業/團隊三個分類用色條區分
- SkillEditor 第 2 步呈現「指令主要區塊 + 觸發時機/檔案雙欄次要區塊 + Agent 全寬」的層次；第 3 步呈現「標題 + 兩張分組確認卡」
- 列出的死程式碼規則全部清除，且 `npm run build` 正常
- 全站切換 dark mode，本次改動的區塊顏色都正確；`prefers-reduced-motion` 正確停用動畫
- `npm run build`、`npm run test:unit` 全部通過；`type-check`/`lint` 沒有新增錯誤數

---

## 8. 風險與待確認事項

- 團隊技能分組的實際團隊數量/每組技能數量取決於 `skillStore.ts` 現有的 mock 資料結構，實作計畫階段需要先確認實際欄位（team 名稱從哪個欄位讀取）再決定卡片渲染邏輯
- `SkillVersionPicker.vue` 是否真的不依賴 `.version-dd*` 系列 class，需要在實作階段實際讀取該元件源碼確認後才能安全刪除
- 活潑感系統的 stagger 動畫延遲上限（本文件建議約 400ms 封頂）在實作時如果清單筆數很多，需要驗證觀感是否恰當，必要時可調整
