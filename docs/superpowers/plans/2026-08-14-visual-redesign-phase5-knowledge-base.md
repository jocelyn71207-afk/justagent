# 全站視覺重新設計 Phase 5：知識庫群組 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 刪除知識庫群組的死程式碼、把巨型的 `_KnowledgeBase.scss`（2595 行）拆成三個 view 各自的檔案，KnowledgeBase/KnowledgeDetail 做 token/dark-mode/活潑感潤飾，KnowledgeEditor 從單頁表單改為 3 步驟向導（比照 SkillEditor 既有的 stepper 語言）。

**Architecture:** 5 個任務依序進行：(1) 刪除確認死掉的 SCSS 檔案；(2) 把真正在用的巨型檔案拆成三個 view 專屬檔案（純粹搬移+重新 scope，不改任何顏色值，可獨立驗證零視覺差異）；(3)(4) KnowledgeBase/KnowledgeDetail 各自的 token 化+dark mode+活潑感；(5) KnowledgeEditor 向導化。每個任務都是 TDD 循環（測試優先）+ 手動視覺檢查。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Pinia、SCSS（CSS Custom Properties 主題 token）、Vitest + `@vue/test-utils`。

## Global Constraints

- 使用 `<script setup lang="ts">`，禁止 Options API（專案 `CLAUDE.md`）
- 樣式統一在 `src/scss/` 管理，禁止 `<style scoped>`（專案 `CLAUDE.md`）
- 顏色使用 CSS Custom Properties，不寫死 hex；**不新增任何新 token**——找不到語意對應時沿用 Phase 0 既有的分類色 token（`--tag-violet-bg`/`-text`、`--tag-blue-bg`/`-text`、`--tag-amber-bg`/`-text`、`--tag-teal-bg`/`-text`）
- **例外**：`src/components/Knowledge/DataSourceTab.vue` 裡 SharePoint（`#0078D4`/`#e8f4fd`，出現兩處）、Google 雲端硬碟（`#4285F4`/`#e8f0fe`）、Slack（`#4A154B`/`#fce8ff`）這 5 組顏色是真實的第三方品牌識別色，**維持寫死不轉 token**（比照 Phase 3 LoginView 保留 Google/Facebook 品牌 SVG 顏色的原則）。**但「自訂 API」圖示色（`#5c35d9`/`#f0f0ff`，第 198-199 行）不算真實品牌色**——它是這個 app 自己定義的連接類型，不是外部服務身份識別，這組要轉成 token（見 Task 3）
- 套用 Phase 2 既有的活潑感系統 class：`.lively-stagger`（容器）、`.lively-card`（可互動卡片）——定義在 `src/scss/_custom.scss`，本次不新增或修改該檔案；套用時比照 Phase 3/4 的教訓，若元素本身已有 `transform`/`transition`/hover 規則，改由 `.lively-card` 統一提供，不要同一元素被兩個來源的規則同時宣告
- `prefers-reduced-motion` 判斷沿用既有慣例：動態效果包在 `@media (prefers-reduced-motion: no-preference)` 內
- 新增的 SCSS 檔案（`_KnowledgeDetail.scss`、`_KnowledgeEditor.scss`）需要在 `src/scss/views/_index.scss` 手動 `@import`，否則不會被打包（專案 `CLAUDE.md` 的 Gotcha）
- 不改 `knowledgeStore.ts` 的資料結構或商業邏輯；`handleSave`/`handleSubmitReview`/`saveDraft`/`submitForReview` 呼叫邏輯不變
- 不修 `downloadItem()` 的假下載、`handleKnowledgeCreated` 的 no-op、「從共用檔案管理選取」按鈕的 `功能開發中` stub、`formData.visibility` 是否有確實持久化的疑慮——這些都維持現狀
- `KnowledgeEditor.vue` 目前完全沒有獨立的 SCSS 檔案（樣式借用 `_KnowledgeBase.scss` 裡靠 `.KnowledgeBase` class 命中的規則）；Task 2 會建立 `_KnowledgeEditor.scss` 並註冊 `@import`

---

### Task 1: 刪除確認死掉的 SCSS 檔案

**Files:**
- Delete: `src/scss/views/_Knowledge.scss`（全部 278 行皆為死程式碼，`.Knowledge` class 在整個專案裡沒有任何對應元素）
- Delete: `src/scss/views/_KnowledgeApiSources.scss`（全部 421 行皆為死程式碼，對應的 `KnowledgeApiSources.vue` view 早已刪除，功能併入 `KnowledgeBase.vue` 的「資料來源」分頁）
- Modify: `src/scss/views/_index.scss`（移除這兩個檔案的 `@import` 行）

**Interfaces:**
- Consumes: 無前置任務
- Produces: 無後續任務依賴（純刪除）

- [ ] **Step 1: 驗證這兩個檔案真的是死程式碼**

執行：
```bash
grep -rn "class=\"Knowledge\"\|class='Knowledge'\|Knowledge \|KnowledgeApiSources" src/views/ src/components/ --include="*.vue" | grep -v "KnowledgeBase\|KnowledgeDetail\|KnowledgeEditor\|KnowledgeFlashcardPreview\|KnowledgeTablePreview\|KnowledgeSourceDrawer\|KnowledgeEditChatModal"
```
Expected: 沒有任何一行是 `class="Knowledge"`（單獨、不含 Base/Detail/Editor 等後綴的字面 class）或 `KnowledgeApiSources` 相關樣板引用。如果找到任何一個真的在用的引用，STOP 並回報，不要繼續刪除。

- [ ] **Step 2: 刪除兩個死檔案**

```bash
rm src/scss/views/_Knowledge.scss
rm src/scss/views/_KnowledgeApiSources.scss
```

- [ ] **Step 3: 修改 `_index.scss` 移除對應 `@import`**

`src/scss/views/_index.scss` 目前內容（17 行）：
```scss
@import "./AppEntrance";
@import "./ProjectDashboard";
@import "./TeamProject";
@import "./ProjectTrashCans";
@import "./ResourceLibrary";
@import "./CompanyTeamSettings";
@import "./TeamAccessManagement";
@import "./AiViewer";
@import "./GUI";
@import "./KnowledgeBase";
@import "./Explore";
@import "./KnowledgeApiSources";
@import "./LoginView";
@import "./SkillManagement";
@import "./SkillTest";
@import "./SkillEditor";
@import "./JourneyDashboard";
```

刪除 `@import "./KnowledgeApiSources";` 這一行（`_Knowledge.scss` 本來就沒有被 `@import` 過，不用處理）。

- [ ] **Step 4: 執行 build 確認沒有遺漏引用**

Run: `npm run build`
Expected: 編譯成功，無「找不到檔案」的 SCSS 錯誤

- [ ] **Step 5: 執行既有測試確認沒有破壞任何東西**

Run: `npm run test:unit`
Expected: 全部通過（這個任務不改任何樣板，理論上不會影響任何測試）

- [ ] **Step 6: Commit**

```bash
git add src/scss/views/_index.scss
git rm src/scss/views/_Knowledge.scss src/scss/views/_KnowledgeApiSources.scss
git commit -m "chore(knowledge): 刪除確認死掉的 SCSS 檔案（_Knowledge.scss、_KnowledgeApiSources.scss）"
```

---

### Task 2: 把 `_KnowledgeBase.scss` 拆成三個 view 專屬檔案

**這個任務只做搬移+重新 scope，不改任何顏色值、不加活潑感、不加 dark mode。** 拆完之後畫面應該跟拆之前一模一樣（純重構）。顏色/dark mode/活潑感留給 Task 3-5 處理。

