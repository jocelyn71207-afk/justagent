# 建立技能：附加所需檔案 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓使用者在建立/編輯技能時可以附上參考檔案（metadata only），並在技能詳情抽屜看到這些檔案。

**Architecture:** `skillStore.ts` 新增 `SkillFile` 型別與 `files?: SkillFile[]` 欄位（純 mock，不上傳到任何後端）。新增一個純邏輯模組 `skillFileUpload.ts`（副檔名 → FileType 對應、icon 對應、檔案驗證）供 `SkillFileUpload.vue` 元件與未來測試共用。`SkillFileUpload.vue` 內嵌到 `SkillEditor.vue` 精靈 Step1，`SkillDetailDrawer.vue` 新增「附加檔案」區塊唯讀顯示。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Pinia、Vitest、既有 `utils/file.ts` 工具函式。

## Global Constraints

- 使用 `<script setup lang="ts">`，禁止 Options API
- 樣式統一在 `src/scss/` 管理，禁止 `<style scoped>`
- 新增 SCSS 檔案需在對應 `_index.scss` 中手動加入引入（本專案實際用 `@import`，非 `@forward`——以現有 `src/scss/components/_index.scss` 為準）
- 所有 import 使用 `@/` alias
- 顏色使用 CSS Custom Properties／既有 SCSS 變數（`$color_main_1` 等），不寫死 hex
- 不接後端 API、不做真實檔案上傳——`skillStore.ts` 全站沒有任何 `httpService`/`axios` 呼叫，此功能維持一致，只存檔案 metadata
- 本專案單元測試（Vitest）目前只覆蓋 `stores/__tests__` 與 `utils/__tests__` 的純邏輯測試，沒有 `@vue/test-utils` 掛載元件的先例——本次新增的邏輯測試沿用「抽成純函式測試」的模式，`.vue` 元件本身用手動跑 `npm run dev` + Playwright 截圖驗證，不新增元件掛載測試
- 型別、檔案大小限制等所有數值以 `docs/superpowers/specs/2026-08-07-skill-attached-files-design.md` 為準

---

### Task 1: `skillStore.ts` 資料模型 — `SkillFile` 型別與 `files` 欄位

**Files:**
- Modify: `src/stores/skillStore.ts:74-118`（`Skill` interface）
- Modify: `src/stores/skillStore.ts:120-150`（`CreateSkillPayload` / `UpdateSkillPayload` / `DraftSkill`）
- Modify: `src/stores/skillStore.ts:997-1028`（`createSkill` / `updateSkill`）
- Test: `src/stores/__tests__/skillStore.test.ts`

**Interfaces:**
- Consumes: `FileType`（`@/utils/file`，既有型別，不用改）
- Produces:
  - `export interface SkillFile { id: string; fileName: string; fileSize: number; fileType: FileType; uploadedAt: string }`
  - `Skill.files?: SkillFile[]`
  - `CreateSkillPayload.files?: SkillFile[]`
  - `UpdateSkillPayload.files?: SkillFile[]`
  - `DraftSkill.files?: SkillFile[]`
  - `createSkill(data: CreateSkillPayload)` 產生的技能物件帶 `files: data.files ?? []`
  - `updateSkill(id, data: UpdateSkillPayload)` 會把 `skill.files` 設為 `data.files ?? []`

- [ ] **Step 1: 寫失敗的 store 測試**

在 `src/stores/__tests__/skillStore.test.ts` 檔案最後一個 `describe` 區塊後面（`})` 之後、檔案結尾的 `})` 之前）新增：

