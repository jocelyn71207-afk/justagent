# 建立副本命名步驟 + 編輯按鈕統一流程 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 點「複製」時先讓使用者確認/修改新副本的顯示名稱（預設沿用來源技能名稱，並在偵測到撞名時提醒）；個人技能的「編輯」按鈕改成跟複製完成後一樣，先彈出「跟 Agent 對話修改／直接編輯」的選擇對話框（Library 技能編輯行為不變）。

**Architecture:** 工作目錄裡已經有一份未提交、獨立完成的「命名對話框」實作（`pendingDuplicateSource`/`pendingDuplicateName`/`wouldSkillNameConflict` 等），設計細節跟原始規劃有兩處差異。Task 1 把這份既有實作調整成符合定案的兩個細節（移除取消按鈕、參數名改為 `nameOverride`），驗證後乾淨地 commit 起來。Task 2 在此基礎上，把原本「複製後選擇修改方式」的狀態（`duplicatedSkill`/`showEditChatForDuplicate`）改名並泛化成 `editChoiceSkill`，讓「複製完成」與「個人技能編輯按鈕」兩個入口共用同一個對話框。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Pinia、Vitest（單元測試）、SCSS（`src/scss/` 管理，禁止 `<style scoped>`）。

## Global Constraints

- 使用 `<script setup lang="ts">`，禁止 Options API。
- 樣式統一在 `src/scss/` 管理，禁止 `<style scoped>`；本次只修改既有 `_SkillDetailDrawer.scss`，不新增 scss 檔案。
- Library 技能（`zone !== 'personal'`）的編輯行為維持原樣：直接 `router.push('/view/SkillEditor', { skillId })`，不套用新的選擇對話框。
- `wouldSkillNameConflict` 只是資訊性提醒，不會擋下「確認」按鈕；命名對話框只驗證「非空白」，不做其他名稱唯一性檢查。
- `hasSkillNameConflict`／`skillName` 的既有 lineage 邏輯不可被本次變動影響——使用者自訂的顯示名稱只寫入 `name`，不寫入 `skillName`。
- 警示 banner（「這份複本內容目前與原技能完全相同...」）只在 `personalStatus === 'draft'` 時顯示，文案逐字沿用既有版本，不可改寫。
- 命名對話框只有一個「確認」按鈕，沒有「取消」按鈕；取消動作只透過點擊背景（overlay）達成。

---

## Task 1: 調整既有命名對話框，使其符合定案細節

**背景（實作者需知道，不在原始碼裡）：** 工作目錄裡已經有一份未提交的命名對話框實作，跟這個任務要達成的目標**幾乎一樣**，只差兩個地方：(a) 目前 store 函式的第二個參數叫 `overrideName`，需要改名為 `nameOverride`；(b) 命名對話框裡目前有一顆「取消」按鈕，需要移除（保留點擊背景可取消的行為，但拿掉對話框內的取消按鈕元素）。**這個任務不是從零開始寫，是修改現有程式碼的這兩處。**

**Files:**
- Modify: `src/stores/skillStore.ts`（`duplicateAsPersonalSkill` 函式簽名與函式內文，`function duplicateAsPersonalSkill(sourceId: string, overrideName?: string)` 所在區塊；`wouldSkillNameConflict` 函式維持不動）
- Modify: `src/views/SkillManagement.vue`（命名對話框 template 裡的「取消」`<button>`）
- Test: `src/stores/__tests__/skillStore.test.ts`（既有測試已經涵蓋這個函式的行為，不需要新增測試，只需要確認測試名稱/內容跟參數改名後仍然一致）
- Include as-is in this task's commit (不需要修改內容，本來就是目前工作目錄裡已存在、跟這個任務無關但同批次的既有改動): `src/components/Skill/SkillDetailDrawer.vue`、`src/scss/components/_SkillDetailDrawer.scss`（個人技能按鈕版面重排到 header，跟本任務相容，一起收尾即可，Step 7 有說明）

**Interfaces:**
- Produces: `store.duplicateAsPersonalSkill(sourceId: string, nameOverride?: string): Skill`（參數名稱從 `overrideName` 改為 `nameOverride`，行為不變：省略或傳入純空白字串時 `name` 沿用來源技能，否則使用 trim 過的輸入值）。`store.wouldSkillNameConflict(sourceId: string): boolean` 維持原樣，不用改。Task 2 會使用這兩個函式名稱，需要保持不變。

- [ ] **Step 1: 找到並確認目前的實作內容**

Run: `grep -n "function duplicateAsPersonalSkill\|overrideName" src/stores/skillStore.ts`

