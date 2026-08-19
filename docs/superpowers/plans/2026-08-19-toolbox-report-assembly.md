# 工具箱與報告組裝 Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 AiViewer 對話輸入區新增「工具箱」入口，第一個工具「行銷報告生成」透過引導對話在畫布上建立一個可拖曳排序、可從積木盒加入/移除章節的互動式報告組裝 Block。

**Architecture:** 新增 `blockType: 'REPORT'`，資料為 `{ sectionIds: string[], templateName: string | null }`。工具箱按鈕沿用既有 `next-option-box` 彈出選單模式；引導對話邏輯抽成獨立 composable（`useReportAssemblyConversation`），只在 `AiViewerRightBox.vue` 既有的四個掛點（`testMsgs` 訊息陣列選擇、對話標題、`resetConversation`、`handleChatAreaClick` action 分派）加入 `conv7` 分支，不改動既有 conv1～conv6 邏輯；Block 渲染元件 `reportAssemblyViewBox.vue` 依既有 `viewBlock/` 慣例新增，並在 `AiViewerContentBox.vue` 的三個既有 blockType 判斷點掛上 `'REPORT'`。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Pinia（Composition API store）、原生 HTML5 drag and drop（不引入新套件）、Vitest（store/composable 測試）、Playwright（e2e 流程測試）。

**Spec:** `docs/superpowers/specs/2026-08-19-toolbox-report-assembly-design.md`

## Global Constraints

- 所有元件用 `<script setup lang="ts">`，禁止 Options API
- 禁止 `<style scoped>`，樣式集中在 `src/scss/`；新增 SCSS partial 需在對應檔案中 `@import` 掛入（本專案 `src/scss/views/_index.scss` 用 `@import`，不是 `@forward`）
- 所有 import 使用 `@/` alias，不用相對路徑 `../../`
- 顏色使用 CSS Custom Properties 或既有 SCSS 變數，不寫死 hex（新增章節分類色點例外：延續 artifact 原型配色，作為與既有 `--c02/--c03/--c06/--c07` 語意一致的裝飾色，直接寫在元件內 `CATEGORIES` 常數）
- Pinia store 一律用 Composition API 寫法（`defineStore(id, () => {...})`）
- 元件內destructure store 狀態一律用 `storeToRefs()`；actions 可直接解構
- 不使用 `window.alert/confirm/prompt`，一律透過 `src/services/popDialog.ts`
- 不修改既有 conv1～conv6 邏輯與 `cannedTaskItems`／`addReportBlock()`（既有機制原樣保留，新工具是平行機制）
- 不建立後端 API 服務層（本輪範圍不含真實後端串接，章節目錄為前端假資料）

---

## Task 1: 型別定義 — ToolboxItem / ReportAssemblyBlockData

**Files:**
- Modify: `src/types/AiViewer.ts`

**Interfaces:**
- Produces: `ToolboxItem { id, icon, name, description, enabled }`、`ReportAssemblyBlockData { sectionIds: string[], templateName: string | null }`，以及 `BlockDataMap` 新增 `REPORT: ReportAssemblyBlockData` 分支（連動使 `BlockType` 聯集自動包含 `'REPORT'`，因為 `BlockType = keyof BlockDataMap`）

這個檔案是純型別定義，沒有執行邏輯，不寫獨立測試，靠後續任務的 `npm run type-check` 驗證。

- [ ] **Step 1: 修改 `BlockDataMap`，新增 `REPORT` 分支**

找到現有內容：

```ts
// 這裡定義了每種 block type 對應的 data 結構, 目前先簡單定義成 any, 之後再根據實際情況調整
type BlockDataMap = {
  IMAGE: { fileUrl: string };
  MD: any;
  HTML: any;
  TXT: any;
  PDF: any;
  EXCEL: any;
  CHART: SourceChart; // SourceChart 類型
  PPT: any;
  WORD: any;
  OTHER: any;
}
```

改為：

```ts
// 這裡定義了每種 block type 對應的 data 結構, 目前先簡單定義成 any, 之後再根據實際情況調整
type BlockDataMap = {
  IMAGE: { fileUrl: string };
  MD: any;
  HTML: any;
  TXT: any;
  PDF: any;
  EXCEL: any;
  CHART: SourceChart; // SourceChart 類型
  PPT: any;
  WORD: any;
  OTHER: any;
  REPORT: ReportAssemblyBlockData; // 報告組裝（可拖曳排序、積木盒加入/移除章節）
}
```

- [ ] **Step 2: 在 `/** comment 相關 */`區塊之前，新增報告組裝與工具箱型別**

找到：

```ts
/** comment 相關 */
```

改為（在它之前插入）：

```ts
/** 報告組裝相關 */

// 報告組裝 Block 的資料結構，sectionIds 為已組裝章節（依排序），templateName 為存成模板後的名稱
type ReportAssemblyBlockData = {
  sectionIds: string[]
  templateName: string | null
}

/** 工具箱相關 */

// 工具箱選單裡的單一個工具項目
interface ToolboxItem {
  id: string
  icon: string          // Material Symbols icon 名稱
  name: string
  description: string
  enabled: boolean       // false = 灰化、不可點擊（即將推出）
}

/** comment 相關 */
```

- [ ] **Step 3: 更新檔案結尾的 `export type { ... }`**

找到：

```ts
export type {
  AiViewerBlock,
  BlockTypeData,
  BlockType,
  SourceChart,

  MemoItem,
}
```

改為：

```ts
export type {
  AiViewerBlock,
  BlockTypeData,
  BlockType,
  SourceChart,
  ReportAssemblyBlockData,
  ToolboxItem,

  MemoItem,
}
```

- [ ] **Step 4: 執行型別檢查確認沒有壞掉既有程式碼**

Run: `npm run type-check`
Expected: 沒有新增的型別錯誤（若既有專案本來就有型別錯誤，確認錯誤數量沒有增加即可）

- [ ] **Step 5: Commit**

```bash
git add src/types/AiViewer.ts
git commit -m "feat(types): add ToolboxItem and ReportAssemblyBlockData types

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: AiViewerStore.ts — 報告組裝 store actions

**Files:**
- Modify: `src/stores/AiViewerStore.ts`
- Test: `src/stores/__tests__/AiViewerStore.reportAssembly.test.ts`

**Interfaces:**
- Consumes：`ReportAssemblyBlockData`（Task 1）、既有 `centerSpaceX`/`centerSpaceY`/`calcNextZindex()`/`panToTarget`/`aiViewerBlocks`
- Produces：
  - `addReportAssemblyBlock(sectionIds: string[]): string` — 建立新 Block，回傳新 block id
  - `updateReportAssemblySections(blockId: string, sectionIds: string[]): boolean` — 更新章節排序/內容，找不到 block 回傳 `false`
  - `saveReportAssemblyTemplate(blockId: string, templateName: string): boolean` — 寫入模板名稱，找不到 block 回傳 `false`

- [ ] **Step 1: 寫測試檔（先寫測試，此時 action 還不存在，預期會失敗）**

建立 `src/stores/__tests__/AiViewerStore.reportAssembly.test.ts`：

```ts
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useAiviewerStore } from '@/stores/AiViewerStore'