```ts
  describe('附加檔案 files', () => {
    it('createSkill 帶入 files 會存到新技能上', () => {
      const store = useSkillStore()
      const file = { id: 'sf-1', fileName: 'rules.pdf', fileSize: 1024, fileType: 'PDF' as const, uploadedAt: '2026-08-07T00:00:00Z' }
      store.createSkill({
        name: '測試技能',
        instructions: '',
        triggerHint: '',
        isEnabled: true,
        assignedAgents: [],
        files: [file],
      })
      const created = store.flatSkills.find(s => s.name === '測試技能')
      expect(created?.files).toEqual([file])
    })

    it('createSkill 未帶 files 時，新技能的 files 是空陣列', () => {
      const store = useSkillStore()
      store.createSkill({
        name: '無附檔技能',
        instructions: '',
        triggerHint: '',
        isEnabled: true,
        assignedAgents: [],
      })
      const created = store.flatSkills.find(s => s.name === '無附檔技能')
      expect(created?.files).toEqual([])
    })

    it('updateSkill 帶入 files 會覆蓋技能的 files', () => {
      const store = useSkillStore()
      const file = { id: 'sf-2', fileName: 'faq.md', fileSize: 512, fileType: 'MD' as const, uploadedAt: '2026-08-07T00:00:00Z' }
      store.updateSkill('ext-cs-return-001', {
        name: '客服機器人 (退貨版)',
        instructions: '測試指令',
        triggerHint: '',
        isEnabled: true,
        assignedAgents: [],
        files: [file],
      })
      expect(store.findSkill('ext-cs-return-001')?.files).toEqual([file])
    })

    it('updateSkill 未帶 files 時，技能的 files 被清空為空陣列', () => {
      const store = useSkillStore()
      store.updateSkill('ext-cs-return-001', {
        name: '客服機器人 (退貨版)',
        instructions: '測試指令',
        triggerHint: '',
        isEnabled: true,
        assignedAgents: [],
      })
      expect(store.findSkill('ext-cs-return-001')?.files).toEqual([])
    })
  })
```

- [ ] **Step 2: 執行測試確認會失敗**

Run: `npm run test:unit -- skillStore.test.ts`
Expected: FAIL —— `files` 相關斷言失敗（因為 `Skill`/`CreateSkillPayload`/`UpdateSkillPayload` 還沒有 `files` 欄位，`createSkill`/`updateSkill` 也還沒處理它）

- [ ] **Step 3: 實作型別與欄位**

在 `src/stores/skillStore.ts` 的 `Skill` interface 最後一個欄位（`aiAnalysis?: string[]`）後面加入：

```ts
  files?: SkillFile[]
```

在同一個檔案裡，`Skill` interface 定義**之前**（或緊接在它下方皆可，這裡選擇緊接在 `Skill` interface 結束的 `}` 之後）新增：

```ts
export interface SkillFile {
  id: string
  fileName: string
  fileSize: number
  fileType: FileType
  uploadedAt: string
}
```

並在檔案最上方 import `FileType`：

```ts
import type { FileType } from '@/utils/file'
```

`CreateSkillPayload` 加一行：

```ts
export interface CreateSkillPayload {
  name: string
  description?: string
  instructions: string
  triggerHint: string
  isEnabled: boolean
  assignedAgents: string[]
  scope?: 'enterprise' | 'team'
  files?: SkillFile[]
}
```

`UpdateSkillPayload` 加一行：

```ts
export interface UpdateSkillPayload {
  name: string
  description?: string
  instructions: string
  triggerHint: string
  isEnabled: boolean
  assignedAgents: string[]
  files?: SkillFile[]
}
```

`DraftSkill` 加一行：

```ts
export interface DraftSkill {
  id: string
  name: string
  description: string
  instructions: string
  type: 'system' | 'extension'
  forkSourceId?: string
  createdAt: string
  updatedAt: string
  triggerHint?: string
  assignedAgents?: string[]
  files?: SkillFile[]
}
```

- [ ] **Step 4: 實作 `createSkill` / `updateSkill`**

`createSkill` 內 `skills.value.push({...})` 物件字面量最後加一行：

```ts
      files: data.files ?? [],
```

`updateSkill` 內，`skill.assignedAgents = data.assignedAgents` 這行後面加一行：

```ts
    skill.files = data.files ?? []
```

- [ ] **Step 5: 執行測試確認通過**

Run: `npm run test:unit -- skillStore.test.ts`
Expected: PASS，全部測試（含既有的）都通過

- [ ] **Step 6: 型別檢查**

Run: `npm run type-check`
Expected: 無錯誤

- [ ] **Step 7: Commit**

