# 知識庫多檔案來源管理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓知識庫可以有多個檔案來源，建立與更新共用同一個多選檔案勾選元件；Phase 1（Task 1-4）完成「建立知識庫」多檔升級，Phase 2（Task 5）新增「更新知識庫」流程。

**Architecture:** `ResourceFile.knowledgeIds` 從單值改為陣列以支援多對多關係；`ResourceFilePicker.vue` 從單選改為永遠多選並供兩個消費者共用；`knowledgeStore.ts` 的 `createFromFile` 改為接收多筆檔案，新增 `createDraftFromMemberUpdate` 供「更新知識庫」使用；檔案成員關係（`knowledgeIds`）只在版本正式生效（`approveVersion`）時才同步，草稿階段不提前反映。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Pinia、Vitest + `@vue/test-utils`、SCSS（無 `<style scoped>`）。

**Design spec:** `docs/superpowers/specs/2026-08-20-knowledge-multi-file-sources-design.md`

## Global Constraints

- 使用 `<script setup lang="ts">`，禁止 Options API。
- 樣式統一在 `src/scss/` 管理，禁止 `<style scoped>`；新增 SCSS 檔案需在 `src/scss/components/_index.scss` 手動 `@import`（本專案實際慣例是 `@import`，非 `@forward`）。
- 所有 import 使用 `@/` alias。
- 顏色使用 CSS Custom Properties，不寫死 hex（沿用既有 `var(--xxx)` token，不新增裸色碼；`--danger`/`--success` 等既有 semantic token 直接沿用即可）。
- 每個 task 完成後執行 `npm run type-check` 與 `npm run test:unit -- --run`，兩者皆須通過才能 commit。
- 這次不做：`CreateVersionModal.vue`、`SourceUpdateModal.vue`、`KnowledgeEditor.vue`「從共用檔案管理選取」stub 一律維持原樣（見 design spec 範圍章節）。
- 多檔案內容的 AI 合成模擬（`simulateFileAiGeneration`）僅依第一個檔案的副檔名決定內容樣板，不做真正的多檔合成。

---

### Task 1：resourceStore.ts 資料模型（多對多成員關係 + 衍生狀態標籤）

**Files:**
- Modify: `src/stores/resourceStore.ts`（整檔，93 行 → 完整重寫，見下方 Step 3）
- Modify: `src/views/ResourceLibrary.vue:68,126,174`（型別變更後的必要修正，讓 type-check 維持綠燈）
- Test: `src/stores/__tests__/resourceStore.test.ts`（延伸既有檔案）

**Interfaces:**
- Consumes：無（本 task 是最底層的資料模型變更）
- Produces：
  - `ResourceFile.knowledgeIds: string[]`（取代原本的 `knowledgeId?: string`）
  - `ResourceFile.needsColumnConfirmation?: boolean`
  - `getKbSourceStatusLabel(file: ResourceFile): '已有資料' | '待確認' | '需解析'`（具名匯出函式）
  - `isKbSourceSelectable(file: ResourceFile): boolean`（具名匯出函式）
  - `useResourceStore().addKnowledgeMembership(fileId: string, knowledgeId: string): void`
  - `useResourceStore().removeKnowledgeMembership(fileId: string, knowledgeId: string): void`
  - 後續 Task 2（`ResourceFilePicker.vue`）、Task 3（`knowledgeStore.ts`/`ReviewDrawer.vue`）、Task 4（`CreateKnowledgeWizardModal.vue`）都會用到以上函式與欄位。

- [ ] **Step 1：為新函式與欄位寫失敗測試**

在 `src/stores/__tests__/resourceStore.test.ts` 檔案末尾（第 50 行 `})` 之後）加入：

```ts

describe('resourceStore — 知識庫成員關係', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('addKnowledgeMembership 會新增 knowledgeId 且不重複', () => {
    const store = useResourceStore()
    const file = store.resourceList[0]
    store.addKnowledgeMembership(file.id, 'k-test')
    store.addKnowledgeMembership(file.id, 'k-test')
    expect(store.getFileById(file.id)?.knowledgeIds).toEqual(['k-test'])
  })

  it('removeKnowledgeMembership 只移除指定的 knowledgeId', () => {
    const store = useResourceStore()
    const file = store.resourceList[0]
    store.addKnowledgeMembership(file.id, 'k-a')
    store.addKnowledgeMembership(file.id, 'k-b')
    store.removeKnowledgeMembership(file.id, 'k-a')
    expect(store.getFileById(file.id)?.knowledgeIds).toEqual(['k-b'])
  })

  it('demo 資料 res3 已預先關聯 k1（供元件層測試「目前成員」欄位使用）', () => {
    const store = useResourceStore()
    expect(store.getFileById('res3')?.knowledgeIds).toEqual(['k1'])
  })
})

describe('resourceStore — addFileFromUpload 補上擁有者欄位', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('設定 ownerId/ownerName 並將 knowledgeIds 初始化為空陣列', () => {
    const store = useResourceStore()
    const mockFile = new File(['x'], 'new-upload.pdf')
    const result = store.addFileFromUpload(mockFile)
    const added = store.getFileById(result.id)!
    expect(added.ownerId).toBe('current-user')
    expect(added.ownerName).toBe('Current User')
    expect(added.knowledgeIds).toEqual([])
  })
})

describe('getKbSourceStatusLabel', () => {
  function makeFile(overrides: Partial<import('@/stores/resourceStore').ResourceFile>): import('@/stores/resourceStore').ResourceFile {
    return {
      id: 'f1', fileName: 'test.pdf', fileUrl: '', fileType: 'PDF', processType: 'RAW',
      status: 'saved', creatorType: 'USER', ownerId: 'u1', ownerName: 'U',
      lastModify: '2026-01-01 00:00:00', version: 1, knowledgeIds: [],
      ...overrides,
    }
  }

  it('needsColumnConfirmation 為 true 時，優先回傳「待確認」', () => {
    expect(getKbSourceStatusLabel(makeFile({ status: 'saved', needsColumnConfirmation: true }))).toBe('待確認')
  })

  it('status 為 uploading/parsing/failed 時回傳「需解析」', () => {
    expect(getKbSourceStatusLabel(makeFile({ status: 'uploading' }))).toBe('需解析')
    expect(getKbSourceStatusLabel(makeFile({ status: 'parsing' }))).toBe('需解析')
    expect(getKbSourceStatusLabel(makeFile({ status: 'failed' }))).toBe('需解析')
  })

  it('status 為 stored/saved 且不需確認時回傳「已有資料」', () => {
    expect(getKbSourceStatusLabel(makeFile({ status: 'stored' }))).toBe('已有資料')
    expect(getKbSourceStatusLabel(makeFile({ status: 'saved' }))).toBe('已有資料')
  })
})

describe('isKbSourceSelectable', () => {
  function makeFile(overrides: Partial<import('@/stores/resourceStore').ResourceFile>): import('@/stores/resourceStore').ResourceFile {
    return {
      id: 'f1', fileName: 'test.pdf', fileUrl: '', fileType: 'PDF', processType: 'RAW',
      status: 'saved', creatorType: 'USER', ownerId: 'u1', ownerName: 'U',
      lastModify: '2026-01-01 00:00:00', version: 1, knowledgeIds: [],
      ...overrides,
    }
  }

  it('僅 failed 狀態不可勾選', () => {
    expect(isKbSourceSelectable(makeFile({ status: 'failed' }))).toBe(false)
    expect(isKbSourceSelectable(makeFile({ status: 'uploading' }))).toBe(true)
    expect(isKbSourceSelectable(makeFile({ status: 'parsing' }))).toBe(true)
    expect(isKbSourceSelectable(makeFile({ status: 'saved' }))).toBe(true)
  })
})
```

同時把檔案最上方的 import 從：
```ts
import { useResourceStore } from '@/stores/resourceStore'
```
改為：
```ts
import { useResourceStore, getKbSourceStatusLabel, isKbSourceSelectable } from '@/stores/resourceStore'
```

- [ ] **Step 2：執行測試確認失敗**

Run: `npm run test:unit -- --run resourceStore.test.ts`
Expected: 新增的測試 FAIL（`knowledgeIds`/`addKnowledgeMembership`/`getKbSourceStatusLabel`/`isKbSourceSelectable` 尚未存在），既有的舊測試（`addFileFromUpload` 系列）也會因為新加的 owner 斷言而 FAIL。

- [ ] **Step 3：重寫 `src/stores/resourceStore.ts`**

完整檔案內容：

```ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface ResourceFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: 'PPT' | 'PDF' | 'EXCEL' | 'IMAGE' | 'HTML' | 'WORD' | 'MD' | 'TXT' | 'CHART' | 'OTHER';
  processType: 'RAW' | 'AI_PARSED';
  status: 'uploading' | 'parsing' | 'stored' | 'saved' | 'failed';
  creatorType: 'USER' | 'AI';
  ownerId: string;
  ownerName: string;
  lastModify: string;
  version: number;
  knowledgeIds: string[];
  needsColumnConfirmation?: boolean;
  showMoreOption?: boolean;
}

export type KbSourceStatusLabel = '已有資料' | '待確認' | '需解析';

// 供「知識庫來源勾選」情境使用的衍生狀態標籤，不改變 status 本身語意。
export function getKbSourceStatusLabel(file: ResourceFile): KbSourceStatusLabel {
  if (file.needsColumnConfirmation) return '待確認';
  if (file.status === 'uploading' || file.status === 'parsing' || file.status === 'failed') return '需解析';
  return '已有資料';
}

// 供「知識庫來源勾選」情境使用：只有真正解析失敗的檔案不可勾選。
export function isKbSourceSelectable(file: ResourceFile): boolean {
  return file.status !== 'failed';
}

export const useResourceStore = defineStore('resource', () => {
  const resourceList = ref<ResourceFile[]>([
    { showMoreOption: false, id: 'res1',  version: 1, fileName: '26W產品特色簡報.pptx',         fileUrl: '',                                         fileType: 'PPT',   processType: 'RAW',       status: 'saved',   creatorType: 'USER', ownerId: 'user1',    ownerName: 'Lucas',    lastModify: '2026-02-06 14:15:00', knowledgeIds: [] },
    { showMoreOption: false, id: 'res2',  version: 1, fileName: '25W產品銷售DM.pdf',             fileUrl: '',                                         fileType: 'PDF',   processType: 'RAW',       status: 'saved',   creatorType: 'USER', ownerId: 'user1',    ownerName: 'Lucas',    lastModify: '2026-02-06 14:15:00', knowledgeIds: [] },
    { showMoreOption: false, id: 'res3',  version: 1, fileName: 'UGG2025商品總表.xlsx',       fileUrl: '',                                         fileType: 'EXCEL', processType: 'AI_PARSED', status: 'stored',  creatorType: 'USER', ownerId: 'user1',    ownerName: 'Lucas',    lastModify: '2026-02-06 14:15:00', knowledgeIds: ['k1'] },
    { showMoreOption: false, id: 'res4',  version: 1, fileName: '25W產品特色搭配建議.pdf',       fileUrl: '',                                         fileType: 'PDF',   processType: 'RAW',       status: 'saved',   creatorType: 'USER', ownerId: 'user1',    ownerName: 'Lucas',    lastModify: '2026-02-06 14:15:00', knowledgeIds: [] },
    { showMoreOption: false, id: 'res5',  version: 1, fileName: '競品戶外涼鞋分析報告.html',     fileUrl: '',                                         fileType: 'HTML',  processType: 'RAW',       status: 'saved',   creatorType: 'USER', ownerId: 'user1',    ownerName: 'Lucas',    lastModify: '2026-02-06 14:15:00', knowledgeIds: [] },
    { showMoreOption: false, id: 'res6',  version: 1, fileName: 'DM設計用背景圖1.png',           fileUrl: 'https://picsum.photos/410/240.webp?random=10', fileType: 'IMAGE', processType: 'RAW',  status: 'saved',   creatorType: 'AI',   ownerId: 'AiAgent1', ownerName: 'Ai Agent', lastModify: '2026-02-06 14:15:00', knowledgeIds: [] },
    { showMoreOption: false, id: 'res7',  version: 1, fileName: 'DM設計用背景圖2.png',           fileUrl: 'https://picsum.photos/410/240.webp?random=11', fileType: 'IMAGE', processType: 'RAW',  status: 'saved',   creatorType: 'AI',   ownerId: 'AiAgent1', ownerName: 'Ai Agent', lastModify: '2026-02-06 14:15:00', knowledgeIds: [] },
    { showMoreOption: false, id: 'res8',  version: 1, fileName: '特殊材質名稱轉換清單.md',       fileUrl: '',                                         fileType: 'MD',    processType: 'AI_PARSED', status: 'parsing', creatorType: 'USER', ownerId: 'user1',    ownerName: 'Lucas',    lastModify: '2026-02-06 14:15:00', knowledgeIds: [] },
    { showMoreOption: false, id: 'res9',  version: 1, fileName: '特殊材質名稱轉換清單(新）.txt', fileUrl: '',                                         fileType: 'TXT',   processType: 'RAW',       status: 'saved',   creatorType: 'USER', ownerId: 'user1',    ownerName: 'Lucas',    lastModify: '2026-02-06 14:15:00', knowledgeIds: [], needsColumnConfirmation: true },
    { showMoreOption: false, id: 'res10', version: 1, fileName: '26W電商上架資訊包含SEO.docx',   fileUrl: '',                                         fileType: 'WORD',  processType: 'RAW',       status: 'saved',   creatorType: 'USER', ownerId: 'user1',    ownerName: 'Lucas',    lastModify: '2026-02-06 14:15:00', knowledgeIds: [] },
    { showMoreOption: false, id: 'res11', version: 1, fileName: '官網新用戶消費傾向分析.chart',  fileUrl: '',                                         fileType: 'CHART', processType: 'RAW',       status: 'saved',   creatorType: 'AI',   ownerId: 'user1',    ownerName: 'Lucas',    lastModify: '2026-02-06 14:15:00', knowledgeIds: [] },
    { showMoreOption: false, id: 'res12', version: 1, fileName: 'unknown.xyz',                  fileUrl: '',                                         fileType: 'OTHER', processType: 'RAW',       status: 'saved',   creatorType: 'AI',   ownerId: 'user1',    ownerName: 'Lucas',    lastModify: '2026-02-06 14:15:00', knowledgeIds: [] },
  ]);

  function getFileById(id: string) {
    return resourceList.value.find(f => f.id === id) ?? null;
  }

  // 上傳新版本：版本號遞增，更新修改時間
  function uploadNewVersion(fileId: string): ResourceFile | null {
    const file = getFileById(fileId);
    if (!file) return null;
    file.version += 1;
    file.lastModify = new Date().toISOString().replace('T', ' ').slice(0, 16);
    return file;
  }

  function addFile(file: Omit<ResourceFile, 'version' | 'showMoreOption'>) {
    resourceList.value.unshift({ ...file, version: 1, showMoreOption: false });
  }

  // 新增檔案與知識庫的關聯（去重）
  function addKnowledgeMembership(fileId: string, knowledgeId: string) {
    const file = getFileById(fileId);
    if (file && !file.knowledgeIds.includes(knowledgeId)) {
      file.knowledgeIds.push(knowledgeId);
    }
  }

  // 移除檔案與知識庫的關聯
  function removeKnowledgeMembership(fileId: string, knowledgeId: string) {
    const file = getFileById(fileId);
    if (file) file.knowledgeIds = file.knowledgeIds.filter(id => id !== knowledgeId);
  }

  function deleteFile(fileId: string) {
    const idx = resourceList.value.findIndex(f => f.id === fileId);
    if (idx !== -1) resourceList.value.splice(idx, 1);
  }

  function deriveFileType(name: string): ResourceFile['fileType'] {
    const ext = name.split('.').pop()?.toLowerCase()
    const map: Record<string, ResourceFile['fileType']> = {
      pdf: 'PDF', docx: 'WORD', doc: 'WORD',
      xlsx: 'EXCEL', xls: 'EXCEL',
      pptx: 'PPT', ppt: 'PPT',
      png: 'IMAGE', jpg: 'IMAGE', jpeg: 'IMAGE', gif: 'IMAGE', webp: 'IMAGE',
      html: 'HTML', md: 'MD', txt: 'TXT',
    }
    return map[ext ?? ''] ?? 'OTHER'
  }

  function addFileFromUpload(file: File): { id: string; fileName: string } {
    const id = `res-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    addFile({
      id,
      fileName: file.name,
      fileUrl: '',
      fileType: deriveFileType(file.name),
      processType: 'RAW',
      status: 'stored',
      creatorType: 'USER',
      ownerId: 'current-user',
      ownerName: 'Current User',
      lastModify: new Date().toISOString().replace('T', ' ').slice(0, 16),
      knowledgeIds: [],
    })
    return { id, fileName: file.name }
  }

  return { resourceList, getFileById, uploadNewVersion, addFile, addFileFromUpload, addKnowledgeMembership, removeKnowledgeMembership, deleteFile };
});
```

- [ ] **Step 4：修正 `ResourceLibrary.vue` 因型別變更而需要更新的地方**

`ResourceFile.knowledgeId?: string` 改為 `knowledgeIds: string[]` 後，原本 `v-if="item.knowledgeId"` 會因為陣列永遠是 truthy（即使是空陣列）而恆為 true，必須改判斷陣列長度。同時 `markAsKnowledge` 已重新命名，呼叫端也要跟著改名（這裡先只改函式名稱，`@done` 監聽器本身要到 Task 4 才整個移除）。

在 `src/views/ResourceLibrary.vue` 第 68 行，將：
```html
                  <span v-if="item.knowledgeId" class="knowledge-badge">已轉為知識</span>
```
改為：
```html
                  <span v-if="item.knowledgeIds.length" class="knowledge-badge">已轉為知識</span>
```

第 126 行，將：
```html
                    <span v-if="item.knowledgeId" class="knowledge-badge">已轉為知識</span>
```
改為：
```html
                    <span v-if="item.knowledgeIds.length" class="knowledge-badge">已轉為知識</span>
```

第 174 行，將：
```html
    @done="({ fileId, knowledgeId }) => resourceStore.markAsKnowledge(fileId, knowledgeId)"
```
改為：
```html
    @done="({ fileId, knowledgeId }) => resourceStore.addKnowledgeMembership(fileId, knowledgeId)"
```

- [ ] **Step 5：執行測試與型別檢查確認通過**

Run: `npm run test:unit -- --run resourceStore.test.ts`
Expected: 全部 PASS

Run: `npm run type-check`
Expected: 無錯誤（特別確認 `ResourceLibrary.vue` 和任何其他引用 `ResourceFile.knowledgeId` 的地方都已修正——執行前可先跑 `grep -rn "\.knowledgeId\b" src/stores/resourceStore.ts src/views/ResourceLibrary.vue` 確認只剩下 `knowledgeIds` 用法）

Run: `npm run test:unit -- --run`
Expected: 全部 PASS（含 `ResourceLibrary.a11y.test.ts` 等既有測試）

- [ ] **Step 6：Commit**

```bash
git add src/stores/resourceStore.ts src/stores/__tests__/resourceStore.test.ts src/views/ResourceLibrary.vue
git commit -m "feat(resourceStore): support multi-KB file membership + kb-source status label"
```

---

### Task 2：`ResourceFilePicker.vue` 改為永遠多選

**Files:**
- Modify: `src/components/Knowledge/ResourceFilePicker.vue`（整檔重寫）
- Modify: `src/scss/components/_ResourceFilePicker.scss`（整檔重寫）
- Test: `src/components/Knowledge/__tests__/ResourceFilePicker.test.ts`（新建，目前 `src/components/Knowledge/__tests__/` 不存在，需先建立目錄）

**Interfaces:**
- Consumes：Task 1 的 `getKbSourceStatusLabel`、`isKbSourceSelectable`、`ResourceFile.knowledgeIds`；`knowledgeStore.getKnowledgeById`（既有函式，未變更）。
- Produces：
  - Props：`modelValue: boolean`、`preselectedIds?: string[]`（`multiple` prop 不存在——本元件目前唯一消費者 `CreateKnowledgeWizardModal.vue` 即將在 Task 4 升級為多選，且 Task 5 新增的 `UpdateKnowledgeSourcesModal.vue` 也是多選，沒有單選情境，見 design spec）。
  - Emit：`select` 帶 `{ files: { fileId: string; fileName: string }[] }`（原本單選時是 `{fileId, fileName}`，已整個移除）。
  - 後續 Task 4、Task 5 都會用這個 props/emit 介面。

- [ ] **Step 1：建立目錄與失敗測試**

建立 `src/components/Knowledge/__tests__/ResourceFilePicker.test.ts`：

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ResourceFilePicker from '../ResourceFilePicker.vue'
import { useResourceStore } from '@/stores/resourceStore'

function mountPicker(props: Record<string, unknown> = {}) {
  return mount(ResourceFilePicker, {
    props: { modelValue: true, ...props },
  })
}

describe('ResourceFilePicker — 多選', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('可以勾選多筆檔案，確認選取後 emit 完整清單', async () => {
    const wrapper = mountPicker()
    const rows = wrapper.findAll('.picker-row')
    await rows[0].trigger('click')
    await rows[1].trigger('click')

    const confirmBtn = wrapper.find('.custom-main-btn')
    await confirmBtn.trigger('click')

    const emitted = wrapper.emitted('select')
    expect(emitted).toBeTruthy()
    const payload = emitted![0][0] as { files: { fileId: string; fileName: string }[] }
    expect(payload.files.length).toBe(2)
  })

  it('未選取任何檔案時，確認按鈕為 disabled', () => {
    const wrapper = mountPicker()
    const confirmBtn = wrapper.find('.custom-main-btn')
    expect(confirmBtn.attributes('disabled')).toBeDefined()
  })

  it('failed 狀態的檔案列被禁用，parsing 狀態仍可勾選', () => {
    const resourceStore = useResourceStore()
    resourceStore.resourceList.push({
      id: 'res-failed-test', fileName: 'failed-demo.pdf', fileUrl: '', fileType: 'PDF',
      processType: 'RAW', status: 'failed', creatorType: 'USER', ownerId: 'u', ownerName: 'U',
      lastModify: '2026-01-01 00:00:00', version: 1, knowledgeIds: [],
    })
    const wrapper = mountPicker()
    const failedRow = wrapper.findAll('.picker-row').find(r => r.text().includes('failed-demo.pdf'))
    expect(failedRow!.classes()).toContain('is-disabled')

    const parsingRow = wrapper.findAll('.picker-row').find(r => r.text().includes('特殊材質名稱轉換清單.md'))
    expect(parsingRow!.classes()).not.toContain('is-disabled')
  })

  it('needsColumnConfirmation 為 true 的檔案顯示「待確認」狀態', () => {
    const wrapper = mountPicker()
    const row = wrapper.findAll('.picker-row').find(r => r.text().includes('特殊材質名稱轉換清單(新）.txt'))
    expect(row!.text()).toContain('待確認')
  })

  it('目前成員欄位顯示已關聯的知識庫標題', () => {
    const wrapper = mountPicker()
    const row = wrapper.findAll('.picker-row').find(r => r.text().includes('UGG2025商品總表.xlsx'))
    expect(row!.text()).toContain('2025產品總表-Q3')
  })

  it('preselectedIds 開啟時正確預先勾選', () => {
    const wrapper = mountPicker({ preselectedIds: ['res1'] })
    const row = wrapper.findAll('.picker-row').find(r => r.text().includes('26W產品特色簡報.pptx'))
    expect(row!.classes()).toContain('is-selected')
  })
})
```

