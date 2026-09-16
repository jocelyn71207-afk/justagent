# 技能建立畫布 Block（SKILL）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 AiViewer 畫布新增「技能建立」功能型 block（blockType `SKILL`），block 內自帶對話／預覽／測試三個 tab；REPORT 與 SKILL 共用一套功能型 block 外觀；工具箱與 conv4 Agent 建議兩個入口都直接在畫布放 block。

**Architecture:** block 的狀態以可序列化快照（`StudioSnapshot`）存在 block data 裡，`skillBuilderViewBox.vue` 掛載時 `hydrate()`、變動時 `toSnapshot()` 寫回 `AiViewerStore`；UI 完全重用 `SkillStudioChat`／`SkillStudioPreview`（各加一個選填 prop）。功能型外觀由 `TOOL_BLOCK_META` 常數驅動，`AiViewerContentBox` 依 blockType 掛 `is-tool` class 與徽章。conv4 的建議流程改為「按是 → 放 block」，`useSkillSuggestion` 改依賴 `AiViewerStore`。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Pinia、vue-router、Vitest + @vue/test-utils、SCSS（`src/scss/`）。

**Spec:** `docs/superpowers/specs/2026-09-16-skill-builder-canvas-block-design.md`

## Global Constraints

- 只用 `<script setup lang="ts">`；禁止 `<style scoped>`；樣式放 `src/scss/`；imports 用 `@/`；顏色只用 CSS custom properties／既有 SCSS 變數，不寫死 hex。
- 新 blockType 名稱固定 `SKILL`；block id 前綴 `skillbuilder-`；預設尺寸 640×750；未命名時 `blockName` = `技能建立`。
- `TOOL_BLOCK_META`：`REPORT → { icon: 'bar_chart', label: '報告組裝' }`、`SKILL → { icon: 'auto_fix_high', label: '技能建立' }`；工具箱項目 `{ id: 'skillBuilder', icon: 'auto_fix_high', name: '技能建立', description: '用對話建立、測試個人技能', enabled: true }`。
- 功能型 block 外觀：`.AiViewerContentBox.is-tool` 實色 `--page-bg`、無 backdrop-filter、邊框 `--primary-a20`、header 底 `--primary-a08`、徽章 `.tool-badge` 用 `%badge-shape` + `--tag-teal-*`。
- `SkillSuggestStage = 'ask' | 'placed' | 'skipped'`；data-action：`skill-suggest-build`、`skill-suggest-skip`、`pan-to-block`（`data-value` = blockId）。`skill-suggest-confirm` 與 `goto-skill-studio` 移除。
- 文案：conv4 placed 卡「已在畫布放上「{name}」的技能建立工具，設定先幫你填好了，確認後在區塊裡按「儲存為個人技能」。」＋「前往區塊」；block 開場「這顆技能來自本對話的「{reason}」流程，設定我先填好了。想調整就直接說，確認後按「儲存為個人技能」。」；脈絡條「來自本對話的「{reason}」流程」；找不到區塊 toast「這個區塊已不在畫布上」；技能已刪提示「這顆技能已不存在，儲存會建立新的個人技能」。
- AI 賦能頁（`SkillStudio.vue`）行為不變，其測試 `src/views/__tests__/SkillStudio.test.ts` 必須原樣通過。
- `npm run type-check` 基線有 14 個既存錯誤（AiViewerContentBox.vue ×7、excelViewBox ×3、htmlFileViewBox ×1、pdfViewBox ×1、AiViewer.vue ×2），只看有無新增；每個 task 結束前相關 Vitest 全綠才 commit。
- 已知 flaky：`AppMenuTree.*.test.ts` 在全套跑時偶有 async teardown 噪音，單跑即過；看到就單跑確認並記錄，不修。
- 開發伺服器（port 8088，主 checkout）保持運作，不要殺掉。
- Commit 訊息 conventional commits，結尾空一行加 `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`。

---

## File Structure

| 檔案 | 責任 |
|---|---|
| `src/composables/useSkillStudioConversation.ts`（修改） | 新增 `StudioSnapshot`、`toSnapshot()`、`hydrate()`、`detachSavedSkill()`；`startCreate(prefill?, openingMessage?)` |
| `src/types/AiViewer.ts`（修改） | `SKILL` blockType、`SkillBuilderBlockData`、`SkillBlockOrigin` |
| `src/constants/toolBlocks.ts`（新增） | `TOOL_BLOCK_META`、`isToolBlock()` |
| `src/stores/AiViewerStore.ts`（修改） | `addSkillBuilderBlock()`、`updateSkillBuilderBlock()` |
| `src/components/Skill/SkillStudioChat.vue`、`SkillStudioPreview.vue`（修改） | `compact` / `hideTabs` 選填 props |
| `src/components/AiViewer/viewBlock/skillBuilderViewBox.vue`（新增） | block 內三 tab、hydrate/sync、儲存、在 AI 賦能開啟 |
| `src/scss/views/_AiViewer-skill.scss`（新增）、`_AiViewer.scss`、`_SkillStudio.scss`（修改） | block 樣式、功能型 chrome、compact 樣式 |
| `src/components/AiViewer/AiViewerContentBox.vue`、`FullAiViewerBlockBox.vue`（修改） | SKILL 分支、tool chrome、放大 |
| `src/composables/useSkillSuggestion.ts`、`src/components/AiViewer/SkillSuggestCard.vue`、`AiViewerRecord.vue`（修改） | ask／placed／skipped 三階段，build 放 block |
| `src/components/AiViewer/AiViewerRightBox.vue`（修改） | 工具箱項目與 handler、`pan-to-block`、conv4 offer 帶 conversationId、移除 `goto-skill-studio` |
| `PROJECT_CONTEXT.md`、`ARCHITECTURE.md`（修改） | 文件 |

---

### Task 1: composable 快照與預填建立

**Files:**
- Modify: `src/composables/useSkillStudioConversation.ts`（`useSkillStudioConversation()` 內部與 return）
- Test: `src/composables/__tests__/useSkillStudioConversation.test.ts`

**Interfaces:**
- Produces:

```ts
export interface StudioSnapshot { mode: StudioMode; savedSkillId: string | null; draft: SkillDraft; messages: StudioMessage[] }
export const DEFAULT_OPENING_MESSAGE: string
// 新增於 useSkillStudioConversation() 回傳物件：
startCreate(prefill?: Partial<SkillDraft>, openingMessage?: string): void   // 有 prefill 時 isDirty=true
toSnapshot(): StudioSnapshot                                                 // 深拷貝
hydrate(snap: StudioSnapshot): void                                          // 還原；之後 isDirty=false
detachSavedSkill(): void                                                     // savedSkillId=null、mode='create'、isDirty=true
```

- [ ] **Step 1: 寫失敗測試**

在 `describe('useSkillStudioConversation', …)` 內追加：

```ts
  it('startCreate(prefill, openingMessage)：草稿預填、isDirty 為 true、canSave 依內容、開場訊息採用指定文字', () => {
    const c = useSkillStudioConversation()
    c.startCreate(
      { name: '產品銷售報告整理', instructions: '1. 查詢\n2. 套用規範', triggerHint: '偵測到整理需求' },
      '這顆技能來自本對話的「查詢銷售資料」流程。'
    )
    expect(c.mode.value).toBe('create')
    expect(c.draft.value.name).toBe('產品銷售報告整理')
    expect(c.draft.value.description).toBe('')
    expect(c.isDirty.value).toBe(true)
    expect(c.canSave.value).toBe(true)
    expect(c.messages.value).toHaveLength(1)
    expect(c.messages.value[0].content).toBe('這顆技能來自本對話的「查詢銷售資料」流程。')
  })

  it('預填後的第一句走改名規則，不會被「第一句擬草稿」規則覆寫', async () => {
    const c = useSkillStudioConversation()
    c.startCreate({ name: '舊名', instructions: '1. a' })
    const p = c.send('名稱改成「新名」')
    await vi.advanceTimersByTimeAsync(800)
    await p
    expect(c.draft.value.name).toBe('新名')
    expect(c.draft.value.instructions).toBe('1. a')
  })

  it('toSnapshot / hydrate 往返：內容一致、hydrate 後 isDirty=false、之後新訊息 id 不重複', async () => {
    const a = useSkillStudioConversation()
    a.startCreate()
    const p = a.send('幫我建立一個能查 ERP 庫存的技能')
    await vi.advanceTimersByTimeAsync(800)
    await p
    const snap = a.toSnapshot()
    expect(snap.mode).toBe('create')
    expect(snap.draft.name).toBe('查 ERP 庫存')
    expect(snap.messages).toHaveLength(3)

    const b = useSkillStudioConversation()
    b.hydrate(snap)
    expect(b.draft.value).toEqual(snap.draft)
    expect(b.messages.value.map(m => m.id)).toEqual(snap.messages.map(m => m.id))
    expect(b.isDirty.value).toBe(false)
    // 深拷貝：改 b 不影響 snap
    b.updateFiles([])
    b.draft.value.capabilities.push({ name: 'x', description: '' })
    expect(snap.draft.capabilities).toHaveLength(2)

    const q = b.send('再補一個步驟')
    await vi.advanceTimersByTimeAsync(800)
    await q
    const ids = b.messages.value.map(m => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('detachSavedSkill：清掉 savedSkillId、退回 create、isDirty 為 true', () => {
    const c = useSkillStudioConversation()
    c.loadSkill('personal-001')
    expect(c.isDirty.value).toBe(false)
    c.detachSavedSkill()
    expect(c.savedSkillId.value).toBeNull()
    expect(c.mode.value).toBe('create')
    expect(c.isDirty.value).toBe(true)
    expect(c.draft.value.name).toBe('週報自動生成') // 草稿內容保留
  })
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts`
Expected: 4 個新測項 FAIL（`toSnapshot`／`hydrate`／`detachSavedSkill` 不存在；`startCreate` 不接受參數）。

