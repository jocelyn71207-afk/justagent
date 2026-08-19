# 附加檔案可編輯（更新／新增） Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓「詳情抽屜」跟「跟 Agent 對話修改」這兩個編輯入口都能新增／移除技能的附加檔案（「更新」＝移除舊檔＋新增新檔）。

**Architecture:** 在 `skillStore.ts` 新增一個只動 `files` 欄位的輕量 action `updateSkillFiles()`（含草稿自動轉可使用的判斷），兩個 Vue 元件各自重用既有的 `SkillFileUpload.vue` 元件呼叫這個 action：`SkillDetailDrawer.vue` 用「編輯／儲存／取消」的顯式切換態，`SkillEditChatModal.vue` 用常駐面板＋即時寫回。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Pinia、Vitest。

## Global Constraints

- 使用 `<script setup lang="ts">`，不用 Options API（CLAUDE.md）。
- 禁止 `<style scoped>`；樣式集中寫在對應的 `src/scss/components/_SkillDetailDrawer.scss`／`_SkillEditChatModal.scss`（兩個檔案都已被 `_index.scss` `@forward`，本次不新增 scss 檔案，不用改 index）。
- 所有 import 一律用 `@/` alias。
- 顏色一律用既有 CSS Custom Properties（`var(--text-faint)`、`var(--divider-a50)` 等），不寫死 hex。
- UI 文案用繁體中文，沿用既有詞彙：「附加檔案」「儲存」「取消」「編輯」。
- 新的 store action 命名為 `updateSkillFiles`，比對輔助函式命名為 `filesEqual`——後續任務的程式碼都要用這兩個確切名稱。
- 這個專案目前的慣例：Vitest 只測 `src/stores/`、`src/utils/`、`src/services/` 裡的邏輯（store action、pure function），沒有針對 Vue 元件的 mount 測試（`AI_RULES.md` 第 12 節；`SkillDetailDrawer.vue`／`SkillEditChatModal.vue` 過去的 UI 異動也都沒有加元件測試）。本計畫延續此慣例：Task 1（store）走 TDD，Task 2／3（Vue 元件模板與互動）用 `npm run type-check`＋`npm run lint`＋既有測試回歸＋手動操作驗證確認，不新增元件測試檔案。

---

### Task 1: Store — 新增 `updateSkillFiles()`

**Files:**
- Modify: `src/stores/skillStore.ts:1046-1059`（在 `updateSkill()` 之後新增函式）
- Modify: `src/stores/skillStore.ts:1541`（`return { ... }` 匯出清單，加入 `updateSkillFiles,`）
- Test: `src/stores/__tests__/skillStore.test.ts:421-475`（既有的「附加檔案 files」`describe` 區塊）

**Interfaces:**
- Consumes：既有的 `findSkill(id: string): Skill | undefined`、`Skill.files?: SkillFile[]`、`Skill.personalStatus?: 'draft' | 'available' | 'reviewing' | 'has_library'`、`Skill.derivedFrom?: string`。
- Produces：`updateSkillFiles(skillId: string, files: SkillFile[]): void`——供 Task 2（`SkillDetailDrawer.vue`）與 Task 3（`SkillEditChatModal.vue`）呼叫。呼叫方式：`skillStore.updateSkillFiles(skill.id, files)`（Task 2 用的 store 變數叫 `skillStore`）／`store.updateSkillFiles(skill.id, files)`（Task 3 用的 store 變數叫 `store`）。

- [ ] **Step 1: 寫失敗的測試**

在 `src/stores/__tests__/skillStore.test.ts` 的 `describe('附加檔案 files', ...)` 區塊內（第 474 行 `updateSkill 未帶 files...` 測試之後、第 475 行 `})` 之前）加入：

