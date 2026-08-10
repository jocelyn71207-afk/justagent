# 建立副本命名步驟 + 編輯按鈕統一流程 — 設計文件

日期：2026-08-07（2026-08-10 修訂）

## 背景

延續 [2026-08-06-duplicate-skill-draft-status-design.md](./2026-08-06-duplicate-skill-draft-status-design.md) 的「複製技能建立草稿狀態」功能，現在要補兩個相關的使用體驗調整：

1. 目前點「複製」會立刻建立副本，新副本的 `name` 直接沿用來源技能，使用者完全沒機會在建立當下就取個不同的名稱，只能等進了編輯器才改。
2. 目前「複製」完成後會彈出「選擇修改方式」對話框（跟 Agent 對話修改／直接編輯），但個人技能的「編輯」按鈕是直接導向 SkillEditor，兩個入口的體驗不一致。

**2026-08-10 修訂說明：** 進入實作前發現工作目錄裡已有一份未提交、獨立完成的第 1 項需求實作（`pendingDuplicateSource`/`pendingDuplicateName`/`wouldSkillNameConflict` 等），設計細節跟本文件原始版本不完全一致。跟使用者確認後，改為**以既有實作為基礎**，只調整兩個地方使其符合原始決策，其餘（包含一個原文件沒設計過的預判撞名提醒）維持既有實作，本文件對應段落已更新為實際採用的設計。

## 目標

- 點「複製」時，先讓使用者確認／修改新副本的名稱，預設值是來源技能的名稱。
- 個人技能的「編輯」按鈕改成跟複製完成後一樣，先問「接下來想怎麼修改？」，讓使用者選擇跟 Agent 對話修改或直接編輯。
- Library 技能的編輯行為不變（直接進 SkillEditor），因為 Library 技能沒有草稿/個人化的概念，也不適用 `SkillEditChatModal` 的對話式修改設計。

## 非目標

- 不改變 `hasSkillNameConflict`（skillName 重複偵測，用於編輯畫面的既有提示）的邏輯或觸發時機。
- 不改變草稿狀態的判定與清除邏輯（沿用既有的 `personalStatus === 'draft'` 與內容比對機制）。
- 不改變 `SkillDetailDrawer.vue` 已經完成的按鈕版面重排（個人技能的測試/編輯/送審按鈕移至 header，跟 Library 技能共用同一排）——這是既有 WIP 的一部分，跟本次兩個需求相容，維持現狀即可。

## 設計

### 1. Store：`duplicateAsPersonalSkill` 新增可選的名稱參數 + 建立前的撞名預判

`src/stores/skillStore.ts`：

```ts
function duplicateAsPersonalSkill(sourceId: string, nameOverride?: string): Skill {
  const source = findSkill(sourceId)
  if (!source) throw new Error(`duplicateAsPersonalSkill: source not found (${sourceId})`)
  const copy: Skill = {
    id: `personal-${Date.now()}`,
    name: nameOverride?.trim() || source.name,
    description: source.description,
    type: source.type,
    origin: 'manually_created',
    creationMethod: source.creationMethod,
    zone: 'personal',
    personalStatus: 'draft',
    skillName: source.zone === 'personal' ? source.skillName : source.name,
    derivedFrom: sourceId,
    derivedFromVersion: source.version,
    version: source.version,
    isEnabled: false,
    usageCount: 0,
    testPassRate: 0,
    avgLatencyMs: 0,
    instructions: source.instructions,
    triggerHint: source.triggerHint,
    capabilities: source.capabilities ? [...source.capabilities] : undefined,
  }
  myPersonalSkillsRef.value.unshift(copy)
  return copy
}
```

`nameOverride` 是可選參數，不傳或傳純空白字串都等同現在行為（`name: source.name`）——所有既有呼叫處與既有測試不需要改。`skillName` 完全不受影響，仍綁定 lineage（來源技能），不會因為使用者自訂顯示名稱而跑掉「是否已有同來源副本」的偵測。

**額外新增 `wouldSkillNameConflict`**——這是原設計沒有的功能，用於命名對話框在「建立之前」就預判使用者是否已經有一份同來源的副本，讓提醒盡早出現（比既有的 `hasSkillNameConflict` 更早一步，那個是建立後、進編輯畫面才顯示）：

