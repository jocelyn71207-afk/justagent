# 行銷積木組裝＝技能建立方式 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 技能建立（SKILL block 與 AI 賦能頁）一開始先選「用對話建立／用行銷積木組裝」；積木方式勾章節、命名、儲存成帶 `composition` 的個人技能，儲存後可在畫布產一份報告；工具箱只剩「技能建立」，REPORT block 與 conv7 退場。

**Architecture:** 建立方式與已選章節都放進 `SkillDraft`（`method`／`sectionIds`），積木 → 步驟／能力／觸發條件由純函式 `deriveFromSections` 推導，所以預覽、儲存、快照、isDirty 全部沿用現有機制。新增兩個純呈現元件 `SkillMethodChooser`、`SkillBlockComposer`（拖曳邏輯自 `reportAssemblyViewBox` 搬移），由 SKILL block 與 AI 賦能頁各自掛載；退場工作集中在最後一個程式 task。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Pinia、vue-router、Vitest + @vue/test-utils、SCSS。

**Spec:** `docs/superpowers/specs/2026-09-16-skill-block-composer-design.md`

## Global Constraints

- `<script setup lang="ts">`；無 `<style scoped>`；樣式在 `src/scss/`；`@/` imports；顏色只用 CSS custom properties／既有 SCSS 變數。
- 兩種建立方式二選一、不混用；`draft.method: 'chat' | 'blocks' | null`，`null` 顯示選擇畫面。conv4 預填 block 一律 `'chat'`；有 `composition` 的技能一律 `'blocks'`。
- 積木庫固定三類 21 章節（§4.4 of spec），顯示不帶編號、順序照 spec；`ReportCategory.color` 用 `var(--tag-blue-text)`／`var(--tag-rust-text)`／`var(--tag-green-text)`。
- 推導文案：`instructions` = `依序產出以下章節：` ＋ 每行 `{n}. {name}：{description}`；`triggerHint` = `當使用者要求產出行銷報告，或提到「{分類 label 依 REPORT_CATEGORIES 順序、頓號分隔}」相關分析時`；空清單兩者皆 `''`；`capabilities` = 每章 `{ name, description }`。
- 積木方式儲存：`composition: { sectionIds }`、`creationMethod: 'manual'`；對話方式維持 `'ai_assisted'`。
- 儲存後（積木方式、SKILL block 內）「產一份報告」→ `aiviewerStore.addReportBlock('/justagent/hurricane_trailsetter_campaign_performance.html', \`${name}.html\`)`，toast「已把報告放到畫布上」，該列只出現一次。
- 方式選擇卡文案：對話 `forum`「用對話建立」「跟 Agent 描述需求，由它擬出設定」；積木 `dashboard_customize`「用行銷積木組裝」「勾選報告章節、排序，存成可重複使用的報告技能」。
- 退場：工具箱 `reportAssembly` 項目、conv7 composable 與所有接線、`REPORT` blockType、`ReportAssemblyBlockData`、`reportAssemblyViewBox.vue`、`AiViewerStore` 三個 REPORT action、`TOOL_BLOCK_META.REPORT`、`_AiViewer-report.scss`（工具箱樣式搬回 `_AiViewer.scss`）。完成後 `grep -rn "'REPORT'\|ReportAssembly\|reportAssembly\|conv7" src` 無命中。
- `npm run type-check` 基線 14 個既存錯誤（5 個 AiViewer 檔案），只看有無新增；每個 task 相關 Vitest 全綠才 commit。已知 flaky：`AppMenuTree.*.test.ts` 偶有 teardown 噪音，單跑確認即可。
- 8088 dev server（主 checkout）保持運作；工作在分支 `feat/skill-block-composer` 上直接進行（不開 worktree）。Commit 訊息 conventional commits，結尾空行加 `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`。

---

## File Structure

| 檔案 | 責任 |
|---|---|
| `src/constants/reportSections.ts`（新增） | 三類 21 章節常數、`SECTION_MAP`、`sectionsByCategory` |
| `src/stores/skillStore.ts`（修改） | `Skill.composition`、payload／patch 同名欄位 |
| `src/composables/useSkillStudioConversation.ts`（修改） | `StudioMethod`、draft 新欄位、`deriveFromSections`、`chooseMethod`、`updateBlocks`；`startCreate`／`loadSkill`／`save`／`suggestionChips` 調整 |
| `src/components/Skill/SkillMethodChooser.vue`（新增） | 兩張方式卡 |
| `src/components/Skill/SkillBlockComposer.vue`（新增） | 名稱／說明、已選章節（拖曳排序）、積木庫 |
| `src/scss/components/_SkillBlockComposer.scss`（新增）、`_SkillMethodChooser.scss`（新增） | 樣式 |
| `src/types/AiViewer.ts`（修改） | `activeTab` 加 `'blocks'`；移除 REPORT |
| `src/components/AiViewer/viewBlock/skillBuilderViewBox.vue`（修改）、`_AiViewer-skill.scss` | 選擇畫面、積木 tab、產報告列 |
| `src/views/SkillStudio.vue`（修改）、`_SkillStudio.scss` | 選擇畫面、積木左欄 |
| `AiViewerRightBox.vue`、`AiViewerStore.ts`、`AiViewerContentBox.vue`、`FullAiViewerBlockBox.vue`、`toolBlocks.ts`、`_AiViewer.scss`（修改）；刪 `useReportAssemblyConversation.ts`＋測試、`reportAssemblyViewBox.vue`、`AiViewerStore.reportAssembly.test.ts`、`_AiViewer-report.scss` | 退場 |
| `PROJECT_CONTEXT.md`、`ARCHITECTURE.md` | 文件 |

---

### Task 1: 積木庫常數 ＋ `Skill.composition`

**Files:**
- Create: `src/constants/reportSections.ts`
- Modify: `src/stores/skillStore.ts`（`Skill` L98 附近、`CreateSkillPayload` L157 附近、`StudioPatch` L172、`createPersonalSkill`、`applyStudioPatch`）
- Test: `src/constants/__tests__/reportSections.test.ts`、`src/stores/__tests__/skillStore.test.ts`

**Interfaces:**
- Produces:

```ts
// reportSections.ts
export interface ReportCategory { id: string; label: string; color: string }
export interface ReportSection { id: string; categoryId: string; name: string; description: string }
export const REPORT_CATEGORIES: ReportCategory[]
export const REPORT_SECTIONS: ReportSection[]
export const SECTION_MAP: Record<string, ReportSection>
export function sectionsByCategory(categoryId: string): ReportSection[]
// skillStore.ts
Skill.composition?: { sectionIds: string[] }
CreateSkillPayload.composition?: { sectionIds: string[] }
StudioPatch = Partial<Pick<Skill, 'name' | 'description' | 'instructions' | 'triggerHint' | 'capabilities' | 'composition'>>
```

- [ ] **Step 1: 寫失敗測試**

`src/constants/__tests__/reportSections.test.ts`：

```ts
import { describe, it, expect } from 'vitest'
import { REPORT_CATEGORIES, REPORT_SECTIONS, SECTION_MAP, sectionsByCategory } from '@/constants/reportSections'

describe('reportSections', () => {
  it('三類、順序為 TA 用戶畫像 / 行銷活動成效 / 渠道績效', () => {
    expect(REPORT_CATEGORIES.map(c => c.label)).toEqual(['TA 用戶畫像', '行銷活動成效', '渠道績效'])
  })
  it('21 個章節、id 唯一、每章都屬於既有分類', () => {
    expect(REPORT_SECTIONS).toHaveLength(21)
    expect(new Set(REPORT_SECTIONS.map(s => s.id)).size).toBe(21)
    const catIds = new Set(REPORT_CATEGORIES.map(c => c.id))
    expect(REPORT_SECTIONS.every(s => catIds.has(s.categoryId))).toBe(true)
  })
  it('分類章節數：TA 9、活動成效 7、渠道 5；SECTION_MAP 可查', () => {
    expect(sectionsByCategory('ta')).toHaveLength(9)
    expect(sectionsByCategory('promo')).toHaveLength(7)
    expect(sectionsByCategory('channel')).toHaveLength(5)
    expect(SECTION_MAP.promo_kpi.name).toBe('促銷核心 KPI')
    expect(sectionsByCategory('nope')).toEqual([])
  })
})
```

`src/stores/__tests__/skillStore.test.ts` 在「AI 賦能」describe 內追加：