describe('AiViewerStore - 報告組裝', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('addReportAssemblyBlock 建立一個 blockType 為 REPORT 的區塊', () => {
    const store = useAiviewerStore()
    const before = store.aiViewerBlocks.length
    const blockId = store.addReportAssemblyBlock(['promo_kpi', 'promo_top10'])

    expect(store.aiViewerBlocks.length).toBe(before + 1)
    const block = store.aiViewerBlocks.find((b: any) => b.id === blockId)
    expect(block).toBeDefined()
    expect(block.data.blockType).toBe('REPORT')
    expect(block.data.data.sectionIds).toEqual(['promo_kpi', 'promo_top10'])
    expect(block.data.data.templateName).toBeNull()
  })

  it('updateReportAssemblySections 更新指定區塊的章節順序', () => {
    const store = useAiviewerStore()
    const blockId = store.addReportAssemblyBlock(['a', 'b'])

    const result = store.updateReportAssemblySections(blockId, ['b', 'a', 'c'])

    expect(result).toBe(true)
    const block = store.aiViewerBlocks.find((b: any) => b.id === blockId)
    expect(block.data.data.sectionIds).toEqual(['b', 'a', 'c'])
  })

  it('updateReportAssemblySections 找不到區塊時回傳 false', () => {
    const store = useAiviewerStore()
    const result = store.updateReportAssemblySections('not-exist-id', ['a'])
    expect(result).toBe(false)
  })

  it('saveReportAssemblyTemplate 寫入模板名稱', () => {
    const store = useAiviewerStore()
    const blockId = store.addReportAssemblyBlock(['a'])

    const result = store.saveReportAssemblyTemplate(blockId, '促銷週報')

    expect(result).toBe(true)
    const block = store.aiViewerBlocks.find((b: any) => b.id === blockId)
    expect(block.data.data.templateName).toBe('促銷週報')
  })

  it('saveReportAssemblyTemplate 找不到區塊時回傳 false', () => {
    const store = useAiviewerStore()
    const result = store.saveReportAssemblyTemplate('not-exist-id', '促銷週報')
    expect(result).toBe(false)
  })
})
```

- [ ] **Step 2: 執行測試確認失敗（因為 action 還不存在）**

Run: `npx vitest run src/stores/__tests__/AiViewerStore.reportAssembly.test.ts`
Expected: FAIL，錯誤訊息類似 `store.addReportAssemblyBlock is not a function`

- [ ] **Step 3: 在 `AiViewerStore.ts` 新增三個 action**

找到 `addReportBlock` 函式結尾（第 982 行附近的 `}`）與 `addChartBlock` 之間的空白處，在其後插入：

```ts
  // 建立報告組裝 Block（互動式：可拖曳排序、從積木盒加入/移除章節）
  function addReportAssemblyBlock(sectionIds: string[]): string {
    const BLOCK_W = 640;
    const BLOCK_H = 750;
    const GAP = 24;
    const slot = aiViewerBlocks.value.filter((b: any) => b.id?.startsWith('report-assembly-')).length;
    const nonReportBottom = aiViewerBlocks.value
      .filter((b: any) => !b.id?.startsWith('report-assembly-'))
      .reduce((max: number, b: any) => Math.max(max, (b.y ?? 0) + (b.height ?? 0)), centerSpaceY);
    const rowY = nonReportBottom + GAP;
    const id = 'report-assembly-' + Date.now();
    const temp: any = {
      id,
      x: centerSpaceX + slot * (BLOCK_W + GAP),
      y: rowY,
      width: BLOCK_W,
      height: BLOCK_H,
      blockName: '行銷報告組裝',
      z: calcNextZindex(),
      data: { blockType: 'REPORT', data: { sectionIds: [...sectionIds], templateName: null } }
    };
    aiViewerBlocks.value.push(temp);
    panToTarget.value = { x: temp.x, y: temp.y, width: temp.width, height: temp.height };
    return id;
  }

  // 更新報告組裝 Block 的章節清單（拖曳排序、積木盒加入/移除後呼叫）
  function updateReportAssemblySections(blockId: string, sectionIds: string[]): boolean {
    const block = aiViewerBlocks.value.find((b: any) => b.id === blockId);
    if (!block) return false;
    block.data.data.sectionIds = [...sectionIds];
    return true;
  }

  // 將報告組裝 Block 存成模板（本輪僅前端狀態，不接後端）
  function saveReportAssemblyTemplate(blockId: string, templateName: string): boolean {
    const block = aiViewerBlocks.value.find((b: any) => b.id === blockId);
    if (!block) return false;
    block.data.data.templateName = templateName;
    return true;
  }
```

- [ ] **Step 4: 在 `return { ... }` 清單加入三個新 action**

找到：

```ts
    calcNextZindex,
    sendUserInput,
    pasteBlock,
    deleteBlock,
    renameBlock,
    addReportBlock,
    addChartBlock,

    resetAiViewerState,
```

改為：

```ts
    calcNextZindex,
    sendUserInput,
    pasteBlock,
    deleteBlock,
    renameBlock,
    addReportBlock,
    addChartBlock,
    addReportAssemblyBlock,
    updateReportAssemblySections,
    saveReportAssemblyTemplate,

    resetAiViewerState,
```

- [ ] **Step 5: 執行測試確認通過**

Run: `npx vitest run src/stores/__tests__/AiViewerStore.reportAssembly.test.ts`
Expected: PASS（5 個測試全過）

- [ ] **Step 6: 執行型別檢查**

Run: `npm run type-check`
Expected: 無新增型別錯誤

- [ ] **Step 7: Commit**

```bash
git add src/stores/AiViewerStore.ts src/stores/__tests__/AiViewerStore.reportAssembly.test.ts
git commit -m "feat(store): add report assembly block actions

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: useReportAssemblyConversation composable

**Files:**
- Create: `src/composables/useReportAssemblyConversation.ts`
- Test: `src/composables/__tests__/useReportAssemblyConversation.test.ts`

**Interfaces:**
- Consumes：`useAiviewerStore().addReportAssemblyBlock(sectionIds: string[]): string`（Task 2）
- Produces：`useReportAssemblyConversation()` 回傳 `{ conv7Msgs: Ref<any[]>, conv7Title: Ref<string>, resetConv7: () => void, conv7InitFlow: () => void, conv7ConfirmGenerate: () => void, conv7Satisfied: () => void, conv7Adjust: () => void }`，供 Task 4 在 `AiViewerRightBox.vue` 掛入。

- [ ] **Step 1: 寫測試檔**

建立 `src/composables/__tests__/useReportAssemblyConversation.test.ts`：

