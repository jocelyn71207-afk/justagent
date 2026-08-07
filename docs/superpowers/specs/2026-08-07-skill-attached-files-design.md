# 建立技能：附加所需檔案 設計規格

**日期：** 2026-08-07
**範圍：** `skillStore.ts`、新增 `SkillFileUpload.vue`、`SkillEditor.vue`、`SkillDetailDrawer.vue`
**相關設計文件：** 無

---

## 背景

建立/編輯技能時，使用者目前只能填寫技能名稱、指令、觸發時機、指派 Agent，沒有地方可以附上技能運作時參考用的檔案（例如庫存規則表、FAQ 範本、合約範本等）。技能詳情抽屜也沒有對應的地方可以看這些檔案。

本專案的 `skillStore.ts` 是純前端 mock store，沒有接後端 API；不採用 Knowledge 模組那套真的 attachment/S3 上傳流程，只記錄檔案 metadata（檔名、大小、類型），符合現有 mock 風格。

---

## 一、資料結構（`skillStore.ts`）

```ts
import type { FileType } from '@/utils/file'

export interface SkillFile {
  id: string
  fileName: string
  fileSize: number     // bytes
  fileType: FileType   // 沿用 utils/file.ts 既有的 FileType
  uploadedAt: string    // ISO 字串
}
```

以下型別各自加上 `files?: SkillFile[]`：
- `Skill`
- `DraftSkill`
- `CreateSkillPayload`
- `UpdateSkillPayload`

---

## 二、新元件 `SkillFileUpload.vue`（`src/components/Skill/`）

獨立元件，`v-model` 綁定 `SkillFile[]`，供 `SkillEditor.vue` 使用。

### 上傳區塊

視覺沿用 `AppBatchUpload.vue` step1 的語彙（虛線框＋`cloud_upload` icon＋提示文字＋按鈕），但縮小成 wizard 內的一個區塊，不是全螢幕 modal：

- 支援拖曳（`dragover`/`drop`）與點擊 `<input type="file" multiple>` 兩種方式選檔
- accept：`.pdf,.xlsx,.xls,.txt,.md,.doc,.docx`
- 提示文字說明支援格式與限制

### 驗證限制

直接呼叫既有的 `validateUploadFiles()`（`utils/file.ts`），帶入自訂限制（技能參考檔案通常較小，用比 Knowledge 批次上傳更輕量的上限）：

```ts
validateUploadFiles(newFiles, existingFiles, supportedTypes, {
  maxCount: 5,
  maxSingleSize: 20 * 1024 * 1024,   // 20MB
  maxTotalSize: 60 * 1024 * 1024,    // 60MB
})
```

`supportedTypes` = `pdfFileTypes` + `excelFileTypes` + `txtFileTypes` + `markdownFileTypes` + `wordFileTypes`（皆從 `utils/file.ts` 匯入）。驗證失敗時用 `popDialog.alert()` 顯示錯誤，沿用既有慣例。

### 檔案類型 → FileType 對應

依副檔名判斷（元件內部小型 map，不依賴 `aiviewerStore`）：

| 副檔名 | FileType |
|---|---|
| `.pdf` | `PDF` |
| `.xlsx` `.xls` | `EXCEL` |
| `.doc` `.docx` | `WORD` |
| `.txt` | `TXT` |
| `.md` | `MD` |

### 已選檔案列表

選檔後（無論拖曳或點擊）**立即**加入列表並顯示，不做假的上傳進度條模擬（因為沒有真的在傳）：

```
[類型圖示] 檔名   格式化大小(formatFileSize)   [刪除按鈕]
```

圖示對應（沿用 `FilePreviewModal.vue` 的圖示語彙）：

| FileType | Icon |
|---|---|
| `PDF` | `picture_as_pdf` |
| `EXCEL` | `table_chart` |
| `WORD` | `description` |
| `TXT` | `notes` |
| `MD` | `article` |
| 其他 | `insert_drive_file` |

刪除按鈕直接從 `v-model` 陣列移除該筆，不需二次確認。

### Props / Emits

```ts
defineProps<{ modelValue: SkillFile[] }>()
defineEmits<{ 'update:modelValue': [files: SkillFile[]] }>()
```

`id` 用 `` `sf-${Date.now()}-${Math.round(Math.random() * 1e6)}` `` 產生（沿用專案內其他 mock id 的產生方式）。

---

## 三、建立技能精靈整合（`SkillEditor.vue`）

併入 **Step1「技能指令」**，順序：技能指令 → 觸發時機 → **所需檔案（選填）** → 指派 Agent。

```vue
<div class="se-section">
  <label class="se-label">所需檔案（選填）</label>
  <p class="se-hint">上傳技能執行時需要參考的檔案，例如規則表、範本、FAQ 文件。</p>
  <SkillFileUpload v-model="form.files" />
</div>
```

`form.files` 初始值：

```ts
files: existingSkill?.files ?? existingDraft?.files ?? [] as SkillFile[],
```

**Step2 確認頁**新增一列：

```vue
<div class="se-confirm-row">
  <span class="se-confirm-key">所需檔案</span>
  <span class="se-confirm-val">
    <span v-if="form.files.length">{{ form.files.length }} 個檔案</span>
    <span v-else class="se-empty">（未上傳）</span>
  </span>
</div>
```

`handleSubmit()` 的 payload 加上 `files: [...form.files]`，三個分支（`updateDraft` / `updateSkill` / `createSkill`）都會自動帶到（`updateDraft` 本來就吃 `Partial<DraftSkill>`，不用改函式簽章）。

---

## 四、Store 串接（`skillStore.ts`）

```ts
function createSkill(data: CreateSkillPayload): void {
  skills.value.push({
    // ...現有欄位
    files: data.files ?? [],
  })
}

function updateSkill(id: string, data: UpdateSkillPayload): void {
  const skill = findSkill(id)
  if (!skill) return
  // ...現有賦值
  skill.files = data.files ?? []
}
```

---

## 五、詳情抽屜顯示（`SkillDetailDrawer.vue`）

新增「附加檔案」`drawer-section`，位置在「技能指令」之後、「覆蓋能力」之前，`v-if="skill.files?.length"`：

```vue
<div v-if="skill.files?.length" class="drawer-section">
  <div class="section-label">附加檔案</div>
  <div class="attached-file-list">
    <div v-for="f in skill.files" :key="f.id" class="attached-file-item">
      <i class="material-symbols-outlined">{{ fileTypeIcon(f.fileType) }}</i>
      <span class="af-name">{{ f.fileName }}</span>
      <span class="af-size">{{ formatFileSize(f.fileSize) }}</span>
    </div>
  </div>
</div>
```

純顯示、不可點擊下載（mock 沒有真實檔案內容）。圖示對應（`FileType` → icon 名稱）在 `SkillFileUpload.vue` 內定義成 `export function skillFileIcon(type: FileType): string`，`SkillDetailDrawer.vue` 直接 import 這個函式，避免兩處各自維護一份重複的 map。

---

## 不在此次範圍

- `SkillCard.vue`（列表/卡片）不顯示檔案數量提示 —— 使用者確認過只需要詳情抽屜顯示
- 不接真實後端／S3 上傳，`SkillFile` 沒有 `fileUrl`，無法下載或預覽檔案內容
- `CreateSkillModal.vue`（目前專案內沒有任何地方 import 使用的快速建立 modal）不處理
- 個人技能「複製」流程是否複製 `files` —— 沿用複製功能現有的完整複製語意（複製會整包複製 Skill 物件），不需要額外程式碼即可自然涵蓋，不特別測試
