# 全站視覺重新設計 — Phase 0：設計語言與共用元件

**日期：** 2026-08-11
**範圍：** 設計 token 擴充、核心共用元件樣式、dark mode 修正
**前置文件：**
- `2026-05-04-jade-mist-02-design-system.md`（現行 CSS 變數系統的來源，本次在此基礎上擴充，不替換）
- `2026-04-21-journey-dashboard-redesign.md`（Journey 節點語意色的來源，本次予以保留並 token 化）
- `2026-06-22-skill-management-design.md` / `2026-06-30-skill-management-v2-design.md`（v1→v2 遺留死程式碼的背景）
- `2026-08-11` 設計稽核報告（本次工作的觸發點，18 個 view 的問題清單）

---

## 1. 背景與目標

上一輪稽核（Artifact：JustAgent UI 全站設計稽核）發現全站 18 個 view 中有 13 個存在「顏色寫死、繞過 CSS 變數」的問題，且多處元件各自發明一次性的分類色／狀態色，導致 dark mode 大範圍失效、視覺語彙不統一。

使用者的目標：這個專案目前只是模擬產品的樣態（demo/mockup），需要重新設計介面、版型、配色，整體走「高級俐落、乾淨、科技感」，**企業色（primary/accent）不可修改**，以 light mode 為主、dark mode 為輔（維持正確但不追求額外的深色專屬設計）。

專案規模（18 view、86 元件）太大，無法一次性重寫，因此拆分為：

- **Phase 0（本文件）**：設計語言 token 擴充 + 核心共用元件樣式（buttons、cards、badges、icon-button 可及性）+ 修正稽核發現的 dark mode 顏色 bug。這一層做完，全站 view 都會直接受益，因為它們共用同一套元件樣式。
- **Phase 1**：套用到「專案與團隊管理」群組（ProjectDashboard / ProjectTrashCans / TeamProject / TeamAccessManagement / CompanyTeamSettings），另立 spec。
- **Phase 2+**：依序套用到其餘 4 組 view（工作區與探索、知識庫、Skill 管理、入口與登入），屆時各自另立 spec。

視覺方向已透過瀏覽器 mockup 比較確認：在「保留 Linear/Vercel 式的留白與克制」與「Stripe 式的卡片層次」之間，選定混搭版（方案 C）——細邊框卡片、以左側色條標示狀態/分類、teal 品牌色比純留白版更明顯地出現在互動元素上，陰影只保留給真正浮起的層（dropdown/modal）。

---

## 2. 非目標（Phase 0 不做的事）

- 不重新設計任一 view 的版面結構/資訊架構（側邊欄、頁面資訊架構維持現狀，那是 Phase 1+ 的工作）
- 不更換 icon 套件（全站 86 個元件都在用 Material Symbols Outlined，替換成本遠高於效益，維持現狀）
- 不更換字體家族（Noto Sans TC / Public Sans / JetBrains Mono 維持，Jade Mist 02 已確立）
- 不移除 JourneyDashboard 既有的節點語意色（D0 藍、D3 橙、D30 綠等，來自 `2026-04-21-journey-dashboard-redesign.md`）——這套顏色是 Journey 功能自己的、有文件依據的語意系統，不是隨意寫死；Phase 0 只把它從 inline hex 轉成 CSS 變數，讓它能在 dark mode 下正確顯示，語意色本身不變
- 不處理 API 串接、假互動（假的 toggleSort、社群登入無反應等）——那些是功能性 bug，屬於另一批技術債，不在這次視覺重新設計範圍內（可另開票處理）

---

## 3. 色彩 Token 擴充

在 `src/scss/base/_theme.scss` 與 `_themeDark.scss` 上新增（不刪除、不改變現有 `--primary`/`--accent` 等品牌值）：