```ts
    it('createPersonalSkill 與 applyStudioPatch 都能寫入 composition（深拷貝）', () => {
      const store = useSkillStore()
      const ids = ['promo_kpi', 'ta_gender']
      const id = store.createPersonalSkill({
        name: '行銷週報', instructions: '依序產出以下章節：\n1. 促銷核心 KPI', triggerHint: 't',
        isEnabled: true, assignedAgents: [], composition: { sectionIds: ids }, creationMethod: 'manual',
      })
      const s = store.findSkill(id)!
      expect(s.composition).toEqual({ sectionIds: ['promo_kpi', 'ta_gender'] })
      ids.push('ch_kpi')
      expect(s.composition!.sectionIds).toHaveLength(2)
      expect(store.applyStudioPatch(id, { composition: { sectionIds: ['ch_kpi'] } })).toBe(true)
      expect(store.findSkill(id)!.composition).toEqual({ sectionIds: ['ch_kpi'] })
    })
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run src/constants/__tests__/reportSections.test.ts src/stores/__tests__/skillStore.test.ts`
Expected: FAIL（模組不存在；`composition` 未寫入）。

- [ ] **Step 3: 實作常數**

`src/constants/reportSections.ts`：

```ts
// 行銷報告的積木庫（章節目錄）。這是「用行銷積木組裝」技能時的唯一資料來源，
// 前端假資料，等真正串接章節 API 再換。順序＝畫面顯示順序，不帶編號。
export interface ReportCategory { id: string; label: string; color: string }
export interface ReportSection { id: string; categoryId: string; name: string; description: string }

export const REPORT_CATEGORIES: ReportCategory[] = [
  { id: 'ta', label: 'TA 用戶畫像', color: 'var(--tag-blue-text)' },
  { id: 'promo', label: '行銷活動成效', color: 'var(--tag-rust-text)' },
  { id: 'channel', label: '渠道績效', color: 'var(--tag-green-text)' },
]

export const REPORT_SECTIONS: ReportSection[] = [
  { id: 'ta_gender', categoryId: 'ta', name: '性別分布', description: '會員性別分布資料，圖表自動生成。' },
  { id: 'ta_age', categoryId: 'ta', name: '年齡層分布', description: '會員年齡層分布資料，圖表自動生成。' },
  { id: 'ta_gender_age', categoryId: 'ta', name: '性別 × 年齡交叉比較', description: '性別 × 年齡層交叉分布，回答「不同性別的年齡結構」。' },
  { id: 'ta_geo', categoryId: 'ta', name: '地理分布', description: '會員地理分布（佔比 ≥1% 的城市），圖表自動生成。' },
  { id: 'ta_site_register', categoryId: 'ta', name: '站台註冊分布', description: '各站台／來源的註冊會員數與佔比。' },
  { id: 'ta_login_source', categoryId: 'ta', name: '登入來源分布', description: '會員登入方式（帳密、社群、LINE…）分布。' },
  { id: 'ta_member_level', categoryId: 'ta', name: '會員等級分布', description: '各會員等級人數與佔比，含升降級趨勢。' },
  { id: 'ta_persona', categoryId: 'ta', name: '會員人物誌', description: '性別 × 年齡層 × 主力購買品類 × RFM 行為分群的四維輪廓。' },
  { id: 'ta_detail', categoryId: 'ta', name: 'TA 明細資料', description: '符合篩選條件的會員明細清單，可匯出。' },
  { id: 'promo_kpi', categoryId: 'promo', name: '促銷核心 KPI', description: '完成訂單數、GMV、折扣總額、折扣佔比、規則數。' },
  { id: 'promo_ranking', categoryId: 'promo', name: '活動排行', description: '各促銷活動帶動效果排行，並自動生成圖表。' },
  { id: 'promo_type', categoryId: 'promo', name: '活動類型分析', description: '各促銷類型效益（類型分布、有折扣 vs 無折扣 AOV），圖表自動生成。' },
  { id: 'promo_monthly', categoryId: 'promo', name: '月度促銷趨勢', description: '已完成訂單的月度訂單數與 GMV 走勢，圖表自動生成。' },
  { id: 'promo_detail', categoryId: 'promo', name: '完整促銷活動明細', description: '每一檔活動的期間、規則、訂單數、GMV 明細表。' },
  { id: 'promo_coupon', categoryId: 'promo', name: '優惠券使用率明細', description: '各券別發放數、使用數、使用率與帶動 GMV。' },
  { id: 'promo_heatmap', categoryId: 'promo', name: '銷售熱門時段', description: '星期 × 小時的訂單量／GMV 熱力圖，回答「什麼時候該推活動」。' },
  { id: 'ch_kpi', categoryId: 'channel', name: '渠道核心 KPI', description: '各渠道工作階段數、轉換率、收益、每工作階段收益。' },
  { id: 'ch_traffic', categoryId: 'channel', name: '渠道別流量與收益貢獻', description: '各渠道流量佔比與收益貢獻對照，圖表自動生成。' },
  { id: 'ch_device', categoryId: 'channel', name: '使用者活躍時段與裝置輪廓', description: '各渠道使用者活躍時段與裝置（桌機／手機／平板）分布。' },
  { id: 'ch_trend', categoryId: 'channel', name: '渠道整體工作階段數與收益趨勢', description: '整體工作階段數與收益的時間走勢，圖表自動生成。' },
  { id: 'ch_time_cross', categoryId: 'channel', name: '渠道 × 時間交叉分布', description: '渠道 × 星期／小時交叉分布，找出各渠道的黃金時段。' },
]

export const SECTION_MAP: Record<string, ReportSection> = Object.fromEntries(REPORT_SECTIONS.map(s => [s.id, s]))

export function sectionsByCategory(categoryId: string): ReportSection[] {
  return REPORT_SECTIONS.filter(s => s.categoryId === categoryId)
}
```

- [ ] **Step 4: skillStore**

`Skill` 介面在 `files?: SkillFile[]` 後加 `composition?: { sectionIds: string[] }  // 由行銷積木組裝建立的技能；有這欄位就走積木方式`。`CreateSkillPayload` 加同名選填欄位。`StudioPatch` 的 `Pick` 清單加 `'composition'`。

`createPersonalSkill` 物件加 `composition: data.composition ? { sectionIds: [...data.composition.sectionIds] } : undefined,`。
`applyStudioPatch` 加：`if (patch.composition !== undefined) skill.composition = patch.composition ? { sectionIds: [...patch.composition.sectionIds] } : undefined`。

- [ ] **Step 5: 跑測試確認通過**

Run: `npx vitest run src/constants/__tests__/reportSections.test.ts src/stores/__tests__/skillStore.test.ts && npm run type-check`
Expected: 全綠；type-check 無新增。

- [ ] **Step 6: Commit**

```bash
git add src/constants/reportSections.ts src/constants/__tests__/reportSections.test.ts src/stores/skillStore.ts src/stores/__tests__/skillStore.test.ts
git commit -m "feat(skill): add report section catalog and Skill.composition"
```

---

### Task 2: composable — 建立方式、積木推導

**Files:**
- Modify: `src/composables/useSkillStudioConversation.ts`
- Test: `src/composables/__tests__/useSkillStudioConversation.test.ts`

**Interfaces:**
- Consumes: `REPORT_CATEGORIES`、`SECTION_MAP`（Task 1）
- Produces:

```ts
export type StudioMethod = 'chat' | 'blocks'
SkillDraft.method: StudioMethod | null; SkillDraft.sectionIds: string[]
export function deriveFromSections(sectionIds: string[]): Pick<SkillDraft, 'instructions' | 'triggerHint' | 'capabilities'>
// 回傳物件新增：
chooseMethod(method: StudioMethod): void
updateBlocks(patch: { name?: string; description?: string; sectionIds?: string[] }): void
// 行為變更：startCreate() 無 prefill → method null、無訊息；有 prefill → method 'chat' ＋ 開場訊息
// loadSkill：method 依 composition；blocks 不推訊息
// save：blocks → composition + creationMethod 'manual'
// suggestionChips：method !== 'chat' → []
```

- [ ] **Step 1: 更新／新增測試**

既有測項調整：
- `startCreate 是建立模式、草稿空白、只有一則 Agent 開場訊息、canSave 為 false` → 改名為 `startCreate() 無 prefill：建立模式、method 為 null、沒有訊息、canSave 為 false`，斷言 `c.draft.value.method` 為 `null`、`c.messages.value` 長度 0；其餘 `send`／`save`／`suggestionChips` 等從 `startCreate()` 開始的測項，在 `startCreate()` 後加一行 `c.chooseMethod('chat')`。
- `startCreate(prefill, openingMessage)` 測項加斷言 `c.draft.value.method).toBe('chat')`。
- `toSnapshot / hydrate 往返` 測項：`a.startCreate(); a.chooseMethod('chat')`。

新增：