```bash
git add src/stores/skillStore.ts src/stores/__tests__/skillStore.test.ts
git commit -m "feat(skill): add SkillFile type and files field to skill payloads

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: 純邏輯模組 `skillFileUpload.ts`

**Files:**
- Create: `src/components/Skill/skillFileUpload.ts`
- Test: `src/components/Skill/__tests__/skillFileUpload.test.ts`

**Interfaces:**
- Consumes:
  - `SkillFile`（Task 1，`@/stores/skillStore`）
  - `FileType`、`pdfFileTypes`、`excelFileTypes`、`txtFileTypes`、`markdownFileTypes`、`wordFileTypes`、`validateUploadFiles`（既有，`@/utils/file`）
- Produces（供 Task 3 的 `SkillFileUpload.vue` 使用）：
  - `export const SKILL_FILE_ACCEPT: string`
  - `export const SKILL_FILE_MAX_COUNT: number`
  - `export const SKILL_FILE_MAX_SINGLE_SIZE: number`
  - `export const SKILL_FILE_MAX_TOTAL_SIZE: number`
  - `export function extToFileType(fileName: string): FileType`
  - `export function skillFileIcon(type: FileType): string`
  - `export function validateSkillFiles(newFiles: File[], existing: SkillFile[]): { valid: boolean; error?: string }`

- [ ] **Step 1: 寫失敗的測試**

建立 `src/components/Skill/__tests__/skillFileUpload.test.ts`：

```ts
import { describe, it, expect } from 'vitest'
import { extToFileType, skillFileIcon, validateSkillFiles, SKILL_FILE_MAX_COUNT, SKILL_FILE_MAX_SINGLE_SIZE } from '../skillFileUpload'
import type { SkillFile } from '@/stores/skillStore'

describe('skillFileUpload', () => {
  describe('extToFileType', () => {
    it('依副檔名判斷 FileType', () => {
      expect(extToFileType('rules.pdf')).toBe('PDF')
      expect(extToFileType('data.xlsx')).toBe('EXCEL')
      expect(extToFileType('data.xls')).toBe('EXCEL')
      expect(extToFileType('contract.docx')).toBe('WORD')
      expect(extToFileType('contract.doc')).toBe('WORD')
      expect(extToFileType('notes.txt')).toBe('TXT')
      expect(extToFileType('readme.md')).toBe('MD')
    })

    it('不支援的副檔名回傳 OTHER', () => {
      expect(extToFileType('photo.png')).toBe('OTHER')
      expect(extToFileType('noext')).toBe('OTHER')
    })
  })

  describe('skillFileIcon', () => {
    it('每種 FileType 都有對應圖示', () => {
      expect(skillFileIcon('PDF')).toBe('picture_as_pdf')
      expect(skillFileIcon('EXCEL')).toBe('table_chart')
      expect(skillFileIcon('WORD')).toBe('description')
      expect(skillFileIcon('TXT')).toBe('notes')
      expect(skillFileIcon('MD')).toBe('article')
      expect(skillFileIcon('OTHER')).toBe('insert_drive_file')
    })
  })

  describe('validateSkillFiles', () => {
    const existing: SkillFile[] = []

    it('支援類型且在限制內時通過驗證', () => {
      const file = new File(['x'.repeat(100)], 'rules.pdf', { type: 'application/pdf' })
      const result = validateSkillFiles([file], existing)
      expect(result.valid).toBe(true)
    })

    it('不支援的檔案類型會驗證失敗', () => {
      const file = new File(['x'], 'photo.png', { type: 'image/png' })
      const result = validateSkillFiles([file], existing)
      expect(result.valid).toBe(false)
    })

    it('超過單檔大小上限會驗證失敗', () => {
      const big = new File([new Uint8Array(SKILL_FILE_MAX_SINGLE_SIZE + 1)], 'big.pdf', { type: 'application/pdf' })
      const result = validateSkillFiles([big], existing)
      expect(result.valid).toBe(false)
    })

    it('超過檔案數量上限會驗證失敗', () => {
      const files = Array.from(
        { length: SKILL_FILE_MAX_COUNT + 1 },
        (_, i) => new File(['x'], `f${i}.txt`, { type: 'text/plain' })
      )
      const result = validateSkillFiles(files, existing)
      expect(result.valid).toBe(false)
    })
  })
})
```

- [ ] **Step 2: 執行測試確認會失敗**

Run: `npm run test:unit -- skillFileUpload.test.ts`
Expected: FAIL —— 找不到模組 `../skillFileUpload`

- [ ] **Step 3: 實作 `skillFileUpload.ts`**

建立 `src/components/Skill/skillFileUpload.ts`：

```ts
import type { FileType } from '@/utils/file'
import {
  pdfFileTypes, excelFileTypes, txtFileTypes, markdownFileTypes, wordFileTypes,
  validateUploadFiles,
} from '@/utils/file'
import type { SkillFile } from '@/stores/skillStore'

