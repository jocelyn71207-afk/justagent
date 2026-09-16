# 技能建立畫布 Block（SKILL）＋ 功能型 Block 視覺語彙 — 設計文件

日期：2026-09-16
狀態：待使用者審閱
涉及模組：AiViewer 畫布（`AiViewerContentBox`、`viewBlock/`、`FullAiViewerBlockBox`、`AiViewerStore`）、工具箱與 conv4（`AiViewerRightBox`）、`useSkillSuggestion`／`SkillSuggestCard`、`useSkillStudioConversation`、`SkillStudioChat`／`SkillStudioPreview`（加 props）、SCSS

前置文件：
- [`2026-09-15-skill-studio-ai-empower-design.md`](./2026-09-15-skill-studio-ai-empower-design.md) — AI 賦能頁與三個可重用零件的來源
- [`2026-08-19-toolbox-report-assembly-design.md`](./2026-08-19-toolbox-report-assembly-design.md) — 工具箱與 REPORT 組裝 block 的既有慣例

---

## 1. 背景與目標

上一輪把「Agent 在專案對話中主動建議建立技能」做成：河道內三張卡（詢問 → 預覽 → 已建立）＋ 連結到 AI 賦能頁。使用者評估後選擇改成 **在專案畫布上另開一個「窗口」協助建立**：

> 在畫布多一種 block type（功能類型，與檔案在樣式上直接做出區隔）；工具箱多該類型的按鈕，同「行銷報告生成」；「行銷報告生成」的 block 樣式也該不同。

目標：

1. 新增畫布 blockType **`SKILL`（技能建立 block）**：block 內自帶「對話／預覽／測試」三個 tab，直接重用 AI 賦能的三個零件，建立、修改、測試都在 block 裡完成。
2. 建立 **功能型 block 的視覺語彙**：`REPORT`（報告組裝）與 `SKILL` 共用一套「工具」外觀，跟檔案 block 明顯區隔。
3. 兩個入口：**工具箱「技能建立」**（空白建立）與 **conv4 Agent 建議**（按「是」直接放上一個已預填的 block）。
4. AI 賦能頁保留，block 提供「在 AI 賦能開啟」把同一顆技能帶過去。

## 2. 非目標

- 不做真正的「固定流程偵測」；何時建議仍由腳本決定（conv4）。
- 不做跨分頁持久化；block 內容存在該分頁的 Pinia 記憶體（與所有畫布 block 相同）。
- 不在 block 內做送審／發佈／版本；沿用技能管理。
- 不做對話測試進 block（沿用 AI 快速測試；沙盒入口保留）。
- 不改 REPORT block 的內容與互動，只改外觀。
- 不改 AI 賦能頁的行為（只讓兩個零件多接受選填 props，預設值維持現況）。

## 3. 使用者流程

```
【工具箱】
輸入區「工具箱」→「技能建立」
  → 畫布放上空白 SKILL block（建立模式），鏡頭移過去
  → 在 block「對話」tab 描述需求 → 「預覽」tab 看草稿 → 「儲存為個人技能」
  → 自動切到「測試」tab → AI 快速測試

【conv4 Agent 建議】
報告完成 → AI大腦：「我留意到「查詢銷售資料＋套用部門報告規範」…要不要建立成個人技能？」
  → 「是，建立成個人技能」
  → 畫布放上已預填的 SKILL block（名稱／說明／觸發條件／兩步驟／兩項能力），鏡頭移過去
  → 河道回一則「已在畫布放上「產品銷售報告整理」的技能建立工具，設定先幫你填好了…」＋「前往區塊」
  → 使用者在 block 內確認、調整、儲存、測試
  → 「不用了」→ 婉拒訊息（不變）

【接到 AI 賦能】
block 工具列「在 AI 賦能開啟」（已儲存才啟用）→ `/view/SkillStudio?skillId=…`
```

## 4. 資料模型

### 4.1 `src/types/AiViewer.ts`

```ts
type BlockDataMap = {
  // …既有
  REPORT: ReportAssemblyBlockData
  SKILL: SkillBuilderBlockData          // 新增
}

/** 技能建立 Block */
type SkillBuilderBlockData = {
  snapshot: StudioSnapshot              // 對話與草稿的可序列化快照（見 5.1）
  origin: SkillBlockOrigin | null       // 由 Agent 建議放上時的來源脈絡；工具箱空白建立為 null
  activeTab: 'chat' | 'preview' | 'test'
}

type SkillBlockOrigin = {
  conversationId: string                // 例：'conv4'
  reason: string                        // 例：'查詢銷售資料＋套用部門報告規範'
}
```