```ts
    it('updateSkillFiles 覆蓋技能的 files', () => {
      const store = useSkillStore()
      const file = { id: 'sf-3', fileName: 'sop.pdf', fileSize: 2048, fileType: 'PDF' as const, uploadedAt: '2026-08-19T00:00:00Z' }
      store.updateSkillFiles('ext-cs-return-001', [file])
      expect(store.findSkill('ext-cs-return-001')?.files).toEqual([file])
    })

    it('updateSkillFiles 傳入空陣列會清空技能的 files', () => {
      const store = useSkillStore()
      const file = { id: 'sf-4', fileName: 'sop.pdf', fileSize: 2048, fileType: 'PDF' as const, uploadedAt: '2026-08-19T00:00:00Z' }
      store.updateSkillFiles('ext-cs-return-001', [file])
      store.updateSkillFiles('ext-cs-return-001', [])
      expect(store.findSkill('ext-cs-return-001')?.files).toEqual([])
    })

    it('updateSkillFiles 對草稿狀態的個人技能新增檔案後，personalStatus 轉為 available', () => {
      const store = useSkillStore()
      const copy = store.duplicateAsPersonalSkill('sys-cs-001')
      expect(copy.personalStatus).toBe('draft')
      const file = { id: 'sf-5', fileName: 'rules.md', fileSize: 256, fileType: 'MD' as const, uploadedAt: '2026-08-19T00:00:00Z' }
      store.updateSkillFiles(copy.id, [file])
      expect(store.findSkill(copy.id)?.personalStatus).toBe('available')
    })

    it('updateSkillFiles 對草稿狀態的個人技能傳入跟來源一樣的空陣列時，personalStatus 保持 draft', () => {
      const store = useSkillStore()
      const copy = store.duplicateAsPersonalSkill('sys-cs-001')
      expect(copy.personalStatus).toBe('draft')
      store.updateSkillFiles(copy.id, [])
      expect(store.findSkill(copy.id)?.personalStatus).toBe('draft')
    })

    it('updateSkillFiles 對非草稿狀態的個人技能不會意外改動 personalStatus', () => {
      const store = useSkillStore()
      const skill = store.myPersonalSkills.find(s => s.personalStatus === 'available')!
      const file = { id: 'sf-6', fileName: 'faq.txt', fileSize: 128, fileType: 'TXT' as const, uploadedAt: '2026-08-19T00:00:00Z' }
      store.updateSkillFiles(skill.id, [file])
      expect(store.findSkill(skill.id)?.personalStatus).toBe('available')
    })
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npm run test:unit -- skillStore.test.ts`
Expected: FAIL — `store.updateSkillFiles is not a function`

- [ ] **Step 3: 實作 `filesEqual` 與 `updateSkillFiles`**

在 `src/stores/skillStore.ts` 的 `updateSkill()` 函式（結束於第 1059 行 `}`）之後加入：

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

在 `return { ... }` 匯出清單中，`updateSkill,`（第 1541 行）後面加一行：

```ts
    updateSkill,
    updateSkillFiles,
```

- [ ] **Step 4: 執行測試確認通過**

Run: `npm run test:unit -- skillStore.test.ts`
Expected: PASS，全部（含既有測試）green

- [ ] **Step 5: Commit**

```bash
git add src/stores/skillStore.ts src/stores/__tests__/skillStore.test.ts
git commit -m "feat(skill-store): add updateSkillFiles action for editing attached files"
```

---

### Task 2: `SkillDetailDrawer.vue` — 附加檔案直接編輯

**Files:**
- Modify: `src/components/Skill/SkillDetailDrawer.vue:380-387`（imports）
- Modify: `src/components/Skill/SkillDetailDrawer.vue:415`（新增 computed／state／函式）
- Modify: `src/components/Skill/SkillDetailDrawer.vue:154-164`（附加檔案 template 區塊）
- Modify: `src/scss/components/_SkillDetailDrawer.scss:268-278`（`.section-label` 所在區塊）
- Modify: `src/scss/components/_SkillDetailDrawer.scss:327-331`（`.af-size` 之後新增樣式）

**Interfaces:**
- Consumes：Task 1 的 `skillStore.updateSkillFiles(skillId: string, files: SkillFile[]): void`；既有的 `SkillFileUpload.vue`（`defineProps<{ modelValue: SkillFile[] }>()` / `defineEmits<{ 'update:modelValue': [files: SkillFile[]] }>()`，`v-model` 可直接綁）；既有的 `isPersonal` computed（`SkillDetailDrawer.vue:415`）。
- Produces：無其他任務依賴此元件內部狀態。

- [ ] **Step 1: 加 imports**

`src/components/Skill/SkillDetailDrawer.vue` 第 380-387 行，從：

```ts
import { ref, computed } from 'vue'
import type { Skill, SkillVersionStatus, OperationRecord } from '@/stores/skillStore'
import { useSkillStore } from '@/stores/skillStore'
import SkillVersionCompareModal from '@/components/Skill/SkillVersionCompareModal.vue'
import SkillMarkdownModal from '@/components/Skill/SkillMarkdownModal.vue'
import { skillFileIcon } from '@/components/Skill/skillFileUpload'
import { formatFileSize } from '@/utils/file'
```

改成：

```ts
import { ref, computed, watch } from 'vue'
import type { Skill, SkillVersionStatus, OperationRecord, SkillFile } from '@/stores/skillStore'
import { useSkillStore } from '@/stores/skillStore'
import SkillVersionCompareModal from '@/components/Skill/SkillVersionCompareModal.vue'
import SkillMarkdownModal from '@/components/Skill/SkillMarkdownModal.vue'
import SkillFileUpload from '@/components/Skill/SkillFileUpload.vue'
import { skillFileIcon } from '@/components/Skill/skillFileUpload'
import { formatFileSize } from '@/utils/file'
```