// file input accept 屬性；跟 utils/file.ts 的 acceptedFileExtensions 分開維護，
// 因為技能參考檔案只接受文件類型，不含圖片
export const SKILL_FILE_ACCEPT = '.pdf,.xlsx,.xls,.txt,.md,.doc,.docx'

export const SKILL_FILE_MAX_COUNT = 5
export const SKILL_FILE_MAX_SINGLE_SIZE = 20 * 1024 * 1024   // 20MB
export const SKILL_FILE_MAX_TOTAL_SIZE = 60 * 1024 * 1024    // 60MB

const EXT_TO_FILE_TYPE: Record<string, FileType> = {
  pdf: 'PDF',
  xlsx: 'EXCEL', xls: 'EXCEL',
  doc: 'WORD', docx: 'WORD',
  txt: 'TXT',
  md: 'MD',
}

export function extToFileType(fileName: string): FileType {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  return EXT_TO_FILE_TYPE[ext] ?? 'OTHER'
}

const FILE_TYPE_ICON: Record<FileType, string> = {
  PDF: 'picture_as_pdf',
  EXCEL: 'table_chart',
  WORD: 'description',
  TXT: 'notes',
  MD: 'article',
  IMAGE: 'insert_drive_file',
  HTML: 'insert_drive_file',
  CHART: 'insert_drive_file',
  OTHER: 'insert_drive_file',
}

export function skillFileIcon(type: FileType): string {
  return FILE_TYPE_ICON[type] ?? 'insert_drive_file'
}

// 技能所需檔案是純 metadata（不上傳到任何後端），既有 validateUploadFiles() 的
// existingFiles 參數只用得到 `.file.size`，用假的 File shape 轉接即可
export function validateSkillFiles(newFiles: File[], existing: SkillFile[]) {
  const supportedTypes = [
    ...pdfFileTypes, ...excelFileTypes, ...txtFileTypes, ...markdownFileTypes, ...wordFileTypes,
  ]
  const existingAsItems = existing.map(f => ({ file: { size: f.fileSize } as File }))
  return validateUploadFiles(newFiles, existingAsItems, supportedTypes, {
    maxCount: SKILL_FILE_MAX_COUNT,
    maxSingleSize: SKILL_FILE_MAX_SINGLE_SIZE,
    maxTotalSize: SKILL_FILE_MAX_TOTAL_SIZE,
  })
}
```

- [ ] **Step 4: 執行測試確認通過**

Run: `npm run test:unit -- skillFileUpload.test.ts`
Expected: PASS

- [ ] **Step 5: 型別檢查**

Run: `npm run type-check`
Expected: 無錯誤

- [ ] **Step 6: Commit**

```bash
git add src/components/Skill/skillFileUpload.ts src/components/Skill/__tests__/skillFileUpload.test.ts
git commit -m "feat(skill): add skillFileUpload helper module

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: `SkillFileUpload.vue` 上傳元件

**Files:**
- Create: `src/components/Skill/SkillFileUpload.vue`
- Create: `src/scss/components/_SkillFileUpload.scss`
- Modify: `src/scss/components/_index.scss`

**Interfaces:**
- Consumes:
  - Task 1: `SkillFile`（`@/stores/skillStore`）
  - Task 2: `SKILL_FILE_ACCEPT`、`extToFileType`、`skillFileIcon`、`validateSkillFiles`（`./skillFileUpload`）
  - 既有：`formatFileSize`（`@/utils/file`）、`popDialog`（`@/services/popDialog`）
- Produces（供 Task 4 使用）：
  - Vue 元件 `SkillFileUpload`，`props: { modelValue: SkillFile[] }`，`emits: { 'update:modelValue': [SkillFile[]] }`

- [ ] **Step 1: 建立元件**

建立 `src/components/Skill/SkillFileUpload.vue`：