- [ ] **Step 3: 實作**

在 `StudioSuggestion` 介面之後新增：

```ts
// block 存放／還原用的可序列化快照
export interface StudioSnapshot {
  mode: StudioMode
  savedSkillId: string | null
  draft: SkillDraft
  messages: StudioMessage[]
}

export const DEFAULT_OPENING_MESSAGE = '你好，我是技能建立助理。描述你想讓 Agent 幫你做什麼，我會先擬一版設定放在右側。'
```

把 `startCreate` 改成：

```ts
  // prefill：由 Agent 建議放上 block 時帶入的預填內容。snapshot 基準刻意維持空草稿，
  // 讓預填一開始就是「有未儲存變更」，使用者得按儲存才會寫進技能
  function startCreate(prefill?: Partial<SkillDraft>, openingMessage?: string): void {
    mode.value = 'create'
    savedSkillId.value = null
    const base = emptyDraft()
    draft.value = {
      ...base,
      ...prefill,
      capabilities: (prefill?.capabilities ?? base.capabilities).map(c => ({ ...c })),
      files: [...(prefill?.files ?? base.files)],
    }
    snapshot.value = serialize(emptyDraft())
    messages.value = []
    seq = 0
    push({ role: 'agent', content: openingMessage ?? DEFAULT_OPENING_MESSAGE })
  }
```

在 `updateFiles` 之後新增：

```ts
  function toSnapshot(): StudioSnapshot {
    return JSON.parse(JSON.stringify({
      mode: mode.value,
      savedSkillId: savedSkillId.value,
      draft: draft.value,
      messages: messages.value,
    }))
  }

  function hydrate(snap: StudioSnapshot): void {
    const copy: StudioSnapshot = JSON.parse(JSON.stringify(snap))
    mode.value = copy.mode
    savedSkillId.value = copy.savedSkillId
    draft.value = copy.draft
    messages.value = copy.messages
    snapshot.value = serialize(draft.value)
    // 接續既有訊息 id，避免之後 push 撞號
    seq = copy.messages.reduce((max, m) => Math.max(max, Number(m.id.replace('studio-', '')) || 0), 0)
  }

  // block 指到的技能已被刪除時：草稿保留，但退回建立模式，下次儲存會建立新技能
  function detachSavedSkill(): void {
    savedSkillId.value = null
    mode.value = 'create'
    snapshot.value = serialize(emptyDraft())
  }
```

return 物件加 `toSnapshot, hydrate, detachSavedSkill`。

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run src/composables/__tests__/useSkillStudioConversation.test.ts src/views/__tests__/SkillStudio.test.ts && npm run type-check`
Expected: 全綠；`SkillStudio.test.ts` 不受影響；type-check 無新增錯誤。

- [ ] **Step 5: Commit**

```bash
git add src/composables/useSkillStudioConversation.ts src/composables/__tests__/useSkillStudioConversation.test.ts
git commit -m "feat(skill): add snapshot/hydrate and prefilled startCreate to useSkillStudioConversation"
```

---

### Task 2: 型別、`TOOL_BLOCK_META`、`AiViewerStore` 新 action

**Files:**
- Modify: `src/types/AiViewer.ts`（`BlockDataMap`、`ReportAssemblyBlockData` 之後）
- Create: `src/constants/toolBlocks.ts`
- Modify: `src/stores/AiViewerStore.ts:4`（import）、`:1008-1050`（`addReportAssemblyBlock` 之後）、`:1116-1118`（return）
- Test: `src/constants/__tests__/toolBlocks.test.ts`、`src/stores/__tests__/AiViewerStore.skillBuilder.test.ts`

**Interfaces:**
- Consumes: `StudioSnapshot`、`SkillDraft`、`useSkillStudioConversation().startCreate(prefill, openingMessage)/toSnapshot()`（Task 1）
- Produces:

```ts
// types/AiViewer.ts
type SkillBlockOrigin = { conversationId: string; reason: string }
type SkillBuilderBlockData = { snapshot: StudioSnapshot; origin: SkillBlockOrigin | null; activeTab: 'chat' | 'preview' | 'test' }
// BlockDataMap 多 SKILL: SkillBuilderBlockData
// constants/toolBlocks.ts
export const TOOL_BLOCK_META: Partial<Record<BlockType, { icon: string; label: string }>>
export function isToolBlock(type: BlockType): boolean
// AiViewerStore
addSkillBuilderBlock(init?: { prefill?: Partial<SkillDraft>; openingMessage?: string; origin?: SkillBlockOrigin }): string
updateSkillBuilderBlock(blockId: string, patch: Partial<SkillBuilderBlockData>): boolean
```

- [ ] **Step 1: 寫失敗測試**

`src/constants/__tests__/toolBlocks.test.ts`：

```ts
import { describe, it, expect } from 'vitest'
import { TOOL_BLOCK_META, isToolBlock } from '@/constants/toolBlocks'

describe('toolBlocks', () => {
  it('REPORT 與 SKILL 是功能型 block，檔案類型不是', () => {
    expect(isToolBlock('REPORT')).toBe(true)
    expect(isToolBlock('SKILL')).toBe(true)
    expect(isToolBlock('HTML')).toBe(false)
    expect(isToolBlock('IMAGE')).toBe(false)
  })
  it('meta 提供 icon 與 label', () => {
    expect(TOOL_BLOCK_META.REPORT).toEqual({ icon: 'bar_chart', label: '報告組裝' })
    expect(TOOL_BLOCK_META.SKILL).toEqual({ icon: 'auto_fix_high', label: '技能建立' })
  })
})
```

`src/stores/__tests__/AiViewerStore.skillBuilder.test.ts`：

```ts
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useAiviewerStore } from '@/stores/AiViewerStore'