- [ ] **Step 2：執行測試確認失敗**

Run: `npm run test:unit -- --run ResourceFilePicker.test.ts`
Expected: FAIL（元件仍是單選版本，`preselectedIds` 不存在，`.is-disabled`/`.is-selected` 判斷邏輯不同）

- [ ] **Step 3：重寫 `src/components/Knowledge/ResourceFilePicker.vue`**

完整檔案內容：

```vue
<template>
  <compModal
    class="ResourceFilePicker"
    v-model="isOpen"
    :width="820"
  >
    <template #title>選取共用檔案</template>

    <div class="picker-toolbar">
      <div class="picker-search">
        <i class="material-symbols-outlined">search</i>
        <input v-model="searchQuery" placeholder="搜尋檔案名稱..." />
      </div>
      <select v-model="filterType" class="picker-filter">
        <option value="">全部類型</option>
        <option value="AI_PARSED">AI 解析</option>
        <option value="RAW">原始檔案</option>
      </select>
    </div>

    <div class="picker-table">
      <div class="picker-table-header">
        <div class="picker-col-check"></div>
        <div>檔案名稱</div>
        <div>類型</div>
        <div>上傳者</div>
        <div>上傳時間</div>
        <div>狀態</div>
        <div>目前成員</div>
      </div>

      <template v-if="filteredList.length > 0">
        <div
          v-for="file in filteredList"
          :key="file.id"
          :class="[
            'picker-row',
            { 'is-selected': isSelected(file) },
            { 'is-disabled': !isKbSourceSelectable(file) },
          ]"
          @click="isKbSourceSelectable(file) && toggleFile(file)"
        >
          <div class="picker-col-check">
            <input
              type="checkbox"
              :checked="isSelected(file)"
              :disabled="!isKbSourceSelectable(file)"
              @click.stop="isKbSourceSelectable(file) && toggleFile(file)"
            />
          </div>
          <div class="picker-row-name">
            <i class="material-symbols-outlined fs-16">description</i>
            <span>{{ file.fileName }}</span>
          </div>
          <div>
            <span :class="['badge', file.processType === 'AI_PARSED' ? 'badge-ai' : 'badge-raw']">
              {{ file.processType === 'AI_PARSED' ? 'AI 解析' : '原始檔案' }}
            </span>
          </div>
          <div class="fc-grey-1 fs-11">{{ file.ownerName || '—' }}</div>
          <div class="fc-grey-1 fs-11">{{ file.lastModify.slice(0, 10) }}</div>
          <div>
            <span :class="['status-badge', `status-${kbStatusClass(file)}`]">
              {{ getKbSourceStatusLabel(file) }}
            </span>
          </div>
          <div>
            <span v-if="membershipTitles(file).length === 0" class="member-badge member-badge--none">非成員</span>
            <span v-else class="member-badge">
              {{ membershipTitles(file)[0] }}<template v-if="membershipTitles(file).length > 1"> +{{ membershipTitles(file).length - 1 }}</template>
            </span>
          </div>
        </div>
      </template>

      <div v-else class="picker-empty">
        <i class="material-symbols-outlined">folder_open</i>
        <span>{{ searchQuery || filterType ? '找不到符合的檔案' : '共用庫目前沒有檔案' }}</span>
      </div>
    </div>

    <div class="picker-selected-hint">
      <template v-if="selectedFiles.length > 0">
        <i class="material-symbols-outlined">check_circle</i>
        已選取 {{ selectedFiles.length }} 個檔案：{{ selectedFiles.map(f => f.fileName).join('、') }}
      </template>
    </div>

    <div class="picker-footer">
      <button class="custom-btn" @click="isOpen = false">取消</button>
      <button
        class="custom-btn custom-main-btn"
        :disabled="selectedFiles.length === 0"
        @click="confirmSelect"
      >
        <i class="material-symbols-outlined">check</i>
        確認選取
      </button>
    </div>
  </compModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import compModal from '@/components/compModal/compModal.vue'
import { useResourceStore, getKbSourceStatusLabel, isKbSourceSelectable } from '@/stores/resourceStore'
import type { ResourceFile } from '@/stores/resourceStore'
import { useKnowledgeStore } from '@/stores/knowledgeStore'

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'select', payload: { files: { fileId: string; fileName: string }[] }): void
}>()
const props = defineProps<{
  modelValue: boolean
  preselectedIds?: string[]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const resourceStore = useResourceStore()
const { resourceList } = storeToRefs(resourceStore)
const knowledgeStore = useKnowledgeStore()

const searchQuery = ref('')
const filterType = ref('')
const selectedFiles = ref<ResourceFile[]>([])

const filteredList = computed(() => {
  return resourceList.value.filter(f => {
    const matchesSearch = !searchQuery.value || f.fileName.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesType = !filterType.value || f.processType === filterType.value
    return matchesSearch && matchesType
  })
})

function isSelected(file: ResourceFile): boolean {
  return selectedFiles.value.some(f => f.id === file.id)
}

function toggleFile(file: ResourceFile) {
  const idx = selectedFiles.value.findIndex(f => f.id === file.id)
  if (idx === -1) selectedFiles.value.push(file)
  else selectedFiles.value.splice(idx, 1)
}

function confirmSelect() {
  if (selectedFiles.value.length === 0) return
  emit('select', { files: selectedFiles.value.map(f => ({ fileId: f.id, fileName: f.fileName })) })
  isOpen.value = false
}

function membershipTitles(file: ResourceFile): string[] {
  return file.knowledgeIds
    .map(id => knowledgeStore.getKnowledgeById(id)?.title)
    .filter((title): title is string => !!title)
}

function kbStatusClass(file: ResourceFile): 'ready' | 'confirm' | 'parsing' {
  const label = getKbSourceStatusLabel(file)
  if (label === '已有資料') return 'ready'
  if (label === '待確認') return 'confirm'
  return 'parsing'
}

// 每次開啟時重置搜尋條件，並依 preselectedIds 預先勾選
watch(() => props.modelValue, (open) => {
  if (open) {
    searchQuery.value = ''
    filterType.value = ''
    selectedFiles.value = props.preselectedIds
      ? resourceList.value.filter(f => props.preselectedIds!.includes(f.id))
      : []
  }
})
</script>
```

- [ ] **Step 4：重寫 `src/scss/components/_ResourceFilePicker.scss`**

完整檔案內容：

```scss
// src/scss/components/_ResourceFilePicker.scss

.ResourceFilePicker {
  .picker-toolbar {
    display: flex;
    gap: 8px;
    margin-bottom: 14px;
  }

  .picker-search {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--page-bg);
    border: 1px solid var(--divider);
    border-radius: 6px;
    padding: 0 10px;

    i {
      font-size: 16px;
      color: var(--text-faint);
      flex-shrink: 0;
    }

    input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-size: 12px;
      color: var(--text);
      padding: 7px 0;

      &::placeholder { color: var(--text-faint); }
    }
  }

  .picker-filter {
    width: 130px;
    font-size: 12px;
    padding: 6px 8px;
    border: 1px solid var(--divider);
    border-radius: 6px;
    background: var(--page-bg);
    color: var(--text);
    cursor: pointer;
    outline: none;
  }

  .picker-table {
    border: 1px solid var(--divider);
    border-radius: 8px;
    overflow: hidden;
    min-height: 200px;
    max-height: 320px;
    overflow-y: auto;
  }

  .picker-table-header {
    display: grid;
    grid-template-columns: 24px 1fr 70px 64px 84px 70px 120px;
    padding: 7px 14px;
    background: var(--page-bg);
    font-size: 11px;
    font-weight: 600;
    color: var(--text-faint);
    border-bottom: 1px solid var(--divider);
    gap: 8px;
  }

  .picker-row {
    display: grid;
    grid-template-columns: 24px 1fr 70px 64px 84px 70px 120px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--divider);
    font-size: 12px;
    gap: 8px;
    align-items: center;
    cursor: pointer;
    transition: background 0.1s;

    &:last-child { border-bottom: none; }

    &:hover:not(.is-disabled) {
      background: var(--sidebar-hover);
    }

    &.is-selected {
      background: var(--hint);
      border-left: 3px solid var(--primary);
      padding-left: 11px;
    }

    &.is-disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  }

  .picker-col-check {
    display: flex;
    align-items: center;
    justify-content: center;

    input[type="checkbox"] {
      cursor: pointer;
    }
  }

  .picker-row-name {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;
    overflow: hidden;

    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .picker-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0;
    color: var(--text-faint);
    font-size: 13px;
    gap: 6px;

    i { font-size: 32px; }
  }

  .picker-selected-hint {
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
    font-size: 12px;
    color: var(--primary-hover);
    min-height: 20px;

    i { font-size: 16px; color: var(--success); }
  }

  .picker-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
  }

  // Process-type badge
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 1px 7px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 600;
    white-space: nowrap;

    &.badge-ai   { background: var(--hint); color: var(--primary-hover); }
    &.badge-raw  { background: var(--page-bg); color: var(--text-faint); border: 1px solid var(--divider); }
  }

  // 知識庫來源狀態 badge（已有資料/待確認/需解析）
  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 1px 7px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 600;
    white-space: nowrap;

    &.status-ready   { background: rgba(0, 160, 120, 0.12); color: var(--success); }
    &.status-confirm { background: rgba(37, 99, 235, 0.12); color: var(--primary-hover); }
    &.status-parsing { background: rgba(207, 138, 31, 0.12); color: var(--warning); }
  }

  // 目前成員 badge
  .member-badge {
    display: inline-flex;
    align-items: center;
    padding: 1px 7px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 600;
    white-space: nowrap;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    background: var(--hint);
    color: var(--primary-hover);

    &.member-badge--none {
      background: var(--page-bg);
      color: var(--text-faint);
      border: 1px solid var(--divider);
    }
  }
}
```

