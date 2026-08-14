# 全站視覺重新設計 — Phase 3：入口與登入群組（AppEntrance、LoginView）

**日期：** 2026-08-14
**範圍：** AppEntrance、LoginView 兩個 view 的版型/視覺重新設計
**前置文件：**
- `2026-08-11-visual-redesign-phase0-design-system.md`（Phase 0，色彩/字級/間距/陰影 token）
- `2026-08-12-visual-redesign-phase1-layout-design.md`（Phase 1，bento/hero 版型語言）
- `2026-08-13-visual-redesign-phase2-skill-group-design.md`（Phase 2，「活潑感」互動系統：`.lively-stagger`/`.lively-card`/`.lively-icon`/`.lively-corner-a`/`.lively-corner-b`，定義在 `src/scss/_custom.scss`）

---

## 1. 背景與目標

Phase 0-2 完成後，「專案與團隊管理」「Skill 管理」兩組已有一致的設計語言。這次接續處理使用者進入產品的第一印象：入口與登入。

**現況：**
- `AppEntrance.vue` 是完全空白的 stub 頁面（純文字 + 一個手動點擊的 `RouterLink`），註解寫著「也是解析登入者資料頁」，但目前沒有任何解析邏輯。它掛在路由 `/entrance`，但**目前沒有任何地方會導覽到這個路徑**——`LoginView.vue` 的 `handleLogin()` 直接 `router.push('/view/ProjectDashboard')`，略過了 `/entrance`。
- `LoginView.vue` 是置中單欄卡片（`.login-wrapper > .login-card`），logo + 社群登入（Google/Facebook，真實 SVG icon）+ email/password 表單 + 頁尾版權/連結。
- `_LoginView.scss` 存在新舊 class 並存的死程式碼：模板實際用的是舊 class 名（`.divider`、`.input-group`、`.form-actions`、`.remember-me`、`.forgot-password`、`.company-info`），但檔案裡同時定義了一套從未被模板使用的新 class 名（`.login-divider`、`.login-input-group`、`.login-form-actions`、`.login-remember-me`、`.login-forgot-password`、`.login-company-info`），並用註解承認「Fallback for old class name used in template」。

**這次的目標：**
1. **AppEntrance**：從空白 stub 改造成一個有品牌感的 loading 過渡畫面，並讓它真正接入登入後的流程（而不是繼續當一個孤立、沒人會經過的路由）。
2. **LoginView**：從置中單欄卡片改為左右分栅（左 50% 品牌視覺、右 50% 表單），這是比 Phase 0/1/2 都更大膽的結構改動——使用者已明確要求「更大膽的改動」，而不是在現有單欄卡片上做裝飾性微調。
3. 兩個 view 都建立在 Phase 0 的 token 系統與 Phase 2 的活潑感系統之上，不重新發明視覺語言。
4. 順手清掉 `_LoginView.scss` 裡的新舊重複死程式碼（本來就要整份重寫版面，順勢清理）。

---

## 2. AppEntrance.vue

### 2.1 內容與版面

置中畫面（沿用 mockup 驗證過的版本）：
- 品牌標記：一個小圓點 + 「JustAgent」wordmark（呼應 LoginView 左側品牌面板用的同一組標記，維持兩頁一致的品牌識別）
- 圈圈 spinner（CSS `border` 轉圈動畫，teal 主色）
- 說明文字：「正在為您準備工作環境...」

套用 Phase 2 的 `.lively-stagger`，讓 logo → spinner → 文字依序淡入（保守使用——這頁定位是沉穩的品牌過渡畫面，不套用 `.lively-corner-a/-b` 的不規則圓角或 hover 回饋，因為頁面上沒有可互動的卡片元素）。

### 2.2 導覽行為

**這是本次唯一涉及「行為」而非純視覺的改動，範圍刻意限縮到最小：**

- `LoginView.vue` 的 `handleLogin()` 改為 `router.push('/entrance')`，取代目前直接 `router.push('/view/ProjectDashboard')`。
- `AppEntrance.vue` 的 `<script setup>` 加入：掛載後等待一段模擬延遲（900ms–1.2s），接著 `router.push('/view/ProjectDashboard')`。
- 不做任何真的登入者資料解析邏輯——延遲時間是寫死的模擬值，不是等待某個非同步請求。這維持先前訪定的範圍界線（這頁不用真解析）。
- 移除目前樣板裡「App入口,也是解析登入者資料頁」的說明文字與手動 `RouterLink`（原本純粹是給開發者手動導覽用的暫時性內容，被真正的自動導覽取代後不再需要）。

