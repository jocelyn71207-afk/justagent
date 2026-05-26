# Knowledge Wizard × Resource Library Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users select files from 共用檔案管理 when creating knowledge entries, and auto-save newly uploaded files back to 共用檔案管理.

**Architecture:** Add a new `ResourceFilePicker.vue` sub-modal component that browses `resourceStore.resourceList`. Extend `resourceStore` with `addFileFromUpload(file: File)` to convert a browser `File` into a `ResourceFile` record. Update `CreateKnowledgeWizardModal` to wire the picker and the upload hint text, and route both new paths through `knowledgeStore.createFromFile()`.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Pinia, Vitest, SCSS (BEM-ish, CSS Custom Properties)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `src/stores/resourceStore.ts` | Add `addFileFromUpload(file: File)` |
| Create | `src/stores/__tests__/resourceStore.test.ts` | Unit tests for `addFileFromUpload` |
| Create | `src/components/Knowledge/ResourceFilePicker.vue` | Picker sub-modal (search, filter, single-select) |
| Create | `src/scss/components/_ResourceFilePicker.scss` | Styles for picker component |
| Modify | `src/scss/components/_index.scss` | Register new SCSS file |
| Modify | `src/components/Knowledge/CreateKnowledgeWizardModal.vue` | Wire picker + upload hint + updated submit logic |

---

## Task 1: Extend resourceStore with `addFileFromUpload`

**Files:**
- Modify: `src/stores/resourceStore.ts`
- Create: `src/stores/__tests__/resourceStore.test.ts`

- [ ] **Step 1.1: Write the failing test**

Create `src/stores/__tests__/resourceStore.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useResourceStore } from '@/stores/resourceStore'

describe('resourceStore — addFileFromUpload', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adds a new ResourceFile record to the front of resourceList', () => {
    const store = useResourceStore()
    const before = store.resourceList.length
    const mockFile = new File(['content'], 'report.pdf', { type: 'application/pdf' })

    const result = store.addFileFromUpload(mockFile)

    expect(store.resourceList.length).toBe(before + 1)
    expect(result.fileName).toBe('report.pdf')
    expect(store.resourceList[0].id).toBe(result.id)
    expect(store.resourceList[0].fileName).toBe('report.pdf')
  })

  it('sets status to stored and creatorType to USER', () => {
    const store = useResourceStore()
    const mockFile = new File([''], 'data.xlsx', { type: 'application/vnd.ms-excel' })

    store.addFileFromUpload(mockFile)

    const added = store.resourceList[0]
    expect(added.status).toBe('stored')
    expect(added.creatorType).toBe('USER')
    expect(added.processType).toBe('RAW')
  })

  it('derives fileType from extension: pdf→PDF, docx→WORD, xlsx→EXCEL, unknown→OTHER', () => {
    const store = useResourceStore()

    store.addFileFromUpload(new File([''], 'a.pdf'))
    store.addFileFromUpload(new File([''], 'b.docx'))
    store.addFileFromUpload(new File([''], 'c.xlsx'))
    store.addFileFromUpload(new File([''], 'd.xyz'))

    // resourceList is prepended, so order is reversed
    expect(store.resourceList[0].fileType).toBe('OTHER')
    expect(store.resourceList[1].fileType).toBe('EXCEL')
    expect(store.resourceList[2].fileType).toBe('WORD')
    expect(store.resourceList[3].fileType).toBe('PDF')
  })
})
```

- [ ] **Step 1.2: Run tests to verify they fail**

```bash
npm run test:unit -- src/stores/__tests__/resourceStore.test.ts
```

Expected: FAIL with `store.addFileFromUpload is not a function`

- [ ] **Step 1.3: Implement `addFileFromUpload` in `src/stores/resourceStore.ts`**

Add the following inside the `useResourceStore` store function, before the `return` statement:

```ts
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
  const id = `res-${Date.now()}`
  addFile({
    id,
    fileName: file.name,
    fileUrl: '',
    fileType: deriveFileType(file.name),
    processType: 'RAW',
    status: 'stored',
    creatorType: 'USER',
    ownerId: '',
    ownerName: '',
    lastModify: new Date().toISOString().replace('T', ' ').slice(0, 16),
  })
  return { id, fileName: file.name }
}
```