**Alpha 階梯**（取代全站手寫的 `rgba(0,160,120,x)`、`rgba(14,15,12,x)` 等）：
```
--primary-a08 / -a12 / -a20 / -a40
```
凡是稽核中發現「近黑寫死邊框」的地方，一律改用既有的 `--divider` / `--divider-a50` / `--divider-a30`，不新增另一套邊框色。

**分類色系統**（新增，取代 Explore / JourneyDashboard / KnowledgeBase 各自發明的一次性顏色）：
```
--tag-violet-bg / --tag-violet-text     (Explore 的紫色分類、KnowledgeBase 的 badge-ai)
--tag-blue-bg   / --tag-blue-text       (Journey D0、KnowledgeBase 的 badge-raw)
--tag-amber-bg  / --tag-amber-text      (Journey D3、既有 warning 語意色可共用)
--tag-teal-bg   / --tag-teal-text       (Journey D1/D7/D14、與品牌色同色相但作為分類標籤獨立於 --accent)
```
每組都要有 light + dark 兩份值（dark 版本比照 `_themeDark.scss` 既有的「保持色相、調亮並降飽和」原則）。既有的 `_KnowledgeBase.scss` 中那些「從未定義過的 M3 幽靈變數」（`--color-primary`、`--color-on-surface` 等）全部移除，改接這套分類色或既有的 `--primary`/`--accent`。

**Elevation（陰影）**：
```
--shadow-sm   /* 卡片 hover 時的極輕微抬升，非預設狀態 */
--shadow-md   /* dropdown、popover */
--shadow-lg   /* modal、drawer */
```
沿用既有的 `--shadow: 15,23,42` 作為 rgba 基底（已經是有調過色相的深藍灰，不是純黑，維持）。卡片預設狀態**不使用陰影**，只用邊框；陰影只出現在真正浮動的層。

---

## 4. 字體與版面

**字體家族不變**：`'Noto Sans TC'` 內文 / `'Public Sans'` 標題 / `'JetBrains Mono'` 數據等寬。

**新增字級階梯**（`src/scss/base/_variables.scss`）：
```
$font-caption: 12px;   // 時間戳、次要說明
$font-label:   13px;   // badge、tag、表單 label
$font-body:    14px;   // 內文（既有 $font-form-size 沿用）
$font-base:    16px;   // 既有 $font-size-base，維持
$font-h-sm:    18px;   // 卡片標題
$font-h-md:    22px;   // 區塊標題
$font-h-lg:    28px;   // 頁面標題
```
字重規則：內文 400，次層級（如卡片標題、tab active）用 500/600，頁面主標題用 700。數字欄位（統計卡、表格）一律加 `font-variant-numeric: tabular-nums`（稽核發現這點目前不一致）。

**間距階梯**：`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48`px，作為 SCSS map 定義於 `_variables.scss`，取代目前各頁各自手寫的間距值。

**卡片格線**：共用 mixin 預設用 `grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))`，取代目前多處寫死等寬欄數（稽核發現 Explore.vue 完全無響應式即是此問題最嚴重的案例）。個別頁面仍可覆寫，但預設值要是響應式的。

---

## 5. 卡片與元件規則

**卡片標準樣式**（取代稽核抓到的「泛用 border+shadow+白底」）：細 1px 邊框（`--divider`）、無預設陰影、左側 3px 色條標示狀態或分類（使用第 3 節的分類色 token 或既有語意色），圓角沿用既有 `$radius`/`$radius-lg` 規模，不新增新的圓角值。

**互動狀態三態**（套用到 `src/scss/base/_button.scss` 與共用元件）：
- Hover：背景/邊框輕微變化
- Active：`transform: scale(0.98)` 或 `translateY(1px)`
- Focus-visible：可見的 focus ring，顏色用 `var(--primary)`
- Transition 統一 180–220ms