**為什麼要接線而不是只改樣式：** 如果只重新設計 `AppEntrance.vue` 的視覺，但沒有任何入口會導覽過去，這個頁面做得再漂亮使用者也永遠看不到——這違背「品牌感過渡畫面」的目的。這個改動範圍很小（一行 `router.push` 目的地 + 一個 `setTimeout`/`onMounted` 延遲跳轉），且完全侷限在這兩個檔案內，不牽動其他 view 或 store。

---

## 3. LoginView.vue

### 3.1 整體版面

`.login-sim` 兩欄 grid（桌面寬度，約 ≥900px）：

**左側品牌面板**（`.login-brand`，寬度 50%）：
- 背景：`radial-gradient(1200px 600px at 20% 0%, var(--accent) 0%, transparent 55%), linear-gradient(160deg, var(--primary) 0%, #00614A 100%)`（用 Phase 0 既有的 `--primary`/`--accent` token，深色端沿用目前僅在此處出現的手寫深 teal，不新增全域 token）
- 背景圖案：一組抽象節點/連線 SVG（`<line>` + `<circle>`，白色描邊，`opacity: .22`），純裝飾、不需要無障礙替代文字（`aria-hidden="true"`）
- 品牌標記：圓點 + 「JustAgent」wordmark
- 標語：「讓每個 Agent，都學會你的企業專業」
- 副標：「集中管理技能、審核流程與版本，跨團隊共享同一套 Agent 能力。」
- 三個特色條目（呼應產品實際功能，不是編造的行銷詞）：
  - 技能治理與審核流程
  - 跨團隊技能共享與擴充
  - 版本控管與異動稽核
- 頁尾版權：「© 2026 莫比機器人股份有限公司」（從目前 `.company-info` 移過來，不重複顯示在右側）

**右側表單面板**（`.login-form-side`，寬度 50%，`background: var(--surface)` 或 `var(--page-bg)`）：
- 標題「歡迎回來」+ 副標「登入以繼續管理你的技能與團隊」（取代目前空的 `.login-header` 註解區塊）
- 社群登入按鈕（Google/Facebook）：**沿用 `LoginView.vue` 現有的完整 SVG markup，逐字保留，不重繪、不用佔位圖示**
- 分隔線「或使用 email 繼續」
- Email/Password 輸入框（沿用現有 `v-model`、顯示/隱藏密碼邏輯）
- 記住帳號 checkbox + 忘記密碼連結（沿用現有 `href="#"`，不修）
- 送出按鈕「登入」
- 頁尾「還沒有帳號？創建帳號」連結（沿用現有 `href="#"`，不修）

### 3.2 響應式

窄螢幕（< 900px）：`.login-sim` 改為單欄，隱藏 `.login-brand`，只顯示置中的 `.login-form-side`（比照多數分栅登入頁的慣例做法——品牌面板是加分而非必要資訊，窄螢幕優先保證表單可用）。

### 3.3 Dark mode 處理

- **左側品牌面板固定使用 teal 漸層，不隨 `[data-theme]`/`prefers-color-scheme` 切換。** 這個面板本身就是刻意的深色（品牌識別的一部分），跟 Phase 1 訂正的「light mode 不該出現的深色塊」是不同性質——那次的深色塊是設計失誤，這裡是有意的品牌視覺容器。
- **右側表單面板** 跟隨既有的 `--surface`/`--text`/`--divider` 等 token，在 dark mode 下正常切換。
- 沿用 `_LoginView.scss` 既有的 `@mixin login-dark` 模式（`[data-theme="dark"]` + `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }` 雙區塊寫法），但內容改為只調整右側表單面板需要的深色變化（例如輸入框、按鈕陰影），不再需要現有的 `.login-logo img { filter: brightness(5) }`（新版面不再用 `logo-new.png` 圖檔當主要品牌標記，改用文字 wordmark，見 3.4）。

### 3.4 Logo 呈現方式的變更

目前 `.login-logo` 是一張 `logo-new.png` 圖片（靠 `filter: brightness()` 做 dark mode 適配）。新版面在左側品牌面板改用「圓點 + JustAgent 文字」的 wordmark 呈現（跟 AppEntrance 一致），不再依賴 `logo-new.png` 這張圖檔素材，也連帶不需要 dark mode 的 `filter: brightness()` hack。`logo-new.png` 檔案本身不刪除（可能其他地方引用），只是這個 view 不再用它。

### 3.5 活潑感系統

右側表單面板套用 Phase 2 的 `.lively-stagger`（社群登入按鈕、輸入框、送出按鈕依序淡入）與社群/送出按鈕的 `.lively-card` hover 回饋。**不套用** `.lively-corner-a/-b` 的不規則圓角——登入頁的信任感優先於活潑感，維持 Phase 2 spec 裡「保守使用」的定調（跟 AppEntrance 一致的克制原則）。左側品牌面板本身不套用活潑感系統（純視覺展示區塊，沒有可互動元素）。