- [ ] **Step 5：執行測試與型別檢查確認通過**

Run: `npm run test:unit -- --run ResourceFilePicker.test.ts`
Expected: 全部 PASS

Run: `npm run type-check && npm run test:unit -- --run`
Expected: 無錯誤，全部 PASS（此時 `CreateKnowledgeWizardModal.vue` 尚未升級，仍呼叫舊的單選 `@select` 事件簽章——**這一步預期會出現 type-check 錯誤**，這是正常的：Task 2 單獨完成時，`ResourceFilePicker` 的介面已經改變，但唯一消費者 `CreateKnowledgeWizardModal.vue` 還沒跟進。因為 task 之間會有暫時的型別不一致，這裡改用範圍更窄的檢查方式驗證 Task 2 本身正確：

Run: `npx vue-tsc --noEmit -p tsconfig.json 2>&1 | grep -v CreateKnowledgeWizardModal`
Expected: 除了 `CreateKnowledgeWizardModal.vue` 相關的型別錯誤（會在 Task 4 修正）之外，沒有其他錯誤。

Run: `npm run test:unit -- --run`
Expected: 全部 PASS（`CreateKnowledgeWizardModal.vue` 本身沒有既有測試會因為 emit 型別不吻合而在執行期失敗——TypeScript 型別不匹配不影響 Vitest 執行期行為，只是 type-check 會報錯，留給 Task 4 解決）

- [ ] **Step 6：Commit**

```bash
git add src/components/Knowledge/ResourceFilePicker.vue src/scss/components/_ResourceFilePicker.scss src/components/Knowledge/__tests__/ResourceFilePicker.test.ts
git commit -m "feat(ResourceFilePicker): always multi-select with owner/status/membership columns"
```

---

### Task 3：`knowledgeStore.ts` 多檔來源 + 成員同步

**Files:**
- Modify: `src/stores/knowledgeStore.ts:1428-1480`（`createFromFile` 簽名改為多檔）
- Modify: `src/stores/knowledgeStore.ts`（`createDraftFromSourceUpdate` 之後新增 `createDraftFromMemberUpdate`，`dismissSourceStale` 之前）
- Modify: `src/stores/knowledgeStore.ts:1359-1390`（`approveVersion` 新增 `syncMembership` 參數）
- Modify: `src/stores/knowledgeStore.ts:2125-2162`（return 物件新增 `createDraftFromMemberUpdate`）
- Modify: `src/components/Knowledge/ReviewDrawer.vue`（`handleApprove` 呼叫端）
- Test: `src/stores/__tests__/knowledgeStore.multiFileSources.test.ts`（新建，比照既有 `knowledgeStore.pipeline.test.ts` 等主題拆分慣例）

**Interfaces:**
- Consumes：無新的外部依賴（`resourceStore` 透過呼叫端注入的 callback 使用，`knowledgeStore.ts` 本身不 import `resourceStore`，比照既有 `createDraftFromSourceUpdate` 的 `getFile` 注入寫法，避免循環依賴）。
- Produces：
  - `createFromFile(params: { files: {fileId, fileName}[]; template: string; content: string; category: string }): { knowledgeId, versionId }`（Task 4 使用）
  - `createDraftFromMemberUpdate(knowledgeId: string, files: {fileId, fileName, linkedVersion}[]): string | undefined`（Task 5 使用）
  - `approveVersion(knowledgeId: string, versionId: string, syncMembership?: (opts: {added: string[]; removed: string[]; knowledgeId: string}) => void): void`

- [ ] **Step 1：為新行為寫失敗測試**

建立 `src/stores/__tests__/knowledgeStore.multiFileSources.test.ts`：

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useKnowledgeStore } from '@/stores/knowledgeStore'

describe('knowledgeStore — 多檔案來源管理', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('createFromFile', () => {
    it('傳入多筆 files 時，sourceFiles 完整對應每一筆', () => {
      const store = useKnowledgeStore()
      const { knowledgeId } = store.createFromFile({
        files: [
          { fileId: 'res-a', fileName: 'A.pdf' },
          { fileId: 'res-b', fileName: 'B.xlsx' },
        ],
        category: '商品文件',
        template: '',
        content: '',
      })
      const version = store.getKnowledgeById(knowledgeId)!.versions[0]
      expect(version.sourceFiles).toEqual([
        { fileId: 'res-a', fileName: 'A.pdf', linkedVersion: 1 },
        { fileId: 'res-b', fileName: 'B.xlsx', linkedVersion: 1 },
      ])
    })

    it('多筆檔案時，summary 與 updateNote 使用複數文案', () => {
      const store = useKnowledgeStore()
      const { knowledgeId } = store.createFromFile({
        files: [
          { fileId: 'res-a', fileName: 'A.pdf' },
          { fileId: 'res-b', fileName: 'B.xlsx' },
        ],
        category: '商品文件',
        template: 'tpl',
        content: '',
      })
      const version = store.getKnowledgeById(knowledgeId)!.versions[0]
      expect(version.summary).toContain('等 2 個來源檔案')
      expect(version.updateNote).toContain('A.pdf、B.xlsx')
    })

    it('單一檔案時維持原本單數文案', () => {
      const store = useKnowledgeStore()
      const { knowledgeId } = store.createFromFile({
        files: [{ fileId: 'res-a', fileName: 'A.pdf' }],
        category: '商品文件',
        template: '',
        content: '',
      })
      const version = store.getKnowledgeById(knowledgeId)!.versions[0]
      expect(version.summary).toBe('由「A.pdf」生成的知識條目草稿')
    })
  })

  describe('createDraftFromMemberUpdate', () => {
    it('以現有生效版本為基礎建立新草稿，版本號遞增、狀態為 draft', () => {
      const store = useKnowledgeStore()
      const versionId = store.createDraftFromMemberUpdate('k1', [
        { fileId: 'res9', fileName: '特殊材質名稱轉換清單(新）.txt', linkedVersion: 1 },
      ])
      expect(versionId).toBeTruthy()
      const item = store.getKnowledgeById('k1')!
      const newVersion = item.versions.find(v => v.id === versionId)!
      expect(newVersion.versionNumber).toBe('v1.3')
      expect(newVersion.status).toBe('draft')
      expect(item.status).toBe('pending')
      expect(newVersion.sourceFiles).toEqual([
        { fileId: 'res9', fileName: '特殊材質名稱轉換清單(新）.txt', linkedVersion: 1 },
      ])
    })
  })

  describe('approveVersion — syncMembership callback', () => {
    it('生效時比對新舊 sourceFiles，回傳新增與移除的 fileId', () => {
      const store = useKnowledgeStore()
      const versionId = store.createDraftFromMemberUpdate('k1', [
        { fileId: 'res9', fileName: '特殊材質名稱轉換清單(新）.txt', linkedVersion: 1 },
      ])!
      store.submitForReview('k1', versionId, 'reviewer1', '調整來源')

      let syncResult: { added: string[]; removed: string[]; knowledgeId: string } | null = null
      store.approveVersion('k1', versionId, (opts) => { syncResult = opts })

      expect(syncResult).toEqual({ added: ['res9'], removed: ['res3'], knowledgeId: 'k1' })
      const item = store.getKnowledgeById('k1')!
      expect(item.versions.find(v => v.id === versionId)!.status).toBe('active')
    })

    it('沒有傳入 syncMembership 時，approveVersion 行為不變（不報錯）', () => {
      const store = useKnowledgeStore()
      const versionId = store.createDraftFromMemberUpdate('k1', [])!
      store.submitForReview('k1', versionId, 'reviewer1', '')
      expect(() => store.approveVersion('k1', versionId)).not.toThrow()
      expect(store.getVersionById('k1', versionId)?.status).toBe('active')
    })
  })
})
```

- [ ] **Step 2：執行測試確認失敗**

Run: `npm run test:unit -- --run knowledgeStore.multiFileSources.test.ts`
Expected: FAIL（`createFromFile` 目前只接受單一 `fileId`/`fileName`，`createDraftFromMemberUpdate` 不存在，`approveVersion` 不接受第三個參數）

- [ ] **Step 3：修改 `createFromFile`（`src/stores/knowledgeStore.ts:1427-1480`）**

將：
```ts
  // 從共用檔案建立新的知識條目草稿
  const createFromFile = (params: {
    fileId: string;
    fileName: string;
    template: string;
    content: string;
    category: string;
  }) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newId = `k-${Date.now()}`;
    const draftId = `v1.0-draft-${Date.now()}`;
    const baseName = params.fileName.replace(/\.[^.]+$/, '');

    const newKnowledge: KnowledgeItem = {
      id: newId,
      title: baseName,
      category: params.category,
      status: 'pending',
      sourceType: 'FILE',
      pipelineProgress: 0,
      pipelineStage: null,
      pipelineError: null,
      sourceStale: false,
      staleSourceFileIds: [],
      lastSyncAt: null,
      apiSourceId: null,
      apiSourceName: null,
      lastUpdateTime: now,
      lastUpdateBy: 'AI 生成',
      versions: [{
        id: draftId,
        knowledgeId: newId,
        versionNumber: 'v1.0',
        versionType: null,
        status: 'draft',
        title: baseName,
        summary: `由「${params.fileName}」生成的知識條目草稿`,
        content: params.content,
        tags: [],
        systemTags: [],
        lastUpdateBy: 'AI 生成',
        lastUpdateTime: now,
        updateNote: `從共用檔案「${params.fileName}」建立，使用模板：${params.template}`,
        sourceFiles: [{ fileId: params.fileId, fileName: params.fileName, linkedVersion: 1 }],
        chunks: [],
        embeddingModel: null,
        embeddingDimension: null,
        embeddingCount: 0,
      }],
    };

    knowledgeList.value.unshift(newKnowledge);
    return { knowledgeId: newId, versionId: draftId };
  };