`StudioSnapshot`、`StudioMessage`、`SkillDraft` 由 `@/composables/useSkillStudioConversation` 匯出，`types/AiViewer.ts` 以 `import type` 引用。

### 4.2 `src/constants/toolBlocks.ts`（新增）

```ts
import type { BlockType } from '@/types/AiViewer'

export interface ToolBlockMeta { icon: string; label: string }

// 功能型 block：畫布上「可操作的工具」而不是「一份檔案」，共用同一套外觀
export const TOOL_BLOCK_META: Partial<Record<BlockType, ToolBlockMeta>> = {
  REPORT: { icon: 'bar_chart', label: '報告組裝' },
  SKILL:  { icon: 'auto_fix_high', label: '技能建立' },
}

export function isToolBlock(type: BlockType): boolean {
  return type in TOOL_BLOCK_META
}
```

## 5. `useSkillStudioConversation` 擴充

### 5.1 快照

```ts
export interface StudioSnapshot {
  mode: StudioMode
  savedSkillId: string | null
  draft: SkillDraft
  messages: StudioMessage[]
}

function toSnapshot(): StudioSnapshot            // 深拷貝目前狀態
function hydrate(snap: StudioSnapshot): void     // 還原狀態；snapshot 基準 = 還原後的 draft（所以還原後 isDirty=false）
```

block 每次 `draft`／`messages`／`mode`／`savedSkillId` 變動就 `toSnapshot()` 寫回 block data（`watch` + `updateSkillBuilderBlock`），block 重新 mount（拖曳、全螢幕切換、畫布重繪）時 `hydrate()` 回來。

### 5.2 預填建立

```ts
function startCreate(prefill?: Partial<SkillDraft>, openingMessage?: string): void
```

- 無參數：行為同現況。
- 有 `prefill`：草稿 = `emptyDraft()` 疊上 prefill；**snapshot 基準仍是空草稿**，所以一開始就 `isDirty = true`、`canSave` 依內容（有名稱與指令即可儲存）；開場訊息用 `openingMessage`（沒給則用預設開場）。
- `interpretStudioMessage` 的「第一句擬草稿」規則只在 `!draft.name` 時觸發，預填後自然跳過，第二句起走改名／觸發／加步驟等規則。

### 5.3 `AI 賦能` 頁不受影響

`SkillStudio.vue` 不呼叫 `hydrate/toSnapshot`，`startCreate()` 無參數，行為與測試完全不變。

## 6. 畫布 block

### 6.1 `AiViewerStore` 新 action

```ts
function addSkillBuilderBlock(init?: {
  prefill?: Partial<SkillDraft>
  openingMessage?: string
  origin?: SkillBlockOrigin
}): string
```

- id 前綴 `skillbuilder-`，尺寸 640×750，排版與 `addReportAssemblyBlock` 同一套（同列橫向堆疊、y 在非同類 block 之下），`blockName` = `init?.prefill?.name ?? '技能建立'`，`panToTarget` 移過去並 `nowChoiceAiViewerId = id`。
- 初始 `snapshot`：用一個暫時的 composable 實例 `startCreate(prefill, openingMessage)` 後 `toSnapshot()`（讓 store 與元件用同一套規則產生開場訊息與草稿），`activeTab: 'chat'`。

```ts
function updateSkillBuilderBlock(blockId: string, patch: Partial<SkillBuilderBlockData>): boolean
```

- 只對 `blockType === 'SKILL'` 生效；`snapshot.draft.name` 變動時同步 `blockName`（未命名時維持「技能建立」）。

### 6.2 `viewBlock/skillBuilderViewBox.vue`（新增）

props：`{ id: string; source: { blockType: 'SKILL'; data: SkillBuilderBlockData }; isFullView?: boolean }`

```
┌ skb-toolbar ─────────────────────────────────────────────┐
│ [對話] [預覽] [測試]                    [在 AI 賦能開啟 ↗] │
├──────────────────────────────────────────────────────────┤
│ chat    → <SkillStudioChat compact …/>                    │
│ preview → <SkillStudioPreview :active-tab="'preview'" hide-tabs …/> │
│ test    → <SkillStudioPreview :active-tab="'test'"    hide-tabs …/> │
└──────────────────────────────────────────────────────────┘
```