**Files:**
- Modify: `src/scss/views/_KnowledgeBase.scss`（只留 KnowledgeBase 專屬規則 + 跨頁共用規則 + KnowledgeBase 開啟的 modal）
- Create: `src/scss/views/_KnowledgeDetail.scss`
- Create: `src/scss/views/_KnowledgeEditor.scss`
- Modify: `src/scss/views/_index.scss`（新增兩個 `@import`）

**Interfaces:**
- Consumes: Task 1 完成後乾淨的 `_index.scss`
- Produces: 三個各自獨立的 SCSS 檔案，供 Task 3（`_KnowledgeBase.scss`）、Task 4（`_KnowledgeDetail.scss`）、Task 5（`_KnowledgeEditor.scss`）分別修改

**重要背景**：`KnowledgeBase.vue`、`KnowledgeDetail.vue`、`KnowledgeEditor.vue` 三個檔案的樣板根節點都同時帶有 `class="KnowledgeBase"`（`KnowledgeDetail.vue` 是 `class="KnowledgeBase KnowledgeDetail views-page"`，`KnowledgeEditor.vue` 是 `class="KnowledgeBase KnowledgeEditor views-page"`）。這代表 `_KnowledgeBase.scss` 裡目前所有 `.KnowledgeBase { ... }` 包起來的規則，其實同時對三個 view 都生效。拆檔案時，只屬於單一 view 的規則，要把外層從 `.KnowledgeBase` 改成該 view 專屬的 `.KnowledgeDetail`/`.KnowledgeEditor`（這些 class 剛好都已經存在於樣板上，不用改樣板），這樣才是真正的收窄 scope，不只是搬檔案。跨頁共用的規則（例如 `.status-badge`、`.version-badge`、`.tag-chip`）維持 `.KnowledgeBase` 外層不變，留在 `_KnowledgeBase.scss`（三個檔案裡最早載入的）。

- [ ] **Step 1: 讀取現有 `_KnowledgeBase.scss` 全文，逐條核對下方分類表**

下表是根據目前檔案內容（2595 行）分析出的分類。**在搬動每一條規則之前，先用下面這個指令核對該 class 名稱實際被哪些樣板使用，若跟表格不符，以實際樣板使用情況為準**：
```bash
grep -rn "class=\"[^\"]*<CLASS_NAME>" src/views/Knowledge*.vue src/components/Knowledge/*.vue
```

**留在 `_KnowledgeBase.scss`（KnowledgeBase 專屬 + 跨頁共用 + KnowledgeBase 開啟的 modal，外層 selector 不變）：**

| 行號範圍（原始檔案） | 內容 |
|---|---|
| 1 | `@use "sass:color";` |
| 11-538 | `.CreateKnowledgeWizardModal`（第一段） |
| 540-550 | `@keyframes ai-pulse`、`@keyframes ai-pulse-purple` |
| 556-759 | `.SourceUpdateModal` |
| 762-780 | `.KnowledgeBase .knowledge-icon`、`.knowledge-icon--api` |
| 782-792 | `.KnowledgeBase .api-source-badge` |
| 795-827 | `.KnowledgeBase .kb-tab-nav`、`.kb-tab` |
| 846-903 | `.KnowledgeBase .stats-row`、`.stat-card`+變體 |
| 906-919 | `.KnowledgeBase .filter-row` |
| 922-951 | `.KnowledgeBase .category-tabs`、`.category-tab-btn` |
| 954-986 | `.KnowledgeBase .status-badge` 基底+`--PUBLISHED/--REVIEWING/--DRAFT/--REJECTED/--HISTORY`（跨頁共用：KnowledgeDetail 側欄也用） |
| 989-1009 | `.KnowledgeBase .source-stale-badge` |
| 1012-1027 | `.KnowledgeBase .version-badge`（跨頁共用：KnowledgeEditor 側欄也用） |
| 1030-1042 | `.KnowledgeBase .category-tag`（跨頁共用：KnowledgeDetail 也用） |
| 1045-1147 | `.KnowledgeBase .custom-table`+巢狀規則（含表格內的 `.tag-chip`/`.more-btn`/`.ops-menu-wrap`/`.ops-btn`/`.next-option-box`） |
| 1192-1209 | `.KnowledgeBase .tag-chip` 獨立版+`--system`（跨頁共用） |
| 1524-1569 | `.KnowledgeBase .drawer-panel`、`.drawer-header`、`.drawer-body`（**這組不只 Knowledge 群組共用，`src/components/Skill/SkillDetailDrawer.vue`、`src/components/Skill/UpstreamUpdateDrawer.vue` 也在用同一組 class，已用 grep 確認，千萬不要移動或重新命名，只能原樣留著**） |
| 1904-1920 | `.add-knowledge-dropdown`（頂層，不在 `.KnowledgeBase{}` 內，維持頂層） |
| 1922-1964 | `.status-badge--active/-processing/-reviewing/-needs_update/-pending/-failed/-archived/-draft/-history/-rejected`（頂層，跨頁共用） |
| 1966-1994 | `.pipeline-progress-wrap/-bar/-fill/-stage-label`（頂層，註解寫「列表列內用」= KnowledgeBase 表格列專用） |
| 1996-2041 | `.batch-toolbar`（頂層，KnowledgeBase 批次操作工具列） |
| 2261-2263 | `.table-row--needs-update`（頂層，KnowledgeBase 表格列高亮） |
| 2292-2359 | `.CreateKnowledgeWizardModal`（第二段，跟第一段是同一個 selector，Sass 編譯時會自動合併，保持原本前後順序） |
| 2495-2548 | `.stat-card--kpi`、`.kpi-badge`、`.stat-icon--kpi`、`.stat-number--kpi`、`.kpi-target`、`.kpi-progress-bar`、`.kpi-progress-fill`（頂層，KnowledgeBase 的轉換率 KPI 卡片） |
| 2550-2574 | `.error-log-modal`、`.error-log-body`、`.error-log-pre`（頂層，ErrorLogModal） |

**額外死程式碼**：`.KnowledgeBase .search-box`（原第 830-843 行）——已用 `grep -rln "search-box" src/views/ src/components/` 確認，`KnowledgeBase.vue`/`KnowledgeDetail.vue`/`KnowledgeEditor.vue`/`DataSourceTab.vue` 都沒有引用這個 class（引用它的是完全不相關的 `TeamAccessManagement.vue`、`AppMenuTree.vue`、AiViewer 相關元件、`compDropDown.vue`，這些各自有自己的 `.search-box` 定義，不依賴這裡）。**這條規則在拆檔時直接刪除，不要搬到任何檔案。**

**搬到 `_KnowledgeDetail.scss`（新檔，外層改成 `.KnowledgeDetail`）：**