Expected 看到類似（實際行號可能不同，以你 grep 到的為準）：

```ts
function duplicateAsPersonalSkill(sourceId: string, overrideName?: string): Skill {
  const source = findSkill(sourceId)
  if (!source) throw new Error(`duplicateAsPersonalSkill: source not found (${sourceId})`)
  const copy: Skill = {
    id: `personal-${Date.now()}`,
    name: overrideName?.trim() || source.name,
    ...
```

- [ ] **Step 2: 確認既有測試現況（作為修改前的基準）**

Run: `npx vitest run src/stores/__tests__/skillStore.test.ts`
Expected: PASS（全部通過——這是修改前的基準，改名不應該讓任何測試變成需要更新斷言內容，因為測試呼叫函式時用的是「位置參數」，不是具名參數，例如 `store.duplicateAsPersonalSkill('sys-cs-001', '客服機器人（我的版本）')`，改參數名字不影響呼叫端）。

- [ ] **Step 3: 把參數名從 `overrideName` 改為 `nameOverride`**

`src/stores/skillStore.ts`，把：

```ts
  function duplicateAsPersonalSkill(sourceId: string, overrideName?: string): Skill {
```

改為：

```ts
  function duplicateAsPersonalSkill(sourceId: string, nameOverride?: string): Skill {
```

並把函式內文裡對應的：

```ts
      name: overrideName?.trim() || source.name,
```

改為：

```ts
      name: nameOverride?.trim() || source.name,
```

（函式其他部分——`description` 到最後的 `return copy`——完全不動，`wouldSkillNameConflict` 函式也完全不動。）

- [ ] **Step 4: 移除命名對話框的「取消」按鈕**

Run: `grep -n "cancelPendingDuplicate\|confirm-actions" src/views/SkillManagement.vue`，找到命名對話框（`<h4>建立副本</h4>` 那個對話框）裡的 `<div class="confirm-actions">` 區塊，目前內容類似：

```html
            <div class="confirm-actions">
              <button class="custom-btn" @click="cancelPendingDuplicate">取消</button>
              <button
                class="custom-btn custom-main-btn"
                :disabled="!pendingDuplicateName.trim()"
                @click="confirmPendingDuplicate"
              >
                <i class="material-symbols-outlined">check_circle</i>確認
              </button>
            </div>
```

把「取消」那顆 `<button>` 整個刪掉，改為：

```html
            <div class="confirm-actions">
              <button
                class="custom-btn custom-main-btn"
                :disabled="!pendingDuplicateName.trim()"
                @click="confirmPendingDuplicate"
              >
                <i class="material-symbols-outlined">check_circle</i>確認
              </button>
            </div>
```

**不要刪除 `cancelPendingDuplicate()` 這個函式本身**——它還被對話框的 `@click.self="cancelPendingDuplicate"`（點擊背景 overlay）用到，只是不再由按鈕觸發。

- [ ] **Step 5: 執行測試確認沒有破壞任何東西**

Run: `npx vitest run src/stores/__tests__/skillStore.test.ts`
Expected: PASS（跟 Step 2 的結果一致，因為改名跟移除按鈕都不影響 store 測試的斷言）。

Run: `npm run type-check`
Expected: 無錯誤（確認 `SkillManagement.vue` 裡沒有殘留任何指向已刪除按鈕但語法不完整的片段，以及 `overrideName` 沒有留下任何殘留參照——`grep -n "overrideName" src/stores/skillStore.ts src/views/SkillManagement.vue` 應該完全沒有輸出）。

- [ ] **Step 6: 手動驗證**

Run: `npm run dev`：
1. 從「Library 技能庫」或「我的技能」點「建立副本」→ 確認彈出命名對話框，裡面只有一個「確認」按鈕，沒有「取消」按鈕。
2. 點對話框外的背景（overlay）→ 確認對話框關閉、沒有建立任何新副本。
3. 對一個已經有其他個人副本的來源技能點「建立副本」→ 確認看到撞名提醒 banner（「你已經有一份來自「XXX」的技能了...」）。
4. 修改輸入框的名稱後點「確認」→ 確認新副本使用輸入的名稱，且流程能繼續往下走到「已建立複本」對話框（這一步驟的下游還沒改，維持現狀即可，不用特別驗證下游對話框的細節，那是 Task 2 的範圍）。

- [ ] **Step 7: Commit**

