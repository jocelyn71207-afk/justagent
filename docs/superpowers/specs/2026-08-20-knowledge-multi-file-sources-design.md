# 知識庫多檔案來源管理 Design

## 背景

目前知識庫（Knowledge Base）雖然資料結構上 `KnowledgeVersion.sourceFiles` 已經是陣列，但實際上從未有任何路徑填入超過一筆——「建立知識庫」與「更新知識庫」都只能對應單一來源檔案。使用者提供的兩張畫面（建立知識庫 / 更新知識庫）顯示同一套「多檔勾選來源」表格：欄位為檔案名稱／類型／上傳者／上傳時間／狀態／目前成員，狀態值為「已有資料／待確認／需解析」。

本設計將此能力補上：讓知識庫可以有多個檔案來源，建立與更新共用同一個檔案勾選元件，但實作分兩個階段：Phase 1 先做「建立知識庫」，Phase 2 再做「更新知識庫」。

## 範圍

**這次要做：**
- `ResourceFile` 與 `KnowledgeVersion.sourceFiles` 支援多對多關係（一個檔案可屬於多個知識庫；一個知識庫版本可有多個來源檔）。
- 共用的多選檔案勾選元件（擴充現有 `ResourceFilePicker.vue`）。
- Phase 1：「建立知識庫」的兩個既有入口（共用檔案管理的「建立為知識內容」、知識庫頁面的「+ 新增知識」）升級為多檔。
- Phase 2：全新「更新知識庫」流程（新入口 + 新 Modal + 新 store action），沿用既有的 draft → 送審 → 審核通過 的版本狀態機。

**這次不做（YAGNI，明確排除）：**
- 多檔案內容的真正 AI 合成邏輯——AI 生成內容模擬（`simulateFileAiGeneration`）仍只依第一個檔案的副檔名決定內容樣板，這是既有 mock 機制的延伸，不是這次的重點。
- `CreateVersionModal.vue`（現有「建立新版本」，MINOR/MAJOR + 備註）與 `SourceUpdateModal.vue`（現有「偵測到來源檔案更新」被動流程）維持原樣，不合併、不修改。這次新增的「更新知識庫」是第三種、使用者主動發起、以「調整檔案成員」為目的的流程，三者並存。
- `KnowledgeEditor.vue` 裡「從共用檔案管理選取」按鈕的「功能開發中」stub 行為——這是前一版重新設計時的既定決策（見 `2026-08-14-visual-redesign-phase5-knowledge-base-design.md`），本次不動它。

## 資料模型變更

### `src/stores/resourceStore.ts`

```ts
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
  knowledgeIds: string[];               // 原本是 knowledgeId?: string，改為陣列且預設 []
  needsColumnConfirmation?: boolean;    // 新增：結構不明確需人工確認欄位型別
  showMoreOption?: boolean;
}
```

- 所有既有 mock 資料（`res1`~`res12`）補上 `knowledgeIds: []`（目前沒有任何一筆預先關聯知識庫，`markAsKnowledge` 只在使用者實際跑一次建立流程時於執行期呼叫）。
- `markAsKnowledge(fileId, knowledgeId)` 改名為 `addKnowledgeMembership(fileId, knowledgeId)`，語意改為 append 且去重：
  ```ts
  function addKnowledgeMembership(fileId: string, knowledgeId: string) {
    const file = getFileById(fileId);
    if (file && !file.knowledgeIds.includes(knowledgeId)) {
      file.knowledgeIds.push(knowledgeId);
    }
  }
  function removeKnowledgeMembership(fileId: string, knowledgeId: string) {
    const file = getFileById(fileId);
    if (file) file.knowledgeIds = file.knowledgeIds.filter(id => id !== knowledgeId);
  }
  ```
- `addFileFromUpload` 補上目前留空的擁有者欄位（比照 `knowledgeStore.ts` 既有的 `'Current User'` 慣例，非真實登入串接）：
  ```ts
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
  ```
