# 建立副本命名步驟 + 編輯按鈕統一流程 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 點「複製」時先讓使用者確認/修改新副本的名稱（預設沿用來源技能名稱）；個人技能的「編輯」按鈕改成跟複製完成後一樣，先彈出「跟 Agent 對話修改／直接編輯」的選擇對話框（Library 技能編輯行為不變）。

**Architecture:** `duplicateAsPersonalSkill` 新增可選的 `nameOverride` 參數（store 層，向後相容）。UI 層把原本「複製後選擇修改方式」的狀態（`duplicatedSkill`/`showEditChatForDuplicate`）改名並泛化成 `editChoiceSkill`，讓「複製完成」與「個人技能編輯按鈕」兩個入口共用同一個對話框；再在複製流程前面插入一個新的「命名複本」對話框作為第一步。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Pinia、Vitest（單元測試）、SCSS（`src/scss/` 管理，禁止 `<style scoped>`）。

## Global Constraints

- 使用 `<script setup lang="ts">`，禁止 Options API（本次不新增元件，不受影響）。
- 樣式統一在 `src/scss/` 管理，禁止 `<style scoped>`；本次只修改既有 `_SkillDetailDrawer.scss`，不新增 scss 檔案，不需要動 `_index.scss`。
- Library 技能（`zone !== 'personal'`）的編輯行為維持原樣：直接 `router.push('/view/SkillEditor', { skillId })`，不套用新的選擇對話框。
- 命名對話框只做「非空白」驗證，不做名稱唯一性檢查，跟 `SkillEditor.vue` 現有的驗證強度一致。
- `hasSkillNameConflict`／`skillName` 的 lineage 邏輯不可被本次變動影響——使用者自訂的顯示名稱只寫入 `name`，不寫入 `skillName`。
- 警示 banner（「這份複本內容目前與原技能完全相同...」）只在 `personalStatus === 'draft'` 時顯示，文案逐字沿用既有版本，不可改寫。

---

## Task 1: Store 層 — `duplicateAsPersonalSkill` 新增可選的 `nameOverride` 參數

**Files:**
- Modify: `src/stores/skillStore.ts:1202-1226`（`duplicateAsPersonalSkill`）
- Test: `src/stores/__tests__/skillStore.test.ts`（在既有 `describe('複製為個人技能與名稱衝突', ...)` 區塊內，緊接在 `it('duplicateAsPersonalSkill 建立的副本 personalStatus 為 draft...')` 之後，約第 250-255 行之間）

**Interfaces:**
- Produces: `duplicateAsPersonalSkill(sourceId: string, nameOverride?: string): Skill` —— 第二個參數可省略；省略或傳入純空白字串時，回傳物件的 `name` 等同現在行為（沿用來源技能的 `name`）；傳入非空白字串時，回傳物件的 `name` 為該字串（trim 過）。`skillName` 完全不受 `nameOverride` 影響。後續 Task 3 會呼叫這個函式並帶入使用者輸入的名稱。

- [ ] **Step 1: 寫失敗測試**

在 `src/stores/__tests__/skillStore.test.ts` 的 `describe('複製為個人技能與名稱衝突', () => { ... })` 區塊內，緊接在 `duplicateAsPersonalSkill 建立的副本 personalStatus 為 draft` 這個 `it` 之後，新增：

```ts
    it('duplicateAsPersonalSkill 傳入 nameOverride 時，副本 name 使用該值', () => {
      const store = useSkillStore()
      const copy = store.duplicateAsPersonalSkill('sys-cs-001', '我的客服機器人')
      expect(copy.name).toBe('我的客服機器人')
      expect(copy.skillName).toBe('通用客服機器人') // skillName 不受 nameOverride 影響，仍是 lineage 名稱
    })

    it('duplicateAsPersonalSkill 不傳 nameOverride 時，副本 name 沿用來源技能名稱（行為不變）', () => {
      const store = useSkillStore()
      const copy = store.duplicateAsPersonalSkill('sys-cs-001')
      expect(copy.name).toBe('通用客服機器人')
    })

    it('duplicateAsPersonalSkill 傳入純空白 nameOverride 時，視為未輸入，name 仍沿用來源技能名稱', () => {
      const store = useSkillStore()
      const copy = store.duplicateAsPersonalSkill('sys-cs-001', '   ')
      expect(copy.name).toBe('通用客服機器人')
    })
```