describe('AiViewerStore - 技能建立 block', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('addSkillBuilderBlock() 空白建立：SKILL block、預設名稱、chat tab、開場訊息、鏡頭移過去', () => {
    const store = useAiviewerStore()
    const before = store.aiViewerBlocks.length
    const id = store.addSkillBuilderBlock()
    expect(id.startsWith('skillbuilder-')).toBe(true)
    expect(store.aiViewerBlocks.length).toBe(before + 1)
    const block = store.aiViewerBlocks.find((b: any) => b.id === id)
    expect(block.data.blockType).toBe('SKILL')
    expect(block.blockName).toBe('技能建立')
    expect(block.width).toBe(640)
    expect(block.height).toBe(750)
    expect(block.data.data.activeTab).toBe('chat')
    expect(block.data.data.origin).toBeNull()
    expect(block.data.data.snapshot.mode).toBe('create')
    expect(block.data.data.snapshot.draft.name).toBe('')
    expect(block.data.data.snapshot.messages).toHaveLength(1)
    expect(store.panToTarget).toEqual({ x: block.x, y: block.y, width: 640, height: 750 })
    expect(store.nowChoiceAiViewerId).toBe(id)
  })

  it('addSkillBuilderBlock({prefill, openingMessage, origin})：名稱、草稿、開場與來源都寫入', () => {
    const store = useAiviewerStore()
    const id = store.addSkillBuilderBlock({
      prefill: { name: '產品銷售報告整理', instructions: '1. 查詢\n2. 套用' },
      openingMessage: '來自對話的開場',
      origin: { conversationId: 'conv4', reason: '查詢銷售資料＋套用部門報告規範' },
    })
    const block = store.aiViewerBlocks.find((b: any) => b.id === id)
    expect(block.blockName).toBe('產品銷售報告整理')
    expect(block.data.data.snapshot.draft.instructions).toBe('1. 查詢\n2. 套用')
    expect(block.data.data.snapshot.messages[0].content).toBe('來自對話的開場')
    expect(block.data.data.origin).toEqual({ conversationId: 'conv4', reason: '查詢銷售資料＋套用部門報告規範' })
  })

  it('連續建立兩個 block：id 不重複、同列橫向排開', () => {
    const store = useAiviewerStore()
    const a = store.addSkillBuilderBlock()
    const b = store.addSkillBuilderBlock()
    expect(a).not.toBe(b)
    const ba = store.aiViewerBlocks.find((x: any) => x.id === a)
    const bb = store.aiViewerBlocks.find((x: any) => x.id === b)
    expect(bb.y).toBe(ba.y)
    expect(bb.x).toBe(ba.x + 640 + 24)
  })

  it('updateSkillBuilderBlock：snapshot 寫回並同步 blockName；activeTab 可改；非 SKILL 或不存在回 false', () => {
    const store = useAiviewerStore()
    const id = store.addSkillBuilderBlock()
    const block = store.aiViewerBlocks.find((b: any) => b.id === id)
    const snap = JSON.parse(JSON.stringify(block.data.data.snapshot))
    snap.draft.name = '查 ERP 庫存'
    expect(store.updateSkillBuilderBlock(id, { snapshot: snap })).toBe(true)
    expect(block.blockName).toBe('查 ERP 庫存')
    expect(store.updateSkillBuilderBlock(id, { activeTab: 'test' })).toBe(true)
    expect(block.data.data.activeTab).toBe('test')
    snap.draft.name = '   '
    store.updateSkillBuilderBlock(id, { snapshot: snap })
    expect(block.blockName).toBe('技能建立')

    const reportId = store.addReportAssemblyBlock(['promo_kpi'])
    expect(store.updateSkillBuilderBlock(reportId, { activeTab: 'test' })).toBe(false)
    expect(store.updateSkillBuilderBlock('nope', { activeTab: 'test' })).toBe(false)
  })
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run src/constants/__tests__/toolBlocks.test.ts src/stores/__tests__/AiViewerStore.skillBuilder.test.ts`
Expected: 兩檔 FAIL（模組／action 不存在）。

- [ ] **Step 3: 型別**

`src/types/AiViewer.ts` 檔首（第一個 `interface` 之前）加：

```ts
import type { StudioSnapshot } from '@/composables/useSkillStudioConversation'
```

`BlockDataMap` 加一行：

```ts
  SKILL: SkillBuilderBlockData; // 技能建立（block 內自帶對話／預覽／測試）
```

`ReportAssemblyBlockData` 之後加：

```ts
/** 技能建立 Block */

// 由 Agent 建議放上 block 時的來源脈絡；工具箱空白建立時為 null
type SkillBlockOrigin = {
  conversationId: string
  reason: string
}

// block 內對話與草稿的可序列化快照 + 目前 tab
type SkillBuilderBlockData = {
  snapshot: StudioSnapshot
  origin: SkillBlockOrigin | null
  activeTab: 'chat' | 'preview' | 'test'
}
```

若該檔在檔尾有 `export type { … }` 匿名匯出清單，把 `SkillBlockOrigin`、`SkillBuilderBlockData` 加進去；若型別是逐一 `export`／全域宣告，照該檔既有寫法。

- [ ] **Step 4: 常數**

`src/constants/toolBlocks.ts`：

```ts
import type { BlockType } from '@/types/AiViewer'

export interface ToolBlockMeta {
  icon: string   // Material Symbols icon 名稱
  label: string
}

// 功能型 block：畫布上「可操作的工具」而不是「一份檔案」。
// 工具箱項目、block header 徽章都從這裡取 icon／label，單一來源
export const TOOL_BLOCK_META: Partial<Record<BlockType, ToolBlockMeta>> = {
  REPORT: { icon: 'bar_chart', label: '報告組裝' },
  SKILL: { icon: 'auto_fix_high', label: '技能建立' },
}

export function isToolBlock(type: BlockType): boolean {
  return type in TOOL_BLOCK_META
}
```

- [ ] **Step 5: store**

`src/stores/AiViewerStore.ts` L4 的 type import 補 `SkillBuilderBlockData, SkillBlockOrigin`；並新增：

```ts
import { useSkillStudioConversation } from '@/composables/useSkillStudioConversation'
import type { SkillDraft } from '@/composables/useSkillStudioConversation'
```

在 `saveReportAssemblyTemplate` 之後加：

```ts
  // 建立技能建立 Block（功能型：block 內自帶對話／預覽／測試）。
  // 初始快照借一個暫時的 composable 實例產生，讓 store 與 block 元件用同一套開場與預填規則
  let _skillBuilderSeq = 0;
  function addSkillBuilderBlock(init?: {
    prefill?: Partial<SkillDraft>
    openingMessage?: string
    origin?: SkillBlockOrigin
  }): string {
    const BLOCK_W = 640;
    const BLOCK_H = 750;
    const GAP = 24;
    const slot = aiViewerBlocks.value.filter((b: any) => b.id?.startsWith('skillbuilder-')).length;
    const othersBottom = aiViewerBlocks.value
      .filter((b: any) => !b.id?.startsWith('skillbuilder-'))
      .reduce((max: number, b: any) => Math.max(max, (b.y ?? 0) + (b.height ?? 0)), centerSpaceY);
    const seed = useSkillStudioConversation();
    seed.startCreate(init?.prefill, init?.openingMessage);
    const id = `skillbuilder-${Date.now()}-${++_skillBuilderSeq}`;
    const data: SkillBuilderBlockData = {
      snapshot: seed.toSnapshot(),
      origin: init?.origin ?? null,
      activeTab: 'chat',
    };
    const temp: AiViewerBlock = {
      id,
      x: centerSpaceX + slot * (BLOCK_W + GAP),
      y: othersBottom + GAP,
      width: BLOCK_W,
      height: BLOCK_H,
      blockName: init?.prefill?.name?.trim() || '技能建立',
      z: calcNextZindex(),
      data: { blockType: 'SKILL', data },
    };
    aiViewerBlocks.value.push(temp);
    panToTarget.value = { x: temp.x, y: temp.y, width: temp.width, height: temp.height };
    nowChoiceAiViewerId.value = id;
    return id;
  }

  // block 元件把最新快照／tab 寫回；快照的名稱同步成 blockName
  function updateSkillBuilderBlock(blockId: string, patch: Partial<SkillBuilderBlockData>): boolean {
    const block = (aiViewerBlocks.value as AiViewerBlock[]).find((b) => b.id === blockId);
    if (!block || block.data.blockType !== 'SKILL') return false;
    if (patch.snapshot) {
      block.data.data.snapshot = patch.snapshot;
      block.blockName = patch.snapshot.draft.name.trim() || '技能建立';
    }
    if (patch.activeTab) block.data.data.activeTab = patch.activeTab;
    if (patch.origin !== undefined) block.data.data.origin = patch.origin;
    return true;
  }
```

return 區塊在 `saveReportAssemblyTemplate,` 後加 `addSkillBuilderBlock,`、`updateSkillBuilderBlock,`。

- [ ] **Step 6: 跑測試確認通過**

Run: `npx vitest run src/constants/__tests__/toolBlocks.test.ts src/stores/__tests__/AiViewerStore.skillBuilder.test.ts src/stores/__tests__/AiViewerStore.reportAssembly.test.ts && npm run type-check`
Expected: 全綠；type-check 無新增（`BlockDataMap` 多一個 key 後，`AiViewerContentBox.vue` 既有的 7 個錯誤數量不變）。

- [ ] **Step 7: Commit**

```bash
git add src/types/AiViewer.ts src/constants/toolBlocks.ts src/constants/__tests__/toolBlocks.test.ts src/stores/AiViewerStore.ts src/stores/__tests__/AiViewerStore.skillBuilder.test.ts
git commit -m "feat(aiviewer): add SKILL block type, TOOL_BLOCK_META and skill-builder store actions"
```

---

### Task 3: `SkillStudioChat.compact` 與 `SkillStudioPreview.hideTabs`

**Files:**
- Modify: `src/components/Skill/SkillStudioChat.vue:2-20`、`:104-112`（props）
- Modify: `src/components/Skill/SkillStudioPreview.vue:2-18`（tabs）、`:133-141`（props）
- Modify: `src/scss/views/_SkillStudio.scss`（`.SkillStudioChat` 區塊尾）
- Test: `src/components/__tests__/SkillStudioChat.test.ts`、`src/components/__tests__/SkillStudioPreview.test.ts`

**Interfaces:**
- Produces: `SkillStudioChat` prop `compact?: boolean`（預設 false）；`SkillStudioPreview` prop `hideTabs?: boolean`（預設 false）。

- [ ] **Step 1: 寫失敗測試**

`SkillStudioChat.test.ts` 追加：

```ts
  it('compact：隱藏切換技能與建立新技能，根元素帶 is-compact；預設不隱藏', () => {
    const normal = mountChat()
    expect(normal.find('.ssc-head-actions').exists()).toBe(true)
    expect(normal.classes()).not.toContain('is-compact')
    const w = mountChat({ compact: true })
    expect(w.find('.ssc-head-actions').exists()).toBe(false)
    expect(w.find('.ssc-mode-chip').exists()).toBe(true)
    expect(w.classes()).toContain('is-compact')
  })
```

`SkillStudioPreview.test.ts` 追加：

```ts
  it('hideTabs：不渲染 .ssp-tabs，但 activeTab 仍決定內容', () => {
    const w = mountPreview({ hideTabs: true, activeTab: 'test' })
    expect(w.find('.ssp-tabs').exists()).toBe(false)
    expect(w.text()).toContain('先儲存技能')
    const normal = mountPreview()
    expect(normal.find('.ssp-tabs').exists()).toBe(true)
  })
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run src/components/__tests__/SkillStudioChat.test.ts src/components/__tests__/SkillStudioPreview.test.ts`
Expected: 兩個新測項 FAIL。

- [ ] **Step 3: 實作**

`SkillStudioChat.vue`：根元素 `<div class="SkillStudioChat">` → `<div :class="['SkillStudioChat', { 'is-compact': props.compact }]">`；`<div class="ssc-head-actions">` → `<div class="ssc-head-actions" v-if="!props.compact">`；props 加 `compact?: boolean`。

`SkillStudioPreview.vue`：`<div class="ssp-tabs">` → `<div class="ssp-tabs" v-if="!props.hideTabs">`；props 加 `hideTabs?: boolean`。

`_SkillStudio.scss` 在 `.SkillStudioChat { … }` 區塊內（`.ssc-input-row` 之後）追加：

```scss
  // 放進畫布 block 時的緊湊版：一顆技能一個 block，不需要切換技能；寬度只有 640，建議 chip 直排
  &.is-compact {
    .chat-bubble { max-width: 90%; }
    .ssc-suggestions {
      flex-direction: column;
      align-items: stretch;
      .ssc-chip { justify-content: center; }
    }
  }
```

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run src/components/__tests__/SkillStudioChat.test.ts src/components/__tests__/SkillStudioPreview.test.ts src/views/__tests__/SkillStudio.test.ts && npm run type-check`
Expected: 全綠。

- [ ] **Step 5: Commit**

```bash
git add src/components/Skill/SkillStudioChat.vue src/components/Skill/SkillStudioPreview.vue src/scss/views/_SkillStudio.scss src/components/__tests__/SkillStudioChat.test.ts src/components/__tests__/SkillStudioPreview.test.ts
git commit -m "feat(skill): add compact/hideTabs props to SkillStudioChat and SkillStudioPreview"
```

---

### Task 4: `skillBuilderViewBox.vue` block 元件

**Files:**
- Create: `src/components/AiViewer/viewBlock/skillBuilderViewBox.vue`
- Create: `src/scss/views/_AiViewer-skill.scss`；Modify: `src/scss/views/_AiViewer.scss:4289`（`@import "./AiViewer-report";` 之後）
- Test: `src/components/__tests__/skillBuilderViewBox.test.ts`

**Interfaces:**
- Consumes: Task 1（`hydrate/toSnapshot/detachSavedSkill`）、Task 2（`SkillBuilderBlockData`、`updateSkillBuilderBlock`、`addSkillBuilderBlock`）、Task 3（`compact`／`hideTabs`）、`useSkillStore().myPersonalSkills/findSkill`、`popDialog.toast`。
- Produces: 元件 props `{ id: string; source: { blockType: 'SKILL'; data: SkillBuilderBlockData }; isFullView?: boolean }`；CSS 類別 `.skillBuilderViewBox .skb-toolbar .skb-tab-btn .skb-open-studio .skb-origin-bar .skb-missing-bar`。

- [ ] **Step 1: 寫失敗測試**

`src/components/__tests__/skillBuilderViewBox.test.ts`：

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { useAiviewerStore } from '@/stores/AiViewerStore'
import { useSkillStore } from '@/stores/skillStore'
import skillBuilderViewBox from '@/components/AiViewer/viewBlock/skillBuilderViewBox.vue'

vi.mock('@/services/popDialog', () => ({ default: { toast: vi.fn(), confirm: vi.fn(), alert: vi.fn() } }))

function mountBlock(init?: Parameters<ReturnType<typeof useAiviewerStore>['addSkillBuilderBlock']>[0]) {
  const store = useAiviewerStore()
  const id = store.addSkillBuilderBlock(init)
  const block = store.aiViewerBlocks.find((b: any) => b.id === id)
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div/>' } },
      { path: '/view/SkillStudio', name: 'SkillStudio', component: { template: '<div/>' } },
      { path: '/view/Skills', name: 'SkillManagement', component: { template: '<div/>' } },
      { path: '/view/SkillTest', name: 'SkillTest', component: { template: '<div/>' } },
      { path: '/view/SkillEditor', name: 'SkillEditor', component: { template: '<div/>' } },
    ],
  })
  const wrapper = mount(skillBuilderViewBox, {
    props: { id, source: block.data },
    global: { plugins: [router], stubs: { SkillTestAI: true, SkillFileUpload: true }, directives: { tooltip: {} } },
  })
  return { wrapper, store, id, block, router }
}

