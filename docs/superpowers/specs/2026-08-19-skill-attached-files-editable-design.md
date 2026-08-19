# 附加檔案可編輯（更新／新增）設計規格

**日期：** 2026-08-19
**範圍：** `skillStore.ts`、`SkillDetailDrawer.vue`、`SkillEditChatModal.vue`
**相關設計文件：** [2026-08-07-skill-attached-files-design.md](./2026-08-07-skill-attached-files-design.md)（本次要補上的是它「不在此次範圍」留下的編輯能力）

---

## 背景

[2026-08-07-skill-attached-files-design.md](./2026-08-07-skill-attached-files-design.md) 讓技能可以附加參考檔案，但落地後有兩個編輯入口沒有涵蓋到：

1. **詳情抽屜**（`SkillDetailDrawer.vue`）的「附加檔案」區塊是純顯示（`v-if="skill.files?.length"`），沒有編輯按鈕，沒檔案時整塊不出現，使用者要改檔案得跳去完整的 `SkillEditor` 精靈。
2. **「跟 Agent 對話修改」**（`SkillEditChatModal.vue`）是純文字聊天介面，`sendEditChatMessage()` 只會把訊息 append 到 `instructions`，完全沒有檔案管理能力。

「直接編輯」（`SkillEditor.vue` 精靈）裡的 `SkillFileUpload.vue` 其實已經能新增／移除檔案，且 `updateSkill()` 會直接覆寫 `skill.files`（不分 zone，不用經過審核流程）。本次不動這條既有路徑，只補上另外兩個入口，並讓「新增／移除」統一定義為「更新」的操作方式。

---

## 一、Store：新增輕量的 `updateSkillFiles()`

`SkillDetailDrawer.vue` 跟 `SkillEditChatModal.vue` 都只需要動 `files` 這一個欄位，不需要走完整的 `UpdateSkillPayload`（那需要 `name`／`instructions`／`triggerHint`／`assignedAgents` 等一整包欄位）。在 `skillStore.ts` 新增：

```ts
function filesEqual(a: SkillFile[], b: SkillFile[]): boolean {
  const key = (f: SkillFile) => `${f.fileName}::${f.fileSize}`
  const setA = new Set(a.map(key))
  const setB = new Set(b.map(key))
  if (setA.size !== setB.size) return false
  return [...setA].every(k => setB.has(k))
}

function updateSkillFiles(skillId: string, files: SkillFile[]): void {
  const skill = findSkill(skillId)
  if (!skill) return
  skill.files = files
  if (
    skill.personalStatus === 'draft' &&
    !filesEqual(files, findSkill(skill.derivedFrom ?? '')?.files ?? [])
  ) {
    skill.personalStatus = 'available'
  }
}
```

- `filesEqual` 用「檔名+大小」組成的 set 做順序無關比較，只用來判斷「有沒有異動」，不是完整的檔案身份比對。
- 草稿→可使用的自動轉換邏輯，比照 `updateSkill()` 現有對 `instructions` 的判斷方式（見 `skillStore.ts:1056`），只是比對對象換成檔案。因為 `duplicateAsPersonalSkill()` 建立草稿時 `files` 固定是 `[]`，只要草稿新增一個檔案就會判定為「有異動」而脫離草稿狀態。
- `updateSkillFiles` 加進 store 的 `return { ... }` 匯出清單。

---

## 二、詳情抽屜：附加檔案直接編輯

### 顯示條件與權限

新增 `canEditFiles` computed，沿用現有「編輯」按鈕的可見條件（`SkillDetailDrawer.vue:26-45`）：

```ts
const canEditFiles = computed(() => {
  if (!isPersonal.value) return true
  return props.skill?.personalStatus !== 'reviewing'
})
```

「附加檔案」區塊的顯示條件從 `v-if="skill.files?.length"` 改成：

```vue
<div v-if="skill.files?.length || canEditFiles" class="drawer-section">
```

— 有編輯權限時，即使目前沒有任何檔案也要顯示區塊（含空狀態提示＋新增入口），沒權限又沒檔案時才整塊隱藏。送審中的個人技能維持不可編輯，跟不可編輯內文的規則一致。

### 互動