- [ ] **Step 2: 執行測試確認第一筆失敗**

Run: `npx vitest run src/stores/__tests__/skillStore.test.ts -t "nameOverride 時，副本 name 使用該值"`
Expected: FAIL — `duplicateAsPersonalSkill` 目前只接受一個參數，`copy.name` 會是 `'通用客服機器人'`（來源名稱）而不是 `'我的客服機器人'`，斷言 `toBe('我的客服機器人')` 不成立。

- [ ] **Step 3: 實作最小變更**

`src/stores/skillStore.ts:1202-1226`，把：

```ts
  function duplicateAsPersonalSkill(sourceId: string): Skill {
    const source = findSkill(sourceId)
    if (!source) throw new Error(`duplicateAsPersonalSkill: source not found (${sourceId})`)
    const copy: Skill = {
      id: `personal-${Date.now()}`,
      name: source.name,
```

改為：

```ts
  function duplicateAsPersonalSkill(sourceId: string, nameOverride?: string): Skill {
    const source = findSkill(sourceId)
    if (!source) throw new Error(`duplicateAsPersonalSkill: source not found (${sourceId})`)
    const copy: Skill = {
      id: `personal-${Date.now()}`,
      name: nameOverride?.trim() || source.name,
```

（函式其他部分——`description` 到最後的 `return copy`——完全不動。）

- [ ] **Step 4: 執行測試確認通過**

Run: `npx vitest run src/stores/__tests__/skillStore.test.ts`
Expected: PASS（全部測試，含新增的 3 筆，且既有測試不受影響——特別是既有的「從 Library 技能建立...」「從個人技能複製時...」等測試都沒有傳第二個參數，維持原行為）。

- [ ] **Step 5: Commit**

```bash
git add src/stores/skillStore.ts src/stores/__tests__/skillStore.test.ts
git commit -m "feat(skill-store): duplicateAsPersonalSkill accepts optional name override

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: UI — 統一「選擇修改方式」對話框（複製完成 + 個人技能編輯共用）

**Files:**
- Modify: `src/views/SkillManagement.vue:256-291`（對話框 template）
- Modify: `src/views/SkillManagement.vue:439-440`（狀態 ref 改名/新增）
- Modify: `src/views/SkillManagement.vue:512-556`（`handleEdit`、`handleDuplicate`、`handleDuplicateDirectEdit`/`handleDuplicateChatEdit`/`closeDuplicateChatEdit` 改名與分流）

**Interfaces:**
- Consumes: `store.duplicateAsPersonalSkill` 既有簽名（這個任務先不用 Task 1 的 `nameOverride`，`handleDuplicate` 暫時還是只傳一個參數，行為跟現在完全一樣，只是把結果放進新命名的 ref）。
- Produces: `editChoiceSkill: Ref<Skill | null>`、`editChoiceIsFreshDuplicate: Ref<boolean>` —— 後續 Task 3 的 `confirmDuplicateName()` 會設定這兩個 ref（`editChoiceSkill.value = copy`、`editChoiceIsFreshDuplicate.value = true`）。`handleDirectEdit()`／`handleChatEdit()`／`closeChatEdit()` 這三個函式名稱與行為在這個任務定案，Task 3 不會再改它們。

- [ ] **Step 1: 狀態 ref 改名/新增**

`src/views/SkillManagement.vue:439-440`，把：

```ts
const duplicatedSkill = ref<Skill | null>(null)
const showEditChatForDuplicate = ref(false)
```

改為：

```ts
const editChoiceSkill = ref<Skill | null>(null)
const editChoiceIsFreshDuplicate = ref(false)
const showEditChatForDuplicate = ref(false)
```

- [ ] **Step 2: 對話框 template 改寫**

`src/views/SkillManagement.vue:256-291`，把整段：

```html
    <!-- 複製後：選擇修改方式 -->
    <Teleport to="body">
      <Transition name="confirm-fade">
        <div
          v-if="duplicatedSkill && !showEditChatForDuplicate"
          class="drawer-confirm-overlay"
          @click.self="duplicatedSkill = null"
        >
          <div class="drawer-confirm-dialog">
            <div class="confirm-icon confirm-icon--update">
              <i class="material-symbols-outlined">content_copy</i>
            </div>
            <h4>已建立複本</h4>
            <div class="confirm-warning-banner">
              <i class="material-symbols-outlined">info</i>
              這份複本內容目前與原技能完全相同。內容一模一樣的技能會讓後續維運難以區分，也可能造成 Agent 判斷失準，建議修改後再使用。
            </div>
            <p>接下來想怎麼修改這份複本？</p>
            <div class="confirm-actions confirm-actions--column">
              <button class="custom-btn" @click="handleDuplicateChatEdit">
                <i class="material-symbols-outlined">forum</i>跟 Agent 對話修改
              </button>
              <button class="custom-btn custom-main-btn" @click="handleDuplicateDirectEdit">
                <i class="material-symbols-outlined">edit</i>直接編輯
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <SkillEditChatModal
      v-model="showEditChatForDuplicate"
      :skill="duplicatedSkill"
      @done="closeDuplicateChatEdit"
    />
