# 行銷積木組裝＝技能建立的一種方式 — 設計文件

日期：2026-09-16
狀態：待使用者審閱
涉及模組：`useSkillStudioConversation`、`skillStore`（Skill 型別）、SKILL block（`skillBuilderViewBox`）、AI 賦能頁（`SkillStudio.vue`）、工具箱與 conv7（`AiViewerRightBox`）、REPORT block 退場（`types/AiViewer`、`AiViewerStore`、`AiViewerContentBox`、`FullAiViewerBlockBox`、`reportAssemblyViewBox`、`_AiViewer-report.scss`）

前置文件：
- [`2026-09-16-skill-builder-canvas-block-design.md`](./2026-09-16-skill-builder-canvas-block-design.md) — SKILL block 與功能型 block
- [`2026-08-19-toolbox-report-assembly-design.md`](./2026-08-19-toolbox-report-assembly-design.md) — 被本次取代的「行銷報告生成」

---

## 1. 背景與目標

與 RD 對焦後的定位：「行銷報告生成」（拖曳章節積木、存成模板）本質上是**用積木組出一顆技能**——模板就是個人技能，之後在專案裡呼叫這顆技能就會產報告。所以它不該是工具箱裡與「技能建立」平行的另一顆按鈕，而是技能建立的**一種建立方式**。

目標：

1. 技能建立（SKILL block 與 AI 賦能頁）一開始先選建立方式：**用對話建立** 或 **用行銷積木組裝**，二選一、不混用。
2. 積木方式：勾選、排序行銷報告章節，填名稱，「儲存為個人技能」→ 建立一顆帶 `composition` 的個人技能；重開時能還原勾選。
3. 儲存後可以立刻「用這顆技能產一份報告」，在畫布放上報告 block（保留原 demo 的收尾）。
4. 工具箱只剩「技能建立」；「行銷報告生成」、conv7 引導對話、REPORT blockType 全部退場。
5. 積木庫更新為 RD 給的三類 21 個章節。

## 2. 非目標

- 不做真正的報告生成（產出仍是既有靜態 HTML）；不接後端。
- 不讓對話與積木混用：方式選定後固定；要換方式就開新的 block／新技能。
- 不做積木庫的自訂或第四類；資料是常數。
- 不動對話方式既有的規則與測試；不動沙盒。

## 3. 使用者流程

```
工具箱「技能建立」／AI 賦能「建立新技能」
        │
        ▼
 ┌ 選擇建立方式（只出現一次）───────────────────────┐
 │  [用對話建立]                 [用行銷積木組裝]     │
 │   跟 Agent 描述需求            勾選報告章節、排序    │
 └────────┬──────────────────────────────┬───────────┘
          ▼                              ▼
   對話／預覽／測試                積木／預覽／測試
   （現況不變）                    積木 tab：
                                   ├ 技能名稱（必填）、一句說明（選填）
                                   ├ 已選章節：拖曳排序、移除
                                   └ 積木庫：TA 用戶畫像／行銷活動成效／渠道績效
          │                              │
          └──────────► 預覽 tab 顯示同一種東西 ◄──────────┘
                       積木方式的步驟 = 章節依序編號；能力 = 章節
                                   │
                                   ▼
                        「儲存為個人技能」→ skillStore
                        積木方式另存 composition: { sectionIds }
                                   │
                                   ▼（積木方式、且在畫布 block 內）
                        block 頂端出現「用這顆技能產一份報告」
                        → 畫布放上報告 block、toast
                        「在 AI 賦能開啟」→ 同一顆技能繼續調
```

- **conv4 Agent 建議**：維持「對話」方式（步驟已由 Agent 預填），不出現選擇畫面。
- **修改既有技能**（`?skillId=`、block 重開）：不再問方式——技能有 `composition` → 積木；否則 → 對話。

## 4. 資料模型

### 4.1 `SkillDraft`（`useSkillStudioConversation.ts`）

```ts
export type StudioMethod = 'chat' | 'blocks'

export interface SkillDraft {
  name: string
  description: string
  instructions: string
  triggerHint: string
  capabilities: SkillCapability[]
  files: SkillFile[]
  method: StudioMethod | null   // null = 尚未選擇建立方式（顯示選擇畫面）
  sectionIds: string[]          // 積木方式的已選章節（依序）
}
```