```bash
git add src/stores/skillStore.ts src/views/SkillManagement.vue src/scss/components/_SkillDetailDrawer.scss src/components/Skill/SkillDetailDrawer.vue
git commit -m "feat(SkillManagement): confirm display name before creating a skill duplicate

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

（這個 commit 也會一併收進工作目錄裡本來就存在、跟命名對話框同一批未提交的 `_SkillDetailDrawer.scss` 與 `SkillDetailDrawer.vue` 改動——那是個人技能按鈕版面重排到 header 的既有調整，跟這個任務相容，一起 commit 乾淨收尾。**在執行 `git add` 前，先跑一次 `git status --short`，確認這四個檔案是目前唯一被修改的檔案**——如果看到其他不相關的檔案也被列出來，先停下來回報，不要一起 commit。）

---

## Task 2: 統一「選擇修改方式」對話框（複製完成 + 個人技能編輯共用）

**Files:**
- Modify: `src/views/SkillManagement.vue`（「複製後：選擇修改方式」對話框 template；`duplicatedSkill`/`showEditChatForDuplicate` 狀態；`handleEdit`、`confirmPendingDuplicate`、`handleDuplicateDirectEdit`/`handleDuplicateChatEdit`/`closeDuplicateChatEdit` 這幾個函式）

**Interfaces:**
- Consumes: Task 1 的 `store.duplicateAsPersonalSkill(sourceId: string, nameOverride?: string): Skill`（這個任務不用直接呼叫它，但 `confirmPendingDuplicate` 內部已經呼叫過了，這裡只是接手它呼叫完之後的結果）。
- Produces: `editChoiceSkill: Ref<Skill | null>`、`editChoiceIsFreshDuplicate: Ref<boolean>`——這個任務是這兩個 ref 的唯一產生者與消費者，沒有後續任務依賴它們。

- [ ] **Step 1: 狀態改名/新增**

`src/views/SkillManagement.vue`，找到：

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

找到「複製後：選擇修改方式」這一段（`<!-- 複製後：選擇修改方式 -->` 註解開始，到對應的 `<SkillEditChatModal ... />` 結束），目前內容：

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

- [ ] **Step 3: `handleEdit` 分流**

找到：

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

- [ ] **Step 4: `confirmPendingDuplicate` 改接新狀態**

找到（Task 1 完成後，命名對話框確認後呼叫的函式）：

```ts
function confirmPendingDuplicate() {
  if (!pendingDuplicateSource.value) return
  const copy = store.duplicateAsPersonalSkill(pendingDuplicateSource.value.id, pendingDuplicateName.value)
  cancelPendingDuplicate()
  duplicatedSkill.value = copy
}
```

把最後一行改為：

```ts
function confirmPendingDuplicate() {
  if (!pendingDuplicateSource.value) return
  const copy = store.duplicateAsPersonalSkill(pendingDuplicateSource.value.id, pendingDuplicateName.value)
  cancelPendingDuplicate()
  editChoiceSkill.value = copy
  editChoiceIsFreshDuplicate.value = true
}
```

- [ ] **Step 5: 改名剩餘三個 handler**

找到：

```ts
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

- [ ] **Step 6: 型別檢查**

Run: `npm run type-check`
Expected: 無錯誤。確認沒有殘留任何 `duplicatedSkill`、`handleDuplicateDirectEdit`、`handleDuplicateChatEdit`、`closeDuplicateChatEdit` 的參照：

Run: `grep -n "duplicatedSkill\b\|handleDuplicateDirectEdit\|handleDuplicateChatEdit\|closeDuplicateChatEdit" src/views/SkillManagement.vue`
Expected: 沒有輸出。

- [ ] **Step 7: 手動驗證**

Run: `npm run dev`：
1. 從「我的技能」點一個**已經編輯過、非草稿狀態**的個人技能 → 點「編輯」→ 確認彈出「編輯技能」對話框，**沒有**警示 banner，說明文字是「接下來想怎麼修改「XXX」？」。
2. 從「我的技能」點一個仍是**草稿狀態**的個人技能 → 點「編輯」→ 確認彈出對話框，**有**警示 banner。
3. 從 Library 技能點「編輯」→ 確認直接進入 SkillEditor，完全沒有經過任何對話框。
4. 從任一技能點「複製」→ 命名對話框確認名稱後 → 確認接續彈出「已建立複本」對話框，且有警示 banner（因為新副本一定是 draft）。
5. 在「已建立複本」對話框點「跟 Agent 對話修改」→ 確認 `SkillEditChatModal` 正常開啟並綁定正確的技能。

- [ ] **Step 8: Commit**

```bash
git add src/views/SkillManagement.vue
git commit -m "feat(SkillManagement): unify edit-choice dialog for duplicate and personal-skill edit

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```
