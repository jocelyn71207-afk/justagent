# 全站視覺重新設計 — Phase 6：AiViewer（Token 化 + Dark Mode + 死程式碼清理）

**日期：** 2026-08-17
**範圍：** `AiViewer.vue` + `_AiViewer.scss` 的顏色 token 化、dark mode、死程式碼清理；旅程執行狀態面板改用 Phase 4/5 已建立的 token
**不含：** 畫布互動邏輯、版型結構、快速鍵、debug overlay 的功能行為——這些完全不動
**前置文件：**
- `2026-08-11-visual-redesign-phase0-design-system.md`（Phase 0，色彩/字級/間距/陰影 token）
- `2026-08-13-visual-redesign-phase4-workspace-explore-design.md`（Phase 4，JourneyDashboard 建立的 `--success`/`--tag-blue-bg`/`-text`/`--divider`/`--text-faint` 旅程狀態 token 語彙，並留下「Phase 6 處理 AiViewer 時應該把 `.jcd-*` 換成同一套 token」的備忘）
- `2026-08-14-visual-redesign-phase5-knowledge-base-design.md`（Phase 5，SCSS 拆檔/token 化的處理慣例；`.stat-card--*` 頂層 modifier 被巢狀基底規則蓋掉的 CSS 優先度教訓——這次處理巨型 `_AiViewer.scss` 檔案時要特別留意同樣的陷阱）

---

## 1. 背景與目標

`AiViewer.vue`（1848 行）+ `_AiViewer.scss`（4214 行，全站最大的單一 SCSS 檔案）是一個 Konva.js 做的無限畫布工具，架構上跟一般管理頁面完全不同——左右可收合面板、迷你地圖、多選/拖拉/複製貼上、debug overlay（`?debug=true`），是一個類似 Figma/Miro 的沉浸式工具，不是表單或清單頁。

早先探索確認的現況：
- 樣式混合使用 token 跟寫死色：367 處 `var(--...)` 跟 146 處寫死的 hex 色並存，**完全沒有任何 dark mode 覆寫**（連 `[data-theme="dark"]` 區塊都沒有）
- 內嵌一個「旅程執行狀態」浮動面板 + FAB（`.journey-canvas-drawer`/`.jcd-*` 系列，72 處引用），跟 `JourneyDashboard.vue` 顯示同一份旅程資料，但兩邊用的是各自寫死的顏色（`#3b72f6`、`#16a34a`、`#7c3aed` 等），沒有共用任何樣式或 token
- 死程式碼：多段註解掉的畫布網格背景、一個 debug-only 的死 UI 區塊、一個 `v-if="false"` 永遠不會顯示的按鈕
- 一處 TODO 留下的紅色佔位色：`background-color: red; // TODO... 之後 js 改成動態給予顏色`
- Phase 5 已經確認：`_AiViewer.scss` 裡有一個孤兒 `@keyframes journey-blink`，早就被 `JourneyDashboard.vue` 改用的 `jd-blink` 取代，沒有任何地方還在引用

這次的目標：
1. 把 146 處寫死的 hex 色換成既有 token
2. 補上 dark mode 覆寫
3. 旅程執行狀態面板改用 Phase 4/5 建立的同一套 token，讓兩處視覺一致
4. 清掉已知的死程式碼

**不做結構性改動**——畫布互動邏輯（多選、拖拉、縮放、快速鍵）、左右面板/迷你地圖/debug overlay 的功能與版面配置完全不動，這次純粹是顏色/token/清理工作，不是版型重新設計。

---

## 2. 顏色 Token 化

- 146 處寫死的 hex 色逐一比對既有 token 系統（`--primary`/`--accent`/`--success`/`--warning`/`--danger`/`--divider`/`--text-*`/`--tag-violet/-blue/-amber/-teal-bg/-text`/`--primary-a08/-a12/-a20/-a40` 等），找語意最接近的既有 token 取代
- **不新增任何新 token**——找不到精確對應時，比照 Phase 5 的做法選擇語意最接近的既有分類色 token，並在實作計畫階段列出詳細的顏色→token 對照表（這個檔案規模太大，不在 spec 階段窮舉每一筆對照，留到 plan 階段實際讀過檔案內容後再展開）
- 補上 dark mode 覆寫，比照 Phase 3-5 建立的雙區塊模式（`[data-theme="dark"]` + `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }`）
- **注意 Phase 5 的教訓**：`_AiViewer.scss` 是巨型檔案，可能存在跟 Phase 5 `.stat-card--*` 同樣的問題——某個 modifier class 被寫成頂層規則，卻要修飾一個巢狀在容器 class 裡的基底規則，導致 CSS 優先度不足而silently 失效。轉換顏色時如果調整到任何規則的巢狀層級，要留意這個陷阱，必要時比照 Phase 5 的修法（把 modifier 一起巢狀進基底規則裡）

---

## 3. 旅程執行狀態面板（`.jcd-*` 系列）Token 對齊

- `.journey-canvas-drawer`/`.jcd-*` 系列目前用 `#3b72f6`（執行中/藍）、`#16a34a`（完成/綠）、`#7c3aed`（另一種狀態/紫）等寫死色，這次全部改用 `JourneyDashboard.vue` 已經在用的同一套 token：
  - 完成 → `var(--success)`
  - 執行中 → `var(--tag-blue-bg)`/`var(--tag-blue-text)`
  - 尚未開始/中性 → `var(--divider)`/`var(--text-faint)`