```vue
<template>
  <div class="SkillFileUpload">
    <div
      :class="['sfu-dropzone', { 'is-dragover': isDragging }]"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="onDrop"
    >
      <i class="material-symbols-outlined">cloud_upload</i>
      <p class="sfu-dropzone-text">拖曳檔案到這裡，或點擊選擇</p>
      <p class="sfu-dropzone-hint">支援 PDF、Excel、Word、TXT、Markdown，單檔上限 20MB，最多 5 個檔案</p>
      <input
        type="file"
        class="sfu-file-input"
        multiple
        :accept="SKILL_FILE_ACCEPT"
        @change="onChoose"
      />
    </div>

    <div v-if="modelValue.length" class="sfu-file-list">
      <div v-for="f in modelValue" :key="f.id" class="sfu-file-item">
        <i class="material-symbols-outlined sfu-file-icon">{{ skillFileIcon(f.fileType) }}</i>
        <span class="sfu-file-name">{{ f.fileName }}</span>
        <span class="sfu-file-size">{{ formatFileSize(f.fileSize) }}</span>
        <button type="button" class="sfu-remove-btn" @click="removeFile(f.id)">
          <i class="material-symbols-outlined">close</i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { SkillFile } from '@/stores/skillStore'
import { formatFileSize } from '@/utils/file'
import { SKILL_FILE_ACCEPT, extToFileType, skillFileIcon, validateSkillFiles } from './skillFileUpload'
import popDialog from '@/services/popDialog'

const props = defineProps<{ modelValue: SkillFile[] }>()
const emit = defineEmits<{ 'update:modelValue': [files: SkillFile[]] }>()

const isDragging = ref(false)

function buildSkillFile(file: File): SkillFile {
  return {
    id: `sf-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    fileName: file.name,
    fileSize: file.size,
    fileType: extToFileType(file.name),
    uploadedAt: new Date().toISOString(),
  }
}

function addFiles(files: File[]) {
  if (!files.length) return
  const result = validateSkillFiles(files, props.modelValue)
  if (!result.valid) {
    popDialog.alert(result.error as string)
    return
  }
  emit('update:modelValue', [...props.modelValue, ...files.map(buildSkillFile)])
}

function onDrop(event: DragEvent) {
  isDragging.value = false
  addFiles(Array.from(event.dataTransfer?.files ?? []))
}

function onChoose(event: Event) {
  const input = event.target as HTMLInputElement
  addFiles(Array.from(input.files ?? []))
  input.value = ''
}

function removeFile(id: string) {
  emit('update:modelValue', props.modelValue.filter(f => f.id !== id))
}
</script>
```

- [ ] **Step 2: 新增 SCSS**

建立 `src/scss/components/_SkillFileUpload.scss`：

```scss
.SkillFileUpload {
  .sfu-dropzone {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    border: 1px dashed var(--divider);
    border-radius: 10px;
    padding: 24px 16px;
    cursor: pointer;
    transition: background-color 0.15s, border-color 0.15s;

    &:hover,
    &.is-dragover {
      background-color: var(--page-bg);
      border-color: $color_main_3;
    }

    > .material-symbols-outlined {
      font-size: 28px;
      color: var(--text-faint);
    }
  }

  .sfu-dropzone-text {
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
    margin: 8px 0 2px;
  }

  .sfu-dropzone-hint {
    font-size: 11.5px;
    color: var(--text-faint);
    margin: 0;
  }

  .sfu-file-input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }

  .sfu-file-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 10px;
  }

  .sfu-file-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 10px;
    border: 1px solid var(--divider-a50);
    border-radius: 8px;
    background: var(--surface);
  }

  .sfu-file-icon {
    font-size: 16px;
    color: $color_main_1;
    flex-shrink: 0;
  }

  .sfu-file-name {
    flex: 1;
    min-width: 0;
    font-size: 12.5px;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sfu-file-size {
    font-size: 11px;
    color: var(--text-faint);
    flex-shrink: 0;
  }

  .sfu-remove-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: none;
    background: transparent;
    color: var(--text-faint);
    cursor: pointer;
    flex-shrink: 0;
    border-radius: 50%;

    &:hover { background: var(--page-bg); color: var(--text); }
    .material-symbols-outlined { font-size: 15px; }
  }
}
```

在 `src/scss/components/_index.scss` 最後一行後面加入：

```scss
@import './SkillFileUpload';
```

- [ ] **Step 3: 型別檢查**

Run: `npm run type-check`
Expected: 無錯誤（此時元件還沒被任何地方 import，不影響 build，但要確認元件本身型別正確）

- [ ] **Step 4: Commit**

```bash
git add src/components/Skill/SkillFileUpload.vue src/scss/components/_SkillFileUpload.scss src/scss/components/_index.scss
git commit -m "feat(skill): add SkillFileUpload component

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: 整合進建立技能精靈（`SkillEditor.vue`）