```ts
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useAiviewerStore } from '@/stores/AiViewerStore'
import { useReportAssemblyConversation } from '@/composables/useReportAssemblyConversation'

describe('useReportAssemblyConversation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('conv7InitFlow 依腳本順序推入訊息', () => {
    const { conv7Msgs, conv7InitFlow } = useReportAssemblyConversation()

    conv7InitFlow()
    expect(conv7Msgs.value.length).toBe(1)
    expect(conv7Msgs.value[0].forUser).toBe(true)

    vi.advanceTimersByTime(500)
    expect(conv7Msgs.value.length).toBe(2)

    vi.advanceTimersByTime(700) // 累積 1200ms
    expect(conv7Msgs.value.length).toBe(3)
    expect(conv7Msgs.value[2].forUser).toBe(true)

    vi.advanceTimersByTime(800) // 累積 2000ms
    expect(conv7Msgs.value.length).toBe(4)
    expect(conv7Msgs.value[3].msg).toContain('conv7-confirm-generate')
  })

  it('conv7InitFlow 已有訊息時重複呼叫不會再推入', () => {
    const { conv7Msgs, conv7InitFlow } = useReportAssemblyConversation()
    conv7InitFlow()
    conv7InitFlow()
    expect(conv7Msgs.value.length).toBe(1)
  })

  it('conv7ConfirmGenerate 呼叫 store 建立報告組裝 Block 並推入完成訊息', () => {
    const store = useAiviewerStore()
    const before = store.aiViewerBlocks.length
    const { conv7Msgs, conv7ConfirmGenerate } = useReportAssemblyConversation()

    conv7ConfirmGenerate()
    expect(conv7Msgs.value[0].forUser).toBe(true)

    vi.advanceTimersByTime(600)
    expect(store.aiViewerBlocks.length).toBe(before + 1)
    expect(conv7Msgs.value[1].finishResponse).toBe(true)
    expect(conv7Msgs.value[1].msg).toContain('conv7-satisfied')
    expect(conv7Msgs.value[1].msg).toContain('conv7-adjust')
  })

  it('conv7ConfirmGenerate 重複呼叫只建立一次 Block', () => {
    const store = useAiviewerStore()
    const before = store.aiViewerBlocks.length
    const { conv7ConfirmGenerate } = useReportAssemblyConversation()

    conv7ConfirmGenerate()
    vi.advanceTimersByTime(600)
    conv7ConfirmGenerate()
    vi.advanceTimersByTime(600)

    expect(store.aiViewerBlocks.length).toBe(before + 1)
  })

  it('resetConv7 清空訊息與標題', () => {
    const { conv7Msgs, conv7Title, conv7InitFlow, resetConv7 } = useReportAssemblyConversation()
    conv7InitFlow()
    expect(conv7Title.value).toBe('行銷報告組裝')

    resetConv7()

    expect(conv7Msgs.value).toEqual([])
    expect(conv7Title.value).toBe('')
  })
})
```

- [ ] **Step 2: 執行測試確認失敗（模組還不存在）**

Run: `npx vitest run src/composables/__tests__/useReportAssemblyConversation.test.ts`
Expected: FAIL，找不到模組 `@/composables/useReportAssemblyConversation`

- [ ] **Step 3: 建立 composable**

建立 `src/composables/useReportAssemblyConversation.ts`：

```ts
import { ref } from 'vue';
import { useAiviewerStore } from '@/stores/AiViewerStore';

// 報告組裝引導對話（conv7）：從工具箱點「行銷報告生成」後，
// 走一段腳本化的澄清對話，最終在畫布建立可互動的報告組裝 Block。
export function useReportAssemblyConversation() {
  const aiviewerStore = useAiviewerStore();

  const conv7Msgs = ref<any[]>([]);
  let conv7IdCounter = 2;
  const conv7Title = ref('');
  const conv7Confirmed = ref(false);
  const conv7Adjusted = ref(false);

  const DEFAULT_SECTION_IDS = ['promo_kpi', 'promo_top10', 'promo_type', 'promo_monthly', 'time_heatmap'];

  function c7Push(msg: any) {
    conv7Msgs.value.push({ id: `c7_${conv7IdCounter++}`, ...msg });
  }

  function resetConv7() {
    conv7IdCounter = 2;
    conv7Title.value = '';
    conv7Msgs.value = [];
    conv7Confirmed.value = false;
    conv7Adjusted.value = false;
  }

  function conv7InitFlow() {
    if (conv7Msgs.value.length > 0) return;
    conv7Title.value = '行銷報告組裝';
    c7Push({ forUser: true, msg: '我想看一下最近的促銷活動效果' });
    setTimeout(() => {
      c7Push({ msg: '好，我來幫你看行銷活動成效報告。想先確認一下方向——你是想知道「這次/最近的活動該不該延續」，還是想比較「哪種促銷類型最有效，下次要選哪種」？' });
    }, 500);
    setTimeout(() => {
      c7Push({ forUser: true, msg: '我覺得上個月那個促銷活動好像沒什麼用' });
    }, 1200);
    setTimeout(() => {
      c7Push({
        msg: `了解，那我打算生成「行銷活動成效報告」，重點放在促銷活動成效與趨勢分析，可以嗎？
<div class="conv1-quick-btns" style="margin-top:8px">
  <span class="conv1-quick-btn" data-action="conv7-confirm-generate">可以</span>
</div>`,
      });
    }, 2000);
  }

  function conv7ConfirmGenerate() {
    if (conv7Confirmed.value) return;
    conv7Confirmed.value = true;
    c7Push({ forUser: true, msg: '可以' });
    setTimeout(() => {
      aiviewerStore.addReportAssemblyBlock([...DEFAULT_SECTION_IDS]);
      c7Push({
        finishResponse: true,
        msg: `報告生成好了，畫布上可以看到內容。這樣的報告你滿意嗎？
<div class="conv1-quick-btns" style="margin-top:8px">
  <span class="conv1-quick-btn" data-action="conv7-satisfied">滿意，先這樣</span>
  <span class="conv1-quick-btn" data-action="conv7-adjust">我要調整一下</span>
</div>`,
      });
    }, 600);
  }

  function conv7Satisfied() {
    c7Push({ forUser: true, msg: '滿意，先這樣' });
    setTimeout(() => {
      c7Push({ msg: '太好了！如果之後還想再看一次，可以直接調整章節或存成模板。' });
    }, 400);
  }

  function conv7Adjust() {
    if (conv7Adjusted.value) return;
    conv7Adjusted.value = true;
    c7Push({ forUser: true, msg: '我要調整一下' });
    setTimeout(() => {
      c7Push({ msg: '好，你可以直接在畫布上的報告組裝區塊拖曳調整順序、點 × 移除，或從積木盒加新的章節進來。' });
    }, 400);
  }

  return {
    conv7Msgs,
    conv7Title,
    resetConv7,
    conv7InitFlow,
    conv7ConfirmGenerate,
    conv7Satisfied,
    conv7Adjust,
  };
}
```

- [ ] **Step 4: 執行測試確認通過**

Run: `npx vitest run src/composables/__tests__/useReportAssemblyConversation.test.ts`
Expected: PASS（5 個測試全過）