Also add `addFileFromUpload` to the `return` statement in the store:

```ts
return { resourceList, getFileById, uploadNewVersion, addFile, addFileFromUpload, deleteFile };
```

- [ ] **Step 1.4: Run tests to verify they pass**

```bash
npm run test:unit -- src/stores/__tests__/resourceStore.test.ts
```

Expected: 3 tests PASS

- [ ] **Step 1.5: Commit**

```bash
git add src/stores/resourceStore.ts src/stores/__tests__/resourceStore.test.ts
git commit -m "feat: add addFileFromUpload to resourceStore"
```

---

## Task 2: Create `ResourceFilePicker.vue` component

**Files:**
- Create: `src/components/Knowledge/ResourceFilePicker.vue`
- Create: `src/scss/components/_ResourceFilePicker.scss`
- Modify: `src/scss/components/_index.scss`

- [ ] **Step 2.1: Create `src/scss/components/_ResourceFilePicker.scss`**

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
  }

  .picker-table-header {
    display: grid;
    grid-template-columns: 1fr 90px 90px 110px;
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
    grid-template-columns: 1fr 90px 90px 110px;
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
    align-items: center;
    gap: 6px;
    margin-top: 10px;
    font-size: 12px;
    color: var(--primary-hover);
    min-height: 20px;

    i { font-size: 16px; color: #16a34a; }
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

  // Status badge
  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 1px 7px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 600;
    white-space: nowrap;

    &.status-stored, &.status-saved  { background: #dcfce7; color: #166534; }
    &.status-uploading, &.status-parsing { background: #fef3c7; color: #92400e; }
    &.status-failed  { background: #fee2e2; color: #991b1b; }
  }
}
```

- [ ] **Step 2.2: Register in `src/scss/components/_index.scss`**

Add at the end of the file:

```scss
@import "./ResourceFilePicker";
```

- [ ] **Step 2.3: Create `src/components/Knowledge/ResourceFilePicker.vue`**

```vue
<template>
  <compModal
    class="ResourceFilePicker"
    v-model="isOpen"
    :width="700"
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
        <div>檔案名稱</div>
        <div>類型</div>
        <div>狀態</div>
        <div>最後更新</div>
      </div>

      <template v-if="filteredList.length > 0">
        <div
          v-for="file in filteredList"
          :key="file.id"
          :class="[
            'picker-row',
            { 'is-selected': selectedFile?.id === file.id },
            { 'is-disabled': isDisabled(file) },
          ]"
          @click="!isDisabled(file) && selectFile(file)"
        >
          <div class="picker-row-name">
            <i class="material-symbols-outlined fs-16">description</i>
            <span>{{ file.fileName }}</span>
          </div>
          <div>
            <span :class="['badge', file.processType === 'AI_PARSED' ? 'badge-ai' : 'badge-raw']">
              {{ file.processType === 'AI_PARSED' ? 'AI 解析' : '原始檔案' }}
            </span>
          </div>
          <div>
            <span :class="['status-badge', `status-${file.status}`]">
              {{ statusLabel(file.status) }}
            </span>
          </div>
          <div class="fc-grey-1 fs-11">{{ file.lastModify.slice(0, 10) }}</div>
        </div>
      </template>

      <div v-else class="picker-empty">
        <i class="material-symbols-outlined">folder_open</i>
        <span>{{ searchQuery || filterType ? '找不到符合的檔案' : '共用庫目前沒有檔案' }}</span>
      </div>
    </div>

    <div class="picker-selected-hint">
      <template v-if="selectedFile">
        <i class="material-symbols-outlined">check_circle</i>
        已選取：{{ selectedFile.fileName }}
      </template>
    </div>

    <div class="picker-footer">
      <button class="custom-btn" @click="isOpen = false">取消</button>
      <button
        class="custom-btn custom-main-btn"
        :disabled="!selectedFile"
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
import { useResourceStore } from '@/stores/resourceStore'
import type { ResourceFile } from '@/stores/resourceStore'

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'select', file: { fileId: string; fileName: string }): void
}>()
const props = defineProps<{
  modelValue: boolean
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const resourceStore = useResourceStore()
const { resourceList } = storeToRefs(resourceStore)

const searchQuery = ref('')
const filterType = ref('')
const selectedFile = ref<ResourceFile | null>(null)

const filteredList = computed(() => {
  return resourceList.value.filter(f => {
    const matchesSearch = !searchQuery.value || f.fileName.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesType = !filterType.value || f.processType === filterType.value
    return matchesSearch && matchesType
  })
})

function isDisabled(file: ResourceFile): boolean {
  return file.status === 'uploading' || file.status === 'parsing'
}

function selectFile(file: ResourceFile) {
  selectedFile.value = selectedFile.value?.id === file.id ? null : file
}

function confirmSelect() {
  if (!selectedFile.value) return
  emit('select', { fileId: selectedFile.value.id, fileName: selectedFile.value.fileName })
  isOpen.value = false
}

// reset state each time the picker opens
watch(() => props.modelValue, (open) => {
  if (open) {
    searchQuery.value = ''
    filterType.value = ''
    selectedFile.value = null
  }
})

function statusLabel(status: ResourceFile['status']): string {
  const map: Record<ResourceFile['status'], string> = {
    uploading: '上傳中',
    parsing: '解析中',
    stored: '已儲存',
    saved: '已儲存',
    failed: '失敗',
  }
  return map[status]
}
</script>
```

- [ ] **Step 2.4: Verify the app builds without errors**

```bash
npm run type-check
```

Expected: no type errors

- [ ] **Step 2.5: Commit**

```bash
git add src/components/Knowledge/ResourceFilePicker.vue src/scss/components/_ResourceFilePicker.scss src/scss/components/_index.scss
git commit -m "feat: add ResourceFilePicker component"
```

---

## Task 3: Update `CreateKnowledgeWizardModal.vue`

**Files:**
- Modify: `src/components/Knowledge/CreateKnowledgeWizardModal.vue`

- [ ] **Step 3.1: Add imports and new refs**

In the `<script setup>` section, add the import for `ResourceFilePicker` and `useResourceStore` after existing imports:

```ts
import ResourceFilePicker from '@/components/Knowledge/ResourceFilePicker.vue'
import { useResourceStore } from '@/stores/resourceStore'
```

Add after `const knowledgeStore = useKnowledgeStore()`:

```ts
const resourceStore = useResourceStore()
```

Add after `const uploadedFile = ref<File | null>(null)`:

```ts
const selectedLibraryFile = ref<{ fileId: string; fileName: string } | null>(null)
const showResourcePicker = ref(false)

function onPickerSelect(file: { fileId: string; fileName: string }) {
  selectedLibraryFile.value = file
  uploadedFile.value = null
  showResourcePicker.value = false
}
```

- [ ] **Step 3.2: Update `canSubmit` computed**

Replace the existing `canSubmit` computed:

```ts
const canSubmit = computed(() => {
  if (!selectedCategory.value) return false
  if (props.prefillFile) return true
  if (selectedSourceType.value === 'FILE') return !!(uploadedFile.value || selectedLibraryFile.value)
  if (selectedSourceType.value === 'API') return !!selectedApiSourceId.value
  if (selectedSourceType.value === 'MANUAL') return !!manualTitle.value.trim()
  return false
})
```

- [ ] **Step 3.3: Update the reset watch**

Replace the existing `watch(isOpenModal, ...)`:

```ts
watch(isOpenModal, (open) => {
  if (!open) {
    selectedSourceType.value = 'FILE'
    uploadedFile.value = null
    selectedLibraryFile.value = null
    showResourcePicker.value = false
    selectedApiSourceId.value = ''
    manualTitle.value = ''
    selectedCategory.value = ''
    selectedTags.value = []
    tagInput.value = ''
  }
})
```

- [ ] **Step 3.4: Update `handleSubmit` — FILE branch**

Replace the existing `if (selectedSourceType.value === 'FILE')` block (lines 243–254):

```ts
if (selectedSourceType.value === 'FILE') {
  const fileRef = selectedLibraryFile.value
    ? { fileId: selectedLibraryFile.value.fileId, fileName: selectedLibraryFile.value.fileName }
    : (() => {
        const saved = resourceStore.addFileFromUpload(uploadedFile.value!)
        return { fileId: saved.id, fileName: saved.fileName }
      })()

  const { knowledgeId, versionId } = knowledgeStore.createFromFile({
    fileId: fileRef.fileId,
    fileName: fileRef.fileName,
    category: selectedCategory.value,
    template: '',
    content: '',
  })

  const toastMsg = selectedLibraryFile.value
    ? '已建立知識條目草稿'
    : '檔案已儲存至共用檔案管理，知識條目草稿已建立'

  isOpenModal.value = false
  popDialog.toast(toastMsg, 3000)
  router.push({ name: 'KnowledgeEditor', params: { knowledgeId, versionId } })
  return
}
```

- [ ] **Step 3.5: Update the FILE template section**

Replace the entire `<!-- FILE: 上傳區 -->` template block (the `<template v-else-if="selectedSourceType === 'FILE'">` block):

```html
<!-- FILE: 已從共用庫選取 -->
<template v-else-if="selectedSourceType === 'FILE' && selectedLibraryFile">
  <div class="upload-dropzone mb-2 has-file" style="cursor:default;">
    <i class="material-symbols-outlined fs-28 mb-1" style="color:#16a34a;">task_alt</i>
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

- [ ] **Step 3.6: Update the submit button label and icon**

Replace the submit button (in Footer Actions):

```html
<button
  class="custom-btn custom-main-btn"
  :disabled="!canSubmit"
  @click="handleSubmit"
>
  <i class="material-symbols-outlined">{{ (prefillFile || selectedLibraryFile) ? 'edit' : selectedSourceType === 'MANUAL' ? 'edit' : 'upload' }}</i>
  {{ (prefillFile || selectedLibraryFile) ? '建立草稿並編輯' : selectedSourceType === 'MANUAL' ? '建立草稿並編輯' : '上傳並開始處理' }}
</button>
```

- [ ] **Step 3.7: Add `ResourceFilePicker` to the template**

Just before the closing `</compModal>` tag (after `</div>` of `wizard-modal-body`), add:

```html
<ResourceFilePicker v-model="showResourcePicker" @select="onPickerSelect" />
```

- [ ] **Step 3.8: Run type-check**

```bash
npm run type-check
```

Expected: no errors

- [ ] **Step 3.9: Commit**

```bash
git add src/components/Knowledge/CreateKnowledgeWizardModal.vue
git commit -m "feat: wire ResourceFilePicker into CreateKnowledgeWizardModal"
```

---

## Task 4: Manual smoke test

- [ ] **Step 4.1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 4.2: Test — upload new file**

1. Navigate to 知識內容管理 → click「建立知識條目」
2. Select source type「上傳檔案」
3. Verify hint text「上傳的檔案將同時儲存至共用檔案管理」is visible
4. Verify「從共用檔案管理選取」button is present
5. Drag or click-select a `.pdf` / `.docx` / `.xlsx` file
6. Select a category → click「上傳並開始處理」
7. Verify toast shows「檔案已儲存至共用檔案管理，知識條目草稿已建立」
8. Verify navigation to KnowledgeEditor
9. Navigate to 共用檔案管理 → verify the uploaded file appears at the top of the list

- [ ] **Step 4.3: Test — select from library**

1. Open「建立知識條目」again
2. Click「從共用檔案管理選取」
3. Verify ResourceFilePicker modal opens with file list
4. Test search: type part of a filename and verify list filters
5. Test type filter: select「AI 解析」and verify only AI_PARSED files show
6. Verify「解析中」status files are grayed out and not clickable
7. Click a valid file row → verify it highlights + selected hint shows at bottom
8. Click same row again → verify it deselects
9. Click a different file → click「確認選取」
10. Verify picker closes, wizard shows green「已選取」box with「更換」link
11. Verify submit button now reads「建立草稿並編輯」
12. Select a category → click「建立草稿並編輯」
13. Verify navigation to KnowledgeEditor

- [ ] **Step 4.4: Test — reset on close**

1. Open wizard, select a library file
2. Click「取消」
3. Re-open wizard → verify upload zone is back (selectedLibraryFile reset)

- [ ] **Step 4.5: Run all unit tests**

```bash
npm run test:unit
```

Expected: all tests pass (including the 3 new resourceStore tests)

- [ ] **Step 4.6: Final commit**

```bash
git add -A
git commit -m "feat: knowledge wizard x resource library integration complete"
```
