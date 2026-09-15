# AI 賦能（SkillStudio）：對話式建立／修改／測試技能 ＋ 專案內 Agent 發起建立個人技能 — 設計文件

日期：2026-09-15
狀態：待使用者審閱
涉及模組：側邊選單「AI 技能」群組、新頁面 `SkillStudio.vue`、`skillStore.ts`、AiViewer 對話（conv4 接線）、`SkillManagement.vue`（「跟 Agent 對話修改」入口改導頁）

---

## 1. 背景

「AI 技能」群組目前有兩個子項：技能管理（`/view/Skills`）與技能測試沙盒（`/view/SkillTest`）。跟技能有關的「對話式」互動散落在三個地方，彼此沒有串起來：

| 位置 | 現況 | 問題 |
|---|---|---|
| AiViewer conv4「產品銷售報告整理」（[AiViewerRightBox.vue:3055](../../../src/components/AiViewer/AiViewerRightBox.vue#L3055)） | AI 大腦在完成報告後主動問「要不要把這個流程存成 Skill」→ 預覽卡 → 「確認無誤，儲存」→ 連到技能管理 | 純視覺：沒有 import `skillStore`，按「儲存」不會建立任何 Skill；預覽卡是行內 `style` 寫死 hex 的 HTML 字串；四支函式與兩個 one-shot 旗標全部綁死在 conv4，其他腳本無法重用 |
| 技能管理「跟 Agent 對話修改」（`SkillEditChatModal.vue`） | 對話 modal，store 端 `sendEditChatMessage` 只是把訊息 append 到 `instructions` | 只有「修改」；沒有「建立」、沒有「測試」；沒有側邊選單入口，無法從專案 deep-link 進來 |
| 技能測試沙盒（`SkillTest.vue`） | 對話測試（`SkillTestChat`）＋ AI 快速測試（`SkillTestAI`） | 定位是測試，不該塞建立流程 |

另外 repo 根目錄的大後台原型 `skill-admin.html` 已經有一頁「Skill Builder Agent」：左側對話、右側「配置預覽」（名稱／層級／綁定 Tools／自動產生的測試案例）、下方「編輯配置／執行測試／發佈」。這個版面就是本次要做進 Vue App 的體驗雛型。

## 2. 目標

1. 「AI 技能」群組新增第三個子項 **「AI 賦能」**（路由 `/view/SkillStudio`）：一個對話介面，左側跟 Agent 對話、右側即時預覽技能設定並可直接測試，涵蓋建立 → 修改 → 測試三種情境。
2. 專案內（AiViewer）由 Agent 發起的「這個流程你可能會重複用到，要不要建立成個人技能？」流程 **真的寫入 `skillStore`**，建立一顆 zone 為 personal 的個人技能，並附連結直達「AI 賦能」繼續調整與測試。
3. 把「建議建立技能」這段對話抽成 **一個 composable ＋ 一個卡片元件**，任何 convN 腳本一行就能呼叫；conv4 改用它。
4. 技能管理的「跟 Agent 對話修改」改為導向「AI 賦能」，`SkillEditChatModal` 退役，全站只留一個對話式技能工作區。

## 3. 非目標

- **不做真正的「固定流程偵測」**：demo 站的對話全是腳本，何時跳出建議由腳本決定；本次只提供可重用的建議流程，不做行為分析。
- **不接真 LLM**：「AI 賦能」的 Agent 回覆是規則式 mock（見 §6.3），跟 `sendChatMessage`／`generateAITestScenarios` 同一等級的模擬。
- **不做跨分頁持久化**：從 AiViewer 建立的個人技能存在同一分頁的 Pinia 記憶體裡，導頁到「AI 賦能」是同分頁 SPA 導覽（現有 `goto-skill-management` 已經是這樣），重新整理後消失，與其他 mock 一致。
- **不在「AI 賦能」做送審／發佈**：送審至 Library 沿用技能管理既有流程；「AI 賦能」右側只提供「到技能管理」連結。
- **不在「AI 賦能」做對話測試**：右側測試 tab 只放 AI 快速測試；對話測試留在沙盒，提供連結。
- **不動 `skill-admin.html` 原型**。
- **不動 SkillEditor 三步精靈**：它仍是「直接編輯」路徑。

## 4. 資訊架構與路由

### 4.1 側邊選單（`AppMenuTree.vue`）

「AI 技能」群組三處（桌機展開、收合 flyout、手機抽屜）各新增一個 `RouterLink`，放在「技能管理」與「技能測試沙盒」之間：

```
AI 技能
  技能管理        auto_awesome   /view/Skills
  AI 賦能         auto_fix_high  /view/SkillStudio   ← 新增
  技能測試沙盒    science        /view/SkillTest
```

群組 header 的 `active` 判斷補上 `route.path === '/view/SkillStudio'`。

### 4.2 路由（`router/index.ts`）

```ts
{
  path: '/view/SkillStudio',
  name: 'SkillStudio',
  component: () => import('@/views/SkillStudio.vue'),
  meta: { title: 'AI 賦能', parentLabel: 'AI 技能' },
}
```

Query 參數：

| 參數 | 意義 |
|---|---|
| （無） | 建立模式：空白草稿 |
| `skillId` | 修改模式：載入該技能（`store.findSkill` 找不到 → toast「找不到這個技能」並退回建立模式） |
| `tab=test` | 右側面板預設切到「測試」tab（專案建立完成後的連結會帶這個） |

## 5. 頁面設計：`SkillStudio.vue`

### 5.1 版面

```
page-banner：AppBreadcrumb（AI 技能 / AI 賦能）＋ banner-title「AI 賦能」
┌─────────────────────────────────────────┬──────────────────────────┐
│ SkillStudioChat（左，flex:1）             │ 右側面板（380px）          │
│ ┌ header ────────────────────────────┐   │ [技能預覽] [測試]          │
│ │ 模式 chip：建立新技能 / 修改：{name} │   │                          │
│ │ 「切換技能 ▾」   「＋ 建立新技能」   │   │ （依 tab 顯示，見 5.3）    │
│ └────────────────────────────────────┘   │                          │
│ 訊息區（空狀態：建議 chip）               │                          │
│ 輸入列                                    │ footer：儲存按鈕列        │
└─────────────────────────────────────────┴──────────────────────────┘
```

高度沿用沙盒的 `calc(100vh - 172px)`；桌機兩欄、`< 1024px` 改上下堆疊（右側面板在下，可捲動）。

### 5.2 左側：`SkillStudioChat.vue`

- **header**
  - 模式 chip：建立模式顯示「建立新技能」；修改模式顯示「修改：{skill.name}」，個人技能加 `person` 圖示（沿用 2026-08-25 的 personal 配色 `--tag-slate-text`）。
  - 「切換技能」下拉：列出 `store.myPersonalSkills`，選了就切到該技能的修改模式（重置對話與草稿）。只列個人技能——Library 技能不能在這裡直接改，要先在技能管理「複製為個人技能」。
  - 「＋ 建立新技能」：清空回建立模式。
  - 若草稿有未儲存變更，切換／新建前用既有 `popDialog.confirm` 確認。
- **訊息區**：氣泡沿用 `SkillTestChat` 的 `.bubble--agent`／`.bubble--user`（含 `bubble-label`「AI Agent」）；Agent 訊息可帶 **動作 chip**（`actions`），點擊等同送出該文字。處理中顯示三點 typing。
- **空狀態建議 chip**
  - 建立模式：固定三則，例：「幫我建立一個能查 ERP 庫存的技能」「把每週會議逐字稿整理成週報」「依部門報告規範自動產出月報」。
  - 修改模式：沿用 `SkillEditChatModal.suggestionChips` 的邏輯（依技能實際有的區塊動態產生：改觸發條件／補一個步驟／調整名稱），這段邏輯搬進新 composable。
  - 點 chip 帶入輸入框、不自動送出（與現有慣例一致）。
- **輸入列**：`custom-input` ＋ 送出按鈕，處理中 disabled。

### 5.3 右側面板

**「技能預覽」tab** — 即時反映 `draft`：

| 區塊 | 內容 | 空狀態文案 |
|---|---|---|
| 標題列 | 名稱 ＋ 狀態 badge：`未儲存草稿`（`--tag-amber`）／`個人技能 · 可使用`（`--tag-slate`）／`有未儲存變更`（`--tag-amber`） | 「尚未命名的技能」 |
| 說明 | `description` | 「跟 Agent 描述這個技能要做什麼」 |
| 觸發條件 | `triggerHint` | 「尚未設定觸發條件」 |
| 技能指令 | `instructions`，markdown 渲染（沿用 `SkillDetailDrawer` 的 markdown-body） | 「尚未撰寫技能指令」 |
| 覆蓋能力 | `capabilities` chip 列 | 「尚未拆解覆蓋能力項目」 |
| 附加檔案 | `SkillFileUpload`，預設收合成一行摘要（比照 `SkillEditChatModal`） | — |

區塊「永遠渲染標籤、沒資料顯示空狀態」，與 2026-08-25 詳情抽屜規則一致。

**footer 按鈕列**（預覽 tab 專用）：

| 模式 | 主按鈕 | 次按鈕 |
|---|---|---|
| 建立、未儲存 | `儲存為個人技能`（`name` 與 `instructions` 皆非空才 enabled） | — |
| 修改（已存在） | `儲存修改`（`isDirty` 才 enabled） | `直接編輯` → `/view/SkillEditor?skillId=`；`到技能管理` → `/view/Skills` |

儲存成功 toast「已儲存為個人技能，可到「測試」tab 驗證」並自動切到測試 tab（建立模式首次儲存時）。

**「測試」tab**：

- 草稿尚未儲存 → 空狀態：「先儲存技能，就能讓 AI 自動產生測試情境並逐條驗證」＋「儲存為個人技能」按鈕（與 footer 同一個 handler）。
- 已儲存 → 直接 `<SkillTestAI :skill-id="savedSkillId" />`（現有元件，不改）；底下一行連結「想手動對話測試？到技能測試沙盒」→ `/view/SkillTest?skillId=`。
- 有未儲存變更時，測試 tab 頂端顯示提示條「目前測試的是上次儲存的版本，請先儲存修改」。

## 6. 對話邏輯：`useSkillStudioConversation.ts`

### 6.1 型別

```ts
export interface SkillDraft {
  name: string
  description: string
  instructions: string
  triggerHint: string
  capabilities: SkillCapability[]
  files: SkillFile[]
}

export interface StudioMessage extends ChatMessage {
  actions?: { id: string; label: string }[]   // Agent 訊息可帶的動作 chip
}

export interface StudioReply {
  content: string
  patch?: Partial<SkillDraft>   // 這輪回覆對草稿的更動
  actions?: StudioMessage['actions']
}
```

### 6.2 對外介面

```ts
export function useSkillStudioConversation() {
  const mode: Ref<'create' | 'edit'>
  const savedSkillId: Ref<string | null>
  const draft: Ref<SkillDraft>
  const messages: Ref<StudioMessage[]>
  const isRunning: Ref<boolean>
  const isDirty: ComputedRef<boolean>        // draft 與 savedSnapshot 不同
  const canSave: ComputedRef<boolean>        // name && instructions 非空
  const suggestionChips: ComputedRef<{ icon: string; label: string }[]>

  function startCreate(): void
  function loadSkill(skillId: string): boolean   // false = 找不到
  async function send(text: string): Promise<void>
  function save(): string                         // 回傳 skillId
  function updateFiles(files: SkillFile[]): void
}
```

`save()`：
- 建立模式 → `store.createPersonalSkill({...draft, isEnabled: true, assignedAgents: [], creationMethod: 'ai_assisted'})`，取得回傳 id，`mode` 轉 `edit`、`savedSkillId` 設定、快照更新。
- 修改模式 → `store.applyStudioPatch(savedSkillId, draft)`，快照更新。

### 6.3 Mock 回覆規則（純函式 `interpretStudioMessage(text, draft, mode): StudioReply`，可單元測試）

規則式、確定性，不隨機：

| 條件 | patch | 回覆 |
|---|---|---|
| 建立模式、草稿 `name` 為空（第一句） | `name` = 取訊息中「建立／幫我做／需要」之後、「的技能／的 Skill」之前的片段，超過 12 字截斷，取不到則「新技能」；`description` = 原句；`triggerHint` = 「當使用者提到「{name}」相關需求時」；`instructions` = 三步驟範本（1. 釐清輸入 2. 執行 {name} 3. 依格式回覆結果）；`capabilities` = 兩項（「{name}」＋「結果格式化輸出」） | 「我先幫你擬了一版設定，右側可以看到。名稱、觸發條件和步驟都可以再跟我說要怎麼調。」actions：`看起來沒問題，儲存`、`觸發條件要更精準`、`再補一個步驟` |
| 訊息含「名稱」「叫」「改名」 | `name` = 引號內文字，沒有引號則取「叫／名稱是」之後的片段 | 「已把名稱改成「{name}」。」 |
| 訊息含「觸發」 | `triggerHint` = 原句去掉「觸發條件」等前綴 | 「觸發條件已更新為：{triggerHint}」 |
| 訊息含「步驟」「加一步」「補」 | `instructions` 追加一行「{n}. {原句去前綴}」 | 「已追加第 {n} 步。」 |
| 訊息含「能力」「還能」 | `capabilities` push `{ name: 原句去前綴, description: '' }` | 「已新增一項覆蓋能力。」 |
| 訊息等於動作 chip「看起來沒問題，儲存」 | 無 patch | 「請按右側「儲存為個人技能」，儲存後就能在「測試」tab 驗證。」（不代替使用者按儲存——儲存是明確動作，維持由使用者觸發） |
| 其他 | `instructions` 追加「（依對話更新）{原句}」（沿用 `sendEditChatMessage` 既有行為） | 「已根據你的描述更新技能指令，右側可以看到變更。」 |

回覆前固定 `await sleep(800)`，與 store 其他 mock 一致。

## 7. `skillStore.ts` 變更

| 項目 | 變更 |
|---|---|
| `createPersonalSkill(data)` | 回傳型別 `void` → `string`（新建 id）；`CreateSkillPayload` 新增選填 `creationMethod?: 'ai_assisted' \| 'manual'`，寫進 Skill（未帶預設 `'manual'`） |
| 新增 `applyStudioPatch(skillId, patch: Partial<Pick<Skill, 'name' \| 'description' \| 'instructions' \| 'triggerHint' \| 'capabilities'>>)` | 只對個人技能生效（`zone !== 'personal'` 直接 return）；合併欄位；`skillName` 同步 `name`；`personalStatus === 'draft'` 且內容與 `derivedFrom` 不同時轉 `available`（搬自 `sendEditChatMessage` 的既有規則） |
| 移除 `editChatHistory`、`editChatIsRunning`、`resetEditChat`、`sendEditChatMessage` | 唯一消費者 `SkillEditChatModal` 退役；對應測試改測 `applyStudioPatch` |

其他既有 action（`updateSkillFiles`、`hasSkillNameConflict` 等）不動。

## 8. 專案內 Agent 發起建立個人技能

### 8.1 `useSkillSuggestion.ts`（新 composable）

```ts
export interface SkillSuggestion {
  id: string                 // 一則建議一個 id，one-shot 旗標以此為 key
  name: string
  description: string
  triggerHint: string
  steps: string[]            // 組成 instructions 的步驟
  reason: string             // 「我留意到…」那句話裡的流程描述
}

export function useSkillSuggestion() {
  // push / scroll 由呼叫端提供（各 convN 的 cNPush / cNScroll）
  function offer(ctx: { push: (m: any) => void; scroll: () => void }, s: SkillSuggestion): void
  function handleAction(action: string, suggestionId: string): boolean   // 已處理回 true
  function reset(suggestionId: string): void                               // 清 one-shot 旗標，供 resetConversation 重播
}
```

`offer()` 推入一則 `agent: 'brain'`、`cardType: 'skillSuggest'`、`stage: 'ask'` 的訊息。之後由 `handleAction` 驅動：

| data-action | 行為 |
|---|---|
| `skill-suggest-build` | 推使用者訊息「是，幫我建立成個人技能」→ 500ms 後推 `stage: 'preview'` 卡（名稱／觸發條件／步驟／`確認並建立` 按鈕） |
| `skill-suggest-skip` | 推「不用了」→ 推「好的，這次的結果已保留在畫布中，之後有需要再跟我說一聲！」 |
| `skill-suggest-confirm` | 推「確認並建立」→ 呼叫 `store.createPersonalSkill({ name, description, triggerHint, instructions: steps 編號合併, isEnabled: true, assignedAgents: [], capabilities: steps 轉能力, creationMethod: 'ai_assisted' })` → 推 `stage: 'saved'` 卡（含 `skillId`），`finishResponse: true` |

每個 suggestion id 各自 one-shot（build/skip 二擇一、confirm 一次），取代原本 conv4 的兩個旗標。

### 8.2 `SkillSuggestCard.vue`（新元件，`AiViewerRecord` 新增 `cardType === 'skillSuggest'` 分支）

純呈現，props `{ suggestion: SkillSuggestion; stage: 'ask' | 'preview' | 'saved' | 'skipped'; skillId?: string }`；按鈕用 `data-action` ＋ `data-id="{suggestion.id}"`，交給既有 `handleChatAreaClick` 事件委派（與 `DelegateStatusCard`／quick-btn 同一套機制，不自己 emit）。

| stage | 內容 |
|---|---|
| `ask` | 「我留意到「{reason}」這類流程你之後可能會重複用到。要不要我把它建立成你的個人技能？」＋ `是，建立成個人技能`／`不用了` |
| `preview` | 卡：🧩 {name}／觸發條件／執行步驟（編號列）＋ `確認並建立` |
| `saved` | 「✅ 已建立個人技能「{name}」，目前只有你可以使用。」＋ 兩個連結：`到 AI 賦能 調整與測試`（`data-action="goto-skill-studio"`）、`到技能管理`（既有 `goto-skill-management`） |

樣式新建 `src/scss/components/_SkillSuggestCard.scss`（在 `components/_index.scss` `@import`），邊框／文字色全部用 token（`--border-color`、`--text-muted`、`--tag-*`），取代原本行內 `#e4e7ed`／`#5c6370`。

### 8.3 `AiViewerRightBox.vue` 接線

- 刪除 `conv4AskBuildSkill`／`conv4BuildSkill`／`conv4ConfirmSaveSkill`／`conv4SkipSkill` 與 `conv4SkillChoiceMade`／`conv4SkillSaveConfirmed`。
- `conv4InitFlow` 結尾改為：

```ts
setTimeout(() => skillSuggestion.offer({ push: c4Push, scroll: c4Scroll }, {
  id: 'conv4-sales-report',
  name: '產品銷售報告整理',
  description: '查詢指定月份產品銷售數據，並依三諾產品部輸出報告規範自動產出報告',
  triggerHint: '偵測到「查詢銷售資料＋套用部門報告規範」類型的整理需求',
  steps: ['查詢指定月份產品銷售數據', '套用三諾產品部輸出報告規範自動產出報告'],
  reason: '查詢銷售資料＋套用部門報告規範',
}), 600)
```

- `handleChatAreaClick`：三個 `conv4-*` 分支換成一行 `if (action?.startsWith('skill-suggest-') && skillSuggestion.handleAction(action, el.dataset.id!)) return`；新增 `goto-skill-studio` → `router.push({ name: 'SkillStudio', query: { skillId: el.dataset.value, tab: 'test' } })`。
- `resetConversation()` 的 conv4 區塊呼叫 `skillSuggestion.reset('conv4-sales-report')`（清 one-shot 旗標，讓腳本可重播）。

## 9. `SkillManagement.vue` 變更

- `handleChatEdit()` → `router.push({ name: 'SkillStudio', query: { skillId: editChoiceSkill.value.id } })`；`closeChatEdit`、`showEditChatForDuplicate`、`<SkillEditChatModal>` 一併移除。
- 「編輯技能」選擇對話框的按鈕文案「跟 Agent 對話修改」→ 維持不變（目的地換了，使用者心智模型一樣）。
- 刪除 `src/components/Skill/SkillEditChatModal.vue`、`src/scss/components/_SkillEditChatModal.scss` 與 `_index.scss` 的 `@import`。

## 10. 資料流

```
【專案內】
conv4 腳本完成報告 → skillSuggestion.offer() → SkillSuggestCard(ask)
  → 使用者點「是」→ SkillSuggestCard(preview) → 點「確認並建立」
  → store.createPersonalSkill({...creationMethod:'ai_assisted'}) → id
  → SkillSuggestCard(saved) → 點「到 AI 賦能」→ /view/SkillStudio?skillId=id&tab=test（同分頁）

【AI 賦能】
進入 → route.query.skillId ? loadSkill(id) : startCreate()
  → 使用者輸入 → interpretStudioMessage() → draft patch → 右側預覽即時更新
  → 「儲存為個人技能」/「儲存修改」→ createPersonalSkill / applyStudioPatch
  → 測試 tab：SkillTestAI(savedSkillId) → store.generateAITestScenarios / runAllAITests（既有）

【技能管理】
「跟 Agent 對話修改」→ /view/SkillStudio?skillId=id
```

## 11. 錯誤處理／邊界

- `?skillId` 找不到技能：toast「找不到這個技能」，退回建立模式，不拋錯。
- `?skillId` 指向 Library 技能（`zone !== 'personal'`）：toast「Library 技能請先在技能管理複製為個人技能」，退回建立模式。
- 儲存時名稱與既有個人技能重複：沿用 `store.hasSkillNameConflict` 邏輯顯示非阻擋提示條（比照 `SkillEditChatModal` 的 `name-conflict-banner`），仍允許儲存。
- 離開頁面（`onBeforeRouteLeave`）有未儲存變更：`popDialog.confirm`「有未儲存的變更，確定離開？」。
- `SkillSuggestCard` 收到未知 `stage`：不渲染任何按鈕，只顯示文字。

## 12. 樣式

- 新增 `src/scss/views/_SkillStudio.scss`，在 `src/scss/views/_index.scss` 加 `@import "./SkillStudio";`（此檔用的是 `@import`，不是 CLAUDE.md 寫的 `@forward`，照既有寫法）。
- 新增 `src/scss/components/_SkillSuggestCard.scss`，在 `src/scss/components/_index.scss` `@import`。
- 氣泡、tab、badge 全部沿用既有 class 與 token（`%badge-shape`、`--tag-*`、`--surface`、`--divider-a50`），不新增顏色。

## 13. 測試計畫

**Vitest**

- `src/composables/__tests__/useSkillStudioConversation.test.ts`：`interpretStudioMessage` 各規則（第一句產草稿、改名、觸發、加步驟、加能力、fallback）；`send()` 後 `draft` 與 `messages` 更新；`save()` 建立模式呼叫 `createPersonalSkill` 並回 id、模式轉 edit；修改模式呼叫 `applyStudioPatch`；`loadSkill` 對不存在／Library 技能回 false。
- `src/composables/__tests__/useSkillSuggestion.test.ts`：`offer` 推 ask 卡；build → preview；confirm → `myPersonalSkills` 多一筆、`creationMethod === 'ai_assisted'`、`instructions` 為編號步驟、推 saved 卡帶 skillId；skip 後 build 無效（one-shot）；`reset` 後可重播。
- `src/stores/__tests__/skillStore.test.ts`：`createPersonalSkill` 回傳 id 且寫入 `creationMethod`；`applyStudioPatch` 合併欄位、同步 `skillName`、draft→available 規則、對 Library 技能無作用；移除 `sendEditChatMessage` 相關測項。
- `src/views/__tests__/SkillStudio.test.ts`：無 query 進入是建立模式、右側顯示空狀態文案；`?skillId=` 個人技能進入是修改模式、預覽顯示該技能內容；測試 tab 未儲存時顯示空狀態、儲存後掛載 `SkillTestAI`；`?tab=test` 預設切到測試。
- `src/components/AiViewer/__tests__`（若有既有 AiViewerRecord 測試則擴充，否則新增）：`cardType: 'skillSuggest'` 渲染 `SkillSuggestCard`。
- `AppMenuTree.skillLabel.test.ts`：群組下三個子項、順序為 技能管理／AI 賦能／技能測試沙盒。
- `SkillManagement.liveliness.test.ts`／`teamCards.test.ts`：移除對 `SkillEditChatModal` 的斷言。

**手動（`npm run dev`，port 8088）**

1. 側邊選單 AI 技能 → AI 賦能：空白建立模式，輸入「幫我建立一個能查 ERP 庫存的技能」→ 右側預覽出現名稱／觸發／三步驟／兩項能力；點動作 chip「再補一個步驟」→ 步驟變四步。
2. 按「儲存為個人技能」→ toast、自動切到測試 tab、`SkillTestAI` 可產情境並跑測試；到技能管理確認「我的技能」多一筆。
3. 開專案 AiViewer → 快速任務「整理上月產品銷售報告」→ 走到建議卡 → 是 → 確認並建立 → 點「到 AI 賦能」→ 同分頁進入修改模式、右側是測試 tab。
4. 技能管理 → 任一個人技能 → 編輯 → 「跟 Agent 對話修改」→ 進入 AI 賦能修改模式；改名後「儲存修改」→ 回技能管理名稱已變。
5. 有未儲存變更時切換技能／離開頁面出現確認框。
6. `npm run type-check`、`npm run test:unit` 全過。

## 14. 檔案異動清單

| 檔案 | 異動 |
|---|---|
| `src/views/SkillStudio.vue` | 新增 |
| `src/components/Skill/SkillStudioChat.vue` | 新增 |
| `src/components/Skill/SkillStudioPreview.vue` | 新增（右側面板：預覽 tab ＋ 測試 tab ＋ footer） |
| `src/composables/useSkillStudioConversation.ts` | 新增 |
| `src/composables/useSkillSuggestion.ts` | 新增 |
| `src/components/AiViewer/SkillSuggestCard.vue` | 新增 |
| `src/scss/views/_SkillStudio.scss`、`src/scss/components/_SkillSuggestCard.scss` | 新增（＋各自 `_index.scss` 的 `@import`） |
| `src/router/index.ts` | 新增 `SkillStudio` 路由 |
| `src/components/AppMenuTree.vue` | 三處新增「AI 賦能」連結、群組 active 判斷 |
| `src/stores/skillStore.ts` | `createPersonalSkill` 回傳 id ＋ `creationMethod`；新增 `applyStudioPatch`；移除 editChat 四項 |
| `src/components/AiViewer/AiViewerRecord.vue` | 新增 `skillSuggest` cardType 分支 |
| `src/components/AiViewer/AiViewerRightBox.vue` | conv4 改用 `useSkillSuggestion`；dispatcher 新增 `skill-suggest-*`／`goto-skill-studio` |
| `src/views/SkillManagement.vue` | `handleChatEdit` 導頁；移除 `SkillEditChatModal` 相關 |
| `src/components/Skill/SkillEditChatModal.vue`、`src/scss/components/_SkillEditChatModal.scss` | 刪除 |
| 測試檔（§13） | 新增／更新 |
| `PROJECT_CONTEXT.md` 3.8／3.10 | 側邊選單補「AI 賦能」；3.10 補三個子項說明 |
| `ARCHITECTURE.md` §3 路由 | 補 `SkillStudio` |

## 15. 開放問題（留給實作階段）

- 「AI 賦能」右側面板寬度（380px）與 `< 1024px` 堆疊斷點依實測調整。
- 建立模式的三則固定建議 chip 文案由實作時依現有 mock 技能宇宙（ERP、會議摘要、部門報告）定稿。