**Files:**
- Modify: `src/views/SkillEditor.vue`

**Interfaces:**
- Consumes: Task 3 的 `SkillFileUpload.vue`（`props: modelValue: SkillFile[]`, `emits: update:modelValue`），Task 1 的 `SkillFile` 型別

- [ ] **Step 1: import 元件與型別**

在 `src/views/SkillEditor.vue` 的 `<script setup>` import 區塊（第 189-194 行）加入：

```ts
import SkillFileUpload from '@/components/Skill/SkillFileUpload.vue'
import type { DraftSkill, SkillFile } from '@/stores/skillStore'
```

（`DraftSkill` 已經有 import，這裡是把 `SkillFile` 併入同一行 `import type`）

- [ ] **Step 2: `form.files` 欄位**

在 `form = reactive({...})`（第 227-237 行）的 `isEnabled` 那行後面加入：

```ts
  files: existingSkill?.files ?? existingDraft?.files ?? [] as SkillFile[],
```

- [ ] **Step 3: Step1 新增所需檔案區塊**

在模板裡，Step1 的「觸發時機」`se-section`（第 83-95 行）與「指派 Agent」`se-section`（第 96-112 行）之間插入：

```vue
          <div class="se-section">
            <label class="se-label">所需檔案（選填）</label>
            <p class="se-hint">上傳技能執行時需要參考的檔案，例如規則表、範本、FAQ 文件。</p>
            <SkillFileUpload v-model="form.files" />
          </div>
```

- [ ] **Step 4: Step2 確認頁新增一列**

在「確認」模板（第 116-153 行）裡，「指派 Agent」那個 `se-confirm-row`（第 133-139 行）後面、`se-confirm-row--toggle` 那個 row（第 140-146 行）前面插入：

```vue
            <div class="se-confirm-row">
              <span class="se-confirm-key">所需檔案</span>
              <span class="se-confirm-val">
                <span v-if="form.files.length">{{ form.files.length }} 個檔案</span>
                <span v-else class="se-empty">（未上傳）</span>
              </span>
            </div>
```

- [ ] **Step 5: 送出時帶上 files**

`handleSubmit()`（第 257-274 行）裡的 `payload` 物件加一行：

```ts
  const payload = {
    name: form.name.trim(),
    instructions: form.instructions.trim(),
    triggerHint: form.triggerHint.trim(),
    assignedAgents: [...form.assignedAgents],
    isEnabled: form.isEnabled,
    files: [...form.files],
  }
```

- [ ] **Step 6: 型別檢查與 lint**

Run: `npm run type-check && npx eslint src/views/SkillEditor.vue`
Expected: 無錯誤（`SkillEditor.vue` 本身目前沒有已知的既存 lint 錯誤，跟 Task 5 的 `SkillDetailDrawer.vue` 不同，不要混淆）

- [ ] **Step 7: 手動驗證**

啟動本地開發伺服器並用 Playwright 走一次流程，確認：拖曳/選擇檔案後清單即時出現、刪除按鈕可移除、Step2 顯示正確的檔案數量、送出後技能物件確實帶有 `files`。

```bash
npm run dev -- --port 5183 &
```

等伺服器啟動後（可用 `curl -s -o /dev/null -w "%{http_code}" http://localhost:5183/justagent/` 確認回應 200），寫一個暫存腳本（放在 repo 根目錄執行完再刪除，因為要吃 `node_modules/playwright`）：