- [ ] **Step 5: 執行型別檢查**

Run: `npm run type-check`
Expected: 無新增型別錯誤

- [ ] **Step 6: Commit**

```bash
git add src/composables/useReportAssemblyConversation.ts src/composables/__tests__/useReportAssemblyConversation.test.ts
git commit -m "feat: add report assembly guided conversation composable

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: AiViewerRightBox.vue — 工具箱入口與 conv7 對話流程整合

**Files:**
- Modify: `src/components/AiViewer/AiViewerRightBox.vue`
- Modify: `src/scss/views/_AiViewer.scss`
- Create: `src/scss/views/_AiViewer-report.scss`

**Interfaces:**
- Consumes：Task 1 的 `ToolboxItem` 型別；Task 3 的 `useReportAssemblyConversation()`；既有 `currentConversationId`（store，`Ref<string>`）、`resetConversation()`、`handleChatAreaClick()`、`initClickOutsideListener()`（`@/utils/utils`）
- Produces：無新增對外介面（本任務是把既有掛點串起來），此檔案改動後，`currentConversationId.value === 'conv7'` 時整個對話面板會顯示 conv7 的訊息與標題

這個任務沒有獨立的自動化測試（既有專案對 Vue 元件模板互動邏輯的測試慣例是 e2e，不是元件單元測試），驗證方式是型別檢查 + Task 7 的 e2e 測試。

- [ ] **Step 1: import composable 與型別**

找到：

```ts
import { handleContentWheel, stopWhellZoomEvent, stopTouchpadZoomEvent, handleEnterKeySubmit, initClickOutsideListener } from '@/utils/utils';
```

在它之後新增一行：

```ts
import { useReportAssemblyConversation } from '@/composables/useReportAssemblyConversation';
import type { ToolboxItem } from '@/types/AiViewer';
```

- [ ] **Step 2: 新增工具箱清單資料與 ref、掛入 composable**

找到既有的附加檔案/知識庫選單 ref 宣告：

```ts
// 附件功能選項清單
const accessoryFileFnBox = ref<HTMLElement|null>(null);
const isOpenAccessoryFileFnBox = ref(false);
onMounted(() => {
  initClickOutsideListener(accessoryFileFnBox.value!, () => {
    isOpenAccessoryFileFnBox.value = false;
  });
});
```

在它之前插入：

```ts
// 工具箱選單資料（本輪只有「行銷報告生成」可點，其餘為即將推出的佔位項目）
const toolboxItems: ToolboxItem[] = [
  { id: 'reportAssembly', icon: 'bar_chart', name: '行銷報告生成', description: '拖曳組裝行銷週報章節', enabled: true },
  { id: 'imageGen', icon: 'palette', name: '圖像生成', description: '即將推出', enabled: false },
  { id: 'musicGen', icon: 'music_note', name: '創作音樂', description: '即將推出', enabled: false },
  { id: 'deepSearch', icon: 'search', name: 'Deep Search', description: '即將推出', enabled: false },
];

const toolboxFnBox = ref<HTMLElement|null>(null);
const isOpenToolboxFnBox = ref(false);
onMounted(() => {
  initClickOutsideListener(toolboxFnBox.value!, () => {
    isOpenToolboxFnBox.value = false;
  });
});

const {
  conv7Msgs,
  conv7Title,
  resetConv7,
  conv7InitFlow,
  conv7ConfirmGenerate,
  conv7Satisfied,
  conv7Adjust,
} = useReportAssemblyConversation();

// 點擊工具箱項目：目前只有「行銷報告生成」可用，其餘 enabled: false 不處理
function openToolboxTool(item: ToolboxItem) {
  if (!item.enabled) return;
  isOpenToolboxFnBox.value = false;
  if (item.id === 'reportAssembly') {
    currentConversationId.value = 'conv7';
    resetConversation();
    nextTick(() => conv7InitFlow());
  }
}
```

- [ ] **Step 3: 新增工具箱按鈕（跟附加檔案、引用知識庫並排）**

找到：

```html
          <!-- 展開引用知識庫下拉清單按鈕 -->
          <button class="custom-btn" v-tooltip.top="'引用知識庫'"
            @click="isOpenKnowledgeRefFnBox = true">
            <i class="material-symbols-outlined">menu_book</i>
          </button>
        </div>
```

改為：

```html
          <!-- 展開引用知識庫下拉清單按鈕 -->
          <button class="custom-btn" v-tooltip.top="'引用知識庫'"
            @click="isOpenKnowledgeRefFnBox = true">
            <i class="material-symbols-outlined">menu_book</i>
          </button>
          <!-- 展開工具箱選單按鈕 -->
          <button class="custom-btn" v-tooltip.top="'工具箱'"
            @click="isOpenToolboxFnBox = true">
            <i class="material-symbols-outlined">construction</i>
          </button>
        </div>
```

- [ ] **Step 4: 新增工具箱選單 template**

找到：

```html
        <!-- 引用知識庫下拉清單 -->
        <div :class="['accessory-file-fn-box next-option-box', {'show': isOpenKnowledgeRefFnBox}]"
          ref="knowledgeRefFnBox">
          <div v-if="knowledgeList.length === 0" class="option-item">尚無知識庫項目</div>
          <div v-else class="option-item" v-for="item in knowledgeList" :key="item.id"
            @click="insertKnowledgeRef(item)">{{ item.title }}</div>
        </div>
```

在它之後插入：

```html
        <!-- 工具箱選單 -->
        <div :class="['toolbox-fn-box', 'AiViewer-next-option-box', {'show': isOpenToolboxFnBox}]"
          ref="toolboxFnBox">
          <div v-for="item in toolboxItems" :key="item.id"
            :class="['toolbox-item', { disabled: !item.enabled }]"
            @click="openToolboxTool(item)">
            <i class="material-symbols-outlined toolbox-item-icon">{{ item.icon }}</i>
            <div class="toolbox-item-body">
              <div class="toolbox-item-name">{{ item.name }}</div>
              <div class="toolbox-item-desc">{{ item.description }}</div>
            </div>
          </div>
        </div>
```

- [ ] **Step 5: 加入 conv7 對話標題**

找到：

```ts
  if (currentConversationId.value === 'conv6') return conv6Title.value || 'TEVA涼鞋銷售分析';
```

在它之後新增一行：

```ts
  if (currentConversationId.value === 'conv7') return conv7Title.value || '行銷報告組裝';
```

- [ ] **Step 6: 加入 conv7 訊息陣列選擇分支**

找到：

```ts
  const msgs = currentConversationId.value === 'conv2' ? conv2Msgs.value
    : currentConversationId.value === 'conv3' ? conv3Msgs.value
    : currentConversationId.value === 'conv4' ? conv4Msgs.value
    : currentConversationId.value === 'conv5' ? conv5Msgs.value
    : currentConversationId.value === 'conv6' ? conv6Msgs.value
    : conv1Msgs.value;