- 內部 `const conv = useSkillStudioConversation()`；`onMounted` → `conv.hydrate(props.source.data.snapshot)`；`watch([conv.draft, conv.messages, conv.mode, conv.savedSkillId], () => store.updateSkillBuilderBlock(id, { snapshot: conv.toSnapshot() }), { deep: true })`。
- tab 狀態存在 block data（`activeTab`），切換時 `updateSkillBuilderBlock(id, { activeTab })`。
- `nameConflict` computed 同 `SkillStudio.vue`（比對 `myPersonalSkills`、排除自身 id）。
- 儲存：`conv.save()` → toast「已儲存為個人技能，可到「測試」tab 驗證」（首次）／「已儲存修改」；首次儲存後 `activeTab = 'test'`。
- 「在 AI 賦能開啟」：`savedSkillId` 為空時 disabled（tooltip「先儲存技能」），有值 → `router.push({ name: 'SkillStudio', query: { skillId } })`。
- 有 `origin` 時，對話 tab 頂端顯示一行脈絡條：「來自本對話的「{reason}」流程」（唯讀）。
- 不做離開守衛：block 一直在畫布上，關掉分頁本來就會丟（與其他 block 一致）。刪除 block 若有未儲存變更，沿用既有刪除確認即可（不另加）。

### 6.3 `SkillStudioChat` / `SkillStudioPreview` 新增選填 props（預設不改變現況）

| 元件 | 新 prop | 行為 |
|---|---|---|
| `SkillStudioChat` | `compact?: boolean` | `true` 時 header 只留模式 chip，隱藏「切換技能」與「建立新技能」（block 內一顆技能一個 block，不需要切換）；空狀態建議 chip 改成單欄排列 |
| `SkillStudioPreview` | `hideTabs?: boolean` | `true` 時不渲染自己的 `.ssp-tabs`（tab 由 block 的工具列控制） |

### 6.4 `AiViewerContentBox` 接線

- `<skillBuilderViewBox v-if="props.source.blockType === 'SKILL'" …/>`。
- 可縮放清單加 `'SKILL'`；放大按鈕條件加 `|| isToolBlock(props.source.blockType)`（REPORT 也順帶能放大）。
- `.content-box` 加 `'for-SKILL'`（padding 0）。
- **功能型 chrome**（見 §7）：`const toolMeta = computed(() => TOOL_BLOCK_META[props.source.blockType])`；`.AiViewerContentBox` 加 `:class="{ 'is-tool': !!toolMeta }"`；header 名稱輸入框前插入 `<span class="tool-badge" v-if="toolMeta"><i class="material-symbols-outlined">{{ toolMeta.icon }}</i>{{ toolMeta.label }}</span>`。

### 6.5 `FullAiViewerBlockBox`

新增 `REPORT` → `reportAssemblyViewBox`、`SKILL` → `skillBuilderViewBox :isFullView="true"` 兩個分支；全螢幕時 block 的三 tab 版面一樣，只是更寬。

### 6.6 複製／刪除

- 複製：既有 `copyBlock()` 深拷貝 data，複製出來的 SKILL block 是同一份草稿的副本（`savedSkillId` 也一起複製 → 兩個 block 指向同一顆技能）。這是可接受的既有行為，不特別處理。
- 刪除：既有流程。

## 7. 功能型 block 視覺語彙（`_AiViewer.scss`）

```scss
.AiViewerContentBox.is-tool {
  background: var(--page-bg);                 // 實色，不用毛玻璃
  backdrop-filter: none; -webkit-backdrop-filter: none;
  border-color: var(--primary-a20);

  .content-header-box {
    background: var(--primary-a08);
    color: var(--text);
  }
  .tool-badge {
    @extend %badge-shape;
    margin-right: 8px;
    background: var(--tag-teal-bg);
    color: var(--tag-teal-text);
    font-size: 11px;
    .material-symbols-outlined { font-size: 14px; }
  }
}
```

- 選取狀態（`.isActive`）沿用既有主色邊框。
- 同一套規則自動套到 REPORT（報告組裝）與 SKILL；檔案 block 不受影響。
- 工具箱項目、block header 徽章、`blockListArea` 顯示的 blockType 文字三處的 icon／label 都從 `TOOL_BLOCK_META` 取，單一來源。

## 8. 工具箱

`toolboxItems` 在「行銷報告生成」之後新增：

```ts
{ id: 'skillBuilder', icon: 'auto_fix_high', name: '技能建立', description: '用對話建立、測試個人技能', enabled: true },
```

`openToolboxTool`：`if (item.id === 'skillBuilder') aiviewerStore.addSkillBuilderBlock()`。不切換對話、不推河道訊息（鏡頭移過去就是回饋）。

## 9. conv4 Agent 建議流程改版（`useSkillSuggestion` / `SkillSuggestCard`）

### 9.1 階段

```ts
export type SkillSuggestStage = 'ask' | 'placed' | 'skipped'
```