describe('skillBuilderViewBox', () => {
  beforeEach(() => { setActivePinia(createPinia()); vi.clearAllMocks() })

  it('預設在對話 tab，顯示開場訊息；切 tab 寫回 block data', async () => {
    const { wrapper, block } = mountBlock()
    expect(wrapper.find('.SkillStudioChat').exists()).toBe(true)
    expect(wrapper.text()).toContain('技能建立助理')
    const tabs = wrapper.findAll('.skb-tab-btn')
    expect(tabs.map(t => t.text())).toEqual(['對話', '預覽', '測試'].map(s => expect.stringContaining(s)))
    await tabs[1].trigger('click')
    expect(block.data.data.activeTab).toBe('preview')
    expect(wrapper.find('.SkillStudioPreview').exists()).toBe(true)
    expect(wrapper.find('.ssp-tabs').exists()).toBe(false)
  })

  it('預填 block：hydrate 後預覽顯示名稱；有 origin 時對話 tab 顯示脈絡條', async () => {
    const { wrapper } = mountBlock({
      prefill: { name: '產品銷售報告整理', instructions: '1. 查詢\n2. 套用' },
      openingMessage: '來自對話的開場',
      origin: { conversationId: 'conv4', reason: '查詢銷售資料＋套用部門報告規範' },
    })
    expect(wrapper.find('.skb-origin-bar').text()).toContain('查詢銷售資料＋套用部門報告規範')
    expect(wrapper.text()).toContain('來自對話的開場')
    await wrapper.findAll('.skb-tab-btn')[1].trigger('click')
    expect(wrapper.find('.ssp-title').text()).toBe('產品銷售報告整理')
    expect(wrapper.find('.ssp-save-btn').attributes('disabled')).toBeUndefined()
  })

  it('對話送出後草稿變動會寫回 snapshot', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      const { wrapper, block } = mountBlock()
      const input = wrapper.find('.SkillStudioChat input.custom-input')
      await input.setValue('幫我建立一個能查 ERP 庫存的技能')
      await input.trigger('keydown.enter')
      await vi.advanceTimersByTimeAsync(800)
      await flushPromises()
      expect(block.data.data.snapshot.draft.name).toBe('查 ERP 庫存')
      expect(block.blockName).toBe('查 ERP 庫存')
      expect(block.data.data.snapshot.messages.length).toBe(3)
    } finally {
      vi.useRealTimers()
    }
  })

  it('儲存：建立個人技能、toast、自動切到測試 tab；「在 AI 賦能開啟」儲存前 disabled、儲存後導頁', async () => {
    const { wrapper, block, router } = mountBlock({ prefill: { name: '查庫存', instructions: '1. 查' } })
    const skillStore = useSkillStore()
    const before = skillStore.myPersonalSkills.length
    const openBtn = wrapper.find('.skb-open-studio')
    expect(openBtn.attributes('disabled')).toBeDefined()

    await wrapper.findAll('.skb-tab-btn')[1].trigger('click')
    await wrapper.find('.ssp-save-btn').trigger('click')
    await flushPromises()
    expect(skillStore.myPersonalSkills.length).toBe(before + 1)
    expect(block.data.data.activeTab).toBe('test')
    expect(block.data.data.snapshot.savedSkillId).toBe(skillStore.myPersonalSkills[0].id)

    const push = vi.spyOn(router, 'push')
    expect(wrapper.find('.skb-open-studio').attributes('disabled')).toBeUndefined()
    await wrapper.find('.skb-open-studio').trigger('click')
    expect(push).toHaveBeenCalledWith({ name: 'SkillStudio', query: { skillId: skillStore.myPersonalSkills[0].id } })
  })

  it('snapshot 指到的技能已被刪除：顯示提示、退回建立模式', async () => {
    const skillStore = useSkillStore()
    const store = useAiviewerStore()
    const id = store.addSkillBuilderBlock({ prefill: { name: '查庫存', instructions: '1. 查' } })
    const block = store.aiViewerBlocks.find((b: any) => b.id === id)
    block.data.data.snapshot.mode = 'edit'
    block.data.data.snapshot.savedSkillId = 'personal-gone'
    const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    const wrapper = mount(skillBuilderViewBox, {
      props: { id, source: block.data },
      global: { plugins: [router], stubs: { SkillTestAI: true, SkillFileUpload: true }, directives: { tooltip: {} } },
    })
    await flushPromises()
    expect(wrapper.find('.skb-missing-bar').text()).toContain('這顆技能已不存在')
    expect(wrapper.find('.ssc-mode-chip').text()).toContain('建立新技能')
    expect(skillStore.findSkill('personal-gone')).toBeUndefined()
  })
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run src/components/__tests__/skillBuilderViewBox.test.ts`
Expected: FAIL — 元件不存在。

- [ ] **Step 3: 實作元件**

`src/components/AiViewer/viewBlock/skillBuilderViewBox.vue`：

```vue
<template>
  <div :class="['skillBuilderViewBox', { 'is-full': props.isFullView }]">
    <div class="skb-toolbar">
      <div class="skb-tabs">
        <button
          v-for="t in TABS"
          :key="t.id"
          type="button"
          :class="['skb-tab-btn', { 'is-active': activeTab === t.id }]"
          @click="setTab(t.id)"
        >
          <i class="material-symbols-outlined">{{ t.icon }}</i>{{ t.label }}
        </button>
      </div>
      <!-- 同一顆技能要做長時間調整就到 AI 賦能頁；沒儲存前沒有 skillId 可帶 -->
      <button
        type="button"
        class="custom-btn skb-open-studio"
        :disabled="!conv.savedSkillId.value"
        v-tooltip="conv.savedSkillId.value ? '在 AI 賦能開啟' : '先儲存技能'"
        @click="openStudio"
      >
        <i class="material-symbols-outlined">open_in_new</i>在 AI 賦能開啟
      </button>
    </div>

    <div v-if="props.source.data.origin && activeTab === 'chat'" class="skb-origin-bar">
      <i class="material-symbols-outlined">history</i>來自本對話的「{{ props.source.data.origin.reason }}」流程
    </div>
    <div v-if="missingSkill" class="skb-missing-bar">
      <i class="material-symbols-outlined">warning</i>這顆技能已不存在，儲存會建立新的個人技能
    </div>

    <div class="skb-body">
      <SkillStudioChat
        v-if="activeTab === 'chat'"
        compact
        :mode="conv.mode.value"
        :skill-name="conv.draft.value.name"
        :saved-skill-id="conv.savedSkillId.value"
        :messages="conv.messages.value"
        :is-running="conv.isRunning.value"
        :suggestion-chips="conv.suggestionChips.value"
        :personal-skills="[]"
        @send="conv.send"
      />
      <SkillStudioPreview
        v-else
        hide-tabs
        :active-tab="activeTab"
        :draft="conv.draft.value"
        :mode="conv.mode.value"
        :saved-skill-id="conv.savedSkillId.value"
        :is-dirty="conv.isDirty.value"
        :can-save="conv.canSave.value"
        :name-conflict="nameConflict"
        @save="onSave"
        @update:files="conv.updateFiles"
        @update:active-tab="setTab"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// 技能建立 Block：把 AI 賦能的三個零件放進畫布 block。狀態來源是 block data 裡的
