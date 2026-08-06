# 複製技能建立草稿狀態與內容警示 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 從 Library 技能庫或我的技能點擊「建立副本」後，新副本在「我的技能」內以「草稿」狀態呈現，且「已建立複本」彈窗會提示使用者：內容跟原技能完全相同，容易造成後續維運困難與 Agent 判斷失準，應修改後再使用；使用者實際編輯並儲存過內容後，狀態自動轉為「可使用」。

**Architecture:** 在既有 `Skill.personalStatus` union 新增 `'draft'` 值，`duplicateAsPersonalSkill()` 建立副本時設為 `'draft'`；兩條既有的個人技能內容更新路徑（`updateSkill()`、`sendEditChatMessage()`）在寫入內容後，若偵測到 `personalStatus === 'draft'` 就轉為 `'available'`。UI 端重用既有孤兒樣式 `.tag--draft` 顯示草稿標籤，並在既有「已建立複本」彈窗插入一段警示 banner。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Pinia、Vitest（單元測試）、SCSS（`src/scss/` 管理，禁止 `<style scoped>`）。

## Global Constraints

- 使用 `<script setup lang="ts">`，禁止 Options API（本次不新增元件，不受影響）。
- 樣式統一在 `src/scss/` 管理，禁止 `<style scoped>`。
- 新增 SCSS 需在對應 `_index.scss` `@forward`——本次不新增 scss 檔案，只修改既有 `_SkillDetailDrawer.scss`，不需要動 `_index.scss`。
- 不阻擋使用者在草稿狀態下送審或啟用技能，只做視覺提示，不做強制卡關。
- 不變動既有的 `hasSkillNameConflict` / `.name-conflict-banner`（skillName 重複警告）功能，那是獨立於本次「內容相同」警示的既有功能。
- 彈窗警示文案沿用設計文件（`docs/superpowers/specs/2026-08-06-duplicate-skill-draft-status-design.md`）已確認的措辭，不可自行改寫語意。

---

## Task 1: `personalStatus` 新增 `'draft'`，複製時建立草稿

**Files:**
- Modify: `src/stores/skillStore.ts:104`（`Skill.personalStatus` 型別）
- Modify: `src/stores/skillStore.ts:1199-1225`（`duplicateAsPersonalSkill`）
- Test: `src/stores/__tests__/skillStore.test.ts`（在既有 `describe('複製為個人技能與名稱衝突', ...)` 區塊內，約第 238-330 行之間新增 `it`）

**Interfaces:**
- Produces: `Skill['personalStatus']` 型別包含 `'draft'`；`duplicateAsPersonalSkill(sourceId: string): Skill` 回傳物件的 `personalStatus` 為 `'draft'`（原為 `'available'`）。後續 Task 2、Task 3 都依賴這個值存在且拼寫為 `'draft'`。

- [ ] **Step 1: 寫失敗測試**

在 `src/stores/__tests__/skillStore.test.ts` 的 `describe('複製為個人技能與名稱衝突', () => { ... })` 區塊內（緊接在既有的 `it('duplicateAsPersonalSkill 從 Library 技能建立新的個人技能...')` 之後）新增：

```ts
    it('duplicateAsPersonalSkill 建立的副本 personalStatus 為 draft（尚未修改，內容與原技能相同）', () => {
      const store = useSkillStore()
      const copy = store.duplicateAsPersonalSkill('sys-cs-001')
      expect(copy.personalStatus).toBe('draft')
    })
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npx vitest run src/stores/__tests__/skillStore.test.ts -t "personalStatus 為 draft"`
Expected: FAIL — 目前 `copy.personalStatus` 是 `'available'`，斷言 `toBe('draft')` 不成立。

- [ ] **Step 3: 實作最小變更**

`src/stores/skillStore.ts:104`，型別改為：

```ts
  personalStatus?: 'draft' | 'available' | 'reviewing' | 'has_library'
```

`src/stores/skillStore.ts:1199-1225`，`duplicateAsPersonalSkill` 內把 `personalStatus: 'available',` 改為：

```ts
      personalStatus: 'draft',
```

（只改這一行的值，函式其他部分維持不變。）

- [ ] **Step 4: 執行測試確認通過**

Run: `npx vitest run src/stores/__tests__/skillStore.test.ts`
Expected: PASS（含新測試與所有既有測試，確認沒有連帶破壞其他斷言，例如既有的 `submitPersonalSkill` 測試用的是 mock 資料裡本來就是 `'available'` 的 skill，不受影響）。