```

改為：
```ts
  // 從共用檔案建立新的知識條目草稿（支援多個來源檔案）
  const createFromFile = (params: {
    files: { fileId: string; fileName: string }[];
    template: string;
    content: string;
    category: string;
  }) => {
    const primary = params.files[0];
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newId = `k-${Date.now()}`;
    const draftId = `v1.0-draft-${Date.now()}`;
    const baseName = primary.fileName.replace(/\.[^.]+$/, '');
    const summary = params.files.length > 1
      ? `由「${primary.fileName}」等 ${params.files.length} 個來源檔案生成的知識條目草稿`
      : `由「${primary.fileName}」生成的知識條目草稿`;
    const updateNote = params.files.length > 1
      ? `從共用檔案「${params.files.map(f => f.fileName).join('、')}」建立，使用模板：${params.template}`
      : `從共用檔案「${primary.fileName}」建立，使用模板：${params.template}`;

    const newKnowledge: KnowledgeItem = {
      id: newId,
      title: baseName,
      category: params.category,
      status: 'pending',
      sourceType: 'FILE',
      pipelineProgress: 0,
      pipelineStage: null,
      pipelineError: null,
      sourceStale: false,
      staleSourceFileIds: [],
      lastSyncAt: null,
      apiSourceId: null,
      apiSourceName: null,
      lastUpdateTime: now,
      lastUpdateBy: 'AI 生成',
      versions: [{
        id: draftId,
        knowledgeId: newId,
        versionNumber: 'v1.0',
        versionType: null,
        status: 'draft',
        title: baseName,
        summary,
        content: params.content,
        tags: [],
        systemTags: [],
        lastUpdateBy: 'AI 生成',
        lastUpdateTime: now,
        updateNote,
        sourceFiles: params.files.map(f => ({ fileId: f.fileId, fileName: f.fileName, linkedVersion: 1 })),
        chunks: [],
        embeddingModel: null,
        embeddingDimension: null,
        embeddingCount: 0,
      }],
    };

    knowledgeList.value.unshift(newKnowledge);
    return { knowledgeId: newId, versionId: draftId };
  };
```

- [ ] **Step 4：在 `createDraftFromSourceUpdate` 之後新增 `createDraftFromMemberUpdate`**

在 `dismissSourceStale` 函式定義（`function dismissSourceStale(knowledgeId: string) {`）**之前**插入：

```ts
  // 手動調整知識庫的檔案來源成員（新增/移除），建立新草稿版本
  const createDraftFromMemberUpdate = (
    knowledgeId: string,
    files: { fileId: string; fileName: string; linkedVersion: number }[],
  ): string | undefined => {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;

    const base = k.versions.find(v => v.status === 'active') ?? k.versions[k.versions.length - 1];
    if (!base) return;
    const [major, minor] = base.versionNumber.replace('v', '').split('.').map(Number);
    const newNum = `v${major}.${minor + 1}`;

    const newVersion: KnowledgeVersion = {
      ...JSON.parse(JSON.stringify(base)),
      id: `${newNum}-member-update-${Date.now()}`,
      versionNumber: newNum,
      status: 'draft' as VersionStatus,
      updateNote: `調整檔案來源成員（共 ${files.length} 個來源檔案）`,
      lastUpdateBy: 'Current User',
      lastUpdateTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
      sourceFiles: files.map(f => ({ fileId: f.fileId, fileName: f.fileName, linkedVersion: f.linkedVersion })),
    };

    k.versions.push(newVersion);
    k.status = 'pending';
    return newVersion.id;
  };

```

- [ ] **Step 5：修改 `approveVersion`（`src/stores/knowledgeStore.ts:1359-1390`）**

將：
```ts
  const approveVersion = (knowledgeId: string, versionId: string) => {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;
    const v = k.versions.find(ver => ver.id === versionId);
    if (!v || v.status !== 'reviewing') return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    // Previous active version becomes history
    for (const ver of k.versions) {
      if (ver.status === 'active') ver.status = 'history';
    }

    v.status = 'active';
    v.reviewedBy = 'Current User';
    v.reviewedTime = now;
    v.reviewHistory = [
      ...(v.reviewHistory ?? []),
      { action: 'APPROVED', by: 'Current User', time: now },
    ];

    if (k.sourceType === 'MANUAL') {
      k.status = 'processing'
      setTimeout(() => {
        k.status = 'active'
        k.lastUpdateTime = new Date().toISOString().replace('T', ' ').slice(0, 16)
      }, 2000)
    } else {
      k.status = 'active'
      k.lastUpdateTime = now
    }
  };
```

改為：
```ts
  const approveVersion = (
    knowledgeId: string,
    versionId: string,
    syncMembership?: (opts: { added: string[]; removed: string[]; knowledgeId: string }) => void,
  ) => {
    const k = getKnowledgeById(knowledgeId);
    if (!k) return;
    const v = k.versions.find(ver => ver.id === versionId);
    if (!v || v.status !== 'reviewing') return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const previouslyActive = k.versions.find(ver => ver.status === 'active');
    const prevFileIds = new Set((previouslyActive?.sourceFiles ?? []).map(f => f.fileId));
    const newFileIds = new Set(v.sourceFiles.map(f => f.fileId));

    // Previous active version becomes history
    for (const ver of k.versions) {
      if (ver.status === 'active') ver.status = 'history';
    }

    v.status = 'active';
    v.reviewedBy = 'Current User';
    v.reviewedTime = now;
    v.reviewHistory = [
      ...(v.reviewHistory ?? []),
      { action: 'APPROVED', by: 'Current User', time: now },
    ];

    if (syncMembership) {
      const added = [...newFileIds].filter(id => !prevFileIds.has(id));
      const removed = [...prevFileIds].filter(id => !newFileIds.has(id));
      if (added.length || removed.length) {
        syncMembership({ added, removed, knowledgeId });
      }
    }

    if (k.sourceType === 'MANUAL') {
      k.status = 'processing'
      setTimeout(() => {
        k.status = 'active'
        k.lastUpdateTime = new Date().toISOString().replace('T', ' ').slice(0, 16)
      }, 2000)
    } else {
      k.status = 'active'
      k.lastUpdateTime = now
    }
  };
```

- [ ] **Step 6：在 return 物件新增 `createDraftFromMemberUpdate`（`src/stores/knowledgeStore.ts` 約第 2139 行附近）**

將：
```ts
    createDraftFromSourceUpdate,
    dismissSourceStale,
```
改為：
```ts
    createDraftFromSourceUpdate,
    createDraftFromMemberUpdate,
    dismissSourceStale,
```

- [ ] **Step 7：更新 `ReviewDrawer.vue` 呼叫端**

在 `src/components/Knowledge/ReviewDrawer.vue` 的 import 區塊，將：
```ts
import { ref, computed } from 'vue';
import { useKnowledgeStore } from '@/stores/knowledgeStore';
import VersionCompareModal from '@/components/Knowledge/VersionCompareModal.vue';
import popDialog from '@/services/popDialog';
import AppSkeleton from '@/components/AppSkeleton.vue';
import AppErrorState from '@/components/AppErrorState.vue';
import { useApiCall } from '@/composables/useApiCall';
```
改為：
```ts
import { ref, computed } from 'vue';
import { useKnowledgeStore } from '@/stores/knowledgeStore';
import { useResourceStore } from '@/stores/resourceStore';
import VersionCompareModal from '@/components/Knowledge/VersionCompareModal.vue';
import popDialog from '@/services/popDialog';
import AppSkeleton from '@/components/AppSkeleton.vue';
import AppErrorState from '@/components/AppErrorState.vue';
import { useApiCall } from '@/composables/useApiCall';
```

在 `const knowledgeStore = useKnowledgeStore();` 之後新增一行：
```ts
const resourceStore = useResourceStore();
```

將 `handleApprove`：
```ts
function handleApprove() {
  knowledgeStore.approveVersion(props.knowledgeId, props.versionId);
  const vNum = version.value?.versionNumber ?? '';
  close();
  emit('approved');
  popDialog.toast(`已發布 ${vNum}`, 2000);
}
```
改為：
```ts
function handleApprove() {
  knowledgeStore.approveVersion(props.knowledgeId, props.versionId, ({ added, removed, knowledgeId }) => {
    added.forEach(fileId => resourceStore.addKnowledgeMembership(fileId, knowledgeId));
    removed.forEach(fileId => resourceStore.removeKnowledgeMembership(fileId, knowledgeId));
  });
  const vNum = version.value?.versionNumber ?? '';
  close();
  emit('approved');
  popDialog.toast(`已發布 ${vNum}`, 2000);
}
```

- [ ] **Step 8：執行測試與型別檢查確認通過**

Run: `npm run test:unit -- --run knowledgeStore.multiFileSources.test.ts`
Expected: 全部 PASS

Run: `npm run type-check`
Expected: 無錯誤（除了 Task 4 才會修正的 `CreateKnowledgeWizardModal.vue` 呼叫 `createFromFile` 舊簽名的錯誤——用 `npx vue-tsc --noEmit -p tsconfig.json 2>&1 | grep -v CreateKnowledgeWizardModal` 確認沒有其他錯誤）

Run: `npm run test:unit -- --run`
Expected: 全部 PASS

- [ ] **Step 9：Commit**

```bash
git add src/stores/knowledgeStore.ts src/components/Knowledge/ReviewDrawer.vue src/stores/__tests__/knowledgeStore.multiFileSources.test.ts
git commit -m "feat(knowledgeStore): multi-file createFromFile, createDraftFromMemberUpdate, approveVersion membership sync"
```

---

### Task 4：`CreateKnowledgeWizardModal.vue` 多檔升級（Phase 1 完成）

**Files:**
- Modify: `src/components/Knowledge/CreateKnowledgeWizardModal.vue`（樣板與腳本，見下方精確 diff）
- Modify: `src/scss/views/_KnowledgeBase.scss:1637-1705`（`.CreateKnowledgeWizardModal` 區塊新增樣式）
- Modify: `src/views/ResourceLibrary.vue:171-175`（移除 `@done` 監聽器）
- Test: `src/components/Knowledge/__tests__/CreateKnowledgeWizardModal.test.ts`（新建）

**Interfaces:**
- Consumes：Task 2 的 `ResourceFilePicker`（`preselectedIds` 不使用，emit `{files}`）、Task 3 的 `createFromFile({files, ...})`、Task 1 的 `resourceStore.addFileFromUpload`/`addKnowledgeMembership`。
- Produces：無新的對外介面（Phase 1 的終端使用者入口）。

- [ ] **Step 1：寫失敗測試**

建立 `src/components/Knowledge/__tests__/CreateKnowledgeWizardModal.test.ts`：

```ts
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import CreateKnowledgeWizardModal from '../CreateKnowledgeWizardModal.vue'
import ResourceFilePicker from '../ResourceFilePicker.vue'
import { useKnowledgeStore } from '@/stores/knowledgeStore'
import { useResourceStore } from '@/stores/resourceStore'

function makeRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div/>' } },
      { path: '/knowledge/:id', name: 'KnowledgeDetail', component: { template: '<div/>' } },
    ],
  })
}