- 新增衍生狀態標籤函式（純函式，供元件顯示用，不改變 `status` 本身語意）：
  ```ts
  export type KbSourceStatusLabel = '已有資料' | '待確認' | '需解析';

  export function getKbSourceStatusLabel(file: ResourceFile): KbSourceStatusLabel {
    if (file.needsColumnConfirmation) return '待確認';
    if (file.status === 'uploading' || file.status === 'parsing' || file.status === 'failed') return '需解析';
    return '已有資料'; // stored | saved
  }
  ```
- 新增可勾選判斷（多選情境用，比原本的 `isDisabled` 寬鬆）：
  ```ts
  export function isKbSourceSelectable(file: ResourceFile): boolean {
    return file.status !== 'failed';
  }
  ```
- Demo 資料調整：挑 1~2 筆既有 EXCEL/OTHER 類型檔案（例如 `res3` UGG2025商品總表.xlsx）加上 `needsColumnConfirmation: true`，讓「待確認」狀態在畫面上有實際案例可示範。

### `src/stores/knowledgeStore.ts`

`SourceFileRef` 型別不變：

```ts
export interface SourceFileRef {
  fileId: string
  fileName: string
  linkedVersion: number
}
```

`createFromFile` 參數簽名變更（唯一呼叫方 `CreateKnowledgeWizardModal.vue`）：

```ts
const createFromFile = (params: {
  files: { fileId: string; fileName: string }[]; // 原本是 fileId/fileName 兩個獨立欄位，改成陣列，至少 1 筆
  template: string;
  content: string;
  category: string;
}) => {
  const primary = params.files[0];
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const newId = `k-${Date.now()}`;
  const draftId = `v1.0-draft-${Date.now()}`;
  const baseName = primary.fileName.replace(/\.[^.]+$/, '');
  const sourceSummary = params.files.length > 1
    ? `由「${primary.fileName}」等 ${params.files.length} 個來源檔案生成的知識條目草稿`
    : `由「${primary.fileName}」生成的知識條目草稿`;

  const newKnowledge: KnowledgeItem = {
    // ...其餘欄位不變...
    versions: [{
      // ...其餘欄位不變...
      summary: sourceSummary,
      updateNote: params.files.length > 1
        ? `從共用檔案「${params.files.map(f => f.fileName).join('、')}」建立，使用模板：${params.template}`
        : `從共用檔案「${primary.fileName}」建立，使用模板：${params.template}`,
      sourceFiles: params.files.map(f => ({ fileId: f.fileId, fileName: f.fileName, linkedVersion: 1 })),
      // ...
    }],
  };

  knowledgeList.value.unshift(newKnowledge);
  return { knowledgeId: newId, versionId: draftId };
};
```

新增 Phase 2 用的 store action（比照 `createDraftFromPublished`/`createDraftFromSourceUpdate` 的版本遞增與草稿建立邏輯）：

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