- [ ] **Step 5: Commit**

```bash
git add src/stores/skillStore.ts src/stores/__tests__/skillStore.test.ts
git commit -m "feat(skill-store): duplicated personal skills start as draft status

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: 草稿 → 可使用 的自動轉換

**Files:**
- Modify: `src/stores/skillStore.ts:1016-1025`（`updateSkill`）
- Modify: `src/stores/skillStore.ts:1432-1452`（`sendEditChatMessage`）
- Test: `src/stores/__tests__/skillStore.test.ts`（延續 Task 1 新增的區塊）

**Interfaces:**
- Consumes: Task 1 的 `personalStatus === 'draft'`。
- Produces: `updateSkill(id, data: UpdateSkillPayload)` 與 `sendEditChatMessage(skillId, message): Promise<void>` 在成功寫入內容後，若目標 skill 當下 `personalStatus === 'draft'`，會把它改為 `'available'`；非草稿狀態（`undefined`／`'available'`／`'reviewing'`／`'has_library'`）不受影響。

- [ ] **Step 1: 寫失敗測試**

在 `src/stores/__tests__/skillStore.test.ts` 同一個 `describe('複製為個人技能與名稱衝突', ...)` 區塊內新增三筆：

```ts
    it('updateSkill 更新草稿狀態的個人技能後，personalStatus 轉為 available', () => {
      const store = useSkillStore()
      const copy = store.duplicateAsPersonalSkill('sys-cs-001')
      expect(copy.personalStatus).toBe('draft')
      store.updateSkill(copy.id, {
        name: copy.name!,
        instructions: '已修改過的指令內容',
        triggerHint: copy.triggerHint ?? '',
        isEnabled: false,
        assignedAgents: [],
      })
      const updated = store.findSkill(copy.id)
      expect(updated?.personalStatus).toBe('available')
      expect(updated?.instructions).toBe('已修改過的指令內容')
    })

    it('updateSkill 對非草稿狀態的個人技能不會意外改動 personalStatus', () => {
      const store = useSkillStore()
      const skill = store.myPersonalSkills.find(s => s.personalStatus === 'available')!
      store.updateSkill(skill.id, {
        name: skill.name!,
        instructions: '再次修改',
        triggerHint: skill.triggerHint ?? '',
        isEnabled: skill.isEnabled ?? false,
        assignedAgents: [],
      })
      expect(store.findSkill(skill.id)?.personalStatus).toBe('available')
    })

    it('sendEditChatMessage 對草稿狀態的個人技能對話修改後，personalStatus 轉為 available', async () => {
      const store = useSkillStore()
      const copy = store.duplicateAsPersonalSkill('sys-cs-001')
      expect(copy.personalStatus).toBe('draft')
      await store.sendEditChatMessage(copy.id, '請幫我調整語氣')
      const updated = store.findSkill(copy.id)
      expect(updated?.personalStatus).toBe('available')
      expect(updated?.instructions).toContain('請幫我調整語氣')
    })
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npx vitest run src/stores/__tests__/skillStore.test.ts -t "personalStatus 轉為 available"`
Expected: FAIL —— `updateSkill` 與 `sendEditChatMessage` 目前都不會動 `personalStatus`，斷言 `toBe('available')` 不成立（維持 `'draft'`）。

- [ ] **Step 3: 實作最小變更**

`src/stores/skillStore.ts:1016-1025`，`updateSkill` 改為：

```ts
  function updateSkill(id: string, data: UpdateSkillPayload): void {
    const skill = findSkill(id)
    if (!skill) return
    skill.name = data.name
    if (data.description !== undefined) skill.description = data.description
    skill.instructions = data.instructions
    skill.triggerHint = data.triggerHint
    skill.isEnabled = data.isEnabled
    skill.assignedAgents = data.assignedAgents
    if (skill.personalStatus === 'draft') skill.personalStatus = 'available'
  }
```

`src/stores/skillStore.ts:1432-1452`，`sendEditChatMessage` 改為（只新增最後一段判斷，其餘不動）：

```ts
  async function sendEditChatMessage(skillId: string, message: string): Promise<void> {
    editChatIsRunning.value = true
    editChatHistory.value.push({
      id: `edit-msg-${Date.now()}`,
      role: 'user',
      content: message,
    })
    await new Promise(r => setTimeout(r, 900))

    const skill = findSkill(skillId)
    if (skill) {
      skill.instructions = `${skill.instructions ?? ''}\n\n（依對話更新）${message}`.trim()
      if (skill.personalStatus === 'draft') skill.personalStatus = 'available'
    }

    editChatHistory.value.push({
      id: `edit-msg-${Date.now() + 1}`,
      role: 'agent',
      content: `（Mock）已根據你的描述更新技能指令。你可以繼續補充，或關閉視窗完成修改。`,
    })
    editChatIsRunning.value = false
  }