```

改為：

```html
    <!-- 選擇修改方式：複製完成後，或點個人技能的「編輯」 -->
    <Teleport to="body">
      <Transition name="confirm-fade">
        <div
          v-if="editChoiceSkill && !showEditChatForDuplicate"
          class="drawer-confirm-overlay"
          @click.self="editChoiceSkill = null"
        >
          <div class="drawer-confirm-dialog">
            <div class="confirm-icon confirm-icon--update">
              <i class="material-symbols-outlined">content_copy</i>
            </div>
            <h4>{{ editChoiceIsFreshDuplicate ? '已建立複本' : '編輯技能' }}</h4>
            <div v-if="editChoiceSkill.personalStatus === 'draft'" class="confirm-warning-banner">
              <i class="material-symbols-outlined">info</i>
              這份複本內容目前與原技能完全相同。內容一模一樣的技能會讓後續維運難以區分，也可能造成 Agent 判斷失準，建議修改後再使用。
            </div>
            <p>
              {{ editChoiceIsFreshDuplicate ? '接下來想怎麼修改這份複本？' : `接下來想怎麼修改「${editChoiceSkill.name}」？` }}
            </p>
            <div class="confirm-actions confirm-actions--column">
              <button class="custom-btn" @click="handleChatEdit">
                <i class="material-symbols-outlined">forum</i>跟 Agent 對話修改
              </button>
              <button class="custom-btn custom-main-btn" @click="handleDirectEdit">
                <i class="material-symbols-outlined">edit</i>直接編輯
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <SkillEditChatModal
      v-model="showEditChatForDuplicate"
      :skill="editChoiceSkill"
      @done="closeChatEdit"
    />
```

- [ ] **Step 3: Handler 改名與分流**

`src/views/SkillManagement.vue:512-556`，把：

```ts
function handleEdit(skill: Skill) {
  router.push({ path: '/view/SkillEditor', query: { skillId: skill.id } })
}
```

改為：

```ts
function handleEdit(skill: Skill) {
  if (skill.zone !== 'personal') {
    router.push({ path: '/view/SkillEditor', query: { skillId: skill.id } })
    return
  }
  detailSkillId.value = null
  showLibraryModal.value = false
  editChoiceSkill.value = skill
  editChoiceIsFreshDuplicate.value = false
}
```

把：

```ts
function handleDuplicate(skill: Skill) {
  const copy = store.duplicateAsPersonalSkill(skill.id)
  detailSkillId.value = null
  showLibraryModal.value = false
  duplicatedSkill.value = copy
}

function handleDuplicateDirectEdit() {
  if (!duplicatedSkill.value) return
  router.push({ path: '/view/SkillEditor', query: { skillId: duplicatedSkill.value.id } })
  duplicatedSkill.value = null
}