---

## 4. 死程式碼清理

在整份重寫 `_LoginView.scss` 版面的同時，清除新舊並存的重複規則：

- 保留模板實際使用的舊 class 名所對應的規則（`.divider`、`.input-group`、`.form-actions`、`.remember-me`、`.forgot-password`、`.company-info` 系列，或依新版面調整後的等效規則）
- 刪除從未被任何樣板使用的新 class 名規則：`.login-divider`（85-102 行）、`.login-input-group`（130-178 行）、`.login-form-actions`（231-237 行）、`.login-remember-me`（248-266 行其中的 `.login-remember-me` 選擇器）、`.login-forgot-password`（268-277 行其中的 `.login-forgot-password` 選擇器）、`.login-company-info`（322-351 行其中的 `.login-company-info` 選擇器）
- 由於本次是整份版面重寫（單欄卡片 → 左右分栅），實務上這些規則會直接被新的 `.login-sim`/`.login-brand`/`.login-form-side` 系列規則取代，不是逐條刪除舊檔案

---

## 5. 非目標

- 不修「忘記密碼」「創建帳號」「隱私政策」「服務條款」目前的 `href="#"` 假連結——維持現狀，不在本次範圍
- 不修 `handleLogin()` 裡 `console.log('Login attempt:', { email, password, ... })` 印出明文密碼的問題——這是功能/資安層級的既有問題，不是視覺設計問題，沿用 Phase 0-2 建立的「不修非視覺功能缺陷」範圍界線
- 不做真的登入驗證/後端串接——`handleLogin()` 仍是純前端模擬（沿用現有行為，只改變導覽目的地）
- 不做真的「解析登入者資料」邏輯——AppEntrance 的延遲是寫死的模擬值
- 不改 `AppBreadcrumb`、`container/Full.vue` 或任何側邊欄殼——這兩個 view 都在殼之外（Login 在 `/`、AppEntrance 在 `/entrance`，都不是 `/view` 底下的子路由），本來就不受側邊欄殼影響
- 不刪除 `logo-new.png` 檔案本身，只是這個 view 改用文字 wordmark

---

## 6. 測試

- `AppEntrance.vue` 補 `@vue/test-utils` mount 測試：確認掛載後（可用 `vi.useFakeTimers()` 推進時間）會呼叫 `router.push('/view/ProjectDashboard')`
- `LoginView.vue` 既有測試（若有）或新補測試：確認 `handleLogin()` 呼叫 `router.push('/entrance')`（不再是直接 push 到 ProjectDashboard）
- 手動視覺檢查：
  - 桌面寬度（≥900px）與窄螢幕（<900px）都檢查 LoginView 版面
  - light/dark 兩種模式下，右側表單面板顏色正確切換，左側品牌面板維持固定 teal，沒有意外的深色塊
  - Google/Facebook 按鈕的 SVG icon 跟原本設計逐像素一致
  - `prefers-reduced-motion: reduce` 時 AppEntrance 與 LoginView 的進場動畫都正確停用
- 死程式碼清理後執行 `npm run build` 確認沒有遺漏引用
- `npm run type-check`、`npm run lint`：僅檢查沒有新增的錯誤數
- `npm run test:unit`、`npm run build` 全部通過

---

## 7. 成功標準

- AppEntrance 呈現品牌 wordmark + spinner + 說明文字，套用 `.lively-stagger` 進場效果
- LoginView 登入成功後導覽至 `/entrance`，AppEntrance 顯示約 900ms–1.2s 後自動導覽至 `/view/ProjectDashboard`
- LoginView 桌面寬度呈現左右分栅（左品牌面板/右表單），窄螢幕降級為單欄表單
- 左側品牌面板固定 teal 漸層 + 節點圖案，不隨 dark mode 切換；右側表單面板正確跟隨 light/dark token
- Google/Facebook 登入按鈕使用逐字保留的原始 SVG markup
- `_LoginView.scss` 新舊重複 class 死程式碼清除，`npm run build` 正常
- `prefers-reduced-motion` 正確停用兩個 view 的進場動畫
- `npm run build`、`npm run test:unit` 全部通過；`type-check`/`lint` 沒有新增錯誤數

---

## 8. 風險與待確認事項

- `AppEntrance` 的自動導覽延遲需要在測試裡用 fake timers 處理，避免測試實際等待 900ms-1.2s 拖慢測試套件
- 左側品牌面板的節點 SVG 圖案座標是設計階段手繪的示意值，實作時可視實際容器比例微調，不需要與 mockup 像素對應
- 目前找不到其他地方引用 `logo-new.png`，但實作階段建議做一次全域搜尋確認，再決定要不要保留該圖檔（本次不刪除檔案，僅這個 view 不再引用）