| data-action | 行為 |
|---|---|
| `skill-suggest-build` | 推使用者回聲「是，建立成個人技能」→ `aiviewerStore.addSkillBuilderBlock({ prefill, openingMessage, origin })` → 500ms 後推 `stage: 'placed'` 卡（帶 `blockId`），`finishResponse: true` |
| `skill-suggest-skip` | 不變 |
| `skill-suggest-confirm` | **移除**（確認與儲存都在 block 內） |

`prefill` 由 `SkillSuggestion` 轉換：`name`、`description`、`triggerHint`、`instructions` = steps 編號合併、`capabilities` = steps 轉能力。`openingMessage` = 「這顆技能來自本對話的「{reason}」流程，設定我先填好了。想調整就直接說，確認後按「儲存為個人技能」。」`origin` = `{ conversationId, reason }`（`offer()` 的 ctx 多帶 `conversationId`）。

`useSkillSuggestion` 改依賴 `useAiviewerStore`（不再直接呼叫 `skillStore.createPersonalSkill`）。one-shot：`choiceMade` 一個旗標即可（build／skip 二擇一）；`reset(id)` 不變。

### 9.2 卡片

| stage | 內容 |
|---|---|
| `ask` | 不變 |
| `placed` | 「已在畫布放上「{name}」的技能建立工具，設定先幫你填好了，確認後在區塊裡按「儲存為個人技能」。」＋ 連結 `前往區塊`（`data-action="pan-to-block"`, `data-value="{blockId}"`） |
| 其他 | 只顯示名稱、無按鈕（不變） |

### 9.3 `AiViewerRightBox` dispatcher

- `pan-to-block`：找到 block → `panToTarget = {x,y,width,height}`、`nowChoiceAiViewerId = id`；找不到（已被刪）→ toast「這個區塊已不在畫布上」。
- `goto-skill-studio` 分支保留（block 工具列不用它，但無害；若無其他消費者則移除）。
- `conv4` 的 `skillSuggestion.offer({ push: c4Push, scroll: c4Scroll, conversationId: 'conv4' }, CONV4_SKILL_SUGGESTION)`。

## 10. 資料流

```
工具箱「技能建立」 ──► addSkillBuilderBlock() ─┐
conv4「是」 ─► addSkillBuilderBlock({prefill, origin}) ─┤
                                                      ▼
                                   aiViewerBlocks.push({ blockType:'SKILL', data:{snapshot, origin, activeTab} })
                                                      ▼
                          skillBuilderViewBox mount → conv.hydrate(snapshot)
                                                      ▼
            對話 tab send() ─► draft/messages 變動 ─► watch ─► updateSkillBuilderBlock(snapshot)
                                                      ▼
            預覽 tab「儲存為個人技能」─► conv.save() ─► skillStore.createPersonalSkill / applyStudioPatch
                                                      ▼
            測試 tab ─► SkillTestAI(savedSkillId) ─► skillStore.generateAITestScenarios / runAllAITests
                                                      ▼
            「在 AI 賦能開啟」─► /view/SkillStudio?skillId=…（同一顆技能，長時間調整）
```

## 11. 錯誤處理／邊界

- block 的 `snapshot.savedSkillId` 指向的技能已被刪（在技能管理刪掉）：`hydrate` 後 `store.findSkill` 找不到 → block 顯示提示條「這顆技能已不存在，儲存會建立新的個人技能」並把 `mode` 退回 `create`、`savedSkillId = null`。
- 「前往區塊」時 block 已刪除：toast，不拋錯。
- 全螢幕與畫布 block 同時存在同一份 snapshot：兩個 `skillBuilderViewBox` 實例各自 `hydrate`，寫回同一個 block data；全螢幕關閉後畫布上的實例重新 `hydrate` 最新 snapshot（在 `watch(() => props.source.data.snapshot)` 中處理外部變更：只在 `!isDirty` 或快照的 messages 長度大於自己時套用，避免打字中被覆寫）。
- 名稱與既有個人技能重複：非阻擋提示條（沿用 `.name-conflict-banner`）。

## 12. 樣式

- `_AiViewer.scss`：`.AiViewerContentBox.is-tool`、`.tool-badge`、`.content-box.for-SKILL { padding: 0 }`。
- 新增 `src/scss/views/_AiViewer-skill.scss`（`.skillBuilderViewBox`、`.skb-toolbar`、`.skb-tab-btn`、`.skb-origin-bar`），比照 `_AiViewer-report.scss` 的引入方式。
- `SkillStudioChat.compact` 與 `SkillStudioPreview.hideTabs` 對應的樣式追加在 `_SkillStudio.scss`。