function handleDuplicateChatEdit() {
  showEditChatForDuplicate.value = true
}

function closeDuplicateChatEdit() {
  showEditChatForDuplicate.value = false
  duplicatedSkill.value = null
}
```

改為：

```ts
function handleDuplicate(skill: Skill) {
  const copy = store.duplicateAsPersonalSkill(skill.id)
  detailSkillId.value = null
  showLibraryModal.value = false
  editChoiceSkill.value = copy
  editChoiceIsFreshDuplicate.value = true
}

function handleDirectEdit() {
  if (!editChoiceSkill.value) return
  router.push({ path: '/view/SkillEditor', query: { skillId: editChoiceSkill.value.id } })
  editChoiceSkill.value = null
}

function handleChatEdit() {
  showEditChatForDuplicate.value = true
}

function closeChatEdit() {
  showEditChatForDuplicate.value = false
  editChoiceSkill.value = null
}
```

（這個任務先不動 `handleDuplicate` 呼叫 `duplicateAsPersonalSkill` 的參數個數——Task 3 會再改一次，把它從「立刻複製」改成「先開命名對話框」。這裡只把結果放進改名後的 `editChoiceSkill`/`editChoiceIsFreshDuplicate`。）

- [ ] **Step 4: 型別檢查**

Run: `npm run type-check`
Expected: 無錯誤。特別確認沒有殘留任何 `duplicatedSkill`、`handleDuplicateDirectEdit`、`handleDuplicateChatEdit`、`closeDuplicateChatEdit` 的參照（`grep -n "duplicatedSkill\|handleDuplicateDirectEdit\|handleDuplicateChatEdit\|closeDuplicateChatEdit" src/views/SkillManagement.vue` 應該完全沒有輸出）。

- [ ] **Step 5: 手動驗證**

Run: `npm run dev`：
1. 從「我的技能」點一個**已經編輯過、非草稿狀態**的個人技能 → 點「編輯」→ 確認彈出「編輯技能」對話框，**沒有**警示 banner，說明文字是「接下來想怎麼修改「XXX」？」。
2. 從「我的技能」點一個仍是**草稿狀態**的個人技能 → 點「編輯」→ 確認彈出對話框，**有**警示 banner。
3. 從 Library 技能點「編輯」→ 確認直接進入 SkillEditor，完全沒有經過任何對話框（跟改動前行為一致）。
4. 從任一技能點「複製」→ 確認流程跟改動前一樣（立刻建立副本 + 彈出「已建立複本」對話框 + 警示 banner，因為新副本一定是 draft），這一步驟這個 Task 還沒有加命名步驟，先確認沒有回歸。

- [ ] **Step 6: Commit**

```bash
git add src/views/SkillManagement.vue
git commit -m "feat(SkillManagement): unify edit-choice dialog for duplicate and personal-skill edit

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: UI — 新增「命名複本」對話框（複製流程的新第一步）

**Files:**
- Modify: `src/views/SkillManagement.vue`（新增狀態、新增 template、改寫 `handleDuplicate`、新增 `confirmDuplicateName`）
- Modify: `src/scss/components/_SkillDetailDrawer.scss`（新增 `.confirm-dialog-input` 樣式）

**Interfaces:**
- Consumes: Task 1 的 `store.duplicateAsPersonalSkill(sourceId: string, nameOverride?: string): Skill`；Task 2 的 `editChoiceSkill`、`editChoiceIsFreshDuplicate`。
- Produces: `duplicateNamePrompt: Ref<{ source: Skill; name: string } | null>`、`confirmDuplicateName(): void`。

- [ ] **Step 1: 在 `_SkillDetailDrawer.scss` 新增 input 樣式**

`src/scss/components/_SkillDetailDrawer.scss`，在 `.confirm-warning-banner { ... }` 區塊（結束於 `}`，緊接在 `h4 { ... }` 之前）後面插入：

```scss
  .confirm-dialog-input {
    width: 100%;
    margin-bottom: 20px;
  }
```