```ts
  it('chooseMethod(chat) 推開場訊息；chooseMethod(blocks) 不推訊息且 suggestionChips 為空', () => {
    const a = useSkillStudioConversation()
    a.startCreate()
    a.chooseMethod('chat')
    expect(a.draft.value.method).toBe('chat')
    expect(a.messages.value).toHaveLength(1)
    expect(a.messages.value[0].content).toBe(DEFAULT_OPENING_MESSAGE)
    const b = useSkillStudioConversation()
    b.startCreate()
    b.chooseMethod('blocks')
    expect(b.draft.value.method).toBe('blocks')
    expect(b.messages.value).toHaveLength(0)
    expect(b.suggestionChips.value).toEqual([])
  })

  it('deriveFromSections：編號步驟、分類觸發條件、每章一項能力；空清單全空', () => {
    const d = deriveFromSections(['promo_kpi', 'ta_gender'])
    expect(d.instructions).toBe('依序產出以下章節：\n1. 促銷核心 KPI：完成訂單數、GMV、折扣總額、折扣佔比、規則數。\n2. 性別分布：會員性別分布資料，圖表自動生成。')
    expect(d.triggerHint).toBe('當使用者要求產出行銷報告，或提到「TA 用戶畫像、行銷活動成效」相關分析時')
    expect(d.capabilities.map(c => c.name)).toEqual(['促銷核心 KPI', '性別分布'])
    expect(deriveFromSections([])).toEqual({ instructions: '', triggerHint: '', capabilities: [] })
    expect(deriveFromSections(['nope']).instructions).toBe('')
  })

  it('updateBlocks：只在 blocks 方式生效；sectionIds 變動才重推導；isDirty/canSave 隨之變化', () => {
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('blocks')
    expect(c.canSave.value).toBe(false)
    c.updateBlocks({ name: '行銷週報' })
    expect(c.canSave.value).toBe(false) // 還沒有章節
    c.updateBlocks({ sectionIds: ['promo_kpi'] })
    expect(c.draft.value.instructions).toContain('1. 促銷核心 KPI')
    expect(c.draft.value.capabilities).toHaveLength(1)
    expect(c.canSave.value).toBe(true)
    expect(c.isDirty.value).toBe(true)
    c.updateBlocks({ description: '每週一產出' })
    expect(c.draft.value.description).toBe('每週一產出')
    expect(c.draft.value.instructions).toContain('1. 促銷核心 KPI') // 未重推導、未清空

    const chat = useSkillStudioConversation()
    chat.startCreate()
    chat.chooseMethod('chat')
    chat.updateBlocks({ sectionIds: ['promo_kpi'] })
    expect(chat.draft.value.sectionIds).toEqual([])
  })

  it('save（blocks）：寫入 composition 與 creationMethod manual；loadSkill 還原 method 與 sectionIds 且不推訊息', () => {
    const store = useSkillStore()
    const c = useSkillStudioConversation()
    c.startCreate()
    c.chooseMethod('blocks')
    c.updateBlocks({ name: '行銷週報', sectionIds: ['promo_kpi', 'ch_kpi'] })
    const id = c.save()!
    const s = store.findSkill(id)!
    expect(s.composition).toEqual({ sectionIds: ['promo_kpi', 'ch_kpi'] })
    expect(s.creationMethod).toBe('manual')

    const d = useSkillStudioConversation()
    expect(d.loadSkill(id)).toBe(true)
    expect(d.draft.value.method).toBe('blocks')
    expect(d.draft.value.sectionIds).toEqual(['promo_kpi', 'ch_kpi'])
    expect(d.messages.value).toHaveLength(0)
    expect(d.isDirty.value).toBe(false)

    const e = useSkillStudioConversation()
    e.loadSkill('personal-001')
    expect(e.draft.value.method).toBe('chat')
    expect(e.messages.value).toHaveLength(1)
  })
```

檔首 import 補 `DEFAULT_OPENING_MESSAGE, deriveFromSections`。

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts`
Expected: 新測項 FAIL；調整過的舊測項因 `chooseMethod` 不存在也 FAIL。

- [ ] **Step 3: 實作**

型別區：

```ts
export type StudioMethod = 'chat' | 'blocks'

export interface SkillDraft {
  name: string
  description: string
  instructions: string
  triggerHint: string
  capabilities: SkillCapability[]
  files: SkillFile[]
  method: StudioMethod | null   // null = 尚未選擇建立方式
  sectionIds: string[]          // 積木方式的已選章節（依序）
}
```

`emptyDraft()` 回傳加 `method: null, sectionIds: []`。`draftFromSkill(s)` 加 `method: s.composition ? 'blocks' : 'chat', sectionIds: [...(s.composition?.sectionIds ?? [])]`。

新增純函式（`draftFromSkill` 之後）：

```ts
import { REPORT_CATEGORIES, SECTION_MAP } from '@/constants/reportSections'

// 積木 → 草稿：步驟＝章節依序編號，能力＝章節，觸發條件＝涵蓋到的分類
export function deriveFromSections(sectionIds: string[]): Pick<SkillDraft, 'instructions' | 'triggerHint' | 'capabilities'> {
  const sections = sectionIds.map(id => SECTION_MAP[id]).filter((s): s is NonNullable<typeof s> => !!s)
  if (sections.length === 0) return { instructions: '', triggerHint: '', capabilities: [] }
  const lines = sections.map((s, i) => `${i + 1}. ${s.name}：${s.description}`)
  const catIds = new Set(sections.map(s => s.categoryId))
  const labels = REPORT_CATEGORIES.filter(c => catIds.has(c.id)).map(c => c.label).join('、')
  return {
    instructions: `依序產出以下章節：\n${lines.join('\n')}`,
    triggerHint: `當使用者要求產出行銷報告，或提到「${labels}」相關分析時`,
    capabilities: sections.map(s => ({ name: s.name, description: s.description })),
  }
}
```

composable 內：

```ts
  const suggestionChips = computed<StudioSuggestion[]>(() => {
    if (draft.value.method !== 'chat') return []
    return mode.value === 'create' ? CREATE_SUGGESTIONS : editSuggestions(draft.value)
  })

  // 無 prefill：等使用者選建立方式（method null、沒有訊息）。
  // 有 prefill（Agent 建議）：一律對話方式，直接推開場
  function startCreate(prefill?: Partial<SkillDraft>, openingMessage?: string): void {
    mode.value = 'create'
    savedSkillId.value = null
    const base = emptyDraft()
    draft.value = {
      ...base,
      ...prefill,
      capabilities: (prefill?.capabilities ?? base.capabilities).map(c => ({ ...c })),
      files: [...(prefill?.files ?? base.files)],
      sectionIds: [...(prefill?.sectionIds ?? base.sectionIds)],
      method: prefill ? 'chat' : null,
    }
    snapshot.value = serialize(emptyDraft())
    messages.value = []
    seq = 0
    if (prefill) push({ role: 'agent', content: openingMessage ?? DEFAULT_OPENING_MESSAGE })
  }

  function chooseMethod(method: StudioMethod): void {
    draft.value = { ...draft.value, method }
    if (method === 'chat' && messages.value.length === 0) push({ role: 'agent', content: DEFAULT_OPENING_MESSAGE })
  }

  // 積木方式的輸入：名稱／說明直接寫；章節變動就重推導步驟／能力／觸發條件
  function updateBlocks(patch: { name?: string; description?: string; sectionIds?: string[] }): void {
    if (draft.value.method !== 'blocks') return
    const next: SkillDraft = { ...draft.value }
    if (patch.name !== undefined) next.name = patch.name
    if (patch.description !== undefined) next.description = patch.description
    if (patch.sectionIds !== undefined) {
      next.sectionIds = [...patch.sectionIds]
      Object.assign(next, deriveFromSections(next.sectionIds))
    }
    draft.value = next
  }
```

`loadSkill`：`draft.value = draftFromSkill(s)` 之後，只在 `draft.value.method === 'chat'` 時 push「我們來調整…」訊息。

`save()`：create 分支 payload 加 `composition: d.method === 'blocks' ? { sectionIds: [...d.sectionIds] } : undefined, creationMethod: d.method === 'blocks' ? 'manual' : 'ai_assisted'`；edit 分支 `applyStudioPatch` 加 `composition: d.method === 'blocks' ? { sectionIds: [...d.sectionIds] } : undefined`。

`hydrate`／`toSnapshot`／`detachSavedSkill` 不用改（draft 整包序列化）。return 加 `chooseMethod, updateBlocks`。

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run src/composables src/views/__tests__/SkillStudio.test.ts src/components/__tests__/skillBuilderViewBox.test.ts src/components/__tests__/skillBuilderViewBox.twoInstance.test.ts && npm run type-check`
Expected: composable 測試全綠。**預期** `SkillStudio.test.ts` 與 `skillBuilderViewBox*.test.ts` 有幾個測項因為建立模式不再自動進對話而失敗——這是 Task 4／5 要接的，這裡只記錄失敗清單到 report，不要去改那些測試。type-check 無新增。

- [ ] **Step 5: Commit**

```bash
git add src/composables/useSkillStudioConversation.ts src/composables/__tests__/useSkillStudioConversation.test.ts
git commit -m "feat(skill): add creation method + block-derived draft to useSkillStudioConversation"
```

---

### Task 3: `SkillMethodChooser.vue` 與 `SkillBlockComposer.vue`