`emptyDraft()` → `method: null, sectionIds: []`。`serialize()` 含這兩個欄位，所以 `isDirty`／快照自然涵蓋。

### 4.2 `Skill`（`skillStore.ts`）

```ts
export interface Skill {
  // …既有
  composition?: { sectionIds: string[] }   // 由積木組裝建立的技能；有這欄位就走積木方式
}
```

`CreateSkillPayload`／`StudioPatch` 加同名選填欄位；`createPersonalSkill`／`applyStudioPatch` 原樣寫入（深拷貝陣列）。

### 4.3 `SkillBuilderBlockData`（`types/AiViewer.ts`）

```ts
activeTab: 'chat' | 'blocks' | 'preview' | 'test'
```

其餘不變；`method` 不另存，讀 `snapshot.draft.method`。

### 4.4 積木庫 `src/constants/reportSections.ts`（新增，取代 `reportAssemblyViewBox` 內的常數）

```ts
export interface ReportCategory { id: string; label: string; color: string }
export interface ReportSection { id: string; categoryId: string; name: string; description: string }

export const REPORT_CATEGORIES: ReportCategory[] = [
  { id: 'ta',      label: 'TA 用戶畫像',  color: 'var(--tag-blue-text)' },
  { id: 'promo',   label: '行銷活動成效', color: 'var(--tag-rust-text)' },
  { id: 'channel', label: '渠道績效',     color: 'var(--tag-green-text)' },
]

export const REPORT_SECTIONS: ReportSection[] = [
  // TA 用戶畫像
  { id: 'ta_gender',        categoryId: 'ta', name: '性別分布',            description: '會員性別分布資料，圖表自動生成。' },
  { id: 'ta_age',           categoryId: 'ta', name: '年齡層分布',          description: '會員年齡層分布資料，圖表自動生成。' },
  { id: 'ta_gender_age',    categoryId: 'ta', name: '性別 × 年齡交叉比較', description: '性別 × 年齡層交叉分布，回答「不同性別的年齡結構」。' },
  { id: 'ta_geo',           categoryId: 'ta', name: '地理分布',            description: '會員地理分布（佔比 ≥1% 的城市），圖表自動生成。' },
  { id: 'ta_site_register', categoryId: 'ta', name: '站台註冊分布',        description: '各站台／來源的註冊會員數與佔比。' },
  { id: 'ta_login_source',  categoryId: 'ta', name: '登入來源分布',        description: '會員登入方式（帳密、社群、LINE…）分布。' },
  { id: 'ta_member_level',  categoryId: 'ta', name: '會員等級分布',        description: '各會員等級人數與佔比，含升降級趨勢。' },
  { id: 'ta_persona',       categoryId: 'ta', name: '會員人物誌',          description: '性別 × 年齡層 × 主力購買品類 × RFM 行為分群的四維輪廓。' },
  { id: 'ta_detail',        categoryId: 'ta', name: 'TA 明細資料',         description: '符合篩選條件的會員明細清單，可匯出。' },
  // 行銷活動成效
  { id: 'promo_kpi',        categoryId: 'promo', name: '促銷核心 KPI',       description: '完成訂單數、GMV、折扣總額、折扣佔比、規則數。' },
  { id: 'promo_ranking',    categoryId: 'promo', name: '活動排行',           description: '各促銷活動帶動效果排行，並自動生成圖表。' },
  { id: 'promo_type',       categoryId: 'promo', name: '活動類型分析',       description: '各促銷類型效益（類型分布、有折扣 vs 無折扣 AOV），圖表自動生成。' },
  { id: 'promo_monthly',    categoryId: 'promo', name: '月度促銷趨勢',       description: '已完成訂單的月度訂單數與 GMV 走勢，圖表自動生成。' },
  { id: 'promo_detail',     categoryId: 'promo', name: '完整促銷活動明細',   description: '每一檔活動的期間、規則、訂單數、GMV 明細表。' },
  { id: 'promo_coupon',     categoryId: 'promo', name: '優惠券使用率明細',   description: '各券別發放數、使用數、使用率與帶動 GMV。' },
  { id: 'promo_heatmap',    categoryId: 'promo', name: '銷售熱門時段',       description: '星期 × 小時的訂單量／GMV 熱力圖，回答「什麼時候該推活動」。' },
  // 渠道績效
  { id: 'ch_kpi',           categoryId: 'channel', name: '渠道核心 KPI',                 description: '各渠道工作階段數、轉換率、收益、每工作階段收益。' },
  { id: 'ch_traffic',       categoryId: 'channel', name: '渠道別流量與收益貢獻',         description: '各渠道流量佔比與收益貢獻對照，圖表自動生成。' },
  { id: 'ch_device',        categoryId: 'channel', name: '使用者活躍時段與裝置輪廓',     description: '各渠道使用者活躍時段與裝置（桌機／手機／平板）分布。' },
  { id: 'ch_trend',         categoryId: 'channel', name: '渠道整體工作階段數與收益趨勢', description: '整體工作階段數與收益的時間走勢，圖表自動生成。' },
  { id: 'ch_time_cross',    categoryId: 'channel', name: '渠道 × 時間交叉分布',          description: '渠道 × 星期／小時交叉分布，找出各渠道的黃金時段。' },
]

export const SECTION_MAP: Record<string, ReportSection>
export function sectionsByCategory(categoryId: string): ReportSection[]
```

