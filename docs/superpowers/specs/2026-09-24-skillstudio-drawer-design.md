# SkillStudio 抽屜化設計

## 背景與動機

`技能管理`（SkillManagement.vue）點選「新增技能」「編輯」「建議佇列 → 建立」，目前都是 `router.push({ name: 'SkillStudio' })`，離開技能管理列表整頁導到 `/view/SkillStudio`。使用者回報這種導頁讓人搞不清楚自己「還在不在技能管理的情境裡」。

目標：從技能管理頁觸發的新增/編輯，改用近全螢幕的側邊抽屜（slide-in drawer）呈現 SkillStudio 工作區，讓技能管理列表在背景隱約可見，同時不犧牲現有功能完整度（左右兩欄、預覽/測試 tab、附加檔案、沙盒連結）。

**歷史脈絡（重要，勿走回頭路）**：[SkillManagement.vue:762-763](../../../src/views/SkillManagement.vue#L762) 的既有註解記載，「對話修改」曾經用小型 modal 呈現，因為畫面太擠而放棄，改成獨立頁面。這次的抽屜方案是「近全螢幕、完整保留兩欄工作區」，與當時被放棄的小 modal 不是同一回事——**如果之後有人想把抽屜縮小到只放對話、把預覽/測試移出去，等於是走回被否決過的路，應該先重新評估，而不是直接改**。

## 範圍

**改成抽屜**（都是從技能管理頁本身觸發）：
- 「建立技能」選擇框 → 對話建立 / 積木建立（`handleCreateWithChat` / `handleCreateWithBlocks`）
- 「編輯」→「跟 Agent 對話修改」（`handleChatEdit`）
- 建議佇列 → 「建立」（`buildSuggestion`，沿用 `setSkillHandoff` + `?from=` 交接機制）

**維持現有獨立頁面**（不是從技能管理頁觸發）：
- conv4（AiViewer 對話交接）→ 仍走 `/view/SkillStudio?from=conv4`
- 左側導覽選單直接點「AI 賦能」→ 仍走 `/view/SkillStudio`（無 query，顯示 SkillMethodChooser）
- `handleCreateManually` / `handleDirectEdit`（SkillEditor 三步驟表單精靈）→ 不受影響，本來就是另一條路

## 架構：工作區與外殼拆分

現有 `SkillStudio.vue` 一個檔案同時負責：① 頁面外殼（page-banner + breadcrumb）、② 路由層邏輯（`applyQuery`、`onBeforeRouteLeave`/`onBeforeRouteUpdate`）、③ 實際工作區（左側對話/積木 + 右側預覽/測試兩欄）。

拆成：

### `SkillStudioWorkspace.vue`（新增）

從 `SkillStudio.vue` 抽出③，內部持有 `useSkillStudioConversation()`，對外介面：

- **Props**：`initialQuery: { skillId?: string; method?: 'chat' | 'blocks'; from?: string; tab?: 'preview' | 'test' }`（形狀對應現在的 `route.query`）
- **Emits**：`close`（使用者觸發「返回原本的對話」或關閉抽屜時，由外殼決定實際導去哪）

內部邏輯（`applyQuery`、`onSave`、`onSwitchSkill`、`onNewSkill`、`guardDirty`、`handoffOrigin`、`nameConflict`）幾乎原封不動搬過來，觸發來源從「`route.query` watch」改成「`props.initialQuery` watch」。`guardDirty` 對外暴露（`defineExpose`）供外殼在自己的離開/關閉守衛裡呼叫，避免兩邊各寫一套確認邏輯。

### `SkillStudioModeHeader.vue`（新增，小元件）

從目前 page-banner 裡的「新增技能/修改技能標題 + `ssc-mode-chip` 色徽」邏輯抽出，props 是 `mode: 'create' | 'edit'` 與 `skillName?: string`。兩個外殼都用它，維持先前那次 UX 改動（[SkillStudio.vue](../../../src/views/SkillStudio.vue) 的標題徽章）不用複製貼上。

### 外殼一：`SkillStudio.vue`（頁面殼，改造後）

保留 page-banner、`AppBreadcrumb`、`onBeforeRouteLeave`/`onBeforeRouteUpdate` 守衛。內部改為：

```html
<div class="page-banner">
  <AppBreadcrumb />
  <SkillStudioModeHeader :mode="workspaceRef?.mode" :skill-name="workspaceRef?.draft.name" />
</div>
<SkillStudioWorkspace ref="workspaceRef" :initial-query="route.query" @close="router.push({ name: 'AiViewer' })" />
```

`onBeforeRouteLeave` 透過 `workspaceRef.value.isDirty` 判斷是否要跳確認對話框（沿用 `guardDirty` 裡同一顆 `popDialog.confirm`）。

### 外殼二：`SkillStudioDrawer.vue`（新增，抽屜殼）

掛載於 `SkillManagement.vue` 內，近全螢幕滑入面板（從右側滑入），背後疊一層半透明遮罩讓技能管理列表隱約可見。頂部一列放 `SkillStudioModeHeader` + 關閉鈕（X），下方是 `SkillStudioWorkspace`。

```html
<div v-if="drawerOpen" class="ssd-backdrop" @click.self="requestClose">
  <div class="ssd-panel">
    <div class="ssd-head">
      <SkillStudioModeHeader :mode="..." :skill-name="..." />
      <button class="ssd-close-btn" @click="requestClose">...</button>
    </div>
    <SkillStudioWorkspace ref="workspaceRef" :initial-query="drawerQuery" @close="requestClose" />
  </div>
</div>
```

## 資料流：網址參數驅動開關

不新增額外的旗標參數（例如 `studio=1`），直接沿用既有的 `skillId` / `method` / `from` 三個參數判斷「抽屜該不該開」，與現在 `SkillStudio.vue` 的 `applyQuery()` 判斷式邏輯一致：

```ts
const drawerOpen = computed(() => !!(route.query.skillId || route.query.method || route.query.from))
const drawerQuery = computed(() => ({
  skillId: route.query.skillId,
  method: route.query.method,
  from: route.query.from,
  tab: route.query.tab,
}))
```

重新整理或分享帶有這些參數的 `/view/Skills` 連結時，`SkillManagement.vue` 掛載時就會依 `drawerOpen` 自動把抽屜攤開到同一個編輯狀態，不需要額外的初始化流程。

**入口點改法**（都在 `SkillManagement.vue`，把 `router.push({ name: 'SkillStudio', query })` 換成 `router.push({ query })`，即在同一個 `/view/Skills` 路由上換 query，不切換路由名稱）：

| 函式 | 位置 | 改法 |
|---|---|---|
| `handleCreateWithChat` | :692 | push `{ query: { method: 'chat' } }` |
| `handleCreateWithBlocks` | :696 | push `{ query: { method: 'blocks' } }` |
| `handleChatEdit` | :764 | push `{ query: { skillId } }` |
| `buildSuggestion` | :678 | push `{ query: { from: s.conversationId } }`（`setSkillHandoff` 呼叫不變） |

## 未儲存變更的離開/關閉守衛

沿用現有 `guardDirty()` 寫法，新增/搬移觸發點：

1. **抽屜的 X／點背景遮罩／Esc** → `requestClose()` 內呼叫 `workspaceRef.value.guardDirty(() => router.replace({ query: { ...route.query, skillId: undefined, method: undefined, from: undefined } }))`，跳的是同一顆 `popDialog.confirm`。
2. **從左側導覽離開 `/view/Skills`（抽屜開著且有未儲存變更）** → `onBeforeRouteLeave`（寫在 `SkillManagement.vue`），邏輯與現在 `SkillStudio.vue` 的守衛一模一樣，只是搬家。
3. **抽屜開著時，使用者點列表上另一顆技能的「編輯」（换目標）** → 一樣先 `guardDirty()`，通過才套用新的 query（`onBeforeRouteUpdate` 對應邏輯，或在 `route.query` 的 watcher 裡手動判斷）。

## 樣式

新增 `src/scss/components/_SkillStudioDrawer.scss`，沿用現有 `--divider-a50`、`--surface`、`--page-bg` 等 CSS 變數，不發明新色彩系統。依 `AI_RULES.md` 規範，記得在 `src/scss/components/_index.scss` 手動 `@forward` 這個新檔案。

## 測試計畫

- **`SkillStudioWorkspace.test.ts`（新增）**：把現有 `SkillStudio.test.ts` 裡工作區行為相關的測試（切換技能、儲存、積木模式、name-conflict、conv4 交接）搬過來，直接掛載 `SkillStudioWorkspace` 並傳 `initial-query` prop，不經過路由。
- **`SkillStudio.test.ts`（保留，瘦身）**：只留頁面殼相關斷言——page-banner 標題徽章、`onBeforeRouteLeave`/`onBeforeRouteUpdate` 路由守衛、conv4 交接的返回連結。
- **`SkillManagement.test.ts`（擴充）**：
  - 帶 `skillId`/`method`/`from` query 掛載 → 抽屜自動打開，內容正確
  - 不帶 query 掛載 → 抽屜不顯示
  - 三個入口點（建立-對話/建立-積木/編輯/建議建立）點擊後 query 正確、抽屜打開
  - 抽屜開著且有未儲存變更時，點 X／背景／換編輯目標 → 跳出 `popDialog.confirm`，取消則抽屜不關閉
  - 抽屜開著、無未儲存變更時，離開 `/view/Skills` → 不跳確認框，直接離開

## 遷移順序（維持每一步可回滾、可跑測試）

1. 抽出 `SkillStudioWorkspace.vue`，`SkillStudio.vue` 改為使用它，跑一次既有 `SkillStudio.test.ts` 確保行為不變（此時尚未動 `SkillManagement.vue`）。
2. 抽出 `SkillStudioModeHeader.vue`，兩邊 page-banner 邏輯都換成用它。
3. 新增 `SkillStudioDrawer.vue` + `_SkillStudioDrawer.scss`。
4. 改 `SkillManagement.vue` 三個入口點（含 `buildSuggestion`）的 `router.push`，掛載 `SkillStudioDrawer`。
5. 補齊測試計畫裡列出的三份測試檔案。

## 明確排除（YAGNI）

- 不處理「抽屜內用左側對話下拉切換技能」時網址是否同步更新 `skillId` 的問題——這是現有 `onSwitchSkill` 就存在的行為（切換技能不改網址），本次不擴大範圍去修。
- 不改動 `SkillEditor`（三步驟表單精靈）的任何呈現方式。
- 不處理行動裝置窄螢幕下抽屜的另外版型優化——沿用 `_SkillStudio.scss` 現有 `@media (max-width: 1023px)` 斷點的堆疊邏輯即可。