// StudioSnapshot——掛載時 hydrate，變動時 toSnapshot 寫回 store，所以拖曳、放大縮小、
// 畫布重繪都不會丟狀態；全螢幕與畫布上的兩個實例也透過同一份快照同步。
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import type { PropType } from 'vue'
import { useRouter } from 'vue-router'
import { useAiviewerStore } from '@/stores/AiViewerStore'
import { useSkillStore } from '@/stores/skillStore'
import { useSkillStudioConversation } from '@/composables/useSkillStudioConversation'
import type { StudioSnapshot } from '@/composables/useSkillStudioConversation'
import type { SkillBuilderBlockData } from '@/types/AiViewer'
import SkillStudioChat from '@/components/Skill/SkillStudioChat.vue'
import SkillStudioPreview from '@/components/Skill/SkillStudioPreview.vue'
import popDialog from '@/services/popDialog'

type BlockTab = SkillBuilderBlockData['activeTab']

const props = defineProps({
  id: { type: String, required: true },
  source: { type: Object as PropType<{ blockType: 'SKILL'; data: SkillBuilderBlockData }>, required: true },
  isFullView: { type: Boolean, default: false },
})

const TABS: { id: BlockTab; icon: string; label: string }[] = [
  { id: 'chat', icon: 'forum', label: '對話' },
  { id: 'preview', icon: 'preview', label: '預覽' },
  { id: 'test', icon: 'science', label: '測試' },
]

const aiviewerStore = useAiviewerStore()
const skillStore = useSkillStore()
const router = useRouter()
const conv = useSkillStudioConversation()

const activeTab = computed<BlockTab>(() => props.source.data.activeTab)
const missingSkill = ref(false)
let applyingExternal = false

function setTab(tab: BlockTab) {
  aiviewerStore.updateSkillBuilderBlock(props.id, { activeTab: tab })
}

const nameConflict = computed(() => {
  const n = conv.draft.value.name.trim()
  return !!n && skillStore.myPersonalSkills.some(s => s.id !== conv.savedSkillId.value && s.name === n)
})

// 套用一份快照；若它指到的技能已被刪除（例如在技能管理刪掉），退回建立模式並提示
function applySnapshot(snap: StudioSnapshot) {
  applyingExternal = true
  conv.hydrate(snap)
  if (snap.savedSkillId && !skillStore.findSkill(snap.savedSkillId)) {
    missingSkill.value = true
    conv.detachSavedSkill()
  } else {
    missingSkill.value = false
  }
  nextTick(() => { applyingExternal = false })
}

onMounted(() => applySnapshot(props.source.data.snapshot))

// 自己的變動 → 寫回 block data
watch(
  [conv.draft, conv.messages, conv.mode, conv.savedSkillId],
  () => {
    if (applyingExternal) return
    aiviewerStore.updateSkillBuilderBlock(props.id, { snapshot: conv.toSnapshot() })
  },
  { deep: true }
)

// 別的實例（全螢幕／畫布）寫回的快照 → 只在自己沒有未儲存變更、或對方訊息更多時套用，
// 避免打字中被覆寫
watch(
  () => props.source.data.snapshot,
  (snap) => {
    if (JSON.stringify(snap) === JSON.stringify(conv.toSnapshot())) return
    if (!conv.isDirty.value || snap.messages.length > conv.messages.value.length) applySnapshot(snap)
  },
  { deep: true }
)

function onSave() {
  const wasCreate = conv.mode.value === 'create'
  const id = conv.save()
  if (!id) return
  missingSkill.value = false
  if (wasCreate) {
    popDialog.toast('已儲存為個人技能，可到「測試」tab 驗證')
    setTab('test')
  } else {
    popDialog.toast('已儲存修改')
  }
}

function openStudio() {
  if (!conv.savedSkillId.value) return
  router.push({ name: 'SkillStudio', query: { skillId: conv.savedSkillId.value } })
}
</script>
```

- [ ] **Step 4: SCSS**

`src/scss/views/_AiViewer-skill.scss`：

```scss
// 技能建立 Block（畫布上的功能型 block：對話／預覽／測試三 tab，重用 AI 賦能零件）
.skillBuilderViewBox {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--page-bg);

  .skb-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--divider-a50);
    background: var(--surface);
    flex-shrink: 0;
  }

  .skb-tabs {
    display: flex;
    gap: 4px;
  }

  .skb-tab-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: var(--text-muted);
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    .material-symbols-outlined { font-size: 16px; }
    &.is-active { background: var(--primary-a08); color: $color_main_1; }
  }

  .skb-open-studio {
    gap: 4px;
    font-size: 12px;
    white-space: nowrap;
    .material-symbols-outlined { font-size: 15px; }
  }

  .skb-origin-bar,
  .skb-missing-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    font-size: 12px;
    flex-shrink: 0;
    .material-symbols-outlined { font-size: 15px; }
  }
  .skb-origin-bar { color: var(--text-muted); background: var(--tag-slate-bg); }
  .skb-missing-bar { color: var(--tag-amber-text); background: var(--tag-amber-bg); }

  .skb-body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    .SkillStudioChat,
    .SkillStudioPreview { height: 100%; min-height: 0; }
  }
}
```

`_AiViewer.scss` L4289 之後加 `@import "./AiViewer-skill";`。

- [ ] **Step 5: 跑測試確認通過**

Run: `npx vitest run src/components/__tests__/skillBuilderViewBox.test.ts && npm run type-check`
Expected: 5/5 PASS；type-check 無新增。若 `v-tooltip` 指令在測試中報 "Failed to resolve directive"，確認 `global.directives: { tooltip: {} }` 有帶。

- [ ] **Step 6: Commit**

```bash
git add src/components/AiViewer/viewBlock/skillBuilderViewBox.vue src/scss/views/_AiViewer-skill.scss src/scss/views/_AiViewer.scss src/components/__tests__/skillBuilderViewBox.test.ts
git commit -m "feat(aiviewer): add skillBuilderViewBox canvas block with chat/preview/test tabs"
```

---

### Task 5: `AiViewerContentBox` 接線與功能型 chrome、`FullAiViewerBlockBox`

**Files:**
- Modify: `src/components/AiViewer/AiViewerContentBox.vue:43-44`（imports）、`:50-58`（resizable 條件）、`:111-121`（放大條件）、`:74`（`.AiViewerContentBox` class）、`:156-160`（header）、`:186-197`（content-box classes）、`:255-258`（REPORT 分支之後）
- Modify: `src/components/AiViewer/FullAiViewerBlockBox.vue:44-51`（MD 分支之後）、`:60-65`（imports）
- Modify: `src/scss/views/_AiViewer.scss:1339-1480`（`.AiViewerContentBox` 內）

**Interfaces:**
- Consumes: `skillBuilderViewBox`（Task 4）、`TOOL_BLOCK_META`／`isToolBlock`（Task 2）、`SkillBuilderBlockData`（Task 2）。

- [ ] **Step 1: `AiViewerContentBox.vue`**

imports 補：

```ts
import skillBuilderViewBox from '@/components/AiViewer/viewBlock/skillBuilderViewBox.vue';
import { TOOL_BLOCK_META, isToolBlock } from '@/constants/toolBlocks';
import type { ReportAssemblyBlockData, SkillBuilderBlockData, BlockType } from '@/types/AiViewer';
```

（原本的 `import type { ReportAssemblyBlockData }` 行合併進上面那行。）

`<script setup>` 內、`const props = defineProps(…)` 之後加：

```ts
// 功能型 block（REPORT／SKILL）：header 多徽章、卡片改實色，跟檔案 block 區隔
const toolMeta = computed(() => TOOL_BLOCK_META[props.source.blockType as BlockType]);
```

(a) resizable 條件的型別清單最後加 `|| props.source.blockType === 'SKILL'`。

(b) 放大按鈕 `v-if` 的型別括號改成 `( … || props.source.blockType === 'MD' || isToolBlock(props.source.blockType) )`。

(c) `<div :class="['AiViewerContentBox']" …>` → `<div :class="['AiViewerContentBox', { 'is-tool': !!toolMeta }]" …>`。

(d) header 的 `<div>` 內，在 `<i class="material-symbols-outlined fs-19" v-tooltip="'點擊編輯區塊名稱'" …>stylus_note</i>` **之前**插入：

```vue
          <span class="tool-badge" v-if="toolMeta">
            <i class="material-symbols-outlined">{{ toolMeta.icon }}</i>{{ toolMeta.label }}
          </span>
```

(e) `content-box` 的 class 物件加 `'for-SKILL': props.source.blockType === 'SKILL',`。

(f) REPORT 分支之後加：

```vue
        <!-- SKILL：技能建立（對話／預覽／測試） -->
        <skillBuilderViewBox v-if="props.source.blockType === 'SKILL'"
          :id="props.id"
          :source="(props.source as { blockType: 'SKILL'; data: SkillBuilderBlockData })"/>
```

- [ ] **Step 2: `FullAiViewerBlockBox.vue`**

imports 補：

```ts
import reportAssemblyViewBox from '@/components/AiViewer/viewBlock/reportAssemblyViewBox.vue';
import skillBuilderViewBox from '@/components/AiViewer/viewBlock/skillBuilderViewBox.vue';
```

MD 分支之後加：

```vue
      <!-- 報告組裝（功能型） -->
      <reportAssemblyViewBox v-if="blockData.blockType === 'REPORT'"
        :id="fullAiViewerBlockId || ''"
        :source="blockData" />

      <!-- 技能建立（功能型） -->
      <skillBuilderViewBox v-if="blockData.blockType === 'SKILL'"
        :isFullView="true"
        :id="fullAiViewerBlockId || ''"
        :source="blockData" />