```

改為：

```ts
  const msgs = currentConversationId.value === 'conv2' ? conv2Msgs.value
    : currentConversationId.value === 'conv3' ? conv3Msgs.value
    : currentConversationId.value === 'conv4' ? conv4Msgs.value
    : currentConversationId.value === 'conv5' ? conv5Msgs.value
    : currentConversationId.value === 'conv6' ? conv6Msgs.value
    : currentConversationId.value === 'conv7' ? conv7Msgs.value
    : conv1Msgs.value;
```

- [ ] **Step 7: 在 `resetConversation()` 加入 conv7 分支**

找到：

```ts
  if (currentConversationId.value === 'conv6') {
    conv6IdCounter = 2;
    conv6Title.value = '';
    conv6Msgs.value = [];
    conv6ReportChoiceMade.value = false;
    conv6FlowStarted.value = false;
  }
  nextTick(() => AiAgentChatListScrollTo('ASC'));
```

改為：

```ts
  if (currentConversationId.value === 'conv6') {
    conv6IdCounter = 2;
    conv6Title.value = '';
    conv6Msgs.value = [];
    conv6ReportChoiceMade.value = false;
    conv6FlowStarted.value = false;
  }
  if (currentConversationId.value === 'conv7') {
    resetConv7();
  }
  nextTick(() => AiAgentChatListScrollTo('ASC'));
```

- [ ] **Step 8: 在 `handleChatAreaClick` 加入 conv7 quick-reply 分派**

找到：

```ts
  if (action === 'conv4-confirm-save-skill') {
    conv4ConfirmSaveSkill();
    return;
  }
```

在它之後插入：

```ts
  if (action === 'conv7-confirm-generate') {
    conv7ConfirmGenerate();
    return;
  }
  if (action === 'conv7-satisfied') {
    conv7Satisfied();
    return;
  }
  if (action === 'conv7-adjust') {
    conv7Adjust();
    return;
  }
```

- [ ] **Step 9: 新增 SCSS — 工具箱按鈕與選單樣式**

建立 `src/scss/views/_AiViewer-report.scss`：

```scss
// 工具箱選單（沿用 accessory-file-fn-box 的定位方式，搭配正確的 AiViewer-next-option-box 外觀樣式）
.toolbox-fn-box {
  position: absolute;
  left: -12px;
  bottom: 44px;
  visibility: hidden;
  min-width: 220px;
  &.show {
    visibility: visible;
  }

  .toolbox-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 8px;
    border-radius: 8px;
    cursor: pointer;

    &:hover {
      background-color: var(--surface);
    }

    &.disabled {
      opacity: 0.45;
      cursor: default;
      &:hover {
        background-color: transparent;
      }
    }

    .toolbox-item-icon {
      flex: 0 0 auto;
      font-size: 20px;
      margin-top: 2px;
    }

    .toolbox-item-body {
      flex: 1;
      min-width: 0;
    }

    .toolbox-item-name {
      font-size: 13.5px;
      font-weight: 700;
    }

    .toolbox-item-desc {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 2px;
    }
  }
}
```

在 `_AiViewer.scss` 檔案最後一行新增：

```scss
@import "./AiViewer-report";
```

- [ ] **Step 10: 執行型別檢查與 lint**

Run: `npm run type-check && npm run lint`
Expected: 無新增錯誤

- [ ] **Step 11: 手動驗證（dev server）**

Run: `npm run dev`，開啟 `/aiviews/view/AiViewer`，確認：
1. 輸入框旁邊出現工具箱按鈕（🛠 construction 圖示），tooltip 顯示「工具箱」
2. 點擊後彈出選單，顯示 4 個項目，「行銷報告生成」可點，其餘 3 項灰化不可點
3. 點擊「行銷報告生成」後，對話面板開始跑腳本訊息（約 2 秒內跑完 4 則訊息），最後一則出現「可以」按鈕
4. 點擊「可以」後，畫布上出現一個報告組裝 Block（此時內容元件尚未建立，會顯示空白或錯誤——這是預期的，Task 5 會補上）

- [ ] **Step 12: Commit**

```bash
git add src/components/AiViewer/AiViewerRightBox.vue src/scss/views/_AiViewer.scss src/scss/views/_AiViewer-report.scss
git commit -m "feat(AiViewer): add toolbox entry and conv7 report assembly flow

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: reportAssemblyViewBox.vue — 報告組裝 Block 元件

**Files:**
- Create: `src/components/AiViewer/viewBlock/reportAssemblyViewBox.vue`
- Modify: `src/scss/views/_AiViewer-report.scss`

**Interfaces:**
- Consumes：`props.id: string`（block id）、`props.source: { blockType: 'REPORT', data: ReportAssemblyBlockData }`；store 的 `updateReportAssemblySections(blockId, sectionIds)`、`saveReportAssemblyTemplate(blockId, templateName)`（Task 2）；`popDialog.toast(msg)`（`@/services/popDialog`)
- Produces：無對外 emit（本元件沒有 loading/failure 狀態，不需要 `failure` 事件）

沒有獨立單元測試（比照專案慣例，Vue 元件的互動邏輯用 e2e 覆蓋，見 Task 7），本任務用型別檢查 + 手動驗證確認。

- [ ] **Step 1: 建立元件檔案**

建立 `src/components/AiViewer/viewBlock/reportAssemblyViewBox.vue`：