```

- [ ] **Step 4: 執行測試確認通過**

Run: `npx vitest run src/stores/__tests__/skillStore.test.ts`
Expected: PASS（全部測試，含 Task 1、Task 2 新增的所有 it，且既有測試不受影響）。

- [ ] **Step 5: Commit**

```bash
git add src/stores/skillStore.ts src/stores/__tests__/skillStore.test.ts
git commit -m "feat(skill-store): auto-clear draft status once duplicated skill content is edited

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: UI 顯示「草稿」標籤

**Files:**
- Modify: `src/components/Skill/PersonalSkillGroup.vue:23-38`（`statusLabel` / `statusTagClass`）
- Modify: `src/components/Skill/SkillDetailDrawer.vue:400-417`（`personalStatusLabel` / `personalStatusClass`）

**Interfaces:**
- Consumes: Task 1 的 `personalStatus === 'draft'`。沿用既有 CSS class `.tag--draft`（已定義於 `src/scss/components/_SkillCard.scss:239`，本任務不新增樣式）。
- Produces: 「我的技能」清單與詳情頁，`personalStatus === 'draft'` 的技能會顯示文字為「草稿」、class 為 `tag--draft` 的標籤。

此任務為純 UI 顯示邏輯調整，專案內沒有既存的 Vue component 單元測試基礎設施（`find src -name "*.spec.ts" -o -name "*.test.ts"` 只涵蓋 store/util，沒有任何 `.vue` component test），因此本任務改用「型別檢查 + 手動驗證」取代自動化測試步驟。

- [ ] **Step 1: 修改 `PersonalSkillGroup.vue` 的狀態判斷**

`src/components/Skill/PersonalSkillGroup.vue:23-38` 改為：

```ts
const statusLabel = computed(() => {
  if (props.skill.personalStatus === 'draft') return '草稿'
  if (props.skill.personalStatus === 'reviewing') return '審核中'
  if (props.skill.personalStatus === 'has_library') {
    const scope = props.skill.targetScope
    if (scope === 'team') return `已有Library版（團隊・${props.skill.targetTeamName ?? '未指定團隊'}）`
    if (scope === 'enterprise') return '已有Library版（企業）'
    return '已有Library版'
  }
  return null
})

const statusTagClass = computed(() => {
  if (props.skill.personalStatus === 'draft') return 'tag--draft'
  if (props.skill.personalStatus === 'reviewing') return 'tag--reviewing'
  if (props.skill.personalStatus === 'has_library') return 'tag--has-library'
  return ''
})
```

- [ ] **Step 2: 修改 `SkillDetailDrawer.vue` 的狀態判斷**

`src/components/Skill/SkillDetailDrawer.vue:400-417` 改為：

```ts
const personalStatusLabel = computed(() => {
  const s = props.skill
  if (!s) return null
  if (s.personalStatus === 'draft') return '草稿'
  if (s.personalStatus === 'reviewing') return '審核中'
  if (s.personalStatus === 'has_library') {
    if (s.targetScope === 'team') return `已有Library版（團隊・${s.targetTeamName ?? '未指定團隊'}）`
    if (s.targetScope === 'enterprise') return '已有Library版（企業）'
    return '已有Library版'
  }
  return '可使用'
})

const personalStatusClass = computed(() => {
  const s = props.skill?.personalStatus
  if (s === 'draft') return 'tag--draft'
  if (s === 'reviewing') return 'tag--reviewing'
  if (s === 'has_library') return 'tag--has-library'
  return 'tag--available'
})
```

- [ ] **Step 3: 型別檢查**

Run: `npm run type-check`
Expected: 無錯誤（`personalStatus` 新增的 `'draft'` 分支型別相容，`Skill.personalStatus` 型別已在 Task 1 更新）。

- [ ] **Step 4: 手動驗證**