RD 的清單從 02 起編號，01 未提供，視為不納入；顯示時不帶編號，順序照上表。原有的「會員留存與流失」「商品深度分析」兩類移除。

### 4.5 積木 → 草稿的推導（純函式，`useSkillStudioConversation.ts`）

```ts
export function deriveFromSections(sectionIds: string[]): Pick<SkillDraft, 'instructions' | 'triggerHint' | 'capabilities'>
```

- `instructions` = `依序產出以下章節：` ＋ 每章一行 `{n}. {name}：{description}`；空清單 → `''`。
- `capabilities` = 每章 `{ name, description }`。
- `triggerHint` = `當使用者要求產出行銷報告，或提到「{已選章節所屬分類 label，依 REPORT_CATEGORIES 順序、頓號分隔}」相關分析時`；空清單 → `''`。

## 5. composable 擴充（`useSkillStudioConversation`）

```ts
chooseMethod(method: StudioMethod): void
// 'chat'：draft.method='chat'，推入預設開場訊息（原 startCreate 的訊息）
// 'blocks'：draft.method='blocks'，不推訊息

updateBlocks(patch: { name?: string; description?: string; sectionIds?: string[] }): void
// 只在 method==='blocks' 生效；寫入 name/description/sectionIds，
// 若 sectionIds 有變就用 deriveFromSections 覆寫 instructions/triggerHint/capabilities
```

- `startCreate(prefill?, openingMessage?)`：**不再自動推開場訊息**，`method` 依 prefill 而定——有 prefill（conv4）→ `method: 'chat'` 並推開場訊息（行為同現況）；無 prefill → `method: null`，等 `chooseMethod`。`DEFAULT_OPENING_MESSAGE` 改在 `chooseMethod('chat')` 推。
- `loadSkill(id)`：`method = skill.composition ? 'blocks' : 'chat'`；`sectionIds = composition?.sectionIds ?? []`；對話方式維持推「我們來調整…」，積木方式不推訊息。
- `save()`：payload 加 `composition: method==='blocks' ? { sectionIds: [...] } : undefined`；`creationMethod: method==='blocks' ? 'manual' : 'ai_assisted'`。
- `canSave`：不變（name 與 instructions 非空）；積木方式下 instructions 由推導產生，所以等價於「有名稱且至少一個章節」。
- `hydrate()` 的 dirty 基準規則不變（來自已儲存技能或空草稿）。
- `suggestionChips`：對話方式才有意義；`method !== 'chat'` 回 `[]`。

## 6. 元件

### 6.1 `SkillMethodChooser.vue`（新增，`src/components/Skill/`）

兩張卡：