## 13. 測試計畫

**Vitest**

- `useSkillStudioConversation.test.ts` 追加：`toSnapshot/hydrate` 往返後 `isDirty=false`、內容一致；`startCreate(prefill, openingMessage)` 後 `isDirty=true`、`canSave` 依內容、第一則訊息是 openingMessage、之後送「名稱改成「X」」走改名規則而非第一句規則。
- `AiViewerStore.skillBuilder.test.ts`（新）：`addSkillBuilderBlock()` 推入 SKILL block、id 前綴、預填時 `blockName` 與 snapshot 內容；`updateSkillBuilderBlock` 只對 SKILL 生效、名稱同步。
- `skillBuilderViewBox.test.ts`（新）：三 tab 切換寫回 `activeTab`；hydrate 顯示預填名稱；儲存後 `myPersonalSkills` 多一筆並切到測試 tab；「在 AI 賦能開啟」未儲存 disabled、儲存後 `router.push` 帶 skillId；有 `origin` 顯示脈絡條。
- `useSkillSuggestion.test.ts` 改寫：build → 畫布多一個 SKILL block（prefill 內容、origin）→ 500ms 後 placed 卡帶 blockId；skip 不變；不再有 confirm。
- `SkillSuggestCard.test.ts`：`placed` 階段連結 `data-action="pan-to-block"` 帶 blockId；`preview`/`saved` 測項移除。
- `SkillStudioChat.test.ts`／`SkillStudioPreview.test.ts` 追加：`compact` 隱藏 header 動作；`hideTabs` 不渲染 `.ssp-tabs`。
- `toolBlocks.test.ts`（新，小）：`isToolBlock('REPORT'|'SKILL')` true、`'HTML'` false。
- 既有 `SkillStudio.test.ts` 全部不變且通過（頁面行為不受影響）。

**手動（8088）**

1. 工具箱 → 技能建立 → 空白 SKILL block 出現、鏡頭移過去、header 有「技能建立」徽章、卡片為實色非毛玻璃；REPORT block（行銷報告生成）同樣有「報告組裝」徽章。
2. block 內：對話 → 預覽草稿 → 儲存 → 自動切測試 → 生成情境。
3. conv4 → 「是」→ 已預填 block 出現；河道 placed 卡「前往區塊」可移鏡頭；block 內直接儲存。
4. 放大按鈕 → 全螢幕三 tab 可用 → 縮小後畫布 block 狀態一致。
5. 「在 AI 賦能開啟」→ 同分頁進 AI 賦能修改模式。

## 14. 檔案異動清單

| 檔案 | 異動 |
|---|---|
| `src/types/AiViewer.ts` | `SKILL` blockType、`SkillBuilderBlockData`、`SkillBlockOrigin` |
| `src/constants/toolBlocks.ts` | 新增 `TOOL_BLOCK_META`、`isToolBlock` |
| `src/composables/useSkillStudioConversation.ts` | `StudioSnapshot`、`toSnapshot`、`hydrate`、`startCreate(prefill, openingMessage)` |
| `src/stores/AiViewerStore.ts` | `addSkillBuilderBlock`、`updateSkillBuilderBlock` |
| `src/components/AiViewer/viewBlock/skillBuilderViewBox.vue` | 新增 |
| `src/components/AiViewer/AiViewerContentBox.vue` | SKILL 分支、tool chrome、resizable／fullscreen 條件 |
| `src/components/AiViewer/FullAiViewerBlockBox.vue` | REPORT／SKILL 分支 |
| `src/components/Skill/SkillStudioChat.vue`、`SkillStudioPreview.vue` | `compact`／`hideTabs` props |
| `src/composables/useSkillSuggestion.ts`、`src/components/AiViewer/SkillSuggestCard.vue` | 階段改為 ask／placed／skipped，build 放 block |
| `src/components/AiViewer/AiViewerRightBox.vue` | 工具箱項目、`openToolboxTool`、`pan-to-block`、conv4 offer 帶 conversationId |
| `src/scss/views/_AiViewer.scss`、新增 `_AiViewer-skill.scss`、`_SkillStudio.scss` | 樣式 |
| 測試（§13） | 新增／改寫 |
| `PROJECT_CONTEXT.md` 3.3、`ARCHITECTURE.md` | 補 SKILL blockType 與功能型 block 說明 |

## 15. 開放問題（實作階段決定）

- `SkillStudioChat` 在 640 寬的 block 內，訊息氣泡 `max-width` 是否放寬到 90%。
- 全螢幕模式下是否恢復左右兩欄（對話｜預覽）——本輪先維持三 tab，不另做版面。