```

- [ ] **Step 3: SCSS**

`_AiViewer.scss` 的 `.AiViewerContentBox { … }` 區塊內、`.content-header-box` 定義之後加：

```scss
  // 功能型 block（REPORT／SKILL）：實色卡片＋主色淺底 header＋徽章，
  // 一眼看出「這是可以操作的工具」而不是「一份檔案」
  &.is-tool {
    background: var(--page-bg);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    border-color: var(--primary-a20);

    .content-header-box {
      background-color: var(--primary-a08);
      color: var(--text);
    }
  }

  .tool-badge {
    @extend %badge-shape;
    flex-shrink: 0;
    margin-right: 8px;
    background: var(--tag-teal-bg);
    color: var(--tag-teal-text);
    font-size: 11px;
    .material-symbols-outlined { font-size: 14px; }
  }
```

`.content-box` 內的 `&.for-IMAGE, &.for-PDF, &.for-TXT, &.for-HTML, &.for-MD { padding: 0px; }` 清單加 `&.for-SKILL,`。

- [ ] **Step 4: 驗證**

Run: `npm run type-check && npx vitest run src/components src/stores`
Expected: type-check 錯誤仍是既有 14 個（`AiViewerContentBox.vue` 維持 7 個，不能變多）；測試全綠。

手動（8088，主 checkout 在此分支）：
1. 開任一專案 AiViewer → 工具箱目前只有「行銷報告生成」→ 點它跑完 conv7 → 畫布上的「行銷報告組裝」block 出現「報告組裝」徽章、header 主色淺底、卡片實色；右側控制列多了「放大瀏覽」，點開可全螢幕、縮回。
2. 檔案 block（例如 conv4 的 HTML 報告）外觀不變。

- [ ] **Step 5: Commit**

```bash
git add src/components/AiViewer/AiViewerContentBox.vue src/components/AiViewer/FullAiViewerBlockBox.vue src/scss/views/_AiViewer.scss
git commit -m "feat(aiviewer): render SKILL block, tool-block chrome for REPORT/SKILL, fullscreen for tool blocks"
```

---

### Task 6: 工具箱「技能建立」與 `pan-to-block`

**Files:**
- Modify: `src/components/AiViewer/AiViewerRightBox.vue:1020-1025`（`toolboxItems`）、`:1071-1080`（`openToolboxTool`）、`:2426-2430`（dispatcher 的 `goto-skill-studio` 附近）

**Interfaces:**
- Consumes: `aiviewerStore.addSkillBuilderBlock()`（Task 2）、`aiViewerBlocks`／`panToTarget`／`nowChoiceAiViewerId`（已在 RightBox 解構）。
- Produces: data-action `pan-to-block`（`data-value` = blockId）。

- [ ] **Step 1: 工具箱項目**

`toolboxItems` 在 `reportAssembly` 之後插入：

```ts
  { id: 'skillBuilder', icon: 'auto_fix_high', name: '技能建立', description: '用對話建立、測試個人技能', enabled: true },
```

`openToolboxTool` 內、`reportAssembly` 分支之後加：

```ts
  if (item.id === 'skillBuilder') {
    // 在畫布放一個空白技能建立 block；鏡頭移過去就是回饋，不另推河道訊息
    aiviewerStore.addSkillBuilderBlock();
  }
```

更新該函式上方註解為「點擊工具箱項目：行銷報告生成／技能建立可用，其餘 enabled: false 不處理」。

- [ ] **Step 2: dispatcher**

在 `handleChatAreaClick` 的 `goto-skill-management` 分支之前加：

```ts
  // 河道卡片「前往區塊」：鏡頭移到指定 block 並選取它；block 已被刪就提示
  if (action === 'pan-to-block') {
    const target = aiViewerBlocks.value.find((b: any) => b.id === el.dataset.value);
    if (!target) {
      popDialog.toast('這個區塊已不在畫布上');
      return;
    }
    panToTarget.value = { x: target.x, y: target.y, width: target.width, height: target.height };
    nowChoiceAiViewerId.value = target.id;
    return;
  }
```

（`goto-skill-studio` 分支此 task 先保留，Task 7 改完卡片後一併移除。）

- [ ] **Step 3: 驗證**

Run: `npm run type-check`
Expected: 無新增錯誤。

手動（8088）：工具箱 → 「技能建立」→ 畫布出現空白 SKILL block（徽章「技能建立」、實色卡片）、鏡頭移過去、block 被選取；在 block 對話 tab 點建議 chip → 送出 → 預覽 tab 有草稿 → 儲存 → 切到測試 tab → 「生成測試情境」可用；放大按鈕 → 全螢幕三 tab → 縮回後狀態一致。

- [ ] **Step 4: Commit**

```bash
git add src/components/AiViewer/AiViewerRightBox.vue
git commit -m "feat(aiviewer): toolbox 技能建立 places a SKILL block; add pan-to-block action"
```

---

### Task 7: conv4 建議流程改為「放 block」

**Files:**
- Modify: `src/composables/useSkillSuggestion.ts`（整檔改寫）
- Modify: `src/components/AiViewer/SkillSuggestCard.vue`（整檔改寫）
- Modify: `src/components/AiViewer/AiViewerRecord.vue`（`skillSuggest` 分支的 props）
- Modify: `src/components/AiViewer/AiViewerRightBox.vue:2426-2430`（移除 `goto-skill-studio`）、`:2874`（offer 帶 conversationId）
- Test: `src/composables/__tests__/useSkillSuggestion.test.ts`（改寫）、`src/components/__tests__/SkillSuggestCard.test.ts`（改寫）

**Interfaces:**
- Consumes: `aiviewerStore.addSkillBuilderBlock({ prefill, openingMessage, origin })`（Task 2）。
- Produces:

```ts
export type SkillSuggestStage = 'ask' | 'placed' | 'skipped'
export interface SuggestionCtx { push: (msg: any) => void; scroll: () => void; conversationId: string }
export const SKILL_SUGGEST_ACTIONS = { build: 'skill-suggest-build', skip: 'skill-suggest-skip' } as const
export function suggestionToPrefill(s: SkillSuggestion): Partial<SkillDraft>
export function suggestionOpeningMessage(s: SkillSuggestion): string
// 訊息：{ agent:'brain', cardType:'skillSuggest', suggestion, stage:'placed', blockId, finishResponse:true }
// SkillSuggestCard props：{ suggestion; stage; blockId?: string }
```

- [ ] **Step 1: 改寫測試**

覆寫 `src/composables/__tests__/useSkillSuggestion.test.ts`：

```ts
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useAiviewerStore } from '@/stores/AiViewerStore'
import { useSkillStore } from '@/stores/skillStore'
import { useSkillSuggestion, suggestionToPrefill, suggestionOpeningMessage } from '@/composables/useSkillSuggestion'
import type { SkillSuggestion } from '@/composables/useSkillSuggestion'

const SUGGESTION: SkillSuggestion = {
  id: 'conv4-sales-report',
  name: '產品銷售報告整理',
  description: '查詢指定月份產品銷售數據，並依三諾產品部輸出報告規範自動產出報告',
  triggerHint: '偵測到「查詢銷售資料＋套用部門報告規範」類型的整理需求',
  steps: ['查詢指定月份產品銷售數據', '套用三諾產品部輸出報告規範自動產出報告'],
  reason: '查詢銷售資料＋套用部門報告規範',
}

function makeCtx() {
  const msgs: any[] = []
  return { msgs, ctx: { push: (m: any) => msgs.push(m), scroll: vi.fn(), conversationId: 'conv4' } }
}

describe('suggestionToPrefill / suggestionOpeningMessage', () => {
  it('步驟編號成指令、每步一項能力；開場訊息含 reason', () => {
    const p = suggestionToPrefill(SUGGESTION)
    expect(p.name).toBe('產品銷售報告整理')
    expect(p.description).toBe(SUGGESTION.description)
    expect(p.triggerHint).toBe(SUGGESTION.triggerHint)
    expect(p.instructions).toBe('1. 查詢指定月份產品銷售數據\n2. 套用三諾產品部輸出報告規範自動產出報告')
    expect(p.capabilities?.map(c => c.name)).toEqual(SUGGESTION.steps)
    expect(suggestionOpeningMessage(SUGGESTION)).toBe('這顆技能來自本對話的「查詢銷售資料＋套用部門報告規範」流程，設定我先填好了。想調整就直接說，確認後按「儲存為個人技能」。')
  })
})