| 卡 | icon | 標題 | 說明 |
|---|---|---|---|
| chat | `forum` | 用對話建立 | 跟 Agent 描述需求，由它擬出設定 |
| blocks | `dashboard_customize` | 用行銷積木組裝 | 勾選報告章節、排序，存成可重複使用的報告技能 |

emits `choose(method: StudioMethod)`。無 props。

### 6.2 `SkillBlockComposer.vue`（新增，`src/components/Skill/`；由 `reportAssemblyViewBox.vue` 搬邏輯過來）

props：`{ name: string; description: string; sectionIds: string[]; compact?: boolean }`
emits：`update:name`、`update:description`、`update:sectionIds`

```
┌ sbc-head ─────────────────────────────────────────┐
│ 技能名稱 [__________]  說明 [_____________________] │
├ sbc-selected ─────────────────────────────────────┤
│ 已選 {n} 個章節                                     │
│ ≡ ● 促銷核心 KPI   完成訂單數、GMV…            ×    │  ← 拖曳排序（沿用原生 HTML5 DnD 邏輯）
│ …                                                  │
│ （空）還沒有章節，從下方積木庫加入                  │
├ sbc-palette ──────────────────────────────────────┤
│ ▾ ● TA 用戶畫像            0/9                     │
│    性別分布   會員性別分布資料…               ＋    │
│ ▾ ● 行銷活動成效           2/7                     │
│ ▾ ● 渠道績效               0/5                     │
└───────────────────────────────────────────────────┘
```

- 拖曳排序、加入、移除的邏輯與 class 結構沿用 `reportAssemblyViewBox`，class 前綴改 `sbc-`；樣式檔 `_AiViewer-report.scss` 改名 `src/scss/components/_SkillBlockComposer.scss`，在 `components/_index.scss` `@import`。
- 沒有「存成模板」按鈕；儲存一律走預覽 tab／footer 的「儲存為個人技能」。
- `compact` 時字級與間距略縮（640 寬 block 內用）。

### 6.3 SKILL block（`skillBuilderViewBox.vue`）

- `draft.method === null` → 工具列不顯示 tab，內容區放 `SkillMethodChooser`；選了就 `conv.chooseMethod(m)`，並把 `activeTab` 設成 `'chat'` 或 `'blocks'`。
- `method === 'chat'` → tab：對話／預覽／測試（現況）。
- `method === 'blocks'` → tab：積木／預覽／測試；積木 tab 放 `SkillBlockComposer compact`，三個 `update:*` 轉 `conv.updateBlocks(...)`。
- 儲存成功且 `method === 'blocks'` 且 `savedSkillId`：工具列下方出現 `.skb-after-save-bar`：「技能已儲存。要不要現在用這顆技能產一份報告？」＋ 按鈕「產一份報告」→ `aiviewerStore.addReportBlock('/justagent/hurricane_trailsetter_campaign_performance.html', `${draft.name}.html`)`（既有函式，放一個 HTML 檔案 block）＋ toast「已把報告放到畫布上」。按一次後這列消失（一個 block 只提示一次；要再產就再按儲存或到對話叫技能）。
- 「在 AI 賦能開啟」不變。

### 6.4 AI 賦能頁（`SkillStudio.vue`）

- 建立模式（無 `skillId`）：左欄先放 `SkillMethodChooser`；選 `chat` → 左欄 `SkillStudioChat`（現況）；選 `blocks` → 左欄 `SkillBlockComposer`（非 compact）。右欄預覽／測試不變。
- 修改模式：依 `composition` 決定左欄是對話或積木。
- 「建立新技能」按鈕（對話 header 上的）在積木方式下也要有：積木面板 head 右側放同一顆「＋ 建立新技能」，行為同現況（有未儲存變更先確認）。
- 頁面沒有畫布，不提供「產一份報告」。

## 7. 退場清單