```vue
<div class="drawer-section">
  <div class="section-label-row">
    <span class="section-label">附加檔案</span>
    <button
      v-if="canEditFiles && !isEditingFiles"
      class="section-edit-btn"
      @click="startEditFiles"
    >
      <i class="material-symbols-outlined">edit</i>
    </button>
  </div>

  <template v-if="isEditingFiles">
    <SkillFileUpload v-model="editFilesDraft" />
    <div class="section-edit-actions">
      <button class="custom-btn" @click="cancelEditFiles">取消</button>
      <button class="custom-btn custom-main-btn" @click="saveEditFiles">儲存</button>
    </div>
  </template>

  <template v-else>
    <div v-if="skill.files?.length" class="attached-file-list">
      <div v-for="f in skill.files" :key="f.id" class="attached-file-item">
        <i class="material-symbols-outlined">{{ skillFileIcon(f.fileType) }}</i>
        <span class="af-name">{{ f.fileName }}</span>
        <span class="af-size">{{ formatFileSize(f.fileSize) }}</span>
      </div>
    </div>
    <p v-else class="section-empty-hint">尚未附加檔案</p>
  </template>
</div>
```

```ts
const isEditingFiles = ref(false)
const editFilesDraft = ref<SkillFile[]>([])

function startEditFiles() {
  editFilesDraft.value = [...(props.skill?.files ?? [])]
  isEditingFiles.value = true
}

function cancelEditFiles() {
  isEditingFiles.value = false
}

function saveEditFiles() {
  if (!props.skill) return
  skillStore.updateSkillFiles(props.skill.id, editFilesDraft.value)
  isEditingFiles.value = false
}

// skill 切換（換一筆技能、或抽屜關閉重開）要重置編輯態，避免殘留上一筆的草稿
watch(() => props.skill?.id, () => { isEditingFiles.value = false })
```

「更新檔案」＝移除舊檔＋上傳新檔，直接沿用 `SkillFileUpload.vue` 既有的新增／移除互動（拖曳/點擊上傳、每筆列表項的移除鈕），不做「原地替換某一筆」的 UI，新檔案一律加到列表最後面。

### 樣式

`_SkillDetailDrawer.scss` 新增 `.section-label-row`（label 與 edit 按鈕同一行、`justify-content: space-between`）、`.section-edit-btn`（沿用 `.drawer-close-btn` 的圖示按鈕語彙但縮小尺寸，約 20px）、`.section-edit-actions`（靠右的儲存/取消按鈕列）、`.section-empty-hint`（比照 `.af-size` 的 faint 文字色，用於空狀態提示）。

---

## 三、對話式修改：嵌入檔案管理面板

`SkillEditChatModal.vue` 在訊息串（`.secm-messages`）跟輸入列（`.secm-input-row`）之間，加一個固定顯示的「附加檔案」小面板（不做收合，因為技能參考檔案通常只有 0~5 個，資訊量不大）：

```vue
<div class="secm-files-panel">
  <div class="section-label-row">
    <span class="section-label">附加檔案</span>
  </div>
  <SkillFileUpload v-model="localFiles" />
</div>
```

```ts
const localFiles = ref<SkillFile[]>([])

watch(() => props.modelValue, (open) => {
  if (open) {
    store.resetEditChat()
    inputText.value = ''
    localFiles.value = [...(props.skill?.files ?? [])]
  }
})

watch(localFiles, (files) => {
  if (props.skill) store.updateSkillFiles(props.skill.id, files)
}, { deep: true })
```

新增或移除檔案時**即時**寫回 store（跟聊天訊息送出後立刻 mutate `instructions` 的即時風格一致），不用等使用者按「完成修改」才存檔；`.secm-files-panel` 樣式沿用 `.secm-input-row` 的區塊間距與分隔線語彙。

---

## 不在此次範圍

- `SkillEditor.vue` 精靈內的「直接編輯」路徑不變動，它已經支援新增／移除檔案（沿用 `updateSkill()`，不是本次新增的 `updateSkillFiles()`）。
- 不做「原地替換某一筆檔案」的 UI（例如列表項旁邊放一顆「替換」按鈕直接選新檔換掉舊檔並保持原本排序）——「更新」統一等於「移除舊檔＋新增新檔」。
- Library／系統技能的檔案編輯權限，沿用既有「編輯」按鈕的可見規則，本次不重新設計技能的權限模型。
- 不處理 `SkillFileUpload.vue` 本身的驗證規則（檔案數量上限、大小限制、支援格式）——這些沿用 [2026-08-07 spec](./2026-08-07-skill-attached-files-design.md) 已定義的規則，本次不調整。