- 這是 Phase 4/5 就留下的明確備忘（讓 AiViewer 內嵌的旅程面板跟獨立的 JourneyDashboard 頁面視覺一致），這次一併完成
- 不改變旅程面板本身的版面配置或互動方式（浮動 FAB、抽屜開合、hover 自動平移到對應畫布區塊的邏輯都不動），只換顏色
- 順手清掉 Phase 5 已確認的孤兒 `@keyframes journey-blink`（`JourneyDashboard.vue` 已經改用 `jd-blink`，這裡的舊 keyframe 沒有任何地方引用）

---

## 4. 死程式碼清理

- 刪除多段註解掉的畫布網格背景樣式（實作階段先確認這些真的是純註解、沒有被任何 feature flag 或條件邏輯重新啟用）
- 刪除 debug-only 的死 UI 區塊（如果是「目前沒用到但保留給未來 debug 用」的區塊，實作階段跟現有的 debug overlay 邏輯確認是否還有關聯，避免誤刪還在用的 debug 功能）
- 刪除 `v-if="false"` 永遠不會渲染的按鈕（連同其對應的、如果有的話、只服務這個按鈕的 CSS 規則）
- TODO 留下的紅色佔位色：改用中性色 token（例如 `var(--text-faint)`或`var(--divider)`，實作階段依實際上下文決定），**保留原本的 TODO 註解文字**，讓這裡「還沒做完，之後要接上動態顏色邏輯」的訊號不會因為顏色換了就被誤以為已經完成

---

## 5. 非目標

- 不改畫布互動邏輯（多選、拖拉、複製貼上、縮放、快速鍵）
- 不改左右面板、迷你地圖、debug overlay 的版面配置或開關方式，只換顏色
- 不修 12 處 console.log——沿用 Phase 0-5 建立的「不修非視覺功能問題」範圍界線
- 不做真的「TODO 動態顏色」功能，只是把佔位色從寫死的 red 換成中性 token，功能本身仍待實作
- 不改 `knowledgeStore.ts`/`journeyStore.ts` 或任何 store 邏輯
- 不改 `AiViewerLeftBox.vue`/`AiViewerRightBox.vue`/`AiViewerContentBox.vue`/`FullAiViewerBlockBox.vue`/`StageMap.vue` 等子元件的邏輯——如果這些元件也有寫死色，實作計畫階段評估是否要一併處理（子元件通常有自己的 SCSS 檔案，若範圍過大可以拆成後續任務）

---

## 6. 測試

- 顏色/token 轉換後執行 `npm run build` 確認沒有 SCSS 錯誤
- 死程式碼清理後，特別確認 debug overlay（`?debug=true`）功能仍正常運作（手動測試，這是這個檔案最容易因為誤刪而壞掉的部分）
- 手動視覺檢查：light/dark 兩種模式下確認畫布工具的左右面板、迷你地圖、旅程執行狀態面板顏色都正確
- 確認旅程執行狀態面板的顏色跟 `JourneyDashboard.vue` 視覺一致（開兩個分頁比對，或至少確認用的是同一組 token）
- `npm run type-check`、`npm run lint`：僅檢查沒有新增的錯誤數
- `npm run test:unit`：確認既有測試全部通過（這個檔案目前如果有既有測試，需要在實作階段確認涵蓋範圍）

---

## 7. 成功標準

- `_AiViewer.scss` 146 處寫死色全部轉換為既有 token，不新增任何新 token
- AiViewer 整頁（含左右面板、迷你地圖、旅程面板、debug overlay）light/dark 兩種模式下顏色都正確
- 旅程執行狀態面板改用 `--success`/`--tag-blue-bg`/`-text`/`--divider`/`--text-faint`，跟 `JourneyDashboard.vue` 視覺語彙一致
- 已知的死程式碼（註解網格背景、debug 死 UI、`v-if="false"` 按鈕、孤兒 `@keyframes journey-blink`）全部清除
- TODO 紅色佔位色改用中性 token，TODO 註解保留
- `npm run build`、`npm run test:unit` 全部通過；`type-check`/`lint` 沒有新增錯誤數；debug overlay 功能手動確認正常

---

## 8. 風險與待確認事項

- 4214 行的 SCSS 檔案規模遠超過先前任何一個 phase 處理過的單一檔案，實作計畫階段需要仔細分批處理（比照 Phase 5 拆分任務的方式），不能指望一個任務一次處理完
- 146 處寫死色的實際語意分類（哪個顏色代表什麼狀態/用途）需要在實作階段實際讀過樣板的使用上下文才能正確對應到 token，不是單看顏色數值就能決定
- 死程式碼的刪除需要格外小心驗證——這個檔案功能複雜（debug overlay、多選狀態、旅程面板都是真的在用的功能），比照 Phase 2/5 的教訓，每一段「看起來像死程式碼」的內容都要先用 grep/實際讀樣板確認沒有被任何條件邏輯引用，才能刪除
- 子元件（`AiViewerLeftBox.vue` 等）是否也有寫死色、是否要納入這次範圍，留到實作計畫階段評估——如果範圍過大，可以只處理 `AiViewer.vue`/`_AiViewer.scss` 本身，子元件另外開下一輪