| 項目 | 處理 |
|---|---|
| 工具箱項目 `reportAssembly` | 移除 |
| `useReportAssemblyConversation.ts` ＋ 測試 | 刪除 |
| `AiViewerRightBox.vue` 的 conv7 接線（import、解構、`testMsgs`／`currentConversationTitle`／`resetConversation` 的 conv7 分支、`openToolboxTool` 的 reportAssembly 分支、dispatcher `conv7-satisfied`／`conv7-adjust`、輸入框 placeholder 的 conv7 判斷） | 移除 |
| `types/AiViewer.ts` 的 `REPORT` key 與 `ReportAssemblyBlockData` | 移除；`BlockType` 少一個成員 |
| `AiViewerStore` 的 `addReportAssemblyBlock`／`updateReportAssemblySections`／`saveReportAssemblyTemplate` ＋ `AiViewerStore.reportAssembly.test.ts` | 刪除 |
| `reportAssemblyViewBox.vue` | 刪除（邏輯搬進 `SkillBlockComposer`） |
| `AiViewerContentBox.vue`／`FullAiViewerBlockBox.vue` 的 REPORT 分支 | 移除 |
| `TOOL_BLOCK_META.REPORT` ＋ 對應測試斷言 | 移除；功能型 block 只剩 SKILL |
| `_AiViewer-report.scss` | 改名搬到 `components/_SkillBlockComposer.scss`，`_AiViewer.scss` 拿掉 `@import "./AiViewer-report"`（工具箱選單樣式 `.toolbox-fn-box` 在同一檔開頭，要搬回 `_AiViewer.scss`） |
| 文件 | `PROJECT_CONTEXT.md` 3.3 功能型區塊只剩 SKILL、工具箱只剩技能建立、說明兩種建立方式；`ARCHITECTURE.md` 同步 |

`ToolboxItem` 型別與其餘佔位項目（圖像生成等）不動。

## 8. 資料流

```
選擇方式 ─► conv.chooseMethod('blocks') ─► draft.method='blocks'
SkillBlockComposer update:sectionIds ─► conv.updateBlocks({sectionIds})
   ─► deriveFromSections ─► draft.instructions / triggerHint / capabilities
   ─► 預覽 tab 即時反映；block 的 watch 寫回 snapshot
「儲存為個人技能」─► conv.save() ─► createPersonalSkill({ …, composition:{sectionIds}, creationMethod:'manual' })
   ─► block 顯示「產一份報告」列 ─► addReportBlock(靜態行銷活動成效報告) ─► 畫布多一個報告 block
重開技能 ─► loadSkill ─► composition → method 'blocks'、sectionIds 還原 ─► 積木 tab 勾選還原
```

## 9. 錯誤處理／邊界

- 積木方式、名稱空白：footer 儲存鈕 disabled，預覽標題顯示「尚未命名的技能」（現況文案）。
- 積木方式、零章節：`instructions` 為空 → `canSave` false；預覽「技能指令」顯示空狀態文案。
- 已選章節的 id 在積木庫找不到（例如日後改資料）：清單顯示 id 字串、可移除；推導時略過。
- conv4 預填 block：`method: 'chat'`，不會看到選擇畫面。
- 舊資料相容：畫布 block 資料只存在記憶體，沒有既存 REPORT block 要遷移；`skillStore` 既有 mock 技能都沒有 `composition`，一律走對話。
- 名稱重複：沿用非阻擋 `.name-conflict-banner`（積木 head 的名稱輸入框下方也顯示）。

## 10. 測試計畫

**Vitest**