**Icon-only 可點擊元素的可及性修正**：稽核發現 TeamAccessManagement / ProjectTrashCans / ResourceLibrary / SkillEditor 都用 `<i>`/`<div>` 加 `@click` 實作「更多選項」「步驟指示器」，缺乏 `<button>`、`tabindex`、`aria-label`、focus 樣式。Phase 0 建立一個共用的 icon-button CSS 樣式類（例如 `.icon-btn`），要求配套使用真正的 `<button type="button">` 並提供 `aria-label`；這幾個既有出現點在 Phase 0 一併修正（純樣式類別新增在 `_button.scss`，套用到既有元件時需要碰對應的 4 個 `.vue` 檔案的模板，屬於「順手修」而非另開範圍）。

**Badge 統一**：現有 `.process-type-badge`、`.status-badge` 樣式保留，新增分類色版本的 badge 變體，接到第 3 節的 `--tag-*` token，取代各頁各自寫死的 badge 顏色。

---

## 6. Dark Mode 修正原則

- 本次一併修正稽核發現的所有「顏色寫死導致 dark mode 顯示錯誤」的案例（已於問題澄清中確認）。
- 修正方式一律是「把寫死的 hex/rgba/SCSS 常數換成對應的 CSS 變數」，不新增 dark 模式專屬的視覺設計（例如不做 dark-only 的漸層、特殊效果）。
- JourneyDashboard 的節點語意色（D0/D1/D3/D30）保留語意，但改用 CSS 變數實作，確保深色模式下也有對應、可讀的配色（沿用第 3 節分類色 token 的 dark 版本）。
- 驗證方式：Phase 1 實作完成後，手動切換 `[data-theme="dark"]` 檢查該群組所有頁面。

---

## 7. 觸及檔案範圍（Phase 0）

- `src/scss/base/_theme.scss`、`_themeDark.scss`、`_variables.scss`、`_button.scss`、`_mixins.scss`
- `src/scss/components/_index.scss` 內的共用元件樣式檔（badge、card、icon-button 相關的既有檔案，依實際需要挑選，不重寫全部 34 個元件檔）
- 4 個既有「icon-only 可點擊」的既有出現點所在的 `.vue` 模板（TeamAccessManagement、ProjectTrashCans、ResourceLibrary、SkillEditor），僅修改該按鈕的標籤/屬性，不動其餘邏輯
- `_KnowledgeBase.scss` 中的幽靈 M3 變數清理（雖然 KnowledgeBase 本身是 Phase 2 才做版面調整，但這批寫死顏色屬於 Phase 0 的 token 修正範圍，可以先做）

不觸及：各 view 的版面結構、86 個元件中與本次無關的樣式檔、任何 `.ts`/store 邏輯（icon-button 修正例外，僅涉及模板屬性）。

---

## 8. 成功標準

- `_theme.scss` / `_themeDark.scss` 新增 token 皆有 light + dark 值，且品牌 `--primary`/`--accent` 數值與現行完全一致（可用 git diff 確認未變動）
- 全域搜尋稽核報告中列出的寫死顏色案例（`rgba(14,15,12,`、`rgba(0, 160, 120,`、`#7c5fba`、`$color_main_*` 用於本應主題化之處等）在觸及範圍內歸零
- 4 個 icon-only 互動點改為 `<button>` 後可用 Tab 鍵聚焦、Enter/Space 觸發，並有可見 focus ring
- `npm run type-check`、`npm run lint`、`npm run test:unit` 全部通過
- 手動切換 dark mode，Phase 0 觸及的元件顏色皆正確對應（不再是 light 配色殘留）

---

## 9. 風險與待確認事項

- 分類色 token 的實際 hex 值（`--tag-violet-*`、`--tag-blue-*` 等）尚未逐一定案，寫作實作計畫時需要對照現有 Explore/Journey/KnowledgeBase 用色抓最接近、對比度足夠的值，而非憑空新配色
- `_KnowledgeBase.scss` 的幽靈變數清理範圍較大（100+ 處寫死 hex），Phase 0 只處理「有幽靈變數/明顯違規」的部分，不做該頁版面調整，執行時需要明確切這條線避免範圍蔓延到 Phase 2 的工作