- [ ] **Step 2: 加 `canEditFiles` computed、編輯態 state 與函式**

第 415 行 `const isPersonal = computed(() => props.skill?.zone === 'personal')` 之後加入：

```ts

// ── 附加檔案：抽屜內直接編輯 ──────────────
const canEditFiles = computed(() => {
  if (!isPersonal.value) return true
  return props.skill?.personalStatus !== 'reviewing'
})

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

watch(() => props.skill?.id, () => { isEditingFiles.value = false })
```

- [ ] **Step 3: 改「附加檔案」template 區塊**

第 154-164 行，從：

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

改成：

```vue
              <!-- 附加檔案 -->
              <div v-if="skill.files?.length || canEditFiles" class="drawer-section">
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

- [ ] **Step 4: 加樣式**

`src/scss/components/_SkillDetailDrawer.scss` 第 268-278 行，從：

```scss
  .drawer-section {
    .section-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-faint);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }
  }
```

改成：

```scss
  .drawer-section {
    .section-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-faint);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }

    .section-label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;

      .section-label { margin-bottom: 0; }
    }
  }
```

在第 327-331 行（`.af-size` 區塊）之後加入：

```scss
  .section-edit-btn {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    border: 1px solid var(--divider-a50);
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    flex-shrink: 0;

    &:hover { background: var(--page-bg); color: var(--text); }
    .material-symbols-outlined { font-size: 14px; }
  }

  .section-edit-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 10px;
  }

  .section-empty-hint {
    color: var(--text-faint);
    font-size: 12.5px;
  }
```

- [ ] **Step 5: 型別檢查與 lint**

Run: `npm run type-check`
Expected: 無錯誤

Run: `npm run lint`
Expected: 無錯誤（如有自動修正的格式問題，確認 diff 合理後保留修正結果）

- [ ] **Step 6: 既有測試回歸**

Run: `npm run test:unit`
Expected: 全部 PASS（本任務沒有新增測試，但要確保沒改壞 `skillStore.test.ts` 或其他既有測試）

- [ ] **Step 7: 手動驗證**

用 `npm run dev` 開發模式打開技能管理頁：
1. 點一個「附加檔案」有資料的技能，開詳情抽屜，確認看到 pencil 編輯按鈕。
2. 點編輯按鈕，確認唯讀列表換成上傳元件＋「取消」「儲存」按鈕。
3. 拖曳或選一個新檔案加入，點「移除」刪掉一筆既有檔案，點「儲存」，確認抽屜換回唯讀態且列表內容更新為剛剛編輯後的結果。
4. 重新點編輯、改東西後點「取消」，確認唯讀列表沒有變化（草稿被捨棄）。
5. 點一個目前沒有附加檔案的技能，確認「附加檔案」區塊仍顯示（含「尚未附加檔案」文字＋編輯按鈕），編輯後新增一個檔案存檔，確認列表出現該筆檔案。
6. 找一個 `personalStatus === 'reviewing'`（送審中）的個人技能，確認「附加檔案」區塊沒有編輯按鈕。

- [ ] **Step 8: Commit**

```bash
git add src/components/Skill/SkillDetailDrawer.vue src/scss/components/_SkillDetailDrawer.scss
git commit -m "feat(SkillDetailDrawer): allow editing attached files inline"
```

---

### Task 3: `SkillEditChatModal.vue` — 對話式修改嵌入檔案面板

**Files:**
- Modify: `src/components/Skill/SkillEditChatModal.vue:22-38`（訊息串與輸入列之間新增面板 template）
- Modify: `src/components/Skill/SkillEditChatModal.vue:67-99`（imports、state、watch，涵蓋第 67-80 行的 import/props/state 區塊與第 94-99 行的 watch）
- Modify: `src/scss/components/_SkillEditChatModal.scss`（`.secm-messages` 與 `.secm-input-row` 之間新增樣式）

**Interfaces:**
- Consumes：Task 1 的 `store.updateSkillFiles(skillId: string, files: SkillFile[]): void`；既有的 `SkillFileUpload.vue`（本次改用 `:model-value` + `@update:model-value` 而不是 `v-model`，因為需要在 emit 當下同時更新本地 ref 跟寫回 store）。
- Produces：無其他任務依賴此元件內部狀態。

- [ ] **Step 1: 加 imports 與 `localFiles` state**

`src/components/Skill/SkillEditChatModal.vue` 第 67-80 行，從：

```ts
<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import type { Skill } from '@/stores/skillStore'
import { useSkillStore } from '@/stores/skillStore'