async function mountModal(props: Record<string, unknown> = {}) {
  setActivePinia(createPinia())
  const router = makeRouter()
  const wrapper = mount(CreateKnowledgeWizardModal, {
    props: { modelValue: true, ...props },
    global: { plugins: [router] },
  })
  await flushPromises()
  return wrapper
}

describe('CreateKnowledgeWizardModal — 多檔建立', () => {
  it('prefillFile 開啟時，pickedFiles 預填為第一筆', async () => {
    const wrapper = await mountModal({ prefillFile: { fileId: 'res1', fileName: '26W產品特色簡報.pptx' } })
    expect(wrapper.findAll('.picked-file-row').length).toBe(1)
    expect(wrapper.text()).toContain('26W產品特色簡報.pptx')
  })

  it('可透過「從共用檔案管理選取」再加入多筆檔案', async () => {
    const wrapper = await mountModal({ prefillFile: { fileId: 'res1', fileName: '26W產品特色簡報.pptx' } })
    const picker = wrapper.findComponent(ResourceFilePicker)
    await picker.vm.$emit('select', {
      files: [
        { fileId: 'res2', fileName: '25W產品銷售DM.pdf' },
        { fileId: 'res4', fileName: '25W產品特色搭配建議.pdf' },
      ],
    })
    await flushPromises()
    expect(wrapper.findAll('.picked-file-row').length).toBe(3)
  })

  it('移除按鈕可移除已選檔案', async () => {
    const wrapper = await mountModal({ prefillFile: { fileId: 'res1', fileName: '26W產品特色簡報.pptx' } })
    await wrapper.find('.picked-file-remove').trigger('click')
    expect(wrapper.findAll('.picked-file-row').length).toBe(0)
  })

  it('FILE 送出時呼叫 createFromFile 帶正確的多筆 files 陣列，並逐筆呼叫 addKnowledgeMembership', async () => {
    const wrapper = await mountModal({ prefillFile: { fileId: 'res1', fileName: '26W產品特色簡報.pptx' } })
    const knowledgeStore = useKnowledgeStore()
    const resourceStore = useResourceStore()
    const beforeCount = knowledgeStore.knowledgeList.length

    const picker = wrapper.findComponent(ResourceFilePicker)
    await picker.vm.$emit('select', { files: [{ fileId: 'res2', fileName: '25W產品銷售DM.pdf' }] })
    await flushPromises()

    await wrapper.find('select.custom-input').setValue('商品文件')
    await wrapper.find('.custom-main-btn').trigger('click')
    await flushPromises()

    expect(knowledgeStore.knowledgeList.length).toBe(beforeCount + 1)
    const created = knowledgeStore.knowledgeList[0]
    expect(created.versions[0].sourceFiles).toEqual([
      { fileId: 'res1', fileName: '26W產品特色簡報.pptx', linkedVersion: 1 },
      { fileId: 'res2', fileName: '25W產品銷售DM.pdf', linkedVersion: 1 },
    ])
    expect(resourceStore.getFileById('res1')?.knowledgeIds).toContain(created.id)
    expect(resourceStore.getFileById('res2')?.knowledgeIds).toContain(created.id)
  })

  it('沒有選擇分類時，送出按鈕為 disabled', async () => {
    const wrapper = await mountModal({ prefillFile: { fileId: 'res1', fileName: '26W產品特色簡報.pptx' } })
    expect(wrapper.find('.custom-main-btn').attributes('disabled')).toBeDefined()
  })
})
```

- [ ] **Step 2：執行測試確認失敗**

Run: `npm run test:unit -- --run CreateKnowledgeWizardModal.test.ts`
Expected: FAIL（`pickedFiles`/`.picked-file-row` 尚不存在，`createFromFile` 仍是舊的單檔簽名）

- [ ] **Step 3：修改樣板 FILE 區塊**

將 `src/components/Knowledge/CreateKnowledgeWizardModal.vue` 第 24-86 行（從 `<!-- FILE: 已預填來源檔案（從共用檔案管理建立）-->` 到上傳按鈕 `</template>` 結尾）整段：

```html
      <!-- FILE: 已預填來源檔案（從共用檔案管理建立）-->
      <template v-if="selectedSourceType === 'FILE' && prefillFile">
        <div class="upload-dropzone mb-3 has-file" style="cursor:default;">
          <i class="material-symbols-outlined fs-28 mb-1" style="color:#16a34a;">task_alt</i>
          <div class="fs-13 fw-600">{{ prefillFile.fileName }}</div>
          <div class="fs-12 fc-grey-1 mt-1">來自共用檔案管理</div>
        </div>
      </template>

      <!-- FILE: 已從共用庫選取 -->
      <template v-else-if="selectedSourceType === 'FILE' && selectedLibraryFile">
        <div class="upload-dropzone mb-2 has-file" style="cursor:default;">
          <i class="material-symbols-outlined fs-28 mb-1" style="color:var(--success);">task_alt</i>
          <div class="fs-13 fw-600">{{ selectedLibraryFile.fileName }}</div>
          <div class="fs-12 fc-grey-1 mt-1">來自共用檔案管理</div>
          <button
            class="fs-11 fc-grey-1 mt-2"
            style="background:none;border:none;cursor:pointer;text-decoration:underline;"
            @click="selectedLibraryFile = null"
          >更換</button>
        </div>
      </template>

      <!-- FILE: 上傳區 -->
      <template v-else-if="selectedSourceType === 'FILE'">
        <div
          class="upload-dropzone mb-2"
          :class="{ 'has-file': uploadedFile }"
          @dragover.prevent
          @drop.prevent="handleDrop"
          @click="fileInputRef?.click()"
        >
          <template v-if="!uploadedFile">
            <i class="material-symbols-outlined fs-32 mb-2" style="color:#93c5fd;">cloud_upload</i>
            <div class="fs-13 fw-500" style="color:#2563eb;">拖曳檔案至此或點擊選取</div>
            <div class="fs-12 fc-grey-1 mt-1">支援 PDF、DOCX、XLSX，最大 50MB</div>
          </template>
          <template v-else>
            <i class="material-symbols-outlined fs-28 mb-1" style="color:#16a34a;">task_alt</i>
            <div class="fs-13 fw-600">{{ uploadedFile.name }}</div>
            <div class="fs-12 fc-grey-1 mt-1">{{ (uploadedFile.size / 1024).toFixed(0) }} KB</div>
            <button class="fs-11 fc-grey-1 mt-2" style="background:none;border:none;cursor:pointer;text-decoration:underline;" @click.stop="uploadedFile = null">更換檔案</button>
          </template>
        </div>
        <input ref="fileInputRef" type="file" accept=".pdf,.docx,.xlsx" style="display:none;" @change="handleFileSelect" />

        <!-- 上傳提示 + 共用庫按鈕 -->
        <div class="d-flex align-items-center justify-content-center gap-1 mb-2" style="font-size:11px;color:var(--text-faint);">
          <i class="material-symbols-outlined" style="font-size:13px;">info</i>
          上傳的檔案將同時儲存至共用檔案管理
        </div>
        <div class="text-center mb-3" style="font-size:11px;color:var(--text-faint);">— 或 —</div>
        <div class="text-center mb-3">
          <button
            class="custom-btn"
            style="font-size:12px;"
            @click.stop="showResourcePicker = true"
          >
            <i class="material-symbols-outlined fs-14">folder_open</i>
            從共用檔案管理選取
          </button>
        </div>
      </template>
```

改為：

```html
      <!-- FILE: 已選檔案清單（可能來自 prefill、上傳、或共用庫選取）-->
      <template v-if="selectedSourceType === 'FILE'">
        <div v-if="pickedFiles.length" class="picked-files-list mb-2">
          <div v-for="f in pickedFiles" :key="f.fileId" class="picked-file-row">
            <i class="material-symbols-outlined fs-18" style="color:#16a34a;">task_alt</i>
            <span class="fs-13 fw-600 picked-file-name">{{ f.fileName }}</span>
            <span class="fs-11 fc-grey-1">{{ f.fromUpload ? '新上傳' : '共用檔案管理' }}</span>
            <button class="picked-file-remove" @click.stop="removePickedFile(f.fileId)">
              <i class="material-symbols-outlined fs-16">close</i>
            </button>
          </div>
        </div>

        <div
          class="upload-dropzone mb-2"
          @dragover.prevent
          @drop.prevent="handleDrop"
          @click="fileInputRef?.click()"
        >
          <i class="material-symbols-outlined fs-32 mb-2" style="color:#93c5fd;">cloud_upload</i>
          <div class="fs-13 fw-500" style="color:#2563eb;">拖曳檔案至此或點擊選取</div>
          <div class="fs-12 fc-grey-1 mt-1">支援 PDF、DOCX、XLSX，最大 50MB</div>
        </div>
        <input ref="fileInputRef" type="file" accept=".pdf,.docx,.xlsx" style="display:none;" @change="handleFileSelect" />

        <!-- 上傳提示 + 共用庫按鈕 -->
        <div class="d-flex align-items-center justify-content-center gap-1 mb-2" style="font-size:11px;color:var(--text-faint);">
          <i class="material-symbols-outlined" style="font-size:13px;">info</i>
          上傳的檔案將同時儲存至共用檔案管理
        </div>
        <div class="text-center mb-3" style="font-size:11px;color:var(--text-faint);">— 或 —</div>
        <div class="text-center mb-3">
          <button
            class="custom-btn"
            style="font-size:12px;"
            @click.stop="showResourcePicker = true"
          >
            <i class="material-symbols-outlined fs-14">folder_open</i>
            從共用檔案管理選取更多檔案
          </button>
        </div>
      </template>
```

- [ ] **Step 4：移除 `'done'` emit 宣告**

第 177-181 行：
```ts
const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'created', knowledgeId: string): void
  (e: 'done', payload: { fileId: string; knowledgeId: string }): void
}>()
```
改為：
```ts
const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'created', knowledgeId: string): void
}>()
```

- [ ] **Step 5：改寫 FILE 狀態管理（第 206-226 行）**

將：
```ts
// ── FILE ──
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadedFile = ref<File | null>(null)
const selectedLibraryFile = ref<{ fileId: string; fileName: string } | null>(null)
const showResourcePicker = ref(false)

function onPickerSelect(file: { fileId: string; fileName: string }) {
  selectedLibraryFile.value = file
  uploadedFile.value = null
  showResourcePicker.value = false
}

function handleDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0]
  if (file) uploadedFile.value = file
}

function handleFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) uploadedFile.value = file
}
```

改為：
```ts
// ── FILE ──
interface PickedFile { fileId: string; fileName: string; fromUpload: boolean }
const fileInputRef = ref<HTMLInputElement | null>(null)
const pickedFiles = ref<PickedFile[]>([])
const showResourcePicker = ref(false)

function addPickedFile(file: PickedFile) {
  if (pickedFiles.value.some(f => f.fileId === file.fileId)) return
  pickedFiles.value.push(file)
}

function removePickedFile(fileId: string) {
  pickedFiles.value = pickedFiles.value.filter(f => f.fileId !== fileId)
}