```vue
<template>
  <div class="reportAssemblyViewBox">
    <div class="report-assembly-head">
      <span class="report-assembly-count">已選 {{ sectionIds.length }} 個章節</span>
      <button class="custom-btn report-assembly-save-btn"
        :disabled="sectionIds.length === 0"
        @click="handleSaveTemplate">
        <i class="material-symbols-outlined">save</i>存成模板
      </button>
    </div>

    <ol class="report-assembly-list" v-if="sectionIds.length > 0">
      <li v-for="sectionId in sectionIds" :key="sectionId"
        class="report-assembly-item"
        :class="{
          dragging: dragId === sectionId,
          'drag-over-before': dragOverId === sectionId && dragOverBefore,
          'drag-over-after': dragOverId === sectionId && !dragOverBefore,
        }"
        draggable="true"
        @dragstart="handleDragStart(sectionId)"
        @dragend="handleDragEnd"
        @dragover="handleDragOver($event, sectionId)"
        @dragleave="handleDragLeave"
        @drop="handleDrop($event, sectionId)">
        <span class="report-assembly-handle material-symbols-outlined">drag_indicator</span>
        <span class="report-assembly-dot" :style="{ background: categoryColor(sectionId) }"></span>
        <span class="report-assembly-item-body">
          <span class="report-assembly-item-name">{{ sectionName(sectionId) }}</span>
          <span class="report-assembly-item-desc">{{ sectionDesc(sectionId) }}</span>
        </span>
        <button class="report-assembly-remove" @click="removeSection(sectionId)">
          <i class="material-symbols-outlined">close</i>
        </button>
      </li>
    </ol>
    <div class="report-assembly-empty" v-else>還沒有章節，從下方積木盒加入</div>

    <div class="report-assembly-palette">
      <details v-for="category in categories" :key="category.id" class="report-assembly-category" open>
        <summary>
          <span class="report-assembly-dot" :style="{ background: category.color }"></span>
          {{ category.label }}
          <span class="report-assembly-category-count">{{ addedCountInCategory(category.id) }}/{{ sectionsByCategory(category.id).length }}</span>
        </summary>
        <div class="report-assembly-category-items">
          <div v-for="section in sectionsByCategory(category.id)" :key="section.id"
            class="report-assembly-palette-item" :class="{ added: sectionIds.includes(section.id) }">
            <span class="report-assembly-item-body">
              <span class="report-assembly-item-name">{{ section.name }}</span>
              <span class="report-assembly-item-desc">{{ section.description }}</span>
            </span>
            <button class="report-assembly-add-btn" @click="addSection(section.id)">
              <i class="material-symbols-outlined">{{ sectionIds.includes(section.id) ? 'check' : 'add' }}</i>
            </button>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { PropType } from 'vue';
import { useAiviewerStore } from '@/stores/AiViewerStore';
import popDialog from '@/services/popDialog';

interface ReportSection {
  id: string
  categoryId: string
  name: string
  description: string
}

interface ReportCategory {
  id: string
  label: string
  color: string
}

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  source: {
    type: Object as PropType<any>,
    required: true
  }
});

const aiviewerStore = useAiviewerStore();

const CATEGORIES: ReportCategory[] = [
  { id: 'promo', label: '行銷活動成效', color: '#c2703d' },
  { id: 'ta', label: 'TA 用戶畫像', color: '#3f7cac' },
  { id: 'member', label: '會員留存與流失', color: '#ba4a56' },
  { id: 'product', label: '商品深度分析', color: '#4f9d69' },
];

const SECTIONS: ReportSection[] = [
  { id: 'promo_kpi', categoryId: 'promo', name: '促銷核心 KPI', description: '取得行銷活動核心 KPI 資料（完成訂單數、GMV、折扣總額、折扣佔比、規則數）。' },
  { id: 'promo_top10', categoryId: 'promo', name: '前 10 大活動', description: '取得各促銷活動帶動效果 Top 10 資料，並自動生成圖表。' },
  { id: 'promo_type', categoryId: 'promo', name: '活動類型分析', description: '取得各促銷類型效益資料（類型分布、有折扣 vs 無折扣 AOV），並自動生成圖表。' },
  { id: 'promo_monthly', categoryId: 'promo', name: '月度促銷趨勢', description: '取得已完成訂單的月度訂單數與 GMV 走勢，並自動生成圖表。' },
  { id: 'time_heatmap', categoryId: 'promo', name: '銷售熱門時段', description: '取得星期 x 小時的訂單量/GMV 熱力圖資料，回答「什麼時候該推活動」。' },
  { id: 'gender', categoryId: 'ta', name: '性別分布', description: '取得會員性別分布資料，圖表自動生成。' },
  { id: 'age', categoryId: 'ta', name: '年齡層分布', description: '取得會員年齡分布資料，圖表自動生成。' },
  { id: 'gender_age_cross', categoryId: 'ta', name: '性別 × 年齡交叉', description: '性別 × 年齡層交叉分布，回答「不同性別的年齡結構」這類橫跨兩個維度的問題。' },
  { id: 'city_distribution', categoryId: 'ta', name: '地理分布', description: '會員地理分布（佔比 ≥1% 的城市）資料，圖表自動生成。' },
  { id: 'persona', categoryId: 'ta', name: '會員人物誌', description: '性別 × 年齡層 × 主力購買品類 × RFM 行為分群的四維交叉輪廓。' },
  { id: 'member_kpi', categoryId: 'member', name: '會員留存核心 KPI', description: '有購買記錄會員數、新客/回購比例、平均購買頻次、高價值會員數。' },
  { id: 'rfm_segments', categoryId: 'member', name: 'RFM 分群', description: 'R/F/M 各自五分位數評 1-5 分，交叉對到 10 種標準命名分群（冠軍客戶/忠實顧客/潛力顧客等）。' },
  { id: 'top_products', categoryId: 'product', name: '熱銷商品 Top 10', description: '分別按營收與按銷量排名，含自動生成橫條圖。' },
  { id: 'low_sales_products', categoryId: 'product', name: '低銷量商品清單', description: '銷量最低的 20 個商品清單（依銷量由低到高），含自動生成圖表。' },
];

const SECTION_MAP: Record<string, ReportSection> = Object.fromEntries(SECTIONS.map(s => [s.id, s]));
const CATEGORY_MAP: Record<string, ReportCategory> = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

const categories = CATEGORIES;

const sectionIds = computed<string[]>(() => props.source.data.sectionIds ?? []);

function sectionName(sectionId: string): string {
  return SECTION_MAP[sectionId]?.name ?? sectionId;
}
function sectionDesc(sectionId: string): string {
  return SECTION_MAP[sectionId]?.description ?? '';
}
function categoryColor(sectionId: string): string {
  const section = SECTION_MAP[sectionId];
  if (!section) return '#c7c9d1';
  return CATEGORY_MAP[section.categoryId]?.color ?? '#c7c9d1';
}
function sectionsByCategory(categoryId: string): ReportSection[] {
  return SECTIONS.filter(s => s.categoryId === categoryId);
}
function addedCountInCategory(categoryId: string): number {
  return sectionsByCategory(categoryId).filter(s => sectionIds.value.includes(s.id)).length;
}

function addSection(sectionId: string) {
  if (sectionIds.value.includes(sectionId)) return;
  aiviewerStore.updateReportAssemblySections(props.id, [...sectionIds.value, sectionId]);
}
function removeSection(sectionId: string) {
  aiviewerStore.updateReportAssemblySections(props.id, sectionIds.value.filter((id: string) => id !== sectionId));
}

// 拖曳排序（原生 HTML5 drag and drop，不引入新套件）
const dragId = ref<string | null>(null);
const dragOverId = ref<string | null>(null);
const dragOverBefore = ref(true);

function handleDragStart(sectionId: string) {
  dragId.value = sectionId;
}
function handleDragEnd() {
  dragId.value = null;
  dragOverId.value = null;
}
function handleDragOver(event: DragEvent, sectionId: string) {
  event.preventDefault();
  if (sectionId === dragId.value) return;
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  dragOverId.value = sectionId;
  dragOverBefore.value = (event.clientY - rect.top) < rect.height / 2;
}
function handleDragLeave() {
  dragOverId.value = null;
}
function handleDrop(event: DragEvent, targetId: string) {
  event.preventDefault();
  dragOverId.value = null;
  const from = dragId.value;
  if (!from || from === targetId) return;
  const next = sectionIds.value.filter((id: string) => id !== from);
  let to = next.indexOf(targetId);
  to = dragOverBefore.value ? to : to + 1;
  next.splice(to, 0, from);
  aiviewerStore.updateReportAssemblySections(props.id, next);
}

function handleSaveTemplate() {
  if (sectionIds.value.length === 0) return;
  const name = props.source.data.templateName || '促銷週報';
  aiviewerStore.saveReportAssemblyTemplate(props.id, name);
  popDialog.toast(`已存成「${name}」模板`);
}
</script>
```