const props = defineProps<{ modelValue: boolean; skill: Skill | null }>()
const emit = defineEmits<{
  'update:modelValue': [boolean]
  done: []
}>()

const store = useSkillStore()
const inputText = ref('')
const messagesEl = ref<HTMLElement | null>(null)
```

改成：

```ts
<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import type { Skill, SkillFile } from '@/stores/skillStore'
import { useSkillStore } from '@/stores/skillStore'
import SkillFileUpload from '@/components/Skill/SkillFileUpload.vue'

const props = defineProps<{ modelValue: boolean; skill: Skill | null }>()
const emit = defineEmits<{
  'update:modelValue': [boolean]
  done: []
}>()

const store = useSkillStore()
const inputText = ref('')
const messagesEl = ref<HTMLElement | null>(null)
const localFiles = ref<SkillFile[]>([])
```

- [ ] **Step 2: 開啟 modal 時初始化 `localFiles`，並加上寫回 store 的函式**

第 94-99 行，從：

```ts
watch(() => props.modelValue, (open) => {
  if (open) {
    store.resetEditChat()
    inputText.value = ''
  }
})
```

改成：

```ts
watch(() => props.modelValue, (open) => {
  if (open) {
    store.resetEditChat()
    inputText.value = ''
    localFiles.value = [...(props.skill?.files ?? [])]
  }
})

function onFilesChange(files: SkillFile[]) {
  localFiles.value = files
  if (props.skill) store.updateSkillFiles(props.skill.id, files)
}
```

（用 `:model-value` + `@update:model-value` 而非 `v-model`，是因為需要在使用者新增/移除檔案的當下就寫回 store，不能只更新本地 ref。）

- [ ] **Step 3: 加入面板 template**

第 22-38 行，訊息串 `</div>`（第 37 行）跟輸入列 `<div class="secm-input-row">`（第 39 行）之間，從：

```vue
            <div v-if="store.editChatIsRunning" class="secm-bubble bubble--agent">
              <div class="bubble-label">AI Agent</div>
              <div class="bubble-typing"><span></span><span></span><span></span></div>
            </div>
          </div>

          <div class="secm-input-row">
```

改成：

```vue
            <div v-if="store.editChatIsRunning" class="secm-bubble bubble--agent">
              <div class="bubble-label">AI Agent</div>
              <div class="bubble-typing"><span></span><span></span><span></span></div>
            </div>
          </div>

          <div class="secm-files-panel">
            <div class="secm-files-label">附加檔案</div>
            <SkillFileUpload :model-value="localFiles" @update:model-value="onFilesChange" />
          </div>

          <div class="secm-input-row">
```

- [ ] **Step 4: 加樣式**

在 `src/scss/components/_SkillEditChatModal.scss` 的 `.secm-messages { ... }` 區塊（結束於 `}`，其後是 `.secm-empty { ... }`）跟 `.secm-input-row { ... }` 之間找一個位置，加入：

```scss
  .secm-files-panel {
    padding: 12px 20px;
    border-top: 1px solid var(--divider-a50);
    flex-shrink: 0;
  }

  .secm-files-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-faint);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }
```

- [ ] **Step 5: 型別檢查與 lint**

Run: `npm run type-check`
Expected: 無錯誤

Run: `npm run lint`
Expected: 無錯誤

- [ ] **Step 6: 既有測試回歸**

Run: `npm run test:unit`
Expected: 全部 PASS

- [ ] **Step 7: 手動驗證**

用 `npm run dev` 開發模式：
1. 對一個個人技能點「編輯」→「跟 Agent 對話修改」，確認訊息串下方、輸入框上方出現「附加檔案」面板與上傳元件。
2. 拖曳或選一個新檔案加入，確認列表立即顯示該筆檔案；關閉 modal 再重新打開同一顆技能的詳情抽屜，確認「附加檔案」區塊也看得到剛剛加的檔案（代表已即時寫回 store）。
3. 在面板中移除一筆檔案，確認立即從列表消失；重新打開詳情抽屜確認也同步消失。
4. 對一份草稿狀態（`personalStatus === 'draft'`）的個人技能只透過這個面板新增檔案（不打任何對話訊息），確認關閉 modal 後該技能的狀態標籤從「草稿」變成「可使用」。

- [ ] **Step 8: Commit**

```bash
git add src/components/Skill/SkillEditChatModal.vue src/scss/components/_SkillEditChatModal.scss
git commit -m "feat(SkillEditChatModal): allow managing attached files in chat-edit panel"
```