function onPickerSelect(payload: { files: { fileId: string; fileName: string }[] }) {
  payload.files.forEach(f => addPickedFile({ fileId: f.fileId, fileName: f.fileName, fromUpload: false }))
  showResourcePicker.value = false
}

function addUploadedFile(file: File) {
  const saved = resourceStore.addFileFromUpload(file)
  addPickedFile({ fileId: saved.id, fileName: saved.fileName, fromUpload: true })
}

function handleDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0]
  if (file) addUploadedFile(file)
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) addUploadedFile(file)
  input.value = ''
}
```

- [ ] **Step 6：修改 `canSubmit`（第 259-267 行）**

將：
```ts
const canSubmit = computed(() => {
  if (!selectedCategory.value) return false
  if (props.prefillFile) return true
  if (selectedSourceType.value === 'FILE') return !!(uploadedFile.value || selectedLibraryFile.value)
  if (selectedSourceType.value === 'API') return !!selectedApiSourceId.value
  if (selectedSourceType.value === 'MANUAL') return !!manualTitle.value.trim()
  if (selectedSourceType.value === 'JUSTKA') return !!selectedJustkaBot.value
  return false
})
```
改為：
```ts
const canSubmit = computed(() => {
  if (!selectedCategory.value) return false
  if (selectedSourceType.value === 'FILE') return pickedFiles.value.length > 0
  if (selectedSourceType.value === 'API') return !!selectedApiSourceId.value
  if (selectedSourceType.value === 'MANUAL') return !!manualTitle.value.trim()
  if (selectedSourceType.value === 'JUSTKA') return !!selectedJustkaBot.value
  return false
})
```

- [ ] **Step 7：修改表單重置與開啟時的 prefill watch（第 269-283 行）**

將：
```ts
// ── 表單重置 ──
watch(isOpenModal, (open) => {
  if (!open) {
    selectedSourceType.value = 'FILE'
    uploadedFile.value = null
    selectedLibraryFile.value = null
    showResourcePicker.value = false
    selectedApiSourceId.value = ''
    selectedJustkaBot.value = ''
    manualTitle.value = ''
    selectedCategory.value = ''
    selectedTags.value = []
    tagInput.value = ''
  }
})
```
改為：
```ts
// ── 開啟時預填 prefillFile／關閉時表單重置 ──
watch(isOpenModal, (open) => {
  if (open) {
    if (props.prefillFile) {
      pickedFiles.value = [{ fileId: props.prefillFile.fileId, fileName: props.prefillFile.fileName, fromUpload: false }]
    }
  } else {
    selectedSourceType.value = 'FILE'
    pickedFiles.value = []
    showResourcePicker.value = false
    selectedApiSourceId.value = ''
    selectedJustkaBot.value = ''
    manualTitle.value = ''
    selectedCategory.value = ''
    selectedTags.value = []
    tagInput.value = ''
  }
})
```

- [ ] **Step 8：移除獨立的 `prefillFile` 送出分支，改寫 FILE 送出分支**

刪除第 286-303 行（`handleSubmit` 開頭的 `if (props.prefillFile) { ... return }` 整段）：
```ts
  if (props.prefillFile) {
    const { knowledgeId } = knowledgeStore.createFromFile({
      fileId: props.prefillFile.fileId,
      fileName: props.prefillFile.fileName,
      category: selectedCategory.value,
      template: '',
      content: '',
    })
    emit('done', { fileId: props.prefillFile.fileId, knowledgeId })
    isOpenModal.value = false
    popDialog.toast('AI 正在解析檔案並生成知識內容…', 3000)
    simulateFileAiGeneration(knowledgeId, props.prefillFile.fileName)
    router.push({ name: 'KnowledgeDetail', params: { id: knowledgeId } })
    return
  }

```

將原本的 FILE 送出分支：
```ts
  if (selectedSourceType.value === 'FILE') {
    const isFromLibrary = !!selectedLibraryFile.value
    const fileRef = isFromLibrary
      ? { fileId: selectedLibraryFile.value!.fileId, fileName: selectedLibraryFile.value!.fileName }
      : (() => {
          const saved = resourceStore.addFileFromUpload(uploadedFile.value!)
          return { fileId: saved.id, fileName: saved.fileName }
        })()

    const { knowledgeId } = knowledgeStore.createFromFile({
      fileId: fileRef.fileId,
      fileName: fileRef.fileName,
      category: selectedCategory.value,
      template: '',
      content: '',
    })

    const toastMsg = isFromLibrary
      ? 'AI 正在解析檔案並生成知識內容…'
      : '檔案已儲存至共用檔案管理，AI 正在解析並生成知識內容…'

    emit('done', { fileId: fileRef.fileId, knowledgeId })
    isOpenModal.value = false
    popDialog.toast(toastMsg, 3000)
    simulateFileAiGeneration(knowledgeId, fileRef.fileName)
    router.push({ name: 'KnowledgeDetail', params: { id: knowledgeId } })
    return
  }
```
改為：
```ts
  if (selectedSourceType.value === 'FILE') {
    const { knowledgeId } = knowledgeStore.createFromFile({
      files: pickedFiles.value.map(f => ({ fileId: f.fileId, fileName: f.fileName })),
      category: selectedCategory.value,
      template: '',
      content: '',
    })

    pickedFiles.value.forEach(f => resourceStore.addKnowledgeMembership(f.fileId, knowledgeId))

    const toastMsg = pickedFiles.value.length > 1
      ? `已整合 ${pickedFiles.value.length} 個來源檔案，AI 正在解析並生成知識內容…`
      : 'AI 正在解析檔案並生成知識內容…'

    isOpenModal.value = false
    popDialog.toast(toastMsg, 3000)
    simulateFileAiGeneration(knowledgeId, pickedFiles.value[0].fileName)
    router.push({ name: 'KnowledgeDetail', params: { id: knowledgeId } })
    return
  }
```

- [ ] **Step 9：新增 SCSS**

在 `src/scss/views/_KnowledgeBase.scss` 的 `.CreateKnowledgeWizardModal { ... }` 區塊（約第 1638-1705 行）內，`.tags-input-field { ... }` 規則之後、區塊結尾 `}` 之前，插入：

```scss

  .picked-files-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .picked-file-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border: 1px solid var(--divider-a50);
    border-radius: 8px;
    background: var(--page-bg);
  }

  .picked-file-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .picked-file-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-faint);
    padding: 2px;
    border-radius: 4px;

    &:hover {
      color: var(--danger);
      background: var(--danger-soft);
    }
  }
```

同時把區塊的開頭選擇器從：
```scss
.CreateKnowledgeWizardModal {
```
改為（讓 Task 5 的 `UpdateKnowledgeSourcesModal.vue` 共用同一套已選檔案清單樣式，不重複定義）：
```scss
.CreateKnowledgeWizardModal,
.UpdateKnowledgeSourcesModal {
```

- [ ] **Step 10：移除 `ResourceLibrary.vue` 的 `@done` 監聽器**

在 `src/views/ResourceLibrary.vue` 第 171-175 行，將：
```html
  <CreateKnowledgeWizardModal
    v-model="isWizardOpen"
    :prefill-file="wizardFile"
    @done="({ fileId, knowledgeId }) => resourceStore.addKnowledgeMembership(fileId, knowledgeId)"
  />
```
改為：
```html
  <CreateKnowledgeWizardModal
    v-model="isWizardOpen"
    :prefill-file="wizardFile"
  />
```

- [ ] **Step 11：執行測試與型別檢查確認通過**

Run: `npm run test:unit -- --run CreateKnowledgeWizardModal.test.ts`
Expected: 全部 PASS

Run: `npm run type-check`
Expected: 無錯誤（此時 Task 2/3/4 的介面都已對齊，應該完全乾淨）

Run: `npm run test:unit -- --run`
Expected: 全部 PASS

- [ ] **Step 12：Commit**

```bash
git add src/components/Knowledge/CreateKnowledgeWizardModal.vue src/scss/views/_KnowledgeBase.scss src/views/ResourceLibrary.vue src/components/Knowledge/__tests__/CreateKnowledgeWizardModal.test.ts
git commit -m "feat(CreateKnowledgeWizardModal): support picking multiple source files (Phase 1 complete)"
```

---

### Task 5：「更新知識庫」新流程（Phase 2 完成）

**Files:**
- Create: `src/components/Knowledge/UpdateKnowledgeSourcesModal.vue`
- Create: `src/scss/components/_UpdateKnowledgeSourcesModal.scss`
- Modify: `src/scss/components/_index.scss`（新增 `@import`）
- Modify: `src/views/ResourceLibrary.vue`（新增按鈕、引入元件、狀態）
- Test: `src/components/Knowledge/__tests__/UpdateKnowledgeSourcesModal.test.ts`（新建）

**Interfaces:**
- Consumes：Task 2 的 `ResourceFilePicker`（`preselectedIds` 用於預先勾選）、Task 3 的 `knowledgeStore.createDraftFromMemberUpdate`。
- Produces：無新的對外介面（Phase 2 的終端使用者入口，本 plan 的最後一個 task）。

- [ ] **Step 1：寫失敗測試**

建立 `src/components/Knowledge/__tests__/UpdateKnowledgeSourcesModal.test.ts`：

```ts
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import UpdateKnowledgeSourcesModal from '../UpdateKnowledgeSourcesModal.vue'
import ResourceFilePicker from '../ResourceFilePicker.vue'
import { useKnowledgeStore } from '@/stores/knowledgeStore'

function makeRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div/>' } },
      { path: '/knowledge/:knowledgeId/edit/:versionId', name: 'KnowledgeEditor', component: { template: '<div/>' } },
    ],
  })
}

async function mountModal() {
  setActivePinia(createPinia())
  const router = makeRouter()
  const wrapper = mount(UpdateKnowledgeSourcesModal, {
    props: { modelValue: true },
    global: { plugins: [router] },
  })
  await flushPromises()
  return wrapper
}