- `reportSections.test.ts`：三類、21 章節、id 唯一、每章都有分類。
- `useSkillStudioConversation.test.ts` 追加：`deriveFromSections`（編號、分類 triggerHint、空清單）；`startCreate()` 無 prefill → `method null`、無訊息；`chooseMethod('chat')` 推開場；`chooseMethod('blocks')` 不推；`updateBlocks` 推導與 isDirty；`save()` 寫入 `composition` 與 `creationMethod 'manual'`；`loadSkill` 有 composition → blocks 且 sectionIds 還原；`suggestionChips` 在 blocks 為空。既有 `startCreate(prefill)` 測項調整為 `method 'chat'`。
- `skillStore.test.ts` 追加：`createPersonalSkill`／`applyStudioPatch` 寫入 `composition`（深拷貝）。
- `SkillMethodChooser.test.ts`：兩張卡、點擊 emit。
- `SkillBlockComposer.test.ts`：加入／移除／排序 emit `update:sectionIds`；名稱輸入 emit `update:name`；分類計數 `n/總數`；已加入的章節顯示 check 且不可重複加入。
- `skillBuilderViewBox.test.ts` 更新＋追加：空白 block 先顯示選擇畫面、無 tab；選積木 → tab 為 積木／預覽／測試；勾章節＋命名 → 儲存 → 個人技能有 `composition` → 出現「產一份報告」列 → 點擊後畫布多一個 HTML block 且列消失；conv4 預填 block 直接是對話 tab。
- `SkillStudio.test.ts` 更新：建立模式先顯示選擇畫面；選對話後現有測項全部照舊；選積木 → 左欄是 `SkillBlockComposer`；`?skillId=` 指向有 composition 的技能 → 左欄積木。
- 刪除：`useReportAssemblyConversation.test.ts`、`AiViewerStore.reportAssembly.test.ts`；`toolBlocks.test.ts` 改成只斷言 SKILL。
- 退場 grep：`REPORT'|ReportAssembly|reportAssembly|conv7` 在 `src/` 無命中。

**手動（8088）**

1. 工具箱只有「技能建立」；點它 → block 先顯示兩張方式卡。
2. 選「用行銷積木組裝」→ 積木 tab：填名稱、從三類勾 4–5 個章節、拖曳換順序 → 預覽 tab 步驟編號與順序一致 → 儲存 → 切測試 tab → 出現「產一份報告」→ 點下去畫布多一個「{名稱}.html」報告 block。
3. 「在 AI 賦能開啟」→ 左欄是積木面板、勾選還原。
4. AI 賦能頁「建立新技能」→ 先選方式；選對話 → 與現況相同。
5. conv4 → 「是」→ block 直接是對話 tab、無選擇畫面。

## 11. 檔案異動清單

| 檔案 | 異動 |
|---|---|
| `src/constants/reportSections.ts` ＋ 測試 | 新增 |
| `src/composables/useSkillStudioConversation.ts` ＋ 測試 | `method`／`sectionIds`、`deriveFromSections`、`chooseMethod`、`updateBlocks`、`startCreate`／`loadSkill`／`save` 調整 |
| `src/stores/skillStore.ts` ＋ 測試 | `composition` 欄位 |
| `src/types/AiViewer.ts` | `activeTab` 加 `'blocks'`；移除 REPORT |
| `src/components/Skill/SkillMethodChooser.vue`、`SkillBlockComposer.vue` ＋ 測試 | 新增 |
| `src/scss/components/_SkillBlockComposer.scss`（自 `_AiViewer-report.scss` 搬移改名）＋ `_index.scss` | 新增／搬移 |
| `src/components/AiViewer/viewBlock/skillBuilderViewBox.vue` ＋ 測試、`_AiViewer-skill.scss` | 選擇畫面、積木 tab、產報告列 |
| `src/views/SkillStudio.vue` ＋ 測試、`_SkillStudio.scss` | 選擇畫面、積木左欄 |
| `src/components/AiViewer/AiViewerRightBox.vue` | 移除 reportAssembly 工具箱項目與 conv7 接線 |
| `src/components/AiViewer/AiViewerContentBox.vue`、`FullAiViewerBlockBox.vue` | 移除 REPORT 分支 |
| `src/stores/AiViewerStore.ts` | 移除三個 REPORT action |
| `src/constants/toolBlocks.ts` ＋ 測試 | 移除 REPORT |
| 刪除：`useReportAssemblyConversation.ts` ＋ 測試、`reportAssemblyViewBox.vue`、`AiViewerStore.reportAssembly.test.ts`、`_AiViewer-report.scss` | |
| `PROJECT_CONTEXT.md`、`ARCHITECTURE.md` | 文件 |

## 12. 開放問題（實作階段決定）

- 積木面板在 640 寬 block 內的密度（`compact`）與拖曳手感沿用現有樣式微調即可。
- 「產一份報告」用的靜態檔目前指向 `hurricane_trailsetter_campaign_performance.html`（行銷活動成效報告）；若之後有依章節組合產出的檔案再替換。