describe('useSkillSuggestion', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('offer 推入一則 brain 的 ask 卡片', () => {
    const { msgs, ctx } = makeCtx()
    useSkillSuggestion().offer(ctx, SUGGESTION)
    expect(msgs).toHaveLength(1)
    expect(msgs[0]).toMatchObject({ agent: 'brain', cardType: 'skillSuggest', stage: 'ask' })
    expect(ctx.scroll).toHaveBeenCalled()
  })

  it('build：推使用者回聲、畫布放上預填的 SKILL block（含 origin）、500ms 後推 placed 卡帶 blockId；不建立技能', () => {
    const aiviewer = useAiviewerStore()
    const skills = useSkillStore()
    const blocksBefore = aiviewer.aiViewerBlocks.length
    const skillsBefore = skills.myPersonalSkills.length
    const { msgs, ctx } = makeCtx()
    const s = useSkillSuggestion()
    s.offer(ctx, SUGGESTION)
    expect(s.handleAction('skill-suggest-build', SUGGESTION.id)).toBe(true)
    expect(msgs[1]).toMatchObject({ forUser: true, msg: '是，建立成個人技能' })
    expect(aiviewer.aiViewerBlocks.length).toBe(blocksBefore + 1)
    const block = aiviewer.aiViewerBlocks.find((b: any) => b.data.blockType === 'SKILL')
    expect(block.blockName).toBe('產品銷售報告整理')
    expect(block.data.data.origin).toEqual({ conversationId: 'conv4', reason: SUGGESTION.reason })
    expect(block.data.data.snapshot.draft.instructions).toContain('1. 查詢指定月份產品銷售數據')
    expect(block.data.data.snapshot.messages[0].content).toBe(suggestionOpeningMessage(SUGGESTION))
    vi.advanceTimersByTime(500)
    expect(msgs[2]).toMatchObject({ cardType: 'skillSuggest', stage: 'placed', blockId: block.id, finishResponse: true })
    expect(skills.myPersonalSkills.length).toBe(skillsBefore)
  })

  it('skip：推回聲與婉拒訊息；之後 build 無效（one-shot）', () => {
    const aiviewer = useAiviewerStore()
    const before = aiviewer.aiViewerBlocks.length
    const { msgs, ctx } = makeCtx()
    const s = useSkillSuggestion()
    s.offer(ctx, SUGGESTION)
    expect(s.handleAction('skill-suggest-skip', SUGGESTION.id)).toBe(true)
    vi.advanceTimersByTime(500)
    expect(msgs.at(-1).msg).toContain('好的')
    const len = msgs.length
    expect(s.handleAction('skill-suggest-build', SUGGESTION.id)).toBe(true)
    vi.advanceTimersByTime(500)
    expect(msgs.length).toBe(len)
    expect(aiviewer.aiViewerBlocks.length).toBe(before)
  })

  it('build 只放一個 block；reset 後可重播', () => {
    const aiviewer = useAiviewerStore()
    const before = aiviewer.aiViewerBlocks.length
    const { ctx } = makeCtx()
    const s = useSkillSuggestion()
    s.offer(ctx, SUGGESTION)
    s.handleAction('skill-suggest-build', SUGGESTION.id)
    s.handleAction('skill-suggest-build', SUGGESTION.id)
    vi.advanceTimersByTime(500)
    expect(aiviewer.aiViewerBlocks.length).toBe(before + 1)
    s.reset(SUGGESTION.id)
    s.offer(ctx, SUGGESTION)
    s.handleAction('skill-suggest-build', SUGGESTION.id)
    vi.advanceTimersByTime(500)
    expect(aiviewer.aiViewerBlocks.length).toBe(before + 2)
  })

  it('非 skill-suggest- 前綴、未知 id、或已移除的 confirm 動作回 false', () => {
    const { ctx } = makeCtx()
    const s = useSkillSuggestion()
    expect(s.handleAction('conv7-satisfied', 'x')).toBe(false)
    expect(s.handleAction('skill-suggest-build', 'never-offered')).toBe(false)
    s.offer(ctx, SUGGESTION)
    expect(s.handleAction('skill-suggest-confirm', SUGGESTION.id)).toBe(false)
  })
})
```

覆寫 `src/components/__tests__/SkillSuggestCard.test.ts`：

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SkillSuggestCard from '@/components/AiViewer/SkillSuggestCard.vue'
import type { SkillSuggestion } from '@/composables/useSkillSuggestion'

const S: SkillSuggestion = {
  id: 'sg-1',
  name: '產品銷售報告整理',
  description: '查詢並產出報告',
  triggerHint: '偵測到銷售整理需求',
  steps: ['查詢數據', '套用規範產出'],
  reason: '查詢銷售資料＋套用部門報告規範',
}

describe('SkillSuggestCard', () => {
  it('ask：顯示 reason 與 build / skip 兩顆按鈕並帶 data-id', () => {
    const w = mount(SkillSuggestCard, { props: { suggestion: S, stage: 'ask' } })
    expect(w.text()).toContain('查詢銷售資料＋套用部門報告規範')
    const btns = w.findAll('[data-action]')
    expect(btns.map(b => b.attributes('data-action'))).toEqual(['skill-suggest-build', 'skill-suggest-skip'])
    expect(btns[0].attributes('data-id')).toBe('sg-1')
    expect(btns[0].text()).toBe('是，建立成個人技能')
    expect(btns[1].text()).toBe('不用了')
  })

  it('placed：顯示已放上區塊文案與「前往區塊」連結（data-value = blockId）', () => {
    const w = mount(SkillSuggestCard, { props: { suggestion: S, stage: 'placed', blockId: 'skillbuilder-9' } })
    expect(w.text()).toContain('已在畫布放上「產品銷售報告整理」的技能建立工具')
    const link = w.find('[data-action="pan-to-block"]')
    expect(link.exists()).toBe(true)
    expect(link.attributes('data-value')).toBe('skillbuilder-9')
    expect(link.text()).toContain('前往區塊')
    expect(w.find('[data-action^="skill-suggest-"]').exists()).toBe(false)
  })

  it('未知 stage：只顯示名稱，不渲染任何按鈕', () => {
    const w = mount(SkillSuggestCard, { props: { suggestion: S, stage: 'skipped' } })
    expect(w.text()).toContain('產品銷售報告整理')
    expect(w.find('[data-action]').exists()).toBe(false)
  })
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run src/composables/__tests__/useSkillSuggestion.test.ts src/components/__tests__/SkillSuggestCard.test.ts`
Expected: FAIL（沒有 `suggestionToPrefill`、`placed` 階段、`blockId` prop）。

- [ ] **Step 3: 改寫 `useSkillSuggestion.ts`**

```ts
import { useAiviewerStore } from '@/stores/AiViewerStore'
import type { SkillDraft } from '@/composables/useSkillStudioConversation'

// 專案內由 Agent 發起「這個流程要不要建立成個人技能？」的可重用流程。
// 使用者按「是」→ 直接在畫布放上一個已預填的技能建立 block（SKILL），
// 確認、調整、儲存、測試都在 block 內完成；河道只回一則「已放上區塊」。
// 任何 convN 腳本只要提供自己的 push/scroll/conversationId，就能一行 offer()；
// 按鈕點擊由 AiViewerRightBox 的 handleChatAreaClick 事件委派轉進 handleAction()。

export interface SkillSuggestion {
  id: string          // 一則建議一個 id，one-shot 旗標以此為 key
  name: string
  description: string
  triggerHint: string
  steps: string[]     // 依序編號組成 instructions，同時每步轉成一項覆蓋能力
  reason: string      // 「我留意到「{reason}」這類流程…」
}

export type SkillSuggestStage = 'ask' | 'placed' | 'skipped'

export interface SuggestionCtx {
  push: (msg: any) => void
  scroll: () => void
  conversationId: string   // 寫進 block 的 origin，讓 block 知道自己從哪段對話長出來
}

interface SuggestionState {
  ctx: SuggestionCtx
  suggestion: SkillSuggestion
  choiceMade: boolean      // build／skip 二擇一
}

export const SKILL_SUGGEST_ACTIONS = {
  build: 'skill-suggest-build',
  skip: 'skill-suggest-skip',
} as const

export function suggestionToPrefill(s: SkillSuggestion): Partial<SkillDraft> {
  return {
    name: s.name,
    description: s.description,
    triggerHint: s.triggerHint,
    instructions: s.steps.map((step, i) => `${i + 1}. ${step}`).join('\n'),
    capabilities: s.steps.map(step => ({ name: step, description: '' })),
  }
}

export function suggestionOpeningMessage(s: SkillSuggestion): string {
  return `這顆技能來自本對話的「${s.reason}」流程，設定我先填好了。想調整就直接說，確認後按「儲存為個人技能」。`
}

export function useSkillSuggestion() {
  const aiviewerStore = useAiviewerStore()
  const states = new Map<string, SuggestionState>()

  function offer(ctx: SuggestionCtx, suggestion: SkillSuggestion): void {
    states.set(suggestion.id, { ctx, suggestion, choiceMade: false })
    ctx.push({ agent: 'brain', cardType: 'skillSuggest', suggestion, stage: 'ask' as SkillSuggestStage })
    ctx.scroll()
  }

  function build(st: SuggestionState) {
    if (st.choiceMade) return
    st.choiceMade = true
    st.ctx.push({ forUser: true, msg: '是，建立成個人技能' })
    st.ctx.scroll()
    const s = st.suggestion
    const blockId = aiviewerStore.addSkillBuilderBlock({
      prefill: suggestionToPrefill(s),
      openingMessage: suggestionOpeningMessage(s),
      origin: { conversationId: st.ctx.conversationId, reason: s.reason },
    })
    setTimeout(() => {
      st.ctx.push({
        agent: 'brain',
        cardType: 'skillSuggest',
        suggestion: s,
        stage: 'placed' as SkillSuggestStage,
        blockId,
        finishResponse: true,
      })
      st.ctx.scroll()
    }, 500)
  }

  function skip(st: SuggestionState) {
    if (st.choiceMade) return
    st.choiceMade = true
    st.ctx.push({ forUser: true, msg: '不用了' })
    st.ctx.scroll()
    setTimeout(() => {
      st.ctx.push({ agent: 'brain', msg: '好的，這次的結果已保留在畫布中，之後有需要再跟我說一聲！' })
      st.ctx.scroll()
    }, 500)
  }

  function handleAction(action: string, suggestionId: string): boolean {
    if (!action.startsWith('skill-suggest-')) return false
    const st = states.get(suggestionId)
    if (!st) return false
    if (action === SKILL_SUGGEST_ACTIONS.build) build(st)
    else if (action === SKILL_SUGGEST_ACTIONS.skip) skip(st)
    else return false
    return true
  }

  function reset(suggestionId: string): void {
    states.delete(suggestionId)
  }

  return { offer, handleAction, reset }
}
```