`approveVersion` 擴充：生效時同步 `resourceStore` 的 `knowledgeIds` 成員關係（比對新生效版本與被取代的舊生效版本的 `sourceFiles` 差異）。這一段需要 `resourceStore`，因此透過參數注入（沿用 `createDraftFromSourceUpdate` 已有的「呼叫端注入 store 存取函式」寫法，避免 `knowledgeStore` 直接 import `resourceStore` 造成循環依賴）：

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

  // ...原本的 k.status / pipeline 處理邏輯不變...
};
```

實際呼叫端調整位置見下方「`ReviewDrawer.vue` 呼叫端調整」章節。

`createFromFile` 也在建立當下就呼叫 `addKnowledgeMembership`（因為新建立的知識庫第一版直接就是「事實」，沒有「取代舊生效版本」的問題，不需要等審核）——這件事發生在 `CreateKnowledgeWizardModal.vue` 的 `handleSubmit`，見下方 Phase 1 章節。

## 共用元件：`ResourceFilePicker.vue` 改為多選

`ResourceFilePicker.vue` 目前只有 `CreateKnowledgeWizardModal.vue` 一個呼叫方（`grep` 確認過）。這次升級後，Phase 1 的建立流程與 Phase 2 的更新流程都需要多選——沒有任何情境會用到單選。與其保留 `multiple` 開關讓單選分支永遠是死碼，不如直接把元件改成「永遠多選」，維持單一狀態流程、少一組條件分支（YAGNI）。

狀態：

```ts
const selectedFiles = ref<ResourceFile[]>([])   // 原本的 selectedFile（單選）整個移除
```

新增 `preselectedIds?: string[]` prop（Phase 2 用，開啟時預先勾選目前已是來源的檔案）：

```ts
const props = defineProps<{
  modelValue: boolean
  preselectedIds?: string[]
}>()
```

在既有的 `watch(() => props.modelValue, open => { if (open) {...} })` 重置區塊內，開啟時把 `selectedFiles` 初始化為 `preselectedIds` 對應的 `resourceList` 項目（無 `preselectedIds` 則為空陣列，即 Phase 1 的建立情境）。

表格欄位改為固定顯示：

| 欄位 | 資料來源 |
|---|---|
| 檔案名稱 | `file.fileName` |
| 類型 | `file.processType`（沿用既有 AI 解析/原始檔案徽章） |
| 上傳者 | `file.ownerName` |
| 上傳時間 | `file.lastModify.slice(0, 10)`（欄位標題文字由「最後更新」改為「上傳時間」） |
| 狀態 | `getKbSourceStatusLabel(file)` |
| 目前成員 | 依 `file.knowledgeIds` 算 `knowledgeStore.getKnowledgeById(id)?.title`；0 筆顯示「非成員」灰色 tag，≥1 筆顯示第一個標題 + `+N` |

勾選/停用邏輯改用 `isKbSourceSelectable(file)`（僅 `failed` 停用），取代原本的 `isDisabled`。

互動邏輯：

```ts
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
```

`emit` 型別：

```ts
const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'select', payload: { files: { fileId: string; fileName: string }[] }): void
}>()
```

表格列勾選 UI：每列前面加 checkbox（`<input type="checkbox" :checked="isSelected(file)" />`），視覺上維持現有 `.picker-row.is-selected` highlight 樣式，checkbox 為輔助視覺。「已選取」提示區改為顯示已選筆數與檔名清單（原本單選只顯示一筆）。

## Phase 1：建立知識庫（多檔）

### `CreateKnowledgeWizardModal.vue`

FILE 類型狀態從單一 `uploadedFile ref<File|null>` + `selectedLibraryFile ref<{fileId,fileName}|null>` 改為統一清單：

```ts
interface PickedFile { fileId: string; fileName: string; fromUpload: boolean }
const pickedFiles = ref<PickedFile[]>([])
```

- 上傳新檔：立即呼叫 `resourceStore.addFileFromUpload(file)`（沿用現有「上傳的檔案將同時儲存至共用檔案管理」行為，不再等到送出才存），把回傳結果 push 進 `pickedFiles`（`fromUpload: true`）。
- 從共用庫選取：`onPickerSelect` 改為接收 `{files}`，把每個檔案（排除已存在於 `pickedFiles` 的重複 `fileId`）push 進去（`fromUpload: false`）。
- `prefillFile`（來自共用檔案管理「建立為知識內容」）：在 `watch(isOpenModal, open => { if (open && props.prefillFile) pickedFiles.value = [{ fileId: props.prefillFile.fileId, fileName: props.prefillFile.fileName, fromUpload: false }] })` 開啟時預填為清單第一筆——使用者仍可透過「新增更多檔案」按鈕再加檔，這正是本次升級要達成的行為。
- UI：清單以卡片列表呈現，每列顯示檔名 + 副檔名圖示 + 移除按鈕（✕，至少保留 1 筆時允許移除其餘全部——不強制保留 prefill 檔案），清單下方保留「上傳」「從共用檔案管理選取」兩個加檔按鈕（可重複點擊多次）。
- `canSubmit`：FILE 分支從 `!!(uploadedFile.value || selectedLibraryFile.value)` 改為 `pickedFiles.value.length > 0`。
- `handleSubmit` 的 FILE 分支：

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

（原本 `prefillFile` 有獨立的 `if` 分支直接呼叫 `createFromFile`；因為 `prefillFile` 現在只是預填 `pickedFiles` 的第一筆，這個獨立分支可以整個刪除，統一走上面這條多檔路徑——`prefillFile` 存在與否只影響「來源類型選擇列是否隱藏」這一個既有的顯示邏輯，不再影響送出邏輯本身。）

- 表單重置（`watch(isOpenModal, open => { if (!open) {...} })`）：`uploadedFile.value = null; selectedLibraryFile.value = null` 兩行改為 `pickedFiles.value = []`。
- **移除 `'done'` emit**：`handleSubmit` 現在自己就會逐筆呼叫 `addKnowledgeMembership`，`(e: 'done', payload: { fileId: string; knowledgeId: string }): void` 這個 emit 宣告與兩處 `emit('done', ...)` 呼叫全部移除，改成統一由 modal 內部完成成員標記——避免同一件事在 modal 內外各做一次。連帶更新 `ResourceLibrary.vue:197` 的 `<CreateKnowledgeWizardModal @done="...">` 監聽器：移除 `@done` 這一行（它原本只做 `resourceStore.markAsKnowledge(fileId, knowledgeId)`，現在完全由 modal 內部處理，不再需要外部監聽）。

### 「+ 新增知識」入口（`KnowledgeBase.vue`）

不需要額外改動——它本來就是同一個 `CreateKnowledgeWizardModal.vue`（不帶 `prefillFile`），升級後自動支援多檔。

## Phase 2：更新知識庫（新流程）

### 入口：`ResourceLibrary.vue`

`page-banner` 的 `banner-right` 新增按鈕，緊鄰「上傳檔案」：

```html
<button class="custom-btn" @click="isUpdateSourcesModalOpen = true">
  <i class="material-symbols-outlined">sync_alt</i>
  更新知識庫