```js
// verify-editor.mjs
import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page.goto('http://localhost:5183/justagent/view/SkillEditor')
await page.waitForTimeout(800)
await page.fill('input.custom-input', 'Playwright 測試技能')
await page.click('.custom-main-btn') // 下一步到 Step1
await page.waitForTimeout(300)
const buffer = Buffer.from('%PDF-1.4 test')
await page.setInputFiles('.sfu-file-input', { name: 'rules.pdf', mimeType: 'application/pdf', buffer })
await page.waitForTimeout(300)
await page.screenshot({ path: 'verify-editor-step1.png' })
await browser.close()
```

Run: `node verify-editor.mjs`，然後用 Read 工具打開 `verify-editor-step1.png` 確認畫面上看得到「rules.pdf」跟檔案大小、有刪除按鈕。驗證完刪除 `verify-editor.mjs` 與截圖，並 `kill` 掉開發伺服器。

- [ ] **Step 8: Commit**

```bash
git add src/views/SkillEditor.vue
git commit -m "feat(skill): wire SkillFileUpload into SkillEditor wizard

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: 詳情抽屜顯示附加檔案（`SkillDetailDrawer.vue`）

**Files:**
- Modify: `src/components/Skill/SkillDetailDrawer.vue:98-103`
- Modify: `src/scss/components/_SkillDetailDrawer.scss`

**Interfaces:**
- Consumes: Task 1 的 `Skill.files`，Task 2 的 `skillFileIcon`（`@/components/Skill/skillFileUpload`），既有 `formatFileSize`（`@/utils/file`）

- [ ] **Step 1: import**

在 `src/components/Skill/SkillDetailDrawer.vue` 的 `<script setup>` import 區塊（第 360-365 行）加入：

```ts
import { skillFileIcon } from '@/components/Skill/skillFileUpload'
import { formatFileSize } from '@/utils/file'
```

- [ ] **Step 2: 新增附加檔案區塊**

在「技能指令」`drawer-section`（第 98-102 行）結束的 `</div>` 後面、「覆蓋能力」`drawer-section`（第 104 行的註解）前面插入：

```vue
            <!-- 附加檔案 -->
            <div v-if="skill.files?.length" class="drawer-section">
              <div class="section-label">附加檔案</div>
              <div class="attached-file-list">
                <div v-for="f in skill.files" :key="f.id" class="attached-file-item">
                  <i class="material-symbols-outlined">{{ skillFileIcon(f.fileType) }}</i>
                  <span class="af-name">{{ f.fileName }}</span>
                  <span class="af-size">{{ formatFileSize(f.fileSize) }}</span>
                </div>
              </div>
            </div>