**Files:**
- Create: `src/components/Skill/SkillMethodChooser.vue`、`src/components/Skill/SkillBlockComposer.vue`
- Create: `src/scss/components/_SkillMethodChooser.scss`、`src/scss/components/_SkillBlockComposer.scss`；Modify: `src/scss/components/_index.scss`
- Test: `src/components/__tests__/SkillMethodChooser.test.ts`、`src/components/__tests__/SkillBlockComposer.test.ts`

**Interfaces:**
- Consumes: `REPORT_CATEGORIES`、`REPORT_SECTIONS`、`SECTION_MAP`、`sectionsByCategory`（Task 1）、`StudioMethod`（Task 2）
- Produces:

```ts
// SkillMethodChooser: no props; emits choose(method: StudioMethod)
// SkillBlockComposer: props { name: string; description: string; sectionIds: string[]; compact?: boolean; nameConflict?: boolean }
//   emits 'update:name'(string), 'update:description'(string), 'update:sectionIds'(string[])
```

- [ ] **Step 1: 寫失敗測試**

`src/components/__tests__/SkillMethodChooser.test.ts`：

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SkillMethodChooser from '@/components/Skill/SkillMethodChooser.vue'

describe('SkillMethodChooser', () => {
  it('兩張卡：對話／積木，點擊 emit choose', async () => {
    const w = mount(SkillMethodChooser)
    const cards = w.findAll('.smc-card')
    expect(cards).toHaveLength(2)
    expect(cards[0].text()).toContain('用對話建立')
    expect(cards[1].text()).toContain('用行銷積木組裝')
    await cards[0].trigger('click')
    await cards[1].trigger('click')
    expect(w.emitted('choose')).toEqual([['chat'], ['blocks']])
  })
})
```

`src/components/__tests__/SkillBlockComposer.test.ts`：

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SkillBlockComposer from '@/components/Skill/SkillBlockComposer.vue'

function mountComposer(over: Partial<Record<string, unknown>> = {}) {
  return mount(SkillBlockComposer, {
    props: { name: '', description: '', sectionIds: [], ...over },
    global: { directives: { tooltip: {} } },
  })
}

describe('SkillBlockComposer', () => {
  it('名稱／說明輸入 emit update:name / update:description', async () => {
    const w = mountComposer()
    await w.find('.sbc-name-input').setValue('行銷週報')
    await w.find('.sbc-desc-input').setValue('每週一')
    expect(w.emitted('update:name')?.[0]).toEqual(['行銷週報'])
    expect(w.emitted('update:description')?.[0]).toEqual(['每週一'])
  })

  it('積木庫三個分類、計數 n/總數；點＋ emit 加入；已加入顯示 check 且再點不重複', async () => {
    const w = mountComposer({ sectionIds: ['promo_kpi'] })
    const cats = w.findAll('.sbc-category')
    expect(cats).toHaveLength(3)
    expect(cats[1].find('.sbc-category-count').text()).toBe('1/7')
    const added = w.find('.sbc-palette-item.added')
    expect(added.text()).toContain('促銷核心 KPI')
    expect(added.find('.sbc-add-btn i').text()).toBe('check')
    await added.find('.sbc-add-btn').trigger('click')
    expect(w.emitted('update:sectionIds')).toBeUndefined()
    const other = w.findAll('.sbc-palette-item').find(i => i.text().includes('性別分布'))!
    await other.find('.sbc-add-btn').trigger('click')
    expect(w.emitted('update:sectionIds')?.[0]).toEqual([['promo_kpi', 'ta_gender']])
  })

  it('已選清單依序顯示、可移除；空清單顯示提示', async () => {
    const w = mountComposer({ sectionIds: ['ta_gender', 'promo_kpi'] })
    expect(w.findAll('.sbc-item-name').map(n => n.text())).toEqual(['性別分布', '促銷核心 KPI'])
    await w.findAll('.sbc-remove')[0].trigger('click')
    expect(w.emitted('update:sectionIds')?.[0]).toEqual([['promo_kpi']])
    const empty = mountComposer()
    expect(empty.find('.sbc-empty').text()).toContain('還沒有章節')
  })

  it('拖曳排序：drop 在目標上半部插到前面，下半部插到後面', async () => {
    const w = mountComposer({ sectionIds: ['a1', 'b2', 'c3'].map((_, i) => ['ta_gender', 'promo_kpi', 'ch_kpi'][i]) })
    const items = w.findAll('.sbc-item')
    await items[2].trigger('dragstart', { dataTransfer: { setData() {}, effectAllowed: '' } })
    const rect = { top: 0, height: 40 }
    ;(items[0].element as HTMLElement).getBoundingClientRect = () => rect as DOMRect
    await items[0].trigger('dragover', { clientY: 5 })
    await items[0].trigger('drop')
    expect(w.emitted('update:sectionIds')?.at(-1)).toEqual([['ch_kpi', 'ta_gender', 'promo_kpi']])
  })

  it('nameConflict 顯示提示條；compact 加 is-compact', () => {
    expect(mountComposer({ nameConflict: true }).find('.name-conflict-banner').exists()).toBe(true)
    expect(mountComposer({ compact: true }).classes()).toContain('is-compact')
  })
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run src/components/__tests__/SkillMethodChooser.test.ts src/components/__tests__/SkillBlockComposer.test.ts`
Expected: FAIL — 元件不存在。

- [ ] **Step 3: `SkillMethodChooser.vue`**

```vue
<template>
  <div class="SkillMethodChooser">
    <div class="smc-title">要用哪種方式建立這顆技能？</div>
    <div class="smc-cards">
      <button type="button" class="smc-card smc-card--chat" @click="emit('choose', 'chat')">
        <i class="material-symbols-outlined">forum</i>
        <div class="smc-card-name">用對話建立</div>
        <div class="smc-card-desc">跟 Agent 描述需求，由它擬出設定</div>
      </button>
      <button type="button" class="smc-card smc-card--blocks" @click="emit('choose', 'blocks')">
        <i class="material-symbols-outlined">dashboard_customize</i>
        <div class="smc-card-name">用行銷積木組裝</div>
        <div class="smc-card-desc">勾選報告章節、排序，存成可重複使用的報告技能</div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// 建立方式二選一，選了就固定（對話與積木刻意不混用）
import type { StudioMethod } from '@/composables/useSkillStudioConversation'
const emit = defineEmits<{ choose: [method: StudioMethod] }>()
</script>
```

`src/scss/components/_SkillMethodChooser.scss`：

```scss
.SkillMethodChooser {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  padding: 24px;

  .smc-title { font-size: 14px; font-weight: 600; color: var(--text); }

  .smc-cards { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; }

  .smc-card {
    width: 220px;
    padding: 18px 16px;
    border: 1px solid var(--divider-a50);
    border-radius: 12px;
    background: var(--surface);
    text-align: left;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 6px;
    transition: border-color 0.15s, background-color 0.15s;
    .material-symbols-outlined { font-size: 26px; color: $color_main_1; }
    &:hover { border-color: $color_main_3; background: var(--accent-soft); }
  }
  .smc-card-name { font-size: 14px; font-weight: 700; color: var(--text); }
  .smc-card-desc { font-size: 12.5px; color: var(--text-muted); line-height: 1.5; }
}
```

- [ ] **Step 4: `SkillBlockComposer.vue`**（拖曳邏輯自 `reportAssemblyViewBox.vue` 搬移，改成 emit）