</button>
```

```ts
const isUpdateSourcesModalOpen = ref(false)
```

### 新元件：`src/components/Knowledge/UpdateKnowledgeSourcesModal.vue`

Props/emits：

```ts
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()
```

畫面流程（單一 Modal 內兩個區塊，非多步驟精靈，比照 `CreateKnowledgeWizardModal` 的單頁风格）：

1. **指定知識庫**：`<select>` 綁定 `selectedKnowledgeId`，選項為 `knowledgeStore.knowledgeList`（顯示 `title`＋`category`）。未選擇前，下方勾選區不顯示。
2. **勾選檔案來源**：選定知識庫後，顯示內嵌的 `ResourceFilePicker`（改成非 Modal-in-Modal的內嵌版本，或維持獨立 Modal、由本 Modal 觸發開啟——採用後者以複用現有元件結構不需拆分），帶入：
   ```html
   <ResourceFilePicker
     v-model="isPickerOpen"
     :preselected-ids="currentSourceFileIds"
     @select="onFilesSelected"
   />
   ```
   其中 `currentSourceFileIds` 為 `computed`：取 `selectedKnowledgeId` 對應知識庫的生效版本（`status === 'active'`，若無則取最後一筆）之 `sourceFiles.map(f => f.fileId)`。
3. 勾選確認後，本 Modal 顯示已選檔案清單（沿用 Phase 1 `pickedFiles` 相同的列表 UI：檔名 + 移除按鈕）。
4. Footer：「取消」／「送出更新」。送出呼叫：
   ```ts
   function handleSubmit() {
     if (!selectedKnowledgeId.value || pickedFiles.value.length === 0) return
     const versionId = knowledgeStore.createDraftFromMemberUpdate(
       selectedKnowledgeId.value,
       pickedFiles.value.map(f => ({
         fileId: f.fileId,
         fileName: f.fileName,
         linkedVersion: resourceStore.getFileById(f.fileId)?.version ?? 1,
       })),
     )
     emit('update:modelValue', false)
     popDialog.toast('已建立新版本草稿，請於編輯頁確認內容後送審', 3000)
     if (versionId) {
       router.push({ name: 'KnowledgeEditor', params: { knowledgeId: selectedKnowledgeId.value, versionId } })
     }
   }
   ```
5. 送出後 Modal 關閉、導向 `KnowledgeEditor`——與 `SourceUpdateModal.vue` 現有的 `handleCreateDraft` 導頁行為一致。**不**在此時更新 `resourceStore` 的 `knowledgeIds`（見上方「資料模型變更」章節說明：成員關係在 `approveVersion` 審核通過時才同步）。

提示文案（比照畫面稿「送出後將建立新版本，需經審核通過後才會啟用」）：

```html
<div class="update-sources-hint">
  <i class="material-symbols-outlined">info</i>
  送出後將建立新版本草稿，仍可在編輯頁調整內容；需經審核通過後才會正式啟用。