| 原始行號範圍 | 內容 | Rescope |
|---|---|---|
| 1150-1189 | `.detail-header-card`+`.info-grid` | `.KnowledgeBase .detail-header-card` → `.KnowledgeDetail .detail-header-card` |
| 1229-1258 | `.compare-selectors`+巢狀 | 同上模式 |
| 1261-1286 | `.diff-legends`、`.diff-legend` | 同上模式 |
| 1289-1359 | `.diff-container`+巢狀 | 同上模式 |
| 1362-1426 | `.history-item`+巢狀 | 同上模式 |
| 1657-1727 | `.content-preview`+巢狀（含 `.markdown-body` 表格樣式） | 同上模式 |
| 1572-1603 | `.version-type-btn`+巢狀（CreateVersionModal 用，從 Detail 開啟） | 同上模式 |
| 1730-1901 | `.review-drawer-panel`+所有 `.review-*`（ReviewDrawer 專屬樣式） | 同上模式 |
| 2044-2076 | `.detail-tabs`、`.detail-tab-btn`、`.detail-tab-panel`（頂層） | 加上 `.KnowledgeDetail` 外層包住 |
| 2079-2088 | `.detail-overview-grid`（頂層） | 同上 |
| 2091-2098 | `.detail-sidebar-card`（頂層） | 同上 |
| 2100-2149 | `.sidebar-section`、`.sidebar-section-title`、`.sidebar-divider`、`.sidebar-row`、`.sidebar-label`、`.sidebar-file-item`（頂層） | 同上 |
| 2152-2179 | `.file-preview-body`、`.file-preview-img`、`.file-no-preview`、`.file-no-preview-icon`（頂層） | 同上 |
| 2182-2223 | `.version-timeline`+巢狀（頂層） | 同上 |
| 2226-2258 | `.chunk-card`+巢狀（頂層） | 同上 |
| 2265-2289 | `.pipeline-stages`、`.pipeline-stage-badge`（頂層，註解寫「Detail 頁 Pipeline 三階段」） | 同上 |
| 2362-2493 | `.conversion-log-tab`+所有 `.conversion-*`/`.step-*`（頂層，ConversionLogTab） | 同上 |
| 2576-2595 | `.pipeline-review-banner`（頂層） | 同上 |

範例（把「頂層規則加上 `.KnowledgeDetail` 外層」具體怎麼做）——原本：
```scss
.detail-tabs {
  display: flex;
  border-bottom: 2px solid var(--border, #e2e8f0);
  margin-bottom: 16px;
}
```
拆到新檔後：
```scss
.KnowledgeDetail {
  .detail-tabs {
    display: flex;
    border-bottom: 2px solid var(--border, #e2e8f0);
    margin-bottom: 16px;
  }
}
```
（其餘同一批頂層規則都放進同一個 `.KnowledgeDetail { ... }` 區塊裡，不用每條都各自包一層）

**搬到 `_KnowledgeEditor.scss`（新檔，外層改成 `.KnowledgeEditor`）：**

| 原始行號範圍 | 內容 | Rescope |
|---|---|---|
| 1212-1226 | `.editor-banner` | `.KnowledgeBase .editor-banner` → `.KnowledgeEditor .editor-banner` |
| 1429-1440 | `.editor-card` | 同上模式 |
| 1442-1455 | `.field-group` | 同上模式 |
| 1457-1475 | `.editor-toolbar`、`.toolbar-badge` | 同上模式 |
| 1477-1483 | `.editor-textarea` | 同上模式 |
| 1486-1502 | `.source-files-list`、`.source-file-item` | 同上模式 |
| 1505-1521 | `.meta-info-list`、`.meta-info-item` | 同上模式 |
| 1606-1654 | `.tags-input-wrap`+巢狀（KnowledgeEditor 專屬的標籤輸入，不是 CreateKnowledgeWizardModal 裡那個同名但獨立的區塊） | 同上模式 |

（這個新檔案在 Task 5 還會再新增向導 stepper 的樣式，這裡只搬移現有內容）

- [ ] **Step 2: 依照上表實際執行搬移**

讀取 `_KnowledgeBase.scss` 全文，依照上面三張表把對應行號範圍的內容搬到正確的目的檔案，套用該表格指定的 rescope 規則。搬移時保留原有的縮排、註解、換行風格，只改外層 selector 名稱（如果需要）。

- [ ] **Step 3: 新增 SCSS 檔案的 `@import` 註冊**

修改 `src/scss/views/_index.scss`，在 `@import "./KnowledgeBase";` 這行之後緊接著新增：
```scss
@import "./KnowledgeDetail";
@import "./KnowledgeEditor";
```

- [ ] **Step 4: 執行 build 確認沒有 SCSS 錯誤**

Run: `npm run build`
Expected: 編譯成功

- [ ] **Step 5: 執行既有測試套件確認沒有破壞任何東西**

Run: `npm run test:unit`
Expected: 全部通過（這個任務不改任何樣板/顏色值，理論上零影響）

- [ ] **Step 6: 手動視覺比對確認零視覺差異**

啟動 `npm run dev`，分別打開 `/view/KnowledgeBase`、`/view/KnowledgeDetail/:id`（用任一存在的知識條目 id）、`/view/KnowledgeEditor/:knowledgeId/:versionId`（用任一存在的草稿版本 id），跟這個任務開始前的畫面比對（可以用 `git stash` 暫時還原舊版本對照，或單純憑經驗判斷版面/顏色是否有跑掉）——因為這個任務刻意不改任何顏色值或樣板，畫面應該完全一樣。

- [ ] **Step 7: Commit**

```bash
git add src/scss/views/_KnowledgeBase.scss src/scss/views/_KnowledgeDetail.scss src/scss/views/_KnowledgeEditor.scss src/scss/views/_index.scss
git commit -m "refactor(knowledge): 把 _KnowledgeBase.scss 拆成三個 view 專屬檔案，收窄 scope"
```

---

### Task 3: KnowledgeBase.vue —— Token 化 + Dark Mode + 活潑感

**Files:**
- Modify: `src/views/KnowledgeBase.vue`（3 處 inline 顏色改用 class + token）
- Modify: `src/components/Knowledge/DataSourceTab.vue`（「自訂 API」圖示色改用 token；SharePoint/Google/Slack 這 4 組真實品牌色維持不動）
- Modify: `src/scss/components/_DataSourceTab.scss`（新增 `.app-icon--custom-api` 修飾字）
- Modify: `src/scss/views/_KnowledgeBase.scss`（新增 dark mode、活潑感 class、"需更新" KPI 卡片的 token 化樣式）
- Test: `src/views/__tests__/KnowledgeBase.tokens.test.ts`（新檔）

**Interfaces:**
- Consumes: Task 2 拆檔完成後的 `_KnowledgeBase.scss`
- Produces:（本任務無後續任務依賴）

- [ ] **Step 1: 寫失敗測試**

建立 `src/views/__tests__/KnowledgeBase.tokens.test.ts`：

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import KnowledgeBase from '../KnowledgeBase.vue'

function mountKnowledgeBase() {
  setActivePinia(createPinia())
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/', component: { template: '<div/>' } }],
  })
  return mount(KnowledgeBase, {
    global: {
      plugins: [router],
      stubs: { AppBreadcrumb: true, CreateKnowledgeWizardModal: true, CreateVersionModal: true, ReviewDrawer: true, VersionCompareModal: true, ErrorLogModal: true, DataSourceTab: true },
    },
  })
}

describe('KnowledgeBase 統計卡片 token 化', () => {
  it('「需更新」統計卡不再使用 inline style 寫死顏色', () => {
    const wrapper = mountKnowledgeBase()
    const statCards = wrapper.findAll('.stat-card')
    expect(statCards.length).toBeGreaterThan(0)
    // 找到「需更新」卡片（假設它是唯一帶有 needs-update 相關 class 的卡片）
    const needsUpdateCard = wrapper.find('.stat-card--needs-update')
    expect(needsUpdateCard.exists()).toBe(true)
    expect(needsUpdateCard.attributes('style')).toBeFalsy()
    const icon = needsUpdateCard.find('.stat-icon')
    expect(icon.attributes('style')).toBeFalsy()
    const number = needsUpdateCard.find('.stat-number')
    expect(number.attributes('style')).toBeFalsy()
  })
})