放在 `.confirm-warning-banner` 之後、`h4` 之前，一樣巢狀在 `.drawer-confirm-dialog { ... }` 規則內。

- [ ] **Step 2: 新增狀態**

`src/views/SkillManagement.vue`，在 `const editChoiceSkill = ref<Skill | null>(null)` 這一行之前新增：

```ts
const duplicateNamePrompt = ref<{ source: Skill; name: string } | null>(null)
```

- [ ] **Step 3: 新增「命名複本」對話框 template**

`src/views/SkillManagement.vue`，在「選擇修改方式」對話框（`<!-- 選擇修改方式：複製完成後，或點個人技能的「編輯」 -->` 那段 `<Teleport>`）**之前**插入：

```html
    <!-- 複製前：命名複本 -->
    <Teleport to="body">
      <Transition name="confirm-fade">
        <div
          v-if="duplicateNamePrompt"
          class="drawer-confirm-overlay"
          @click.self="duplicateNamePrompt = null"
        >
          <div class="drawer-confirm-dialog">
            <div class="confirm-icon confirm-icon--update">
              <i class="material-symbols-outlined">content_copy</i>
            </div>
            <h4>命名複本</h4>
            <p>幫這份複本取個名稱，預設沿用原技能名稱。</p>
            <input
              v-model="duplicateNamePrompt.name"
              class="custom-input confirm-dialog-input"
              maxlength="40"
              autofocus
            />
            <div class="confirm-actions">
              <button
                class="custom-btn custom-main-btn"
                :disabled="!duplicateNamePrompt.name.trim()"
                @click="confirmDuplicateName"
              >
                建立複本
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

```

- [ ] **Step 4: 改寫 `handleDuplicate`，新增 `confirmDuplicateName`**

把（Task 2 留下的版本）：

```ts
function handleDuplicate(skill: Skill) {
  const copy = store.duplicateAsPersonalSkill(skill.id)
  detailSkillId.value = null
  showLibraryModal.value = false
  editChoiceSkill.value = copy
  editChoiceIsFreshDuplicate.value = true
}
```

改為：

```ts
function handleDuplicate(skill: Skill) {
  detailSkillId.value = null
  showLibraryModal.value = false
  duplicateNamePrompt.value = { source: skill, name: skill.name }
}

function confirmDuplicateName() {
  if (!duplicateNamePrompt.value || !duplicateNamePrompt.value.name.trim()) return
  const copy = store.duplicateAsPersonalSkill(
    duplicateNamePrompt.value.source.id,
    duplicateNamePrompt.value.name,
  )
  duplicateNamePrompt.value = null
  editChoiceSkill.value = copy
  editChoiceIsFreshDuplicate.value = true
}
```

- [ ] **Step 5: 型別檢查**

Run: `npm run type-check`
Expected: 無錯誤。

- [ ] **Step 6: 手動驗證**

Run: `npm run dev`：
1. 從「Library 技能庫」瀏覽任一技能 → 點「建立副本」→ 確認**先**彈出「命名複本」對話框，input 預設值＝該技能的名稱，游標自動聚焦在輸入框。
2. 清空輸入框 → 確認「建立複本」按鈕變成 disabled。
3. 輸入框填回文字、改成自訂名稱（例如「我的測試機器人」）→ 點「建立複本」→ 確認命名對話框關閉，緊接著彈出「已建立複本」對話框（含警示 banner，因為新副本是 draft）。
4. 到「我的技能」列表確認新副本的名稱是剛輸入的「我的測試機器人」，不是原技能名稱。
5. 再從「我的技能」詳情點「複製」→ 這次在命名對話框**不修改**，直接點「建立複本」→ 確認新副本名稱跟來源技能一致（驗證預設值路徑）。
6. 點命名對話框的背景（overlay）→ 確認對話框關閉、且**沒有**任何新副本被建立（回到「我的技能」列表數量不變）。

- [ ] **Step 7: Commit**

```bash
git add src/views/SkillManagement.vue src/scss/components/_SkillDetailDrawer.scss
git commit -m "feat(SkillManagement): prompt for a name before creating a skill duplicate

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```