</div>
```

### `ReviewDrawer.vue` 呼叫端調整

目前唯一呼叫 `approveVersion` 的地方是 `src/components/Knowledge/ReviewDrawer.vue:169`（`knowledgeStore.approveVersion(props.knowledgeId, props.versionId)`）。改為：

```ts
import { useResourceStore } from '@/stores/resourceStore'
const resourceStore = useResourceStore()

knowledgeStore.approveVersion(props.knowledgeId, props.versionId, ({ added, removed, knowledgeId }) => {
  added.forEach(fileId => resourceStore.addKnowledgeMembership(fileId, knowledgeId))
  removed.forEach(fileId => resourceStore.removeKnowledgeMembership(fileId, knowledgeId))
})
```

## 測試計畫

沿用專案既有 vitest + `@vue/test-utils` 慣例（`src/**/__tests__/*.test.ts`）。

**Phase 1：**
- `resourceStore.test.ts`：`getKbSourceStatusLabel` 三種狀態對應、`isKbSourceSelectable` 排除 `failed`、`addKnowledgeMembership`/`removeKnowledgeMembership` 去重與移除、`addFileFromUpload` 補上 owner 欄位。
- `ResourceFilePicker.test.ts`（新建，元件目前無測試檔）：可複選多筆、`confirmSelect` emit `{files:[...]}`、`preselectedIds` 開啟時正確預勾選、`failed` 狀態列被禁用但 `uploading`/`parsing`/`needsColumnConfirmation` 可勾選、未選任何檔案時 `confirmSelect` 不 emit。
- `knowledgeStore.test.ts`：`createFromFile` 傳入多筆 `files` 時 `sourceFiles` 完整對應、`summary`/`updateNote` 依筆數切換文案。
- `CreateKnowledgeWizardModal.test.ts`（若無則新建）：`prefillFile` 開啟時 `pickedFiles` 預填且仍可加檔；FILE 送出時呼叫 `createFromFile` 帶正確 `files` 陣列與 `addKnowledgeMembership` 逐筆呼叫。

**Phase 2：**
- `knowledgeStore.test.ts`：`createDraftFromMemberUpdate` 版本號遞增、`status: 'draft'`、`k.status: 'pending'`；`approveVersion` 傳入 `syncMembership` 時正確算出 `added`/`removed` 差異並呼叫。
- `UpdateKnowledgeSourcesModal.test.ts`（新建）：選擇知識庫後正確帶出 `preselectedIds`；送出後呼叫 `createDraftFromMemberUpdate` 並導頁至 `KnowledgeEditor`。
- `ResourceLibrary.test.ts`（若存在則擴充，否則略過——確認新按鈕存在且能開啟 Modal 即可，不需詳盡覆蓋）。

## 修訂記錄

- 2026-08-20：初版設計。