```

- [ ] **Step 3: 新增 SCSS**

在 `src/scss/components/_SkillDetailDrawer.scss` 的 `.instructions-block` 規則（約第 241-254 行）後面加入：

```scss
  // ── 附加檔案 ──────────────────────────────

  .attached-file-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .attached-file-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    background: var(--page-bg);
    border: 1px solid var(--divider-a50);
    border-radius: 8px;
    font-size: 12.5px;

    > .material-symbols-outlined { font-size: 15px; color: $color_main_1; flex-shrink: 0; }
  }

  .af-name {
    flex: 1;
    min-width: 0;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .af-size {
    color: var(--text-faint);
    font-size: 11px;
    flex-shrink: 0;
  }
```

- [ ] **Step 4: 型別檢查**

Run: `npm run type-check`
Expected: 無錯誤

- [ ] **Step 5: lint（確認沒有引入新的 lint 錯誤）**

Run: `npx eslint src/components/Skill/SkillDetailDrawer.vue`
Expected: 只會看到既存、與本次改動無關的 `rateIconClass`/`rateNumClass` 未使用警告（2026-08-07 稍早的「按鈕移到卡片上方」那次改動已確認過這是既有問題），不應該有新的錯誤

- [ ] **Step 6: 手動驗證**

沿用 Task 4 開發伺服器（若已關閉需重開：`npm run dev -- --port 5183 &`，等 `curl -s -o /dev/null -w "%{http_code}" http://localhost:5183/justagent/` 回應 200）。用 Playwright 直接編輯一筆既有的個人技能（`personal-001` / 週報自動生成）掛上檔案，再從列表點進去看抽屜：

```js
// verify-drawer-files.mjs
import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

// 編輯既有個人技能，上傳一個檔案並存檔
await page.goto('http://localhost:5183/justagent/view/SkillEditor?skillId=personal-001')
await page.waitForTimeout(800)
await page.click('.se-footer-right .custom-main-btn') // Step0 -> Step1
await page.waitForTimeout(300)
const buffer = Buffer.from('%PDF-1.4 test')
await page.setInputFiles('.sfu-file-input', { name: 'weekly-rules.pdf', mimeType: 'application/pdf', buffer })
await page.waitForTimeout(300)
await page.click('.se-footer-right .custom-main-btn') // Step1 -> Step2
await page.waitForTimeout(300)
await page.click('.se-footer-right .custom-main-btn') // 儲存變更，導回技能列表
await page.waitForTimeout(600)

// 開啟該技能詳情抽屜，截圖附加檔案區塊
await page.locator('.psg-name', { hasText: '週報自動生成' }).first().click({ force: true })
await page.waitForTimeout(600)
await page.screenshot({ path: 'verify-drawer-files.png', fullPage: false })
await browser.close()
```

Run: `node verify-drawer-files.mjs`，用 Read 工具打開 `verify-drawer-files.png` 確認「附加檔案」區塊顯示 `weekly-rules.pdf`、正確的 PDF 圖示與檔案大小。驗證完刪除腳本與截圖，並關閉開發伺服器。

- [ ] **Step 7: Commit**

```bash
git add src/components/Skill/SkillDetailDrawer.vue src/scss/components/_SkillDetailDrawer.scss
git commit -m "feat(skill): show attached files in SkillDetailDrawer

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: 全面回歸檢查

**Files:** 無新增/修改，純驗證

**Interfaces:** 無

- [ ] **Step 1: 完整單元測試**

Run: `npm run test:unit`
Expected: 全部 PASS（含 Task 1、Task 2 新增的測試）

- [ ] **Step 2: 型別檢查**

Run: `npm run type-check`
Expected: 無錯誤

- [ ] **Step 3: lint 全專案**

Run: `npm run lint`
Expected: 無新增錯誤（若看到 `SkillDetailDrawer.vue` 的 `rateIconClass`/`rateNumClass` 既存警告，確認是本次改動之前就存在，不用修）

- [ ] **Step 4: build**

Run: `npm run build`
Expected: build 成功，無 SCSS 找不到 partial 的錯誤（確認 `_SkillFileUpload.scss` 有被 `_index.scss` 正確引入）

- [ ] **Step 5: 驗證超過大小上限會被擋下**

Task 2 的單元測試已經涵蓋 `validateSkillFiles()` 本身的邏輯，Task 4／Task 5 的手動驗證已經涵蓋「合法檔案上傳＋抽屜顯示」的正常路徑。這裡只需要補驗證 UI 層的錯誤提示有正確接上：

```bash
npm run dev -- --port 5183 &
```

等 `curl -s -o /dev/null -w "%{http_code}" http://localhost:5183/justagent/` 回應 200 後：

```js
// verify-oversized-file.mjs
import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page.goto('http://localhost:5183/justagent/view/SkillEditor')
await page.waitForTimeout(800)
await page.fill('input.custom-input', 'Playwright 超額測試')
await page.click('.se-footer-right .custom-main-btn') // Step0 -> Step1
await page.waitForTimeout(300)
const big = new Uint8Array(20 * 1024 * 1024 + 1) // 剛好超過 20MB 上限
await page.setInputFiles('.sfu-file-input', { name: 'too-big.pdf', mimeType: 'application/pdf', buffer: Buffer.from(big) })
await page.waitForTimeout(500)
await page.screenshot({ path: 'verify-oversized.png' })
await browser.close()
```

Run: `node verify-oversized-file.mjs`，用 Read 工具打開 `verify-oversized.png` 確認畫面跳出 `popDialog.alert` 錯誤提示（而不是把超額檔案加進清單）。驗證完刪除腳本與截圖，關閉開發伺服器。

- [ ] **Step 6: 最終 commit（如果前面步驟有修正）**

若回歸檢查過程中有修正任何檔案：

```bash
git add -A
git commit -m "fix(skill): address regression findings from attached-files review

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

若沒有需要修正的地方，此步驟略過。