```vue
<template>
  <div :class="['SkillBlockComposer', { 'is-compact': props.compact }]">
    <div class="sbc-head">
      <label class="sbc-field">
        <span class="sbc-label">技能名稱</span>
        <input class="custom-input sbc-name-input" :value="props.name" placeholder="例：行銷週報" @input="emit('update:name', ($event.target as HTMLInputElement).value)" />
      </label>
      <label class="sbc-field">
        <span class="sbc-label">一句說明（選填）</span>
        <input class="custom-input sbc-desc-input" :value="props.description" placeholder="這份報告給誰看、多久產一次" @input="emit('update:description', ($event.target as HTMLInputElement).value)" />
      </label>
      <div v-if="props.nameConflict" class="name-conflict-banner">
        <i class="material-symbols-outlined">info</i>你已經有一個同名的個人技能，建議修改名稱以便區分。
      </div>
    </div>

    <div class="sbc-selected">
      <div class="sbc-selected-head">
        <i class="material-symbols-outlined">stacks</i>已選 {{ props.sectionIds.length }} 個章節
      </div>
      <ol v-if="props.sectionIds.length" class="sbc-list">
        <li
          v-for="sectionId in props.sectionIds"
          :key="sectionId"
          class="sbc-item"
          :class="{ dragging: dragId === sectionId, 'drag-over-before': dragOverId === sectionId && dragOverBefore, 'drag-over-after': dragOverId === sectionId && !dragOverBefore }"
          draggable="true"
          @dragstart.stop="handleDragStart($event, sectionId)"
          @dragend="handleDragEnd"
          @dragover="handleDragOver($event, sectionId)"
          @dragleave="handleDragLeave"
          @drop="handleDrop($event, sectionId)"
        >
          <span class="sbc-handle material-symbols-outlined">drag_indicator</span>
          <span class="sbc-dot" :style="{ '--dot-color': categoryColor(sectionId) }"></span>
          <span class="sbc-item-body">
            <span class="sbc-item-name">{{ sectionName(sectionId) }}</span>
            <span class="sbc-item-desc">{{ sectionDesc(sectionId) }}</span>
          </span>
          <button type="button" class="sbc-remove" v-tooltip="'移除章節'" @click="removeSection(sectionId)">
            <i class="material-symbols-outlined">close</i>
          </button>
        </li>
      </ol>
      <div v-else class="sbc-empty">
        <i class="material-symbols-outlined">library_add</i>還沒有章節，從下方積木庫加入
      </div>
    </div>

    <div class="sbc-palette">
      <details v-for="category in REPORT_CATEGORIES" :key="category.id" class="sbc-category" open>
        <summary>
          <span class="sbc-dot" :style="{ '--dot-color': category.color }"></span>
          <span class="sbc-category-label">{{ category.label }}</span>
          <span class="sbc-category-count">{{ addedCountInCategory(category.id) }}/{{ sectionsByCategory(category.id).length }}</span>
        </summary>
        <div class="sbc-category-items">
          <div v-for="section in sectionsByCategory(category.id)" :key="section.id" class="sbc-palette-item" :class="{ added: props.sectionIds.includes(section.id) }">
            <span class="sbc-item-body">
              <span class="sbc-item-name">{{ section.name }}</span>
              <span class="sbc-item-desc">{{ section.description }}</span>
            </span>
            <button type="button" class="sbc-add-btn" v-tooltip="props.sectionIds.includes(section.id) ? '已加入' : '加入章節'" @click="addSection(section.id)">
              <i class="material-symbols-outlined">{{ props.sectionIds.includes(section.id) ? 'check' : 'add' }}</i>
            </button>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
// 「用行銷積木組裝」的輸入面板：純呈現，選了什麼一律 emit 回去由 composable 推導成草稿。
// 拖曳排序沿用原生 HTML5 drag and drop（自 reportAssemblyViewBox 搬來，不引入新套件）
import { ref } from 'vue'
import { REPORT_CATEGORIES, SECTION_MAP, sectionsByCategory } from '@/constants/reportSections'

const props = defineProps<{
  name: string
  description: string
  sectionIds: string[]
  compact?: boolean
  nameConflict?: boolean
}>()

const emit = defineEmits<{
  'update:name': [value: string]
  'update:description': [value: string]
  'update:sectionIds': [ids: string[]]
}>()

const CATEGORY_MAP = Object.fromEntries(REPORT_CATEGORIES.map(c => [c.id, c]))

function sectionName(id: string): string { return SECTION_MAP[id]?.name ?? id }
function sectionDesc(id: string): string { return SECTION_MAP[id]?.description ?? '' }
function categoryColor(id: string): string {
  const s = SECTION_MAP[id]
  return s ? (CATEGORY_MAP[s.categoryId]?.color ?? 'var(--text-faint)') : 'var(--text-faint)'
}
function addedCountInCategory(categoryId: string): number {
  return sectionsByCategory(categoryId).filter(s => props.sectionIds.includes(s.id)).length
}

function addSection(id: string) {
  if (props.sectionIds.includes(id)) return
  emit('update:sectionIds', [...props.sectionIds, id])
}
function removeSection(id: string) {
  emit('update:sectionIds', props.sectionIds.filter(x => x !== id))
}

const dragId = ref<string | null>(null)
const dragOverId = ref<string | null>(null)
const dragOverBefore = ref(true)

function handleDragStart(event: DragEvent, id: string) {
  dragId.value = id
  event.dataTransfer?.setData('text/plain', id)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}
function handleDragEnd() { dragId.value = null; dragOverId.value = null }
function handleDragOver(event: DragEvent, id: string) {
  event.preventDefault()
  if (id === dragId.value) { dragOverId.value = null; return }
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  dragOverId.value = id
  dragOverBefore.value = (event.clientY - rect.top) < rect.height / 2
}
function handleDragLeave() { dragOverId.value = null }
function handleDrop(event: DragEvent, targetId: string) {
  event.preventDefault()
  dragOverId.value = null
  const from = dragId.value
  if (!from || from === targetId) return
  const next = props.sectionIds.filter(x => x !== from)
  let to = next.indexOf(targetId)
  to = dragOverBefore.value ? to : to + 1
  next.splice(to, 0, from)
  emit('update:sectionIds', next)
}
</script>
```

- [ ] **Step 5: `_SkillBlockComposer.scss`**

以 `src/scss/views/_AiViewer-report.scss` 第 63 行起的 `.reportAssemblyViewBox { … }` 區塊為底本複製到新檔，做以下改名與增補（**不要刪原檔，Task 6 才刪**）：
- `.reportAssemblyViewBox` → `.SkillBlockComposer`；所有 `.report-assembly-` 前綴 → `.sbc-`（`head`→`selected-head`、`count`→保留為 `selected-head` 內文字、`list`→`list`、`item`→`item`、`handle`→`handle`、`dot`→`dot`、`item-body`／`item-name`／`item-desc`、`remove`、`empty`、`palette`、`category`、`category-label`、`category-count`、`category-items`、`palette-item`、`add-btn`）；移除 `save-btn` 規則。
- 新增：

```scss
  .sbc-head { display: flex; flex-direction: column; gap: 10px; }
  .sbc-field { display: flex; flex-direction: column; gap: 4px; }
  .sbc-label { font-size: 11px; font-weight: 600; color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.05em; }
  .sbc-selected { display: flex; flex-direction: column; gap: 10px; }
  .sbc-selected-head { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--text); .material-symbols-outlined { font-size: 18px; } }
  &.is-compact { padding: 14px 14px 18px; gap: 14px; .sbc-item-desc, .sbc-palette-item .sbc-item-desc { display: none; } }
```

`src/scss/components/_index.scss` 加 `@import './SkillMethodChooser';`、`@import './SkillBlockComposer';`（放在 `./SkillSuggestCard` 之後）。

- [ ] **Step 6: 跑測試確認通過**

Run: `npx vitest run src/components/__tests__/SkillMethodChooser.test.ts src/components/__tests__/SkillBlockComposer.test.ts && npm run type-check`
Expected: 全綠。若拖曳測試在 jsdom 對 `dataTransfer` 報錯，改用 `trigger('dragstart')` 不帶 payload（元件用了可選鏈，容許 `dataTransfer` 為 null）。

- [ ] **Step 7: Commit**

```bash
git add src/components/Skill/SkillMethodChooser.vue src/components/Skill/SkillBlockComposer.vue src/scss/components/_SkillMethodChooser.scss src/scss/components/_SkillBlockComposer.scss src/scss/components/_index.scss src/components/__tests__/SkillMethodChooser.test.ts src/components/__tests__/SkillBlockComposer.test.ts
git commit -m "feat(skill): add SkillMethodChooser and SkillBlockComposer components"
```

---

### Task 4: SKILL block — 選擇方式、積木 tab、產一份報告

**Files:**
- Modify: `src/types/AiViewer.ts`（`activeTab` 聯集）
- Modify: `src/components/AiViewer/viewBlock/skillBuilderViewBox.vue`
- Modify: `src/scss/views/_AiViewer-skill.scss`
- Test: `src/components/__tests__/skillBuilderViewBox.test.ts`（更新＋追加）

**Interfaces:**
- Consumes: `chooseMethod`／`updateBlocks`／`draft.method`（Task 2）、`SkillMethodChooser`／`SkillBlockComposer`（Task 3）、`aiviewerStore.addReportBlock(fileUrl, blockName)`（既有）
- Produces: `SkillBuilderBlockData.activeTab: 'chat' | 'blocks' | 'preview' | 'test'`；CSS `.skb-after-save-bar`、`.skb-run-report-btn`

- [ ] **Step 1: 更新／新增測試**

- `預設在對話 tab，顯示開場訊息；切 tab 寫回 block data` → 改為：

```ts
  it('空白 block：先顯示方式選擇、沒有 tab；選對話後出現 對話／預覽／測試 與開場訊息', async () => {
    const { wrapper, block } = mountBlock()
    expect(wrapper.find('.SkillMethodChooser').exists()).toBe(true)
    expect(wrapper.findAll('.skb-tab-btn')).toHaveLength(0)
    await wrapper.findAll('.smc-card')[0].trigger('click')
    await flushPromises()
    expect(block.data.data.snapshot.draft.method).toBe('chat')
    expect(block.data.data.activeTab).toBe('chat')
    expect(wrapper.findAll('.skb-tab-btn').map(t => t.text())).toEqual([expect.stringContaining('對話'), expect.stringContaining('預覽'), expect.stringContaining('測試')])
    expect(wrapper.text()).toContain('技能建立助理')
    await wrapper.findAll('.skb-tab-btn')[1].trigger('click')
    expect(block.data.data.activeTab).toBe('preview')
    expect(wrapper.find('.ssp-tabs').exists()).toBe(false)
  })
```