Run: `npm run dev`，開啟「技能管理」頁面：
1. 從「我的技能」任一技能詳情，點擊「複製」建立副本。
2. 確認「我的技能」清單中新副本顯示「草稿」標籤（灰色，沿用 `.tag--draft` 樣式）。
3. 開啟該副本詳情頁，確認「目前狀態」區塊也顯示「草稿」標籤。
4. 點擊「編輯」進入 `SkillEditor.vue` 儲存一次內容後，回到清單確認標籤消失（顯示為一般啟用/停用狀態，不再有草稿標籤）——這一步驗證 Task 2 的轉換邏輯與本任務的顯示邏輯串接正確。

- [ ] **Step 5: Commit**

```bash
git add src/components/Skill/PersonalSkillGroup.vue src/components/Skill/SkillDetailDrawer.vue
git commit -m "feat(skill-detail): show draft badge for duplicated personal skills

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: 「已建立複本」彈窗新增內容相同警示

**Files:**
- Modify: `src/views/SkillManagement.vue:268-269`（彈窗內容）
- Modify: `src/scss/components/_SkillDetailDrawer.scss:836-840`（在 `.confirm-icon` 區塊後新增 `.confirm-warning-banner`）

**Interfaces:**
- Consumes: 無新的程式介面依賴，純文案與樣式變更；此彈窗目前是 Library 瀏覽（`LibraryBrowseModal.vue` → `SkillCard.vue` → `handleDuplicate`）與我的技能詳情（`SkillDetailDrawer.vue` → `handleDuplicate`）兩個入口共用的同一段 template，改這一處即同時覆蓋兩個入口。
- Produces: 使用者點擊「建立副本」後看到的彈窗，在標題與「接下來想怎麼修改這份複本？」之間多一段警示文字。

- [ ] **Step 1: 在 `_SkillDetailDrawer.scss` 新增 banner 樣式**

`src/scss/components/_SkillDetailDrawer.scss:836-840`（`.confirm-icon` 區塊）後方插入：

```scss
  .confirm-icon {
    margin-bottom: 12px;
    .material-symbols-outlined { font-size: 36px; color: $color-danger; }
    &--update .material-symbols-outlined { color: $color_main_1; }
  }

  .confirm-warning-banner {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    background: rgba($color-warning-amber, 0.08);
    border: 1px solid rgba($color-warning-amber, 0.3);
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--text-muted);
    text-align: left;
    margin: 4px 0 12px;

    .material-symbols-outlined { font-size: 18px; color: $color-warning-amber; flex-shrink: 0; }
  }
```

（`.confirm-warning-banner` 巢狀在既有的 `.drawer-confirm-dialog { ... }` 規則內，緊接在 `.confirm-icon` 之後、`h4` 之前；`$color-warning-amber` 已定義在 `src/scss/base/_variables.scss:56`，這個檔案已經在使用 `$color_main_1`、`$color-danger` 等變數，不需要額外 `@use`/`@import`。）

- [ ] **Step 2: 在 `SkillManagement.vue` 彈窗插入警示 banner**

`src/views/SkillManagement.vue:268-269` 由：

```html
            <h4>已建立複本</h4>
            <p>接下來想怎麼修改這份複本？</p>
```

改為：

```html
            <h4>已建立複本</h4>
            <div class="confirm-warning-banner">
              <i class="material-symbols-outlined">info</i>
              這份複本內容目前與原技能完全相同。內容一模一樣的技能會讓後續維運難以區分，也可能造成 Agent 判斷失準，建議修改後再使用。
            </div>
            <p>接下來想怎麼修改這份複本？</p>
```

- [ ] **Step 3: 型別檢查與 lint**

Run: `npm run type-check && npm run lint`
Expected: 無錯誤（純 template/scss 變更，不影響型別；lint 確認 template 語法正確）。

- [ ] **Step 4: 手動驗證**

Run: `npm run dev`，分別測試兩個入口：
1. 「Library 技能庫」瀏覽 → 任一技能點擊「建立副本」→ 確認彈窗標題下方出現琥珀色警示 banner，文字為「這份複本內容目前與原技能完全相同...」，且 Library 瀏覽 modal 已關閉（不會擋住這個彈窗，此行為由既有的 `showLibraryModal.value = false` 保證，未受本次修改影響）。
2. 「我的技能」→ 任一技能詳情 → 點擊「複製」→ 確認同樣出現警示 banner。
3. 確認彈窗原有的「跟 Agent 對話修改」／「直接編輯」兩個按鈕與其行為未被改動。

- [ ] **Step 5: Commit**

```bash
git add src/views/SkillManagement.vue src/scss/components/_SkillDetailDrawer.scss
git commit -m "feat(SkillManagement): warn that duplicated skill content is identical to source

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```