```ts
// 複製前的名稱衝突檢查——用來源技能推算出「複製後會得到的 skillName」，
// 在還沒真正建立副本、副本也還沒出現在列表前，就先讓使用者知道要不要改名。
function wouldSkillNameConflict(sourceId: string): boolean {
  const source = findSkill(sourceId)
  if (!source) return false
  const proposedSkillName = source.zone === 'personal' ? source.skillName : source.name
  if (!proposedSkillName) return false
  return myPersonalSkillsRef.value.some(s => !s.deletedAt && s.skillName === proposedSkillName)
}
```

需要 export 出去（加入 `return { ... }` 物件），供 `SkillManagement.vue` 使用。

### 2. UI：「命名複本」對話框（複製流程的新第一步）

點「複製」不再立刻建立副本，改成先彈出命名對話框：

`src/views/SkillManagement.vue` 狀態：

```ts
const pendingDuplicateSource = ref<Skill | null>(null)
const pendingDuplicateName = ref('')
const pendingDuplicateConflict = computed(() =>
  pendingDuplicateSource.value ? store.wouldSkillNameConflict(pendingDuplicateSource.value.id) : false
)
```

`handleDuplicate(skill)`：

```ts
function handleDuplicate(skill: Skill) {
  detailSkillId.value = null
  showLibraryModal.value = false
  pendingDuplicateSource.value = skill
  pendingDuplicateName.value = skill.name
}

function cancelPendingDuplicate() {
  pendingDuplicateSource.value = null
  pendingDuplicateName.value = ''
}
```

對話框（沿用 `.drawer-confirm-overlay` / `.drawer-confirm-dialog` 既有樣式語言，`@click.self` 點背景可關閉不建立；**對話框本身只有一個確認按鈕，沒有「取消」按鈕**——取消動作只透過點背景達成，跟其他既有對話框的習慣一致）：

```html
<Teleport to="body">
  <Transition name="confirm-fade">
    <div
      v-if="pendingDuplicateSource"
      class="drawer-confirm-overlay"
      @click.self="cancelPendingDuplicate"
    >
      <div class="drawer-confirm-dialog">
        <div class="confirm-icon confirm-icon--update">
          <i class="material-symbols-outlined">content_copy</i>
        </div>
        <h4>建立副本</h4>
        <div v-if="pendingDuplicateConflict" class="confirm-warning-banner">
          <i class="material-symbols-outlined">info</i>
          你已經有一份來自「{{ pendingDuplicateSource.name }}」的技能了，建議修改顯示名稱以便區分。
        </div>
        <label class="dsd-note-label pdd-name-label">顯示名稱</label>
        <input
          v-model="pendingDuplicateName"
          class="custom-input pdd-name-input"
          placeholder="輸入顯示名稱"
          @keydown.enter="confirmPendingDuplicate"
        />
        <div class="confirm-actions">
          <button
            class="custom-btn custom-main-btn"
            :disabled="!pendingDuplicateName.trim()"
            @click="confirmPendingDuplicate"
          >
            <i class="material-symbols-outlined">check_circle</i>確認
          </button>
        </div>
      </div>
    </div>
  </Transition>
</Teleport>
```

`confirmPendingDuplicate()`：

```ts
function confirmPendingDuplicate() {
  if (!pendingDuplicateSource.value) return
  const copy = store.duplicateAsPersonalSkill(pendingDuplicateSource.value.id, pendingDuplicateName.value)
  cancelPendingDuplicate()
  editChoiceSkill.value = copy
  editChoiceIsFreshDuplicate.value = true
}
```

樣式：`.pdd-name-label`／`.pdd-name-input`（`src/scss/components/_SkillDetailDrawer.scss`，巢狀在 `.drawer-confirm-dialog` 內）補輸入框排版，沿用全域 `.custom-input` 的基礎樣式。

### 3. UI：統一「選擇修改方式」對話框（複製完成 + 個人技能編輯共用）

**狀態改名**（原本只服務複製流程，現在兩個入口共用）：

- `duplicatedSkill` → `editChoiceSkill: Skill | null`
- 新增 `editChoiceIsFreshDuplicate = ref(false)`

**對話框內容**（`src/views/SkillManagement.vue`，取代原本的「複製後：選擇修改方式」區塊）：