- 其餘從 `mountBlock()`（無 prefill）開始並直接操作對話的測項（`對話送出後草稿變動會寫回 snapshot`），在 mount 後先 `await wrapper.findAll('.smc-card')[0].trigger('click'); await flushPromises()`。
- `儲存：建立個人技能…` 測項用的是 prefill → 已是對話方式，不用改。
- 新增：

```ts
  it('選積木：tab 為 積木／預覽／測試；勾章節＋命名 → 預覽步驟 → 儲存寫入 composition → 出現「產一份報告」→ 點擊放上報告 block 且列消失', async () => {
    const { wrapper, block, store } = mountBlock()
    const skillStore = useSkillStore()
    await wrapper.findAll('.smc-card')[1].trigger('click')
    await flushPromises()
    expect(block.data.data.snapshot.draft.method).toBe('blocks')
    expect(wrapper.findAll('.skb-tab-btn').map(t => t.text())).toEqual([expect.stringContaining('積木'), expect.stringContaining('預覽'), expect.stringContaining('測試')])
    expect(wrapper.find('.SkillBlockComposer').exists()).toBe(true)

    await wrapper.find('.sbc-name-input').setValue('行銷週報')
    const items = wrapper.findAll('.sbc-palette-item')
    await items.find(i => i.text().includes('促銷核心 KPI'))!.find('.sbc-add-btn').trigger('click')
    await items.find(i => i.text().includes('渠道核心 KPI'))!.find('.sbc-add-btn').trigger('click')
    await flushPromises()
    expect(block.data.data.snapshot.draft.sectionIds).toEqual(['promo_kpi', 'ch_kpi'])
    expect(block.blockName).toBe('行銷週報')

    await wrapper.findAll('.skb-tab-btn')[1].trigger('click')
    expect(wrapper.find('.ssp-title').text()).toBe('行銷週報')
    expect(wrapper.text()).toContain('1. 促銷核心 KPI')
    expect(wrapper.findAll('.ssp-cap-chip').map(c => c.text())).toEqual(['促銷核心 KPI', '渠道核心 KPI'])

    const blocksBefore = store.aiViewerBlocks.length
    await wrapper.find('.ssp-save-btn').trigger('click')
    await flushPromises()
    const saved = skillStore.myPersonalSkills[0]
    expect(saved.composition).toEqual({ sectionIds: ['promo_kpi', 'ch_kpi'] })
    expect(saved.creationMethod).toBe('manual')
    expect(block.data.data.activeTab).toBe('test')
    const bar = wrapper.find('.skb-after-save-bar')
    expect(bar.exists()).toBe(true)
    await bar.find('.skb-run-report-btn').trigger('click')
    await flushPromises()
    expect(store.aiViewerBlocks.length).toBe(blocksBefore + 1)
    const report = store.aiViewerBlocks.find((b: any) => b.blockName === '行銷週報.html')
    expect(report.data.blockType).toBe('HTML')
    expect(report.data.data.fileUrl).toBe('/justagent/hurricane_trailsetter_campaign_performance.html')
    expect(wrapper.find('.skb-after-save-bar').exists()).toBe(false)
  })

  it('conv4 預填 block（prefill）直接是對話 tab，沒有方式選擇畫面', () => {
    const { wrapper } = mountBlock({ prefill: { name: 'x', instructions: '1. a' }, openingMessage: '開場' })
    expect(wrapper.find('.SkillMethodChooser').exists()).toBe(false)
    expect(wrapper.find('.SkillStudioChat').exists()).toBe(true)
  })
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run src/components/__tests__/skillBuilderViewBox.test.ts`
Expected: 新測項 FAIL。

- [ ] **Step 3: 型別**

`src/types/AiViewer.ts`：`activeTab: 'chat' | 'blocks' | 'preview' | 'test'`。

- [ ] **Step 4: 元件**

`skillBuilderViewBox.vue` 改動：

template 的 `.skb-toolbar` 內 tabs 改成依方式：

```vue
      <div class="skb-tabs" v-if="method">
        <button v-for="t in tabs" :key="t.id" type="button" :class="['skb-tab-btn', { 'is-active': activeTab === t.id }]" @click="setTab(t.id)">
          <i class="material-symbols-outlined">{{ t.icon }}</i>{{ t.label }}
        </button>
      </div>
      <div v-else class="skb-tabs-placeholder">技能建立</div>
```

在 `.skb-missing-bar` 之後、`.skb-body` 之前加：

```vue
    <div v-if="showRunReport" class="skb-after-save-bar">
      <span>技能已儲存。要不要現在用這顆技能產一份報告？</span>
      <button type="button" class="custom-btn custom-main-btn skb-run-report-btn" @click="runReport">
        <i class="material-symbols-outlined">play_arrow</i>產一份報告
      </button>
    </div>
```

`.skb-body` 內：

```vue
      <SkillMethodChooser v-if="!method" @choose="onChooseMethod" />
      <SkillStudioChat v-else-if="activeTab === 'chat'" … （原樣）/>
      <SkillBlockComposer
        v-else-if="activeTab === 'blocks'"
        compact
        :name="conv.draft.value.name"
        :description="conv.draft.value.description"
        :section-ids="conv.draft.value.sectionIds"
        :name-conflict="nameConflict"
        @update:name="v => conv.updateBlocks({ name: v })"
        @update:description="v => conv.updateBlocks({ description: v })"
        @update:section-ids="ids => conv.updateBlocks({ sectionIds: ids })"
      />
      <SkillStudioPreview v-else … （原樣）/>
```

script 新增／修改：

```ts
import type { StudioMethod } from '@/composables/useSkillStudioConversation'
import SkillMethodChooser from '@/components/Skill/SkillMethodChooser.vue'
import SkillBlockComposer from '@/components/Skill/SkillBlockComposer.vue'

const REPORT_FILE = '/justagent/hurricane_trailsetter_campaign_performance.html'

const method = computed(() => conv.draft.value.method)
const tabs = computed<{ id: BlockTab; icon: string; label: string }[]>(() => [
  method.value === 'blocks'
    ? { id: 'blocks', icon: 'dashboard_customize', label: '積木' }
    : { id: 'chat', icon: 'forum', label: '對話' },
  { id: 'preview', icon: 'preview', label: '預覽' },
  { id: 'test', icon: 'science', label: '測試' },
])

// 儲存後只提示一次「產一份報告」；再存一次會再出現
const showRunReport = ref(false)

function onChooseMethod(m: StudioMethod) {
  conv.chooseMethod(m)
  setTab(m === 'blocks' ? 'blocks' : 'chat')
}

function runReport() {
  const name = conv.draft.value.name.trim() || '行銷報告'
  aiviewerStore.addReportBlock(REPORT_FILE, `${name}.html`)
  popDialog.toast('已把報告放到畫布上')
  showRunReport.value = false
}
```

`onSave()` 在 `if (!id) return` 之後加 `showRunReport.value = conv.draft.value.method === 'blocks'`。刪除原本固定的 `TABS` 常數（改用 `tabs` computed）。若 block data 的 `activeTab` 是 `'chat'` 但方式是 `'blocks'`（例如 hydrate 到舊快照），`previewTab` 不受影響；`activeTab === 'chat'` 且 `method === 'blocks'` 時 `.skb-body` 會落到 `SkillStudioPreview`——為避免這種錯位，`applySnapshot` 之後若 `method === 'blocks' && activeTab === 'chat'` 就 `setTab('blocks')`。

- [ ] **Step 5: SCSS**

`_AiViewer-skill.scss` 在 `.skb-origin-bar, .skb-missing-bar` 規則之後加：

```scss
  .skb-tabs-placeholder { font-size: 13px; font-weight: 600; color: var(--text-muted); padding: 6px 4px; }

  .skb-after-save-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 12px;
    font-size: 12.5px;
    color: var(--text);
    background: var(--primary-a08);
    border-bottom: 1px solid var(--divider-a50);
    flex-shrink: 0;
    .skb-run-report-btn { gap: 4px; white-space: nowrap; .material-symbols-outlined { font-size: 16px; } }
  }

  .skb-body .SkillBlockComposer,
  .skb-body .SkillMethodChooser { height: 100%; min-height: 0; overflow-y: auto; }
```

- [ ] **Step 6: 跑測試確認通過**

