# Spec: 知識彈窗整合共用檔案管理

**日期：** 2026-05-26
**功能：** 在「建立知識條目」彈窗中，新增從共用檔案管理選取檔案的入口；上傳新檔案時自動回存至共用檔案管理。

---

## 背景

目前「建立知識彈窗」（CreateKnowledgeWizardModal）的 FILE 模式只支援直接上傳檔案，且上傳後的檔案不會存入共用檔案管理（ResourceLibrary）。兩個模組之間的連結只有從 ResourceLibrary 頁面點「建立為知識內容」這一個方向。

本功能補足另一個方向：在建立知識流程中可選取共用庫現有檔案，且新上傳的檔案會自動同步進共用庫。

---

## 需求摘要

1. 在 FILE 上傳區下方加入「從共用檔案管理選取」次要按鈕
2. 點擊後開啟 ResourceFilePicker 子彈窗（單選）
3. 選完後回到原建立彈窗，顯示已選取狀態
4. 上傳新檔案時自動回存至共用庫，上傳區顯示提示文字

---

## 元件設計

### 新增：`ResourceFilePicker.vue`

**位置：** `src/components/Knowledge/ResourceFilePicker.vue`

**Props：**
```ts
modelValue: boolean        // v-model 控制顯示
```

**Emits：**
```ts
update:modelValue(false)               // 關閉
select(file: { fileId: string, fileName: string })  // 確認選取
```

**UI 結構：**
- `compModal`，寬度 700px，標題「選取共用檔案」
- 搜尋輸入（名稱模糊搜尋）
- 類型篩選 select（全部 / AI解析 / 原始檔案）
- 檔案清單（grid 表格）：檔名、類型 badge、狀態 badge、最後更新日期
- 單選：點擊列高亮，底部顯示「已選取：{fileName}」
- 狀態為 `uploading` / `parsing` 的檔案灰色且不可選
- 確認 / 取消按鈕

**資料來源：** `resourceStore.resourceList`（直接讀取，不另外呼叫 API）

---

### 修改：`CreateKnowledgeWizardModal.vue`

#### 新增 refs
```ts
const selectedLibraryFile = ref<{ fileId: string; fileName: string } | null>(null)
const showResourcePicker = ref(false)
```

#### FILE 模式 template 改動

上傳區下方（`uploadedFile` 為 null 時）加入：
```
ℹ️ 上傳的檔案將同時儲存至共用檔案管理
— 或 —
[🗄 從共用檔案管理選取]  ← 次要按鈕
```

`selectedLibraryFile` 有值時，用綠色「已選取」框取代上傳拖曳區：
```
✅ {fileName}
來自共用檔案管理
[更換]  ← 清除 selectedLibraryFile，重新顯示上傳區
```

加入 `<ResourceFilePicker v-model="showResourcePicker" @select="onPickerSelect" />`

#### `onPickerSelect` 處理器
```ts
function onPickerSelect(file: { fileId: string; fileName: string }) {
  selectedLibraryFile.value = file
  uploadedFile.value = null    // 若之前已上傳檔案，一併清除
  showResourcePicker.value = false
}
```

#### `canSubmit` 邏輯
```ts
// FILE 模式
case 'FILE':
  return !!(uploadedFile.value || selectedLibraryFile.value || prefillFile)
```

#### `handleSubmit` 分支
```ts
if (selectedSourceType.value === 'FILE') {
  if (prefillFile) {
    // 現有邏輯不變
    knowledgeStore.createFromFile({ fileId: prefillFile.fileId, ... })
  } else if (selectedLibraryFile.value) {
    // 從共用庫選取
    knowledgeStore.createFromFile({ fileId: selectedLibraryFile.value.fileId, ... })
  } else if (uploadedFile.value) {
    // 上傳新檔 → 先回存共用庫
    const { id, fileName } = resourceStore.addFile(uploadedFile.value)
    knowledgeStore.createFromFile({ fileId: id, fileName, ... })
  }
}
```

#### 重置邏輯（close / reset）
```ts
selectedLibraryFile.value = null
showResourcePicker.value = false
```

---

### 修改：`resourceStore`

#### `addFile(file: File)` 擴充

目前 `addFile` 只接受 metadata。需擴充為接受 `File` 物件，在 store 內建立完整的 `ResourceFile` 紀錄：

```ts
addFile(file: File): { id: string; fileName: string } {
  const newEntry: ResourceFile = {
    id: `res-${Date.now()}`,
    fileName: file.name,
    fileType: deriveFileType(file.name),  // 從副檔名推導：pdf / docx / xlsx
    processType: 'RAW',
    status: 'stored',
    creatorType: 'USER',
    ownerId: '',   // mock：實際應取自 authStore 或 userStore
    lastModify: new Date().toISOString(),
    version: 1,
    fileUrl: '',   // 實際 S3 upload URL（目前為 mock，填空字串）
  }
  this.resourceList.unshift(newEntry)
  return { id: newEntry.id, fileName: newEntry.fileName }
}
```

---

## 資料流

### 上傳新檔案
```
用戶拖曳/選取 file
  → uploadedFile = File
  → 提示文字顯示「將同時儲存至共用檔案管理」
  → handleSubmit
    → resourceStore.addFile(file) → { id, fileName }
    → knowledgeStore.createFromFile({ fileId: id, fileName, category, tags })
    → pipeline 模擬啟動
    → 導向 KnowledgeEditor
```

### 從共用庫選取
```
點擊「從共用檔案管理選取」
  → showResourcePicker = true
  → ResourceFilePicker 開啟
  → 用戶搜尋 / 篩選 / 點選列
  → 點「確認選取」
    → emit select({ fileId, fileName })
    → selectedLibraryFile = { fileId, fileName }
    → showResourcePicker = false
  → wizard 顯示綠色「已選取」框
  → handleSubmit
    → knowledgeStore.createFromFile({ fileId, fileName, category, tags })
    → pipeline 模擬啟動
    → 導向 KnowledgeEditor
```

### 從 ResourceLibrary 進入（現有流程，不變）
```
ResourceLibrary 點「建立為知識內容」
  → CreateKnowledgeWizardModal 帶 prefillFile prop
  → 顯示 prefill 狀態（現有邏輯）
  → knowledgeStore.createFromFile(...)
```

---

## 邊界條件

| 情境 | 處理 |
|------|------|
| picker 內「處理中」狀態的檔案 | 灰色、不可點選 |
| 先選了共用庫檔案，再點「更換」 | 清除 selectedLibraryFile，恢復上傳區 |
| 先上傳了檔案，再點「從共用庫選取」 | 確認選取後清除 uploadedFile，改用 selectedLibraryFile |
| resourceStore.resourceList 為空 | picker 顯示「目前共用庫沒有檔案」空狀態 |
| 關閉彈窗後重新開啟 | selectedLibraryFile / uploadedFile 一併重置 |

---

## 不在此次範圍

- 實際 S3 上傳（addFile 維持 mock 行為）
- 共用庫 picker 的分頁（list 直接顯示 resourceStore 所有資料）
- 多選