- [ ] **Step 4: 改寫 `SkillSuggestCard.vue`**

```vue
<template>
  <div class="skill-suggest-card" :class="`skill-suggest-card--${props.stage}`">
    <!-- ask：只問要不要 -->
    <template v-if="props.stage === 'ask'">
      <p class="ssg-ask">
        我留意到「{{ props.suggestion.reason }}」這類流程你之後可能會重複用到。要不要我把它建立成你的個人技能？
      </p>
      <div class="conv1-quick-btns">
        <span class="conv1-quick-btn" :data-action="SKILL_SUGGEST_ACTIONS.build" :data-id="props.suggestion.id">是，建立成個人技能</span>
        <span class="conv1-quick-btn" :data-action="SKILL_SUGGEST_ACTIONS.skip" :data-id="props.suggestion.id">不用了</span>
      </div>
    </template>

    <!-- placed：block 已在畫布上，確認與儲存都在 block 內做 -->
    <template v-else-if="props.stage === 'placed'">
      <p class="ssg-lead">已在畫布放上「{{ props.suggestion.name }}」的技能建立工具，設定先幫你填好了，確認後在區塊裡按「儲存為個人技能」。</p>
      <div class="ssg-links">
        <span class="ssg-link" data-action="pan-to-block" :data-value="props.blockId">
          <i class="material-symbols-outlined">my_location</i>前往區塊
        </span>
      </div>
    </template>

    <!-- 其他 stage：只留名稱，不給任何按鈕 -->
    <template v-else>
      <div class="ssg-name">{{ props.suggestion.name }}</div>
    </template>
  </div>
</template>

<script setup lang="ts">
// 「建議建立成個人技能」卡片，純呈現：按鈕不 emit、只掛 data-action／data-id／data-value，
// 交給 AiViewerRightBox 的 handleChatAreaClick 事件委派
import { SKILL_SUGGEST_ACTIONS } from '@/composables/useSkillSuggestion'
import type { SkillSuggestion, SkillSuggestStage } from '@/composables/useSkillSuggestion'

const props = defineProps<{
  suggestion: SkillSuggestion
  stage: SkillSuggestStage
  blockId?: string
}>()
</script>
```

`_SkillSuggestCard.scss` 裡只被 preview 階段用到的 `.ssg-card`／`.ssg-icon`／`.ssg-card-body`／`.ssg-row`／`.ssg-label`／`.ssg-steps` 規則移除；保留 `.ssg-ask`／`.ssg-lead`／`.ssg-name`／`.ssg-links`／`.ssg-link`。

- [ ] **Step 5: `AiViewerRecord.vue` 與 `AiViewerRightBox.vue`**

`AiViewerRecord.vue` 的 `skillSuggest` 分支：`:skill-id="props.source.skillId"` → `:block-id="props.source.blockId"`。

`AiViewerRightBox.vue`：
- 刪除 `goto-skill-studio` 分支（L2426-2430；`SkillSuggestCard` 已不再產生它）。
- conv4 的 offer 改為 `skillSuggestion.offer({ push: c4Push, scroll: c4Scroll, conversationId: 'conv4' }, CONV4_SKILL_SUGGESTION)`。

- [ ] **Step 6: 跑測試確認通過**

Run: `npx vitest run src/composables/__tests__/useSkillSuggestion.test.ts src/components/__tests__/SkillSuggestCard.test.ts && npm run type-check && grep -rn "goto-skill-studio\|skill-suggest-confirm" src; echo "grep exit=$?"`
Expected: 測試全綠；type-check 無新增；grep 無命中（exit=1）。

手動（8088）：AiViewer 切到 conv4 → ⚡「整理上月產品銷售報告」→ 報告完成 → ask 卡 → 「是」→ 畫布出現預填 block（header「技能建立」徽章、名稱「產品銷售報告整理」、對話 tab 有脈絡條與開場訊息）、鏡頭移過去；河道 placed 卡「前往區塊」可再移鏡頭；block 預覽 tab 儲存 → 測試 tab；「不用了」路徑婉拒訊息不變。

- [ ] **Step 7: Commit**

```bash
git add src/composables/useSkillSuggestion.ts src/components/AiViewer/SkillSuggestCard.vue src/components/AiViewer/AiViewerRecord.vue src/components/AiViewer/AiViewerRightBox.vue src/scss/components/_SkillSuggestCard.scss src/composables/__tests__/useSkillSuggestion.test.ts src/components/__tests__/SkillSuggestCard.test.ts
git commit -m "feat(aiviewer): conv4 skill suggestion places a prefilled SKILL block instead of in-chat confirm"
```

---

### Task 8: 文件與全量驗證

**Files:**
- Modify: `PROJECT_CONTEXT.md`（3.3 AI 畫布編輯器、3.10 末段）
- Modify: `ARCHITECTURE.md`（區塊／blockType 相關段落）

- [ ] **Step 1: `PROJECT_CONTEXT.md`**

3.3 的區塊類型那行改為：

```markdown
- 可建立多種內容**區塊（Block）**：檔案型 PDF、Excel、PPT、圖片、Markdown、HTML、TXT、Word、Chart；**功能型** REPORT（報告組裝）、SKILL（技能建立）。功能型區塊在畫布上以實色卡片＋header 徽章與檔案區塊區隔，代表「可操作的工具」而不是「一份檔案」
```

3.3 末尾新增一段：

```markdown
- 工具箱（輸入區 ⚒）：「行銷報告生成」放 REPORT 區塊；「技能建立」放 SKILL 區塊。SKILL 區塊內自帶「對話／預覽／測試」三個 tab，重用 AI 賦能的零件，建立、修改、測試個人技能都在區塊內完成，並可「在 AI 賦能開啟」帶到獨立頁面
```

3.10 末段（Agent 主動建議那段）改為：

```markdown
專案內（AiViewer）Agent 完成任務後可主動建議「把這個流程建立成個人技能」（`useSkillSuggestion` ＋ `SkillSuggestCard`，conv4 為第一個接入的腳本）；使用者按「是」後直接在畫布放上一個已預填的 SKILL 區塊（含來源脈絡），確認、調整、儲存、測試都在區塊內進行，河道只回一則「已放上區塊」與「前往區塊」連結。
```

- [ ] **Step 2: `ARCHITECTURE.md`**

在描述 `AiViewerBlock.blockType` 或區塊渲染的段落補一句（沿用該檔語氣與格式）：

```markdown
blockType 分兩類：檔案型（PDF/EXCEL/PPT/IMAGE/CHART/TXT/HTML/MD/WORD/OTHER）與功能型（REPORT、SKILL）。功能型的 icon／label 由 `src/constants/toolBlocks.ts` 的 `TOOL_BLOCK_META` 統一提供，`AiViewerContentBox` 依此掛 `is-tool` 樣式與 header 徽章；SKILL 區塊的狀態以 `StudioSnapshot` 存在 block data，由 `viewBlock/skillBuilderViewBox.vue` hydrate／寫回。
```

- [ ] **Step 3: 全量驗證**

Run: `npm run type-check && npm run test:unit`
Expected: type-check 只剩既有 14 個；Vitest 全綠（`SkillStudio.test.ts` 原樣通過）。

- [ ] **Step 4: Commit**

```bash
git add PROJECT_CONTEXT.md ARCHITECTURE.md
git commit -m "docs: document SKILL canvas block, tool-block visual language and new conv4 flow"
```

---

## Self-Review

**Spec coverage**

| Spec | Task |
|---|---|
| §4.1 型別、§4.2 `TOOL_BLOCK_META` | 2 |
| §5.1 快照、§5.2 預填、§5.3 AI 賦能不變 | 1（+ 每個 task 都跑 `SkillStudio.test.ts`） |
| §6.1 store actions | 2 |
| §6.2 block 元件（tab、hydrate/sync、儲存、在 AI 賦能開啟、脈絡條、技能已刪） | 4 |
| §6.3 `compact`／`hideTabs` | 3 |
| §6.4 ContentBox 接線、§6.5 全螢幕、§6.6 複製刪除（沿用） | 5 |
| §7 視覺語彙 | 5 |
| §8 工具箱 | 6 |
| §9 conv4 改版、`pan-to-block` | 6、7 |
| §11 錯誤處理（技能已刪、區塊已刪、全螢幕同步、名稱重複） | 4、6 |
| §12 SCSS | 3、4、5、7 |
| §13 測試 | 各 task；ContentBox／RightBox 以 type-check ＋ 手動驗證 |
| §14 文件 | 8 |

**Placeholder scan**：無 TBD／TODO；所有程式碼步驟有完整內容。Task 2 Step 3 對 `types/AiViewer.ts` 匯出方式寫「照該檔既有寫法」，屬既有檔案事實查核（該檔用全域 `type`／`interface` 宣告或檔尾 export 清單，執行者打開即知），非留白。

**Type consistency**：`StudioSnapshot`／`toSnapshot`／`hydrate`／`detachSavedSkill`／`startCreate(prefill, openingMessage)`（T1）被 T2 store、T4 元件依相同簽名呼叫；`SkillBuilderBlockData { snapshot, origin, activeTab }` 與 `SkillBlockOrigin { conversationId, reason }`（T2）在 T4、T7 一致；`addSkillBuilderBlock({ prefill, openingMessage, origin })` 在 T6、T7 一致；`compact`／`hideTabs`（T3）在 T4 使用；data-action `pan-to-block` + `data-value`（T6 dispatcher）與 T7 卡片一致；`SkillSuggestStage` 三值在 T7 composable／卡片一致。