Run: `npx vitest run src/components/__tests__/skillBuilderViewBox.test.ts src/components/__tests__/skillBuilderViewBox.twoInstance.test.ts src/stores/__tests__/AiViewerStore.skillBuilder.test.ts && npm run type-check`
Expected: 全綠（twoInstance 測試從 `mountBlock({ prefill… })` 或先選對話開始——若它用無 prefill 的 mount，補一行選對話）。`AiViewerStore.skillBuilder.test.ts` 的「空白建立…開場訊息」斷言 `snapshot.messages` 長度改為 0（無 prefill 不再有開場）。type-check 無新增。

- [ ] **Step 7: Commit**

```bash
git add src/types/AiViewer.ts src/components/AiViewer/viewBlock/skillBuilderViewBox.vue src/scss/views/_AiViewer-skill.scss src/components/__tests__/skillBuilderViewBox.test.ts src/components/__tests__/skillBuilderViewBox.twoInstance.test.ts src/stores/__tests__/AiViewerStore.skillBuilder.test.ts
git commit -m "feat(aiviewer): SKILL block chooses creation method; blocks tab + run-report after save"
```

---

### Task 5: AI 賦能頁 — 選擇方式、積木左欄

**Files:**
- Modify: `src/views/SkillStudio.vue`、`src/scss/views/_SkillStudio.scss`
- Test: `src/views/__tests__/SkillStudio.test.ts`

**Interfaces:**
- Consumes: Task 2／3 介面。

- [ ] **Step 1: 更新／新增測試**

在 `SkillStudio.test.ts` 加 helper：

```ts
async function chooseChat(wrapper: any) {
  await wrapper.findAll('.smc-card')[0].trigger('click')
  await flushPromises()
}
```

- `無 query：建立模式…`：改為先斷言 `.SkillMethodChooser` 存在、`.ssc-mode-chip` 不存在；`chooseChat` 後原斷言成立。
- `送出訊息 → …`、`切換技能下拉…`、`同名個人技能…`：`mountAt()` 後先 `await chooseChat(wrapper)`。
- `同一路由 query 變化（skillId 移除）…`：斷言改為 `.SkillMethodChooser` 存在（退回建立模式＝回到選擇畫面）。
- `同一路由 query 變化：找不到的 skillId…`：同樣斷言選擇畫面存在＋預覽 tab active。
- 新增：

```ts
  it('選「用行銷積木組裝」：左欄變成積木面板；勾章節、命名、儲存 → 個人技能有 composition', async () => {
    const { wrapper } = await mountAt()
    await wrapper.findAll('.smc-card')[1].trigger('click')
    await flushPromises()
    expect(wrapper.find('.studio-chat-col .SkillBlockComposer').exists()).toBe(true)
    expect(wrapper.find('.SkillStudioChat').exists()).toBe(false)
    await wrapper.find('.sbc-name-input').setValue('行銷週報')
    await wrapper.findAll('.sbc-palette-item').find(i => i.text().includes('活動排行'))!.find('.sbc-add-btn').trigger('click')
    await flushPromises()
    expect(wrapper.find('.ssp-title').text()).toBe('行銷週報')
    expect(wrapper.text()).toContain('1. 活動排行')
    await wrapper.find('.ssp-save-btn').trigger('click')
    await flushPromises()
    const store = useSkillStore()
    expect(store.myPersonalSkills[0].composition).toEqual({ sectionIds: ['promo_ranking'] })
    expect(wrapper.find('.skb-after-save-bar').exists()).toBe(false) // 頁面沒有畫布，不提供產報告
  })

  it('?skillId= 指向有 composition 的技能：左欄直接是積木面板且勾選還原', async () => {
    setActivePinia(createPinia())
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '渠道週報', instructions: '依序產出以下章節：\n1. 渠道核心 KPI', triggerHint: 't', isEnabled: true, assignedAgents: [], composition: { sectionIds: ['ch_kpi'] } })
    const { wrapper } = await mountAt({ skillId: id })
    expect(wrapper.find('.SkillBlockComposer').exists()).toBe(true)
    expect(wrapper.findAll('.sbc-item-name').map(n => n.text())).toEqual(['渠道核心 KPI'])
    expect(wrapper.find('.SkillMethodChooser').exists()).toBe(false)
  })

  it('積木方式的左欄也有「建立新技能」，點擊回到方式選擇', async () => {
    const { wrapper } = await mountAt()
    await wrapper.findAll('.smc-card')[1].trigger('click')
    await flushPromises()
    await wrapper.find('.studio-new-btn').trigger('click')
    await flushPromises()
    expect(wrapper.find('.SkillMethodChooser').exists()).toBe(true)
  })
```

（`mountAt` 內的 `beforeEach` 已 `setActivePinia`；第二個新測項在 `mountAt` 前需要先拿 store 建技能，所以自行 `setActivePinia(createPinia())` 一次再建。）

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run src/views/__tests__/SkillStudio.test.ts`
Expected: 新測項與改過的測項 FAIL。

- [ ] **Step 3: 實作**

`SkillStudio.vue` 左欄改為：

```vue
        <div class="studio-chat-col">
          <SkillMethodChooser v-if="!conv.draft.value.method" @choose="conv.chooseMethod" />
          <SkillStudioChat v-else-if="conv.draft.value.method === 'chat'" … （原樣）/>
          <div v-else class="studio-composer-col">
            <div class="studio-composer-head">
              <span class="ssc-mode-chip ssc-mode-chip--edit">
                <i class="material-symbols-outlined">dashboard_customize</i>{{ conv.mode.value === 'create' ? '用行銷積木組裝' : `修改：${conv.draft.value.name}` }}
              </span>
              <button type="button" class="custom-btn studio-new-btn" @click="onNewSkill">
                <i class="material-symbols-outlined">add</i>建立新技能
              </button>
            </div>
            <SkillBlockComposer
              :name="conv.draft.value.name"
              :description="conv.draft.value.description"
              :section-ids="conv.draft.value.sectionIds"
              :name-conflict="nameConflict"
              @update:name="v => conv.updateBlocks({ name: v })"
              @update:description="v => conv.updateBlocks({ description: v })"
              @update:section-ids="ids => conv.updateBlocks({ sectionIds: ids })"
            />
          </div>
        </div>
```

imports 加 `SkillMethodChooser`、`SkillBlockComposer`。`applyQuery` 與 `onNewSkill` 內的 `conv.startCreate()` 不變（無 prefill → 回到選擇畫面）。

`_SkillStudio.scss` 追加（`.SkillStudio` 區塊內）：

```scss
  .studio-composer-col { display: flex; flex-direction: column; height: 100%; min-height: 0; }
  .studio-composer-head {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 12px 16px; border-bottom: 1px solid var(--divider-a50); flex-shrink: 0;
    .studio-new-btn { gap: 4px; font-size: 12.5px; white-space: nowrap; .material-symbols-outlined { font-size: 16px; } }
  }
  .studio-composer-col .SkillBlockComposer { flex: 1; min-height: 0; overflow-y: auto; }
  .studio-chat-col .SkillMethodChooser { height: 100%; }
```

`.ssc-mode-chip` 定義在 `.SkillStudioChat` 底下，這裡在頁面重用要能生效——把 `.ssc-mode-chip` 規則從 `.SkillStudioChat { … }` 內搬到同檔頂層（`.SkillStudio` 之後、`.SkillStudioChat` 之前），讓兩處共用；不改樣式內容。

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run src/views/__tests__/SkillStudio.test.ts src/components/__tests__/SkillStudioChat.test.ts && npm run type-check`
Expected: 全綠。

- [ ] **Step 5: Commit**

```bash
git add src/views/SkillStudio.vue src/scss/views/_SkillStudio.scss src/views/__tests__/SkillStudio.test.ts
git commit -m "feat(skill): SkillStudio page chooses creation method; block composer column"
```

---

### Task 6: 退場 — 工具箱項目、conv7、REPORT block

**Files:**
- Modify: `src/components/AiViewer/AiViewerRightBox.vue`（L721、L829、L883、L900、L1020、L1052-1058、L1075-1079、L2430-2437、L3427、L3531 附近）
- Modify: `src/stores/AiViewerStore.ts`（L4 import、L1008-1050、L1170-1172）
- Modify: `src/components/AiViewer/AiViewerContentBox.vue`（L57、L202、L261-263、L353、L356）、`FullAiViewerBlockBox.vue`（L50-53、L76）
- Modify: `src/types/AiViewer.ts`（L40、L62-66、L115）、`src/constants/toolBlocks.ts`、`src/constants/__tests__/toolBlocks.test.ts`、`src/stores/__tests__/AiViewerStore.skillBuilder.test.ts:67`、`src/composables/__tests__/useSkillSuggestion.test.ts:106`
- Modify: `src/scss/views/_AiViewer.scss`（L4289 import；工具箱樣式搬入）
- Delete: `src/composables/useReportAssemblyConversation.ts`、`src/composables/__tests__/useReportAssemblyConversation.test.ts`、`src/components/AiViewer/viewBlock/reportAssemblyViewBox.vue`、`src/stores/__tests__/AiViewerStore.reportAssembly.test.ts`、`src/scss/views/_AiViewer-report.scss`