- [ ] **Step 2: 新增 SCSS — 報告組裝 Block 樣式**

在 `src/scss/views/_AiViewer-report.scss` 檔案最後追加：

```scss
// 報告組裝 Block（畫布上的互動式章節清單 + 積木盒）
.reportAssemblyViewBox {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;

  .report-assembly-head {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .report-assembly-count {
      font-size: 12.5px;
      color: var(--text-secondary);
    }

    .report-assembly-save-btn {
      width: auto;
      padding: 6px 14px;
      font-size: 13px;
      gap: 4px;
      &:disabled {
        opacity: 0.4;
        cursor: default;
      }
    }
  }

  .report-assembly-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .report-assembly-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: var(--surface);
    border: 1px solid var(--divider);
    border-radius: 10px;
    padding: 10px 12px;
    cursor: grab;

    &:active {
      cursor: grabbing;
    }
    &.dragging {
      opacity: 0.4;
    }
    &.drag-over-before {
      box-shadow: inset 0 2px 0 var(--primary);
    }
    &.drag-over-after {
      box-shadow: inset 0 -2px 0 var(--primary);
    }

    .report-assembly-handle {
      color: var(--text-secondary);
      font-size: 18px;
    }
  }

  .report-assembly-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex: 0 0 auto;
    margin-top: 5px;
  }

  .report-assembly-item-body {
    flex: 1;
    min-width: 0;
  }

  .report-assembly-item-name {
    font-weight: 700;
    font-size: 13.5px;
  }

  .report-assembly-item-desc {
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 3px;
    line-height: 1.5;
  }

  .report-assembly-remove {
    border: none;
    background: transparent;
    color: var(--text-secondary);
    border-radius: 6px;
    padding: 2px 4px;
    &:hover {
      background: var(--divider);
    }
  }

  .report-assembly-empty {
    border: 1.5px dashed var(--divider);
    border-radius: 10px;
    padding: 20px;
    text-align: center;
    font-size: 12.5px;
    color: var(--text-secondary);
  }

  .report-assembly-palette {
    border-top: 1px solid var(--divider);
    padding-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .report-assembly-category {
    summary {
      list-style: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12.5px;
      font-weight: 700;
      padding: 6px 2px;

      &::-webkit-details-marker {
        display: none;
      }

      .report-assembly-category-count {
        margin-left: auto;
        color: var(--text-secondary);
        font-weight: 500;
      }
    }
  }

  .report-assembly-category-items {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 6px 0 2px 16px;
  }

  .report-assembly-palette-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 7px 9px;
    border-radius: 8px;

    &:hover {
      background: var(--surface);
    }

    &.added .report-assembly-add-btn {
      color: var(--primary);
      border-color: var(--primary);
    }
  }

  .report-assembly-add-btn {
    flex: 0 0 auto;
    border: 1px solid var(--divider);
    background: var(--page-bg);
    color: var(--text);
    border-radius: 6px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 16px;
    }
  }
}
```

- [ ] **Step 3: 執行型別檢查**

Run: `npm run type-check`
Expected: 無新增錯誤（此步驟會先失敗，因為 Task 6 還沒把這個元件掛進 `AiViewerContentBox.vue`，元件本身語法正確即可，不要求已被使用）

- [ ] **Step 4: Commit**

```bash
git add src/components/AiViewer/viewBlock/reportAssemblyViewBox.vue src/scss/views/_AiViewer-report.scss
git commit -m "feat(AiViewer): add reportAssemblyViewBox component

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: AiViewerContentBox.vue — 掛載 REPORT blockType

**Files:**
- Modify: `src/components/AiViewer/AiViewerContentBox.vue`

**Interfaces:**
- Consumes：Task 5 的 `reportAssemblyViewBox.vue`

- [ ] **Step 1: import 新元件**

在檔案開頭，找到其他 `viewBlock` 元件的 import（例如 `chartViewBox`、`htmlFileViewBox` 等所在的 import 區塊），在同一區塊新增一行：

```ts
import reportAssemblyViewBox from '@/components/AiViewer/viewBlock/reportAssemblyViewBox.vue';
```

- [ ] **Step 2: 加入可縮放/拖曳的條件判斷**

找到：

```html
      !isShowCommentView &&
      !nowMultiChoiceAiViewerIds.includes(props.id) &&
      !catchBlockName &&
      (
        props.source.blockType === 'IMAGE' ||
        props.source.blockType === 'HTML' ||
        props.source.blockType === 'PDF' ||
        props.source.blockType === 'EXCEL' ||
        props.source.blockType === 'TXT' ||
        props.source.blockType === 'MD' ||
        props.source.blockType === 'CHART'
      )
    )"
```

改為：

```html
      !isShowCommentView &&
      !nowMultiChoiceAiViewerIds.includes(props.id) &&
      !catchBlockName &&
      (
        props.source.blockType === 'IMAGE' ||
        props.source.blockType === 'HTML' ||
        props.source.blockType === 'PDF' ||
        props.source.blockType === 'EXCEL' ||
        props.source.blockType === 'TXT' ||
        props.source.blockType === 'MD' ||
        props.source.blockType === 'CHART' ||
        props.source.blockType === 'REPORT'
      )
    )"
```

- [ ] **Step 3: 加入 content-box class 綁定**

找到：

```html
        :class="['content-box', {
          'for-OTHER': props.source.blockType === 'OTHER',
          'for-TXT': props.source.blockType === 'TXT',
          'for-IMAGE': props.source.blockType === 'IMAGE',
          'for-EXCEL': props.source.blockType === 'EXCEL',
          'for-HTML': props.source.blockType === 'HTML',
          'for-PDF': props.source.blockType === 'PDF',
          'for-PPT': props.source.blockType === 'PPT',
          'for-CHART': props.source.blockType === 'CHART',
          'for-MD': props.source.blockType === 'MD',
          'for-WORD': props.source.blockType === 'WORD',
        }]"
```

改為：

```html
        :class="['content-box', {
          'for-OTHER': props.source.blockType === 'OTHER',
          'for-TXT': props.source.blockType === 'TXT',
          'for-IMAGE': props.source.blockType === 'IMAGE',
          'for-EXCEL': props.source.blockType === 'EXCEL',
          'for-HTML': props.source.blockType === 'HTML',
          'for-PDF': props.source.blockType === 'PDF',
          'for-PPT': props.source.blockType === 'PPT',
          'for-CHART': props.source.blockType === 'CHART',
          'for-MD': props.source.blockType === 'MD',
          'for-WORD': props.source.blockType === 'WORD',
          'for-REPORT': props.source.blockType === 'REPORT',
        }]"
```

- [ ] **Step 4: 掛載元件**

找到：

```html
        <!-- WORD -->
        <wordViewBox v-if="props.source.blockType === 'WORD'"
          :id="props.id" :source="props.source"/>