```html
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

**Handler 變動**：

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

**`handleEdit` 分流**（Library 技能維持原行為，個人技能改走新對話框）：

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

`SkillDetailDrawer.vue` 本身不需要改動——它一直都只是 `emit('edit', skill)`，分流判斷放在 `SkillManagement.vue` 這一層即可。

## 資料流（完整版）

```
點「複製」（Library 瀏覽 / 我的技能詳情）
  → handleDuplicate(skill)
    → pendingDuplicateSource = skill; pendingDuplicateName = skill.name
  → 彈出「建立副本」命名對話框（若 wouldSkillNameConflict(source.id) 為 true，顯示撞名提醒，不擋建立）
    → 點背景：cancelPendingDuplicate()（不建立）
    → 按「確認」：confirmPendingDuplicate()
      → store.duplicateAsPersonalSkill(source.id, name)   // personalStatus: 'draft'
      → editChoiceSkill = copy; editChoiceIsFreshDuplicate = true
  → 彈出「選擇修改方式」對話框（因為 personalStatus === 'draft'，顯示內容相同的警示 banner）
    → 「跟 Agent 對話修改」→ SkillEditChatModal → store.sendEditChatMessage()  // draft → available（內容真的變才轉換）
    → 「直接編輯」→ SkillEditor.vue → store.updateSkill()                     // draft → available（同上）

點「編輯」（個人技能，SkillDetailDrawer 內）
  → handleEdit(skill)
    → editChoiceSkill = skill; editChoiceIsFreshDuplicate = false
  → 彈出「選擇修改方式」對話框（只有 personalStatus === 'draft' 才顯示警示 banner）
    → 同上兩個選項

點「編輯」（Library 技能，SkillDetailDrawer header）
  → handleEdit(skill)
    → 直接 router.push('/view/SkillEditor', { skillId })（行為不變）
```

## 測試計畫

在 `src/stores/__tests__/skillStore.test.ts` 新增（已完成，供實作核對）：

1. `duplicateAsPersonalSkill(sourceId, '自訂名稱')` 建立的副本 `name` 為 `'自訂名稱'`，`skillName` 不受影響。
2. `duplicateAsPersonalSkill(sourceId, '   ')`（純空白）視為未輸入，`name` fallback 回來源技能的 `name`。
3. `wouldSkillNameConflict(sourceId)` 對已有同 lineage 副本的來源回傳 `true`，對沒有的回傳 `false`。

（`duplicateAsPersonalSkill(sourceId)` 不傳第二參數的既有測試維持原樣，不用新增。）

UI 層（命名對話框、統一後的選擇修改方式對話框、`handleEdit` 分流）沒有現成的 component test 基礎設施（沿用前一個 spec 的結論），改用型別檢查 + 手動驗證：

- 從 Library 瀏覽 / 我的技能點「複製」→ 確認先看到命名對話框，預設值正確、可修改、空白時「確認」按鈕 disabled、**沒有「取消」按鈕**。
- 對一個已經有其他個人副本的來源技能點「複製」→ 確認命名對話框顯示撞名提醒 banner。
- 建立後確認新副本的名稱是輸入的值，且「選擇修改方式」對話框正確顯示內容相同的警示 banner（因為是 draft）。
- 從既有個人技能（非 draft，例如已編輯過的）點「編輯」→ 確認彈出「選擇修改方式」對話框，且**不**顯示警示 banner，標題為「編輯技能」。
- 從既有個人技能（仍是 draft）點「編輯」→ 確認彈出對話框且**有**顯示警示 banner。
- 從 Library 技能點「編輯」→ 確認維持原本行為，直接進入 SkillEditor，不經過任何對話框。

## 風險與邊界情況

- `pendingDuplicateSource` 與 `editChoiceSkill` 是兩個獨立的 ref，理論上不會同時開啟（`confirmPendingDuplicate` 會先清空前者才設定後者），但兩個對話框都用 `Teleport to="body"` + 各自的 `v-if`，不會互相干擾。
- `handleEdit` 的分流判斷用 `skill.zone !== 'personal'`，跟 `SkillDetailDrawer.vue` 既有的 `isPersonal` computed 判斷邏輯一致（同樣以 `zone === 'personal'` 為準）。
- `wouldSkillNameConflict` 只是資訊性提醒，不會擋下「確認」按鈕——跟既有的 `hasSkillNameConflict`（編輯畫面的提示）是兩個獨立但語意一致的檢查，一個在建立前、一個在建立後，都只提醒不卡關。