- [ ] **Step 1: 先改測試**

- `toolBlocks.test.ts`：移除 `isToolBlock('REPORT')` 與 `TOOL_BLOCK_META.REPORT` 斷言；加 `expect(isToolBlock('REPORT' as any)).toBe(false)` 不需要（型別已無 REPORT），改為 `expect(Object.keys(TOOL_BLOCK_META)).toEqual(['SKILL'])`。
- `AiViewerStore.skillBuilder.test.ts` L67：`store.addReportAssemblyBlock(['promo_kpi'])` 改為建立一個 HTML block：`store.addReportBlock('/justagent/x.html', 'x.html')`，再取其 id（`store.aiViewerBlocks.find((b: any) => b.blockName === 'x.html').id`）當非 SKILL 的 id 測 `updateSkillBuilderBlock` 回 false。
- `useSkillSuggestion.test.ts` L106：`'conv7-satisfied'` 改成 `'conv9-something'`（只是任意非 skill-suggest 前綴）。
- `git rm` 上列四個刪除檔（scss 稍後）。

- [ ] **Step 2: `AiViewerRightBox.vue`**

- 刪 L829 import、L1052-1058 的解構區塊（含 `} = useReportAssemblyConversation();`）。
- L721 placeholder 改回固定 `placeholder="請輸入您的需求"`。
- L883 `currentConversationTitle` 的 conv7 分支刪除；L900 `watch(currentConversationId)` 的 `else if (id === 'conv7') { … }` 刪除。
- L1020 工具箱 `reportAssembly` 項目刪除；`openToolboxTool` 的 `if (item.id === 'reportAssembly') { … }` 刪除，函式上方註解改為「點擊工具箱項目：目前只有「技能建立」可用，其餘 enabled: false 不處理」。
- dispatcher 的 `conv7-satisfied`／`conv7-adjust` 兩個分支刪除。
- L3427 `testMsgs` 的 `: currentConversationId.value === 'conv7' ? conv7Msgs.value` 刪除；L3531 `resetConversation` 的 conv7 區塊刪除。
- 完成後 `grep -n "conv7\|reportAssembly\|ReportAssembly" src/components/AiViewer/AiViewerRightBox.vue` 必須無命中。

- [ ] **Step 3: store／型別／block shell**

- `AiViewerStore.ts`：import 移除 `ReportAssemblyBlockData`；刪除 `addReportAssemblyBlock`、`updateReportAssemblySections`、`saveReportAssemblyTemplate` 三支與 return 三行。
- `types/AiViewer.ts`：刪 `REPORT: ReportAssemblyBlockData;`、`ReportAssemblyBlockData` 型別與其 export。
- `AiViewerContentBox.vue`：resizable 清單移除 `props.source.blockType === 'REPORT' ||`；content-box class 移除 `'for-REPORT'`；刪 `<reportAssemblyViewBox …/>` 分支、import、`ReportAssemblyBlockData` type import。
- `FullAiViewerBlockBox.vue`：刪 REPORT 分支與 import。
- `toolBlocks.ts`：刪 `REPORT` 條目，註解改「功能型 block：目前只有 SKILL」。

- [ ] **Step 4: SCSS**

- 把 `_AiViewer-report.scss` L1-62（`.toolbox-fn-box` 及其上方註解）原樣剪貼到 `_AiViewer.scss` 的 `@import "./AiViewer-report";` 原位置（L4289），並刪除該 `@import` 行；`@import "./AiViewer-skill";` 保留。
- `git rm src/scss/views/_AiViewer-report.scss`。
- `_AiViewer.scss` 內若有 `.content-box.for-REPORT` 專屬規則（grep `for-REPORT`），刪除。

- [ ] **Step 5: 驗證**

Run:

```bash
npm run type-check && npx vitest run && grep -rn "'REPORT'\|ReportAssembly\|reportAssembly\|conv7" src; echo "grep exit=$?"
```

Expected: type-check 14 個既存錯誤（`AiViewerContentBox.vue` 仍 7 個）；全套測試綠；grep 無命中（exit=1）。

手動（8088）：工具箱只有「技能建立」；點它 → 方式選擇 → 選積木 → 勾章節 → 儲存 → 「產一份報告」→ 畫布多一個 HTML 報告 block；沙盒與技能管理正常。

- [ ] **Step 6: Commit**

```bash
git add -A src/components/AiViewer src/stores src/types src/constants src/composables src/scss
git commit -m "refactor(aiviewer): retire 行銷報告生成 toolbox item, conv7 and REPORT block (absorbed by SKILL block composer)"
```

---

### Task 7: 文件與全量驗證

**Files:**
- Modify: `PROJECT_CONTEXT.md`（3.3、3.10）、`ARCHITECTURE.md`（區塊類型段落）

- [ ] **Step 1: `PROJECT_CONTEXT.md`**

3.3 區塊類型那條改為：

```markdown
- 可建立多種內容**區塊（Block）**：檔案型 PDF、Excel、PPT、圖片、Markdown、HTML、TXT、Word、Chart；**功能型** SKILL（技能建立）。功能型區塊在畫布上以實色卡片＋header 徽章與檔案區塊區隔，代表「可操作的工具」而不是「一份檔案」
```

3.3 工具箱那條改為：

```markdown
- 工具箱（輸入區 ⚒）：只有「技能建立」，放一個 SKILL 區塊。區塊一開始先選建立方式——「用對話建立」（對話／預覽／測試三 tab）或「用行銷積木組裝」（積木／預覽／測試三 tab：勾選 TA 用戶畫像／行銷活動成效／渠道績效的報告章節、排序、命名）。兩種方式都以「儲存為個人技能」收尾；積木方式的技能帶 `composition`，儲存後可在區塊內「產一份報告」把報告放到畫布
```

3.10 AI 賦能那條在句尾補：「建立模式一進來同樣先選「用對話建立／用行銷積木組裝」；有 `composition` 的技能開啟時直接是積木面板。」

- [ ] **Step 2: `ARCHITECTURE.md`**

把 Task 8（上一輪）加入的 blockType 句子改為：

```markdown
blockType 分兩類：檔案型（PDF/EXCEL/PPT/IMAGE/CHART/TXT/HTML/MD/WORD/OTHER）與功能型（目前只有 SKILL）。功能型的 icon／label 由 `src/constants/toolBlocks.ts` 的 `TOOL_BLOCK_META` 統一提供，`AiViewerContentBox` 依此掛 `is-tool` 樣式與 header 徽章；SKILL 區塊的狀態以 `StudioSnapshot` 存在 block data，由 `viewBlock/skillBuilderViewBox.vue` hydrate／寫回。行銷報告章節目錄在 `src/constants/reportSections.ts`，積木 → 步驟／能力／觸發條件的推導是 `useSkillStudioConversation.ts` 的純函式 `deriveFromSections`。
```

- [ ] **Step 3: 全量驗證**

Run: `npm run type-check && npm run test:unit`
Expected: 14 個既存錯誤；全綠。

- [ ] **Step 4: Commit**

```bash
git add PROJECT_CONTEXT.md ARCHITECTURE.md
git commit -m "docs: block composer as a skill-creation method; REPORT block retired"
```

---

## Self-Review

**Spec coverage**

| Spec | Task |
|---|---|
| §4.1 `SkillDraft.method/sectionIds`、§4.5 推導、§5 composable | 2 |
| §4.2 `Skill.composition` | 1 |
| §4.3 `activeTab` 加 `'blocks'` | 4 |
| §4.4 積木庫 | 1 |
| §6.1 `SkillMethodChooser`、§6.2 `SkillBlockComposer` | 3 |
| §6.3 SKILL block（選擇、積木 tab、產報告列） | 4 |
| §6.4 AI 賦能頁 | 5 |
| §7 退場清單 | 6 |
| §9 邊界（空名稱／零章節→canSave false；未知 id 略過；conv4 走對話；名稱重複 banner） | 2、3、4 |
| §10 測試 | 各 task |
| §11 文件 | 7 |

**Placeholder scan**：無 TBD／TODO；退場步驟列出每個檔案與行號錨點；SCSS 搬移列出前綴對應。

**Type consistency**：`StudioMethod`／`draft.method`／`draft.sectionIds`／`chooseMethod`／`updateBlocks`／`deriveFromSections`（T2）在 T4、T5 依同名使用；`SkillBlockComposer` props `name/description/sectionIds/compact/nameConflict` 與 emits `update:name/update:description/update:sectionIds`（T3）在 T4、T5 一致；`Skill.composition { sectionIds }`（T1）在 T2 save／loadSkill、T4／T5 測試一致；`addReportBlock(fileUrl, blockName)` 為既有簽名。