```

在它之後插入：

```html
        <!-- REPORT -->
        <reportAssemblyViewBox v-if="props.source.blockType === 'REPORT'"
          :id="props.id" :source="props.source"/>
```

- [ ] **Step 5: 執行型別檢查**

Run: `npm run type-check`
Expected: 無新增錯誤

- [ ] **Step 6: 手動驗證（接續 Task 4 Step 11 的流程）**

Run: `npm run dev`，重跑一次 Task 4 Step 11 的流程（工具箱 → 行銷報告生成 → 跑完腳本 → 點「可以」），確認：
1. 畫布上出現的 Block 正確顯示「已選 5 個章節」與 5 個章節清單（促銷核心 KPI、前 10 大活動、活動類型分析、月度促銷趨勢、銷售熱門時段）
2. 積木盒可展開/收合，點「+」可加入新章節，加入後按鈕變成 ✓
3. 拖曳章節可以重新排序
4. 點 × 可以移除章節
5. 點「存成模板」出現 toast 提示

- [ ] **Step 7: Commit**

```bash
git add src/components/AiViewer/AiViewerContentBox.vue
git commit -m "feat(AiViewer): mount reportAssemblyViewBox for REPORT blockType

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7: Playwright e2e 測試 — 工具箱到報告組裝完整流程

**Files:**
- Create: `e2e/toolbox-report-assembly.spec.ts`

**Interfaces:**
- Consumes：Task 4～6 完成後的完整 UI 行為

- [ ] **Step 1: 寫 e2e 測試**

建立 `e2e/toolbox-report-assembly.spec.ts`：

```typescript
import { test, expect } from '@playwright/test'

test.describe('工具箱 × 報告組裝', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/aiviews/view/AiViewer')
    await page.waitForLoadState('networkidle')
  })

  test('開啟工具箱顯示 4 個項目，僅行銷報告生成可點', async ({ page }) => {
    await page.locator('button').filter({ has: page.locator('i:text("construction")') }).first().click()
    await page.waitForTimeout(200)

    await expect(page.locator('.toolbox-item').filter({ hasText: '行銷報告生成' })).toBeVisible()
    await expect(page.locator('.toolbox-item').filter({ hasText: '圖像生成' })).toHaveClass(/disabled/)
    await expect(page.locator('.toolbox-item').filter({ hasText: '創作音樂' })).toHaveClass(/disabled/)
    await expect(page.locator('.toolbox-item').filter({ hasText: 'Deep Search' })).toHaveClass(/disabled/)
  })

  test('點擊行銷報告生成跑完引導對話後，畫布出現報告組裝 Block', async ({ page }) => {
    await page.locator('button').filter({ has: page.locator('i:text("construction")') }).first().click()
    await page.waitForTimeout(200)
    await page.locator('.toolbox-item').filter({ hasText: '行銷報告生成' }).click()

    // 等待腳本對話跑完（conv7InitFlow 最後一則訊息在 2000ms 後推入）
    await page.waitForTimeout(2500)
    await expect(page.locator('.conv1-quick-btn[data-action="conv7-confirm-generate"]')).toBeVisible()

    await page.locator('.conv1-quick-btn[data-action="conv7-confirm-generate"]').click()
    await page.waitForTimeout(1000)

    await expect(page.locator('.reportAssemblyViewBox')).toBeVisible()
    await expect(page.locator('.reportAssemblyViewBox .report-assembly-count')).toHaveText('已選 5 個章節')
    await expect(page.locator('.reportAssemblyViewBox .report-assembly-item')).toHaveCount(5)
  })

  test('報告組裝 Block 內可以加入、移除章節', async ({ page }) => {
    await page.locator('button').filter({ has: page.locator('i:text("construction")') }).first().click()
    await page.waitForTimeout(200)
    await page.locator('.toolbox-item').filter({ hasText: '行銷報告生成' }).click()
    await page.waitForTimeout(2500)
    await page.locator('.conv1-quick-btn[data-action="conv7-confirm-generate"]').click()
    await page.waitForTimeout(1000)

    // 加入一個尚未加入的章節（性別分布）
    const paletteItem = page.locator('.report-assembly-palette-item').filter({ hasText: '性別分布' })
    await paletteItem.locator('.report-assembly-add-btn').click()
    await expect(page.locator('.reportAssemblyViewBox .report-assembly-count')).toHaveText('已選 6 個章節')
    await expect(page.locator('.reportAssemblyViewBox .report-assembly-item').filter({ hasText: '性別分布' })).toBeVisible()

    // 移除一個已組裝的章節
    await page.locator('.report-assembly-item').filter({ hasText: '前 10 大活動' }).locator('.report-assembly-remove').click()
    await expect(page.locator('.reportAssemblyViewBox .report-assembly-count')).toHaveText('已選 5 個章節')
    await expect(page.locator('.reportAssemblyViewBox .report-assembly-item').filter({ hasText: '前 10 大活動' })).toHaveCount(0)
  })

  test('存成模板顯示 toast 提示', async ({ page }) => {
    await page.locator('button').filter({ has: page.locator('i:text("construction")') }).first().click()
    await page.waitForTimeout(200)
    await page.locator('.toolbox-item').filter({ hasText: '行銷報告生成' }).click()
    await page.waitForTimeout(2500)
    await page.locator('.conv1-quick-btn[data-action="conv7-confirm-generate"]').click()
    await page.waitForTimeout(1000)

    await page.locator('.report-assembly-save-btn').click()
    await expect(page.locator('.pop-toast')).toBeVisible()
  })
})
```

- [ ] **Step 2: 執行 e2e 測試**

Run: `npm run test:e2e -- toolbox-report-assembly`
Expected: PASS（4 個測試全過）。若因為選擇器跟實際渲染的 DOM 結構不完全一致而失敗（例如 `i:text("construction")` 選不到按鈕），依實際渲染結果調整選擇器後重跑，不要跳過任何一個測試。

- [ ] **Step 3: 完整回歸 — 跑一次全部既有 e2e，確認沒有弄壞既有流程**

Run: `npm run test:e2e`
Expected: 既有測試維持原本的通過/失敗狀態（不因這次改動新增任何失敗）

- [ ] **Step 4: Commit**

```bash
git add e2e/toolbox-report-assembly.spec.ts
git commit -m "test(e2e): add toolbox and report assembly flow coverage

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## 完成後檢查清單（對照 spec 第 2.1 節）

- [x] 工具箱按鈕與選單（Task 4）
- [x] 僅「行銷報告生成」可點，其餘 3 項灰化佔位（Task 4）
- [x] 引導對話腳本（Task 3、Task 4）
- [x] 建立 `blockType: 'REPORT'` Block（Task 2、Task 6）
- [x] Block 內拖曳排序、加入/移除章節（Task 5）
- [x] 存成模板（前端狀態＋toast，Task 2、Task 5）
- [x] 章節目錄假資料（Task 5，與 spec 第 4.3 節章節目錄表一致）