describe('UpdateKnowledgeSourcesModal', () => {
  it('選擇知識庫後，pickedFiles 預填為該知識庫目前生效版本的來源檔案', async () => {
    const wrapper = await mountModal()
    await wrapper.find('select.custom-input').setValue('k1')
    await flushPromises()
    expect(wrapper.findAll('.picked-file-row').length).toBe(1)
    expect(wrapper.text()).toContain('UGG2025商品總表.xlsx')
  })

  it('未選擇知識庫時，送出按鈕為 disabled', async () => {
    const wrapper = await mountModal()
    expect(wrapper.find('.custom-main-btn').attributes('disabled')).toBeDefined()
  })

  it('重新開啟共用檔案選取時，preselectedIds 反映目前的 pickedFiles（而非原始生效版本）', async () => {
    const wrapper = await mountModal()
    await wrapper.find('select.custom-input').setValue('k1')
    await flushPromises()

    const picker = wrapper.findComponent(ResourceFilePicker)
    await picker.vm.$emit('select', { files: [{ fileId: 'res9', fileName: '特殊材質名稱轉換清單(新）.txt' }] })
    await flushPromises()

    expect(picker.props('preselectedIds')).toEqual(['res9'])
  })

  it('送出後呼叫 createDraftFromMemberUpdate 並導頁至 KnowledgeEditor', async () => {
    const wrapper = await mountModal()
    const knowledgeStore = useKnowledgeStore()
    await wrapper.find('select.custom-input').setValue('k1')
    await flushPromises()

    const picker = wrapper.findComponent(ResourceFilePicker)
    await picker.vm.$emit('select', { files: [{ fileId: 'res9', fileName: '特殊材質名稱轉換清單(新）.txt' }] })
    await flushPromises()

    const before = knowledgeStore.getKnowledgeById('k1')!.versions.length
    await wrapper.find('.custom-main-btn').trigger('click')
    await flushPromises()

    const item = knowledgeStore.getKnowledgeById('k1')!
    expect(item.versions.length).toBe(before + 1)
    const newVersion = item.versions[item.versions.length - 1]
    expect(newVersion.status).toBe('draft')
    expect(newVersion.sourceFiles).toEqual([{ fileId: 'res9', fileName: '特殊材質名稱轉換清單(新）.txt', linkedVersion: 1 }])
  })
})
```

- [ ] **Step 2：執行測試確認失敗**

Run: `npm run test:unit -- --run UpdateKnowledgeSourcesModal.test.ts`
Expected: FAIL（`UpdateKnowledgeSourcesModal.vue` 尚不存在）

- [ ] **Step 3：建立 `src/components/Knowledge/UpdateKnowledgeSourcesModal.vue`**

```vue
<template>
  <compModal
    class="UpdateKnowledgeSourcesModal"
    v-model="isOpen"
    :width="720"
  >
    <template #title>更新知識庫</template>

    <div class="update-sources-body">
      <div class="mb-3">
        <label class="form-label">指定知識庫 <span style="color:#dc2626;">*</span></label>
        <select v-model="selectedKnowledgeId" class="custom-input w-100">
          <option value="">選擇要更新的知識庫...</option>
          <option v-for="k in knowledgeList" :key="k.id" :value="k.id">{{ k.title }}（{{ k.category }}）</option>
        </select>
      </div>

      <template v-if="selectedKnowledgeId">
        <div class="mb-2">
          <label class="form-label">檔案來源</label>
          <div v-if="pickedFiles.length" class="picked-files-list mb-2">
            <div v-for="f in pickedFiles" :key="f.fileId" class="picked-file-row">
              <i class="material-symbols-outlined fs-18" style="color:#16a34a;">task_alt</i>
              <span class="fs-13 fw-600 picked-file-name">{{ f.fileName }}</span>
              <button class="picked-file-remove" @click.stop="removePickedFile(f.fileId)">
                <i class="material-symbols-outlined fs-16">close</i>
              </button>
            </div>
          </div>
          <button class="custom-btn" style="font-size:12px;" @click="showResourcePicker = true">
            <i class="material-symbols-outlined fs-14">folder_open</i>
            勾選檔案來源
          </button>
        </div>

        <div class="update-sources-hint">
          <i class="material-symbols-outlined">info</i>
          送出後將建立新版本草稿，仍可在編輯頁調整內容；需經審核通過後才會正式啟用。
        </div>
      </template>

      <div class="d-flex justify-content-end gap-2 mt-3">
        <button class="custom-btn" @click="isOpen = false">取消</button>
        <button
          class="custom-btn custom-main-btn"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          <i class="material-symbols-outlined">sync_alt</i>
          送出更新
        </button>
      </div>
    </div>

    <ResourceFilePicker
      v-model="showResourcePicker"
      :preselected-ids="pickedFiles.map(f => f.fileId)"
      @select="onFilesSelected"
    />
  </compModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import compModal from '@/components/compModal/compModal.vue'
import ResourceFilePicker from '@/components/Knowledge/ResourceFilePicker.vue'
import { useKnowledgeStore } from '@/stores/knowledgeStore'
import { useResourceStore } from '@/stores/resourceStore'
import popDialog from '@/services/popDialog'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const router = useRouter()
const knowledgeStore = useKnowledgeStore()
const resourceStore = useResourceStore()
const { knowledgeList } = storeToRefs(knowledgeStore)

const selectedKnowledgeId = ref('')
const showResourcePicker = ref(false)

interface PickedFile { fileId: string; fileName: string }
const pickedFiles = ref<PickedFile[]>([])

// 切換知識庫時，將已選檔案重置為該知識庫目前生效版本（無生效版本則取最後一筆）的來源檔案
watch(selectedKnowledgeId, (id) => {
  if (!id) {
    pickedFiles.value = []
    return
  }
  const k = knowledgeStore.getKnowledgeById(id)
  if (!k) {
    pickedFiles.value = []
    return
  }
  const activeVersion = k.versions.find(v => v.status === 'active') ?? k.versions[k.versions.length - 1]
  pickedFiles.value = (activeVersion?.sourceFiles ?? []).map(f => ({ fileId: f.fileId, fileName: f.fileName }))
})

function onFilesSelected(payload: { files: { fileId: string; fileName: string }[] }) {
  pickedFiles.value = payload.files
  showResourcePicker.value = false
}

function removePickedFile(fileId: string) {
  pickedFiles.value = pickedFiles.value.filter(f => f.fileId !== fileId)
}

const canSubmit = computed(() => !!selectedKnowledgeId.value && pickedFiles.value.length > 0)

function handleSubmit() {
  if (!canSubmit.value) return
  const knowledgeId = selectedKnowledgeId.value
  const versionId = knowledgeStore.createDraftFromMemberUpdate(
    knowledgeId,
    pickedFiles.value.map(f => ({
      fileId: f.fileId,
      fileName: f.fileName,
      linkedVersion: resourceStore.getFileById(f.fileId)?.version ?? 1,
    })),
  )
  isOpen.value = false
  popDialog.toast('已建立新版本草稿，請於編輯頁確認內容後送審', 3000)
  if (versionId) {
    router.push({ name: 'KnowledgeEditor', params: { knowledgeId, versionId } })
  }
}

// 關閉時清空狀態
watch(isOpen, (open) => {
  if (!open) {
    selectedKnowledgeId.value = ''
    pickedFiles.value = []
    showResourcePicker.value = false
  }
})
</script>
```

- [ ] **Step 4：建立 `src/scss/components/_UpdateKnowledgeSourcesModal.scss`**

```scss
// src/scss/components/_UpdateKnowledgeSourcesModal.scss

.UpdateKnowledgeSourcesModal {
  .update-sources-body {
    padding: 4px 0;
  }

  .update-sources-hint {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    background: var(--hint);
    border: 1px solid var(--primary);
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 12px;
    color: var(--primary-hover);
    line-height: 1.6;

    .material-symbols-outlined {
      font-size: 16px;
      flex-shrink: 0;
      margin-top: 1px;
    }
  }
}
```

- [ ] **Step 5：在 `src/scss/components/_index.scss` 註冊新檔案**

將：
```scss
@import "./SkillFileUpload";
```
（檔案最後一行）改為：
```scss
@import "./SkillFileUpload";
@import "./UpdateKnowledgeSourcesModal";
```

- [ ] **Step 6：在 `ResourceLibrary.vue` 新增按鈕與元件**

在 `src/views/ResourceLibrary.vue` 第 11-17 行（`banner-right`），將：
```html
        <div class="banner-right">
          <compListCardSwitch v-model="viewMode"/>
          <button class="custom-btn custom-main-btn" @click="openBatchUploadFn()">
            <i class="material-symbols-outlined">add</i>
            上傳檔案
          </button>
        </div>
```
改為：
```html
        <div class="banner-right">
          <compListCardSwitch v-model="viewMode"/>
          <button class="custom-btn" @click="isUpdateSourcesModalOpen = true">
            <i class="material-symbols-outlined">sync_alt</i>
            更新知識庫
          </button>
          <button class="custom-btn custom-main-btn" @click="openBatchUploadFn()">
            <i class="material-symbols-outlined">add</i>
            上傳檔案
          </button>
        </div>
```

在第 177-180 行（`SourceUpdateModal` 之後），將：
```html
  <SourceUpdateModal
    v-model="isSourceUpdateModalOpen"
    :file-id="sourceUpdateFileId"
  />
```
改為：
```html
  <SourceUpdateModal
    v-model="isSourceUpdateModalOpen"
    :file-id="sourceUpdateFileId"
  />

  <UpdateKnowledgeSourcesModal v-model="isUpdateSourcesModalOpen" />
```

在 import 區塊（第 196-197 行），將：
```ts
import CreateKnowledgeWizardModal from '@/components/Knowledge/CreateKnowledgeWizardModal.vue';
import SourceUpdateModal from '@/components/Knowledge/SourceUpdateModal.vue';
```
改為：
```ts
import CreateKnowledgeWizardModal from '@/components/Knowledge/CreateKnowledgeWizardModal.vue';
import SourceUpdateModal from '@/components/Knowledge/SourceUpdateModal.vue';
import UpdateKnowledgeSourcesModal from '@/components/Knowledge/UpdateKnowledgeSourcesModal.vue';
```

在既有的 `isSourceUpdateModalOpen`/`sourceUpdateFileId` 宣告（第 218-219 行）之後，新增：
```ts
// 更新知識庫（多檔來源成員調整）
const isUpdateSourcesModalOpen = ref(false);
```

- [ ] **Step 7：執行測試與型別檢查確認通過**

Run: `npm run test:unit -- --run UpdateKnowledgeSourcesModal.test.ts`
Expected: 全部 PASS

Run: `npm run type-check`
Expected: 無錯誤

Run: `npm run test:unit -- --run`
Expected: 全部 PASS（含既有 `ResourceLibrary.a11y.test.ts`）

- [ ] **Step 8：Commit**

```bash
git add src/components/Knowledge/UpdateKnowledgeSourcesModal.vue src/scss/components/_UpdateKnowledgeSourcesModal.scss src/scss/components/_index.scss src/views/ResourceLibrary.vue src/components/Knowledge/__tests__/UpdateKnowledgeSourcesModal.test.ts
git commit -m "feat(ResourceLibrary): add 更新知識庫 entry point with member-update flow (Phase 2 complete)"
```

---

## 完成後整體驗證

- [ ] Run: `npm run type-check && npm run test:unit -- --run && npm run lint`
- [ ] Expected: 全部通過，無新增的 ESLint 警告
- [ ] 手動確認（非自動化）：`npm run dev` 後，從「共用檔案管理」的「建立為知識內容」與知識庫頁面的「+ 新增知識」都能選取多個檔案建立知識庫；從「共用檔案管理」的新「更新知識庫」按鈕能選擇知識庫、調整來源檔案、送出後在 `KnowledgeEditor` 看到新草稿；審核通過後回到「共用檔案管理」確認「目前成員」欄位正確反映異動。