describe('KnowledgeBase 活潑感套用', () => {
  it('統計卡片列套用 lively-stagger，每張卡片套用 lively-card', () => {
    const wrapper = mountKnowledgeBase()
    const statsRow = wrapper.find('.stats-row')
    expect(statsRow.classes()).toContain('lively-stagger')
    wrapper.findAll('.stat-card').forEach(card => {
      expect(card.classes()).toContain('lively-card')
    })
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npm run test:unit -- KnowledgeBase.tokens`
Expected: FAIL —— 目前「需更新」卡片還是用 inline `style="background: #fffbeb; ..."`，沒有 `.stat-card--needs-update` class；`.stats-row`/`.stat-card` 也還沒有活潑感 class

- [ ] **Step 3: 修改 `KnowledgeBase.vue` 樣板，移除 inline 顏色改用 class**

找到現有的（統計卡片列，約在第 27-42 行附近，實際行號以樣板搜尋為準）：

```html
        <div class="stats-row" style="grid-template-columns: repeat(5, 1fr);">
          <div class="stat-card">
            <div class="stat-icon stat-icon--main">...
```
...（略去中間兩張沒有 inline 顏色的卡片，內容不變）...
```html
          <div class="stat-card" style="background: #fffbeb; border-color: #fde68a;">
            <div class="stat-icon" style="background:#fef3c7;color:#b45309;">
              <i class="material-symbols-outlined">...</i>
            </div>
            <div>
              <div class="stat-number" style="color:#b45309;">{{ stats.needsUpdate }}</div>
              <div class="stat-label">需更新</div>
            </div>
          </div>
```

改為：

```html
        <div class="stats-row lively-stagger" style="grid-template-columns: repeat(5, 1fr);">
          <div class="stat-card lively-card">
            <div class="stat-icon stat-icon--main">...
```
...（其餘 3 張非「需更新」卡片，只加 `lively-card` class，不改其他內容）...
```html
          <div class="stat-card stat-card--needs-update lively-card">
            <div class="stat-icon stat-icon--needs-update">
              <i class="material-symbols-outlined">...</i>
            </div>
            <div>
              <div class="stat-number stat-number--needs-update">{{ stats.needsUpdate }}</div>
              <div class="stat-label">需更新</div>
            </div>
          </div>
```

（`<i>` 標籤內的 icon 名稱、`{{ stats.needsUpdate }}`、`需更新` 文字都完全不變，只移除 3 個 `style="..."` 屬性、新增對應 class）

- [ ] **Step 4: 執行測試確認通過**

Run: `npm run test:unit -- KnowledgeBase.tokens`
Expected: PASS（2 個測試）——此時「需更新」卡片會暫時沒有顏色（樣式還沒補），這是預期中間狀態

- [ ] **Step 5: 在 `_KnowledgeBase.scss` 新增對應樣式**

在 `.stat-icon` 的變體規則（`&--main`/`&--green`/`&--yellow`/`&--orange`）之後，新增：

```scss
    .stat-icon--needs-update {
      background: var(--tag-amber-bg);
      i { color: var(--tag-amber-text); }
    }
```

在 `.stat-card` 規則區塊內（跟 `&--kpi` 修飾字同一層級，如果 `.stat-card--kpi` 是獨立頂層規則就對應比照），新增：

```scss
.stat-card--needs-update {
  background: var(--tag-amber-bg);
  border-color: var(--tag-amber-text);
}

.stat-number--needs-update {
  color: var(--tag-amber-text);
}
```

- [ ] **Step 6: 把 `DataSourceTab.vue` 的「自訂 API」圖示色轉成 token**

`DataSourceTab.vue` 裡 SharePoint（兩處）、Google 雲端硬碟、Slack 這 4 組是真實第三方品牌色，維持不動。但「自訂 API」是這個 app 自訂的連接類型（不是外部服務），不算品牌色例外，要轉成 token。

找到現有的（約第 198-199 行）：

```html
          <div class="app-icon" style="background:#f0f0ff;">
            <i class="material-symbols-outlined" style="color:#5c35d9;">api</i>
          </div>
```

改為：

```html
          <div class="app-icon app-icon--custom-api">
            <i class="material-symbols-outlined">api</i>
          </div>
```

在 `src/scss/components/_DataSourceTab.scss`（`DataSourceTab.vue` 對應的樣式檔案，不是 `_KnowledgeBase.scss`）裡，找到 `.app-icon` 的基底規則，新增一個修飾字：

```scss
.app-icon--custom-api {
  background: var(--tag-violet-bg);
  i { color: var(--tag-violet-text); }
}
```

- [ ] **Step 7: 執行測試確認通過**

Run: `npm run test:unit -- KnowledgeBase.tokens`
Expected: PASS（2 個測試，這次顏色也補上了）

- [ ] **Step 8: 補 dark mode 覆寫**

在 `_KnowledgeBase.scss` 檔案最後新增（比照專案既有的 dark mode 雙區塊模式）：

```scss
@mixin knowledge-base-dark {
  .stat-card {
    box-shadow: none;
  }
}

[data-theme="dark"] { @include knowledge-base-dark; }

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { @include knowledge-base-dark; }
}
```

（這裡只處理 `box-shadow` 這種在深色模式下會顯得突兀的效果；`.stat-card--needs-update`/`.stat-icon--needs-update`/`.stat-number--needs-update` 用的 `--tag-amber-bg`/`--tag-amber-text` token 本身已經有 dark 版本值，不需要額外覆寫）

- [ ] **Step 9: 執行完整測試 + build**

Run: `npm run test:unit -- KnowledgeBase`
Expected: PASS

Run: `npm run build`
Expected: 編譯成功

- [ ] **Step 10: 手動視覺檢查**

啟動 `npm run dev`，打開 `/view/KnowledgeBase`：
- light/dark 兩種模式下確認「需更新」統計卡片顏色正確（琥珀色系）
- 確認統計卡片有進場淡入 + hover 上浮效果
- 開啟「減少動態效果」，確認進場動畫停用

- [ ] **Step 11: Commit**

```bash
git add src/views/KnowledgeBase.vue src/scss/views/_KnowledgeBase.scss src/views/__tests__/KnowledgeBase.tokens.test.ts
git commit -m "feat(KnowledgeBase): 統計卡片 token 化、補 dark mode、套用活潑感系統"
```

---

### Task 4: KnowledgeDetail.vue —— Token 化 + Dark Mode + 活潑感 + `--color-danger` 修正

**Files:**
- Modify: `src/views/KnowledgeDetail.vue`（2 處寫死色改用 token）
- Modify: `src/scss/views/_KnowledgeDetail.scss`（補 dark mode、活潑感 class）
- Test: `src/views/__tests__/KnowledgeDetail.tokens.test.ts`（新檔）

**Interfaces:**
- Consumes: Task 2 拆檔完成後的 `_KnowledgeDetail.scss`
- Produces:（本任務無後續任務依賴）

- [ ] **Step 1: 寫失敗測試**

建立 `src/views/__tests__/KnowledgeDetail.tokens.test.ts`：

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import KnowledgeDetail from '../KnowledgeDetail.vue'
import { useKnowledgeStore } from '@/stores/knowledgeStore'

function mountDetailWithPipelineError() {
  setActivePinia(createPinia())
  const knowledgeStore = useKnowledgeStore()
  const knowledgeId = knowledgeStore.knowledgeList[0].id
  const knowledge = knowledgeStore.getKnowledgeById(knowledgeId)!
  knowledge.pipelineError = '轉換失敗：檔案格式不支援'
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/', component: { template: '<div/>' } }],
  })
  return mount(KnowledgeDetail, {
    props: { id: knowledgeId },
    global: {
      plugins: [router],
      stubs: { AppSkeleton: true, AppErrorState: true, AppBreadcrumb: true, CreateVersionModal: true, RestoreVersionModal: true, VersionCompareModal: true, ReviewDrawer: true, FilePreviewModal: true, ChunkPreviewTab: true, ConversionLogTab: true },
    },
  })
}

describe('KnowledgeDetail --color-danger 修正', () => {
  it('pipeline 錯誤訊息不再使用不存在的 --color-danger token', () => {
    const wrapper = mountDetailWithPipelineError()
    const errorEl = wrapper.find('.pipeline-error-text')
    expect(errorEl.exists()).toBe(true)
    const style = errorEl.attributes('style') ?? ''
    expect(style).not.toContain('--color-danger')
    expect(style).toContain('--danger')
  })
})

describe('KnowledgeDetail 活潑感套用', () => {
  it('版本歷程時間軸容器套用 lively-stagger', () => {
    setActivePinia(createPinia())
    const knowledgeStore = useKnowledgeStore()
    const knowledgeId = knowledgeStore.knowledgeList[0].id
    const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    const wrapper = mount(KnowledgeDetail, {
      props: { id: knowledgeId },
      global: {
        plugins: [router],
        stubs: { AppSkeleton: true, AppErrorState: true, AppBreadcrumb: true, CreateVersionModal: true, RestoreVersionModal: true, VersionCompareModal: true, ReviewDrawer: true, FilePreviewModal: true, ChunkPreviewTab: true, ConversionLogTab: true },
      },
    })
    // 切到版本歷程分頁
    const historyTabBtn = wrapper.findAll('.detail-tab-btn').find(b => b.text().includes('版本歷程'))
    expect(historyTabBtn).toBeTruthy()
    await historyTabBtn!.trigger('click')
    const historyList = wrapper.find('.history-item-list')
    expect(historyList.classes()).toContain('lively-stagger')
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npm run test:unit -- KnowledgeDetail.tokens`
Expected: FAIL —— 目前 pipeline 錯誤訊息用 `style="color:var(--color-danger,#dc2626);"` 且沒有 `.pipeline-error-text` class；版本歷程清單容器沒有 `.history-item-list` 包裹元素或 `lively-stagger` class

- [ ] **Step 3: 修正 `KnowledgeDetail.vue` 的 `--color-danger` 誤用**

找到現有的：

```html
              <div v-if="knowledge.pipelineError" class="fs-12 mt-2" style="color:var(--color-danger,#dc2626);">
                {{ knowledge.pipelineError }}
              </div>
```

改為：

```html
              <div v-if="knowledge.pipelineError" class="fs-12 mt-2 pipeline-error-text" style="color:var(--danger);">
                {{ knowledge.pipelineError }}
              </div>
```

- [ ] **Step 4: 修正版本無內容時的 fallback 顏色**

找到現有的（computed 內的字串樣板，約在腳本區塊中）：

```typescript
  return '<span style="color:#999">（此版本無內容）</span>'
```

改為：

```typescript
  return '<span style="color:var(--text-faint)">（此版本無內容）</span>'
```

- [ ] **Step 5: 找到版本歷程時間軸容器，加上包裹 class**

找到版本歷程分頁裡 `v-for="version in ..." class="history-item"` 的外層容器（目前可能是直接 `v-for` 在一個沒有專屬 class 的 `<div>` 上），確認外層容器有一個穩定的 class 名稱；如果沒有，新增 `class="history-item-list"` 到該容器上。加上 `lively-stagger`：

```html
<div class="history-item-list lively-stagger">
  <div v-for="version in ..." :key="version.id" class="history-item lively-card">
    ...
  </div>
</div>
```

（`.history-item` 保留既有的 hover 效果——先檢查 `_KnowledgeDetail.scss` 裡 `.history-item:hover` 現有規則，若跟 `.lively-card` 的 hover 有重疊的 `transform`/`box-shadow` 宣告，比照 Task 3 的教訓移除 `.history-item` 自己的 `transform`/`box-shadow` hover 宣告，改由 `.lively-card` 統一提供，只保留 `.history-item` 自己不會跟 `.lively-card` 衝突的部分，例如 `border-left` 之類的狀態樣式）

- [ ] **Step 6: 執行測試確認通過**

Run: `npm run test:unit -- KnowledgeDetail.tokens`
Expected: PASS（2 個測試）

- [ ] **Step 7: 補 dark mode 覆寫**

在 `_KnowledgeDetail.scss` 檔案最後新增：

```scss
@mixin knowledge-detail-dark {
  .detail-header-card,
  .content-preview {
    box-shadow: none;
  }
}

[data-theme="dark"] { @include knowledge-detail-dark; }

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { @include knowledge-detail-dark; }
}
```

- [ ] **Step 8: 執行完整測試 + build**

Run: `npm run test:unit -- KnowledgeDetail`
Expected: PASS

Run: `npm run build`
Expected: 編譯成功

- [ ] **Step 9: 手動視覺檢查**

啟動 `npm run dev`，打開任一知識條目的 `/view/KnowledgeDetail/:id`：
- 手動觸發一個 `pipelineError` 情境（或直接在瀏覽器 console 呼叫 store 修改資料），確認錯誤文字顏色正確且會跟著 dark mode 切換
- 切到「版本歷程」分頁，確認清單有進場動畫 + hover 效果
- light/dark 兩種模式下確認整頁顏色都正確

- [ ] **Step 10: Commit**

```bash
git add src/views/KnowledgeDetail.vue src/scss/views/_KnowledgeDetail.scss src/views/__tests__/KnowledgeDetail.tokens.test.ts
git commit -m "fix(KnowledgeDetail): 修正 --color-danger 誤用、補 dark mode、套用活潑感系統"
```

---

### Task 5: KnowledgeEditor.vue —— 3 步驟向導化

**Files:**
- Modify: `src/views/KnowledgeEditor.vue`（整份重寫樣板為 3 步驟向導，script 新增 `currentStep`/`STEPS`/驗證邏輯）
- Modify: `src/scss/views/_KnowledgeEditor.scss`（新增 stepper 樣式，比照 `_SkillEditor.scss` 的 `.se-*` 視覺語言）
- Test: `src/views/__tests__/KnowledgeEditor.wizard.test.ts`（新檔）

**Interfaces:**
- Consumes: Task 2 產生的 `_KnowledgeEditor.scss`（已包含搬移過來的 `.editor-card`/`.field-group`/`.editor-toolbar`/`.editor-textarea`/`.source-files-list`/`.source-file-item`/`.meta-info-list`/`.meta-info-item`/`.tags-input-wrap` 規則，都改成 `.KnowledgeEditor` 外層）
- Produces:（本任務無後續任務依賴）

- [ ] **Step 1: 寫失敗測試**

建立 `src/views/__tests__/KnowledgeEditor.wizard.test.ts`：

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import KnowledgeEditor from '../KnowledgeEditor.vue'
import { useKnowledgeStore } from '@/stores/knowledgeStore'

function mountEditor() {
  setActivePinia(createPinia())
  const knowledgeStore = useKnowledgeStore()
  const knowledgeId = knowledgeStore.knowledgeList[0].id
  const knowledge = knowledgeStore.getKnowledgeById(knowledgeId)!
  const versionId = knowledge.versions.find(v => v.status === 'draft')?.id ?? knowledge.versions[0].id
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/', component: { template: '<div/>' } }],
  })
  return mount(KnowledgeEditor, {
    props: { knowledgeId, versionId },
    global: {
      plugins: [router],
      stubs: { AppBreadcrumb: true, compDropDown: true, SubmitReviewModal: true },
    },
  })
}

describe('KnowledgeEditor 3 步驟向導', () => {
  it('預設顯示 Step 0（基本資訊），有 3 個步驟指示器', () => {
    const wrapper = mountEditor()
    const steps = wrapper.findAll('.ke-step')
    expect(steps).toHaveLength(3)
    expect(steps[0].classes()).toContain('is-active')
    expect(wrapper.find('input.custom-input').exists()).toBe(true) // 標題欄位在 Step 0
  })

  it('Step 0 標題為空時，下一步按鈕disabled', () => {
    const wrapper = mountEditor()
    const titleInput = wrapper.find('.ke-body input.custom-input')
    titleInput.setValue('')
    const nextBtn = wrapper.find('.ke-footer-right button.custom-main-btn')
    expect(nextBtn.attributes('disabled')).toBeDefined()
  })

  it('填寫標題後可以進到 Step 1（內容與來源）', async () => {
    const wrapper = mountEditor()
    const titleInput = wrapper.find('.ke-body input.custom-input')
    await titleInput.setValue('測試知識標題')
    const nextBtn = wrapper.find('.ke-footer-right button.custom-main-btn')
    await nextBtn.trigger('click')
    const steps = wrapper.findAll('.ke-step')
    expect(steps[1].classes()).toContain('is-active')
    expect(wrapper.find('textarea.editor-textarea').exists()).toBe(true) // 內容欄位在 Step 1
  })

  it('Step 2（確認與發布）顯示確認卡片內容摘要', async () => {
    const wrapper = mountEditor()
    await wrapper.find('.ke-body input.custom-input').setValue('測試知識標題')
    await wrapper.find('.ke-footer-right button.custom-main-btn').trigger('click')
    await wrapper.find('textarea.editor-textarea').setValue('這是內容')
    await wrapper.find('.ke-footer-right button.custom-main-btn').trigger('click')
    const steps = wrapper.findAll('.ke-step')
    expect(steps[2].classes()).toContain('is-active')
    expect(wrapper.find('.ke-confirm-grid').exists()).toBe(true)
    expect(wrapper.text()).toContain('測試知識標題')
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npm run test:unit -- KnowledgeEditor.wizard`
Expected: FAIL —— 目前樣板是單頁表單，沒有 `.ke-step`/`.ke-body`/`.ke-footer-right`/`.ke-confirm-grid` 這些 class

- [ ] **Step 3: 整份重寫 `KnowledgeEditor.vue` 樣板**

```vue
<template>
  <div class="KnowledgeBase KnowledgeEditor views-page">
    <div class="views-page-content-box" v-if="draft">

      <!-- 頂部麵包屑 -->
      <div class="page-banner">
        <div>
          <AppBreadcrumb />
          <div class="banner-title">編輯草稿 {{ draft.versionNumber }}</div>
        </div>
      </div>

      <!-- 操作列：儲存草稿在任何步驟都可以按 -->
      <div class="views-page-header">
        <div class="d-flex align-items-center"></div>
        <div class="header-right-box">
          <button class="custom-btn" @click="handleSave">
            <i class="material-symbols-outlined">save</i>
            儲存草稿
          </button>
        </div>
      </div>

      <!-- 提示條：說明草稿不影響已發布版本 -->
      <div class="editor-banner">
        <i class="material-symbols-outlined">info</i>
        <div>
          您正在編輯 <strong>{{ draft.versionNumber }}</strong> 草稿版本。
          目前的正式發布版本仍為 <strong>{{ knowledge?.versions.find(v => v.status === 'active')?.versionNumber ?? '—' }}</strong>，
          在審核通過並發布前，所有使用者看到的內容均不會改變。
        </div>
      </div>

      <!-- 步驟指示器 -->
      <div class="ke-stepper">
        <button
          type="button"
          v-for="(label, i) in STEPS"
          :key="i"
          :class="['ke-step', { 'is-active': currentStep === i, 'is-done': currentStep > i }]"
          :disabled="currentStep <= i"
          :aria-current="currentStep === i ? 'step' : undefined"
          @click="currentStep > i ? (currentStep = i) : undefined"
        >
          <span class="ke-step-bubble">
            <i v-if="currentStep > i" class="material-symbols-outlined">check</i>
            <span v-else>{{ i + 1 }}</span>
          </span>
          <span class="ke-step-label">{{ label }}</span>
        </button>
        <div class="ke-step-track">
          <div class="ke-step-fill" :style="{ width: fillWidth }" />
        </div>
      </div>

      <!-- 步驟內容 -->
      <div class="ke-body">

        <!-- Step 0：基本資訊 -->
        <template v-if="currentStep === 0">
          <div class="editor-card">
            <div class="field-group">
              <label class="field-label">知識標題 <span class="required">*</span></label>
              <input
                type="text"
                class="custom-input w-100"
                v-model="formData.title"
                placeholder="輸入知識條目標題"
              />
            </div>
            <div class="field-group">
              <label class="field-label">內容摘要</label>
              <textarea
                class="custom-input w-100"
                rows="3"
                v-model="formData.summary"
                placeholder="一句話說明此知識條目的用途"
              ></textarea>
            </div>
            <div class="field-group">
              <label class="field-label">分類</label>
              <compDropDown
                :options="[
                  { name: '商品文件', value: '商品文件' },
                  { name: '系統文件', value: '系統文件' },
                  { name: '客服知識', value: '客服知識' },
                  { name: '規則說明', value: '規則說明' },
                  { name: '市場情報', value: '市場情報' },
                ]"
                :show-search="false"
                :default-value="formData.category"
                class="w-100"
                @select="(item: any) => formData.category = String(item.value)"
              />
            </div>
            <div class="field-group">
              <label class="field-label">標籤</label>
              <div class="tags-input-wrap" @click="focusTagInput">
                <span class="tag-chip" v-for="tag in formData.tags" :key="tag">
                  {{ tag }}
                  <i class="material-symbols-outlined" @click.stop="removeTag(tag)">close</i>
                </span>
                <input
                  ref="tagInputRef"
                  v-model="tagInputValue"
                  placeholder="輸入標籤後按 Enter"
                  @keydown.enter.prevent="addTag"
                  @keydown.backspace="handleBackspaceTag"
                />
              </div>
            </div>
          </div>
        </template>

        <!-- Step 1：內容與來源 -->
        <template v-else-if="currentStep === 1">
          <div class="editor-card">
            <div class="field-group">
              <label class="field-label">知識內容 <span class="required">*</span></label>
              <div class="editor-toolbar">
                <span class="toolbar-badge">Markdown</span>
                <span class="fc-grey-1 fs-12">支援 Markdown 格式，未來將支援所見即所得編輯器</span>
              </div>
              <textarea
                class="custom-input w-100 editor-textarea"
                rows="18"
                v-model="formData.content"
                placeholder="在此輸入詳細知識內容（支援 Markdown 格式）

# 標題
## 子標題

- 列點項目
- 另一個項目

1. 有序列表
2. 第二項"
              ></textarea>
            </div>
            <div class="field-group">
              <label class="field-label">關聯來源檔案</label>
              <div class="source-files-list" v-if="formData.sourceFiles.length">
                <div
                  class="source-file-item"
                  v-for="file in formData.sourceFiles"
                  :key="file.fileId"
                >
                  <i class="material-symbols-outlined fs-16">description</i>
                  <span class="flex-1 fs-13">{{ file.fileName }}</span>
                  <i class="material-symbols-outlined fs-16 cursor-pointer fc-grey-1" @click="removeSourceFile(file.fileId)">close</i>
                </div>
              </div>
              <button class="custom-btn w-100 mt-2" @click="popDialog.alert('功能開發中：將開啟共用檔案管理選擇器')">
                <i class="material-symbols-outlined">add</i>
                從共用檔案管理選取
              </button>
            </div>
            <div class="field-group">
              <label class="field-label">可見範圍</label>
              <compDropDown
                :options="[
                  { name: '全部成員', value: 'ALL' },
                  { name: '僅限本團隊', value: 'TEAM' },
                  { name: '僅限管理者', value: 'MANAGERS' },
                ]"
                :show-search="false"
                :default-value="formData.visibility"
                class="w-100"
                @select="(item: any) => formData.visibility = item.value"
              />
            </div>
          </div>
        </template>

        <!-- Step 2：確認與發布 -->
        <template v-else>
          <h3 class="ke-confirm-title">{{ formData.title }}</h3>

          <div class="ke-confirm-grid lively-stagger">
            <div class="ke-confirm-group lively-card">
              <div class="ke-confirm-group-hd">
                <i class="material-symbols-outlined lively-icon">description</i>內容摘要
              </div>
              <div class="ke-confirm-row">
                <span class="ke-confirm-key">分類</span>
                <span class="ke-confirm-val">
                  <span v-if="formData.category">{{ formData.category }}</span>
                  <span v-else class="ke-empty">（未選擇）</span>
                </span>
              </div>
              <div class="ke-confirm-row">
                <span class="ke-confirm-key">標籤</span>
                <span class="ke-confirm-val">
                  <span v-if="formData.tags.length">{{ formData.tags.join('、') }}</span>
                  <span v-else class="ke-empty">（未設定）</span>
                </span>
              </div>
              <div class="ke-confirm-row">
                <span class="ke-confirm-key">內容字數</span>
                <span class="ke-confirm-val">{{ formData.content.length }} 字元</span>
              </div>
              <div class="ke-confirm-row">
                <span class="ke-confirm-key">來源檔案</span>
                <span class="ke-confirm-val">
                  <span v-if="formData.sourceFiles.length">{{ formData.sourceFiles.length }} 個檔案</span>
                  <span v-else class="ke-empty">（未關聯）</span>
                </span>
              </div>
            </div>

            <div class="ke-confirm-group lively-card">
              <div class="ke-confirm-group-hd">
                <i class="material-symbols-outlined lively-icon">settings</i>狀態資訊
              </div>
              <div class="ke-confirm-row">
                <span class="ke-confirm-key">狀態</span>
                <span class="ke-confirm-val">
                  <span :class="['status-badge', `status-badge--${draft.status}`]">
                    {{ statusLabelMap[draft.status] ?? draft.status }}
                  </span>
                </span>
              </div>
              <div class="ke-confirm-row">
                <span class="ke-confirm-key">草稿版本</span>
                <span class="ke-confirm-val">{{ draft.versionNumber }}</span>
              </div>
              <div class="ke-confirm-row">
                <span class="ke-confirm-key">前一版本</span>
                <span class="ke-confirm-val">{{ knowledge?.versions.find(v => v.status === 'active')?.versionNumber ?? '—' }}</span>
              </div>
              <div class="ke-confirm-row">
                <span class="ke-confirm-key">最後編輯</span>
                <span class="ke-confirm-val">{{ draft.lastUpdateBy }}</span>
              </div>
            </div>
          </div>

          <div class="editor-card">
            <div class="field-group">
              <label class="field-label">本次更新說明 <span class="required">*</span></label>
              <textarea
                class="custom-input w-100"
                rows="3"
                v-model="formData.updateNote"
                placeholder="例如：修正產品保固說明有誤的段落"
              ></textarea>
            </div>
          </div>
        </template>

      </div>

      <!-- 底部導覽 -->
      <div class="ke-footer">
        <button v-if="currentStep > 0" class="custom-btn" @click="currentStep--">
          <i class="material-symbols-outlined">arrow_back</i>上一步
        </button>
        <span v-else />
        <div class="ke-footer-right">
          <button
            v-if="currentStep < STEPS.length - 1"
            class="custom-btn custom-main-btn"
            :disabled="!canGoNext"
            @click="currentStep++"
          >
            下一步<i class="material-symbols-outlined">arrow_forward</i>
          </button>
          <button
            v-else
            class="custom-btn custom-main-btn"
            :disabled="!formData.updateNote.trim()"
            @click="isReviewModalOpen = true"
          >
            <i class="material-symbols-outlined">send</i>
            送出審核
          </button>
        </div>
      </div>

    </div>

    <!-- 找不到草稿 -->
    <div class="views-page-content-box text-center p-5" v-else>
      <i class="material-symbols-outlined fs-48 fc-grey-1">search_off</i>
      <h4 class="mt-3">找不到草稿版本</h4>
      <button class="custom-btn mt-3" @click="router.push({ name: 'KnowledgeBase' })">返回列表</button>
    </div>

    <!-- 送審 Modal -->
    <SubmitReviewModal
      v-model="isReviewModalOpen"
      @confirm="handleSubmitReview"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useKnowledgeStore } from '@/stores/knowledgeStore';
import type { SourceFileRef } from '@/stores/knowledgeStore';
import compDropDown from '@/components/compDropDown/compDropDown.vue';
import SubmitReviewModal from '@/components/Knowledge/SubmitReviewModal.vue';
import popDialog from '@/services/popDialog';
import AppBreadcrumb from '@/components/AppBreadcrumb.vue';
import { useBreadcrumb } from '@/composables/useBreadcrumb';

const props = defineProps<{
  knowledgeId: string;
  versionId: string;
}>();

const router = useRouter();
const knowledgeStore = useKnowledgeStore();

const knowledge = computed(() => knowledgeStore.getKnowledgeById(props.knowledgeId));
const draft = computed(() => knowledgeStore.getVersionById(props.knowledgeId, props.versionId));

const { setDynamic } = useBreadcrumb();

watch(knowledge, (val) => {
  if (val?.title) setDynamic(val.title);
}, { immediate: true });

const statusLabelMap: Record<string, string> = {
  draft:    '草稿',
  rejected: '已退回',
};

const STEPS = ['基本資訊', '內容與來源', '確認與發布'] as const;
const currentStep = ref(0);

const fillWidth = computed(() => `${(currentStep.value / (STEPS.length - 1)) * 100}%`);

const canGoNext = computed(() => {
  if (currentStep.value === 0) return !!formData.title.trim();
  if (currentStep.value === 1) return !!formData.content.trim();
  return true;
});

const formData = reactive({
  title: '',
  summary: '',
  content: '',
  category: '',
  tags: [] as string[],
  visibility: 'ALL' as 'ALL' | 'TEAM' | 'MANAGERS',
  sourceFiles: [] as SourceFileRef[],
  updateNote: '',
});

// 標籤輸入
const tagInputRef = ref<HTMLInputElement | null>(null);
const tagInputValue = ref('');

function focusTagInput() {
  tagInputRef.value?.focus();
}

function addTag() {
  const val = tagInputValue.value.trim();
  if (val && !formData.tags.includes(val)) {
    formData.tags.push(val);
  }
  tagInputValue.value = '';
}

function removeTag(tag: string) {
  formData.tags = formData.tags.filter(t => t !== tag);
}

function handleBackspaceTag() {
  if (!tagInputValue.value && formData.tags.length) {
    formData.tags.pop();
  }
}

function removeSourceFile(fileId: string) {
  formData.sourceFiles = formData.sourceFiles.filter(f => f.fileId !== fileId);
}

onMounted(() => {
  if (draft.value) {
    formData.title = draft.value.title;
    formData.summary = draft.value.summary;
    formData.content = draft.value.content;
    formData.category = knowledge.value?.category ?? '';
    formData.tags = [...(draft.value.tags ?? [])];
    formData.visibility = 'ALL';
    formData.sourceFiles = [...(draft.value.sourceFiles ?? [])];
    formData.updateNote = draft.value.updateNote;
  }
});

function handleSave() {
  if (!formData.updateNote.trim()) {
    popDialog.alert('請填寫本次更新說明後再儲存。');
    return;
  }
  knowledgeStore.saveDraft(props.knowledgeId, props.versionId, { ...formData });
  popDialog.toast('草稿已儲存', 1500);
}

const isReviewModalOpen = ref(false);

function handleSubmitReview(reviewData: { reviewer: string; note: string }) {
  if (!formData.updateNote.trim()) {
    popDialog.alert('請填寫本次更新說明後再送審。');
    return;
  }
  knowledgeStore.saveDraft(props.knowledgeId, props.versionId, { ...formData });
  knowledgeStore.submitForReview(props.knowledgeId, props.versionId, reviewData.reviewer, reviewData.note);
  router.push({ name: 'KnowledgeBase' }).then(() => {
    popDialog.alert('已送出審核！等待審核人批准後即可發布。');
  });
}
</script>
```

**注意**：`handleSave()` 仍然要求 `updateNote` 已填寫才能儲存草稿——這是延續現有行為（不是本次新增的限制），但因為「本次更新說明」欄位現在移到 Step 2 才會顯示，使用者若在 Step 0/1 就按「儲存草稿」，會看到「請填寫本次更新說明後再儲存」的提示但看不到那個欄位在哪。這是延續原本就存在的驗證邏輯與其今天在單頁表單上的行為一致（原本欄位在右側欄位一樣可能被捲動出視窗外），不是本次向導化引入的新問題，不用額外處理，維持現狀。

- [ ] **Step 4: 執行測試確認通過**

Run: `npm run test:unit -- KnowledgeEditor.wizard`
Expected: PASS（4 個測試）——此時畫面還沒有 Step 5 的新樣式，stepper 部分會是無樣式的堆疊

- [ ] **Step 5: 在 `_KnowledgeEditor.scss` 新增 stepper 樣式**

在檔案最後（Task 2 搬移過來的內容之後）新增，完全比照 `_SkillEditor.scss` 的 `.se-stepper`/`.se-step`/`.se-step-bubble`/`.se-step-label`/`.se-step-track`/`.se-step-fill` 視覺語言，只是 class 前綴從 `se-` 換成 `ke-`：

```scss
.KnowledgeEditor {
  .ke-stepper {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 0;
    margin-bottom: 36px;
    max-width: 560px;
  }

  .ke-step {
    border: none;
    background: transparent;
    font: inherit;
    text-align: inherit;
    padding: 0;
    &:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
      border-radius: 6px;
    }
    &:disabled { cursor: default; }
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    flex: 1;
    position: relative;
    z-index: 1;
    cursor: default;

    &.is-done { cursor: pointer; }
  }

  .ke-step-bubble {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid var(--divider-a50);
    background: var(--surface);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-muted);
    transition: background 0.2s, border-color 0.2s, color 0.2s;

    i { font-size: 16px; }

    .is-active & {
      border-color: var(--primary);
      background: var(--primary);
      color: var(--primary-fg);
    }
    .is-done & {
      border-color: var(--primary);
      background: var(--accent-soft);
      color: var(--primary);
    }
  }

  .ke-step-label {
    font-size: 12px;
    color: var(--text-muted);
    white-space: nowrap;

    .is-active & { color: var(--primary); font-weight: 600; }
    .is-done  & { color: var(--primary-hover); }
  }

  .ke-step-track {
    position: absolute;
    top: 15px;
    left: 16px;
    right: 16px;
    height: 2px;
    background: var(--divider-a50);
    z-index: 0;

    .ke-step-fill {
      height: 100%;
      background: var(--primary);
      transition: width 0.3s ease;
    }
  }

  .ke-body {
    max-width: 680px;
    margin-bottom: 28px;
  }

  .ke-footer {
    max-width: 680px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 16px;
    border-top: 1px solid var(--divider-a50);
  }

  .ke-footer-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  // 確認頁：標題 + 分組卡片（比照 SkillEditor 的 se-confirm-* 語言）
  .ke-confirm-title {
    font-size: 22px;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 16px;
  }

  .ke-confirm-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;

    @media (max-width: $breakpoint-tablet) { grid-template-columns: 1fr; }
  }

  .ke-confirm-group {
    background: var(--surface);
    border: 1px solid var(--divider-a50);
    border-radius: 14px;
    padding: 16px 18px;
  }

  .ke-confirm-group-hd {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 12px;

    i { font-size: 17px; color: var(--primary); }
  }

  .ke-confirm-row {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 8px 0;
    border-bottom: 1px solid var(--divider-a50);

    &:last-child { border-bottom: none; }
  }

  .ke-confirm-key {
    flex-shrink: 0;
    width: 80px;
    font-size: 13px;
    color: var(--text-muted);
    font-weight: 500;
  }

  .ke-confirm-val {
    flex: 1;
    font-size: 13px;
    color: var(--text);
    line-height: 1.5;
    word-break: break-word;
  }

  .ke-empty { color: var(--text-faint); font-style: italic; }
}
```

- [ ] **Step 6: 執行完整測試 + build**

Run: `npm run test:unit -- KnowledgeEditor`
Expected: PASS

Run: `npm run build`
Expected: 編譯成功

- [ ] **Step 7: 手動視覺檢查**

啟動 `npm run dev`，打開任一草稿版本的 `/view/KnowledgeEditor/:knowledgeId/:versionId`：
- 確認 3 個步驟可以正常切換（點擊已完成的步驟圓點可以跳回去，未完成的步驟不能點）
- Step 0 標題空白時「下一步」disabled；Step 1 內容空白時「下一步」disabled
- Step 2 顯示確認卡片，內容摘要跟狀態資訊都正確
- 「送出審核」在更新說明空白時 disabled
- 「儲存草稿」在任何步驟都可以按
- light/dark 兩種模式下顏色都正確

- [ ] **Step 8: Commit**

```bash
git add src/views/KnowledgeEditor.vue src/scss/views/_KnowledgeEditor.scss src/views/__tests__/KnowledgeEditor.wizard.test.ts
git commit -m "feat(KnowledgeEditor): 從單頁表單改為 3 步驟向導，比照 SkillEditor stepper 視覺語言"
```

---

## 執行後檢查

五個任務都完成後，執行一次全套驗證：

```bash
npm run test:unit
npm run build
npm run type-check
npm run lint
```

`test:unit`、`build` 必須全部通過；`type-check`、`lint` 只需確認沒有比修改前更多的錯誤數（既有技術債不在本次範圍）。
